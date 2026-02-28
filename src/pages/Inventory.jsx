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
            <header className="header-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-icon-circle"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Almacén (Matriz)</h1>
                        <p className="text-muted" style={{ margin: 0 }}>Control centralizado de existencias</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary">
                        <Download size={18} /> Exportar
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={18} /> Nuevo Artículo
                    </button>
                </div>
            </header>

            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Dashboard Corto */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--color-primary)' }}><Package size={24} /></div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Valor Inventario</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.totalValue.toFixed(2)}€</div>
                        </div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--color-warning)' }}><AlertTriangle size={24} /></div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Stock Bajo</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{lowStockProducts.length} <span style={{ fontSize: '0.9rem' }} className="text-muted">artículos</span></div>
                        </div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--color-success)' }}><TrendingUp size={24} /></div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Venta Potencial</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.potentialRevenue.toFixed(2)}€</div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="surface-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} className="text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar artículo..."
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem 0.85rem 3rem',
                                background: '#f8fafc',
                                border: '1px solid var(--border-strong)',
                                borderRadius: '12px',
                                outline: 'none'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`btn ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabla de Artículos */}
                <div className="surface-card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ fontWeight: '600' }}>{product.name}</div>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Prov: {product.supplier || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: '#f1f5f9', borderRadius: '20px', fontWeight: '500' }}>
                                                {product.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontWeight: '700',
                                                    color: isLowStock ? 'var(--color-danger)' : 'var(--color-success)'
                                                }}>
                                                    {product.currentStock} {product.unit}
                                                </span>
                                                {isLowStock && <AlertTriangle size={14} className="text-danger" />}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Mín: {product.minStock}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
                                            {product.price.toFixed(2)}€
                                        </td>
                                        <td style={{ padding: '1.25rem' }} className="text-muted">
                                            {(product.costPrice || 0).toFixed(2)}€
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div className="text-success" style={{ fontWeight: '700' }}>+{margin.toFixed(2)}€</div>
                                            <div style={{ fontSize: '0.75rem' }} className="text-muted">{marginPercent}%</div>
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <Search size={48} className="text-muted" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p className="text-muted">No se encontraron artículos con estos filtros.</p>
                        </div>
                    )}
                </div>

                {/* Modales */}
                <AnimatePresence>
                    {(isAdding || editingProduct) && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            <motion.form
                                onSubmit={isAdding ? handleSave : handleUpdate}
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="surface-card"
                                style={{ padding: '2.5rem', width: '90%', maxWidth: '650px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                    <h2 style={{ margin: 0 }}>{isAdding ? 'Nuevo Artículo' : 'Editar Artículo'}</h2>
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="btn-icon-circle" style={{ width: '32px', height: '32px' }}><X size={18} /></button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Nombre del Artículo</label>
                                        <input
                                            required
                                            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                            value={isAdding ? form.name : editingProduct.name}
                                            onChange={e => isAdding ? setForm({ ...form, name: e.target.value }) : setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Categoría</label>
                                        <select
                                            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none', background: 'white' }}
                                            value={isAdding ? form.category : editingProduct.category}
                                            onChange={e => isAdding ? setForm({ ...form, category: e.target.value }) : setEditingProduct({ ...editingProduct, category: e.target.value })}
                                        >
                                            {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Proveedor</label>
                                        <input
                                            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                            value={isAdding ? form.supplier : editingProduct.supplier}
                                            onChange={e => isAdding ? setForm({ ...form, supplier: e.target.value }) : setEditingProduct({ ...editingProduct, supplier: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Stock Actual</label>
                                        <input
                                            type="number"
                                            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                            value={isAdding ? form.currentStock : editingProduct.currentStock}
                                            onChange={e => isAdding ? setForm({ ...form, currentStock: parseFloat(e.target.value) }) : setEditingProduct({ ...editingProduct, currentStock: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Stock Mínimo</label>
                                        <input
                                            type="number"
                                            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                            value={isAdding ? form.minStock : editingProduct.minStock}
                                            onChange={e => isAdding ? setForm({ ...form, minStock: parseFloat(e.target.value) }) : setEditingProduct({ ...editingProduct, minStock: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Precio Venta (€)</label>
                                        <input
                                            type="number" step="0.01"
                                            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                            value={isAdding ? form.price : editingProduct.price}
                                            onChange={e => isAdding ? setForm({ ...form, price: parseFloat(e.target.value) || 0 }) : setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Precio Coste (€)</label>
                                        <input
                                            type="number" step="0.01"
                                            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                            value={isAdding ? form.costPrice : editingProduct.costPrice}
                                            onChange={e => isAdding ? setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 }) : setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem' }}>
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="btn btn-secondary">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">
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
