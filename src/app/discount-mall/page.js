"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronLeft, Search, Tag, Star } from 'lucide-react';
import { DiscountService } from '@/services/DiscountService';
import { useTranslation } from 'react-i18next';
import HeaderV2 from '@/components/style2/HeaderV2';

export default function DiscountMallPage() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); 

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await DiscountService.getDiscountProducts(true);
                setProducts(data);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#6366f1' }}>
                <h2>Loading...</h2>
            </div>
        );
    }

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
            <HeaderV2 searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            {/* Banner Section */}
            <div style={{
                margin: '20px', padding: '24px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden',
                boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
            }}>
                {/* 메인 스타일의 3색 오로라 광원 배경 효과 */}
                <div style={{
                    position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, opacity: 0.6
                }}>
                    <div style={{
                        position: 'absolute', width: '150px', height: '150px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(99,102,241,0) 70%)',
                        filter: 'blur(30px)', bottom: '-30px', left: '10%'
                    }} />
                    <div style={{
                        position: 'absolute', width: '180px', height: '180px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(168,85,247,0) 70%)',
                        filter: 'blur(30px)', top: '-40px', right: '10%'
                    }} />
                </div>

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '8px', background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 800, marginBottom: '12px' }}>
                        COUPONG EXCLUSIVE
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.2, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                        정상가 파괴!<br />최저가 할인몰 오픈
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, fontWeight: 500 }}>
                        검증된 상품만 최저가로 제안합니다.
                    </p>
                </div>
                <ShoppingBag size={80} style={{ position: 'absolute', right: '-10px', bottom: '-10px', color: '#6366f1', opacity: 0.15, transform: 'rotate(-15deg)' }} />
            </div>

            {/* Search Bar */}
            <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text"
                        placeholder="상품명을 검색하세요"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '14px 14px 14px 44px', borderRadius: '16px',
                            border: '1px solid #e2e8f0', background: '#ffffff',
                            color: '#1e293b', fontSize: '0.95rem', outline: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                        }}
                    />
                </div>
            </div>

            {/* Product List */}
            <div style={{ padding: '0 20px', marginBottom: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {filteredProducts.map(product => (
                        <motion.div
                            key={product.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                const currentLang = i18n.language && i18n.language !== 'ko' ? `/${i18n.language}` : '';
                                const targetPath = `${currentLang}/discount-product/${product.id}`;
                                const targetUrl = window.location.hostname === 'localhost' 
                                    ? `http://localhost:19999${targetPath}` 
                                    : `https://coupong.online${targetPath}`;
                                window.location.href = targetUrl;
                            }}
                            style={{
                                background: '#ffffff', borderRadius: '20px',
                                border: '1px solid #e2e8f0', overflow: 'hidden',
                                boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', background: '#f1f5f9' }}>
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShoppingBag size={32} color="#cbd5e1" />
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute', bottom: '8px', left: '8px',
                                    padding: '3px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.85)',
                                    color: 'white', fontSize: '0.65rem', fontWeight: 800, backdropFilter: 'blur(4px)'
                                }}>
                                    {product.originalPrice && product.discountPrice ? (
                                        `${Math.round((1 - Number(product.discountPrice) / Number(product.originalPrice)) * 100)}% OFF`
                                    ) : (
                                        'SALE'
                                    )}
                                </div>
                            </div>
                            <div style={{ padding: '12px' }}>
                                {product.brandName && (
                                    <div style={{ fontSize: '0.65rem', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>
                                        {product.brandName}
                                    </div>
                                )}
                                <h3 className="text-truncate" style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 2px', color: '#1e293b' }}>
                                    {product.name}
                                </h3>
                                <p className="text-truncate" style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 6px' }}>
                                    {product.subtitle}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6366f1' }}>
                                        {product.originalPrice && product.discountPrice ? (
                                            `${Math.round((1 - Number(product.discountPrice) / Number(product.originalPrice)) * 100)}%`
                                        ) : (
                                            'SALE'
                                        )}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', opacity: 0.8 }}>OFF</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                {filteredProducts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                        검색된 상품이 없습니다.
                    </div>
                )}
            </div>

            {/* Merchant Entry Banner */}
            <div style={{ padding: '0 20px 40px' }}>
                <div style={{
                    padding: '32px 24px', borderRadius: '32px',
                    background: '#ffffff', border: '1px solid #e2e8f0',
                    textAlign: 'center', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px', color: '#0f172a' }}>
                            제품 입점 파트너를 찾습니다
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px', lineHeight: 1.5, fontWeight: 500 }}>
                            쿠퐁온라인의 강력한 네트워크에<br />귀사의 제품을 입점시키고 매출을 확대하세요.
                        </p>
                        <button
                            onClick={() => {
                                const targetUrl = window.location.hostname === 'localhost' 
                                    ? 'http://localhost:19999/discount-mall/apply' 
                                    : 'https://coupong.online/discount-mall/apply';
                                window.location.href = targetUrl;
                            }}
                            style={{
                                padding: '14px 28px', borderRadius: '16px',
                                background: '#6366f1', color: 'white',
                                fontWeight: 800, border: 'none', cursor: 'pointer',
                                fontSize: '0.9rem',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                            }}
                        >
                            입점 신청하기
                        </button>
                    </div>
                    <div style={{
                        position: 'absolute', top: '-20px', right: '-20px',
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                        filter: 'blur(40px)', opacity: 0.1
                    }} />
                </div>
            </div>
        </div>
    );
}
