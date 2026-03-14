import React from 'react';
import { motion } from 'framer-motion';
import { Wine, Clock } from 'lucide-react';
import TableOrderPreview from './TableOrderPreview';

const TableTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = React.useState(0);

    React.useEffect(() => {
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
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: elapsed > 30 ? '#ef4444' : elapsed > 20 ? '#fbbf24' : 'rgba(255,255,255,0.8)',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            color: elapsed > 20 ? 'white' : 'black',
            border: '1px solid rgba(0,0,0,0.2)',
            zIndex: 10
        }}>
            <Clock size={10} />
            {elapsed}'
        </div>
    );
};

const Stool = ({ table, handleTableSelect, isEditMode, isTransferMode, sourceTable, tableOrderItems, tableBillItems, tableKitchenOrders, reservations }) => {
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

    let minStartTime = null;
    tableKitchenOrders.forEach(o => {
        if (o.status === 'pending') {
            if (!minStartTime || new Date(o.created_at) < new Date(minStartTime)) {
                minStartTime = o.created_at;
            }
        }
    });

    const getStatusColor = () => {
        if (isTransferMode && sourceTable?.id === table.id) return '#f59e0b';
        if (isReserved) return '#f59e0b';
        if (hasActiveOrder) return 'var(--color-primary)';
        if (isOccupied) return '#ef4444';
        return '#10b981';
    };

    const bgColor = getStatusColor();

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTableSelect(table)}
            style={{
                position: 'absolute',
                top: table.top,
                left: table.left,
                width: '75px',
                height: '75px',
                borderRadius: '50%',
                background: bgColor,
                border: isEditMode ? '2px dashed #f59e0b' : (isTransferMode && sourceTable?.id === table.id ? '3px solid white' : '2px solid rgba(255,255,255,0.5)'),
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isOccupied ? `0 0 15px ${bgColor}` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 5,
                animation: isTransferMode && !sourceTable && (isOccupied || hasActiveOrder) ? 'pulse 2s infinite' : 'none'
            }}
        >
            {isOccupied && minStartTime && !isEditMode && <TableTimer startTime={minStartTime} />}
            <Wine size={20} />
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '2px', textAlign: 'center', lineHeight: '1' }}>
                {table.name.replace('Barra ', 'B')}
            </span>
            {hasActiveOrder && (
                <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'white',
                    color: bgColor,
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {tableOrderItems.length + tableKitchenOrders.length + tableBillItems.length}
                </div>
            )}
        </motion.button>
    );
};

const BarMap = ({ tables, handleTableSelect, isEditMode, isTransferMode, sourceTable, tableOrders, tableBills, kitchenOrders, reservations }) => {
    // We expect 12 tables for the bar:
    // 2 on the short side (right), 10 on the long side (bottom)
    
    // Hardcoded coordinates for the 12 spots to match an inverted L-shaped layout (short side up on the right)
    const layoutCoords = [
        // Short side (Right vertical) - 2 stools (OUTSIDE the bar on the right)
        // Bar right edge is at 1380 + 100 = 1480px. So stools start at 1490px
        { top: '100px', left: '1490px' },
        { top: '220px', left: '1490px' },
        
        // Long side (Bottom horizontal) - 10 stools 
        // We will space them ~140px apart, going from right (1380px) to left (120px)
        { top: '440px', left: '1380px' }, // B3
        { top: '440px', left: '1240px' }, // B4
        { top: '440px', left: '1100px' }, // B5
        { top: '440px', left: '960px' },  // B6
        { top: '440px', left: '820px' },  // B7
        { top: '440px', left: '680px' },  // B8
        { top: '440px', left: '540px' },  // B9
        { top: '440px', left: '400px' },  // B10
        { top: '440px', left: '260px' },  // B11
        { top: '440px', left: '120px' },  // B12
    ];

    const mappedTables = tables.map((table, index) => {
        if (index < layoutCoords.length) {
            return { ...table, ...layoutCoords[index] };
        } else {
            // Dynamic overflow 
            const overflowIndex = index - layoutCoords.length;
            const row = Math.floor(overflowIndex / 10);
            const col = overflowIndex % 10;
            return { 
                ...table, 
                top: `${550 + (row * 90)}px`, 
                left: `${20 + (col * 90)}px` 
            };
        }
    });

    return (
        <div style={{
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '20px'
        }}>
            <div style={{
                position: 'relative',
                minWidth: '1600px',
                minHeight: '650px',
                margin: '0 auto',
                background: 'var(--color-surface)',
                borderRadius: '16px',
                border: '1px solid var(--border-strong)',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.05)'
            }}>
            {/* Title or decorative element */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '30px',
                fontSize: '2rem',
                fontWeight: '900',
                color: 'var(--border-strong)',
                opacity: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '5px'
            }}>
                Barra
            </div>

            {/* The Physical Counter - Inverted L Shape (Short arm on right) */}
            {/* Top/Vertical piece of the L on the RIGHT */}
            <div style={{
                position: 'absolute',
                top: '80px',
                left: '1380px',
                width: '100px',
                height: '250px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '4px solid var(--border-strong)',
                borderBottom: 'none',
                borderRadius: '12px 12px 0 0',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z\' fill=\'rgba(255,255,255,0.03)\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            }}>
                <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '20px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }}></div>
            </div>

            {/* Bottom/Horizontal piece of the L */}
            <div style={{
                position: 'absolute',
                top: '330px',
                left: '50px',
                width: '1430px',
                height: '80px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '4px solid var(--border-strong)',
                borderRadius: '12px 0 12px 12px',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z\' fill=\'rgba(255,255,255,0.03)\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            }}>
                 <div style={{ position: 'absolute', right: '10px', left: '10px', top: '10px', height: '20px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }}></div>
            </div>
            
            {/* The corner fix for borders (removing the inner corner border) */}
            <div style={{
                position: 'absolute',
                top: '330px',
                left: '1384px',
                width: '92px',
                height: '4px',
                backgroundColor: 'rgba(59, 130, 246, 1)',
                opacity: 0.1, // match inner bg
                zIndex: 2
            }}></div>

            {/* Bartender zone (Inside the L, Top Left) */}
            <div style={{
                position: 'absolute',
                top: '120px',
                left: '150px',
                width: '500px',
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.3
            }}>
                 <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>Zona de Trabajo / Camareros</span>
            </div>

            {/* Stools */}
            {mappedTables.map(table => (
                <Stool
                    key={table.id}
                    table={table}
                    handleTableSelect={handleTableSelect}
                    isEditMode={isEditMode}
                    isTransferMode={isTransferMode}
                    sourceTable={sourceTable}
                    tableOrderItems={tableOrders[table.id] || []}
                    tableBillItems={tableBills[table.id] || []}
                    tableKitchenOrders={kitchenOrders.filter(o => o.table === table.name)}
                    reservations={reservations}
                />
            ))}
            </div>
        </div>
    );
};

export default BarMap;
