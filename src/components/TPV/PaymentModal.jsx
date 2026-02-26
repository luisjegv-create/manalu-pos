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
    removeProductFromBill,
    handleCloseTable
}) => {
    if (!isOpen) return null;

    const totalBill = calculateBillTotal();
    const subtotal = totalBill / 1.1;
    const iva = totalBill - subtotal;
    const discountAmount = isInvitation ? totalBill : (totalBill * discountPercent / 100);
    const finalTotal = Math.max(0, totalBill - discountAmount);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', border: '1px solid var(--color-primary)' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Printer size={24} /> Tiket de Venta</h2>
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

                {/* Discount & Invitation Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'block' }}>Descuento (%)</label>
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
                            {[5, 10, 20].map(p => (
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
                    <button
                        onClick={() => {
                            setIsInvitation(!isInvitation);
                            if (!isInvitation) setDiscountPercent(0);
                        }}
                        style={{
                            width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid',
                            borderColor: isInvitation ? '#10b981' : 'var(--glass-border)',
                            background: isInvitation ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: isInvitation ? '#10b981' : 'white',
                            fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem'
                        }}
                    >
                        {isInvitation ? '🎁 Invitación Activa' : '🎁 Invitación Total'}
                    </button>

                    <button
                        onClick={() => setIsFullInvoice(!isFullInvoice)}
                        style={{
                            width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid',
                            borderColor: isFullInvoice ? 'var(--color-primary)' : 'var(--glass-border)',
                            background: isFullInvoice ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem'
                        }}
                    >
                        <FileText size={18} /> {isFullInvoice ? '📄 Factura Solicitada' : '📄 Solicitar Factura'}
                    </button>

                    {isFullInvoice && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                                placeholder="Nombre / Razón Social"
                                value={customerTaxData.name}
                                onChange={(e) => setCustomerTaxData({ ...customerTaxData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    placeholder="NIF / CIF"
                                    value={customerTaxData.nif}
                                    onChange={(e) => setCustomerTaxData({ ...customerTaxData, nif: e.target.value })}
                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                                />
                                <input
                                    placeholder="Domicilio"
                                    value={customerTaxData.address}
                                    onChange={(e) => setCustomerTaxData({ ...customerTaxData, address: e.target.value })}
                                    style={{ flex: 2, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Ticket Mockup Style */}
                <div style={{
                    maxHeight: '40vh', overflowY: 'auto',
                    background: 'white', color: 'black', padding: '1.5rem', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: "'Courier New', Courier, monospace"
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>{restaurantInfo.name.toUpperCase()}</h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                        {bill.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <button onClick={() => removeProductFromBill(currentTable.id, item.uniqueId, item.quantity)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={10} />
                                    </button>
                                    <span>{item.name} (x{item.quantity})</span>
                                </div>
                                <span>{(item.price * item.quantity).toFixed(2)}€</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            <span>TOTAL:</span>
                            <span>{finalTotal.toFixed(2)}€</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        style={{ background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => handleCloseTable('Efectivo')}
                    >
                        <Banknote size={20} /> Efectivo
                    </button>
                    <button
                        className="btn-primary"
                        style={{ background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => handleCloseTable('Tarjeta')}
                    >
                        <CreditCard size={20} /> Tarjeta
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentModal;
