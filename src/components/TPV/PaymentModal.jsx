import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Printer, FileText, Banknote, CreditCard,
    Scissors, Coins, Check, AlertTriangle
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
    handleCloseTable,
    handleCloseTableMixed,
    onOpenSplitModal,
    tablePaidAmount = 0,
    isClosing = false
}) => {
    const [paymentMode, setPaymentMode] = useState('standard'); // 'standard', 'mixed'
    const [amountReceived, setAmountReceived] = useState('');
    const [cardTips, setCardTips] = useState('');

    // Mixed payment states
    const [mixedCash, setMixedCash] = useState('');
    const [mixedCard, setMixedCard] = useState('');
    const [mixedCashReceived, setMixedCashReceived] = useState('');

    // Responsive helper
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Clean items (ignore dummy items)
    const cleanBill = (bill || []).filter(i => i.id !== 'payment-credit' && i.category !== 'Pagos');
    const billItemsTotal = cleanBill.reduce((sum, i) => sum + (i.isInvitation ? 0 : (i.price * i.quantity)), 0);
    const pendingTotal = Math.max(0, billItemsTotal - (parseFloat(tablePaidAmount) || 0));

    const discountAmount = isInvitation ? pendingTotal : (pendingTotal * discountPercent / 100);
    const finalTotal = Math.max(0, pendingTotal - discountAmount);

    // Initialize mixed amounts when opening or switching to mixed mode
    useEffect(() => {
        if (paymentMode === 'mixed') {
            const half = (finalTotal / 2).toFixed(2);
            const remaining = (finalTotal - parseFloat(half)).toFixed(2);
            setMixedCash(half);
            setMixedCard(remaining);
        }
    }, [paymentMode, finalTotal]);

    if (!isOpen) return null;

    // Handlers for mixed inputs
    const handleMixedCashChange = (val) => {
        setMixedCash(val);
        const cashNum = parseFloat(val) || 0;
        const diff = Math.max(0, finalTotal - cashNum);
        setMixedCard(diff.toFixed(2));
    };

    const handleMixedCardChange = (val) => {
        setMixedCard(val);
        const cardNum = parseFloat(val) || 0;
        const diff = Math.max(0, finalTotal - cardNum);
        setMixedCash(diff.toFixed(2));
    };

    const setQuickCash = (amount) => {
        const cashVal = Math.min(finalTotal, amount);
        setMixedCash(cashVal.toFixed(2));
        setMixedCard(Math.max(0, finalTotal - cashVal).toFixed(2));
    };

    const cashNum = parseFloat(mixedCash) || 0;
    const cardNum = parseFloat(mixedCard) || 0;
    const mixedSum = cashNum + cardNum;
    const isMixedBalanced = Math.abs(mixedSum - finalTotal) < 0.01 && finalTotal > 0;
    const mixedDiff = (finalTotal - mixedSum);

    const changeDueStandard = amountReceived ? Math.max(0, parseFloat(amountReceived) - finalTotal) : 0;
    const changeDueMixed = mixedCashReceived ? Math.max(0, parseFloat(mixedCashReceived) - cashNum) : 0;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
            zIndex: 140,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
            paddingRight: isMobile ? '1.5rem' : 'calc(480px + 2rem)'
        }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-panel"
                style={{
                    width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
                    display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem',
                    border: '1px solid var(--color-primary)', borderRadius: '20px'
                }}
            >
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem', fontWeight: '800' }}>
                        <Printer size={22} color="var(--color-primary)" /> Cobro de Mesa
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {onOpenSplitModal && (
                            <button
                                onClick={onOpenSplitModal}
                                title="Dividir ticket entre varios clientes"
                                style={{
                                    background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6',
                                    color: '#c4b5fd', padding: '0.45rem 0.75rem', borderRadius: '8px',
                                    cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
                                    display: 'flex', alignItems: 'center', gap: '0.35rem'
                                }}
                            >
                                <Scissors size={15} /> Dividir Ticket
                            </button>
                        )}
                        <button
                            onClick={() => printBillTicket(currentTable?.name || 'Mesa', cleanBill, finalTotal, restaurantInfo, discountPercent, isInvitation, 'BORRADOR')}
                            style={{ background: '#f59e0b', border: 'none', color: 'black', padding: '0.45rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                        >
                            📄 Borrador
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* NOTICE IF ALREADY PARTIALLY PAID */}
                {tablePaidAmount > 0 && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '10px', padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', fontSize: '0.85rem'
                    }}>
                        <div>
                            <span style={{ color: '#94a3b8' }}>Total Comanda: </span>
                            <strong>{billItemsTotal.toFixed(2)}€</strong>
                            <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>· Ya cobrado: <strong>{parseFloat(tablePaidAmount).toFixed(2)}€</strong></span>
                        </div>
                        <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Resta: {pendingTotal.toFixed(2)}€</span>
                    </div>
                )}

                {/* PAYMENT METHOD TABS (Direct / Mixed) */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.35)', padding: '4px', borderRadius: '12px' }}>
                    <button
                        onClick={() => setPaymentMode('standard')}
                        style={{
                            flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none',
                            background: paymentMode === 'standard' ? 'var(--color-primary)' : 'transparent',
                            color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                        }}
                    >
                        <Banknote size={16} /> Pago Total (Efectivo / Tarjeta)
                    </button>
                    <button
                        onClick={() => {
                            setPaymentMode('mixed');
                            if (!mixedCash && !mixedCard) {
                                const half = (finalTotal / 2).toFixed(2);
                                setMixedCash(half);
                                setMixedCard((finalTotal - parseFloat(half)).toFixed(2));
                            }
                        }}
                        style={{
                            flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none',
                            background: paymentMode === 'mixed' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                            color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                        }}
                    >
                        <Coins size={16} /> ⚡ Pago Mixto (Efectivo + Tarjeta)
                    </button>
                </div>

                {/* DISCOUNT & INVITATION CONTROLS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
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
                                placeholder="0%"
                                style={{ width: '100%', padding: '0.45rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {[5, 10, 15].map(p => (
                                <button
                                    key={p}
                                    onClick={() => { setDiscountPercent(p); setIsInvitation(false); }}
                                    style={{
                                        padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid',
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
                                flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid',
                                borderColor: isInvitation ? '#10b981' : 'var(--glass-border)',
                                background: isInvitation ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: isInvitation ? '#10b981' : 'white',
                                fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
                            }}
                        >
                            {isInvitation ? '🎁 Invitación Activa' : '🎁 Invitar (100%)'}
                        </button>

                        <button
                            onClick={() => setIsFullInvoice(!isFullInvoice)}
                            style={{
                                flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid',
                                borderColor: isFullInvoice ? 'var(--color-primary)' : 'var(--glass-border)',
                                background: isFullInvoice ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
                            }}
                        >
                            <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            {isFullInvoice ? 'Factura Solicitada' : 'Solicitar Factura'}
                        </button>
                    </div>

                    {isFullInvoice && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <input
                                placeholder="Nombre / Razón Social"
                                value={customerTaxData.name}
                                onChange={(e) => setCustomerTaxData({ ...customerTaxData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.45rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <input
                                    placeholder="NIF / CIF"
                                    value={customerTaxData.nif}
                                    onChange={(e) => setCustomerTaxData({ ...customerTaxData, nif: e.target.value })}
                                    style={{ flex: 1, padding: '0.45rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                                />
                                <input
                                    placeholder="Domicilio fiscal"
                                    value={customerTaxData.address}
                                    onChange={(e) => setCustomerTaxData({ ...customerTaxData, address: e.target.value })}
                                    style={{ flex: 2, padding: '0.45rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* MODE A: STANDARD FULL PAYMENT (Efectivo o Tarjeta) */}
                {paymentMode === 'standard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Entregado (Efectivo)</label>
                                <input
                                    type="number"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    placeholder="0.00€"
                                    style={{ width: '100%', padding: '0.65rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#10b981', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Propina (Tarjeta)</label>
                                <input
                                    type="number"
                                    value={cardTips}
                                    onChange={(e) => setCardTips(e.target.value)}
                                    placeholder="0.00€"
                                    style={{ width: '100%', padding: '0.65rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fbbf24', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}
                                />
                            </div>
                        </div>

                        {amountReceived && parseFloat(amountReceived) > finalTotal && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '8px', border: '1px solid #10b981' }}>
                                <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '0.9rem' }}>CAMBIO A DEVOLVER:</span>
                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981' }}>{changeDueStandard.toFixed(2)}€</span>
                            </div>
                        )}
                    </div>
                )}

                {/* MODE B: MIXED PAYMENT (Efectivo + Tarjeta) */}
                {paymentMode === 'mixed' && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '0.85rem',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.05))',
                        padding: '1rem', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#c4b5fd' }}>⚡ Reparto Efectivo y Tarjeta:</span>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                    onClick={() => {
                                        const half = (finalTotal / 2).toFixed(2);
                                        setMixedCash(half);
                                        setMixedCard((finalTotal - parseFloat(half)).toFixed(2));
                                    }}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.2)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    50% / 50%
                                </button>
                                {[10, 20, 50].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setQuickCash(amt)}
                                        style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        {amt}€ Ef
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                            {/* CASH PART */}
                            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                <label style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '800', marginBottom: '0.25rem', display: 'block' }}>
                                    💵 EN EFECTIVO (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={mixedCash}
                                    onChange={(e) => handleMixedCashChange(e.target.value)}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '0.65rem', background: 'rgba(0,0,0,0.4)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', fontSize: '1.25rem', fontWeight: '900', textAlign: 'center' }}
                                />
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Billete Entregado:</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 20€ / 50€"
                                        value={mixedCashReceived}
                                        onChange={(e) => setMixedCashReceived(e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
                                    />
                                    {mixedCashReceived && parseFloat(mixedCashReceived) > cashNum && (
                                        <div style={{ marginTop: '0.35rem', color: '#10b981', fontSize: '0.75rem', fontWeight: '800', textAlign: 'center' }}>
                                            Cambio: {changeDueMixed.toFixed(2)}€
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CARD PART */}
                            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <label style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: '800', marginBottom: '0.25rem', display: 'block' }}>
                                    💳 EN TARJETA (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={mixedCard}
                                    onChange={(e) => handleMixedCardChange(e.target.value)}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '0.65rem', background: 'rgba(0,0,0,0.4)', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: '8px', fontSize: '1.25rem', fontWeight: '900', textAlign: 'center' }}
                                />
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Propina Tarjeta:</label>
                                    <input
                                        type="number"
                                        placeholder="0.00€"
                                        value={cardTips}
                                        onChange={(e) => setCardTips(e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BALANCE VALIDATION */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.5rem 0.75rem', borderRadius: '8px',
                            background: isMixedBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${isMixedBalanced ? '#10b981' : '#ef4444'}`,
                            fontSize: '0.8rem', fontWeight: '700'
                        }}>
                            <span style={{ color: isMixedBalanced ? '#10b981' : '#f87171', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                {isMixedBalanced ? <Check size={16} /> : <AlertTriangle size={16} />}
                                {isMixedBalanced ? 'Suma exacta al total de la cuenta' : `Descuadre: ${Math.abs(mixedDiff).toFixed(2)}€ ${mixedDiff > 0 ? 'faltan' : 'sobran'}`}
                            </span>
                            <span style={{ color: 'white', fontWeight: '900' }}>
                                {mixedSum.toFixed(2)}€ / {finalTotal.toFixed(2)}€
                            </span>
                        </div>
                    </div>
                )}

                {/* TICKET MOCKUP */}
                <div style={{
                    maxHeight: '20vh', overflowY: 'auto',
                    background: 'white', color: 'black', padding: '1rem', borderRadius: '6px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)', fontFamily: "'Courier New', Courier, monospace"
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem', borderBottom: '1px dashed #ccc', paddingBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{restaurantInfo.name.toUpperCase()}</div>
                        <div style={{ fontSize: '0.7rem' }}>{currentTable?.name || 'MESA'}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.5rem' }}>
                        {cleanBill.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span>{item.name} (x{item.quantity})</span>
                                <span>{(item.price * item.quantity).toFixed(2)}€</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid black', paddingTop: '0.4rem' }}>
                        {tablePaidAmount > 0 && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666' }}>
                                    <span>Comanda original:</span>
                                    <span>{billItemsTotal.toFixed(2)}€</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#059669' }}>
                                    <span>Ya cobrado a cuenta:</span>
                                    <span>-{parseFloat(tablePaidAmount).toFixed(2)}€</span>
                                </div>
                            </>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 'bold', marginTop: '2px' }}>
                            <span>TOTAL A COBRAR:</span>
                            <span>{finalTotal.toFixed(2)}€</span>
                        </div>
                        {paymentMode === 'mixed' && isMixedBalanced && (
                            <div style={{ marginTop: '4px', fontSize: '0.75rem', borderTop: '1px dashed #aaa', paddingTop: '3px' }}>
                                <div>• Efectivo: {cashNum.toFixed(2)}€</div>
                                <div>• Tarjeta: {cardNum.toFixed(2)}€</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                {paymentMode === 'standard' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                        <button
                            className="btn-primary"
                            disabled={isClosing}
                            style={{
                                background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                gap: '0.5rem', padding: '0.9rem', opacity: isClosing ? 0.6 : 1, cursor: isClosing ? 'not-allowed' : 'pointer',
                                fontWeight: '800', fontSize: '1rem', borderRadius: '12px'
                            }}
                            onClick={() => handleCloseTable('Efectivo', amountReceived)}
                        >
                            <Banknote size={20} /> {isClosing ? 'Cobrando...' : 'Efectivo'}
                        </button>
                        <button
                            className="btn-primary"
                            disabled={isClosing}
                            style={{
                                background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                gap: '0.5rem', padding: '0.9rem', opacity: isClosing ? 0.6 : 1, cursor: isClosing ? 'not-allowed' : 'pointer',
                                fontWeight: '800', fontSize: '1rem', borderRadius: '12px'
                            }}
                            onClick={() => handleCloseTable('Tarjeta', 0, cardTips)}
                        >
                            <CreditCard size={20} /> {isClosing ? 'Cobrando...' : 'Tarjeta'}
                        </button>
                    </div>
                ) : (
                    <button
                        className="btn-primary"
                        disabled={isClosing || !isMixedBalanced}
                        style={{
                            background: isMixedBalanced ? 'linear-gradient(135deg, #8b5cf6, #10b981)' : '#475569',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem',
                            padding: '1rem', opacity: (isClosing || !isMixedBalanced) ? 0.6 : 1,
                            cursor: (isClosing || !isMixedBalanced) ? 'not-allowed' : 'pointer',
                            fontWeight: '900', fontSize: '1.05rem', borderRadius: '12px',
                            boxShadow: isMixedBalanced ? '0 6px 20px rgba(139, 92, 246, 0.35)' : 'none'
                        }}
                        onClick={() => {
                            if (!isMixedBalanced) return;
                            handleCloseTableMixed(
                                cashNum,
                                cardNum,
                                discountPercent,
                                isInvitation,
                                isFullInvoice ? customerTaxData : null,
                                cardTips,
                                mixedCashReceived
                            );
                        }}
                    >
                        <Coins size={22} />
                        {isClosing ? 'Procesando Cobro...' : `CONFIRMAR COBRO MIXTO (${cashNum.toFixed(2)}€ Efec + ${cardNum.toFixed(2)}€ Tarj)`}
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentModal;
