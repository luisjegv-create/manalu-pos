import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Printer, Building, Info, Server, Camera, Trash2, Database, AlertTriangle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

const Settings = () => {
    const navigate = useNavigate();
    const { restaurantInfo, updateRestaurantInfo } = useInventory();
    const [saved, setSaved] = useState(false);
    const [storageUsage, setStorageUsage] = useState(0);

    // Temp state for form to avoid saving on every keystroke if preferred, 
    // but here we can just use the context data directly for simplicity if it's small.
    // Let's use local state for the form and save to context on handleSave.
    const [formData, setFormData] = useState(restaurantInfo);

    // Custom QR State (Keep independent if preferred, or move to context too?)
    // Let's keep QR independent for now as it's a big blob.
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
        updateRestaurantInfo(formData);
        setSaved(true);
        calculateStorage();
        setTimeout(() => setSaved(false), 3000);
    };

    const handleImageUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) {
                alert("La imagen es demasiado grande (máx 500KB)");
                return;
            }
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
    };

    const removeCustomQR = () => {
        setCustomQR(null);
        localStorage.removeItem('manalu_custom_qr');
        calculateStorage();
    };

    const handleResetData = () => {
        if (confirm("⚠️ ADVERTENCIA: Se borrarán todos los productos, ventas, ingredientes y configuraciones. ¿Estás SEGURO?")) {
            if (confirm("Segunda confirmación: ¿Realmente quieres borrar TODA la base de datos local?")) {
                localStorage.clear();
                alert("Datos borrados. La aplicación se reiniciará.");
                window.location.href = '/';
            }
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/')} className="btn-icon">
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0 }}>Configuración</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Ajustes generales del sistema</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* --- Left Column: Info --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Restaurant Info */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building size={20} /> Datos del Establecimiento
                        </h3>

                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{
                                width: '80px', height: '80px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px', border: '1px dashed var(--glass-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden'
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>NIF / CIF</label>
                                    <input value={formData.nif} onChange={e => setFormData({ ...formData, nif: e.target.value })} />
                                </div>
                            </div>
                            <button className="btn-primary" onClick={handleSave} style={{ marginTop: '1rem', justifyContent: 'center', background: saved ? '#10b981' : 'var(--color-primary)' }}>
                                {saved ? '¡Guardado!' : <><Save size={18} /> Guardar Cambios</>}
                            </button>
                        </div>
                    </div>

                    {/* Printers */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Storage & System */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                            <h4 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertTriangle size={16} /> Zona de Peligro
                            </h4>
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

                    {/* QR Config */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                </div>

            </div>
        </div>
    );
};

export default Settings;
