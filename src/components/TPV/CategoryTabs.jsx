import React from 'react';
import { motion } from 'framer-motion';
import {
    Utensils, Sandwich, Beer, Cake, Wine,
    Coffee, Soup, Pizza, GlassWater
} from 'lucide-react';

const iconMap = {
    Utensils, Sandwich, Beer, Cake, Wine,
    Coffee, Soup, Pizza, GlassWater
};

const CategoryTabs = ({ categories, activeCategory, setActiveCategory, isMobile }) => {
    return (
        <div style={{
            width: isMobile ? '100%' : '100px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            overflowX: isMobile ? 'auto' : 'visible',
            overflowY: isMobile ? 'hidden' : 'auto',
            borderRight: isMobile ? 'none' : '1px solid var(--glass-border)',
            borderBottom: isMobile ? '1px solid var(--glass-border)' : 'none',
            zIndex: 10
        }}>
            {categories.map(cat => {
                const Icon = iconMap[cat.icon] || Utensils;
                const isActive = activeCategory === cat.id;
                return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                            padding: '1.25rem 0.5rem',
                            border: 'none',
                            background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))' : 'transparent',
                            color: isActive ? 'var(--color-primary)' : '#94a3b8',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            borderLeft: !isMobile && isActive ? '4px solid var(--color-primary)' : '4px solid transparent',
                            borderBottom: isMobile && isActive ? '4px solid var(--color-primary)' : '4px solid transparent',
                            transition: 'all 0.3s ease',
                            minWidth: isMobile ? '80px' : 'auto'
                        }}
                    >
                        <Icon size={isMobile ? 20 : 24} />
                        <span style={{ textAlign: 'center' }}>{cat.name}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default CategoryTabs;
