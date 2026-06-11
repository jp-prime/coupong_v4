'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronUp, MapPin, Ticket, Phone, Clock, Map, Heart, Loader2, Store, Share2, Edit2, X, Play } from 'lucide-react';
import { StoreService } from '../../../services/StoreService';
import { CouponService } from '../../../services/CouponService';
import { SanityService } from '../../../services/SanityService';
import { LikeService } from '../../../services/LikeService';
import { useTranslation } from 'react-i18next';
import HeaderV2 from '../../../components/style2/HeaderV2';
import CompactStoreCard from '../../../components/style2/CompactStoreCard';
import { useStoreHelpers } from '../../../hooks/useStoreHelpers';
import Footer from '../../../components/layout/Footer';
import UseCouponModal from '../../../components/coupon/UseCouponModal';
import GiftModal from '../../../components/coupon/GiftModal';
import ReviewSection from '../../../components/store/ReviewSection';
import RenderWithShortcodes from '../../../components/promo/RenderWithShortcodes';
import { useAuth } from '../../../context/AuthContext';
import { useCouponShare } from '../../../hooks/useCouponShare';
import { playTickSound } from '../../../utils/sound';

function GalleryTagCycler({ tags }) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
    const colors = ['#ffffff', '#22c55e', '#ffeb3b']; // 흰색, 밝은 녹색, 밝은 노랑색
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', pointerEvents: 'none' }}>
            {tags.map((text, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 100, scale: 0.8, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -50, filter: 'blur(10px)', transition: { duration: 0.5 } }}
                    transition={{ delay: i * 0.8, duration: 0.8, type: "spring", stiffness: 100 }}
                    style={{
                        color: colors[i % colors.length], fontSize: '21px', fontWeight: '950', fontFamily: "var(--font-dream)",
                        letterSpacing: 'normal', lineHeight: '0.8', padding: '4px 0', textAlign: 'right',
                        textShadow: `-3px -3px 0 #000, 0px -3px 0 #000, 3px -3px 0 #000, -3px 0px 0 #000, 3px 0px 0 #000, -3px 3px 0 #000, 0px 3px 0 #000, 3px 3px 0 #000, 0 10px 25px rgba(0,0,0,0.8)`,
                        filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))'
                    }}
                >
                    {text}
                </motion.div>
            ))}
        </div>
    );
}

