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
    X as CloseIcon
} from 'lucide-react';
import { useOrder } from '../context/OrderContext';
import { useInventory } from '../context/InventoryContext';
import { printBillTicket } from '../utils/printHelpers';

const SidebarItem = ({ id, icon: Icon, label, activeSection, setActiveSection }) => (
    <button
        onClick={() => setActiveSection(id)}
        style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            width: '100%', padding: '1rem',
            background: activeSection === id ? 'var(--color-primary)' : 'transparent',
            color: activeSection === id ? 'black' : 'var(--color-text-muted)',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: activeSection === id ? 'bold' : 'normal',
            transition: 'all 0.2s'
        }}
    >
        <Icon size={20} />
        <span>{label}</span>
        {activeSection === id && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
    </button>
);

const Analytics = () => {
    const navigate = useNavigate();
    const { salesHistory, cashCloses, performCashClose, deleteSale } = useOrder();
    const { salesProducts, getProductCost, expenses, restaurantInfo } = useInventory(); // Added restaurantInfo

    const [activeSection, setActiveSection] = useState('dashboard'); // dashboard | sales | menu | cash
    const [dateRange, setDateRange] = useState('today'); // today | week | month | all

    // State for invoice generation
    const [invoiceModal, setInvoiceModal] = useState({ isOpen: false, sale: null, customerData: { name: '', nif: '', address: '' } });

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
    const getFilteredSalesInRange = useCallback((unit = 'today', offset = 0) => {
        if (!salesHistory || !Array.isArray(salesHistory)) return [];

        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (unit === 'today') {
            start.setDate(now.getDate() - offset);
            start.setHours(0, 0, 0, 0);
            end.setDate(now.getDate() - offset);
            end.setHours(23, 59, 59, 999);

            return salesHistory.filter(s => {
                const d = new Date(s.date);
                return d >= start && d <= end;
            });
        }

        if (unit === 'all') return salesHistory;

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (unit === 'week') {
            start.setDate(now.getDate() - 7 - (offset * 7));
            end.setDate(now.getDate() - (offset * 7));
        } else if (unit === 'month') {
            start.setMonth(now.getMonth() - offset);
            start.setDate(1);
            end.setMonth(now.getMonth() - offset + 1);
            end.setDate(0);
        }

        return salesHistory.filter(s => {
            const d = new Date(s.date);
            return d >= start && d <= end;
        });
    }, [salesHistory]);

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

    const filteredSales = useMemo(() => getFilteredSalesInRange(dateRange, 0), [getFilteredSalesInRange, dateRange]);
    const comparisonSales = useMemo(() => getFilteredSalesInRange(dateRange, 1), [getFilteredSalesInRange, dateRange]);

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
            cashRaw, cardRaw,
            totalDiscounts: currentStats.totalDiscounts,
            hours, maxHour
        };
    }, [filteredSales, comparisonSales, expenses, getProductCost, dateRange]);

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
    const [countedCash, setCountedCash] = useState('');
    const [closeNotes, setCloseNotes] = useState('');

    const discrepancy = parseFloat(countedCash || 0) - dashboardStats.cashRaw;

    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', background: '#0f172a', color: 'white', overflow: 'hidden' }}>

            <AnimatePresence>
                {isCloseModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-panel"
                            style={{ maxWidth: '500px', width: '100%', padding: '2rem', border: '1px solid var(--color-primary)' }}
                        >
                            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Resumen de Cierre</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Sistema</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{dashboardStats.totalRevenue.toFixed(2)}€</div>
                                </div>
                                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tarjeta</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{dashboardStats.cardRaw.toFixed(2)}€</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Efectivo Contado (€)</label>
                                    <input
                                        type="number"
                                        className="glass-panel"
                                        placeholder={`Esperado: ${dashboardStats.cashRaw.toFixed(2)}€`}
                                        style={{ width: '100%', padding: '1rem', fontSize: '1.5rem', textAlign: 'center', color: '#10b981', border: '1px solid rgba(255,255,255,0.1)' }}
                                        value={countedCash}
                                        onChange={(e) => setCountedCash(e.target.value)}
                                    />
                                </div>

                                <div style={{
                                    padding: '1rem',
                                    background: Math.abs(discrepancy) < 0.05 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Descuadre</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: Math.abs(discrepancy) < 0.05 ? '#10b981' : '#ef4444' }}>
                                        {discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)}€
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Notas / Observaciones</label>
                                    <textarea
                                        className="glass-panel"
                                        style={{ width: '100%', padding: '0.75rem', height: '80px', background: 'transparent', resize: 'none', color: 'white' }}
                                        value={closeNotes}
                                        onChange={(e) => setCloseNotes(e.target.value)}
                                        placeholder="Ej: Descuadre de 2€ por cambio..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setIsCloseModalOpen(false)}
                                        style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const finalClose = {
                                                efectivo: parseFloat(countedCash || 0),
                                                tarjeta: dashboardStats.cardRaw,
                                                total: dashboardStats.totalRevenue,
                                                notes: closeNotes,
                                                salesCount: dashboardStats.ticketCount
                                            };
                                            await performCashClose(finalClose);
                                            setIsCloseModalOpen(false);
                                            alert("✅ Cierre Z guardado correctamente");
                                        }}
                                        className="btn-primary"
                                        style={{ flex: 2, padding: '1rem', background: '#10b981' }}
                                    >
                                        Confirmar Cierre
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MOBILE TOP BAR */}
            {isMobile && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <button
                        onClick={() => setShowMobileMenu(true)}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
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
                borderRight: '1px solid rgba(255,255,255,0.1)',
                padding: '1.5rem',
                display: isMobile ? (showMobileMenu ? 'flex' : 'none') : 'flex',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                height: '100%',
                background: '#0f172a',
                zIndex: 1000,
                boxShadow: isMobile ? '10px 0 20px rgba(0,0,0,0.5)' : 'none'
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#fbbf24', paddingLeft: '0.5rem' }}>
                    <TrendingUp size={20} />
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Business Intel</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" activeSection={activeSection} setActiveSection={setActiveSection} />
                    <SidebarItem id="sales" icon={FileText} label="Ventas" activeSection={activeSection} setActiveSection={setActiveSection} />
                    <SidebarItem id="menu" icon={UtensilsCrossed} label="Menú Mix" activeSection={activeSection} setActiveSection={setActiveSection} />
                    <SidebarItem id="cash" icon={Wallet} label="Cierre de Caja" activeSection={activeSection} setActiveSection={setActiveSection} />
                </div>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8',
                        padding: '1rem', borderRadius: '8px', cursor: 'pointer'
                    }}>
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
                    alignItems: isMobile ? 'flex-start' : 'center',
                    marginBottom: '2rem',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem' }}>
                            {activeSection === 'dashboard' && 'Visión General'}
                            {activeSection === 'sales' && 'Reporte de Ventas'}
                            {activeSection === 'menu' && 'Ingeniería de Menú'}
                            {activeSection === 'cash' && 'Gestión de Efectivo'}
                        </h1>
                        <p style={{ color: '#94a3b8', marginTop: '0.25rem', fontSize: isMobile ? '0.8rem' : '1rem' }}>
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '0.75rem',
                        alignItems: isMobile ? 'stretch' : 'center',
                        width: isMobile ? '100%' : 'auto'
                    }}>
                        {!isMobile && (
                            <button
                                onClick={exportToCSV}
                                style={{
                                    padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8',
                                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <Download size={16} /> Exportar
                            </button>
                        )}
                        <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', gap: '0.25rem' }}>
                            {['today', 'week', 'month', 'all'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setDateRange(r)}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        background: dateRange === r ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: dateRange === r ? 'white' : '#64748b',
                                        border: 'none', borderRadius: '6px', cursor: 'pointer', textTransform: 'capitalize',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {r === 'today' ? 'Hoy' : r === 'week' ? '7 D' : r === 'month' ? 'Mes' : 'Todo'}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* --- DASHBOARD VIEW --- */}
                {activeSection === 'dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* KPI CARDS */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                            gap: isMobile ? '0.75rem' : '1.5rem'
                        }}>
                            <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.5rem', background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Ventas</span>
                                    <DollarSign size={16} color="#10b981" />
                                </div>
                                <div style={{ fontSize: isMobile ? '1.25rem' : '2rem', fontWeight: 'bold' }}>{dashboardStats.totalRevenue.toFixed(2)}€</div>
                                <div style={{ fontSize: '0.7rem', color: dashboardStats.revenueChange >= 0 ? '#10b981' : '#ef4444', marginTop: '0.25rem' }}>
                                    {dashboardStats.revenueChange >= 0 ? '+' : ''}{dashboardStats.revenueChange.toFixed(1)}%
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Neto</span>
                                    <TrendingUp size={16} color="#10b981" />
                                </div>
                                <div style={{ fontSize: isMobile ? '1.25rem' : '2rem', fontWeight: 'bold', color: dashboardStats.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                                    {dashboardStats.netProfit.toFixed(2)}€
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: dashboardStats.netChange >= 0 ? '#10b981' : '#ef4444' }}>
                                        {dashboardStats.netChange >= 0 ? '+' : ''}{dashboardStats.netChange.toFixed(1)}%
                                    </div>
                                    {dashboardStats.totalDiscounts > 0 && (
                                        <div style={{ fontSize: '0.7rem', color: '#ef4444', opacity: 0.8 }}>
                                            Descuentos: {dashboardStats.totalDiscounts.toFixed(2)}€
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Tickets</span>
                                    <FileText size={16} color="#3b82f6" />
                                </div>
                                <div style={{ fontSize: isMobile ? '1.25rem' : '2rem', fontWeight: 'bold' }}>{dashboardStats.ticketCount}</div>
                                <div style={{ fontSize: '0.7rem', color: dashboardStats.ticketChange >= 0 ? '#10b981' : '#ef4444', marginTop: '0.25rem' }}>
                                    {dashboardStats.ticketChange >= 0 ? '+' : ''}{dashboardStats.ticketChange.toFixed(1)}%
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Media</span>
                                    <Users size={16} color="#f59e0b" />
                                </div>
                                <div style={{ fontSize: isMobile ? '1.25rem' : '2rem', fontWeight: 'bold' }}>{dashboardStats.avgTicket.toFixed(2)}€</div>
                                <div style={{ fontSize: '0.7rem', color: dashboardStats.avgChange >= 0 ? '#10b981' : '#ef4444', marginTop: '0.25rem' }}>
                                    {dashboardStats.avgChange >= 0 ? '+' : ''}{dashboardStats.avgChange.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        {/* Net Profit Details Alert Tip */}
                        <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                                <Info size={20} color="#10b981" />
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>
                                <b style={{ color: '#10b981' }}>Cálculo de Beneficio:</b> El beneficio neto se calcula restando el <b>coste de producto (escandallos)</b> y los <b>gastos generales</b> del total de ventas.
                            </div>
                        </div>

                        {/* CHARTS ROW */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                            {/* HOURLY HEATMAP */}
                            <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Ventas por Hora</h3>
                                <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '2px' }}>
                                    {dashboardStats.hours.map((val, h) => (
                                        <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                            <div style={{
                                                width: '100%',
                                                height: `${(val / dashboardStats.maxHour) * 100}%`,
                                                background: val > 0 ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                                borderRadius: '2px 2px 0 0',
                                                transition: 'height 0.5s',
                                                minHeight: '2px'
                                            }} />
                                            {h % 6 === 0 && <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{h}h</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PAYMENT MIX */}
                            <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Métodos de Pago</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                            <span>Tarjeta</span>
                                            <span>{dashboardStats.cardRaw.toFixed(2)}€</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(dashboardStats.cardRaw / (dashboardStats.totalRevenue || 1)) * 100}%`, height: '100%', background: '#3b82f6' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                            <span>Efectivo</span>
                                            <span>{dashboardStats.cashRaw.toFixed(2)}€</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(dashboardStats.cashRaw / (dashboardStats.totalRevenue || 1)) * 100}%`, height: '100%', background: '#10b981' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SALES VIEW --- */}
                {activeSection === 'sales' && (
                    <div className="glass-panel" style={{ padding: isMobile ? '0.5rem' : '0', overflow: isMobile ? 'visible' : 'hidden' }}>
                        {isMobile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredSales.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        No hay ventas registradas
                                    </div>
                                ) : (
                                    filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date)).map((sale) => (
                                        <div key={sale.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(sale.date).toLocaleString()}</span>
                                                <div style={{ textAlign: 'right' }}>
                                                    {sale.discount_amount > 0 && <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>Desc: {sale.discount_percent ? `${sale.discount_percent}%` : `-${sale.discount_amount}€`}</div>}
                                                    {sale.is_invitation && <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>🎁 INVITACIÓN</div>}
                                                    {sale.customer_data && (
                                                        <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '2px' }}>
                                                            📄 {JSON.parse(sale.customer_data).name} (${JSON.parse(sale.customer_data).nif})
                                                        </div>
                                                    )}
                                                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{parseFloat(sale.total || 0).toFixed(2)}€</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '0.9rem' }}>
                                                    Mesa: <b style={{ color: 'white' }}>{(sale.tableId || '-').toString().replace('table-', 'T')}</b>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '4px',
                                                        background: sale.paymentMethod === 'Efectivo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                        color: sale.paymentMethod === 'Efectivo' ? '#10b981' : '#3b82f6',
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {sale.paymentMethod}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const custData = sale.customer_data ? JSON.parse(sale.customer_data) : { name: '', nif: '', address: '' };
                                                            setInvoiceModal({ isOpen: true, sale, customerData: custData });
                                                        }}
                                                        className="btn-icon"
                                                        style={{ padding: '0.25rem', color: '#3b82f6' }}
                                                        title="Generar Factura"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSale(sale.id)}
                                                        className="btn-icon"
                                                        style={{ padding: '0.25rem', color: '#ef4444' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha/Hora</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>ID Transacción</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Mesa</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Método</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                                No hay ventas registradas en este periodo
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date)).map((sale, index) => (
                                            <tr key={sale.id || `fallback-${index}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem' }}>{new Date(sale.date || 0).toLocaleString()}</td>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{(sale.id || '???').toString().slice(-8)}</td>
                                                <td style={{ padding: '1rem' }}>{(sale.tableId || '-').toString().replace('table-', 'T')}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '4px',
                                                        background: sale.paymentMethod === 'Efectivo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                        color: sale.paymentMethod === 'Efectivo' ? '#10b981' : '#3b82f6',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {sale.paymentMethod || 'Desconocido'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                        {sale.discount_amount > 0 && <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'normal' }}>Desc: {sale.discount_percent ? `${sale.discount_percent}%` : `-${sale.discount_amount.toFixed(2)}€`}</span>}
                                                        {sale.is_invitation && <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 'normal' }}>🎁 INVITACIÓN</span>}
                                                        {sale.customer_data && (
                                                            <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'normal' }}>
                                                                📄 {JSON.parse(sale.customer_data).name} (${JSON.parse(sale.customer_data).nif})
                                                            </span>
                                                        )}
                                                        <span>{parseFloat(sale.total || 0).toFixed(2)}€</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => {
                                                                const custData = sale.customer_data ? JSON.parse(sale.customer_data) : { name: '', nif: '', address: '' };
                                                                setInvoiceModal({ isOpen: true, sale, customerData: custData });
                                                            }}
                                                            className="btn-icon"
                                                            style={{ color: '#3b82f6' }}
                                                            title="Generar Factura"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSale(sale.id)}
                                                            className="btn-icon"
                                                            style={{ color: '#ef4444' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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
                                { type: 'Estrella', label: 'Estrellas', icon: '⭐', color: '#fbbf24', desc: 'Popular / Profa', strategy: 'Mantener.' },
                                { type: 'Vaca Lechera', label: 'Vacas', icon: '🐮', color: '#10b981', desc: 'Popular / Poca', strategy: 'Costes.' },
                                { type: 'Puzzle', label: 'Puzzles', icon: '❓', color: '#3b82f6', desc: 'Poca / Profa', strategy: 'Promo.' },
                                { type: 'Perro', label: 'Perros', icon: '🐕', color: '#ef4444', desc: 'Poca / Poca', strategy: 'Fuera.' }
                            ].map(group => (
                                <div key={group.type} className="glass-panel" style={{ padding: '0.75rem', borderTop: `4px solid ${group.color}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '1rem' }}>{group.icon}</span>
                                        <b style={{ color: group.color, fontSize: '0.8rem' }}>{group.label}</b>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{group.desc}</div>
                                    <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '4px' }}>
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
                                <div key={type} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {type === 'Estrella' && <TrendingUp size={18} color="#fbbf24" />}
                                        {type === 'Estrella' ? 'Favoritos del Cliente (Estrellas)' :
                                            type === 'Vaca Lechera' ? 'Clásicos Populares (Vacas)' :
                                                type === 'Puzzle' ? 'Oportunidades de Venta (Puzzles)' : 'Revisar Urgente (Perros)'}
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'normal' }}>({groupItems.length} productos)</span>
                                    </h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                        {groupItems.map(item => (
                                            <div key={item.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}>
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.5rem',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    {(String(item.image || '').startsWith('data:image') || String(item.image || '').startsWith('http') || String(item.image || '').startsWith('/'))
                                                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : item.image || '🍽️'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.name}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                        <span style={{ color: '#94a3b8' }}>Ventas: <b style={{ color: 'white' }}>{item.sold}</b></span>
                                                        <span style={{ color: '#10b981' }}>Profit: <b style={{ color: 'white' }}>{item.margin.toFixed(2)}€</b></span>
                                                    </div>
                                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.min((item.sold / 50) * 100, 100)}%`, height: '100%', background: type === 'Estrella' ? '#fbbf24' : '#3b82f6' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {menuMatrix.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                                <UtensilsCrossed size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No hay datos suficientes para generar el análisis de matriz.</p>
                                <p style={{ fontSize: '0.8rem' }}>Realiza algunas ventas para ver la ingeniería de menú.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- CASH CLOSE VIEW --- */}
                {activeSection === 'cash' && (
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: isMobile ? '1.5rem' : '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Cierre de Caja (Z)</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Verifica el efectivo y cierra el día fiscal.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0' }}>
                            {/* LEFT: SUMMARY */}
                            <div style={{ padding: isMobile ? '1.5rem' : '2rem', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: '#f59e0b', fontSize: '1rem' }}>Resumen del Sistema</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <span>Ventas Totales</span>
                                        <span style={{ fontWeight: 'bold' }}>{dashboardStats.totalRevenue.toFixed(2)}€</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <span>En Tarjeta</span>
                                        <span style={{ fontWeight: 'bold' }}>{dashboardStats.cardRaw.toFixed(2)}€</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid #10b981', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#10b981' }}>Efectivo Esperado</span>
                                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>{dashboardStats.cashRaw.toFixed(2)}€</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: ACTION */}
                            <div style={{ padding: isMobile ? '2rem 1.5rem' : '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <AlertCircle size={isMobile ? 32 : 48} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <p style={{ fontSize: '0.9rem' }}>Al realizar el Cierre Z, se generará un registro inmutable de las ventas de hoy.</p>
                                </div>

                                {cashCloses.some(c => new Date(c.date).toDateString() === new Date().toDateString()) ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid #10b981' }}>
                                        <CheckCircle size={32} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                                        <h3 style={{ color: '#10b981', margin: 0, fontSize: '1rem' }}>Cierre Realizado</h3>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Ya has cerrado la caja hoy.</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCloseModalOpen(true)}
                                        disabled={dashboardStats.totalRevenue === 0}
                                        style={{
                                            padding: '1rem',
                                            background: dashboardStats.totalRevenue > 0 ? '#10b981' : '#334155',
                                            color: dashboardStats.totalRevenue > 0 ? 'white' : '#64748b',
                                            border: 'none', borderRadius: '8px',
                                            fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 'bold',
                                            cursor: dashboardStats.totalRevenue > 0 ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        REALIZAR CIERRE Z
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* HISTORY */}
                        <div style={{ padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Histórico de Cierres</h3>
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                                {cashCloses.length === 0 && <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No hay cierres anteriores.</p>}
                                {cashCloses.map(close => (
                                    <div key={close.id} className="glass-panel" style={{ minWidth: isMobile ? '160px' : '200px', padding: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(close.date).toLocaleDateString()}</div>
                                        <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{parseFloat(close.total || 0).toFixed(2)}€</div>
                                        <div style={{ fontSize: '0.75rem' }}>{close.salesCount} Tickets</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- INVOICE DATA MODAL --- */}
            <AnimatePresence>
                {invoiceModal.isOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}
                        >
                            <button
                                onClick={() => setInvoiceModal({ ...invoiceModal, isOpen: false })}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <CloseIcon size={24} />
                            </button>

                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FileText color="var(--color-primary)" />
                                Datos Fiscales Factura
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Nombre / Razón Social</label>
                                    <input
                                        type="text"
                                        value={invoiceModal.customerData.name}
                                        onChange={(e) => setInvoiceModal({ ...invoiceModal, customerData: { ...invoiceModal.customerData, name: e.target.value } })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                        placeholder="Ej: Empresa S.L."
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>NIF / CIF</label>
                                    <input
                                        type="text"
                                        value={invoiceModal.customerData.nif}
                                        onChange={(e) => setInvoiceModal({ ...invoiceModal, customerData: { ...invoiceModal.customerData, nif: e.target.value } })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                        placeholder="Ej: B12345678"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Domicilio Fiscal</label>
                                    <input
                                        type="text"
                                        value={invoiceModal.customerData.address}
                                        onChange={(e) => setInvoiceModal({ ...invoiceModal, customerData: { ...invoiceModal.customerData, address: e.target.value } })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
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
                                        width: '100%', padding: '1rem', marginTop: '1rem',
                                        background: 'var(--color-primary)', border: 'none', borderRadius: '8px',
                                        color: 'black', fontWeight: 'bold', cursor: 'pointer',
                                        opacity: (!invoiceModal.customerData.name || !invoiceModal.customerData.nif) ? 0.5 : 1
                                    }}
                                >
                                    🖨️ Generar e Imprimir Factura
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
