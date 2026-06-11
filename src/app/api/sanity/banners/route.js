import { SanityService } from '@/services/SanityService';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await SanityService.getMainBanners();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
