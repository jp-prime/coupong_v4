import { Suspense } from 'react';
import PromosClient from './PromosClient';
import { PromoService } from '@/services/PromoService';

// 1. Dynamic Server Metadata Generation (SEO)
export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const id = params.id;

    if (!id) {
        return {
            title: '쿠퐁온라인 스페셜 홍보관 | 베트남 호치민 할인 혜택',
            description: '베트남 호치민 현지 제휴 업체들의 스페셜 할인 프로모션, 신규 오픈 소식을 실시간으로 확인해보세요.',
            alternates: {
                canonical: 'https://coupong.online/promos',
            }
        };
    }

    try {
        const promo = await PromoService.getPromoById(id);
        if (promo) {
            const titleStr = `${promo.title} | 쿠퐁온라인 홍보게시판`;
            const descStr = `${promo.content ? promo.content.substring(0, 150) : '호치민 엄선 제휴점의 스페셜 혜택 안내'}`;
            const pageUrl = `https://coupong.online/promos?id=${id}`;
            const ogImage = promo.thumbnail || 'https://coupong.online/index512.png';

            return {
                title: titleStr,
                description: descStr,
                alternates: {
                    canonical: pageUrl,
                },
                openGraph: {
                    type: 'article',
                    url: pageUrl,
                    title: titleStr,
                    description: descStr,
                    images: [
                        {
                            url: ogImage,
                            width: 800,
                            height: 800,
                            alt: promo.title,
                        }
                    ],
                    siteName: '쿠퐁온라인 (COUPONG ONLINE)',
                },
                twitter: {
                    card: 'summary_large_image',
                    title: titleStr,
                    description: descStr,
                    images: [ogImage],
                }
            };
        }
    } catch (e) {
        console.error("Failed to generate metadata for promo ID:", id, e);
    }

    return {
        title: '쿠퐁온라인 홍보관',
        description: '베트남 호치민 현지 프로모션 소식'
    };
}

// 2. Main Page SSR Wrapper
export default async function PromosPage({ searchParams }) {
    const params = await searchParams;
    const id = params.id;

    let initialPromo = null;
    if (id) {
        try {
            initialPromo = await PromoService.getPromoById(id);
        } catch (e) {
            console.error("Failed to load initial promo post for page render:", e);
        }
    }

    return (
        <Suspense fallback={<div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>}>
            <PromosClient initialSelectedPromo={initialPromo} />
        </Suspense>
    );
}
