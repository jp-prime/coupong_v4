"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Trash2, Edit2, PauseCircle, PlayCircle, Loader2, Plus, X, Store, Search as SearchIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StoreService } from '@/services/StoreService';
import { CouponService } from '@/services/CouponService';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function AdminAllCouponsPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();
    const { getLocalizedString, getTranslatedCouponText } = useStoreHelpers();
    const [coupons, setCoupons] = useState([]);
    const [storesMap, setStoresMap] = useState({});
    const [storesList, setStoresList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    const [storeSearch, setStoreSearch] = useState('');
    const [couponSearch, setCouponSearch] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) {
            router.push('/login');
            return;
        }
        fetchData();
    }, [isAdmin, authLoading, router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [storeData, couponData] = await Promise.all([
                StoreService.getAllStores(true),
                CouponService.getAllCoupons()
            ]);

            const sMap = {};
            storeData.forEach(s => {
                sMap[s.id] = getLocalizedString(s.name);
            });

            setStoresList(storeData);
            setStoresMap(sMap);
            setCoupons(couponData);
        } catch (error) {
            console.error("Error fetching all coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePause = async (coupon) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            const newStatus = !coupon.isActive;
            await updateDoc(doc(db, 'store_coupons', coupon.id), {
                isActive: newStatus
            });
            StoreService.clearCache();
            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, isActive: newStatus } : c));
        } catch (error) {
            console.error("Error pausing/resuming coupon:", error);
            alert("상태 변경에 실패했습니다.");
        }
    };

    const handleToggleShocking = async (coupon) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            const newShocking = !coupon.isShocking;
            await updateDoc(doc(db, 'store_coupons', coupon.id), {
                isShocking: newShocking
            });
            StoreService.clearCache();
            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, isShocking: newShocking } : c));
        } catch (error) {
            console.error("Error toggling hot deal:", error);
            alert("핫딜 변경에 실패했습니다.");
        }
    };

    const handleUpdateOrder = async (couponId, newOrder) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            const orderVal = newOrder === '' ? null : parseInt(newOrder);
            await updateDoc(doc(db, 'store_coupons', couponId), {
                displayOrder: orderVal
            });
            StoreService.clearCache();
            setCoupons(coupons.map(c => c.id === couponId ? { ...c, displayOrder: orderVal } : c));
        } catch (error) {
            console.error("Error updating order:", error);
            alert("순번 수정 실패");
        }
    };

    const handleUpdateCaption = async (couponId, newCaption) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            const coupon = coupons.find(c => c.id === couponId);
            const currentCaption = coupon?.caption || { ko: '', en: '', vi: '', 'zh-CN': '' };
            const updatedCaption = { ...currentCaption, ko: newCaption };
            
            await updateDoc(doc(db, 'store_coupons', couponId), {
                caption: updatedCaption
            });
            StoreService.clearCache();
            setCoupons(coupons.map(c => c.id === couponId ? { ...c, caption: updatedCaption } : c));
        } catch (error) {
            console.error("Error updating caption:", error);
            alert("캡션 수정 실패");
        }
    };

    const handleDelete = async (couponId) => {
        if (!window.confirm("정말로 이 쿠폰을 삭제하시겠습니까?")) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            await deleteDoc(doc(db, 'store_coupons', couponId));
            setCoupons(coupons.filter(c => c.id !== couponId));
        } catch (error) {
            console.error("Error deleting coupon:", error);
            alert("쿠폰 삭제에 실패했습니다.");
        }
    };

    const filteredStores = storesList.filter(s => {
        const sName = getLocalizedString(s.name).toLowerCase();
        return sName.includes(storeSearch.toLowerCase()) ||
               (s.category || '').toLowerCase().includes(storeSearch.toLowerCase());
    });

    const filteredCoupons = coupons
        .filter(c => {
            const searchLower = couponSearch.toLowerCase();
            const storeName = (storesMap[c.storeId] || '알 수 없는 업체').toLowerCase();
            const discountText = getTranslatedCouponText(c.discount).toLowerCase();
            const descText = getLocalizedString(c.description).toLowerCase();

            return storeName.includes(searchLower) || discountText.includes(searchLower) || descText.includes(searchLower);
        })
        .sort((a, b) => {
            const orderA = a.displayOrder ?? 9999;
            const orderB = b.displayOrder ?? 9999;
            if (orderA !== orderB) return orderA - orderB;
            
            const nameA = storesMap[a.storeId] || '';
            const nameB = storesMap[b.storeId] || '';
            return nameA.localeCompare(nameB);
        });

    if (!isAdmin) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: '100px' }}>
            <div style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => router.push('/admin')}
                        style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', padding: '8px' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield style={{ color: '#6366f1' }} size={20} /> 전체 쿠폰 관리
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                            발행된 모든 업체의 쿠폰을 통합 관리합니다
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsStoreModalOpen(true)}
                    style={{
                        padding: '10px 16px', borderRadius: '12px', background: '#6366f1',
                        color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
                    }}
                >
                    <Plus size={18} /> 신규 발행
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <SearchIcon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text"
                        placeholder="업체명, 할인내용, 설명으로 검색..."
                        value={couponSearch}
                        onChange={(e) => setCouponSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '14px 14px 14px 44px', borderRadius: '16px',
                            background: '#f8fafc', border: '1px solid #e2e8f0',
                            color: '#0f172a', fontSize: '0.95rem', outline: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                    />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
                ) : filteredCoupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>조건에 맞는 쿠폰이 없습니다.</div>
                ) : filteredCoupons.map(coupon => (
                    <div
                        key={coupon.id}
                        style={{
                            background: '#f8fafc', padding: '16px', borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            opacity: coupon.isActive ? 1 : 0.6
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: 700, marginBottom: '4px' }}>
                                    {storesMap[coupon.storeId] || '알 수 없는 업체'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                        {getTranslatedCouponText(coupon.discount)}
                                    </h3>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, background: '#e2e8f0', padding: '2px 8px', borderRadius: '6px' }}>
                                        수량: {coupon.limitQuantity > 0 ? `${coupon.limitQuantity}개` : '무제한'}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 550, fontStyle: 'italic', flexShrink: 0 }}>
                                        {getLocalizedString(coupon.description) || '상세 조건 없음'}
                                    </div>
                                    
                                    <div style={{ 
                                        display: 'flex', alignItems: 'center', gap: '6px', 
                                        background: 'rgba(255,255,255,0.05)', padding: '4px 10px', 
                                        borderRadius: '10px', border: '1px solid #e2e8f0',
                                        flex: 1, minWidth: '150px', maxWidth: '300px'
                                    }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>캡션</span>
                                        <input 
                                            type="text" 
                                            defaultValue={typeof coupon.caption === 'object' ? (coupon.caption.ko || '') : (coupon.caption || '')} 
                                            onBlur={(e) => handleUpdateCaption(coupon.id, e.target.value)}
                                            placeholder="이미지 위 문구"
                                            style={{ 
                                                width: '100%', background: 'transparent', border: 'none', 
                                                color: '#0f172a', fontSize: '0.85rem', fontWeight: 700, 
                                                outline: 'none' 
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginLeft: '12px' }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {!coupon.isActive && (
                                        <span style={{ padding: '2px 6px', background: '#94a3b8', color: '#fff', fontSize: '0.65rem', borderRadius: '4px', fontWeight: 800 }}>중지됨</span>
                                    )}
                                    {coupon.isRecommended && (
                                        <span style={{
                                            display: 'inline-block', padding: '4px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800,
                                            background: 'rgba(56, 189, 248, 0.1)', color: '#0ea5e9', border: '1px solid rgba(56, 189, 248, 0.2)'
                                        }}>
                                            추천
                                        </span>
                                    )}
                                    {coupon.isShocking && (
                                        <span style={{
                                            display: 'inline-block', padding: '4px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800,
                                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'
                                        }}>
                                            HOT DEAL
                                        </span>
                                    )}
                                    <span style={{
                                        display: 'inline-block', padding: '4px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700,
                                        background: coupon.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                        color: coupon.isActive ? '#22c55e' : '#64748b'
                                    }}>
                                        {coupon.isActive ? '발행중' : '일시중지'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid #e2e8f0',
                            gap: '8px',
                            overflowX: 'auto',
                            paddingBottom: '4px'
                        }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                    onClick={() => handleTogglePause(coupon)}
                                    style={{
                                        padding: '6px 10px', borderRadius: '8px', background: 'rgba(100, 116, 139, 0.1)',
                                        color: '#64748b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                >
                                    {coupon.isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{coupon.isActive ? '중지' : '재개'}</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const { doc, updateDoc } = await import('firebase/firestore');
                                            const { db } = await import('@/firebase');
                                            const newVal = !coupon.isRecommended;
                                            await updateDoc(doc(db, 'store_coupons', coupon.id), { isRecommended: newVal });
                                            StoreService.clearCache();
                                            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, isRecommended: newVal } : c));
                                        } catch (e) { alert("추천 상태 변경 실패"); }
                                    }}
                                    style={{
                                        padding: '6px 10px', borderRadius: '8px',
                                        background: coupon.isRecommended ? 'rgba(56, 189, 248, 0.1)' : 'rgba(100, 116, 139, 0.05)',
                                        color: coupon.isRecommended ? '#0ea5e9' : '#64748b',
                                        border: coupon.isRecommended ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                >
                                    <Sparkles size={14} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>추천</span>
                                </button>
                                <button
                                    onClick={() => handleToggleShocking(coupon)}
                                    style={{
                                        padding: '6px 10px', borderRadius: '8px',
                                        background: coupon.isShocking ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.05)',
                                        color: coupon.isShocking ? '#ef4444' : '#64748b',
                                        border: coupon.isShocking ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                >
                                    <Sparkles size={14} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>핫딜</span>
                                </button>
                                
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', gap: '6px', 
                                    background: 'rgba(255,255,255,0.05)', padding: '4px 8px', 
                                    borderRadius: '10px', border: '1px solid #e2e8f0',
                                    marginLeft: '4px'
                                }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>순번</span>
                                    <input 
                                        type="number" 
                                        defaultValue={coupon.displayOrder ?? ''} 
                                        onBlur={(e) => handleUpdateOrder(coupon.id, e.target.value)}
                                        placeholder="-"
                                        style={{ 
                                            width: '35px', background: 'transparent', border: 'none', 
                                            color: '#6366f1', fontSize: '0.85rem', fontWeight: 900, 
                                            textAlign: 'center', outline: 'none' 
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                    onClick={() => router.push(`/admin/coupons/${coupon.storeId}`)}
                                    style={{
                                        padding: '6px 10px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px'
                                    }}
                                >
                                    <Edit2 size={14} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>수정</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(coupon.id)}
                                    style={{
                                        padding: '6px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px'
                                    }}
                                >
                                    <Trash2 size={14} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>삭제</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Store Selection Modal */}
            {isStoreModalOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000
                    }}
                >
                    <div
                        style={{
                            width: '100%', maxWidth: '440px', background: '#ffffff', padding: '24px',
                            borderRadius: '28px', border: '1px solid #e2e8f0', position: 'relative',
                            maxHeight: '80vh', display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <button onClick={() => setIsStoreModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
                            <Store style={{ color: '#6366f1' }} />
                            업체 선택
                        </h2>

                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <SearchIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="text"
                                placeholder="업체 이름을 검색하세요..."
                                value={storeSearch}
                                onChange={(e) => setStoreSearch(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
                                    background: '#f8fafc', border: '1px solid #e2e8f0',
                                    color: '#0f172a', fontSize: '0.9rem', outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                            {filteredStores.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.9rem' }}>
                                    검색 결과가 없습니다.
                                </div>
                            ) : filteredStores.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        router.push(`/admin/coupons/${s.id}`);
                                        setIsStoreModalOpen(false);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%'
                                    }}
                                >
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `url(${s.image}) center/cover`, border: '1px solid #e2e8f0' }} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{getLocalizedString(s.name)}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.category}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
