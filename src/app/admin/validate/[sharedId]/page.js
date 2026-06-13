'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Loader2, CheckCircle2, AlertTriangle, ShieldCheck, 
    ChevronLeft, Ticket, User, Store, Calendar, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CouponService } from '@/services/CouponService';
import { StoreService } from '@/services/StoreService';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function CouponValidationPage() {
    const { sharedId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { getLocalizedString } = useStoreHelpers();

    const [loading, setLoading] = useState(true);
    const [couponInfo, setCouponInfo] = useState(null);
    const [storeInfo, setStoreInfo] = useState(null);
    const [validationStatus, setValidationStatus] = useState('pending'); // 'pending', 'success', 'error', 'unauthorized'
    const [errorMessage, setErrorMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push(`/login?redirect=/admin/validate/${sharedId}`);
            return;
        }
        loadValidationTarget();
    }, [sharedId, user, authLoading]);

    const loadValidationTarget = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            // 1. 공유 쿠폰 로드
            const sharedCoupon = await CouponService.getSharedCoupon(sharedId);
            if (!sharedCoupon) {
                setValidationStatus('error');
                setErrorMessage('유효하지 않거나 존재하지 않는 쿠폰입니다.');
                setLoading(false);
                return;
            }

            setCouponInfo(sharedCoupon);

            // 2. 가맹점 정보 로드
            const store = await StoreService.getStoreById(sharedCoupon.storeId);
            if (!store) {
                setValidationStatus('error');
                setErrorMessage('연결된 가맹점을 찾을 수 없습니다.');
                setLoading(false);
                return;
            }

            setStoreInfo(store);

            // 3. 권한 체크 (운영자이거나 가맹점 관리자(UID가 managerUid 또는 ownerUid 일치))
            const isSystemAdmin = user.email && user.email.toLowerCase() === 'btmt2019@gmail.com';
            const isStoreManager = String(store.managerUid) === String(user.uid) || String(store.ownerUid) === String(user.uid);

            if (!isSystemAdmin && !isStoreManager) {
                setValidationStatus('unauthorized');
                setErrorMessage('이 가맹점의 쿠폰을 승인할 권한이 없습니다. 등록된 관리자 계정으로 로그인해 주세요.');
                setLoading(false);
                return;
            }

            setValidationStatus('ready');
        } catch (error) {
            console.error("Failed to load QR verification target:", error);
            setValidationStatus('error');
            setErrorMessage('서버 데이터 조회 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (processing || !couponInfo) return;
        setProcessing(true);
        try {
            // CouponService.redeemCoupon(sharedId, adminUid, usedByUid) 호출
            await CouponService.redeemCoupon(sharedId, user.uid, couponInfo.senderUid);
            setValidationStatus('success');
        } catch (error) {
            console.error("Redemption failed:", error);
            alert("승인 처리 중 오류가 발생했습니다: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', gap: '16px' }}>
                <Loader2 className="animate-spin" size={36} color="#d4af37" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}>QR 쿠폰 정보 대조 중...</span>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#020204',
            color: '#f4f4f5',
            fontFamily: "'Pretendard', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px calc(40px + env(safe-area-inset-bottom))'
        }}>
            {/* Header */}
            <div style={{ width: '100%', maxWidth: '440px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <button 
                    onClick={() => router.push('/')}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                >
                    <ChevronLeft size={20} />
                </button>
                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#d4af37', letterSpacing: '0.15em' }}>QR VERIFIER</span>
                <div style={{ width: '38px' }} />
            </div>

            {/* Validation Panel */}
            <div style={{
                width: '100%',
                maxWidth: '440px',
                background: '#121214',
                borderRadius: '28px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '32px 24px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {validationStatus === 'ready' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1.5px solid #d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', margin: '0 auto 20px' }}>
                            <ShieldCheck size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 950, margin: '0 0 6px 0', color: '#ffffff' }}>쿠폰 승인 대기</h2>
                        <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: '0 0 24px 0' }}>모바일 승인 요청 상세 내용을 확인 후 완료해 주세요.</p>

                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', textAlign: 'left', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Store size={18} color="#d4af37" style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>가맹점</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>{getLocalizedString(storeInfo?.name)}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Ticket size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>적용 혜택</div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 950, color: '#ef4444' }}>{getLocalizedString(couponInfo?.discount)}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <User size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>고객 이름</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>{couponInfo?.senderName || '비회원'}</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleApprove}
                            disabled={processing}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #d4af37 0%, #aa8412 100%)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '16px',
                                fontWeight: 950,
                                fontSize: '1.05rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 8px 25px rgba(212,175,55,0.25)',
                                opacity: processing ? 0.75 : 1
                            }}
                        >
                            {processing ? <Loader2 className="animate-spin" size={20} /> : '승인 완료하기'}
                        </button>
                    </motion.div>
                )}

                {validationStatus === 'success' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1.5px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', margin: '0 auto 20px' }}>
                            <CheckCircle2 size={38} className="animate-pulse" />
                        </div>
                        <h2 style={{ fontSize: '1.45rem', fontWeight: 950, margin: '0 0 6px 0', color: '#22c55e' }}>쿠폰 사용 승인 완료</h2>
                        <p style={{ fontSize: '0.88rem', color: '#a1a1aa', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                            성공적으로 승인 기록이 가맹점 관리 내역에 동기화되었습니다. 고객에게 혜택을 제공해 주세요.
                        </p>
                        
                        <button
                            onClick={() => router.push('/')}
                            style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                            메인 화면으로 이동
                        </button>
                    </motion.div>
                )}

                {(validationStatus === 'error' || validationStatus === 'unauthorized') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1.5px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 20px' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 950, margin: '0 0 8px 0', color: '#ef4444' }}>
                            {validationStatus === 'unauthorized' ? '승인 권한 없음' : 'QR 코드 검증 실패'}
                        </h2>
                        <p style={{ fontSize: '0.88rem', color: '#d4d4d8', margin: '0 0 28px 0', lineHeight: 1.5 }}>{errorMessage}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <button
                                onClick={loadValidationTarget}
                                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ef4444 0%, #c22929 100%)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                                다시 시도하기
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#d4d4d8', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                                다른 계정으로 로그인
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
