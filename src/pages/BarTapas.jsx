import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useOrder } from '../context/OrderContext';
import { useCustomers } from '../context/CustomerContext';
import { categories } from '../data/products';
import {
    Utensils,
    Sandwich,
    Beer,
    Cake,
    ArrowLeft,
    Trash2,
    Send,
    Plus,
    Minus,
    User,
    Star,
    Search,
    Printer,
    CreditCard,
    Banknote,
    X,
    FileText,
    Wine,
    MessageSquare,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printKitchenTicket, printBillTicket } from '../utils/printHelpers';

const iconMap = {
    Utensils,
    Sandwich,
    Beer,
    Cake,
    Wine
};

const BarTapas = () => {
    const navigate = useNavigate();
    const { salesProducts, ingredients, addProductWithRecipe, getProductCost } = useInventory(); // Added ingredients, addProductWithRecipe, getProductCost
    const [searchParams] = useSearchParams(); // Added useSearchParams
    const {
        order,
        bill,
        addToOrder,
        removeFromOrder,
        updateQuantity,
        updateItemNote,
        calculateTotal,
        calculateBillTotal,
        sendToKitchen,
        closeTable,
        currentTable,
        tables, // Added tables from context
        selectTable, // Added selectTable
        selectedCustomer,
        selectCustomer
    } = useOrder();
    const { customers } = useCustomers();
    const [activeCategory, setActiveCategory] = useState('tapas');
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showTicket, setShowTicket] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteDraft, setNoteDraft] = useState('');

    // Mobile Responsiveness State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showOrderMobile, setShowOrderMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) setShowOrderMobile(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Quick Mode Effect
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'quick' && !currentTable && tables.length > 0) {
            // Find first available bar table
            const barTable = tables.find(t => t.zone === 'barra');
            if (barTable) {
                selectTable(barTable);
            }
        }
    }, [searchParams, tables, currentTable, selectTable]);

    // New Product Creator State
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProductForm, setNewProductForm] = useState({ name: '', price: 0, category: 'tapas', image: '🍽️' });
    const [newProductRecipe, setNewProductRecipe] = useState([]);

    // Modifiers State
    const [modifierModal, setModifierModal] = useState({ isOpen: false, product: null, selections: {} });

    const handleProductClick = (product) => {
        if (product.modifiers && product.modifiers.length > 0) {
            // Open modal for modifiers
            setModifierModal({
                isOpen: true,
                product: product,
                selections: {} // Reset selections
            });
        } else {
            // Normal add
            addToOrder(product);
        }
    };

    const handleConfirmModifiers = () => {
        if (!modifierModal.product) return;

        const productToAdd = {
            ...modifierModal.product,
            selectedModifiers: modifierModal.selections
        };

        addToOrder(productToAdd);
        setModifierModal({ isOpen: false, product: null, selections: {} });
    };

    const toggleModifier = (modName, option) => {
        setModifierModal(prev => {

            // Simple radio-like logic for now (one option per modifier group)
            return {
                ...prev,
                selections: { ...prev.selections, [modName]: option }
            };
        });
    };


    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) {
                alert("La imagen es demasiado grande (máx 500KB).");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProductForm(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveNewProduct = () => {
        if (!newProductForm.name || newProductForm.price <= 0) {
            alert('Por favor, introduce un nombre y precio válido.');
            return;
        }
        addProductWithRecipe(newProductForm, newProductRecipe);
        alert(' Producto creado correctamente y añadido a la carta.');
        setIsAddingProduct(false);
        setNewProductForm({ name: '', price: 0, category: activeCategory, image: '🍽️' });
        setNewProductRecipe([]);
        setActiveCategory(newProductForm.category);
    };

    const filteredProducts = salesProducts.filter(p => p.category === activeCategory);

    const handleSendOrder = () => {
        if (order.length === 0) return;

        // Automatically print ticket for kitchen
        printKitchenTicket(currentTable ? currentTable.name : 'Barra', order);

        sendToKitchen();
        alert('¡Pedido enviado a cocina e impreso! 👨‍🍳');
    };

    const handleCloseTable = (method = 'Efectivo') => {
        if (!currentTable) return;
        closeTable(currentTable.id, method);
        setShowTicket(false);
        navigate('/tables');
    };

    const totalBill = calculateBillTotal();
    const iva = totalBill * 0.10;
    const subtotal = totalBill - iva;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>

            {/* LEFT SECTION: Catalog */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : '1px solid var(--glass-border)' }}>

                <header style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => navigate('/tables')}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                        >
                            <ArrowLeft />
                        </button>
                        <img src="/logo_new.png" alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Bar y Tapas</h1>
                            <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {currentTable ? currentTable.name : 'Mesa no asignada'}
                            </span>
                        </div>
                    </div>

                    {/* Quick Mode Button (Added) */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setIsAddingProduct(true)}
                            className="btn-primary"
                            style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                border: '1px solid #10b981',
                                color: '#10b981',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={18} /> Crear Producto
                        </button>
                    </div>
                </header>

                {/* Categories Tabs */}
                <div style={{ display: 'flex', gap: '1rem', padding: '1rem', overflowX: 'auto' }}>
                    {categories.map(cat => {
                        const Icon = iconMap[cat.icon];
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={isActive ? 'glass-panel' : ''}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '12px',
                                    border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                                    background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Icon size={18} />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {/* Product Grid */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '1.25rem',
                    alignContent: 'start'
                }}>
                    <AnimatePresence mode='popLayout'>
                        {filteredProducts.map(product => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => handleProductClick(product)}
                                className="glass-panel"
                                style={{
                                    padding: '1.25rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    gap: '0.75rem',
                                    transition: 'background 0.2s',
                                    border: '1px solid var(--glass-border)'
                                }}
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--color-primary)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div style={{
                                    width: '120px',
                                    height: '110px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3rem',
                                    overflow: 'hidden',
                                    borderRadius: '12px',
                                    background: 'rgba(0,0,0,0.2)'
                                }}>
                                    {(String(product.image || '').startsWith('data:image') || String(product.image || '').startsWith('http') || String(product.image || '').startsWith('/'))
                                        ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : product.image}
                                </div>
                                <div style={{ fontWeight: '600' }}>{product.name}</div>


                                {/* Discrete Price Component */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent product add when checking price
                                        // Mobile friendly: toggle visibility or just use hover on desktop
                                    }}
                                    className="discrete-price-folder"
                                    style={{
                                        marginTop: '0.25rem',
                                        padding: '0.25rem 0.5rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        cursor: 'help',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        position: 'relative',
                                        group: 'price-group'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>📁</span>

                                    {/* Hover Content */}
                                    <div
                                        className="price-reveal"
                                        style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: 'rgba(0,0,0,0.9)',
                                            border: '1px solid var(--color-primary)',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            marginBottom: '0.5rem',
                                            display: 'none',
                                            width: 'max-content',
                                            zIndex: 10
                                        }}
                                    >
                                        <div style={{ color: '#10b981', fontWeight: 'bold' }}>PVP: {product.price.toFixed(2)}€</div>
                                        {product.isWine ? (
                                            <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>Compra: {product.purchasePrice?.toFixed(2)}€</div>
                                        ) : (
                                            <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>Coste Receta: {getProductCost(product.id).toFixed(2)}€</div>
                                        )}
                                    </div>

                                    {/* Inline Hover Logic via style block in render is tricky. 
                                        Let's just use React state for the *active* viewed price? 
                                        No, that's too much state for a grid.
                                        Let's stick to a CSS-in-JS approach where we modify the opacity on hover.
                                     */}
                                    <style>{`
                                        .discrete-price-folder:hover .price-reveal {
                                            display: block !important;
                                        }
                                     `}</style>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Mobile Floating Button */}
                {isMobile && !showOrderMobile && order.length > 0 && (
                    <button
                        onClick={() => setShowOrderMobile(true)}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            right: '2rem',
                            padding: '1rem 2rem',
                            borderRadius: '50px',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            zIndex: 40,
                            fontWeight: 'bold',
                            fontSize: '1.1rem'
                        }}
                    >
                        <Wine size={20} />
                        Ver Pedido ({calculateTotal().toFixed(2)}€)
                    </button>
                )}
            </div>

            {/* RIGHT SECTION: Order Summary */}
            <div style={{
                width: isMobile ? '100%' : '480px',
                height: isMobile ? '100%' : 'auto',
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                right: isMobile ? (showOrderMobile ? 0 : '-100%') : 0,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: isMobile ? '#0f172a' : 'rgba(0,0,0,0.2)',
                transition: 'right 0.3s ease'
            }}>
                {isMobile && (
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-start', borderBottom: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => setShowOrderMobile(false)}
                            style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <ArrowLeft size={20} /> Volver a la Carta
                        </button>
                    </div>
                )}

                {/* Customer Selector */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(59, 130, 246, 0.05)' }}>
                    {selectedCustomer ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{selectedCustomer.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>{selectedCustomer.points} pts acumulados</div>
                                </div>
                            </div>
                            <button onClick={() => selectCustomer(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Cambiar</button>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--glass-border)', borderRadius: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                            >
                                <Plus size={16} /> Asignar Cliente (Fidelización)
                            </button>
                            {showCustomerSearch && (
                                <div className="glass-panel" style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10, padding: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                    <input
                                        autoFocus
                                        placeholder="Buscar cliente..."
                                        value={customerSearchQuery}
                                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', marginBottom: '0.5rem' }}
                                    />
                                    {customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())).map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => { selectCustomer(c); setShowCustomerSearch(false); }}
                                            style={{ padding: '0.75rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: '500' }}>{c.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.phone}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Customer Favorites (Recomendar) */}
                {selectedCustomer && selectedCustomer.favorites.length > 0 && (
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                            <Star size={14} /> RECOMENDACIONES (Favoritos)
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {selectedCustomer.favorites.map(favName => {
                                const prod = salesProducts.find(p => p.name === favName);
                                if (!prod) return null;
                                return (
                                    <button
                                        key={prod.id}
                                        onClick={() => addToOrder(prod)}
                                        style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '20px', color: 'white', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                    >
                                        {prod.image} {prod.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Comanda Actual</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {order.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', opacity: 0.5 }}>
                            <Utensils size={48} />
                            <p>Selecciona productos</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {order.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            {(String(item.image || '').startsWith('data:image') || String(item.image || '').startsWith('http') || String(item.image || '').startsWith('/'))
                                                ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : item.image || '🍽️'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ fontWeight: '500', flex: 1, paddingRight: '0.5rem' }}>{item.name}</div>
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingNoteId(editingNoteId === item.uniqueId ? null : item.uniqueId);
                                                            setNoteDraft(item.notes || '');
                                                        }}
                                                        style={{ background: item.notes ? 'rgba(16, 185, 129, 0.2)' : 'none', border: 'none', color: item.notes ? '#10b981' : 'var(--color-text-muted)', padding: '4px', cursor: 'pointer', borderRadius: '4px' }}
                                                        title="Añadir nota"
                                                    >
                                                        <MessageSquare size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {item.selectedModifiers && Object.entries(item.selectedModifiers).map(([key, value]) => (
                                                <div key={key} style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '0.5rem' }}>
                                                    • {value}
                                                </div>
                                            ))}
                                            {item.notes && editingNoteId !== item.uniqueId && (
                                                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontStyle: 'italic', marginLeft: '0.5rem' }}>
                                                    Note: {item.notes}
                                                </div>
                                            )}
                                            {editingNoteId === item.uniqueId && (
                                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                                                    <input
                                                        type="text"
                                                        value={noteDraft}
                                                        onChange={(e) => setNoteDraft(e.target.value)}
                                                        placeholder="Ej: Poco hecho, Alérgico..."
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                updateItemNote(item.uniqueId, noteDraft);
                                                                setEditingNoteId(null);
                                                            }
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            fontSize: '0.75rem',
                                                            background: 'rgba(0,0,0,0.2)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '4px',
                                                            color: 'white',
                                                            padding: '2px 6px'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            updateItemNote(item.uniqueId, noteDraft);
                                                            setEditingNoteId(null);
                                                        }}
                                                        style={{ background: '#10b981', border: 'none', color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                                    >
                                                        OK
                                                    </button>
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{(item.price * item.quantity).toFixed(2)}€</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '2px' }}>
                                        <button
                                            onClick={() => item.quantity === 1 ? removeFromOrder(item.uniqueId || item.id) : updateQuantity(item.uniqueId || item.id, -1)}
                                            style={{ background: 'none', border: 'none', color: 'white', padding: '4px', cursor: 'pointer', display: 'flex' }}
                                        >
                                            {item.quantity === 1 ? <Trash2 size={14} color="#ef4444" /> : <Minus size={14} />}
                                        </button>
                                        <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.uniqueId || item.id, 1)}
                                            style={{ background: 'none', border: 'none', color: 'white', padding: '4px', cursor: 'pointer', display: 'flex' }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '4px', paddingLeft: '2.75rem' }}>
                                        {['Poco hecho', 'Muy hecho', 'Celiaco', 'Vegano', 'Sin cebolla'].map(quickNote => (
                                            <button
                                                key={quickNote}
                                                onClick={() => updateItemNote(item.uniqueId, quickNote)}
                                                style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    background: item.notes === quickNote ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    color: item.notes === quickNote ? '#fbbf24' : '#94a3b8',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {quickNote}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        <span>Total Comanda</span>
                        <span>{calculateTotal().toFixed(2)}€</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            onClick={handleSendOrder}
                            disabled={order.length === 0}
                        >
                            <Send size={18} /> Enviar
                        </button>

                        <button
                            className="glass-panel"
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '0 1rem',
                                background: 'rgba(255,165,0,0.2)',
                                color: 'orange',
                                border: '1px solid orange',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                if (order.length === 0) return;
                                printKitchenTicket(currentTable ? currentTable.name : 'Barra', order);
                            }}
                            title="Imprimir Comanda Cocina"
                            disabled={order.length === 0}
                        >
                            <Printer size={20} />
                        </button>

                        <button
                            className="glass-panel"
                            style={{
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: bill.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: bill.length > 0 ? '#10b981' : '#64748b',
                                border: bill.length > 0 ? '1px solid #10b981' : '1px solid var(--glass-border)'
                            }}
                            onClick={() => setShowTicket(true)}
                            disabled={bill.length === 0}
                        >
                            <FileText size={18} /> Cuenta ({calculateBillTotal().toFixed(2)}€)
                        </button>
                    </div>
                </div>
            </div>
            {/* TICKET / CHECKOUT MODAL */}
            <AnimatePresence>
                {showTicket && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', border: '1px solid var(--color-primary)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Printer size={24} /> Tiket de Venta</h2>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => printBillTicket(currentTable ? currentTable.name : 'Mesa', bill, totalBill)}
                                        style={{ background: '#f59e0b', border: 'none', color: 'black', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        🖨️ Imprimir
                                    </button>
                                    <button onClick={() => setShowTicket(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                                </div>
                            </div>

                            {/* Ticket Mockup Style */}
                            <div style={{ background: 'white', color: 'black', padding: '2rem', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: "'Courier New', Courier, monospace" }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0' }}>TAPAS Y BOCATAS</h3>
                                    <div style={{ fontSize: '0.8rem' }}>Manalu Eventos & Catering</div>
                                    <div style={{ fontSize: '0.8rem' }}>C/ Principal 123, Madrid</div>
                                    <div style={{ fontSize: '0.8rem' }}>CIF: B12345678</div>
                                </div>

                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span>FECHA: {new Date().toLocaleDateString()}</span>
                                    <span>HORA: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>
                                    {currentTable?.name}
                                </div>

                                <div style={{ borderBottom: '1px solid black', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    <span style={{ flex: 1 }}>CONCEPTO</span>
                                    <span style={{ width: '40px', textAlign: 'center' }}>CANT</span>
                                    <span style={{ width: '60px', textAlign: 'right' }}>PRECIO</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    {bill.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ flex: 1 }}>{item.name}</span>
                                                <span style={{ width: '40px', textAlign: 'center' }}>{item.quantity}</span>
                                                <span style={{ width: '60px', textAlign: 'right' }}>{(item.price * item.quantity).toFixed(2)}€</span>
                                            </div>
                                            {item.notes && (
                                                <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                                                    * {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderTop: '1px dashed #ccc', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                                        <span>SUBTOTAL:</span>
                                        <span>{subtotal.toFixed(2)}€</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                                        <span>IVA (10%):</span>
                                        <span>{iva.toFixed(2)}€</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '900', borderTop: '2px solid black', paddingTop: '0.5rem' }}>
                                        <span>TOTAL:</span>
                                        <span>{totalBill.toFixed(2)}€</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#888' }}>
                                    ¡Gracias por su visita!
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button
                                    className="btn-primary"
                                    style={{ background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => handleCloseTable('Efectivo')}
                                >
                                    <Banknote size={20} /> Efectivo
                                </button>
                                <button
                                    className="btn-primary"
                                    style={{ background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => handleCloseTable('Tarjeta')}
                                >
                                    <CreditCard size={20} /> Tarjeta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Quick Product Creator Modal */}
            <AnimatePresence>
                {isAddingProduct && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                width: '90%',
                                maxWidth: '800px',
                                height: '90vh',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                border: '1px solid var(--color-primary)',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0 }}>Crear Nuevo Producto y Escandallo</h2>
                                <button onClick={() => setIsAddingProduct(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {/* Left Column: Product Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h3 style={{ color: 'var(--color-primary)' }}>1. Datos del Producto</h3>

                                    <div>
                                        <label>Nombre</label>
                                        <input
                                            type="text"
                                            value={newProductForm.name}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                                            className="glass-panel"
                                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            placeholder="Ej: Plato Principal"
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label>Precio (€)</label>
                                            <input
                                                type="number"
                                                value={newProductForm.price}
                                                onChange={(e) => setNewProductForm({ ...newProductForm, price: parseFloat(e.target.value) || 0 })}
                                                className="glass-panel"
                                                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            />
                                        </div>
                                        <div>
                                            <label>Icono</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={newProductForm.image}
                                                    onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                                                    className="glass-panel"
                                                    style={{ width: '60px', padding: '0.75rem', marginTop: '0.5rem', color: 'white', textAlign: 'center', fontSize: '1.2rem' }}
                                                    placeholder="🍽️"
                                                />
                                                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                    {['🍺', '🍷', '🍖', '🥘', '🍲', '🥗', '🥪', '🥔', '🍰', '☕', '🥤'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => setNewProductForm({ ...newProductForm, image: emoji })}
                                                            style={{
                                                                background: 'rgba(255,255,255,0.1)',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '1.2rem',
                                                                padding: '0.25rem'
                                                            }}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ marginTop: '1rem' }}>
                                                    <label className="btn-secondary" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px dashed var(--glass-border)' }}>
                                                        <Camera size={18} /> Hacer Foto / Subir
                                                        <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageUpload} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label>Categoría</label>
                                        <select
                                            value={newProductForm.category}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                                            className="glass-panel"
                                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white', background: '#1e293b' }}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column: Recipe Builder */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h3 style={{ color: '#10b981' }}>2. Escandallo (Receta)</h3>

                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {newProductRecipe.length === 0 ? (
                                            <p style={{ color: 'gray', textAlign: 'center', marginTop: '2rem' }}>Añade ingredientes abajo</p>
                                        ) : (
                                            newProductRecipe.map((item, idx) => {
                                                const ing = ingredients.find(i => i.id === item.ingredientId);
                                                return (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.9rem' }}>{ing?.name || 'Desconocido'}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const updated = [...newProductRecipe];
                                                                    updated[idx].quantity = parseFloat(e.target.value) || 0;
                                                                    setNewProductRecipe(updated);
                                                                }}
                                                                style={{ width: '60px', padding: '0.25rem', background: '#333', border: 'none', color: 'white', textAlign: 'center' }}
                                                            />
                                                            <span style={{ fontSize: '0.8rem', color: 'gray' }}>{ing?.unit}</span>
                                                            <button
                                                                onClick={() => setNewProductRecipe(prev => prev.filter((_, i) => i !== idx))}
                                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                        <select
                                            id="ing-select"
                                            className="glass-panel"
                                            style={{ flex: 1, padding: '0.5rem', color: 'white', background: '#1e293b' }}
                                        >
                                            <option value="">Seleccionar ingrediente...</option>
                                            {ingredients.map(ing => (
                                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn-primary"
                                            onClick={() => {
                                                const select = document.getElementById('ing-select');
                                                const val = select.value;
                                                if (val) {
                                                    setNewProductRecipe(prev => [...prev, { ingredientId: val, quantity: 1 }]);
                                                    select.value = "";
                                                }
                                            }}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    onClick={() => handleSaveNewProduct()}
                                    className="btn-primary"
                                    style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}
                                >
                                    Guardar Producto
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* MODIFIERS MODAL */}
            <AnimatePresence>
                {modifierModal.isOpen && modifierModal.product && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                width: '90%',
                                maxWidth: '500px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                border: '1px solid var(--color-primary)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {modifierModal.product.image} {modifierModal.product.name}
                                </h2>
                                <button
                                    onClick={() => setModifierModal({ isOpen: false, product: null, selections: {} })}
                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {modifierModal.product.modifiers.map((group, idx) => (
                                    <div key={idx} style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ color: 'var(--color-secondary)', marginBottom: '0.75rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                                            {group.name}
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {group.options.map((option, optIdx) => {
                                                const isSelected = modifierModal.selections[group.name] === option;
                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => toggleModifier(group.name, option)}
                                                        style={{
                                                            padding: '0.75rem',
                                                            borderRadius: '8px',
                                                            border: isSelected ? '1px solid #10b981' : '1px solid var(--glass-border)',
                                                            background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                            color: isSelected ? 'white' : '#94a3b8',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            fontWeight: isSelected ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleConfirmModifiers}
                                style={{ padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}
                            >
                                Confirmar y Añadir
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >

    );
};

export default BarTapas;
