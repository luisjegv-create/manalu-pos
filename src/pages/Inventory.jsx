import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import {
    Plus,
    Search,
    Trash2,
    Edit3,
    ArrowLeft,
    AlertTriangle,
    Check,
    History,
    TrendingUp,
    TrendingDown,
    Save,
    X,
    Filter,
    ChevronDown,
    Download,
    BarChart3,
    Package,
    Store,
    Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = () => {
    const navigate = useNavigate();
    const { products, addProduct, updateProduct, deleteProduct, loading } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'low-stock', 'stats'

    const categories = ['Todas', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const lowStockProducts = products.filter(p => (p.currentStock || 0) <= (p.minStock || 5));

    const [form, setForm] = useState({
        name: '',
        category: 'Tapas',
        currentStock: 0,
        minStock: 10,
        unit: 'uds',
        price: 0,
        costPrice: 0,
        supplier: ''
    });

    const handleSave = (e) => {
        e.preventDefault();
        addProduct(form);
        setIsAdding(false);
        setForm({
            name: '',
            category: 'Tapas',
            currentStock: 0,
            minStock: 10,
            unit: 'uds',
            price: 0,
            costPrice: 0,
            supplier: ''
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        updateProduct(editingProduct.id, editingProduct);
        setEditingProduct(null);
    };

    const stats = useMemo(() => {
        const totalValue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0);
        const potentialRevenue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.price || 0)), 0);
        return { totalValue, potentialRevenue, totalItems: products.length };
    }, [products]);

    return (
        <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
            <header className="header-card" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-icon-circle"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>Almacén (Matriz)</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Control centralizado de existencias</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={18} /> Exportar
                    </button>
                    <button className="btn-primary" onClick={() => setIsAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Nuevo Artículo
                    </button>
                </div>
            </header>

            <div style={{ padding: '0 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Dashboard Corto */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', color: '#3b82f6' }}><Package size={24} /></div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Valor Inventario</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalValue.toFixed(2)}€</div>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1rem', borderRadius: '12px', color: '#eab308' }}><AlertTriangle size={24} /></div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Stock Bajo</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{lowStockProducts.length} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>artículos</span></div>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', color: '#10b981' }}><TrendingUp size={24} /></div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Venta Potencial</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.potentialRevenue.toFixed(2)}€</div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar artículo..."
                            className="glass-panel"
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', color: 'white', border: '1px solid rgba(255,255,255,0.05)' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: categoryFilter === cat ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                    color: categoryFilter === cat ? 'black' : 'white',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabla de Artículos */}
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontSize: '0.85rem' }}>
                            <tr>
                                <th style={{ padding: '1.25rem' }}>Artículo</th>
                                <th style={{ padding: '1.25rem' }}>Categoría</th>
                                <th style={{ padding: '1.25rem' }}>Stock Actual</th>
                                <th style={{ padding: '1.25rem' }}>Precio Venta</th>
                                <th style={{ padding: '1.25rem' }}>Coste</th>
                                <th style={{ padding: '1.25rem' }}>Margen</th>
                                <th style={{ padding: '1.25rem', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => {
                                const isLowStock = (product.currentStock || 0) <= (product.minStock || 5);
                                const margin = product.price - (product.costPrice || 0);
                                const marginPercent = product.price > 0 ? (margin / product.price * 100).toFixed(0) : 0;

                                return (
                                    <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ fontWeight: '500' }}>{product.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Prov: {product.supplier || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                                {product.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    color: isLowStock ? '#ef4444' : '#10b981'
                                                }}>
                                                    {product.currentStock} {product.unit}
                                                </span>
                                                {isLowStock && <AlertTriangle size={14} color="#ef4444" />}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Mín: {product.minStock}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                                            {product.price.toFixed(2)}€
                                        </td>
                                        <td style={{ padding: '1.25rem', color: '#94a3b8' }}>
                                            {(product.costPrice || 0).toFixed(2)}€
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ color: '#10b981', fontWeight: 'bold' }}>+{margin.toFixed(2)}€</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{marginPercent}%</div>
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setEditingProduct(product)}
                                                    className="btn-icon-small"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="btn-icon-small text-danger"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                            <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No se encontraron artículos con estos filtros.</p>
                        </div>
                    )}
                </div>

                {/* Modales */}
                <AnimatePresence>
                    {(isAdding || editingProduct) && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.form
                                onSubmit={isAdding ? handleSave : handleUpdate}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="glass-panel"
                                style={{ padding: '2rem', width: '90%', maxWidth: '600px', border: '1px solid var(--color-primary)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h2 style={{ margin: 0 }}>{isAdding ? 'Nuevo Artículo' : 'Editar Artículo'}</h2>
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="btn-icon"><X size={20} /></button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre del Artículo</label>
                                        <input
                                            required
                                            className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            value={isAdding ? form.name : editingProduct.name}
                                            onChange={e => isAdding ? setForm({ ...form, name: e.target.value }) : setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Categoría</label>
                                        <select
                                            className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white', background: '#1e293b' }}
                                            value={isAdding ? form.category : editingProduct.category}
                                            onChange={e => isAdding ? setForm({ ...form, category: e.target.value }) : setEditingProduct({ ...editingProduct, category: e.target.value })}
                                        >
                                            {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Proveedor</label>
                                        <input
                                            className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            value={isAdding ? form.supplier : editingProduct.supplier}
                                            onChange={e => isAdding ? setForm({ ...form, supplier: e.target.value }) : setEditingProduct({ ...editingProduct, supplier: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Stock Actual</label>
                                        <input
                                            type="number"
                                            className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            value={isAdding ? form.currentStock : editingProduct.currentStock}
                                            onChange={e => isAdding ? setForm({ ...form, currentStock: parseFloat(e.target.value) }) : setEditingProduct({ ...editingProduct, currentStock: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Stock Mínimo</label>
                                        <input
                                            type="number"
                                            className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            value={isAdding ? form.minStock : editingProduct.minStock}
                                            onChange={e => isAdding ? setForm({ ...form, minStock: parseFloat(e.target.value) }) : setEditingProduct({ ...editingProduct, minStock: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Precio Venta (€)</label>
                                        <input
                                            type="number" step="0.01"
                                            className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            value={isAdding ? form.price : editingProduct.price}
                                            onChange={e => isAdding ? setForm({ ...form, price: parseFloat(e.target.value) }) : setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Precio Coste (€)</label>
                                        <input
                                            type="number" step="0.01"
                                            className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            value={isAdding ? form.costPrice : editingProduct.costPrice}
                                            onChange={e => isAdding ? setForm({ ...form, costPrice: parseFloat(e.target.value) }) : setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="btn-secondary">Cancelar</button>
                                    <button type="submit" className="btn-primary">
                                        <Save size={18} /> {isAdding ? 'Crear Artículo' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </motion.form>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Inventory;
