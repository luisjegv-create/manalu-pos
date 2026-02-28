import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const ProductTimer = ({ startTime, isReady }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (isReady) return;

        const calculate = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            setElapsed(Math.floor((now - start) / 60000));
        };

        calculate();
        const interval = setInterval(calculate, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [startTime, isReady]);

    if (isReady) return null;

    return (
        <span style={{
            fontSize: '0.7rem',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            color: elapsed > 20 ? '#ef4444' : elapsed > 10 ? '#fbbf24' : '#10b981'
        }}>
            <Clock size={10} />
            {elapsed}'
        </span>
    );
};

const TableOrderPreview = ({ tableBills = [], kitchenOrders = [] }) => {
    // Collect all items from current orders and bills to show a complete status
    // 1. Items currently being drafted (not yet sent to kitchen)
    // 2. Items sent to kitchen (pending or ready)
    // 3. Drinks (usually only in bills)

    // Find kitchen orders for this table
    // Note: kitchenOrders arrive with 'table_name' which matches table.name

    // We'll focus on the items in kitchenOrders first as they have the status
    const kitchenItems = kitchenOrders.flatMap(o => o.items || []);

    // Merge items: we want to show unique products and their status
    // If an item is in kitchenOrders, it's either 'pending' (green) or 'ready' (red)
    // If it's in tableBills but NOT in kitchenOrders, it might be a drink or already served food.

    if (kitchenItems.length === 0 && tableBills.length === 0) return null;

    return (
        <div style={{
            marginTop: '0.5rem',
            width: '100%',
            fontSize: '0.8rem',
            maxHeight: '120px',
            overflowY: 'auto',
            textAlign: 'left',
            padding: '4px',
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '6px'
        }}>
            {kitchenItems.map((item, idx) => {
                const isReady = item.itemStatus === 'ready';
                return (
                    <div key={`${item.uniqueId}-${idx}`} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: isReady ? '#ef4444' : '#10b981', // Delivered is Red, Pending is Green
                        padding: '2px 0',
                        fontWeight: '600'
                    }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {item.quantity}x {item.name}
                        </span>
                        <ProductTimer startTime={item.startTime} isReady={isReady} />
                    </div>
                );
            })}
        </div>
    );
};

export default TableOrderPreview;
