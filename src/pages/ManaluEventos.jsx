import React, { useState, useMemo } from 'react';
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
    RotateCcw,
    LayoutDashboard,
    Bell,
    FileText,
    Activity,
    User
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useEvents } from '../context/EventContext';
import { printA4Invoice, printDepositTicket } from '../utils/printHelpers';
import { useInventory } from '../context/InventoryContext';
import EventCustomers from '../components/EventCustomers';
import EventInventory from '../components/EventInventory'; // Nuevo componente


const EventFinances = ({ agenda, updateEventExpenses, venueExpenses, addVenueExpense, deleteVenueExpense }) => {
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState('eventos'); // 'eventos' | 'local'

    const [isAdding, setIsAdding] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        eventId: '',
        concept: '',
        amount: '',
        category: 'Floristería',
        date: new Date().toISOString().split('T')[0]
    });

    const eventExpenseCategories = ['Floristería', 'Música/DJ', 'Personal Extra', 'Comercial/Comisiones', 'Decoración', 'Otros'];
    const venueExpenseCategories = ['Luz/Agua', 'Mantenimiento', 'Alquiler', 'Seguros', 'Gestoría', 'Limpieza', 'Otros'];

    const analytics = useMemo(() => {
        let totalIncome = 0;
        let totalExpenses = 0;
        const expensesList = [];

        agenda.forEach(ev => {
            if (!ev.date) return;
            const [evYear, evMonth] = ev.date.split('-').map(Number);
            if (evMonth === parseInt(filterMonth) && evYear === parseInt(filterYear)) {
                if (ev.status !== 'cancelado') {
                    totalIncome += parseFloat(ev.total || 0);
                }

                if (ev.eventExpenses && ev.eventExpenses.length > 0) {
                    ev.eventExpenses.forEach(exp => {
                        const amount = parseFloat(exp.amount || 0);
                        totalExpenses += amount;
                        expensesList.push({
                            ...exp,
                            eventName: ev.name,
                            eventId: ev.id,
                            eventDate: ev.date
                        });
                    });
                }
            }
        });

        expensesList.sort((a, b) => new Date(b.date || a.eventDate) - new Date(a.date || b.eventDate));

        let totalVenueExpenses = 0;
        const currentVenueExpenses = (venueExpenses || []).filter(exp => {
            if (!exp.date) return false;
            const [y, m] = exp.date.split('-').map(Number);
            return m === parseInt(filterMonth) && y === parseInt(filterYear);
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        currentVenueExpenses.forEach(exp => {
            totalVenueExpenses += parseFloat(exp.amount || 0);
        });

        return {
            totalIncome,
            totalEventExpenses: totalExpenses,
            totalVenueExpenses,
            netProfit: totalIncome - totalExpenses - totalVenueExpenses,
            expensesList,
            currentVenueExpenses
        };
    }, [agenda, venueExpenses, filterMonth, filterYear]);

    const handleSaveExpense = () => {
        if (!expenseForm.concept || !expenseForm.amount) {
            alert("Por favor completa concepto e importe.");
            return;
        }

        if (activeTab === 'eventos') {
            if (!expenseForm.eventId) {
                alert("Por favor selecciona un evento.");
                return;
            }
            const event = agenda.find(e => e.id === expenseForm.eventId);
            if (!event) return;

            const newExpense = {
                id: Date.now().toString(),
                concept: expenseForm.concept,
                amount: parseFloat(expenseForm.amount),
                category: expenseForm.category,
                date: expenseForm.date
            };

            const updatedExpenses = [...(event.eventExpenses || []), newExpense];
            updateEventExpenses(event.id, updatedExpenses);
        } else {
            addVenueExpense({
                concept: expenseForm.concept,
                amount: parseFloat(expenseForm.amount),
                category: expenseForm.category,
                date: expenseForm.date
            });
        }

        setExpenseForm({ ...expenseForm, concept: '', amount: '' });
        setIsAdding(false);
    };

    const handleDeleteExpense = (expenseId, eventId = null) => {
        if (!window.confirm('¿Eliminar este gasto?')) return;

        if (activeTab === 'eventos' && eventId) {
            const event = agenda.find(e => e.id === eventId);
            if (!event) return;
            const updatedExpenses = (event.eventExpenses || []).filter(exp => exp.id !== expenseId);
            updateEventExpenses(eventId, updatedExpenses);
        } else {
            deleteVenueExpense(expenseId);
        }
    };

    const currentMonthEvents = agenda.filter(ev => {
        if (!ev.date) return false;
        const [evYear, evMonth] = ev.date.split('-').map(Number);
        return evMonth === parseInt(filterMonth) && evYear === parseInt(filterYear);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
            {/* Header & Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text)' }}>
                    <DollarSign size={28} color="var(--color-primary)" />
                    Finanzas de Eventos
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--border-strong)', padding: '0.5rem', borderRadius: '12px', display: 'flex', gap: '0.5rem' }}>
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="input-field"
                            style={{ padding: '0.5rem', minWidth: '120px' }}
                        >
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('es-ES', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="input-field"
                            style={{ padding: '0.5rem', width: '90px' }}
                        >
                            {[2023, 2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {/* Ingresos Estimados */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                        <TrendingIcon size={28} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Ingresos Brutos</p>
                        <h2 style={{ margin: '0.25rem 0 0 0', color: '#10b981' }}>{analytics.totalIncome.toFixed(2)}€</h2>
                    </div>
                </div>

                {/* Gastos Totales Eventos & Local */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
                            <Calculator size={22} />
                        </div>
                        <div>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>Gastos de Eventos</p>
                            <h3 style={{ margin: '0.2rem 0 0 0', color: '#ef4444', fontSize: '1.2rem' }}>{analytics.totalEventExpenses.toFixed(2)}€</h3>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#f59e0b' }}>
                            <Box size={22} />
                        </div>
                        <div>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>Gastos del Local (Fijos)</p>
                            <h3 style={{ margin: '0.2rem 0 0 0', color: '#f59e0b', fontSize: '1.2rem' }}>{analytics.totalVenueExpenses.toFixed(2)}€</h3>
                        </div>
                    </div>
                </div>

                {/* Beneficio Neto */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                        <Wallet size={28} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Beneficio Neto Estimado</p>
                        <h2 style={{ margin: '0.25rem 0 0 0', color: '#3b82f6' }}>{analytics.netProfit.toFixed(2)}€</h2>
                    </div>
                </div>
            </div>

            {/* Content Area: Expenses List & Form */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--border-strong)' }}>
                        <button
                            onClick={() => { setActiveTab('eventos'); setIsAdding(false); }}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: activeTab === 'eventos' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'eventos' ? 'white' : 'var(--color-text)', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'eventos' ? 'bold' : 'normal' }}
                        >Gastos de Eventos</button>
                        <button
                            onClick={() => { setActiveTab('local'); setIsAdding(false); }}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: activeTab === 'local' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'local' ? 'white' : 'var(--color-text)', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'local' ? 'bold' : 'normal' }}
                        >Gastos del Local fijos</button>
                    </div>

                    <button onClick={() => {
                        setIsAdding(!isAdding);
                        setExpenseForm({
                            eventId: '', concept: '', amount: '', date: new Date().toISOString().split('T')[0],
                            category: activeTab === 'eventos' ? eventExpenseCategories[0] : venueExpenseCategories[0]
                        });
                    }} className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isAdding ? <X size={18} /> : <Plus size={18} />}
                        <span>{isAdding ? 'Cancelar' : (activeTab === 'eventos' ? 'Añadir Gasto Evento' : 'Añadir Gasto Local')}</span>
                    </button>
                </div>

                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-strong)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {activeTab === 'eventos' && (
                                    <div className="form-group">
                                        <label>Evento Asociado *</label>
                                        <select
                                            className="input-field"
                                            value={expenseForm.eventId}
                                            onChange={e => setExpenseForm({ ...expenseForm, eventId: e.target.value })}
                                        >
                                            <option value="">Seleccione un evento...</option>
                                            {currentMonthEvents.map(ev => (
                                                <option key={ev.id} value={ev.id}>{ev.date} - {ev.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Fecha del Gasto *</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={expenseForm.date}
                                        onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: activeTab === 'local' ? '1 / -1' : 'auto' }}>
                                    <label>Concepto *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={expenseForm.concept}
                                        onChange={e => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                                        placeholder={activeTab === 'eventos' ? "Ej. Decoración floral salón" : "Ej. Factura de luz Enero"}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select
                                        className="input-field"
                                        value={expenseForm.category}
                                        onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    >
                                        {(activeTab === 'eventos' ? eventExpenseCategories : venueExpenseCategories).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Importe (€) *</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={expenseForm.amount}
                                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button onClick={handleSaveExpense} className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                                        <Save size={18} style={{ marginRight: '0.5rem' }} /> Guardar Gasto
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table of Expenses */}
                <div style={{ overflowX: 'auto', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--border-strong)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-strong)' }}>Fecha</th>
                                {activeTab === 'eventos' && <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-strong)' }}>Evento</th>}
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-strong)' }}>Concepto</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-strong)' }}>Categoría</th>
                                <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid var(--border-strong)' }}>Importe</th>
                                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid var(--border-strong)' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeTab === 'eventos' ? analytics.expensesList : analytics.currentVenueExpenses).length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                                        No hay gastos de {activeTab === 'eventos' ? 'eventos' : 'local'} registrados para este periodo.
                                    </td>
                                </tr>
                            ) : (
                                (activeTab === 'eventos' ? analytics.expensesList : analytics.currentVenueExpenses).map((exp, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-strong)', background: idx % 2 === 0 ? 'var(--color-bg)' : 'var(--color-surface)' }}>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{exp.date || exp.eventDate}</td>
                                        {activeTab === 'eventos' && <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{exp.eventName}</td>}
                                        <td style={{ padding: '1rem', color: 'var(--color-text)' }}>{exp.concept}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)', color: 'var(--color-text)' }}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                                            -{parseFloat(exp.amount).toFixed(2)}€
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDeleteExpense(exp.id, exp.eventId)}
                                                className="btn-icon-small"
                                                style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                                                title="Eliminar Gasto"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ManaluEventos = () => {
    const navigate = useNavigate();
    const {
        agenda,
        eventMenus,
        venueExpenses,
        loading,
        addEvent,
        updateEvent,
        updateEventStatus,
        updateEventDepositStatus,
        toggleTask,
        deleteEvent,
        addMenu,
        updateMenu,
        deleteMenu,
        assignInvoiceNumber,
        updateEventExpenses,
        addVenueExpense,
        deleteVenueExpense
    } = useEvents();

    const { incrementTicketNumber, restaurantInfo } = useInventory();

    const [view, setView] = useState('dashboard'); // 'dashboard' | 'calendar' | 'list' | 'analytics' | 'finances' | 'customers' | 'inventory'
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);


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
        clientAddress: '',
        notes: '',
        isHourly: false,
        rentHours: 1,
        rentStartTime: '12:00'
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
            return eventData.isHourly ? (parseFloat(eventData.venuePrice) || 0) * (parseInt(eventData.rentHours) || 1) : (parseFloat(eventData.venuePrice) || 0);
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
            status: eventData.status || 'draft',
            notes: eventData.notes || '',
            isHourly: eventData.isVenueOnly ? eventData.isHourly : false,
            rentHours: eventData.isVenueOnly && eventData.isHourly ? eventData.rentHours : 0,
            rentStartTime: eventData.isVenueOnly ? eventData.rentStartTime : '',
            tasks: eventData.tasks || [
                { id: 't1', text: 'Confirmar alérgenos', completed: false },
                { id: 't2', text: 'Reserva de espacio', completed: false },
                { id: 't3', text: 'Contratar música/DJ', completed: false }
            ]
        };

        if (editingEventId) {
            await updateEvent(editingEventId, newEvent);
        } else {
            await addEvent(newEvent);
        }

        setEditingEventId(null);
        setEventData({
            name: '',
            date: '',
            guests: 50,
            isVenueOnly: false,
            venuePrice: 0,
            taxRate: 0.10,
            hasVat: false,
            depositAmount: 0,
            depositStatus: 'pending',
            notes: '',
            isHourly: false,
            rentHours: 1,
            rentStartTime: '12:00'
        });
        setSelectedMenus([]);
        setEditingEventId(null);
        setSelectedMenus([]);
        setIsFormOpen(false); // Close form after saving
    };

    const openEditForm = (ev) => {
        setEditingEventId(ev.id);
        setEventData({
            name: ev.name,
            date: ev.date,
            guests: ev.guests,
            isVenueOnly: ev.isVenueOnly || false,
            venuePrice: ev.venuePrice || 0,
            taxRate: ev.taxRate || 0.10,
            hasVat: ev.hasVat || false,
            depositAmount: ev.depositAmount || 0,
            depositStatus: ev.depositStatus || 'pending',
            clientNif: ev.clientNif || '',
            clientAddress: ev.clientAddress || '',
            notes: ev.notes || '',
            isHourly: ev.isHourly || false,
            rentHours: ev.rentHours || 1,
            rentStartTime: ev.rentStartTime || '12:00',
            status: ev.status,
            tasks: ev.tasks
        });
        setSelectedMenus(ev.selectedMenus || []);
        setIsFormOpen(true);
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
        }, []);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Ingresos Totales (Eventos)</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-secondary)' }}>{stats.totalRevenue.toFixed(2)}€</div>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                            Basado en {agenda.length} registros
                        </div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Pax Medio (Cubiertos)</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-text)' }}>{stats.avgPax}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.6rem' }}>Promedio por evento con menú</div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Eventos Confirmados</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#3b82f6' }}>{stats.confirmedEvents}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.6rem' }}>De un total de {agenda.length}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text)' }}>
                            <PieChart size={20} color="var(--color-primary)" /> Mix de Negocio
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <span style={{ color: 'var(--color-text)' }}>Eventos con Menú</span>
                                    <span style={{ color: 'var(--color-primary)' }}>{stats.menuEvents}</span>
                                </div>
                                <div style={{ height: '10px', background: 'var(--color-bg)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                                    <div style={{ width: `${(stats.menuEvents / (agenda.length || 1)) * 100}% `, height: '100%', background: 'var(--color-primary)', borderRadius: '20px' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <span style={{ color: 'var(--color-text)' }}>Solo Alquiler Local</span>
                                    <span style={{ color: '#ec4899' }}>{stats.rentalEvents}</span>
                                </div>
                                <div style={{ height: '10px', background: 'var(--color-bg)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                                    <div style={{ width: `${(stats.rentalEvents / (agenda.length || 1)) * 100}% `, height: '100%', background: '#ec4899', borderRadius: '20px' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="surface-card" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text)' }}>
                            <TrendingIcon size={20} color="#10b981" /> Estado Financiero
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--border-strong)' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Confirmado (Pendiente Cobro)</span>
                                <span style={{ fontWeight: '700', color: 'var(--color-text)' }}>{stats.revenueByStatus.confirmed.toFixed(2)}€</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>Cobrado / Pagado</span>
                                <span style={{ fontWeight: '800', color: '#10b981' }}>{stats.revenueByStatus.paid.toFixed(2)}€</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--border-strong)' }}>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Borradores / Presupuestos</span>
                                <span style={{ fontWeight: '700', color: '#64748b' }}>{stats.revenueByStatus.draft.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    const getStatusColor = (statusId) => eventStatuses.find(s => s.id === statusId)?.color || '#64748b';

    const renderSidebar = () => (
        <div style={{
            width: '260px',
            background: 'var(--color-surface)',
            borderRight: '1px solid var(--border-strong)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-strong)' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'none', border: 'none', color: 'var(--color-text-muted)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem',
                        padding: 0
                    }}
                >
                    <ArrowLeft size={16} /> Volver al TPV
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CalendarIcon size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text)' }}>Manalú Eventos</h1>
                    </div>
                </div>
            </div>

            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Navegación</div>

                {[
                    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
                    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
                    { id: 'list', label: 'Lista de Eventos', icon: List },
                    { id: 'analytics', label: 'Estadísticas', icon: BarChart2 },
                    { id: 'finances', label: 'Finanzas', icon: DollarSign },
                    { id: 'inventory', label: 'Inventario Local', icon: Box }, // Nueva opción
                    { id: 'customers', label: 'Registro de Clientes', icon: Users }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.75rem 1rem', borderRadius: '10px',
                            background: view === item.id ? 'var(--color-primary)' : 'transparent',
                            color: view === item.id ? '#0f172a' : '#475569',
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            fontWeight: view === item.id ? '800' : '600',
                            fontSize: '1.05rem',
                            textAlign: 'left'
                        }}
                    >
                        <item.icon size={20} /> {item.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const EventDashboard = () => {
        const stats = useMemo(() => {
            const currentMonthEvents = agenda.filter(ev => {
                if (!ev.date) return false;
                const d = new Date(ev.date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            const pendingCobro = agenda.filter(ev => ev.status === 'confirmed').reduce((acc, ev) => acc + (parseFloat(ev.total) || 0), 0);
            return { currentMonthEvents: currentMonthEvents.length, pendingCobro };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [agenda]);

        const upcomingEvents = useMemo(() => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return agenda
                .filter(ev => ev.date && new Date(ev.date) >= now)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [agenda]);

        return (
            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                            <CalendarIcon size={18} /> <span style={{ fontWeight: '500' }}>Eventos este mes</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text)' }}>{stats.currentMonthEvents}</div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#3b82f6', marginBottom: '0.75rem' }}>
                            <Wallet size={18} /> <span style={{ fontWeight: '500' }}>Pendiente de Cobro</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#3b82f6' }}>{stats.pendingCobro.toFixed(2)}€</div>
                    </div>
                </div>

                {/* Próximos Eventos */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
                            <Plus size={24} color="var(--color-primary)" /> {editingEventId ? 'Editar Evento' : 'Nuevo Evento'}
                        </h2>
                        <button onClick={() => {
                            setIsFormOpen(false);
                            setEditingEventId(null);
                        }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>Ver Calendario Completo</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {upcomingEvents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No hay eventos próximos programados.</div>
                        ) : (
                            upcomingEvents.map(ev => (
                                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--border-strong)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ background: 'var(--color-bg)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center', minWidth: '70px', border: '1px solid var(--border-light)' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{new Date(ev.date).toLocaleDateString('es-ES', { month: 'short' })}</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text)' }}>{new Date(ev.date).getDate()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--color-text)' }}>{ev.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={14} /> {ev.guests} pax</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: ev.isVenueOnly ? '#ec4899' : 'var(--color-primary)' }}>
                                                    {ev.isVenueOnly ? <Box size={14} /> : <FileText size={14} />}
                                                    {ev.isVenueOnly ? 'Solo Alquiler' : 'Con Catering'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', color: getStatusColor(ev.status), background: `${getStatusColor(ev.status)}15`, border: `1px solid ${getStatusColor(ev.status)}30` }}>
                                            {eventStatuses.find(s => s.id === ev.status)?.label}
                                        </span>
                                        <button
                                            onClick={() => openEditForm(ev)}
                                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', maxWidth: '100vw', overflowX: 'hidden' }}>
            {renderSidebar()}

            <div style={{ flex: 1, padding: '2rem 3rem', maxWidth: '1600px', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800' }}>
                            {view === 'dashboard' && 'Panel de Control'}
                            {view === 'calendar' && 'Calendario de Ocupación'}
                            {view === 'list' && 'Listado de Eventos'}
                            {view === 'analytics' && 'Estadísticas e Informes'}
                            {view === 'finances' && 'Gestión Financiera'}
                            {view === 'customers' && 'Registro de Clientes'}
                            {view === 'inventory' && 'Gestión de Inventario'}
                        </h2>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)' }}>Visión general y gestión de celebraciones</p>
                    </div>
                    {view !== 'inventory' && (
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setEditingEventId(null);
                                setEventData({
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
                                setSelectedMenus([]);
                                setIsFormOpen(true);
                            }}
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 20px rgba(52, 211, 153, 0.4)',
                                border: '2px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <Plus size={24} /> <span style={{ marginLeft: '0.5rem', fontWeight: '800' }}>Nuevo Evento</span>
                        </button>
                    )}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: isFormOpen && view !== 'dashboard' && view !== 'customers' && view !== 'inventory' ? '1fr 1fr' : '1fr', gap: '2rem' }}>
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
                                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--color-text)', cursor: 'pointer', borderRadius: '50%', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                >
                                    <X size={20} />
                                </button>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                                    <CalendarIcon size={24} color="var(--color-primary)" /> {editingEventId ? 'Editar Evento' : 'Nuevo Evento'}
                                </h2>

                                {isMenuManagerOpen ? (
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-text)' }}>Gestionar Menús</h3>
                                            <button onClick={() => setIsMenuManagerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                                        </div>

                                        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                            <input
                                                placeholder="Nombre del Menú"
                                                className="input-field"
                                                value={menuForm.name}
                                                onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                                            />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                                                <input
                                                    type="number"
                                                    placeholder="Precio"
                                                    className="input-field"
                                                    value={menuForm.price}
                                                    onChange={e => setMenuForm({ ...menuForm, price: e.target.value })}
                                                />
                                                <input
                                                    placeholder="Platos (sep. por comas)"
                                                    className="input-field"
                                                    value={menuForm.items}
                                                    onChange={e => setMenuForm({ ...menuForm, items: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                onClick={handleSaveMenu}
                                                className="btn-primary"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >
                                                <Save size={18} /> <span>{editingMenu ? 'Actualizar Menú' : 'Guardar Nuevo Menú'}</span>
                                            </button>
                                            {editingMenu && (
                                                <button
                                                    onClick={() => { setEditingMenu(null); setMenuForm({ name: '', price: '', items: '' }); }}
                                                    className="btn-secondary"
                                                    style={{ width: '100%', justifyContent: 'center' }}
                                                >
                                                    Cancelar Edición
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {loading ? (
                                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>Cargando...</div>
                                            ) : (
                                                eventMenus.map(menu => (
                                                    <div key={menu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)', borderRadius: '6px' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-text)' }}>{menu.name}</div>
                                                            <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>{menu.price}€</div>
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
                                        <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Nombre del Evento</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Ej: Boda de María y Juan"
                                            style={{ padding: '1rem', fontSize: '1.1rem' }}
                                            value={eventData.name}
                                            onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Fecha</label>
                                            <input
                                                type="date"
                                                className="input-field"
                                                style={{ padding: '1rem', fontSize: '1.1rem' }}
                                                value={eventData.date}
                                                onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Comensales</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                style={{ padding: '1rem', fontSize: '1.1rem' }}
                                                value={eventData.guests}
                                                onChange={(e) => setEventData({ ...eventData, guests: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
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
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!eventData.isHourly}
                                                            onChange={() => setEventData({ ...eventData, isHourly: false })}
                                                            style={{ accentColor: 'var(--color-primary)' }}
                                                        />
                                                        Día Completo
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={eventData.isHourly}
                                                            onChange={() => setEventData({ ...eventData, isHourly: true })}
                                                            style={{ accentColor: 'var(--color-primary)' }}
                                                        />
                                                        Por Horas
                                                    </label>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: eventData.isHourly ? '1fr 1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <label style={{ color: 'var(--color-text-muted)' }}>{eventData.isHourly ? 'Precio por Hora' : 'Precio del Alquiler'}</label>
                                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                            <input
                                                                type="number"
                                                                className="glass-panel input-field"
                                                                style={{ padding: '0.75rem', fontSize: '1.1rem', flex: 1 }}
                                                                value={eventData.venuePrice}
                                                                onChange={(e) => setEventData({ ...eventData, venuePrice: parseFloat(e.target.value) || 0 })}
                                                            />
                                                            <span style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>€</span>
                                                        </div>
                                                    </div>

                                                    {eventData.isHourly && (
                                                        <>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <label style={{ color: 'var(--color-text-muted)' }}>Total Horas</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="glass-panel input-field"
                                                                    style={{ padding: '0.75rem', fontSize: '1.1rem' }}
                                                                    value={eventData.rentHours}
                                                                    onChange={(e) => setEventData({ ...eventData, rentHours: parseInt(e.target.value) || 1 })}
                                                                />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <label style={{ color: 'var(--color-text-muted)' }}>Subtotal Alquiler</label>
                                                                <div style={{ padding: '0.75rem', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
                                                                    {((parseFloat(eventData.venuePrice) || 0) * (parseInt(eventData.rentHours) || 1)).toFixed(2)}€
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <label style={{ color: 'var(--color-text-muted)' }}>Hora de Inicio</label>
                                                        <input
                                                            type="time"
                                                            className="glass-panel input-field"
                                                            style={{ padding: '0.75rem', fontSize: '1.1rem' }}
                                                            value={eventData.rentStartTime}
                                                            onChange={(e) => setEventData({ ...eventData, rentStartTime: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Notas del evento */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Notas del Evento (peticiones especiales, detalles, etc.)</label>
                                        <textarea
                                            className="input-field"
                                            rows="3"
                                            placeholder="Detalles adicionales sobre el evento..."
                                            style={{ padding: '1rem', fontSize: '1rem', resize: 'vertical' }}
                                            value={eventData.notes}
                                            onChange={(e) => setEventData({ ...eventData, notes: e.target.value })}
                                        />
                                    </div>

                                    <div className="surface-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                            <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-primary)' }}>
                                                <Users size={18} /> Datos Fiscales del Cliente
                                            </h3>
                                            <button
                                                onClick={() => setIsCustomerModalOpen(true)}
                                                className="btn-secondary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            >
                                                <User size={16} style={{ marginRight: '0.5rem' }} /> Asociar Cliente
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>NIF / CIF</label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="Ej: 12345678X"
                                                    style={{ padding: '1rem', fontSize: '1.1rem' }}
                                                    value={eventData.clientNif}
                                                    onChange={(e) => setEventData({ ...eventData, clientNif: e.target.value })}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Dirección de Facturación</label>
                                                <textarea
                                                    className="input-field"
                                                    placeholder="Calle, Número, CP, Ciudad..."
                                                    style={{ resize: 'vertical', minHeight: '80px', padding: '1rem', fontSize: '1.1rem' }}
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
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Tipo:</label>
                                                <select
                                                    value={eventData.taxRate}
                                                    onChange={(e) => setEventData({ ...eventData, taxRate: parseFloat(e.target.value) })}
                                                    style={{ background: 'var(--color-bg)', border: '1px solid var(--border-strong)', color: 'var(--color-text)', padding: '2px 8px', borderRadius: '4px' }}
                                                >
                                                    <option value={0.10} style={{ background: 'var(--color-bg)' }}>10% (Comida)</option>
                                                    <option value={0.21} style={{ background: 'var(--color-bg)' }}>21% (Alquiler)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '16px', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Wallet size={16} /> Fianza / Reserva (Cobro Adelantado)
                                        </label>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className="glass-panel input-field"
                                                style={{ padding: '1rem', fontSize: '1.1rem', flex: 1 }}
                                                placeholder="Ej: 200"
                                                value={eventData.depositAmount}
                                                onChange={(e) => setEventData({ ...eventData, depositAmount: parseFloat(e.target.value) || 0 })}
                                            />
                                            <span style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>€</span>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>Este importe se marcará como pendiente hasta que se cobre en la lista.</p>
                                    </div>
                                </div>

                                {!eventData.isVenueOnly && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-text)' }}>Menus Seleccionados</h3>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                {selectedMenus.reduce((acc, m) => acc + m.quantity, 0)} cubiertos totales
                                            </div>
                                        </div>

                                        {selectedMenus.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                                {selectedMenus.map(m => (
                                                    <div key={m.menuId} className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--border-strong)' }}>
                                                        <div>
                                                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{m.quantity}x</span> <span style={{ color: 'var(--color-text)' }}>{m.name}</span>
                                                            <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>{m.price}€ / pax</div>
                                                        </div>
                                                        <button onClick={() => handleRemoveSelectedMenu(m.menuId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--border-light)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                                Añade menús desde la lista de abajo
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-text)' }}>Añadir Menú</h3>
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
                                                style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--color-primary)' }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{menuPicking.name}</span>
                                                    <span style={{ color: 'var(--color-primary)' }}>{menuPicking.price}€</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        type="number"
                                                        value={currentMenuQuantity}
                                                        onChange={e => setCurrentMenuQuantity(parseInt(e.target.value) || 0)}
                                                        style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', background: 'var(--color-bg)', border: '1px solid var(--border-strong)', color: 'var(--color-text)', borderRadius: '6px' }}
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
                                                        style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--color-text)', cursor: 'pointer' }}
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
                                                        background: menuPicking?.id === menu.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface)',
                                                        border: menuPicking?.id === menu.id ? '1px solid var(--color-primary)' : '1px solid var(--border-strong)',
                                                        borderRadius: '12px',
                                                        color: 'var(--color-text)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{menu.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{menu.items?.join(', ')}</div>
                                                    </div>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.2rem' }}>{menu.price}€/pax</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Total {eventData.hasVat ? 'con IVA' : 'sin IVA'}</span>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-secondary)', textShadow: '0 0 20px rgba(52, 211, 153, 0.2)' }}>
                                        {calculateTotalWithTax(calculateBudget(), eventData.hasVat, eventData.taxRate).toFixed(2)}€
                                    </span>
                                </div>
                                <button className="btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', justifyContent: 'center' }} onClick={handleSaveEvent}>
                                    {editingEventId ? <Save size={22} /> : <Plus size={22} />} <span style={{ marginLeft: '0.5rem' }}>{editingEventId ? 'Guardar Cambios' : 'Guardar en Agenda'}</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Agenda View Section */}
                <div className="events-content" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {view === 'list' && (
                        <div className="glass-panel" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-text)' }}>Próximos Eventos</h2>
                            {agenda.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                                    <CalendarIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No hay eventos registrados.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {agenda.map(ev => (
                                        <div key={ev.id} className="glass-panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <h3 style={{ margin: 0, color: 'var(--color-text)' }}>{ev.name}</h3>
                                                        <button
                                                            onClick={() => openEditForm(ev)}
                                                            style={{
                                                                background: 'rgba(59, 130, 246, 0.1)',
                                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                                color: '#3b82f6',
                                                                borderRadius: '6px',
                                                                padding: '0.2rem 0.5rem',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            title="Editar evento"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarIcon size={14} /> {ev.date}</span>
                                                            {!ev.isVenueOnly && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={14} /> {ev.guests} pax</span>}
                                                            {ev.isVenueOnly && <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Solo Alquiler</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
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
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <select
                                                            value={ev.status}
                                                            onChange={(e) => updateEventStatus(ev.id, e.target.value)}
                                                            style={{
                                                                background: getStatusColor(ev.status),
                                                                border: 'none',
                                                                color: 'white',
                                                                padding: '0.5rem 1rem',
                                                                borderRadius: '10px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '700',
                                                                cursor: 'pointer',
                                                                appearance: 'none',
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                            }}
                                                        >
                                                            {eventStatuses.map(s => <option key={s.id} value={s.id} style={{ background: '#1e293b', color: 'white' }}>{s.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <strong style={{ color: 'var(--color-primary)', fontSize: '1.25rem', fontWeight: '800' }}>{ev.total}€</strong>
                                                    <button
                                                        onClick={() => handleGenerateInvoice(ev)}
                                                        className="btn-secondary"
                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                    >
                                                        <DollarSign size={16} /> <span>Factura</span>
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

                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    {ev.depositStatus === 'pending' && (
                                                        <button
                                                            onClick={() => handleDepositAction(ev, 'pay')}
                                                            className="btn-primary"
                                                            style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}
                                                        >
                                                            <Wallet size={16} /> <span>Cobrar Fianza</span>
                                                        </button>
                                                    )}
                                                    {ev.depositStatus === 'paid' && (
                                                        <button
                                                            onClick={() => handleDepositAction(ev, 'return')}
                                                            className="btn-secondary"
                                                            style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)', justifyContent: 'center' }}
                                                        >
                                                            <RotateCcw size={16} /> <span>Devolver Fianza</span>
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
                                                        className="btn-danger"
                                                        style={{ gridColumn: '1 / -1', marginTop: '1rem', width: '100%', justifyContent: 'center', padding: '0.6rem' }}
                                                    >
                                                        <Trash2 size={16} /> <span>Eliminar Evento</span>
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
                                    <h2 style={{ margin: 0, color: 'var(--color-text)' }}>Calendario de Ocupación</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)', padding: '0.35rem', borderRadius: '12px' }}>
                                        <button
                                            onClick={prevMonth}
                                            className="btn-icon-small"
                                            style={{ background: 'transparent', color: 'var(--color-text)' }}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <span style={{ fontWeight: '800', minWidth: '140px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                            {monthNames[currentCalendarDate.getMonth()].toUpperCase()} {currentCalendarDate.getFullYear()}
                                        </span>
                                        <button
                                            onClick={nextMonth}
                                            className="btn-icon-small"
                                            style={{ background: 'transparent', color: 'var(--color-text)' }}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                                        <div key={day} style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{day}</div>
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
                                                    background: 'var(--color-surface)',
                                                    borderRadius: '8px',
                                                    padding: '0.5rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    position: 'relative',
                                                    border: '1px solid var(--border-strong)',
                                                    transition: 'all 0.2s',
                                                    cursor: eventsThisDay.length > 0 ? 'pointer' : 'default',
                                                    transform: (previewDay?.day === day && previewDay?.month === month) ? 'scale(1.05)' : 'none',
                                                    boxShadow: (previewDay?.day === day && previewDay?.month === month) ? '0 0 15px rgba(var(--color-primary-rgb), 0.3)' : 'none',
                                                    zIndex: (previewDay?.day === day && previewDay?.month === month) ? 10 : 1
                                                }}
                                                className={eventsThisDay.length > 0 ? 'calendar-day-active' : ''}
                                            >
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: eventsThisDay.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{day}</span>
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
                                                                background: 'var(--color-surface)',
                                                                backdropFilter: 'blur(12px)',
                                                                border: '1px solid var(--border-strong)',
                                                                borderRadius: '12px',
                                                                padding: '1rem',
                                                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                                                                zIndex: 100
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--color-primary)' }}>{day} de {monthNames[month]}</span>
                                                                <button onClick={() => setPreviewDay(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                {previewDay.events.map(ev => (
                                                                    <div key={ev.id} style={{ padding: '0.5rem', background: 'var(--color-bg)', borderRadius: '6px', borderLeft: `3px solid ${getStatusColor(ev.status)} ` }}>
                                                                        <div style={{ fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '2px', color: 'var(--color-text)' }}>{ev.name}</div>
                                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
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
                                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--border-strong)', color: 'var(--color-text)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                                            <div style={{ width: '8px', height: '8px', background: s.color, borderRadius: '50%' }} />
                                            {s.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }

                    {view === 'dashboard' && <EventDashboard />}
                    {view === 'analytics' && <EventAnalytics />}
                    {view === 'finances' && (
                        <EventFinances
                            agenda={agenda}
                            updateEventExpenses={updateEventExpenses}
                            venueExpenses={venueExpenses}
                            addVenueExpense={addVenueExpense}
                            deleteVenueExpense={deleteVenueExpense}
                        />
                    )}
                    {view === 'customers' && (
                        <div className="glass-panel" style={{ padding: '2rem', flex: 1, minHeight: '600px' }}>
                            <EventCustomers />
                        </div>
                    )}
                    {view === 'inventory' && (
                        <div className="glass-panel" style={{ padding: '2rem', flex: 1, minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                            <EventInventory />
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Selection Modal */}
            <AnimatePresence>
                {isCustomerModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel"
                            style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}
                        >
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, color: 'var(--color-text)' }}>Seleccionar Cliente</h2>
                                <button onClick={() => setIsCustomerModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X /></button>
                            </div>
                            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                                <EventCustomers
                                    isSelectionMode={true}
                                    onSelectCustomer={(customer) => {
                                        setEventData(prev => ({
                                            ...prev,
                                            clientNif: customer.nif || '',
                                            clientAddress: customer.address || '',
                                            name: prev.name || `Evento de ${customer.name}` // Auto-fill event name if empty
                                        }));
                                        setIsCustomerModalOpen(false);
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManaluEventos;
