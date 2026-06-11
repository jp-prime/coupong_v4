import { Suspense } from 'react';
import StoresV3Page from '../StoresV3Page';
import { StoreService } from '../../../services/StoreService';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { storeId } = await params;
    try {
        const store = await StoreService.getStoreById(storeId);
        if (store) {
            let storeName = '';
            if (typeof store.name === 'object') {
                storeName = store.name.ko || store.name.en || store.name.vi || '';
            } else {
                storeName = store.name || '';
            }
            
            let storeSlogan = '';
            if (typeof store.slogan === 'object') {
                storeSlogan = store.slogan.ko || store.slogan.en || store.slogan.vi || '';
            } else {
                storeSlogan = store.slogan || '';
            }
            
            return {
                title: `${storeName} | 쿠퐁온라인 베트남 할인쿠폰 업소홍보`,
                description: `${storeName} - ${storeSlogan || '베트남 호치민 푸미흥 맛집 마사지 이발소 추천 후기 디시 할인쿠폰 혜택을 확인해보세요.'}`,
            };
        }
    } catch (e) {
        console.error(e);
    }
    
    return {
        title: '쿠퐁온라인 베트남 할인쿠폰 업소홍보',
        description: '베트남 호치민 푸미흥 맛집 마사지 이발소 추천 후기 디시 할인쿠폰 혜택을 확인해보세요.',
    };
}

export default async function V3DetailPage() {
    let initialStores = [];
    try {
        const { stores } = await StoreService.getStoresPaged(false);
        initialStores = stores.filter(s => s.isActive !== false).sort((a, b) => {
            if (a.isHot && !b.isHot) return -1;
            if (!a.isHot && b.isHot) return 1;
            return (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999);
        });
    } catch (e) {
        console.error("Server-side store fetch failed:", e);
    }

    return (
        <Suspense fallback={<div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>로딩 중...</div>}>
            <StoresV3Page initialStores={initialStores} />
        </Suspense>
    );
}
