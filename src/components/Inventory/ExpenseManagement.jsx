import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Save, Trash2, Filter, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExpenseManagement = () => {
    const { expenses, addExpense, deleteExpense } = useInventory();

    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [expenseForm, setExpenseForm] = useState({
        concept: '',
        amount: '',
        category: 'Alquiler',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Transferencia',
        status: 'Pagado',
        notes: ''
    });

    const expenseCategories = ['Alquiler', 'Suministros (Luz/Agua)', 'Sueldos', 'Impuestos', 'Marketing', 'Compras/Mercadería', 'Transporte', 'Otros'];
    const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Domiciliado'];
    const statuses = ['Pagado', 'Pendiente'];

    // Filter state
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    // Analytics Calculation
    const analytics = useMemo(() => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        let totalCurrentMonth = 0;
        let totalPreviousMonth = 0;
        let pendingTotal = 0;
        const categoryData = {};

        expenses.forEach(exp => {
            const expDate = new Date(exp.date);
            const expMonth = expDate.getMonth() + 1;
            const expYear = expDate.getFullYear();
            const amount = parseFloat(exp.amount) || 0;

            // Totals
            if (expYear === currentYear && expMonth === currentMonth) {
                totalCurrentMonth += amount;
                // Category breakdown for current month
                categoryData[exp.category] = (categoryData[exp.category] || 0) + amount;
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

        // Sort categories by highest amount
        const sortedCategories = Object.entries(categoryData)
            .sort(([, a], [, b]) => b - a)
            .map(([name, amount]) => ({ name, amount, percentage: totalCurrentMonth > 0 ? Math.round((amount / totalCurrentMonth) * 100) : 0 }));

        const trend = totalPreviousMonth > 0
            ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100
            : 0;

        return {
            totalCurrentMonth,
            totalPreviousMonth,
            pendingTotal,
            sortedCategories,
            trend
        };
    }, [expenses]);


    // Filtered Expenses for List
    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);

            const matchCategory = filterCategory === 'Todas' || exp.category === filterCategory;
            const matchStatus = filterStatus === 'Todos' || exp.status === filterStatus;

            // Allow filtering by 'Todos' for month/year or specific
            const matchMonth = filterMonth === 'Todos' || (expDate.getMonth() + 1) === parseInt(filterMonth);
            const matchYear = filterYear === 'Todos' || expDate.getFullYear() === parseInt(filterYear);

            return matchCategory && matchStatus && matchMonth && matchYear;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, filterCategory, filterStatus, filterMonth, filterYear]);


    const handleSave = () => {
        if (!expenseForm.concept || !expenseForm.amount) {
            alert("Por favor, completa el concepto y el importe.");
            return;
        }

        addExpense({
            ...expenseForm,
            amount: parseFloat(expenseForm.amount),
            // Map to db column names to keep addExpense simple if needed, 
            // but we'll adapt Context to handle camelCase or snake_case cleanly.
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
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Gastos Mes Actual</p>
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
                    <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Principales Categorías (Esté Mes)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {analytics.sortedCategories.slice(0, 2).map((cat, idx) => (
                            <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    <span>{cat.name}</span>
                                    <span>{cat.amount.toFixed(2)}€ ({cat.percentage}%)</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${cat.percentage}%`, background: 'var(--color-primary)' }} />
                                </div>
                            </div>
                        ))}
                        {analytics.sortedCategories.length === 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>No hay gastos registrados este mes.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CONTROLS & LIST --- */}
            <div className="surface-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={20} /> Historial de Gastos
                    </h2>
                    <button className="btn-primary" onClick={() => setIsAdding(true)}>
                        <DollarSign size={16} style={{ marginRight: '0.5rem' }} /> Añadir Gasto
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
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Año</label>
                        <select className="surface-card" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)' }}>
                            <option value="Todos">Todos</option>
                            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                        </select>
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Categoría</label>
                        <select className="surface-card" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)' }}>
                            <option value="Todas">Todas las categorías</option>
                            {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Estado</label>
                        <select className="surface-card" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)' }}>
                            <option value="Todos">Todos</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Concepto</th>
                                <th style={{ padding: '1rem' }}>Categoría</th>
                                <th style={{ padding: '1rem' }}>Método / Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Importe</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                        No se encontraron gastos con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map(exp => (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(exp.date).toLocaleDateString('es-ES')}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{exp.concept}</div>
                                            {exp.notes && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{exp.notes}</div>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <CreditCard size={12} /> {exp.payment_method || exp.paymentMethod || 'N/A'}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.15rem 0.4rem',
                                                    borderRadius: '4px',
                                                    display: 'inline-flex',
                                                    width: 'fit-content',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    background: (exp.status === 'Pendiente') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: (exp.status === 'Pendiente') ? '#f87171' : '#34d399'
                                                }}>
                                                    {(exp.status === 'Pendiente') ? <Clock size={10} /> : <CheckCircle size={10} />}
                                                    {exp.status || 'Pagado'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#ef4444', fontSize: '1.1rem' }}>
                                            -{parseFloat(exp.amount).toFixed(2)}€
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => deleteExpense(exp.id)}
                                                className="btn-icon-small"
                                                style={{ color: '#ef4444', opacity: 0.7 }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ADD EXPENSE MODAL --- */}
            <AnimatePresence>
                {isAdding && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="surface-card"
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                padding: '2rem',
                                border: '1px solid var(--glass-border)',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-text)' }}>Registrar Nuevo Gasto</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                {/* Basic Info */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Concepto *</label>
                                    <input
                                        type="text"
                                        value={expenseForm.concept}
                                        onChange={e => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                                        className="surface-card"
                                        style={{ width: '100%', padding: '0.75rem', color: 'var(--color-text)', border: '1px solid var(--border-light)' }}
                                        placeholder="Ej. Factura Luz Enero, Compra Mercadona..."
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Importe (€) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={expenseForm.amount}
                                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        className="surface-card"
                                        style={{ width: '100%', padding: '0.75rem', color: 'var(--color-text)', border: '1px solid var(--border-light)', fontSize: '1.1rem', fontWeight: 'bold' }}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Fecha de Emisión *</label>
                                    <input
                                        type="date"
                                        value={expenseForm.date}
                                        onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                        className="surface-card"
                                        style={{ width: '100%', padding: '0.75rem', color: 'var(--color-text)', border: '1px solid var(--border-light)' }}
                                    />
                                </div>

                                {/* Categorization */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Categoría *</label>
                                    <select
                                        value={expenseForm.category}
                                        onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                        className="surface-card"
                                        style={{ width: '100%', padding: '0.75rem', color: 'var(--color-text)', border: '1px solid var(--border-light)' }}
                                    >
                                        {expenseCategories.map(c => <option key={c} value={c} style={{ background: 'var(--bg-card)', color: 'var(--color-text)' }}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Método de Pago</label>
                                    <select
                                        value={expenseForm.paymentMethod}
                                        onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                                        className="surface-card"
                                        style={{ width: '100%', padding: '0.75rem', color: 'var(--color-text)', border: '1px solid var(--border-light)' }}
                                    >
                                        {paymentMethods.map(p => <option key={p} value={p} style={{ background: 'var(--bg-card)', color: 'var(--color-text)' }}>{p}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Estado del Pago</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {statuses.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setExpenseForm({ ...expenseForm, status: s })}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    border: expenseForm.status === s ? `1px solid ${s === 'Pagado' ? '#10b981' : '#ef4444'}` : '1px solid var(--border-light)',
                                                    background: expenseForm.status === s ? (s === 'Pagado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'rgba(255,255,255,0.02)',
                                                    color: expenseForm.status === s ? (s === 'Pagado' ? '#10b981' : '#ef4444') : 'var(--color-text-muted)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontWeight: expenseForm.status === s ? 'bold' : 'normal'
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Notas (Opcional)</label>
                                    <textarea
                                        value={expenseForm.notes}
                                        onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                        className="surface-card"
                                        style={{ width: '100%', padding: '0.75rem', color: 'var(--color-text)', border: '1px solid var(--border-light)', minHeight: '80px', resize: 'vertical' }}
                                        placeholder="Referencia de factura, proveedor, etc."
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--color-text)', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn-primary"
                                    style={{ padding: '0.75rem 1.5rem' }}
                                >
                                    <Save size={18} style={{ marginRight: '0.5rem' }} /> Guardar Gasto
                                </button>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExpenseManagement;
