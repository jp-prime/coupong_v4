'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
    Loader2, ChevronLeft, Heart, MessageSquare, Phone,
    Ticket, Eye, MapPin, Tag, Compass, Share2
} from 'lucide-react';
import { StoreService } from '../../services/StoreService';
import { CouponService } from '../../services/CouponService';
import { useStoreHelpers } from '../../hooks/useStoreHelpers';
import UseCouponModal from '../../components/coupon/UseCouponModal';

// 유튜브/비디오 임베드 컴포넌트 (음소거 자동재생 전용)
const VideoPlayer = ({ url, isActive }) => {
    const [isMuted, setIsMuted] = useState(true);
    const iframeRef = useRef(null);

    let embedUrl = "";
    let isVertical = false;
    let isHorizontal = false;
    let isInstagram = false;

    if (!url) return null;
    const cleanUrl = url.trim();

    try {
        if (cleanUrl.includes("youtube.com/shorts/")) {
            const id = cleanUrl.split("youtube.com/shorts/")[1]?.split(/[?#]/)[0];
            embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
            isVertical = true;
        } else if (cleanUrl.includes("youtu.be/")) {
            const id = cleanUrl.split("youtu.be/")[1]?.split(/[?#]/)[0];
            embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
            isHorizontal = true;
        } else if (cleanUrl.includes("youtube.com/embed/")) {
            const id = cleanUrl.split("youtube.com/embed/")[1]?.split(/[?#]/)[0];
            embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
            isHorizontal = true;
        } else if (cleanUrl.includes("v=")) {
            const id = cleanUrl.split("v=")[1]?.split(/[&?#]/)[0];
            embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
            isHorizontal = true;
        } else if (cleanUrl.includes("instagram.com/reel/") || cleanUrl.includes("instagram.com/p/")) {
            let id = "";
            if (cleanUrl.includes("instagram.com/reel/")) {
                id = cleanUrl.split("instagram.com/reel/")[1]?.split(/[?#]/)[0];
            } else {
                id = cleanUrl.split("instagram.com/p/")[1]?.split(/[?#]/)[0];
            }
            embedUrl = `https://www.instagram.com/p/${id}/embed/`;
            isVertical = true;
            isInstagram = true;
        } else if (cleanUrl.includes("tiktok.com/")) {
            let id = "";
            if (cleanUrl.includes("/video/")) {
                id = cleanUrl.split("/video/")[1]?.split(/[?#]/)[0];
            } else {
                id = cleanUrl.split("tiktok.com/")[1]?.split(/[?#]/)[0];
            }
            embedUrl = `https://www.tiktok.com/embed/v2/${id}`;
            isVertical = true;
        }
    } catch (e) {
        console.error("Video URL parse error", e);
    }

    useEffect(() => {
        if (!iframeRef.current || !embedUrl.includes("youtube.com")) return;
        try {
            const iframeWindow = iframeRef.current.contentWindow;
            if (isActive) {
                iframeWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            } else {
                iframeWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            }
        } catch (e) {}
    }, [isActive, embedUrl]);

    if (!embedUrl) {
        return (
            <video
                src={cleanUrl}
                autoPlay={isActive}
                loop
                muted={isMuted}
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                }}
            />
        );
    }

    let iframeStyle = {
        width: '100%',
        height: '100%',
        border: 'none',
        pointerEvents: 'none'
    };

    if (isVertical) {
        iframeStyle = {
            width: '100%',
            height: '177.78%',
            minHeight: '177.78%',
            border: 'none',
            pointerEvents: 'none',
            transform: isInstagram ? 'scale(1.15) translateY(2%)' : 'scale(1.1)'
        };
    } else if (isHorizontal) {
        iframeStyle = {
            width: '177.78%',
            minWidth: '177.78%',
            height: '100%',
            border: 'none',
            pointerEvents: 'none',
            transform: 'scale(1.1)'
        };
    }

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000'
        }}>
            <iframe
                ref={iframeRef}
                src={embedUrl}
                title="Shorts Video"
                frameBorder="0"
                scrolling="no"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={iframeStyle}
            />
        </div>
    );
};

const ImageSlider = ({ store, fixImageUrl, getLocalizedString, isActive }) => {
    const images = React.useMemo(() => {
        if (!store) return [];
        const list = [];
        const safePush = (url) => {
            if (url && typeof url === 'string' && url.trim()) {
                const u = url.trim();
                if (!list.includes(u)) list.push(u);
            }
        };
        safePush(store.image);
        for (let i = 1; i <= 10; i++) safePush(store[`img${i}`]);
        try {
            const gData = store.gallery || '[]';
            const gArr = Array.isArray(gData) ? gData : (typeof gData === 'string' ? (gData.startsWith('[') ? JSON.parse(gData) : gData.split(',').filter(Boolean)) : []);
            gArr.forEach(item => safePush(typeof item === 'string' ? item : item?.url));
        } catch (e) { }
        return list.map(img => fixImageUrl(img));
    }, [store, fixImageUrl]);

    const [currentIdx, setCurrentIdx] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setCurrentIdx(0);
        }
    }, [isActive]);

    useEffect(() => {
        if (images.length <= 1 || !isActive) return;
        const delay = currentIdx === 0 ? 2500 : 4000;
        const timer = setTimeout(() => {
            setCurrentIdx(prev => (prev + 1) % images.length);
        }, delay);
        return () => clearTimeout(timer);
    }, [images.length, isActive, currentIdx]);

    if (images.length === 0) return null;

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentIdx}
                    src={images[currentIdx]}
                    alt={getLocalizedString(store.name)}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: 1.2, ease: "easeInOut" } }}
                    exit={{ opacity: 0 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            </AnimatePresence>
        </div>
    );
};

function GalleryTagCycler({ tags }) {
    const [windowWidth, setWindowWidth] = React.useState(375);
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
    const colors = ['#ffffff', '#22c55e', '#ffeb3b'];
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
                        color: colors[i % colors.length], fontSize: windowWidth < 768 ? '18px' : '1.8rem', fontWeight: '900', fontFamily: "'Noto Serif KR', serif",
                        letterSpacing: 'normal', lineHeight: '0.8', padding: '4px 0', textAlign: 'right',
                        textShadow: `-2px -2px 0 #000, 0px -2px 0 #000, 2px -2px 0 #000, -2px 0px 0 #000, 2px 0px 0 #000, -2px 2px 0 #000, 0px 2px 0 #000, 2px 2px 0 #000, 0 10px 25px rgba(0,0,0,0.8)`,
                        filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))'
                    }}
                >
                    {text}
                </motion.div>
            ))}
        </div>
    );
}

