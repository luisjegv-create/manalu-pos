import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, Plus, Minus, Euro } from 'lucide-react';

const CashCalculator = ({ onTotalChange, colors }) => {
    const [counts, setCounts] = useState({
        '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0,
        '2': 0, '1': 0, '0.50': 0, '0.20': 0, '0.10': 0, '0.05': 0, '0.02': 0, '0.01': 0
    });

    const denominations = [
        { val: 500, label: '500€', type: 'bill' },
        { val: 200, label: '200€', type: 'bill' },
        { val: 100, label: '100€', type: 'bill' },
        { val: 50, label: '50€', type: 'bill' },
        { val: 20, label: '20€', type: 'bill' },
        { val: 10, label: '10€', type: 'bill' },
        { val: 5, label: '5€', type: 'bill' },
        { val: 2, label: '2€', type: 'coin' },
        { val: 1, label: '1€', type: 'coin' },
        { val: 0.5, label: '50c', type: 'coin' },
        { val: 0.2, label: '20c', type: 'coin' },
        { val: 0.1, label: '10c', type: 'coin' },
        { val: 0.05, label: '5c', type: 'coin' },
        { val: 0.02, label: '2c', type: 'coin' },
        { val: 0.01, label: '1c', type: 'coin' },
    ];

    useEffect(() => {
        const total = Object.entries(counts).reduce((acc, [val, count]) => acc + (parseFloat(val) * count), 0);
        onTotalChange(total);
    }, [counts, onTotalChange]);

    const updateCount = (val, delta) => {
        setCounts(prev => ({
            ...prev,
            [val]: Math.max(0, (prev[val] || 0) + delta)
        }));
    };

    const handleInputChange = (val, value) => {
        const numValue = parseInt(value) || 0;
        setCounts(prev => ({
            ...prev,
            [val]: Math.max(0, numValue)
        }));
    };

    return (
        <div style={{ 
            background: colors.surface, 
            borderRadius: '20px', 
            padding: '1.5rem',
            border: `1px solid ${colors.border}`,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: colors.primary }}>
                <Calculator size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Calculadora de Efectivo</h3>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: '1rem',
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '0.5rem'
            }}>
                {denominations.map((denom) => (
                    <div key={denom.val} style={{ 
                        background: '#f8fafc',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ 
                                fontSize: '0.9rem', 
                                fontWeight: '800', 
                                color: denom.type === 'bill' ? colors.primary : colors.textMuted 
                            }}>
                                {denom.label}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: colors.success, fontWeight: '700' }}>
                                {(counts[denom.val] * denom.val).toFixed(2)}€
                            </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button 
                                onClick={() => updateCount(denom.val, -1)}
                                style={{ 
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'white', color: colors.danger, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: `1px solid ${colors.border}`
                                }}
                            >
                                <Minus size={14} />
                            </button>
                            <input 
                                type="number"
                                value={counts[denom.val] || ''}
                                onChange={(e) => handleInputChange(denom.val, e.target.value)}
                                placeholder="0"
                                style={{ 
                                    width: '100%', border: 'none', background: 'transparent',
                                    textAlign: 'center', fontSize: '1rem', fontWeight: '800',
                                    color: colors.text, outline: 'none'
                                }}
                            />
                            <button 
                                onClick={() => updateCount(denom.val, 1)}
                                style={{ 
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'white', color: colors.success, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: `1px solid ${colors.border}`
                                }}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: colors.primary, 
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white'
            }}>
                <span style={{ fontWeight: '700' }}>Total Contado:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>
                    {Object.entries(counts).reduce((acc, [val, count]) => acc + (parseFloat(val) * count), 0).toFixed(2)}€
                </span>
            </div>
            
            <button 
                onClick={() => setCounts(Object.keys(counts).reduce((acc, curr) => ({...acc, [curr]: 0}), {}))}
                style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    padding: '0.5rem',
                    background: 'transparent',
                    border: `1px dashed ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.textMuted,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}
            >
                Limpiar todo
            </button>
        </div>
    );
};

export default CashCalculator;
