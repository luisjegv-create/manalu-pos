import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Minus, Plus, Banknote, CreditCard,
    FileText
} from 'lucide-react';

const PartialPaymentModal = ({
    isOpen,
    onClose,
    bill,
    itemsToPay,
    updatePartialQuantity,
    discountPercent,
    setDiscountPercent,
    isInvitation,
    setIsInvitation,
    isFullInvoice,
    setIsFullInvoice,
    customerTaxData,
    setCustomerTaxData,
    handleConfirmPartialPayment,
    payValuePartialTable,
    currentTable
}) => {
    const [mode, setMode] = React.useState('products'); // 'products', 'equal', 'custom'
    const [numPeople, setNumPeople] = React.useState(2);
    const [customAmount, setCustomAmount] = React.useState('');

    if (!isOpen) return null;

    const totalBill = bill.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    let totalToPay = 0;
    if (mode === 'products') {
        totalToPay = itemsToPay.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    } else if (mode === 'equal') {
        totalToPay = totalBill / numPeople;
    } else if (mode === 'custom') {
        totalToPay = parseFloat(customAmount) || 0;
    }

    const discountAmount = isInvitation ? totalToPay : (totalToPay * discountPercent / 100);
    const finalToPay = Math.max(0, totalToPay - discountAmount);

    const onConfirmMode = (paymentMethod) => {
        handleConfirmPartialPayment(paymentMethod, mode, totalToPay);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="glass-panel"
                style={{
                    padding: '2rem', width: '90%', maxWidth: '600px', display: 'flex',
                    flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--color-primary)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Dividir Cuenta</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                {/* MODE TABS */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
                    {['products', 'equal', 'custom'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            style={{
                                flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px',
                                background: mode === m ? 'var(--color-primary)' : 'transparent',
                                color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            {m === 'products' ? 'Productos' : m === 'equal' ? 'Equitativa' : 'Importe'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '40vh', overflowY: 'auto' }}>
                    {mode === 'products' && bill.map(item => {
                        const selectedItem = itemsToPay.find(i => i.uniqueId === item.uniqueId);
                        const currentQty = selectedItem ? selectedItem.quantity : 0;
                        return (
                            <div key={item.uniqueId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pendiente: {item.quantity} ud.</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '25px', padding: '4px' }}>
                                        <button onClick={() => updatePartialQuantity(item, -1)} disabled={currentQty === 0} style={{ width: '32px', height: '32px', border: 'none', background: 'none', color: currentQty > 0 ? '#ef4444' : '#64748b', cursor: 'pointer' }}>
                                            <Minus size={16} />
                                        </button>
                                        <span style={{ minWidth: '20px', textAlign: 'center' }}>{currentQty}</span>
                                        <button onClick={() => updatePartialQuantity(item, 1)} disabled={currentQty >= item.quantity} style={{ width: '32px', height: '32px', border: 'none', background: 'none', color: currentQty < item.quantity ? '#10b981' : '#64748b', cursor: 'pointer' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <div style={{ width: '60px', textAlign: 'right', fontWeight: 'bold' }}>{(item.price * currentQty).toFixed(2)}€</div>
                                </div>
                            </div>
                        );
                    })}

                    {mode === 'equal' && (
                        <div style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ fontSize: '1.1rem' }}>¿Entre cuántas personas dividimos?</div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                                <button onClick={() => setNumPeople(Math.max(2, numPeople - 1))} className="glass-panel" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>-</button>
                                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{numPeople}</span>
                                <button onClick={() => setNumPeople(numPeople + 1)} className="glass-panel" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>+</button>
                            </div>
                            <div style={{ color: '#94a3b8' }}>Total mesa: {totalBill.toFixed(2)}€</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Solo paga: {(totalBill / numPeople).toFixed(2)}€</div>
                        </div>
                    )}

                    {mode === 'custom' && (
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ fontSize: '1.1rem', textAlign: 'center' }}>Importe a cobrar ahora:</label>
                            <input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="0.00"
                                style={{
                                    width: '100%', padding: '1.5rem', fontSize: '2rem', textAlign: 'center',
                                    background: 'rgba(0,0,0,0.3)', border: '2px solid var(--color-primary)',
                                    color: 'white', borderRadius: '12px'
                                }}
                                autoFocus
                            />
                            <div style={{ color: '#94a3b8', textAlign: 'center' }}>Total mesa: {totalBill.toFixed(2)}€</div>
                        </div>
                    )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Descuento (%)</label>
                            <input type="number" value={discountPercent || ''} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }} />
                        </div>
                        <button onClick={() => setIsInvitation(!isInvitation)} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid', borderColor: isInvitation ? '#10b981' : 'var(--glass-border)', background: isInvitation ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: isInvitation ? '#10b981' : 'white', fontSize: '0.8rem' }}>🎁</button>
                    </div>

                    <button onClick={() => setIsFullInvoice(!isFullInvoice)} style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <FileText size={14} /> {isFullInvoice ? 'Factura Solicitada' : 'Solicitar Factura'}
                    </button>
                    {isFullInvoice && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <input placeholder="Nombre" value={customerTaxData.name} onChange={(e) => setCustomerTaxData({ ...customerTaxData, name: e.target.value })} style={{ width: '100%', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.75rem', borderRadius: '4px' }} />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    <span>Total a Cobrar:</span>
                    <span style={{ color: 'var(--color-primary)' }}>{finalToPay.toFixed(2)}€</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => onConfirmMode('Efectivo')} disabled={finalToPay <= 0}>Efectivo</button>
                    <button className="btn-primary" style={{ background: '#3b82f6' }} onClick={() => onConfirmMode('Tarjeta')} disabled={finalToPay <= 0}>Tarjeta</button>
                </div>
            </motion.div>
        </div>
    );
};

export default PartialPaymentModal;
