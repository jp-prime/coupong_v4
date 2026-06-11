'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SharedCouponClient({ sharedId, senderUid, storeId }) {
    const router = useRouter();

    useEffect(() => {
        if (senderUid) {
            localStorage.setItem('referred_by_uid', senderUid);
        }
        if (storeId) {
            router.replace(`/store/${storeId}`);
        } else {
            router.replace('/');
        }
    }, [senderUid, storeId, router]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#ffffff' }}>
            <Loader2 className="animate-spin" size={40} color="#6366f1" />
            <p style={{ marginTop: '16px', color: '#64748b', fontWeight: 600 }}>쿠폰 정보를 불러오고 있습니다...</p>
        </div>
    );
}
