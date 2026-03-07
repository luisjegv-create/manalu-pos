import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { useOrder } from '../context/OrderContext';

const GlobalQrAlert = () => {
    const { activeQrAlert, setActiveQrAlert } = useOrder();

    return (
        <AnimatePresence>
            {activeQrAlert && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 99999, // Super high z-index
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        style={{
                            background: '#1e293b',
                            border: '2px solid #fbbf24',
                            borderRadius: '24px',
                            padding: '2rem',
                            maxWidth: '430px',
                            width: '95%',
                            textAlign: 'center',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 4px rgba(251, 191, 36, 0.2)'
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <Send size={32} />
                        </div>
                        <h2 style={{ color: 'white', marginBottom: '0.8rem', fontSize: '1.6rem', fontWeight: 'bold' }}>¡Nuevo Pedido Digital!</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.5' }}>
                            La <strong style={{ color: '#fbbf24', fontSize: '1.2rem' }}>{activeQrAlert.tableName}</strong> acaba de enviar una comanda.
                            Los tickets están saliendo por la impresora.
                        </p>
                        <button
                            onClick={() => setActiveQrAlert(null)}
                            style={{
                                width: '100%',
                                padding: '1.2rem',
                                background: '#fbbf24',
                                color: 'black',
                                border: 'none',
                                borderRadius: '16px',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Confirmar Recepción
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GlobalQrAlert;
