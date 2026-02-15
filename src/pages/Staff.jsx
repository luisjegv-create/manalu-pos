import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Clock, Shield, Trash2, LogIn, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Staff = () => {
    const navigate = useNavigate();
    const { employees, shifts, addEmployee, deleteEmployee, clockIn, clockOut } = useAuth();

    // UI States
    const [pinInput, setPinInput] = useState('');
    const [message, setMessage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmp, setNewEmp] = useState({ name: '', pin: '', role: 'staff' });

    // Handlers
    const handleClockIn = () => {
        const res = clockIn(pinInput);
        setMessage({ text: res.message, type: res.success ? 'success' : 'error' });
        if (res.success) setPinInput('');
        setTimeout(() => setMessage(null), 3000);
    };

    const handleClockOut = () => {
        const res = clockOut(pinInput);
        setMessage({ text: res.message, type: res.success ? 'success' : 'error' });
        if (res.success) setPinInput('');
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newEmp.name || !newEmp.pin) return;
        addEmployee(newEmp);
        setShowAddModal(false);
        setNewEmp({ name: '', pin: '', role: 'staff' });
    };



    // Group shifts by current open status for display
    const activeShifts = shifts.filter(s => !s.endTime);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}><ArrowLeft /></button>
                    <div>
                        <h1 style={{ margin: 0 }}>Control de Personal</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Fichaje y Gestión de Empleados</p>
                    </div>
                </div>
                {/* Only Admin can add employees */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                    style={{ background: '#3b82f6' }}
                >
                    <UserPlus size={18} /> Nuevo Empleado
                </button>
            </header>

            {/* --- Fichaje Interface --- */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>⏱️ Fichar Entrada / Salida</h2>

                <div style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                    <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="Introduce tu PIN"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        style={{
                            width: '100%', padding: '1rem', fontSize: '1.5rem', textAlign: 'center',
                            borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', letterSpacing: '8px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button onClick={handleClockIn} className="btn-primary" style={{ background: '#10b981', fontSize: '1.1rem', padding: '1rem 2rem' }}>
                        <LogIn /> ENTRADA
                    </button>
                    <button onClick={handleClockOut} className="btn-primary" style={{ background: '#ef4444', fontSize: '1.1rem', padding: '1rem 2rem' }}>
                        <LogOut /> SALIDA
                    </button>
                </div>

                {message && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: message.type === 'success' ? '#10b981' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold'
                    }}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* --- Employee List --- */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={20} /> Plantilla</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {employees.map(emp => {
                            const isWorking = activeShifts.some(s => s.employeeId === emp.id);
                            return (
                                <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isWorking ? '#10b981' : '#6b7280' }} title={isWorking ? 'Trabajando' : 'Ausente'} />
                                        <span style={{ fontWeight: 'bold' }}>{emp.name}</span>
                                        <span style={{ fontSize: '0.8rem', padding: '0.1rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                            {emp.role === 'admin' ? 'Encargado' : 'Camarero'}
                                        </span>
                                    </div>
                                    <button onClick={() => deleteEmployee(emp.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- Recent Logs --- */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={20} /> Historial Reciente</h3>
                    <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                        {shifts.slice(0, 10).map((shift, i) => (
                            <div key={i} style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <div>
                                    <strong>{shift.employeeName}</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(shift.startTime).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#10b981' }}>In: {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    {shift.endTime ?
                                        <div style={{ color: '#ef4444' }}>Out: {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div> :
                                        <span style={{ color: '#eab308', fontWeight: 'bold' }}>En turno</span>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Danger Zone --- */}
                <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} /> Zona de Peligro
                    </h3>
                    <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Estas acciones son irreversibles. Úsalas solo si sabes lo que haces.</p>

                    <button
                        onClick={() => {
                            if (confirm('⚠️ ¿ESTÁS SEGURO? \n\nEsto borrará TODOS los datos de la aplicación (productos, clientes, ventas, inventario) y la dejará como nueva.\n\nEsta acción NO se puede deshacer.')) {
                                if (confirm('¿Realmente seguro? ¡Perderás todo!')) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Trash2 size={20} /> BORRAR TODOS LOS DATOS (RESET)
                    </button>
                </div>
            </div>

            {/* --- Add Employee Modal --- */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '300px', padding: '2rem', background: '#1a1a1a' }}>
                        <h3 style={{ marginTop: 0 }}>Nuevo Empleado</h3>
                        <form onSubmit={handleAdd}>
                            <input
                                placeholder="Nombre"
                                value={newEmp.name}
                                onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                                style={{ display: 'block', width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #333', background: '#333', color: 'white' }}
                            />
                            <input
                                placeholder="PIN (4 dígitos)"
                                value={newEmp.pin}
                                onChange={e => setNewEmp({ ...newEmp, pin: e.target.value })}
                                style={{ display: 'block', width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #333', background: '#333', color: 'white' }}
                            />
                            <select
                                value={newEmp.role}
                                onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                                style={{ display: 'block', width: '100%', padding: '0.5rem', marginBottom: '1.5rem', borderRadius: '6px', border: '1px solid #333', background: '#333', color: 'white' }}
                            >
                                <option value="staff">Camarero</option>
                                <option value="admin">Encargado</option>
                            </select>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, background: '#3b82f6' }}>Guardar</button>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.5rem', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer' }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
