import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import {
    ArrowLeft,
    Search,
    ChevronRight,
    Info,
    UtensilsCrossed,
    Wheat,
    Milk,
    Egg,
    Fish,
    Leaf,
    Wine,
    GlassWater,
    Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALLERGEN_ICONS = {
    gluten: { icon: Wheat, label: 'Gluten', color: '#f59e0b' },
    lacteos: { icon: Milk, label: 'Lácteos', color: '#3b82f6' },
    huevos: { icon: Egg, label: 'Huevos', color: '#fbbf24' },
    pescado: { icon: Fish, label: 'Pescado', color: '#0ea5e9' },
    frutos_secos: { icon: Info, label: 'Frutos Secos', color: '#d97706' },
    vegano: { icon: Leaf, label: 'Vegano', color: '#10b981' },
};

const QRMenu = () => {
    const navigate = useNavigate();
    const { salesProducts, wines, restaurantInfo } = useInventory();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [viewMode, setViewMode] = useState('menu'); // 'menu' or 'cellar'

    const categories = [
        { id: 'all', name: 'Todo', icon: '🍽️' },
        { id: 'tapas', name: 'Tapas', icon: '🥘' },
        { id: 'bocatas', name: 'Bocatas', icon: '🥪' },
        { id: 'vinos', name: 'Vinos', icon: '🍷' },
        { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
        { id: 'postres', name: 'Postres', icon: '🍰' }
    ];

    const filteredProducts = salesProducts.filter(p => {
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isVisible = p.isDigitalMenuVisible !== false;
        return matchesCategory && matchesSearch && isVisible;
    });

    // Helper to find wine details
    const getRecommendedWine = (wineId) => wines.find(w => w.id === wineId);

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Inter, sans-serif', paddingBottom: '80px' }}>

            {/* Immersive Header */}
            <header style={{
                position: 'relative',
                height: '250px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '2rem'
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'url("https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80") center/cover',
                    filter: 'brightness(0.4)'
                }} />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 0%, #0f172a 100%)'
                }} />

                <button
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        left: '1.5rem',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        zIndex: 20
                    }}
                >
                    <ArrowLeft size={24} />
                </button>

                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                    {/* 
                    <motion.img
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        src="/logo.png"
                        alt="Logo"
                        style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '0.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
                    />
                    */}
                    <motion.img
                        initial={{ y: 20, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        src={restaurantInfo.logo || "/logo-tapas-bocatas.png"}
                        alt={restaurantInfo.name}
                        style={{ maxWidth: '280px', maxHeight: '150px', width: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}
                    />
                </div>
            </header>

            {/* Navigation Tabs (Menu / Bodega) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '0 1rem', marginTop: '-1.5rem', position: 'relative', zIndex: 20 }}>
                <button
                    onClick={() => setViewMode('menu')}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: viewMode === 'menu' ? '#fbbf24' : 'rgba(30, 41, 59, 0.8)',
                        backdropFilter: 'blur(10px)',
                        color: viewMode === 'menu' ? '#000' : 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '1rem'
                    }}
                >
                    <Menu size={20} /> Nuestra Carta
                </button>
                <button
                    onClick={() => setViewMode('cellar')}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: viewMode === 'cellar' ? '#fbbf24' : 'rgba(30, 41, 59, 0.8)',
                        backdropFilter: 'blur(10px)',
                        color: viewMode === 'cellar' ? '#000' : 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '1rem'
                    }}
                >
                    <Wine size={20} /> Bodega Selecta
                </button>
            </div>

            {/* MAIN MENU CONTENT */}
            {viewMode === 'menu' && (
                <>
                    {/* Search & Categories */}
                    <div style={{ padding: '1.5rem 1rem 0', position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24' }} size={20} />
                            <input
                                type="text"
                                placeholder="¿Qué te apetece hoy?"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    style={{
                                        padding: '0.8rem 1.2rem',
                                        borderRadius: '12px',
                                        border: activeCategory === cat.id ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                                        background: activeCategory === cat.id ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)',
                                        color: activeCategory === cat.id ? '#fbbf24' : '#94a3b8',
                                        whiteSpace: 'nowrap',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: '80px',
                                        gap: '0.25rem'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                                    <span style={{ fontSize: '0.8rem' }}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product List */}
                    <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                            >
                                {/* Header / Trigger - LIST STYLE */}
                                <div
                                    onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                                    style={{
                                        cursor: 'pointer',
                                        position: 'relative',
                                        display: 'flex',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: selectedProduct === product.id ? 'rgba(30, 41, 59, 0.8)' : 'transparent'
                                    }}
                                >
                                    {/* Square Image */}
                                    <div style={{
                                        width: '110px',
                                        height: '110px',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        position: 'relative',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {(String(product.image || '').startsWith('data:image') || String(product.image || '').startsWith('http') || String(product.image || '').startsWith('/'))
                                            ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>{product.image || '🍽️'}</div>
                                        }
                                    </div>

                                    {/* Content Info */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.3' }}>{product.name}</h3>
                                            <div style={{
                                                background: '#fbbf24',
                                                color: '#000',
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '8px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                whiteSpace: 'nowrap',
                                                marginLeft: '0.5rem',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                            }}>
                                                {product.price.toFixed(2)}€
                                            </div>
                                        </div>

                                        {product.description && (
                                            <p style={{
                                                fontSize: '0.85rem',
                                                color: '#94a3b8',
                                                margin: '0 0 0.5rem 0',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                lineHeight: '1.4'
                                            }}>
                                                {product.description}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                            {(product.allergens || []).slice(0, 4).map(a => {
                                                const info = ALLERGEN_ICONS[a];
                                                return info ? (
                                                    <div key={a} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '6px' }} title={info.label}>
                                                        <info.icon size={12} color={info.color} />
                                                    </div>
                                                ) : null;
                                            })}
                                            {(product.allergens || []).length > 4 && (
                                                <div style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                                                    +{product.allergens.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expansion Indicator */}
                                    <div style={{ alignSelf: 'center', color: '#64748b' }}>
                                        <ChevronRight
                                            size={20}
                                            style={{
                                                transform: selectedProduct === product.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {selectedProduct === product.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div style={{ padding: '0 1.5rem 1.5rem', background: 'rgba(30, 41, 59, 0.8)' }}>
                                                {product.description && (
                                                    <div style={{
                                                        marginBottom: '1.5rem',
                                                        paddingTop: '1rem',
                                                        borderTop: '1px solid rgba(255,255,255,0.05)'
                                                    }}>
                                                        <h4 style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Descripción</h4>
                                                        <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                                                            {product.description}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* --- WINE PAIRING SECTION --- */}
                                                {product.recommendedWine && getRecommendedWine(product.recommendedWine) && (
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.2) 0%, rgba(15, 23, 42, 0.4) 100%)',
                                                        borderRadius: '16px',
                                                        padding: '1.25rem',
                                                        border: '1px solid rgba(167, 139, 250, 0.2)',
                                                        marginBottom: '1.5rem'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#c084fc' }}>
                                                            <Wine size={18} />
                                                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>El Sumiller Recomienda</span>
                                                        </div>

                                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                                            <div style={{ fontSize: '2.5rem', background: 'rgba(0,0,0,0.2)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {getRecommendedWine(product.recommendedWine).image || '🍷'}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{getRecommendedWine(product.recommendedWine).name}</h4>
                                                                <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>{getRecommendedWine(product.recommendedWine).bodega}</p>
                                                                <div style={{ marginTop: '0.5rem', fontSize: '1rem', color: '#fbbf24', fontWeight: 'bold' }}>
                                                                    {getRecommendedWine(product.recommendedWine).price.toFixed(2)}€ <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#64748b' }}>/ Botella</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* --------------------------- */}

                                                {product.allergens && product.allergens.length > 0 && (
                                                    <div style={{
                                                        background: 'rgba(255,255,255,0.03)',
                                                        borderRadius: '16px',
                                                        padding: '1rem',
                                                        border: '1px solid rgba(255,255,255,0.05)'
                                                    }}>
                                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Info size={14} /> Información de Alérgenos
                                                        </h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                                            {product.allergens.map(a => {
                                                                const info = ALLERGEN_ICONS[a];
                                                                if (!info) return null;
                                                                return (
                                                                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                                                        <div style={{ padding: '0.4rem', background: `${info.color}20`, borderRadius: '8px', color: info.color }}>
                                                                            <info.icon size={16} />
                                                                        </div>
                                                                        {info.label}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* WINE CELLAR CONTENT */}
            {viewMode === 'cellar' && (
                <div style={{ padding: '2rem 1rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Nuestra Bodega</h2>
                        <p style={{ color: '#94a3b8' }}>Una selección cuidada para acompañar tus momentos.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {[
                            { id: 'Tinto', label: 'Vinos Tintos', color: '#881337', icon: '🍷' },
                            { id: 'Blanco', label: 'Vinos Blancos', color: '#eab308', icon: '🥂' },
                            { id: 'Rosado', label: 'Vinos Rosados', color: '#ec4899', icon: '🌷' },
                            { id: 'Espumoso', label: 'Espumosos y Cavas', color: '#e11d48', icon: '🍾' }
                        ].map(section => {
                            const sectionWines = wines.filter(w => w.type === section.id);
                            if (sectionWines.length === 0) return null;

                            return (
                                <div key={section.id}>
                                    <h3 style={{
                                        color: section.color,
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        fontSize: '1.2rem', marginBottom: '1rem',
                                        borderBottom: `1px solid ${section.color}40`,
                                        paddingBottom: '0.5rem'
                                    }}>
                                        {section.icon} {section.label}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                        {sectionWines.map(wine => (
                                            <div key={wine.id} style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '16px',
                                                padding: '1rem',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{
                                                    height: '120px',
                                                    marginBottom: '0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    borderRadius: '12px',
                                                    background: 'rgba(0,0,0,0.2)'
                                                }}>
                                                    {(String(wine.image || '').startsWith('data:image') || String(wine.image || '').startsWith('http') || String(wine.image || '').startsWith('/'))
                                                        ? <img src={wine.image} alt={wine.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                        : <span style={{ fontSize: '3rem' }}>{wine.image || '🍷'}</span>
                                                    }
                                                </div>
                                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{wine.name}</h4>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{wine.bodega}</p>
                                                <div style={{ marginTop: '0.75rem', color: '#fbbf24', fontWeight: 'bold' }}>
                                                    {wine.price.toFixed(2)}€
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <footer style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p>Tapas y Bocatas Manalu</p>
                <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>Power by Qamarero Inspired System</p>
            </footer>
        </div>
    );
};

export default QRMenu;
