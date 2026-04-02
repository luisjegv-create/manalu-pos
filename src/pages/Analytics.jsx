import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    FileText,
    UtensilsCrossed,
    Wallet,
    ArrowLeft,
    TrendingUp,
    Users,
    DollarSign,
    ChevronRight,
    Search,
    Download,
    CheckCircle,
    AlertCircle,
    Info,
    Menu,
    Trash2,
    Printer,
    Receipt,
    Calendar,
    X as CloseIcon,
    Calculator,
    Coins
} from 'lucide-react';
import CashCalculator from '../components/CashCalculator';
import { useOrder } from '../context/OrderContext';
import { useInventory } from '../context/InventoryContext';
import { printBillTicket, printCashCloseTicket } from '../utils/printHelpers';
import ExpenseManagement from '../components/Inventory/ExpenseManagement';

const SidebarItem = ({ id, icon: Icon, label, activeSection, setActiveSection, colors }) => (
    <button
        onClick={() => setActiveSection(id)}
        style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            width: '100%', padding: '1rem',
            background: activeSection === id ? colors.primary : 'transparent',
            color: activeSection === id ? 'white' : colors.textMuted,
            border: 'none', borderRadius: '12px', cursor: 'pointer',
            fontWeight: activeSection === id ? '700' : '500',
            transition: 'all 0.2s',
            boxShadow: activeSection === id ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none'
        }}
    >
        <Icon size={20} />
        <span>{label}</span>
        {activeSection === id && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
    </button>
);

