"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStoreHelpers } from '../../hooks/useStoreHelpers';
import { useTranslation } from 'react-i18next';
import { playTickSound } from '../../utils/sound';

const CardThumbnail = ({ store, fixImageUrl, alt, index }) => {
    const imageUrl = React.useMemo(() => {
        const rawUrl = store.image || (store.images && store.images[0]) || '';
        return fixImageUrl(rawUrl);
    }, [store, fixImageUrl]);

    const isPriority = index < 4; // Prioritize top 4 above-the-fold images

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
            <img
                src={imageUrl}
                alt={alt}
                loading={isPriority ? undefined : "lazy"}
                fetchPriority={isPriority ? "high" : "low"}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'none !important',
                    transform: 'none !important',
                    pointerEvents: 'none'
                }}
            />
            {/* 상단/하단 은은한 검은색 그라디언트 오버레이 (가운데는 선명하게) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0) 80%, rgba(0, 0, 0, 0.45) 100%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />
        </div>
    );
};

const CompactStoreCard = ({ store, index }) => {
    const router = useRouter();
    const { getLocalizedString, fixImageUrl, getTranslatedLocation } = useStoreHelpers();
    const [windowWidth, setWindowWidth] = useState(375);
    const [isMounted, setIsMounted] = useState(false);
    const { i18n } = useTranslation();

    useEffect(() => {
        setIsMounted(true);
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            onClick={() => {
                // 웹 오디오 API를 사용하여 즉각적이고 리소스 과부하가 없는 효과음 재생
                playTickSound();

                const currentLang = i18n.language && i18n.language !== 'ko' ? `/${i18n.language}` : '';
                router.push(`${currentLang}/v4?storeId=${store.id}`);
            }}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
            {/* Thumbnail Container */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: 0,
                paddingBottom: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#f1f5f9'
            }}>
                <CardThumbnail
                    store={store}
                    index={index}
                    fixImageUrl={fixImageUrl}
                    alt={getLocalizedString(store.name)}
                />

                {/* Caption overlay */}
                {store.caption && (
                    <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '0',
                        right: '0',
                        textAlign: 'center',
                        zIndex: 1,
                        pointerEvents: 'none',
                        padding: '0 8px'
                    }}>
                        <span 
                            className="caption-overlay-text"
                            style={{
                                display: 'inline',
                                background: 'rgba(0, 0, 0, 0.65)',
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '4px',
                                boxDecorationBreak: 'clone',
                                WebkitBoxDecorationBreak: 'clone',
                                letterSpacing: '-0.3px',
                                lineHeight: 1.2,
                                wordBreak: 'keep-all'
                            }}
                        >
                            {getLocalizedString(store.caption)}
                        </span>
                        <style>{`
                            @media (min-width: 768px) {
                                .caption-overlay-text {
                                    font-size: 0.8rem !important;
                                }
                            }
                        `}</style>
                    </div>
                )}

                {/* Discount Badge */}
                {store.discount && (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '4px 8px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.35)',
                        zIndex: 2,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        letterSpacing: '-0.3px',
                        fontFamily: "'Inter', sans-serif"
                    }}>
                        {getLocalizedString(store.discount)}
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '2px', minHeight: '65px', justifyContent: 'flex-start' }}>
                <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#6366f1',
                    height: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textTransform: 'uppercase'
                }}>
                    <span>{store.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#94a3b8' }}>
                        <MapPin size={10} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                            {getTranslatedLocation(store.location)}
                        </span>
                    </div>
                </div>
                <h3 style={{
                    fontSize: (!isMounted || windowWidth < 768) ? '1.0rem' : '1.2rem', fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.5px',
                    lineHeight: '1.2', height: '1.2em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                    {getLocalizedString(store.name)}
                </h3>
                <p style={{
                    fontSize: '0.8rem', color: '#64748b', fontWeight: 700, margin: 0,
                    lineHeight: '1.2', height: '1.1em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                    {getLocalizedString(store.slogan) || ' '}
                </p>
            </div>
        </div>
    );
};

export default CompactStoreCard;
