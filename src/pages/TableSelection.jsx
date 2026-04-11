import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useInventory } from '../context/InventoryContext';
import { ArrowLeft, Clock, PlusCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import TableOrderPreview from '../components/TableOrderPreview';

const TableTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const calculate = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            setElapsed(Math.floor((now - start) / 60000));
        };
        calculate();
        const interval = setInterval(calculate, 30000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: elapsed > 30 ? '#ef4444' : elapsed > 20 ? '#fbbf24' : 'rgba(255,255,255,0.1)',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: elapsed > 20 ? 'white' : 'inherit',
            border: '1px solid rgba(255,255,255,0.2)'
        }}>
            <Clock size={14} />
            {elapsed}'
        </div>
    );
};

const TableSelection = () => {
    const navigate = useNavigate();
    const { tables, selectTable, addTable, forceClearTable, tableOrders, kitchenOrders, tableBills, updateKitchenItemStatus } = useOrder();
    const { forceSync, isSyncing } = useInventory();
    
    // Mostramos directamente todas las "Mesas" que ahora son nuestros Tickets/Pedidos Abiertos
    const activeTickets = tables;

    const handleNewOrder = () => {
        // Obtenemos un nombre para el ticket, si no pone nada, será "Pedido X"
        const name = prompt('Nombre o número para el pedido (Ej: Paco, Barra 1, Llevar):');
        if (name === null) return; // Cancelado

        const diners = prompt('¿Cuántos comensales?', '1');
        if (diners === null) return; // Cancelado

        const newTicket = addTable('pedidos', name, diners);
        selectTable(newTicket);
        navigate('/bar-tapas'); // Directo al TPV
    };

    const handleSelectTicket = (ticket) => {
        selectTable(ticket);
        navigate('/bar-tapas'); // Al hacer clic, entramos directo a seguir añadiendo o a cobrar
    };

    return (
        <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', paddingBottom: '3rem' }}>
            <header className="header-card" style={{
                padding: '1.5rem 2rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--border-strong)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: 'var(--color-surface)', color: 'var(--color-text)',
                            border: '1px solid var(--border-strong)', padding: '0.8rem 1.2rem', borderRadius: '12px',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem'
                        }}
                    >
                        <ArrowLeft size={24} /> Volver
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#fcd34d' }}>Pedidos Abiertos</h1>
                        <p style={{ margin: '0.2rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Gestión rápida de comandas</p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={forceSync}
                        disabled={isSyncing}
                        title="Forzar lectura de productos y mesas"
                        style={{
                            background: isSyncing ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid #3b82f6',
                            color: '#3b82f6',
                            borderRadius: '12px',
                            padding: '1.2rem',
                            cursor: isSyncing ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                        }}
                    >
                        <RefreshCw size={28} className={isSyncing ? "spin-animation" : ""} />
                    </button>
                    
                    <button
                        onClick={handleNewOrder}
                        className="btn-glow"
                        style={{
                            padding: '1.2rem 2.5rem',
                            borderRadius: '12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)'
                        }}
                    >
                        <PlusCircle size={28} /> NUEVO PEDIDO
                    </button>
                </div>
            </header>

            <div style={{ padding: '0 2rem', maxWidth: '1600px', margin: '0 auto' }}>
                {activeTickets.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '6rem 2rem', background: 'var(--color-surface)',
                        borderRadius: '20px', border: '2px dashed var(--border-strong)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
                        <h2 style={{ color: 'var(--color-text-muted)', fontSize: '1.8rem', margin: '0 0 1rem 0' }}>No hay pedidos en curso</h2>
                        <p style={{ color: '#64748b', fontSize: '1.2rem' }}>Pulsa <b>"NUEVO PEDIDO"</b> arriba a la derecha para empezar.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {activeTickets.map(ticket => {
                            const tableOrderItems = tableOrders[ticket.id] || [];
                            const tableBillItems = tableBills[ticket.id] || [];
                            const tableKitchenOrders = kitchenOrders.filter(o => o.table === ticket.name);

                            let minStartTime = null;
                            tableKitchenOrders.forEach(o => {
                                if (o.status === 'pending') {
                                    if (!minStartTime || new Date(o.created_at) < new Date(minStartTime)) {
                                        minStartTime = o.created_at;
                                    }
                                }
                            });


                            const kitchenItems = tableKitchenOrders.flatMap(o => o?.items || []);
                            const hasKitchenItems = kitchenItems.length > 0;
                            const allKitchenReady = hasKitchenItems && kitchenItems.every(i => i.itemStatus === 'ready');
                            const isAllServed = tableOrderItems.length === 0 && allKitchenReady;

                            return (
                                <motion.div
                                    key={ticket.id}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectTicket(ticket)}
                                    className="glass-panel"
                                    style={{
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        border: isAllServed ? '2px solid #10b981' : '2px solid var(--color-primary)',
                                        backgroundColor: isAllServed ? '#064e3b' : '#1e293b',
                                        color: '#f8fafc',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1.5rem',
                                        borderRadius: '16px',
                                        boxShadow: isAllServed ? '0 8px 25px rgba(16, 185, 129, 0.3)' : '0 8px 25px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {isAllServed && (
                                        <div style={{
                                            position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                                            background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '12px',
                                            fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)',
                                            zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            ✓ TODOS SERVIDOS
                                        </div>
                                    )}
                                    {minStartTime && !isAllServed && <TableTimer startTime={minStartTime} />}
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fef3c7', paddingRight: '3rem', wordBreak: 'break-word', lineHeight: '1.2' }}>{ticket.name}</h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`🗑️ ¿Seguro que quieres eliminar completamente TODO el pedido de "${ticket.name}"? Esta acción borrará el borrador y lo enviado a cocina.`)) {
                                                    forceClearTable(ticket.id);
                                                }
                                            }}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '0.86rem', fontWeight: 'bold'
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                    
                                    <div style={{ flex: 1, minHeight: '100px' }}>
                                        <TableOrderPreview
                                            tableOrders={tableOrderItems}
                                            tableBills={tableBillItems}
                                            kitchenOrders={tableKitchenOrders}
                                            onItemToggle={(item) => {
                                                if (item.orderId && item.uniqueId) {
                                                    const newStatus = item.itemStatus === 'ready' ? 'pending' : 'ready';
                                                    updateKitchenItemStatus(item.orderId, item.uniqueId, newStatus);
                                                }
                                            }}
                                        />
                                    </div>
                                    
                                    <div style={{ 
                                        paddingTop: '1rem', borderTop: '1px solid rgba(59, 130, 246, 0.3)', 
                                        textAlign: 'center', color: '#fcd34d', fontWeight: 'bold', fontSize: '1.1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}>
                                        Abrir para Añadir / Cobrar ➔
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <style>
                {`
                @keyframes slideUp {
                  from { transform: translateY(20px); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
                .slide-up {
                  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .btn-glow {
                    position: relative;
                    overflow: hidden;
                }
                .btn-glow::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: rgba(255,255,255,0.1);
                    transform: rotate(45deg);
                    animation: btn-glow-anim 3s linear infinite;
                }
                @keyframes btn-glow-anim {
                    0% { transform: rotate(45deg) translateX(-100%); }
                    100% { transform: rotate(45deg) translateX(100%); }
                }
                `}
            </style>
        </div>
    );
};

export default TableSelection;
