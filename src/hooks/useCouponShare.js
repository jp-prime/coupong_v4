import { useState } from 'react';
import { CouponService } from '../services/CouponService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useStoreHelpers } from './useStoreHelpers';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const useCouponShare = () => {
    const { isAdmin, user } = useAuth();
    const { t } = useTranslation();
    const { getLocalizedString } = useStoreHelpers();
    
    // For admin modal
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [useCouponData, setUseCouponData] = useState(null);
    const [selectedStore, setSelectedStore] = useState(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleOpenGiftModal = async (coupon, store) => {
        // 관리자 포함 모든 유저용 즉시 공유 (Direct Share)
        setIsSharing(true);
            try {
                const storeName = getLocalizedString(store.name);
                const slogan = getLocalizedString(store.slogan || store.storeDescription) || '';
                const shareTitle = `[${storeName}] 특별한 선물이 도착했습니다!`;
                const shareText = `${storeName}에서 할인쿠폰을 쏩니다. 지금 혜택을 확인해보세요! 🎁`;
                
                const giftData = {
                    couponId: coupon.id,
                    storeId: store.id,
                    senderUid: user?.uid || 'guest',
                    senderName: user ? (user.displayName || user.email) : t('common.anonymous', '비회원'),
                    shareMemo: '',
                    status: 'issued',
                    rewardAmount: 0,
                    createdAt: serverTimestamp()
                };

                await addDoc(collection(db, 'gift_vouchers'), giftData);

                const sharedId = await CouponService.createSharedCoupon({
                    couponId: coupon.id,
                    storeId: store.id,
                    storeName: storeName,
                    storeThumbnail: store.shareThumbnail || store.image || store.mainImage || '',
                    storeSlogan: slogan,
                    senderName: giftData.senderName,
                    senderUid: giftData.senderUid,
                    shareMemo: '',
                    rewardAmount: 0
                });

                if (typeof window !== "undefined") {
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
                    
                    let shareUrl = '';
                    if (isLocal) {
                        shareUrl = `${window.location.origin}${basePath}/coupon/share2/${sharedId}`;
                    } else {
                        shareUrl = `${window.location.origin}${basePath}/share.php?id=${sharedId}`;
                    }

                    if (navigator.share) {
                        await navigator.share({
                            title: shareTitle,
                            text: shareText,
                            url: shareUrl,
                        });
                    } else {
                        await navigator.clipboard.writeText(shareUrl);
                        alert("링크가 복사되었습니다!");
                    }
                }
            } catch (error) {
                console.error("Share failed:", error);
                if (error.name !== 'AbortError') {
                    alert("공유 중 오류가 발생했습니다.");
                }
            } finally {
                setIsSharing(false);
        }
    };

    return {
        isGiftModalOpen,
        setIsGiftModalOpen,
        useCouponData,
        selectedStore,
        isSharing,
        handleOpenGiftModal
    };
};
