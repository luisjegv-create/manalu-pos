import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { Wine, ArrowLeft, Plus, Search, Trash2, Edit3, Save, X, Info, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Bodega = () => {
    const navigate = useNavigate();
    const { wines, addWine, updateWine, deleteWine } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingWine, setEditingWine] = useState(null);
    const [newWine, setNewWine] = useState({
        name: '',
        bodega: '',
        region: '',
        grape: '',
        year: new Date().getFullYear(),
        stock: 0,
        price: 0,
        purchasePrice: 0,
        type: 'Tinto',
        image: '🍷'
    });

    const filteredWines = wines.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.bodega.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.region.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = () => {
        if (!newWine.name || !newWine.bodega) return;
        addWine(newWine);
        setNewWine({
            name: '',
            bodega: '',
            region: '',
            grape: '',
            year: new Date().getFullYear(),
            stock: 0,
            price: 0,
            purchasePrice: 0,
            type: 'Tinto',
            image: '🍷'
        });
        setIsAdding(false);
    };

    const handleUpdate = () => {
        if (!editingWine) return;
        updateWine(editingWine.id, editingWine);
        setEditingWine(null);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} className="btn-icon">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>Bodega de Vinos</h1>
                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Gestión de existencias y fichas técnicas</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Añadir Vino
                </button>
            </header>

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <Search className="text-muted" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, bodega o región..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                />
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {[
                    { id: 'Vermut', label: 'Vermuts y Aperitivos', color: '#f97316' },
                    { id: 'Blanco', label: 'Vinos Blancos', color: '#eab308' },
                    { id: 'Tinto', label: 'Vinos Tintos', color: '#881337' },
                    { id: 'Rosado', label: 'Vinos Rosados', color: '#ec4899' },
                    { id: 'Espumoso', label: 'Espumosos y Cavas', color: '#e11d48' }
                ].map(section => {
                    const sectionWines = filteredWines.filter(w => w.type === section.id);
                    if (sectionWines.length === 0) return null;

                    return (
                        <div key={section.id}>
                            <h2 style={{
                                color: section.color,
                                borderBottom: `2px solid ${section.color}`,
                                paddingBottom: '0.5rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {section.id === 'Vermut' ? '🥃' : section.id === 'Blanco' ? '🥂' : section.id === 'Tinto' ? '🍷' : section.id === 'Rosado' ? '🌷' : '🍾'} {section.label}
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                <AnimatePresence>
                                    {sectionWines.map(wine => (
                                        <motion.div
                                            key={wine.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="glass-panel"
                                            style={{ padding: '1.5rem', position: 'relative', borderLeft: `4px solid ${section.color}` }}
                                        >
                                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                                <div style={{ fontSize: '3rem' }}>{wine.image}</div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{wine.name}</h3>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '0.25rem' }}>{wine.bodega}</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                        <span className="text-muted">Región:</span> <span>{wine.region}</span>
                                                        <span className="text-muted">Uva:</span> <span>{wine.grape}</span>
                                                        <span className="text-muted">Añada:</span> <span>{wine.year}</span>
                                                        <span className="text-muted">Tipo:</span> <span>{wine.type}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Stock</div>
                                                    <div style={{
                                                        fontSize: '1.1rem',
                                                        fontWeight: 'bold',
                                                        color: wine.stock <= 5 ? '#ef4444' : 'white'
                                                    }}>
                                                        {wine.stock} uds
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PVP / Compra</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                                        <span style={{ color: 'var(--color-secondary)' }}>{wine.price.toFixed(2)}€</span>
                                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginLeft: '0.4rem' }}>({wine.purchasePrice?.toFixed(2)}€)</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                                                        <TrendingUp size={12} /> Beneficio
                                                    </div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                                                        +{(wine.price - (wine.purchasePrice || 0)).toFixed(2)}€
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => setEditingWine(wine)} className="btn-icon-small"><Edit3 size={16} /></button>
                                                <button onClick={() => deleteWine(wine.id)} className="btn-icon-small text-danger"><Trash2 size={16} /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Añadir/Editar */}
            {(isAdding || editingWine) && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel"
                        style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}
                    >
                        <h2>{isAdding ? 'Nuevo Vino' : 'Editar Vino'}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>Nombre del Vino</label>
                                <input
                                    value={isAdding ? newWine.name : editingWine.name}
                                    onChange={(e) => isAdding ? setNewWine({ ...newWine, name: e.target.value }) : setEditingWine({ ...editingWine, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Bodega</label>
                                <input
                                    value={isAdding ? newWine.bodega : editingWine.bodega}
                                    onChange={(e) => isAdding ? setNewWine({ ...newWine, bodega: e.target.value }) : setEditingWine({ ...editingWine, bodega: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Región / D.O.</label>
                                <input
                                    value={isAdding ? newWine.region : editingWine.region}
                                    onChange={(e) => isAdding ? setNewWine({ ...newWine, region: e.target.value }) : setEditingWine({ ...editingWine, region: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Uva</label>
                                <input
                                    value={isAdding ? newWine.grape : editingWine.grape}
                                    onChange={(e) => isAdding ? setNewWine({ ...newWine, grape: e.target.value }) : setEditingWine({ ...editingWine, grape: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Añada</label>
                                <input
                                    type="number"
                                    value={isAdding ? newWine.year : editingWine.year}
                                    onChange={(e) => isAdding ? setNewWine({ ...newWine, year: parseInt(e.target.value) }) : setEditingWine({ ...editingWine, year: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tipo de Vino</label>
                                <select
                                    value={isAdding ? newWine.type : editingWine.type}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        const icon = type === 'Tinto' ? '🍷' : type === 'Blanco' ? '🥂' : type === 'Vermut' ? '🥃' : type === 'Espumoso' ? '🍾' : '🍇';
                                        isAdding ? setNewWine({ ...newWine, type, image: icon }) : setEditingWine({ ...editingWine, type, image: icon })
                                    }}
                                >
                                    <option value="Tinto">Tinto</option>
                                    <option value="Blanco">Blanco</option>
                                    <option value="Rosado">Rosado</option>
                                    <option value="Espumoso">Espumoso</option>
                                    <option value="Vermut">Vermut / Aperitivo</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Stock Botellas</label>
                                <input
                                    type="number"
                                    value={isAdding ? newWine.stock : editingWine.stock}
                                    onChange={(e) => isAdding ? setNewWine({ ...newWine, stock: parseInt(e.target.value) }) : setEditingWine({ ...editingWine, stock: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Precio Venta (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={isAdding ? newWine.price : editingWine.price}
                                    onChange={(e) => isAdding ? setNewWine({ ...newWine, price: parseFloat(e.target.value) }) : setEditingWine({ ...editingWine, price: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Precio Compra (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={isAdding ? newWine.purchasePrice : editingWine.purchasePrice}
                                    onChange={(e) => isAdding ? setNewWine({ ...newWine, purchasePrice: parseFloat(e.target.value) }) : setEditingWine({ ...editingWine, purchasePrice: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setIsAdding(false); setEditingWine(null); }} className="btn-secondary">Cancelar</button>
                            <button onClick={isAdding ? handleSave : handleUpdate} className="btn-primary">
                                <Save size={18} /> {isAdding ? 'Guardar Vino' : 'Actualizar'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Bodega;
