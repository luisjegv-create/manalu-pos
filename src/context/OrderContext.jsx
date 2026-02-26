import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useInventory } from './InventoryContext';
import { useCustomers } from './CustomerContext';
import { tables as initialTables } from '../data/tables';
import { useEvents } from './EventContext';

const OrderContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const { deductStockForOrder, incrementTicketNumber } = useInventory();
    const { recordSale } = useCustomers();
    const { reservations } = useEvents();

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

    // Tables state (Sync with Supabase in future if needed, for now local is okay for layout)
    const [tables, setTables] = useState(() => safeParse('manalu_tables', initialTables));

    // Active orders (Drafts) - Keep in localStorage for low latency/offline safety during rush
    const [tableOrders, setTableOrders] = useState(() => safeParse('manalu_table_orders', {}));

    const [tableBills, setTableBills] = useState(() => safeParse('manalu_table_bills', {}));

    // Cloud Synchronized States
    const [kitchenOrders, setKitchenOrders] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [cashCloses, setCashCloses] = useState([]);
    const [serviceRequests, setServiceRequests] = useState([]);

    // Local Loader state
    const [isLoading, setLoadingState] = useState(false);
    const [syncStatus, setSyncStatus] = useState({
        sales: { count: 0, error: null },
        kitchen: { count: 0, error: null },
        closes: { count: 0, error: null },
        totalSales: 0
    });

    // --- INITIAL CLOUD SYNC ---
    useEffect(() => {
        const syncWithCloud = async () => {
            setLoadingState(true);
            try {

                // 1. Fetch Sales
                const { data: salesData, error: salesError } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(1000);
                if (salesError) {
                    setSyncStatus(prev => ({ ...prev, sales: { count: 0, error: salesError.message } }));
                } else if (salesData) {
                    const mappedSales = salesData.map(s => ({
                        ...s,
                        date: new Date(s.created_at),
                        total: parseFloat(s.total || s.total_amount || 0),
                        items: typeof s.items === 'string' ? (s.items.startsWith('[') ? JSON.parse(s.items) : []) : (s.items || []),
                        paymentMethod: s.payment_method || s.paymentMethod || 'Efectivo',
                        tableId: s.table_id || s.tableId
                    }));
                    setSalesHistory(mappedSales);
                    setSyncStatus(prev => ({ ...prev, sales: { count: mappedSales.length, error: null }, totalSales: mappedSales.length }));
                }

                // 2. Fetch Kitchen Orders
                const { data: kitchenData, error: kitchenError } = await supabase.from('kitchen_orders')
                    .select('*')
                    .or('status.eq.pending,status.eq.ready')
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
                    setServiceRequests(requestData);
                }
            } catch (err) {
                console.error("Error crítico de sincronización:", err);
            } finally {
                setLoadingState(false);
            }
        };
        syncWithCloud();

        // Realtime subscriptions
        const kitchenSubscription = supabase
            .channel('kitchen-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_orders' }, () => {
                syncWithCloud(); // Refresh kitchen
            })
            .subscribe();

        const salesSubscription = supabase
            .channel('sales-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, (payload) => {
                const newSale = {
                    ...payload.new,
                    date: new Date(payload.new.created_at),
                    total: parseFloat(payload.new.total || payload.new.total_amount || 0),
                    items: typeof payload.new.items === 'string' ? JSON.parse(payload.new.items) : (payload.new.items || []),
                    paymentMethod: payload.new.payment_method || payload.new.paymentMethod || 'Efectivo',
                    tableId: payload.new.table_id || payload.new.tableId
                };
                setSalesHistory(prev => [newSale, ...prev]);
            })
            .subscribe();

        const serviceSubscription = supabase
            .channel('service-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
                syncWithCloud();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(kitchenSubscription);
            supabase.removeChannel(salesSubscription);
            supabase.removeChannel(serviceSubscription);
        };
    }, []);

    // Persistence Effects for local-only state (Drafts)
    useEffect(() => {
        localStorage.setItem('manalu_tables', JSON.stringify(tables));
    }, [tables]);

    useEffect(() => {
        localStorage.setItem('manalu_table_orders', JSON.stringify(tableOrders));
    }, [tableOrders]);

    useEffect(() => {
        localStorage.setItem('manalu_table_bills', JSON.stringify(tableBills));
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

            const existingItem = currentTableOrder.find(item => item.id === product.id && !item.isModified);
            let nextOrder;
            if (existingItem) {
                nextOrder = currentTableOrder.map(item =>
                    (item.id === product.id && !item.isModified)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                nextOrder = [...currentTableOrder, { ...product, quantity: 1, uniqueId: `${product.id}-${Date.now()}` }];
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
        setTables(prev => prev.map(t =>
            t.id === tableId
                ? { ...t, status, lastActionAt: status === 'occupied' ? new Date().toISOString() : t.lastActionAt }
                : t
        ));
    };

    const sendToKitchen = async () => {
        if (!currentTable || order.length === 0) return;

        deductStockForOrder(order);
        if (selectedCustomer) {
            recordSale(selectedCustomer.id, calculateOrderTotal(order), order);
        }

        // Save to Supabase (KDS)
        try {
            const { data, error } = await supabase.from('kitchen_orders').insert([{
                table_name: currentTable.name,
                items: JSON.stringify(order),
                customer_info: JSON.stringify(selectedCustomer),
                status: 'pending'
            }]).select();

            if (!error && data) {
                const newKo = {
                    ...data[0],
                    items: order,
                    timestamp: new Date(data[0].created_at),
                    table: data[0].table_name,
                    customer: selectedCustomer
                };
                setKitchenOrders(prev => [...prev, newKo]);
            }
        } catch (err) {
            console.error("Error sending to kitchen:", err);
        }

        setTableBills(prev => {
            const currentBill = prev[currentTable.id] || [];
            const newBill = [...currentBill];
            order.forEach(newItem => {
                const existingInBill = newBill.find(b => b.id === newItem.id);
                if (existingInBill) {
                    existingInBill.quantity += newItem.quantity;
                } else {
                    newBill.push({ ...newItem });
                }
            });
            return { ...prev, [currentTable.id]: newBill };
        });

        clearOrder();
        setSelectedCustomer(null);

        // Update table activity
        setTables(prev => prev.map(t =>
            t.id === currentTable.id
                ? { ...t, lastActionAt: new Date().toISOString() }
                : t
        ));
    };

    const closeTable = async (tableId, paymentMethod = 'Efectivo', discountPercent = 0, isInvitation = false, _customerData = null) => {
        const finalBill = tableBills[tableId];
        if (finalBill && finalBill.length > 0) {
            const billTotal = calculateOrderTotal(finalBill);
            const discountAmount = (billTotal * discountPercent) / 100;
            const total = isInvitation ? 0 : Math.max(0, billTotal - discountAmount);

            // Assign sequential ticket number
            const ticketNumber = await incrementTicketNumber();

            // Save to Supabase
            const { data, error } = await supabase.from('sales').insert([{
                total,
                payment_method: paymentMethod,
                items: JSON.stringify(finalBill),
                table_id: tableId
            }]).select();

            if (!error && data) {
                const newSale = {
                    ...data[0],
                    date: new Date(data[0].created_at),
                    total: parseFloat(data[0].total),
                    items: JSON.parse(data[0].items),
                    paymentMethod: data[0].payment_method,
                    tableId: data[0].table_id,
                    ticket_number: ticketNumber
                };
                setSalesHistory(prev => [newSale, ...prev]);

                // Limpiar mesa
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
                setTables(prev => prev.map(t =>
                    t.id === tableId
                        ? { ...t, status: 'free', lastActionAt: null }
                        : t
                ));
                if (currentTable && currentTable.id === tableId) {
                    setCurrentTable(null);
                }
                return newSale; // Return the new sale object
            }
        }

        // If there was an error or no bill to process, ensure table status is updated if it was the current table
        if (currentTable && currentTable.id === tableId) {
            setCurrentTable(null);
        }
        updateTableStatus(tableId, 'free'); // Ensure table is free even if no sale was recorded (e.g., empty bill)
        return null; // Return null if no sale was recorded or an error occurred
    };

    const payPartialTable = async (tableId, itemsToPay, paymentMethod = 'Efectivo', discountPercent = 0, isInvitation = false, _customerData = null) => {
        if (!itemsToPay || itemsToPay.length === 0) return null;

        const billTotal = calculateOrderTotal(itemsToPay);
        const discountAmount = (billTotal * discountPercent) / 100;
        const total = isInvitation ? 0 : Math.max(0, billTotal - discountAmount);

        // Assign sequential ticket number
        const ticketNumber = await incrementTicketNumber();

        // Save partial sale to Supabase
        const { data, error } = await supabase.from('sales').insert([{
            total,
            payment_method: paymentMethod,
            items: JSON.stringify(itemsToPay),
            table_id: tableId
        }]).select();

        if (error) {
            console.error("DEBUG - payPartialTable Supabase Error:", error);
            throw new Error(`Error en DB (Cobro Parcial): ${error.message || JSON.stringify(error)}`);
        }

        if (data && data.length > 0) {
            const newSale = {
                ...data[0],
                date: new Date(data[0].created_at),
                total: parseFloat(data[0].total),
                items: JSON.parse(data[0].items),
                paymentMethod: data[0].payment_method,
                tableId: data[0].table_id,
                ticket_number: ticketNumber
            };
            setSalesHistory(prev => [newSale, ...prev]);

            // Update bill: deduct paid quantities
            setTableBills(prev => {
                const currentBill = prev[tableId] || [];
                const nextBill = currentBill.map(item => {
                    const paidItem = itemsToPay.find(p => p.uniqueId === item.uniqueId);
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
        return null;
    };

    const payValuePartialTable = async (tableId, amount, paymentMethod = 'Efectivo', discountPercent = 0, isInvitation = false, _customerData = null) => {
        if (amount <= 0) return null;

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

        const { data, error } = await supabase.from('sales').insert([{
            total: finalToPay,
            payment_method: paymentMethod,
            items: JSON.stringify(itemsToPay),
            table_id: tableId
        }]).select();

        if (error) {
            console.error("DEBUG - payValuePartialTable Supabase Error:", error);
            throw new Error(`Error en DB (Pago Valor): ${error.message || JSON.stringify(error)}`);
        }

        if (data && data.length > 0) {
            const newSale = {
                ...data[0],
                date: new Date(data[0].created_at),
                total: parseFloat(data[0].total),
                items: JSON.parse(data[0].items),
                paymentMethod: data[0].payment_method,
                tableId: data[0].table_id,
                ticket_number: ticketNumber
            };
            setSalesHistory(prev => [newSale, ...prev]);

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
        return null;
    };

    const { returnStockForItems } = useInventory(); // Ensure it's available

    const removeProductFromBill = (tableId, uniqueId, quantityToRemove) => {
        setTableBills(prev => {
            const currentBill = prev[tableId] || [];
            const itemToRemove = currentBill.find(item => item.uniqueId === uniqueId);

            if (itemToRemove) {
                // Return stock
                const returningItems = [{ ...itemToRemove, quantity: Math.min(itemToRemove.quantity, quantityToRemove) }];
                returnStockForItems(returningItems);

                const nextBill = currentBill.map(item => {
                    if (item.uniqueId === uniqueId) {
                        return { ...item, quantity: item.quantity - quantityToRemove };
                    }
                    return item;
                }).filter(item => item.quantity > 0);

                if (nextBill.length === 0 && (!tableOrders[tableId] || tableOrders[tableId].length === 0)) {
                    updateTableStatus(tableId, 'free');
                }
                return { ...prev, [tableId]: nextBill };
            }
            return prev;
        });
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
    };

    const markOrderReady = async (orderId) => {
        try {
            await supabase.from('kitchen_orders').update({ status: 'ready' }).eq('id', orderId);
            setKitchenOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: 'ready' } : o
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const removeOrder = async (orderId) => {
        try {
            await supabase.from('kitchen_orders').update({ status: 'archived' }).eq('id', orderId);
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

    const calculateOrderTotal = (items) => {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const addTable = (zoneId, name) => {
        const newTable = {
            id: `table-${Date.now()}`,
            name: name || `Nueva Mesa`,
            zone: zoneId,
            status: 'free',
            seats: 4
        };
        setTables(prev => [...prev, newTable]);
    };

    const deleteTable = (tableId) => {
        setTables(prev => prev.filter(t => t.id !== tableId));
    };

    const performCashClose = async (totals) => {
        try {
            const { data, error } = await supabase.from('cash_closes').insert([{
                total_efectivo: totals.efectivo || 0,
                total_tarjeta: totals.tarjeta || 0,
                total_ventas: totals.total || 0,
                sales_count: totals.salesCount || 0,
                notes: totals.notes || ''
            }]).select();

            if (!error && data) {
                const newClose = {
                    ...data[0],
                    date: new Date(data[0].created_at),
                    efectivo: data[0].total_efectivo,
                    tarjeta: data[0].total_tarjeta,
                    total: data[0].total_ventas,
                    salesCount: data[0].sales_count
                };
                setCashCloses(prev => [newClose, ...prev]);
                return newClose;
            }
        } catch (err) {
            console.error(err);
        }
        return null;
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
            clearOrder,
            calculateTotal: () => calculateOrderTotal(order),
            calculateBillTotal: () => calculateOrderTotal(bill),
            sendToKitchen,
            closeTable,
            payPartialTable,
            payValuePartialTable,
            calculateOrderTotal,
            removeProductFromBill,
            markOrderReady,
            removeOrder,
            addTable,
            deleteTable,
            deleteSale,
            updateTableDetails,
            syncStatus,
            performCashClose,
            isLoading,
            salesHistory,
            cashCloses,
            serviceRequests,
            requestService,
            clearServiceRequest,
            reservations // Also expose reservations here for convenience
        }}>
            {children}
        </OrderContext.Provider>
    );
};
