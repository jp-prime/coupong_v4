'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
    Phone, 
    MessageCircle, 
    MessageSquare, 
    MapPin, 
    Clock, 
    Instagram, 
    Facebook, 
    Youtube,
    Menu as MenuIcon,
    ChevronUp,
    ExternalLink,
    Mail,
    Share2,
    ArrowRight,
    Settings,
    Edit3,
    Maximize2,
    Ticket,
    Sparkles,
    Calendar,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { StoreService } from '../../../services/StoreService';
import { useStoreHelpers } from '../../../hooks/useStoreHelpers';
import { useAuth } from '../../../context/AuthContext';
import RenderWithShortcodes from '../../../components/promo/RenderWithShortcodes';

export default function PremiumMiniHome() {
    const params = useParams();
    const storeId = params?.id;
    const router = useRouter();
    const { user } = useAuth();
    
    // Check if the current user is admin
    const isAdmin = user && (user.role === 'admin' || user.email === 'btmt20@naver.com' || user.email === 'vip@coupong.online');

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
    const [slideProgress, setSlideProgress] = useState(0);
    const [wpContent, setWpContent] = useState('');
    const [wpLoading, setWpLoading] = useState(false);
    const [wpError, setWpError] = useState(null);
    const thumbnailRefs = useRef([]);
    const carouselContainerRef = useRef(null);
    const { getLocalizedString, getTranslatedLocation, fixImageUrl } = useStoreHelpers();
    
    // Parallax & Scroll Effects
    const containerRef = useRef(null);
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 180]);
    const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.4]);
    const contentY = useTransform(scrollY, [0, 500], [0, -50]);

    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setIsHeaderScrolled(window.scrollY > 80);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchWordPressContent = useCallback(async (url) => {
        if (!url) return;
        setWpLoading(true);
        setWpError(null);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 seconds timeout
        
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
                let rawHtml = posts[0].content?.rendered || '';
                let cleanHtml = rawHtml
                    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
                    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
                setWpContent(cleanHtml);
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

    useEffect(() => {
        const fetchStore = async () => {
            try {
                // Try fetching by slug or ID
                let data = await StoreService.getStoreById(storeId);
                if (!data || !data.name || data.name === "이름 없음") {
                    data = await StoreService.getStoreBySlug(storeId);
                }
                
                if (data) {
                    setStore(data);
                    // Increment views
                    StoreService.incrementStoreView(data.id || storeId);
                    
                    // Fetch WordPress content if mapped
                    if (data.wordpressUrl) {
                        fetchWordPressContent(data.wordpressUrl);
                    } else {
                        setWpContent('');
                    }
                }
            } catch (error) {
                console.error("Error fetching store:", error);
            } finally {
                setLoading(false);
            }
        };
        if (storeId) fetchStore();
    }, [storeId, fetchWordPressContent]);

    // Force allow copy/drag inside WordPress container
    useEffect(() => {
        if (!wpLoading && wpContent) {
            const timer = setTimeout(() => {
                const container = document.querySelector('.wordpress-embed-content');
                if (container) {
                    container.style.userSelect = 'text';
                    container.style.webkitUserSelect = 'text';
                    container.onselectstart = null;
                    container.oncopy = null;
                    container.oncontextmenu = null;
                    container.onmousedown = null;

                    const stopPropagation = (e) => {
                        e.stopPropagation();
                    };

                    const preventDeselectEvents = [
                        'contextmenu', 
                        'keydown', 
                        'keyup', 
                        'copy'
                    ];

                    preventDeselectEvents.forEach(evt => {
                        container.addEventListener(evt, stopPropagation, { capture: true });
                    });

                    const allChildren = container.querySelectorAll('*');
                    allChildren.forEach(el => {
                        el.style.userSelect = 'text';
                        el.style.webkitUserSelect = 'text';
                        el.onselectstart = null;
                        el.oncopy = null;
                        el.oncontextmenu = null;
                        el.onmousedown = null;
                        
                        if (window.getComputedStyle(el).pointerEvents === 'none') {
                            el.style.pointerEvents = 'auto';
                        }
                    });
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [wpContent, wpLoading]);

    const getGalleryArray = () => {
        if (!store?.gallery) return [];
        try {
            const arr = typeof store.gallery === 'string' ? JSON.parse(store.gallery) : store.gallery;
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    };
    const galleryArray = getGalleryArray();
    
    useEffect(() => {
        thumbnailRefs.current = thumbnailRefs.current.slice(0, galleryArray.length);
    }, [galleryArray]);

    // Scroll active thumbnail to viewport center
    useEffect(() => {
        const container = carouselContainerRef.current;
        const thumbnail = thumbnailRefs.current[selectedGalleryIndex];
        
        if (container && thumbnail) {
            const containerWidth = container.clientWidth;
            const thumbnailWidth = thumbnail.clientWidth;
            const thumbnailLeft = thumbnail.offsetLeft;
            
            const targetScrollLeft = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2);
            
            container.scrollTo({
                left: targetScrollLeft,
                behavior: 'smooth'
            });
        }
    }, [selectedGalleryIndex]);

    useEffect(() => {
        if (galleryArray.length < 2) return;
        const SLIDE_DURATION = 7000;
        const UPDATE_INTERVAL = 50;
        const mainTimer = setInterval(() => {
            setSelectedGalleryIndex(prev => (prev + 1) % galleryArray.length);
            setSlideProgress(0);
        }, SLIDE_DURATION);
        const progressTimer = setInterval(() => {
            setSlideProgress(prev => Math.min(prev + (UPDATE_INTERVAL / SLIDE_DURATION) * 100, 100));
        }, UPDATE_INTERVAL);
        return () => { clearInterval(mainTimer); clearInterval(progressTimer); };
    }, [galleryArray.length]);

    if (loading) return (
        <div style={{ height: '100vh', background: '#020408', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
                animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ width: '48px', height: '48px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTop: '2px solid #d4af37', borderRadius: '50%' }} 
            />
            <div style={{ marginTop: '24px', color: '#d4af37', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.2em' }}>LOADING EXPERIENCE</div>
        </div>
    );

    if (!store) return (
        <div style={{ height: '100vh', background: '#020408', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
            <Settings size={64} style={{ opacity: 0.1, color: '#d4af37' }} />
            <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>정보를 불러올 수 없습니다</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>존재하지 않는 페이지이거나 일시적인 오류입니다.</p>
            </div>
            <button onClick={() => router.push('/')} style={{ padding: '14px 32px', borderRadius: '18px', background: '#d4af37', color: '#000', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '0.95rem' }}>
                홈으로 돌아가기
            </button>
        </div>
    );

    const activeButtons = [];
    if (store.phoneNumber) activeButtons.push({ id: 'phone', label: 'CALL', color: 'linear-gradient(135deg, #059669, #10b981)', icon: Phone, url: `tel:${store.phoneNumber}` });
    activeButtons.unshift({ id: 'store', label: 'OFFER', color: 'linear-gradient(135deg, #d4af37, #997d26)', icon: Ticket, url: `/store/${store.id}`, textColor: '#000' });

    const menu = Array.isArray(store.menu) ? store.menu : [];

    return (
        <div style={{ 
            backgroundColor: '#020408', 
            color: '#e2e8f0', 
            overflowX: 'hidden', 
            minHeight: '100vh', 
            paddingBottom: '140px', 
            fontFamily: "var(--font-base)",
            userSelect: 'text',
            WebkitUserSelect: 'text'
        }}>
            {/* Refined Store Header */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, height: isHeaderScrolled ? '60px' : '80px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 1000,
                background: isHeaderScrolled ? 'rgba(2, 4, 8, 0.8)' : 'transparent',
                backdropFilter: isHeaderScrolled ? 'blur(20px)' : 'none', 
                borderBottom: isHeaderScrolled ? '1px solid rgba(212, 175, 55, 0.1)' : 'none', 
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.02em', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                    <div style={{ width: '20px', height: '1px', background: '#d4af37' }} />
                    {getLocalizedString(store.name)?.toUpperCase()}
                </motion.div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div 
                        onClick={() => router.push(`/store/${store.id}`)}
                        style={{ padding: '6px 14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#d4af37', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    >
                        스토어 상세가기
                    </div>
                </div>
            </header>

            {/* Compact Cinematic Hero */}
            <section style={{ position: 'relative', width: '100%', height: '75vh', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={selectedGalleryIndex} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        transition={{ duration: 1.5, ease: "easeOut" }} 
                        style={{ 
                            position: 'absolute', inset: 0, 
                            backgroundImage: `url(${fixImageUrl(galleryArray[selectedGalleryIndex]?.url || galleryArray[selectedGalleryIndex] || store.image)})`, 
                            backgroundSize: 'cover', backgroundPosition: 'center', 
                            y: heroY, scale: heroScale
                        }}
                    >
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,4,8,0.4) 0%, rgba(2,4,8,0.1) 50%, rgba(2,4,8,0.95) 100%)' }} />
                    </motion.div>
                </AnimatePresence>

                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 24px 100px', zIndex: 10 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '4px', background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37', fontSize: '0.65rem', fontWeight: 800, border: '1px solid rgba(212, 175, 55, 0.2)', marginBottom: '16px', letterSpacing: '0.1em' }}>
                            {store.category?.toUpperCase() || 'PREMIUM'}
                        </div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1.1, margin: '0 0 12px 0', color: '#fff', letterSpacing: '-0.03em' }}>
                            {getLocalizedString(store.name)}
                        </h1>
                        <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.7)', fontWeight: 400, maxWidth: '80%', lineHeight: 1.5 }}>
                            {getLocalizedString(store.slogan)}
                        </p>
                    </motion.div>
                </div>

                {/* Refined Hero Indicators */}
                <div style={{ position: 'absolute', bottom: '40px', left: '24px', right: '24px', zIndex: 20 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d4af37' }}>{selectedGalleryIndex + 1}</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>/ {galleryArray.length}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {galleryArray.map((_, i) => (
                                <div key={i} style={{ width: i === selectedGalleryIndex ? '24px' : '4px', height: '4px', borderRadius: '2px', background: i === selectedGalleryIndex ? '#d4af37' : 'rgba(255,255,255,0.15)', transition: 'all 0.5s ease' }} />
                            ))}
                        </div>
                     </div>
                     <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div animate={{ width: `${slideProgress}%` }} style={{ height: '100%', background: 'rgba(212, 175, 55, 0.5)' }} />
                     </div>
                </div>
            </section>

            {/* Compact Content Section */}
            <motion.div style={{ y: contentY, padding: '0 5px', position: 'relative', zIndex: 50, marginTop: '-50px' }}>
                {/* Mini Thumbnail Carousel */}
                {galleryArray.length > 0 && (
                    <div 
                        ref={carouselContainerRef}
                        style={{ 
                            width: 'calc(100% + 10px)', 
                            marginLeft: '-5px',
                            marginRight: '-5px',
                            padding: '12px 5px', 
                            background: 'rgba(2, 4, 8, 0.95)', 
                            borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
                            overflowX: 'auto',
                            whiteSpace: 'nowrap',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            marginBottom: '32px',
                            marginTop: '0px'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content', padding: '0 20px' }}>
                            {galleryArray.map((img, idx) => {
                                const isActive = idx === selectedGalleryIndex;
                                return (
                                    <div
                                        key={idx}
                                        ref={el => thumbnailRefs.current[idx] = el}
                                        onClick={() => {
                                            setSelectedGalleryIndex(idx);
                                            setSlideProgress(0);
                                        }}
                                        style={{
                                            width: 'calc((100vw - 72px) / 5)',
                                            maxWidth: '80px',
                                            aspectRatio: '1',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            border: isActive ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.1)',
                                            opacity: isActive ? 1 : 0.4,
                                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                            flexShrink: 0
                                        }}
                                    >
                                        <img 
                                            src={fixImageUrl(img?.url || img)} 
                                            alt="" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Identity & Details - Compact Side-by-Side */}
                <section className="about-details-grid" style={{ paddingBottom: '60px' }}>
                    
                    {/* Compact About / WordPress Embed */}
                    <div className="wordpress-embed-content-wrapper" style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: '27px', 
                        borderRadius: '24px', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        overflow: 'hidden'
                    }}>
                        <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: '#d4af37', letterSpacing: '0.2em', marginBottom: '16px' }}>
                            {wpContent ? 'PREVIEW STORY' : 'PHILOSOPHY'}
                        </label>
                        
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 16px 0', color: '#555', lineHeight: 1.3 }}>
                            Premium Experience<br/>Curated for You.
                        </h3>
                        
                        <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(212, 175, 55, 0.3) 0%, rgba(255, 255, 255, 0.03) 100%)', margin: '20px 0 24px 0' }} />
                        
                        {wpLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: 'inline-block' }}>
                                    <Loader2 size={20} color="#d4af37" />
                                </motion.div>
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>상세 소개를 불러오는 중...</span>
                            </div>
                        ) : wpContent ? (
                            <div 
                                className="wordpress-embed-content" 
                                dangerouslySetInnerHTML={{ __html: wpContent }} 
                                onContextMenu={(e) => e.stopPropagation()}
                                onCopy={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                onKeyUp={(e) => e.stopPropagation()}
                                style={{ 
                                    fontSize: '0.9rem', 
                                    lineHeight: 1.7, 
                                    color: 'rgba(255,255,255,0.7)',
                                    fontWeight: 400
                                }}
                            />
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 400, margin: 0 }}>
                                <RenderWithShortcodes 
                                    text={getLocalizedString(store.storeDescription) || '최상의 서비스를 제공하기 위해 노력하고 있습니다.'}
                                    navigate={(path) => router.push(path)}
                                    postImgs={galleryArray.map(img => fixImageUrl(img?.url || img))}
                                />
                            </div>
                        )}
                    </div>

                    {/* Compact Contact Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { icon: Clock, label: 'HOURS', value: getLocalizedString(store.businessHours) || '상시 운영' }, 
                            { icon: MapPin, label: 'LOCATION', value: getLocalizedString(store.address) },
                            { icon: Phone, label: 'CONTACT', value: store.phoneNumber || '전화 문의' }
                        ].map((info, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.015)', padding: '11px 15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ color: '#d4af37', opacity: 0.8 }}><info.icon size={18} /></div>
                                <div>
                                    <h4 style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0', fontWeight: 800, letterSpacing: '0.05em' }}>{info.label}</h4>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{info.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Specialties / Menu - More Compact List */}
                {menu.length > 0 && (
                    <section style={{ marginBottom: '32px' }}>
                        <div style={{ 
                            background: 'rgba(255,255,255,0.02)', 
                            padding: '16px 20px', 
                            borderRadius: '16px', 
                            border: '1px solid rgba(255,255,255,0.05)',
                            marginBottom: '20px'
                        }}>
                            <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: '#d4af37', letterSpacing: '0.2em', marginBottom: '4px' }}>COLLECTIONS</label>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#555' }}>Signatures</h2>
                        </div>
                        <div className="premium-menu-grid">
                            {menu.map((item, idx) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '9px 13px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{item.name}</div>
                                        {item.description && (
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginTop: '2px', wordBreak: 'break-all' }}>{item.description}</div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#d4af37', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.price}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Minimal Map */}
                {store.mapIframeUrl && (
                    <section style={{ paddingBottom: '100px' }}>
                        <div style={{ width: '100%', height: '240px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', opacity: 0.8 }}>
                            <iframe 
                                title="map" 
                                src={(() => { const url = store.mapIframeUrl; if (url.includes('<iframe')) { const match = url.match(/src="([^"]+)"/); return match ? match[1] : url; } return url; })()} 
                                width="100%" height="100%" 
                                style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} 
                                allowFullScreen="" loading="lazy" 
                            />
                        </div>
                    </section>
                )}

                <footer style={{ paddingBottom: '80px', textAlign: 'center' }}>
                    <div style={{ width: '24px', height: '1px', background: 'rgba(212, 175, 55, 0.3)', margin: '0 auto 24px auto' }} />
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '4px', letterSpacing: '-0.02em' }}>{getLocalizedString(store.name)}</div>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(212, 175, 55, 0.5)', fontWeight: 800, letterSpacing: '0.2em' }}>CURATED EXPERIENCE</div>
                </footer>
            </motion.div>

            <style jsx global>{`
                * { -webkit-tap-highlight-color: transparent; }
                body { background-color: #020408 !important; }
                
                /* Details responsive layout */
                .about-details-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 32px;
                }
                @media (min-width: 1025px) {
                    .about-details-grid {
                        grid-template-columns: 1.5fr 1fr;
                    }
                }
                
                /* Signature Menu responsive grid */
                .premium-menu-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                @media (min-width: 769px) {
                    .premium-menu-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
                
                /* Global select forced text */
                html, body, #root, .app-container {
                    user-select: text !important;
                    -webkit-user-select: text !important;
                }

                /* Dark theme wordpress & markdown embedded styling */
                .wordpress-embed-content {
                    color: rgba(255, 255, 255, 0.75) !important;
                    font-size: 0.92rem;
                    line-height: 1.8;
                }
                .wordpress-embed-content, 
                .wordpress-embed-content * {
                    user-select: text !important;
                    -webkit-user-select: text !important;
                }
                .wordpress-embed-content p, 
                .wordpress-embed-content span, 
                .wordpress-embed-content div, 
                .wordpress-embed-content li {
                    color: rgba(255, 255, 255, 0.75) !important;
                }
                .wordpress-embed-content h1, 
                .wordpress-embed-content h2, 
                .wordpress-embed-content h3, 
                .wordpress-embed-content h4, 
                .wordpress-embed-content h5, 
                .wordpress-embed-content h6 {
                    color: #ffffff !important;
                    font-weight: 800;
                    margin-top: 24px;
                    margin-bottom: 12px;
                    letter-spacing: -0.01em;
                }
                .wordpress-embed-content img {
                    max-width: 100% !important;
                    height: auto !important;
                    border-radius: 16px;
                    margin: 16px 0;
                    display: block;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .wordpress-embed-content table {
                    width: 100% !important;
                    border-collapse: collapse;
                    margin: 16px 0;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .wordpress-embed-content th, 
                .wordpress-embed-content td {
                    padding: 10px 12px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.7) !important;
                    font-size: 0.85rem;
                }
                .wordpress-embed-content th {
                    background: rgba(255, 255, 255, 0.05);
                    font-weight: 700;
                }
                .wordpress-embed-content iframe {
                    max-width: 100% !important;
                    border-radius: 12px;
                    border: none;
                }

                /* 🟢 Markdown 렌더러 컬러 다크모드 대응 강제 오버라이드 */
                .wordpress-embed-content-wrapper .promo-content-wrapper,
                .wordpress-embed-content-wrapper .promo-content-block,
                .wordpress-embed-content-wrapper .promo-bold,
                .wordpress-embed-content-wrapper .promo-li {
                    color: rgba(255, 255, 255, 0.55) !important;
                }
                .wordpress-embed-content-wrapper .promo-content-wrapper h1,
                .wordpress-embed-content-wrapper .promo-content-wrapper h2,
                .wordpress-embed-content-wrapper .promo-content-wrapper h3,
                .wordpress-embed-content-wrapper .promo-content-wrapper h4,
                .wordpress-embed-content-wrapper .promo-h1,
                .wordpress-embed-content-wrapper .promo-h2,
                .wordpress-embed-content-wrapper .promo-sub-title {
                    color: #ffffff !important;
                }
                .wordpress-embed-content-wrapper .promo-blockquote {
                    border-left: 3.5px solid #d4af37 !important;
                    background: rgba(212, 175, 55, 0.08) !important;
                    border-color: rgba(212, 175, 55, 0.25) !important;
                }
                .wordpress-embed-content-wrapper .promo-blockquote,
                .wordpress-embed-content-wrapper .promo-blockquote * {
                    color: #d4af37 !important;
                }
                .wordpress-embed-content-wrapper .promo-callout-box {
                    background-color: rgba(255, 255, 255, 0.02) !important;
                    border: 1px solid rgba(255, 255, 255, 0.06) !important;
                    color: rgba(255, 255, 255, 0.8) !important;
                }
                .wordpress-embed-content-wrapper .promo-hr {
                    border-color: rgba(255, 255, 255, 0.08) !important;
                }
            `}</style>
        </div>
    );
}
