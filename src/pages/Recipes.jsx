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
import { categories as categoriesData } from '../data/products';

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

    // Mobile Responsiveness
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [productForm, setProductForm] = useState({
        name: '',
        price: 0,
        category: 'raciones',
        image: '🍽️',
        description: '',
        allergens: [],
        recommendedWine: '',
        isDigitalMenuVisible: true,
        subcategory: null
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
            setProductForm({ name: '', price: 0, category: 'raciones', image: '🍽️', description: '', allergens: [], recommendedWine: '', isDigitalMenuVisible: true });
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
            isDigitalMenuVisible: selectedProduct.isDigitalMenuVisible !== false,
            subcategory: selectedProduct.subcategory || null
        });
        setIsEditingProduct(true);
    };

    const cost = selectedProductId ? getProductCost(selectedProductId) : 0;
    const price = selectedProduct?.price || 0;
    const margin = price > 0 ? ((price - cost) / price * 100).toFixed(1) : 0;

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                    >
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem' }}>Escandallos y Productos</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: isMobile ? '0.8rem' : '1rem' }}>Configuración de carta e ingredientes</p>
                    </div>
                </div>
                <button className="btn-primary" onClick={() => setIsAddingProduct(true)} style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> {isMobile ? 'Nuevo Producto' : 'Nuevo Producto (Venta)'}
                </button>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '350px 1fr',
                gap: isMobile ? '1rem' : '2rem'
            }}>

                {/* Product Sidebar */}
                <div className="glass-panel" style={{
                    height: isMobile ? '300px' : 'calc(100vh - 200px)',
                    overflowY: 'auto',
                    padding: '1rem'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Carta de Productos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {salesProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => setSelectedProductId(product.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem',
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
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '6px',
                                        overflow: 'hidden'
                                    }}>
                                        {(String(product.image || '').startsWith('data:image') || String(product.image || '').startsWith('http') || String(product.image || '').startsWith('/'))
                                            ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : product.image || '🍽️'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{product.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{product.price.toFixed(2)}€</div>
                                    </div>
                                </div>
                                <ChevronRight size={14} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '2rem' }}>

                    {/* Add/Edit Product Form overlay-style */}
                    <AnimatePresence>
                        {(isAddingProduct || isEditingProduct) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-panel"
                                style={{
                                    padding: isMobile ? '1rem' : '2rem',
                                    border: '1px solid var(--color-primary)',
                                    position: 'relative',
                                    zIndex: 100
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: 0 }}>{isEditingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                                    <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(false); }} style={{ background: 'none', border: 'none', color: 'gray' }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
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
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white', background: '#1e293b' }}
                                            value={productForm.category}
                                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value, subcategory: null })}
                                        >
                                            <option value="raciones">Raciones</option>
                                            <option value="bocatas">Bocatas</option>
                                            <option value="bebidas">Bebidas</option>
                                            <option value="vinos">Vinos</option>
                                            <option value="postres">Postres</option>
                                            <option value="otros">Otros</option>
                                        </select>
                                    </div>
                                    {categoriesData.find(c => c.id === productForm.category)?.subcategories && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label>Subcategoría</label>
                                            <select
                                                className="glass-panel"
                                                style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white', background: '#1e293b' }}
                                                value={productForm.subcategory || ''}
                                                onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                                            >
                                                <option value="">Sin subcategoría</option>
                                                {categoriesData.find(c => c.id === productForm.category).subcategories.map(sub => (
                                                    <option key={sub} value={sub}>{sub.charAt(0).toUpperCase() + sub.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: isMobile ? 'auto' : 'span 2' }}>
                                        <label>Imagen / Foto del Producto</label>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '2px dashed var(--glass-border)',
                                            borderRadius: '12px'
                                        }}>
                                            <div style={{
                                                width: '120px', height: '100px',
                                                background: 'rgba(0,0,0,0.3)',
                                                borderRadius: '12px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '2rem', overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {(String(productForm.image || '').startsWith('data:image') || String(productForm.image || '').startsWith('http') || String(productForm.image || '').startsWith('/'))
                                                    ? <img src={productForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : productForm.image || '🍽️'}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
                                                <label className="btn-primary" style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <Camera size={18} /> {isMobile ? 'Subir Foto' : 'Hacer Foto / Subir'}
                                                    <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageUpload} />
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="o Emoji"
                                                    className="glass-panel"
                                                    style={{ width: isMobile ? '100%' : '100px', padding: '0.75rem', textAlign: 'center', fontSize: '1.2rem', color: 'white' }}
                                                    value={String(productForm.image || '').startsWith('data:image') ? '' : productForm.image}
                                                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: isMobile ? 'auto' : 'span 2' }}>
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: isMobile ? 'auto' : 'span 2' }}>
                                        <label>Alérgenos</label>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            {['gluten', 'lacteos', 'huevos', 'pescado', 'frutos_secos', 'vegano'].map(all => (
                                                <label key={all} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                                                    padding: '0.3rem 0.6rem', background: (productForm.allergens || []).includes(all) ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                                                    borderColor: (productForm.allergens || []).includes(all) ? '#fbbf24' : 'transparent',
                                                    fontSize: '0.75rem'
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', gridColumn: isMobile ? 'auto' : 'span 2' }}>
                                        <input
                                            type="checkbox"
                                            id="menu-visible"
                                            checked={productForm.isDigitalMenuVisible}
                                            onChange={(e) => setProductForm({ ...productForm, isDigitalMenuVisible: e.target.checked })}
                                        />
                                        <label htmlFor="menu-visible" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Visible en Menú Digital (QR)</label>
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(false); }} style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer' }}>Cancelar</button>
                                    <button className="btn-primary" onClick={handleSaveProduct}>Guardar</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {selectedProduct ? (
                        <>
                            {/* Product Header Card */}
                            <div className="glass-panel" style={{
                                padding: isMobile ? '1rem' : '1.5rem',
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                justifyContent: 'space-between',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                                        {(String(selectedProduct.image || '').startsWith('data:image') || String(selectedProduct.image || '').startsWith('http') || String(selectedProduct.image || '').startsWith('/'))
                                            ? <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : selectedProduct.image || '🍽️'}
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>{selectedProduct.name}</h2>
                                        <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>{selectedProduct.category}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? '100%' : 'auto' }}>
                                    <button
                                        onClick={startEditProduct}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            border: '1px solid var(--color-primary)',
                                            color: 'var(--color-primary)',
                                            borderRadius: '12px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                                    >
                                        <Edit3 size={16} /> Modificar
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('¿Borrar producto y su receta?')) deleteProduct(selectedProductId); }}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="glass-panel" style={{
                                padding: isMobile ? '1.5rem' : '2rem',
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                                gap: isMobile ? '1rem' : '2rem'
                            }}>
                                <div style={{ borderRight: isMobile ? 'none' : '1px solid var(--glass-border)', borderBottom: isMobile ? '1px solid var(--glass-border)' : 'none', paddingBottom: isMobile ? '1rem' : 0 }}>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>P.V.P (Venta)</p>
                                    <h2 style={{ margin: '0.25rem 0', color: 'var(--color-primary)', fontSize: isMobile ? '1.5rem' : '2rem' }}>{price.toFixed(2)}€</h2>
                                </div>
                                <div style={{ borderRight: isMobile ? 'none' : '1px solid var(--glass-border)', borderBottom: isMobile ? '1px solid var(--glass-border)' : 'none', paddingBottom: isMobile ? '1rem' : 0 }}>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Coste Ingredientes</p>
                                    <h2 style={{ margin: '0.25rem 0', color: '#ef4444', fontSize: isMobile ? '1.5rem' : '2rem' }}>{cost.toFixed(2)}€</h2>
                                </div>
                                <div>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Margen Bruto</p>
                                    <h2 style={{ margin: '0.25rem 0', color: '#10b981', fontSize: isMobile ? '1.5rem' : '2rem' }}>{margin}%</h2>
                                </div>
                            </div>

                            {/* Ingredients Table */}
                            <div className="glass-panel" style={{ flex: 1, padding: isMobile ? '1rem' : '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                                        <Package size={20} /> Composición
                                    </h3>
                                    <button className="btn-primary" onClick={handleAddIngredientToRecipe} style={{ fontSize: '0.8rem', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                                        <Plus size={16} /> Añadir Ingrediente
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {currentRecipe.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', border: '2px dashed var(--glass-border)', borderRadius: '1rem' }}>
                                            No hay ingredientes.
                                        </div>
                                    ) : (
                                        currentRecipe.map((item, index) => {
                                            const ing = getIng(item.ingredientId);
                                            return (
                                                <div key={index} style={{
                                                    display: 'flex',
                                                    flexDirection: isMobile ? 'column' : 'row',
                                                    gap: isMobile ? '0.75rem' : '1.5rem',
                                                    alignItems: isMobile ? 'stretch' : 'center',
                                                    padding: '1rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '12px',
                                                    position: 'relative'
                                                }}>
                                                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Ingrediente</label>
                                                        <select
                                                            className="glass-panel"
                                                            style={{ padding: '0.6rem', border: '1px solid var(--glass-border)', color: 'white', width: '100%', background: '#1e293b' }}
                                                            value={item.ingredientId}
                                                            onChange={(e) => handleUpdateIngredient(index, 'ingredientId', e.target.value)}
                                                        >
                                                            {ingredients.map(i => (
                                                                <option key={i.id} value={i.id} style={{ background: '#0f172a' }}>{i.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                            <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Cantidad</label>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="glass-panel"
                                                                    style={{ padding: '0.6rem', border: '1px solid var(--glass-border)', color: 'white', width: '100%' }}
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleUpdateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                                />
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', minWidth: '30px' }}>{ing?.unit || 'uds'}</span>
                                                            </div>
                                                        </div>

                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                            <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Subtotal</label>
                                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', padding: '0.6rem 0' }}>{(item.quantity * (ing?.cost || 0)).toFixed(2)}€</div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveIngredient(index)}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            padding: '0.6rem',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            alignSelf: isMobile ? 'flex-end' : 'center',
                                                            marginTop: isMobile ? '-1.5rem' : 0
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', padding: isMobile ? '2rem' : '4rem', textAlign: 'center' }}>
                            <PieChart size={isMobile ? 48 : 64} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Gestión de Carta</h2>
                            <p style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Selecciona un producto para configurar su receta y calcular costes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recipes;

