import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import { askGemini } from '../services/aiService';

const CustomerAIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '¡Hola! Soy Luisje, tu camarero virtual. ¿Qué te apetece tomar hoy? Pregúntame por nuestra carta, alérgenos o sugerencias.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { restaurantInfo, salesProducts } = useInventory();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const restaurantData = {
                name: restaurantInfo.name,
                address: restaurantInfo.address,
                products: salesProducts,
                apiKey: localStorage.getItem('manalu_gemini_api_key')
            };

            // Only send the last 10 messages to save tokens
            let historyToSend = newMessages.slice(-10);
            // Gemini API requires the first message to be from the user
            if (historyToSend.length > 0 && historyToSend[0].role === 'assistant') {
                historyToSend = historyToSend.slice(1);
            }
            const responseText = await askGemini(historyToSend, restaurantData);

            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${error.message}. Por favor, revisa que la API Key es correcta en Ajustes.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '200px',
                    left: 'calc(50% - 37.5px)',
                    width: '75px',
                    height: '75px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    color: 'white',
                    border: '4px solid #0f172a',
                    boxShadow: '0 10px 25px rgba(109, 40, 217, 0.6), 0 0 0 2px rgba(139, 92, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    cursor: 'pointer'
                }}
            >
                <Sparkles size={34} />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            bottom: '205px',
                            left: '50%',
                            width: '92%',
                            maxWidth: '400px',
                            height: '500px',
                            maxHeight: '70vh',
                            background: '#1e293b',
                            borderRadius: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            zIndex: 101,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(255,255,255,0.8)',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img
                                        src="/avatar-camarero.png"
                                        alt="Luisje Camarero"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Luisje&backgroundColor=c0aede&hair=shortHairShortWaved&facialHair=beardLight&clothes=blazerAndShirt";
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                    <span style={{ fontWeight: 'bold' }}>Luisje (Camarero Virtual)</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Siempre dispuesto a ayudarte</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '4px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                        {msg.role === 'user' ? 'Tú' : 'Asistente'}
                                    </span>
                                    <div style={{
                                        background: msg.role === 'user' ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        padding: '0.8rem 1rem',
                                        borderRadius: '16px',
                                        borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                                        borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.4',
                                        border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center', padding: '1rem', color: '#94a3b8' }}>
                                    <Loader2 className="animate-spin" size={16} /> <span style={{ fontSize: '0.8rem' }}>Escribiendo...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} style={{
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            gap: '0.5rem'
                        }}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Pregúntame algo..."
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '20px',
                                    padding: '0.8rem 1rem',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                style={{
                                    background: input.trim() && !isLoading ? '#8b5cf6' : 'rgba(139, 92, 246, 0.5)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '45px',
                                    height: '45px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CustomerAIAssistant;
