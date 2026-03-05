export const askGemini = async (messages, restaurantData) => {
    const apiKey = localStorage.getItem('manalu_gemini_api_key');
    if (!apiKey) {
        throw new Error("API Key no configurada.");
    }

    const { name, address, products } = restaurantData;

    // Simplify products string to save tokens
    const productList = products.filter(p => p.isDigitalMenuVisible !== false).map(p => ({
        n: p.name,
        p: p.price + '€',
        d: p.description,
        a: p.allergens?.join(', ') || 'ninguno'
    }));

    const systemPrompt = `Eres Luisje, el amable e ingenioso camarero virtual del restaurante "${name}" ubicado en ${address || 'España'}. 
Tu objetivo es atender a los clientes de forma cercana, amigable y tuteándolos, ayudándoles a elegir lo mejor de la carta, sugiriendo maridajes o combinaciones y resolviendo dudas sobre precios y alérgenos.
Eres un experto en la carta de tu local. 
Regla de oro: Limítate ÚNICA Y EXCLUSIVAMENTE a la información del menú proporcionada a continuación. Si te preguntan algo fuera de la temática del restaurante, sobre platos que no existen en la carta proporcionada, o temas no relacionados, declina responder de forma educada, con humor si es posible, reconduciendo al cliente a la carta. No inventes platos ni precios.

MENÚ ACTUAL (n: nombre, p: precio, d: descripción, a: alérgenos):
${JSON.stringify(productList)}`;

    const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    const body = {
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
        }
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Error de la API de Gemini.");
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("Respuesta vacía de la IA.");
        return text;
    } catch (error) {
        console.error("AI Service Error:", error);
        throw new Error(error.message || "Error al conectar con la API de Gemini");
    }
};
