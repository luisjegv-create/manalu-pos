import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { uploadImage, compressImage } from '../utils/storageUtils';

const InventoryContext = createContext();

// Helper for safe parsing
const safeParse = (key, fallback) => {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallback;
        const parsed = JSON.parse(saved);
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
        return parsed;
    } catch (error) {
        console.error("Error parsing localStorage key:", key, error);
        return fallback;
    }
};

// Helper to remove heavy base64 images from local backups
const stripLargeImages = (list) => {
    if (!Array.isArray(list)) return list;
    return list.map(item => {
        if (item && item.image && typeof item.image === 'string' && item.image.startsWith('data:image')) {
            // Skip storing the base64 image in localStorage to prevent QuotaExceededError
            const { image: _unused, ...rest } = item;
            return rest;
        }
        return item;
    });
};

const safeSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error(`Error saving ${key}:`, e);
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert(`⚠️ ALMACENAMIENTO LLENO ⚠️\nEspacio insuficiente en el navegador. Por favor, limpia fotos antiguas en Configuración para evitar problemas.`);
        }
    }
};

// eslint-disable-next-line react-refresh/only-export-components
export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [ingredients, setIngredients] = useState([]);
    const [recipes, setRecipes] = useState({});
    const [baseProducts, setBaseProducts] = useState([]);
    const [wines, setWines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [mermas, setMermas] = useState(() => safeParse('manalu_mermas', []));
    const [physicalInventories, setPhysicalInventories] = useState(() => safeParse('manalu_physical_inventories', []));
    const [soldOutItems, setSoldOutItems] = useState(() => safeParse('manalu_sold_out', []));
    const [isSyncing, setIsSyncing] = useState(false); // For manual reload indication
    const [lastSyncDate, setLastSyncDate] = useState(() => safeParse('manalu_last_sync', null));
    const [customProductOrder, setCustomProductOrder] = useState(() => safeParse('manalu_product_order', []));

    const [restaurantInfo, setRestaurantInfo] = useState({
        name: 'Luis Jesus García-Valcárcel López-Tofiño',
        address: 'Calle Principal, 123',
        phone: '600 000 000',
        nif: 'B12345678',
        email: 'info@manalu.com',
        website: 'www.tapasybocatas.es',
        website2: 'www.manalueventos.com',
        logo: '/logo-principal.png',
        last_ticket_number: 0,
        gemUrl: 'https://gemini.google.com/gem/a75e2ed2d82d'
    });

    useEffect(() => {
        safeSetItem('manalu_mermas', JSON.stringify(mermas));
    }, [mermas]);

    useEffect(() => {
        safeSetItem('manalu_physical_inventories', JSON.stringify(physicalInventories));
    }, [physicalInventories]);

    useEffect(() => {
        safeSetItem('manalu_sold_out', JSON.stringify(soldOutItems));
    }, [soldOutItems]);

    const toggleSoldOut = (productId) => {
        setSoldOutItems(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    };

    // --- RELIABLE DATA LOADING & SYNC ---
    const loadData = async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        else setIsSyncing(true);

        try {
            // 1. Fetch from Supabase with timeout/catch
            let ingData = null, prodData = null, recData = null, settingsData = null, wineDataActual = null;
            let syncSuccess = false;

            try {
                const [ingRes, prodRes, recRes, setRes, wineRes] = await Promise.all([
                    supabase.from('ingredients').select('*'),
                    supabase.from('products').select('*'),
                    supabase.from('recipes').select('*'),
                    supabase.from('restaurant_settings').select('*').single(),
                    supabase.from('wines').select('*')
                ]);

                if (!prodRes.error) {
                    ingData = ingRes.data;
                    prodData = prodRes.data;
                    recData = recRes.data;
                    settingsData = setRes.data;
                    wineDataActual = wineRes.data;
                    syncSuccess = true;
                    
                    // SAVE BACKUPS (Stripping heavy base64 images to save space)
                    if (prodData && prodData.length > 0) safeSetItem('manalu_backup_products', JSON.stringify(stripLargeImages(prodData)));
                    if (ingData && ingData.length > 0) safeSetItem('manalu_backup_ingredients', JSON.stringify(ingData));
                    if (recData && recData.length > 0) safeSetItem('manalu_backup_recipes', JSON.stringify(recData));
                    if (settingsData) safeSetItem('manalu_backup_settings', JSON.stringify(settingsData));
                    if (wineDataActual && wineDataActual.length > 0) safeSetItem('manalu_backup_wines', JSON.stringify(stripLargeImages(wineDataActual)));
                    
                    const now = new Date().toISOString();
                    setLastSyncDate(now);
                    safeSetItem('manalu_last_sync', JSON.stringify(now));
                }
            } catch (networkError) {
                console.warn("Network or Supabase error during sync, falling back to local backups", networkError);
            }

            // 2. Fallback to LocalStorage if Sync Failed or data is dangerously empty
            if (!syncSuccess || !prodData || prodData.length === 0) {
                console.log("Loading products from local fallback...");
                prodData = safeParse('manalu_backup_products', []);
                ingData = safeParse('manalu_backup_ingredients', []);
                recData = safeParse('manalu_backup_recipes', []);
                wineDataActual = safeParse('manalu_backup_wines', []);
                settingsData = safeParse('manalu_backup_settings', null);
            }

            // 3. Update Provider State
            if (prodData) {
                setBaseProducts(prodData.map(p => ({
                    ...p,
                    category: (p.category || 'raciones').toLowerCase() === 'tapas' ? 'raciones' : (p.category || 'raciones').toLowerCase(),
                    recommendedWine: p.recommended_wine,
                    isDigitalMenuVisible: p.is_digital_menu_visible !== false,
                    subcategory: p.subcategory || null,
                    price: parseFloat(p.price) || 0
                })));
            }

            if (ingData) {
                setIngredients(ingData.map(i => ({ ...i, critical: i.min_stock })));
            }

            if (settingsData) {
                let finalGemUrl = settingsData.gem_url || settingsData.gemUrl || 'https://gemini.google.com/gem/a75e2ed2d82d';
                if (finalGemUrl && !finalGemUrl.startsWith('http')) finalGemUrl = 'https://gemini.google.com/gem/a75e2ed2d82d';
                setRestaurantInfo({
                    ...settingsData,
                    logo: settingsData.logo_url || settingsData.logo,
                    last_ticket_number: settingsData.last_ticket_number || 0,
                    gemUrl: finalGemUrl
                });
            }

            if (wineDataActual) {
                setWines(wineDataActual.map(w => ({ ...w, purchasePrice: w.purchase_price })));
            }
            
            if (recData) {
                const recMap = {};
                recData.forEach(r => {
                    if (!recMap[r.product_id]) recMap[r.product_id] = [];
                    recMap[r.product_id].push({ ingredientId: r.ingredient_id, quantity: r.quantity });
                });
                setRecipes(recMap);
            }

            // Optional: Background Migrations (Only if sync was successful)
            if (syncSuccess) {
                try {
                    const localIngs = safeParse('manalu_ingredients', []);
                    if ((!ingData || ingData.length === 0) && localIngs.length > 0) {
                         // Fallback migrations here... kept light
                        console.log("Legacy ingredient migration skipped in new load flow");
                    }
                    if (prodData) {
                        const tapasProducts = prodData.filter(p => p.category === 'tapas');
                        if (tapasProducts.length > 0) {
                            await supabase.from('products').update({ category: 'raciones' }).eq('category', 'tapas');
                        }
                    }
                } catch (migrationError) {
                    console.warn("Migration failed:", migrationError);
                }
            }

        } catch (error) {
            console.error("Critical error in loadData:", error);
            if (!isInitialLoad) alert("Error grave al sincronizar datos.");
        } finally {
            if (isInitialLoad) setLoading(false);
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadData(true);
    }, []);

    const forceSync = async () => {
        await loadData(false);
    };

    // Drive all sellable products with prefixed IDs to avoid collisions
    const salesProducts = React.useMemo(() => {
        const safeWines = Array.isArray(wines) ? wines : [];
        const wineProducts = safeWines.map(w => ({
            ...w,
            id: `wine_${w.id}`,
            dbId: w.id, // Keep reference to real DB ID
            price: w.price,
            purchasePrice: w.purchasePrice || 0,
            category: 'vinos',
            isWine: true
        }));
        const safeBaseProducts = Array.isArray(baseProducts) ? baseProducts : [];
        const baseProductsMapped = safeBaseProducts.map(p => ({
            ...p,
            id: `prod_${p.id}`,
            dbId: p.id
        }));
        
        let allProducts = [...baseProductsMapped, ...wineProducts];
        if (customProductOrder && customProductOrder.length > 0) {
            allProducts.sort((a, b) => {
                const idxA = customProductOrder.indexOf(a.id);
                const idxB = customProductOrder.indexOf(b.id);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });
        }
        return allProducts;
    }, [baseProducts, wines, customProductOrder]);

    const updateCustomProductOrder = (newOrderArray) => {
        setCustomProductOrder(newOrderArray);
        safeSetItem('manalu_product_order', JSON.stringify(newOrderArray));
    };


    // --- Ingredient Actions ---
    const addIngredient = async (ingredient) => {
        try {
            const { data, error } = await supabase.from('ingredients').insert([{
                name: ingredient.name,
                quantity: ingredient.quantity || 0,
                unit: ingredient.unit,
                cost: ingredient.cost || 0,
                min_stock: ingredient.critical || ingredient.minStock || 0,
                category: ingredient.category,
                subcategory: ingredient.subcategory || null,
                provider: ingredient.provider || 'Sin asignar'
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                const newIng = {
                    ...data[0],
                    critical: data[0].min_stock
                };
                setIngredients(prev => [...prev, newIng]);
            }
        } catch (error) {
            console.error("Error al añadir ingrediente:", error);
            const msg = error.message || "Error desconocido";
            alert(`⚠️ No se pudo guardar el ingrediente: ${msg}`);
        }
    };

    const updateIngredient = async (id, updatedData) => {
        try {
            const { error } = await supabase.from('ingredients').update({
                name: updatedData.name,
                quantity: updatedData.quantity,
                unit: updatedData.unit,
                cost: updatedData.cost,
                min_stock: updatedData.critical || updatedData.minStock || updatedData.min_stock,
                category: updatedData.category,
                subcategory: updatedData.subcategory || null,
                provider: updatedData.provider
            }).eq('id', id);

            if (error) throw error;
            setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, ...updatedData } : ing));
        } catch (error) {
            console.error("Error al actualizar ingrediente:", error);
            alert("Error al actualizar: " + (error.message || "Error desconocido"));
        }
    };

    const deleteIngredient = async (id) => {
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (!error) {
            setIngredients(prev => prev.filter(ing => ing.id !== id));
        }
    };

    // --- Recipe Actions ---
    const updateRecipe = async (productId, newIngredientsList) => {
        try {
            // 1. Delete old recipe
            const { error: delError } = await supabase.from('recipes').delete().eq('product_id', productId);
            if (delError) throw delError;

            // 2. Insert new recipe
            if (newIngredientsList.length > 0) {
                const toInsert = newIngredientsList.map(item => ({
                    product_id: productId,
                    ingredient_id: item.ingredient_id || item.ingredientId, // Handle both formats
                    quantity: item.quantity
                }));

                const { error: insError } = await supabase.from('recipes').insert(toInsert);
                if (insError) throw insError;
            }

            // 3. Update local state ONLY if DB update succeeded
            setRecipes(prev => ({ ...prev, [productId]: newIngredientsList }));
            return true;
        } catch (error) {
            console.error("Error al actualizar receta:", error);
            alert("Error al guardar la receta: " + (error.message || "Error desconocido"));
            return false;
        }
    };

    const getProductCost = (productId) => {
        // Handle both raw IDs and prefixed IDs
        const dbId = String(productId).startsWith('prod_') ? productId.replace('prod_', '') : productId;
        const recipe = recipes[dbId];
        if (!recipe || !Array.isArray(recipe)) return 0;
        return recipe.reduce((total, item) => {
            const ingredient = ingredients.find(ing => ing.id === (item.ingredient_id || item.ingredientId));
            const cost = ingredient?.cost || 0;
            return total + (cost * item.quantity);
        }, 0);
    };

    // --- Product Actions ---
    const addProduct = async (product) => {
        try {
            let imageUrl = product.image;
            if (product.imageFile) {
                const compressed = await compressImage(product.imageFile);
                imageUrl = await uploadImage(compressed);
            }

            const { data, error } = await supabase.from('products').insert([{
                name: product.name,
                price: product.price,
                category: product.category,
                image: imageUrl,
                description: product.description,
                allergens: product.allergens,
                recommended_wine: product.recommendedWine,
                is_digital_menu_visible: product.isDigitalMenuVisible !== false,
                subcategory: product.subcategory
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                const newProd = {
                    ...data[0],
                    recommendedWine: data[0].recommended_wine,
                    isDigitalMenuVisible: data[0].is_digital_menu_visible !== false
                };
                setBaseProducts(prev => [...prev, newProd]);
            }
        } catch (error) {
            console.error("Error al añadir producto:", error);
            alert("Error al crear producto: " + (error.message || "Error desconocido"));
        }
    };

    const updateProduct = async (id, updatedData) => {
        try {
            // First check if it's a regular product
            const { data: isProd } = await supabase.from('products').select('id').eq('id', id).single();

            if (isProd) {
                const { error } = await supabase.from('products').update({
                    name: updatedData.name,
                    price: parseFloat(updatedData.price) || 0,
                    category: updatedData.category,
                    image: updatedData.image,
                    description: updatedData.description,
                    allergens: updatedData.allergens,
                    recommended_wine: updatedData.recommendedWine,
                    is_digital_menu_visible: updatedData.isDigitalMenuVisible !== false,
                    subcategory: updatedData.subcategory
                }).eq('id', id);

                if (error) throw error;
                setBaseProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
            } else {
                // If not in products, check if it's a wine
                const { data: isWine } = await supabase.from('wines').select('id').eq('id', id).single();
                if (isWine) {
                    await updateWine(id, updatedData);
                } else {
                    throw new Error("No se encontró el producto ni el vino para actualizar.");
                }
            }
        } catch (error) {
            console.error("Error al actualizar producto:", error);
            alert("Error al actualizar: " + (error.message || "Error desconocido"));
        }
    };

    const deleteProduct = async (id) => {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setBaseProducts(prev => prev.filter(p => p.id !== id));
            setRecipes(prev => {
                const newRecipes = { ...prev };
                delete newRecipes[id];
                return newRecipes;
            });
        } catch (error) {
            console.error("Error al borrar producto:", error);
            alert("Error al borrar el producto: " + (error.message || "Error desconocido"));
        }
    };

    // --- Wine Actions ---
    const addWine = async (wine) => {
        try {
            let imageUrl = wine.image;
            if (wine.imageFile) {
                const compressed = await compressImage(wine.imageFile);
                imageUrl = await uploadImage(compressed, 'product-images', 'wines');
            }

            const { data, error } = await supabase.from('wines').insert([{
                name: wine.name,
                bodega: wine.bodega,
                region: wine.region || '',
                grape: wine.grape || '',
                year: parseInt(wine.year) || new Date().getFullYear(),
                stock: parseInt(wine.stock) || 0,
                price: parseFloat(wine.price) || 0,
                purchase_price: parseFloat(wine.purchasePrice) || 0,
                type: wine.type || 'Tinto',
                image: imageUrl
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                setWines(prev => [...prev, { ...data[0], purchasePrice: data[0].purchase_price }]);
            }
            return data[0]; // Return success
        } catch (error) {
            console.error("Error al añadir vino:", error);
            alert("Error al guardar vino: " + (error.message || "Error desconocido"));
            throw error; // Re-throw for UI handling
        }
    };

    const updateWine = async (id, updatedData) => {
        try {
            const { error } = await supabase.from('wines').update({
                name: updatedData.name,
                bodega: updatedData.bodega,
                region: updatedData.region,
                grape: updatedData.grape,
                year: parseInt(updatedData.year) || new Date().getFullYear(),
                stock: parseInt(updatedData.stock) || 0,
                price: parseFloat(updatedData.price) || 0,
                purchase_price: parseFloat(updatedData.purchasePrice) || 0,
                type: updatedData.type,
                image: updatedData.image
            }).eq('id', id);

            if (error) throw error;
            setWines(prev => prev.map(w => w.id === id ? { ...w, ...updatedData } : w));
            return true;
        } catch (error) {
            console.error("Error al actualizar vino:", error);
            alert("Error al actualizar vino: " + (error.message || "Error desconocido"));
            throw error;
        }
    };

    const addWineStock = async (id, quantity) => {
        try {
            const wine = wines.find(w => w.id === id);
            if (!wine) throw new Error("Vino no encontrado");

            const newStock = (parseInt(wine.stock) || 0) + quantity;
            const { error } = await supabase.from('wines').update({
                stock: newStock
            }).eq('id', id);

            if (error) throw error;
            setWines(prev => prev.map(w => w.id === id ? { ...w, stock: newStock } : w));
            return true;
        } catch (error) {
            console.error("Error al reponer stock de vino:", error);
            alert("Error al reponer stock: " + (error.message || "Error desconocido"));
            throw error;
        }
    };

    const deleteWine = async (id) => {
        const { error } = await supabase.from('wines').delete().eq('id', id);
        if (!error) {
            setWines(prev => prev.filter(w => w.id !== id));
        } else {
            alert("Error al borrar vino: " + error.message);
        }
    };

    // --- Stock Logic ---
    const deductStockForOrder = async (orderItems) => {
        // MODO EMERGENCIA: Solo aplicamos deducción si existen recetas configuradas
        // (En modo apertura rápida, esto no hará nada si no hay nada en almacén).
        try {
            const wineChanges = {};
            const ingChanges = {};

            orderItems.forEach(item => {
                const isWinePrefixed = String(item.id).startsWith('wine_');
                const isProdPrefixed = String(item.id).startsWith('prod_');
                const dbId = (isWinePrefixed || isProdPrefixed) ? item.id.split('_')[1] : item.id;

                if (item.isWine || isWinePrefixed) {
                    wineChanges[dbId] = (wineChanges[dbId] || 0) + item.quantity;
                }
                const productRecipe = recipes[dbId];
                if (productRecipe) {
                    productRecipe.forEach(recipeItem => {
                        const amount = parseFloat(recipeItem.quantity) * item.quantity;
                        const ingId = recipeItem.ingredient_id || recipeItem.ingredientId;
                        if (amount && ingId) {
                            ingChanges[ingId] = (ingChanges[ingId] || 0) + amount;
                        }
                    });
                }
            });

            // Apply Wine Stock Deductions
            for (const [id, deduction] of Object.entries(wineChanges)) {
                if (deduction > 0) {
                    const wine = wines.find(w => String(w.id) === String(id));
                    if (wine) {
                        const currentStock = parseFloat(wine.stock) || 0;
                        await updateWine(wine.id, { ...wine, stock: Math.max(0, currentStock - deduction) });
                    }
                }
            }

            // Apply Ingredient Stock Deductions
            for (const [id, deduction] of Object.entries(ingChanges)) {
                if (deduction > 0) {
                    const ing = ingredients.find(i => String(i.id) === String(id));
                    if (ing) {
                        const currentQty = parseFloat(ing.quantity) || 0;
                        await updateIngredient(ing.id, { ...ing, quantity: Math.max(0, currentQty - deduction) });
                    }
                }
            }
        } catch (error) {
            console.error("Deducción de stock omitida (Modo Apertura):", error);
            // No bloqueamos el flujo
        }
    };

    const returnStockForItems = async (items) => {
        const wineChanges = {};
        const ingChanges = {};

        items.forEach(item => {
            const isWinePrefixed = String(item.id).startsWith('wine_');
            const isProdPrefixed = String(item.id).startsWith('prod_');
            const dbId = (isWinePrefixed || isProdPrefixed) ? item.id.split('_')[1] : item.id;

            if (item.isWine || isWinePrefixed) {
                wineChanges[dbId] = (wineChanges[dbId] || 0) + item.quantity;
            }
            const productRecipe = recipes[dbId];
            if (productRecipe) {
                productRecipe.forEach(recipeItem => {
                    const amount = parseFloat(recipeItem.quantity) * item.quantity;
                    const ingId = recipeItem.ingredient_id || recipeItem.ingredientId;
                    ingChanges[ingId] = (ingChanges[ingId] || 0) + amount;
                });
            }
        });

        // Apply Wine Stock Returns
        for (const [id, returnQty] of Object.entries(wineChanges)) {
            const wine = wines.find(w => String(w.id) === String(id));
            if (wine) {
                const currentStock = parseFloat(wine.stock) || 0;
                await updateWine(wine.id, { ...wine, stock: currentStock + returnQty });
            }
        }

        // Apply Ingredient Stock Returns
        for (const [id, returnQty] of Object.entries(ingChanges)) {
            const ing = ingredients.find(i => String(i.id) === String(id));
            if (ing) {
                const currentQty = parseFloat(ing.quantity) || 0;
                await updateIngredient(ing.id, { ...ing, quantity: currentQty + returnQty });
            }
        }
    };

    const addProductWithRecipe = async (product, recipeItems) => {
        try {
            let imageUrl = product.image;
            if (product.imageFile) {
                const compressed = await compressImage(product.imageFile);
                imageUrl = await uploadImage(compressed);
            }

            const { data, error } = await supabase.from('products').insert([{
                name: product.name,
                price: product.price,
                category: product.category,
                image: imageUrl,
                subcategory: product.subcategory
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                const newId = data[0].id;
                const newProd = {
                    ...data[0],
                    recommendedWine: data[0].recommended_wine,
                    isDigitalMenuVisible: data[0].is_digital_menu_visible !== false
                };
                setBaseProducts(prev => [...prev, newProd]);
                if (recipeItems && recipeItems.length > 0) {
                    await updateRecipe(newId, recipeItems);
                }
            }
        } catch (error) {
            console.error("Error en creación rápida de producto:", error);
            alert("Error al crear producto rápido: " + (error.message || "Error desconocido"));
        }
    };

    const updateRestaurantInfo = async (data) => {
        const { error } = await supabase.from('restaurant_settings').upsert({
            id: 1,
            name: data.name,
            address: data.address,
            phone: data.phone,
            nif: data.nif,
            email: data.email,
            logo_url: data.logo,
            last_ticket_number: data.last_ticket_number,
            gem_url: data.gemUrl
        });
        if (!error) setRestaurantInfo(data);
    };

    const checkProductAvailability = (productId) => {
        if (soldOutItems.includes(productId)) return false;
        return true;
    };

    const incrementTicketNumber = async () => {
        const nextNumber = (restaurantInfo.last_ticket_number || 0) + 1;
        const { error } = await supabase
            .from('restaurant_settings')
            .update({ last_ticket_number: nextNumber })
            .eq('id', 1);

        if (!error) {
            setRestaurantInfo(prev => ({ ...prev, last_ticket_number: nextNumber }));
            return nextNumber;
        }
        return null;
    };

    // --- Supplier / Expense Actions (CLOUD) ---
    const addSupplier = async (supplier) => {
        try {
            const { data, error } = await supabase.from('suppliers').insert([{
                name: supplier.name,
                phone: supplier.phone || '',
                email: supplier.email || '',
                category: supplier.category || 'Varios',
                cif: supplier.cif || '',
                address: supplier.address || '',
                payment_terms: supplier.paymentTerms || '',
                delivery_days: supplier.deliveryDays || []
            }]).select();
            if (error) throw error;
            if (data) setSuppliers(prev => [...prev, data[0]]);
        } catch (error) {
            console.error("Error al añadir proveedor:", error);
        }
    };

    const receiveInventory = async (items, invoiceInfo) => {
        try {
            // 1. Create Invoice record
            const { data: invData, error: invError } = await supabase.from('invoices').insert([{
                supplier_id: invoiceInfo.supplierId,
                number: invoiceInfo.number,
                date: invoiceInfo.date || new Date().toISOString().split('T')[0],
                amount: invoiceInfo.totalAmount,
                status: invoiceInfo.status || 'Pendiente',
                image_url: invoiceInfo.imageUrl || ''
            }]).select();

            if (invError) throw invError;
            if (invData) setInvoices(prev => [...prev, invData[0]]);

            // 2. Process items (Ingredients or Event Inventory)
            for (const item of items) {
                if (item.type === 'ingredient') {
                    const existing = ingredients.find(i => i.id === item.id);
                    if (existing) {
                        const newQty = (parseFloat(existing.quantity) || 0) + (parseFloat(item.receivedQuantity) || 0);
                        const newCost = item.currentCost || existing.cost;

                        await updateIngredient(item.id, {
                            ...existing,
                            quantity: newQty,
                            cost: newCost
                        });
                    }
                } else if (item.type === 'event_inventory') {
                    // We update the DB directly. EventContext real-time sub will pick it up.
                    const { data: currentItem } = await supabase.from('event_inventory').select('*').eq('id', item.id).single();
                    if (currentItem) {
                        const newQty = (parseFloat(currentItem.quantity) || 0) + (parseFloat(item.receivedQuantity) || 0);
                        await supabase.from('event_inventory').update({
                            quantity: newQty
                        }).eq('id', item.id);
                    }
                }
            }

            // 3. Optional: Create Expense if marked as paid
            if (invoiceInfo.status === 'Pagado') {
                await addExpense({
                    concept: `Factura ${invoiceInfo.number} - ${invoiceInfo.supplierName || 'Proveedor'}`,
                    amount: invoiceInfo.totalAmount,
                    category: 'Suministros',
                    date: invoiceInfo.date,
                    paymentMethod: invoiceInfo.paymentMethod || 'Banco',
                    status: 'Pagado'
                });
            }

            return true;
        } catch (error) {
            console.error("Error en recepción de inventario:", error);
            alert("Error al procesar la recepción: " + error.message);
            return false;
        }
    };

    const addInvoice = async (invoice) => {
        try {
            const { data, error } = await supabase.from('invoices').insert([{
                supplier_id: invoice.supplierId,
                number: invoice.number,
                date: invoice.date,
                amount: invoice.amount,
                status: invoice.status,
                image_url: invoice.image
            }]).select();
            if (error) throw error;
            if (data) setInvoices(prev => [...prev, data[0]]);
        } catch (error) {
            console.error("Error al añadir factura:", error);
        }
    };

    const addExpense = async (expense) => {
        try {
            const { data, error } = await supabase.from('expenses').insert([{
                description: expense.concept || expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                payment_method: expense.paymentMethod || 'Efectivo',
                status: expense.status || 'Pagado',
                notes: expense.notes || ''
            }]).select();
            if (error) throw error;
            if (data) setExpenses(prev => [...prev, { ...data[0], concept: data[0].description, paymentMethod: data[0].payment_method }]);
        } catch (error) {
            console.error("Error al añadir gasto:", error);
        }
    };

    const updateSupplier = async (id, updatedData) => {
        try {
            await supabase.from('suppliers').update(updatedData).eq('id', id);
            setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
        } catch (error) {
            console.error("Error al actualizar proveedor:", error);
        }
    };

    const deleteSupplier = async (id) => {
        try {
            await supabase.from('suppliers').delete().eq('id', id);
            setSuppliers(prev => prev.filter(s => s.id !== id));
            setInvoices(prev => prev.filter(i => i.supplier_id !== id));
        } catch (error) {
            console.error("Error al borrar proveedor:", error);
        }
    };

    const deleteInvoice = async (id) => {
        try {
            await supabase.from('invoices').delete().eq('id', id);
            setInvoices(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error("Error al borrar factura:", error);
        }
    };

    const deleteExpense = async (id) => {
        try {
            await supabase.from('expenses').delete().eq('id', id);
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error al borrar gasto:", error);
        }
    };

    // --- Mermas Actions ---
    const addMerma = (merma) => {
        const newMerma = { ...merma, id: `merma-${Date.now()}`, date: new Date().toISOString() };
        setMermas(prev => [newMerma, ...prev]);

        // Also deduct from ingredient stock
        const ing = ingredients.find(i => i.id === merma.ingredientId);
        if (ing) {
            updateIngredient(ing.id, { ...ing, quantity: Math.max(0, (ing.quantity || 0) - merma.weight) });
        }
    };

    const deleteMerma = (id) => {
        const merma = mermas.find(m => m.id === id);
        if (merma) {
            const ing = ingredients.find(i => i.id === merma.ingredientId);
            if (ing) {
                updateIngredient(ing.id, { ...ing, quantity: (ing.quantity || 0) + merma.weight });
            }
        }
        setMermas(prev => prev.filter(m => m.id !== id));
    };

    // --- Physical Inventory Actions ---
    const addPhysicalInventory = (inventory) => {
        const newInv = { ...inventory, id: `inv-${Date.now()}`, date: new Date().toISOString() };
        setPhysicalInventories(prev => [newInv, ...prev]);
    };




    return (
        <InventoryContext.Provider value={{
            loading,
            ingredients,
            recipes,
            salesProducts,
            wines,
            suppliers,
            invoices,
            expenses,
            mermas,
            physicalInventories,
            restaurantInfo,
            updateRestaurantInfo,
            addIngredient,
            updateIngredient,
            deleteIngredient,
            updateRecipe,
            getProductCost,
            deductStockForOrder,
            returnStockForItems,
            addProduct,
            addProductWithRecipe,
            updateProduct,
            deleteProduct,
            addWine,
            updateWine,
            addWineStock,
            deleteWine,
            addSupplier,
            updateSupplier,
            deleteSupplier,
            addInvoice,
            deleteInvoice,
            addExpense,
            deleteExpense,
            addMerma,
            deleteMerma,
            addPhysicalInventory,
            // New professional Bodega functions
            receiveInventory,
            incrementTicketNumber,
            checkProductAvailability,
            toggleSoldOut,
            soldOutItems,
            isSyncing,
            lastSyncDate,
            forceSync,
            customProductOrder,
            updateCustomProductOrder
            // ... (rest of simple delete actions)
        }}>
            {children}
        </InventoryContext.Provider>
    );
};
