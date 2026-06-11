import { SanityService } from '@/services/SanityService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        let slug = resolvedParams.slug;
        try {
            slug = decodeURIComponent(slug);
        } catch (e) {}
        const data = await SanityService.getBoardPostBySlug(slug);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
