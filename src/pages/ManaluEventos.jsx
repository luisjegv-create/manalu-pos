import React, { useState, useEffect, useMemo } from 'react';
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
    Settings,
    ChevronLeft,
    ChevronRight,
    BarChart2,
    PieChart,
    TrendingUp as TrendingIcon,
    Wallet,
    RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvents } from '../context/EventContext';
import { printA4Invoice, printDepositTicket } from '../utils/printHelpers';
import { useInventory } from '../context/InventoryContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ManaluEventos = () => {
    const navigate = useNavigate();
    const {
        agenda,
        eventMenus,
        loading, // 'loading' is used below for spinner
        addEvent,
        updateEventStatus,
        updateEventDepositStatus,
        toggleTask,
        deleteEvent, // 'deleteEvent' is a core function from context, likely used elsewhere in the full component
        addMenu,
        updateMenu,
        deleteMenu,
        assignInvoiceNumber
    } = useEvents();

    const { incrementTicketNumber, restaurantInfo } = useInventory();

    const [view, setView] = useState('calendar'); // 'calendar' | 'list' | 'analytics'
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [eventData, setEventData] = useState({
        name: '',
        date: '',
        guests: 50,
        isVenueOnly: false,
        venuePrice: 0,
        taxRate: 0.10,
        hasVat: false,
        depositAmount: 0,
        depositStatus: 'pending',
        clientNif: '',
        clientAddress: ''
    });

    const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [menuForm, setMenuForm] = useState({ name: '', price: '', items: '' });

    const [selectedMenus, setSelectedMenus] = useState([]); // Array of { menuId, quantity, name, price }
    const [currentMenuQuantity, setCurrentMenuQuantity] = useState(1);
    const [menuPicking, setMenuPicking] = useState(null);

    // Calendar navigation state
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [previewDay, setPreviewDay] = useState(null); // { day, month, year, events }

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust for Monday start
    };

    const nextMonth = () => {
        setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
    };

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const handleSaveMenu = async () => {
        if (!menuForm.name || !menuForm.price) return;

        const itemsArray = typeof menuForm.items === 'string'
            ? menuForm.items.split(',').map(i => i.trim()).filter(i => i)
            : menuForm.items;

        const menuPayload = {
            name: menuForm.name,
            price: parseFloat(menuForm.price),
            items: itemsArray
        };

        if (editingMenu) {
            await updateMenu(editingMenu.id, menuPayload);
        } else {
            await addMenu(menuPayload);
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

    const handleDeleteMenu = async (id) => {
        if (window.confirm('¿Seguro que quieres borrar este menú?')) {
            await deleteMenu(id);
            if (editingMenu?.id === id) setEditingMenu(null);
        }
    };

    const eventStatuses = [
        { id: 'draft', label: 'Presupuesto', color: '#64748b' },
        { id: 'confirmed', label: 'Confirmado', color: '#3b82f6' },
        { id: 'celebrated', label: 'Celebrado', color: '#10b981' },
        { id: 'paid', label: 'Pagado', color: '#f59e0b' }
    ];

    const calculateBudget = () => {
        if (eventData.isVenueOnly) {
            return eventData.venuePrice || 0;
        }
        return selectedMenus.reduce((acc, m) => acc + (m.price * m.quantity), 0);
    };

    const calculateTotalWithTax = (subtotal, hasVat, taxRate) => {
        if (!hasVat) return subtotal;
        return subtotal * (1 + taxRate);
    };

    const handleAddSelectedMenu = () => {
        if (!menuPicking || currentMenuQuantity <= 0) return;

        const existing = selectedMenus.find(m => m.menuId === menuPicking.id);
        if (existing) {
            setSelectedMenus(selectedMenus.map(m =>
                m.menuId === menuPicking.id
                    ? { ...m, quantity: m.quantity + currentMenuQuantity }
                    : m
            ));
        } else {
            setSelectedMenus([...selectedMenus, {
                menuId: menuPicking.id,
                name: menuPicking.name,
                price: menuPicking.price,
                quantity: currentMenuQuantity
            }]);
        }
        setMenuPicking(null);
        setCurrentMenuQuantity(1);
    };

    const handleRemoveSelectedMenu = (menuId) => {
        setSelectedMenus(selectedMenus.filter(m => m.menuId !== menuId));
    };

    const handleGenerateInvoice = async (event) => {
        try {
            let currentInvoiceNumber = event.invoiceNumber;

            // If it doesn't have an invoice number yet, assign one from the common sequence
            if (!currentInvoiceNumber) {
                if (window.confirm('Se va a generar un número de factura oficial. ¿Deseas continuar?')) {
                    const nextNumber = await incrementTicketNumber();
                    if (nextNumber) {
                        currentInvoiceNumber = `FACT - ${nextNumber} `; // Using space after number for clarity as per user style in other places
                        await assignInvoiceNumber(event.id, currentInvoiceNumber);
                    } else {
                        alert('Error al obtener el número de factura correlativo.');
                        return;
                    }
                } else {
                    return;
                }
            }

            // Prepare the event object with the number for printing
            const eventToPrint = {
                ...event,
                invoiceNumber: currentInvoiceNumber
            };

            printA4Invoice(eventToPrint, restaurantInfo);
        } catch (err) {
            console.error("Error generating invoice:", err);
            alert("Error al generar la factura fiscal.");
        }
    };

    const handleDepositAction = (event, type) => {
        // type: 'pay' (cobrar) or 'return' (devolver)
        const isReturn = type === 'return';
        const newStatus = isReturn ? 'returned' : 'paid';

        const depositData = {
            customerName: event.name,
            amount: parseFloat(event.depositAmount),
            type: isReturn ? 'return' : 'payment',
            concept: isReturn ? `Devolución fianza evento ${event.name} ` : `Reserva / Fianza evento ${event.name} `,
            receiptNumber: `${isReturn ? 'DEV' : 'REC'} -${event.id.substring(0, 5)} `
        };

        printDepositTicket(depositData);
        updateEventDepositStatus(event.id, newStatus);
    };

    const handleSaveEvent = async () => {
        if (!eventData.name || !eventData.date) {
            alert('Por favor complete el nombre y fecha.');
            return;
        }

        if (!eventData.isVenueOnly && selectedMenus.length === 0) {
            alert('Por favor añada al menos un menú o seleccione Solo Alquiler.');
            return;
        }

        const subtotal = calculateBudget();
        const finalTotal = calculateTotalWithTax(subtotal, eventData.hasVat, eventData.taxRate);

        const newEvent = {
            ...eventData,
            guests: eventData.isVenueOnly ? 0 : selectedMenus.reduce((acc, m) => acc + m.quantity, 0),
            menuId: !eventData.isVenueOnly && selectedMenus.length > 0 ? selectedMenus[0].menuId : null,
            selectedMenus: eventData.isVenueOnly ? [] : selectedMenus,
            total: finalTotal.toFixed(2),
            status: 'draft',
            tasks: [
                { id: 't1', text: 'Confirmar alérgenos', completed: false },
                { id: 't2', text: 'Reserva de espacio', completed: false },
                { id: 't3', text: 'Contratar música/DJ', completed: false }
            ]
        };
        await addEvent(newEvent);
        setEventData({
            name: '',
            date: '',
            guests: 50,
            isVenueOnly: false,
            venuePrice: 0,
            taxRate: 0.10,
            hasVat: false,
            depositAmount: 0,
            depositStatus: 'pending'
        });
        setSelectedMenus([]);
        setIsFormOpen(false); // Close form after saving
    };

    const EventAnalytics = () => {
        const stats = useMemo(() => {
            const totalRevenue = agenda.reduce((acc, ev) => acc + (parseFloat(ev.total) || 0), 0);
            const confirmedEvents = agenda.filter(ev => ev.status === 'confirmed').length;
            const menuEvents = agenda.filter(ev => !ev.isVenueOnly).length;
            const rentalEvents = agenda.filter(ev => ev.isVenueOnly).length;

            const totalPax = agenda.filter(ev => !ev.isVenueOnly).reduce((acc, ev) => acc + (ev.guests || 0), 0);
            const avgPax = menuEvents > 0 ? (totalPax / menuEvents).toFixed(0) : 0;

            const revenueByStatus = {
                draft: agenda.filter(ev => ev.status === 'draft').reduce((acc, ev) => acc + (parseFloat(ev.total) || 0), 0),
                confirmed: agenda.filter(ev => ev.status === 'confirmed').reduce((acc, ev) => acc + (parseFloat(ev.total) || 0), 0),
                paid: agenda.filter(ev => ev.status === 'paid').reduce((acc, ev) => acc + (parseFloat(ev.total) || 0), 0),
            };

            return { totalRevenue, confirmedEvents, menuEvents, rentalEvents, avgPax, revenueByStatus };
        }, [agenda]);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ingresos Totales (Eventos)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{stats.totalRevenue.toFixed(2)}€</div>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem' }}>Basado en {agenda.length} registros</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Pax Medio (Cubiertos)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{stats.avgPax}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Promedio por evento con menú</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Eventos Confirmados</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.confirmedEvents}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>De un total de {agenda.length}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <PieChart size={18} color="var(--color-primary)" /> Mix de Negocio
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span>Eventos con Menú</span>
                                    <span>{stats.menuEvents}</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(stats.menuEvents / (agenda.length || 1)) * 100}% `, height: '100%', background: 'var(--color-primary)' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span>Solo Alquiler Local</span>
                                    <span>{stats.rentalEvents}</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(stats.rentalEvents / (agenda.length || 1)) * 100}% `, height: '100%', background: '#ec4899' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingIcon size={18} color="#10b981" /> Estado Financiero
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <span style={{ color: '#94a3b8' }}>Confirmado (Pendiente Cobro)</span>
                                <span style={{ fontWeight: 'bold' }}>{stats.revenueByStatus.confirmed.toFixed(2)}€</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                <span style={{ color: '#10b981' }}>Cobrado / Pagado</span>
                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>{stats.revenueByStatus.paid.toFixed(2)}€</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <span style={{ color: '#64748b' }}>Borradores / Presupuestos</span>
                                <span style={{ fontWeight: 'bold', color: '#64748b' }}>{stats.revenueByStatus.draft.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem' }}>
                        <button
                            onClick={() => setView('calendar')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem', borderRadius: '12px',
                                background: view === 'calendar' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                color: view === 'calendar' ? 'black' : 'white',
                                border: 'none', cursor: 'pointer', transition: 'all 0.3s'
                            }}
                        >
                            <CalendarIcon size={18} /> Calendario
                        </button>
                        <button
                            onClick={() => setView('list')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem', borderRadius: '12px',
                                background: view === 'list' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                color: view === 'list' ? 'black' : 'white',
                                border: 'none', cursor: 'pointer', transition: 'all 0.3s'
                            }}
                        >
                            <List size={18} /> Lista
                        </button>
                        <button
                            onClick={() => setView('analytics')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem', borderRadius: '12px',
                                background: view === 'analytics' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                color: view === 'analytics' ? 'black' : 'white',
                                border: 'none', cursor: 'pointer', transition: 'all 0.3s'
                            }}
                        >
                            <BarChart2 size={18} /> Estadísticas
                        </button>
                    </div>

                    <button className="btn-primary" onClick={() => setIsFormOpen(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
                        <Plus size={20} style={{ marginRight: '0.5rem' }} /> Nuevo Presupuesto
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: isFormOpen ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                {/* Form Section */}
                <AnimatePresence>
                    {isFormOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="glass-panel" style={{ padding: '2rem', position: 'relative' }}
                        >
                            <button
                                onClick={() => setIsFormOpen(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
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
                                        {loading ? (
                                            <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>Cargando...</div>
                                        ) : (
                                            eventMenus.map(menu => (
                                                <div key={menu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{menu.name}</div>
                                                        <div style={{ fontSize: '1rem', color: '#94a3b8' }}>{menu.price}€</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => handleEditMenu(menu)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit size={14} /></button>
                                                        <button onClick={() => handleDeleteMenu(menu.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
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

                                <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={eventData.isVenueOnly}
                                                onChange={(e) => setEventData({ ...eventData, isVenueOnly: e.target.checked })}
                                            />
                                            Solo Alquiler de Local
                                        </label>
                                    </div>

                                    {eventData.isVenueOnly ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: '#94a3b8' }}>Precio del Alquiler (Base)</label>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    className="glass-panel"
                                                    style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white', flex: 1 }}
                                                    value={eventData.venuePrice}
                                                    onChange={(e) => setEventData({ ...eventData, venuePrice: parseFloat(e.target.value) || 0 })}
                                                />
                                                <span style={{ fontSize: '1.2rem' }}>€</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={18} color="var(--color-primary)" /> Datos Fiscales del Cliente
                                    </h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>NIF / CIF</label>
                                            <input
                                                type="text"
                                                className="glass-panel"
                                                placeholder="Ej: 12345678X"
                                                style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                                                value={eventData.clientNif}
                                                onChange={(e) => setEventData({ ...eventData, clientNif: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dirección de Facturación</label>
                                            <textarea
                                                className="glass-panel"
                                                placeholder="Calle, Número, CP, Ciudad..."
                                                style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', resize: 'vertical', minHeight: '60px' }}
                                                value={eventData.clientAddress}
                                                onChange={(e) => setEventData({ ...eventData, clientAddress: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: eventData.isVenueOnly ? '1rem' : '0' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={eventData.hasVat}
                                            onChange={(e) => setEventData({ ...eventData, hasVat: e.target.checked, taxRate: e.target.checked ? (eventData.isVenueOnly ? 0.21 : 0.10) : 0 })}
                                        />
                                        Incluir IVA
                                    </label>

                                    {eventData.hasVat && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tipo:</label>
                                            <select
                                                value={eventData.taxRate}
                                                onChange={(e) => setEventData({ ...eventData, taxRate: parseFloat(e.target.value) })}
                                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}
                                            >
                                                <option value={0.10} style={{ background: '#0f172a' }}>10% (Comida)</option>
                                                <option value={0.21} style={{ background: '#0f172a' }}>21% (Alquiler)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Wallet size={16} /> Fianza / Reserva (Cobro Adelantado)
                                    </label>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            className="glass-panel"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'white', flex: 1 }}
                                            placeholder="Ej: 200"
                                            value={eventData.depositAmount}
                                            onChange={(e) => setEventData({ ...eventData, depositAmount: parseFloat(e.target.value) || 0 })}
                                        />
                                        <span style={{ fontSize: '1.2rem' }}>€</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Este importe se marcará como pendiente hasta que se cobre en la lista.</p>
                                </div>
                            </div>

                            {!eventData.isVenueOnly && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Menus Seleccionados</h3>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                            {selectedMenus.reduce((acc, m) => acc + m.quantity, 0)} cubiertos totales
                                        </div>
                                    </div>

                                    {selectedMenus.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                            {selectedMenus.map(m => (
                                                <div key={m.menuId} className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{m.quantity}x</span> {m.name}
                                                        <div style={{ fontSize: '1rem', color: '#94a3b8' }}>{m.price}€ / pax</div>
                                                    </div>
                                                    <button onClick={() => handleRemoveSelectedMenu(m.menuId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', border: '1px dashed var(--glass-border)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                            Añade menús desde la lista de abajo
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Añadir Menú</h3>
                                        {!isMenuManagerOpen && (
                                            <button
                                                onClick={() => setIsMenuManagerOpen(true)}
                                                style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                <Settings size={14} /> Gestionar
                                            </button>
                                        )}
                                    </div>

                                    {menuPicking && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--color-primary)' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold' }}>{menuPicking.name}</span>
                                                <span style={{ color: 'var(--color-primary)' }}>{menuPicking.price}€</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    value={currentMenuQuantity}
                                                    onChange={e => setCurrentMenuQuantity(parseInt(e.target.value) || 0)}
                                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }}
                                                    placeholder="Cantidad"
                                                />
                                                <button
                                                    onClick={handleAddSelectedMenu}
                                                    style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                                                >
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => setMenuPicking(null)}
                                                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {eventMenus.map(menu => (
                                            <button
                                                key={menu.id}
                                                onClick={() => { setMenuPicking(menu); setCurrentMenuQuantity(1); }}
                                                style={{
                                                    padding: '1rem',
                                                    textAlign: 'left',
                                                    background: menuPicking?.id === menu.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                                                    border: menuPicking?.id === menu.id ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{menu.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{menu.items?.join(', ')}</div>
                                                </div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.2rem' }}>{menu.price}€/pax</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ color: '#94a3b8' }}>Total {eventData.hasVat ? 'con IVA' : 'sin IVA'}</span>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                                        {calculateTotalWithTax(calculateBudget(), eventData.hasVat, eventData.taxRate).toFixed(2)}€
                                    </span>
                                </div>
                                <button className="btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }} onClick={handleSaveEvent}>
                                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> Guardar en Agenda
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Agenda View Section */}
            <div className="events-content" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {view === 'list' && (
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
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarIcon size={14} /> {ev.date}</span>
                                                        {!ev.isVenueOnly && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={14} /> {ev.guests} pax</span>}
                                                        {ev.isVenueOnly && <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Solo Alquiler</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                                                        {ev.isVenueOnly && <span style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>Solo Alquiler</span>}
                                                        {ev.invoiceNumber && <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>{ev.invoiceNumber} </span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                                                        {ev.isVenueOnly ? (
                                                            <span style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                                Alquiler de Espacio
                                                            </span>
                                                        ) : (
                                                            ev.selectedMenus?.map((m, i) => (
                                                                <span key={i} style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                                    <b>{m.quantity}</b> {m.name}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
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
                                                <button
                                                    onClick={() => handleGenerateInvoice(ev)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid var(--glass-border)',
                                                        color: 'white',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        marginTop: '0.5rem'
                                                    }}
                                                >
                                                    <DollarSign size={14} /> Factura
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Wallet size={16} /> Fianza: <strong>{ev.depositAmount}€</strong>
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '20px',
                                                    background: ev.depositStatus === 'paid' ? 'rgba(16, 185, 129, 0.15)' : ev.depositStatus === 'returned' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.1)',
                                                    color: ev.depositStatus === 'paid' ? '#10b981' : ev.depositStatus === 'returned' ? '#3b82f6' : '#94a3b8'
                                                }}>
                                                    {ev.depositStatus === 'paid' ? 'Cobrada' : ev.depositStatus === 'returned' ? 'Devuelta' : 'Pendiente'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {ev.depositStatus === 'pending' && (
                                                    <button
                                                        onClick={() => handleDepositAction(ev, 'pay')}
                                                        className="btn-primary"
                                                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
                                                    >
                                                        Cobrar Fianza
                                                    </button>
                                                )}
                                                {ev.depositStatus === 'paid' && (
                                                    <button
                                                        onClick={() => handleDepositAction(ev, 'return')}
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.5rem',
                                                            fontSize: '0.75rem',
                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                                            color: '#3b82f6',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '0.4rem'
                                                        }}
                                                    >
                                                        <RotateCcw size={14} /> Devolver Fianza
                                                    </button>
                                                )}
                                                {ev.depositStatus === 'returned' && (
                                                    <div style={{ textAlign: 'center', width: '100%', fontSize: '0.75rem', color: '#3b82f6', fontStyle: 'italic' }}>
                                                        Fianza devuelta al cliente
                                                    </div>
                                                )}
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
                                                <button
                                                    onClick={() => { if (window.confirm('¿Eliminar evento?')) deleteEvent(ev.id) }}
                                                    style={{ gridColumn: '1 / -1', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                >
                                                    <Trash2 size={14} /> Eliminar Evento
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {
                    view === 'calendar' && (
                        <div className="glass-panel" style={{ padding: '2rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Calendario de Ocupación</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '12px' }}>
                                    <button
                                        onClick={prevMonth}
                                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span style={{ fontWeight: 'bold', minWidth: '120px', textAlign: 'center' }}>
                                        {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                                    </span>
                                    <button
                                        onClick={nextMonth}
                                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                                    <div key={day} style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: '#94a3b8' }}>{day}</div>
                                ))}

                                {Array.from({ length: getFirstDayOfMonth(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()) }).map((_, i) => (
                                    <div key={`pad - ${i} `} style={{ aspectRatio: '1', opacity: 0 }} />
                                ))}

                                {Array.from({ length: getDaysInMonth(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()) }).map((_, i) => {
                                    const day = i + 1;
                                    const year = currentCalendarDate.getFullYear();
                                    const month = currentCalendarDate.getMonth();

                                    const eventsThisDay = agenda.filter(ev => {
                                        if (!ev.date) return false;
                                        const [evYear, evMonth, evDay] = ev.date.split('-').map(Number);
                                        return evDay === day && (evMonth - 1) === month && evYear === year;
                                    });

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => {
                                                if (eventsThisDay.length > 0) {
                                                    setPreviewDay({ day, month, year, events: eventsThisDay });
                                                }
                                            }}
                                            style={{
                                                aspectRatio: '1',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px',
                                                padding: '0.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                position: 'relative',
                                                border: '1px solid var(--glass-border)',
                                                transition: 'all 0.2s',
                                                cursor: eventsThisDay.length > 0 ? 'pointer' : 'default',
                                                transform: (previewDay?.day === day && previewDay?.month === month) ? 'scale(1.05)' : 'none',
                                                boxShadow: (previewDay?.day === day && previewDay?.month === month) ? '0 0 15px rgba(var(--color-primary-rgb), 0.3)' : 'none',
                                                zIndex: (previewDay?.day === day && previewDay?.month === month) ? 10 : 1
                                            }}
                                            className={eventsThisDay.length > 0 ? 'calendar-day-active' : ''}
                                        >
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: eventsThisDay.length > 0 ? 'var(--color-primary)' : '#64748b' }}>{day}</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', overflowY: 'auto' }}>
                                                {eventsThisDay.map(ev => (
                                                    <div
                                                        key={ev.id}
                                                        style={{
                                                            width: '100%',
                                                            height: '4px',
                                                            background: getStatusColor(ev.status),
                                                            borderRadius: '2px'
                                                        }}
                                                        title={`${ev.name} (${ev.total}€)`}
                                                    />
                                                ))}
                                            </div>

                                            <AnimatePresence>
                                                {previewDay?.day === day && previewDay?.month === month && previewDay?.year === year && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '110%',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            width: '200px',
                                                            background: 'rgba(15, 23, 42, 0.95)',
                                                            backdropFilter: 'blur(12px)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '12px',
                                                            padding: '1rem',
                                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                                                            zIndex: 100
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--color-primary)' }}>{day} de {monthNames[month]}</span>
                                                            <button onClick={() => setPreviewDay(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={14} /></button>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {previewDay.events.map(ev => (
                                                                <div key={ev.id} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `3px solid ${getStatusColor(ev.status)} ` }}>
                                                                    <div style={{ fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '2px' }}>{ev.name}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span>{ev.guests} pax</span>
                                                                        <span>{ev.total}€</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {eventStatuses.map(s => (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                                        <div style={{ width: '8px', height: '8px', background: s.color, borderRadius: '50%' }} />
                                        {s.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {view === 'analytics' && <EventAnalytics />}
            </div >
        </div >
    );
};

export default ManaluEventos;
