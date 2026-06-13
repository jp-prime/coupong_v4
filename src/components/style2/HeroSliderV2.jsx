"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, X, Image, Type, AlignLeft, Tag as TagIcon, Save, Loader2, MessageCircle, ChevronDown, Store as StoreIcon, Ticket, Phone, ExternalLink, Zap, Star, Heart, Info, Palette, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SettingsService } from '../../services/SettingsService';
import { SanityService } from '../../services/SanityService';
import { playTickSound } from '../../utils/sound';

const DEFAULT_BANNERS = [
    {
        id: 'default_notice',
        title: '비나통 VinaTong',
        caption: '베트남 여행은 비나통으로 통한다! 우리동네 맛집부터 핫플레스까지, 쿠폰으로 더욱 특별하게 즐기세요. 지금 무료 입점신청하세요',
        tag: 'NOTICE',
        buttonText: '입점신청',
        buttonLink: '/partner-apply',
        buttonIcon: 'LayoutGrid',
        buttonBgColor: '#6366f1',
        buttonTextColor: '#ffffff',
        image: ''
    }
];

const ICON_OPTIONS = [
    { name: '없음', value: '' },
    { name: '상점', value: 'Store' },
    { name: '쿠폰', value: 'Ticket' },
    { name: '메시지', value: 'MessageCircle' },
    { name: '전화', value: 'Phone' },
    { name: '외부링크', value: 'ExternalLink' },
    { name: '번개', value: 'Zap' },
    { name: '별', value: 'Star' },
    { name: '하트', value: 'Heart' },
    { name: '정보', value: 'Info' }
];

const ICON_COMPONENTS = {
    Store: <StoreIcon size={18} />,
    Ticket: <Ticket size={18} />,
    MessageCircle: <MessageCircle size={18} />,
    Phone: <Phone size={18} />,
    ExternalLink: <ExternalLink size={18} />,
    Zap: <Zap size={18} />,
    Star: <Star size={18} />,
    Heart: <Heart size={18} />,
    Info: <Info size={18} />
};

