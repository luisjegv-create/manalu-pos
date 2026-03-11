import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useEvents } from '../../context/EventContext';
import {
    Truck, Plus, Minus, Trash2, Save, X, Search,
    Calendar, Hash, Receipt, CheckCircle, AlertTriangle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuickReception = ({ onClose }) => {
    const { suppliers, ingredients, receiveInventory } = useInventory();
    const { eventInventory } = useEvents();

    // -- State --
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [receivedItems, setReceivedItems] = useState([]);
    const [invoiceData, setInvoiceData] = useState({
        number: '',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        status: 'Pendiente',
        paymentMethod: 'Banco'
    });
    const [searchTerm, setSearchTerm] = useState('');

    // -- Derived Data --
    const selectedSupplier = useMemo(() =>
        suppliers.find(s => String(s.id) === String(selectedSupplierId)),
        [suppliers, selectedSupplierId]);

    const availableItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const tavernItems = ingredients.map(i => ({ ...i, type: 'ingredient', source: 'Taberna' }));
        const eventItems = (eventInventory || []).map(i => ({ ...i, type: 'event_inventory', source: 'Eventos' }));

        return [...tavernItems, ...eventItems].filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.source.toLowerCase().includes(term)
        );
    }, [ingredients, eventInventory, searchTerm]);

    const totalCalculated = useMemo(() =>
        receivedItems.reduce((acc, item) => acc + (parseFloat(item.receivedQuantity || 0) * parseFloat(item.currentCost || 0)), 0),
        [receivedItems]);

    // -- Actions --
    const addItemToList = (item) => {
        if (receivedItems.some(ri => ri.id === item.id && ri.type === item.type)) return;

        setReceivedItems([...receivedItems, {
            ...item,
            receivedQuantity: 0,
            currentCost: item.cost || 0
        }]);
        setSearchTerm('');
    };

    const removeItemFromList = (id, type) => {
        setReceivedItems(receivedItems.filter(ri => !(ri.id === id && ri.type === type)));
    };

    const updateItemInList = (id, type, field, value) => {
        setReceivedItems(receivedItems.map(ri =>
            ri.id === id && ri.type === type ? { ...ri, [field]: value } : ri
        ));
    };

    const handleSaveReception = async () => {
        if (!selectedSupplierId) return alert('Selecciona un proveedor');
        if (receivedItems.length === 0) return alert('Añade al menos un producto');
        if (!invoiceData.number) return alert('Indica el número de albarán/factura');

        const success = await receiveInventory(receivedItems, {
            ...invoiceData,
            supplierId: selectedSupplierId,
            supplierName: selectedSupplier?.name,
            totalAmount: invoiceData.totalAmount || totalCalculated
        });

        if (success) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <motion.div
                className="modal-container"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ width: '900px', maxWidth: '95vw', background: 'var(--color-bg)', borderRadius: '24px', overflow: 'hidden' }}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--border-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'var(--color-primary)', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
                            <Truck size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Entrada de Mercancía</h2>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Digitaliza albaranes y actualiza stock profesionalmente</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.1)' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', height: '600px' }}>
                    {/* Sidebar: Search & Info */}
                    <div style={{ width: '300px', borderRight: '1px solid var(--border-strong)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.02)' }}>
                        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>1. Proveedor</h3>
                            <select
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                                className="input-field"
                                style={{ width: '100%', marginBottom: '2rem' }}
                            >
                                <option value="">Seleccionar Distribuidor...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>

                            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>2. Buscar Productos</h3>
                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Calamares, Sillas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-field"
                                    style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {searchTerm && availableItems.slice(0, 10).map(item => (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => addItemToList(item)}
                                        className="surface-card"
                                        style={{
                                            textAlign: 'left', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-strong)',
                                            background: 'var(--color-bg)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', opacity: 0.8 }}>{item.source}</div>
                                        </div>
                                        <Plus size={16} style={{ color: 'var(--color-primary)' }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary Box */}
                        <div style={{ padding: '1.5rem', background: 'var(--color-surface)', borderTop: '1px solid var(--border-strong)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Artículos:</span>
                                <span style={{ fontWeight: 'bold' }}>{receivedItems.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                <span style={{ fontWeight: '600' }}>Total:</span>
                                <span style={{ fontWeight: '800', color: 'var(--color-primary)' }}>{totalCalculated.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>

                    {/* Main List */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                            {receivedItems.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                    <Receipt size={64} style={{ marginBottom: '1rem' }} />
                                    <p>La lista está vacía. Busca productos a la izquierda.</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                            <th style={{ padding: '0.75rem' }}>Producto</th>
                                            <th style={{ padding: '0.75rem', width: '100px' }}>Cant.</th>
                                            <th style={{ padding: '0.75rem', width: '120px' }}>Precio/Ud</th>
                                            <th style={{ padding: '0.75rem', width: '100px', textAlign: 'right' }}>Subtotal</th>
                                            <th style={{ padding: '0.75rem', width: '40px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receivedItems.map(item => (
                                            <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                                                <td style={{ padding: '1rem 0.75rem' }}>
                                                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.source} • Stock actual: {item.quantity} {item.unit || 'uds'}</div>
                                                </td>
                                                <td style={{ padding: '1rem 0.75rem' }}>
                                                    <input
                                                        type="number"
                                                        value={item.receivedQuantity}
                                                        onChange={(e) => updateItemInList(item.id, item.type, 'receivedQuantity', e.target.value)}
                                                        className="input-field"
                                                        style={{ width: '80px', padding: '0.4rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem 0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <input
                                                            type="number"
                                                            value={item.currentCost}
                                                            onChange={(e) => updateItemInList(item.id, item.type, 'currentCost', e.target.value)}
                                                            className="input-field"
                                                            style={{ width: '100px', padding: '0.4rem' }}
                                                        />
                                                        <span style={{ fontSize: '0.8rem' }}>€</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                    {(item.receivedQuantity * item.currentCost).toFixed(2)}€
                                                </td>
                                                <td style={{ padding: '1rem 0.75rem' }}>
                                                    <button onClick={() => removeItemFromList(item.id, item.type)} className="btn-icon-small text-danger">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Bottom Bar: Invoice Info & Save */}
                        <div style={{ padding: '2rem', background: 'var(--color-surface)', borderTop: '1px solid var(--border-strong)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.8rem' }}><Hash size={14} /> Nº Albarán/Factura</label>
                                    <input
                                        type="text"
                                        placeholder="EP-2024-001"
                                        value={invoiceData.number}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, number: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.8rem' }}><Calendar size={14} /> Fecha</label>
                                    <input
                                        type="date"
                                        value={invoiceData.date}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.8rem' }}>Total Factura (Real)</label>
                                    <input
                                        type="number"
                                        placeholder={totalCalculated.toFixed(2)}
                                        value={invoiceData.totalAmount || ''}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, totalAmount: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '2rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={invoiceData.status === 'Pagado'}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, status: e.target.checked ? 'Pagado' : 'Pendiente' })}
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>Marcar como ya Pagado</span>
                                    </label>
                                    {invoiceData.status === 'Pagado' && (
                                        <select
                                            value={invoiceData.paymentMethod}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, paymentMethod: e.target.value })}
                                            className="input-field"
                                            style={{ padding: '0.3rem 1rem', fontSize: '0.85rem' }}
                                        >
                                            <option value="Banco">Banco / Tarjeta</option>
                                            <option value="Efectivo">Caja Efectivo</option>
                                        </select>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                                    <button
                                        onClick={handleSaveReception}
                                        className="btn-primary"
                                        style={{ padding: '0.75rem 2.5rem', borderRadius: '14px', gap: '0.75rem' }}
                                        disabled={receivedItems.length === 0}
                                    >
                                        <Save size={20} /> Guardar Entrada
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QuickReception;
