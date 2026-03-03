import React, { useState, useMemo } from 'react';
import { useEvents } from '../context/EventContext';
import { useInventory } from '../context/InventoryContext'; // For company info in print
import { printEventInventoryA4 } from '../utils/printHelpers';
import {
    Package, Plus, Settings, Trash2, Edit, Save, X, Search,
    Printer, Filter, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EventInventory = () => {
    const { eventInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useEvents();
    const { restaurantInfo } = useInventory(); // Get company info for the print header

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Mobiliario',
        quantity: '',
        notes: ''
    });

    const categories = ['Todas', 'Mobiliario', 'Menaje', 'Mantelería', 'Audiovisual', 'Decoración', 'Climatización', 'Otros'];
    const formCategories = categories.filter(c => c !== 'Todas');

    const filteredItems = useMemo(() => {
        return (eventInventory || []).filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [eventInventory, searchTerm, selectedCategory]);

    const handleOpenAdd = () => {
        setFormData({ name: '', category: 'Mobiliario', quantity: '', notes: '' });
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            category: item.category || 'Otros',
            quantity: item.quantity,
            notes: item.notes || ''
        });
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || formData.quantity === '') {
            alert('Por favor, indica el nombre y la cantidad.');
            return;
        }

        const itemData = {
            ...formData,
            quantity: parseInt(formData.quantity) || 0
        };

        if (editingItem) {
            updateInventoryItem(editingItem.id, itemData);
        } else {
            addInventoryItem(itemData);
        }

        setIsFormOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Seguro que deseas eliminar este artículo del inventario?')) {
            deleteInventoryItem(id);
        }
    };

    const handlePrint = () => {
        if (!eventInventory || eventInventory.length === 0) {
            alert('El inventario está vacío, no hay nada que imprimir.');
            return;
        }
        printEventInventoryA4(eventInventory, restaurantInfo);
    };

    // Calculate quick stats
    const totalItems = eventInventory ? eventInventory.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0) : 0;
    const distinctItems = eventInventory ? eventInventory.length : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
            {/* Header & Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text)', fontSize: '1.5rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                            <Package size={24} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        Inventario del Local
                    </h2>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)' }}>
                        Gestiona el mobiliario y material disponible para eventos y alquileres.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="surface-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipos de Artículo</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{distinctItems}</span>
                    </div>
                    <div className="surface-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Unidades</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{totalItems}</span>
                    </div>
                </div>
            </div>

            {/* Actions & Filters */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar artículo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field"
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg)', padding: '0.2rem', borderRadius: '10px', border: '1px solid var(--border-strong)' }}>
                        <Filter size={18} style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', padding: '0.5rem', outline: 'none', fontWeight: '500', cursor: 'pointer' }}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handlePrint} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={18} /> Imprimir Anexo A4
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Añadir Artículo
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

                {/* List */}
                <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-strong)' }}>Artículo</th>
                                    <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-strong)' }}>Categoría</th>
                                    <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-strong)', textAlign: 'center' }}>Cantidad</th>
                                    <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-strong)', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                            <Package size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                            <p style={{ margin: 0, fontSize: '1.1rem' }}>No se encontraron artículos</p>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Modifica tu búsqueda o añade un artículo nuevo.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item, idx) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-strong)', background: idx % 2 === 0 ? 'var(--color-bg)' : 'transparent', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: 'bold', color: 'var(--color-text)', fontSize: '1.05rem' }}>{item.name}</div>
                                                {item.notes && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{item.notes}</div>}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text)' }}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleEdit(item)} className="btn-icon-small" title="Editar">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="btn-icon-small text-danger" title="Eliminar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Sidebar */}
                <AnimatePresence>
                    {isFormOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: '400px' }}
                            exit={{ opacity: 0, x: 20, width: 0 }}
                            style={{ overflow: 'hidden', flexShrink: 0 }}
                        >
                            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '400px', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text)' }}>
                                        {editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}
                                    </h3>
                                    <button onClick={() => setIsFormOpen(false)} className="btn-icon" style={{ border: 'none', background: 'none' }}><X size={20} /></button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div className="form-group">
                                        <label>Nombre del Artículo *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Ej. Silla de tijera madera"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>Categoría</label>
                                            <select
                                                className="input-field"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                {formCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Cantidad *</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="0"
                                                value={formData.quantity}
                                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Notas Adicionales</label>
                                        <textarea
                                            className="input-field"
                                            rows="3"
                                            placeholder="Detalles, estado, ubicación..."
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button onClick={() => setIsFormOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                        Cancelar
                                    </button>
                                    <button onClick={handleSave} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                        <Save size={18} /> Guardar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EventInventory;
