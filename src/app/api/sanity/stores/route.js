import { SanityService } from '@/services/SanityService';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await SanityService.getAllStores();
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
