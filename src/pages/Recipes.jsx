import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import {
    ArrowLeft,
    ChevronRight,
    Plus,
    Trash2,
    Calculator,
    PieChart,
    Save,
    Package,
    ArrowUpRight,
    Edit3,
    X,
    Utensils,
    Sandwich,
    Beer,
    Cake,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Recipes = () => {
    const navigate = useNavigate();
    const {
        salesProducts = [],
        ingredients = [],
        recipes = {},
        updateRecipe,
        getProductCost,
        addProduct,
        updateProduct,
        deleteProduct,
        wines = []
    } = useInventory();

    const [selectedProductId, setSelectedProductId] = useState(null);
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);

    const [productForm, setProductForm] = useState({
        name: '',
        price: 0,
        category: 'tapas',
        image: '🍽️',
        description: '',
        allergens: [],
        recommendedWine: '',
        isDigitalMenuVisible: true
    });

    const selectedProduct = salesProducts.find(p => p.id === selectedProductId);
    const currentRecipe = (selectedProductId && Array.isArray(recipes[selectedProductId])) ? recipes[selectedProductId] : [];

    // Helper to get ingredient details
    const getIng = (id) => ingredients.find(i => i.id === id);

    const handleAddIngredientToRecipe = () => {
        const firstIngredient = ingredients[0];
        if (!firstIngredient) return;

        const newRecipe = [...currentRecipe, { ingredientId: firstIngredient.id, quantity: 1 }];
        updateRecipe(selectedProductId, newRecipe);
    };

    const handleUpdateIngredient = (index, field, value) => {
        const newRecipe = [...currentRecipe];
        newRecipe[index] = { ...newRecipe[index], [field]: value };
        updateRecipe(selectedProductId, newRecipe);
    };

    const handleRemoveIngredient = (index) => {
        const newRecipe = currentRecipe.filter((_, i) => i !== index);
        updateRecipe(selectedProductId, newRecipe);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Limit to ~500KB to avoid localStorage quota issues
            if (file.size > 500 * 1024) {
                alert("La imagen es demasiado grande. Por favor usa una imagen menor de 500KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductForm(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProduct = () => {
        try {
            if (isEditingProduct && selectedProductId) {
                updateProduct(selectedProductId, productForm);
                setIsEditingProduct(false);
            } else {
                addProduct(productForm);
                setIsAddingProduct(false);
            }
            setProductForm({ name: '', price: 0, category: 'tapas', image: '🍽️', description: '', allergens: [], recommendedWine: '', isDigitalMenuVisible: true });
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Error al guardar el producto. Puede que la imagen sea muy pesada o el almacenamiento esté lleno.");
        }
    };

    const startEditProduct = () => {
        if (!selectedProduct) return;
        setProductForm({
            name: selectedProduct.name,
            price: selectedProduct.price,
            category: selectedProduct.category,
            image: selectedProduct.image,
            description: selectedProduct.description || '',
            allergens: Array.isArray(selectedProduct.allergens) ? selectedProduct.allergens : [],
            recommendedWine: selectedProduct.recommendedWine || '',
            isDigitalMenuVisible: selectedProduct.isDigitalMenuVisible !== false
        });
        setIsEditingProduct(true);
    };

    const cost = selectedProductId ? getProductCost(selectedProductId) : 0;
    const price = selectedProduct?.price || 0;
    const margin = price > 0 ? ((price - cost) / price * 100).toFixed(1) : 0;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                    >
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>Escandallos y Productos</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Configuración de carta y costes</p>
                    </div>
                </div>
                <button className="btn-primary" onClick={() => setIsAddingProduct(true)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Nuevo Producto (Venta)
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>

                {/* Product Sidebar */}
                <div className="glass-panel" style={{ height: 'calc(100vh - 200px)', overflowY: 'auto', padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Carta de Productos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {salesProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => setSelectedProductId(product.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: selectedProductId === product.id ? '1px solid var(--color-primary)' : '1px solid transparent',
                                    background: selectedProductId === product.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                            >
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
                                        {(String(product.image || '').startsWith('data:image') || String(product.image || '').startsWith('http') || String(product.image || '').startsWith('/'))
                                            ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : product.image || '🍽️'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.price.toFixed(2)}€</div>
                                    </div>
                                </div>
                                <ChevronRight size={16} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Add/Edit Product Form overlay-style */}
                    <AnimatePresence>
                        {(isAddingProduct || isEditingProduct) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-panel"
                                style={{ padding: '2rem', border: '1px solid var(--color-primary)', position: 'relative' }}
                            >
                                <h3>{isEditingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Nombre del Plato/Bebida</label>
                                        <input
                                            type="text"
                                            className="glass-panel"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                            value={productForm.name}
                                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Precio de Venta (€)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="glass-panel"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Categoría</label>
                                        <select
                                            className="glass-panel"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                            value={productForm.category}
                                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                        >
                                            <option value="tapas" style={{ background: '#0f172a' }}>Tapas</option>
                                            <option value="bocatas" style={{ background: '#0f172a' }}>Bocatas</option>
                                            <option value="bebidas" style={{ background: '#0f172a' }}>Bebidas</option>
                                            <option value="postres" style={{ background: '#0f172a' }}>Postres</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Imagen / Foto del Plato</label>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '60px', height: '60px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '8px', border: '1px dashed var(--glass-border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.5rem', overflow: 'hidden'
                                            }}>
                                                {String(productForm.image || '').startsWith('data:image')
                                                    ? <img src={productForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : productForm.image || '🍽️'}
                                            </div>
                                            <label className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Camera size={14} /> Subir Foto
                                                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="O usa un Emoji"
                                                className="glass-panel"
                                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                                value={String(productForm.image || '').startsWith('data:image') ? '' : productForm.image}
                                                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                                        <label>Maridaje: Vino Recomendado</label>
                                        <select
                                            className="glass-panel"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                            value={productForm.recommendedWine}
                                            onChange={(e) => setProductForm({ ...productForm, recommendedWine: e.target.value })}
                                        >
                                            <option value="">-- Sin recomendación --</option>
                                            {Array.isArray(wines) && wines.map(w => (
                                                <option key={w.id} value={w.id} style={{ background: '#0f172a' }}>
                                                    {w.type === 'Tinto' ? '🍷' : w.type === 'Blanco' ? '🥂' : '🍾'} {w.name} ({w.bodega})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                                        <label>Alérgenos</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {['gluten', 'lacteos', 'huevos', 'pescado', 'frutos_secos', 'vegano'].map(all => (
                                                <label key={all} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                                                    padding: '0.4rem 0.8rem', background: (productForm.allergens || []).includes(all) ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                                                    borderColor: (productForm.allergens || []).includes(all) ? '#fbbf24' : 'transparent',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(productForm.allergens || []).includes(all)}
                                                        onChange={(e) => {
                                                            const currentAllergens = productForm.allergens || [];
                                                            const newAll = e.target.checked
                                                                ? [...currentAllergens, all]
                                                                : currentAllergens.filter(a => a !== all);
                                                            setProductForm({ ...productForm, allergens: newAll });
                                                        }}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {all.charAt(0).toUpperCase() + all.slice(1).replace('_', ' ')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', gridColumn: 'span 2' }}>
                                        <input
                                            type="checkbox"
                                            id="menu-visible"
                                            checked={productForm.isDigitalMenuVisible}
                                            onChange={(e) => setProductForm({ ...productForm, isDigitalMenuVisible: e.target.checked })}
                                        />
                                        <label htmlFor="menu-visible" style={{ cursor: 'pointer' }}>Visible en el Menú Digital (QR)</label>
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(false); setProductForm({ name: '', price: 0, category: 'tapas', image: '🍽️', description: '', allergens: [], isDigitalMenuVisible: true }); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>Cancelar</button>
                                    <button className="btn-primary" onClick={handleSaveProduct}>Guardar Producto</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {selectedProduct ? (
                        <>
                            {/* Product Header Card */}
                            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '2.5rem' }}>{selectedProduct.image}</span>
                                    <div>
                                        <h2 style={{ margin: 0 }}>{selectedProduct.name}</h2>
                                        <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>{selectedProduct.category}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={startEditProduct} className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <Edit3 size={18} /> Modificar Producto
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('¿Borrar producto y su receta?')) deleteProduct(selectedProductId); }}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="glass-panel" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                                <div style={{ borderRight: '1px solid var(--glass-border)' }}>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>P.V.P (Venta)</p>
                                    <h2 style={{ margin: '0.5rem 0', color: 'var(--color-primary)' }}>{price.toFixed(2)}€</h2>
                                </div>
                                <div style={{ borderRight: '1px solid var(--glass-border)' }}>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Coste Ingredientes</p>
                                    <h2 style={{ margin: '0.5rem 0', color: '#ef4444' }}>{cost.toFixed(2)}€</h2>
                                </div>
                                <div>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Margen Bruto</p>
                                    <h2 style={{ margin: '0.5rem 0', color: '#10b981' }}>{margin}%</h2>
                                </div>
                            </div>

                            {/* Ingredients Table */}
                            <div className="glass-panel" style={{ flex: 1, padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={20} /> Composición de {selectedProduct.name}
                                    </h3>
                                    <button className="btn-primary" onClick={handleAddIngredientToRecipe} style={{ fontSize: '0.85rem' }}>
                                        <Plus size={16} /> Añadir Ingrediente
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {currentRecipe.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)', border: '2px dashed var(--glass-border)', borderRadius: '1rem' }}>
                                            No hay ingredientes en esta receta.
                                        </div>
                                    ) : (
                                        currentRecipe.map((item, index) => {
                                            const ing = getIng(item.ingredientId);
                                            return (
                                                <div key={index} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ingrediente</label>
                                                        <select
                                                            className="glass-panel"
                                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white', width: '100%' }}
                                                            value={item.ingredientId}
                                                            onChange={(e) => handleUpdateIngredient(index, 'ingredientId', e.target.value)}
                                                        >
                                                            {ingredients.map(i => (
                                                                <option key={i.id} value={i.id} style={{ background: '#0f172a' }}>{i.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Cantidad</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="glass-panel"
                                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>

                                                    <div style={{ width: '80px', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                        {ing?.unit || 'uds'}
                                                    </div>

                                                    <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Subtotal</label>
                                                        <div style={{ fontWeight: 'bold' }}>{(item.quantity * (ing?.cost || 0)).toFixed(2)}€</div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveIngredient(index)}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', alignSelf: 'center' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', padding: '4rem' }}>
                            <PieChart size={64} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                            <h2>Control de Carta y Escandallos</h2>
                            <p>Crea nuevos productos o selecciona uno de la izquierda para editar su receta y calcular márgenes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recipes;

