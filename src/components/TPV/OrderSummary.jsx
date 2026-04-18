    Trash2, Minus, Wine, ArrowLeft, Send, Printer, CreditCard, Receipt, Users, Edit2
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
    toggleItemPriority,
    toggleItemToShare,
    toggleItemIndividual,
    toggleItemInvitation,
    toggleItemInvitationInBill,
    editingNoteId,
    setEditingNoteId,
    noteDraft,
    setNoteDraft,
    handleSendOrder,
    setIsPaymentModalOpen,
    setPartialPaymentModal,
    handlePrintPreTicket,
    handleCloseTable,
    currentTable,
    forceClearTable,
    updateBillQuantity,
    updateDiners,
    renameTable
}) => {
    const [openQuickNotes, setOpenQuickNotes] = React.useState({});

    const toggleQuickNotes = (id) => {
        setOpenQuickNotes(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleFastPay = async (method) => {
        if (!currentTable) return;
        
        try {
            // 1. If there's an active draft order, send it first
            if (order.length > 0) {
                await handleSendOrder(true, true); // Silent, no printing (or print as per config)
            }
            
            // 2. Execute checkout with chosen method
            await handleCloseTable(method);
            
            // 3. Clear local states if needed (context usually handles this, but safety first)
            if (isMobile) {
                setShowOrderMobile(false);
            }
        } catch (error) {
            console.error("Fast Pay Error:", error);
            alert("No se pudo completar el cobro rápido. Inténtalo de forma manual.");
        }
    };

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
                        style={{ background: 'var(--color-primary)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={24} /> Volver a la Carta
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
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#e2e8f0',
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
                padding: '0.75rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
                background: 'rgba(0,0,0,0.2)'
            }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)', fontWeight: '800' }}>
                            {currentTable ? currentTable.name : 'Venta Rápida'}
                        </h2>
                        {currentTable && (
                            <button
                                onClick={() => {
                                    const newName = prompt('Nuevo nombre para la mesa:', currentTable.name);
                                    if (newName && newName !== currentTable.name) {
                                        renameTable(currentTable.id, newName);
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 0.7
                                }}
                                title="Renombrar Mesa"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>
                    {currentTable && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                            <Users size={12} color="var(--color-text-muted)" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                                {currentTable.diners || 1} { (currentTable.diners || 1) === 1 ? 'comensal' : 'comensales' }
                            </span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {currentTable && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '2px', 
                            background: 'rgba(255,255,255,0.05)', 
                            padding: '2px', 
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <button 
                                onClick={() => updateDiners(currentTable.id, (currentTable.diners || 1) - 1)}
                                style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Minus size={14} />
                            </button>
                            <div style={{ width: '30px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {currentTable.diners || 1}
                            </div>
                            <button 
                                onClick={() => updateDiners(currentTable.id, (currentTable.diners || 1) + 1)}
                                style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                    {(order.length > 0 || (bill && bill.length > 0)) && (
                        <button
                            onClick={() => {
                                if (window.confirm("🗑️ ¿Seguro que quieres eliminar completamente TODO el pedido de esta mesa (incluyendo lo enviado)? Esta acción es irreversible.")) {
                                    if (typeof forceClearTable === 'function') {
                                        forceClearTable(currentTable?.id);
                                    } else {
                                        // Fallback manual if for some reason forceClearTable isn't passed yet
                                        const itemsToRemove = [...order];
                                        itemsToRemove.forEach(item => removeFromOrder(item.uniqueId || item.id));
                                    }
                                }
                            }}
                            title="Borrar Mesa/Comanda"
                            style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 5px rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            <Trash2 size={14} /> ELIMINAR
                        </button>
                    )}
                    <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-primary)',
                        background: 'rgba(59, 130, 246, 0.15)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                        {order.length + (bill?.length || 0)} {(order.length + (bill?.length || 0)) === 1 ? 'item' : 'items'}
                    </div>
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
                            {order.map(item => {
                                const isQuickNotesOpen = openQuickNotes[item.uniqueId || item.id] || false;
                                
                                return (
                                    <motion.div
                                        key={item.uniqueId || item.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--color-surface-dark)',
                                            color: 'var(--color-text-on-dark)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            boxShadow: 'var(--shadow-sm)',
                                            gap: '0.5rem',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, alignItems: 'center' }}>
                                                <div style={{
                                                    width: '42px',
                                                    height: '42px',
                                                    flexShrink: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.2rem',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    {(String(item.image || '').startsWith('data:image') || String(item.image || '').startsWith('http') || String(item.image || '').startsWith('/'))
                                                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : item.image || '🍽️'}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: '700', color: item.isPriority ? '#f87171' : 'var(--color-text-on-dark)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.isPriority && <span style={{ marginRight: '4px' }}>⚡</span>}
                                                        {item.name}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '0.85rem', color: item.isInvitation ? '#a78bfa' : 'var(--color-primary)', fontWeight: 'bold' }}>
                                                            {item.isInvitation ? '0.00€' : `${(item.price * item.quantity).toFixed(2)}€`}
                                                        </span>
                                                        {item.quantity > 1 && (
                                                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                                                                ({item.quantity} x {item.price.toFixed(2)}€)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                background: 'rgba(0,0,0,0.4)',
                                                borderRadius: '30px',
                                                padding: '4px',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                            }}>
                                                <button
                                                    onClick={() => item.quantity === 1 ? removeFromOrder(item.uniqueId || item.id) : updateQuantity(item.uniqueId || item.id, -1)}
                                                    style={{ width: '36px', height: '36px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                >
                                                    {item.quantity === 1 ? <Trash2 size={20} /> : <Minus size={20} />}
                                                </button>
                                                <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '900', color: 'white', fontSize: '1.1rem' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.uniqueId || item.id, 1)}
                                                    style={{ width: '36px', height: '36px', border: 'none', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '50%', color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {(item.selectedModifiers || item.notes || item.isPriority || item.isShared || item.isIndividual || item.isInvitation) && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', overflow: 'hidden' }}>
                                                {item.isPriority && <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold' }}>PRIORIDAD</span>}
                                                {item.isShared && <span style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(249, 115, 22, 0.3)', fontWeight: 'bold' }}>PARA COMPARTIR</span>}
                                                {item.isIndividual && <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 'bold' }}>INDIVIDUAL</span>}
                                                {item.isInvitation && <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: 'bold' }}>INVITACIÓN</span>}
                                                
                                                {item.selectedModifiers && Object.entries(item.selectedModifiers).map(([key, value]) => (
                                                    <span key={key} style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                        {value}
                                                    </span>
                                                ))}

                                                {item.notes && (
                                                    <div style={{ width: '100%', fontSize: '0.75rem', color: '#fbbf24', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <MessageSquare size={10} /> {item.notes}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem' }}>
                                            <button
                                                onClick={() => { toggleQuickNotes(item.uniqueId || item.id); setEditingNoteId(null); }}
                                                style={{ padding: '0.35rem 0.75rem', background: isQuickNotesOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: isQuickNotesOpen ? 'var(--color-primary)' : '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={12} /> Modificar
                                            </button>
                                            <button
                                                onClick={() => { setEditingNoteId(editingNoteId === item.uniqueId ? null : item.uniqueId); setNoteDraft(item.notes || ''); if (isQuickNotesOpen) toggleQuickNotes(item.uniqueId || item.id); }}
                                                style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <MessageSquare size={12} /> Nota
                                            </button>
                                        </div>

                                        {editingNoteId === item.uniqueId && (
                                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                                                <input
                                                    type="text"
                                                    value={noteDraft}
                                                    onChange={(e) => setNoteDraft(e.target.value)}
                                                    placeholder="Escribir nota..."
                                                    autoFocus
                                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', color: 'white', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-primary)', borderRadius: '8px' }}
                                                />
                                                <button onClick={() => { updateItemNote(item.uniqueId, noteDraft); setEditingNoteId(null); }} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>OK</button>
                                            </div>
                                        )}

                                        <AnimatePresence>
                                            {isQuickNotesOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', padding: '0.5rem 0', borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: '0.25rem' }}>
                                                        <button onClick={() => toggleItemPriority(item.uniqueId || item.id)} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid ' + (item.isPriority ? '#ef4444' : 'rgba(255,255,255,0.1)'), background: item.isPriority ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: item.isPriority ? '#f87171' : '#94a3b8', cursor: 'pointer' }}>M. Rápida</button>
                                                        <button onClick={() => toggleItemToShare(item.uniqueId || item.id)} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid ' + (item.isShared ? '#f97316' : 'rgba(255,255,255,0.1)'), background: item.isShared ? 'rgba(249, 115, 22, 0.2)' : 'transparent', color: item.isShared ? '#fdba74' : '#94a3b8', cursor: 'pointer' }}>Compartir</button>
                                                        <button onClick={() => toggleItemIndividual(item.uniqueId || item.id)} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid ' + (item.isIndividual ? '#3b82f6' : 'rgba(255,255,255,0.1)'), background: item.isIndividual ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: item.isIndividual ? '#93c5fd' : '#94a3b8', cursor: 'pointer' }}>Individual</button>
                                                        <button onClick={() => toggleItemInvitation(item.uniqueId || item.id)} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid ' + (item.isInvitation ? '#8b5cf6' : 'rgba(255,255,255,0.1)'), background: item.isInvitation ? 'rgba(139, 92, 246, 0.2)' : 'transparent', color: item.isInvitation ? '#a78bfa' : '#94a3b8', cursor: 'pointer' }}>Invitación</button>
                                                        {['Poco hecho', 'Muy hecho', 'Celiaco', 'Sin cebolla'].map(qn => (
                                                            <button key={qn} onClick={() => updateItemNote(item.uniqueId, qn)} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: item.notes === qn ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: item.notes === qn ? '#60a5fa' : '#94a3b8', cursor: 'pointer' }}>{qn}</button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}

                            {/* Already sent Items (Bill) */}
                            {bill && bill.length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '0.75rem', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.5rem' }}>
                                        ENVIADO A COCINA / CUENTA ACTIVA
                                    </div>
                                    {bill.map(item => (
                                        <div key={item.uniqueId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface-dark)', color: 'var(--color-text-on-dark)', borderRadius: '12px', border: item.isInvitation ? '1px solid #8b5cf6' : '1px solid rgba(0,0,0,0.1)', marginBottom: '0.5rem', opacity: 0.9 }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: item.isInvitation ? '#a78bfa' : 'inherit' }}>
                                                    {item.quantity}x {item.name}
                                                </span>
                                                {item.isInvitation && <div style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 'bold' }}>Invitación (0.00€)</div>}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.2rem',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    borderRadius: '20px',
                                                    padding: '2px',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    <button
                                                        onClick={() => updateBillQuantity(currentTable.id, item.uniqueId, -1)}
                                                        style={{ width: '32px', height: '32px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Bajar cantidad / Eliminar"
                                                    >
                                                        {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                                                    </button>
                                                    <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: '800', fontSize: '0.95rem' }}>{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateBillQuantity(currentTable.id, item.uniqueId, 1)}
                                                        style={{ width: '32px', height: '32px', border: 'none', background: 'none', color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Subir cantidad"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => toggleItemInvitationInBill(item.uniqueId)}
                                                    style={{
                                                        background: item.isInvitation ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                                        border: item.isInvitation ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                                                        color: item.isInvitation ? '#a78bfa' : '#94a3b8',
                                                        padding: '6px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title={item.isInvitation ? "Quitar Invitación" : "Marcar como Invitación"}
                                                >
                                                    <Gift size={16} />
                                                </button>
                                            </div>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: (order.length > 0 ? '1fr 1fr' : '1.5fr 1fr'), gap: '0.75rem' }}>
                        {order.length > 0 ? (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => handleSendOrder(false, false)}
                                    style={{
                                        padding: '1.25rem 0.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '800',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        border: 'none',
                                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Printer size={20} /> ENVIAR
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => handleFastPay('Efectivo')}
                                    style={{
                                        padding: '1.25rem 0.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '800',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #059669, #10b981)',
                                        border: 'none',
                                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Receipt size={18} /> EFECTIVO
                                </button>
                            </>
                        ) : (bill && bill.length > 0) && (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    style={{
                                        padding: '1.25rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        border: 'none',
                                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Wine size={26} />
                                    <span style={{ fontSize: '1.1rem', fontWeight: '900' }}>COBRAR</span>
                                </button>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleFastPay('Efectivo')}
                                        style={{ 
                                            flex: 1, 
                                            background: 'linear-gradient(135deg, #059669, #10b981)', 
                                            border: 'none', 
                                            borderRadius: '12px', 
                                            color: 'white', 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '0.25rem', 
                                            fontWeight: '800', 
                                            fontSize: '0.75rem', 
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                                        }}
                                    >
                                        <Receipt size={18} />
                                        EFECTIVO
                                    </button>
                                    <button
                                        onClick={() => handleFastPay('Tarjeta')}
                                        style={{ 
                                            flex: 1, 
                                            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', 
                                            border: 'none', 
                                            borderRadius: '12px', 
                                            color: 'white', 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '0.25rem', 
                                            fontWeight: '800', 
                                            fontSize: '0.75rem', 
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)'
                                        }}
                                    >
                                        <CreditCard size={18} />
                                        TARJETA
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {order.length > 0 ? (
                            <>
                                <button
                                    onClick={() => handleSendOrder(false, true)}
                                    style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '10px', background: '#475569', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                                >
                                    <Send size={14} /> SOLO GUARDAR
                                </button>
                                <button
                                    onClick={() => handleFastPay('Tarjeta')}
                                    style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)' }}
                                >
                                    <CreditCard size={14} /> TARJETA DIRECTO
                                </button>
                            </>
                        ) : (bill && bill.length > 0) ? (
                            <>
                                <button
                                    onClick={() => setPartialPaymentModal({ isOpen: true, itemsToPay: [] })}
                                    style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 'bold' }}
                                >
                                    <CreditCard size={14} /> DIVIDIR CUENTA
                                </button>
                                <button
                                    onClick={handlePrintPreTicket}
                                    style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 'bold' }}
                                >
                                    <Printer size={14} /> PRE-TICKET
                                </button>
                            </>
                        ) : (
                            <div style={{
                                gridColumn: 'span 2',
                                padding: '1.25rem',
                                textAlign: 'center',
                                color: 'var(--color-text-muted)',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '16px',
                                border: '1px dashed rgba(255,255,255,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Utensils size={24} style={{ opacity: 0.5 }} />
                                <span>La mesa está libre</span>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </div >
    );
};

export default OrderSummary;
