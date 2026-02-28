import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ title, icon: Icon, description, onClick, color = "blue" }) => {
    const colorMap = {
        blue: "var(--color-primary)",
        pink: "var(--color-secondary)",
        purple: "var(--color-accent)",
        green: "#10b981",
        orange: "#f59e0b"
    };

    const accentColor = colorMap[color] || colorMap.blue;

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                padding: '2rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--color-surface)',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                color: 'white'
            }}
            onClick={onClick}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: accentColor
                }}
            />

            <div
                style={{
                    background: `${accentColor}25`,
                    padding: '1rem',
                    borderRadius: '50%',
                    marginBottom: '1rem',
                    color: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 20px ${accentColor}20`
                }}
            >
                <Icon size={32} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'white' }}>{title}</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                {description}
            </p>
        </motion.div>
    );
};

export default Card;
