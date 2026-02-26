import React, { useState } from 'react';
import { useEvents } from '../context/EventContext';
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    Users,
    Trash2,
    Plus,
    Clock,
    Phone,
    MessageSquare,
    Search,
    CheckCircle2,
    Layout,
    List,
    Map as MapIcon,
    Tag,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Componentes Nuevos
import ReservationCalendar from '../components/ReservationCalendar';
import ReservationTableMap from '../components/ReservationTableMap';
import DailyReservationTimeline from '../components/DailyReservationTimeline';

const Bookings = () => {
    const navigate = useNavigate();
    const { reservations, addReservation, updateReservation, deleteReservation, loading } = useEvents();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [activeView, setActiveView] = useState('list'); // 'list', 'calendar', 'map'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [form, setForm] = useState({
        customerName: '',
        phone: '',
        people: 2,
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        tableId: '',
        notes: '',
        status: 'confirmado',
        tags: []
    });

    const filteredReservations = reservations.filter(r =>
        (r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.phone.includes(searchTerm)) &&
        (activeView === 'list' ? true : r.date === selectedDate)
    ).sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));

    const handleSave = (e) => {
        e.preventDefault();
        addReservation(form);
        setIsAdding(false);
        setForm({
            customerName: '',
            phone: '',
            people: 2,
            date: new Date().toISOString().split('T')[0],
            time: '20:00',
            tableId: '',
            notes: '',
            status: 'confirmado',
            tags: []
        });
    };

    const handleUpdateStatus = (resId, newStatus) => {
        updateReservation(resId, { status: newStatus });
    };

    const toggleTag = (tag) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const availableTags = ['VIP', 'Alergia', 'Terraza', 'Aniversario', 'Ventana'];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} className="btn-icon"><ArrowLeft /></button>
                    <div>
                        <h1 style={{ margin: 0 }}>Gestión de Reservas</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Calendario, mesas y clientes</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', borderRadius: '10px' }}>
                        <button
                            onClick={() => setActiveView('list')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: activeView === 'list' ? 'var(--color-primary)' : 'transparent',
                                color: activeView === 'list' ? 'black' : 'white',
                                border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <List size={16} /> Lista
                        </button>
                        <button
                            onClick={() => setActiveView('calendar')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: activeView === 'calendar' ? 'var(--color-primary)' : 'transparent',
                                color: activeView === 'calendar' ? 'black' : 'white',
                                border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <CalendarIcon size={16} /> Calendario
                        </button>
                        <button
                            onClick={() => setActiveView('map')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: activeView === 'map' ? 'var(--color-primary)' : 'transparent',
                                color: activeView === 'map' ? 'black' : 'white',
                                border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <MapIcon size={16} /> Mapa
                        </button>
                    </div>
                    <button className="btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={18} /> Nueva Reserva
                    </button>
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <p style={{ color: 'var(--color-text-muted)' }}>Cargando reservas desde la nube...</p>
                </div>
            ) : (
                <>
                    {activeView === 'list' && (
                        <>
                            <div style={{ marginBottom: '2rem', position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o teléfono..."
                                    className="glass-panel"
                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', color: 'white' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                {filteredReservations.map(res => (
                                    <motion.div
                                        layout
                                        key={res.id}
                                        className="glass-panel"
                                        style={{
                                            padding: '1.5rem',
                                            borderLeft: `4px solid ${res.status === 'sentado' ? '#10b981' : '#fbbf24'}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: '800', fontSize: '1.2rem' }}>{res.customerName}</div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {res.status === 'confirmado' && (
                                                    <button onClick={() => handleUpdateStatus(res.id, 'sentado')} className="btn-icon" style={{ color: '#10b981' }}><CheckCircle2 size={18} /></button>
                                                )}
                                                <button
                                                    onClick={() => deleteReservation(res.id)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CalendarIcon size={16} /> {new Date(res.date).toLocaleDateString()}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={16} /> {res.time}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Users size={16} /> {res.people} personas
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Layout size={16} color="#fbbf24" /> {res.tableId ? `Mesa ${res.tableId}` : 'Mesa pendiente'}
                                            </div>
                                        </div>

                                        {res.tags && res.tags.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
                                                {res.tags.map(tag => (
                                                    <span key={tag} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
                                                <Phone size={14} /> {res.phone}
                                            </div>
                                            {res.notes && (
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                    <MessageSquare size={14} style={{ marginTop: '3px' }} /> {res.notes}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeView !== 'list' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {activeView === 'calendar' ? (
                                    <ReservationCalendar
                                        reservations={reservations}
                                        selectedDate={selectedDate}
                                        onDateSelect={setSelectedDate}
                                    />
                                ) : (
                                    <ReservationTableMap
                                        reservations={reservations}
                                        selectedDate={selectedDate}
                                        onTableSelect={(id) => setForm(f => ({ ...f, tableId: id }))}
                                        selectedTableId={form.tableId}
                                    />
                                )}
                            </div>
                            <div>
                                <DailyReservationTimeline
                                    reservations={reservations}
                                    selectedDate={selectedDate}
                                    onUpdateStatus={handleUpdateStatus}
                                    onDelete={deleteReservation}
                                />
                            </div>
                        </div>
                    )}

                    {filteredReservations.length === 0 && activeView === 'list' && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                            <CalendarIcon size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>No hay reservas próximas.</p>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Nueva Reserva */}
            <AnimatePresence>
                {isAdding && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.form
                            onSubmit={handleSave}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ padding: '2rem', width: '90%', maxWidth: '600px', border: '1px solid #fbbf24' }}
                        >
                            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Nueva Reserva</h2>
                                <button type="button" onClick={() => setIsAdding(false)} className="btn-icon"><X size={20} /></button>
                            </header>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre del Cliente</label>
                                    <input
                                        required
                                        className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                        value={form.customerName}
                                        onChange={e => setForm({ ...form, customerName: e.target.value })}
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Teléfono</label>
                                    <input
                                        required
                                        className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="600 000 000"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Personas</label>
                                    <input
                                        type="number"
                                        className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                        value={form.people}
                                        onChange={e => setForm({ ...form, people: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Fecha</label>
                                    <input
                                        type="date"
                                        className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                        value={form.date}
                                        onChange={e => setForm({ ...form, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Hora</label>
                                    <input
                                        type="time"
                                        className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                        value={form.time}
                                        onChange={e => setForm({ ...form, time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mesa (Opcional)</label>
                                    <input
                                        placeholder="Ej. 4, Barra..."
                                        className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                        value={form.tableId}
                                        onChange={e => setForm({ ...form, tableId: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Estado</label>
                                    <select
                                        className="glass-panel"
                                        style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white', background: 'rgba(255,255,255,0.05)' }}
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                    >
                                        <option value="confirmado">Confirmado</option>
                                        <option value="sentado">Sentado</option>
                                        <option value="no-show">No-show</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Etiquetas</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {availableTags.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    background: form.tags.includes(tag) ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                                    border: '1px solid var(--glass-border)',
                                                    color: form.tags.includes(tag) ? 'black' : 'white',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Notas</label>
                                    <textarea
                                        placeholder="Alergias, preferencias, celebración..."
                                        className="glass-panel" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white', minHeight: '80px' }}
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar Reserva</button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Bookings;
