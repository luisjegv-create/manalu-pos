import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Printer, FileText, Banknote, CreditCard,
    Trash2
} from 'lucide-react';
import { printBillTicket } from '../../utils/printHelpers';

const PaymentModal = ({
    isOpen,
    onClose,
    currentTable,
    bill,
    calculateBillTotal,
    restaurantInfo,
    discountPercent,
    setDiscountPercent,
    isInvitation,
    setIsInvitation,
    isFullInvoice,
    setIsFullInvoice,
    customerTaxData,
    setCustomerTaxData,
    handleCloseTable
}) => {
    const [amountReceived, setAmountReceived] = React.useState('');
    const [cardTips, setCardTips] = React.useState('');

    if (!isOpen) return null;

    const totalBill = calculateBillTotal();
    const discountAmount = isInvitation ? totalBill : (totalBill * discountPercent / 100);
    const finalTotal = Math.max(0, totalBill - discountAmount);

    const changeDue = amountReceived ? Math.max(0, parseFloat(amountReceived) - finalTotal) : 0;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', border: '1px solid var(--color-primary)' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Printer size={24} /> Cobro de Mesa</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => printBillTicket(currentTable?.name || 'Mesa', bill, totalBill, restaurantInfo, discountPercent, isInvitation, 'BORRADOR')}
                            style={{ background: '#f59e0b', border: 'none', color: 'black', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            📄 Borrador
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                    </div>
                </div>

                {/* Discount & Invitation Controls (Optimized spacing) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', display: 'block' }}>Descuento (%)</label>
                            <input
                                type="number"
                                value={discountPercent || ''}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setDiscountPercent(Math.min(100, Math.max(0, val)));
                                    if (val > 0) setIsInvitation(false);
                                }}
                                disabled={isInvitation}
                                style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', textAlign: 'center' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[5, 10, 15].map(p => (
                                <button
                                    key={p}
                                    onClick={() => { setDiscountPercent(p); setIsInvitation(false); }}
                                    style={{
                                        padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid',
                                        borderColor: discountPercent === p ? 'var(--color-primary)' : 'var(--glass-border)',
                                        background: discountPercent === p ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                        color: discountPercent === p ? 'var(--color-primary)' : 'white',
                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}
                                >
                                    {p}%
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => {
                                setIsInvitation(!isInvitation);
                                if (!isInvitation) setDiscountPercent(0);
                            }}
                            style={{
                                flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid',
                                borderColor: isInvitation ? '#10b981' : 'var(--glass-border)',
                                background: isInvitation ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: isInvitation ? '#10b981' : 'white',
                                fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
                            }}
                        >
                            {isInvitation ? '🎁 Invitación' : '🎁 Invitar'}
                        </button>

                        <button
                            onClick={() => setIsFullInvoice(!isFullInvoice)}
                            style={{
                                flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid',
                                borderColor: isFullInvoice ? 'var(--color-primary)' : 'var(--glass-border)',
                                background: isFullInvoice ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
                            }}
                        >
                            {isFullInvoice ? '📄 Factura' : '📄 Factura'}
                        </button>
                    </div>

                    {isFullInvoice && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <input
                                placeholder="Nombre / Razón Social"
                                value={customerTaxData.name}
                                onChange={(e) => setCustomerTaxData({ ...customerTaxData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.75rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    placeholder="NIF / CIF"
                                    value={customerTaxData.nif}
                                    onChange={(e) => setCustomerTaxData({ ...customerTaxData, nif: e.target.value })}
                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.75rem' }}
                                />
                                <input
                                    placeholder="Domicilio"
                                    value={customerTaxData.address}
                                    onChange={(e) => setCustomerTaxData({ ...customerTaxData, address: e.target.value })}
                                    style={{ flex: 2, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.75rem' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* PAYMENT HELPERS (Cash received & Tips) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Entregado (Efectivo)</label>
                            <input
                                type="number"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                placeholder="0.00€"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#10b981', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Propina (Tarjeta)</label>
                            <input
                                type="number"
                                value={cardTips}
                                onChange={(e) => setCardTips(e.target.value)}
                                placeholder="0.00€"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fbbf24', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}
                            />
                        </div>
                    </div>

                    {amountReceived && parseFloat(amountReceived) > finalTotal && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid #10b981' }}>
                            <span style={{ fontWeight: 'bold', color: '#10b981' }}>CAMBIO A DEVOLVER:</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981' }}>{changeDue.toFixed(2)}€</span>
                        </div>
                    )}
                </div>

                {/* Ticket Mockup Style */}
                <div style={{
                    maxHeight: '25vh', overflowY: 'auto',
                    background: 'white', color: 'black', padding: '1.25rem', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: "'Courier New', Courier, monospace"
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '0.75rem', borderBottom: '1px dashed #ccc', paddingBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>{restaurantInfo.name.toUpperCase()}</h4>
                        <div style={{ fontSize: '0.7rem' }}>{currentTable?.name || 'MESA'}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.75rem' }}>
                        {bill.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span>{item.name} (x{item.quantity})</span>
                                </div>
                                <span>{(item.price * item.quantity).toFixed(2)}€</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold' }}>
                            <span>TOTAL:</span>
                            <span>{finalTotal.toFixed(2)}€</span>
                        </div>
                        {cardTips > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                                <span>+ Propina Tarjeta:</span>
                                <span>{parseFloat(cardTips).toFixed(2)}€</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        style={{ background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
                        onClick={() => handleCloseTable('Efectivo', amountReceived)}
                    >
                        <Banknote size={20} /> Efectivo
                    </button>
                    <button
                        className="btn-primary"
                        style={{ background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
                        onClick={() => handleCloseTable('Tarjeta', 0, cardTips)}
                    >
                        <CreditCard size={20} /> Tarjeta
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentModal;
