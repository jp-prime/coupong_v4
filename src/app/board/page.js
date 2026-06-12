import { Suspense } from 'react';
import BoardClient from './BoardClient';
import { QnaService } from '@/services/QnaService';
import { SanityService } from '@/services/SanityService';

// 1. Dynamic Server Metadata Generation (SEO)
export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const id = params.id;
    const slug = params.slug;

    if (!id && !slug) {
        return {
            title: '비나통 커뮤니티 | 베트남 호치민 라이프 소식',
            description: '베트남 호치민, 푸미흥 지역의 실시간 자유게시판 및 커뮤니티 공간입니다. 맛집 후기 및 일상 이야기를 함께 나눠보세요.',
            alternates: {
                canonical: 'https://coupong.online/board',
            }
        };
    }

    if (slug) {
        try {
            const boardPost = await SanityService.getBoardPostBySlug(slug);
            const store = boardPost ? null : await SanityService.getStoreByIdOrSlug(slug);
            const title = boardPost?.title || store?.name?.ko || store?.name;
            const description = boardPost?.summary || store?.slogan?.ko || store?.description?.ko || '';
            const ogImage = boardPost?.thumbnailUrl || store?.image || 'https://coupong.online/index512.png';
            const pageUrl = `https://coupong.online/board?slug=${encodeURIComponent(slug)}`;

            if (title) {
                const titleStr = `${title} | 비나통 커뮤니티`;
                const descStr = description ? String(description).substring(0, 150) : '비나통 커뮤니티 최신 게시글 내용';
                return {
                    title: titleStr,
                    description: descStr,
                    alternates: { canonical: pageUrl },
                    openGraph: {
                        type: 'article',
                        url: pageUrl,
                        title: titleStr,
                        description: descStr,
                        images: [{ url: ogImage, width: 800, height: 800, alt: title }],
                        siteName: '비나통 (VinaTong)',
                    },
                };
            }
        } catch (e) {
            console.error("Failed to generate metadata for slug:", slug, e);
        }
    }

    try {
        const post = await QnaService.getPostById(id);
        if (post) {
            const titleStr = `${post.title} | 비나통 커뮤니티`;
            const descStr = `${post.content ? post.content.substring(0, 150) : '비나통 커뮤니티 최신 게시글 내용'}`;
            const pageUrl = `https://coupong.online/board?id=${id}`;
            const ogImage = post.images && post.images[0] ? post.images[0] : 'https://coupong.online/index512.png';

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
                            alt: post.title,
                        }
                    ],
                    siteName: '비나통 (VinaTong)',
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
        console.error("Failed to generate metadata for post ID:", id, e);
    }

    return {
        title: '비나통 커뮤니티',
        description: '베트남 호치민, 푸미흥 자유게시판'
    };
}

// 2. Main Page SSR Wrapper
export default async function BoardPage({ searchParams }) {
    const params = await searchParams;
    const id = params.id;
    const slug = params.slug;

    let initialPost = null;
    if (slug) {
        try {
            const boardPost = await SanityService.getBoardPostBySlug(slug);
            if (boardPost) {
                initialPost = {
                    id: boardPost._id,
                    title: boardPost.title,
                    content: boardPost.content || boardPost.summary || '',
                    images: boardPost.bannerImageUrl ? [boardPost.bannerImageUrl] : (boardPost.thumbnailUrl ? [boardPost.thumbnailUrl] : []),
                    createdAt: boardPost.publishedAt ? new Date(boardPost.publishedAt).toISOString() : new Date().toISOString(),
                    authorName: '운영자',
                    viewCount: 0,
                    isSanityPost: true,
                    category: boardPost.category,
                    slug: boardPost.slug,
                    ...boardPost,
                };
            } else {
                const store = await SanityService.getStoreByIdOrSlug(slug);
                if (store) {
                    initialPost = {
                        id: store.sanityId || store.id,
                        title: store.name?.ko || store.name,
                        content: store.description?.ko || store.storeDescription?.ko || '',
                        images: store.images || [],
                        createdAt: new Date().toISOString(),
                        authorName: '운영자',
                        viewCount: 0,
                        isSanityPost: true,
                        isBoardStorePost: true,
                        category: '가맹점 정보',
                        slug: store.slug || slug,
                        storeCategory: store.category,
                    };
                }
            }
        } catch (e) {
            console.error("Failed to load initial post by slug:", e);
        }
    } else if (id) {
        try {
            initialPost = await QnaService.getPostById(id);
        } catch (e) {
            console.error("Failed to load initial post for page render:", e);
        }
    }

    return (
        <Suspense fallback={<div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>}>
            <BoardClient initialSelectedPost={initialPost} />
        </Suspense>
    );
}
