'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Loader2, Store, Ticket, ShieldCheck, Edit2, 
    ExternalLink, ChevronRight, MessageCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StoreService } from '@/services/StoreService';
import { CouponService } from '@/services/CouponService';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function StoreOwnerDashboardPage() {
    const router = useRouter();
    const { user, isStoreOwner, managedStores, managedStoreId, selectManagedStore, loading: authLoading } = useAuth();
    const { getLocalizedString, fixImageUrl } = useStoreHelpers();

    const [loading, setLoading] = useState(true);
    const [storeCoupons, setStoreCoupons] = useState([]);
    const [activeStore, setActiveStore] = useState(null);
    const [redemptionHistory, setRedemptionHistory] = useState([]);

    useEffect(() => {
        if (authLoading) return;

        // 점주 및 전체 어드민 권한 체크
        const isSystemAdmin = user?.email && user.email.toLowerCase() === 'btmt2019@gmail.com';
        if (!isStoreOwner && !isSystemAdmin) {
            router.push('/login');
            return;
        }

        loadStoreAndCoupons();
    }, [isStoreOwner, managedStoreId, authLoading, user]);

    const loadStoreAndCoupons = async () => {
        setLoading(true);
        try {
            if (!managedStoreId && managedStores?.length > 0) {
                selectManagedStore(managedStores[0].id);
                return;
            }

            if (managedStoreId) {
                const store = await StoreService.getStoreById(managedStoreId);
                setActiveStore(store);

                const coupons = await CouponService.getCouponsByStoreId(managedStoreId);
                setStoreCoupons(coupons);

                const history = await CouponService.getStoreRedemptions(managedStoreId);
                setRedemptionHistory(history);
            }
        } catch (e) {
            console.error("Failed to load owner store coupons and history:", e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + 
               date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    if (authLoading || loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
                <Loader2 className="animate-spin" size={36} color="#6366f1" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto', background: '#ffffff', minHeight: '100vh', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                    <Store size={22} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>가맹점 관리자 파트너 센터</h1>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>매장 정보 수정 및 발행 쿠폰 상태를 파악합니다.</p>
                </div>
            </div>

            {/* 다중 가맹점 셀렉터 */}
            {managedStores?.length > 1 && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>관리할 가맹점 선택</label>
                    <select 
                        value={managedStoreId || ''} 
                        onChange={(e) => selectManagedStore(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 700, outline: 'none' }}
                    >
                        {managedStores.map(s => (
                            <option key={s.id} value={s.id}>{getLocalizedString(s.name)}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* 가맹점 상태 요약 */}
            {activeStore && (
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: `url('${fixImageUrl(activeStore.image)}') center/cover`, border: '1px solid #e2e8f0' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{getLocalizedString(activeStore.name)}</h3>
                                <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.7rem', fontWeight: 800 }}>
                                    {activeStore.isActive !== false ? '정상노출' : '숨겨짐'}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>{getLocalizedString(activeStore.slogan) || '등록된 슬로건이 없습니다.'}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button 
                            onClick={() => router.push(`/edit-store/${activeStore.id}`)}
                            style={{ padding: '12px', borderRadius: '12px', background: '#6366f1', color: 'white', border: 'none', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
                        >
                            <Edit2 size={15} /> 정보 수정하기
                        </button>
                        <button 
                            onClick={() => window.open(`/store/${activeStore.slug || activeStore.id}`, '_blank')}
                            style={{ padding: '12px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            <ExternalLink size={15} /> 매장 페이지 보기
                        </button>
                    </div>
                </div>
            )}

            {/* 등록된 혜택/쿠폰 목록 */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', justify_content: 'space-between' }}>
                    <span>🎫 등록된 할인 쿠폰 ({storeCoupons.length})</span>
                    <button onClick={loadStoreAndCoupons} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                        <RefreshCw size={12} /> 새로고침
                    </button>
                </h3>

                {storeCoupons.length === 0 ? (
                    <div style={{ padding: '40px 16px', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        현재 등록된 활성 쿠폰 혜택이 없습니다.<br/>
                        쿠폰 추가는 총괄 운영자에게 요청해 주세요.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {storeCoupons.map(coupon => (
                            <div key={coupon.id} style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', justify_content: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 950, color: '#ef4444', marginBottom: '4px' }}>
                                        {getLocalizedString(coupon.discount)}
                                    </div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                                        {getLocalizedString(coupon.description || coupon.name || coupon.title || '할인 쿠폰')}
                                    </div>
                                    {coupon.limitQuantity !== undefined && coupon.limitQuantity !== null && (
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 700 }}>
                                            잔여수량: <span style={{ color: '#0f172a', fontWeight: 900 }}>{coupon.limitQuantity}개</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span style={{ 
                                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800,
                                        background: coupon.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: coupon.isActive ? '#10b981' : '#ef4444'
                                    }}>
                                        {coupon.isActive ? '사용가능' : '종료됨'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 실시간 승인 완료 내역 리스트 추가 (가맹점 관리페이지 하단) */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
                    📅 쿠폰 사용 및 승인 완료 내역 ({redemptionHistory.length})
                </h3>
                {redemptionHistory.length === 0 ? (
                    <div style={{ padding: '30px 16px', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                        최근 사용 승인된 내역이 없습니다.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {redemptionHistory.map((history, index) => (
                            <div key={history.id || index} style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 850, color: '#1e293b' }}>
                                        {history.storeName}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 800, marginTop: '2px' }}>
                                        {history.couponTitle}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                                        {formatDate(history.timestamp)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 800 }}>
                                        공유: {history.senderName || '비회원'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 가이드 배너 */}
            <div style={{ padding: '16px', background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <MessageCircle size={18} color="#f97316" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ea580c', margin: '0 0 4px 0' }}>쿠폰 이용 관련 가이드</h4>
                    <p style={{ fontSize: '0.78rem', color: '#7c2d12', margin: 0, lineHeight: 1.45, fontWeight: 700 }}>
                        고객이 제시한 할인 QR 코드를 스마트폰 카메라로 촬영하면 검증 및 자동 승인 처리가 수행됩니다. 문의사항은 1:1 상담 카카오톡 채널로 알려주세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
