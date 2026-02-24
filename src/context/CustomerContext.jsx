import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCustomers = () => useContext(CustomerContext);

const initialCustomers = [
    // { id: 'c1', name: 'Sonia García', phone: '600000001', points: 120, favorites: ['Bravas', 'Caña'], totalSpend: 154.50 },
    // { id: 'c2', name: 'Juan Pérez', phone: '600000002', points: 45, favorites: ['Bocata Calamares'], totalSpend: 62.00 },
];

export const CustomerProvider = ({ children }) => {
    // Helper for safe parsing
    const safeParse = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            if (!saved) return fallback;
            const parsed = JSON.parse(saved);
            return (Array.isArray(fallback) && !Array.isArray(parsed)) ? fallback : parsed;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    const [customers, setCustomers] = useState(() => safeParse('manalu_customers', initialCustomers));

    useEffect(() => {
        localStorage.setItem('manalu_customers', JSON.stringify(customers));
    }, [customers]);

    const addCustomer = (customer) => {
        setCustomers(prev => [...prev, {
            ...customer,
            id: `c-${Date.now()}`,
            points: 0,
            favorites: [],
            totalSpend: 0,
            history: [], // Transaction history
            notes: customer.notes || '',
            email: customer.email || '',
            nif: customer.nif || '',
            address: customer.address || ''
        }]);
    };

    const updateCustomer = (id, updatedData) => {
        setCustomers(prev => prev.map(c =>
            c.id === id ? { ...c, ...updatedData } : c
        ));
    };

    const deleteCustomer = (id) => {
        setCustomers(prev => prev.filter(c => c.id !== id));
    };

    const recordSale = (customerId, amount, items) => {
        setCustomers(prev => prev.map(c => {
            if (c.id === customerId) {
                // Unique favorites
                const newFavorites = [...new Set([...c.favorites, ...items.map(i => i.name)])].slice(0, 5);

                const newTransaction = {
                    id: `t-${Date.now()}`,
                    date: new Date().toISOString(),
                    amount: amount,
                    items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
                };

                return {
                    ...c,
                    points: c.points + Math.floor(amount),
                    totalSpend: c.totalSpend + amount,
                    favorites: newFavorites,
                    history: [newTransaction, ...(c.history || [])]
                };
            }
            return c;
        }));
    };

    return (
        <CustomerContext.Provider value={{
            customers,
            addCustomer,
            updateCustomer,
            deleteCustomer,
            recordSale
        }}>
            {children}
        </CustomerContext.Provider>
    );
};
