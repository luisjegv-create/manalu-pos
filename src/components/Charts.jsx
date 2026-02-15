import React from 'react';
import { motion } from 'framer-motion';

export const BarChart = ({ data, color = '#3b82f6', height = 200 }) => {
    const max = Math.max(...data.map(d => d.value));

    return (
        <div style={{ height: height, display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
            {data.map((item, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.value / max) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        style={{
                            width: '100%',
                            background: color,
                            borderRadius: '4px 4px 0 0',
                            minHeight: '4px',
                            opacity: 0.8
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export const LineChart = ({ data, color = '#ec4899', height = 200 }) => {
    const max = Math.max(...data.map(d => d.value));
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value / max) * 100);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div style={{ height: height, position: 'relative', padding: '1rem 0' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    d={`M0,100 ${points.split(' ').map(p => `L${p}`).join(' ')} L100,100 Z`}
                    fill="url(#gradient)"
                    stroke="none"
                />
                <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={`${(i / (data.length - 1)) * 100}%`}
                        cy={`${100 - ((d.value / max) * 100)}%`}
                        r="3"
                        fill={color}
                        stroke="var(--color-surface)"
                        strokeWidth="2"
                    />
                ))}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                {data.map((item, index) => (
                    <span key={index} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
                ))}
            </div>
        </div>
    );
};
