'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Store, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { playTickSound } from '@/utils/sound';

const BottomNav = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const activeEl = document.activeElement;
            const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
            const isHeightShrunk = window.innerHeight < window.screen.height * 0.75;
            
            if (isInputActive && isHeightShrunk) {
                setIsKeyboardOpen(true);
            } else {
                setIsKeyboardOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        
        const handleFocusIn = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                setTimeout(handleResize, 100);
            }
        };
        const handleFocusOut = () => {
            setTimeout(handleResize, 100);
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    const navItems = [
        { id: 'coupons', label: '쿠폰북', icon: Home, path: '/' },
        { id: 'service', label: '쿠폰입점', icon: Store, path: '/partner-apply' },
        { id: 'promos', label: '커뮤니티', icon: MessageSquare, path: '/board' },
        { id: 'mypage', label: '마이페이지', icon: User, path: user ? '/mypage' : '/login' }
    ];

    const isActive = (path) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/') {
            if (pathname.startsWith(path)) return true;
            if (path.includes('/mypage') && (pathname.startsWith('/mypage') || pathname.startsWith('/login'))) return true;
        }
        return false;
    };

    const isStorePage = pathname.includes('/store/');

    const handleNavigate = (path) => {
        playTickSound();
        router.push(path);
    };

    if (isKeyboardOpen || isStorePage) return null;

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            WebkitTransform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            height: 'calc(70px + env(safe-area-inset-bottom))',
            background: '#ffffff',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 10px env(safe-area-inset-bottom) 10px',
            borderTop: '1px solid #f1f5f9',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.03)',
            zIndex: 30000
        }}>
            {navItems.map((item) => {
                const active = isActive(item.path);
 
                return (
                    <div key={item.id} style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        position: 'relative',
                        flex: 1
                    }}>
                        <button
                            onClick={() => handleNavigate(item.path)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                padding: '5px 0',
                                width: '100%',
                                color: active ? '#6366f1' : '#64748b',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                width: '38px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                background: active ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                transition: 'all 0.2s'
                            }}>
                                <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                            </div>
                            <span style={{
                                fontSize: '0.68rem',
                                fontWeight: active ? 850 : 700,
                                letterSpacing: '-0.3px'
                            }}>
                                {item.label}
                            </span>
                        </button>
                        
                        {active && (
                            <div 
                                style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: '#6366f1'
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default BottomNav;
