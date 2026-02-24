import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Phone, MessageSquare, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';

const DailyReservationTimeline = ({ reservations, selectedDate, onUpdateStatus, onDelete }) => {
    const dayReservations = reservations
        .filter(r => r.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time));

    const getStatusColor = (status) => {
        switch (status) {
            case 'sentado': return '#10b981';
            case 'finalizado': return '#3b82f6';
            case 'no-show': return '#ef4444';
            case 'cancelado': return '#64748b';
            default: return '#fbbf24';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'sentado': return 'Sentado';
            case 'finalizado': return 'Finalizado';
            case 'no-show': return 'No-show';
            case 'cancelado': return 'Cancelado';
            default: return 'Confirmado';
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Cronograma del Día</h3>

            {dayReservations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.3 }}>
                    <Clock size={48} style={{ margin: '0 auto 1rem' }} />
                    <p>No hay reservas para este día.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {dayReservations.map((res, index) => (
                        <motion.div
                            key={res.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '80px 1fr auto',
                                gap: '1rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderLeft: `4px solid ${getStatusColor(res.status)}`,
                                borderRadius: '8px',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                                {res.time}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {res.customerName}
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: `${getStatusColor(res.status)}33`,
                                        color: getStatusColor(res.status),
                                        border: `1px solid ${getStatusColor(res.status)}`
                                    }}>
                                        {getStatusLabel(res.status)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Users size={14} /> {res.people}p
                                    </span>
                                    {res.tableId && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <CheckCircle2 size={14} /> Mesa {res.tableId}
                                        </span>
                                    )}
                                    {res.phone && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Phone size={14} /> {res.phone}
                                        </span>
                                    )}
                                </div>
                                {res.notes && (
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', marginTop: '0.25rem' }}>
                                        "{res.notes}"
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {res.status === 'confirmado' && (
                                    <button
                                        onClick={() => onUpdateStatus(res.id, 'sentado')}
                                        title="Sentar clientes"
                                        className="btn-icon"
                                        style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                )}
                                {res.status === 'sentado' && (
                                    <button
                                        onClick={() => onUpdateStatus(res.id, 'finalizado')}
                                        title="Finalizar reserva"
                                        className="btn-icon"
                                        style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                )}
                                {res.status !== 'cancelado' && (
                                    <button
                                        onClick={() => onUpdateStatus(res.id, 'cancelado')}
                                        title="Cancelar"
                                        className="btn-icon"
                                        style={{ color: '#64748b' }}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                )}
                                {res.status !== 'cancelado' && (
                                    <button
                                        onClick={() => onDelete(res.id)}
                                        title="Eliminar"
                                        className="btn-icon"
                                        style={{ color: '#ef4444' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DailyReservationTimeline;
