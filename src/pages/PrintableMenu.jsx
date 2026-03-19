import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { ArrowLeft, Printer, Plus, Trash2 } from 'lucide-react';

// Reusable UI for a product row in print (Centered Style)
const PrintItem = ({ item }) => (
    <div style={{ marginBottom: '0.3rem', breakInside: 'avoid', textAlign: 'center' }}>
        <h3 style={{ margin: '0', fontSize: '0.85rem', fontWeight: 'bold', color: '#fef3c7', fontFamily: "'Playfair Display', serif", textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: '1.1' }}>
            {item.name}
        </h3>
        {item.description && (
            <p style={{ margin: '0', fontSize: '0.65rem', color: '#e2e8f0', width: '95%', marginInline: 'auto', lineHeight: '1.0' }}>
                {item.description}
            </p>
        )}
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fcd34d', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', marginTop: '0.1rem' }}>
            {item.isGrouped ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    {item.priceMontado != null && <span>Montado: {item.priceMontado.toFixed(2)}€</span>}
                    {item.priceBocata != null && <span>Bocata: {item.priceBocata.toFixed(2)}€</span>}
                </div>
            ) : (
                `${item.price.toFixed(2)}€`
            )}
        </div>
    </div>
);

const SectionTitle = ({ title }) => (
    <div style={{ textAlign: 'center', margin: '0.6rem 0 0.4rem 0', breakInside: 'avoid' }}>
        <h2 style={{ 
            fontSize: '1.2rem', 
            margin: '0', 
            color: '#fbbf24', 
            textTransform: 'uppercase', 
            letterSpacing: '2px',
            fontFamily: "'Playfair Display', serif",
            textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
        }}>
            **{title}**
        </h2>
    </div>
);

const Separator = () => (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '0.6rem 0',
        opacity: 0.7,
        breakInside: 'avoid'
    }}>
        <svg width="200" height="20" viewBox="0 0 200 20">
            <line x1="0" y1="10" x2="200" y2="10" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="100" cy="10" r="4" fill="#fbbf24" />
            <circle cx="80" cy="10" r="2" fill="#fbbf24" />
            <circle cx="120" cy="10" r="2" fill="#fbbf24" />
        </svg>
    </div>
);

