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
            className="glass-panel"
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
                overflow: 'hidden'
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
                    background: `${accentColor}20`,
                    padding: '1rem',
                    borderRadius: '50%',
                    marginBottom: '1rem',
                    color: accentColor
                }}
            >
                <Icon size={32} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{title}</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                {description}
            </p>
        </motion.div>
    );
};

export default Card;
