'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
    Loader2, ChevronLeft, Heart, MessageSquare, Phone,
    Ticket, Eye, MapPin, Tag, Compass, Share2, Star, Sparkles, Navigation, X, ExternalLink
} from 'lucide-react';
import { StoreService } from '../../services/StoreService';
import { CouponService } from '../../services/CouponService';
import { useStoreHelpers } from '../../hooks/useStoreHelpers';
import UseCouponModal from '../../components/coupon/UseCouponModal';
import RenderWithShortcodes from '../../components/promo/RenderWithShortcodes';

// 1. 컴팩트하고 테크니컬한 오토플레이 비디오/유튜브 플레이어
const VideoPlayer = ({ url, isActive }) => {
    const iframeRef = useRef(null);

    let embedUrl = "";
    let isVertical = false;
    let isHorizontal = false;

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
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        );
    }

    let iframeStyle = { width: '100%', height: '100%', border: 'none', pointerEvents: 'none' };
    if (isVertical) {
        iframeStyle = {
            width: '100%',
            height: '177.78%',
            minHeight: '177.78%',
            border: 'none',
            pointerEvents: 'none',
            transform: 'scale(1.12)'
        };
    } else if (isHorizontal) {
        iframeStyle = {
            width: '177.78%',
            minWidth: '177.78%',
            height: '100%',
            border: 'none',
            pointerEvents: 'none',
            transform: 'scale(1.08)'
        };
    }

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <iframe
                ref={iframeRef}
                src={embedUrl}
                title="Feed Video"
                frameBorder="0"
                scrolling="no"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={iframeStyle}
            />
        </div>
    );
};

// 2. 비디오 미등록 시의 고급스러운 이미지 슬라이더 (Ken Burns 줌인 애니메이션 내장)
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
        if (!isActive) setCurrentIdx(0);
    }, [isActive]);

    useEffect(() => {
        if (images.length <= 1 || !isActive) return;
        const delay = currentIdx === 0 ? 3000 : 5000;
        const timer = setTimeout(() => {
            setCurrentIdx(prev => (prev + 1) % images.length);
        }, delay);
        return () => clearTimeout(timer);
    }, [images.length, isActive, currentIdx]);

    if (images.length === 0) return null;

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '75px', overflow: 'hidden', background: '#09090b' }}>
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentIdx}
                    src={images[currentIdx]}
                    alt={getLocalizedString(store.name)}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1.02, transition: { duration: 1.8, ease: "easeOut" } }}
                    exit={{ opacity: 0, scale: 1.0 }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </AnimatePresence>
        </div>
    );
};

