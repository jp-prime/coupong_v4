"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    Plus,
    X,
    Camera,
    Image as ImageIcon,
    Send,
    User,
    CheckCircle2,
    Clock,
    Search,
    ChevronLeft,
    Trash2,
    BarChart3,
    Settings,
    MoreVertical,
    Edit2,
    MessageSquare,
    AlertCircle,
    Newspaper,
    Megaphone,
    LayoutGrid,
    Store as StoreIcon,
    UserPlus,
    ShoppingBag
} from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { QnaService } from '@/services/QnaService';
import { StoreService } from '@/services/StoreService';
import { SanityService } from '@/services/SanityService';
import { useTranslation } from 'react-i18next';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';
import HeaderV2 from '@/components/style2/HeaderV2';
import RenderWithShortcodes from '@/components/promo/RenderWithShortcodes';

export default function BoardClient({ initialSelectedPost }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const { user, isAdmin, isStoreOwner } = useAuth();
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const bodyFont = 'var(--font-base)';
    const titleFont = 'var(--font-dream)';
    const { fixImageUrl } = useStoreHelpers();

    // State
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(initialSelectedPost || null);
    const [isDetailLoading, setIsDetailLoading] = useState(false); // 상세 내용 백그라운드 로드 감지
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Form State (Admin Only)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        isPrivate: false,
        displayOrder: 100, // Default to 100
        titleColor: '#1e293b',
        titleWeight: '850',
        contentColor: '#334155',
        contentWeight: '400'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editPostId, setEditPostId] = useState(null);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadFiles, setUploadFiles] = useState([]);

    // Comments/Answers State
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [globalStats, setGlobalStats] = useState({ totalVisits: 0 });

    useEffect(() => {
        fetchPosts();
        let unsubscribe;
        const initStats = async () => {
            unsubscribe = await fetchGlobalStats();
        };
        initStats();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const matchesCategory = (post, category) => {
        if (category === 'all') return true;
        const normalize = (value) => (value || '').replace(/\s/g, '');
        return normalize(post.category) === normalize(category);
    };

    // Sync selected post with query param if changes
    const queryId = searchParams.get('id');
    const querySlug = searchParams.get('slug');
    useEffect(() => {
        if (loading || posts.length === 0) return;

        if (querySlug) {
            const decoded = (() => { try { return decodeURIComponent(querySlug); } catch { return querySlug; } })();
            const found = posts.find(p => p.slug === decoded || p.slug === querySlug);
            if (found && selectedPost?.slug !== found.slug) {
                handlePostClick(found);
            }
            return;
        }

        if (queryId) {
            const found = posts.find(p => p.id === queryId);
            if (found && (!selectedPost || selectedPost.id !== queryId)) {
                handlePostClick(found);
            }
        }
    }, [queryId, querySlug, posts, loading]);

    const fetchGlobalStats = async () => {
        try {
            // 1. Increment global visit count (once per session)
            const sessionKey = 'visited_global';
            if (typeof window !== "undefined" && !sessionStorage.getItem(sessionKey)) {
                await StoreService.incrementPageVisit('global_stats');
                sessionStorage.setItem(sessionKey, 'true');
            }

            // 2. Subscribe to real-time updates for Global Count
            const stats = await StoreService.getGlobalStats('global_stats');
            setGlobalStats(stats);

            // 실시간 업데이트 구독 (전체 사이트 기준)
            const unsubscribe = StoreService.subscribePageStats('global_stats', (data) => {
                setGlobalStats(prev => ({ ...prev, totalVisits: data.totalVisits || 0 }));
            });

            return unsubscribe;
        } catch (error) {
            console.error("Failed to fetch global statistics:", error);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const firebasePosts = await QnaService.getPosts().catch(() => []);
            const [sanityPosts, boardStorePosts] = await Promise.all([
                SanityService.getBoardPosts().catch(() => []),
                SanityService.getBoardStorePosts().catch(() => []),
            ]);

            // Sanity boardPost → 게시판 글
            const mappedSanity = sanityPosts.map(p => ({
                id: p._id,
                title: p.title,
                content: p.summary || '',
                images: p.thumbnailUrl ? [p.thumbnailUrl] : [],
                createdAt: p.publishedAt || new Date().toISOString(),
                authorName: "운영자",
                viewCount: 0,
                slug: p.slug,
                category: p.category,
                isPinned: p.isPinned || false,
                isSanityPost: true,
            }));

            // Sanity store (publishToBoard) → 가맹점 정보 탭 게시글 (슬러그 기반)
            const mappedBoardStores = boardStorePosts.map(p => ({
                id: p._id,
                title: p.title,
                content: p.summary || '',
                images: p.thumbnailUrl ? [p.thumbnailUrl] : [],
                createdAt: p.publishedAt || new Date().toISOString(),
                authorName: "운영자",
                viewCount: 0,
                slug: p.slug,
                category: '가맹점 정보',
                storeCategory: p.storeCategory,
                isPinned: false,
                isSanityPost: true,
                isBoardStorePost: true,
            }));

            const seenSlugs = new Set(mappedBoardStores.map(p => p.slug).filter(Boolean));
            const dedupedSanity = mappedSanity.filter(p => !p.slug || !seenSlugs.has(p.slug));

            const merged = [...dedupedSanity, ...mappedBoardStores, ...firebasePosts].sort((a, b) => {
                // Pinned posts first
                const pinA = a.isPinned ? 1 : 0;
                const pinB = b.isPinned ? 1 : 0;
                if (pinA !== pinB) return pinB - pinA;
                
                const parseTime = (dateVal) => {
                    if (!dateVal) return 0;
                    if (typeof dateVal === 'object' && dateVal.toDate) return dateVal.toDate().getTime();
                    return new Date(dateVal).getTime() || 0;
                };
                const timeA = parseTime(a.createdAt);
                const timeB = parseTime(b.createdAt);
                return timeB - timeA;
            });

            setPosts(merged);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostClick = async (post) => {
        // 1. 주소창 URL 즉시 교체
        if (post.slug) {
            router.replace(`/board?slug=${encodeURIComponent(post.slug)}`, { scroll: false });
        } else {
            router.replace(`/board?id=${post.id}`, { scroll: false });
        }

        // 2. 일단 상세 모달창을 즉시 띄우기 위해 리스트의 기본 정보로 상태 설정
        setSelectedPost(post);
        setIsDetailLoading(true);

        // 3. 백그라운드 상세 정보 로드
        if (post.isBoardStorePost && post.slug) {
            try {
                const store = await SanityService.getStoreByIdOrSlug(post.slug);
                if (store) {
                    setSelectedPost({
                        id: store.sanityId || store.id,
                        title: store.name?.ko || store.name || post.title,
                        content: store.description?.ko || store.storeDescription?.ko || '',
                        images: store.images?.length ? store.images : (post.images || []),
                        createdAt: post.createdAt,
                        authorName: "운영자",
                        viewCount: post.viewCount || 0,
                        isSanityPost: true,
                        isBoardStorePost: true,
                        category: '가맹점 정보',
                        slug: store.slug || post.slug,
                        storeCategory: store.category,
                    });
                }
            } catch (error) {
                console.error("Failed to load board store post detail:", error);
            } finally {
                setIsDetailLoading(false);
            }
            return;
        }

        if (post.slug && post.isSanityPost) {
            try {
                const fullPost = await SanityService.getBoardPostBySlug(post.slug);
                if (fullPost) {
                    setSelectedPost({
                        id: fullPost._id,
                        title: fullPost.title,
                        content: fullPost.content || fullPost.summary || '',
                        images: fullPost.bannerImageUrl ? [fullPost.bannerImageUrl] : (fullPost.thumbnailUrl ? [fullPost.thumbnailUrl] : []),
                        createdAt: fullPost.publishedAt || new Date().toISOString(),
                        authorName: "운영자",
                        viewCount: post.viewCount || 0,
                        isSanityPost: true,
                        category: fullPost.category,
                        slug: fullPost.slug,
                        ...fullPost
                    });
                }
            } catch (error) {
                console.error("Failed to load sanity post detail:", error);
            } finally {
                setIsDetailLoading(false);
            }
            return;
        }

        // Firebase 포스트인 경우 별도 외부 백엔드 fetch가 필요 없으므로 즉시 완료 처리
        setIsDetailLoading(false);
    };

    const fetchComments = async (postId) => {
        try {
            const data = await QnaService.getComments(postId);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch answers:", error);
        }
    };

    useEffect(() => {
        if (selectedPost) {
            fetchComments(selectedPost.id);
            if (!selectedPost.isSanityPost) {
                QnaService.incrementPostView(selectedPost.id);
            }
        }
    }, [selectedPost]);

    const handlePaste = (e) => {
        if (!isAdmin) return; // Only admin can post news
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (uploadFiles.length + 1 > 5) {
                    alert("이미지는 최대 5장까지 등록 가능합니다.");
                    return;
                }
                const preview = URL.createObjectURL(file);
                setImagePreviews(prev => [...prev, preview]);
                setUploadFiles(prev => [...prev, file]);
            }
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (uploadFiles.length + files.length > 5) {
            alert("이미지는 최대 5장까지 등록 가능합니다.");
            return;
        }
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...newPreviews]);
        setUploadFiles([...uploadFiles, ...files]);
    };

    const removeImage = (index) => {
        const itemToRemove = imagePreviews[index];
        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);

        if (typeof itemToRemove === 'string' && itemToRemove.startsWith('blob:')) {
            const blobIndex = imagePreviews.slice(0, index).filter(url =>
                typeof url === 'string' && url.startsWith('blob:')
            ).length;

            const newFiles = [...uploadFiles];
            newFiles.splice(blobIndex, 1);
            setUploadFiles(newFiles);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) { alert("관리자만 작성할 수 있습니다."); return; }
        if (!formData.title || !formData.content) { alert("제목과 내용을 입력해주세요."); return; }

        setIsSubmitting(true);
        try {
            const postData = {
                ...formData,
                displayOrder: Number(formData.displayOrder) || 100,
                authorId: user.uid,
                authorName: "운영자",
                authorPhoto: user.photoURL || null,
            };

            if (isEditing) {
                await QnaService.updatePost(editPostId, postData, uploadFiles, imagePreviews);
                alert("뉴스 수정 완료");
            } else {
                await QnaService.createPost(postData, uploadFiles);
                alert("뉴스가 등록되었습니다.");
            }

            setIsFormOpen(false);
            resetForm();
            fetchPosts();
        } catch (error) {
            alert("처리 실패");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            isPrivate: false,
            displayOrder: 100,
            titleColor: '#1e293b',
            titleWeight: '850',
            contentColor: '#334155',
            contentWeight: '400'
        });
        setIsEditing(false);
        setEditPostId(null);
        setImagePreviews([]);
        setUploadFiles([]);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            const commentData = {
                postId: selectedPost.id,
                uid: user.uid,
                userName: isAdmin ? "운영자" : (user.displayName || user.email.split('@')[0]),
                userPhoto: user.photoURL || null,
                text: newComment,
                isAdminReply: isAdmin || isStoreOwner
            };
            await QnaService.addComment(commentData);
            setNewComment('');
            fetchComments(selectedPost.id);
        } catch (error) {
            alert("댓글 등록 실패");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            await QnaService.deleteComment(commentId, selectedPost.id);
            fetchComments(selectedPost.id);
        } catch (error) {
            alert("댓글 삭제 실패");
        }
    };

    const handleDeletePost = async (post) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await QnaService.deletePost(post.id, post.images);
            alert("삭제되었습니다.");
            setSelectedPost(null);
            router.replace('/board', { scroll: false });
            fetchPosts();
        } catch (error) {
            alert("삭제 실패");
        }
    };

    const handleEditStart = (post) => {
        setFormData({
            title: post.title,
            content: post.content,
            isPrivate: post.isPrivate || false,
            displayOrder: post.displayOrder || 100,
            titleColor: post.titleColor || '#1e293b',
            titleWeight: post.titleWeight || '850',
            contentColor: post.contentColor || '#334155',
            contentWeight: post.contentWeight || '400'
        });
        setImagePreviews(post.images || []);
        setIsEditing(true);
        setEditPostId(post.id);
        setIsFormOpen(true);
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '100px', color: '#1e293b', fontFamily: bodyFont }}>
            <HeaderV2 />

            <div style={{
                background: '#ffffff',
                padding: '20px 20px 32px',
                textAlign: 'left',
                borderBottom: '1px solid #f1f5f9'
            }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px'
                    }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px', background: '#6366f110',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Megaphone size={18} color="#6366f1" />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6366f1', letterSpacing: '0.5px' }}>COMMUNITY & NEWS</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{
                                fontSize: '1.8rem',
                                fontWeight: 950,
                                color: '#0f172a',
                                margin: '0 0 8px',
                                letterSpacing: '-1.2px',
                                fontFamily: titleFont
                            }}>
                                커뮤니티 <span style={{ color: '#6366f1' }}>Community</span>
                            </h1>
                            <p style={{
                                fontSize: '0.9rem',
                                color: '#64748b',
                                margin: '0',
                                fontWeight: 600,
                                fontFamily: bodyFont
                            }}>
                                {'비나통의 새로운 소식과 소통의 공간입니다.'}
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                             {isAdmin && (
                                 <button 
                                    onClick={() => setIsFormOpen(true)}
                                    style={{ 
                                        padding: '10px 20px', borderRadius: '12px', background: '#0f172a',
                                        color: 'white', border: 'none', fontWeight: 800, fontSize: '0.85rem',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                 >
                                    <Plus size={18} /> 글등록
                                 </button>
                             )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '12px 20px',
                overflowX: 'auto',
                background: '#ffffff',
                borderBottom: '1px solid #f1f5f9',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
            }} className="no-scrollbar">
                {[
                    { id: 'all', name: '전체' },
                    { id: '공지사항', name: '공지사항' },
                    { id: '이벤트', name: '이벤트' },
                    { id: '뉴스', name: '뉴스' },
                    { id: '일반', name: '일반' },
                    { id: '가맹점 정보', name: '가맹점 정보' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedCategory(tab.id)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '12px',
                            background: selectedCategory === tab.id ? '#0f172a' : '#f8fafc',
                            color: selectedCategory === tab.id ? '#ffffff' : '#64748b',
                            border: '1px solid ' + (selectedCategory === tab.id ? '#0f172a' : '#e2e8f0'),
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            <div style={{ padding: '20px' }}>
                <div style={{ minHeight: '300px' }}>
                    <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                        <h2>비나통 공지사항 및 최신 뉴스 목록</h2>
                        <p>베트남 호치민, 푸미흥 지역의 다양한 업체 소식과 이벤트, 서비스 업데이트 정보를 확인하세요.</p>
                    </div>

                    {loading ? (
                        <div style={{ padding: '20px 0' }}>
                            <div style={{ textAlign: 'center', color: '#94a3b8', background: '#ffffff', borderRadius: '24px', padding: '60px 20px', border: '1px dashed #e2e8f0' }}>
                                <Clock size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} className="animate-pulse" />
                                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{'최신 소식을 불러오는 중...'}</p>
                                <div style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.6 }}>잠시만 기다려 주시면 게시글이 나타납니다.</div>
                            </div>
                        </div>
                    ) : posts.filter(post => matchesCategory(post, selectedCategory)).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {posts
                                .filter(post => matchesCategory(post, selectedCategory))
                                .map(post => (
                                <motion.div
                                    key={post.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePostClick(post)}
                                    style={{
                                        background: '#ffffff', borderRadius: '20px', padding: '16px',
                                        border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', gap: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                    }}
                                >
                                    {post.images && post.images[0] && (
                                        <div style={{ width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={fixImageUrl(post.images[0])} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <div style={{
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800,
                                                background: post.isBoardStorePost ? 'rgba(16,185,129,0.1)' : (post.category === '이벤트' ? 'rgba(239, 68, 68, 0.1)' : '#6366f115'),
                                                color: post.isBoardStorePost ? '#10b981' : (post.category === '이벤트' ? '#ef4444' : '#6366f1'),
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                {post.isBoardStorePost ? <StoreIcon size={12} /> : <Megaphone size={12} />}
                                                {post.isBoardStorePost ? (post.storeCategory || '가맹점 정보') : (post.category || '공지')}
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                {post.authorName} • {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금')}
                                            </span>
                                            <div style={{
                                                marginLeft: 'auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.8rem',
                                                color: '#1e293b',
                                                background: '#f1f5f9',
                                                padding: '4px 10px',
                                                borderRadius: '10px',
                                                fontWeight: 900
                                            }}>
                                                <BarChart3 size={14} color="#6366f1" />
                                                <span>{post.viewCount || 0}</span>
                                            </div>
                                        </div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: isKorean ? 800 : 800, color: '#1e293b', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-all', fontFamily: titleFont }}>{post.title}</h3>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-all', fontWeight: isKorean ? 600 : 400 }}>
                                            {post.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                            <Megaphone size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                            <p>{'해당 카테고리에 등록된 뉴스가 없습니다.'}</p>
                        </div>
                    )}
                </div>
            </div>

            {isAdmin && (
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFormOpen(true)}
                    style={{
                        position: 'fixed', right: '24px', bottom: '100px', width: '60px', height: '60px', borderRadius: '30px',
                        background: '#0f172a', color: 'white', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 1000
                    }}
                >
                    <Plus size={32} />
                </motion.button>
            )}

            <AnimatePresence>
                {isFormOpen && isAdmin && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', zIndex: 4000 }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ width: '100%', background: '#ffffff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: isKorean ? 800 : 800, color: '#1e293b' }}>{'뉴스 등록'}</h2>
                                <button onClick={() => { setIsFormOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', color: '#94a3b8' }}><X size={24} /></button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>제목</label>
                                            <input type="text" placeholder="공지 제목" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', caretColor: '#1e293b', outline: 'none', fontWeight: 700 }} />
                                        </div>
                                        <div style={{ width: '80px' }}>
                                            <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>순번</label>
                                            <input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', caretColor: '#1e293b', outline: 'none', fontWeight: 700, textAlign: 'center' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>내용</label>
                                        <textarea
                                            placeholder="공지 내용을 입력해주세요.&#10;이미지 붙여넣기(Ctrl+V) 가능"
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            onPaste={handlePaste}
                                            style={{
                                                width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0',
                                                background: '#f8fafc', color: formData.contentColor, caretColor: '#1e293b',
                                                outline: 'none', minHeight: '200px', resize: 'none',
                                                fontWeight: formData.contentWeight,
                                                lineHeight: '1.6'
                                            }}
                                        />
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', minWidth: '60px' }}>제목 스타일</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {['#1e293b', '#ef4444', '#3b82f6', '#10b981', '#a855f7'].map(color => (
                                                    <button key={color} type="button" onClick={() => setFormData({ ...formData, titleColor: color })} style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, border: formData.titleColor === color ? '2px solid #fff' : 'none', boxShadow: formData.titleColor === color ? '0 0 0 2px #1e293b' : 'none' }} />
                                                ))}
                                            </div>
                                            <select value={formData.titleWeight} onChange={(e) => setFormData({ ...formData, titleWeight: e.target.value })} style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700 }}>
                                                <option value="400">Normal</option>
                                                <option value="600">Medium</option>
                                                <option value="700">Bold</option>
                                                <option value="850">Extra Bold</option>
                                                <option value="900">Black</option>
                                            </select>
                                        </div>
                                        <div style={{ height: '1px', background: '#e2e8f0' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', minWidth: '60px' }}>본문 스타일</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {['#334155', '#ef4444', '#3b82f6', '#10b981', '#a855f7'].map(color => (
                                                    <button key={color} type="button" onClick={() => setFormData({ ...formData, contentColor: color })} style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, border: formData.contentColor === color ? '2px solid #fff' : 'none', boxShadow: formData.contentColor === color ? '0 0 0 2px #1e293b' : 'none' }} />
                                                ))}
                                            </div>
                                            <select value={formData.contentWeight} onChange={(e) => setFormData({ ...formData, contentWeight: e.target.value })} style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700 }}>
                                                <option value="300">Light</option>
                                                <option value="400">Normal</option>
                                                <option value="600">Medium</option>
                                                <option value="700">Bold</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <label style={{ width: '70px', height: '70px', borderRadius: '14px', border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', background: '#f8fafc' }}>
                                            <Camera size={20} />
                                            <span style={{ fontSize: '0.65rem', marginTop: '4px' }}>{uploadFiles.length}/5</span>
                                            <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                                        </label>
                                        {imagePreviews.map((preview, idx) => (
                                            <div key={idx} style={{ position: 'relative' }}>
                                                <img src={preview} alt="" style={{ width: '70px', height: '70px', borderRadius: '14px', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>

                                    <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '18px', borderRadius: '20px', background: '#0f172a', color: 'white', border: 'none', fontSize: '1rem', fontWeight: isKorean ? 800 : 800, opacity: isSubmitting ? 0.7 : 1, fontFamily: bodyFont }}>
                                        {isSubmitting ? '처리 중...' : isEditing ? '수정 완료' : '공지하기'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {selectedPost && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                                background: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                boxShadow: '0 0 40px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                <button onClick={() => { setSelectedPost(null); router.replace('/board', { scroll: false }); }} style={{ background: 'none', border: 'none', color: '#1e293b' }}><ChevronLeft size={24} /></button>
                                <span style={{ flex: 1, textAlign: 'center', fontWeight: isKorean ? 800 : 800, color: '#1e293b' }}>{'뉴스 상세'}</span>
                                {isAdmin && !selectedPost?.isSanityPost && (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => handleEditStart(selectedPost)} style={{ background: 'none', border: 'none', color: '#6366f1' }}><Edit2 size={20} /></button>
                                        <button onClick={() => handleDeletePost(selectedPost)} style={{ background: 'none', border: 'none', color: '#ef4444' }}><Trash2 size={20} /></button>
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                {selectedPost.images && selectedPost.images.length > 0 && (
                                    <div style={{ width: '100%', height: '500px', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px' }}>
                                        <img 
                                            src={fixImageUrl(selectedPost.images[0])} 
                                            alt="" 
                                            referrerPolicy="no-referrer" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: isKorean ? 800 : 800, background: '#6366f115', color: '#6366f1' }}>{selectedPost?.category || '공지사항'}</div>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selectedPost.createdAt?.toDate ? selectedPost.createdAt.toDate().toLocaleString() : (selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleString() : '방금')}</span>
                                    <div style={{
                                        marginLeft: 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.9rem',
                                        color: '#1e293b',
                                        background: '#f1f5f9',
                                        padding: '6px 14px',
                                        borderRadius: '12px',
                                        fontWeight: 900
                                    }}>
                                            <BarChart3 size={16} color="#6366f1" />
                                        <span>{selectedPost.viewCount || 0}</span>
                                    </div>
                                </div>

                                <h2 style={{ fontSize: selectedPost.isBoardStorePost ? '1.55rem' : '1.25rem', fontWeight: selectedPost.titleWeight || (isKorean ? 850 : 800), marginBottom: '20px', color: selectedPost.titleColor || '#1e293b', lineHeight: 1.4, fontFamily: titleFont, textAlign: selectedPost.isBoardStorePost ? 'center' : 'left' }}>{selectedPost.title}</h2>
                                {selectedPost.isBoardStorePost && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                        <button 
                                            onClick={() => {
                                                router.push(`/store/${selectedPost.slug || selectedPost.id}`);
                                            }}
                                            style={{
                                                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 24px',
                                                borderRadius: '100px',
                                                fontSize: '0.95rem',
                                                fontWeight: 950,
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.25)',
                                                transition: 'transform 0.2s'
                                            }}
                                        >
                                            쿠폰홈페이지에서 보기
                                        </button>
                                    </div>
                                )}
                                <div style={{
                                    marginBottom: '32px',
                                    fontFamily: bodyFont
                                }}>
                                    {isDetailLoading ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
                                            <div style={{ width: 28, height: 28, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>내용을 불러오는 중...</span>
                                            <style>{`
                                                @keyframes spin {
                                                    to { transform: rotate(360deg); }
                                                }
                                            `}</style>
                                        </div>
                                    ) : (
                                        <RenderWithShortcodes 
                                            text={selectedPost.content}
                                            navigate={(path) => router.push(path)}
                                            postImgs={selectedPost.images || []}
                                        />
                                    )}
                                </div>

                                {selectedPost.images && selectedPost.images.length > 0 && selectedPost.category !== '가맹점 정보' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                                        {selectedPost.images.map((img, idx) => {
                                            const isBanner = selectedPost.bannerImageUrl === img;
                                            const imgElement = (
                                                <img 
                                                    src={fixImageUrl(img)} 
                                                    alt="" 
                                                    referrerPolicy="no-referrer" 
                                                    style={{ width: '100%', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', cursor: isBanner && selectedPost.bannerLink ? 'pointer' : 'default' }} 
                                                />
                                            );
                                            
                                            if (isBanner && selectedPost.bannerLink) {
                                                return (
                                                    <a key={idx} href={selectedPost.bannerLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%' }}>
                                                        {imgElement}
                                                    </a>
                                                );
                                            }
                                            return <React.Fragment key={idx}>{imgElement}</React.Fragment>;
                                        })}
                                    </div>
                                )}

                                {selectedPost.isBoardStorePost && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', marginTop: '24px' }}>
                                        <button 
                                            onClick={() => {
                                                router.push(`/store/${selectedPost.slug || selectedPost.id}`);
                                            }}
                                            style={{
                                                background: '#0f172a',
                                                color: 'white',
                                                border: 'none',
                                                padding: '14px 28px',
                                                borderRadius: '100px',
                                                fontSize: '0.95rem',
                                                fontWeight: 950,
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.15)',
                                                transition: 'transform 0.2s',
                                                width: '100%',
                                                maxWidth: '320px',
                                                textAlign: 'center'
                                            }}
                                        >
                                            쿠폰홈페이지에서 보기
                                        </button>
                                    </div>
                                )}

                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px', paddingBottom: '100px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: isKorean ? 850 : 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MessageSquare size={18} /> {'댓글'} {comments.length}
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {comments.map(comment => (
                                            <div key={comment.id}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontWeight: isKorean ? 800 : 800, fontSize: '0.85rem', color: '#1e293b' }}>
                                                            {comment.userName} {comment.isAdminReply && <span style={{ color: '#6366f1', marginLeft: '2px' }}>{'[운영자]'}</span>}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : '방금'}</span>
                                                    </div>
                                                    {(isAdmin || (user && user.uid === comment.uid)) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '4px', display: 'flex' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, fontWeight: isKorean ? 600 : 400 }}>{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {user && (
                                <div style={{ position: 'sticky', bottom: 0, padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder={'댓글을 남겨주세요'}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        style={{ flex: 1, padding: '14px 20px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', caretColor: '#1e293b', outline: 'none', fontFamily: bodyFont }}
                                    />
                                    <button onClick={handleAddComment} style={{ width: '48px', height: '48px', borderRadius: '24px', border: 'none', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={18} /></button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
