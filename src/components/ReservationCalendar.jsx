import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';

const ReservationCalendar = ({ reservations, onDateSelect, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const goToPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const monthName = currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const getReservationsForDate = (dateStr) => {
        return reservations.filter(r => r.date === dateStr);
    };

    const renderCalendarDays = () => {
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        const calendarDays = [];

        // Padding for empty days at the start
        for (let i = 0; i < startDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
        }

        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
            const dateStr = date.toISOString().split('T')[0];
            const dayReservations = getReservationsForDate(dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            calendarDays.push(
                <motion.div
                    key={d}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDateSelect(dateStr)}
                    style={{
                        minHeight: '80px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        position: 'relative'
                    }}
                >
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: isToday ? 'var(--color-primary)' : 'white'
                    }}>
                        {d} {isToday && '•'}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '2px', alignContent: 'flex-start' }}>
                        {dayReservations.map((res) => (
                            <div
                                key={res.id}
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: res.status === 'sentado' ? '#10b981' : '#fbbf24'
                                }}
                                title={`${res.customerName} - ${res.time}`}
                            />
                        ))}
                    </div>

                    {dayReservations.length > 0 && (
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                            {dayReservations.reduce((acc, r) => acc + (r.people || 0), 0)} <Users size={10} style={{ display: 'inline' }} />
                        </div>
                    )}
                </motion.div>
            );
        }

        return calendarDays;
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{monthName}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={goToPrevMonth} className="btn-icon" style={{ padding: '0.5rem' }}><ChevronLeft size={18} /></button>
                    <button onClick={goToNextMonth} className="btn-icon" style={{ padding: '0.5rem' }}><ChevronRight size={18} /></button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
                textAlign: 'center',
                marginBottom: '0.5rem',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)'
            }}>
                {days.map(d => <div key={d}>{d}</div>)}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem'
            }}>
                {renderCalendarDays()}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', opacity: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }} /> Confirmada
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Sentados
                </div>
            </div>
        </div>
    );
};

export default ReservationCalendar;