export default function StoreDetailClient({ id, initialStoreData }) {
    const router = useRouter();
    const { isAdmin, user } = useAuth();
    const { i18n } = useTranslation();
    const { fixImageUrl, getLocalizedString, getTranslatedCategory } = useStoreHelpers();

    // WordPress Integration states
    const [wpContent, setWpContent] = useState('');
    const [wpLoading, setWpLoading] = useState(false);
    const [wpError, setWpError] = useState(null);

    const fetchWordPressContent = useCallback(async (url) => {
        if (!url) return;
        setWpLoading(true);
        setWpError(null);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000); // 7초 타임아웃 설정
        
        try {
            let cleanUrl = url.trim();
            if (cleanUrl.endsWith('/')) {
                cleanUrl = cleanUrl.slice(0, -1);
            }
            
            const urlParts = cleanUrl.split('/');
            let slug = urlParts[urlParts.length - 1];
            
            try {
                slug = decodeURIComponent(slug);
            } catch (e) {}
            
            const encodedSlug = encodeURIComponent(slug);
            
            let domain = 'https://vn.coupong.online';
            try {
                const urlObj = new URL(cleanUrl);
                domain = urlObj.origin;
            } catch (e) {
                if (cleanUrl.startsWith('http')) {
                    const match = cleanUrl.match(/^https?:\/\/[^\/]+/);
                    if (match) domain = match[0];
                }
            }

            const apiEndpoint = `${domain}/wp-json/wp/v2/posts?slug=${encodedSlug}`;
            const response = await fetch(apiEndpoint, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`WordPress API HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            if (posts && posts.length > 0) {
                setWpContent(posts[0].content?.rendered || '');
            } else {
                throw new Error('워드프레스에서 글을 찾을 수 없습니다.');
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('Failed to fetch WordPress content:', err);
            if (err.name === 'AbortError') {
                setWpError('워드프레스 서버 응답 시간이 초과되었습니다.');
            } else {
                setWpError(err.message);
            }
        } finally {
            setWpLoading(false);
        }
    }, []);

    const formatPrice = (priceStr) => {
        if (!priceStr) return '';
        const cleanStr = String(priceStr).replace(/,/g, '').trim();
        return cleanStr.replace(/\d+/g, (match) => Number(match).toLocaleString());
    };

    const [store, setStore] = useState(initialStoreData || null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
    const [galleryBatchIndex, setGalleryBatchIndex] = useState(0);
    const [isUseModalOpen, setIsUseModalOpen] = useState(false);
    const [useCouponDataForUse, setUseCouponDataForUse] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);

    const { 
        isGiftModalOpen, setIsGiftModalOpen, 
        useCouponData: giftCouponData, selectedStore: giftSelectedStore, 
        isSharing, handleOpenGiftModal 
    } = useCouponShare();

    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showFloatingCoupon, setShowFloatingCoupon] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowFloatingCoupon(true);
        }, 2500);
        return () => clearTimeout(timer);
    }, [id]);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getButtonRight = () => {
        let containerWidth = windowWidth;
        if (windowWidth >= 480 && windowWidth < 800) {
            containerWidth = 480;
        } else if (windowWidth >= 800) {
            containerWidth = 800;
        }
        
        if (windowWidth > containerWidth) {
            return `${((windowWidth - containerWidth) / 2) + 20}px`;
        }
        return '20px';
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setSelectedImage(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleLike = async () => {
        if (!store) return;
        // 비로그인 → 로그인 페이지로 유도
        if (!user) {
            router.push('/login');
            return;
        }
        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setLikeCount(prev => newStatus ? prev + 1 : prev - 1);
        try {
            await LikeService.toggleLike(user.uid, store.id, typeof store.name === 'object' ? store.name?.ko || store.name?.vi || '' : store.name || '');
            await StoreService.toggleStoreLike(store.id, newStatus);
        } catch (error) {
            // 실패 시 롤백
            setIsLiked(!newStatus);
            setLikeCount(prev => !newStatus ? prev + 1 : prev - 1);
            console.error("Like toggle failed:", error);
        }
    };

    const handleShare = () => {
        if (typeof window !== "undefined" && navigator.share) {
            navigator.share({
                title: getLocalizedString(store.name),
                text: getLocalizedString(store.slogan),
                url: window.location.href,
            }).catch(console.error);
        } else if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            alert("링크가 복사되었습니다!");
        }
    };

    const fetchStoreData = useCallback(async () => {
        setLoading(store ? false : true);
        try {
            let data = initialStoreData;
            if (!data) {
                data = await SanityService.getStoreByIdOrSlug(id);
                if (!data) {
                    const isFirestoreId = /^[a-zA-Z0-9]{20}$/.test(id);
                    if (isFirestoreId) {
                        data = await StoreService.getStoreById(id);
                    }
                    if (!data || !data.name || data.name === "이름 없음") {
                        data = await StoreService.getStoreBySlug(id);
                    }
                }
            }

            if (data && data.name && data.name !== "이름 없음") {
                const isFirestoreId = /^[a-zA-Z0-9]{20}$/.test(id);
                if (isFirestoreId && data.slug) {
                    const currentLang = i18n.language && i18n.language !== 'ko' ? `/${i18n.language}` : '';
                    router.replace(`${currentLang}/store/${data.slug}`);
                    return;
                }

                setStore(data);
                
                const storeCoupons = await CouponService.getCouponsByStoreId(data.id).catch(() => []);
                setCoupons(storeCoupons || []);
                
                setLikeCount(data.likeCount || 0);
                // Firestore에서 로그인한 유저의 좋아요 상태 확인
                if (user?.uid) {
                    LikeService.isLiked(user.uid, data.id).then(liked => setIsLiked(liked)).catch(() => {});
                } else {
                    setIsLiked(false);
                }
                
                if (data.wordpressUrl) {
                    fetchWordPressContent(data.wordpressUrl);
                } else {
                    setWpContent('');
                }
                
                setTimeout(() => {
                    StoreService.getAllStores().then(allStores => {
                        setRecommendations(allStores.filter(s => s.id !== data.id).sort(() => 0.5 - Math.random()).slice(0, 4));
                    }).catch(e => console.error("Recs fetch failed:", e));
                }, 1500);
            }

        } catch (error) { 
            console.error("Fetch store data failed:", error); 
        } finally { 
            setLoading(false); 
        }
    }, [id, router, i18n.language, fetchWordPressContent, getLocalizedString, initialStoreData, store]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        window.scrollTo(0, 0);
        if (id) fetchStoreData();
        return () => window.removeEventListener('resize', handleResize);
    }, [id, fetchStoreData]);

    const gallery = useMemo(() => {
        if (!store) return [];
        const images = [];
        const safePush = (url) => {
            if (url && typeof url === 'string' && url.trim()) {
                const u = url.trim();
                if (!images.includes(u)) images.push(u);
            }
        };
        safePush(store.image);
        for (let i = 1; i <= 10; i++) safePush(store[`img${i}`]);
        try {
            const gData = store.gallery || '[]';
            const gArr = Array.isArray(gData) ? gData : (typeof gData === 'string' ? (gData.startsWith('[') ? JSON.parse(gData) : gData.split(',').filter(Boolean)) : []);
            gArr.forEach(item => safePush(typeof item === 'string' ? item : item?.url));
        } catch (e) { }
        return images.map(img => fixImageUrl(img));
    }, [store, fixImageUrl]);

    const [showGalleryTags, setShowGalleryTags] = useState(true);

    useEffect(() => {
        setShowGalleryTags(true);
    }, [store?.id]);

    useEffect(() => {
        if (gallery.length <= 1) return;
        const timer = setInterval(() => setCurrentIdx(prev => (prev + 1) % gallery.length), 5000);
        return () => clearInterval(timer);
    }, [gallery.length]);

    useEffect(() => {
        if (gallery.length <= 4) return;
        const timer = setInterval(() => setGalleryBatchIndex(prev => (prev + 1) % Math.ceil(gallery.length / 4)), 5000);
        return () => clearInterval(timer);
    }, [gallery.length]);

    const currentBatch = useMemo(() => {
        if (gallery.length === 0) return [];
        const batch = [];
        for (let i = 0; i < 4; i++) {
            const imgIdx = (galleryBatchIndex * 4 + i) % gallery.length;
            batch.push(gallery[imgIdx]);
        }
        return batch;
    }, [gallery, galleryBatchIndex]);

    const handleOpenCoupon = () => {
        if (coupons?.length > 0) { setUseCouponDataForUse(coupons[0]); setIsUseModalOpen(true); }
        else alert('현재 사용 가능한 쿠폰이 없습니다.');
    };

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '120px', userSelect: 'text', WebkitUserSelect: 'text' }}>
            <style>{`
                blockquote, blockquote *, .wordpress-embed-content blockquote, .wordpress-embed-content blockquote * {
                    color: #6366f1 !important;
                }
                blockquote, .wordpress-embed-content blockquote {
                    border: 1px solid rgba(99, 102, 241, 0.2) !important;
                    border-left: 3.5px solid #6366f1 !important;
                    background-color: rgba(99, 102, 241, 0.05) !important;
                    padding: 10px 15px !important;
                    margin: 12px 0 !important;
                    border-radius: 8px !important;
                }
                blockquote p, .wordpress-embed-content blockquote p {
                    margin-bottom: 6px !important;
                    font-size: 0.9rem !important;
                    line-height: 1.5 !important;
                    font-style: normal !important;
                    font-weight: 400 !important;
                }
                blockquote p:last-child, .wordpress-embed-content blockquote p:last-child {
                    margin-bottom: 0 !important;
                }
            `}</style>

            <HeaderV2 />

            {loading && !store ? (
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Loader2 size={40} color="#6366f1" />
                    </motion.div>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 700 }}>정보를 불러오는 중입니다...</p>
                </div>
            ) : !store ? (
                <div style={{ padding: '100px', textAlign: 'center', color: '#64748b' }}>
                    <Store size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                    <p style={{ fontWeight: 700 }}>업체를 찾을 수 없습니다.</p>
                </div>
            ) : (
                <main style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '120px', width: '100%', overflowX: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'relative', width: '100%', padding: '0 16px', marginTop: '14px', overflow: 'hidden' }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1 / 1',
                            maxHeight: '1000px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: '#000'
                        }}>
                            <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={currentIdx} 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        exit={{ opacity: 0 }} 
                                        transition={{ duration: 0.8 }} 
                                        style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'pan-y' }}
                                        onClick={() => setSelectedImage(gallery[currentIdx])}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.15}
                                        onDragEnd={(e, info) => {
                                            const swipeThreshold = 50;
                                            if (info.offset.x < -swipeThreshold) {
                                                setCurrentIdx(prev => (prev + 1) % gallery.length);
                                            } else if (info.offset.x > swipeThreshold) {
                                                setCurrentIdx(prev => (prev - 1 + gallery.length) % gallery.length);
                                            }
                                        }}
                                    >
                                        <img
                                            src={gallery[currentIdx] || 'https://images.unsplash.com/photo-1544025162-8e6ad793f605?auto=format&fit=crop&q=80&w=800'}
                                            alt=""
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }}
                                        />
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.7) 100%)', zIndex: 2 }} />
                                    </motion.div>
                            </AnimatePresence>

                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60 }}>
                                <AnimatePresence mode="wait">
                                    {showGalleryTags && store.galleryTags && store.galleryTags.length > 0 && (
                                        <motion.div
                                            key="gallery-tags"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                right: '24px',
                                                transform: 'translateY(calc(-50% - 95px))'
                                            }}
                                        >
                                            <GalleryTagCycler tags={store.galleryTags} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button onClick={() => {
                                playTickSound();
                                if (typeof sessionStorage !== "undefined" && sessionStorage.getItem('from_v3') === 'true') { 
                                    sessionStorage.removeItem('from_v3'); 
                                    router.push('/v3'); 
                                } else { 
                                    router.back(); 
                                } 
                            }} style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 15, width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={24} /></button>

                            <div style={{ position: 'absolute', bottom: windowWidth < 768 ? '16px' : '24px', left: windowWidth < 768 ? '16px' : '24px', right: windowWidth < 768 ? '16px' : '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ padding: '4px 12px', borderRadius: '8px', background: '#6366f1', fontSize: '0.75rem', fontWeight: 900, color: 'white', width: 'fit-content', marginBottom: '12px', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}>{getTranslatedCategory(store.category)}</div>
                                    <h1 style={{ fontSize: windowWidth < 768 ? '1.6rem' : '2.3rem', fontWeight: 950, marginBottom: '2px', letterSpacing: '-1px', lineHeight: 1.1 }}>{getLocalizedString(store.name)}</h1>
                                    {store.slogan && (
                                        <p style={{ fontSize: windowWidth < 768 ? '0.9rem' : '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', maxWidth: '90%', lineHeight: 1.4 }}>
                                            <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '6px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>
                                                {getLocalizedString(store.slogan)}
                                            </span>
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        {!store?.headerVideo && !store?.headerYoutube && (
                                            <button onClick={handleOpenCoupon} style={{ padding: windowWidth < 768 ? '8px 16px' : '12px 28px', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: windowWidth < 768 ? '0.8rem' : '0.95rem', width: 'fit-content', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)', cursor: 'pointer', transition: 'all 0.3s' }}><Ticket size={18} fill="white" /> 할인 쿠폰 받기</button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <img 
                                        src="/1top_bedge.png" 
                                        alt="Top 1 Badge" 
                                        style={{ 
                                            width: windowWidth < 768 ? '58px' : '70px', 
                                            height: 'auto', 
                                            display: 'block',
                                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>{gallery.map((_, idx) => (<div key={idx} style={{ width: currentIdx === idx ? '20px' : '6px', height: '6px', borderRadius: '3px', background: currentIdx === idx ? '#0f172a' : '#cbd5e1', transition: 'all 0.3s' }} />))}</div>
                    </div>

                    <div style={{ padding: windowWidth < 768 ? '12px 16px' : '20px 24px' }}>
                        <div style={{ maxWidth: '800px' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: windowWidth < 768 ? '8px' : '12px',
                                marginBottom: windowWidth < 768 ? '16px' : '24px',
                                marginTop: windowWidth < 768 ? '4px' : '8px'
                            }}>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleLike}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            padding: '12px 8px',
                                            background: isLiked ? '#fff1f2' : '#f8fafc',
                                            border: `1px solid ${isLiked ? '#fecaca' : '#e2e8f0'}`,
                                            borderRadius: '16px',
                                            color: isLiked ? '#f43f5e' : '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: isLiked ? '0 4px 12px rgba(244, 63, 94, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <motion.div
                                            animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Heart size={20} fill={isLiked ? '#f43f5e' : 'none'} stroke={isLiked ? '#f43f5e' : '#64748b'} strokeWidth={2} />
                                        </motion.div>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                                            {!user ? '로그인 필요' : isLiked ? '좋아요 ♥' : '좋아요'}{likeCount > 0 && <span style={{ marginLeft: '2px', opacity: 0.9 }}> {likeCount}</span>}
                                        </span>
                                    </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        const videoUrl = store?.youtubeLink || store?.headerYoutube;
                                        if (videoUrl) {
                                            window.open(videoUrl, '_blank');
                                        } else {
                                            alert('등록된 유튜브 영상이 없습니다.');
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '12px 8px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <Play size={20} color="#ff0000" fill="#ff0000" />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>영상보기</span>
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (coupons && coupons.length > 0) {
                                            handleOpenGiftModal(coupons[0], store);
                                        } else {
                                            alert('공유할 수 있는 쿠폰이 없습니다.');
                                        }
                                    }}
                                    disabled={isSharing}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '12px 8px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        color: '#64748b',
                                        cursor: isSharing ? 'wait' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    {isSharing ? <Loader2 size={20} className="animate-spin" color="#10b981" /> : <Share2 size={20} />}
                                    <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                                        {isSharing ? '공유중...' : '쿠폰공유'}
                                    </span>
                                </motion.button>
                            </div>

                            <div style={{ marginBottom: windowWidth < 768 ? '24px' : '32px', background: 'white', borderRadius: '24px', padding: windowWidth < 768 ? '16px 12px' : '20px', border: '1px solid #f1f5f9' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    marginBottom: windowWidth < 768 ? '12px' : '16px',
                                    paddingBottom: windowWidth < 768 ? '10px' : '12px',
                                    borderBottom: '1px solid #f1f5f9'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ width: '4px', height: '24px', background: '#6366f1', borderRadius: '2px' }} />
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-1.6px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                상세 정보 <span style={{ color: '#6366f1', fontSize: '1.2rem', fontWeight: 700, marginLeft: '6px' }}>Detail</span>
                                            </div>
                                        </h3>
                                    </div>

                                </div>

                                <div style={{ position: 'relative' }}>
                                    {(store.youtubeLink || store.instagramLink || store.tiktokLink) && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            background: '#f8fafc',
                                            borderRadius: '16px',
                                            marginBottom: '16px',
                                            border: '1px solid #e2e8f0',
                                            width: '100%'
                                        }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>SNS 바로가기:</span>
                                            {store.youtubeLink && (
                                                <a href={store.youtubeLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                                    <img src="/youtube_icon.png" alt="YouTube" style={{ width: '55%', height: 'auto' }} />
                                                </a>
                                            )}
                                            {store.instagramLink && (
                                                <a href={store.instagramLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                                    <img src="/insta_icon.png" alt="Instagram" style={{ width: '55%', height: 'auto' }} />
                                                </a>
                                            )}
                                            {store.tiktokLink && (
                                                <a href={store.tiktokLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                                    <img src="/tiktok_icon.png" alt="TikTok" style={{ width: '55%', height: 'auto' }} />
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        {false ? (
                                            <>
                                                <style>{`
                                                    .wordpress-embed-content img {
                                                        max-width: 100% !important;
                                                        height: auto !important;
                                                        border-radius: 12px;
                                                        margin: 12px 0;
                                                        display: block;
                                                    }
                                                    .wordpress-embed-content table {
                                                        width: 100% !important;
                                                        border-collapse: collapse;
                                                        margin: 16px 0;
                                                        font-size: 0.9rem;
                                                    }
                                                    .wordpress-embed-content th, .wordpress-embed-content td {
                                                        border: 1px solid #e2e8f0;
                                                        padding: 8px 12px;
                                                        text-align: left;
                                                    }
                                                    .wordpress-embed-content th {
                                                        background-color: #f8fafc;
                                                        font-weight: 700;
                                                    }
                                                    .wordpress-embed-content p {
                                                        margin-bottom: 14px;
                                                    }
                                                    .wordpress-embed-content iframe {
                                                        max-width: 100% !important;
                                                        border: none !important;
                                                        display: block;
                                                        margin: 12px auto;
                                                        transform: translate3d(0, 0, 0);
                                                        -webkit-transform: translate3d(0, 0, 0);
                                                        backface-visibility: hidden;
                                                        -webkit-backface-visibility: hidden;
                                                        aspect-ratio: 16 / 9;
                                                    }
                                                    .wordpress-embed-content iframe[src*="shorts"],
                                                    .wordpress-embed-content iframe[src*="youtube.com/embed/"][width="360"],
                                                    .wordpress-embed-content iframe[src*="youtube.com/embed/"][width="315"],
                                                    .wordpress-embed-content iframe[src*="youtube-shorts"] {
                                                        aspect-ratio: 9 / 16 !important;
                                                        max-width: 360px !important;
                                                    }
                                                    .wordpress-embed-content blockquote {
                                                        border: 1px solid rgba(99, 102, 241, 0.15) !important;
                                                        border-left: 4px solid #6366f1 !important;
                                                        background-color: rgba(99, 102, 241, 0.04) !important;
                                                        padding: 14px 20px !important;
                                                        margin: 18px 0 !important;
                                                        border-radius: 12px !important;
                                                        color: #312e81 !important;
                                                    }
                                                    .wordpress-embed-content blockquote p {
                                                        margin-bottom: 8px !important;
                                                        font-size: 0.95rem !important;
                                                        line-height: 1.6 !important;
                                                        color: #312e81 !important;
                                                        font-style: normal !important;
                                                    }
                                                    .wordpress-embed-content blockquote p:last-child {
                                                        margin-bottom: 0 !important;
                                                    }
                                                    .wordpress-embed-content blockquote cite,
                                                    .wordpress-embed-content blockquote footer {
                                                        display: block !important;
                                                        font-size: 0.8rem !important;
                                                        color: #94a3b8 !important;
                                                        margin-top: 8px !important;
                                                        font-style: normal !important;
                                                        font-weight: 600 !important;
                                                    }
                                                    .wordpress-embed-content blockquote blockquote {
                                                        border-left: 3px solid #cbd5e1 !important;
                                                        background-color: #ffffff !important;
                                                        margin: 10px 0 0 10px !important;
                                                        padding: 8px 12px !important;
                                                        font-style: normal !important;
                                                    }
                                                    .wordpress-embed-content .wp-block-group {
                                                        padding: 20px !important;
                                                        margin: 20px 0 !important;
                                                        border-radius: 12px !important;
                                                    }
                                                    .wordpress-embed-content .has-background {
                                                        padding: 20px !important;
                                                        margin: 18px 0 !important;
                                                        border-radius: 12px !important;
                                                    }
                                                    .wordpress-embed-content .has-border-color {
                                                        border-style: solid !important;
                                                        border-width: 1px !important;
                                                        border-color: #e2e8f0 !important;
                                                    }
                                                    .wordpress-embed-content .has-light-gray-background-color {
                                                        background-color: #f5f5f5 !important;
                                                    }
                                                    .wordpress-embed-content .has-light-gray-border-color {
                                                        border-color: #e0e0e0 !important;
                                                    }
                                                    .wordpress-embed-content .has-white-background-color {
                                                        background-color: #ffffff !important;
                                                    }
                                                    .wordpress-embed-content .wp-block-preformatted,
                                                    .wordpress-embed-content pre {
                                                        background-color: #f5f5f5 !important;
                                                        border: 1px solid #e0e0e0 !important;
                                                        padding: 16px 20px !important;
                                                        margin: 18px 0 !important;
                                                        border-radius: 8px !important;
                                                        font-family: var(--font-base), sans-serif !important;
                                                        font-size: 0.92rem !important;
                                                        line-height: 1.65 !important;
                                                        color: #334155 !important;
                                                        white-space: pre-wrap !important;
                                                        word-break: break-all !important;
                                                    }
                                                    .wordpress-embed-content .wp-block-columns {
                                                        display: flex !important;
                                                        gap: 16px !important;
                                                        flex-wrap: wrap !important;
                                                        margin: 20px 0 !important;
                                                    }
                                                    .wordpress-embed-content .wp-block-column {
                                                        flex: 1 !important;
                                                        min-width: 200px !important;
                                                    }
                                                    .wordpress-embed-content .wp-block-media-text {
                                                        display: flex !important;
                                                        flex-direction: column !important;
                                                        gap: 16px !important;
                                                        border: 1px solid #e2e8f0 !important;
                                                        border-radius: 16px !important;
                                                        padding: 16px !important;
                                                        background-color: #ffffff !important;
                                                        margin: 20px 0 !important;
                                                    }
                                                    @media (min-width: 480px) {
                                                        .wordpress-embed-content .wp-block-media-text {
                                                            flex-direction: row !important;
                                                        }
                                                    }
                                                    .wordpress-embed-content .wp-block-button,
                                                    .wordpress-embed-content button,
                                                    .wordpress-embed-content .wp-block-button__link,
                                                    .wordpress-embed-content a[class*="wp-block-button"] {
                                                        display: none !important;
                                                    }
                                                    .wp-callout-box {
                                                        background-color: #f8fafc !important;
                                                        border: 1px solid #e2e8f0 !important;
                                                        border-radius: 12px !important;
                                                        padding: 12px 16px !important;
                                                        margin: 14px 0 !important;
                                                        color: #475569 !important;
                                                        font-size: 0.92rem !important;
                                                        font-weight: 600 !important;
                                                        line-height: 1.6 !important;
                                                        display: block !important;
                                                        box-shadow: inset 0 1px 2px rgba(0,0,0,0.01) !important;
                                                    }
                                                `}</style>
                                                <div 
                                                    className="wordpress-embed-content"
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: wpContent.replace(
                                                            /(?:<p>)?\$\s+([^<\n\r]+)(?:<\/p>)?/gi, 
                                                            '<div class="wp-callout-box">$1</div>'
                                                        ) 
                                                    }}
                                                    style={{
                                                        lineHeight: '1.8',
                                                        fontSize: '15px',
                                                        color: 'var(--color-text-main)',
                                                        userSelect: 'text',
                                                        WebkitUserSelect: 'text',
                                                        isolation: 'isolate'
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <RenderWithShortcodes 
                                                text={getLocalizedString(store.description)}
                                                navigate={router.push}
                                                postImgs={gallery}
                                                linkedStore={store}
                                            />
                                        )}
                                        
                                    </div>

                                </div>
                            </div>

                            {gallery.length > 0 && (
                                <div style={{ marginBottom: windowWidth < 768 ? '24px' : '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: windowWidth < 768 ? '10px' : '12px' }}>
                                        <div style={{ width: '4px', height: '24px', background: '#6366f1', borderRadius: '2px' }} />
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>
                                            갤러리 <span style={{ color: '#6366f1' }}>Gallery</span>
                                        </h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                        {currentBatch.map((img, idx) => (
                                            <motion.div 
                                                key={`${galleryBatchIndex}-${idx}`} 
                                                initial={{ opacity: 0, scale: 0.9 }} 
                                                animate={{ opacity: 1, scale: 1 }} 
                                                transition={{ duration: 0.5 }} 
                                                style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#f1f5f9', aspectRatio: '1/1', cursor: 'zoom-in' }}
                                                onClick={() => setSelectedImage(img)}
                                            >
                                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {store.menu && store.menu.length > 0 && !store.hideDefaultMenu && (
                                <div style={{ marginBottom: windowWidth < 768 ? '36px' : '52px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: windowWidth < 768 ? '12px' : '16px' }}>
                                        <div style={{ width: '4px', height: '20px', background: '#6366f1', borderRadius: '2px' }} />
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
                                            메뉴 정보 <span style={{ color: '#6366f1', fontWeight: 900, marginLeft: '6px' }}>Menu</span>
                                        </h3>
                                    </div>
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        background: '#ffffff', 
                                        borderRadius: '16px', 
                                        overflow: 'hidden',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                                    }}>
                                        {Array.isArray(store.menu) && store.menu.map((item, idx) => (
                                            <div 
                                                key={idx} 
                                                style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    gap: '2px',
                                                    padding: '10px 14px',
                                                    background: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                                                    borderBottom: idx === store.menu.length - 1 ? 'none' : '1px solid #f1f5f9'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.7px' }}>
                                                        {getLocalizedString(item?.name)}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '0.85rem', 
                                                        fontWeight: 900, 
                                                        color: '#6366f1',
                                                        background: idx % 2 === 1 ? '#ffffff' : '#f0f2ff',
                                                        border: idx % 2 === 1 ? '1px solid #e2e8f0' : 'none',
                                                        padding: '3px 8px',
                                                        borderRadius: '8px',
                                                        fontFamily: "'Inter', sans-serif",
                                                        whiteSpace: 'nowrap',
                                                        letterSpacing: '-0.3px'
                                                    }}>
                                                        {formatPrice(getLocalizedString(item?.price))}
                                                    </span>
                                                </div>
                                                {getLocalizedString(item?.description) && (
                                                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 550, margin: 0, lineHeight: 1.25, letterSpacing: '-0.4px' }}>
                                                        {getLocalizedString(item?.description)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {store.menuGroups && store.menuGroups.length > 0 && (
                                <div style={{ 
                                    marginBottom: windowWidth < 768 ? '24px' : '32px', 
                                    background: 'white', 
                                    borderRadius: '24px', 
                                    padding: windowWidth < 768 ? '16px 12px' : '20px', 
                                    border: '1px solid #f1f5f9' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ width: '4px', height: '24px', background: '#10b981', borderRadius: '2px' }} />
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-1.2px' }}>
                                            메뉴 및 가격 <span style={{ color: '#10b981', fontSize: '1.05rem', fontWeight: 700, marginLeft: '6px' }}>Menu</span>
                                        </h3>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {store.menuGroups.map((group, gIdx) => (
                                            <div key={gIdx} style={{ background: '#f8fafc', borderRadius: '16px', padding: '14px 16px' }}>
                                                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                                    {group.groupName}
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {group.items && group.items.map((item, iIdx) => (
                                                        <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: iIdx === group.items.length - 1 ? 'none' : '1px dashed #e2e8f0', paddingBottom: iIdx === group.items.length - 1 ? '0' : '8px', gap: '12px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                 <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', wordBreak: 'break-all' }}>{item.name}</div>
                                                                 {item.note && (
                                                                     <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', marginTop: '2px', lineHeight: 1.3, wordBreak: 'break-all' }}>
                                                                         {item.note}
                                                                     </div>
                                                                 )}
                                                            </div>
                                                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'right' }}>
                                                                {formatPrice(item.price)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {store.menuImages && store.menuImages.length > 0 && (
                                <div style={{ marginBottom: windowWidth < 768 ? '36px' : '52px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: windowWidth < 768 ? '12px' : '16px' }}>
                                        <div style={{ width: '4px', height: '20px', background: '#6366f1', borderRadius: '2px' }} />
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
                                            메뉴판 <span style={{ color: '#6366f1' }}>Board</span>
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {store.menuImages.map((img, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => setSelectedImage(fixImageUrl(img))}
                                                style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', background: '#f8fafc', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'zoom-in' }}
                                            >
                                                <img src={fixImageUrl(img)} alt={`Menu Board ${idx}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: windowWidth < 768 ? '36px' : '52px', background: '#f8fafc', borderRadius: '24px', padding: windowWidth < 768 ? '12px' : '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: windowWidth < 768 ? '12px' : '16px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '4px', height: '20px', background: '#6366f1', borderRadius: '2px' }} />
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
                                            영업 정보 <span style={{ color: '#6366f1' }}>Info</span>
                                        </h3>
                                    </div>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => router.push(`/edit-store/${store.id}`)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: '6px 12px', background: 'rgba(99, 102, 241, 0.1)',
                                                color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)',
                                                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <Edit2 size={14} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, marginLeft: '4px' }}>정보 수정</span>
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {store.address && (
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}><Map size={20} /></div>
                                            <div style={{ flex: 1 }}>
                                                <a
                                                    href={store.mapUrl || store.googleMapUrl || store.google_map_url || store.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getLocalizedString(store.address))}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        padding: '12px 20px',
                                                        background: '#ffffff',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '12px',
                                                        color: '#6366f1',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 800,
                                                        textDecoration: 'none',
                                                        transition: 'all 0.2s',
                                                        width: 'fit-content'
                                                    }}
                                                >
                                                    <MapPin size={16} /> 구글맵에서 위치보기
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {store.phoneNumber && (
                                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '160px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}><Phone size={20} /></div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', marginBottom: '2px' }}>연락처</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>{store.phoneNumber}</div>
                                                </div>
                                            </div>
                                            {(store.businessHours || store.openingHours) && (
                                                <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '160px', borderLeft: windowWidth > 480 ? '1px solid #e2e8f0' : 'none', paddingLeft: windowWidth > 480 ? '16px' : '0' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}><Clock size={20} /></div>
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', marginBottom: '2px' }}>영업시간</div>
                                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>{getLocalizedString(store.businessHours || store.openingHours)}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {store.kakaoId && (
                                    <div style={{ 
                                        display: 'flex', 
                                        gap: '12px', 
                                        alignItems: 'center', 
                                        marginTop: '16px', 
                                        padding: '12px 16px', 
                                        background: '#0f172a', 
                                        border: '1px solid #1e293b', 
                                        borderRadius: '16px' 
                                    }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(250, 204, 21, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15', flexShrink: 0 }}>
                                            <Phone size={18} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '1px' }}>카카오톡 추천 ID</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#facc15', fontFamily: "var(--font-dream)" }}>{store.kakaoId}</div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(store.kakaoId);
                                                alert('카카오톡 ID가 복사되었습니다!');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#facc15',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                color: '#0f172a',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            복사
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div id="review-section" style={{ 
                            marginBottom: windowWidth < 768 ? '36px' : '52px',
                            background: 'white',
                            borderRadius: '24px',
                            padding: windowWidth < 768 ? '16px 12px' : '20px',
                            border: '1px solid #f1f5f9'
                        }}>
                            <ReviewSection businessId={store?.id || id} isAdmin={isAdmin} />
                        </div>

                        <div style={{ marginTop: windowWidth < 768 ? '40px' : '60px', borderTop: '1px solid #f1f5f9', paddingTop: windowWidth < 768 ? '30px' : '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: windowWidth < 768 ? '16px' : '24px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>다른 추천 업체 <span style={{ color: '#6366f1' }}>Pick</span></h3>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: windowWidth < 1024 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
                                gap: '15px 16px'
                            }}>
                                {recommendations.map(s => (<CompactStoreCard key={s.id} store={s} />))}
                            </div>
                        </div>
                    </div>
                </main>
            )}
            <UseCouponModal isOpen={isUseModalOpen} onClose={() => setIsUseModalOpen(false)} coupon={useCouponDataForUse} store={store} />
            <GiftModal isOpen={isGiftModalOpen} onClose={() => setIsGiftModalOpen(false)} coupon={giftCouponData} store={giftSelectedStore || store} />

            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.95)',
                            zIndex: 20000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            cursor: 'zoom-out'
                        }}
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                position: 'absolute',
                                top: '30px',
                                right: '30px',
                                background: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 20001,
                                boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            <X size={24} color="#000" />
                        </motion.button>

                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={selectedImage}
                            alt="Full View"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        key="scroll-to-top"
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        transition={{ duration: 0.2 }}
                        whileHover={{ scale: 1.1, y: -4 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{
                            position: 'fixed',
                            bottom: (showFloatingCoupon && coupons.length > 0) ? '116px' : '40px',
                            right: getButtonRight(),
                            width: '48px',
                            height: '48px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                            cursor: 'pointer',
                            border: 'none',
                            zIndex: 999
                        }}
                    >
                        <ChevronUp size={24} strokeWidth={2.5} />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFloatingCoupon && coupons.length > 0 && (
                    <motion.div
                        key="floating-coupon-card"
                        initial={{ y: 120, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 120, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            left: '20px',
                            right: '20px',
                            zIndex: 9999,
                            display: 'flex',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{
                            width: '100%',
                            maxWidth: '440px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderRadius: '24px',
                            padding: '14px 18px',
                            boxShadow: '0 20px 40px rgba(239, 68, 68, 0.25), 0 1px 3px rgba(0, 0, 0, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            pointerEvents: 'auto',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Ticket size={20} color="white" fill="white" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 800, letterSpacing: '0.5px' }}>COUPON</div>
                                    <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 900, lineHeight: 1.2 }}>할인 쿠폰 받기</div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleOpenCoupon}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '14px',
                                        background: '#ffffff',
                                        color: '#ef4444',
                                        border: 'none',
                                        fontSize: '0.95rem',
                                        fontWeight: 1000,
                                        cursor: 'pointer',
                                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
                                        width: '100%',
                                        maxWidth: '130px',
                                        textAlign: 'center'
                                    }}
                                >
                                    쿠폰사용
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
