import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Trash2, X } from 'lucide-react';

const ProductEditorModal = ({
    isOpen,
    onClose,
    newProductForm,
    setNewProductForm,
    newProductRecipe,
    setNewProductRecipe,
    ingredients,
    categories,
    handleImageUpload,
    handleSaveNewProduct
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel"
                style={{ padding: '2rem', width: '90%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Nuevo Producto</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Left: Basic Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Nombre del Producto</label>
                            <input
                                placeholder="Ej: Hamburguesa Manalu"
                                value={newProductForm.name}
                                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                                className="glass-panel"
                                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label>Precio de Venta</label>
                            <input
                                type="number"
                                value={newProductForm.price}
                                onChange={(e) => setNewProductForm({ ...newProductForm, price: parseFloat(e.target.value) || 0 })}
                                className="glass-panel"
                                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label>Icono / Imagen</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                <input
                                    value={newProductForm.image}
                                    onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                                    className="glass-panel"
                                    style={{ width: '60px', padding: '0.75rem', color: 'white', textAlign: 'center', fontSize: '1.2rem' }}
                                />
                                <label className="btn-secondary" style={{ cursor: 'pointer', padding: '0.5rem' }}>
                                    <Camera size={18} />
                                    <input type="file" hidden onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                        <div>
                            <label>Categoría</label>
                            <select
                                value={newProductForm.category}
                                onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                                className="glass-panel"
                                style={{ width: '100%', padding: '0.75rem', background: '#1e293b', color: 'white' }}
                            >
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Right: Recipe Builder */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ color: '#10b981' }}>Receta / Costes</h3>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', minHeight: '150px' }}>
                            {newProductRecipe.map((item, idx) => {
                                const ing = ingredients.find(i => i.id === item.ingredientId);
                                return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.9rem' }}>{ing?.name}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="number" value={item.quantity} onChange={(e) => {
                                                const upd = [...newProductRecipe];
                                                upd[idx].quantity = parseFloat(e.target.value) || 0;
                                                setNewProductRecipe(upd);
                                            }} style={{ width: '50px', background: '#333', color: 'white', border: 'none' }} />
                                            <button onClick={() => setNewProductRecipe(prev => prev.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'none', border: 'none' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select id="ing-sel" className="glass-panel" style={{ flex: 1, padding: '0.5rem', background: '#1e293b', color: 'white' }}>
                                {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                            </select>
                            <button onClick={() => {
                                const s = document.getElementById('ing-sel');
                                if (s.value) setNewProductRecipe(prev => [...prev, { ingredientId: s.value, quantity: 1 }]);
                            }} className="btn-primary"><Plus size={18} /></button>
                        </div>
                    </div>
                </div>

                <button onClick={handleSaveNewProduct} className="btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>Guardar Producto</button>
            </motion.div>
        </div>
    );
};

export default ProductEditorModal;
