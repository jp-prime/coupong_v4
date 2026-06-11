import { SanityService } from '@/services/SanityService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        let id = resolvedParams.id;
        try {
            id = decodeURIComponent(id);
        } catch (e) {}
        const data = await SanityService.getStoreByIdOrSlug(id);
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
