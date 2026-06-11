"use client";

import { User, Menu, Search, MessageCircle, ShieldCheck, Store as StoreIcon, X, LogIn, UserPlus, ShoppingBag, MessageSquare, ChevronDown, LayoutGrid, MapPin, Video } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsService } from '@/services/SettingsService';
import { StoreService } from '@/services/StoreService';
import { playTickSound } from '@/utils/sound';

const HeaderV2 = ({ searchQuery, setSearchQuery, isTransparent = false }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAdmin, isStoreOwner, logout } = useAuth();
    const [windowWidth, setWindowWidth] = useState(375);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [settings, setSettings] = useState({
        floatingKakaoVisible: true,
        kakaoChatUrl: "https://open.kakao.com/o/sBuie8fi"
    });

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);

        const unsubscribe = SettingsService.subscribe((newSettings) => {
            if (newSettings) {
                setSettings({
                    floatingKakaoVisible: newSettings.floatingKakaoVisible !== undefined ? newSettings.floatingKakaoVisible : true,
                    kakaoChatUrl: newSettings.kakaoChatUrl || "https://open.kakao.com/o/sBuie8fi"
                });
            }
        });
        
        return () => {
            unsubscribe();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const isMobile = windowWidth < 1024;

    const navLinkStyle = {
        fontSize: '0.85rem',
        fontWeight: 800,
        color: isTransparent ? '#f8fafc' : '#475569',
        textDecoration: 'none',
        padding: '8px 12px',
        borderRadius: '8px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap'
    };

    const dropdownItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        color: '#1e293b',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: 700,
        borderRadius: '10px',
        transition: 'all 0.2s',
        cursor: 'pointer'
    };

    return (
        <header style={{
            width: '100%',
            background: isTransparent ? 'transparent' : '#ffffff',
            display: 'flex', 
            flexDirection: 'column',
            borderBottom: isTransparent ? 'none' : '1px solid #f1f5f9',
            zIndex: 1000,
            position: isTransparent ? 'relative' : 'sticky',
            top: 0
        }}>
            {/* Top Bar */}
            <div style={{
                height: '64px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0 20px',
                gap: '16px'
            }}>
                <div onClick={() => {
                    playTickSound();
                    StoreService.clearCache();
                    window.location.href = '/';
                }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <img 
                        src="/dcvietnam-logo.png" 
                        alt="DC Vietnam Logo" 
                        style={{ 
                            height: '27px',
                            objectFit: 'contain'
                        }} 
                    />
                </div>

                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
                            <Link href="/localinfo" onClick={playTickSound} style={{ ...navLinkStyle, color: isTransparent ? '#818cf8' : '#6366f1' }}>지역정보</Link>
                            <Link href="/v3" onClick={playTickSound} style={{ ...navLinkStyle, color: isTransparent ? '#10b981' : '#10b981' }}><Video size={14} /> SNS스타일</Link>
                            <Link href="/board" onClick={playTickSound} style={navLinkStyle}>커뮤니티</Link>
                            <Link href="/discount-mall" onClick={playTickSound} style={navLinkStyle}>할인몰</Link>
                            {settings.floatingKakaoVisible && (
                                <a href={settings.kakaoChatUrl} onClick={playTickSound} target="_blank" rel="noopener noreferrer" style={{ ...navLinkStyle, color: '#f97316' }}>
                                    <MessageCircle size={14} /> 1:1문의
                                </a>
                            )}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={() => {
                                playTickSound();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            style={{
                                background: isTransparent ? 'rgba(255, 255, 255, 0.15)' : '#0f172a', 
                                color: 'white', 
                                border: isTransparent ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                                borderRadius: '12px', padding: '8px 16px', display: 'flex',
                                alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800,
                                cursor: 'pointer', height: '40px', transition: 'all 0.2s',
                                boxShadow: isTransparent ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.1)'
                            }}
                        >
                            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                            {!isMobile && "메뉴"}
                            <ChevronDown size={14} style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <>
                                    <motion.div 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setIsMenuOpen(false)}
                                        style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 998 }}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        style={{
                                            position: 'absolute', top: '50px', right: 0, width: '220px',
                                            background: '#ffffff', borderRadius: '18px', padding: '8px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                                            zIndex: 999, overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {!user ? (
                                                <>
                                                    <div onClick={() => { playTickSound(); router.push('/login'); setIsMenuOpen(false); }} className="dropdown-item" style={dropdownItemStyle}><LogIn size={18} /> 로그인</div>
                                                    <div onClick={() => { playTickSound(); router.push('/login?mode=signup'); setIsMenuOpen(false); }} className="dropdown-item" style={dropdownItemStyle}><UserPlus size={18} /> 회원가입</div>
                                                </>
                                            ) : (
                                                <div onClick={() => { playTickSound(); router.push('/mypage'); setIsMenuOpen(false); }} className="dropdown-item" style={dropdownItemStyle}><User size={18} /> 마이페이지</div>
                                            )}
                                            
                                            <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 8px' }} />
                                            
                                            <div onClick={() => { playTickSound(); router.push('/localinfo'); setIsMenuOpen(false); }} className="dropdown-item" style={{ ...dropdownItemStyle, color: '#6366f1' }}><MapPin size={18} /> 지역정보</div>
                                            <div onClick={() => { playTickSound(); router.push('/v3'); setIsMenuOpen(false); }} className="dropdown-item" style={{ ...dropdownItemStyle, color: '#10b981' }}><Video size={18} /> SNS스타일</div>
                                            <div onClick={() => { playTickSound(); router.push('/board'); setIsMenuOpen(false); }} className="dropdown-item" style={dropdownItemStyle}><MessageSquare size={18} /> 커뮤니티</div>
                                            <div onClick={() => { playTickSound(); router.push('/discount-mall'); setIsMenuOpen(false); }} className="dropdown-item" style={dropdownItemStyle}><ShoppingBag size={18} /> 할인몰</div>
                                            <div onClick={() => { playTickSound(); router.push('/partner-apply'); setIsMenuOpen(false); }} className="dropdown-item" style={dropdownItemStyle}><LayoutGrid size={18} /> 입점신청</div>
                                            {settings.floatingKakaoVisible && (
                                                <a href={settings.kakaoChatUrl} onClick={playTickSound} target="_blank" rel="noopener noreferrer" style={{ ...dropdownItemStyle, textDecoration: 'none' }} className="dropdown-item">
                                                    <MessageCircle size={18} color="#f97316" /> 1:1 상담
                                                </a>
                                            )}

                                            {(isAdmin || isStoreOwner) && (
                                                <>
                                                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 8px' }} />
                                                    {isAdmin && <div onClick={() => { 
                                                        playTickSound();
                                                        router.push('/admin');
                                                        setIsMenuOpen(false); 
                                                    }} className="dropdown-item" style={{ ...dropdownItemStyle, color: '#ef4444' }}><ShieldCheck size={18} /> 어드민 관리</div>}
                                                    {isAdmin && <div onClick={() => { playTickSound(); router.push('/video'); setIsMenuOpen(false); }} className="dropdown-item" style={{ ...dropdownItemStyle, color: '#f59e0b' }}><Video size={18} /> 영상 메이커</div>}
                                                    {isStoreOwner && <div onClick={() => { 
                                                        playTickSound();
                                                        router.push('/admin/store-owner');
                                                        setIsMenuOpen(false); 
                                                    }} className="dropdown-item" style={{ ...dropdownItemStyle, color: '#6366f1' }}><StoreIcon size={18} /> 가맹점 관리</div>}
                                                </>
                                            )}

                                            {user && (
                                                <>
                                                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 8px' }} />
                                                    <div onClick={() => { playTickSound(); logout(); setIsMenuOpen(false); }} className="dropdown-item" style={{ ...dropdownItemStyle, color: '#94a3b8', fontSize: '0.85rem' }}>로그아웃</div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                .dropdown-item:hover {
                    background-color: #f8fafc;
                }
            `}</style>
        </header>
    );
};

export default HeaderV2;