export default function StoresV3Page({ initialStores = [] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { storeId } = useParams();
    const { t, i18n } = useTranslation();
    const { fixImageUrl, getLocalizedString, getTranslatedCategory, getTranslatedLocation } = useStoreHelpers();

    const [stores, setStores] = useState(initialStores);
    const [loading, setLoading] = useState(initialStores.length === 0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isStandaloneBrowser, setIsStandaloneBrowser] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const ua = navigator.userAgent.toLowerCase();
        const isInApp = ua.includes('kakaotalk') || ua.includes('line') || ua.includes('fb_iab') || ua.includes('instagram') || ua.includes('naver');
        const isMobile = /iphone|ipad|ipod|android/i.test(ua);
        const isBrowser = isMobile && !isInApp && !window.navigator.standalone;
        setIsStandaloneBrowser(isBrowser);
    }, []);

    const queryStoreId = searchParams.get('storeId') || searchParams.get('id');

    const [selectedStore, setSelectedStore] = useState(null);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [likedMap, setLikedMap] = useState({});
    const containerRef = useRef(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setVh();
        window.addEventListener('resize', setVh);
        window.addEventListener('orientationchange', setVh);
        return () => {
            window.removeEventListener('resize', setVh);
            window.removeEventListener('orientationchange', setVh);
        };
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const data = await StoreService.getAllStores();
                const sorted = data.filter(s => s.isActive !== false).sort((a, b) => {
                    if (a.isHot && !b.isHot) return -1;
                    if (!a.isHot && b.isHot) return 1;
                    return (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999);
                });
                setStores(sorted);

                const initialLikes = {};
                sorted.forEach(s => {
                    if (typeof window !== "undefined") {
                        initialLikes[s.id] = localStorage.getItem(`liked_${s.id}`) === 'true';
                    }
                });
                setLikedMap(initialLikes);
            } catch (err) {
                console.error("V3 stores loading failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const targetStoreId = storeId || queryStoreId || sessionStorage.getItem('v3_last_store_id');
        if (loading || stores.length === 0 || !targetStoreId) return;

        const idx = stores.findIndex(s => s.id === targetStoreId || String(s.id) === String(targetStoreId));
        if (idx !== -1) {
            setActiveIndex(idx);
            sessionStorage.setItem('v3_last_store_id', String(targetStoreId));
            
            setTimeout(() => {
                if (containerRef.current) {
                    const clientHeight = containerRef.current.clientHeight || window.innerHeight;
                    containerRef.current.scrollTop = clientHeight * idx;
                }
            }, 250);
        }
    }, [loading, stores, storeId, queryStoreId]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const scrollTop = containerRef.current.scrollTop;
        const clientHeight = containerRef.current.clientHeight;
        const index = Math.round(scrollTop / clientHeight);
        if (index !== activeIndex && index >= 0 && index < stores.length) {
            setActiveIndex(index);
            const currentStore = stores[index];
            if (currentStore && typeof window !== "undefined") {
                sessionStorage.setItem('v3_last_store_id', String(currentStore.id));
            }
        }
    };

    const handleLikeToggle = async (e, store) => {
        e.stopPropagation();
        const nextStatus = !likedMap[store.id];
        setLikedMap(prev => ({ ...prev, [store.id]: nextStatus }));

        try {
            await StoreService.toggleStoreLike(store.id, nextStatus);
            if (typeof window !== "undefined") {
                localStorage.setItem(`liked_${store.id}`, String(nextStatus));
            }
            setStores(prev => prev.map(s => {
                if (s.id === store.id) {
                    return { ...s, likeCount: Math.max(0, (s.likeCount || 0) + (nextStatus ? 1 : -1)) };
                }
                return s;
            }));
        } catch (error) {
            console.error("Like toggle failed:", error);
        }
    };

    const handleUseCoupon = async (e, store) => {
        e.stopPropagation();
        setSelectedStore(store);
        try {
            const coupons = await CouponService.getCouponsByStoreId(store.id);
            if (coupons && coupons.length > 0) {
                setSelectedCoupon(coupons[0]);
                setIsCouponModalOpen(true);
            } else {
                alert("현재 등록된 활성 쿠폰이 없습니다.");
            }
        } catch (err) {
            console.error("Failed to load store coupons", err);
        }
    };

    const handleContact = (e, store) => {
        e.stopPropagation();
        if (store.kakaoId) {
            navigator.clipboard.writeText(store.kakaoId);
            alert(`카카오톡 ID가 복사되었습니다: ${store.kakaoId}\n카톡에서 친구 추가 후 문의해 주세요.`);
            window.open("https://open.kakao.com/o/sBuie8fi", "_blank");
        } else if (store.phoneNumber || store.phone) {
            window.location.href = `tel:${store.phoneNumber || store.phone}`;
        } else {
            alert("등록된 연락처가 없습니다.");
        }
    };

    const handleDetail = (e, store) => {
        e.stopPropagation();
        if (typeof window !== "undefined") {
            sessionStorage.setItem('from_v3', 'true');
        }
        router.push(`/store/${store.id}`);
    };

    const handleShare = async (e, store) => {
        e.stopPropagation();
        const langPath = i18n.language && i18n.language !== 'ko' ? `/${i18n.language}` : '';
        const shareUrl = `${window.location.origin}${langPath}/v3/${store.id}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: getLocalizedString(store.name),
                    text: getLocalizedString(store.slogan) || '',
                    url: shareUrl,
                });
            } catch (err) {
                console.log("Share failed or cancelled", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert("공유 링크가 클립보드에 복사되었습니다!");
            } catch (err) {
                alert("링크 복사에 실패했습니다.");
            }
        }
    };

    if (loading) {
        return (
            <div style={{
                height: 'calc(var(--vh, 1vh) * 100)',
                width: '100vw',
                background: '#000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                color: '#fff'
            }}>
                <Loader2 className="animate-spin" size={36} color="#6366f1" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>트렌디한 피드 구성 중...</span>
            </div>
        );
    }

    return (
        <div style={{
            height: 'calc(var(--vh, 1vh) * 100)',
            width: '100vw',
            maxWidth: '480px',
            margin: '0 auto',
            position: 'relative',
            background: '#09090b',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '60px',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
                pointerEvents: 'none'
            }}>
                <button 
                    onClick={() => {
                        if (typeof window !== "undefined") {
                            sessionStorage.removeItem('v3_last_store_id');
                        }
                        router.push('/');
                    }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            <div 
                ref={containerRef}
                onScroll={handleScroll}
                style={{
                    height: 'calc(var(--vh, 1vh) * 100)',
                    width: '100%',
                    overflowY: 'scroll',
                    scrollSnapType: 'y mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}
                className="hide-scrollbar"
            >
                {stores.map((store, index) => {
                    const isActive = index === activeIndex;
                    const videoUrl = store.headerYoutube || store.headerVideo;
                    const hasDiscount = !!store.discount;

                    return (
                        <div 
                            key={store.id}
                            style={{
                                height: 'calc(var(--vh, 1vh) * 100)',
                                width: '100%',
                                scrollSnapAlign: 'start',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#09090b',
                                overflow: 'hidden'
                            }}
                        >
                            <div 
                                onClick={(e) => handleDetail(e, store)}
                                style={{
                                    width: '100%',
                                    height: isStandaloneBrowser ? '57%' : '62%',
                                    position: 'relative',
                                    background: '#000',
                                    overflow: 'hidden',
                                    borderRadius: '0 0 16px 16px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer'
                                }}
                            >
                                {videoUrl ? (
                                    <VideoPlayer url={videoUrl} isActive={isActive} />
                                ) : (
                                    <ImageSlider 
                                        store={store} 
                                        fixImageUrl={fixImageUrl} 
                                        getLocalizedString={getLocalizedString} 
                                        isActive={isActive} 
                                    />
                                )}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '60px',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                                    zIndex: 2,
                                    pointerEvents: 'none'
                                }} />

                                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 55 }}>
                                    <AnimatePresence mode="wait">
                                        {isActive && store.galleryTags && store.galleryTags.length > 0 && (
                                            <motion.div
                                                key="gallery-tags-v3"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    right: '24px',
                                                    transform: 'translateY(calc(-50% - 115px))'
                                                }}
                                            >
                                                <GalleryTagCycler tags={store.galleryTags} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div 
                                onClick={(e) => handleDetail(e, store)}
                                style={{
                                    width: '100%',
                                    height: isStandaloneBrowser ? '43%' : '38%',
                                    background: '#121214',
                                    padding: isStandaloneBrowser 
                                        ? '12px 24px calc(24px + env(safe-area-inset-bottom)) 24px' 
                                        : '16px 24px calc(34px + env(safe-area-inset-bottom)) 24px',
                                    color: '#f4f4f5',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxSizing: 'border-box',
                                    zIndex: 10,
                                    position: 'relative',
                                    cursor: 'pointer'
                                }}
                            >
                                {/* Floating Right Icon Group */}
                                <div style={{
                                    position: 'absolute',
                                    right: '12px',
                                    bottom: 'calc(100% + 16px)',
                                    zIndex: 30,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                        <button 
                                            onClick={(e) => handleLikeToggle(e, store)}
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '50%',
                                                background: likedMap[store.id] ? 'rgba(244, 63, 94, 0.2)' : 'rgba(0,0,0,0.6)',
                                                border: likedMap[store.id] ? '1.5px solid #f43f5e' : '1.5px solid rgba(255,255,255,0.3)',
                                                color: likedMap[store.id] ? '#f43f5e' : '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                backdropFilter: 'blur(10px)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Heart size={20} fill={likedMap[store.id] ? '#f43f5e' : 'none'} />
                                        </button>
                                        <span style={{ color: '#e4e4e7', fontSize: '0.62rem', fontWeight: 800 }}>{store.likeCount || 0}</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                        <button 
                                            onClick={(e) => handleContact(e, store)}
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)',
                                                border: '1.5px solid rgba(255,255,255,0.3)',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                backdropFilter: 'blur(10px)'
                                            }}
                                        >
                                            <Phone size={20} />
                                        </button>
                                        <span style={{ color: '#e4e4e7', fontSize: '0.62rem', fontWeight: 800 }}>문의하기</span>
                                    </div>



                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                        <button 
                                            onClick={(e) => handleShare(e, store)}
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)',
                                                border: '1.5px solid rgba(255,255,255,0.3)',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                backdropFilter: 'blur(10px)'
                                            }}
                                        >
                                            <Share2 size={20} />
                                        </button>
                                        <span style={{ color: '#e4e4e7', fontSize: '0.62rem', fontWeight: 800 }}>공유하기</span>
                                    </div>
                                </div>

                                <div style={{
                                    overflowY: 'hidden',
                                    flex: 1,
                                    paddingRight: '4px'
                                }} className="hide-scrollbar">
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '10px'
                                    }}>
                                        <span style={{
                                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                            color: '#fff',
                                            fontSize: '0.68rem',
                                            fontWeight: 900,
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Compass size={12} />
                                            {getTranslatedCategory(store.category)}
                                        </span>

                                        {store.location && (
                                            <span style={{
                                                background: 'rgba(255,255,255,0.08)',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                color: '#a1a1aa',
                                                fontSize: '0.68rem',
                                                fontWeight: 800,
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                            }}>
                                                <MapPin size={11} color="#a1a1aa" />
                                                {getTranslatedLocation(store.location)}
                                            </span>
                                        )}
                                    </div>

                                    <h2 style={{
                                        fontSize: '1.8rem',
                                        fontWeight: 950,
                                        margin: '0 0 6px 0',
                                        color: '#fde047',
                                        letterSpacing: '-0.8px',
                                        lineHeight: '1.2'
                                    }}>{getLocalizedString(store.name)}</h2>

                                    {store.slogan && (
                                        <p style={{
                                            fontSize: '1.1rem',
                                            color: '#e4e4e7',
                                            margin: '0 0 6px 0',
                                            fontWeight: 900,
                                            lineHeight: '1.4',
                                            fontFamily: "'Noto Serif KR', serif"
                                        }}>{getLocalizedString(store.slogan)}</p>
                                    )}

                                    {store.description && (
                                        <p style={{
                                            fontSize: '1.0rem',
                                            color: '#a1a1aa',
                                            margin: '0 0 12px 0',
                                            fontWeight: 500,
                                            lineHeight: '1.6',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {(() => {
                                                const rawDesc = getLocalizedString(store.description) || "";
                                                const cleanDesc = rawDesc
                                                    .replace(/<[^>]*>?/gm, '')
                                                    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')
                                                    .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '$1')
                                                    .replace(/[\*_~`#\-+>]/g, '')
                                                    .trim();
                                                return cleanDesc.length > 80 ? `${cleanDesc.substring(0, 80)}... ` : cleanDesc + " ";
                                            })()}
                                            <span style={{ color: '#f97316', textDecoration: 'underline', fontWeight: 700, cursor: 'pointer' }}>
                                                자세히보기
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {hasDiscount && (
                                    <div style={{
                                        background: 'linear-gradient(90deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.06) 100%)',
                                        border: '1px solid rgba(239,68,68,0.35)',
                                        borderRadius: '12px',
                                        padding: '10px 14px',
                                        color: '#fca5a5',
                                        fontSize: '0.85rem',
                                        fontWeight: 900,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginTop: '10px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Tag size={15} color="#ef4444" />
                                            <span>
                                                특별 혜택: <span style={{ fontSize: '1.05rem', color: '#ef4444', fontWeight: 950, marginLeft: '2px' }}>{getLocalizedString(store.discount)}</span>
                                            </span>
                                        </div>
                                        <button 
                                            onClick={(e) => handleUseCoupon(e, store)}
                                            style={{
                                                background: '#ef4444',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 16px',
                                                fontSize: '0.8rem',
                                                fontWeight: 950,
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            쿠폰사용
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>

            <UseCouponModal 
                isOpen={isCouponModalOpen}
                onClose={() => {
                    setIsCouponModalOpen(false);
                    setSelectedStore(null);
                    setSelectedCoupon(null);
                }}
                coupon={selectedCoupon}
                store={selectedStore}
            />

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
