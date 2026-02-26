import React from 'react';
import {
    User, Plus, Star, Utensils, MessageSquare,
    Trash2, Minus, Wine, ArrowLeft, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderSummary = ({
    isMobile,
    showOrderMobile,
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
    calculateTotal,
    calculateItemTotal,
    removeFromOrder,
    updateQuantity,
    updateItemNote,
    editingNoteId,
    setEditingNoteId,
    noteDraft,
    setNoteDraft,
    handleSendOrder,
    setIsPaymentModalOpen,
    currentTable
}) => {
    return (
        <div style={{
            width: isMobile ? '100%' : '480px',
            height: isMobile ? '100%' : 'auto',
            position: isMobile ? 'fixed' : 'relative',
            top: 0,
            right: isMobile ? (showOrderMobile ? 0 : '-100%') : 0,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isMobile ? '#0f172a' : 'rgba(0,0,0,0.2)',
            transition: 'right 0.3s ease',
            borderLeft: isMobile ? 'none' : '1px solid var(--glass-border)',
            boxShadow: isMobile ? 'none' : '-10px 0 30px rgba(0,0,0,0.2)'
        }}>
            {isMobile && (
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-start', borderBottom: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={() => setShowOrderMobile(false)}
                        style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <ArrowLeft size={20} /> Volver a la Carta
                    </button>
                </div>
            )}

            {/* Customer Selector */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(59, 130, 246, 0.05)' }}>
                {selectedCustomer ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{selectedCustomer.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>{selectedCustomer.points} pts acumulados</div>
                            </div>
                        </div>
                        <button onClick={() => selectCustomer(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Cambiar</button>
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--glass-border)', borderRadius: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                        >
                            <Plus size={16} /> Asignar Cliente (Fidelización)
                        </button>
                        {showCustomerSearch && (
                            <div className="glass-panel" style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10, padding: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                <input
                                    autoFocus
                                    placeholder="Buscar cliente..."
                                    value={customerSearchQuery}
                                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', marginBottom: '0.5rem' }}
                                />
                                {customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())).map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => { selectCustomer(c); setShowCustomerSearch(false); }}
                                        style={{ padding: '0.75rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                    >
                                        <div style={{ fontWeight: '500' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.phone}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recommendations */}
            {selectedCustomer && selectedCustomer.favorites && selectedCustomer.favorites.length > 0 && (
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                        <Star size={14} /> RECOMENDACIONES (Favoritos)
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {selectedCustomer.favorites.map(favName => {
                            const prod = salesProducts.find(p => p.name === favName);
                            if (!prod) return null;
                            return (
                                <button
                                    key={prod.id}
                                    onClick={() => addToOrder(prod)}
                                    style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '20px', color: 'white', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                >
                                    {prod.image} {prod.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Comanda {currentTable?.name || ''}</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{order.length} items</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {order.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', opacity: 0.5 }}>
                        <Utensils size={48} />
                        <p>Selecciona productos</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {order.map(item => (
                            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {(String(item.image || '').startsWith('data:image') || String(item.image || '').startsWith('http') || String(item.image || '').startsWith('/'))
                                                ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : item.image || '🍽️'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{item.price.toFixed(2)}€ / ud.</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>{(item.price * item.quantity).toFixed(2)}€</div>
                                </div>

                                {/* Modifiers & Notes */}
                                {item.selectedModifiers && Object.entries(item.selectedModifiers).length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingLeft: '3rem' }}>
                                        {Object.entries(item.selectedModifiers).map(([key, value]) => (
                                            <span key={key} style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>
                                                {value}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {item.notes && editingNoteId !== item.uniqueId && (
                                    <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginLeft: '3rem', padding: '4px 8px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '4px', fontStyle: 'italic' }}>
                                        " {item.notes} "
                                    </div>
                                )}

                                {editingNoteId === item.uniqueId && (
                                    <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', marginLeft: '3rem' }}>
                                        <input
                                            type="text"
                                            value={noteDraft}
                                            onChange={(e) => setNoteDraft(e.target.value)}
                                            placeholder="Nota para cocina..."
                                            autoFocus
                                            className="glass-panel"
                                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', color: 'white' }}
                                        />
                                        <button onClick={() => { updateItemNote(item.uniqueId, noteDraft); setEditingNoteId(null); }} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>OK</button>
                                    </div>
                                )}

                                {/* Quick Notes */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingLeft: '3rem' }}>
                                    <button
                                        onClick={() => { setEditingNoteId(editingNoteId === item.uniqueId ? null : item.uniqueId); setNoteDraft(item.notes || ''); }}
                                        style={{ background: 'none', border: '1px dashed var(--glass-border)', color: 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                                    >
                                        <MessageSquare size={12} /> Personalizar
                                    </button>
                                    {['Poco hecho', 'Hecho', 'Muy hecho', 'Sin cebolla', 'Celiaco'].map(qn => (
                                        <button
                                            key={qn}
                                            onClick={() => updateItemNote(item.uniqueId, qn)}
                                            style={{
                                                fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--glass-border)',
                                                background: item.notes === qn ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                                color: item.notes === qn ? 'var(--color-primary)' : '#94a3b8',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {qn}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '25px', padding: '4px' }}>
                                        <button onClick={() => item.quantity === 1 ? removeFromOrder(item.uniqueId || item.id) : updateQuantity(item.uniqueId || item.id, -1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}>
                                            {item.quantity === 1 ? <Trash2 size={16} color="#ef4444" /> : <Minus size={16} />}
                                        </button>
                                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.uniqueId || item.id, 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '900' }}>
                    <span>TOTAL:</span>
                    <span style={{ color: 'var(--color-primary)' }}>{calculateTotal().toFixed(2)}€</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        onClick={handleSendOrder}
                        disabled={order.length === 0}
                        className="btn-primary"
                        style={{ background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: order.length === 0 ? 0.5 : 1, padding: '1.25rem' }}
                    >
                        <Send size={20} /> ENVIAR COCINA
                    </button>
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        disabled={order.length === 0}
                        className="btn-primary"
                        style={{ background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: order.length === 0 ? 0.5 : 1, padding: '1.25rem' }}
                    >
                        <Wine size={20} /> COBRAR MESA
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
