import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Gift, Copy, MessageSquare, Share2, CheckCircle2, Globe, Camera, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { CouponService } from '../../services/CouponService';
import { SettingsService } from '../../services/SettingsService';
import { StorageService } from '../../services/StorageService';
import { useEffect as useEffectHook } from 'react';
import { useStoreHelpers } from '../../hooks/useStoreHelpers';

const GiftModal = ({ isOpen, onClose, coupon, store }) => {
    const { user, isAdmin } = useAuth();
    const { t } = useTranslation();
    const { getLocalizedString } = useStoreHelpers();
    const [shareMemo, setShareMemo] = useState('');
    const [customThumbnail, setCustomThumbnail] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [sharedUrl, setSharedUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [rewardPercent, setRewardPercent] = useState(20); // 기본 20%

    useEffectHook(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            const settings = await SettingsService.getSettings();
            if (settings?.rewardDistribution?.referrerA) {
                setRewardPercent(settings.rewardDistribution.referrerA);
            }
        } catch (error) {
            console.error("Error fetching reward settings:", error);
        }
    };

    if (!isOpen || !coupon || !store) return null;

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(sharedUrl);
        setCopied(true);
        setTimeout(() => {
            onClose();
        }, 800);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                const storeName = getLocalizedString(store.name);
                const slogan = getLocalizedString(store.slogan || store.storeDescription) || '';
                const shareTitle = `[${storeName}] 특별한 선물이 도착했습니다!`;
                const shareText = `${storeName}에서 할인쿠폰을 쏩니다. 지금 혜택을 확인해보세요! 🎁`;

                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: sharedUrl,
                });
                onClose();
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            handleCopyUrl();
        }
    };

    const handleSendGift = async () => {
        // 비회원도 공유 가능하도록 !user 체크 제거
        
        setLoading(true);
        try {
            const giftData = {
                couponId: coupon.id,
                storeId: store.id,
                senderUid: user?.uid || 'guest',
                senderName: user ? (user.displayName || user.email) : t('common.anonymous', '비회원'),
                shareMemo: shareMemo,
                status: 'issued',
                rewardAmount: 0, // 리워드 연결 중지: 0으로 설정
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'gift_vouchers'), giftData);

            const sharedId = await CouponService.createSharedCoupon({
                couponId: coupon.id,
                storeId: store.id,
                storeName: getLocalizedString(store.name),
                storeThumbnail: customThumbnail || store.shareThumbnail || store.image || store.mainImage || '',
                storeSlogan: getLocalizedString(store.slogan || store.storeDescription) || '',
                senderName: giftData.senderName,
                senderUid: giftData.senderUid,
                shareMemo: shareMemo,
                rewardAmount: 0 // 리워드 연결 중지: 0으로 설정
            });

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const getBasePath = () => {
                const fullPath = window.location.pathname;
                const routeSegments = ['/store', '/admin', '/coupon', '/mypage', '/login'];
                let bp = fullPath.replace(/\/(index\.html|share\.php)$/, '');
                for (const s of routeSegments) {
                    if (bp.includes(s)) {
                        bp = bp.substring(0, bp.indexOf(s));
                        break;
                    }
                }
                return bp === '/' ? '' : (bp.endsWith('/') ? bp.slice(0, -1) : (bp || ''));
            };
            const basePath = getBasePath();

            if (isLocal) {
                setSharedUrl(`${window.location.origin}${basePath}/coupon/share2/${sharedId}`);
            } else {
                setSharedUrl(`${window.location.origin}${basePath}/share.php?id=${sharedId}`);
            }
            setSuccess(true);
        } catch (error) {
            console.error("Error sharing coupon:", error);
            alert(t('common.errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'var(--color-bg-elevated)',
                width: '100%', maxWidth: '480px',
                borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                padding: '24px 24px 100px 24px', position: 'relative',
                maxHeight: '90vh', overflowY: 'auto',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <button onClick={onClose} style={{ border: 'none', background: 'transparent', position: 'absolute', top: '20px', right: '20px', padding: '8px', cursor: 'pointer' }}>
                    <X size={24} color="var(--color-text-muted)" />
                </button>

                {!success ? (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Share2 size={32} color="var(--color-primary)" />
                            </div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>{t('common.share')}</h2>
                        </div>

                        <div style={{ background: '#0f172a', padding: '24px 16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '8px', color: 'var(--color-text-main)' }}>
                                {getLocalizedString(coupon.title || coupon.name)}
                            </strong>
                            <span style={{ color: '#fb7185', fontWeight: 900, fontSize: '1.4rem' }}>
                                {getLocalizedString(coupon.discount) || t('coupons.alwaysAvailable')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-main)' }}>
                                    <MessageSquare size={16} /> {t('common.recipient', { defaultValue: 'Recipient/Note' })}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('mypage.inputMessage')}
                                    value={shareMemo}
                                    onChange={(e) => setShareMemo(e.target.value)}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: '#020617', color: 'var(--color-text-main)' }}
                                />
                            </div>

                            {/* Admin Only: Custom Sharing Thumbnail (Removed) */}
                        </div>

                        <button
                            onClick={handleSendGift}
                            disabled={loading}
                            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? t('common.loading') : t('common.shareLink')}
                        </button>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <CheckCircle2 size={40} color="var(--color-success)" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 12px' }}>{t('common.shareReady', { defaultValue: 'Ready to Share!' })}</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
                            {t('common.shareInstruction', '아래의 원하시는 방법으로 쿠폰을 전달해주세요.')}<br />
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            <button
                                onClick={handleNativeShare}
                                style={{
                                    width: '100%', padding: '16px',
                                    background: 'var(--color-primary)', color: 'white',
                                    border: 'none', borderRadius: '16px',
                                    fontSize: '1.05rem', fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Share2 size={20} /> {t('common.share')}
                            </button>

                            <button
                                onClick={handleCopyUrl}
                                style={{
                                    width: '100%', padding: '16px',
                                    background: '#1e293b', color: '#f8fafc',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                                    fontSize: '1.05rem', fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {copied ? <CheckCircle2 size={20} color="var(--color-success)" /> : <Copy size={20} />}
                                {copied ? t('common.copied') : t('share.copyLinkShort')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default GiftModal;
