import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useStoreHelpers = () => {
    const { i18n } = useTranslation();

    const getLocalizedString = useCallback((field) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        if (typeof field === 'object') {
            const currentLang = i18n?.language || 'ko';
            // 1. 현재 사용자 설정 언어(ko, vi, en 등)에 맞는 값 우선 출력
            // 2. 없을 경우 한국어 -> 영어 -> 베트남어 순으로 폴백
            let val = field[currentLang] || field.ko || field.en || field.vi;
            
            // 메타데이터 필드를 제외한 유효한 키 중 첫 번째 값을 fallback으로 사용
            if (val === undefined || val === null || val === '') {
                const validKeys = Object.keys(field).filter(key => !key.startsWith('_'));
                if (validKeys.length > 0) {
                    for (const key of validKeys) {
                        if (field[key]) {
                            val = field[key];
                            break;
                        }
                    }
                }
            }
            
            if (typeof val === 'string') return val;
            if (typeof val === 'number') return String(val);
            if (typeof val === 'object') return JSON.stringify(val);
            return '';
        }
        return String(field);
    }, [i18n?.language]);

    const getTranslatedLocation = useCallback((field) => {
        const str = getLocalizedString(field);
        return str;
    }, [getLocalizedString]);

    const getTranslatedCouponText = useCallback((field) => {
        let str = getLocalizedString(field);
        return str;
    }, [getLocalizedString]);

    const getOriginalString = useCallback((field) => {
        return null;
    }, []);

    const getTranslatedCategory = useCallback((catId) => {
        if (!catId) return '';
        return catId.toUpperCase();
    }, []);

    const fixImageUrl = useCallback((url) => {
        if (!url) return '/index512.png';
        if (typeof url !== 'string') return '/index512.png';

        // ✅ 구글 콘텐츠 서버 이미지 처리 보완
        if (url.includes('googleusercontent.com')) {
            const baseUrl = url.split('=')[0]; 
            return `${baseUrl}=s1000-w1000-h1000-rw`;
        }

        if (url.startsWith('http')) return url;

        if (url.startsWith('stores/') || url.startsWith('coupons/') || url.startsWith('admin_gallery/') || url.startsWith('/storage')) {
            const cleanPath = url.startsWith('/') ? url.substring(1) : url;
            return `https://firebasestorage.googleapis.com/v0/b/coupong-98b03.firebasestorage.app/o/${encodeURIComponent(cleanPath)}?alt=media`;
        }
        return url;
    }, []);

    return { 
        getLocalizedString, 
        getTranslatedLocation, 
        getTranslatedCouponText, 
        getOriginalString, 
        getTranslatedCategory,
        fixImageUrl 
    };
};
