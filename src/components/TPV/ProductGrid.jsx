import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductGrid = ({ products, onProductClick, getProductCost, checkProductAvailability }) => {
    return (
        <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem',
            alignContent: 'start'
        }}>
            <AnimatePresence mode='popLayout'>
                {products.map(product => (
                    <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => onProductClick(product)}
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
                            border: '1px solid var(--glass-border)',
                            position: 'relative'
                        }}
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--color-primary)' }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* Improved Stock Indicator */}
                        {(() => {
                            const isAvailable = checkProductAvailability ? checkProductAvailability(product.id) : true;
                            if (!isAvailable) {
                                return (
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontWeight: 'bold',
                                        zIndex: 5,
                                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                    }}>
                                        AGOTADO
                                    </div>
                                );
                            }
                            // Legacy wine stock indicator (keep but refine)
                            if (product.isWine && product.stock <= 5 && product.stock > 0) {
                                return (
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        background: '#f59e0b',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontWeight: 'bold',
                                        zIndex: 5
                                    }}>
                                        QUEDAN {product.stock}
                                    </div>
                                );
                            }
                            return null;
                        })()}
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
                                : product.image || '🍽️'}
                        </div>
                        <div style={{ fontWeight: '600' }}>{product.name}</div>

                        {/* Price Hover Logic */}
                        <div
                            onClick={(e) => e.stopPropagation()}
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
                                position: 'relative'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>📁</span>
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
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            <style>{`
                .discrete-price-folder:hover .price-reveal {
                    display: block !important;
                }
            `}</style>
        </div>
    );
};

export default ProductGrid;
