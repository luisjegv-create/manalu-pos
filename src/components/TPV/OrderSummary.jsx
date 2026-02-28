import React from 'react';
import {
    User, Plus, Star, Utensils, MessageSquare,
    Trash2, Minus, Wine, ArrowLeft, Send, Printer, CreditCard, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderSummary = ({
    isMobile,
    setShowOrderMobile,
    selectedCustomer,
    selectCustomer,
    showCustomerSearch,
    setShowCustomerSearch,
    customerSearchQuery,
    setCustomerSearchQuery,
    customers,
    salesProducts,
    addToOrder,
    order,
    bill,
    calculateTotal,
    calculateBillTotal,
    removeFromOrder,
    updateQuantity,
    updateItemNote,
    editingNoteId,
    setEditingNoteId,
    noteDraft,
    setNoteDraft,
    handleSendOrder,
    setIsPaymentModalOpen,
    setPartialPaymentModal,
    currentTable
}) => {
    return (
        <div style={{
            width: isMobile ? '100%' : '480px',
            height: isMobile ? '100%' : 'auto',
            position: isMobile ? 'fixed' : 'relative',
            top: 0,
            right: 0,
            zIndex: 150, // Above bottom nav (100)
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: isMobile ? 'none' : '-10px 0 40px rgba(0,0,0,0.4)',
            paddingBottom: isMobile ? '60px' : '0' // Extra room for safe areas
        }}>
            {isMobile && (
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => setShowOrderMobile(false)}
                        style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <ArrowLeft size={20} /> Volver a la Carta
                    </button>
                </div>
            )}

            {/* Customer Selector */}
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(59, 130, 246, 0.1)' }}>
                {selectedCustomer ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--color-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                            }}>
                                <User size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#ffffff' }}>{selectedCustomer.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>{selectedCustomer.points} pts acumulados</div>
                            </div>
                        </div>
                        <button
                            onClick={() => selectCustomer(null)}
                            style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ff8a8a', cursor: 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 'bold' }}
                        >
                            Cambiar
                        </button>
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px dashed rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                color: '#cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            <Plus size={18} /> Asignar Cliente (Fidelización)
                        </button>
                        {showCustomerSearch && (
                            <div className="glass-panel" style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10, padding: '0.5rem', maxHeight: '200px', overflowY: 'auto', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <input
                                    autoFocus
                                    placeholder="Buscar por nombre..."
                                    value={customerSearchQuery}
                                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', marginBottom: '0.5rem' }}
                                />
                                {customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())).map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => { selectCustomer(c); setShowCustomerSearch(false); }}
                                        style={{ padding: '0.75rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                    >
                                        <div style={{ fontWeight: '500', color: 'white' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{c.phone}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recommendations */}
            {
                selectedCustomer && selectedCustomer.favorites && selectedCustomer.favorites.length > 0 && (
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            <Star size={14} fill="currentColor" /> RECOMENDACIONES
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.3rem', scrollbarWidth: 'none' }}>
                            {selectedCustomer.favorites.map(favName => {
                                const prod = salesProducts.find(p => p.name === favName);
                                if (!prod) return null;
                                return (
                                    <button
                                        key={prod.id}
                                        onClick={() => addToOrder(prod)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#ffffff', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                    >
                                        {prod.image} {prod.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )
            }

            <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text)', fontWeight: '800' }}>
                    Comanda {currentTable ? `Mesa: ${currentTable.name}` : ''}
                </h2>
                <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-primary)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontWeight: 'bold'
                }}>
                    {order.length + (bill?.length || 0)} {(order.length + (bill?.length || 0)) === 1 ? 'item' : 'items'}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <AnimatePresence mode='popLayout'>
                    {order.length === 0 && (!bill || bill.length === 0) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', opacity: 0.3 }}>
                            <Utensils size={48} />
                            <p style={{ marginTop: '1rem', fontWeight: '500' }}>Selecciona productos</p>
                        </div>
                    ) : (
                        <>
                            {/* Draft Items (Unsended) */}
                            {order.map(item => (
                                <motion.div
                                    key={item.uniqueId || item.id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '1.25rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                flexShrink: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                background: 'rgba(0,0,0,0.3)',
                                                borderRadius: '10px',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {(String(item.image || '').startsWith('data:image') || String(item.image || '').startsWith('http') || String(item.image || '').startsWith('/'))
                                                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : item.image || '🍽️'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', color: 'var(--color-text)', fontSize: '1.1rem', lineHeight: '1.2' }}>{item.name}</div>
                                                <div style={{ fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 'bold', marginTop: '4px' }}>{item.price.toFixed(2)}€</div>
                                            </div>
                                        </div>

                                        {/* Action Column for item */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text)' }}>{(item.price * item.quantity).toFixed(2)}€</div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.2rem',
                                                background: '#ffffff',
                                                borderRadius: '25px',
                                                padding: '4px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                                            }}>
                                                <button
                                                    onClick={() => item.quantity === 1 ? removeFromOrder(item.uniqueId || item.id) : updateQuantity(item.uniqueId || item.id, -1)}
                                                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    {item.quantity === 1 ? <Trash2 size={18} color="#ef4444" /> : <Minus size={18} />}
                                                </button>
                                                <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '900', color: '#1e293b', fontSize: '1.1rem' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.uniqueId || item.id, 1)}
                                                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modifiers and Notes Grid */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {item.selectedModifiers && Object.entries(item.selectedModifiers).map(([key, value]) => (
                                            <span key={key} style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#4ade80', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 'bold' }}>
                                                {value}
                                            </span>
                                        ))}

                                        {item.notes && editingNoteId !== item.uniqueId && (
                                            <div style={{ width: '100%', fontSize: '0.85rem', color: '#fbbf24', padding: '6px 10px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', fontStyle: 'italic', border: '1px dashed rgba(251, 191, 36, 0.3)' }}>
                                                <MessageSquare size={12} style={{ display: 'inline', marginRight: '5px' }} />
                                                {item.notes}
                                            </div>
                                        )}
                                    </div>

                                    {editingNoteId === item.uniqueId && (
                                        <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={noteDraft}
                                                onChange={(e) => setNoteDraft(e.target.value)}
                                                placeholder="Nota para cocina..."
                                                autoFocus
                                                className="glass-panel"
                                                style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', color: 'white', border: '1px solid var(--color-primary)' }}
                                            />
                                            <button onClick={() => { updateItemNote(item.uniqueId, noteDraft); setEditingNoteId(null); }} className="btn-primary" style={{ padding: '0.6rem 1rem' }}>OK</button>
                                        </div>
                                    )}

                                    {/* Quick Notes Buttons Row */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                                        <button
                                            onClick={() => { setEditingNoteId(editingNoteId === item.uniqueId ? null : item.uniqueId); setNoteDraft(item.notes || ''); }}
                                            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid var(--border-strong)', color: 'var(--color-text)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                        >
                                            <MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }} /> Personalizar
                                        </button>
                                        {['Poco hecho', 'Muy hecho', 'Celiaco', 'Vegano', 'Sin cebolla'].map(qn => (
                                            <button
                                                key={qn}
                                                onClick={() => updateItemNote(item.uniqueId, qn)}
                                                style={{
                                                    fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                                                    background: item.notes === qn ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                                    color: item.notes === qn ? '#60a5fa' : '#94a3b8',
                                                    cursor: 'pointer',
                                                    fontWeight: item.notes === qn ? 'bold' : 'normal'
                                                }}
                                            >
                                                {qn}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Already sent Items (Bill) */}
                            {bill && bill.length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '0.75rem', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.5rem' }}>
                                        ENVIADO A COCINA / CUENTA ACTIVA
                                    </div>
                                    {bill.map(item => (
                                        <div key={item.uniqueId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', opacity: 0.8 }}>
                                            <span style={{ fontSize: '0.9rem' }}>{item.quantity}x {item.name}</span>
                                            <span style={{ fontWeight: 'bold' }}>{(item.price * item.quantity).toFixed(2)}€</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Actions */}
            <div style={{
                padding: '1.5rem',
                background: 'rgba(0,0,0,0.4)',
                borderTop: '2px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>TOTAL CUENTA</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-text)', lineHeight: '1' }}>{(order.length > 0 ? calculateTotal() : calculateBillTotal()).toFixed(2)}€</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    <button
                        className="btn-primary"
                        style={{
                            gridColumn: 'span 2',
                            padding: '1.25rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '1.1rem',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                            opacity: order.length === 0 ? 0.5 : 1
                        }}
                        onClick={handleSendOrder}
                        disabled={order.length === 0}
                    >
                        <Send size={20} /> ENVIAR
                    </button>

                    <button
                        className="btn-icon-circle"
                        style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '16px',
                            background: '#fbbf24',
                            color: '#000',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Imprimir ticket pre-cuenta"
                    >
                        <Printer size={24} />
                    </button>

                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        disabled={order.length === 0 && (!bill || bill.length === 0)}
                        className="btn-icon-circle"
                        style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '16px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: (order.length === 0 && (!bill || bill.length === 0)) ? 0.5 : 1
                        }}
                        title="Cobrar Mesa"
                    >
                        <Wine size={24} />
                    </button>

                    <button
                        onClick={() => setPartialPaymentModal({ isOpen: true, itemsToPay: [] })}
                        style={{
                            gridColumn: 'span 2',
                            padding: '0.75rem',
                            fontSize: '0.9rem',
                            borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid var(--color-primary)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontWeight: 'bold'
                        }}
                    >
                        <CreditCard size={18} /> Cobrar Partes
                    </button>

                    <button
                        style={{
                            gridColumn: 'span 2',
                            padding: '0.75rem',
                            fontSize: '0.9rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontWeight: 'bold'
                        }}
                    >
                        <Receipt size={18} /> Cuenta (0.00€)
                    </button>
                </div>
            </div>
        </div >
    );
};

export default OrderSummary;
