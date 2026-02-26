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
    handleConfirmPartialPayment
}) => {
    if (!isOpen) return null;

    const totalToPay = itemsToPay.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const discountAmount = isInvitation ? totalToPay : (totalToPay * discountPercent / 100);
    const finalToPay = Math.max(0, totalToPay - discountAmount);

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
                    <h2 style={{ margin: 0 }}>Cobrar por Partes</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '40vh', overflowY: 'auto' }}>
                    {bill.map(item => {
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
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Descuento (%)</label>
                            <input type="number" value={discountPercent || ''} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }} />
                        </div>
                        <button onClick={() => setIsInvitation(!isInvitation)} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid', borderColor: isInvitation ? '#10b981' : 'var(--glass-border)', background: isInvitation ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: isInvitation ? '#10b981' : 'white', fontSize: '0.8rem' }}>🎁</button>
                    </div>

                    <button onClick={() => setIsFullInvoice(!isFullInvoice)} style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}>
                        <FileText size={14} /> {isFullInvoice ? 'Factura Solicitada' : 'Solicitar Factura'}
                    </button>
                    {isFullInvoice && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <input placeholder="Nombre" value={customerTaxData.name} onChange={(e) => setCustomerTaxData({ ...customerTaxData, name: e.target.value })} style={{ width: '100%', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', fontSize: '0.75rem' }} />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    <span>Total Parcial:</span>
                    <span style={{ color: 'var(--color-primary)' }}>{finalToPay.toFixed(2)}€</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => handleConfirmPartialPayment('Efectivo')} disabled={itemsToPay.length === 0}>Efectivo</button>
                    <button className="btn-primary" style={{ background: '#3b82f6' }} onClick={() => handleConfirmPartialPayment('Tarjeta')} disabled={itemsToPay.length === 0}>Tarjeta</button>
                </div>
            </motion.div>
        </div>
    );
};

export default PartialPaymentModal;
