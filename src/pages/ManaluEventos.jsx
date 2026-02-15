import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    Calculator,
    Calendar as CalendarIcon,
    CheckCircle,
    Plus,
    Trash2,
    Clock,
    CheckSquare,
    Grid,
    List,
    DollarSign,
    Box,
    Edit,
    Save,
    X,
    Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManaluEventos = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [eventData, setEventData] = useState({
        name: '',
        date: '',
        guests: 50
    });

    // Mock Menu Options
    const defaultMenus = [
        { id: 'm1', name: 'Menú Boda Clásico', price: 85.00, items: ['Jamón Ibérico', 'Gambas', 'Solomillo', 'Tarta'] },
        { id: 'm2', name: 'Menú Comunión', price: 45.00, items: ['Entremeses', 'Paella', 'Helado'] },
        { id: 'm3', name: 'Cóctel Empresa', price: 30.00, items: ['Canapés variados', 'Bebida barra libre (2h)'] }
    ];

    const [menus, setMenus] = useState(() => {
        const saved = localStorage.getItem('manalu_menus');
        return saved ? JSON.parse(saved) : defaultMenus;
    });

    useEffect(() => {
        localStorage.setItem('manalu_menus', JSON.stringify(menus));
    }, [menus]);

    const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [menuForm, setMenuForm] = useState({ name: '', price: '', items: '' });

    const handleSaveMenu = () => {
        if (!menuForm.name || !menuForm.price) return;

        const itemsArray = typeof menuForm.items === 'string'
            ? menuForm.items.split(',').map(i => i.trim()).filter(i => i)
            : menuForm.items;

        const newMenu = {
            id: editingMenu ? editingMenu.id : Date.now().toString(),
            name: menuForm.name,
            price: parseFloat(menuForm.price),
            items: itemsArray
        };

        if (editingMenu) {
            setMenus(prev => prev.map(m => m.id === editingMenu.id ? newMenu : m));
        } else {
            setMenus(prev => [...prev, newMenu]);
        }

        setMenuForm({ name: '', price: '', items: '' });
        setEditingMenu(null);
    };

    const handleEditMenu = (menu) => {
        setEditingMenu(menu);
        setMenuForm({
            name: menu.name,
            price: menu.price,
            items: menu.items.join(', ')
        });
    };

    const handleDeleteMenu = (id) => {
        if (window.confirm('¿Seguro que quieres borrar este menú?')) {
            setMenus(prev => prev.filter(m => m.id !== id));
            if (selectedMenu?.id === id) setSelectedMenu(null);
        }
    };

    const [selectedMenu, setSelectedMenu] = useState(null);
    const [agenda, setAgenda] = useState([]);

    const eventStatuses = [
        { id: 'draft', label: 'Presupuesto', color: '#64748b' },
        { id: 'confirmed', label: 'Confirmado', color: '#3b82f6' },
        { id: 'celebrated', label: 'Celebrado', color: '#10b981' },
        { id: 'paid', label: 'Pagado', color: '#f59e0b' }
    ];

    const calculateBudget = () => {
        if (!selectedMenu) return 0;
        return selectedMenu.price * eventData.guests;
    };

    const handleSaveEvent = () => {
        if (!selectedMenu || !eventData.name || !eventData.date) {
            alert('Por favor complete el nombre, fecha y menú.');
            return;
        }
        const newEvent = {
            // eslint-disable-next-line react-hooks/purity
            id: Date.now().toString(),
            ...eventData,
            menu: selectedMenu,
            total: (selectedMenu.price * eventData.guests * 1.10).toFixed(2),
            status: 'draft',
            tasks: [
                { id: 't1', text: 'Confirmar alérgenos', completed: false },
                { id: 't2', text: 'Reserva de espacio', completed: false },
                { id: 't3', text: 'Contratar música/DJ', completed: false }
            ]
        };
        setAgenda(prev => [...prev, newEvent]);
        setEventData({ name: '', date: '', guests: 50 });
        setSelectedMenu(null);
    };

    const updateEventStatus = (eventId, newStatus) => {
        setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
    };

    const toggleTask = (eventId, taskId) => {
        setAgenda(prev => prev.map(ev => {
            if (ev.id === eventId) {
                return {
                    ...ev,
                    tasks: ev.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
                };
            }
            return ev;
        }));
    };

    const getStatusColor = (statusId) => eventStatuses.find(s => s.id === statusId)?.color || '#64748b';

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                    >
                        <ArrowLeft />
                    </button>

                    {/* Eventos Logo */}
                    <img
                        src="/logo-eventos.jpg"
                        alt="Manalu Eventos"
                        style={{
                            height: '60px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '2px solid #ec4899',
                            display: 'block'
                        }}
                    />

                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #ec4899, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Manalú Eventos
                        </h1>
                    </div>
                </div>
                <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{ padding: '0.5rem 1rem', background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <List size={16} /> Lista
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        style={{ padding: '0.5rem 1rem', background: viewMode === 'calendar' ? 'var(--color-primary)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Grid size={16} /> Calendario
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Form Section */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Calculator size={20} /> Nuevo Presupuesto
                    </h2>

                    {isMenuManagerOpen ? (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', margin: 0 }}>Gestionar Menús</h3>
                                <button onClick={() => setIsMenuManagerOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
                            </div>

                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    placeholder="Nombre del Menú"
                                    value={menuForm.name}
                                    onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        placeholder="Precio"
                                        value={menuForm.price}
                                        onChange={e => setMenuForm({ ...menuForm, price: e.target.value })}
                                        style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }}
                                    />
                                    <input
                                        placeholder="Platos (sep. por comas)"
                                        value={menuForm.items}
                                        onChange={e => setMenuForm({ ...menuForm, items: e.target.value })}
                                        style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }}
                                    />
                                </div>
                                <button
                                    onClick={handleSaveMenu}
                                    style={{ padding: '0.5rem', background: 'var(--color-primary)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Save size={16} /> {editingMenu ? 'Actualizar Menú' : 'Guardar Nuevo Menú'}
                                </button>
                                {editingMenu && (
                                    <button
                                        onClick={() => { setEditingMenu(null); setMenuForm({ name: '', price: '', items: '' }); }}
                                        style={{ padding: '0.5rem', background: 'transparent', border: '1px solid #64748b', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                        Cancelar Edición
                                    </button>
                                )}
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {menus.map(menu => (
                                    <div key={menu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{menu.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{menu.price}€</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleEditMenu(menu)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit size={14} /></button>
                                            <button onClick={() => handleDeleteMenu(menu.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#94a3b8' }}>Nombre del Evento</label>
                            <input
                                type="text"
                                className="glass-panel"
                                style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                value={eventData.name}
                                onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: '#94a3b8' }}>Fecha</label>
                                <input
                                    type="date"
                                    className="glass-panel"
                                    style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                    value={eventData.date}
                                    onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: '#94a3b8' }}>Comensales</label>
                                <input
                                    type="number"
                                    className="glass-panel"
                                    style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white' }}
                                    value={eventData.guests}
                                    onChange={(e) => setEventData({ ...eventData, guests: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', margin: 0 }}>Seleccionar Menú</h3>
                                {!isMenuManagerOpen && (
                                    <button
                                        onClick={() => setIsMenuManagerOpen(true)}
                                        style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                        <Settings size={14} /> Gestionar
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {menus.map(menu => (
                                    <button
                                        key={menu.id}
                                        onClick={() => setSelectedMenu(menu)}
                                        style={{
                                            padding: '1rem',
                                            textAlign: 'left',
                                            background: selectedMenu?.id === menu.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                                            border: selectedMenu?.id === menu.id ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{menu.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{menu.items.join(', ')}</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{menu.price}€/pax</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ color: '#94a3b8' }}>Total Estimado (Inc. IVA)</span>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                                {selectedMenu ? (calculateBudget() * 1.10).toFixed(2) : '0.00'}€
                            </span>
                        </div>
                        <button className="btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }} onClick={handleSaveEvent}>
                            <Plus size={20} style={{ marginRight: '0.5rem' }} /> Guardar en Agenda
                        </button>
                    </div>
                </div>

                {/* Agenda View Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {viewMode === 'list' ? (
                        <div className="glass-panel" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Próximos Eventos</h2>
                            {agenda.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                                    <CalendarIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No hay eventos registrados.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {agenda.map(ev => (
                                        <div key={ev.id} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div>
                                                    <h3 style={{ margin: 0 }}>{ev.name}</h3>
                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarIcon size={14} /> {ev.date}</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={14} /> {ev.guests} pax</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                                    <select
                                                        value={ev.status}
                                                        onChange={(e) => updateEventStatus(ev.id, e.target.value)}
                                                        style={{
                                                            background: getStatusColor(ev.status),
                                                            border: 'none',
                                                            color: 'white',
                                                            padding: '0.4rem 0.8rem',
                                                            borderRadius: '8px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {eventStatuses.map(s => <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>{s.label}</option>)}
                                                    </select>
                                                    <strong style={{ color: 'var(--color-primary)' }}>{ev.total}€</strong>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <CheckSquare size={14} /> Lista de tareas:
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    {ev.tasks.map(task => (
                                                        <button
                                                            key={task.id}
                                                            onClick={() => toggleTask(ev.id, task.id)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: task.completed ? '#10b981' : '#94a3b8',
                                                                textAlign: 'left',
                                                                fontSize: '0.8rem',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem'
                                                            }}
                                                        >
                                                            <div style={{ width: '14px', height: '14px', border: '1px solid currentColor', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {task.completed && <CheckCircle size={10} />}
                                                            </div>
                                                            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ padding: '2rem', flex: 1 }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Calendario de Ocupación</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                                    <div key={day} style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: '#94a3b8' }}>{day}</div>
                                ))}
                                {Array.from({ length: 31 }).map((_, i) => {
                                    const day = i + 1;
                                    const eventsThisDay = agenda.filter(ev => {
                                        const evDate = new Date(ev.date);
                                        return evDate.getDate() === day;
                                    });
                                    return (
                                        <div key={i} style={{
                                            aspectRatio: '1',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{day}</span>
                                            {eventsThisDay.map(ev => (
                                                <div
                                                    key={ev.id}
                                                    style={{
                                                        width: '100%',
                                                        height: '4px',
                                                        background: getStatusColor(ev.status),
                                                        borderRadius: '2px',
                                                        marginTop: '2px'
                                                    }}
                                                    title={ev.name}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {eventStatuses.map(s => (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                                        <div style={{ width: '8px', height: '8px', background: s.color, borderRadius: '50%' }} />
                                        {s.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManaluEventos;

