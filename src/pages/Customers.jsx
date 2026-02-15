import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../context/CustomerContext';
import { useOrder } from '../context/OrderContext';
import {
    Users, Search, Plus, User, Phone, Mail, MapPin,
    FileText, Trash2, Edit3, ArrowLeft, Star, Clock,
    ChevronRight, Save, X, CreditCard, Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Customers = () => {
    const navigate = useNavigate();
    const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
    const { tables, selectTable, selectCustomer, updateTableStatus } = useOrder();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showTableSelector, setShowTableSelector] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        nif: '',
        address: '',
        notes: ''
    });

    // Filter Logic
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    // Handlers
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setIsEditing(false);
        setIsAdding(false);
        setShowTableSelector(false);
    };

    const handleEdit = (customer) => {
        setFormData({
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            nif: customer.nif || '',
            address: customer.address || '',
            notes: customer.notes || ''
        });
        setIsEditing(true);
        setIsAdding(false);
    };

    const handlePrepareAdd = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            nif: '',
            address: '',
            notes: ''
        });
        setSelectedCustomer(null);
        setIsAdding(true);
        setIsEditing(false);
    };

    const handleSave = () => {
        if (!formData.name) return alert('El nombre es obligatorio');

        if (isEditing && selectedCustomer) {
            updateCustomer(selectedCustomer.id, formData);
            setIsEditing(false);
        } else {
            addCustomer(formData);
            setIsAdding(false);
        }
    };

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar este cliente? Se perderá su historial.')) {
            deleteCustomer(id);
            setSelectedCustomer(null);
        }
    };

    const handleAssignTable = (table) => {
        if (!selectedCustomer) return;

        // 1. Select the table
        selectTable(table);
        // 2. Select the customer in global context
        selectCustomer(selectedCustomer);
        // 3. Mark table as occupied (prevent glitches)
        if (table.status === 'free') {
            updateTableStatus(table.id, 'occupied');
        }
        // 4. Navigate to POS
        navigate('/bar-tapas');
    };

    return (
        <div style={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
            {/* --- LEFT SIDEBAR (List) --- */}
            <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--glass-border)', borderRadius: 0 }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <button onClick={() => navigate('/')} className="btn-icon"><ArrowLeft size={20} /></button>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users /> Clientes</h2>
                    </div>

                    <button
                        onClick={handlePrepareAdd}
                        className="btn-primary"
                        style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
                    >
                        <Plus size={18} /> Nuevo Cliente
                    </button>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)',
                                borderRadius: '8px', color: 'white'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {filteredCustomers.map(customer => (
                        <div
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            style={{
                                padding: '1rem', marginBottom: '0.5rem', borderRadius: '8px', cursor: 'pointer',
                                background: selectedCustomer?.id === customer.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                border: '1px solid transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{customer.name}</div>
                                <div style={{ fontSize: '0.85rem', color: selectedCustomer?.id === customer.id ? 'white' : '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Phone size={12} /> {customer.phone || 'Sin teléfono'}
                                </div>
                            </div>
                            <ChevronRight size={16} style={{ opacity: 0.5 }} />
                        </div>
                    ))}
                    {filteredCustomers.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                            No se encontraron clientes
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT CONTENT (Details/Edit) --- */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)' }}>
                <AnimatePresence mode='wait'>
                    {(isEditing || isAdding) ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-panel"
                            style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2>{isAdding ? 'Nuevo Cliente' : `Editar: ${formData.name}`}</h2>
                                <button onClick={() => { setIsEditing(false); setIsAdding(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label><User size={16} /> Nombre Completo *</label>
                                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label><Phone size={16} /> Teléfono</label>
                                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label><Mail size={16} /> Email</label>
                                    <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label><FileText size={16} /> NIF / CIF</label>
                                    <input value={formData.nif} onChange={e => setFormData({ ...formData, nif: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label><MapPin size={16} /> Dirección</label>
                                    <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Notas Internas</label>
                                    <textarea
                                        rows="3"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #4b5563', color: 'white', borderRadius: '6px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn-secondary" onClick={() => { setIsEditing(false); setIsAdding(false); }}>Cancelar</button>
                                <button className="btn-primary" onClick={handleSave} style={{ background: '#10b981' }}>
                                    <Save size={18} /> Guardar Ficha
                                </button>
                            </div>
                        </motion.div>
                    ) : selectedCustomer ? (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}
                        >
                            {/* Header Card */}
                            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(0,0,0,0))' }}>
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                                        {selectedCustomer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h1 style={{ margin: '0 0 0.5rem 0' }}>{selectedCustomer.name}</h1>
                                        <div style={{ display: 'flex', gap: '1rem', color: '#9ca3af', fontSize: '0.95rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> {selectedCustomer.phone || '---'}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> {selectedCustomer.email || '---'}</span>
                                        </div>
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <span className="badge" style={{ background: '#f59e0b', color: 'black' }}><Star size={12} fill="black" /> {selectedCustomer.points} Puntos</span>
                                            <span className="badge" style={{ background: '#10b981', color: 'black' }}>Total: {selectedCustomer.totalSpend?.toFixed(2)}€</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setShowTableSelector(true)} className="btn-primary" style={{ background: '#3b82f6' }}>
                                        <Utensils size={18} /> ASIGNAR MESA
                                    </button>
                                    <button onClick={() => handleEdit(selectedCustomer)} className="btn-icon" title="Editar"><Edit3 size={18} /></button>
                                    <button onClick={() => handleDelete(selectedCustomer.id)} className="btn-icon" style={{ color: '#ef4444' }} title="Eliminar"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem' }}>
                                {/* Info Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Datos Fiscales & Dirección</h3>
                                        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>NIF / CIF</label>
                                                <div style={{ fontSize: '1.1rem' }}>{selectedCustomer.nif || 'No registrado'}</div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Dirección</label>
                                                <div style={{ fontSize: '1.1rem' }}>{selectedCustomer.address || 'No registrada'}</div>
                                            </div>
                                            {selectedCustomer.notes && (
                                                <div style={{ background: 'rgba(255,255,0,0.1)', padding: '0.75rem', borderRadius: '6px', border: '1px dashed #eab308' }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#eab308', fontWeight: 'bold' }}>Notas:</label>
                                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontStyle: 'italic' }}>{selectedCustomer.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Favoritos</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                            {selectedCustomer.favorites && selectedCustomer.favorites.length > 0 ? (
                                                selectedCustomer.favorites.map((fav, i) => (
                                                    <span key={i} style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.9rem' }}>
                                                        ❤️ {fav}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Sin favoritos aún</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* History Column */}
                                <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={18} /> Historial de Visitas
                                    </h3>

                                    <div style={{ flex: 1, overflowY: 'auto', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {selectedCustomer.history && selectedCustomer.history.length > 0 ? (
                                            selectedCustomer.history.map(record => (
                                                <div key={record.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontWeight: 'bold' }}>{new Date(record.date).toLocaleDateString()}</span>
                                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>{record.amount?.toFixed(2)}€</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                                                        {record.items?.map(i => i.name).join(', ')}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                                Sin historial de compras
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', opacity: 0.5 }}>
                            <Users size={64} style={{ marginBottom: '1rem' }} />
                            <h2>Selecciona un cliente para ver su ficha</h2>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- ASSIGN TABLE MODAL --- */}
            {showTableSelector && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0 }}>Asignar Mesa a {selectedCustomer?.name}</h2>
                            <button onClick={() => setShowTableSelector(false)} className="btn-icon"><X /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
                            {tables.map(table => {
                                const isOccupied = table.status !== 'free';
                                return (
                                    <button
                                        key={table.id}
                                        disabled={isOccupied}
                                        onClick={() => handleAssignTable(table)}
                                        className="glass-panel"
                                        style={{
                                            padding: '1.5rem',
                                            cursor: isOccupied ? 'not-allowed' : 'pointer',
                                            opacity: isOccupied ? 0.5 : 1,
                                            border: '1px solid var(--glass-border)',
                                            background: isOccupied ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        <div style={{ fontSize: '1.5rem' }}>{table.zone === 'salon' ? '🍽️' : '🛋️'}</div>
                                        <h3 style={{ margin: 0 }}>{table.name}</h3>
                                        <span style={{ fontSize: '0.8rem', color: isOccupied ? '#ef4444' : '#10b981' }}>
                                            {isOccupied ? 'Ocupada' : 'Libre'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
