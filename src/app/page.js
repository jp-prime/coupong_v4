import React from 'react';
import { StoreService } from '@/services/StoreService';
import CouponsClient from './CouponsClient';

// 서버 사이드에서 데이터를 실시간으로 가져오도록 강제 설정
export const dynamic = 'force-dynamic';

export default async function CouponsV2Page() {
    let initialStores = [];
    try {
        const data = await StoreService.getAllStores();
        // 비활성되지 않은 활성 상태의 스토어만 사전 필터링
        const activeOnly = data.filter(s => s.isActive !== false);
        initialStores = [...activeOnly].sort((a, b) => {
            if (a.isHot && !b.isHot) return -1;
            if (!a.isHot && b.isHot) return 1;

            const orderA = a.displayOrder ?? 9999;
            const orderB = b.displayOrder ?? 9999;
            if (orderA !== orderB) return orderA - orderB;

            return 0;
        });
    } catch (error) {
        console.error("Failed to load stores on server side:", error);
    }

    return (
        <CouponsClient initialStores={initialStores} />
    );
}
