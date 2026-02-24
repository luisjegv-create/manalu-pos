import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { zones, tables } from '../data/tables';
import { Utensils, Armchair, CheckCircle2 } from 'lucide-react';

const ReservationTableMap = ({ reservations, selectedDate, onTableSelect, selectedTableId }) => {
    const [activeZone, setActiveZone] = useState('salon');

    const dayReservations = reservations.filter(r => r.date === selectedDate);
    const filteredTables = tables.filter(t => t.zone === activeZone);

    const getTableReservation = (tableId) => {
        return dayReservations.find(r => r.tableId === tableId.toString() || r.tableId === tableId);
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Mapa de Mesas</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {zones.map(zone => (
                        <button
                            key={zone.id}
                            onClick={() => setActiveZone(zone.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: activeZone === zone.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                color: activeZone === zone.id ? 'black' : 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {zone.name}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '1rem'
            }}>
                {filteredTables.map(table => {
                    const reservation = getTableReservation(table.id);
                    const isSelected = selectedTableId === table.id.toString() || selectedTableId === table.id;
                    const isOccupiedByOther = reservation && !isSelected;

                    return (
                        <motion.button
                            key={table.id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onTableSelect(table.id)}
                            style={{
                                padding: '1.5rem 1rem',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                                background: isOccupiedByOther
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : isSelected
                                        ? 'rgba(59, 130, 246, 0.2)'
                                        : 'rgba(255,255,255,0.03)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'white',
                                position: 'relative'
                            }}
                        >
                            {isSelected && (
                                <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-primary)', borderRadius: '50%', padding: '2px' }}>
                                    <CheckCircle2 size={16} color="black" />
                                </div>
                            )}

                            <div style={{
                                padding: '0.75rem',
                                borderRadius: '50%',
                                background: isOccupiedByOther ? '#ef4444' : isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                color: (isOccupiedByOther || isSelected) ? 'black' : 'white'
                            }}>
                                {activeZone === 'salon' ? <Utensils size={20} /> : <Armchair size={20} />}
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{table.name}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                    {isOccupiedByOther ? `${reservation.customerName}` : 'Libre'}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', opacity: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }} /> Libre
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444' }} /> Reservada
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', border: '2px solid var(--color-primary)' }} /> Seleccionada
                </div>
            </div>
        </div>
    );
};

export default ReservationTableMap;
