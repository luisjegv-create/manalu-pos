import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const ProductTimer = ({ startTime, isReady, dark = false }) => {
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

    const color = elapsed > 20 ? '#ef4444' : elapsed > 10 ? '#f59e0b' : (dark ? '#1e293b' : '#10b981');

    return (
        <span style={{
            fontSize: '0.7rem',
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            color,
            fontWeight: 'bold'
        }}>
            <Clock size={10} />
            {elapsed}'
        </span>
    );
};

const TableOrderPreview = ({ tableOrders = [], kitchenOrders = [] }) => {
    // Defense: ensure we have arrays
    const safeTableOrders = Array.isArray(tableOrders) ? tableOrders : [];
    const safeKitchenOrders = Array.isArray(kitchenOrders) ? kitchenOrders : [];

    // Collect all items to show:
    // 1. Items in draft (not yet sent to kitchen)
    const draftItems = safeTableOrders.map(item => ({ ...item, itemStatus: 'draft' }));

    // 2. Items sent to kitchen
    const kitchenItems = safeKitchenOrders.flatMap(o => o?.items || []);

    const allItems = [...draftItems, ...kitchenItems];

    if (allItems.length === 0) return null;

    return (
        <div style={{
            marginTop: '0.8rem',
            width: '100%',
            fontSize: '0.75rem',
            maxHeight: '140px',
            overflowY: 'auto',
            textAlign: 'left',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.25)', // Glassy dark background
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(4px)'
        }}>
            {allItems.map((item, idx) => {
                if (!item) return null;
                const isReady = item.itemStatus === 'ready';
                const isDraft = item.itemStatus === 'draft';
                return (
                    <div key={`${item.uniqueId}-${idx}`} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'rgba(255, 255, 255, 0.9)', // White text for dark cards
                        padding: '4px 0',
                        fontWeight: '600',
                        borderBottom: idx === allItems.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                flexShrink: 0,
                                backgroundColor: isReady ? '#10b981' : isDraft ? '#f59e0b' : '#ef4444',
                                boxShadow: `0 0 4px ${isReady ? '#10b981' : isDraft ? '#f59e0b' : '#ef4444'}80`
                            }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.quantity}x {item.name}
                            </span>
                        </div>
                        {item.startTime && <ProductTimer startTime={item.startTime} isReady={isReady} dark={false} />}
                    </div>
                );
            })}
        </div>
    );
};

export default TableOrderPreview;
