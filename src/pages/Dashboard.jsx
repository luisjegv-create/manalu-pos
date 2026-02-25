import React from 'react';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import { UtensilsCrossed, Calendar, ChefHat, TrendingUp, Settings as SettingsIcon, Box, Calculator, Wine, BookOpen, Users, QrCode } from 'lucide-react';
import Card from '../components/Card';
import { useInventory } from '../context/InventoryContext';

const Dashboard = () => {
    const navigate = useNavigate(); // Added hook
    const { restaurantInfo } = useInventory();

    const modules = [
        {
            title: "Gestión por mesas",
            icon: UtensilsCrossed,
            description: "Gestión rápida de comandas y mesas.",
            color: "blue",
            path: "/tables"
        },
        {
            title: "Barra Rápida",
            icon: Wine,
            description: "Acceso directo a TPV sin elegir mesa.",
            color: "green",
            path: "/bar-tapas?mode=quick"
        },
        {
            title: "Carta Digital (QR)",
            icon: QrCode,
            description: "Vista previa del menú para clientes.",
            color: "indigo",
            path: "/menu"
        },
        {
            title: "Manalu Eventos",
            icon: Calendar,
            description: "Planificación de bodas, bautizos y comuniones.",
            color: "pink",
            path: "/manalu-eventos" // Added path
        },
        {
            title: "Cocina (KDS)",
            icon: ChefHat,
            description: "Visualización de pedidos en tiempo real.",
            color: "orange",
            path: "/kds"
        },
        {
            title: "Almacén",
            icon: Box,
            description: "Control de stock matriz e ingredientes.",
            color: "blue",
            path: "/inventory"
        },
        {
            title: "Escandallos",
            icon: Calculator,
            description: "Gestión de recetas y costes de productos.",
            color: "orange",
            path: "/recipes"
        },
        {
            title: "Bodega",
            icon: Wine,
            description: "Gestión de vinos, añadas y stock de botellas.",
            color: "purple",
            path: "/bodega"
        },
        {
            title: "Estadísticas",
            icon: TrendingUp,
            description: "Análisis de ventas y productos top.",
            color: "purple",
            path: "/analytics"
        },
        {
            title: "Configuración",
            icon: SettingsIcon,
            description: "Ajustes del sistema y usuarios.",
            color: "blue",
            path: "/settings"
        },
        {
            title: "Manual de Usuario",
            icon: BookOpen,
            description: "Guía paso a paso para usar la aplicación.",
            color: "green",
            path: "/manual"
        },
        {
            title: 'Personal',
            icon: Users,
            path: '/staff',
            color: 'from-orange-500 to-red-500',
            description: 'Fichaje y Control'
        },
        {
            title: "Reservas de Mesa",
            icon: Calendar,
            description: "Control diario de reservas y turnos.",
            color: "yellow",
            path: "/bookings"
        },
        {
            title: "Clientes (CRM)",
            icon: Users,
            description: "Base de datos y fidelización.",
            color: "cyan",
            path: "/customers"
        }
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{
                marginBottom: '3rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0 1rem'
            }}>
                <img
                    src={restaurantInfo.logo || "/logo-principal.png"}
                    alt={restaurantInfo.name}
                    style={{
                        height: 'clamp(100px, 20vw, 180px)',
                        marginBottom: '1rem',
                        filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))',
                        maxWidth: '90%'
                    }}
                />
                <h1 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: 'var(--color-text-muted)' }}>{restaurantInfo.name}</h1>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(150px, 45vw, 300px), 1fr))',
                gap: 'clamp(1rem, 3vw, 2rem)',
                padding: '0 0.5rem'
            }}>
                {modules.map((module, index) => (
                    <Card
                        key={index}
                        {...module}
                        onClick={() => module.path ? navigate(module.path) : console.log(`Clicked ${module.title}`)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
