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
    RotateCcw
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useEvents } from '../context/EventContext';
import { printA4Invoice, printDepositTicket } from '../utils/printHelpers';
import { useInventory } from '../context/InventoryContext';

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
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
                    <DollarSign size={28} color="var(--color-primary)" />
                    Finanzas de Eventos
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px', display: 'flex', gap: '0.5rem' }}>
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
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '10px' }}>
                        <button
                            onClick={() => { setActiveTab('eventos'); setIsAdding(false); }}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: activeTab === 'eventos' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'eventos' ? 'white' : 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'eventos' ? 'bold' : 'normal' }}
                        >Gastos de Eventos</button>
                        <button
                            onClick={() => { setActiveTab('local'); setIsAdding(false); }}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: activeTab === 'local' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'local' ? 'white' : 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'local' ? 'bold' : 'normal' }}
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
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                {activeTab === 'eventos' && <th style={{ padding: '1rem' }}>Evento</th>}
                                <th style={{ padding: '1rem' }}>Concepto</th>
                                <th style={{ padding: '1rem' }}>Categoría</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Importe</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
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
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                        <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>{exp.date || exp.eventDate}</td>
                                        {activeTab === 'eventos' && <td style={{ padding: '1rem', fontWeight: 'bold' }}>{exp.eventName}</td>}
                                        <td style={{ padding: '1rem' }}>{exp.concept}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
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

    const [view, setView] = useState('calendar'); // 'calendar' | 'list' | 'analytics' | 'finances'
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
        }, []);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Ingresos Totales (Eventos)</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-secondary)' }}>{stats.totalRevenue.toFixed(2)}€</div>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                            Basado en {agenda.length} registros
                        </div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Pax Medio (Cubiertos)</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'white' }}>{stats.avgPax}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.6rem' }}>Promedio por evento con menú</div>
                    </div>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Eventos Confirmados</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#3b82f6' }}>{stats.confirmedEvents}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.6rem' }}>De un total de {agenda.length}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div className="surface-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <PieChart size={20} color="var(--color-primary)" /> Mix de Negocio
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <span>Eventos con Menú</span>
                                    <span style={{ color: 'var(--color-primary)' }}>{stats.menuEvents}</span>
                                </div>
                                <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(stats.menuEvents / (agenda.length || 1)) * 100}% `, height: '100%', background: 'var(--color-primary)', borderRadius: '20px', boxShadow: '0 0 10px rgba(16, 224, 212, 0.3)' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <span>Solo Alquiler Local</span>
                                    <span style={{ color: '#ec4899' }}>{stats.rentalEvents}</span>
                                </div>
                                <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(stats.rentalEvents / (agenda.length || 1)) * 100}% `, height: '100%', background: '#ec4899', borderRadius: '20px', boxShadow: '0 0 10px rgba(236, 72, 153, 0.3)' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="surface-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <TrendingIcon size={20} color="#10b981" /> Estado Financiero
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Confirmado (Pendiente Cobro)</span>
                                <span style={{ fontWeight: '700' }}>{stats.revenueByStatus.confirmed.toFixed(2)}€</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>Cobrado / Pagado</span>
                                <span style={{ fontWeight: '800', color: '#10b981' }}>{stats.revenueByStatus.paid.toFixed(2)}€</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
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

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-icon-circle"
                        title="Volver"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* Eventos Logo */}
                    <div style={{ position: 'relative' }}>
                        <img
                            src="/logo-eventos.jpg"
                            alt="Manalu Eventos"
                            style={{
                                height: '56px',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                border: '2px solid rgba(236, 72, 153, 0.5)',
                                display: 'block',
                                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)'
                            }}
                        />
                    </div>

                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '1.75rem',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em'
                        }}>
                            Manalú Eventos
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                            Gestión Premium de Celebraciones
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <div className="glass-panel" style={{ display: 'flex', padding: '0.35rem', gap: '0.25rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)' }}>
                        <button
                            onClick={() => setView('calendar')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem', borderRadius: '10px',
                                background: view === 'calendar' ? 'var(--color-primary)' : 'transparent',
                                color: view === 'calendar' ? 'black' : 'white',
                                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                                fontWeight: view === 'calendar' ? '700' : '500',
                                fontSize: '0.9rem'
                            }}
                        >
                            <CalendarIcon size={18} /> Calendario
                        </button>
                        <button
                            onClick={() => setView('list')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem', borderRadius: '10px',
                                background: view === 'list' ? 'var(--color-primary)' : 'transparent',
                                color: view === 'list' ? 'black' : 'white',
                                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                                fontWeight: view === 'list' ? '700' : '500',
                                fontSize: '0.9rem'
                            }}
                        >
                            <List size={18} /> Lista
                        </button>
                        <button
                            onClick={() => setView('analytics')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem', borderRadius: '10px',
                                background: view === 'analytics' ? 'var(--color-primary)' : 'transparent',
                                color: view === 'analytics' ? 'black' : 'white',
                                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                                fontWeight: view === 'analytics' ? '700' : '500',
                                fontSize: '0.9rem'
                            }}
                        >
                            <BarChart2 size={18} /> Estadísticas
                        </button>
                        <button
                            onClick={() => setView('finances')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem', borderRadius: '10px',
                                background: view === 'finances' ? 'var(--color-primary)' : 'transparent',
                                color: view === 'finances' ? 'black' : 'white',
                                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                                fontWeight: view === 'finances' ? '700' : '500',
                                fontSize: '0.9rem'
                            }}
                        >
                            <DollarSign size={18} /> Finanzas
                        </button>
                    </div>

                    <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
                        <Plus size={20} /> <span style={{ marginLeft: '0.5rem' }}>Nuevo Presupuesto</span>
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
                                    <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Nombre del Evento</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ej: Boda de María y Juan"
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
                                            value={eventData.date}
                                            onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Comensales</label>
                                        <input
                                            type="number"
                                            className="input-field"
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

                                <div className="surface-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-primary)' }}>
                                        <Users size={18} /> Datos Fiscales del Cliente
                                    </h3>
                                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>NIF / CIF</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Ej: 12345678X"
                                                value={eventData.clientNif}
                                                onChange={(e) => setEventData({ ...eventData, clientNif: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Dirección de Facturación</label>
                                            <textarea
                                                className="input-field"
                                                placeholder="Calle, Número, CP, Ciudad..."
                                                style={{ resize: 'vertical', minHeight: '80px' }}
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

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Total {eventData.hasVat ? 'con IVA' : 'sin IVA'}</span>
                                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-secondary)', textShadow: '0 0 20px rgba(52, 211, 153, 0.2)' }}>
                                    {calculateTotalWithTax(calculateBudget(), eventData.hasVat, eventData.taxRate).toFixed(2)}€
                                </span>
                            </div>
                            <button className="btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', justifyContent: 'center' }} onClick={handleSaveEvent}>
                                <Plus size={22} /> <span style={{ marginLeft: '0.5rem' }}>Guardar en Agenda</span>
                            </button>
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
                                <h2 style={{ margin: 0 }}>Calendario de Ocupación</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem', borderRadius: '12px' }}>
                                    <button
                                        onClick={prevMonth}
                                        className="btn-icon-small"
                                        style={{ background: 'transparent' }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span style={{ fontWeight: '800', minWidth: '140px', textAlign: 'center', fontSize: '0.9rem', color: 'white' }}>
                                        {monthNames[currentCalendarDate.getMonth()].toUpperCase()} {currentCalendarDate.getFullYear()}
                                    </span>
                                    <button
                                        onClick={nextMonth}
                                        className="btn-icon-small"
                                        style={{ background: 'transparent' }}
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
                {view === 'finances' && (
                    <EventFinances
                        agenda={agenda}
                        updateEventExpenses={updateEventExpenses}
                        venueExpenses={venueExpenses}
                        addVenueExpense={addVenueExpense}
                        deleteVenueExpense={deleteVenueExpense}
                    />
                )}
            </div >
        </div >
    );
};

export default ManaluEventos;
