import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { zones } from '../data/tables';
import { Utensils, Wine, ArrowLeft, Armchair, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import TableOrderPreview from '../components/TableOrderPreview';
import BarMap from '../components/BarMap';

const TableTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const calculate = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            setElapsed(Math.floor((now - start) / 60000));
        };
        calculate();
        const interval = setInterval(calculate, 30000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: elapsed > 30 ? '#ef4444' : elapsed > 20 ? '#fbbf24' : 'rgba(255,255,255,0.1)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: elapsed > 20 ? 'white' : 'inherit',
            border: '1px solid rgba(255,255,255,0.2)'
        }}>
            <Clock size={12} />
            {elapsed}'
        </div>
    );
};

const iconMap = {
    Utensils,
    Wine
};

const TableSelection = () => {
    const navigate = useNavigate();
    const { selectTable, tableOrders, tables, addTable, deleteTable, updateTableDetails, closeTable, reservations, kitchenOrders, tableBills, transferTable, mergeTables, splitTable } = useOrder();
    const [activeZone, setActiveZone] = useState('salon');
    
    // Unified UI Action States
    const [selectedTable, setSelectedTable] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // 'main', 'edit'
    const [interactionMode, setInteractionMode] = useState(null); // null, 'move_target', 'group_target'

    const filteredTables = tables.filter(t => t.zone === activeZone);

    const handleTableSelect = (table) => {
        // Redirection logic for linked tables
        const effectiveTable = table.linkedTo ? (tables.find(t => t.id === table.linkedTo) || table) : table;

        if (interactionMode === 'move_target') {
            if (table.id === selectedTable.id) {
                setInteractionMode(null);
                setSelectedTable(null);
                return;
            }
            if (confirm(`¿Mover cuenta de ${selectedTable.name} a ${table.name}?`)) {
                transferTable(selectedTable.id, table.id);
                setInteractionMode(null);
                setSelectedTable(null);
            }
        } else if (interactionMode === 'group_target') {
            if (table.id === selectedTable.id) {
                setInteractionMode(null);
                setSelectedTable(null);
                return;
            }
            if (confirm(`¿Agrupar ${selectedTable.name} con ${table.name}?`)) {
                mergeTables(selectedTable.id, table.id);
                setInteractionMode(null);
                setSelectedTable(null);
            }
        } else {
            setSelectedTable(effectiveTable);
            setActiveModal('main');
        }
    };

    const handleAddTable = () => {
        const name = prompt('Nombre de la nueva mesa:');
        if (name) {
            addTable(activeZone, name);
        }
    };

    const handleSaveEdit = () => {
        if (selectedTable) {
            updateTableDetails(selectedTable.id, {
                name: selectedTable.name,
                isReserved: selectedTable.isReserved
            });
            setActiveModal('main');
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
            <header className="header-card" style={{
                padding: '1rem 2rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--border-strong)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Selección de Mesa</h1>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                    <button
                        onClick={handleAddTable}
                        style={{
                            padding: '0.8rem 1.2rem',
                            borderRadius: '12px',
                            border: '2px dashed #10b981',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        + Añadir Mesa
                    </button>
                </div>
            </header>

            {/* Instructional Banner for Transfer/Group Mode Target Selection */}
            {interactionMode && selectedTable && (
                <div style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '8px',
                    padding: '1rem',
                    margin: '0 2rem 1.5rem',
                    maxWidth: '1200px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    color: 'var(--color-text)'
                }}>
                    <div style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        2
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: '500', flex: 1 }}>
                        {interactionMode === 'move_target'
                            ? `Selecciona la mesa de DESTINO para mover la cuenta de la ${selectedTable.name}.`
                            : `Selecciona la mesa de DESTINO para agruparla con la ${selectedTable.name}.`}
                    </span>
                    <button 
                        onClick={() => { setInteractionMode(null); setSelectedTable(null); }}
                        style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Cancelar
                    </button>
                </div>
            )}

            <div style={{ padding: '0 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                    {zones.map(zone => {
                        const Icon = iconMap[zone.icon];
                        const isActive = activeZone === zone.id;
                        return (
                            <button
                                key={zone.id}
                                onClick={() => setActiveZone(zone.id)}
                                className={isActive ? 'glass-panel' : ''}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem 2rem',
                                    borderRadius: '12px',
                                    border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                                    background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    fontWeight: '600'
                                }}
                            >
                                <Icon size={24} />
                                {zone.name}
                            </button>
                        );
                    })}

                    {/* AddTable button moved to header */}
                </div>

                {/* Grid or Map */}
                {activeZone === 'barra' ? (
                    <BarMap 
                        tables={filteredTables}
                        allTables={tables}
                        handleTableSelect={handleTableSelect}
                        isTransferMode={interactionMode !== null}
                        sourceTable={selectedTable}
                        tableOrders={tableOrders}
                        tableBills={tableBills}
                        kitchenOrders={kitchenOrders}
                        reservations={reservations}
                    />
                ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '2rem'
                }}>
                    {filteredTables.map(table => {
                        const tableOrderItems = tableOrders[table.id] || [];
                        const tableBillItems = tableBills[table.id] || [];
                        const tableKitchenOrders = kitchenOrders.filter(o => o.table === table.name);

                        const hasActiveOrder = tableOrderItems.length > 0 || tableKitchenOrders.length > 0 || tableBillItems.length > 0;
                        const isOccupied = table.status === 'occupied' || hasActiveOrder;

                        // Check for today's reservations
                        const todayStr = new Date().toISOString().split('T')[0];
                        const reservation = reservations.find(r =>
                            (r.tableId === table.id.toString() || r.tableId === table.id) &&
                            r.date === todayStr &&
                            (r.status === 'confirmado' || r.status === 'sentado')
                        );
                        const isReserved = table.isReserved || (reservation && reservation.status === 'confirmado');

                        // Minimum wait time logic (oldest item)
                        let minStartTime = null;
                        tableKitchenOrders.forEach(o => {
                            if (o.status === 'pending') {
                                if (!minStartTime || new Date(o.created_at) < new Date(minStartTime)) {
                                    minStartTime = o.created_at;
                                }
                            }
                        });


                        return (
                            <motion.button
                                key={table.id}
                                whileHover={{ y: -5, scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTableSelect(table)}
                                className="glass-panel"
                                style={{
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    cursor: 'pointer',
                                    border: (interactionMode && selectedTable?.id === table.id) ? '3px solid #f59e0b' : '1px solid var(--border-strong)',
                                    backgroundColor: (interactionMode && selectedTable?.id === table.id) 
                                        ? 'rgba(245, 158, 11, 0.3)'
                                        : isReserved
                                        ? 'rgba(245, 158, 11, 0.15)'
                                        : hasActiveOrder
                                            ? 'rgba(59, 130, 246, 0.15)'
                                            : isOccupied
                                                ? 'rgba(239, 68, 68, 0.1)'
                                                : 'rgba(16, 185, 129, 0.1)',
                                    borderColor: (interactionMode && selectedTable?.id === table.id) 
                                        ? '#f59e0b'
                                        : isReserved
                                        ? '#f59e0b'
                                        : hasActiveOrder
                                            ? 'var(--color-primary)'
                                            : isOccupied
                                                ? '#ef4444'
                                                : 'var(--border-strong)',
                                    color: 'var(--color-text)',
                                    position: 'relative',
                                    boxShadow: (interactionMode && selectedTable?.id === table.id) ? '0 0 15px rgba(245, 158, 11, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    minHeight: '200px',
                                    animation: interactionMode ? 'pulse 2s infinite' : 'none'
                                }}
                            >
                                {isOccupied && minStartTime && <TableTimer startTime={minStartTime} />}

                                {(table.linkedTo || tables.some(t => t.linkedTo === table.id)) && (
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '1.2rem' }} title="Mesa Agrupada">
                                        🤝
                                    </div>
                                )}

                                {table.linkedTo && (
                                    <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                        Unida a {tables.find(t => t.id === table.linkedTo)?.name}
                                    </div>
                                )}

                                <div style={{
                                    padding: '0.8rem',
                                    borderRadius: '50%',
                                    background: isReserved
                                        ? '#f59e0b'
                                        : hasActiveOrder
                                            ? 'var(--color-primary)'
                                            : isOccupied ? '#ef4444' : '#10b981',
                                    color: 'white',
                                    marginBottom: '0.5rem'
                                }}>
                                    {table.zone === 'salon' ? <Utensils size={20} /> : <Armchair size={20} />}
                                </div>

                                <div style={{ textAlign: 'center', width: '100%' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{table.name}</h3>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: table.linkedTo 
                                            ? 'var(--color-primary)'
                                            : isReserved
                                            ? '#f59e0b'
                                            : hasActiveOrder
                                                ? 'var(--color-primary)'
                                                : isOccupied ? '#ef4444' : '#10b981',
                                        fontWeight: 'bold',
                                        display: 'block',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {table.linkedTo ? 'AGRUPADA' : (isReserved ? 'RESERVADA' : (hasActiveOrder ? 'EN SERVICIO' : (isOccupied ? 'Ocupada' : 'Libre')))}
                                    </span>

                                    {isOccupied && (
                                        <TableOrderPreview
                                            tableOrders={tableOrderItems}
                                            tableBills={tableBillItems}
                                            kitchenOrders={tableKitchenOrders}
                                        />
                                    )}

                                    {reservation && !hasActiveOrder && (
                                        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#f59e0b', fontWeight: 'bold' }}>
                                            {reservation.time} - {reservation.customerName}
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
                )}
            </div>

            {/* ACTION MODAL */}
            {activeModal === 'main' && selectedTable && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }} onClick={() => { setActiveModal(null); setSelectedTable(null); }}>
                    <div className="glass-panel slide-up" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h2 style={{ margin: '0 0 1rem 0', textAlign: 'center', fontSize: '1.8rem', color: 'white' }}>{selectedTable.name}</h2>
                        
                        <button
                            onClick={() => {
                                setActiveModal(null);
                                selectTable(selectedTable);
                                navigate('/bar-tapas');
                            }}
                            className="btn-glow"
                            style={{ padding: '1.25rem', background: '#10b981', border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
                        >
                            🟢 Tomar Nota / Entrar
                        </button>

                        <button
                            onClick={() => setActiveModal('edit')}
                            style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            ✏️ Editar Nombre / Reservar
                        </button>

                        <hr style={{ borderColor: 'var(--border-strong)', width: '100%', margin: '0.75rem 0' }} />

                        {((tableOrders[selectedTable.id] && tableOrders[selectedTable.id].length > 0) || 
                          (tableBills[selectedTable.id] && tableBills[selectedTable.id].length > 0) || 
                          kitchenOrders.some(o => o.table === selectedTable.name)) && (
                            <button
                                onClick={() => {
                                    setActiveModal(null);
                                    setInteractionMode('move_target');
                                }}
                                style={{ padding: '1rem', background: 'var(--color-primary)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                ➡️ Mover Cuenta a otra mesa
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setActiveModal(null);
                                setInteractionMode('group_target');
                            }}
                            style={{ padding: '1rem', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            🤝 Agrupar con otra mesa
                        </button>

                        {(selectedTable.linkedTo || tables.some(t => t.linkedTo === selectedTable.id)) && (
                            <button
                                onClick={() => {
                                    if (confirm(`¿Seguro que quieres desagrupar esta mesa?`)) {
                                        splitTable(selectedTable.id);
                                        setActiveModal(null);
                                        setSelectedTable(null);
                                    }
                                }}
                                style={{ padding: '1rem', background: '#8b5cf6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                            >
                                ✂️ Desagrupar Mesas
                            </button>
                        )}

                        <button 
                            onClick={() => { setActiveModal(null); setSelectedTable(null); }} 
                            style={{ background: 'transparent', border: '1px solid #475569', padding: '1rem', color: '#cbd5e1', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem', fontSize: '1.1rem' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {activeModal === 'edit' && selectedTable && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }} onClick={() => setActiveModal('main')}>
                    <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid #f59e0b' }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                             <button onClick={() => setActiveModal('main')} style={{background: 'none', border:'none', color: 'white', fontSize: '1.5rem', cursor:'pointer'}}><ArrowLeft size={24} /></button>
                             <h2 style={{ margin: 0, flex: 1, textAlign: 'center' }}>Editar Mesa</h2>
                             <div style={{width: 24}}></div>
                        </div>

                        <div>
                            <label>Nombre de la Mesa</label>
                            <input
                                type="text"
                                value={selectedTable.name}
                                onChange={(e) => setSelectedTable({ ...selectedTable, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid #666', color: 'white', borderRadius: '8px', fontSize: '1.1rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            <input
                                type="checkbox"
                                id="reserved"
                                checked={selectedTable.isReserved || false}
                                onChange={(e) => setSelectedTable({ ...selectedTable, isReserved: e.target.checked })}
                                style={{ width: '24px', height: '24px', accentColor: '#f59e0b' }}
                            />
                            <label htmlFor="reserved" style={{fontSize: '1.1rem', fontWeight: '500'}}>Marcar como RESERVADA</label>
                        </div>

                        {selectedTable.status === 'occupied' && (
                            <button
                                onClick={() => {
                                    if (confirm('¿Liberar mesa y borrar cuenta actual para SIEMPRE?')) {
                                        closeTable(selectedTable.id);
                                        setActiveModal(null);
                                        setSelectedTable(null);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: '#ef4444',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.1rem'
                                }}
                            >
                                🧹 Forzar Liberar Mesa
                            </button>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={() => {
                                    if (confirm('¿Seguro que quieres eliminar esta mesa?')) {
                                        deleteTable(selectedTable.id);
                                        setActiveModal(null);
                                        setSelectedTable(null);
                                    }
                                }}
                                style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Eliminar Mesa
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                style={{ flex: 1, padding: '1rem', background: '#10b981', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                            >
                                ✅ Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>
                {`
                @keyframes pulse {
                  0% { opacity: 1; }
                  50% { opacity: 0.7; transform: scale(0.98); }
                  100% { opacity: 1; }
                }
                @keyframes slideUp {
                  from { transform: translateY(20px); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
                .slide-up {
                  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                `}
            </style>
        </div>
    );
};

export default TableSelection;
