import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useEvents } from '../../context/EventContext';
import {
    ShoppingCart, Plus, Minus, Trash2, Printer,
    Share2, X, Search, Filter, AlertCircle, ShoppingBag, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PurchaseOrderModule = ({ onClose }) => {
    const { suppliers, ingredients, restaurantInfo } = useInventory();
    const { eventInventory } = useEvents();

    // -- State --
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [orderItems, setOrderItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('suggested'); // suggested | all

    const [orderRef] = useState(() => `PO-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`);

    // -- Derived Data --
    const selectedSupplier = useMemo(() =>
        suppliers.find(s => String(s.id) === String(selectedSupplierId)),
        [suppliers, selectedSupplierId]);

    const suggestions = useMemo(() => {
        const lowIngredients = ingredients.filter(i => (i.quantity || 0) <= (i.min_stock || 0));
        // For events, we might not have min_stock yet, but we can look for items with 0 or low quantity
        const lowEvents = (eventInventory || []).filter(i => (i.quantity || 0) < 5);

        return [
            ...lowIngredients.map(i => ({ ...i, type: 'ingredient', source: 'Taberna' })),
            ...lowEvents.map(i => ({ ...i, type: 'event_inventory', source: 'Eventos' }))
        ];
    }, [ingredients, eventInventory]);

    const allAvailable = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const base = [
            ...ingredients.map(i => ({ ...i, type: 'ingredient', source: 'Taberna' })),
            ...(eventInventory || []).map(i => ({ ...i, type: 'event_inventory', source: 'Eventos' }))
        ];
        return base.filter(item => item.name.toLowerCase().includes(term));
    }, [ingredients, eventInventory, searchTerm]);

    const totalEstimated = useMemo(() =>
        orderItems.reduce((acc, item) => acc + (parseFloat(item.orderQuantity || 0) * parseFloat(item.cost || 0)), 0),
        [orderItems]);

    // -- Actions --
    const addItemToOrder = (item) => {
        if (orderItems.some(oi => oi.id === item.id && oi.type === item.type)) return;
        setOrderItems([...orderItems, {
            ...item,
            orderQuantity: item.type === 'ingredient' ? (item.min_stock * 2 || 10) : 5
        }]);
    };

    const removeItemFromOrder = (id, type) => {
        setOrderItems(orderItems.filter(oi => !(oi.id === id && oi.type === type)));
    };

    const updateQuantity = (id, type, delta) => {
        setOrderItems(orderItems.map(oi => {
            if (oi.id === id && oi.type === type) {
                const newQty = Math.max(0, (oi.orderQuantity || 0) + delta);
                return { ...oi, orderQuantity: newQty };
            }
            return oi;
        }));
    };

    const handleWhatsAppOrder = () => {
        if (!selectedSupplier) return alert('Selecciona un distribuidor primero');
        if (orderItems.length === 0) return alert('El pedido está vacío');

        const header = `📋 *PEDIDO PARA: ${selectedSupplier.name}*\n📍 *DE: ${restaurantInfo.name}*\n\nHola, me gustaría hacer el siguiente pedido:\n\n`;
        const itemsList = orderItems.map(item => `- ${item.name}: *${item.orderQuantity}* ${item.unit || 'uds'}`).join('\n');
        const footer = `\n\n💰 Total estimado: ${totalEstimated.toFixed(2)}€\nMuchas gracias.`;

        const message = encodeURIComponent(header + itemsList + footer);
        const phone = selectedSupplier.phone ? selectedSupplier.phone.replace(/\s/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <motion.div
                className="modal-container"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ width: '1000px', maxWidth: '95vw', background: 'var(--color-bg)', borderRadius: '24px' }}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--border-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#10b981', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
                            <ShoppingCart size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Hoja de Pedido Inteligent</h2>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Crea pedidos rápidos basados en tu stock crítico</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.1)' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', height: '650px' }}>
                    {/* Left: Product Selector */}
                    <div style={{ width: '400px', borderRight: '1px solid var(--border-strong)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-strong)' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>Elegir Distribuidor</label>
                            <select
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                                className="input-field"
                                style={{ width: '100%' }}
                            >
                                <option value="">Seleccionar Distribuidor...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', background: 'var(--color-surface)' }}>
                            <button
                                onClick={() => setActiveTab('suggested')}
                                style={{ flex: 1, padding: '1rem', border: 'none', borderBottom: activeTab === 'suggested' ? '2px solid var(--color-primary)' : 'none', background: 'transparent', color: activeTab === 'suggested' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Sugerencias ({suggestions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                style={{ flex: 1, padding: '1rem', border: 'none', borderBottom: activeTab === 'all' ? '2px solid var(--color-primary)' : 'none', background: 'transparent', color: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Todos
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                            {activeTab === 'all' && (
                                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-field"
                                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {(activeTab === 'suggested' ? suggestions : allAvailable).map(item => (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => addItemToOrder(item)}
                                        className="surface-card"
                                        style={{
                                            textAlign: 'left', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-strong)',
                                            background: orderItems.some(oi => oi.id === item.id && oi.type === item.type) ? 'rgba(16, 185, 129, 0.05)' : 'var(--color-bg)',
                                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                {item.source} • Stock: <span style={{ color: (item.quantity <= item.min_stock) ? '#ef4444' : 'inherit', fontWeight: 'bold' }}>{item.quantity} {item.unit}</span>
                                            </div>
                                        </div>
                                        <Plus size={18} style={{ color: 'var(--color-primary)' }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Paper */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', color: '#1a1a1a', padding: '3rem' }}>
                        <div style={{ flex: 1, border: '2px solid #eee', borderRadius: '4px', padding: '2rem', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            {/* Paper Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}>
                                <div>
                                    <h1 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.5rem', fontWeight: '900' }}>{restaurantInfo.name}</h1>
                                    <p style={{ margin: 0, opacity: 0.6 }}>HOJA DE PEDIDO DE COMPRA</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold' }}>FECHA: {new Date().toLocaleDateString()}</div>
                                    <div>Ref: {orderRef}</div>
                                </div>
                            </div>

                            {/* Supplier Section */}
                            <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666' }}>Proveedor:</span>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedSupplier?.name || '---'}</div>
                                    <div style={{ fontSize: '0.85rem' }}>{selectedSupplier?.phone || ''}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666' }}>Destinatario:</span>
                                    <div style={{ fontWeight: 'bold' }}>{restaurantInfo.name}</div>
                                    <div style={{ fontSize: '0.85rem' }}>CIF: {restaurantInfo.nif}</div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#1a1a1a', color: 'white', fontSize: '0.75rem' }}>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>ARTÍCULO</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '80px' }}>CANT.</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '100px' }}>EST.</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
                                                    <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                                    <p>Empieza a añadir artículos al pedido.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            orderItems.map(item => (
                                                <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>{item.name}</td>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                            <button onClick={() => updateQuantity(item.id, item.type, -1)} style={{ border: '1px solid #ddd', background: 'white', borderRadius: '4px', padding: '2px', cursor: 'pointer' }}><Minus size={12} /></button>
                                                            <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{item.orderQuantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, item.type, 1)} style={{ border: '1px solid #ddd', background: 'white', borderRadius: '4px', padding: '2px', cursor: 'pointer' }}><Plus size={12} /></button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{(item.orderQuantity * (item.cost || 0)).toFixed(2)}€</td>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <button onClick={() => removeItemFromOrder(item.id, item.type)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paper Footer */}
                            <div style={{ marginTop: '2rem', borderTop: '2px solid #000', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '0.75rem', color: '#666', maxWidth: '300px' }}>
                                    Entregar en: {restaurantInfo.address}
                                    <br />
                                    Gracias por su excelente servicio.
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>SUBTOTAL ESTIMADO</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{totalEstimated.toFixed(2)}€</div>
                                </div>
                            </div>
                        </div>

                        {/* Export Actions */}
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button onClick={() => window.print()} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', background: '#e5e7eb', color: '#374151' }}>
                                <Printer size={18} /> Imprimir PDF
                            </button>
                            <button
                                onClick={handleWhatsAppOrder}
                                className="btn-primary"
                                style={{ flex: 1.5, justifyContent: 'center', background: '#25D366', borderColor: '#25D366' }}
                                disabled={!selectedSupplier || orderItems.length === 0}
                            >
                                <Share2 size={18} /> Enviar por WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PurchaseOrderModule;
