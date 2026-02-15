import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { zones } from '../data/tables';
import { Utensils, Wine, ArrowLeft, Armchair } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
    Utensils,
    Wine
};

const TableSelection = () => {
    const navigate = useNavigate();
    const { selectTable, tableOrders, tables, addTable, deleteTable, updateTableDetails, closeTable } = useOrder();
    const [activeZone, setActiveZone] = useState('salon');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTable, setEditingTable] = useState(null); // For modal

    const filteredTables = tables.filter(t => t.zone === activeZone);

    const handleTableSelect = (table) => {
        if (isEditMode) {
            setEditingTable(table);
        } else {
            selectTable(table);
            navigate('/bar-tapas'); // Go to TPV after selection
        }
    };

    const handleAddTable = () => {
        const name = prompt('Nombre de la nueva mesa:');
        if (name) {
            addTable(activeZone, name);
        }
    };

    const handleSaveEdit = () => {
        if (editingTable) {
            updateTableDetails(editingTable.id, {
                name: editingTable.name,
                isReserved: editingTable.isReserved
            });
            setEditingTable(null);
        }
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
                    <h1 style={{ margin: 0 }}>Selección de Mesa</h1>
                </div>

                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    style={{
                        padding: '0.5rem 1rem',
                        background: isEditMode ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: isEditMode ? 'black' : 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {isEditMode ? 'Terminar Edición' : 'Editar Mesas'}
                </button>
            </header>

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

                {isEditMode && (
                    <button
                        onClick={handleAddTable}
                        style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '2px dashed #10b981',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginLeft: 'auto'
                        }}
                    >
                        + Añadir Mesa
                    </button>
                )}
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '2rem'
            }}>
                {filteredTables.map(table => {
                    const hasActiveOrder = tableOrders[table.id] && tableOrders[table.id].length > 0;
                    const isOccupied = table.status === 'occupied' || hasActiveOrder;
                    const isReserved = table.isReserved;

                    return (
                        <motion.button
                            key={table.id}
                            whileHover={{ y: -5, scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleTableSelect(table)}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                                border: isEditMode ? '2px dashed #f59e0b' : '1px solid var(--glass-border)',
                                backgroundColor: isReserved
                                    ? 'rgba(245, 158, 11, 0.15)' // Orange/Yellow for reserved
                                    : hasActiveOrder
                                        ? 'rgba(59, 130, 246, 0.15)'
                                        : isOccupied
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(16, 185, 129, 0.1)',
                                borderColor: isReserved
                                    ? '#f59e0b'
                                    : hasActiveOrder
                                        ? 'var(--color-primary)'
                                        : isOccupied
                                            ? '#ef4444'
                                            : 'var(--glass-border)',
                                color: 'var(--color-text)',
                                position: 'relative'
                            }}
                        >
                            {isEditMode && (
                                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.8rem', color: '#f59e0b' }}>
                                    ✏️
                                </div>
                            )}

                            <div style={{
                                padding: '1rem',
                                borderRadius: '50%',
                                background: isReserved
                                    ? '#f59e0b'
                                    : hasActiveOrder
                                        ? 'var(--color-primary)'
                                        : isOccupied ? '#ef4444' : '#10b981',
                                color: 'white'
                            }}>
                                {table.zone === 'salon' ? <Utensils /> : <Armchair />}
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{table.name}</h3>
                                <span style={{
                                    fontSize: '0.9rem',
                                    color: isReserved
                                        ? '#f59e0b'
                                        : hasActiveOrder
                                            ? 'var(--color-primary)'
                                            : isOccupied ? '#ef4444' : '#10b981',
                                    fontWeight: 'bold'
                                }}>
                                    {isReserved ? 'RESERVADA' : hasActiveOrder ? 'En preparación' : isOccupied ? 'Ocupada' : 'Libre'}
                                </span>
                                {hasActiveOrder && (
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                                        {tableOrders[table.id].length} productos
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Edit Modal */}
            {isEditMode && editingTable && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid #f59e0b' }}>
                        <h2 style={{ margin: 0 }}>Editar Mesa</h2>

                        <div>
                            <label>Nombre de la Mesa</label>
                            <input
                                type="text"
                                value={editingTable.name}
                                onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid #666', color: 'white' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="reserved"
                                checked={editingTable.isReserved || false}
                                onChange={(e) => setEditingTable({ ...editingTable, isReserved: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <label htmlFor="reserved">Marcar como RESERVADA</label>
                        </div>

                        {editingTable.status === 'occupied' && (
                            <button
                                onClick={() => {
                                    if (confirm('¿Liberar mesa y borrar cuenta actual?')) {
                                        closeTable(editingTable.id);
                                        setEditingTable(null);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#3b82f6',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '1rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                🧹 Liberar / Desocupar Mesa
                            </button>
                        )}

                        {editingTable.status === 'occupied' && (
                            <button
                                onClick={() => {
                                    if (confirm('¿Liberar mesa y borrar cuenta actual?')) {
                                        closeTable(editingTable.id);
                                        setEditingTable(null);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#3b82f6',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '1rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                🧹 Liberar / Desocupar Mesa
                            </button>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={() => {
                                    if (confirm('¿Seguro que quieres eliminar esta mesa?')) {
                                        deleteTable(editingTable.id);
                                        setEditingTable(null);
                                    }
                                }}
                                style={{ flex: 1, padding: '0.75rem', background: '#ef4444', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Eliminar Mesa
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                style={{ flex: 1, padding: '0.75rem', background: '#10b981', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Guardar
                            </button>
                        </div>
                        <button onClick={() => setEditingTable(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableSelection;