// 3. 메인 V4 프리미엄 피드 페이지
export default function StoresV4Page({ initialStores = [] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { storeId } = useParams();
    const { i18n } = useTranslation();
    const { fixImageUrl, getLocalizedString, getTranslatedCategory, getTranslatedLocation } = useStoreHelpers();

    const [stores, setStores] = useState(initialStores);
    const [loading, setLoading] = useState(initialStores.length === 0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [likedMap, setLikedMap] = useState({});
    
    // 모달 및 바텀시트 상세 상태
    const [selectedStore, setSelectedStore] = useState(null);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [detailStore, setDetailStore] = useState(null);

    const containerRef = useRef(null);
    const touchStartY = useRef(0);

    // 100vh 대응 및 높이 동적 연산
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

    // 전체 가맹점 정보 획득
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
                    initialLikes[s.id] = localStorage.getItem(`liked_${s.id}`) === 'true';
                });
                setLikedMap(initialLikes);
            } catch (err) {
                console.error("V4 stores loading failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    // 딥링크 및 타겟 스토어 자동 스크롤
    const queryStoreId = searchParams.get('storeId') || searchParams.get('id');
    useEffect(() => {
        const targetStoreId = storeId || queryStoreId || sessionStorage.getItem('v4_last_store_id');
        if (loading || stores.length === 0 || !targetStoreId) return;

        const idx = stores.findIndex(s => s.id === targetStoreId || String(s.id) === String(targetStoreId));
        if (idx !== -1) {
            setActiveIndex(idx);
            sessionStorage.setItem('v4_last_store_id', String(targetStoreId));
            
            setTimeout(() => {
                if (containerRef.current) {
                    const clientHeight = containerRef.current.clientHeight;
                    containerRef.current.scrollTop = clientHeight * idx;
                }
            }, 300);
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
            if (currentStore) {
                sessionStorage.setItem('v4_last_store_id', String(currentStore.id));
            }
        }
    };

    // 좋아요 토글
    const handleLikeToggle = async (e, store) => {
        e.stopPropagation();
        const nextStatus = !likedMap[store.id];
        setLikedMap(prev => ({ ...prev, [store.id]: nextStatus }));

        try {
            await StoreService.toggleStoreLike(store.id, nextStatus);
            localStorage.setItem(`liked_${store.id}`, String(nextStatus));
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

    // 쿠폰 획득 모달 실행
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

    // 문의하기 연결
    const handleContact = (e, store) => {
        e.stopPropagation();
        if (store.kakaoId) {
            navigator.clipboard.writeText(store.kakaoId);
            alert(`카카오톡 ID가 클립보드에 복사되었습니다: ${store.kakaoId}\n카카오톡 1:1 문의 채널로 이동합니다.`);
            window.open("https://open.kakao.com/o/sBuie8fi", "_blank");
        } else if (store.phoneNumber || store.phone) {
            window.location.href = `tel:${store.phoneNumber || store.phone}`;
        } else {
            alert("등록된 연락처가 없습니다.");
        }
    };

    // 공유하기
    const handleShare = async (e, store) => {
        e.stopPropagation();
        const langPath = i18n.language && i18n.language !== 'ko' ? `/${i18n.language}` : '';
        const shareUrl = `${window.location.origin}${langPath}/v4/${store.id}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: getLocalizedString(store.name),
                    text: getLocalizedString(store.slogan) || '',
                    url: shareUrl,
                });
            } catch (err) {
                console.log("Share failed", err);
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

    // 고급지게 설계된 드래그 업(Swipe Up) 상세 바텀시트 토글
    const handleOpenDetailSheet = (e, store) => {
        e.stopPropagation();
        setDetailStore(store);
        setIsDetailSheetOpen(true);
    };

    if (loading) {
        return (
            <div style={{
                height: 'calc(var(--vh, 1vh) * 100)',
                width: '100vw',
                background: '#09090b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                color: '#a1a1aa'
            }}>
                <Loader2 className="animate-spin" size={36} color="#d4af37" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.15em', color: '#d4af37' }}>VINATONG PREMIUM</span>
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
            background: '#020204',
            overflow: 'hidden',
            fontFamily: "var(--font-base)"
        }}>
            {/* Top Minimalist Header */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
                pointerEvents: 'none'
            }}>
                <button 
                    onClick={() => router.push('/')}
                    style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        width: '38px',
                        height: '38px',
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
                <div style={{ color: '#d4af37', fontSize: '0.82rem', fontWeight: 950, letterSpacing: '0.25em', pointerEvents: 'auto' }}>
                    VINATONG
                </div>
                <div style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
                    <img 
                        src="/비나통_로고2.png" 
                        alt="VinaTong Logo" 
                        style={{ 
                            height: '28px', 
                            width: 'auto', 
                            objectFit: 'contain',
                            borderRadius: '4px',
                            opacity: 0.6
                        }} 
                    />
                </div>
            </div>

            {/* 메인 풀 스크린 피드 슬라이더 */}
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
                    WebkitOverflowScrolling: 'touch',
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
                                background: '#020204',
                                overflow: 'hidden'
                            }}
                        >
                            {/* 풀 스크린 비주얼 영역 (유튜브 비디오 또는 줌인 갤러리) */}
                            <div 
                                onClick={(e) => {
                                    // 유튜브 내부 컨트롤 클릭 등 방해 없이 빈 화면 클릭 시에만 활성화하기 위해
                                    // 비디오가 아니고 이미지 슬라이더인 경우 터치/클릭을 디테일 시트로 연결
                                    if (!videoUrl) {
                                        handleOpenDetailSheet(e, store);
                                    }
                                }}
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    position: 'absolute', 
                                    inset: 0, 
                                    zIndex: 1,
                                    cursor: !videoUrl ? 'pointer' : 'default'
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
                                
                                {/* 스토어카드 내부 상하단 어두운 그라디언트 오버레이 */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.92) 100%)',
                                    zIndex: 2,
                                    pointerEvents: 'none'
                                }} />
                            </div>

                            {/* 정보 및 오버레이 컴포넌트 콘텐츠 (글래스모피즘 미니멀 적용) */}
                            <div style={{
                                position: 'absolute',
                                bottom: 'calc(20px + env(safe-area-inset-bottom))',
                                left: '20px',
                                right: '76px', // 사이드바 버튼을 위한 여백 확보
                                zIndex: 10,
                                color: '#ffffff',
                                pointerEvents: 'auto'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <span style={{
                                        background: 'rgba(212, 175, 55, 0.15)',
                                        border: '1px solid rgba(212, 175, 55, 0.35)',
                                        color: '#d4af37',
                                        fontSize: '0.62rem',
                                        fontWeight: 900,
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {getTranslatedCategory(store.category)?.toUpperCase()}
                                    </span>
                                    {store.location && (
                                        <span style={{
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#d4d4d8',
                                            fontSize: '0.62rem',
                                            fontWeight: 800,
                                            padding: '2.5px 7px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2.5px'
                                        }}>
                                            <MapPin size={10} color="#d4d4d8" />
                                            {getTranslatedLocation(store.location)}
                                        </span>
                                    )}
                                </div>

                                <h2 
                                    onClick={(e) => handleOpenDetailSheet(e, store)}
                                    style={{
                                        fontSize: '1.9rem',
                                        fontWeight: 950,
                                        margin: '0 0 6px 0',
                                        color: '#ffffff',
                                        letterSpacing: '-0.8px',
                                        lineHeight: '1.15',
                                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {getLocalizedString(store.name)}
                                </h2>

                                {store.slogan && (
                                    <p 
                                        onClick={(e) => handleOpenDetailSheet(e, store)}
                                        style={{
                                            fontSize: '0.88rem',
                                            color: '#d4d4d8',
                                            margin: '0 0 10px 0',
                                            fontWeight: 700,
                                            lineHeight: '1.35',
                                            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                                            fontFamily: "'Pretendard', sans-serif",
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {getLocalizedString(store.slogan)}
                                    </p>
                                )}

                                {/* 설명구 드래그업 유도 텍스트 - 인라인 연결 */}
                                {store.description && (
                                    <div 
                                        onClick={(e) => handleOpenDetailSheet(e, store)}
                                        style={{
                                            fontSize: '0.82rem',
                                            color: 'rgba(255,255,255,0.6)',
                                            lineHeight: '1.45',
                                            cursor: 'pointer',
                                            marginTop: '6px',
                                            wordBreak: 'break-all',
                                            fontFamily: "'Pretendard', sans-serif"
                                        }}
                                    >
                                        {(() => {
                                            const rawDesc = getLocalizedString(store.description) || "";
                                            const cleanDesc = rawDesc
                                                .replace(/<[^>]*>?/gm, '')
                                                .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')
                                                .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '$1')
                                                .replace(/[\*_~`#\-+>]/g, '')
                                                .trim();
                                            const truncated = cleanDesc.length > 82 ? `${cleanDesc.substring(0, 82)}...` : cleanDesc;
                                            return (
                                                <>
                                                    <span>{truncated}</span>
                                                    <span style={{ color: '#d4af37', fontWeight: 800, marginLeft: '6px', whiteSpace: 'nowrap' }}>더보기</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* 고급 테크니컬 가로 쿠폰 태그 */}
                                {hasDiscount && (
                                    <div 
                                        onClick={(e) => handleUseCoupon(e, store)}
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.1) 100%)',
                                            border: '1.5px dashed rgba(239, 68, 68, 0.6)',
                                            borderRadius: '12px',
                                            padding: '12px 14px',
                                            color: '#ffffff',
                                            fontSize: '0.82rem',
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: '16px',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            cursor: 'pointer',
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                                            backdropFilter: 'blur(5px)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Ticket size={16} color="#ef4444" />
                                            <span>
                                                쿠폰받기: <span style={{ color: '#fca5a5', fontWeight: 950, marginLeft: '2px' }}>{getLocalizedString(store.discount)}</span>
                                            </span>
                                        </div>
                                        <span style={{ color: '#ef4444', fontWeight: 950, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>GET COUPON</span>
                                    </div>
                                )}
                            </div>

                            {/* 우측 사이드 퀵메뉴 플로팅 바 (틱톡/릴스 레이아웃 최적화) */}
                            <div style={{
                                position: 'absolute',
                                right: '16px',
                                bottom: 'calc(40px + env(safe-area-inset-bottom))',
                                zIndex: 30,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '18px'
                            }}>
                                {/* 프로필 아이콘 (더보기 트리거) */}
                                <div 
                                    onClick={(e) => handleOpenDetailSheet(e, store)}
                                    style={{
                                        width: '46px',
                                        height: '46px',
                                        borderRadius: '50%',
                                        border: '2px solid #d4af37',
                                        background: `url('${fixImageUrl(store.image)}') center/cover`,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: '#d4af37',
                                        color: '#000',
                                        borderRadius: '50%',
                                        width: '16px',
                                        height: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: 900
                                    }}>+</div>
                                </div>

                                {/* 좋아요 버튼 */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <button 
                                        onClick={(e) => handleLikeToggle(e, store)}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: likedMap[store.id] ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.06)',
                                            border: likedMap[store.id] ? '1.5px solid #f43f5e' : '1.5px solid rgba(255,255,255,0.15)',
                                            color: likedMap[store.id] ? '#f43f5e' : '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Heart size={21} fill={likedMap[store.id] ? '#f43f5e' : 'none'} />
                                    </button>
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.62rem', fontWeight: 800, marginTop: '2px' }}>{store.likeCount || 0}</span>
                                </div>

                                {/* 연락처 / 카톡 문의 */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <button 
                                        onClick={(e) => handleContact(e, store)}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1.5px solid rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        <Phone size={20} />
                                    </button>
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.62rem', fontWeight: 800, marginTop: '2px' }}>문의</span>
                                </div>

                                {/* 공유하기 */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <button 
                                        onClick={(e) => handleShare(e, store)}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1.5px solid rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        <Share2 size={20} />
                                    </button>
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.62rem', fontWeight: 800, marginTop: '2px' }}>공유</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 컴팩트 디테일 정보 드래그 업 바텀시트 */}
            <AnimatePresence>
                {isDetailSheetOpen && detailStore && (
                    <>
                        {/* 백드롭 레이어 */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDetailSheetOpen(false)}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                zIndex: 400,
                                backdropFilter: 'blur(4px)'
                            }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                maxHeight: '72vh',
                                minHeight: '42vh',
                                background: '#121214',
                                borderTopLeftRadius: '24px',
                                borderTopRightRadius: '24px',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                zIndex: 500,
                                padding: '24px 20px calc(24px + env(safe-area-inset-bottom)) 20px',
                                color: '#f4f4f5',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'visible'
                            }}
                        >
                            {/* 팝업창 밖 바로 위에 띄울 상호 정보 레이아웃 */}
                            <div style={{
                                position: 'absolute',
                                top: '-110px',
                                left: '20px',
                                right: '20px',
                                zIndex: 510,
                                pointerEvents: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                        background: 'rgba(212, 175, 55, 0.25)',
                                        border: '1px solid rgba(212, 175, 55, 0.5)',
                                        color: '#d4af37',
                                        fontSize: '0.62rem',
                                        fontWeight: 900,
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {getTranslatedCategory(detailStore.category)?.toUpperCase()}
                                    </span>
                                </div>
                                <h3 style={{ 
                                    fontSize: '1.9rem', 
                                    fontWeight: 950, 
                                    color: '#ffffff', 
                                    margin: 0,
                                    letterSpacing: '-0.8px',
                                    lineHeight: '1.15',
                                    textShadow: '0 2px 12px rgba(0,0,0,0.85)'
                                }}>
                                    {getLocalizedString(detailStore.name)}
                                </h3>
                                <p style={{ 
                                    fontSize: '0.88rem', 
                                    color: '#d4d4d8', 
                                    fontWeight: 700, 
                                    margin: 0,
                                    lineHeight: '1.35',
                                    textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                                    fontFamily: "'Pretendard', sans-serif"
                                }}>
                                    {getLocalizedString(detailStore.slogan)}
                                </p>
                            </div>

                            {/* 드래그 핸들바 */}
                            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 20px' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sparkles size={16} color="#d4af37" />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#d4af37', letterSpacing: '1px' }}>STORE PROFILE</span>
                                </div>
                                <button 
                                    onClick={() => setIsDetailSheetOpen(false)}
                                    style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', paddingBottom: '30px' }} className="hide-scrollbar">
                                    <div style={{ height: '4px' }} />
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

                                    {/* 텍스트 디테일 마크다운 소개 정보 */}
                                    {getLocalizedString(detailStore.description) ? (
                                        <div className="v4-markdown-dark" style={{ fontSize: '0.9rem', color: '#d4d4d8', lineHeight: '1.65', marginBottom: '24px' }}>
                                            <RenderWithShortcodes text={getLocalizedString(detailStore.description)} />
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.9rem', color: '#d4d4d8', lineHeight: '1.65', marginBottom: '24px' }}>
                                            등록된 업체 설명정보가 없습니다.
                                        </div>
                                    )}

                                    {/* 위치 및 연락처 추가 정보 블록 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {detailStore.address && (() => {
                                            const mapLink = detailStore.googleMapUrl || detailStore.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getLocalizedString(detailStore.address))}`;
                                            return (
                                                <div 
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'space-between',
                                                        gap: '12px', 
                                                        background: 'rgba(255,255,255,0.02)', 
                                                        padding: '12px 16px', 
                                                        borderRadius: '12px', 
                                                        border: '1px solid rgba(255,255,255,0.04)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                                        <MapPin size={16} color="#d4af37" style={{ flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.82rem', color: '#d4d4d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            <strong>위치 : </strong>{getLocalizedString(detailStore.address)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (mapLink) window.open(mapLink, '_blank');
                                                        }}
                                                        style={{
                                                            flexShrink: 0,
                                                            background: 'rgba(212, 175, 55, 0.15)',
                                                            border: '1px solid #d4af37',
                                                            color: '#d4af37',
                                                            borderRadius: '6px',
                                                            padding: '5px 10px',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 900,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        구글맵보기
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                        {(detailStore.phone || detailStore.phoneNumber) && (
                                            <a 
                                                href={`tel:${detailStore.phone || detailStore.phoneNumber}`}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '12px', 
                                                    background: 'rgba(255,255,255,0.02)', 
                                                    padding: '12px 16px', 
                                                    borderRadius: '12px', 
                                                    border: '1px solid rgba(255,255,255,0.04)',
                                                    textDecoration: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Phone size={16} color="#d4af37" />
                                                <span style={{ fontSize: '0.82rem', color: '#d4d4d8' }}>
                                                    <strong>문의 : </strong><span style={{ color: '#d4af37', textDecoration: 'underline' }}>{detailStore.phone || detailStore.phoneNumber}</span>
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {/* 하단 3줄 흐려지는(사라지는) 효과 적용 (스크롤 가능함을 암시) */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '40px',
                                    background: 'linear-gradient(to bottom, transparent, #121214)',
                                    pointerEvents: 'none',
                                    zIndex: 10
                                }} />
                            </div>

                            {/* 디테일 스토어 상세 홈페이지 연결 버튼 */}
                            <button
                                onClick={() => {
                                    setIsDetailSheetOpen(false);
                                    router.push(`/store/${detailStore.slug || detailStore.id}`);
                                }}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '16px',
                                    borderRadius: '14px',
                                    fontWeight: 950,
                                    fontSize: '0.92rem',
                                    marginTop: '20px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.25)'
                                }}
                            >
                                <ExternalLink size={16} /> 좀더 상세한 안내 보기
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                /* 마크다운 다크모드 대응 강제 오버라이드 */
                .v4-markdown-dark .promo-content-wrapper {
                    color: #d4d4d8 !important;
                    background: transparent !important;
                }
                .v4-markdown-dark .promo-content-block {
                    color: #d4d4d8 !important;
                    font-size: 0.9rem !important;
                }
                .v4-markdown-dark .promo-bold {
                    color: #ffffff !important;
                    font-weight: 800 !important;
                }
                .v4-markdown-dark h1, .v4-markdown-dark .promo-h1,
                .v4-markdown-dark h2, .v4-markdown-dark .promo-h2,
                .v4-markdown-dark h3, .v4-markdown-dark .promo-sub-title,
                .v4-markdown-dark h4, .v4-markdown-dark .promo-h4 {
                    color: #ffffff !important;
                    border-bottom-color: rgba(255,255,255,0.08) !important;
                }
                .v4-markdown-dark .promo-blockquote {
                    border-color: rgba(212, 175, 55, 0.3) !important;
                    border-left-color: #d4af37 !important;
                    background: rgba(212, 175, 55, 0.05) !important;
                    color: #d4af37 !important;
                }
                .v4-markdown-dark .promo-blockquote * {
                    color: #d4af37 !important;
                }
                .v4-markdown-dark .promo-callout-box {
                    background-color: #18181b !important;
                    border-color: #27272a !important;
                    color: #d4d4d8 !important;
                }
                .v4-markdown-dark .promo-li {
                    color: #d4d4d8 !important;
                }
                .v4-markdown-dark .promo-li::before {
                    color: #d4af37 !important;
                }
                .v4-markdown-dark .promo-tag {
                    background: rgba(212, 175, 55, 0.1) !important;
                    color: #d4af37 !important;
                    border-color: rgba(212, 175, 55, 0.2) !important;
                }
                .v4-markdown-dark .promo-link {
                    color: #6366f1 !important;
                }
            `}</style>
        </div>
    );
}
