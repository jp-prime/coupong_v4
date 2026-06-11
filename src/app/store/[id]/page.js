import { StoreService } from '../../../services/StoreService';
import { fixImageUrl } from './fixImageUrlHelper';

// SSR 서버 사이드 SEO용 이미지 헬퍼
function getSEOImageUrl(store) {
    const rawImage = store.image || store.mainImage || store.thumbnail || (store.images && store.images[0]) || '';
    if (!rawImage) return 'https://coupong.online/index512.png';
    return fixImageUrl(rawImage);
}

// 1. 서버 사이드 메타데이터 생성 (SEO 핵심)
export async function generateMetadata({ params }) {
    const { id } = await params;
    
    let store = null;
    try {
        const { SanityService } = await import('../../../services/SanityService');
        store = await SanityService.getStoreByIdOrSlug(id);
        
        if (!store) {
            const isFirestoreId = /^[a-zA-Z0-9]{20}$/.test(id);
            if (isFirestoreId) {
                store = await StoreService.getStoreById(id);
            }
            if (!store || !store.name || store.name === "이름 없음") {
                store = await StoreService.getStoreBySlug(id);
            }
        }
    } catch (e) {
        console.error("Failed to fetch store metadata on server side:", e);
    }

    if (!store) {
        return {
            title: '쿠퐁온라인 | 베트남 호치민 할인쿠폰 맛집',
            description: '베트남 호치민의 한식당 및 맛집 할인쿠폰 서비스',
        };
    }

    // 다국어 명칭 및 설명 추출 (SEO 크롤러용 기본 ko 기준 추출)
    const storeName = typeof store.name === 'object' ? (store.name.ko || store.name.en || store.name.vi || '') : store.name;
    const storeSlogan = typeof store.slogan === 'object' ? (store.slogan.ko || store.slogan.en || store.slogan.vi || '') : store.slogan;
    const storeDesc = typeof store.storeDescription === 'object' ? (store.storeDescription.ko || store.storeDescription.en || store.storeDescription.vi || '') : (store.description || store.storeDescription || '');
    
    const cleanDesc = storeDesc
        .replace(/<[^>]*>?/gm, '')
        .substring(0, 150);

    const titleStr = `[${storeName}] ${storeSlogan ? `- ${storeSlogan}` : ''} | 베트남 호치민 할인쿠폰 맛집`;
    const descStr = `${storeName} - ${storeSlogan || '베트남 현지 할인쿠폰 서비스'}. ${cleanDesc}`;
    const pageUrl = `https://coupong.online/store/${id}`;
    const imgUrl = getSEOImageUrl(store);

    return {
        title: titleStr,
        description: descStr,
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            type: 'website',
            url: pageUrl,
            title: titleStr,
            description: descStr,
            images: [
                {
                    url: imgUrl,
                    width: 800,
                    height: 800,
                    alt: storeName,
                }
            ],
            siteName: '쿠퐁온라인 (COUPONG ONLINE)',
        },
        twitter: {
            card: 'summary_large_image',
            title: titleStr,
            description: descStr,
            images: [imgUrl],
        }
    };
}

// 2. 실제 화면 렌더링을 담당하는 클라이언트 컴포넌트 임포트
import StoreDetailClient from './StoreDetailClient';

export default async function StoreDetailPage({ params }) {
    const { id } = await params;
    
    let storeData = null;
    try {
        const { SanityService } = await import('../../../services/SanityService');
        storeData = await SanityService.getStoreByIdOrSlug(id);
        
        if (!storeData) {
            const { StoreService } = await import('../../../services/StoreService');
            const isFirestoreId = /^[a-zA-Z0-9]{20}$/.test(id);
            if (isFirestoreId) {
                storeData = await StoreService.getStoreById(id);
            }
            if (!storeData || !storeData.name || storeData.name === "이름 없음") {
                storeData = await StoreService.getStoreBySlug(id);
            }
        }
    } catch (e) {
        console.error("Failed to fetch store data on server side:", e);
    }

    return <StoreDetailClient id={id} initialStoreData={storeData} />;
}