const Analytics = () => {
    const navigate = useNavigate();
    const { salesHistory, cashCloses, performCashClose, deleteSale, deleteCashClose, syncWithCloud, syncStatus } = useOrder();
    const { salesProducts, getProductCost, expenses, restaurantInfo } = useInventory(); // Added restaurantInfo

    const [activeSection, setActiveSection] = useState('dashboard'); // dashboard | sales | menu | cash
    const [dateRange, setDateRange] = useState('today');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // State for invoice generation and expanding sales
    const [invoiceModal, setInvoiceModal] = useState({ isOpen: false, sale: null, customerData: { name: '', nif: '', address: '' } });
    const [expandedSale, setExpandedSale] = useState(null);

    // Light Theme Colors
    const colors = useMemo(() => ({
        bg: '#f1f5f9',
        surface: '#ffffff',
        text: '#1e293b',
        textMuted: '#64748b',
        border: 'rgba(0,0,0,0.08)',
        primary: '#4f46e5', // Vibrant Indigo for Card/General
        success: '#059669', // Solid Emerald for Cash
        danger: '#dc2626',
        warning: '#d97706'
    }), []);

    // Mobile Responsiveness
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) setShowMobileMenu(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        console.log("Analytics mounted. salesHistory:", salesHistory?.length);
    }, [salesHistory]);

    // --- SHARED HELPERS ---
    const getFilteredSalesInRange = useCallback((unit = 'today', offset = 0, altStart = null, altEnd = null) => {
        if (!salesHistory || !Array.isArray(salesHistory)) return [];

        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (unit === 'shift') {
            // "Jornada Actual" - since the last Z-report
            if (cashCloses && cashCloses.length > 0) {
                const latestClose = [...cashCloses].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                start = new Date(latestClose.date);
            } else {
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
            }
            end = new Date(now);
        } else if (unit === 'custom') {
            start = new Date(altStart || startDate);
            start.setHours(0,0,0,0);
            end = new Date(altEnd || endDate);
            end.setHours(23,59,59,999);
        } else if (unit === 'today') {
            const shiftDate = new Date(now);
            shiftDate.setDate(now.getDate() - offset);
            start = new Date(shiftDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(shiftDate);
            end.setHours(23, 59, 59, 999);
        } else if (unit === 'all') {
            return salesHistory;
        } else if (unit === 'week') {
            const weekOffset = offset * 7;
            start.setDate(now.getDate() - 7 - weekOffset);
            start.setHours(0, 0, 0, 0);
            end.setDate(now.getDate() - weekOffset);
            end.setHours(23, 59, 59, 999);
        } else if (unit === 'month') {
            start.setMonth(now.getMonth() - offset - 1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(now.getMonth() - offset);
            end.setHours(23, 59, 59, 999);
        }

        return salesHistory.filter(s => {
            const d = new Date(s.date);
            return unit === 'all' || (d >= start && d <= end);
        });
    }, [salesHistory, startDate, endDate, cashCloses]);

    const handleDeleteSale = async (id) => {
        if (confirm("¿Estás seguro de que quieres borrar esta venta? Esta acción no se puede deshacer.")) {
            const success = await deleteSale(id);
            if (success) {
                // The history updates automatically via context
            } else {
                alert("Error al borrar la venta.");
            }
        }
    };

    const handleReprint = (sale) => {
        const custData = sale.customer_data ? JSON.parse(sale.customer_data) : null;
        printBillTicket(
            (sale.tableId || 'Venta').toString().replace('table-', 'T'),
            typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || []),
            parseFloat(sale.total || sale.total_amount || 0),
            restaurantInfo || {},
            sale.discount_percent || 0,
            sale.is_invitation || false,
            sale.ticket_number || (sale.id || '').toString().slice(-8),
            custData,
            0.10, // Default tax
            parseFloat(sale.total || 0), // Assuming amount received was at least the total 
            parseFloat(sale.card_tips || 0)
        );
    };

    const filteredSales = useMemo(() => {
        let sales = [];
        if (dateRange === 'shift') sales = getFilteredSalesInRange('shift');
        else if (dateRange === 'yesterday') sales = getFilteredSalesInRange('today', 1);
        else if (dateRange === 'custom') sales = getFilteredSalesInRange('custom');
        else sales = getFilteredSalesInRange(dateRange, 0);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            sales = sales.filter(s => 
                (s.ticket_number || '').toLowerCase().includes(term) ||
                (s.tableId || '').toLowerCase().includes(term) ||
                (s.total || 0).toString().includes(term) ||
                (s.id || '').toLowerCase().includes(term)
            );
        }
        return sales;
    }, [dateRange, getFilteredSalesInRange, searchTerm]);

    const comparisonSales = useMemo(() => {
        if (dateRange === 'yesterday') return getFilteredSalesInRange('today', 2);
        if (dateRange === 'custom') return [];
        return getFilteredSalesInRange(dateRange, 1);
    }, [dateRange, getFilteredSalesInRange]);

    // --- DASHBOARD DATA ---
    const dashboardStats = useMemo(() => {
        const getPeriodStats = (sales, exps) => {
            const revenue = sales.reduce((acc, s) => acc + (parseFloat(s.total || s.total_amount) || 0), 0);
            const totalDiscounts = sales.reduce((acc, s) => acc + (parseFloat(s.discount_amount) || 0) + (s.is_invitation ? (parseFloat(s.original_total) || 0) : 0), 0); // Need original_total handled if invitation

            const productCost = sales.reduce((acc, s) => {
                if (!s.items || !Array.isArray(s.items)) return acc;
                return acc + s.items.reduce((itemAcc, item) => {
                    const cost = item.isWine ? (item.purchasePrice || 0) : getProductCost(item.id);
                    return itemAcc + (cost * (item.quantity || 1));
                }, 0);
            }, 0);
            const generalExp = (exps || []).reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
            return { revenue, productCost, generalExp, totalDiscounts, net: revenue - productCost - generalExp };
        };

        const getFilteredExpsInRange = (unit = 'today', offset = 0) => {
            const now = new Date();
            let start = new Date();
            let end = new Date();
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            if (unit === 'today') {
                start.setDate(now.getDate() - offset);
                end.setDate(now.getDate() - offset);
            } else if (unit === 'week') {
                start.setDate(now.getDate() - 7 - (offset * 7));
                end.setDate(now.getDate() - (offset * 7));
            } else if (unit === 'month') {
                start.setMonth(now.getMonth() - offset);
                start.setDate(1);
                end.setMonth(now.getMonth() - offset + 1);
                end.setDate(0);
            }

            return expenses.filter(e => {
                const d = new Date(e.date);
                return d >= start && d <= end;
            });
        };

        const currentExps = getFilteredExpsInRange(dateRange, 0);
        const prevExps = getFilteredExpsInRange(dateRange, 1);

        const currentStats = getPeriodStats(filteredSales, currentExps);
        const prevStats = getPeriodStats(comparisonSales, prevExps);

        const totalRevenue = currentStats.revenue;
        const prevRevenue = prevStats.revenue;
        const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

        const netProfit = currentStats.net;
        const netChange = Math.abs(prevStats.net) > 0 ? ((currentStats.net - prevStats.net) / Math.abs(prevStats.net)) * 100 : 0;

        const ticketCount = filteredSales.length;
        const prevTicketCount = comparisonSales.length;
        const ticketChange = prevTicketCount > 0 ? ((ticketCount - prevTicketCount) / prevTicketCount) * 100 : 0;

        const avgTicket = ticketCount > 0 ? totalRevenue / ticketCount : 0;
        const prevAvgTicket = prevTicketCount > 0 ? prevRevenue / prevTicketCount : 0;
        const avgChange = prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;

        // Payment Split
        const cashRaw = filteredSales.filter(s => s.paymentMethod === 'Efectivo').reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0);
        const cardRaw = filteredSales.filter(s => s.paymentMethod === 'Tarjeta').reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0);
        const cardTipsRaw = filteredSales.reduce((acc, s) => acc + (parseFloat(s.card_tips) || 0), 0);

        // Hourly Heatmap Data (0-23h)
        const hours = new Array(24).fill(0);
        filteredSales.forEach(s => {
            const h = new Date(s.date).getHours();
            hours[h] += (parseFloat(s.total) || 0);
        });
        const maxHour = Math.max(...hours, 1); // Avoid div by 0

        return {
            totalRevenue, revenueChange,
            netProfit, netChange,
            ticketCount, ticketChange,
            avgTicket, avgChange,
            cashRaw, cardRaw, cardTipsRaw,
            totalDiscounts: currentStats.totalDiscounts,
            hours, maxHour
        };
    }, [filteredSales, comparisonSales, expenses, getProductCost, dateRange]);

    const categoryStats = useMemo(() => {
        const stats = {
            'Comida': { revenue: 0, count: 0, color: colors.primary },
            'Bebida': { revenue: 0, count: 0, color: colors.success },
            'Vinos': { revenue: 0, count: 0, color: colors.warning },
            'Otros': { revenue: 0, count: 0, color: colors.textMuted }
        };

        filteredSales.forEach(sale => {
            const items = typeof sale.items === 'string' ? JSON.parse(sale.items || '[]') : (sale.items || []);
            items.forEach(item => {
                let cat = 'Otros';
                const lowerCat = String(item.category || '').toLowerCase();
                const lowerName = String(item.name || '').toLowerCase();
                
                if (lowerCat.includes('bebida') || lowerCat.includes('refresco')  || lowerCat.includes('café') || lowerCat.includes('cerveza') || lowerCat.includes('copa') || lowerCat.includes('agua')) cat = 'Bebida';
                else if (lowerCat.includes('vino')) cat = 'Vinos';
                else if (lowerCat.includes('raciones') || lowerCat.includes('tapas') || lowerCat.includes('comida') || lowerCat.includes('postre') || lowerCat.includes('bocadillo') || lowerCat.includes('plato')) cat = 'Comida';
                else if (lowerName.includes('cerveza') || lowerName.includes('caña') || lowerName.includes('doble')) cat = 'Bebida';
                
                if (!stats[cat]) stats[cat] = { revenue: 0, count: 0, color: colors.textMuted };
                stats[cat].revenue += (parseFloat(item.price) * (item.quantity || 1));
                stats[cat].count += (item.quantity || 1);
            });
        });

        return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
    }, [filteredSales, colors]);

    const exportToCSV = () => {
        const headers = ["Fecha", "ID", "Mesa", "Metodo", "Total"];
        const rows = filteredSales.map(s => [
            new Date(s.date).toLocaleString(),
            s.id,
            s.tableId,
            s.paymentMethod,
            s.total
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const data = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", data);
        link.setAttribute("download", `ventas_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- MENU ENGINEERING DATA ---
    const menuMatrix = useMemo(() => {
        const productStats = {};
        salesProducts.forEach(p => {
            productStats[p.id] = { ...p, sold: 0, revenue: 0, cost: getProductCost(p.id) };
        });

        salesHistory.forEach(sale => {
            if (!sale.items || !Array.isArray(sale.items)) return;
            sale.items.forEach(item => {
                if (productStats[item.id]) {
                    productStats[item.id].sold += item.quantity;
                    productStats[item.id].revenue += item.quantity * item.price;
                }
            });
        });

        const items = Object.values(productStats).filter(i => i.sold > 0); // Only active items
        const totalSold = items.reduce((acc, i) => acc + i.sold, 0);
        const avgPop = items.length ? totalSold / items.length : 0;

        const totalMargin = items.reduce((acc, i) => acc + (i.revenue - (i.cost * i.sold)), 0);
        const avgMargin = totalSold ? totalMargin / totalSold : 0;

        return items.map(item => {
            const itemMargin = item.price - item.cost;
            const isHighPop = item.sold >= avgPop;
            const isHighMargin = itemMargin >= avgMargin;
            let type = 'Perro';
            if (isHighPop && isHighMargin) type = 'Estrella';
            else if (isHighPop) type = 'Vaca Lechera';
            else if (isHighMargin) type = 'Puzzle';
            return { ...item, type, margin: itemMargin };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [salesHistory, salesProducts, getProductCost]); // Using full history for better classification sample size? Or filtered? Let's keep separate logic if needed.

    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [countedCash, setCountedCash] = useState('');
    const [closeNotes, setCloseNotes] = useState('');
    const [startingCash, setStartingCash] = useState(''); // Fondo de caja (cambio)

    const expectedCash = dashboardStats.cashRaw + parseFloat(startingCash || 0);
    const discrepancy = parseFloat(countedCash || 0) - expectedCash;

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            height: '100vh', 
            background: colors.bg, 
            color: colors.text, 
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
        }}>

            <AnimatePresence>
                {isCloseModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ 
                                maxWidth: showCalculator ? '900px' : '550px', 
                                width: '100%', 
                                padding: '2rem', 
                                background: colors.surface, borderRadius: '24px',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                border: `1px solid ${colors.border}`,
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                transition: 'max-width 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: colors.text, margin: 0 }}>Cierre de Caja (Z)</h2>
                                <button 
                                    onClick={() => setIsCloseModalOpen(false)}
                                    style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}
                                >
                                    <CloseIcon size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: showCalculator ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                                {/* Left Side: Summaries and Inputs */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>Ventas Sistema</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: colors.text }}>{dashboardStats.totalRevenue.toFixed(2)}€</div>
                                        </div>
                                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>Cobro Tarjeta</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: colors.primary }}>{dashboardStats.cardRaw.toFixed(2)}€</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', color: colors.textMuted, fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: '700' }}>FONDO INICIAL (CAMBIO)</label>
                                            <input
                                                type="number"
                                                style={{ 
                                                    width: '100%', padding: '0.85rem', fontSize: '1.1rem', textAlign: 'center', 
                                                    background: '#f8fafc', border: `2px solid ${colors.border}`, 
                                                    borderRadius: '12px', color: colors.primary, outline: 'none', fontWeight: '800'
                                                }}
                                                value={startingCash}
                                                onChange={(e) => setStartingCash(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <label style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: '700' }}>EFECTIVO CONTADO</label>
                                                <button 
                                                    onClick={() => setShowCalculator(!showCalculator)}
                                                    style={{ 
                                                        background: showCalculator ? colors.primary : 'transparent', 
                                                        border: `1px solid ${colors.primary}`,
                                                        color: showCalculator ? 'white' : colors.primary,
                                                        borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem',
                                                        fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                                    }}
                                                >
                                                    <Calculator size={12} /> {showCalculator ? 'Ocultar' : 'Calcular'}
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                placeholder={`Esperado: ${expectedCash.toFixed(2)}€`}
                                                style={{ 
                                                    width: '100%', padding: '0.85rem', fontSize: '1.1rem', textAlign: 'center', 
                                                    background: '#f8fafc', border: `2px solid ${Math.abs(discrepancy) < 0.05 ? colors.success : (countedCash ? colors.danger : colors.border)}`, 
                                                    borderRadius: '12px', color: colors.success, outline: 'none', fontWeight: '900'
                                                }}
                                                value={countedCash}
                                                onChange={(e) => setCountedCash(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '1rem',
                                        background: Math.abs(discrepancy) < 0.05 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                        borderRadius: '16px',
                                        textAlign: 'center',
                                        border: `1px dashed ${Math.abs(discrepancy) < 0.05 ? colors.success : colors.danger}`
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: '700' }}>DESCUADRE DE CAJA</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: '900', color: Math.abs(discrepancy) < 0.05 ? colors.success : colors.danger }}>
                                            {discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)}€
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: colors.textMuted, fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: '700' }}>NOTAS / OBSERVACIONES</label>
                                        <textarea
                                            style={{ 
                                                width: '100%', padding: '0.85rem', height: '80px', background: '#f8fafc', 
                                                border: `1px solid ${colors.border}`, borderRadius: '12px', outline: 'none', 
                                                resize: 'none', color: colors.text, fontSize: '0.9rem' 
                                            }}
                                            value={closeNotes}
                                            onChange={(e) => setCloseNotes(e.target.value)}
                                            placeholder="Ej: Fallo en el cambio de lotería..."
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button
                                            onClick={() => setIsCloseModalOpen(false)}
                                            style={{ 
                                                flex: 1, padding: '1rem', background: 'white', 
                                                border: `1px solid ${colors.border}`, borderRadius: '12px', 
                                                color: colors.textMuted, cursor: 'pointer', fontWeight: '700' 
                                            }}
                                        >
                                            Cerrar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const finalClose = {
                                                    efectivo: parseFloat(countedCash || 0),
                                                    efectivo_esperado: expectedCash,
                                                    fondo_caja: parseFloat(startingCash || 0),
                                                    tarjeta: dashboardStats.cardRaw,
                                                    cardTips: dashboardStats.cardTipsRaw,
                                                    total: dashboardStats.totalRevenue,
                                                    notes: closeNotes,
                                                    salesCount: dashboardStats.ticketCount
                                                };
                                                const result = await performCashClose(finalClose);
                                                if (result && !result.error) {
                                                    printCashCloseTicket(result, restaurantInfo);
                                                    setIsCloseModalOpen(false);
                                                    alert("✅ Cierre Z guardado e impreso correctamente");
                                                } else {
                                                    alert(`❌ Error al guardar el cierre: ${result?.error || "Desconocido"}`);
                                                }
                                            }}
                                            disabled={!countedCash}
                                            style={{ 
                                                flex: 2, padding: '1rem', background: colors.success, 
                                                border: 'none', borderRadius: '12px', color: 'white', 
                                                fontWeight: '900', cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                                opacity: !countedCash ? 0.5 : 1
                                            }}
                                        >
                                            REALIZAR CIERRE Z
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Calculator (Conditional) */}
                                {showCalculator && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{ borderLeft: `1px solid ${colors.border}`, paddingLeft: '1rem' }}
                                    >
                                        <CashCalculator 
                                            colors={colors} 
                                            onTotalChange={(total) => setCountedCash(total > 0 ? total.toString() : '')} 
                                        />
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* MOBILE TOP BAR */}
            {isMobile && (
                <div style={{
                    padding: '0.75rem 1rem',
                    background: colors.surface,
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 1100,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <button
                        onClick={() => setShowMobileMenu(true)}
                        style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer' }}
                    >
                        <Menu size={24} />
                    </button>
                    <img src="/logo-principal.png" alt="Logo" style={{ height: '32px' }} />
                    <div style={{ width: '24px' }} /> {/* Spacer */}
                </div>
            )}

            {/* SIDEBAR */}
            <div style={{
                width: isMobile ? '280px' : '260px',
                borderRight: `1px solid ${colors.border}`,
                padding: '1.5rem',
                display: isMobile ? (showMobileMenu ? 'flex' : 'none') : 'flex',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                height: '100%',
                background: colors.surface,
                zIndex: 1000,
                boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,0.1)' : 'none'
            }}>

                {isMobile && (
                    <button
                        onClick={() => setShowMobileMenu(false)}
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8' }}
                    >
                        <CloseIcon size={24} />
                    </button>
                )}

                {/* Logo Area (Hidden on mobile as it is in top bar) */}
                {!isMobile && (
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <img src="/logo-principal.png" alt="Logo" style={{ width: '120px', opacity: 0.9 }} />
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', color: colors.primary, paddingLeft: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={18} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: colors.text }}>Manalu Intel</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" activeSection={activeSection} setActiveSection={setActiveSection} colors={colors} />
                    <SidebarItem id="sales" icon={Receipt} label="Ventas" activeSection={activeSection} setActiveSection={setActiveSection} colors={colors} />
                    <SidebarItem id="menu" icon={UtensilsCrossed} label="Ingeniería Menú" activeSection={activeSection} setActiveSection={setActiveSection} colors={colors} />
                    <SidebarItem id="cash" icon={Wallet} label="Caja y Z" activeSection={activeSection} setActiveSection={setActiveSection} colors={colors} />
                    <SidebarItem id="expenses" icon={DollarSign} label="Gastos" activeSection={activeSection} setActiveSection={setActiveSection} colors={colors} />
                </div>

                <button
                    onClick={() => navigate('/tables')}
                    style={{
                        marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted,
                        padding: '1rem', borderRadius: '12px', cursor: 'pointer',
                        fontWeight: '700', fontSize: '1rem', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = colors.text; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}
                >
                    <ArrowLeft size={18} /> Volver al TPV
                </button>
            </div>

            {/* OVERLAY FOR MOBILE SIDEBAR */}
            {isMobile && showMobileMenu && (
                <div
                    onClick={() => setShowMobileMenu(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
                />
            )}

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2rem' }}>

                {/* HEADER & DATE FILTER */}
                <header style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'stretch' : 'center',
                    marginBottom: '2.5rem',
                    gap: '1.5rem'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', color: colors.text, letterSpacing: '-0.02em' }}>
                            {activeSection === 'dashboard' && 'Panel Principal'}
                            {activeSection === 'sales' && 'Reporte de Ventas'}
                            {activeSection === 'menu' && 'Ingeniería de Menú'}
                            {activeSection === 'cash' && 'Gestión de Efectivo'}
                            {activeSection === 'expenses' && 'Control de Gastos'}
                        </h1>
                        <p style={{ color: colors.textMuted, marginTop: '0.35rem', fontSize: '1rem', fontWeight: '500' }}>
                           {dateRange === 'shift' ? '✨ Turno en curso' : `Periodo: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`}
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '1rem',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {syncStatus.isSyncing && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontSize: '0.9rem' }}>
                                    <div className="spin-animation">🔄</div> 
                                    Sincronizando día {syncStatus.progress} de {syncStatus.totalSteps}...
                                </div>
                            )}
                            <button
                                onClick={syncWithCloud}
                                disabled={syncStatus.isSyncing}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                    border: '1px solid #3b82f6', padding: '0.5rem 1rem', borderRadius: '8px',
                                    cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                Refrescar Datos
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: 'var(--color-surface)', color: 'var(--color-text)',
                                    border: '1px solid var(--border-strong)', padding: '0.5rem 1rem', borderRadius: '8px',
                                    cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                <ArrowLeft size={18} /> Volver
                            </button>
                        </div>
                        {!isMobile && activeSection === 'sales' && (
                            <button
                                onClick={exportToCSV}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.75rem 1.25rem', background: 'white',
                                    color: colors.text, border: `1px solid ${colors.border}`,
                                    borderRadius: '12px', cursor: 'pointer', fontWeight: '700',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)', transition: 'all 0.2s',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Download size={18} /> Exportar
                            </button>
                        )}
                        <div style={{ 
                            display: 'flex', padding: '0.35rem', gap: '0.35rem', flexWrap: 'wrap',
                            background: colors.surface, borderRadius: '14px', border: `1px solid ${colors.border}`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}>
                            {['shift', 'today', 'yesterday', 'week', 'month', 'all', 'custom'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setDateRange(r)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        borderRadius: '10px',
                                        background: dateRange === r ? colors.primary : 'transparent',
                                        color: dateRange === r ? 'white' : colors.textMuted,
                                        fontSize: '0.8rem', fontWeight: '700',
                                        cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                                    }}
                                >
                                    {r === 'shift' ? 'Turno' : r === 'today' ? 'Hoy' : r === 'yesterday' ? 'Ayer' : r === 'week' ? 'Semana' : r === 'month' ? 'Mes' : r === 'all' ? 'Todo' : '📅'}
                                </button>
                            ))}
                        </div>

                        {dateRange === 'custom' && (
                            <div style={{ 
                                padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                background: 'white', borderRadius: '14px', border: `1px solid ${colors.border}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                            }}>
                                <Calendar size={18} color={colors.textMuted} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: colors.text, fontSize: '0.85rem', outline: 'none', width: '120px', fontWeight: '600' }}
                                    />
                                    <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>→</span>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: colors.text, fontSize: '0.85rem', outline: 'none', width: '120px', fontWeight: '600' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* --- DASHBOARD VIEW --- */}
                {activeSection === 'dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* KPI CARDS */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                            gap: isMobile ? '1rem' : '1.5rem'
                        }}>
                            <div style={{ 
                                padding: '1.5rem', background: colors.surface, borderRadius: '20px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}`,
                                transition: 'transform 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: colors.textMuted, fontSize: '0.85rem', fontWeight: '700' }}>Ventas Brutas</span>
                                    <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: colors.primary }}>
                                        <DollarSign size={18} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: colors.text }}>{dashboardStats.totalRevenue.toFixed(2)}€</div>
                                <div style={{ 
                                    fontSize: '0.8rem', fontWeight: '800', marginTop: '0.5rem',
                                    color: dashboardStats.revenueChange >= 0 ? colors.success : colors.danger,
                                    display: 'flex', alignItems: 'center', gap: '0.25rem'
                                }}>
                                    {dashboardStats.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats.revenueChange).toFixed(1)}%
                                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>vs prev.</span>
                                </div>
                            </div>

                            <div style={{ 
                                padding: '1.5rem', background: colors.surface, borderRadius: '20px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: colors.textMuted, fontSize: '0.85rem', fontWeight: '700' }}>Beneficio Neto</span>
                                    <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: colors.success }}>
                                        <TrendingUp size={18} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: dashboardStats.netProfit >= 0 ? colors.success : colors.danger }}>
                                    {dashboardStats.netProfit.toFixed(2)}€
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                                    <div style={{ 
                                        fontSize: '0.8rem', fontWeight: '800', 
                                        color: dashboardStats.netChange >= 0 ? colors.success : colors.danger 
                                    }}>
                                        {dashboardStats.netChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats.netChange).toFixed(1)}%
                                    </div>
                                    {dashboardStats.totalDiscounts > 0 && (
                                        <div style={{ fontSize: '0.7rem', color: colors.danger, fontWeight: '700', padding: '0.15rem 0.4rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px' }}>
                                            Dec: -{dashboardStats.totalDiscounts.toFixed(2)}€
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ 
                                padding: '1.5rem', background: colors.surface, borderRadius: '20px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: colors.textMuted, fontSize: '0.85rem', fontWeight: '700' }}>Tickets</span>
                                    <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: colors.primary }}>
                                        <FileText size={18} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: colors.text }}>{dashboardStats.ticketCount}</div>
                                <div style={{ 
                                    fontSize: '0.8rem', fontWeight: '800', marginTop: '0.5rem',
                                    color: dashboardStats.ticketChange >= 0 ? colors.success : colors.danger 
                                }}>
                                    {dashboardStats.ticketChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats.ticketChange).toFixed(1)}%
                                </div>
                            </div>

                            <div style={{ 
                                padding: '1.5rem', background: colors.surface, borderRadius: '20px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: colors.textMuted, fontSize: '0.85rem', fontWeight: '700' }}>Ticket Medio</span>
                                    <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: colors.warning }}>
                                        <Users size={18} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: colors.text }}>{dashboardStats.avgTicket.toFixed(2)}€</div>
                                <div style={{ 
                                    fontSize: '0.8rem', fontWeight: '800', marginTop: '0.5rem',
                                    color: dashboardStats.avgChange >= 0 ? colors.success : colors.danger 
                                }}>
                                    {dashboardStats.avgChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats.avgChange).toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        {/* Net Profit Details Alert Tip */}
                        <div style={{ 
                            padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', 
                            background: '#f8fafc', borderRadius: '16px', border: `1px solid ${colors.border}`
                        }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '10px' }}>
                                <Info size={20} color={colors.primary} />
                            </div>
                            <div style={{ fontSize: '0.95rem', color: colors.text, fontWeight: '500', lineHeight: '1.5' }}>
                                <b style={{ color: colors.primary, fontWeight: '800' }}>Cálculo Intelectual:</b> El beneficio neto mostrado es una estimación real obtenida restando el <b style={{ color: colors.text }}>coste de producto (escandallos)</b> y los <b style={{ color: colors.text }}>gastos generales</b> facturados en el periodo.
                            </div>
                        </div>

                        {/* CHARTS ROW */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? '1.5rem' : '1.5rem' }}>
                            {/* HOURLY HEATMAP */}
                            <div style={{ padding: '1.5rem', background: colors.surface, borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}` }}>
                                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '800', color: colors.text }}>Ventas por Hora</h3>
                                <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '4px', paddingBottom: '1.5rem' }}>
                                    {dashboardStats.hours.map((val, h) => (
                                        <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                                            <div 
                                                title={`${h}h: ${val.toFixed(2)}€`}
                                                style={{
                                                    width: '100%',
                                                    height: `${(val / dashboardStats.maxHour) * 100}%`,
                                                    background: val > 0 ? colors.primary : '#f1f5f9',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'all 0.3s ease',
                                                    minHeight: val > 0 ? '4px' : '2px',
                                                    boxShadow: val > 0 ? '0 -2px 8px rgba(59, 130, 246, 0.2)' : 'none'
                                                }} 
                                            />
                                            {h % 4 === 0 && <span style={{ fontSize: '0.65rem', color: colors.textMuted, fontWeight: '700' }}>{h}h</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PAYMENT MIX */}
                            <div style={{ padding: '1.5rem', background: colors.surface, borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}` }}>
                                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '800', color: colors.text }}>Métodos de Pago</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {[
                                        { label: 'Tarjeta', value: dashboardStats.cardRaw, color: colors.primary, icon: Printer },
                                        { label: 'Efectivo', value: dashboardStats.cashRaw, color: colors.success, icon: Wallet },
                                        { label: 'Propina (TJ)', value: dashboardStats.cardTipsRaw, color: colors.warning, icon: TrendingUp }
                                    ].map((pm, idx) => (
                                        <div key={idx}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '700' }}>
                                                <span style={{ color: colors.text }}>{pm.label}</span>
                                                <span style={{ color: pm.color }}>{pm.value.toFixed(2)}€</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    width: `${(pm.value / (dashboardStats.totalRevenue + (pm.label.includes('Propina') ? pm.value : 0) || 1)) * 100}%`, 
                                                    height: '100%', background: pm.color, borderRadius: '4px' 
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CATEGORY SUMMARY CARDS */}
                        <div style={{ padding: '1.5rem', background: colors.surface, borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}` }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '800', color: colors.text }}>Reparto por Categoría</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '1rem' }}>
                                {categoryStats.map((cat, idx) => (
                                    <div key={idx} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: `1px solid ${colors.border}`, borderLeft: `5px solid ${cat.color}` }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: colors.textMuted, marginBottom: '0.25rem' }}>{cat.name.toUpperCase()}</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: colors.text }}>{cat.revenue.toFixed(2)}€</div>
                                        <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginTop: '0.25rem' }}>{cat.count} uds. vendidas</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SALES VIEW --- */}
                {activeSection === 'sales' && (
                    <div style={{ padding: isMobile ? '0.5rem' : '0' }}>
                        {/* SEARCH BAR */}
                        <div style={{ 
                            marginBottom: '1.5rem', background: colors.surface, borderRadius: '16px', 
                            padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}`
                        }}>
                             <Search size={20} color={colors.textMuted} />
                             <input 
                                type="text"
                                placeholder="Buscar por ticket, mesa, importe..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '1rem', color: colors.text, fontWeight: '500' }}
                             />
                             {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><CloseIcon size={18}/></button>}
                        </div>

                        {filteredSales.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                                <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No se han encontrado registros para este periodo.</p>
                                <p style={{ fontSize: '0.9rem' }}>Prueba a cambiar el filtro arriba (ej: pulsando en "Semana" o "Mes") o pulsa el botón "Refrescar Datos".</p>
                                {syncStatus.sales.error && (
                                    <div style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                        Error de conexión: {syncStatus.sales.error}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="glass-panel animate-in" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                                {isMobile ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date)).map((sale) => (
                                            <React.Fragment key={sale.id}>
                                            <div style={{ 
                                                padding: '1.25rem', background: colors.surface, borderRadius: '16px', 
                                                marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                                border: expandedSale === sale.id ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                                                transition: 'all 0.2s' 
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', cursor: 'pointer' }} onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}>
                                                    <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '700' }}>{new Date(sale.date).toLocaleString()}</span>
                                                    <div style={{ textAlign: 'right' }}>
                                                        {sale.discount_amount > 0 && <div style={{ fontSize: '0.7rem', color: colors.danger, fontWeight: '800' }}>Desc: -{sale.discount_amount.toFixed(2)}€</div>}
                                                        {sale.is_invitation && <div style={{ fontSize: '0.7rem', color: colors.warning, fontWeight: '800' }}>🎁 INVITACIÓN</div>}
                                                        <span style={{ fontWeight: '900', color: colors.text, fontSize: '1.1rem' }}>{parseFloat(sale.total || 0).toFixed(2)}€</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ fontSize: '0.9rem', color: colors.textMuted, fontWeight: '600' }}>
                                                        Mesa: <b style={{ color: colors.text }}>{(sale.tableId || '-').toString().replace('table-', 'T')}</b>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <span style={{
                                                            padding: '6px 12px', borderRadius: '8px',
                                                            background: sale.paymentMethod === 'Efectivo' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(79, 70, 229, 0.15)',
                                                            color: sale.paymentMethod === 'Efectivo' ? '#059669' : '#4f46e5',
                                                            border: `1px solid ${sale.paymentMethod === 'Efectivo' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(79, 70, 229, 0.3)'}`,
                                                            fontSize: '0.75rem', fontWeight: '900',
                                                            textTransform: 'uppercase', letterSpacing: '0.02em'
                                                        }}>
                                                            {sale.paymentMethod}
                                                        </span>
                                                        <button onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)} style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem', borderRadius: '8px', color: colors.textMuted }}><Info size={18} /></button>
                                                        <button onClick={() => handleReprint(sale)} style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', padding: '0.4rem', borderRadius: '8px', color: colors.success }}><Printer size={18} /></button>
                                                        <button onClick={() => handleDeleteSale(sale.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '0.4rem', borderRadius: '8px', color: colors.danger }}><Trash2 size={16} /></button>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedSale === sale.id && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: '800', letterSpacing: '0.05em' }}>DETALLE DE PEDIDO</div>
                                                                { (typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || [])).map((item, idx) => (
                                                                    <div key={idx} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                            <span style={{ fontWeight: '700', color: colors.text, fontSize: '0.85rem' }}>{item.quantity}x {item.name}</span>
                                                                            {item.notes && <span style={{ color: colors.warning, fontSize: '0.7rem', fontWeight: '600' }}>📝 {item.notes}</span>}
                                                                        </div>
                                                                        <span style={{ fontWeight: '800', color: colors.success }}>{(item.price * item.quantity).toFixed(2)}€</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${colors.border}` }}>
                                                <th style={{ padding: '1.25rem', textAlign: 'left', color: colors.textMuted, fontWeight: '800', letterSpacing: '0.05em' }}>FECHA Y HORA</th>
                                                <th style={{ padding: '1.25rem', textAlign: 'left', color: colors.textMuted, fontWeight: '800', letterSpacing: '0.05em' }}>TICKET</th>
                                                <th style={{ padding: '1.25rem', textAlign: 'left', color: colors.textMuted, fontWeight: '800', letterSpacing: '0.05em' }}>MESA</th>
                                                <th style={{ padding: '1.25rem', textAlign: 'left', color: colors.textMuted, fontWeight: '800', letterSpacing: '0.05em' }}>METODO</th>
                                                <th style={{ padding: '1.25rem', textAlign: 'right', color: colors.textMuted, fontWeight: '800', letterSpacing: '0.05em' }}>TOTAL</th>
                                                <th style={{ padding: '1.25rem', textAlign: 'center', color: colors.textMuted, fontWeight: '800', letterSpacing: '0.05em' }}>ACCIONES</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date)).map((sale) => (
                                                <React.Fragment key={sale.id}>
                                                    <tr 
                                                        style={{ 
                                                            borderBottom: `1px solid ${colors.border}`, 
                                                            cursor: 'pointer', 
                                                            background: expandedSale === sale.id ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                                                            transition: 'all 0.2s' 
                                                        }}
                                                        onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                                                    >
                                                        <td style={{ padding: '1.25rem', color: colors.text, fontWeight: '600' }}>{new Date(sale.date).toLocaleString()}</td>
                                                        <td style={{ padding: '1.25rem', fontFamily: 'monospace', color: colors.textMuted, fontWeight: '700' }}>#{sale.ticket_number || sale.id?.toString().slice(-6).toUpperCase()}</td>
                                                        <td style={{ padding: '1.25rem', color: colors.text, fontWeight: '700' }}>{(sale.tableId || '-').toString().replace('table-', 'T')}</td>
                                                        <td style={{ padding: '1.25rem' }}>
                                                            <span style={{
                                                                padding: '6px 14px', borderRadius: '10px',
                                                                background: sale.paymentMethod === 'Efectivo' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(79, 70, 229, 0.15)',
                                                                color: sale.paymentMethod === 'Efectivo' ? '#059669' : '#4f46e5',
                                                                border: `1px solid ${sale.paymentMethod === 'Efectivo' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(79, 70, 229, 0.3)'}`,
                                                                fontSize: '0.8rem', fontWeight: '900',
                                                                textTransform: 'uppercase', letterSpacing: '0.02em'
                                                            }}>
                                                                {sale.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: colors.text }}>{parseFloat(sale.total || 0).toFixed(2)}€</span>
                                                                {sale.discount_amount > 0 && <span style={{ fontSize: '0.7rem', color: colors.danger, fontWeight: '800' }}>Desc: -{sale.discount_amount.toFixed(2)}€</span>}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1.25rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                <button onClick={() => handleReprint(sale)} title="Reimprimir" style={{ padding: '0.5rem', borderRadius: '10px', border: 'none', background: 'rgba(16, 185, 129, 0.1)', color: colors.success, cursor: 'pointer' }}><Printer size={18} /></button>
                                                                <button onClick={() => handleDeleteSale(sale.id)} title="Borrar" style={{ padding: '0.5rem', borderRadius: '10px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: colors.danger, cursor: 'pointer' }}><Trash2 size={18} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {expandedSale === sale.id && (
                                                        <tr style={{ background: '#f8fafc' }}>
                                                            <td colSpan={6} style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}` }}>
                                                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '800', marginBottom: '1rem', letterSpacing: '0.05em' }}>DETALLE DE LA TRANSACCIÓN</div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                                                    {(typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || [])).map((item, idx) => (
                                                                        <div key={idx} style={{ padding: '1rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: `1px solid ${colors.border}` }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '0.9rem', color: colors.text }}>
                                                                                <span>{item.quantity}x {item.name}</span>
                                                                                <span style={{ color: colors.success }}>{(item.price * item.quantity).toFixed(2)}€</span>
                                                                            </div>
                                                                            {item.notes && <div style={{ marginTop: '0.4rem', color: colors.warning, fontSize: '0.75rem', fontWeight: '600' }}>📝 {item.notes}</div>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- MENU VIEW --- */}
                {activeSection === 'menu' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Summary Headers */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                            gap: isMobile ? '0.75rem' : '1rem'
                        }}>
                            {[
                                { type: 'Estrella', label: 'Estrellas', icon: '⭐', color: colors.warning, desc: 'Alta Pop / Alta Margen', strategy: 'Mantener calidad.' },
                                { type: 'Vaca Lechera', label: 'Vacas', icon: '🐮', color: colors.success, desc: 'Alta Pop / Bajo Margen', strategy: 'Optimizar costes.' },
                                { type: 'Puzzle', label: 'Puzzles', icon: '❓', color: colors.primary, desc: 'Baja Pop / Alta Margen', strategy: 'Promocionar más.' },
                                { type: 'Perro', label: 'Perros', icon: '🐕', color: colors.danger, desc: 'Baja Pop / Bajo Margen', strategy: 'Eliminar o cambiar.' }
                            ].map(group => (
                                <div key={group.type} style={{ 
                                    padding: '1.25rem', background: colors.surface, borderRadius: '16px',
                                    border: `1px solid ${colors.border}`, borderTop: `4px solid ${group.color}`,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>{group.icon}</span>
                                        <b style={{ color: colors.text, fontSize: '0.9rem', fontWeight: '800' }}>{group.label}</b>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.75rem', lineHeight: '1.4' }}>{group.desc}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: group.color, background: `${group.color}10`, padding: '0.5rem', borderRadius: '8px' }}>
                                        💡 {group.strategy}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* List by Groups */}
                        {['Estrella', 'Vaca Lechera', 'Puzzle', 'Perro'].map(type => {
                            const groupItems = menuMatrix.filter(i => i.type === type);
                            if (groupItems.length === 0) return null;

                            return (
                                <div key={type} style={{ background: colors.surface, padding: '1.5rem', borderRadius: '20px', border: `1px solid ${colors.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: colors.text, fontWeight: '800' }}>
                                        {type === 'Estrella' && <TrendingUp size={20} color={colors.warning} />}
                                        {type === 'Vaca Lechera' && <TrendingUp size={20} color={colors.success} />}
                                        {type === 'Puzzle' && <TrendingUp size={20} color={colors.primary} />}
                                        {type === 'Perro' && <TrendingUp size={20} color={colors.danger} />}
                                        {type === 'Estrella' ? 'Favoritos del Cliente' :
                                            type === 'Vaca Lechera' ? 'Clásicos Populares' :
                                                type === 'Puzzle' ? 'Oportunidades de Mejora' : 'Revisión Necesaria'}
                                        <span style={{ fontSize: '0.9rem', color: colors.textMuted, fontWeight: '600' }}>({groupItems.length} productos)</span>
                                    </h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                                        {groupItems.map(item => (
                                            <div key={item.id} style={{ 
                                                padding: '1rem', background: '#f8fafc', borderRadius: '16px', 
                                                display: 'flex', gap: '1rem', alignItems: 'center', border: `1px solid ${colors.border}`
                                            }}>
                                                <div style={{
                                                    width: '64px', height: '64px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.5rem', background: 'white',
                                                    borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}`,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                                                }}>
                                                    {(String(item.image || '').startsWith('data:image') || String(item.image || '').startsWith('http') || String(item.image || '').startsWith('/'))
                                                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : item.image || '🍽️'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: colors.text, marginBottom: '0.25rem' }}>{item.name}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                        <span style={{ color: colors.textMuted, fontWeight: '600' }}>Ventas: <b style={{ color: colors.text }}>{item.sold}</b></span>
                                                        <span style={{ color: colors.success, fontWeight: '800' }}>+{item.margin.toFixed(2)}€ marg.</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: 'white', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                                                        <div style={{ 
                                                            width: `${Math.min((item.sold / 50) * 100, 100)}%`, 
                                                            height: '100%', 
                                                            background: type === 'Estrella' ? colors.warning : colors.primary,
                                                            borderRadius: '3px'
                                                        }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {menuMatrix.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '5rem', color: colors.textMuted, background: colors.surface, borderRadius: '24px', border: `1px dashed ${colors.border}` }}>
                                <UtensilsCrossed size={48} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                                         <p style={{ fontSize: '0.9rem' }}>Realiza algunas ventas para generar la matriz de ingeniería de menú.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- CASH CLOSE VIEW --- */}
                {activeSection === 'cash' && (
                    <div style={{ background: colors.surface, borderRadius: '24px', overflow: 'hidden', border: `1px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ padding: isMobile ? '1.5rem' : '2.5rem', borderBottom: `1px solid ${colors.border}`, background: '#f8fafc' }}>
                            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: '800', color: colors.text }}>Cierre de Caja (Z)</h2>
                            <p style={{ color: colors.textMuted, fontSize: '0.95rem', fontWeight: '500' }}>Verifica el efectivo y genera el reporte fiscal del día.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0' }}>
                            {/* LEFT: SUMMARY */}
                            <div style={{ padding: isMobile ? '1.5rem' : '2.5rem', borderRight: isMobile ? 'none' : `1px solid ${colors.border}`, borderBottom: isMobile ? `1px solid ${colors.border}` : 'none' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: colors.warning, fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Receipt size={20} /> Resumen del Sistema
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600' }}>
                                        <span style={{ color: colors.textMuted }}>Ventas Totales</span>
                                        <span style={{ fontWeight: '800', color: colors.text }}>{dashboardStats.totalRevenue.toFixed(2)}€</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600' }}>
                                        <span style={{ color: colors.textMuted }}>Cobros Tarjeta</span>
                                        <span style={{ fontWeight: '800', color: colors.primary }}>{dashboardStats.cardRaw.toFixed(2)}€</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: `${colors.primary}08`, borderRadius: '12px', border: `2px dashed ${colors.primary}40`, fontSize: '0.95rem', fontWeight: '600' }}>
                                        <span style={{ color: colors.primary }}>Fondo de Caja</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <input 
                                                type="number" 
                                                value={startingCash} 
                                                onChange={(e) => setStartingCash(e.target.value)} 
                                                placeholder="0.00"
                                                style={{ width: '80px', textAlign: 'right', background: 'transparent', border: 'none', borderBottom: `2px solid ${colors.primary}`, color: colors.primary, fontWeight: '800', outline: 'none' }}
                                            />
                                            <span style={{ color: colors.primary }}>€</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: `${colors.success}08`, borderRadius: '16px', border: `1px solid ${colors.success}30`, fontSize: '1rem' }}>
                                        <span style={{ color: colors.success, fontWeight: '800' }}>Efectivo Esperado</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontWeight: '900', color: colors.success, fontSize: '1.4rem' }}>{expectedCash.toFixed(2)}€</span>
                                            <span style={{ fontSize: '0.75rem', color: colors.success, fontWeight: '600' }}>(Ventas {dashboardStats.cashRaw.toFixed(2)} + Fondo)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: ACTION */}
                            <div style={{ padding: isMobile ? '2.5rem 1.5rem' : '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f8fafc' }}>
                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <AlertCircle size={48} color={colors.textMuted} style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
                                    <p style={{ fontSize: '0.95rem', color: colors.textMuted, fontWeight: '600', lineHeight: '1.6' }}>
                                        Al realizar el Cierre Z, se generará un registro inmutable de las ventas de hoy y se reseteará el acumulado diario.
                                    </p>
                                </div>

                                {cashCloses.some(c => new Date(c.date).toDateString() === new Date().toDateString()) ? (
                                    <div style={{ textAlign: 'center', padding: '2.5rem', background: `${colors.success}10`, borderRadius: '20px', border: `1px solid ${colors.success}30`, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)' }}>
                                        <CheckCircle size={40} color={colors.success} style={{ marginBottom: '1rem' }} />
                                        <h3 style={{ color: colors.success, margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Caja Cerrada</h3>
                                        <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem', color: colors.textMuted, fontWeight: '600' }}>El cierre para el día de hoy ya ha sido registrado.</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCloseModalOpen(true)}
                                        disabled={dashboardStats.totalRevenue === 0}
                                        style={{
                                            padding: '1.25rem',
                                            background: dashboardStats.totalRevenue > 0 ? colors.success : '#e2e8f0',
                                            color: 'white',
                                            border: 'none', borderRadius: '16px',
                                            fontSize: '1.1rem', fontWeight: '900',
                                            cursor: dashboardStats.totalRevenue > 0 ? 'pointer' : 'not-allowed',
                                            boxShadow: dashboardStats.totalRevenue > 0 ? `0 10px 15px -3px ${colors.success}40` : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        EJECUTAR CIERRE Z
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* HISTORY */}
                        <div style={{ padding: '2rem', borderTop: `1px solid ${colors.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: colors.text }}>Historial de Cierres Recientes</h3>
                                <Calendar size={20} color={colors.textMuted} />
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1.5rem' }}>
                                {cashCloses.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', width: '100%', color: colors.textMuted, background: '#f8fafc', borderRadius: '16px', border: `1px dashed ${colors.border}` }}>
                                        No hay registros de cierres anteriores.
                                    </div>
                                ) : (
                                    cashCloses.sort((a,b) => new Date(b.date) - new Date(a.date)).map(close => (
                                        <div
                                            key={close.id}
                                            style={{
                                                minWidth: '240px', padding: '1.25rem', background: 'white',
                                                borderRadius: '16px', border: `1px solid ${colors.border}`,
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.02)', cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            onClick={() => {
                                                if (confirm(`¿Reimprimir Cierre Z del ${new Date(close.date).toLocaleDateString()}?`)) {
                                                    printCashCloseTicket(close, restaurantInfo);
                                                }
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '700' }}>{new Date(close.date).toLocaleDateString()}</span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Printer size={16} color={colors.primary} onClick={(e) => { e.stopPropagation(); printCashCloseTicket(close, restaurantInfo); }} />
                                                    <Trash2 size={16} color={colors.danger} onClick={(e) => { e.stopPropagation(); deleteCashClose(close.id); }} />
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: colors.text, marginBottom: '0.5rem' }}>{parseFloat(close.total || 0).toFixed(2)}€</div>
                                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                                                <span style={{ color: colors.success, fontWeight: '700' }}>Ef: {parseFloat(close.efectivo || 0).toFixed(2)}€</span>
                                                <span style={{ color: colors.primary, fontWeight: '700' }}>Tj: {parseFloat(close.tarjeta || 0).toFixed(2)}€</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- EXPENSES VIEW --- */}
                {activeSection === 'expenses' && (
                    <ExpenseManagement />
                )}
            </div>

            {/* --- INVOICE DATA MODAL --- */}
            <AnimatePresence>
                {invoiceModal.isOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            style={{ 
                                width: '100%', maxWidth: '450px', padding: '2.5rem', 
                                background: colors.surface, borderRadius: '24px', 
                                border: `1px solid ${colors.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                                position: 'relative' 
                            }}
                        >
                            <button
                                onClick={() => setInvoiceModal({ ...invoiceModal, isOpen: false })}
                                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '0.5rem', cursor: 'pointer', color: colors.textMuted }}
                            >
                                <CloseIcon size={20} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: `${colors.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                    <FileText color={colors.primary} size={30} />
                                </div>
                                <h3 style={{ margin: 0, color: colors.text, fontSize: '1.5rem', fontWeight: '800' }}>Factura Proforma</h3>
                                <p style={{ color: colors.textMuted, fontSize: '0.9rem', marginTop: '0.5rem' }}>Completa los datos fiscales del cliente.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: colors.text, fontWeight: '700', marginBottom: '0.5rem' }}>Nombre / Razón Social</label>
                                    <input
                                        type="text"
                                        value={invoiceModal.customerData.name}
                                        onChange={(e) => setInvoiceModal({ ...invoiceModal, customerData: { ...invoiceModal.customerData, name: e.target.value } })}
                                        style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, fontWeight: '600', outline: 'none' }}
                                        placeholder="Ej: Juan Pérez S.L."
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: colors.text, fontWeight: '700', marginBottom: '0.5rem' }}>NIF / CIF</label>
                                    <input
                                        type="text"
                                        value={invoiceModal.customerData.nif}
                                        onChange={(e) => setInvoiceModal({ ...invoiceModal, customerData: { ...invoiceModal.customerData, nif: e.target.value } })}
                                        style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, fontWeight: '600', outline: 'none' }}
                                        placeholder="Ej: B12345678"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: colors.text, fontWeight: '700', marginBottom: '0.5rem' }}>Domicilio Fiscal</label>
                                    <input
                                        type="text"
                                        value={invoiceModal.customerData.address}
                                        onChange={(e) => setInvoiceModal({ ...invoiceModal, customerData: { ...invoiceModal.customerData, address: e.target.value } })}
                                        style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, fontWeight: '600', outline: 'none' }}
                                        placeholder="Ej: Calle Gran Vía 123, Madrid"
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        const { sale, customerData } = invoiceModal;
                                        printBillTicket(
                                            sale.tableName || `Mesa ${sale.tableId?.toString().replace('table-', '') || '?'}`,
                                            JSON.parse(sale.items || '[]'),
                                            parseFloat(sale.original_total || sale.total),
                                            restaurantInfo,
                                            sale.discount_percent || 0,
                                            sale.is_invitation || false,
                                            sale.id,
                                            customerData
                                        );
                                        setInvoiceModal({ ...invoiceModal, isOpen: false });
                                    }}
                                    disabled={!invoiceModal.customerData.name || !invoiceModal.customerData.nif}
                                    style={{
                                        width: '100%', padding: '1.25rem', marginTop: '1rem',
                                        background: (!invoiceModal.customerData.name || !invoiceModal.customerData.nif) ? '#e2e8f0' : colors.primary,
                                        border: 'none', borderRadius: '16px',
                                        color: 'white', fontWeight: '900', cursor: 'pointer',
                                        boxShadow: (!invoiceModal.customerData.name || !invoiceModal.customerData.nif) ? 'none' : `0 10px 15px -3px ${colors.primary}40`,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    IMPRIMIR FACTURA
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Analytics;