const HeroSliderV2 = ({ isAdmin, searchQuery, setSearchQuery, isMerged = false }) => {
    const router = useRouter();
    const [currentIdx, setCurrentIdx] = useState(0);
    const [windowWidth, setWindowWidth] = useState(375);
    const [banners, setBanners] = useState(DEFAULT_BANNERS);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 배너 데이터 로딩 (Sanity 우선, 없으면 Firebase)
    useEffect(() => {
        let unsubscribe = () => {};
        const loadBanners = async () => {
            try {
                const sanityBanners = await SanityService.getMainBanners();
                if (sanityBanners && sanityBanners.length > 0) {
                    setBanners(sanityBanners);
                } else {
                    unsubscribe = SettingsService.subscribe((settings) => {
                        if (settings?.banners && settings.banners.length > 0) {
                            setBanners(settings.banners);
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to fetch Sanity main banners:", err);
                unsubscribe = SettingsService.subscribe((settings) => {
                    if (settings?.banners && settings.banners.length > 0) {
                        setBanners(settings.banners);
                    }
                });
            }
        };

        loadBanners();
        return () => unsubscribe();
    }, []);

    const validBanners = React.useMemo(() => {
        return banners.filter(b => 
            (b.image && b.image.trim().length > 0) || 
            (b.videoUrl && b.videoUrl.trim().length > 0) ||
            (b.videoFile && b.videoFile.trim().length > 0) ||
            (b.title && b.title.trim().length > 0)
        );
    }, [banners]);

    useEffect(() => {
        // 추천업체 텍스트 자동 움직임(롤링)을 완전히 정지하기 위해 타이머 작동을 주석 처리/제거합니다.
        /*
        if (validBanners.length <= 1 || isEditModalOpen) return;
        const timer = setInterval(() => {
            setCurrentIdx(prev => (prev + 1) % validBanners.length);
        }, 5000);
        return () => clearInterval(timer);
        */
    }, [validBanners.length, isEditModalOpen]);

    const openEditModal = () => {
        setEditForm([...banners]);
        setIsEditModalOpen(true);
    };

    const handleFieldChange = (idx, field, value) => {
        const newForm = [...editForm];
        newForm[idx] = { ...newForm[idx], [field]: value };
        setEditForm(newForm);
    };

    const handleAddBanner = () => {
        const newBanner = {
            id: Date.now(),
            image: '',
            videoUrl: '',
            title: '새 배너 제목',
            caption: '배너 설명을 입력하세요.',
            tag: 'NEW',
            buttonText: '바로가기',
            buttonLink: ''
        };
        setEditForm([...editForm, newBanner]);
    };

    const handleRemoveBanner = (idx) => {
        if (editForm.length <= 1) {
            alert("최소 1개의 배너는 유지해야 합니다.");
            return;
        }
        setEditForm(editForm.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await SettingsService.updateSettings({ banners: editForm });
            setBanners(editForm);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Failed to save banners:", error);
            alert("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const currentBanner = validBanners[currentIdx] || validBanners[0];

    if (validBanners.length === 0 && !isAdmin) return null;

    const renderInnerContent = () => (
        <>
            {/* Sliding Text Area */}
            <div style={{ zIndex: 2, position: 'relative', minHeight: '52px', height: 'auto', overflow: 'visible', marginTop: isMerged ? '8px' : '0px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        style={{ display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {currentBanner?.tag && currentBanner.tag.trim() !== '' && (
                                <span style={{ 
                                    fontSize: '0.62rem', 
                                    fontWeight: 900, 
                                    color: '#ffffff',
                                    background: 'rgba(99, 102, 241, 0.85)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    letterSpacing: '0.3px',
                                    textTransform: 'uppercase'
                                }}>
                                    {currentBanner.tag}
                                </span>
                            )}
                            <h2 style={{ 
                                fontSize: '0.95rem', 
                                fontWeight: 900, 
                                color: '#ffffff', 
                                margin: 0,
                                letterSpacing: '-0.3px',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                            }}>
                                {currentBanner?.title}
                            </h2>
                        </div>
                        <p style={{ 
                            fontSize: '0.85rem', 
                            color: '#cbd5e1', 
                            margin: '4px 0 0 0',
                            fontWeight: 600,
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.4'
                        }}>
                            {currentBanner?.caption}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Banner Action Button */}
            {(currentBanner?.buttonText || currentBanner?.buttonLink) && (
                <div style={{ zIndex: 2, position: 'relative', display: 'flex', marginTop: '2px', marginBottom: '2px' }}>
                    <button
                        onClick={() => {
                            playTickSound();
                            const link = currentBanner?.buttonLink || 'https://open.kakao.com/o/sBuie8fi';
                            if (link.startsWith('http')) {
                                window.open(link, '_blank');
                            } else {
                                router.push(link);
                            }
                        }}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: currentBanner?.buttonBgColor || '#6366f1',
                            color: currentBanner?.buttonTextColor || '#ffffff',
                            border: 'none',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '0.72rem',
                            width: 'fit-content',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {currentBanner?.buttonIcon && ICON_COMPONENTS[currentBanner.buttonIcon]}
                        {currentBanner?.buttonText || '자세히 보기'}
                    </button>
                </div>
            )}

            {/* Integrated Search Bar & Category Menu */}
            <div style={{ zIndex: 2, position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} />
                    </div>
                    <input 
                        type="text"
                        placeholder="할인 업소를 찾아보세요! (맛집,이발소,마사지....)"
                        value={searchQuery || ''}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#ffffff',
                            fontSize: '0.85rem',
                            fontWeight: 750,
                            outline: 'none',
                            color: '#0f172a',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Categories */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'clamp(8px, 2.5vw, 20px)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#e2e8f0',
                    flexWrap: 'nowrap',
                    padding: '4px 0',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }} className="hide-scrollbar">
                    {[
                        { id: 'all', name: '전체' },
                        { id: 'restaurant', name: '맛집' },
                        { id: 'massage', name: '마사지' },
                        { id: 'barber', name: '이발소' },
                        { id: 'nightlife', name: '유흥' },
                        { id: 'ads', name: '입점신청', isSpecial: true }
                    ].map((cat, i, arr) => (
                        <React.Fragment key={cat.id}>
                             <span 
                                onClick={() => {
                                    playTickSound();
                                    if (cat.id === 'v3') {
                                        router.push('/v3');
                                    } else if (cat.id === 'ads') {
                                        router.push('/partner-apply');
                                    } else if (cat.id === 'all') {
                                        setSearchQuery('');
                                    } else {
                                        setSearchQuery(cat.name);
                                    }
                                }}
                                style={{
                                    cursor: 'pointer',
                                    color: cat.isSpecial ? '#f43f5e' : (
                                        (cat.id === 'all' && !searchQuery) || searchQuery === cat.name ? '#fde047' : '#e2e8f0'
                                    ),
                                    transition: 'color 0.2s',
                                    padding: '4px clamp(2px, 0.6vw, 6px)',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#fde047'}
                                onMouseLeave={(e) => e.target.style.color = cat.isSpecial ? '#f43f5e' : (
                                    (cat.id === 'all' && !searchQuery) || searchQuery === cat.name ? '#fde047' : '#e2e8f0'
                                )}
                            >
                                {cat.name}
                            </span>
                            {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, marginLeft: 'clamp(1px, 0.2vw, 3px)', marginRight: 'clamp(1px, 0.2vw, 3px)' }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Edit Button for Admin */}
            {isAdmin && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                    <button 
                        onClick={openEditModal} 
                        style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '8px', 
                            background: 'rgba(0,0,0,0.5)', 
                            color: 'white', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer' 
                        }}
                    >
                        <Edit3 size={14} />
                    </button>
                </div>
            )}
        </>
    );

    if (isMerged) {
        return (
            <div style={{
                position: 'relative',
                width: '100%',
                background: 'transparent',
                borderRadius: '0 0 28px 28px',
                padding: '8px 20px 16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxSizing: 'border-box'
            }}>
                {renderInnerContent()}

                <AnimatePresence>
                    {isEditModalOpen && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', padding: '20px' }}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', background: 'white', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0 }}>메인 배너 관리</h3>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>이미지가 없는 배너는 자동으로 숨겨집니다.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={handleAddBanner} style={{ padding: '8px 12px', borderRadius: '8px', background: '#6366f1', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            + 새 배너 추가
                                        </button>
                                        <button onClick={() => setIsEditModalOpen(false)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: '8px', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                                    </div>
                                </div>
                                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                                    {editForm.map((item, idx) => (
                                        <div key={idx} style={{ marginBottom: '24px', padding: '20px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#6366f1' }}>BANNER #{idx + 1}</div>
                                                <button onClick={() => handleRemoveBanner(idx)} style={{ padding: '4px 8px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>삭제</button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Image size={14} /> 이미지 URL</label><input type="text" value={item.image} onChange={(e) => handleFieldChange(idx, 'image', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><AlignLeft size={14} /> 동영상 URL (선택 - 유튜브, 쇼츠, 인스타 등)</label><input type="text" value={item.videoUrl || ''} onChange={(e) => handleFieldChange(idx, 'videoUrl', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><TagIcon size={14} /> 태그</label><input type="text" value={item.tag} onChange={(e) => handleFieldChange(idx, 'tag', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Type size={14} /> 제목</label><input type="text" value={item.title} onChange={(e) => handleFieldChange(idx, 'title', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }} /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><AlignLeft size={14} /> 설명</label><textarea value={item.caption} onChange={(e) => handleFieldChange(idx, 'caption', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#ffffff', fontSize: '0.85rem', height: '60px', resize: 'none' }} /></div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>버튼 아이콘</label>
                                                        <select
                                                            value={item.buttonIcon || ''}
                                                            onChange={(e) => handleFieldChange(idx, 'buttonIcon', e.target.value)}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#ffffff', fontSize: '0.85rem' }}
                                                        >
                                                            {ICON_OPTIONS.map(opt => (
                                                                 <option key={opt.value} value={opt.value}>{opt.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>버튼 이름</label>
                                                        <input type="text" value={item.buttonText || ''} placeholder="입점문의" onChange={(e) => handleFieldChange(idx, 'buttonText', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#ffffff', fontSize: '0.85rem' }} />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>버튼 링크</label>
                                                    <input type="text" value={item.buttonLink || ''} placeholder="/store/id 또는 URL" onChange={(e) => handleFieldChange(idx, 'buttonLink', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#ffffff', fontSize: '0.85rem' }} />
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Palette size={12} /> 버튼 배경색</label>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <input type="color" value={item.buttonBgColor || '#ffffff'} onChange={(e) => handleFieldChange(idx, 'buttonBgColor', e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }} />
                                                            <input type="text" value={item.buttonBgColor || '#ffffff'} onChange={(e) => handleFieldChange(idx, 'buttonBgColor', e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Type size={12} /> 버튼 글씨색</label>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <input type="color" value={item.buttonTextColor || '#000000'} onChange={(e) => handleFieldChange(idx, 'buttonTextColor', e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }} />
                                                            <input type="text" value={item.buttonTextColor || '#000000'} onChange={(e) => handleFieldChange(idx, 'buttonTextColor', e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 700, cursor: 'pointer' }}>취소</button>
                                    <button onClick={handleSave} disabled={isSaving} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>{isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}저장하기</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', padding: '0 16px', marginBottom: '12px' }}>
            <div style={{
                position: 'relative', width: '100%', height: '220px',
                borderRadius: '24px', overflow: 'hidden',
                background: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px 20px',
                boxSizing: 'border-box'
            }}>
                {renderInnerContent()}
            </div>

            <AnimatePresence>
                {isEditModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', background: 'white', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0 }}>메인 배너 관리</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>이미지가 없는 배너는 자동으로 숨겨집니다.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={handleAddBanner} style={{ padding: '8px 12px', borderRadius: '8px', background: '#6366f1', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        + 새 배너 추가
                                    </button>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: '8px', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                                </div>
                            </div>
                            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                                {editForm.map((item, idx) => (
                                    <div key={idx} style={{ marginBottom: '24px', padding: '20px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#6366f1' }}>BANNER #{idx + 1}</div>
                                            <button onClick={() => handleRemoveBanner(idx)} style={{ padding: '4px 8px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>삭제</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Image size={14} /> 이미지 URL</label><input type="text" value={item.image} onChange={(e) => handleFieldChange(idx, 'image', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} /></div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><AlignLeft size={14} /> 동영상 URL (선택 - 유튜브, 쇼츠, 인스타 등)</label><input type="text" value={item.videoUrl || ''} onChange={(e) => handleFieldChange(idx, 'videoUrl', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} /></div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><TagIcon size={14} /> 태그</label><input type="text" value={item.tag} onChange={(e) => handleFieldChange(idx, 'tag', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} /></div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Type size={14} /> 제목</label><input type="text" value={item.title} onChange={(e) => handleFieldChange(idx, 'title', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }} /></div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><AlignLeft size={14} /> 설명</label><textarea value={item.caption} onChange={(e) => handleFieldChange(idx, 'caption', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#ffffff', fontSize: '0.85rem', height: '60px', resize: 'none' }} /></div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>버튼 아이콘</label>
                                                    <select
                                                        value={item.buttonIcon || ''}
                                                        onChange={(e) => handleFieldChange(idx, 'buttonIcon', e.target.value)}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#ffffff', fontSize: '0.85rem' }}
                                                    >
                                                        {ICON_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>버튼 이름</label>
                                                    <input type="text" value={item.buttonText || ''} placeholder="입점문의" onChange={(e) => handleFieldChange(idx, 'buttonText', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#ffffff', fontSize: '0.85rem' }} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>버튼 링크</label>
                                                <input type="text" value={item.buttonLink || ''} placeholder="/store/id 또는 URL" onChange={(e) => handleFieldChange(idx, 'buttonLink', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#ffffff', fontSize: '0.85rem' }} />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Palette size={12} /> 버튼 배경색</label>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <input type="color" value={item.buttonBgColor || '#ffffff'} onChange={(e) => handleFieldChange(idx, 'buttonBgColor', e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }} />
                                                        <input type="text" value={item.buttonBgColor || '#ffffff'} onChange={(e) => handleFieldChange(idx, 'buttonBgColor', e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Type size={12} /> 버튼 글씨색</label>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <input type="color" value={item.buttonTextColor || '#000000'} onChange={(e) => handleFieldChange(idx, 'buttonTextColor', e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }} />
                                                        <input type="text" value={item.buttonTextColor || '#000000'} onChange={(e) => handleFieldChange(idx, 'buttonTextColor', e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
                                <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 700, cursor: 'pointer' }}>취소</button>
                                <button onClick={handleSave} disabled={isSaving} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>{isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}저장하기</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HeroSliderV2;
