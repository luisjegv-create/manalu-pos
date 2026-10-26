/**
 * Helper utilities for classifying orders and sales as "Solo Bebida" vs "Mesa Comida"
 */

export const isDrinksOnlyTable = (table) => {
    if (!table) return false;
    if (table.isDrinksOnly === true || table.orderType === 'drinks') return true;
    if (table.diners === 0 || table.diners === '0') return true;
    return false;
};

export const isDrinksOnlySale = (sale) => {
    if (!sale) return false;

    // 1. Explicit properties
    if (sale.isDrinksOnly === true || sale.orderType === 'drinks') return true;
    if (sale.diners === 0 || sale.diners === '0') return true;

    // 2. Customer info JSON check
    if (sale.customer_info) {
        try {
            const parsed = typeof sale.customer_info === 'string' ? JSON.parse(sale.customer_info) : sale.customer_info;
            if (parsed && (parsed.isDrinksOnly === true || parsed.orderType === 'drinks')) return true;
        } catch (e) {}
    }

    // 3. Fallback: analyse sold items
    const rawItems = sale.items;
    let items = [];
    if (typeof rawItems === 'string') {
        try {
            if (rawItems.startsWith('[')) items = JSON.parse(rawItems);
        } catch (e) {}
    } else if (Array.isArray(rawItems)) {
        items = rawItems;
    }

    if (items.length > 0) {
        const isDrinkItem = (item) => {
            const cat = (item.category || '').toLowerCase().trim();
            const name = (item.name || '').toLowerCase().trim();

            // Known drink categories
            const drinkCats = [
                'bebidas', 'bebida', 'vinos', 'vino', 'cafes', 'cafe', 
                'cervezas', 'cerveza', 'copas', 'licores', 'refrescos', 'cocteles', 'cocktails'
            ];
            if (drinkCats.includes(cat)) return true;

            // Food keyword detection (if these are present, definitely food)
            const foodKeywords = [
                'tapa', 'tapas', 'racion', 'raciones', 'ración', 'bocadillo', 'bocadillos', 
                'montadito', 'montaditos', 'plato', 'platos', 'ensalada', 'ensaladas',
                'patatas', 'bravas', 'croqueta', 'croquetas', 'hamburguesa', 'postre', 
                'postres', 'tarta', 'tarta de queso', 'secreto', 'pluma', 'solomillo',
                'calamares', 'chipirones', 'pulpo', 'sepia', 'oreja', 'morcilla', 'chorizo',
                'alitas', 'pollo', 'pescado', 'carne', 'pan', 'entrecot', 'chuleton', 'chuletón'
            ];
            if (foodKeywords.some(kw => name.includes(kw))) {
                return false;
            }

            // Common drink keywords
            const drinkKeywords = [
                'caña', 'cana', 'cerveza', 'tubo', 'jarra', 'tercio', 'doble', 'botellin',
                'vino', 'tinto', 'blanco', 'verdejo', 'ribera', 'rioja', 'rosado', 'cava',
                'agua', 'coca cola', 'coca-cola', 'fanta', 'aquarius', 'nestea', 'sprite',
                'tonica', 'tónica', 'zumo', 'batido', 'cafe', 'café', 'cortado', 'carajillo',
                'descafeinado', 'poleo', 'manzanilla', 'infusion', 'infusión', 'te ', 'té',
                'copa', 'cubata', 'gin', 'ron', 'whisky', 'vodka', 'vermut', 'vermouth',
                'chupito', 'licor', 'baileys', 'orujo', 'pacharan', 'pacharàn', 'ginebra'
            ];
            if (drinkKeywords.some(kw => name.includes(kw))) {
                return true;
            }

            return false;
        };

        const hasFood = items.some(item => !isDrinkItem(item));
        if (!hasFood) {
            return true;
        }
    }

    return false;
};
