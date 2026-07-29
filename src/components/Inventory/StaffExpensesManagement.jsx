import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Save, Trash2, Filter, TrendingUp, TrendingDown, DollarSign, Calendar, Users, CheckCircle, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffExpensesManagement = () => {
    const { expenses, addExpense, deleteExpense } = useInventory();
    const { employees } = useAuth();

    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [expenseForm, setExpenseForm] = useState({
        concept: '',
        amount: '',
        subType: 'Nómina',
        employeeId: 'all',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Transferencia',
        status: 'Pagado',
        notes: ''
    });

    const subTypes = ['Nómina', 'Seguridad Social', 'Personal Extra', 'Otros Gastos Personal'];
    const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Domiciliado'];
    const statuses = ['Pagado', 'Pendiente'];

    // Filter state
    const [filterSubType, setFilterSubType] = useState('Todas');
    const [filterEmployee, setFilterEmployee] = useState('Todos');
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    // Helper to get employee name
    const getEmployeeName = (empId) => {
        if (empId === 'all') return 'Varios / Todo el personal';
        const emp = employees.find(e => e.id === empId);
        return emp ? emp.name : empId;
    };

    // Parse notes to get subtype and employee info
    const parseStaffExpense = (exp) => {
        let subType = 'Nómina';
        let employeeId = 'all';
        let customNotes = exp.notes || '';

        try {
            if (exp.notes && (exp.notes.startsWith('{') || exp.notes.startsWith('['))) {
                const parsed = JSON.parse(exp.notes);
                subType = parsed.subType || 'Nómina';
                employeeId = parsed.employeeId || 'all';
                customNotes = parsed.customNotes || '';
            } else if (exp.notes) {
                // Legacy or custom formats
                if (exp.notes.includes('Tipo:')) {
                    const matchType = exp.notes.match(/Tipo:\s*([^|]+)/);
                    const matchEmp = exp.notes.match(/Empleado:\s*(.+)/);
                    if (matchType) subType = matchType[1].trim();
                    if (matchEmp) employeeId = matchEmp[1].trim();
                } else {
                    subType = exp.notes;
                }
            }
        } catch (e) {
            console.warn('Error parsing notes JSON:', e);
        }

        return { subType, employeeId, customNotes };
    };

    // Filtered Staff Expenses
    const staffExpenses = useMemo(() => {
        return expenses
            .filter(exp => exp.category === 'Sueldos')
            .map(exp => {
                const details = parseStaffExpense(exp);
                return {
                    ...exp,
                    ...details
                };
            });
    }, [expenses]);

    // Analytics Calculation
    const analytics = useMemo(() => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        let totalCurrentMonth = 0;
        let totalPreviousMonth = 0;
        let pendingTotal = 0;
        const typeBreakdown = {
            'Nómina': 0,
            'Seguridad Social': 0,
            'Personal Extra': 0,
            'Otros Gastos Personal': 0
        };

        staffExpenses.forEach(exp => {
            const expDate = new Date(exp.date);
            const expMonth = expDate.getMonth() + 1;
            const expYear = expDate.getFullYear();
            const amount = parseFloat(exp.amount) || 0;

            // Totals
            if (expYear === currentYear && expMonth === currentMonth) {
                totalCurrentMonth += amount;
                typeBreakdown[exp.subType] = (typeBreakdown[exp.subType] || 0) + amount;
            } else if (expYear === currentYear && expMonth === currentMonth - 1) {
                totalPreviousMonth += amount;
            } else if (currentMonth === 1 && expYear === currentYear - 1 && expMonth === 12) {
                totalPreviousMonth += amount;
            }

            // Pending
            if (exp.status === 'Pendiente') {
                pendingTotal += amount;
            }
        });

        const sortedTypes = Object.entries(typeBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: totalCurrentMonth > 0 ? Math.round((amount / totalCurrentMonth) * 100) : 0
            }));

        const trend = totalPreviousMonth > 0
            ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100
            : 0;

        return {
            totalCurrentMonth,
            totalPreviousMonth,
            pendingTotal,
            sortedTypes,
            trend
        };
    }, [staffExpenses]);

    // Filtered list for display
    const displayedExpenses = useMemo(() => {
        return staffExpenses.filter(exp => {
            const expDate = new Date(exp.date);

            const matchSubType = filterSubType === 'Todas' || exp.subType === filterSubType;
            const matchEmployee = filterEmployee === 'Todos' || exp.employeeId === filterEmployee;
            const matchMonth = filterMonth === 'Todos' || (expDate.getMonth() + 1) === parseInt(filterMonth);
            const matchYear = filterYear === 'Todos' || expDate.getFullYear() === parseInt(filterYear);

            return matchSubType && matchEmployee && matchMonth && matchYear;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [staffExpenses, filterSubType, filterEmployee, filterMonth, filterYear]);

    const handleSave = () => {
        if (!expenseForm.concept || !expenseForm.amount) {
            alert("Por favor, completa el concepto y el importe.");
            return;
        }

        // We package the subType and employeeId inside the notes field as JSON
        const notesObj = {
            subType: expenseForm.subType,
            employeeId: expenseForm.employeeId,
            customNotes: expenseForm.notes
        };

        // Concept detail for easier listing elsewhere in general tables
        const employeeName = getEmployeeName(expenseForm.employeeId);
        const detailedConcept = `${expenseForm.concept} - ${employeeName}`;

        addExpense({
            concept: detailedConcept,
            amount: parseFloat(expenseForm.amount),
            category: 'Sueldos',
            date: expenseForm.date,
            paymentMethod: expenseForm.paymentMethod,
            status: expenseForm.status,
            notes: JSON.stringify(notesObj)
        });

        // Reset
        setExpenseForm({
            ...expenseForm,
            concept: '',
            amount: '',
            notes: ''
        });
        setIsAdding(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* --- DASHBOARD KPIs --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                        <Users size={28} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Gastos Personal (Mes Actual)</p>
                        <h2 style={{ margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {analytics.totalCurrentMonth.toFixed(2)}€
                            {analytics.trend !== 0 && (
                                <span style={{ fontSize: '0.85rem', color: analytics.trend > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center' }}>
                                    {analytics.trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {Math.abs(analytics.trend).toFixed(1)}%
                                </span>
                            )}
                        </h2>
                    </div>
                </div>

                <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
                        <Clock size={28} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Pendiente de Pago</p>
                        <h2 style={{ margin: '0.25rem 0 0 0', color: analytics.pendingTotal > 0 ? '#ef4444' : 'var(--color-text)' }}>
                            {analytics.pendingTotal.toFixed(2)}€
                        </h2>
                    </div>
                </div>

                <div className="surface-card" style={{ padding: '1.5rem' }}>
                    <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Desglose por Tipo (Este Mes)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {analytics.sortedTypes.map((type, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>{type.name}:</span>
                                <span style={{ fontWeight: 'bold' }}>{type.amount.toFixed(2)}€ ({type.percentage}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- CONTROLS & LIST --- */}
            <div className="surface-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={20} /> Gastos de Personal
                    </h2>
                    <button className="btn-primary" onClick={() => setIsAdding(true)}>
                        <DollarSign size={16} style={{ marginRight: '0.5rem' }} /> Añadir Nómina/Extra
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Mes</label>
                        <select className="surface-card" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)' }}>
                            <option value="Todos">Todos</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Año</label>
                        <select className="surface-card" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)' }}>
                            <option value="Todos">Todos</option>
                            {Array.from({ length: 5 }, (_, i) => {
                                const y = new Date().getFullYear() - 2 + i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>
                    </div>

                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Tipo</label>
                        <select className="surface-card" value={filterSubType} onChange={e => setFilterSubType(e.target.value)} style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)' }}>
                            <option value="Todas">Todas</option>
                            {subTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: '1 1 180px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Empleado</label>
                        <select className="surface-card" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)' }}>
                            <option value="Todos">Todos</option>
                            <option value="all">Varios / Todo el personal</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table List */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem 0.5rem' }}>Fecha</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Concepto</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Tipo</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Empleado</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Pago</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Estado</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Importe</th>
                                <th style={{ padding: '1rem 0.5rem', width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedExpenses.map((exp, idx) => (
                                <tr key={exp.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem 0.5rem' }}>{new Date(exp.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{exp.concept.split(' - ')[0]}</div>
                                        {exp.notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{exp.customNotes}</div>}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '20px',
                                            background: exp.subType === 'Nómina' ? 'rgba(59, 130, 246, 0.15)' :
                                                        exp.subType === 'Seguridad Social' ? 'rgba(139, 92, 246, 0.15)' :
                                                        exp.subType === 'Personal Extra' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                                            color: exp.subType === 'Nómina' ? '#3b82f6' :
                                                   exp.subType === 'Seguridad Social' ? '#8b5cf6' :
                                                   exp.subType === 'Personal Extra' ? '#eab308' : '#aaa'
                                        }}>{exp.subType}</span>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>{getEmployeeName(exp.employeeId)}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{exp.paymentMethod}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 'bold',
                                            background: exp.status === 'Pagado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: exp.status === 'Pagado' ? '#10b981' : '#ef4444'
                                        }}>{exp.status}</span>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: '900', fontSize: '1rem', color: 'var(--color-text)' }}>
                                        {parseFloat(exp.amount).toFixed(2)}€
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                        <button onClick={() => { if (confirm('¿Seguro que deseas eliminar este gasto de personal?')) deleteExpense(exp.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {displayedExpenses.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                        No hay gastos de personal que coincidan con los filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ADD GASTO OVERLAY FORM --- */}
            <AnimatePresence>
                {isAdding && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '450px', padding: '2rem', background: '#1a1a1a', border: '1px solid var(--color-primary)' }}
                        >
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <DollarSign size={20} color="#3b82f6" /> Nuevo Gasto de Personal
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Concepto / Mes</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Nómina Julio"
                                        className="surface-card"
                                        value={expenseForm.concept}
                                        onChange={e => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem', color: 'white', border: '1px solid var(--glass-border)' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Tipo de Gasto</label>
                                        <select
                                            className="surface-card"
                                            value={expenseForm.subType}
                                            onChange={e => setExpenseForm({ ...expenseForm, subType: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', color: 'white', border: '1px solid var(--glass-border)' }}
                                        >
                                            {subTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Empleado</label>
                                        <select
                                            className="surface-card"
                                            value={expenseForm.employeeId}
                                            onChange={e => setExpenseForm({ ...expenseForm, employeeId: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', color: 'white', border: '1px solid var(--glass-border)' }}
                                        >
                                            <option value="all">Varios / Todo el personal</option>
                                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Importe (€)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="surface-card"
                                            value={expenseForm.amount}
                                            onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', color: 'white', border: '1px solid var(--glass-border)' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Fecha</label>
                                        <input
                                            type="date"
                                            className="surface-card"
                                            value={expenseForm.date}
                                            onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', color: 'white', border: '1px solid var(--glass-border)' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Medio de Pago</label>
                                        <select
                                            className="surface-card"
                                            value={expenseForm.paymentMethod}
                                            onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', color: 'white', border: '1px solid var(--glass-border)' }}
                                        >
                                            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Estado</label>
                                        <select
                                            className="surface-card"
                                            value={expenseForm.status}
                                            onChange={e => setExpenseForm({ ...expenseForm, status: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', color: 'white', border: '1px solid var(--glass-border)' }}
                                        >
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Notas / Observaciones</label>
                                    <textarea
                                        placeholder="Detalles del pago, extras..."
                                        className="surface-card"
                                        value={expenseForm.notes}
                                        onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem', color: 'white', border: '1px solid var(--glass-border)', height: '60px', resize: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button onClick={handleSave} className="btn-primary" style={{ flex: 1, background: '#3b82f6', justifyContent: 'center' }}>
                                    <Save size={16} style={{ marginRight: '0.5rem' }} /> Guardar Gasto
                                </button>
                                <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffExpensesManagement;
