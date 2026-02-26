import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ModifierModal = ({
    isOpen,
    product,
    selections,
    onClose,
    toggleModifier,
    handleConfirmModifiers
}) => {
    if (!isOpen || !product) return null;

    return (
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
                    padding: '2rem', width: '90%', maxWidth: '500px', display: 'flex',
                    flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--color-primary)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {product.image} {product.name}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {product.modifiers && product.modifiers.map((group, idx) => (
                        <div key={idx} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--color-secondary)', marginBottom: '0.75rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                                {group.name}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {group.options.map((option, optIdx) => {
                                    const isSelected = selections[group.name] === option;
                                    return (
                                        <button
                                            key={optIdx}
                                            onClick={() => toggleModifier(group.name, option)}
                                            style={{
                                                padding: '0.75rem', borderRadius: '8px',
                                                border: isSelected ? '1px solid #10b981' : '1px solid var(--glass-border)',
                                                background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                color: isSelected ? 'white' : '#94a3b8',
                                                cursor: 'pointer', textAlign: 'left', fontWeight: isSelected ? 'bold' : 'normal'
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

                <button className="btn-primary" onClick={handleConfirmModifiers} style={{ padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}>
                    Confirmar y Añadir
                </button>
            </motion.div>
        </div>
    );
};

export default ModifierModal;
