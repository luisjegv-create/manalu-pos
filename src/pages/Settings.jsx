import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Printer, Building, Info, Server, Camera, Trash2, Database, AlertTriangle, Users, UserPlus, X, RefreshCw } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { supabase } from '../utils/supabaseClient';
import { compressImage, compressImageFromUrl } from '../utils/imageHelpers';
import { uploadImage } from '../utils/storageUtils';

const Settings = () => {
    const navigate = useNavigate();
    const { restaurantInfo, updateRestaurantInfo } = useInventory();
    const { 
        saveEmergencyBackup, 
        restoreFromBackup, 
        syncWithCloud, 
        syncStatus,
        tables,
        tableOrders,
        tableBills
    } = useOrder();
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
        if (formData.geminiApiKey) {
            localStorage.setItem('manalu_gemini_api_key', formData.geminiApiKey);
        } else {
            localStorage.removeItem('manalu_gemini_api_key');
        }

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

    const handleDeepClean = () => {
        if (!confirm("⚠️ ¿Vaciar memoria temporal y backups locales? \n\nNo perderás tus mesas abiertas ni tus ventas. Solo se borrarán copias de seguridad locales de productos e ingredientes para ganar espacio (se volverán a descargar automáticamente de la nube).")) return;
        
        const keysToKeep = [
            'manalu_tables', 
            'manalu_table_orders', 
            'manalu_table_bills', 
            'manalu_employees', 
            'manalu_auth_user', 
            'manalu_gemini_api_key', 
            'manalu_custom_qr'
        ];
        
        let cleanedCount = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (!keysToKeep.includes(key) && (key.startsWith('manalu_backup_') || key === 'manalu_last_good_state' || key === 'manalu_mermas' || key === 'manalu_physical_inventories')) {
                localStorage.removeItem(key);
                cleanedCount++;
            }
        });
        
        calculateStorage();
        alert(`✅ Limpieza completada. Se han eliminado ${cleanedCount} archivos de backup locales para liberar espacio. La aplicación se reiniciará para refrescar datos.`);
        window.location.reload();
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

                if (!currentBills[tableObj.id]) currentBills[tableObj.id] = [];
                
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
    
    const handleRestoreLocalState = () => {
        const saved = localStorage.getItem('manalu_last_good_state');
        if (!saved) {
            alert("No se encontró ningún backup local reciente.");
            return;
        }
        
        const backup = JSON.parse(saved);
        if (confirm(`⚠️ ¿Restaurar estado del ${new Date(backup.timestamp).toLocaleString()}? Esto sobreescribirá las mesas actuales.`)) {
            if (restoreFromBackup(backup)) {
                alert("✅ Estado restaurado con éxito.");
                window.location.reload();
            }
        }
    };

    const handleRestoreCloudState = async () => {
        if (!confirm("⚠️ ¿Consultar nubes en busca de copias de seguridad de las comandas?")) return;
        
        try {
            const { data, error } = await supabase.from('service_requests')
                .select('*')
                .eq('type', 'system_backup')
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (error) throw error;
            if (!data || data.length === 0) {
                alert("No se encontraron backups en la nube.");
                return;
            }

            const backup = typeof data[0].payload === 'string' ? JSON.parse(data[0].payload) : data[0].payload;
            if (confirm(`✅ Backup en la nube encontrado (${new Date(data[0].created_at).toLocaleString()}). ¿Deseas restaurar todas las mesas y comandas activas?`)) {
                if (restoreFromBackup(backup)) {
                    alert("✅ Recuperación desde la nube completada.");
                    window.location.reload();
                }
            }
        } catch (e) {
            alert("Error al recuperar desde la nube: " + e.message);
        }
    };

    const optimizeExistingImages = async () => {
        if (!confirm("⚠️ Esta acción comprimirá TODAS las fotos de productos y vinos para ahorrar espacio. ¿Deseas continuar?")) return;

        setOptProgress({ active: true, current: 0, total: 0, status: 'Iniciando mantenimiento...' });

        try {
            const { data: prods } = await supabase.from('products').select('id, name, image').not('image', 'is', null);
            const { data: wines } = await supabase.from('wines').select('id, name, image').not('image', 'is', null);
            
            const prodList = (prods || []).filter(p => !p.image.startsWith('http') || p.image.includes('supabase.co'));
            const wineList = (wines || []).filter(w => !w.image.startsWith('http') || w.image.includes('supabase.co'));
            
            const total = prodList.length + wineList.length + 1;
            setOptProgress(prev => ({ ...prev, total, status: 'Analizando catálogo...' }));

            let count = 0;

            for (const p of prodList) {
                try {
                    setOptProgress(prev => ({ ...prev, status: `Comprimiendo: ${p.name}` }));
                    const compressedBase64 = await compressImageFromUrl(p.image, 500, 0.6);
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
                        </div>
                    </div>

                    {/* Cloud Sync Status */}
                    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            <Server size={20} /> Estado de la Nube
                        </h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>Ventas Recuperadas:</span>
                                <span style={{ fontWeight: 'bold' }}>{syncStatus.sales.count}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>Última vez:</span>
                                <span style={{ fontWeight: 'bold' }}>{syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : 'Nunca'}</span>
                            </div>
                            {syncStatus.sales.error && (
                                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                    ⚠️ {syncStatus.sales.error}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={syncWithCloud}
                            disabled={syncStatus.isSyncing}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <RefreshCw size={18} className={syncStatus.isSyncing ? "spin-animation" : ""} />
                            {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                        </button>
                    </div>

                    {/* Mantenimiento */}
                    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            <AlertTriangle size={20} /> Mantenimiento
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <button onClick={handleDeepClean} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                🧹 Limpiar Temporales y Caché
                            </button>
                            <button onClick={handleRecoverFromKDS} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                🚑 Recuperar desde Cocina
                            </button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button onClick={handleRestoreLocalState} className="btn-secondary" style={{ fontSize: '0.75rem' }}>
                                    💾 Backup Local
                                </button>
                                <button onClick={handleRestoreCloudState} className="btn-secondary" style={{ fontSize: '0.75rem' }}>
                                    🌐 Cloud Mirror
                                </button>
                            </div>
                            <button onClick={handleResetData} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                💀 Borrar todo el TPV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    .glass-panel {
                        background: var(--color-surface);
                        border: 1px solid var(--border-strong);
                        border-radius: 20px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    }
                    .form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    .form-group label {
                        font-size: 0.85rem;
                        font-weight: 600;
                        color: var(--color-text-muted);
                    }
                    .form-group input {
                        padding: 0.8rem;
                        border-radius: 10px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid var(--border-strong);
                        color: var(--color-text);
                    }
                    .btn-primary {
                        background: var(--color-primary);
                        color: white;
                        border: none;
                        padding: 0.8rem 1.5rem;
                        border-radius: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        transition: all 0.2s;
                    }
                    .btn-secondary {
                        background: rgba(255,255,255,0.05);
                        color: var(--color-text);
                        border: 1px solid var(--border-strong);
                        padding: 0.8rem 1.5rem;
                        border-radius: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        transition: all 0.2s;
                    }
                    .spin-animation {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default Settings;
