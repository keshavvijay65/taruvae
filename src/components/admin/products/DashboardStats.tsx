'use client';

import { Product } from '@/context/CartContext';
import { useEffect, useState } from 'react';

interface DashboardStatsProps {
    products: Product[];
}

export default function DashboardStats({ products }: DashboardStatsProps) {
    const [animatedStats, setAnimatedStats] = useState({
        total: 0,
        lowStock: 0,
        newToday: 0,
        totalValue: 0
    });

    // Calculate stats
    const stats = {
        total: products.length,
        lowStock: products.filter(p => !p.inStock || (p as any).stock < 10).length,
        newToday: products.filter(p => {
            const productId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            const today = new Date().setHours(0, 0, 0, 0);
            const productDate = new Date(productId).setHours(0, 0, 0, 0);
            return productDate === today;
        }).length,
        totalValue: products.reduce((sum, p) => sum + (p.price || 0), 0)
    };

    // Animate counters
    useEffect(() => {
        const duration = 1000;
        const steps = 60;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            setAnimatedStats({
                total: Math.floor(stats.total * progress),
                lowStock: Math.floor(stats.lowStock * progress),
                newToday: Math.floor(stats.newToday * progress),
                totalValue: Math.floor(stats.totalValue * progress)
            });

            if (currentStep >= steps) {
                clearInterval(interval);
                setAnimatedStats(stats);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [products]);

    const statCards = [
        {
            label: 'Total Products',
            value: animatedStats.total,
            icon: '📦',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            label: 'Low Stock',
            value: animatedStats.lowStock,
            icon: '⚠️',
            color: 'from-amber-500 to-orange-600',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-600'
        },
        {
            label: 'New Today',
            value: animatedStats.newToday,
            icon: '✨',
            color: 'from-green-500 to-emerald-600',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            label: 'Total Value',
            value: `₹${(animatedStats.totalValue / 1000).toFixed(1)}K`,
            icon: '💰',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, index) => (
                <div
                    key={stat.label}
                    className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
                    style={{
                        animation: `fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`
                    }}
                >
                    {/* Gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{stat.icon}</span>
                            <div className={`${stat.bgColor} rounded-lg p-2`}>
                                <svg className={`w-5 h-5 ${stat.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                                {typeof stat.value === 'number' ? stat.value : stat.value}
                            </p>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