const PrintableMenu = () => {
    const navigate = useNavigate();
    const { salesProducts, wines, restaurantInfo } = useInventory();
    
    const [annexes, setAnnexes] = useState([]);
    
    const handleAddAnnex = () => {
        setAnnexes([...annexes, { id: Date.now(), title: 'NUEVO ANEXO', content: '' }]);
    };
    
    const handleDeleteAnnex = (id) => {
        setAnnexes(annexes.filter(a => a.id !== id));
    };
    
    const updateAnnex = (id, field, value) => {
        setAnnexes(annexes.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handlePrint = () => {
        window.print();
    };

    // Helper normalizer
    const norm = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Filter visible products
    const visibleProducts = salesProducts.filter(p => p.isDigitalMenuVisible !== false);
    const visibleWines = wines.filter(w => w.isDigitalMenuVisible !== false);

    // --- PAGE 1: Raciones ---
    const raciones = visibleProducts.filter(p => norm(p.category) === 'raciones');
    const racionesFrias = raciones.filter(p => {
        const sub = norm(p.subcategory);
        return sub.includes('fria') || sub.includes('queso') || sub.includes('embutido') || sub.includes('ensalada');
    });
    const racionesCalientes = raciones.filter(p => !racionesFrias.includes(p));

    // --- PAGE 2: Bocatas y Montados ---
    const bocatasYMontadosRaw = visibleProducts.filter(p => {
        const cat = norm(p.category);
        const sub = norm(p.subcategory);
        return (cat.includes('bocata') || sub.includes('bocata') || 
               cat.includes('montado') || sub.includes('montado')) &&
               !cat.includes('hamburguesa') && !sub.includes('hamburguesa');
    });

    const groupBocatasMontados = (items) => {
        const grouped = {};
        const standalone = [];

        items.forEach(item => {
            const lowerName = norm(item.name);
            let baseName = item.name.trim();
            let isMontado = lowerName.includes('montado') || norm(item.category).includes('montado') || norm(item.subcategory).includes('montado');
            let isBocadillo = lowerName.includes('bocadillo') || lowerName.includes('bocata') || norm(item.category).includes('bocata') || norm(item.subcategory).includes('bocata');
            
            if (lowerName.startsWith('montado ')) { isMontado = true; isBocadillo = false; }
            if (lowerName.startsWith('bocata ') || lowerName.startsWith('bocadillo ')) { isBocadillo = true; isMontado = false; }

            if (isMontado || isBocadillo) {
                baseName = baseName.replace(/^[Mm]ontado (de )?/, '').replace(/^[Bb]ocadillo (de )?/, '').replace(/^[Bb]ocata (de )?/, '').trim();
                const key = norm(baseName);
                
                if (!grouped[key]) {
                    grouped[key] = {
                        id: 'grp_' + key,
                        name: baseName.charAt(0).toUpperCase() + baseName.slice(1),
                        description: item.description,
                        priceBocata: null,
                        priceMontado: null,
                        isGrouped: true,
                        price: item.price 
                    };
                }
                
                if (isBocadillo) grouped[key].priceBocata = item.price;
                if (isMontado) grouped[key].priceMontado = item.price;
                if (item.description && (!grouped[key].description || item.description.length > grouped[key].description.length)) {
                    grouped[key].description = item.description;
                }
            } else {
                standalone.push(item);
            }
        });
        return [...Object.values(grouped), ...standalone];
    };

    const bocatasAgrupados = groupBocatasMontados(bocatasYMontadosRaw);

    // --- PAGE 3: Hamburguesas, infantiles, postres ---
    const hamburguesas = visibleProducts.filter(p => {
        const cat = norm(p.category);
        const sub = norm(p.subcategory);
        return cat.includes('hamburguesa') || sub.includes('hamburguesa');
    });
    
    const infantiles = visibleProducts.filter(p => {
        const cat = norm(p.category);
        const sub = norm(p.subcategory);
        return cat.includes('infantil') || sub.includes('infantil');
    });

    const postres = visibleProducts.filter(p => norm(p.category) === 'postres');

    // --- PAGE 3: Vinos y Vermuts ---
    const vinosBlancos = visibleWines.filter(w => norm(w.subcategory).includes('blanco') || norm(w.type).includes('blanco'));
    const vinosTintos = visibleWines.filter(w => norm(w.subcategory).includes('tinto') || norm(w.type).includes('tinto') || (!norm(w.subcategory).includes('blanco') && !norm(w.type).includes('blanco'))); // Fallback for unspecified
    
    const vermuts = visibleProducts.filter(p => {
        const cat = norm(p.category);
        const sub = norm(p.subcategory);
        return cat.includes('vermut') || sub.includes('vermut');
    });

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#000', fontFamily: "'Outfit', sans-serif" }}>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;600&display=swap');
                
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .no-print-bg {
                        padding: 0 !important;
                    }
                }
                
                .print-page {
                    width: 210mm;
                    height: 297mm; /* Exactly one A4 page */
                    overflow: hidden; /* Prevent spilling to next page */
                    page-break-after: always;
                    page-break-inside: avoid;
                    box-sizing: border-box;
                    margin: 0;
                    padding: 8mm; /* Reduced outer gap to fit border */
                }
                
                .print-page:last-child {
                    page-break-after: avoid;
                }

                .dark-wood-bg {
                    background-color: #1c140f;
                    background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2070&auto=format&fit=crop');
                    background-size: cover;
                    background-position: center;
                }
                
                .gold-border {
                    width: 100%;
                    height: 100%;
                    border: 2px solid rgba(251, 191, 36, 0.8);
                    outline: 1px solid rgba(251, 191, 36, 0.4);
                    outline-offset: -6px;
                    border-radius: 8px;
                    padding: 0.8cm 1.0cm;
                    box-sizing: border-box;
                    position: relative;
                }
                
                /* Corner ornamental dots */
                .gold-border::before, .gold-border::after {
                    content: '';
                    position: absolute;
                    width: 10px; height: 10px;
                    background: #fbbf24;
                    border-radius: 50%;
                }
                .gold-border::before { top: 8px; left: 8px; box-shadow: calc(100% + 25px) 0 #fbbf24; }
                .gold-border::after { bottom: 8px; right: 8px; }
                `}
            </style>

            {/* Non-printable Control Panel */}
            <div className="no-print" style={{ 
                background: '#1e293b', 
                color: 'white', 
                padding: '1.5rem', 
                position: 'sticky', 
                top: 0, 
                zIndex: 100,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            onClick={() => navigate('/menu')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            <ArrowLeft size={20} /> Volver
                        </button>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Configuración Tema Elegante (DIN A4)</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={handleAddAnnex}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            <Plus size={20} /> Añadir Anexo
                        </button>
                        <button 
                            onClick={handlePrint}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fbbf24', color: '#000', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                        >
                            <Printer size={20} /> Imprimir / Exportar a PDF
                        </button>
                    </div>
                </div>

                {/* Annex Editor */}
                {annexes.length > 0 && (
                    <div style={{ maxWidth: '1200px', margin: '1.5rem auto 0', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#fbbf24' }}>Gestión de Anexos</h3>
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {annexes.map(annex => (
                                <div key={annex.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <input 
                                            value={annex.title} 
                                            onChange={(e) => updateAnnex(annex.id, 'title', e.target.value)}
                                            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none', width: '100%' }}
                                            placeholder="TÍTULO DEL ANEXO"
                                        />
                                        <button onClick={() => handleDeleteAnnex(annex.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <textarea 
                                        value={annex.content}
                                        onChange={(e) => updateAnnex(annex.id, 'content', e.target.value)}
                                        style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem', borderRadius: '4px', resize: 'vertical' }}
                                        placeholder="Contenido del anexo..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Printable Area - Rendered exactly as it will print */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', background: '#333' }} className="no-print-bg">
                <p className="no-print" style={{ color: '#aaa', marginBottom: '1rem' }}>Previsualización del formato impreso. Asegúrate de tener activada la opción <strong>"Gráficos de fondo" / "Background graphics"</strong> en el cuadro de impresión.</p>
                
                <div style={{ width: '210mm' }}>
                    
                    {/* PAGE 1 */}
                    <div className="print-page dark-wood-bg" style={{ overflow: 'hidden', pageBreakAfter: 'always' }}>
                        <div className="gold-border">
                            {racionesFrias.length > 0 && (
                                <>
                                    <SectionTitle title="RACIONES FRÍAS" />
                                    {racionesFrias.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}

                            {(racionesFrias.length > 0 && racionesCalientes.length > 0) && <Separator />}

                            {racionesCalientes.length > 0 && (
                                <>
                                    <SectionTitle title="RACIONES CALIENTES" />
                                    {racionesCalientes.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}

                            {raciones.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8' }}>No hay raciones disponibles.</p>}
                        </div>
                    </div>

                    {/* PAGE 2 */}
                    <div className="print-page dark-wood-bg" style={{ overflow: 'hidden', pageBreakAfter: 'always' }}>
                        <div className="gold-border">
                            {bocatasAgrupados.length > 0 && (
                                <>
                                    <SectionTitle title="BOCATAS Y MONTADOS" />
                                    <div style={{ textAlign: 'center', color: '#fbbf24', fontStyle: 'italic', marginBottom: '1rem', opacity: 0.9 }}>
                                        (Todos los bocatas se sirven en pan artesanal de obrador local)
                                    </div>
                                    {bocatasAgrupados.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}
                        </div>
                    </div>

                    {/* PAGE 3 */}
                    <div className="print-page dark-wood-bg" style={{ overflow: 'hidden', pageBreakAfter: 'always' }}>
                        <div className="gold-border">
                            {hamburguesas.length > 0 && (
                                <>
                                    <SectionTitle title="HAMBURGUESAS" />
                                    {hamburguesas.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}
                            
                            {(hamburguesas.length > 0 && infantiles.length > 0) && <Separator />}
                            
                            {infantiles.length > 0 && (
                                <>
                                    <SectionTitle title="PLATOS INFANTILES" />
                                    {infantiles.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}

                            {((hamburguesas.length > 0 || infantiles.length > 0) && postres.length > 0) && <Separator />}

                            {postres.length > 0 && (
                                <>
                                    <SectionTitle title="POSTRES" />
                                    {postres.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}
                        </div>
                    </div>

                    {/* PAGE 4 */}
                    <div className="print-page dark-wood-bg" style={{ overflow: 'hidden', pageBreakAfter: 'always' }}>
                        <div className="gold-border">
                            {vinosBlancos.length > 0 && (
                                <>
                                    <SectionTitle title="VINOS BLANCOS" />
                                    {vinosBlancos.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}

                            {(vinosBlancos.length > 0 && vinosTintos.length > 0) && <Separator />}

                            {vinosTintos.length > 0 && (
                                <>
                                    <SectionTitle title="VINOS TINTOS" />
                                    {vinosTintos.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}

                            {vermuts.length > 0 && (
                                <>
                                    <Separator />
                                    <SectionTitle title="VERMUTS" />
                                    {vermuts.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ANNEXES (Printed at the end) */}
                    {annexes.length > 0 && (
                        <div className="print-page dark-wood-bg" style={{ overflow: 'hidden', pageBreakAfter: 'avoid' }}>
                            <div className="gold-border">
                                {annexes.map((annex, index) => (
                                    <div key={annex.id} style={{ marginBottom: index === annexes.length - 1 ? 0 : '2rem', textAlign: 'center' }}>
                                        <SectionTitle title={annex.title} />
                                        <div style={{ 
                                            fontSize: '1.1rem', 
                                            lineHeight: '1.6', 
                                            whiteSpace: 'pre-wrap', 
                                            color: '#e2e8f0', 
                                            fontFamily: "'Outfit', sans-serif" 
                                        }}>
                                            {annex.content}
                                        </div>
                                        {index < annexes.length - 1 && <Separator />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PrintableMenu; 
