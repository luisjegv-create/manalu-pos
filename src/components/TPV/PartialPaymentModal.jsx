import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Minus, Plus, Banknote, CreditCard,
    FileText, Zap, Users, ShoppingBag, DollarSign,
    CheckCircle, AlertCircle, ArrowRight
} from 'lucide-react';

const PartialPaymentModal = ({
    isOpen,
    onClose,
    bill = [],
    itemsToPay = [],
    updatePartialQuantity,
    discountPercent = 0,
    setDiscountPercent,
    isInvitation = false,
    setIsInvitation,
    isFullInvoice = false,
    setIsFullInvoice,
    customerTaxData = { name: '', nif: '', address: '' },
    setCustomerTaxData,
    handleConfirmPartialPayment,
    currentTable = null,
    tablePaidAmount = 0,
    pendingBalance = null
}) => {
    // Modes: 'products' | 'equal' | 'custom'
    const [mode, setMode] = useState('products');
    
    // Equal split state
    const [numPeople, setNumPeople] = useState(2);
    const [currentDiner, setCurrentDiner] = useState(1);
    
    // Custom amount state
    const [customAmount, setCustomAmount] = useState('');
    
    // Payment method state: 'Efectivo' | 'Tarjeta' | 'Mixto'
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    
    // Mixed payment state
    const [mixtoCash, setMixtoCash] = useState('');
    const [mixtoCard, setMixtoCard] = useState('');
    
    // Cash received & change calculation
    const [cashReceived, setCashReceived] = useState('');
    
    // Tips state
    const [isAddingTip, setIsAddingTip] = useState(false);
    const [tipAmount, setTipAmount] = useState('');

    // Filter genuine bill items
    const rawBill = (bill || []).filter(i => i.id !== 'payment-credit' && i.category !== 'Pagos');
    const totalOriginalBill = rawBill.reduce((acc, curr) => acc + (curr.isInvitation ? 0 : (curr.price * curr.quantity)), 0);
    const alreadyPaid = parseFloat(tablePaidAmount) || 0;
    const currentPending = pendingBalance !== null && pendingBalance !== undefined
        ? parseFloat(pendingBalance)
        : Math.max(0, totalOriginalBill - alreadyPaid);

    // Calculate total to pay according to current mode
    let totalToPay = 0;
    if (mode === 'products') {
        totalToPay = (itemsToPay || []).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    } else if (mode === 'equal') {
        const people = Math.max(1, parseInt(numPeople) || 1);
        totalToPay = Math.min(currentPending, Math.round((currentPending / people) * 100) / 100);
    } else if (mode === 'custom') {
        totalToPay = Math.min(currentPending, parseFloat(customAmount) || 0);
    }

    const discountAmt = isInvitation ? totalToPay : (totalToPay * (parseFloat(discountPercent) || 0) / 100);
    const finalToPay = Math.max(0, Math.round((totalToPay - discountAmt) * 100) / 100);

    // Auto-update mixed amounts when finalToPay changes or method is set to 'Mixto'
    useEffect(() => {
        if (paymentMethod === 'Mixto' && finalToPay > 0) {
            const half = Math.round((finalToPay / 2) * 100) / 100;
            setMixtoCash(half.toString());
            setMixtoCard((Math.round((finalToPay - half) * 100) / 100).toString());
        }
    }, [paymentMethod, finalToPay]);

    // Handle manual edit in mixed cash input
    const handleMixtoCashChange = (val) => {
        setMixtoCash(val);
        const parsedCash = parseFloat(val) || 0;
        const remainder = Math.max(0, Math.round((finalToPay - parsedCash) * 100) / 100);
        setMixtoCard(remainder.toString());
    };

    // Handle manual edit in mixed card input
    const handleMixtoCardChange = (val) => {
        setMixtoCard(val);
        const parsedCard = parseFloat(val) || 0;
        const remainder = Math.max(0, Math.round((finalToPay - parsedCard) * 100) / 100);
        setMixtoCash(remainder.toString());
    };

    // Quick cash shortcuts
    const handleQuickCash = (amount) => {
        setCashReceived(amount.toString());
    };

    // Remaining on table after this payment
    const remainingAfterPayment = Math.max(0, Math.round((currentPending - finalToPay) * 100) / 100);

    // Calculate change
    const cashPortionNeeded = paymentMethod === 'Mixto' ? (parseFloat(mixtoCash) || 0) : (paymentMethod === 'Efectivo' ? finalToPay : 0);
    const enteredCash = parseFloat(cashReceived) || 0;
    const changeToReturn = enteredCash > cashPortionNeeded ? (enteredCash - cashPortionNeeded) : 0;

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (finalToPay <= 0) {
            alert('Por favor, selecciona productos o introduce un importe válido a cobrar.');
            return;
        }

        if (paymentMethod === 'Mixto') {
            const cVal = parseFloat(mixtoCash) || 0;
            const tVal = parseFloat(mixtoCard) || 0;
            if (Math.abs((cVal + tVal) - finalToPay) > 0.05) {
                alert(`La suma de Efectivo (${cVal.toFixed(2)}€) y Tarjeta (${tVal.toFixed(2)}€) debe coincidir con el total a cobrar (${finalToPay.toFixed(2)}€).`);
                return;
            }
        }

        const finalTip = isAddingTip ? (parseFloat(tipAmount) || 0) : 0;

        let dinerText = '';
        if (mode === 'equal') {
            dinerText = `Comensal ${currentDiner} de ${numPeople}`;
        } else if (mode === 'products') {
            dinerText = 'Por Productos';
        } else {
            dinerText = 'Cobro A Cuenta';
        }

        const payload = {
            method: paymentMethod,
            mode,
            totalToPay: finalToPay,
            rawAmount: totalToPay,
            tips: finalTip,
            cashReceived: enteredCash > 0 ? enteredCash : (paymentMethod === 'Efectivo' ? finalToPay : 0),
            change: changeToReturn,
            mixedDetails: paymentMethod === 'Mixto' ? {
                cashAmount: parseFloat(mixtoCash) || 0,
                cardAmount: parseFloat(mixtoCard) || 0
            } : null,
            dinerPartText: dinerText,
            dinerNumber: currentDiner,
            numPeople
        };

        handleConfirmPartialPayment(payload);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '1rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="glass-panel"
                style={{
                    padding: '1.75rem',
                    width: '100%',
                    maxWidth: '680px',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    border: '2px solid var(--color-primary)',
                    borderRadius: '20px',
                    overflowY: 'auto',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
                }}
            >
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span>✂️</span> Dividir Cuenta / Cobro Parcial
                        </h2>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
                            {currentTable ? currentTable.name : 'Mesa'} · Total Comanda: <strong>{totalOriginalBill.toFixed(2)}€</strong>
                            {alreadyPaid > 0 && <span style={{ color: '#10b981', marginLeft: '6px' }}>(Abonado: {alreadyPaid.toFixed(2)}€)</span>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* STATUS BAR: Original vs Paid vs Pending */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Pedido</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{totalOriginalBill.toFixed(2)}€</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Ya Cobrado</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>{alreadyPaid.toFixed(2)}€</div>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.15)', borderRadius: '8px', padding: '2px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>PENDIENTE AHORA</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#fbbf24' }}>{currentPending.toFixed(2)}€</div>
                    </div>
                </div>

                {/* MODE SELECTION TABS */}
                <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.35)', padding: '4px', borderRadius: '12px' }}>
                    <button
                        onClick={() => setMode('products')}
                        style={{
                            flex: 1,
                            padding: '0.7rem 0.5rem',
                            border: 'none',
                            borderRadius: '8px',
                            background: mode === 'products' ? 'var(--color-primary)' : 'transparent',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ShoppingBag size={16} /> Por Productos
                    </button>
                    <button
                        onClick={() => setMode('equal')}
                        style={{
                            flex: 1,
                            padding: '0.7rem 0.5rem',
                            border: 'none',
                            borderRadius: '8px',
                            background: mode === 'equal' ? 'var(--color-primary)' : 'transparent',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Users size={16} /> Partes Iguales
                    </button>
                    <button
                        onClick={() => setMode('custom')}
                        style={{
                            flex: 1,
                            padding: '0.7rem 0.5rem',
                            border: 'none',
                            borderRadius: '8px',
                            background: mode === 'custom' ? 'var(--color-primary)' : 'transparent',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <DollarSign size={16} /> Importe Libre
                    </button>
                </div>

                {/* MODE CONTENTS */}
                <div style={{ maxHeight: '28vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* MODE 1: PRODUCTS */}
                    {mode === 'products' && (
                        rawBill.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                No hay productos pendientes en la comanda.
                            </div>
                        ) : (
                            rawBill.map(item => {
                                const selectedItem = (itemsToPay || []).find(i => i.uniqueId === item.uniqueId);
                                const currentQty = selectedItem ? selectedItem.quantity : 0;
                                const isSelected = currentQty > 0;

                                return (
                                    <div
                                        key={item.uniqueId}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem 1rem',
                                            background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                            border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                                            borderRadius: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                {item.price.toFixed(2)}€/ud · Pendiente: {item.quantity} ud.
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,0,0,0.3)', borderRadius: '25px', padding: '3px 6px' }}>
                                                <button
                                                    onClick={() => updatePartialQuantity(item, -1)}
                                                    disabled={currentQty === 0}
                                                    style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: currentQty > 0 ? '#ef4444' : '#475569', cursor: currentQty > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 'bold' }}>{currentQty}</span>
                                                <button
                                                    onClick={() => updatePartialQuantity(item, 1)}
                                                    disabled={currentQty >= item.quantity}
                                                    style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: currentQty < item.quantity ? '#10b981' : '#475569', cursor: currentQty < item.quantity ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div style={{ width: '65px', textAlign: 'right', fontWeight: 'bold', color: isSelected ? 'var(--color-primary)' : 'inherit' }}>
                                                {(item.price * currentQty).toFixed(2)}€
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}

                    {/* MODE 2: EQUAL SPLIT */}
                    {mode === 'equal' && (
                        <div style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.95rem', color: '#94a3b8' }}>¿Entre cuántas partes dividimos el pendiente?</div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                                <button
                                    onClick={() => setNumPeople(Math.max(2, numPeople - 1))}
                                    className="glass-panel"
                                    style={{ width: '44px', height: '44px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
                                >
                                    -
                                </button>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary)', lineHeight: 1 }}>{numPeople}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>comensales</span>
                                </div>
                                <button
                                    onClick={() => setNumPeople(numPeople + 1)}
                                    className="glass-panel"
                                    style={{ width: '44px', height: '44px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
                                >
                                    +
                                </button>
                            </div>

                            {/* Diner tracker */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                {Array.from({ length: numPeople }).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentDiner(idx + 1)}
                                        style={{
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '20px',
                                            border: '1px solid',
                                            borderColor: currentDiner === (idx + 1) ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                            background: currentDiner === (idx + 1) ? 'rgba(59, 130, 246, 0.25)' : 'rgba(0,0,0,0.2)',
                                            color: currentDiner === (idx + 1) ? '#93c5fd' : '#94a3b8',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Comensal {idx + 1}
                                    </button>
                                ))}
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Este comensal paga exactamente:</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10b981' }}>{totalToPay.toFixed(2)}€</div>
                            </div>
                        </div>
                    )}

                    {/* MODE 3: CUSTOM AMOUNT */}
                    {mode === 'custom' && (
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center' }}>
                                Importe a cobrar en este pago (Máx {currentPending.toFixed(2)}€):
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        fontSize: '1.8rem',
                                        textAlign: 'center',
                                        background: 'rgba(0,0,0,0.35)',
                                        border: '2px solid var(--color-primary)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        fontWeight: '900',
                                        outline: 'none'
                                    }}
                                    autoFocus
                                />
                            </div>

                            {/* Preset Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                                {[5, 10, 20, 50].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setCustomAmount(Math.min(currentPending, val).toString())}
                                        disabled={val > currentPending && currentPending > 0}
                                        style={{
                                            padding: '0.45rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {val}€
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCustomAmount(currentPending.toFixed(2))}
                                    style={{
                                        padding: '0.45rem',
                                        borderRadius: '8px',
                                        border: '1px solid #10b981',
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        color: '#34d399',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    Todo ({currentPending.toFixed(2)}€)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* PAYMENT METHOD SELECTOR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#94a3b8' }}>
                        FORMA DE PAGO DE ESTA PARTE:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('Efectivo')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '10px',
                                border: '2px solid',
                                borderColor: paymentMethod === 'Efectivo' ? '#10b981' : 'transparent',
                                background: paymentMethod === 'Efectivo' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                                color: paymentMethod === 'Efectivo' ? '#34d399' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Banknote size={18} /> Efectivo
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('Tarjeta')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '10px',
                                border: '2px solid',
                                borderColor: paymentMethod === 'Tarjeta' ? '#3b82f6' : 'transparent',
                                background: paymentMethod === 'Tarjeta' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                                color: paymentMethod === 'Tarjeta' ? '#93c5fd' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}
                        >
                            <CreditCard size={18} /> Tarjeta
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('Mixto')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '10px',
                                border: '2px solid',
                                borderColor: paymentMethod === 'Mixto' ? '#f59e0b' : 'transparent',
                                background: paymentMethod === 'Mixto' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.05)',
                                color: paymentMethod === 'Mixto' ? '#fcd34d' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Zap size={18} /> ⚡ Mixto (Ambos)
                        </button>
                    </div>
                </div>

                {/* MIXED PAYMENT CONTROLS */}
                {paymentMethod === 'Mixto' && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '12px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fbbf24' }}>
                                Desglose de este cobro ({finalToPay.toFixed(2)}€):
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    const half = Math.round((finalToPay / 2) * 100) / 100;
                                    setMixtoCash(half.toString());
                                    setMixtoCard((Math.round((finalToPay - half) * 100) / 100).toString());
                                }}
                                style={{
                                    background: 'rgba(245, 158, 11, 0.2)',
                                    border: '1px solid #f59e0b',
                                    color: '#fbbf24',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                50% / 50%
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                    <Banknote size={14} /> Parte en Efectivo:
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={mixtoCash}
                                    onChange={(e) => handleMixtoCashChange(e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid #10b981',
                                        borderRadius: '8px',
                                        color: '#34d399',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                    <CreditCard size={14} /> Parte en Tarjeta:
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={mixtoCard}
                                    onChange={(e) => handleMixtoCardChange(e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '8px',
                                        color: '#93c5fd',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* CASH RECEIVED & CHANGE (Visible for Efectivo or Mixto) */}
                {(paymentMethod === 'Efectivo' || paymentMethod === 'Mixto') && (
                    <div style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid var(--glass-border)',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Dinero entregado en efectivo ({cashPortionNeeded.toFixed(2)}€ a cobrar):
                            </span>
                            {enteredCash > 0 && (
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    color: changeToReturn > 0 ? '#10b981' : '#94a3b8'
                                }}>
                                    Cambio: <strong>{changeToReturn.toFixed(2)}€</strong>
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <input
                                type="number"
                                step="0.01"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                placeholder={`Exacto (${cashPortionNeeded.toFixed(2)}€)`}
                                style={{
                                    flex: 1,
                                    padding: '0.55rem',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    textAlign: 'center'
                                }}
                            />
                            {[5, 10, 20, 50].map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleQuickCash(val)}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {val}€
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleQuickCash(cashPortionNeeded)}
                                style={{
                                    padding: '0.4rem 0.6rem',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid #10b981',
                                    borderRadius: '6px',
                                    color: '#34d399',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Exacto
                            </button>
                        </div>
                    </div>
                )}

                {/* CARD TIP OPTION (Visible for Tarjeta or Mixto) */}
                {(paymentMethod === 'Tarjeta' || paymentMethod === 'Mixto') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isAddingTip ? (
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    step="0.5"
                                    placeholder="Importe propina €"
                                    value={tipAmount}
                                    onChange={(e) => setTipAmount(e.target.value)}
                                    style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid #3b82f6', background: 'rgba(0,0,0,0.3)', color: 'white', textAlign: 'center' }}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsAddingTip(false)}
                                    style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    OK
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAddingTip(true)}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px dashed #3b82f6',
                                    background: 'transparent',
                                    color: '#60a5fa',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                }}
                            >
                                + Añadir Propina (Tarjeta)
                            </button>
                        )}
                    </div>
                )}

                {/* DISCOUNT & INVOICE ROW */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Descuento:</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0%"
                                value={discountPercent || ''}
                                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                                style={{ width: '70px', padding: '0.35rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>%</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsInvitation(!isInvitation)}
                            style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: isInvitation ? '#10b981' : 'var(--glass-border)',
                                background: isInvitation ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                color: isInvitation ? '#10b981' : '#94a3b8',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🎁 Invitación (100%)
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsFullInvoice(!isFullInvoice)}
                        style={{
                            width: '100%',
                            padding: '0.35rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                        }}
                    >
                        <FileText size={13} /> {isFullInvoice ? 'Factura Solicitada' : 'Solicitar Factura Simplificada'}
                    </button>
                    {isFullInvoice && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '4px' }}>
                            <input
                                placeholder="Nombre / Razón Social"
                                value={customerTaxData.name}
                                onChange={(e) => setCustomerTaxData({ ...customerTaxData, name: e.target.value })}
                                style={{ padding: '0.35rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.75rem', borderRadius: '4px' }}
                            />
                            <input
                                placeholder="NIF / CIF"
                                value={customerTaxData.nif}
                                onChange={(e) => setCustomerTaxData({ ...customerTaxData, nif: e.target.value })}
                                style={{ padding: '0.35rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.75rem', borderRadius: '4px' }}
                            />
                        </div>
                    )}
                </div>

                {/* BOTTOM SUMMARY & CONFIRM BUTTON */}
                <div style={{
                    borderTop: '2px solid var(--glass-border)',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Este Cobro:</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--color-primary)', lineHeight: 1 }}>
                                {finalToPay.toFixed(2)}€
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Quedará en mesa:</div>
                            <div style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: remainingAfterPayment <= 0.01 ? '#10b981' : '#f59e0b'
                            }}>
                                {remainingAfterPayment <= 0.01 ? '0.00€ (Saldada)' : `${remainingAfterPayment.toFixed(2)}€`}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={finalToPay <= 0}
                        style={{
                            width: '100%',
                            padding: '1.1rem',
                            borderRadius: '14px',
                            border: 'none',
                            background: finalToPay <= 0
                                ? '#475569'
                                : paymentMethod === 'Mixto'
                                    ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                                    : paymentMethod === 'Tarjeta'
                                        ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                                        : 'linear-gradient(135deg, #059669, #10b981)',
                            color: 'white',
                            fontSize: '1.1rem',
                            fontWeight: '900',
                            cursor: finalToPay <= 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.6rem',
                            boxShadow: finalToPay > 0 ? '0 8px 25px rgba(0,0,0,0.3)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>CONFIRMAR COBRO ({paymentMethod.toUpperCase()})</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PartialPaymentModal;
