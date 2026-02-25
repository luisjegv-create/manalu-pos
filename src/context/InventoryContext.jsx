import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { uploadImage, compressImage } from '../utils/storageUtils';

const InventoryContext = createContext();

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
    const [restaurantInfo, setRestaurantInfo] = useState({
        name: 'Luis Jesus García-Valcárcel López-Tofiño',
        address: 'Calle Principal, 123',
        phone: '600 000 000',
        nif: 'B12345678',
        email: 'info@manalu.com',
        logo: '/logo-principal.png',
        last_ticket_number: 0
    });

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

    // --- INITIAL LOAD & MIGRATION ---
    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            try {
                // 1. Try to fetch from Supabase
                const { data: ingData } = await supabase.from('ingredients').select('*');
                const { data: prodData } = await supabase.from('products').select('*');
                const { data: recData } = await supabase.from('recipes').select('*');
                const { data: settingsData } = await supabase.from('restaurant_settings').select('*').single();

                // 2. Migration Logic: If Supabase is empty but localStorage has data, MIGRATE
                const localIngs = safeParse('manalu_ingredients', []);
                if ((!ingData || ingData.length === 0) && localIngs.length > 0) {
                    console.log("Migrando datos locales a la nube...");
                    for (const ing of localIngs) {
                        await supabase.from('ingredients').insert([{
                            name: ing.name,
                            quantity: ing.quantity || 0,
                            unit: ing.unit || 'uds',
                            cost: ing.cost || 0,
                            min_stock: ing.minStock || ing.critical || 5, // Prioritize minStock, then critical, then default to 5
                            category: ing.category || 'alimentos',
                            provider: ing.provider || 'Sin asignar'
                        }]);
                    }
                    // Re-fetch to get IDs from database
                    const { data: migratedData } = await supabase.from('ingredients').select('*');
                    if (migratedData) setIngredients(migratedData);
                } else if (ingData) {
                    setIngredients(ingData.map(i => ({ ...i, critical: i.min_stock })));
                }
                if (prodData) {
                    // Update 'tapas' to 'raciones' in database if any exist
                    const tapasProducts = prodData.filter(p => p.category === 'tapas');
                    if (tapasProducts.length > 0) {
                        console.log(`Migrating ${tapasProducts.length} products from tapas to raciones...`);
                        await supabase.from('products').update({ category: 'raciones' }).eq('category', 'tapas');
                    }

                    setBaseProducts(prodData.map(p => ({
                        ...p,
                        category: p.category === 'tapas' ? 'raciones' : p.category,
                        recommendedWine: p.recommended_wine,
                        isDigitalMenuVisible: p.is_digital_menu_visible !== false
                    })));
                }
                if (settingsData) {
                    setRestaurantInfo({
                        ...settingsData,
                        logo: settingsData.logo_url,
                        last_ticket_number: settingsData.last_ticket_number || 0
                    });
                }

                // Process recipes (Supabase returns array, we need object)
                if (recData) {
                    const recMap = {};
                    recData.forEach(r => {
                        if (!recMap[r.product_id]) recMap[r.product_id] = [];
                        recMap[r.product_id].push({ ingredientId: r.ingredient_id, quantity: r.quantity });
                    });
                    setRecipes(recMap);
                }

                const { data: wineData } = await supabase.from('wines').select('*');
                const localWines = safeParse('manalu_wines', []);
                if ((!wineData || wineData.length === 0) && localWines.length > 0) {
                    console.log("Migrando vinos a la nube...");
                    for (const wine of localWines) {
                        await supabase.from('wines').insert([{
                            name: wine.name,
                            bodega: wine.bodega,
                            region: wine.region,
                            grape: wine.grape,
                            year: wine.year,
                            stock: wine.stock || 0,
                            price: wine.price || 0,
                            purchase_price: wine.purchasePrice || 0,
                            type: wine.type || 'Tinto',
                            image: wine.image
                        }]);
                    }
                    const { data: migratedWines } = await supabase.from('wines').select('*');
                    if (migratedWines) setWines(migratedWines.map(w => ({ ...w, purchasePrice: w.purchase_price })));
                } else if (wineData) {
                    setWines(wineData.map(w => ({ ...w, purchasePrice: w.purchase_price })));
                }

                // 3. Suppliers, Invoices, Expenses Migration
                const { data: suppData } = await supabase.from('suppliers').select('*');
                const localSupps = safeParse('manalu_suppliers', []);
                if ((!suppData || suppData.length === 0) && localSupps.length > 0) {
                    console.log("Migrando proveedores a la nube...");
                    for (const s of localSupps) {
                        await supabase.from('suppliers').insert([{ name: s.name, phone: s.phone, email: s.email, category: s.category }]);
                    }
                    const { data: migrated } = await supabase.from('suppliers').select('*');
                    if (migrated) setSuppliers(migrated);
                } else if (suppData) {
                    setSuppliers(suppData);
                }

                const { data: invData } = await supabase.from('invoices').select('*');
                const localInvs = safeParse('manalu_invoices', []);
                if ((!invData || invData.length === 0) && localInvs.length > 0) {
                    console.log("Migrando facturas a la nube...");
                    for (const i of localInvs) {
                        // Find current DB ID for supplier if possible, or just skip reference for migration if risky
                        await supabase.from('invoices').insert([{ number: i.number, date: i.date, amount: i.amount, status: i.status, image_url: i.image_url || i.image }]);
                    }
                    const { data: migrated } = await supabase.from('invoices').select('*');
                    if (migrated) setInvoices(migrated);
                } else if (invData) {
                    setInvoices(invData);
                }

                const { data: expData } = await supabase.from('expenses').select('*');
                const localExps = safeParse('manalu_expenses', []);
                if ((!expData || expData.length === 0) && localExps.length > 0) {
                    console.log("Migrando gastos a la nube...");
                    for (const e of localExps) {
                        await supabase.from('expenses').insert([{ description: e.description, amount: e.amount, category: e.category, date: e.date }]);
                    }
                    const { data: migrated } = await supabase.from('expenses').select('*');
                    if (migrated) setExpenses(migrated);
                } else if (expData) {
                    setExpenses(expData);
                }

            } catch (error) {
                console.error("Error al inicializar datos:", error);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, []);

    // Drive all sellable products
    const salesProducts = React.useMemo(() => {
        const safeWines = Array.isArray(wines) ? wines : [];
        const wineProducts = safeWines.map(w => ({
            id: w.id,
            name: w.name,
            price: w.price,
            purchasePrice: w.purchasePrice || 0,
            category: 'vinos',
            image: w.image,
            isWine: true
        }));
        const safeBaseProducts = Array.isArray(baseProducts) ? baseProducts : [];
        return [...safeBaseProducts, ...wineProducts];
    }, [baseProducts, wines]);


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

            setRecipes(prev => ({ ...prev, [productId]: newIngredientsList }));
        } catch (error) {
            console.error("Error al actualizar receta:", error);
            alert("Error al guardar la receta: " + (error.message || "Error desconocido"));
        }
    };

    const getProductCost = (productId) => {
        const recipe = recipes[productId];
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
                is_digital_menu_visible: product.isDigitalMenuVisible !== false
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
                    is_digital_menu_visible: updatedData.isDigitalMenuVisible !== false
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
        orderItems.forEach(async item => {
            if (item.isWine) {
                const currentStock = wines.find(w => w.id === item.id)?.stock || 0;
                updateWine(item.id, { stock: Math.max(0, currentStock - item.quantity) });
            }

            const productRecipe = recipes[item.id];
            if (productRecipe) {
                productRecipe.forEach(async recipeItem => {
                    const amount = recipeItem.quantity * item.quantity;
                    const ing = ingredients.find(i => i.id === (recipeItem.ingredient_id || recipeItem.ingredientId));
                    if (ing) {
                        const newQty = Math.max(0, ing.quantity - amount);
                        updateIngredient(ing.id, { ...ing, quantity: newQty });
                    }
                });
            }
        });
    };

    const returnStockForItems = async (items) => {
        items.forEach(async item => {
            if (item.isWine) {
                const currentStock = wines.find(w => w.id === item.id)?.stock || 0;
                await updateWine(item.id, { stock: currentStock + item.quantity });
            }

            const productRecipe = recipes[item.id];
            if (productRecipe) {
                productRecipe.forEach(async recipeItem => {
                    const amount = recipeItem.quantity * item.quantity;
                    const ing = ingredients.find(i => i.id === (recipeItem.ingredient_id || recipeItem.ingredientId));
                    if (ing) {
                        const newQty = ing.quantity + amount;
                        await updateIngredient(ing.id, { ...ing, quantity: newQty });
                    }
                });
            }
        });
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
                image: imageUrl
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
            last_ticket_number: data.last_ticket_number
        });
        if (!error) setRestaurantInfo(data);
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
                phone: supplier.phone,
                email: supplier.email,
                category: supplier.category
            }]).select();
            if (error) throw error;
            if (data) setSuppliers(prev => [...prev, data[0]]);
        } catch (error) {
            console.error("Error al añadir proveedor:", error);
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
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date
            }]).select();
            if (error) throw error;
            if (data) setExpenses(prev => [...prev, data[0]]);
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
            incrementTicketNumber
            // ... (rest of simple delete actions)
        }}>
            {children}
        </InventoryContext.Provider>
    );
};
