import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useOrder } from '../context/OrderContext';
import { Wine, ArrowLeft, Plus, Search, Trash2, Edit3, Save, X, Info, TrendingUp, Camera, History, Package, BarChart3, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Bodega = () => {
    const navigate = useNavigate();
    const { wines, addWine, updateWine, deleteWine, addWineStock } = useInventory();
    const { salesHistory } = useOrder();
    const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'sales'
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingWine, setEditingWine] = useState(null);
    const [replenishId, setReplenishId] = useState(null);
    const [replenishQty, setReplenishQty] = useState(1);
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

    // Calculate Cellar Stats
    const stats = useMemo(() => {
        const totalStock = wines.reduce((sum, w) => sum + (parseInt(w.stock) || 0), 0);
        const totalValue = wines.reduce((sum, w) => sum + ((parseInt(w.stock) || 0) * (parseFloat(w.purchasePrice) || 0)), 0);
        const potentialRevenue = wines.reduce((sum, w) => sum + ((parseInt(w.stock) || 0) * (parseFloat(w.price) || 0)), 0);
        return { totalStock, totalValue, potentialRevenue };
    }, [wines]);

    // Filtered items
    const filteredWines = wines.filter(w =>
        (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.bodega || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.region || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const wineSales = useMemo(() => {
        const history = [];
        salesHistory.forEach(sale => {
            const items = Array.isArray(sale.items) ? sale.items : [];
            items.forEach(item => {
                if (item.isWine) {
                    history.push({
                        ...item,
                        saleDate: sale.date,
                        totalPrice: item.price * item.quantity
                    });
                }
            });
        });
        return history.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    }, [salesHistory]);

    const handleImageUpload = (e, isEditing = false) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 800 * 1024) {
                alert("La imagen es demasiado grande (máx 800KB)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                if (isEditing) {
                    setEditingWine(prev => ({ ...prev, image: result, imageFile: file }));
                } else {
                    setNewWine(prev => ({ ...prev, image: result, imageFile: file }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!newWine.name || !newWine.bodega) {
            alert("Nombre y Bodega son obligatorios");
            return;
        }

        try {
            // Ensure year is a valid number, default to current year if NaN
            const yearVal = isNaN(newWine.year) ? new Date().getFullYear() : newWine.year;
            await addWine({ ...newWine, year: yearVal });

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
        } catch (error) {
            // Error is handled in context alert, but we catch here to keep modal open
            console.error("Error in Bodega handleSave:", error);
        }
    };

    const handleUpdate = async () => {
        if (!editingWine) return;
        try {
            const yearVal = isNaN(editingWine.year) ? new Date().getFullYear() : editingWine.year;
            await updateWine(editingWine.id, { ...editingWine, year: yearVal });
            setEditingWine(null);
        } catch (error) {
            console.error("Error in Bodega handleUpdate:", error);
        }
    };

    const handleReplenish = async (id) => {
        if (replenishQty <= 0) return;
        try {
            await addWineStock(id, replenishQty);
            setReplenishId(null);
            setReplenishQty(1);
        } catch (error) {
            console.error("Error in Bodega handleReplenish:", error);
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
            <header className="header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} className="btn-icon-circle">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Gestión de Bodega</h1>
                        <p className="text-muted" style={{ margin: 0 }}>Control de stock, ventas y reposiciones</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={18} /> Añadir Vino
                    </button>
                </div>
            </header>

            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Stats Dashboard */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--color-primary)' }}>
                            <Package size={24} />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Stock Total</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.totalStock} <span style={{ fontSize: '0.9rem' }}>uds</span></div>
                        </div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--color-success)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Valor de Coste</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.totalValue.toFixed(2)}€</div>
                        </div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--color-warning)' }}>
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Ingresos Potenciales</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.potentialRevenue.toFixed(2)}€</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-strong)', paddingBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        <Package size={18} /> Almacén y Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        <History size={18} /> Historial de Ventas
                    </button>
                </div>

                {activeTab === 'stock' ? (
                    <>
                        <div className="surface-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <Search className="text-muted" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, bodega o región..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text)', width: '100%', outline: 'none', fontSize: '1rem' }}
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
                                            gap: '0.5rem',
                                            fontSize: '1.25rem'
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
                                                        className="surface-card"
                                                        style={{ padding: '1.5rem', position: 'relative', borderLeft: `4px solid ${section.color}` }}
                                                    >
                                                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                                                            <div style={{
                                                                width: '100px',
                                                                height: '140px',
                                                                background: '#f8fafc',
                                                                borderRadius: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                                border: '1px solid var(--border-strong)'
                                                            }}>
                                                                {(wine.image && (wine.image.startsWith('data:image') || wine.image.startsWith('http'))) ? (
                                                                    <img src={wine.image} alt={wine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ fontSize: '3.5rem' }}>{wine.image || '🍷'}</div>
                                                                )}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{wine.name}</h3>
                                                                <div className="text-primary" style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.25rem' }}>{wine.bodega}</div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.3rem 0.75rem', fontSize: '0.85rem' }}>
                                                                    <span className="text-muted">Región:</span> <span>{wine.region}</span>
                                                                    <span className="text-muted">Uva:</span> <span>{wine.grape}</span>
                                                                    <span className="text-muted">Añada:</span> <span>{wine.year}</span>
                                                                    <span className="text-muted">Tipo:</span> <span>{wine.type}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                            <div>
                                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Stock</div>
                                                                <div style={{
                                                                    fontSize: '1.1rem',
                                                                    fontWeight: '800',
                                                                    color: wine.stock <= 5 ? 'var(--color-danger)' : 'var(--color-text)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.4rem'
                                                                }}>
                                                                    {wine.stock}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setReplenishId(wine.id); }}
                                                                        className="btn-icon-small"
                                                                        style={{ width: '20px', height: '20px', background: 'var(--color-primary)', color: 'white', borderRadius: '4px' }}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>PVP</div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                                                                    {wine.price.toFixed(2)}€
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Beneficio</div>
                                                                <div className="text-success" style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                                                    +{(wine.price - (wine.purchasePrice || 0)).toFixed(2)}€
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Replenish Quick Form */}
                                                        <AnimatePresence>
                                                            {replenishId === wine.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-strong)', overflow: 'hidden' }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <input
                                                                                type="number"
                                                                                value={replenishQty}
                                                                                onChange={(e) => setReplenishQty(parseInt(e.target.value) || 0)}
                                                                                style={{ width: '100%', background: 'white', border: '1px solid var(--border-strong)', color: 'var(--color-text)', padding: '0.6rem', borderRadius: '8px', outline: 'none' }}
                                                                                autoFocus
                                                                            />
                                                                        </div>
                                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                            <button
                                                                                onClick={() => { setReplenishId(null); setReplenishQty(1); }}
                                                                                className="btn-icon-small"
                                                                            ><X size={16} /></button>
                                                                            <button
                                                                                onClick={() => handleReplenish(wine.id)}
                                                                                className="btn btn-primary"
                                                                                style={{ padding: '0.6rem' }}
                                                                            ><Save size={16} /></button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

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
                    </>
                ) : (
                    /* Ventas History View */
                    <div className="surface-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={24} className="text-primary" /> Historial de Ventas</h2>
                            <div className="text-muted" style={{ background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                                Ventas totales: <span className="text-primary">{wineSales.length}</span>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>Fecha</th>
                                        <th style={{ padding: '1rem' }}>Producto</th>
                                        <th style={{ padding: '1rem' }}>Cant.</th>
                                        <th style={{ padding: '1rem' }}>PVP</th>
                                        <th style={{ padding: '1rem' }}>Total</th>
                                        <th style={{ padding: '1rem' }}>Beneficio Estimado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {wineSales.map((sale, idx) => {
                                        const profit = (sale.price - (sale.purchasePrice || 0)) * sale.quantity;
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(sale.saleDate).toLocaleString()}</td>
                                                <td style={{ padding: '1rem', fontWeight: '600' }}>{sale.name}</td>
                                                <td style={{ padding: '1rem', fontWeight: '600' }}>{sale.quantity}</td>
                                                <td style={{ padding: '1rem' }}>{sale.price.toFixed(2)}€</td>
                                                <td style={{ padding: '1rem', fontWeight: '800' }}>{sale.totalPrice.toFixed(2)}€</td>
                                                <td style={{ padding: '1rem', fontWeight: '800' }} className="text-success">+{profit.toFixed(2)}€</td>
                                            </tr>
                                        );
                                    })}
                                    {wineSales.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '4rem', textAlign: 'center' }} className="text-muted">
                                                No se han registrado ventas de vino todavía.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal Añadir/Editar */}
                {(isAdding || editingWine) && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="surface-card"
                            style={{ width: '100%', maxWidth: '650px', padding: '2.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>{isAdding ? 'Nuevo Vino' : 'Editar Vino'}</h2>
                                <button onClick={() => { setIsAdding(false); setEditingWine(null); }} className="btn-icon-circle" style={{ width: '32px', height: '32px' }}><X size={18} /></button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '120px',
                                        height: '160px',
                                        background: '#f8fafc',
                                        borderRadius: '16px',
                                        border: '1px dashed var(--border-strong)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {(isAdding ? newWine.image : editingWine.image)?.startsWith('data:image') ? (
                                            <img src={isAdding ? newWine.image : editingWine.image} alt="Vino" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ fontSize: '4rem' }}>{isAdding ? newWine.image : editingWine.image}</div>
                                        )}
                                    </div>
                                    <label style={{
                                        position: 'absolute',
                                        bottom: '-10px',
                                        right: '-10px',
                                        background: 'var(--color-primary)',
                                        padding: '8px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Camera size={20} color="white" />
                                        <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, !!editingWine)} />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Nombre del Vino</label>
                                    <input
                                        value={isAdding ? newWine.name : editingWine.name}
                                        onChange={(e) => isAdding ? setNewWine({ ...newWine, name: e.target.value }) : setEditingWine({ ...editingWine, name: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Bodega</label>
                                    <input
                                        value={isAdding ? newWine.bodega : editingWine.bodega}
                                        onChange={(e) => isAdding ? setNewWine({ ...newWine, bodega: e.target.value }) : setEditingWine({ ...editingWine, bodega: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Región / D.O.</label>
                                    <input
                                        value={isAdding ? newWine.region : editingWine.region}
                                        onChange={(e) => isAdding ? setNewWine({ ...newWine, region: e.target.value }) : setEditingWine({ ...editingWine, region: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Uva</label>
                                    <input
                                        value={isAdding ? newWine.grape : editingWine.grape}
                                        onChange={(e) => isAdding ? setNewWine({ ...newWine, grape: e.target.value }) : setEditingWine({ ...editingWine, grape: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Añada</label>
                                    <input
                                        type="number"
                                        value={isAdding ? newWine.year : editingWine.year}
                                        onChange={(e) => isAdding ? setNewWine({ ...newWine, year: parseInt(e.target.value) }) : setEditingWine({ ...editingWine, year: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Tipo de Vino</label>
                                    <select
                                        value={isAdding ? newWine.type : editingWine.type}
                                        onChange={(e) => {
                                            const type = e.target.value;
                                            const icon = type === 'Tinto' ? '🍷' : type === 'Blanco' ? '🥂' : type === 'Vermut' ? '🥃' : type === 'Espumoso' ? '🍾' : '🍇';
                                            isAdding ? setNewWine({ ...newWine, type, image: icon }) : setEditingWine({ ...editingWine, type, image: icon })
                                        }}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none', background: 'white' }}
                                    >
                                        <option value="Tinto">Tinto</option>
                                        <option value="Blanco">Blanco</option>
                                        <option value="Rosado">Rosado</option>
                                        <option value="Espumoso">Espumoso</option>
                                        <option value="Vermut">Vermut / Aperitivo</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Stock Botellas</label>
                                    <input
                                        type="number"
                                        value={isAdding ? newWine.stock : editingWine.stock}
                                        onChange={(e) => isAdding ? setNewWine({ ...newWine, stock: parseInt(e.target.value) }) : setEditingWine({ ...editingWine, stock: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Precio Venta (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={isAdding ? newWine.price : editingWine.price}
                                        onChange={(e) => isAdding ? setNewWine({ ...newWine, price: parseFloat(e.target.value) }) : setEditingWine({ ...editingWine, price: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Precio Compra (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={isAdding ? newWine.purchasePrice : editingWine.purchasePrice}
                                        onChange={(e) => isAdding ? setNewWine({ ...newWine, purchasePrice: parseFloat(e.target.value) }) : setEditingWine({ ...editingWine, purchasePrice: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setIsAdding(false); setEditingWine(null); }} className="btn btn-secondary">Cancelar</button>
                                <button onClick={isAdding ? handleSave : handleUpdate} className="btn btn-primary">
                                    <Save size={18} /> {isAdding ? 'Guardar Vino' : 'Actualizar'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bodega;
