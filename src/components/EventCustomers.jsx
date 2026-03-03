import React, { useState } from 'react';
import { useCustomers } from '../context/CustomerContext';
import { Users, Search, Plus, User, Phone, Mail, FileText, MapPin, Save, X, Trash2, Edit3, ChevronRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EventCustomers = ({ isSelectionMode = false, onSelectCustomer }) => {
    const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', nif: '', address: '', notes: ''
    });

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.nif?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePrepareAdd = () => {
        setFormData({ name: '', phone: '', email: '', nif: '', address: '', notes: '' });
        setSelectedCustomer(null);
        setIsAdding(true);
        setIsEditing(false);
    };

    const handleEdit = (customer) => {
        setFormData({
            name: customer.name, phone: customer.phone, email: customer.email || '',
            nif: customer.nif || '', address: customer.address || '', notes: customer.notes || ''
        });
        setIsEditing(true);
        setIsAdding(false);
    };

    const handleSave = () => {
        if (!formData.name) return alert('El nombre es obligatorio');
        if (isEditing && selectedCustomer) {
            updateCustomer(selectedCustomer.id, formData);
            if (!isSelectionMode) setSelectedCustomer({ ...selectedCustomer, ...formData });
        } else {
            addCustomer(formData);
        }
        setIsEditing(false);
        setIsAdding(false);
    };

    return (
        <div style={{ display: 'flex', height: isSelectionMode ? '60vh' : '100%', gap: '2rem', flexDirection: isSelectionMode ? 'column' : 'row' }}>
            {/* Left/Top: List */}
            <div className="glass-panel" style={{ width: isSelectionMode ? '100%' : '350px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    {!isSelectionMode && (
                        <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-on-dark)', fontSize: '1.4rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <Users size={22} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            Registro de Clientes
                        </h2>
                    )}
                    <button onClick={handlePrepareAdd} className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'center', fontWeight: 'bold' }}>
                        <Plus size={18} /> Nuevo Cliente
                    </button>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem 0.85rem 2.8rem',
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                color: 'white',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--color-primary)';
                                e.target.style.background = 'rgba(0, 0, 0, 0.4)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.background = 'rgba(0, 0, 0, 0.25)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredCustomers.map(customer => {
                        const isSelected = selectedCustomer?.id === customer.id;
                        return (
                            <div
                                key={customer.id}
                                onClick={() => {
                                    setSelectedCustomer(customer);
                                    setIsEditing(false);
                                    setIsAdding(false);
                                    if (isSelectionMode && onSelectCustomer) {
                                        onSelectCustomer(customer);
                                    }
                                }}
                                style={{
                                    padding: '1.2rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.03)',
                                    color: 'white',
                                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)'}`,
                                    borderRadius: '12px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                    }
                                }}
                            >
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                                        {customer.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Phone size={14} /> {customer.phone || 'Sin teléfono'}
                                    </div>
                                </div>
                                {isSelectionMode ? (
                                    <CheckCircle size={20} style={{ opacity: isSelected ? 1 : 0.2, color: 'white' }} />
                                ) : (
                                    <ChevronRight size={18} style={{ opacity: isSelected ? 1 : 0.4, color: 'white', transform: isSelected ? 'translateX(2px)' : 'none', transition: 'transform 0.2s' }} />
                                )}
                            </div>
                        );
                    })}
                    {filteredCustomers.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                        >
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '1rem', display: 'inline-flex' }}>
                                <Search size={32} style={{ opacity: 0.6 }} />
                            </div>
                            <span style={{ fontSize: '1.1rem' }}>No se encontraron clientes</span>
                            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Prueba con otro término de búsqueda</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Right/Bottom: Details or Form */}
            {!isSelectionMode && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    <AnimatePresence mode='wait'>
                        {(isEditing || isAdding) ? (
                            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h2>{isAdding ? 'Nuevo Cliente' : `Editar: ${formData.name}`}</h2>
                                    <button onClick={() => { setIsEditing(false); setIsAdding(false); }} className="btn-icon"><X /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group"><label><User size={16} /> Nombre Completo *</label><input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                    <div className="form-group"><label><Phone size={16} /> Teléfono</label><input className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                                    <div className="form-group"><label><Mail size={16} /> Email</label><input className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                    <div className="form-group"><label><FileText size={16} /> NIF / CIF</label><input className="input-field" value={formData.nif} onChange={e => setFormData({ ...formData, nif: e.target.value })} /></div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}><label><MapPin size={16} /> Dirección</label><input className="input-field" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notas Internas</label><textarea rows="3" className="input-field" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ resize: 'vertical' }} /></div>
                                </div>
                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button className="btn-secondary" onClick={() => { setIsEditing(false); setIsAdding(false); }}>Cancelar</button>
                                    <button className="btn-primary" onClick={handleSave} style={{ background: '#10b981' }}><Save size={18} /> Guardar Ficha</button>
                                </div>
                            </motion.div>
                        ) : selectedCustomer ? (
                            <motion.div key="details" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                                            {selectedCustomer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>{selectedCustomer.name}</h1>
                                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> {selectedCustomer.phone || '---'}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> {selectedCustomer.email || '---'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(selectedCustomer)} className="btn-icon" title="Editar"><Edit3 size={18} /></button>
                                        <button onClick={() => { if (window.confirm('¿Borrar?')) { deleteCustomer(selectedCustomer.id); setSelectedCustomer(null); } }} className="btn-icon" style={{ color: '#ef4444' }} title="Eliminar"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    <div className="surface-card" style={{ padding: '1.5rem', background: 'var(--color-surface)' }}>
                                        <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-strong)', paddingBottom: '0.5rem', color: 'var(--color-text)' }}>Datos Fiscales & Dirección</h3>
                                        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                            <div><label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>NIF / CIF</label><div style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>{selectedCustomer.nif || 'No registrado'}</div></div>
                                            <div><label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Dirección</label><div style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>{selectedCustomer.address || 'No registrada'}</div></div>
                                            {selectedCustomer.notes && (
                                                <div style={{ background: 'rgba(234, 179, 8, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(234, 179, 8, 0.4)' }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold' }}>Notas:</label>
                                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#92400e' }}>{selectedCustomer.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', opacity: 0.8 }}>
                                <Users size={64} style={{ marginBottom: '1rem' }} />
                                <h2>Selecciona un cliente para ver o editar sus datos</h2>
                            </div>

                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default EventCustomers;
