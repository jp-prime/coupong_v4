import { SanityService } from '@/services/SanityService';
import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic'; // 동적 캐시 상태 체크를 위해 force-dynamic 전환

export async function GET() {
    try {
        // 1. Firebase에서 관리자가 켠 캐시 설정 가져오기
        let isCacheEnabled = true;
        try {
            const cacheSettingRef = doc(db, 'system_settings', 'caching');
            const docSnap = await getDoc(cacheSettingRef);
            if (docSnap.exists()) {
                isCacheEnabled = docSnap.data().isEnabled !== false;
            }
        } catch (dbError) {
            console.error("Failed to fetch caching configuration:", dbError);
        }

        const data = await SanityService.getAllStores();

        if (isCacheEnabled) {
            // 캐시 보관 모드 (1시간 보관)
            return NextResponse.json(data, {
                headers: {
                    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=600',
                }
            });
        } else {
            // 실시간 작업 모드 (캐시 제거)
            return NextResponse.json(data, {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
