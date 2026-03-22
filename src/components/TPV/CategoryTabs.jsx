import React from 'react';
import { motion } from 'framer-motion';
import {
    Utensils, Sandwich, Beer, Cake, Wine,
    Coffee, Soup, Pizza, GlassWater, Beef, Baby
} from 'lucide-react';

const iconMap = {
    Utensils, Sandwich, Beer, Cake, Wine,
    Coffee, Soup, Pizza, GlassWater, Beef, Baby
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
                            padding: isMobile ? '0.8rem 0.5rem' : '1.2rem 0.5rem',
                            border: 'none',
                            background: isActive
                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))'
                                : 'transparent',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer',
                            fontSize: isMobile ? '0.85rem' : '0.8rem',
                            fontWeight: isActive ? '800' : '600',
                            borderRadius: isMobile ? '12px' : '0',
                            borderLeft: !isMobile && isActive ? '4px solid var(--color-primary)' : 'none',
                            borderBottom: isMobile && isActive ? '3px solid var(--color-primary)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            minWidth: isMobile ? '90px' : 'auto',
                            whiteSpace: 'nowrap',
                            opacity: isActive ? 1 : 0.7,
                            transform: isActive ? 'scale(1.02)' : 'scale(1)'
                        }}
                    >
                        <Icon size={isMobile ? 16 : 20} />
                        <span style={{ textAlign: 'center' }}>{cat.name}</span>
                    </button>
                );
            })}
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default CategoryTabs;
