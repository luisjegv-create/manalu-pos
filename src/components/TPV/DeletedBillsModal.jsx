import React, { useState } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Euro } from 'lucide-react';

const DeletedBillsModal = ({ isOpen, onClose, deletedBills = [], onRecover }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [actionMsg, setActionMsg] = useState(null);

    if (!isOpen) return null;

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleRecover = (bill) => {
        if (!onRecover) return;
        const success = onRecover(bill.id);
        if (success) {
            setActionMsg(`✅ Comanda de "${bill.tableName}" restaurada con éxito.`);
            setTimeout(() => {
                setActionMsg(null);
                onClose();
            }, 1200);
        } else {
            alert('No se pudo restaurar la comanda.');
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
                   ' (' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ')';
        } catch (e) {
            return isoString;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(15, 23, 42, 0.6)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            padding: '8px',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171'
                        }}>
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#f1f5f9' }}>
                                Papelera de Comandas y Auditoría
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                Recupera en 1 clic cualquier comanda borrada o extraviada
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Notification toast */}
                {actionMsg && (
                    <div style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        borderBottom: '1px solid #10b981',
                        color: '#34d399',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        {actionMsg}
                    </div>
                )}

                {/* Content */}
                <div style={{
                    padding: '1.25rem',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                }}>
                    {deletedBills.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 1rem',
                            color: '#64748b'
                        }}>
                            <CheckCircle size={48} style={{ margin: '0 auto 1rem', color: '#10b981', opacity: 0.8 }} />
                            <h3 style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '1.15rem' }}>
                                No hay comandas en la papelera
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                Si alguna mesa se borra accidentalmente, aparecerá aquí con copia de seguridad instantánea.
                            </p>
                        </div>
                    ) : (
                        deletedBills.map((entry) => {
                            const isExpanded = expandedId === entry.id;
                            const allItems = [
                                ...(entry.billItems || []),
                                ...(entry.orderItems || [])
                            ];
                            const itemCount = allItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

                            return (
                                <div
                                    key={entry.id}
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.7)',
                                        border: entry.isRecovered ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.25)',
                                        borderRadius: '14px',
                                        padding: '1rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '0.5rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f8fafc' }}>
                                                    {entry.tableName}
                                                </span>
                                                {entry.isRecovered ? (
                                                    <span style={{
                                                        background: 'rgba(16, 185, 129, 0.15)',
                                                        color: '#34d399',
                                                        fontSize: '0.75rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Restaurada
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#f87171',
                                                        fontSize: '0.75rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Borrada
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: '#94a3b8',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                marginTop: '4px'
                                            }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> {formatDate(entry.deletedAt)}
                                                </span>
                                                <span>•</span>
                                                <span>{itemCount} productos</span>
                                                <span>•</span>
                                                <span style={{ color: '#cbd5e1' }}>{entry.reason || 'Borrado'}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 'bold',
                                                color: '#fbbf24',
                                                marginRight: '0.5rem'
                                            }}>
                                                {(entry.totalAmount || 0).toFixed(2)}€
                                            </div>

                                            <button
                                                onClick={() => handleRecover(entry)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    padding: '0.5rem 0.9rem',
                                                    fontSize: '0.88rem',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                                                }}
                                                title="Devolver esta comanda a la lista de pedidos activos"
                                            >
                                                <RotateCcw size={15} /> Restaurar
                                            </button>

                                            <button
                                                onClick={() => toggleExpand(entry.id)}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    color: '#cbd5e1',
                                                    borderRadius: '8px',
                                                    padding: '0.5rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title={isExpanded ? 'Ocultar platos' : 'Ver platos'}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Itemized list details */}
                                    {isExpanded && (
                                        <div style={{
                                            marginTop: '0.85rem',
                                            paddingTop: '0.85rem',
                                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                            fontSize: '0.86rem'
                                        }}>
                                            <div style={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.4rem' }}>
                                                Detalle de productos guardados:
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {allItems.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            color: '#e2e8f0',
                                                            padding: '2px 0'
                                                        }}
                                                    >
                                                        <span>
                                                            {item.quantity}x {item.name} {item.isInvitation ? '(Inv.)' : ''}
                                                        </span>
                                                        <span style={{ color: '#fbbf24', fontWeight: '500' }}>
                                                            {item.isInvitation ? '0.00€' : ((item.price || 0) * (item.quantity || 1)).toFixed(2) + '€'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(15, 23, 42, 0.6)'
                }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        🛡️ Registro de seguridad antiborrado Manalú POS
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#e2e8f0',
                            borderRadius: '10px',
                            padding: '0.6rem 1.25rem',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeletedBillsModal;
