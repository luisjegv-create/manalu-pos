import React, { useState } from 'react';
import { Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PinLock = () => {
    const { login } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        const success = login(pin);
        if (!success) {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 3000);
        }
    };

    const handleNumberClick = (num) => {
        if (pin.length < 10) { // arbitrary max length
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '1rem',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div className="glass-panel" style={{
                maxWidth: '400px',
                width: '100%',
                padding: '3rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.8)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    padding: '1rem',
                    borderRadius: '50%',
                    marginBottom: '1.5rem',
                    color: '#3b82f6'
                }}>
                    <Lock size={40} />
                </div>

                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: 'white' }}>Acceso Restringido</h1>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Introduce tu PIN de empleado</p>

                <form onSubmit={handleLogin} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <input
                            type="password"
                            value={pin}
                            readOnly
                            style={{
                                width: '100%',
                                padding: '1.2rem',
                                fontSize: '2rem',
                                textAlign: 'center',
                                letterSpacing: '12px',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.3)',
                                border: error ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginBottom: '1.5rem'
                    }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleNumberClick(num.toString())}
                                style={{
                                    padding: '1rem',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleDelete}
                            style={{
                                padding: '1rem',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '12px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                            DEL
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNumberClick('0')}
                            style={{
                                padding: '1rem',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            0
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#3b82f6',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                            onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
                        >
                            <LogIn size={24} />
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            animation: 'shake 0.5s'
                        }}>
                            <AlertCircle size={16} /> PIN Incorrecto
                        </div>
                    )}
                </form>
            </div>

            <style>
                {`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                `}
            </style>
        </div>
    );
};

export default PinLock;
