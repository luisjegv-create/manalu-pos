import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <h1 style={{ color: '#ef4444' }}>Vaya, algo ha fallado</h1>
                    <p>La aplicación ha encontrado un error inesperado.</p>
                    <pre style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', maxWidth: '90%', overflow: 'auto', textAlign: 'left' }}>
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => { window.location.reload(); }}
                            style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            🔄 Recargar Página
                        </button>
                        <button
                            onClick={() => { 
                                if(confirm("CUIDADO: Esto borrará todas las mesas y pedidos no guardados. ¿Estás seguro de que quieres borrar la memoria?")) {
                                    localStorage.clear(); 
                                    window.location.reload(); 
                                }
                            }}
                            style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            Borrar Memoria Local (Último Recurso)
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
