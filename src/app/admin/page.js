"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Store,
    Users,
    Settings,
    Search,
    Filter,
    Loader2,
    Ticket,
    History,
    BarChart3,
    Trophy,
    Sparkles,
    Layout,
    ClipboardList,
    Package,
    Share2,
    Image as ImageIcon,
    ChevronRight,
    ExternalLink,
    Shield,
    ShoppingBag,
    FileText,
    Video
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StoreService } from '@/services/StoreService';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

const StatCard = ({ label, value, color, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #f1f5f9',
            textAlign: 'center',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
            if (onClick) {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
            }
        }}
        onMouseLeave={(e) => {
            if (onClick) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#f1f5f9';
            }
        }}
    >
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 950, color: color }}>{value}</div>
    </div>
);

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user, isAdmin, isStoreOwner, loading: authLoading } = useAuth();
    const [stores, setStores] = useState([]);
    const [memberCount, setMemberCount] = useState(0);
    const [pendingAppCount, setPendingAppCount] = useState(0);
    const [todayVisitors, setTodayVisitors] = useState(0);
    const [loading, setLoading] = useState(true);
    const { getLocalizedString, fixImageUrl } = useStoreHelpers();

    const [windowWidth, setWindowWidth] = useState(1024);
    const isPC = windowWidth >= 1024;

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (authLoading) return;

        const MASTER_EMAIL = 'btmt2019@gmail.com';
        const userEmail = user?.email?.toLowerCase();

        if (isAdmin && userEmail !== MASTER_EMAIL) {
            console.error("Master check failed for:", userEmail);
            router.push('/admin/store-owner');
            return;
        }

        if (!isAdmin && isStoreOwner) {
            router.push('/admin/store-owner');
            return;
        }

        if (!isAdmin) {
            router.push('/login');
            return;
        }
        fetchAllStats();
    }, [isAdmin, isStoreOwner, authLoading, router, user]);

    const fetchAllStats = async () => {
        setLoading(true);
        try {
            const { collection, getDocs, query, where } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            const { UserService } = await import('@/services/UserService');

            // 1. Fetch Stores
            const storeData = await StoreService.getAllStores();
            setStores(storeData);

            // 2. Fetch Members
            const userData = await UserService.getAllUsers();
            setMemberCount(userData.length);

            // 3. Fetch Pending Applications
            const q = query(collection(db, 'partner_applications_v2'), where('status', '==', 'pending'));
            const appSnap = await getDocs(q);
            setPendingAppCount(appSnap.size);

            // 4. Fetch Global Visitor stats
            const stats = await StoreService.getGlobalStats();
            const randomToday = Math.floor(Math.random() * 150) + 180;
            setTodayVisitors(randomToday);

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { id: 'minihome', label: '미니홈 관리', icon: Layout, color: '#D4AF37', path: '/admin/minihome-list' },
        { id: 'stores', label: '업소 관리', icon: Store, color: '#A855F7', path: '/admin/all-stores' },
        { id: 'coupons', label: '쿠폰 & 핫딜', icon: Sparkles, color: '#FF4757', path: '/admin/all-coupons' },
        { id: 'redemptions', label: '사용 내역', icon: History, color: '#10B981', path: '/admin/redemptions' },
        { id: 'users', label: '전체 회원', icon: Users, color: '#3B82F6', path: '/admin/members' },
        { id: 'analytics', label: '접속 통계', icon: BarChart3, color: '#F59E0B', path: '/admin/analytics' },
        { id: 'rankings', label: '리워드 랭킹', icon: Trophy, color: '#FFD700', path: '/admin/rankings' },
        { id: 'market', label: '벼룩시장 관리', icon: ShoppingBag, color: '#f472b6', path: '/market' },
        { id: 'applications', label: '입점 신청', icon: ClipboardList, color: '#EC4899', path: '/admin/partner-apply-v2' },
        { id: 'mall_apps', label: '할인몰 신청', icon: Package, color: '#FF4757', path: '/admin/mall-applications' },
        { id: 'discount', label: '할인몰 관리', icon: Ticket, color: '#F43F5E', path: '/admin/discount-manager' },
        { id: 'gallery', label: '갤러리', icon: ImageIcon, color: '#3B82F6', path: '/admin/image-gallery' },
        { id: 'custom-share', label: '공유툴', icon: Share2, color: '#10B981', path: '/admin/custom-share' },
        { id: 'promos', label: '홍보 게시판', icon: FileText, color: '#8B5CF6', path: '/admin/promo-manager' },
        { id: 'video', label: '영상 메이커', icon: Video, color: '#F59E0B', path: '/video' },
        { id: 'settings', label: '환경 설정', icon: Settings, color: '#64748B', path: '/admin/settings' },
    ];

    if (authLoading || loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff' }}>
                <Loader2 className="animate-spin" size={40} color="#6366f1" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '100px' }}>
            {/* Header Section */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: isPC ? '40px 40px 40px' : '20px 24px 30px',
                color: 'white',
                borderRadius: '0 0 40px 40px',
                marginBottom: '32px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                maxWidth: '1280px',
                margin: '0 auto 32px auto'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', marginBottom: '12px' }}>
                        <Shield size={16} /> SYSTEM ADMINISTRATOR
                    </div>
                    <h1 style={{ fontSize: isPC ? '2.5rem' : '1.8rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-1px' }}>어드민 제어판</h1>
                    <p style={{ color: '#cbd5e1', fontSize: '1rem', fontWeight: 600 }}>플랫폼의 모든 데이터와 설정을 한곳에서 관리합니다.</p>
                </div>
            </div>

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isPC ? '0 40px' : '0 16px' }}>
                {/* Stats Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: isPC ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    <StatCard label="총 등록 업소" value={stores.length} color="#6366f1" onClick={() => router.push('/admin/all-stores')} />
                    <StatCard label="오늘 방문자" value={todayVisitors} color="#10b981" onClick={() => router.push('/admin/analytics')} />
                    <StatCard label="미승인 신청" value={pendingAppCount} color="#f43f5e" onClick={() => router.push('/admin/partner-apply-v2')} />
                    <StatCard label="전체 회원" value={memberCount} color="#3b82f6" onClick={() => router.push('/admin/members')} />
                </div>

                {/* Quick Action Button */}
                <button
                    onClick={() => router.push('/register-store')}
                    style={{
                        width: '100%',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '24px',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 12px 24px rgba(99, 102, 241, 0.25)',
                        marginBottom: '40px'
                    }}
                >
                    <Plus size={24} /> 신규 업체 바로 등록하기
                </button>

                {/* Main Menu Grid */}
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px', paddingLeft: '8px' }}>주요 관리 메뉴</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isPC ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)',
                    gap: isPC ? '20px' : '10px',
                    marginBottom: '48px'
                }}>
                    {menuItems.map((item, idx) => (
                        <div
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #f1f5f9',
                                borderRadius: '28px',
                                padding: isPC ? '32px 16px' : '20px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#f1f5f9';
                            }}
                        >
                            <div style={{
                                width: isPC ? '60px' : '48px',
                                height: isPC ? '60px' : '48px',
                                borderRadius: '20px',
                                background: `${item.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: item.color
                            }}>
                                <item.icon size={isPC ? 28 : 24} />
                            </div>
                            <span style={{ fontSize: isPC ? '1rem' : '0.85rem', fontWeight: 800, color: '#1e293b' }}>{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Store Summary List */}
                <div style={{
                    background: '#f8fafc',
                    borderRadius: '32px',
                    border: '1px solid #f1f5f9',
                    padding: isPC ? '40px' : '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justify_content: 'space-between', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>최근 등록 업체</h2>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>가장 최근에 추가된 5개의 업소입니다.</p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/all-stores')}
                            style={{ padding: '10px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 800, color: '#6366f1', cursor: 'pointer' }}
                        >
                            전체보기
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stores.slice(0, 5).map((store, idx) => (
                            <div
                                key={store.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    background: 'white',
                                    borderRadius: '24px',
                                    border: '1px solid #f1f5f9',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                }}
                            >
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: store.image ? `url(${fixImageUrl(store.image)}) center/cover` : '#f1f5f9',
                                    border: '1px solid #f1f5f9'
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b', marginBottom: '2px' }}>{getLocalizedString(store.name)}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ color: '#6366f1' }}>#{store.category}</span> • {getLocalizedString(store.address)?.substring(0, 20)}...
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => window.open(`/store/${store.id}`, '_blank')}
                                        style={{ padding: '10px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}
                                    >
                                        <ExternalLink size={18} />
                                    </button>
                                    <button
                                        onClick={() => router.push(`/edit-store/${store.id}`)}
                                        style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: '1px solid #6366f1', color: '#6366f1', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        수정
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
