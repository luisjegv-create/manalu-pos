import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import {
    ArrowLeft,
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertTriangle,
    Box,
    Save,
    X,
    Camera,
    Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printRestockList } from '../utils/printHelpers';

const Inventory = () => {
    const navigate = useNavigate();
    const {
        ingredients, addIngredient, updateIngredient, deleteIngredient,
        suppliers, addSupplier, updateSupplier, deleteSupplier,
        invoices, addInvoice, deleteInvoice,
        expenses, addExpense, deleteExpense
    } = useInventory();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('alimentos');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Ingredient Form Data
    const [formData, setFormData] = useState({
        name: '',
        quantity: 0,
        critical: 5,
        unit: 'uds',
        cost: 0,
        provider: 'Sin asignar',
        category: 'alimentos'
    });

    // Supplier Mode State
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);
    const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
    const [isAddingInvoice, setIsAddingInvoice] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], image: null });

    // Expense State
    const [expenseForm, setExpenseForm] = useState({ concept: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Alquiler' });
    const expenseCategories = ['Alquiler', 'Luz/Agua', 'Sueldos', 'Impuestos', 'Marketing', 'Otros'];


    const categories = [
        { id: 'alimentos', label: 'Alimentos', icon: '🥬' },
        { id: 'bebidas', label: 'Bebidas', icon: '🥂' },
        { id: 'menaje', label: 'Menaje', icon: '🍽️' },
        { id: 'limpieza', label: 'Limpieza', icon: '🧹' },
        { id: 'distribuidores', label: 'Distribuidores', icon: '🚚' },
        { id: 'gastos', label: 'Gastos', icon: '💸' }
    ];

    const filteredIngredients = ingredients.filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = (ing.category || 'alimentos') === activeTab;
        return matchesSearch && matchesCategory;
    });

    const handleEdit = (ing) => {
        setEditingId(ing.id);
        setFormData({
            name: ing.name,
            quantity: ing.quantity,
            critical: ing.critical || 5,
            unit: ing.unit || 'uds',
            cost: ing.cost || 0,
            provider: ing.provider || 'Sin asignar',
            category: ing.category || 'alimentos'
        });
    };

    const handleSave = () => {
        if (editingId) {
            updateIngredient(editingId, formData);
            setEditingId(null);
        } else {
            addIngredient(formData);
            setIsAdding(false);
        }
        setFormData({ name: '', quantity: 0, critical: 5, unit: 'uds', cost: 0, provider: 'Sin asignar', category: activeTab });
    };

    // --- Supplier Handlers ---
    const handleSaveSupplier = () => {
        if (!supplierForm.name) return alert("Nombre requerido");

        if (selectedSupplierId === 'new') {
            addSupplier(supplierForm);
            setSelectedSupplierId(null); // Return to list
        } else {
            updateSupplier(selectedSupplierId, supplierForm);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setInvoiceForm(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveInvoice = () => {
        if (!invoiceForm.amount) return alert("Importe requerido");
        addInvoice({
            supplierId: selectedSupplierId,
            amount: parseFloat(invoiceForm.amount),
            date: invoiceForm.date,
            image: invoiceForm.image
        });
        setIsAddingInvoice(false);
        setInvoiceForm({ amount: '', date: new Date().toISOString().split('T')[0], image: null });
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                    >
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>Almacén (Matriz)</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Control central de stock e ingredientes</p>
                    </div>
                    <button
                        onClick={() => {
                            const lowStockItems = ingredients.filter(i => i.quantity <= (i.critical || 5));
                            if (lowStockItems.length === 0) {
                                alert('Todo el stock está correcto. No hace falta reposición.');
                                return;
                            }
                            printRestockList(lowStockItems);
                        }}
                        style={{
                            marginLeft: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <Printer size={16} /> Informe Reposición
                    </button>
                </div>

                {activeTab !== 'distribuidores' && activeTab !== 'gastos' && (
                    <button
                        className="btn-primary"
                        onClick={() => { setIsAdding(true); setEditingId(null); setFormData(prev => ({ ...prev, category: activeTab })); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={18} /> Nuevo Ingrediente
                    </button>
                )}
            </header>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setActiveTab(cat.id);
                            setSelectedSupplierId(null);
                        }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === cat.id ? 'var(--color-primary)' : '#f1f5f9',
                            border: '1px solid',
                            borderColor: activeTab === cat.id ? 'var(--color-primary)' : 'var(--border-light)',
                            borderRadius: '12px',
                            color: activeTab === cat.id ? 'white' : '#475569',
                            cursor: 'pointer',
                            fontWeight: activeTab === cat.id ? 'bold' : '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === cat.id ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <span>{cat.icon}</span> {cat.label}
                    </button>
                ))}
            </div>

            {/* SUPPLIER MANAGEMENT MODE */}
            {activeTab === 'distribuidores' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', minHeight: '600px' }}>

                    {/* Left: Supplier List */}
                    <div className="surface-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <button
                            className="btn-primary"
                            style={{ marginBottom: '1rem', width: '100%', justifyContent: 'center' }}
                            onClick={() => {
                                setSelectedSupplierId('new');
                                setSupplierForm({ name: '', phone: '', email: '', address: '', notes: '' });
                            }}
                        >
                            <Plus size={16} /> Nuevo Distribuidor
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                            {suppliers.map(sup => (
                                <div
                                    key={sup.id}
                                    onClick={() => {
                                        setSelectedSupplierId(sup.id);
                                        setSupplierForm(sup);
                                    }}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: selectedSupplierId === sup.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: selectedSupplierId === sup.id ? '1px solid var(--color-primary)' : '1px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold' }}>{sup.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{sup.phone}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Details & Invoices */}
                    <div className="surface-card" style={{ padding: '2rem' }}>
                        {selectedSupplierId ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h2 style={{ margin: 0 }}>{selectedSupplierId === 'new' ? 'Nuevo Distribuidor' : 'Editar Distribuidor'}</h2>
                                    {selectedSupplierId !== 'new' && (
                                        <button
                                            onClick={() => { deleteSupplier(selectedSupplierId); setSelectedSupplierId(null); }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 />
                                        </button>
                                    )}
                                </div>

                                {/* Supplier Form */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div>
                                        <label>Nombre Empresa</label>
                                        <input
                                            value={supplierForm.name}
                                            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                            className="surface-card"
                                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text)' }}
                                        />
                                    </div>
                                    <div>
                                        <label>Teléfono</label>
                                        <input
                                            value={supplierForm.phone}
                                            onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                            className="surface-card"
                                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text)' }}
                                        />
                                    </div>
                                    <div>
                                        <label>Email</label>
                                        <input
                                            value={supplierForm.email}
                                            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                            className="surface-card"
                                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text)' }}
                                        />
                                    </div>
                                    <div>
                                        <label>Dirección</label>
                                        <input
                                            value={supplierForm.address}
                                            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                            className="surface-card"
                                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text)' }}
                                        />
                                    </div>
                                </div>

                                <button className="btn-primary" onClick={handleSaveSupplier} style={{ marginBottom: '3rem' }}>
                                    <Save size={16} style={{ marginRight: '0.5rem' }} /> Guardar Datos
                                </button>

                                {/* Invoice Section (Only if not new) */}
                                {selectedSupplierId !== 'new' && (
                                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0 }}>Facturas Guardadas</h3>
                                            <button
                                                className="surface-card"
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem' }}
                                                onClick={() => setIsAddingInvoice(true)}
                                            >
                                                <Camera size={16} /> Subir Factura
                                            </button>
                                        </div>

                                        {/* Invoice List */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                            {invoices.filter(i => i.supplierId === selectedSupplierId).map(inv => (
                                                <div key={inv.id} className="surface-card" style={{ padding: '0.5rem', position: 'relative' }}>
                                                    <div style={{ height: '100px', background: '#000', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                                        {inv.image ? (
                                                            <img src={inv.image} alt="Factura" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>No img</div>
                                                        )}
                                                    </div>
                                                    <div style={{ fontWeight: 'bold' }}>{inv.amount.toFixed(2)}€</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'gray' }}>{inv.date}</div>
                                                    <button
                                                        onClick={() => deleteInvoice(inv.id)}
                                                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'var(--color-text)', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Invoice Modal */}
                                        <AnimatePresence>
                                            {isAddingInvoice && (
                                                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                                        className="surface-card"
                                                        style={{ padding: '2rem', width: '90%', maxWidth: '400px', border: '1px solid var(--color-primary)' }}
                                                    >
                                                        <h3 style={{ marginTop: 0 }}>Nueva Factura</h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                            <div>
                                                                <label>Importe Total (€)</label>
                                                                <input
                                                                    type="number" step="0.01"
                                                                    value={invoiceForm.amount}
                                                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                                                                    className="surface-card" style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)', marginTop: '0.5rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label>Fecha</label>
                                                                <input
                                                                    type="date"
                                                                    value={invoiceForm.date}
                                                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                                                                    className="surface-card" style={{ width: '100%', padding: '0.5rem', color: 'var(--color-text)', marginTop: '0.5rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label>Foto de Factura</label>
                                                                <div style={{ marginTop: '0.5rem', border: '2px dashed #666', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        capture="environment"
                                                                        onChange={handleImageUpload}
                                                                        style={{ display: 'none' }}
                                                                        id="invoice-upload"
                                                                    />
                                                                    <label htmlFor="invoice-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <Camera size={32} />
                                                                        <span>Tocar para hacer foto</span>
                                                                    </label>
                                                                    {invoiceForm.image && (
                                                                        <div style={{ marginTop: '1rem' }}>
                                                                            <img src={invoiceForm.image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px' }} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                                                <button onClick={() => setIsAddingInvoice(false)} style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer' }}>Cancelar</button>
                                                                <button onClick={handleSaveInvoice} className="btn-primary">Guardar</button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', opacity: 0.5 }}>
                                <Box size={64} />
                                <p>Selecciona un distribuidor o crea uno nuevo</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Content Control Bar */}
                    <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                            <input
                                type="text"
                                placeholder={`Buscar en ${categories.find(c => c.id === activeTab)?.label || '...'}`}
                                className="surface-card"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    border: '1px solid var(--border-strong)',
                                    color: 'var(--color-text)',
                                    boxSizing: 'border-box'
                                }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Modal / Inline Add/Edit Form */}
                    <AnimatePresence>
                        {(isAdding || editingId) && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="surface-card"
                                style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--color-primary)' }}
                            >
                                <h3 style={{ marginTop: 0 }}>{editingId ? 'Editar Ingrediente' : 'Añadir Nuevo Ingrediente'}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Nombre</label>
                                        <input
                                            type="text"
                                            className="surface-card"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Categoría</label>
                                        <select
                                            className="surface-card"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'var(--color-text)', background: 'white' }}
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categories.filter(c => c.id !== 'distribuidores').map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Cantidad Actual</label>
                                        <input
                                            type="number"
                                            className="surface-card"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Unidad (kg, L, uds...)</label>
                                        <input
                                            type="text"
                                            className="surface-card"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Stock Crítico</label>
                                        <input
                                            type="number"
                                            className="surface-card"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
                                            value={formData.critical}
                                            onChange={(e) => setFormData({ ...formData, critical: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Coste por Unidad (€)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="surface-card"
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
                                            value={formData.cost}
                                            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Proveedor / Origen</label>
                                        <input
                                            type="text"
                                            className="surface-card"
                                            placeholder="Ej. Makro, Pescadería García..."
                                            style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
                                            value={formData.provider}
                                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => { setIsAdding(false); setEditingId(null); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button className="btn-primary" onClick={handleSave}>
                                        <Save size={18} style={{ marginRight: '0.5rem' }} /> {editingId ? 'Actualizar' : 'Guardar Ingrediente'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Inventory List */}
                    <div className="surface-card" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <tr>
                                    <th style={{ padding: '1.5rem' }}>Ingrediente</th>
                                    <th style={{ padding: '1.5rem' }}>Categoría</th>
                                    <th style={{ padding: '1.5rem' }}>Stock Actual</th>
                                    <th style={{ padding: '1.5rem' }}>Estado</th>
                                    <th style={{ padding: '1.5rem' }}>Coste Unit.</th>
                                    <th style={{ padding: '1.5rem' }}>Proveedor</th>
                                    <th style={{ padding: '1.5rem' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIngredients.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                            No hay ingredientes en esta categoría.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIngredients.map(ing => {
                                        const isLow = ing.quantity <= (ing.critical || 5);
                                        return (
                                            <tr key={ing.id} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{ing.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ID: {ing.id}</div>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{ fontSize: '0.9rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                                        {categories.find(c => c.id === (ing.category || 'alimentos'))?.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{ing.quantity}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>{ing.unit || 'uds'}</span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    {isLow ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                            <AlertTriangle size={16} /> STOCK BAJO
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>OK</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    {ing.cost ? `${ing.cost.toFixed(2)}€` : '0.00€'}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                                    {ing.provider || 'Sin asignar'}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => handleEdit(ing)}
                                                            className="btn-icon-small"
                                                            style={{ color: '#3b82f6' }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteIngredient(ing.id)}
                                                            className="btn-icon-small text-danger"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* --- GASTOS GENERALES TAB --- */}
            {activeTab === 'gastos' && (
                <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
                    {/* Add Expense Form */}
                    <div className="surface-card" style={{ padding: '2rem', alignSelf: 'start' }}>
                        <h3 style={{ marginTop: 0 }}>Registrar Gasto</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Concepto</label>
                                <input
                                    value={expenseForm.concept}
                                    onChange={e => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                                    placeholder="Ej. Alquiler Local Enero"
                                />
                            </div>
                            <div className="form-group">
                                <label>Importe (€)</label>
                                <input
                                    type="number"
                                    value={expenseForm.amount}
                                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group">
                                <label>Categoría</label>
                                <select
                                    className="surface-card"
                                    style={{ width: '100%', padding: '0.5rem', background: 'transparent', color: 'var(--color-text)' }}
                                    value={expenseForm.category}
                                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                >
                                    {expenseCategories.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    value={expenseForm.date}
                                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                />
                            </div>
                            <button
                                className="btn-primary"
                                style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                                onClick={() => {
                                    if (!expenseForm.concept || !expenseForm.amount) return alert("Completa los campos");
                                    addExpense({ ...expenseForm, amount: parseFloat(expenseForm.amount) });
                                    setExpenseForm({ concept: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Alquiler' });
                                }}
                            >
                                <Save size={18} /> Guardar Gasto
                            </button>
                        </div>
                    </div>

                    {/* Expense List */}
                    <div className="surface-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginTop: 0 }}>Historial de Gastos</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(exp => (
                                <div key={exp.id} style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{exp.concept}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {exp.date} • <span style={{ color: 'var(--color-primary)' }}>{exp.category}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#ef4444' }}>-{exp.amount.toFixed(2)}€</div>
                                        <button
                                            onClick={() => deleteExpense(exp.id)}
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {expenses.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                    No hay gastos registrados.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
