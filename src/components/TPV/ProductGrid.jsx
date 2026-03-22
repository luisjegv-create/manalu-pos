import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductGrid = ({ products, onProductClick, checkProductAvailability }) => {
    return (
        <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 640 ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem',
            alignContent: 'start',
            paddingBottom: '2rem'
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
                            padding: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '0.5rem',
                            transition: 'background 0.2s',
                            border: '1px solid var(--glass-border)',
                            position: 'relative',
                            borderRadius: '10px'
                        }}
                        whileHover={{
                            backgroundColor: 'rgba(30, 41, 59, 1)',
                            borderColor: 'var(--color-primary)',
                            y: -4,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                        }}
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
                            width: '95px',
                            height: '85px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            overflow: 'hidden',
                            borderRadius: '8px',
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                            {(String(product.image || '').startsWith('data:image') || String(product.image || '').startsWith('http') || String(product.image || '').startsWith('/'))
                                ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : product.image || '🍽️'}
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', lineHeight: '1.2' }}>{product.name}</div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            marginTop: '0.5rem'
                        }}>
                            <div style={{
                                background: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }}>
                                {product.price.toFixed(2)}€
                            </div>

                            {/* Subtle cost info for staff */}
                            <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-muted)',
                                opacity: 0.6
                            }}>
                                {product.isWine ? 'Vino' : 'Ración'}
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
