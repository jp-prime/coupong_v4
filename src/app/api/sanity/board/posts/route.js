import { SanityService } from '@/services/SanityService';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const limit = Number(searchParams.get('limit')) || 50;
        const data = await SanityService.getBoardPosts(category, limit);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
