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
        <div
            style={{
                width: isMobile ? '100%' : '110px',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                overflowX: isMobile ? 'auto' : 'visible',
                overflowY: isMobile ? 'hidden' : 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                zIndex: 10,
                borderBottom: isMobile ? '1px solid var(--glass-border)' : 'none',
                gap: isMobile ? '0.5rem' : '0',
                padding: isMobile ? '0.5rem' : '0'
            }}
            className="no-scrollbar"
        >
            {categories.map(cat => {
                const Icon = iconMap[cat.icon] || Utensils;
                const isActive = activeCategory === cat.id;
                return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                            padding: isMobile ? '0.75rem 1rem' : '1.25rem 0.5rem',
                            border: 'none',
                            background: isActive
                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))'
                                : 'transparent',
                            color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
                            display: 'flex',
                            flexDirection: isMobile ? 'row' : 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: isMobile ? '0.85rem' : '0.7rem',
                            fontWeight: 'bold',
                            borderRadius: isMobile ? '12px' : '0',
                            borderLeft: !isMobile && isActive ? '4px solid var(--color-primary)' : 'none',
                            borderBottom: isMobile && isActive ? '2px solid var(--color-primary)' : 'none',
                            transition: 'all 0.3s ease',
                            minWidth: isMobile ? '100px' : 'auto',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Icon size={isMobile ? 18 : 24} />
                        <span style={{ textAlign: 'center' }}>{cat.name}</span>
                    </button>
                );
            })}
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default CategoryTabs;
