import { Suspense } from 'react';
import StoresV4Page from '../StoresV4Page';
import { StoreService } from '../../../services/StoreService';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    return {
        title: '비나통 V4 프리미엄 모바일 피드',
        description: '베트남 호치민 할인쿠폰 프리미엄 큐레이션 피드.',
    };
}

export default async function V4DetailPage() {
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

    const serializedStores = JSON.parse(JSON.stringify(initialStores));

    return (
        <Suspense fallback={<div style={{ background: '#09090b', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>비나통 V4 불러오는 중...</div>}>
            <StoresV4Page initialStores={serializedStores} />
        </Suspense>
    );
}
