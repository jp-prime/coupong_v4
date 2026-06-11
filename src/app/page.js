"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { StoreService } from '@/services/StoreService';
import HeaderV2 from '@/components/style2/HeaderV2';
import HeroSliderV2 from '@/components/style2/HeroSliderV2';
import CompactStoreCard from '@/components/style2/CompactStoreCard';
import Footer from '@/components/layout/Footer';
import { Loader2, ChevronDown, Search } from 'lucide-react';
import '@/i18n'; // i18n 초기화 로드

export default function CouponsV2() {
    const { t } = useTranslation();
    const router = useRouter();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [windowWidth, setWindowWidth] = useState(375); // 기본 모바일 값 세팅 (Hydration 대비)
    const [visibleCount, setVisibleCount] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        fetchStores();
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const data = await StoreService.getAllStores();
            // 숨김 처리된 업소 필터링 (isActive가 false가 아닌 것만 노출)
            const activeOnly = data.filter(s => s.isActive !== false);
            const sorted = [...activeOnly].sort((a, b) => {
                // 1. HOT 업소 최상단
                if (a.isHot && !b.isHot) return -1;
                if (!a.isHot && b.isHot) return 1;

                // 2. 쿠폰 노출 순번(displayOrder) 기준 정렬 (낮은 순서대로)
                const orderA = a.displayOrder ?? 9999;
                const orderB = b.displayOrder ?? 9999;
                if (orderA !== orderB) return orderA - orderB;

                return 0;
            });
            setStores(sorted);
        } catch (error) {
            console.error("Failed to fetch stores:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(store => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        const getAllValues = (obj) => {
            if (!obj) return '';
            if (typeof obj === 'string') return obj;
            return Object.values(obj).join(' ');
        };

        // 검색 텍스트 조합 기준: 카테고리(category) + 상호명(name) + 슬로건(slogan) + 키워드(keywords)
        const searchableText = [
            String(store.category || ''), // 1. 카테고리
            getAllValues(store.name),      // 2. 상호명 (업체명)
            getAllValues(store.slogan),     // 3. 슬로건 (홍보 문구)
            Array.isArray(store.keywords) ? store.keywords.join(' ') : String(store.keywords || '') // 4. 키워드
        ].join(' ').toLowerCase();

        return searchableText.includes(query);
    });

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '100px' }}>
            <main style={{ maxWidth: '1280px', margin: '0 auto' }}>
                {/* 통합 탑 배너 카드 (헤더 + 텍스트 슬라이더 + 검색바 통합) */}
                <div style={{
                    margin: windowWidth < 640 ? '12px 12px 16px 12px' : '20px 20px 20px 20px',
                    borderRadius: '24px',
                    position: 'relative',
                    background: '#09090b',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                    paddingBottom: '20px',
                    zIndex: 100
                }}>


                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'relative', zIndex: 10 }}>
                            <HeaderV2 isTransparent={true} />
                        </div>
                        <HeroSliderV2 isAdmin={false} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isMerged={true} />
                    </div>
                </div>

                <div style={{ padding: windowWidth < 640 ? '0 12px' : '0 20px' }}>

                    {/* 타이틀 */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        marginBottom: windowWidth < 640 ? '16px' : '32px',
                        marginTop: '0px',
                        gap: '12px'
                    }}>
                        <h2 style={{ 
                            fontSize: windowWidth < 640 ? '1.1rem' : '1.6rem', 
                            fontWeight: 950, 
                            color: '#0f172a', 
                            margin: 0, 
                            letterSpacing: '-1px',
                            whiteSpace: 'nowrap'
                        }}>
                            할인쿠폰 가맹점 <span style={{ color: '#6366f1' }}>LIST</span>
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                            <Loader2 className="animate-spin" size={32} color="#6366f1" />
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: windowWidth < 1024 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', 
                            gap: windowWidth < 640 ? '20px 12px' : '32px 24px' 
                        }}>
                            {filteredStores.slice(0, visibleCount).map((store, idx) => (
                                <CompactStoreCard key={store.id} store={store} index={idx} />
                            ))}
                        </div>
                    )}

                    {!loading && filteredStores.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
                            <Search size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                            <p style={{ fontWeight: 700 }}>검색 결과가 없습니다.</p>
                        </div>
                    )}

                    {!loading && visibleCount < filteredStores.length && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
                            <button 
                                onClick={() => setVisibleCount(prev => prev + 12)}
                                style={{ 
                                    padding: '12px 40px', borderRadius: '12px', background: '#f8fafc',
                                    color: '#0f172a', border: '1px solid #e2e8f0', fontWeight: 800,
                                    fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <ChevronDown size={18} />
                                더 많은 업체 보기
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
