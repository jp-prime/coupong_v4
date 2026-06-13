'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Shield, History, Loader2, Search, Calendar, 
    Ticket, User, Store, DollarSign, RefreshCw 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CouponService } from '@/services/CouponService';

export default function AdminRedemptionsPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [redemptions, setRedemptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalRewardSum, setTotalRewardSum] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) {
            router.push('/login');
            return;
        }
        fetchRedemptions();
    }, [isAdmin, authLoading]);

    const fetchRedemptions = async () => {
        setLoading(true);
        try {
            // CouponService.getAllRedemptions() 또는 직접 Firestore 'reward_transactions'조회
            const data = await CouponService.getAllRedemptions();
            setRedemptions(data);
            
            // 총 누적 리워드 합산 연산
            const sum = data.reduce((acc, curr) => acc + (curr.totalReward || 0), 0);
            setTotalRewardSum(sum);
        } catch (error) {
            console.error("Failed to load redemptions:", error);
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

    const filteredRedemptions = redemptions.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            (item.storeName || '').toLowerCase().includes(query) ||
            (item.couponTitle || '').toLowerCase().includes(query) ||
            (item.senderName || '').toLowerCase().includes(query) ||
            (item.sharedId || '').toLowerCase().includes(query)
        );
    });

    if (!isAdmin) return null;

    return (
        <div style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto', background: '#ffffff', minHeight: '100vh', paddingBottom: '100px' }}>
            {/* Header */}
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
                            <History style={{ color: '#10b981' }} size={20} /> 쿠폰 승인 사용 내역
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                            실시간 모바일 QR 스캔 및 수동 승인 처리 기록 리스트입니다.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={fetchRedemptions}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                >
                    <RefreshCw size={14} /> 새로고침
                </button>
            </div>

            {/* 통계 요약 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '4px' }}>총 승인 건수</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>{redemptions.length} 건</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '4px' }}>누적 정산 리워드</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>{totalRewardSum.toLocaleString()} P</div>
                </div>
            </div>

            {/* 검색 바 */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                    type="text"
                    placeholder="가맹점명, 쿠폰내용, 공유자명 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px',
                        border: '1px solid #e2e8f0', background: 'white',
                        fontSize: '0.92rem', outline: 'none', color: '#0f172a'
                    }}
                />
            </div>

            {/* 내역 리스트 */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="animate-spin" size={36} color="#10b981" />
                </div>
            ) : filteredRedemptions.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', border: '1px dashed #e2e8f0', borderRadius: '20px' }}>
                    조회된 승인 사용 기록이 존재하지 않습니다.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredRedemptions.map((item, idx) => (
                        <div 
                            key={item.id || idx}
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '24px',
                                padding: '20px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                                        승인완료
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                                        {formatDate(item.timestamp)}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                                    ID: {item.sharedId?.substring(0, 10)}...
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <Store size={14} color="#64748b" />
                                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#1e293b' }}>
                                            {item.storeName}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Ticket size={14} color="#ef4444" />
                                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#ef4444' }}>
                                            {item.couponTitle}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                                        공유자: <span style={{ color: '#0f172a', fontWeight: 900 }}>{item.senderName || '비회원'}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                                        혜택 차감액: <span style={{ color: '#10b981', fontWeight: 900 }}>{item.totalReward ? `${item.totalReward.toLocaleString()} P` : '0 P'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
