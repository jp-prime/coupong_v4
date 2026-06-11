import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { CouponService } from '../../services/CouponService';
import { useAuth } from '../../context/AuthContext';
import { useStoreHelpers } from '../../hooks/useStoreHelpers';

const UseCouponModal = ({ isOpen, onClose, coupon, store }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { getLocalizedString } = useStoreHelpers();
    const [step, setStep] = useState('intro'); // 'intro', 'loading', 'qr'
    const [sharedId, setSharedId] = useState(null);
    const [error, setError] = useState(null);

    // Auto-start QR if admin
    React.useEffect(() => {
        if (isOpen && step === 'intro' && (user?.isAdmin || user?.role === 'admin' || user?.role === 'store_owner')) {
            handleGenerateQR();
        }
    }, [isOpen, user, step]);

    if (!isOpen) return null;

    const handleGenerateQR = async () => {
        setStep('loading');
        try {
            const newSharedId = await CouponService.generateSelfUseCoupon(
                coupon.id,
                store.id,
                user?.uid || 'guest',
                user ? (user.displayName || t('coupons.userDefaultName', '사용자')) : t('common.anonymous', '비회원')
            );
            setSharedId(newSharedId);
            setStep('qr');
        } catch (err) {
            console.error("Self-use generation error:", err);
            setError(t('coupons.qrError', 'QR 코드를 생성하는 중 오류가 발생했습니다.'));
            setStep('intro');
        }
    };

    const handleClose = () => {
        setStep('intro');
        setSharedId(null);
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 199999
                        }}
                    />
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        zIndex: 200000,
                        pointerEvents: 'none'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            style={{
                                background: 'white',
                                borderRadius: '32px',
                                width: '100%',
                                maxWidth: '400px',
                                overflow: 'hidden',
                                pointerEvents: 'auto',
                                boxShadow: '0 30px 100px rgba(0,0,0,0.3)',
                                position: 'relative'
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #f1f5f9'
                            }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {t('coupons.useCouponTitle', '할인 혜택 사용하기')} <Sparkles size={18} color="#ef4444" fill="#ef4444" />
                                </h3>
                                <button
                                    onClick={handleClose}
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        display: 'flex',
                                        borderRadius: '50%'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content body */}
                            <div style={{ padding: '24px 24px', textAlign: 'center' }}>
                                {step === 'intro' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
                                            borderRadius: '24px',
                                            padding: '24px 20px',
                                            marginBottom: '20px',
                                            border: '2px dashed #ef444430',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 800,
                                                color: '#ef4444',
                                                marginBottom: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                letterSpacing: '1px'
                                            }}>
                                                <CheckCircle size={16} /> {t('coupons.benefitToApply', '적용 예정 혜택')}
                                            </div>

                                            <div style={{
                                                fontSize: '2.2rem',
                                                fontWeight: 950,
                                                color: '#ef4444',
                                                lineHeight: 1,
                                                marginBottom: '6px',
                                                letterSpacing: '-2px'
                                            }}>
                                                {getLocalizedString(coupon?.discount) || t('coupons.discountLabel')}
                                            </div>

                                            <div style={{
                                                fontSize: '1.15rem',
                                                fontWeight: 900,
                                                color: '#1e293b',
                                                wordBreak: 'keep-all'
                                            }}>
                                                {getLocalizedString(coupon?.name) || t('coupons.couponLabel')}
                                            </div>

                                            {coupon?.description && (
                                                <div style={{
                                                    marginTop: '16px',
                                                    padding: '16px',
                                                    background: '#f8fafc',
                                                    borderRadius: '16px',
                                                    border: '1px solid #e2e8f0',
                                                    textAlign: 'left'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', marginBottom: '8px' }}>
                                                        <AlertCircle size={14} color="#64748b" />
                                                        <span style={{ fontWeight: 950, fontSize: '0.85rem', letterSpacing: '-0.5px', color: '#0f172a' }}>사용 조건 및 주의사항</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>
                                                        {getLocalizedString(coupon.description)}
                                                    </div>
                                                    {store?.phone && (
                                                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '0.88rem', color: '#0f172a', fontWeight: 950 }}>
                                                            담당자 : {store.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 700, lineHeight: 1.5, marginBottom: '20px' }}>
                                            {t('coupons.useCouponDesc', '매장 직원에게 이 화면을 보여주시면 즉시 할인이 적용됩니다.')}
                                        </div>
                                        
                                        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 800 }}>{error}</p>}
                                        
                                        <button
                                            onClick={handleGenerateQR}
                                            style={{
                                                width: '100%',
                                                padding: '18px',
                                                background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '20px',
                                                fontSize: '1.1rem',
                                                fontWeight: 950,
                                                cursor: 'pointer',
                                                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.35)'
                                            }}
                                        >
                                            {t('coupons.getDiscountNow', '지금 바로 할인받기')}
                                        </button>
                                    </motion.div>
                                )}

                                {step === 'loading' && (
                                    <div style={{ padding: '60px 0', color: '#ef4444' }}>
                                        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 24px' }} />
                                        <div style={{ fontWeight: 950, fontSize: '1.2rem', color: '#0f172a' }}>{t('coupons.generatingQR', 'QR 코드를 생성 중입니다...')}</div>
                                    </div>
                                )}

                                {step === 'qr' && sharedId && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 950, color: '#0f172a', marginBottom: '12px' }}>
                                            {t('coupons.showToStaff', '직원에게 보여주세요')}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 800, marginBottom: '32px' }}>
                                            {getLocalizedString(coupon.discount || coupon.name)} 쿠폰이 적용됩니다.
                                        </div>

                                        <div style={{
                                            background: '#f8fafc',
                                            padding: '24px',
                                            borderRadius: '24px',
                                            border: '1px solid #e2e8f0',
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            marginBottom: '24px',
                                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
                                        }}>
                                            <QRCodeCanvas
                                                value={`${window.location.origin}${(() => {
                                                    const fullPath = window.location.pathname;
                                                    const routeSegments = ['/store', '/admin', '/coupon', '/mypage', '/login'];
                                                    let bp = fullPath.replace(/\/(index\.html|share\.php)$/, '');
                                                    for (const s of routeSegments) {
                                                        if (bp.includes(s)) {
                                                            bp = bp.substring(0, bp.indexOf(s));
                                                            break;
                                                        }
                                                    }
                                                    return bp.endsWith('/') && bp.length > 1 ? bp.slice(0, -1) : (bp || '');
                                                })()}/admin/validate/${sharedId}${user ? `?u=${user.uid}` : ''}`}
                                                size={240}
                                                level="H"
                                                style={{ display: 'block', maxWidth: '100%' }}
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: 700, margin: 0 }}>
                                            {t('coupons.qrBrightnessInstruction', '인식 오류 시 화면 밝기를 올려주세요.')}
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UseCouponModal;
