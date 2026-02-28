import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useOrder } from '../context/OrderContext';
import { useCustomers } from '../context/CustomerContext';
import { categories } from '../data/products';
import {
    ArrowLeft,
    Trash2,
    Search,
    X,
    Wine,
    Plus,
    Minus,
    User,
    Star,
    Utensils,
    Send,
    Printer,
    CreditCard,
    FileText,
    MessageSquare,
    Banknote,
    Camera,
    Layers,
    ClipboardList,
    LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printKitchenTicket, printBillTicket } from '../utils/printHelpers';

// Modular Components
import CategoryTabs from '../components/TPV/CategoryTabs';
import ProductGrid from '../components/TPV/ProductGrid';
import OrderSummary from '../components/TPV/OrderSummary';
import PaymentModal from '../components/TPV/PaymentModal';
import PartialPaymentModal from '../components/TPV/PartialPaymentModal';
import ModifierModal from '../components/TPV/ModifierModal';
import ProductEditorModal from '../components/TPV/ProductEditorModal';

const BarTapas = () => {
    const navigate = useNavigate();
    const { salesProducts, ingredients, addProductWithRecipe, getProductCost, restaurantInfo: contextRestaurantInfo, checkProductAvailability } = useInventory();

    // Safety fallback for restaurant info
    const restaurantInfo = contextRestaurantInfo || {
        name: 'Luis Jesus García-Valcárcel López-Tofiño',
        businessName: 'TAPAS Y BOCATAS / MANALU EVENTOS',
        address: 'Calle Principal, 123',
        nif: 'B12345678',
        logo: '/logo-principal.png'
    };
    const [searchParams] = useSearchParams();
    const {
        order,
        bill,
        addToOrder,
        removeFromOrder,
        updateQuantity,
        updateItemNote,
        calculateTotal,
        calculateBillTotal,
        sendToKitchen,
        closeTable,
        payPartialTable,
        payValuePartialTable,
        calculateOrderTotal,
        removeProductFromBill,
        currentTable,
        tables, // Added tables from context
        selectTable, // Added selectTable
        selectedCustomer,
        selectCustomer,
        serviceRequests, // Added serviceRequests
        clearServiceRequest, // Added clearServiceRequest
        reservations
    } = useOrder();
    const { customers } = useCustomers();
    const [activeCategory, setActiveCategory] = useState('raciones');
    const [activeSubcategory, setActiveSubcategory] = useState(null);

    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showTicket, setShowTicket] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteDraft, setNoteDraft] = useState('');

    // Mobile Responsiveness State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showOrderMobile, setShowOrderMobile] = useState(false);
    const [mobileActiveTab, setMobileActiveTab] = useState('menu'); // 'tables', 'menu', 'order'
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) setShowOrderMobile(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Quick Mode Effect
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'quick' && !currentTable && tables.length > 0) {
            // Find first available bar table
            const barTable = tables.find(t => t.zone === 'barra');
            if (barTable) {
                selectTable(barTable);
            }
        }
    }, [searchParams, tables, currentTable, selectTable]);

    // New Product Creator State
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProductForm, setNewProductForm] = useState({ name: '', price: 0, category: 'tapas', image: '🍽️' });
    const [newProductRecipe, setNewProductRecipe] = useState([]);

    // Modifiers State
    const [modifierModal, setModifierModal] = useState({ isOpen: false, product: null, selections: {} });

    // Partial Payment State
    const [partialPaymentModal, setPartialPaymentModal] = useState({
        isOpen: false,
        itemsToPay: []
    });

    // Discount and Invitation state
    const [discountPercent, setDiscountPercent] = useState(0);
    const [isInvitation, setIsInvitation] = useState(false);
    const [isFullInvoice, setIsFullInvoice] = useState(false);
    const [customerTaxData, setCustomerTaxData] = useState({ name: '', nif: '', address: '' });

    const handleProductClick = (product) => {
        if (product.modifiers && product.modifiers.length > 0) {
            // Open modal for modifiers
            setModifierModal({
                isOpen: true,
                product: product,
                selections: {} // Reset selections
            });
        } else {
            // Normal add
            addToOrder(product);
        }
    };

    const handleConfirmModifiers = () => {
        if (!modifierModal.product) return;

        const productToAdd = {
            ...modifierModal.product,
            selectedModifiers: modifierModal.selections
        };

        addToOrder(productToAdd);
        setModifierModal({ isOpen: false, product: null, selections: {} });
    };

    const toggleModifier = (modName, option) => {
        setModifierModal(prev => {

            // Simple radio-like logic for now (one option per modifier group)
            return {
                ...prev,
                selections: { ...prev.selections, [modName]: option }
            };
        });
    };


    const handleConfirmPartialPayment = async (method, mode = 'products', customAmountVal = 0) => {
        let saleData = null;
        let itemsForTicket = [];
        let totalVal = 0;

        try {
            if (mode === 'products') {
                itemsForTicket = partialPaymentModal.itemsToPay;
                totalVal = calculateOrderTotal(itemsForTicket);
                saleData = await payPartialTable(
                    currentTable.id,
                    itemsForTicket,
                    method,
                    discountPercent,
                    isInvitation,
                    isFullInvoice ? customerTaxData : null
                );
            } else {
                totalVal = customAmountVal;
                itemsForTicket = [{
                    id: 'partial-payment',
                    uniqueId: `partial-${Date.now()}`,
                    name: 'PAGO PARCIAL (A CUENTA)',
                    price: totalVal,
                    quantity: 1
                }];
                saleData = await payValuePartialTable(
                    currentTable.id,
                    totalVal,
                    method,
                    discountPercent,
                    isInvitation,
                    isFullInvoice ? customerTaxData : null
                );
            }

            if (saleData) {
                // IMPORTANT: Print AFTER any potential navigation or complex state updates
                // to avoid the print window being closed or blocked by browser logic.
                // Also uses a small timeout to let the UI settle.
                setTimeout(() => {
                    printBillTicket(
                        currentTable ? currentTable.name : 'Mesa',
                        itemsForTicket,
                        totalVal,
                        restaurantInfo,
                        discountPercent,
                        isInvitation,
                        saleData.ticket_number || saleData.id.slice(-8),
                        isFullInvoice ? customerTaxData : null
                    );
                }, 100);

                setPartialPaymentModal({ isOpen: false, itemsToPay: [] });
                setDiscountPercent(0);
                setIsInvitation(false);
                setIsFullInvoice(false);

                // If this was the last part of the bill, the context will eventually reflect it.
                // We keep the user on the page for a moment to see the success.

                // Check if table is still active or closed
                if (!bill || bill.length === 0) {
                    navigate('/tables');
                }
            } else {
                alert('No se pudo procesar el pago parcial. Por favor, revisa los datos.');
            }
        } catch (err) {
            console.error("DEBUG - handleConfirmPartialPayment Failure:", err);
            alert(`⚠️ Error al procesar el pago:\n${err.message || 'Error desconocido'}\n\nPor favor, contacta con soporte o revisa la consola.`);
        }
    };

    const updatePartialQuantity = (item, delta) => {
        setPartialPaymentModal(prev => {
            const existing = prev.itemsToPay.find(i => i.uniqueId === item.uniqueId);
            const billItem = bill.find(i => i.uniqueId === item.uniqueId);

            if (existing) {
                const newQuantity = Math.max(0, Math.min(billItem.quantity, existing.quantity + delta));
                if (newQuantity === 0) {
                    return { ...prev, itemsToPay: prev.itemsToPay.filter(i => i.uniqueId !== item.uniqueId) };
                }
                return {
                    ...prev,
                    itemsToPay: prev.itemsToPay.map(i => i.uniqueId === item.uniqueId ? { ...i, quantity: newQuantity } : i)
                };
            } else if (delta > 0) {
                return { ...prev, itemsToPay: [...prev.itemsToPay, { ...item, quantity: 1 }] };
            }
            return prev;
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Increased limit as we compress anyway
                alert("La imagen es demasiado grande (máx 2MB).");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProductForm(prev => ({ ...prev, image: reader.result, imageFile: file }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveNewProduct = () => {
        if (!newProductForm.name || newProductForm.price <= 0) {
            alert('Por favor, introduce un nombre y precio válido.');
            return;
        }
        addProductWithRecipe(newProductForm, newProductRecipe);
        alert(' Producto creado correctamente y añadido a la carta.');
        setIsAddingProduct(false);
        setNewProductForm({ name: '', price: 0, category: activeCategory, image: '🍽️' });
        setNewProductRecipe([]);
        setActiveCategory(newProductForm.category);
    };

    const activeCategoryData = categories.find(cat => cat.id === activeCategory);
    const availableSubcategories = activeCategoryData?.subcategories || [];

    const filteredProducts = salesProducts.filter(p => {
        const matchesCategory = p.category === activeCategory;
        const matchesSubcategory = !activeSubcategory || p.subcategory === activeSubcategory;
        return matchesCategory && matchesSubcategory;
    });

    // Replace uses of setActiveCategory(cat.id) with a wrapper that also resets subcategory
    const handleCategoryChange = (catId) => {
        setActiveCategory(catId);
        setActiveSubcategory(null);
    };


    const handleSendOrder = () => {
        if (order.length === 0) return;

        // Automatically print ticket for kitchen
        printKitchenTicket(currentTable ? currentTable.name : 'Barra', order);

        sendToKitchen();
        alert('¡Pedido enviado a cocina e impreso! 👨‍🍳');
    };

    const handleCloseTable = async (method = 'Efectivo') => {
        if (!currentTable) return;
        const currentBill = [...bill]; // Snapshot for printing
        const total = totalBill;

        const saleData = await closeTable(currentTable.id, method, discountPercent, isInvitation, isFullInvoice ? customerTaxData : null);
        if (saleData) {
            // Print final ticket with ID
            printBillTicket(
                currentTable ? currentTable.name : 'Mesa',
                currentBill,
                total,
                restaurantInfo,
                discountPercent,
                isInvitation,
                saleData.ticket_number || saleData.id.slice(-8),
                isFullInvoice ? customerTaxData : null
            );
            setShowTicket(false);
            setDiscountPercent(0);
            setIsInvitation(false);
            setIsFullInvoice(false);
            navigate('/bar-tapas');
        } else {
            alert('Error al cerrar la mesa.');
        }
    };

    const totalBill = calculateBillTotal();
    const iva = totalBill * 0.10;
    const subtotal = totalBill - iva;

    // Mobile Search Logic
    const mobileFilteredProducts = mobileSearchQuery.trim() === ''
        ? []
        : salesProducts.filter(p => p.name.toLowerCase().includes(mobileSearchQuery.toLowerCase()));

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            position: 'relative',
            background: 'var(--color-bg)',
            color: 'var(--color-text-dark)'
        }}>

            {/* MAIN CONTENT AREA */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                overflow: 'hidden',
                paddingBottom: isMobile ? '85px' : 0 // Space for bottom nav
            }}>

                {/* LEFT SECTION: Catalog (Visible on desktop OR mobile 'menu' tab) */}
                {(!isMobile || mobileActiveTab === 'menu' || mobileActiveTab === 'tables') && (
                    <div style={{
                        flex: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRight: isMobile ? 'none' : '1px solid var(--glass-border)',
                        overflow: 'hidden'
                    }}>

                        {/* Service Requests Banner */}
                        <AnimatePresence>
                            {serviceRequests.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{
                                        overflow: 'hidden',
                                        background: '#fbbf24',
                                        color: '#000',
                                        padding: serviceRequests.length > 0 ? '1rem 2rem' : '0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        borderBottom: '2px solid rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {serviceRequests.map(req => (
                                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {req.type === 'waiter' ? '🛎️ LLAMADA:' : '🧾 CUENTA:'} {req.table_name || `Mesa ${req.table_id}`}
                                            </div>
                                            <button
                                                onClick={() => clearServiceRequest(req.id)}
                                                style={{
                                                    background: 'rgba(0,0,0,0.1)',
                                                    border: '1px solid black',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                ATENDIDO
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <header className="header-card" style={{
                            padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => navigate('/tables')}
                                    className="btn-icon-circle"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <img src="/logo_new.png" alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text-dark)' }}>Gestión por mesas</h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            {currentTable ? currentTable.name : 'Mesa no asignada'}
                                        </span>
                                        {currentTable && (() => {
                                            const todayStr = new Date().toISOString().split('T')[0];
                                            const reservation = reservations.find(r =>
                                                (r.tableId === currentTable.id.toString() || r.tableId === currentTable.id) &&
                                                r.date === todayStr &&
                                                (r.status === 'confirmado' || r.status === 'sentado')
                                            );
                                            if (reservation) {
                                                return (
                                                    <span style={{
                                                        fontSize: '0.8rem',
                                                        background: 'rgba(245, 158, 11, 0.15)',
                                                        color: '#f59e0b',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        RESERVA: {reservation.customerName} ({reservation.time})
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Mode Button (Added) */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isMobile && (
                                    <button
                                        onClick={() => setShowMobileSearch(true)}
                                        className="btn-icon-circle"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                                    >
                                        <Search size={22} color="var(--color-primary)" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsAddingProduct(true)}
                                    className="btn-primary"
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        border: '1px solid #10b981',
                                        color: '#10b981',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Plus size={18} /> {isMobile ? '' : 'Crear Producto'}
                                </button>
                            </div>
                        </header>

                        {/* LEFT SECTION: Categories & Products */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
                            <div className="section-border-right">
                                <CategoryTabs
                                    categories={categories}
                                    activeCategory={activeCategory}
                                    setActiveCategory={handleCategoryChange}
                                    isMobile={isMobile}
                                />
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                {availableSubcategories.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderBottom: '1px solid var(--glass-border)',
                                        overflowX: 'auto',
                                        whiteSpace: 'nowrap',
                                        scrollbarWidth: 'none'
                                    }}>
                                        <button
                                            onClick={() => setActiveSubcategory(null)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                border: '1px solid ' + (!activeSubcategory ? 'var(--color-primary)' : 'var(--glass-border)'),
                                                background: !activeSubcategory ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                color: !activeSubcategory ? 'var(--color-primary)' : 'var(--color-text-dark)',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Todos
                                        </button>
                                        {availableSubcategories.map(sub => (
                                            <button
                                                key={sub}
                                                onClick={() => setActiveSubcategory(sub)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '20px',
                                                    border: '1px solid ' + (activeSubcategory === sub ? 'var(--color-primary)' : 'var(--glass-border)'),
                                                    background: activeSubcategory === sub ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                    color: activeSubcategory === sub ? 'var(--color-primary)' : 'var(--color-text-dark)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold',
                                                    textTransform: 'capitalize',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <ProductGrid
                                    products={filteredProducts}
                                    onProductClick={handleProductClick}
                                    getProductCost={getProductCost}
                                    checkProductAvailability={checkProductAvailability}
                                />
                            </div>

                        </div>
                    </div>
                )}

                {/* RIGHT SECTION: Order Summary (Modular Redesign) */}
                {(!isMobile || mobileActiveTab === 'order') && (
                    <OrderSummary
                        isMobile={isMobile}
                        showOrderMobile={isMobile ? mobileActiveTab === 'order' : showOrderMobile}
                        setShowOrderMobile={(val) => isMobile ? setMobileActiveTab(val ? 'order' : 'menu') : setShowOrderMobile(val)}
                        selectedCustomer={selectedCustomer}
                        selectCustomer={selectCustomer}
                        showCustomerSearch={showCustomerSearch}
                        setShowCustomerSearch={setShowCustomerSearch}
                        customerSearchQuery={customerSearchQuery}
                        setCustomerSearchQuery={setCustomerSearchQuery}
                        customers={customers}
                        salesProducts={salesProducts}
                        addToOrder={addToOrder}
                        order={order}
                        calculateTotal={calculateTotal}
                        removeFromOrder={removeFromOrder}
                        updateQuantity={updateQuantity}
                        updateItemNote={updateItemNote}
                        editingNoteId={editingNoteId}
                        setEditingNoteId={setEditingNoteId}
                        noteDraft={noteDraft}
                        setNoteDraft={setNoteDraft}
                        handleSendOrder={handleSendOrder}
                        setIsPaymentModalOpen={setShowTicket}
                        currentTable={currentTable}
                    />
                )}
            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '85px',
                    background: 'var(--color-surface)',
                    borderTop: '1px solid var(--border-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    zIndex: 100,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    boxShadow: '0 -10px 25px rgba(0,0,0,0.15)'
                }}>
                    <button
                        onClick={() => navigate('/tables')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Layers size={28} />
                        <span>Mesas</span>
                    </button>

                    <button
                        onClick={() => setMobileActiveTab('menu')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'none',
                            border: 'none',
                            color: mobileActiveTab === 'menu' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontSize: '0.9rem',
                            fontWeight: mobileActiveTab === 'menu' ? 'bold' : 'normal'
                        }}
                    >
                        <LayoutGrid size={28} />
                        <span>Carta</span>
                    </button>

                    <button
                        onClick={() => setMobileActiveTab('order')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'none',
                            border: 'none',
                            color: mobileActiveTab === 'order' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontSize: '0.9rem',
                            fontWeight: mobileActiveTab === 'order' ? 'bold' : 'normal',
                            position: 'relative'
                        }}
                    >
                        <ClipboardList size={28} />
                        <span>Comanda</span>
                        {order.length > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '10px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                minWidth: '18px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {order.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setMobileActiveTab('order');
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.9rem'
                        }}
                    >
                        <CreditCard size={28} />
                        <span>Cobrar</span>
                    </button>
                </div>
            )}
            {/* TICKET / CHECKOUT MODAL */}
            <AnimatePresence>
                {showTicket && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', border: '1px solid var(--color-primary)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Printer size={24} /> Tiket de Venta</h2>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => printBillTicket(currentTable ? currentTable.name : 'Mesa', bill, totalBill, restaurantInfo, discountPercent, isInvitation, 'BORRADOR')}
                                        style={{ background: '#f59e0b', border: 'none', color: 'black', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        📄 Borrador (Proforma)
                                    </button>

                                    {isFullInvoice && (
                                        <button
                                            onClick={() => printBillTicket(currentTable ? currentTable.name : 'Mesa', bill, totalBill, restaurantInfo, discountPercent, isInvitation, 'PROFORMA', customerTaxData)}
                                            style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            📄 Imprimir Factura
                                        </button>
                                    )}
                                    <button onClick={() => { setShowTicket(false); setDiscountPercent(0); setIsInvitation(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                                </div>
                            </div>

                            {/* Discount & Invitation Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'block' }}>Descuento Directo (%)</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                value={discountPercent || ''}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setDiscountPercent(Math.min(100, Math.max(0, val)));
                                                    if (val > 0) setIsInvitation(false);
                                                }}
                                                disabled={isInvitation}
                                                placeholder="0"
                                                style={{ width: '80px', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', textAlign: 'center' }}
                                            />
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>%</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {[5, 10, 15, 20].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => { setDiscountPercent(p); setIsInvitation(false); }}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid',
                                                    borderColor: discountPercent === p ? 'var(--color-primary)' : 'var(--glass-border)',
                                                    background: discountPercent === p ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    color: discountPercent === p ? 'var(--color-primary)' : 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {p}%
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsInvitation(!isInvitation);
                                        if (!isInvitation) setDiscountPercent(0);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: isInvitation ? '#10b981' : 'var(--glass-border)',
                                        background: isInvitation ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                        color: isInvitation ? '#10b981' : 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {isInvitation ? '🎁 Invitación Activa' : '🎁 Marcar como Invitación Total'}
                                </button>

                                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                    <button
                                        onClick={() => setIsFullInvoice(!isFullInvoice)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid',
                                            borderColor: isFullInvoice ? 'var(--color-primary)' : 'var(--glass-border)',
                                            background: isFullInvoice ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            marginBottom: isFullInvoice ? '1rem' : '0'
                                        }}
                                    >
                                        <FileText size={18} /> {isFullInvoice ? '📄 Factura Solicitada' : '📄 Solicitar Factura Completa'}
                                    </button>

                                    {isFullInvoice && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                                        >
                                            <input
                                                type="text"
                                                placeholder="Nombre / Razón Social"
                                                value={customerTaxData.name}
                                                onChange={(e) => setCustomerTaxData({ ...customerTaxData, name: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="NIF / CIF"
                                                    value={customerTaxData.nif}
                                                    onChange={(e) => setCustomerTaxData({ ...customerTaxData, nif: e.target.value })}
                                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Domicilio"
                                                    value={customerTaxData.address}
                                                    onChange={(e) => setCustomerTaxData({ ...customerTaxData, address: e.target.value })}
                                                    style={{ flex: 2, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Ticket Mockup Style */}
                            <div style={{ background: 'white', color: 'black', padding: '2rem', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: "'Courier New', Courier, monospace" }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{restaurantInfo.name.toUpperCase()}</h3>
                                    <div style={{ fontSize: '0.8rem' }}>{restaurantInfo.address}</div>
                                    <div style={{ fontSize: '0.8rem' }}>NIF/CIF: {restaurantInfo.nif}</div>
                                </div>

                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span>FECHA: {new Date().toLocaleDateString()}</span>
                                    <span>HORA: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>
                                    {currentTable?.name}
                                </div>

                                <div style={{ borderBottom: '1px solid black', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    <span style={{ flex: 1 }}>CONCEPTO</span>
                                    <span style={{ width: '40px', textAlign: 'center' }}>CANT</span>
                                    <span style={{ width: '60px', textAlign: 'right' }}>PRECIO</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    {bill.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`¿Seguro que quieres borrar ${item.name} de la cuenta? El stock se recuperará automáticamente.`)) {
                                                                removeProductFromBill(currentTable.id, item.uniqueId, item.quantity);
                                                            }
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    <span>{item.name}</span>
                                                </div>
                                                <span style={{ width: '40px', textAlign: 'center' }}>{item.quantity}</span>
                                                <span style={{ width: '60px', textAlign: 'right' }}>{(item.price * item.quantity).toFixed(2)}€</span>
                                            </div>
                                            {item.notes && (
                                                <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                                                    * {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderTop: '1px dashed #ccc', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                                        <span>SUBTOTAL:</span>
                                        <span>{subtotal.toFixed(2)}€</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                                        <span>IVA (10%):</span>
                                        <span>{iva.toFixed(2)}€</span>
                                    </div>

                                    {(discountPercent > 0 || isInvitation) && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ef4444', fontWeight: 'bold', borderTop: '1px dashed #ef4444', paddingTop: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span>DESC ({isInvitation ? '100%' : `${discountPercent}%`}):</span>
                                            <span>-{isInvitation ? totalBill.toFixed(2) : ((totalBill * discountPercent) / 100).toFixed(2)}€</span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '900', borderTop: '2px solid black', paddingTop: '0.5rem' }}>
                                        <span>TOTAL:</span>
                                        <span>{(isInvitation ? 0 : Math.max(0, totalBill - (totalBill * discountPercent / 100))).toFixed(2)}€</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#888' }}>
                                    ¡Gracias por su visita!<br />
                                    www.tapasybocatas.es | www.manalueventos.com
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button
                                    className="btn-primary"
                                    style={{ background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => handleCloseTable('Efectivo')}
                                >
                                    <Banknote size={20} /> Efectivo
                                </button>
                                <button
                                    className="btn-primary"
                                    style={{ background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => handleCloseTable('Tarjeta')}
                                >
                                    <CreditCard size={20} /> Tarjeta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Product Creator Modal */}
            <AnimatePresence>
                {isAddingProduct && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                width: '90%',
                                maxWidth: '800px',
                                height: '90vh',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                border: '1px solid var(--color-primary)',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0 }}>Crear Nuevo Producto y Escandallo</h2>
                                <button onClick={() => setIsAddingProduct(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {/* Left Column: Product Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h3 style={{ color: 'var(--color-primary)' }}>1. Datos del Producto</h3>

                                    <div>
                                        <label>Nombre</label>
                                        <input
                                            type="text"
                                            value={newProductForm.name}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                                            className="glass-panel"
                                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            placeholder="Ej: Plato Principal"
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label>Precio (€)</label>
                                            <input
                                                type="number"
                                                value={newProductForm.price}
                                                onChange={(e) => setNewProductForm({ ...newProductForm, price: parseFloat(e.target.value) || 0 })}
                                                className="glass-panel"
                                                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white' }}
                                            />
                                        </div>
                                        <div>
                                            <label>Icono</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={newProductForm.image}
                                                    onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                                                    className="glass-panel"
                                                    style={{ width: '60px', padding: '0.75rem', marginTop: '0.5rem', color: 'white', textAlign: 'center', fontSize: '1.2rem' }}
                                                    placeholder="🍽️"
                                                />
                                                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                    {['🍺', '🍷', '🍖', '🥘', '🍲', '🥗', '🥪', '🥔', '🍰', '☕', '🥤'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => setNewProductForm({ ...newProductForm, image: emoji })}
                                                            style={{
                                                                background: 'rgba(255,255,255,0.1)',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '1.2rem',
                                                                padding: '0.25rem'
                                                            }}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ marginTop: '1rem' }}>
                                                    <label className="btn-secondary" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px dashed var(--glass-border)' }}>
                                                        <Camera size={18} /> Hacer Foto / Subir
                                                        <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageUpload} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label>Categoría</label>
                                        <select
                                            value={newProductForm.category}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                                            className="glass-panel"
                                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', color: 'white', background: '#1e293b' }}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column: Recipe Builder */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h3 style={{ color: '#10b981' }}>2. Escandallo (Receta)</h3>

                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {newProductRecipe.length === 0 ? (
                                            <p style={{ color: 'gray', textAlign: 'center', marginTop: '2rem' }}>Añade ingredientes abajo</p>
                                        ) : (
                                            newProductRecipe.map((item, idx) => {
                                                const ing = ingredients.find(i => i.id === item.ingredientId);
                                                return (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.9rem' }}>{ing?.name || 'Desconocido'}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const updated = [...newProductRecipe];
                                                                    updated[idx].quantity = parseFloat(e.target.value) || 0;
                                                                    setNewProductRecipe(updated);
                                                                }}
                                                                style={{ width: '60px', padding: '0.25rem', background: '#333', border: 'none', color: 'white', textAlign: 'center' }}
                                                            />
                                                            <span style={{ fontSize: '0.8rem', color: 'gray' }}>{ing?.unit}</span>
                                                            <button
                                                                onClick={() => setNewProductRecipe(prev => prev.filter((_, i) => i !== idx))}
                                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                        <select
                                            id="ing-select"
                                            className="glass-panel"
                                            style={{ flex: 1, padding: '0.5rem', color: 'white', background: '#1e293b' }}
                                        >
                                            <option value="">Seleccionar ingrediente...</option>
                                            {ingredients.map(ing => (
                                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn-primary"
                                            onClick={() => {
                                                const select = document.getElementById('ing-select');
                                                const val = select.value;
                                                if (val) {
                                                    setNewProductRecipe(prev => [...prev, { ingredientId: val, quantity: 1 }]);
                                                    select.value = "";
                                                }
                                            }}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    onClick={() => handleSaveNewProduct()}
                                    className="btn-primary"
                                    style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}
                                >
                                    Guardar Producto
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* PARTIAL PAYMENT MODAL */}
            <PartialPaymentModal
                isOpen={partialPaymentModal.isOpen}
                onClose={() => setPartialPaymentModal({ isOpen: false, itemsToPay: [] })}
                bill={bill}
                itemsToPay={partialPaymentModal.itemsToPay}
                updatePartialQuantity={updatePartialQuantity}
                discountPercent={discountPercent}
                setDiscountPercent={setDiscountPercent}
                isInvitation={isInvitation}
                setIsInvitation={setIsInvitation}
                isFullInvoice={isFullInvoice}
                setIsFullInvoice={setIsFullInvoice}
                customerTaxData={customerTaxData}
                setCustomerTaxData={setCustomerTaxData}
                handleConfirmPartialPayment={handleConfirmPartialPayment}
                payValuePartialTable={payValuePartialTable}
                currentTable={currentTable}
            />
            <AnimatePresence>
                {modifierModal.isOpen && modifierModal.product && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                width: '90%',
                                maxWidth: '500px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                border: '1px solid var(--color-primary)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {modifierModal.product.image} {modifierModal.product.name}
                                </h2>
                                <button
                                    onClick={() => setModifierModal({ isOpen: false, product: null, selections: {} })}
                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {modifierModal.product.modifiers.map((group, idx) => (
                                    <div key={idx} style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ color: 'var(--color-secondary)', marginBottom: '0.75rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                                            {group.name}
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {group.options.map((option, optIdx) => {
                                                const isSelected = modifierModal.selections[group.name] === option;
                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => toggleModifier(group.name, option)}
                                                        style={{
                                                            padding: '0.75rem',
                                                            borderRadius: '8px',
                                                            border: isSelected ? '1px solid #10b981' : '1px solid var(--glass-border)',
                                                            background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                            color: isSelected ? 'white' : '#94a3b8',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            fontWeight: isSelected ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleConfirmModifiers}
                                style={{ padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}
                            >
                                Confirmar y Añadir
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* MOBILE FULL-SCREEN SEARCH */}
            <AnimatePresence>
                {showMobileSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'var(--color-bg)',
                            zIndex: 200,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '1rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input
                                    autoFocus
                                    placeholder="¿Qué busca el cliente?..."
                                    value={mobileSearchQuery}
                                    onChange={(e) => setMobileSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1rem 1rem 3rem',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '16px',
                                        color: 'white',
                                        fontSize: '1.1rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setShowMobileSearch(false);
                                    setMobileSearchQuery('');
                                }}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: 'none',
                                    fontWeight: 'bold'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {mobileSearchQuery.trim() !== '' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                    {mobileFilteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => {
                                                handleProductClick(product);
                                                setShowMobileSearch(false);
                                                setMobileSearchQuery('');
                                                setMobileActiveTab('menu');
                                            }}
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--color-surface)',
                                                borderRadius: '16px',
                                                border: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{ fontSize: '2rem' }}>{product.image}</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{product.name}</div>
                                            <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{product.price.toFixed(2)}€</div>
                                        </div>
                                    ))}
                                    {mobileFilteredProducts.length === 0 && (
                                        <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
                                            No se han encontrado productos
                                        </div>
                                    )}
                                </div>
                            )}
                            {mobileSearchQuery.trim() === '' && (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '4rem' }}>
                                    <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>Escribe el nombre de un artículo para buscarlo rápidamente</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BarTapas;
