"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import HeaderV2 from '@/components/style2/HeaderV2';
import HeroSliderV2 from '@/components/style2/HeroSliderV2';
import CompactStoreCard from '@/components/style2/CompactStoreCard';
import Footer from '@/components/layout/Footer';
import { ChevronDown, Search } from 'lucide-react';
import '@/i18n';

export default function CouponsClient({ initialStores }) {
    const { t } = useTranslation();
    const router = useRouter();
    const [stores, setStores] = useState(initialStores || []);
    const [windowWidth, setWindowWidth] = useState(375);
    const [visibleCount, setVisibleCount] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filteredStores = stores.filter(store => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        const getAllValues = (obj) => {
            if (!obj) return '';
            if (typeof obj === 'string') return obj;
            return Object.values(obj).join(' ');
        };

        const searchableText = [
            String(store.category || ''),
            getAllValues(store.name),
            getAllValues(store.slogan),
            Array.isArray(store.keywords) ? store.keywords.join(' ') : String(store.keywords || '')
        ].join(' ').toLowerCase();

        return searchableText.includes(query);
    });

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '100px' }}>
            <main style={{ maxWidth: '1280px', margin: '0 auto' }}>
                {/* 통합 탑 배너 카드 */}
                <div style={{
                    margin: windowWidth < 640 ? '12px 12px 16px 12px' : '20px 20px 20px 20px',
                    borderRadius: '24px',
                    position: 'relative',
                    background: '#09090b',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                    paddingBottom: '20px',
                    zIndex: 100,
                    minHeight: windowWidth < 640 ? '308px' : '324px' // Reserved height to prevent CLS
                }}>
                    <div style={{ position: 'relative', zIndex: 1, minHeight: windowWidth < 640 ? '288px' : '304px' }}>
                        <div style={{ position: 'relative', zIndex: 10, height: '64px' }}>
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

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: windowWidth < 1024 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', 
                        gap: windowWidth < 640 ? '20px 12px' : '32px 24px' 
                    }}>
                        {filteredStores.slice(0, visibleCount).map((store, idx) => (
                            <CompactStoreCard key={store.id} store={store} index={idx} />
                        ))}
                    </div>

                    {filteredStores.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
                            <Search size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                            <p style={{ fontWeight: 700 }}>검색 결과가 없습니다.</p>
                        </div>
                    )}

                    {visibleCount < filteredStores.length && (
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
