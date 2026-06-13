'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
    LayoutDashboard, Store, Sparkles, Users, History, Settings, Menu, X, ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const { isAdmin, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (loading || !isAdmin) return null;

    const navItems = [
        { label: '어드민 홈', icon: LayoutDashboard, path: '/admin', color: '#6366f1' },
        { label: '업소 관리', icon: Store, path: '/admin/all-stores', color: '#a855f7' },
        { label: '쿠폰 & 핫딜', icon: Sparkles, path: '/admin/all-coupons', color: '#ef4444' },
        { label: '사용 내역', icon: History, path: '/admin/redemptions', color: '#10b981' },
        { label: '전체 회원', icon: Users, path: '/admin/members', color: '#3b82f6' },
        { label: '환경 설정', icon: Settings, path: '/admin/settings', color: '#64748b' }
    ];

    const isCurrent = (path) => {
        if (path === '/admin') return pathname === '/admin';
        return pathname.startsWith(path);
    };

    return (
        <header style={{
            background: '#0f172a',
            color: 'white',
            padding: '12px 16px',
            borderBottom: '1px solid #1e293b',
            position: 'sticky',
            top: 0,
            zIndex: 40000,
            fontFamily: "'Pretendard', sans-serif"
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Logo / Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/admin')}>
                    <span style={{
                        background: 'linear-gradient(135deg, #ef4444, #f97316)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        letterSpacing: '0.05em'
                    }}>
                        VINATONG
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 900, letterSpacing: '-0.3px' }}>어드민 제어판</span>
                </div>

                {/* PC Navigation */}
                <nav style={{ display: 'none', gap: '4px' }} className="lg:flex">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const active = isCurrent(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    color: active ? '#ffffff' : '#94a3b8',
                                    fontWeight: active ? 800 : 600,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={14} color={active ? item.color : '#64748b'} />
                                {item.label}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => router.push('/mypage')}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'transparent',
                            color: '#94a3b8',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginLeft: '8px'
                        }}
                    >
                        <ArrowLeft size={14} /> 마이페이지
                    </button>
                </nav>

                {/* Mobile Menu Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="lg:hidden">
                    <button
                        onClick={() => router.push('/mypage')}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'transparent',
                            color: '#cbd5e1',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        마이페이지
                    </button>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#0f172a',
                    borderBottom: '1px solid #1e293b',
                    padding: '8px 16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: '0 10px 15px rgba(0,0,0,0.3)'
                }} className="lg:hidden">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const active = isCurrent(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    router.push(item.path);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                                    color: active ? 'white' : '#94a3b8',
                                    fontWeight: active ? 800 : 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textAlign: 'left'
                                }}
                            >
                                <Icon size={16} color={item.color} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Tailwind utility classes injection fallback */}
            <style>{`
                @media (min-width: 1024px) {
                    .lg\\:flex { display: flex !important; }
                    .lg\\:hidden { display: none !important; }
                }
            `}</style>
        </header>
    );
}
