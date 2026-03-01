import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Scale, ListChecks, AlertTriangle, Trash2, CheckCircle2, TrendingDown, ClipboardList } from 'lucide-react';

const MermasManagement = () => {
    const { ingredients, mermas, addMerma, deleteMerma, physicalInventories, addPhysicalInventory, updateIngredient } = useInventory();

    const [activeTab, setActiveTab] = useState('registro'); // 'registro', 'historial', 'inventario', 'historial_inv'

    // Form states
    const [selectedIngredient, setSelectedIngredient] = useState('');
    const [initialWeight, setInitialWeight] = useState('');
    const [wasteWeight, setWasteWeight] = useState('');
    const [wasteCategory, setWasteCategory] = useState('Pelado y Limpieza'); // Pelado y Limpieza, Caducidad, Sobreproducción, Rotura, Otro
    const [notes, setNotes] = useState('');

    // Inventory states
    const [inventoryCounts, setInventoryCounts] = useState({});
    const [inventoryCategory, setInventoryCategory] = useState('alimentos');

    const handleAddMerma = (e) => {
        e.preventDefault();
        const ing = ingredients.find(i => i.id === selectedIngredient || i.id === parseInt(selectedIngredient));
        if (!ing) return alert('Selecciona un ingrediente válido.');

        const initial = parseFloat(initialWeight) || 0;
        const waste = parseFloat(wasteWeight) || 0;

        if (waste <= 0) return alert('El peso/cantidad de la merma debe ser mayor a 0');

        let percentage = 0;
        let rendimiento = 0;
        if (initial > 0) {
            percentage = (waste / initial) * 100;
            rendimiento = ((initial - waste) / initial) * 100;
        }

        addMerma({
            ingredientId: ing.id,
            ingredientName: ing.name,
            unit: ing.unit,
            initialWeight: initial,
            weight: waste,
            category: wasteCategory,
            percentage,
            rendimiento,
            notes
        });

        alert(`Merma registrada. Se han descontado ${waste} ${ing.unit} del stock de ${ing.name}.`);
        setSelectedIngredient('');
        setInitialWeight('');
        setWasteWeight('');
        setNotes('');
    };

    const handleSavePhysicalInventory = () => {
        const countsToProcess = Object.entries(inventoryCounts).filter(([_, val]) => val !== '');
        if (countsToProcess.length === 0) return alert('Anota al menos un conteo real antes de guardar.');

        if (!window.confirm('¿Confirmas guardar este inventario y ajustar el stock teórico a la realidad contada?')) return;

        const discrepancies = [];
        countsToProcess.forEach(([id, realStr]) => {
            const realAmount = parseFloat(realStr);
            if (isNaN(realAmount)) return;

            const ing = ingredients.find(i => i.id === id || i.id === parseInt(id));
            const theoretical = ing ? (ing.quantity || 0) : 0;

            // Allow minor floating point differences, strictly compare numbers
            if (ing && Math.abs(theoretical - realAmount) > 0.001) {
                discrepancies.push({
                    ingredientId: ing.id,
                    ingredientName: ing.name,
                    unit: ing.unit,
                    theoretical: theoretical,
                    real: realAmount,
                    difference: realAmount - theoretical // Negative means missing stock
                });

                // Adjust stock to match reality
                updateIngredient(ing.id, { ...ing, quantity: realAmount });
            }
        });

        if (discrepancies.length > 0) {
            addPhysicalInventory({
                discrepancies
            });
            alert(`Inventario ajustado. Se encontraron y corrigieron ${discrepancies.length} diferencias.`);
        } else {
            alert('Inventario cuadrado perfectamente. No hay diferencias con el sistema.');
        }

        setInventoryCounts({});
    };

    const filteredIngredients = ingredients.filter(i => i.category === inventoryCategory) || [];

    return (
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)' }}>
                <button
                    onClick={() => setActiveTab('registro')}
                    style={{
                        flex: 1, padding: '1rem', border: 'none', background: activeTab === 'registro' ? 'white' : 'transparent',
                        color: activeTab === 'registro' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'registro' ? 'bold' : 'normal', cursor: 'pointer',
                        borderBottom: activeTab === 'registro' ? '2px solid var(--color-primary)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <Scale size={18} /> Registrar Merma Diario
                </button>
                <button
                    onClick={() => setActiveTab('inventario')}
                    style={{
                        flex: 1, padding: '1rem', border: 'none', background: activeTab === 'inventario' ? 'white' : 'transparent',
                        color: activeTab === 'inventario' ? '#f59e0b' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'inventario' ? 'bold' : 'normal', cursor: 'pointer',
                        borderBottom: activeTab === 'inventario' ? '2px solid #f59e0b' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <ClipboardList size={18} /> Cuadre Físico (Inventario)
                </button>
                <button
                    onClick={() => setActiveTab('historial')}
                    style={{
                        flex: 1, padding: '1rem', border: 'none', background: activeTab === 'historial' ? 'white' : 'transparent',
                        color: activeTab === 'historial' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'historial' ? 'bold' : 'normal', cursor: 'pointer',
                        borderBottom: activeTab === 'historial' ? '2px solid var(--color-primary)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <ListChecks size={18} /> Historial y Rendimiento
                </button>
            </div>

            <div style={{ padding: '2rem' }}>
                {activeTab === 'registro' && (
                    <div>
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--color-text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Scale size={20} color="var(--color-primary)" /> Pesaje de Desperdicios / Mermas
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            Registra aquí lo que se pierde durante la limpieza, preparación o por caducidad. El sistema calculará el rendimiento y descontará esto del stock automáticamente.
                        </p>

                        <form onSubmit={handleAddMerma} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#334155' }}>Ingrediente (Materia Prima)</label>
                                <select
                                    className="input-field"
                                    value={selectedIngredient}
                                    onChange={(e) => setSelectedIngredient(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                >
                                    <option value="">-- Selecciona el ingrediente --</option>
                                    {ingredients.map(i => (
                                        <option key={i.id} value={i.id}>{i.name} (Stock actual: {i.quantity} {i.unit})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#334155' }}>Causa de la Merma</label>
                                <select
                                    className="input-field"
                                    value={wasteCategory}
                                    onChange={(e) => setWasteCategory(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                >
                                    <option value="Pelado y Limpieza">Pelado y Limpieza</option>
                                    <option value="Caducidad / Mal Estado">Caducidad / Mal Estado</option>
                                    <option value="Sobreproducción">Sobreproducción / Sobras</option>
                                    <option value="Rotura / Accidente">Rotura / Accidente</option>
                                    <option value="Otro">Otro motivo</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#334155' }}>
                                    Cantidad Inicial (Opcional) <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Para calcular %</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    value={initialWeight}
                                    onChange={(e) => setInitialWeight(e.target.value)}
                                    placeholder="Ej. Peso del saco entero"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                    Cantidad Merma (Pérdida) *
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input-field"
                                        value={wasteWeight}
                                        onChange={(e) => setWasteWeight(e.target.value)}
                                        placeholder="Ej. Lo que se ha tirado"
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px 0 0 8px', border: '1px solid #cbd5e1', borderRight: 'none', background: 'white' }}
                                    />
                                    <span style={{ padding: '0.75rem 1rem', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '0 8px 8px 0', borderLeft: 'none', color: '#475569', fontWeight: 'bold' }}>
                                        {ingredients.find(i => i.id === selectedIngredient || i.id === parseInt(selectedIngredient))?.unit || 'uds'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#334155' }}>Notas / Observaciones</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ej. Las patatas del proveedor venían muy estropeadas"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 'bold', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <Scale size={20} /> Registrar y Descontar Stock
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'inventario' && (
                    <div>
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ClipboardList size={20} /> Toma de Inventario Físico (Cuadre real)
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Haz la cuenta real en tus estanterías/neveras e introduce la cantidad. Las diferencias indicarán mermas no registradas, errores o faltas. Al guardar, el stock del sistema se ajustará a la realidad que pongas aquí.
                        </p>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                            {['alimentos', 'bebidas', 'menaje', 'limpieza'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setInventoryCategory(cat)}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', textTransform: 'capitalize', cursor: 'pointer',
                                        background: inventoryCategory === cat ? 'rgba(245, 158, 11, 0.1)' : '#f1f5f9',
                                        color: inventoryCategory === cat ? '#b45309' : '#475569',
                                        border: `1px solid ${inventoryCategory === cat ? '#f59e0b' : '#cbd5e1'}`
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Ingrediente</th>
                                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Stock Teórico (Sistema)</th>
                                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Stock Real Físico</th>
                                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIngredients.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay ingredientes en esta categoría.</td></tr>
                                    ) : (
                                        filteredIngredients.map(ing => {
                                            const realValue = inventoryCounts[ing.id];
                                            const theoretical = ing.quantity || 0;
                                            const difference = realValue !== undefined && realValue !== '' ? parseFloat(realValue) - theoretical : 0;

                                            // Handle color for difference
                                            let diffColor = '#64748b';
                                            if (difference < 0) diffColor = '#ef4444'; // Missing stock (Negative)
                                            else if (difference > 0) diffColor = '#10b981'; // Unexpected extra stock (Positive)

                                            return (
                                                <tr key={ing.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '500', color: '#1e293b' }}>{ing.name}</td>
                                                    <td style={{ padding: '1rem', color: '#475569', fontWeight: 'bold' }}>{theoretical} {ing.unit}</td>
                                                    <td style={{ padding: '0.5rem 1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', maxWidth: '150px' }}>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Teclado..."
                                                                value={realValue !== undefined ? realValue : ''}
                                                                onChange={(e) => setInventoryCounts(prev => ({ ...prev, [ing.id]: e.target.value }))}
                                                                style={{ width: '100%', padding: '0.5rem', border: 'none', outline: 'none', background: 'transparent' }}
                                                            />
                                                            <span style={{ padding: '0.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 'bold', background: '#e2e8f0', borderLeft: '1px solid #cbd5e1' }}>{ing.unit}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: diffColor }}>
                                                        {realValue !== undefined && realValue !== '' ? (
                                                            <span>{difference > 0 ? '+' : ''}{difference.toFixed(2)} {ing.unit}</span>
                                                        ) : (
                                                            <span style={{ color: '#cbd5e1' }}>--</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button onClick={handleSavePhysicalInventory} className="btn-primary" style={{ background: '#f59e0b', color: 'white', padding: '0.75rem 2rem', fontWeight: 'bold', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <CheckCircle2 size={20} /> Procesar Cuadre y Ajustar Sistema
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'historial' && (
                    <div>
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingDown size={20} /> Análisis de Mermas y Desperdicios
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                            {mermas.length === 0 ? (
                                <div style={{ background: '#f8fafc', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                                    <CheckCircle2 size={40} style={{ margin: '0 auto 1rem', display: 'block', color: '#10b981' }} />
                                    No hay mermas registradas todavía. Excelente trabajo.
                                </div>
                            ) : (
                                mermas.map(merma => (
                                    <div key={merma.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>{merma.ingredientName}</span>
                                                <span style={{ fontSize: '0.8rem', background: '#fef2f2', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 'bold', border: '1px solid #fca5a5' }}>
                                                    -{merma.weight} {merma.unit}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', background: '#f0fdf4', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
                                                    {merma.category}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {new Date(merma.date).toLocaleString()}
                                            </div>
                                            {merma.notes && <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>Nota: {merma.notes}</div>}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                            {merma.percentage > 0 && (
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.25rem' }}>Análisis de Inicial ({merma.initialWeight}{merma.unit})</div>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#ef4444' }}>{merma.percentage.toFixed(1)}%</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pérdida</div>
                                                        </div>
                                                        <div style={{ width: '1px', background: '#e2e8f0', height: '30px' }}></div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981' }}>{merma.rendimiento.toFixed(1)}%</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rendimiento Útil</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => {
                                                    if (window.confirm('¿Seguro que deseas anular esta merma? Se restaurará el stock perdido.')) {
                                                        deleteMerma(merma.id);
                                                    }
                                                }}
                                                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Anular Merma y restaurar stock"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Physical Inventory Discrepancies History section could go here */}
                        {physicalInventories.length > 0 && (
                            <div style={{ marginTop: '3rem' }}>
                                <h4 style={{ color: '#b45309', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Últimos ajustes de Inventario (Discrepancias)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {physicalInventories.map(inv => (
                                        <div key={inv.id} style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                            <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '1rem' }}>Inventario del {new Date(inv.date).toLocaleDateString()} a las {new Date(inv.date).toLocaleTimeString()}</div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ color: '#b45309', borderBottom: '1px solid #fcd34d' }}>
                                                        <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Producto</th>
                                                        <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Teórico</th>
                                                        <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Real</th>
                                                        <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Ajuste (Descuadre)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {inv.discrepancies.map((d, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px dashed #fde68a' }}>
                                                            <td style={{ padding: '0.5rem 0', fontWeight: '500' }}>{d.ingredientName}</td>
                                                            <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#92400e' }}>{d.theoretical} {d.unit}</td>
                                                            <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 'bold' }}>{d.real} {d.unit}</td>
                                                            <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 'bold', color: d.difference < 0 ? '#ef4444' : '#10b981' }}>
                                                                {d.difference > 0 ? '+' : ''}{d.difference.toFixed(2)} {d.unit}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MermasManagement;
