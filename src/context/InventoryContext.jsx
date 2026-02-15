import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

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
        name: 'Tapas y Bocatas y Manalu Eventos',
        address: 'Calle Principal, 123',
        phone: '600 000 000',
        nif: 'B12345678',
        email: 'info@manalu.com',
        logo: null
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

                // 2. Migration Logic: If Supabase is empty but localStorage has data, MIGRAR
                const localIngs = safeParse('manalu_ingredients', []);
                if ((!ingData || ingData.length === 0) && localIngs.length > 0) {
                    console.log("Migrando datos locales a la nube...");
                    // Migration process (Simplified for now - can be expanded)
                    // Note: This needs careful UUID handling if using foreign keys, 
                    // but for now we trust the migration on first launch.
                }

                // 3. Set State
                if (ingData) setIngredients(ingData);
                if (prodData) setBaseProducts(prodData);
                if (settingsData) setRestaurantInfo(settingsData);

                // Process recipes (Supabase returns array, we need object)
                if (recData) {
                    const recMap = {};
                    recData.forEach(r => {
                        if (!recMap[r.product_id]) recMap[r.product_id] = [];
                        recMap[r.product_id].push({ ingredientId: r.ingredient_id, quantity: r.quantity });
                    });
                    setRecipes(recMap);
                }

                // Temporary: still use localStorage for wines/suppliers until tables are verified
                setWines(safeParse('manalu_wines', []));
                setSuppliers(safeParse('manalu_suppliers', []));
                setInvoices(safeParse('manalu_invoices', []));
                setExpenses(safeParse('manalu_expenses', []));

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
            category: 'vinos',
            image: w.image,
            isWine: true
        }));
        const safeBaseProducts = Array.isArray(baseProducts) ? baseProducts : [];
        return [...safeBaseProducts, ...wineProducts];
    }, [baseProducts, wines]);


    // --- Ingredient Actions ---
    const addIngredient = async (ingredient) => {
        const { data, error } = await supabase.from('ingredients').insert([{
            name: ingredient.name,
            quantity: ingredient.quantity || 0,
            unit: ingredient.unit,
            cost: ingredient.cost || 0,
            min_stock: ingredient.minStock || 0,
            category: ingredient.category,
            provider: ingredient.provider || 'Sin asignar'
        }]).select();

        if (!error && data) {
            setIngredients(prev => [...prev, data[0]]);
        }
    };

    const updateIngredient = async (id, updatedData) => {
        const { error } = await supabase.from('ingredients').update({
            name: updatedData.name,
            quantity: updatedData.quantity,
            unit: updatedData.unit,
            cost: updatedData.cost,
            min_stock: updatedData.minStock,
            category: updatedData.category,
            provider: updatedData.provider
        }).eq('id', id);

        if (!error) {
            setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, ...updatedData } : ing));
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
        // 1. Delete old recipe
        await supabase.from('recipes').delete().eq('product_id', productId);

        // 2. Insert new recipe
        const toInsert = newIngredientsList.map(item => ({
            product_id: productId,
            ingredient_id: item.ingredientId,
            quantity: item.quantity
        }));

        const { error } = await supabase.from('recipes').insert(toInsert);

        if (!error) {
            setRecipes(prev => ({ ...prev, [productId]: newIngredientsList }));
        }
    };

    const getProductCost = (productId) => {
        const recipe = recipes[productId];
        if (!recipe || !Array.isArray(recipe)) return 0;
        return recipe.reduce((total, item) => {
            const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
            const cost = ingredient?.cost || 0;
            return total + (cost * item.quantity);
        }, 0);
    };

    // --- Product Actions ---
    const addProduct = async (product) => {
        const { data, error } = await supabase.from('products').insert([{
            name: product.name,
            price: product.price,
            category: product.category,
            image: product.image,
            description: product.description,
            allergens: product.allergens,
            recommended_wine: product.recommendedWine
        }]).select();

        if (!error && data) {
            setBaseProducts(prev => [...prev, data[0]]);
        }
    };

    const updateProduct = async (id, updatedData) => {
        const { error } = await supabase.from('products').update({
            name: updatedData.name,
            price: updatedData.price,
            category: updatedData.category,
            image: updatedData.image,
            description: updatedData.description,
            allergens: updatedData.allergens,
            recommended_wine: updatedData.recommendedWine
        }).eq('id', id);

        if (!error) {
            setBaseProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
        }
    };

    const deleteProduct = async (id) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) {
            setBaseProducts(prev => prev.filter(p => p.id !== id));
            setRecipes(prev => {
                const newRecipes = { ...prev };
                delete newRecipes[id];
                return newRecipes;
            });
        }
    };

    // --- Wine Actions (Mapping to localStorage for now, migration later) ---
    const addWine = (wine) => {
        const newId = wine.id || `vino-${Date.now()}`;
        setWines(prev => {
            const next = [...prev, { ...wine, id: newId }];
            localStorage.setItem('manalu_wines', JSON.stringify(next));
            return next;
        });
    };

    const updateWine = (id, updatedData) => {
        setWines(prev => {
            const next = prev.map(w => w.id === id ? { ...w, ...updatedData } : w);
            localStorage.setItem('manalu_wines', JSON.stringify(next));
            return next;
        });
    };

    const deleteWine = (id) => {
        setWines(prev => {
            const next = prev.filter(w => w.id !== id);
            localStorage.setItem('manalu_wines', JSON.stringify(next));
            return next;
        });
    };

    // --- Stock Logic ---
    const deductStockForOrder = async (orderItems) => {
        // Logic will need to be updated to perform DB updates if we want multi-device sync
        // For now, update state locally and background update DB
        orderItems.forEach(async item => {
            if (item.isWine) {
                // Update wine in localStorage/State
                updateWine(item.id, { stock: Math.max(0, (wines.find(w => w.id === item.id)?.stock || 0) - item.quantity) });
            }

            const productRecipe = recipes[item.id];
            if (productRecipe) {
                productRecipe.forEach(async recipeItem => {
                    const amount = recipeItem.quantity * item.quantity;
                    const ing = ingredients.find(i => i.id === recipeItem.ingredientId);
                    if (ing) {
                        const newQty = Math.max(0, ing.quantity - amount);
                        updateIngredient(ing.id, { ...ing, quantity: newQty });
                    }
                });
            }
        });
    };

    const addProductWithRecipe = async (product, recipeItems) => {
        const { data, error } = await supabase.from('products').insert([{
            name: product.name,
            price: product.price,
            category: product.category,
            image: product.image
        }]).select();

        if (!error && data) {
            const newId = data[0].id;
            setBaseProducts(prev => [...prev, data[0]]);
            if (recipeItems && recipeItems.length > 0) {
                await updateRecipe(newId, recipeItems);
            }
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
            logo_url: data.logo
        });
        if (!error) setRestaurantInfo(data);
    };

    // --- Supplier / Expense Actions ---
    const addSupplier = (supplier) => {
        const newId = supplier.id || `supp-${Date.now()}`;
        setSuppliers(prev => {
            const next = [...prev, { ...supplier, id: newId }];
            localStorage.setItem('manalu_suppliers', JSON.stringify(next));
            return next;
        });
    };

    const addInvoice = (invoice) => {
        const newId = invoice.id || `inv-${Date.now()}`;
        setInvoices(prev => {
            const next = [...prev, { ...invoice, id: newId, date: invoice.date || new Date().toISOString() }];
            localStorage.setItem('manalu_invoices', JSON.stringify(next));
            return next;
        });
    };

    const addExpense = (expense) => {
        const newId = expense.id || `exp-${Date.now()}`;
        setExpenses(prev => {
            const next = [...prev, { ...expense, id: newId, date: expense.date || new Date().toISOString().split('T')[0] }];
            localStorage.setItem('manalu_expenses', JSON.stringify(next));
            return next;
        });
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
            addProduct,
            addProductWithRecipe,
            updateProduct,
            deleteProduct,
            addWine,
            updateWine,
            deleteWine,
            addSupplier,
            addInvoice,
            addExpense
            // ... (rest of simple delete actions)
        }}>
            {children}
        </InventoryContext.Provider>
    );
};
