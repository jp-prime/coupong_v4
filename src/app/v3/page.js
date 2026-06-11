import { Suspense } from 'react';
import StoresV3Page from './StoresV3Page';
import { StoreService } from '../../services/StoreService';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    try {
        const { stores } = await StoreService.getStoresPaged(false);
        const names = stores
            .map(s => {
                if (typeof s.name === 'object') {
                    return s.name.ko || s.name.en || s.name.vi || '';
                }
                return s.name || '';
            })
            .filter(Boolean)
            .slice(0, 20)
            .join(', ');

        return {
            title: '쿠퐁온라인 베트남 할인쿠폰 업소홍보',
            description: `베트남 호치민 푸미흥 맛집 마사지 이발소 추천 후기 디시 할인쿠폰 혜택을 확인해보세요. (${names})`,
        };
    } catch (e) {
        return {
            title: '쿠퐁온라인 베트남 할인쿠폰 업소홍보',
            description: '베트남 호치민 푸미흥 맛집 마사지 이발소 추천 후기 디시 할인쿠폰 혜택을 확인해보세요.',
        };
    }
}

export default async function V3Page() {
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
