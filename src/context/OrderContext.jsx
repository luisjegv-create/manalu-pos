import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useInventory } from './InventoryContext';
import { useCustomers } from './CustomerContext';
import { tables as initialTables } from '../data/tables';

const OrderContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const { deductStockForOrder } = useInventory();
    const { recordSale } = useCustomers();

    // Tables state (Sync with Supabase in future if needed, for now local is okay for layout)
    const [tables, setTables] = useState(() => {
        const saved = localStorage.getItem('manalu_tables');
        return saved ? JSON.parse(saved) : initialTables;
    });

    // Active orders (Drafts) - Keep in localStorage for low latency/offline safety during rush
    const [tableOrders, setTableOrders] = useState(() => {
        const saved = localStorage.getItem('manalu_table_orders');
        return saved ? JSON.parse(saved) : {};
    });

    const [tableBills, setTableBills] = useState(() => {
        const saved = localStorage.getItem('manalu_table_bills');
        return saved ? JSON.parse(saved) : {};
    });

    // Cloud Synchronized States
    const [kitchenOrders, setKitchenOrders] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [cashCloses, setCashCloses] = useState([]);

    // --- INITIAL CLOUD SYNC ---
    useEffect(() => {
        const syncWithCloud = async () => {
            // Fetch Sales
            const { data: salesData } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(100);
            if (salesData) {
                setSalesHistory(salesData.map(s => ({
                    ...s,
                    date: new Date(s.created_at),
                    items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items
                })));
            }

            // Note: Kitchen orders and Cash closes would follow similar pattern
            // For now, let's keep them in localStorage for backward compatibility or add tables to Supabase later
        };
        syncWithCloud();
    }, []);

    // Persistence Effects for local-only state
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
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    };

    const sendToKitchen = async () => {
        if (!currentTable || order.length === 0) return;

        deductStockForOrder(order);
        if (selectedCustomer) {
            recordSale(selectedCustomer.id, calculateOrderTotal(order), order);
        }

        const newKitchenOrder = {
            id: Date.now(),
            items: [...order],
            timestamp: new Date(),
            status: 'pending',
            table: currentTable.name,
            customer: selectedCustomer
        };
        setKitchenOrders(prev => [...prev, newKitchenOrder]);

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
    };

    const closeTable = async (tableId, paymentMethod = 'Efectivo') => {
        const finalBill = tableBills[tableId];
        if (finalBill && finalBill.length > 0) {
            const total = calculateOrderTotal(finalBill);

            // Save to Supabase
            const { data, error } = await supabase.from('sales').insert([{
                total,
                payment_method: paymentMethod,
                items: JSON.stringify(finalBill),
                table_id: tableId
            }]).select();

            if (!error && data) {
                const saleRecord = {
                    ...data[0],
                    date: new Date(data[0].created_at),
                    items: finalBill
                };
                setSalesHistory(prev => [saleRecord, ...prev]);
            }
        }

        setTableBills(prev => {
            const next = { ...prev };
            delete next[tableId];
            return next;
        });
        updateTableStatus(tableId, 'free');
        if (currentTable && currentTable.id === tableId) {
            setCurrentTable(null);
        }
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
    };

    const markOrderReady = (orderId) => {
        setKitchenOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: 'ready' } : o
        ));
    };

    const removeOrder = (orderId) => {
        setKitchenOrders(prev => prev.filter(o => o.id !== orderId));
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
        // Implementation for Supabase cash closes would go here
        const newClose = {
            id: `close-${Date.now()}`,
            date: new Date(),
            ...totals
        };
        setCashCloses(prev => [newClose, ...prev]);
        return newClose;
    };

    const updateTableDetails = (tableId, updates) => {
        setTables(prev => prev.map(t =>
            t.id === tableId ? { ...t, ...updates } : t
        ));
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
            markOrderReady,
            removeOrder,
            addTable,
            deleteTable,
            updateTableDetails,
            salesHistory,
            cashCloses,
            performCashClose
        }}>
            {children}
        </OrderContext.Provider>
    );
};

