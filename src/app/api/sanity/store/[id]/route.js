import { SanityService } from '@/services/SanityService';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        let id = resolvedParams.id;
        try {
            id = decodeURIComponent(id);
        } catch (e) {}
        const data = await SanityService.getStoreByIdOrSlug(id);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
