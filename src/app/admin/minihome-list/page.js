"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Layout, Globe, Edit2, Loader2, Search, Star, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StoreService } from '@/services/StoreService';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function AdminMiniHomeListPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { getLocalizedString, getTranslatedLocation, fixImageUrl } = useStoreHelpers();

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) {
            router.push('/login');
            return;
        }
        fetchStores();
    }, [isAdmin, authLoading, router]);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const data = await StoreService.getAllStores(true);
            setStores(data);
        } catch (error) {
            console.error("Error fetching stores for mini-home:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(store => {
        const searchTermLower = (searchTerm || '').toLowerCase();
        const nameStr = getLocalizedString(store.name)?.toLowerCase() || '';
        const categoryStr = (store.category || '').toLowerCase();
        return nameStr.includes(searchTermLower) || categoryStr.includes(searchTermLower);
    });

    if (!isAdmin) return null;

    return (
        <div style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto', background: '#ffffff', minHeight: '100vh', paddingBottom: '100px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layout style={{ color: '#d4af37' }} size={24} /> 미니 홈페이지 관리자
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                            업체별 프리미엄 모바일 웹사이트를 생성하고 관리합니다.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push('/admin/minihome-register/new')}
                    style={{ 
                        padding: '10px 20px', 
                        borderRadius: '16px', 
                        background: '#1a1a1a', 
                        color: '#fff', 
                        border: 'none', 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        boxShadow: '0 6px 15px rgba(0,0,0,0.1)' 
                    }}
                >
                    <Plus size={20} /> 신규 등록
                </button>
            </div>

            {/* Search Section */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text"
                        placeholder="업체명 또는 업종 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '14px 16px 14px 48px', 
                            borderRadius: '20px', 
                            border: '1px solid #e2e8f0', 
                            fontSize: '0.95rem', 
                            outline: 'none',
                            background: '#fff',
                            color: '#0f172a'
                        }}
                    />
                </div>
            </div>

            {/* List Section */}
            <div style={{ display: 'grid', gap: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color="#d4af37" /></div>
                ) : filteredStores.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>등록된 업체가 없습니다. 신규 등록을 진행해 주세요.</div>
                ) : filteredStores.map(store => (
                    <div
                        key={store.id}
                        style={{ 
                            background: 'white', 
                            padding: '24px', 
                            borderRadius: '28px', 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.03)' 
                        }}
                    >
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ 
                                width: '72px', 
                                height: '72px', 
                                borderRadius: '20px', 
                                background: `url('${fixImageUrl(store.image)}') center/cover`, 
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                            }} />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 950, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#000' }}>{getLocalizedString(store.name)}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                                    <span style={{ 
                                        color: '#ca8a04', 
                                        fontWeight: 800, 
                                        background: 'rgba(212, 175, 55, 0.1)', 
                                        padding: '2px 8px', 
                                        borderRadius: '6px' 
                                    }}>{store.category}</span>
                                    <span>•</span>
                                    <span>{getTranslatedLocation(store.location)}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <button
                                    onClick={() => window.open(`/mini-home/${store.id}`, '_blank')}
                                    style={{ 
                                        padding: '10px 16px', 
                                        borderRadius: '14px', 
                                        background: '#000', 
                                        color: '#fff', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        fontSize: '0.85rem', 
                                        fontWeight: 800,
                                        transition: 'transform 0.2s ease'
                                    }}
                                >
                                    <Globe size={16} /> 방문
                                </button>
                            </div>
                        </div>

                        <div style={{ 
                            borderTop: '1px solid #f8fafc', 
                            paddingTop: '20px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }}>
                            <div style={{ 
                                fontSize: '0.8rem', 
                                color: '#64748b', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                background: '#f8fafc',
                                padding: '6px 12px',
                                borderRadius: '10px'
                            }}>
                                <Star size={14} fill="#fbbf24" color="#fbbf24" /> 
                                {store.menu?.length || 0}개의 메뉴 구성됨
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => router.push(`/admin/minihome-register/${store.id}`)}
                                    style={{ 
                                        padding: '12px 20px', 
                                        borderRadius: '16px', 
                                        background: 'rgba(212, 175, 55, 0.05)', 
                                        color: '#ca8a04', 
                                        border: '1px solid rgba(212, 175, 55, 0.2)', 
                                        cursor: 'pointer', 
                                        fontWeight: 800, 
                                        fontSize: '0.9rem', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Edit2 size={18} /> 디자인 편집
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
