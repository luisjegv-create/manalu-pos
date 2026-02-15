import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Utensils, Monitor, Box, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const Manual = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Inicio y Mesas",
            icon: <BookOpen size={24} />,
            steps: [
                "Desde el Dashboard, selecciona 'TPV / Mesas' para ver el plano del local.",
                "Las mesas verdes están Libres, las rojas Ocupadas y las azules tienen una comanda en curso (Borrador).",
                "Pulsa sobre una mesa para entrar a tomar el pedido."
            ]
        },
        {
            title: "Tomar Comandas (Bar y Tapas)",
            icon: <Utensils size={24} />,
            steps: [
                "Selecciona una categoría arriba (Tapas, Bocatas, Bebidas...).",
                "Pulsa en los productos para añadirlos a la lista de la derecha.",
                "Usa los botones '+' y '-' para ajustar cantidades.",
                "Pulsa 'Enviar' para mandar el pedido a cocina (KDS).",
                "Pulsa 'Cuenta' para ver el ticket y cerrar la mesa (cobrar)."
            ]
        },
        {
            title: "Pantalla de Cocina (KDS)",
            icon: <Monitor size={24} />,
            steps: [
                "Aquí aparecen los pedidos enviados desde las mesas.",
                "Pulsa 'Marcar Listo' cuando los platos estén preparados. Pasarán a color verde.",
                "Pulsa 'Archivar' para limpiar la pantalla una vez servido.",
                "¡Ayuda a mantener el orden en cocina sin papeles!"
            ]
        },
        {
            title: "Inventario y Bodega",
            icon: <Box size={24} />,
            steps: [
                "Gestiona tus ingredientes y vinos desde el Dashboard.",
                "En 'Inventario', controla el stock de materias primas.",
                "En 'Bodega', gestiona las botellas de vino. Al vender un vino en el TPV, ¡se descuenta solo!",
                "Usa 'Recetas' para vincular ingredientes a tus platos y calcular costes."
            ]
        },
        {
            title: "Eventos y Catering",
            icon: <Calendar size={24} />,
            steps: [
                "Planifica bodas, comuniones o eventos de empresa.",
                "Crea presupuestos eligiendo menús y número de comensales.",
                "Controla el estado (Presupuesto > Confirmado > Pagado).",
                "Usa la vista de Calendario para ver la ocupación del mes."
            ]
        }
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                >
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0 }}>Manual de Usuario</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Guía rápida de uso de la aplicación</p>
                </div>
            </header>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {sections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        className="glass-panel"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <div style={{ color: 'var(--color-primary)' }}>{section.icon}</div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{section.title}</h2>
                        </div>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {section.steps.map((step, i) => (
                                <li key={i} style={{ lineHeight: '1.6', color: 'var(--color-text-light)' }}>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <p>Aplicación desarrollada para Sonia - Tapas y Bocatas & Manalu Eventos</p>
            </div>
        </div>
    );
};

export default Manual;
