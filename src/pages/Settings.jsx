import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Printer, Building, Info, Server, Camera, Trash2, Database, AlertTriangle, Users, UserPlus, X } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { compressImage, compressImageFromUrl } from '../utils/imageHelpers';
import { uploadImage } from '../utils/storageUtils';

const Settings = () => {
    const navigate = useNavigate();
    const { restaurantInfo, updateRestaurantInfo } = useInventory();
    const { employees, addEmployee, deleteEmployee, currentUser } = useAuth();
    const [saved, setSaved] = useState(false);
    const [storageUsage, setStorageUsage] = useState(0);
    const [optProgress, setOptProgress] = useState({ active: false, current: 0, total: 0, status: '' });

    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', pin: '', role: 'staff' });

    const handleAddEmployee = () => {
        if (newEmployee.name && newEmployee.pin) {
            addEmployee(newEmployee);
            setNewEmployee({ name: '', pin: '', role: 'staff' });
            setShowAddEmployee(false);
        }
    };

    // Temp state for form to avoid saving on every keystroke if preferred, 
    // but here we can just use the context data directly for simplicity if it's small.
    // Let's use local state for the form and save to context on handleSave.
    const [formData, setFormData] = useState({
        ...restaurantInfo,
        geminiApiKey: localStorage.getItem('manalu_gemini_api_key') || ''
    });

    useEffect(() => {
        setFormData({
            ...restaurantInfo,
            geminiApiKey: localStorage.getItem('manalu_gemini_api_key') || ''
        });
    }, [restaurantInfo]);

    const [customQR, setCustomQR] = useState(() => {
        return localStorage.getItem('manalu_custom_qr') || null;
    });

    const calculateStorage = () => {
        let total = 0;
        for (let x in localStorage) {
            if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
                total += (localStorage[x].length * 2);
            }
        }
        const usagePercent = (total / 5242880) * 100;
        setStorageUsage(usagePercent);
    };

    useEffect(() => {
        calculateStorage();
    }, []);

    const handleSave = () => {
        // Save API Key locally
        if (formData.geminiApiKey) {
            localStorage.setItem('manalu_gemini_api_key', formData.geminiApiKey);
        } else {
            localStorage.removeItem('manalu_gemini_api_key');
        }

        // Remove it from the object sent to updateRestaurantInfo to avoid sending to Supabase if it's not a column
        const dataToSave = { ...formData };
        delete dataToSave.geminiApiKey;

        updateRestaurantInfo(dataToSave);
        setSaved(true);
        calculateStorage();
        setTimeout(() => setSaved(false), 3000);
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Settings images (logo, QR) should be small and clear
                const compressedBase64 = await compressImage(file, 500, 0.7);
                if (field === 'logo') {
                    setFormData(prev => ({ ...prev, logo: compressedBase64 }));
                } else if (field === 'qr') {
                    setCustomQR(compressedBase64);
                    localStorage.setItem('manalu_custom_qr', compressedBase64);
                }
                calculateStorage();
            } catch (err) {
                console.error("Error compressing image:", err);
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result;
                    if (field === 'logo') {
                        setFormData(prev => ({ ...prev, logo: result }));
                    } else if (field === 'qr') {
                        setCustomQR(result);
                        localStorage.setItem('manalu_custom_qr', result);
                    }
                    calculateStorage();
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const removeCustomQR = () => {
        setCustomQR(null);
        localStorage.removeItem('manalu_custom_qr');
        calculateStorage();
    };

    const handleResetData = () => {
        const userInput = prompt("⚠️ PELIGRO: Vas a borrar todos los datos de la aplicación. Escribe 'BORRAR' en mayúsculas para confirmar:");
        if (userInput === 'BORRAR') {
            localStorage.clear();
            alert("Datos borrados. La aplicación se reiniciará.");
            window.location.href = '/';
        } else if (userInput !== null) {
            alert("Operación cancelada. Palabra de seguridad incorrecta.");
        }
    };

    const handleRecoverFromKDS = async () => {
        if (!confirm("⚠️ ¿Intentar reconstruir las mesas abiertas en el TPV usando los pedidos que están pendientes en Cocina? (Las bebidas no se recuperarán).")) return;
        
        try {
            const { data, error } = await supabase.from('kitchen_orders')
                .select('*')
                .or('status.eq.pending,status.eq.ready')
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            if (!data || data.length === 0) {
                alert("No hay pedidos activos en cocina para recuperar.");
                return;
            }

            const currentTables = JSON.parse(localStorage.getItem('manalu_tables') || '[]');
            const currentBills = JSON.parse(localStorage.getItem('manalu_table_bills') || '{}');
            
            let recoveredCount = 0;

            data.forEach(order => {
                const tableName = order.table_name;
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                
                // Buscar si la mesa ya existe o crearla
                let tableId = tableName.replace(/[^0-9]/g, '');
                if (!tableId) tableId = `rec-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                tableId = parseInt(tableId) || tableId;

                let tableObj = currentTables.find(t => t.name === tableName);
                if (!tableObj) {
                    tableObj = {
                        id: tableId,
                        name: tableName,
                        status: 'occupied',
                        lastActionAt: order.created_at
                    };
                    currentTables.push(tableObj);
                }

                // Asegurar que exista el array de la cuenta
                if (!currentBills[tableObj.id]) currentBills[tableObj.id] = [];
                
                // Añadir items evitando duplicados exactos si ya los hay
                items.forEach(item => {
                    const exists = currentBills[tableObj.id].find(b => 
                        b.id === item.id && b.uniqueId === item.uniqueId
                    );
                    if (!exists) {
                        currentBills[tableObj.id].push({...item});
                        recoveredCount++;
                    }
                });
            });

            localStorage.setItem('manalu_tables', JSON.stringify(currentTables));
            localStorage.setItem('manalu_table_bills', JSON.stringify(currentBills));
            
            alert(`✅ Recuperación exitosa. Se han volcado ${recoveredCount} platos a las cuentas de las mesas. La app se recargará.`);
            window.location.reload();

        } catch (e) {
            console.error("Recovery error:", e);
            alert("Hubo un error al recuperar: " + e.message);
        }
    };

    const optimizeExistingImages = async () => {
        if (!confirm("⚠️ Esta acción comprimirá TODAS las fotos de productos y vinos para ahorrar espacio. ¿Deseas continuar?")) return;

        setOptProgress({ active: true, current: 0, total: 0, status: 'Iniciando mantenimiento...' });

        try {
            // 1. Fetch all with images
            const { data: prods } = await supabase.from('products').select('id, name, image').not('image', 'is', null);
            const { data: wines } = await supabase.from('wines').select('id, name, image').not('image', 'is', null);
            
            const prodList = (prods || []).filter(p => !p.image.startsWith('http') || p.image.includes('supabase.co'));
            const wineList = (wines || []).filter(w => !w.image.startsWith('http') || w.image.includes('supabase.co'));
            
            const total = prodList.length + wineList.length + 1; // +1 for logo
            setOptProgress(prev => ({ ...prev, total, status: 'Analizando catálogo...' }));

            let count = 0;

            // Process Products
            for (const p of prodList) {
                try {
                    setOptProgress(prev => ({ ...prev, status: `Comprimiendo: ${p.name}` }));
                    const compressedBase64 = await compressImageFromUrl(p.image, 500, 0.6);
                    
                    // Conversion to blob for storage
                    const res = await fetch(compressedBase64);
                    const blob = await res.blob();
                    
                    const storageUrl = await uploadImage(blob, 'product-images', 'optimized');
                    await supabase.from('products').update({ image: storageUrl }).eq('id', p.id);
                    
                    count++;
                    setOptProgress(prev => ({ ...prev, current: count }));
                } catch (e) {
                    console.error(`Error optimizando ${p.name}:`, e);
                }
            }

            // Process Wines
            for (const w of wineList) {
                try {
                    setOptProgress(prev => ({ ...prev, status: `Comprimiendo: ${w.name}` }));
                    const compressedBase64 = await compressImageFromUrl(w.image, 400, 0.6);
                    
                    const res = await fetch(compressedBase64);
                    const blob = await res.blob();
                    
                    const storageUrl = await uploadImage(blob, 'product-images', 'wines-optimized');
                    await supabase.from('wines').update({ image: storageUrl }).eq('id', w.id);
                    
                    count++;
                    setOptProgress(prev => ({ ...prev, current: count }));
                } catch (e) {
                    console.error(`Error optimizando vino ${w.name}:`, e);
                }
            }

            // Process Restaurant Logo if it's base64
            if (formData.logo && formData.logo.startsWith('data:image')) {
                try {
                    setOptProgress(prev => ({ ...prev, status: `Comprimiendo: Logo Principal` }));
                    const compressedBase64 = await compressImageFromUrl(formData.logo, 500, 0.7);
                    
                    const res = await fetch(compressedBase64);
                    const blob = await res.blob();
                    
                    const storageUrl = await uploadImage(blob, 'product-images', 'branding');
                    await updateRestaurantInfo({ ...restaurantInfo, logo: storageUrl });
                    
                    count++;
                    setOptProgress(prev => ({ ...prev, current: count }));
                } catch (e) {
                    console.error(`Error optimizando logo:`, e);
                }
            }

            setOptProgress(prev => ({ ...prev, status: 'Finalizado' }));
            alert("✅ Optimización completada. La base de datos está ahora mucho más ligera.");
            window.location.reload();
        } catch (error) {
            console.error("Optimization failed:", error);
            alert("Error durante la optimización.");
            setOptProgress({ active: false, current: 0, total: 0, status: '' });
        }
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: 'var(--color-primary)', color: 'white',
                        border: 'none', padding: '0.8rem 1.2rem', borderRadius: '12px',
                        cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                    }}
                >
                    <ArrowLeft size={24} /> Volver
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem' }}>Configuración</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Ajustes generales del sistema</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1.5rem' : '2rem' }}>

                {/* --- Left Column: Info --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2rem' }}>

                    {/* Restaurant Info */}
                    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            <Building size={20} /> Datos del Establecimiento
                        </h3>

                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{
                                width: '80px', height: '80px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px', border: '1px dashed var(--glass-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0
                            }}>
                                {formData.logo ? (
                                    <img src={formData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : <Camera size={24} color="var(--color-text-muted)" />}
                            </div>
                            <label className="btn-secondary" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                                Cambiar Logo
                                <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                            </label>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Nombre Comercial</label>
                                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Dirección</label>
                                <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>NIF / CIF</label>
                                    <input value={formData.nif} onChange={e => setFormData({ ...formData, nif: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>URL Asistente de Negocio (Google Gem)</label>
                                <input
                                    type="text"
                                    placeholder="https://gemini.google.com/gem/..."
                                    value={formData.gemUrl || ''}
                                    onChange={e => setFormData({ ...formData, gemUrl: e.target.value })}
                                />
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                    Enlace a tu Gem personalizado para el equipo (Dashboard).
                                </p>
                            </div>
                            <div className="form-group">
                                <label>API Key del Asistente (Carta Digital)</label>
                                <input
                                    type="password"
                                    placeholder="AIzaSy..."
                                    value={formData.geminiApiKey || ''}
                                    onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                                />
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                    Introduce tu API Key de Gemini para activar el asistente virtual para clientes.
                                </p>
                            </div>
                            <button className="btn-primary" onClick={handleSave} style={{ marginTop: '1rem', justifyContent: 'center', background: saved ? '#10b981' : 'var(--color-primary)' }}>
                                {saved ? '¡Guardado!' : <><Save size={18} /> Guardar Cambios</>}
                            </button>
                        </div>
                    </div>

                    {/* Printers */}
                    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            <Printer size={20} /> Impresoras
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>Impresora Tickets (Barra)</div>
                                    <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Conectada</div>
                                </div>
                                <button className="btn-icon" style={{ padding: '4px' }}><Info size={14} /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Right Column: System & Tools --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2rem' }}>

                    {/* Ticket Numbering */}
                    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            <Database size={20} /> Numeración de Tickets
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Configura el número correlativo para los próximos tickets.
                        </p>
                        <div className="form-group">
                            <label>Próximo Número de Ticket</label>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    value={formData.last_ticket_number}
                                    onChange={e => setFormData({ ...formData, last_ticket_number: parseInt(e.target.value) || 0 })}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    onClick={() => {
                                        if (confirm('¿Reiniciar numeración a 1?')) {
                                            setFormData({ ...formData, last_ticket_number: 0 });
                                        }
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                >
                                    Reiniciar
                                </button>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                                💡 El siguiente ticket generado será: {(formData.last_ticket_number || 0) + 1}
                            </p>
                        </div>
                    </div>

                    {/* Storage & System */}
                    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            <Database size={20} /> Almacenamiento Local
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Espacio ocupado por fotos y datos en este navegador.
                        </p>

                        <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: `${storageUsage}%`,
                                height: '100%',
                                background: storageUsage > 80 ? '#ef4444' : storageUsage > 50 ? '#f59e0b' : '#3b82f6',
                                transition: 'width 0.5s'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <span>{storageUsage.toFixed(1)}% ocupado</span>
                            <span>Límite (aprox. 5MB)</span>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Database size={16} /> Mantenimiento de Datos
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    onClick={optimizeExistingImages}
                                    disabled={optProgress.active}
                                    style={{
                                        width: '100%', padding: '0.75rem',
                                        background: optProgress.active ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)', 
                                        color: optProgress.active ? 'gray' : '#10b981',
                                        border: '1px solid ' + (optProgress.active ? 'gray' : '#10b981'), 
                                        borderRadius: '8px',
                                        cursor: optProgress.active ? 'default' : 'pointer', 
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span>{optProgress.active ? 'Optimización en curso...' : '🖼️ Optimizar Imágenes Existentes'}</span>
                                    {optProgress.active && (
                                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${(optProgress.current / optProgress.total) * 100}%`, 
                                                height: '100%', 
                                                background: '#10b981',
                                                transition: 'width 0.3s'
                                            }} />
                                        </div>
                                    )}
                                    {optProgress.active && <span style={{ fontSize: '0.7rem' }}>{optProgress.status} ({optProgress.current}/{optProgress.total})</span>}
                                </button>
                                
                                <button
                                    onClick={handleRecoverFromKDS}
                                    style={{
                                        width: '100%', padding: '0.75rem',
                                        background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                        border: '1px solid #3b82f6', borderRadius: '8px',
                                        cursor: 'pointer', fontSize: '0.85rem'
                                    }}
                                >
                                    🚑 Recuperar Mesas desde Cocina
                                </button>
                                <button
                                    onClick={handleResetData}
                                    style={{
                                        width: '100%', padding: '0.75rem',
                                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                        border: '1px solid #ef4444', borderRadius: '8px',
                                        cursor: 'pointer', fontSize: '0.85rem'
                                    }}
                                >
                                    Borrar Todos los Datos de la App
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* QR Config */}
                    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            <Info size={20} /> Menú Digital (QR)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
                                <img
                                    src={customQR || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/menu')}`}
                                    alt="QR"
                                    style={{ width: '120px', height: '120px', display: 'block' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <label className="btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
                                    Subir Propio QR
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'qr')} />
                                </label>
                                {customQR && <button onClick={removeCustomQR} className="btn-icon" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>}
                            </div>
                        </div>
                    </div>

                    {/* Employee PIN Management */}
                    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                                <Users size={20} /> Empleados y Accesos
                            </h3>
                            <button
                                onClick={() => setShowAddEmployee(!showAddEmployee)}
                                className="btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', gap: '0.5rem' }}
                            >
                                {showAddEmployee ? <X size={16} /> : <UserPlus size={16} />}
                                {showAddEmployee ? 'Cancelar' : 'Añadir Empleado'}
                            </button>
                        </div>

                        {showAddEmployee && (
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#3b82f6' }}>Nuevo Empleado</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Nombre</label>
                                        <input
                                            value={newEmployee.name}
                                            onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                            placeholder="Ej: Laura"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>PIN (Acceso)</label>
                                            <input
                                                type="text"
                                                maxLength="8"
                                                value={newEmployee.pin}
                                                onChange={e => setNewEmployee({ ...newEmployee, pin: e.target.value.replace(/\D/g, '') })}
                                                placeholder="1234"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Rol</label>
                                            <select
                                                value={newEmployee.role}
                                                onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                                style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                <option value="staff" style={{ background: '#1e293b' }}>Camarero/a (Staff)</option>
                                                <option value="admin" style={{ background: '#1e293b' }}>Administrador (Total)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddEmployee}
                                        className="btn-primary"
                                        disabled={!newEmployee.name || !newEmployee.pin}
                                        style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: (!newEmployee.name || !newEmployee.pin) ? 0.5 : 1 }}
                                    >
                                        Crear Empleado y Asignar PIN
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {employees.map(emp => (
                                <div key={emp.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '1rem', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {emp.name}
                                            {emp.role === 'admin' && <span style={{ fontSize: '0.6rem', background: '#3b82f6', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Admin</span>}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', fontFamily: 'monospace', letterSpacing: '2px' }}>
                                            PIN: {emp.pin}
                                        </div>
                                    </div>
                                    {emp.id !== 'admin' && emp.id !== currentUser?.id && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`¿Seguro que quieres borrar a ${emp.name}? Perderá el acceso de inmediato.`)) {
                                                    deleteEmployee(emp.id);
                                                }
                                            }}
                                            className="btn-icon" style={{ padding: '0.5rem', color: '#ef4444' }}
                                            title="Revocar Acceso"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div >
    );
};

export default Settings;
