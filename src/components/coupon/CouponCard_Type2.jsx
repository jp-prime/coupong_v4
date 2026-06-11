import React from 'react';
import { motion } from 'framer-motion';
import { Store, Heart, QrCode, Share2, ArrowRight, Flame, Sparkles, MapPin, Ticket } from 'lucide-react';
import { useStoreHelpers } from '../../hooks/useStoreHelpers';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';

const CouponCard = ({
    coupon,
    store,
    index,
    lastCouponRef,
    navigate,
    renderFormattedText,
    handleOpenGiftModal,
    handleOpenUseModal,
    hideShare,
    isStaffMode,
    noBackground,
    isLightMode
}) => {
    const { getLocalizedString, getTranslatedLocation, getTranslatedCouponText, getTranslatedCategory, fixImageUrl } = useStoreHelpers();
    const { t } = useTranslation();
    const isHot = coupon.isShocking;
    const isBest = coupon.isRecommended;
    
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const titleFont = isKorean ? "'NanumSquareNeo', sans-serif" : ((i18n.language === 'en') ? "'LotteMartDream', sans-serif" : "'Do Hyeon', sans-serif");
    const bodyFont = i18n.language === 'ko' ? "'NanumSquareNeo', sans-serif" : ((i18n.language === 'en') ? "'LotteMartDream', sans-serif" : "'Roboto', sans-serif");
    const useLotte = i18n.language === 'ko' || i18n.language === 'en';

    // Premium Color Palette
    const colors = {
        hot: {
            bg: isLightMode ? '#ffffff' : '#ff5e84', 
            glow: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 94, 132, 0.4)',
            text: isLightMode ? '#0f172a' : '#ffffff',
            secondaryText: isLightMode ? '#64748b' : 'rgba(255, 255, 255, 0.8)',
            accent: isLightMode ? '#2563eb' : '#ffec00'
        },
        best: {
            bg: isLightMode ? '#ffffff' : '#36b3a8',
            glow: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(54, 179, 168, 0.4)',
            text: isLightMode ? '#0f172a' : '#ffffff',
            secondaryText: isLightMode ? '#64748b' : 'rgba(255, 255, 255, 0.8)',
            accent: isLightMode ? '#2563eb' : '#ffffff'
        },
        normal: {
            bg: isLightMode ? '#ffffff' : '#1c202d', 
            glow: 'rgba(0, 0, 0, 0.05)',
            text: isLightMode ? '#0f172a' : '#ffffff', 
            secondaryText: '#64748b',
            accent: isLightMode ? '#2563eb' : '#f87171' // Blue for usage text in Light Mode
        }
    };

    const currentStyle = isHot ? colors.hot : (isBest ? colors.best : colors.normal);

    // 전면 다크모드 적용: 모든 카드는 기본적으로 다크 스타일 유지 (isLightMode가 없을 때)
    const cardBg = noBackground ? 'none' : currentStyle.bg;
    const cardTextColor = currentStyle.text;
    const secondaryTextColor = noBackground ? (isLightMode ? '#475569' : 'rgba(255, 255, 255, 0.85)') : currentStyle.secondaryText;
    const notchBg = '#ffffff'; // 부모 박스 배경색(흰색)에 맞춤

    return (
        <motion.div
            ref={lastCouponRef}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            style={{
                display: 'flex',
                borderRadius: '16px',
                background: cardBg,
                border: noBackground ? 'none' : ((isHot || isBest) ? 'none' : '1px solid rgba(255, 255, 255, 0.15)'),
                overflow: 'hidden',
                boxShadow: noBackground ? 'none' : '0 4px 10px rgba(0,0,0,0.1)',
                position: 'relative',
                height: '190px',
                minHeight: '190px',
                maxHeight: '190px',
                cursor: 'pointer',
                marginBottom: noBackground ? '0px' : '16px',
                borderBottom: noBackground ? '1px solid rgba(255, 255, 255, 0.2)' : undefined,
                boxSizing: 'border-box',
                willChange: 'transform, opacity'
            }}
            onClick={() => navigate(`/store/${coupon.storeId}`)}
        >
            {/* Decorative Watermark Icon */}
            <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                color: (isHot || isBest) ? (isLightMode ? '#0f172a' : 'white') : (isLightMode ? '#0f172a' : '#1e3a8a'),
                opacity: isLightMode ? 0.04 : (isHot || isBest ? 0.12 : 0.05),
                pointerEvents: 'none',
                zIndex: 1
            }}>
                <Ticket size={110} style={{ transform: 'rotate(-25deg)' }} />
            </div>

            {/* 장식용 대각선 리본 (더블 스트라이프) */}
            <div style={{
                position: 'absolute',
                top: '18px',
                right: '-40px',
                width: '130px',
                height: '22px',
                background: isHot ? 'rgba(255,236,0,0.8)' : isBest ? 'rgba(255,255,255,0.35)' : 'rgba(161,99,56,0.25)',
                transform: 'rotate(45deg)',
                zIndex: 4,
                pointerEvents: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}>
                <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: isHot ? 'rgba(255,200,0,0.6)' : isBest ? 'rgba(255,255,255,0.5)' : 'rgba(161,99,56,0.4)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: isHot ? 'rgba(255,200,0,0.6)' : isBest ? 'rgba(255,255,255,0.5)' : 'rgba(161,99,56,0.4)',
                }} />
            </div>
            {/* Left Section: Visual / Logo */}
            <div style={{
                width: '100px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2
            }}>
                <div style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '16px', // 14px -> 16px
                    overflow: 'hidden',
                    border: (isHot || isBest) ? '3px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    background: '#f8fafc'
                }}>
                    {store?.image ? (
                        <img
                            src={fixImageUrl(store.image)}
                            alt={getLocalizedString(store.name)}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#cbd5e1' }}>
                            <Store size={32} />
                        </div>
                    )}
                </div>

                {/* Like Badge (Restored) */}
                {store?.likeCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: '#ff4c61',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        border: '2px solid white',
                        boxShadow: '0 4px 8px rgba(255, 76, 97, 0.3)'
                    }}>
                        <Heart size={10} fill="white" />
                        {store.likeCount}
                    </div>
                )}
            </div>

            {/* Middle Section: Coupon Info */}
            <div style={{
                flex: 1,
                padding: '16px 4px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                <div style={{
                    fontSize: '0.7rem',
                    fontWeight: isKorean ? 900 : 700,
                    color: !isLightMode && (isHot || isBest) ? 'rgba(255,255,255,0.8)' : secondaryTextColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '2px',
                    flexWrap: 'wrap',
                    wordBreak: 'break-all',
                    letterSpacing: '-0.04em',
                    fontFamily: isKorean ? "'NanumSquareNeo', sans-serif" : 'inherit'
                }}>
                    <span style={{ color: cardTextColor, fontWeight: isKorean ? 900 : 700, fontSize: '0.8rem', fontFamily: titleFont }}>
                        {store ? getLocalizedString(store.name) : 'Coupong Store'}
                    </span>
                    <span style={{ opacity: 0.5 }}>|</span>
                    <span style={{ fontWeight: isKorean ? 800 : 700 }}>{store ? getTranslatedCategory(store.category) : ''}</span>
                    {store?.location && (
                        <>
                            <span style={{ opacity: 0.5 }}>|</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: isKorean ? 800 : 700 }}>
                                <MapPin size={10} /> {getTranslatedLocation(store.location)}
                            </span>
                        </>
                    )}
                    {store?.slogan && (
                        <>
                            <span style={{ opacity: 0.5 }}>|</span>
                            <span style={{ letterSpacing: i18n.language === 'ko' ? 'normal' : '0.03em', fontFamily: bodyFont, fontWeight: isKorean ? 800 : (i18n.language === 'en' ? 300 : 500) }}>{getLocalizedString(store.slogan)}</span>
                        </>
                    )}
                </div>

                {/* Main Discount - High Impact */}
                <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: isKorean ? 900 : 700,
                    color: isLightMode && !isHot && !isBest ? '#ef4444' : cardTextColor,
                    lineHeight: 1.1,
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: titleFont
                }}>
                    {getTranslatedCouponText(coupon.discount) || getTranslatedCouponText(coupon.title)}
                </h3>

                {/* Status & Remarks Line */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '-2px', marginBottom: '4px' }}>
                    {coupon.canCombine === false && (
                        <div style={{
                            fontSize: '0.7rem',
                            fontWeight: isKorean ? 800 : 700,
                            color: isHot ? (isLightMode ? '#64748b' : '#ffffff') : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: bodyFont
                        }}>
                            <span style={{ fontSize: '0.8rem' }}>•</span> {t('coupons.notCombinable')}
                        </div>
                    )}
                    {store?.remarks && (
                        <div style={{
                            fontSize: '0.7rem',
                            fontWeight: isKorean ? 800 : 700,
                            color: isLightMode ? '#2563eb' : '#ffec00', 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: bodyFont,
                            letterSpacing: '-0.04em'
                        }}>
                            {coupon.canCombine === false && <span style={{ opacity: 0.3, color: isLightMode ? '#64748b' : 'white' }}>|</span>}
                            {store.remarks}
                        </div>
                    )}
                </div>

                {/* Description - Overflow Protection */}
                <p style={{
                    fontSize: '0.7rem',
                    fontWeight: isKorean ? 900 : (i18n.language === 'en' ? 300 : 500),
                    color: secondaryTextColor,
                    opacity: 0.9,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.3,
                    letterSpacing: '-0.04em',
                    fontFamily: bodyFont
                }}>
                    {getTranslatedCouponText(coupon.description) || t('coupons.checkDetails')}
                </p>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {isHot && (
                        <span style={{
                            fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px', borderRadius: '6px',
                            background: 'rgba(255, 236, 0, 0.2)', color: (isHot || isBest) ? '#ffec00' : '#ff4c61',
                            display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid rgba(255, 236, 0, 0.3)'
                        }}>
                            <Flame size={10} fill="currentColor" /> HOT
                        </span>
                    )}
                    {isBest && (
                        <span style={{
                            fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px', borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.2)', color: 'white',
                            display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}>
                            <Sparkles size={10} fill="currentColor" /> PICK
                        </span>
                    )}
                    {isStaffMode && (
                        <span style={{
                            fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px', borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1',
                            display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                            STAFF
                        </span>
                    )}
                    {coupon.limitQuantity > 0 && (
                        <div style={{
                            fontSize: '0.7rem',
                            color: isHot || isBest ? (isLightMode ? '#1e293b' : 'white') : '#fb7185',
                            fontFamily: bodyFont,
                            fontWeight: isKorean ? 900 : 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {t('coupons.stockRemaining', { count: coupon.limitQuantity })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Section: Action Stub */}
            <div style={{
                padding: '12px',
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2,
                position: 'absolute',
                bottom: '10px',
                right: '10px'
            }}>
                {!hideShare && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleOpenGiftModal(coupon, store); }}
                        style={{
                            height: '38px', width: '38px', borderRadius: '10px',
                            background: '#e2e8f0', // Light gray background
                            border: 'none',
                            color: '#475569',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <Share2 size={16} />
                    </motion.button>
                )}
                {!isStaffMode ? (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleOpenUseModal(coupon, store); }}
                        style={{
                            height: '38px', padding: '0 16px', borderRadius: '10px', border: 'none',
                            background: '#818cf8', 
                            color: 'white',
                            display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                        }}
                    >
                        <QrCode size={16} /> {t('coupons.useCoupon')}
                    </motion.button>
                ) : (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                            background: 'white',
                            padding: '6px',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <QRCodeCanvas 
                            value={`${window.location.origin}/admin/validate-coupon/${store?.id}/${coupon?.id}`}
                            size={56}
                            level="H"
                        />
                    </motion.div>
                )}
            </div>

        </motion.div>
    );
};

export default CouponCard;
