import React from 'react';
import { useOrder } from '../context/OrderContext';
import { ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ElapsedTime = ({ timestamp }) => {
    const [elapsed, setElapsed] = React.useState(0);

    React.useEffect(() => {
        const calculate = () => {
            const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
            setElapsed(diff);
        };
        calculate();
        const interval = setInterval(calculate, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [timestamp]);

    // Enhanced color thresholds: Green < 10, Yellow 10-20, Red > 20
    const color = elapsed > 20 ? '#ef4444' : elapsed > 10 ? '#fbbf24' : '#10b981';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color,
            fontWeight: '900',
            fontSize: '1.2rem',
            background: `${color}15`,
            padding: '4px 12px',
            borderRadius: '12px',
            border: `1px solid ${color}30`
        }}>
            <Clock size={20} />
            <span>{elapsed}'</span>
        </div>
    );
};

const KitchenDisplay = () => {
    const { kitchenOrders, markOrderReady, removeOrder, updateKitchenItemStatus } = useOrder();
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

    const groupItemsByCategory = (items) => {
        return items.reduce((acc, item) => {
            const cat = item.category || 'Otros';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});
    };

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                <AnimatePresence>
                    {[...pendingOrders, ...readyOrders].map(order => {
                        const grouped = groupItemsByCategory(order.items);
                        return (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass-panel"
                                style={{
                                    padding: '1.5rem',
                                    borderLeft: `8px solid ${order.status === 'pending' ? '#ef4444' : '#10b981'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                    background: 'rgba(22, 28, 45, 0.8)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-primary)' }}>MESA {order.table}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{order.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <ElapsedTime timestamp={order.timestamp} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    {Object.entries(grouped).map(([category, items]) => (
                                        <div key={category} style={{ marginBottom: '1.5rem' }}>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                color: '#94a3b8',
                                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                paddingBottom: '0.25rem',
                                                marginBottom: '0.5rem',
                                                display: 'flex',
                                                justifyContent: 'space-between'
                                            }}>
                                                <span>{category}</span>
                                                <span>{items.length} items</span>
                                            </div>
                                            {items.map((item, idx) => {
                                                const isItemReady = item.itemStatus === 'ready';
                                                return (
                                                    <div
                                                        key={`${item.uniqueId}-${idx}`}
                                                        style={{
                                                            marginBottom: '1rem',
                                                            opacity: isItemReady ? 0.4 : 1,
                                                            transition: 'opacity 0.3s'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                            <div
                                                                onClick={() => updateKitchenItemStatus(order.id, item.uniqueId, isItemReady ? 'pending' : 'ready')}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.75rem',
                                                                    flex: 1,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <span style={{
                                                                    fontSize: '1.5rem',
                                                                    fontWeight: '900',
                                                                    minWidth: '2rem',
                                                                    color: isItemReady ? '#10b981' : '#fff',
                                                                    textDecoration: isItemReady ? 'line-through' : 'none'
                                                                }}>{item.quantity}x</span>
                                                                <span style={{
                                                                    fontSize: '1.2rem',
                                                                    fontWeight: '700',
                                                                    textDecoration: isItemReady ? 'line-through' : 'none'
                                                                }}>{item.name}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => updateKitchenItemStatus(order.id, item.uniqueId, isItemReady ? 'pending' : 'ready')}
                                                                style={{
                                                                    background: isItemReady ? '#10b981' : 'rgba(255,255,255,0.05)',
                                                                    border: `2px solid ${isItemReady ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '8px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {isItemReady && <CheckCircle size={20} />}
                                                            </button>
                                                        </div>
                                                        {item.notes && (
                                                            <div style={{
                                                                fontSize: '1.1rem',
                                                                color: '#000',
                                                                background: '#fbbf24',
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                marginTop: '0.75rem',
                                                                fontWeight: '950',
                                                                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                                                                display: 'inline-block',
                                                                marginLeft: '2.75rem'
                                                            }}>
                                                                🔔 {item.notes.toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>

                                {order.status === 'pending' ? (
                                    <button
                                        className="btn-primary"
                                        style={{ background: '#ef4444', width: '100%', marginTop: 'auto', padding: '1rem', fontWeight: 'bold' }}
                                        onClick={() => markOrderReady(order.id)}
                                    >
                                        MARCAR COMO LISTO
                                    </button>
                                ) : (
                                    <button
                                        className="btn-primary"
                                        style={{ background: '#10b981', width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontWeight: 'bold' }}
                                        onClick={() => removeOrder(order.id)}
                                    >
                                        <CheckCircle size={20} />
                                        ARCHIVAR PEDIDO
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {kitchenOrders.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)', padding: '6rem 0' }}>
                        <CheckCircle size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <h2>No hay pedidos pendientes</h2>
                        <p>¡Todo bajo control!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenDisplay;
