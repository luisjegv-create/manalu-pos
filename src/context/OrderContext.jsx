import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { printServiceTickets } from '../utils/printHelpers';
import { useInventory } from './InventoryContext';
import { useCustomers } from './CustomerContext';
import { useEvents } from './EventContext';

const OrderContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const { deductStockForOrder, incrementTicketNumber } = useInventory();
    const { recordSale } = useCustomers();
    const { reservations } = useEvents();

    const stripItem = (item) => {
        if (!item) return item;
        // Solo conservamos lo estrictamente necesario para la comanda y el ticket
        // Eliminamos la propiedad 'image' que es la que ocupa el 99% del espacio
        const { 
            id, name, price, category, quantity, uniqueId, 
            selectedModifiers, isModified, itemStatus, startTime, 
            isInvitation, isTip, isNote, timestamp, subcategory,
            allergens, quantitySet // Algunos metadatos pequeños son aceptables
        } = item;
        return { 
            id, name, price, category, quantity, uniqueId, 
            selectedModifiers, isModified, itemStatus, startTime, 
            isInvitation, isTip, isNote, timestamp, subcategory,
            allergens, quantitySet
        };
    };

    // Helper for safe parsing
    const safeParse = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            if (!saved) return fallback;
            return JSON.parse(saved);
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    // Helper for safe storage (prevent QuotaExceededError crashes)
    const safeSetItem = (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`Error saving ${key} to localStorage:`, e);
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                // Modified message to be more concise and useful
                alert(`⚠️ MEMORIA LLENA EN EL NAVEGADOR ⚠️\n\nEl sistema tiene demasiados datos temporales guardados.\n\nSOLUCIÓN:\n1. Ve a Configuración.\n2. Pulsa en "Limpiar Temporales y Caché".\n3. Las comandas actuales NO se perderán.`);
            }
        }
    };

    // Active orders (Drafts) - Keep in localStorage for low latency/offline safety during rush
    const [tableOrders, setTableOrders] = useState(() => safeParse('manalu_table_orders', {}));

    const [tableBills, setTableBills] = useState(() => safeParse('manalu_table_bills', {}));

    // Active Orders/Tickets state
    const [tables, setTables] = useState(() => {
        const parsed = safeParse('manalu_tables', []);
        const currentOrders = safeParse('manalu_table_orders', {});
        const currentBills = safeParse('manalu_table_bills', {});
        
        // Purge all old static 'free' tables, keeping only occupied ones (active tickets)
        const activeTickets = parsed.filter(t => t.status !== 'free' || currentOrders[t.id] || currentBills[t.id]);
        safeSetItem('manalu_tables', JSON.stringify(activeTickets));
        return activeTickets;
    });

    // Cloud Synchronized States
    const [kitchenOrders, setKitchenOrders] = useState([]);
    const [salesHistory, setSalesHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('manalu_sales_history_local');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map(s => ({ ...s, date: new Date(s.date) }));
            }
        } catch (e) {
            console.error("Error loading local sales history:", e);
        }
        return [];
    });
    const [cashCloses, setCashCloses] = useState([]);
    const [serviceRequests, setServiceRequests] = useState([]);

    // Local Loader state
    const [isLoading, setLoadingState] = useState(false);
    const [activeQrAlert, setActiveQrAlert] = useState(null);
    const [syncStatus, setSyncStatus] = useState({
        sales: { count: 0, error: null },
        kitchen: { count: 0, error: null },
        closes: { count: 0, error: null },
        totalSales: 0,
        lastSync: null,
        isSyncing: false,
        progress: 0,
        totalSteps: 7
    });

    const syncWithCloud = async () => {
        if (syncStatus.isSyncing) return;
        setLoadingState(true);
        setSyncStatus(prev => ({ ...prev, isSyncing: true, progress: 0, totalSteps: 7 }));
        
        try {
            // 1. Fetch Sales in Chunks (Last 7 Days)
            let allCloudSales = [];
            let syncError = null;

            for (let i = 0; i < 7; i++) {
                setSyncStatus(prev => ({ ...prev, progress: i + 1 }));
                
                const start = new Date();
                start.setDate(start.getDate() - i);
                start.setHours(0, 0, 0, 0);
                
                const end = new Date();
                end.setDate(end.getDate() - i + 1);
                end.setHours(0, 0, 0, 0);

                const { data: dayData, error: dayError } = await supabase
                    .from('sales')
                    .select('id, created_at, total, total_amount, items, payment_method, table_id, ticket_number, discount_amount, is_invitation')
                    .gte('created_at', start.toISOString())
                    .lt('created_at', end.toISOString())
                    .order('created_at', { ascending: false });

                if (dayError) {
                    console.error(`Error syncing day ${i}:`, dayError);
                    syncError = dayError.message;
                    // Don't break, try next day
                } else if (dayData && dayData.length > 0) {
                    const mapped = dayData.map(s => ({
                        ...s,
                        date: new Date(s.created_at),
                        total: parseFloat(s.total || s.total_amount || 0),
                        items: typeof s.items === 'string' ? (s.items.startsWith('[') ? JSON.parse(s.items) : []) : (s.items || []),
                        paymentMethod: s.payment_method || s.paymentMethod || 'Efectivo',
                        tableId: s.table_id || s.tableId
                    }));
                    allCloudSales = [...allCloudSales, ...mapped];
                }
            }

            // Sync result
            if (allCloudSales.length > 0) {
                setSalesHistory(prev => {
                    // Merge cloud with local, avoiding duplicates by ID
                    const localIds = new Set(prev.map(s => s.id));
                    const newFromCloud = allCloudSales.filter(s => !localIds.has(s.id));
                    const updated = [...newFromCloud, ...prev].sort((a, b) => b.date - a.date).slice(0, 500);
                    
                    // Persist to local storage
                    safeSetItem('manalu_sales_history_local', JSON.stringify(updated));
                    return updated;
                });
            }
            
            setSyncStatus(prev => ({ 
                ...prev, 
                sales: { count: allCloudSales.length, error: syncError }, 
                totalSales: allCloudSales.length,
                lastSync: new Date().toISOString()
            }));

            // 2. Fetch Kitchen Orders (Last 24 Hours only to avoid stale data)
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

            const { data: kitchenData, error: kitchenError } = await supabase.from('kitchen_orders')
                .select('*')
                .or('status.eq.pending,status.eq.ready')
                .gte('created_at', twentyFourHoursAgo.toISOString())
                .order('created_at', { ascending: true });
            if (kitchenError) {
                setSyncStatus(prev => ({ ...prev, kitchen: { count: 0, error: kitchenError.message } }));
            } else if (kitchenData) {
                const mappedKitchen = kitchenData.map(o => ({
                    ...o,
                    items: typeof o.items === 'string' ? (o.items.startsWith('[') ? JSON.parse(o.items) : []) : (o.items || []),
                    timestamp: new Date(o.created_at),
                    table: o.table_name,
                    customer: typeof o.customer_info === 'string' ? (o.customer_info.startsWith('{') ? JSON.parse(o.customer_info) : null) : o.customer_info
                }));
                setKitchenOrders(mappedKitchen);
                setSyncStatus(prev => ({ ...prev, kitchen: { count: mappedKitchen.length, error: null } }));
            }

            // 3. Fetch Cash Closes
            const { data: closeData, error: closeError } = await supabase.from('cash_closes').select('*').order('created_at', { ascending: false }).limit(50);
            if (closeError) {
                setSyncStatus(prev => ({ ...prev, closes: { count: 0, error: closeError.message } }));
            } else if (closeData) {
                const mappedCloses = closeData.map(c => ({
                    ...c,
                    id: c.id,
                    date: new Date(c.created_at),
                    total: c.total_ventas,
                    salesCount: c.sales_count
                }));
                setCashCloses(mappedCloses);
                setSyncStatus(prev => ({ ...prev, closes: { count: mappedCloses.length, error: null } }));
            }

            // 4. Fetch Service Requests
            const { data: requestData } = await supabase.from('service_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            if (requestData) {
                const validRequests = [];
                for (const req of requestData) {
                    if (req.type === 'new_order' && req.payload) {
                        try {
                            const cartItems = typeof req.payload === 'string' ? JSON.parse(req.payload) : req.payload;

                            // We update tableBills for the POS
                            setTableBills(prev => {
                                const currentBill = prev[req.table_id] || [];
                                const newBill = [...currentBill];
                                cartItems.forEach(newItem => {
                                    const cleanItem = stripItem(newItem);
                                    const existingInBill = newBill.find(b => b.id === cleanItem.id && !b.isModified && !cleanItem.isModified);
                                    if (existingInBill) {
                                        existingInBill.quantity += cleanItem.quantity;
                                    } else {
                                        newBill.push(cleanItem);
                                    }
                                });
                                return { ...prev, [req.table_id]: newBill };
                            });
                            // Mark table as occupied
                            setTables(prev => prev.map(t =>
                                String(t.id) === String(req.table_id)
                                    ? { ...t, status: 'occupied', lastActionAt: new Date().toISOString() }
                                    : t
                            ));

                            await supabase.from('service_requests').update({ status: 'cleared' }).eq('id', req.id).eq('status', 'pending');
                        } catch (err) {
                            console.error("Error processing auto-order payload:", err);
                            validRequests.push(req);
                        }
                    } else {
                        validRequests.push(req);
                    }
                }
                setServiceRequests(validRequests);
            }
            setSyncStatus(prev => ({ ...prev, lastSync: new Date().toISOString() }));
        } catch (err) {
            console.error("Error crítico de sincronización:", err);
        } finally {
            setLoadingState(false);
            setSyncStatus(prev => ({ ...prev, isSyncing: false }));
        }
    };

    useEffect(() => {
        syncWithCloud();

        // 5. Setup Cross-Tab Synchronization
        const handleStorageChange = (e) => {
            if (e.key === 'manalu_table_bills' && e.newValue) {
                try {
                    const nextBills = JSON.parse(e.newValue);
                    setTableBills(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(nextBills)) return prev;
                        return nextBills;
                    });
                } catch (err) {
                    console.error("Error syncing tableBills from storage:", err);
                }
            }
            if (e.key === 'manalu_tables' && e.newValue) {
                try {
                    const nextTables = JSON.parse(e.newValue);
                    setTables(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(nextTables)) return prev;
                        return nextTables;
                    });
                } catch (err) {
                    console.error("Error syncing tables from storage:", err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Realtime subscriptions
        const kitchenSubscription = supabase
            .channel('kitchen-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_orders' }, () => {
                syncWithCloud();
            })
            .subscribe();

        const salesSubscription = supabase
            .channel('sales-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, (payload) => {
                const newSale = {
                    ...payload.new,
                    date: new Date(payload.new.created_at),
                    total: parseFloat(payload.new.total || payload.new.total_amount || 0),
                    items: typeof payload.new.items === 'string' ? (payload.new.items.startsWith('[') ? JSON.parse(payload.new.items) : []) : (payload.new.items || []),
                    paymentMethod: payload.new.payment_method || payload.new.paymentMethod || 'Efectivo',
                    tableId: payload.new.table_id || payload.new.tableId
                };
                setSalesHistory(prev => [newSale, ...prev]);
            })
            .subscribe();

        const serviceSubscription = supabase
            .channel('service-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_requests' }, (payload) => {
                 syncWithCloud();
            })
            .subscribe();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            supabase.removeChannel(kitchenSubscription);
            supabase.removeChannel(salesSubscription);
            supabase.removeChannel(serviceSubscription);
        };
    }, []);

    // --- ONE-TIME CLEANUP FOR LOCALSTORAGE (REMOVE IMAGES FROM ORDERS) ---
    useEffect(() => {
        const cleanupOldOrders = () => {
            let modified = false;
            
            // Cleanup tableOrders
            const currentOrders = safeParse('manalu_table_orders', {});
            const newOrders = {};
            Object.keys(currentOrders).forEach(tableId => {
                newOrders[tableId] = currentOrders[tableId].map(item => {
                    if (item.image) {
                        modified = true;
                        return stripItem(item);
                    }
                    return item;
                });
            });
            if (modified) setTableOrders(newOrders);

            // Cleanup tableBills
            const currentBills = safeParse('manalu_table_bills', {});
            const newBills = {};
            let billsModified = false;
            Object.keys(currentBills).forEach(tableId => {
                newBills[tableId] = currentBills[tableId].map(item => {
                    if (item.image) {
                        billsModified = true;
                        return stripItem(item);
                    }
                    return item;
                });
            });
            if (billsModified) {
                setTableBills(newBills);
                modified = true;
            }

            if (modified) console.log("🧹 Mantenimiento de almacenamiento: Imágenes eliminadas de comandas activas.");
        };

        // Run after a short delay to ensure initial state is loaded
        const timer = setTimeout(cleanupOldOrders, 2000);
        return () => clearTimeout(timer);
    }, []);

    // --- AUTO-BACKUP SYSTEM ---
    useEffect(() => {
        const autoBackup = () => {
            const hasData = tables.length > 0 || Object.keys(tableOrders).length > 0 || Object.keys(tableBills).length > 0;
            if (!hasData) return;

            const snapshot = {
                tables,
                tableOrders,
                tableBills,
                timestamp: new Date().toISOString()
            };
            // Local snapshot (Level 1) - DISABLED to save localStorage space, 
            // the individual table_orders and table_bills keys are already persistent.
            // localStorage.setItem('manalu_last_good_state', JSON.stringify(snapshot));
            
            // Cloud mirror (Level 2) - Only every 5 minutes to avoid spamming
            const lastCloudBackup = localStorage.getItem('manalu_last_cloud_backup');
            const now = new Date();
            if (!lastCloudBackup || (now - new Date(lastCloudBackup)) > 300000) {
                supabase.from('service_requests').insert([{
                    table_id: 'SYSTEM',
                    table_name: 'AUTO_MIRROR',
                    type: 'system_backup',
                    payload: JSON.stringify(snapshot),
                    status: 'pending'
                }]).then(() => {
                    localStorage.setItem('manalu_last_cloud_backup', now.toISOString());
                });
            }
        };

        const timer = setTimeout(autoBackup, 5000); // Wait 5s after any change to stabilize
        return () => clearTimeout(timer);
    }, [tables, tableOrders, tableBills]);

    // Persistence Effects for local-only state (Drafts)
    useEffect(() => {
        safeSetItem('manalu_tables', JSON.stringify(tables));
    }, [tables]);

    useEffect(() => {
        safeSetItem('manalu_table_orders', JSON.stringify(tableOrders));
    }, [tableOrders]);

    useEffect(() => {
        safeSetItem('manalu_table_bills', JSON.stringify(tableBills));
    }, [tableBills]);

    const [currentTable, setCurrentTable] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const order = currentTable ? (tableOrders[currentTable.id] || []) : [];
    const bill = currentTable ? (tableBills[currentTable.id] || []) : [];

    const selectTable = (table) => {
        setCurrentTable(table);
    };

    const addToOrder = (product) => {
        if (!currentTable) return;
        const tableId = currentTable.id;

        setTableOrders(prev => {
            const currentTableOrder = prev[tableId] || [];

            if (product.selectedModifiers && Object.keys(product.selectedModifiers).length > 0) {
                const newItem = {
                    ...product,
                    quantity: 1,
                    uniqueId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    isModified: true
                };
                return { ...prev, [tableId]: [...currentTableOrder, newItem] };
            }

            const cleanProduct = stripItem(product);
            const existingItem = currentTableOrder.find(item => item.id === cleanProduct.id && !item.isModified);
            let nextOrder;
            if (existingItem) {
                nextOrder = currentTableOrder.map(item =>
                    (item.id === cleanProduct.id && !item.isModified)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                nextOrder = [...currentTableOrder, { ...cleanProduct, quantity: 1, uniqueId: `${cleanProduct.id}-${Date.now()}` }];
            }
            return { ...prev, [tableId]: nextOrder };
        });

        if (currentTable.status === 'free') {
            updateTableStatus(tableId, 'occupied');
        }
    };

    const removeFromOrder = (uniqueId) => {
        if (!currentTable) return;
        setTableOrders(prev => ({
            ...prev,
            [currentTable.id]: (prev[currentTable.id] || []).filter(item => item.uniqueId !== uniqueId)
        }));
    };

    const updateQuantity = (uniqueId, delta) => {
        if (!currentTable) return;
        setTableOrders(prev => {
            const currentOrder = (prev[currentTable.id] || []).map(item => {
                if (item.uniqueId === uniqueId) {
                    const newQuantity = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(item => item.quantity > 0);
            return { ...prev, [currentTable.id]: currentOrder };
        });
    };

    const clearOrder = () => {
        if (!currentTable) return;
        setTableOrders(prev => {
            const next = { ...prev };
            delete next[currentTable.id];
            return next;
        });
    };

    const updateTableStatus = (tableId, status) => {
        // En el nuevo sistema, si un ticket queda "libre", lo destruimos para limpiar pantalla
        if (status === 'free') {
            deleteTable(tableId);
        } else {
            setTables(prev => prev.map(t =>
                t.id === tableId
                    ? { ...t, status, lastActionAt: status === 'occupied' ? new Date().toISOString() : t.lastActionAt }
                    : t
            ));
        }
    };

    const sendToKitchen = async () => {
        if (!currentTable || order.length === 0) return;

        try {
            deductStockForOrder(order);
        } catch (e) {
            console.error("Error deducting stock:", e);
        }

        try {
            if (selectedCustomer) {
                recordSale(selectedCustomer.id, calculateOrderTotal(order), order);
            }
        } catch (e) {
            console.error("Error recording sale for customer:", e);
        }

        // Filter items for kitchen: exclude drinks and wines
        const kitchenItems = order
            .filter(item => item.category !== 'bebidas' && item.category !== 'vinos')
            .map(item => ({
                ...item,
                itemStatus: 'pending', // Individual item tracking
                startTime: new Date().toISOString()
            }));

        if (kitchenItems.length > 0) {
            // Save to Supabase (KDS)
            try {
                const { data, error } = await supabase.from('kitchen_orders').insert([{
                    table_name: currentTable.name,
                    items: JSON.stringify(kitchenItems),
                    customer_info: selectedCustomer ? JSON.stringify(selectedCustomer) : null,
                    status: 'pending'
                }]).select();

                if (!error && data) {
                    const newKo = {
                        ...data[0],
                        items: kitchenItems,
                        timestamp: new Date(data[0].created_at),
                        table: data[0].table_name,
                        customer: selectedCustomer
                    };
                    setKitchenOrders(prev => [...prev, newKo]);
                }
            } catch (err) {
                console.error("Error sending to kitchen:", err);
            }
        }

        try {
            // Always update bill and clear order (even if only drinks/wines)
            setTableBills(prev => {
                const currentBill = prev[currentTable.id] || [];
                const newBill = [...currentBill];
                order.forEach(newItem => {
                    const cleanItem = stripItem(newItem);
                    const existingInBill = newBill.find(b => b.id === cleanItem.id && !b.isModified && !cleanItem.isModified);
                    if (existingInBill) {
                        existingInBill.quantity += cleanItem.quantity;
                    } else {
                        newBill.push(cleanItem);
                    }
                });
                return { ...prev, [currentTable.id]: newBill };
            });
            clearOrder();
            setSelectedCustomer(null);
        } catch (e) {
            console.error("Error updating table bills:", e);
        }

        // Update table activity
        setTables(prev => prev.map(t =>
            t.id === currentTable.id
                ? { ...t, lastActionAt: new Date().toISOString() }
                : t
        ));
    };

    const closeTable = async (tableId, paymentMethod = 'Efectivo', discountPercent = 0, isInvitation = false, customerData = null, tips = 0) => {
        const finalBill = tableBills[tableId];
        const cardTips = parseFloat(tips) || 0;

        if (finalBill && finalBill.length > 0) {
            try {
                const billTotal = calculateOrderTotal(finalBill);
                const discountAmount = (billTotal * discountPercent) / 100;
                const total = isInvitation ? 0 : Math.max(0, billTotal - discountAmount);

                // Assign sequential ticket number
                const ticketNumber = await incrementTicketNumber();

                // Build sale record
                const saleRecord = {
                    total,
                    payment_method: paymentMethod,
                    items: JSON.stringify(finalBill),
                    table_id: tableId,
                    ticket_number: ticketNumber,
                    customer_info: customerData ? JSON.stringify(customerData) : null,
                    card_tips: cardTips // Attempt to use column
                };

                // Save to Supabase
                let { data, error } = await supabase.from('sales').insert([saleRecord]).select();

                // Fallback for missing columns (card_tips or customer_info)
                if (error && (error.message.includes('card_tips') || error.message.includes('customer_info') || error.message.includes('ticket_number')) && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
                    console.log("Fallback: missing column detected, retrying...");
                    const fallbackBill = [...finalBill];
                    if (cardTips > 0) {
                        fallbackBill.push({ id: 'tip-record', name: 'Propina', quantity: 1, price: cardTips, isTip: true });
                    }
                    if (customerData) {
                        fallbackBill.push({ id: 'customer-record', name: `Cliente: ${customerData.name || customerData.phone || 'Genérico'}`, quantity: 1, price: 0, isNote: true });
                    }
                    const retryRecord = { ...saleRecord, items: JSON.stringify(fallbackBill) };
                    delete retryRecord.card_tips;
                    delete retryRecord.customer_info;
                    delete retryRecord.ticket_number;
                    const { data: retryData, error: retryError } = await supabase.from('sales').insert([retryRecord]).select();
                    data = retryData;
                    error = retryError;
                }

                if (error) {
                    console.error("DEBUG - closeTable Supabase Error:", error);
                    throw new Error(`Error en base de datos: ${error.message}`);
                }

                if (data && data.length > 0) {
                    const newSale = {
                        ...data[0],
                        date: new Date(data[0].created_at),
                        total: parseFloat(data[0].total),
                        items: JSON.parse(data[0].items),
                        paymentMethod: data[0].payment_method,
                        tableId: data[0].table_id,
                        ticket_number: data[0].ticket_number || ticketNumber,
                        card_tips: parseFloat(data[0].card_tips) || cardTips 
                    };
                    
                    setSalesHistory(prev => {
                        const updated = [newSale, ...prev].slice(0, 500);
                        safeSetItem('manalu_sales_history_local', JSON.stringify(updated));
                        return updated;
                    });

                    // Update customer loyalty if applicable
                    if (customerData && customerData.id) {
                        recordSale(customerData.id, total);
                    }

                    // Clear table / Destroy Ticket
                    setTableOrders(prev => {
                        const next = { ...prev };
                        delete next[tableId];
                        return next;
                    });
                    setTableBills(prev => {
                        const next = { ...prev };
                        delete next[tableId];
                        return next;
                    });
                    setTables(prev => prev.filter(t => t.id !== tableId));
                    if (currentTable && currentTable.id === tableId) {
                        setCurrentTable(null);
                    }
                    
                    // NEW: Cleanup any left-over kitchen orders in local state for this table so it doesn't appear occupied
                    const tableObj = tables.find(t => t.id === tableId);
                    if (tableObj) {
                        setKitchenOrders(prev => prev.filter(ko => ko.table !== tableObj.name));
                        // Mark all kitchen orders for this table as completed in DB
                        try {
                            await supabase.from('kitchen_orders')
                                .update({ status: 'completed' })
                                .eq('table_name', tableObj.name)
                                .neq('status', 'completed');
                        } catch (e) {
                            console.error("Error clearing kitchen orders on closeTable:", e);
                        }
                    }

                    return newSale;
                }
            } catch (err) {
                console.error("DEBUG - closeTable Failure:", err);
                alert(`⚠️ Error al cerrar la mesa:\n${err.message}`);
                return null;
            }
        }

        // Cleanup if bill was empty
        updateTableStatus(tableId, 'free');
        const tableObj = tables.find(t => t.id === tableId);
        if (tableObj) {
            setKitchenOrders(prev => prev.filter(ko => ko.table !== tableObj.name));
            supabase.from('kitchen_orders')
                .update({ status: 'completed' })
                .eq('table_name', tableObj.name)
                .neq('status', 'completed')
                .then();
        }
        
        if (currentTable && currentTable.id === tableId) {
            setCurrentTable(null);
        }
        return null;
    };

    const forceClearTable = (tableId) => {
        setTableOrders(prev => {
            const next = { ...prev };
            delete next[tableId];
            return next;
        });
        setTableBills(prev => {
            const next = { ...prev };
            delete next[tableId];
            return next;
        });

        const tableObj = tables.find(t => t.id === tableId);
        
        // Destruir ticket completamente
        setTables(prev => prev.filter(t => t.id !== tableId && t.linkedTo !== tableId));

        if (tableObj) {
            setKitchenOrders(prev => prev.filter(ko => ko.table !== tableObj.name));
            supabase.from('kitchen_orders')
                .update({ status: 'completed' })
                .eq('table_name', tableObj.name)
                .neq('status', 'completed')
                .then();
        }

        if (currentTable && currentTable.id === tableId) {
            setCurrentTable(null);
        }
    };

    const payPartialTable = async (tableId, partialItems, paymentMethod = 'Efectivo', tips = 0) => {
        const cardTips = parseFloat(tips) || 0;
        if (!partialItems || partialItems.length === 0) return null;

        try {
            const total = calculateOrderTotal(partialItems);

            // Assign sequential ticket number
            const ticketNumber = await incrementTicketNumber();

            // Build sale record
            const saleRecord = {
                total,
                payment_method: paymentMethod,
                items: JSON.stringify(partialItems),
                table_id: tableId,
                ticket_number: ticketNumber,
                card_tips: cardTips
            };

            // Save to Supabase
            let { data, error } = await supabase.from('sales').insert([saleRecord]).select();

            // Fallback for missing columns
            if (error && (error.message.includes('card_tips') || error.message.includes('customer_info') || error.message.includes('ticket_number')) && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
                const fallbackBill = [...partialItems];
                if (cardTips > 0) {
                    fallbackBill.push({ id: 'tip-record', name: 'Propina', quantity: 1, price: cardTips, isTip: true });
                }
                const retryRecord = { ...saleRecord, items: JSON.stringify(fallbackBill) };
                delete retryRecord.card_tips;
                delete retryRecord.customer_info;
                delete retryRecord.ticket_number;
                const { data: retryData, error: retryError } = await supabase.from('sales').insert([retryRecord]).select();
                data = retryData;
                error = retryError;
            }

            if (error) {
                console.error("DEBUG - payPartialTable Supabase Error:", error);
                throw new Error(`Error en base de datos: ${error.message}`);
            }

            if (data && data.length > 0) {
                const newSale = {
                    ...data[0],
                    date: new Date(data[0].created_at),
                    total: parseFloat(data[0].total),
                    items: JSON.parse(data[0].items),
                    paymentMethod: data[0].payment_method,
                    tableId: data[0].table_id,
                    ticket_number: data[0].ticket_number || ticketNumber
                };
                setSalesHistory(prev => [newSale, ...prev]);

                // No customer loyality update for partial payments at this time

                // Update bill: deduct paid quantities
                setTableBills(prev => {
                    const currentBill = prev[tableId] || [];
                    const nextBill = currentBill.map(item => {
                        const paidItem = partialItems.find(p => p.uniqueId === item.uniqueId);
                        if (paidItem) {
                            return { ...item, quantity: item.quantity - paidItem.quantity };
                        }
                        return item;
                    }).filter(item => item.quantity > 0);

                    if (nextBill.length === 0) {
                        updateTableStatus(tableId, 'free');
                        if (currentTable && currentTable.id === tableId) setCurrentTable(null);
                        const next = { ...prev };
                        delete next[tableId];
                        return next;
                    }
                    return { ...prev, [tableId]: nextBill };
                });
                return newSale;
            }
        } catch (err) {
            console.error("DEBUG - payPartialTable Failure:", err);
            alert(`⚠️ Error al cobrar:\n${err.message}`);
            return null;
        }
        return null;
    };

    const payValuePartialTable = async (tableId, amount, paymentMethod = 'Efectivo', discountPercent = 0, isInvitation = false, customerData = null) => {
        if (amount <= 0) return null;

        try {
            const ticketNumber = await incrementTicketNumber();
            const itemsToPay = [{
                id: 'partial-payment',
                uniqueId: `partial-${Date.now()}`,
                name: 'PAGO PARCIAL (A CUENTA)',
                price: amount,
                quantity: 1
            }];

            const discountAmount = isInvitation ? amount : (amount * discountPercent / 100);
            const finalToPay = Math.max(0, amount - discountAmount);

            let { data, error } = await supabase.from('sales').insert([{
                total: finalToPay,
                payment_method: paymentMethod,
                items: JSON.stringify(itemsToPay),
                table_id: tableId,
                ticket_number: ticketNumber,
                customer_info: customerData ? JSON.stringify(customerData) : null
            }]).select();

            // Fallback for missing columns
            if (error && (error.message.includes('card_tips') || error.message.includes('customer_info') || error.message.includes('ticket_number')) && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
                const fallbackBill = [...itemsToPay];
                if (customerData) {
                    fallbackBill.push({ id: 'customer-record', name: `Cliente: ${customerData.name || customerData.phone || 'Genérico'}`, quantity: 1, price: 0, isNote: true });
                }
                const retryRecord = {
                    total: finalToPay,
                    payment_method: paymentMethod,
                    items: JSON.stringify(fallbackBill),
                    table_id: tableId,
                    ticket_number: ticketNumber
                };
                delete retryRecord.card_tips;
                delete retryRecord.customer_info;
                delete retryRecord.ticket_number;
                const { data: retryData, error: retryError } = await supabase.from('sales').insert([retryRecord]).select();
                data = retryData;
                error = retryError;
            }

            if (error) {
                console.error("DEBUG - payValuePartialTable Supabase Error:", error);
                throw new Error(`Error en base de datos: ${error.message}`);
            }

            if (data && data.length > 0) {
                const newSale = {
                    ...data[0],
                    date: new Date(data[0].created_at),
                    total: parseFloat(data[0].total),
                    items: JSON.parse(data[0].items),
                    paymentMethod: data[0].payment_method,
                    tableId: data[0].table_id,
                    ticket_number: data[0].ticket_number || ticketNumber
                };
                setSalesHistory(prev => [newSale, ...prev]);

                // Update customer loyalty if applicable
                if (customerData && customerData.id) {
                    recordSale(customerData.id, finalToPay);
                }

                // Update bill: represent this as a negative item to reduce the total
                setTableBills(prev => {
                    const currentBill = prev[tableId] || [];
                    const creditItem = {
                        id: 'payment-credit',
                        uniqueId: `credit-${Date.now()}`,
                        name: `ABONO PAGO ${paymentMethod}`,
                        price: -amount,
                        quantity: 1,
                        category: 'Pagos'
                    };

                    const nextBill = [...currentBill, creditItem];

                    // If total reaches 0 or less, close the table
                    const totalRemaining = nextBill.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                    if (totalRemaining <= 0.01) {
                        updateTableStatus(tableId, 'free');
                        if (currentTable && currentTable.id === tableId) setCurrentTable(null);
                        const next = { ...prev };
                        delete next[tableId];
                        return next;
                    }
                    return { ...prev, [tableId]: nextBill };
                });
                return newSale;
            }
        } catch (err) {
            console.error("DEBUG - payValuePartialTable Failure:", err);
            alert(`⚠️ Error al cobrar pago parcial:\n${err.message}`);
            return null;
        }
        return null;
    };
    const { returnStockForItems } = useInventory(); // Ensure it's available

    const updateBillQuantity = (tableId, uniqueId, delta) => {
        setTableBills(prev => {
            const currentBill = prev[tableId] || [];
            const item = currentBill.find(i => i.uniqueId === uniqueId);

            if (!item) return prev;

            const newQuantity = item.quantity + delta;

            if (newQuantity <= 0) {
                // Return stock for the remaining quantity
                returnStockForItems([{ ...item, quantity: item.quantity }]);
                
                const nextBill = currentBill.filter(i => i.uniqueId !== uniqueId);
                if (nextBill.length === 0 && (!tableOrders[tableId] || tableOrders[tableId].length === 0)) {
                    updateTableStatus(tableId, 'free');
                }
                return { ...prev, [tableId]: nextBill };
            } else {
                // Update stock based on delta
                if (delta > 0) {
                    deductStockForOrder([{ ...item, quantity: delta }]);
                } else if (delta < 0) {
                    returnStockForItems([{ ...item, quantity: Math.abs(delta) }]);
                }

                const nextBill = currentBill.map(i =>
                    i.uniqueId === uniqueId ? { ...i, quantity: newQuantity } : i
                );
                return { ...prev, [tableId]: nextBill };
            }
        });
    };

    const removeProductFromBill = (tableId, uniqueId, quantityToRemove) => {
        updateBillQuantity(tableId, uniqueId, -quantityToRemove);
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
    };

    const markOrderReady = async (orderId) => {
        try {
            const { error } = await supabase.from('kitchen_orders').update({ status: 'ready' }).eq('id', orderId);
            if (error) throw error;

            setKitchenOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: 'ready', items: (o.items || []).map(i => ({ ...i, itemStatus: 'ready' })) } : o
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const updateKitchenItemStatus = async (orderId, itemUniqueId, newStatus) => {
        try {
            const orderIndex = kitchenOrders.findIndex(o => o.id === orderId);
            if (orderIndex === -1) return;

            const targetOrder = kitchenOrders[orderIndex];
            const updatedItems = targetOrder.items.map(item =>
                item.uniqueId === itemUniqueId ? { ...item, itemStatus: newStatus } : item
            );

            // Check if all items are ready
            const allItemsReady = updatedItems.every(item => item.itemStatus === 'ready');
            const newOrderStatus = allItemsReady ? 'ready' : targetOrder.status;

            const { error } = await supabase.from('kitchen_orders').update({
                items: JSON.stringify(updatedItems),
                status: newOrderStatus
            }).eq('id', orderId);

            if (error) throw error;

            setKitchenOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, items: updatedItems, status: newOrderStatus } : o
            ));
        } catch (err) {
            console.error("Error updating kitchen item status:", err);
        }
    };

    const removeOrder = async (orderId) => {
        try {
            const { error } = await supabase.from('kitchen_orders').update({ status: 'archived' }).eq('id', orderId);
            if (error) throw error;
            setKitchenOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (err) {
            console.error(err);
        }
    };

    const updateItemNote = (uniqueId, note) => {
        if (!currentTable) return;
        setTableOrders(prev => {
            const currentOrder = prev[currentTable.id] || [];
            const nextOrder = currentOrder.map(item =>
                item.uniqueId === uniqueId ? { ...item, notes: note } : item
            );
            return { ...prev, [currentTable.id]: nextOrder };
        });
    };

    const toggleItemPriority = (uniqueId) => {
        if (!currentTable) return;
        setTableOrders(prev => {
            const currentOrder = prev[currentTable.id] || [];
            const nextOrder = currentOrder.map(item =>
                item.uniqueId === uniqueId ? { ...item, isPriority: !item.isPriority } : item
            );
            return { ...prev, [currentTable.id]: nextOrder };
        });
    };

    const toggleItemToShare = (uniqueId) => {
        if (!currentTable) return;
        setTableOrders(prev => {
            const currentOrder = prev[currentTable.id] || [];
            const nextOrder = currentOrder.map(item =>
                item.uniqueId === uniqueId ? { ...item, isShared: !item.isShared, isIndividual: false } : item
            );
            return { ...prev, [currentTable.id]: nextOrder };
        });
    };

    const toggleItemIndividual = (uniqueId) => {
        if (!currentTable) return;
        setTableOrders(prev => {
            const currentOrder = prev[currentTable.id] || [];
            const nextOrder = currentOrder.map(item =>
                item.uniqueId === uniqueId ? { ...item, isIndividual: !item.isIndividual, isShared: false } : item
            );
            return { ...prev, [currentTable.id]: nextOrder };
        });
    };

    const toggleItemInvitation = (uniqueId) => {
        if (!currentTable) return;
        setTableOrders(prev => {
            const currentOrder = prev[currentTable.id] || [];
            const nextOrder = currentOrder.map(item =>
                item.uniqueId === uniqueId ? { ...item, isInvitation: !item.isInvitation } : item
            );
            return { ...prev, [currentTable.id]: nextOrder };
        });
    };

    const toggleItemInvitationInBill = (uniqueId) => {
        if (!currentTable) return;
        setTableBills(prev => {
            const currentBill = prev[currentTable.id] || [];
            const nextBill = currentBill.map(item =>
                item.uniqueId === uniqueId ? { ...item, isInvitation: !item.isInvitation } : item
            );
            return { ...prev, [currentTable.id]: nextBill };
        });
    };

    const calculateOrderTotal = (items) => {
        return items.reduce((total, item) => total + (item.isInvitation ? 0 : (item.price * item.quantity)), 0);
    };

    const addTable = (zoneId, name) => {
        const newTable = {
            id: `ticket-${Date.now()}`,
            name: name || `Pedido ${tables.length + 1}`,
            zone: 'pedidos',
            status: 'occupied', // directly start as occupied/active
            seats: 1
        };
        setTables(prev => [...prev, newTable]);
        return newTable;
    };

    const deleteTable = (tableId) => {
        setTables(prev => prev.filter(t => t.id !== tableId));
        // Cleanup associated data
        setTableOrders(prev => {
            const next = { ...prev };
            delete next[tableId];
            return next;
        });
    };

    const performCashClose = async (totals) => {
        try {
            console.log("DEBUG - performCashClose starting with:", totals);
            const closeRecord = {
                total_efectivo: parseFloat(totals.efectivo || 0),
                total_tarjeta: parseFloat(totals.tarjeta || 0),
                total_ventas: parseFloat(totals.total || 0),
                sales_count: parseInt(totals.salesCount || 0),
                notes: totals.notes || '',
                fondo_caja: parseFloat(totals.fondo_caja || 0)
            };

            let { data, error } = await supabase.from('cash_closes').insert([closeRecord]).select();

            // Fallback for missing columns (fondo_caja or sales_count)
            if (error && (error.message.includes('fondo_caja') || error.message.includes('sales_count')) && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
                console.warn("Fallback: missing column in cash_closes table, retrying without new columns...");
                const retryRecord = { 
                    total_efectivo: closeRecord.total_efectivo,
                    total_tarjeta: closeRecord.total_tarjeta,
                    total_ventas: closeRecord.total_ventas,
                    notes: closeRecord.notes + (totals.fondo_caja ? ` | Fondo: ${totals.fondo_caja}€` : '')
                };
                const { data: retryData, error: retryError } = await supabase.from('cash_closes').insert([retryRecord]).select();
                data = retryData;
                error = retryError;
            }

            if (error) {
                console.error("DEBUG - performCashClose Supabase Error:", error);
                throw error;
            }

            if (data && data.length > 0) {
                const newClose = {
                    ...data[0],
                    date: new Date(data[0].created_at),
                    efectivo: data[0].total_efectivo,
                    tarjeta: data[0].total_tarjeta,
                    total: data[0].total_ventas,
                    salesCount: data[0].sales_count || totals.salesCount,
                    fondo_caja: data[0].fondo_caja || totals.fondo_caja
                };
                setCashCloses(prev => [newClose, ...prev]);
                return newClose;
            }
        } catch (err) {
            console.error("DEBUG - performCashClose Failure:", err);
            // Return error object for UI feedback
            return { error: err.message || "Error desconocido al guardar el cierre" };
        }
        return null;
    };

    const deleteCashClose = async (closeId) => {
        if (!confirm("⚠️ ¿Estás seguro de que quieres borrar este registro de cierre? Esto NO borrará las ventas, solo permitirá que los datos vuelvan a aparecer en los reportes del día.")) return false;
        try {
            const { error } = await supabase.from('cash_closes').delete().eq('id', closeId);
            if (error) throw error;
            setCashCloses(prev => prev.filter(c => c.id !== closeId));
            return true;
        } catch (err) {
            console.error("Error deleting cash close:", err);
            return false;
        }
    };

    const deleteSale = async (saleId) => {
        try {
            const { error } = await supabase.from('sales').delete().eq('id', saleId);
            if (error) throw error;
            setSalesHistory(prev => prev.filter(s => s.id !== saleId));
            return true;
        } catch (err) {
            console.error("Error deleting sale:", err);
            return false;
        }
    };

    const updateTableDetails = (tableId, updates) => {
        setTables(prev => prev.map(t =>
            t.id === tableId ? { ...t, ...updates } : t
        ));
    };

    const requestService = async (tableId, tableName, type) => {
        try {
            const { error } = await supabase.from('service_requests').insert([{
                table_id: tableId,
                table_name: tableName,
                type,
                status: 'pending'
            }]);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Error requesting service:", err);
            return false;
        }
    };

    const clearServiceRequest = async (requestId) => {
        try {
            const { error } = await supabase.from('service_requests').update({ status: 'cleared' }).eq('id', requestId);
            if (error) throw error;
            setServiceRequests(prev => prev.filter(r => r.id !== requestId));
            return true;
        } catch (err) {
            console.error("Error clearing service request:", err);
            return false;
        }
    };

    const submitCustomerOrder = async (tableId, tableName, cartItems) => {
        if (!cartItems || cartItems.length === 0) return false;

        // Deduct stock
        deductStockForOrder(cartItems);

        // Filter items for kitchen: exclude drinks and wines
        const kitchenItems = cartItems
            .filter(item => item.category !== 'bebidas' && item.category !== 'vinos')
            .map(item => ({
                ...item,
                itemStatus: 'pending',
                startTime: new Date().toISOString()
            }));

        if (kitchenItems.length > 0) {
            // Save to Supabase (KDS)
            try {
                const { data, error } = await supabase.from('kitchen_orders').insert([{
                    table_name: tableName,
                    items: JSON.stringify(kitchenItems),
                    customer_info: null,
                    status: 'pending'
                }]).select();

                if (!error && data) {
                    const newKo = {
                        ...data[0],
                        items: kitchenItems,
                        timestamp: new Date(data[0].created_at),
                        table: data[0].table_name,
                        customer: null
                    };
                    setKitchenOrders(prev => [...prev, newKo]);
                }
            } catch (err) {
                console.error("Error sending customer order to kitchen:", err);
                return false;
            }
        }

        // Send order payload via service_requests so the real POS can add it to the bill
        try {
            await supabase.from('service_requests').insert([{
                table_id: tableId,
                table_name: tableName,
                type: 'new_order',
                payload: JSON.stringify(cartItems),
                status: 'pending'
            }]);
        } catch (err) {
            console.error("Error sending service request for new order:", err);
        }

        // Update table activity
        updateTableStatus(tableId, 'occupied');

        return true;
    };

    const transferTable = (sourceTableId, targetTableId) => {
        if (sourceTableId === targetTableId) return;

        // 1. Move Orders (Borrador)
        setTableOrders(prev => {
            const next = { ...prev };
            const sourceOrders = next[sourceTableId] || [];
            if (sourceOrders.length > 0) {
                const targetOrders = next[targetTableId] || [];
                next[targetTableId] = [...targetOrders, ...sourceOrders];
            }
            delete next[sourceTableId];
            return next;
        });

        // 2. Move Bills (Enviados)
        setTableBills(prev => {
            const next = { ...prev };
            const sourceBill = next[sourceTableId] || [];
            if (sourceBill.length > 0) {
                const targetBill = next[targetTableId] || [];
                
                // Combine bills matching quantities where possible
                const combined = [...targetBill];
                sourceBill.forEach(sourceItem => {
                   const existing = combined.find(i => i.id === sourceItem.id && !i.isModified && !sourceItem.isModified);
                   if (existing) {
                       existing.quantity += sourceItem.quantity;
                   } else {
                       combined.push({ ...sourceItem });
                   }
                });

                next[targetTableId] = combined;
            }
            delete next[sourceTableId];
            return next;
        });

        // 3. Update Table Status
        const targetTable = tables.find(t => t.id === targetTableId);
        
        setTables(prev => prev.map(t => {
            if (t.id === sourceTableId) {
                return { ...t, status: 'free', lastActionAt: null }; // Free source
            }
            if (t.id === targetTableId) {
                return { ...t, status: 'occupied', lastActionAt: new Date().toISOString() }; // Occupy target
            }
            return t;
        }));
        
        // 4. Update Kitchen Orders (Optional: Change the name of the pending kitchen tickets to the new table)
        if (targetTable) {
             const sourceTableRecord = tables.find(t => t.id === sourceTableId);
             if(sourceTableRecord) {
                 // Best effort local update for kitchen orders (they would need a DB call to be fully effective across devices)
                 setKitchenOrders(prev => prev.map(ko => 
                     ko.table === sourceTableRecord.name ? { ...ko, table: targetTable.name } : ko
                 ));
                 
                 // Async DB update for KDS
                 supabase.from('kitchen_orders')
                     .update({ table_name: targetTable.name })
                     .eq('table_name', sourceTableRecord.name)
                     .then();
             }
        }

        if (currentTable && currentTable.id === sourceTableId) {
            setCurrentTable(null);
        }
    };

    const mergeTables = (sourceTableId, targetTableId) => {
        if (sourceTableId === targetTableId) return;

        const sourceTable = tables.find(t => t.id === sourceTableId);
        const targetTable = tables.find(t => t.id === targetTableId);
        
        if (!sourceTable || !targetTable) return;

        // 1. Move Orders into the Target Table
        setTableOrders(prev => {
            const next = { ...prev };
            const sourceOrders = next[sourceTableId] || [];
            if (sourceOrders.length > 0) {
                const targetOrders = next[targetTableId] || [];
                next[targetTableId] = [...targetOrders, ...sourceOrders];
            }
            delete next[sourceTableId];
            return next;
        });

        // 2. Move Bills into the Target Table
        setTableBills(prev => {
            const next = { ...prev };
            const sourceBill = next[sourceTableId] || [];
            if (sourceBill.length > 0) {
                const targetBill = next[targetTableId] || [];
                const combined = [...targetBill];
                sourceBill.forEach(sourceItem => {
                    const existing = combined.find(i => i.id === sourceItem.id && !i.isModified && !sourceItem.isModified);
                    if (existing) {
                        existing.quantity += sourceItem.quantity;
                    } else {
                        combined.push({ ...sourceItem });
                    }
                });
                next[targetTableId] = combined;
            }
            delete next[sourceTableId];
            return next;
        });

        // 3. Update Kitchen Orders names temporarily
        setKitchenOrders(prev => prev.map(ko => 
            (ko.table === sourceTable.name) ? { ...ko, table: targetTable.name } : ko
        ));
        
        // Async DB update for KDS
        supabase.from('kitchen_orders')
            .update({ table_name: targetTable.name })
            .eq('table_name', sourceTable.name)
            .then();

        // 4. Link Tables (source -> target) and Update Name
        setTables(prev => {
            const sourceT = prev.find(t => t.id === sourceTableId);
            const targetT = prev.find(t => t.id === targetTableId);
            if (!sourceT || !targetT) return prev;

            const sourceNum = sourceT.name.replace(/[^\d]/g, '');
            const targetCurrentName = targetT.name;
            const originalName = targetT.originalName || targetT.name;
            
            // Generate composite name: "Mesa 1/5" or "Mesa 1/2/5"
            // We take the existing name of target, extract the numbers, and add the new one
            const prefix = originalName.match(/^[^\d]*/) ? originalName.match(/^[^\d]*/)[0] : 'Mesa ';
            const targetNums = targetCurrentName.replace(prefix, '').split('/');
            if (!targetNums.includes(sourceNum)) {
                targetNums.unshift(sourceNum);
            }
            const newCompositeName = `${prefix}${targetNums.join('/')}`;
            const updatedTarget = { 
                ...targetT, 
                status: 'occupied', 
                name: newCompositeName, 
                originalName: originalName,
                lastActionAt: new Date().toISOString() 
            };

            if (currentTable && currentTable.id === sourceTableId) {
                setCurrentTable(updatedTarget);
            }

            return prev.map(t => {
                if (t.id === sourceTableId) {
                    return { ...t, status: 'occupied', linkedTo: targetTableId };
                }
                if (t.id === targetTableId) {
                    return updatedTarget;
                }
                return t;
            });
        });
    };

    const splitTable = (tableId) => {
        const table = tables.find(t => t.id === tableId);
        if (!table) return;

        // If it's a "slave" table, just unlink it
        if (table.linkedTo) {
            const targetId = table.linkedTo;
            setTables(prev => {
                const sourceT = prev.find(t => t.id === tableId);
                const targetT = prev.find(t => t.id === targetId);
                if (!sourceT || !targetT) return prev;

                const sourceNum = sourceT.name.replace(/[^\d]/g, '');
                const originalName = targetT.originalName || targetT.name;
                const prefix = originalName.match(/^[^\d]*/) ? originalName.match(/^[^\d]*/)[0] : 'Mesa ';
                
                // Remove the source number from the composite target name
                const targetNums = targetT.name.replace(prefix, '').split('/').filter(n => n !== sourceNum);
                const newName = targetNums.length > 0 ? `${prefix}${targetNums.join('/')}` : originalName;

                return prev.map(t => {
                    if (t.id === tableId) return { ...t, linkedTo: null, status: 'free' };
                    if (t.id === targetId) return { ...t, name: newName };
                    return t;
                });
            });
            return;
        }

        // If it's a "master" table, unlink everyone pointing to it and restore name
        setTables(prev => prev.map(t => 
            (t.linkedTo === tableId || t.id === tableId) 
                ? { ...t, linkedTo: null, status: 'free', name: t.originalName || t.name } 
                : t
        ));

        if (currentTable && currentTable.id === tableId) {
            setCurrentTable(null);
        }
    };

    return (
        <OrderContext.Provider value={{
            order,
            bill,
            tables,
            tableOrders,
            tableBills,
            kitchenOrders,
            currentTable,
            selectedCustomer,
            selectTable,
            selectCustomer,
            addToOrder,
            removeFromOrder,
            updateQuantity,
            updateItemNote,
            toggleItemPriority,
            toggleItemToShare,
            toggleItemIndividual,
            toggleItemInvitation,
            toggleItemInvitationInBill,
            clearOrder,
            calculateTotal: () => calculateOrderTotal(order),
            calculateBillTotal: () => calculateOrderTotal(bill),
            sendToKitchen,
            submitCustomerOrder,
            updateKitchenItemStatus,
            markOrderReady,
            closeTable,
            forceClearTable,
            payPartialTable,
            payValuePartialTable,
            calculateOrderTotal,
            removeProductFromBill,
            updateBillQuantity,
            removeOrder,
            addTable,
            deleteTable,
            deleteSale,
            updateTableDetails,
            syncStatus,
            isLoading,
            salesHistory,
            cashCloses,
            serviceRequests,
            requestService,
            clearServiceRequest,
            reservations, // Also expose reservations here for convenience
            activeQrAlert,
            setActiveQrAlert,
            transferTable,
            mergeTables,
            splitTable,
            deleteCashClose,
            performCashClose,
            syncWithCloud,
            // --- BACKUP & RECOVERY ---
            saveEmergencyBackup: () => {
                const snapshot = {
                    tables,
                    tableOrders,
                    tableBills,
                    timestamp: new Date().toISOString()
                };
                safeSetItem('manalu_emergency_backup', JSON.stringify(snapshot));
                // Optional: Mirror to cloud
                supabase.from('service_requests').insert([{
                    table_id: 'SYSTEM',
                    table_name: 'BACKUP_SNAPSHOT',
                    type: 'system_backup',
                    payload: JSON.stringify(snapshot),
                    status: 'pending'
                }]).then();
                console.log("💾 Backup de emergencia guardado.");
            },
            restoreFromBackup: (backupData) => {
                if (!backupData) return false;
                try {
                    if (backupData.tables) setTables(backupData.tables);
                    if (backupData.tableOrders) setTableOrders(backupData.tableOrders);
                    if (backupData.tableBills) setTableBills(backupData.tableBills);
                    return true;
                } catch (e) {
                    console.error("Error al restaurar backup:", e);
                    return false;
                }
            }
        }}>
            {children}
        </OrderContext.Provider>
    );
};
