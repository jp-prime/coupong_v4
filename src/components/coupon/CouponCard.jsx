import React, { useState, useEffect } from 'react';
import CouponCard_Type1 from './CouponCard_Type1';
import CouponCard_Type2 from './CouponCard_Type2';
import CouponCard_Type3 from './CouponCard_Type3';
import CouponCard_Type5 from './CouponCard_Type5';
import CouponCard_Staff from './CouponCard_Staff';
import { SettingsService } from '../../services/SettingsService';

const CouponCard = (props) => {
    const { isStaffMode, noBackground, isLightMode, forceType } = props;
    const [cardType, setCardType] = useState(forceType || null); // forceType이 있으면 초기값으로 사용
    const { hideShare } = props;

    useEffect(() => {
        // 캐시된 설정이 있으면 즉시 적용 (플래시 방지)
        const cached = SettingsService.getCachedSettings?.();
        if (cached?.couponCardType) {
            setCardType(cached.couponCardType);
        }

        // Subscribe to settings changes for real-time updates
        const unsubscribe = SettingsService.subscribe(settings => {
            if (settings && settings.couponCardType) {
                setCardType(settings.couponCardType);
            }
        });

        // Initial fetch as well just in case
        const fetchConfig = async () => {
            try {
                const settings = await SettingsService.getSettings();
                if (settings.couponCardType) {
                    setCardType(settings.couponCardType);
                } else {
                    setCardType('type2'); // Fallback to Type 2
                }
            } catch (error) {
                console.error("Failed to fetch initial card type:", error);
                setCardType('type2'); // Fallback on error
            }
        };
        fetchConfig();

        return () => unsubscribe();
    }, []);

    // 스태프 모드일 경우 전역 설정과 관계없이 전용 디자인 우선 적용
    if (isStaffMode) {
        return <CouponCard_Staff {...props} isLightMode={isLightMode} />;
    }

    // 설정 로딩 전에는 빈 플레이스홀더 (height 유지)
    if (!cardType) {
        return (
            <div style={{
                height: '140px',
                borderRadius: '20px',
                background: 'var(--color-bg-elevated)',
                animation: 'pulse 1.5s ease-in-out infinite',
                marginBottom: '12px',
                opacity: 0.5,
            }}>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 0.5; }
                        50% { opacity: 0.3; }
                    }
                `}</style>
            </div>
        );
    }

    if (cardType === 'type3') {
        return <CouponCard_Type3 {...props} isLightMode={isLightMode} />;
    }

    if (cardType === 'type1') {
        return <CouponCard_Type1 {...props} isLightMode={isLightMode} />;
    }

    if (cardType === 'type5') {
        return <CouponCard_Type5 {...props} isLightMode={isLightMode} />;
    }

    return <CouponCard_Type2 {...props} isLightMode={isLightMode} />;
};

export default CouponCard;
