import React from 'react';
import { useOrder } from '../context/OrderContext';
import { ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const KitchenDisplay = () => {
    const { kitchenOrders, markOrderReady, removeOrder } = useOrder();
    const navigate = useNavigate();
    const [soundEnabled, setSoundEnabled] = React.useState(false);
    const lastOrderCount = React.useRef(kitchenOrders.length);

    const pendingOrders = kitchenOrders.filter(o => o.status === 'pending');
    const readyOrders = kitchenOrders.filter(o => o.status === 'ready');

    // Audio Alert Logic
    React.useEffect(() => {
        if (soundEnabled && kitchenOrders.length > lastOrderCount.current) {
            const hasNewPending = kitchenOrders.some(o => o.status === 'pending');
            if (hasNewPending) {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log("Autoplay blocked:", e));
            }
        }
        lastOrderCount.current = kitchenOrders.length;
    }, [kitchenOrders, soundEnabled]);

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                >
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, flex: 1 }}>Cocina (KDS)</h1>

                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="glass-panel"
                    style={{
                        padding: '0.5rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        border: soundEnabled ? '1px solid #10b981' : '1px solid #ef4444',
                        background: soundEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                    }}
                >
                    {soundEnabled ? '🔔 Alerta Sonora: ON' : '🔕 Alerta Sonora: OFF'}
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <AnimatePresence>
                    {[...pendingOrders, ...readyOrders].map(order => (
                        <motion.div
                            key={order.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                borderLeft: `5px solid ${order.status === 'pending' ? '#ef4444' : '#10b981'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Mesa {order.table}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    <Clock size={16} />
                                    <span>{order.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.2rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '6px',
                                                overflow: 'hidden'
                                            }}>
                                                {(String(item.image || '').startsWith('data:image') || String(item.image || '').startsWith('http') || String(item.image || '').startsWith('/'))
                                                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : item.image || '🍽️'}
                                            </div>
                                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{item.quantity}x {item.name}</span>
                                        </div>
                                        {item.notes && (
                                            <div style={{ fontSize: '1rem', color: '#000', background: '#fbbf24', padding: '2px 8px', borderRadius: '4px', margin: '4px 0 4px 3rem', fontWeight: '900', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                                ⚠️ {item.notes.toUpperCase()}
                                            </div>
                                        )}
                                        {item.selectedModifiers && (
                                            <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
                                                {Object.values(item.selectedModifiers).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {order.status === 'pending' ? (
                                <button
                                    className="btn-primary"
                                    style={{ background: '#ef4444', width: '100%', marginTop: 'auto' }}
                                    onClick={() => markOrderReady(order.id)}
                                >
                                    Marcar Listo
                                </button>
                            ) : (
                                <button
                                    className="btn-primary"
                                    style={{ background: '#10b981', width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => removeOrder(order.id)}
                                >
                                    <CheckCircle size={18} />
                                    Archivar
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {kitchenOrders.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)', padding: '4rem' }}>
                        <h2>No hay pedidos pendientes</h2>
                        <p>¡Todo tranquilo en la cocina!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenDisplay;
