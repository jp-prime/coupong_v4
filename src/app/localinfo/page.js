"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Phone, Loader2, ChevronDown, X, Trash2, Edit3, Search, Eye, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LocalInfoService } from '@/services/LocalInfoService';
import { StoreService } from '@/services/StoreService';
import HeaderV2 from '@/components/style2/HeaderV2';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function LocalInfoPage() {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const { fixImageUrl } = useStoreHelpers();
    const router = useRouter();
    const [infos, setInfos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [windowWidth, setWindowWidth] = useState(375);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [storesMap, setStoresMap] = useState({});
    const [pageStats, setPageStats] = useState({ totalVisits: 0 });
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const getButtonRight = () => {
        let containerWidth = windowWidth;
        if (windowWidth >= 480 && windowWidth < 1024) {
            containerWidth = 480;
        } else if (windowWidth >= 1280) {
            containerWidth = 1280;
        }
        
        if (windowWidth > containerWidth) {
            return `${((windowWidth - containerWidth) / 2) + 20}px`;
        }
        return '20px';
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', categories: '', location: '', description: '', phone: '', mapUrl: '', imageUrl: '', storeId: ''
    });

    useEffect(() => {
        fetchInitialData();
        
        // 방문자 수 기록 (세션당 1회)
        if (typeof window !== "undefined") {
            const sessionKey = 'visited_local_info';
            if (!sessionStorage.getItem(sessionKey)) {
                StoreService.incrementPageVisit('local_info_stats');
                sessionStorage.setItem(sessionKey, 'true');
            }
        }
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [infoResult, allStores, stats] = await Promise.all([
                LocalInfoService.getLocalInfos(),
                StoreService.getAllStores(),
                StoreService.getGlobalStats('local_info_stats')
            ]);

            // Create stores map for easy lookup
            const sMap = {};
            allStores.forEach(s => { sMap[s.id] = s; });
            setStoresMap(sMap);
            
            if (stats) setPageStats(stats);

            if (infoResult && infoResult.data) {
                setInfos(infoResult.data);
                setLastDoc(infoResult.lastVisible);
                setHasMore(infoResult.data.length === 18);
            }
        } catch (error) {
            console.error("LocalInfo Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const result = await LocalInfoService.getLocalInfos(lastDoc);
            if (result && result.data) {
                setInfos(prev => [...prev, ...result.data]);
                setLastDoc(result.lastVisible);
                setHasMore(result.data.length === 18);
            }
        } catch (error) {
            console.error("LocalInfo LoadMore Error:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const filteredInfos = useMemo(() => {
        if (!localSearchQuery.trim()) return infos;
        const q = localSearchQuery.toLowerCase();
        return infos.filter(info =>
            (info.name?.toLowerCase().includes(q)) ||
            (info.categories?.toLowerCase().includes(q)) ||
            (info.description?.toLowerCase().includes(q)) ||
            (info.location?.toLowerCase().includes(q))
        );
    }, [infos, localSearchQuery]);

    const handleItemClick = (storeId) => {
        if (storeId) {
            router.push(`/store/${storeId}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await LocalInfoService.updateLocalInfo(selectedId, formData);
                alert('수정되었습니다.');
            } else {
                await LocalInfoService.addLocalInfo(formData);
                alert('등록되었습니다.');
            }
            setIsModalOpen(false);
            fetchInitialData();
        } catch (error) {
            alert('오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            await LocalInfoService.deleteLocalInfo(id);
            fetchInitialData();
        }
    };

    const openEdit = (info) => {
        setFormData({
            name: info.name || '', categories: info.categories || '', location: info.location || '',
            description: info.description || '', phone: info.phone || '', mapUrl: info.mapUrl || '', imageUrl: info.imageUrl || '',
            storeId: info.storeId || ''
        });
        setSelectedId(info.id);
        setEditMode(true);
        setIsModalOpen(true);
    };

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
            <HeaderV2 />

            <main style={{ maxWidth: '1280px', margin: '0 auto', padding: windowWidth < 640 ? '16px' : '20px' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: windowWidth < 640 ? '20px' : '32px', 
                    marginTop: '20px',
                    gap: '12px'
                }}>
                    <div style={{ flex: '1 1 auto' }}>
                        <h1 style={{ 
                            fontSize: windowWidth < 640 ? '1.2rem' : '1.8rem', 
                            fontWeight: 950, 
                            color: '#0f172a', 
                            letterSpacing: '-1.5px', 
                            marginBottom: '4px',
                            whiteSpace: 'nowrap'
                        }}>
                            지역 정보 <span style={{ color: '#6366f1' }}>Local Info</span>
                        </h1>
                        {windowWidth >= 640 && (
                            <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, margin: 0 }}>
                                베트남 호치민 푸미흥의 생생한 업소 정보를 확인하세요.
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: windowWidth < 640 ? '0 1 160px' : '0 1 400px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Search size={windowWidth < 640 ? 16 : 20} />
                            </div>
                            <input
                                type="text"
                                placeholder={windowWidth < 640 ? "검색..." : "업체명 검색..."}
                                value={localSearchQuery}
                                onChange={(e) => setLocalSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: windowWidth < 640 ? '10px 12px 10px 34px' : '14px 16px 14px 44px', 
                                    borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', 
                                    fontSize: windowWidth < 640 ? '0.8rem' : '0.95rem', fontWeight: 700, outline: 'none'
                                }}
                            />
                        </div>

                        {isAdmin && windowWidth >= 1024 && (
                            <button
                                onClick={() => {
                                    setFormData({ name: '', categories: '', location: '', description: '', phone: '', mapUrl: '', imageUrl: '', storeId: '' });
                                    setEditMode(false);
                                    setIsModalOpen(true);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                                    background: '#6366f1', color: 'white', border: 'none', borderRadius: '14px',
                                    fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Plus size={20} /> 등록
                            </button>
                        )}
                    </div>
                </div>

                {isAdmin && windowWidth < 1024 && (
                    <button
                        onClick={() => {
                            setFormData({ name: '', categories: '', location: '', description: '', phone: '', mapUrl: '', imageUrl: '', storeId: '' });
                            setEditMode(false);
                            setIsModalOpen(true);
                        }}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px',
                            background: '#6366f1', color: 'white', border: 'none', borderRadius: '14px',
                            fontWeight: 800, cursor: 'pointer', marginBottom: '24px'
                        }}
                    >
                        <Plus size={20} /> 정보 등록하기
                    </button>
                )}

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', gap: '16px' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={40} color="#6366f1" /></motion.div>
                        <p style={{ fontWeight: 700, color: '#94a3b8' }}>데이터를 불러오는 중...</p>
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: windowWidth < 1024 ? '1fr' : 'repeat(2, 1fr)',
                            gap: windowWidth < 640 ? '16px' : '24px'
                        }}>
                            {filteredInfos.map((info, idx) => {
                                const isEven = idx % 2 === 1;
                                const summarizedDesc = info.description && info.description.length > 120
                                    ? info.description.substring(0, 120) + '...'
                                    : info.description;

                                return (
                                    <motion.div
                                        key={info.id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: windowWidth < 640 ? 'column' : (isEven ? 'row-reverse' : 'row'),
                                            background: '#ffffff',
                                            borderRadius: '24px',
                                            border: '1px solid #f1f5f9',
                                            overflow: 'hidden',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                            minHeight: '200px'
                                        }}
                                    >
                                        {/* Image Area */}
                                        <div
                                            onClick={() => handleItemClick(info.storeId)}
                                            style={{
                                                width: windowWidth < 640 ? '100%' : '200px',
                                                height: windowWidth < 640 ? '160px' : 'auto',
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                position: 'relative',
                                                cursor: info.storeId ? 'pointer' : 'default'
                                            }}
                                        >
                                            {(() => {
                                                const storeData = info.storeId ? storesMap[info.storeId] : null;
                                                const displayImage = info.imageUrl || storeData?.image;

                                                return (
                                                    <img
                                                        src={fixImageUrl(displayImage)}
                                                        alt=""
                                                        referrerPolicy="no-referrer"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = '/index512.png';
                                                        }}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                );
                                            })()}
                                            {info.storeId && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '0px',
                                                    right: '0px',
                                                    width: windowWidth < 640 ? '75px' : '100px',
                                                    height: windowWidth < 640 ? '75px' : '100px',
                                                    zIndex: 5,
                                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
                                                }}>
                                                    <img 
                                                        src="https://i.ibb.co/v4cFWvLK/image.png" 
                                                        alt="affiliate badge" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                </div>
                                            )}
                                            {isAdmin && (
                                                <div style={{
                                                    position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                                                    display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.9)',
                                                    padding: '6px 12px', borderRadius: '14px', backdropFilter: 'blur(4px)',
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10
                                                }}>
                                                    <button onClick={(e) => { e.stopPropagation(); openEdit(info); }} style={{ color: '#64748b', cursor: 'pointer', background: 'none', border: 'none' }}><Edit3 size={16} /></button>
                                                    <div style={{ width: '1px', height: '12px', background: '#e2e8f0', alignSelf: 'center' }} />
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(info.id); }} style={{ color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Area */}
                                        <div style={{
                                            flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                            minWidth: 0, overflow: 'hidden', textAlign: (windowWidth >= 640 && isEven) ? 'right' : 'left'
                                        }}>
                                            <div
                                                style={{ width: '100%', cursor: info.storeId ? 'pointer' : 'default' }}
                                                onClick={() => handleItemClick(info.storeId)}
                                            >
                                                <div style={{
                                                    display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px',
                                                    justifyContent: (windowWidth >= 640 && isEven) ? 'flex-end' : 'flex-start', alignItems: 'center'
                                                }}>
                                                    {info.categories?.split(',').map((cat, i) => (
                                                        <span key={i} style={{ padding: '3px 10px', borderRadius: '8px', background: '#f1f5f9', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>
                                                            {cat.trim()}
                                                        </span>
                                                    ))}
                                                    {info.location && (
                                                        <span style={{
                                                            padding: '3px 10px', borderRadius: '8px', background: '#fff7ed', fontSize: '0.75rem', fontWeight: 900, color: '#f97316',
                                                            whiteSpace: 'nowrap', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}>
                                                            <MapPin size={12} /> {info.location}
                                                        </span>
                                                    )}
                                                    {idx === 0 && pageStats?.totalVisits > 0 && (
                                                        <span style={{
                                                            padding: '3px 10px', borderRadius: '8px', background: '#f8fafc', fontSize: '0.75rem', fontWeight: 800, color: '#6366f1',
                                                            whiteSpace: 'nowrap', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}>
                                                            <Eye size={12} /> {pageStats.totalVisits.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    justifyContent: (windowWidth >= 640 && isEven) ? 'flex-end' : 'flex-start',
                                                    marginBottom: '8px'
                                                }}>
                                                    <h2 style={{ fontSize: '1.35rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.8px', wordBreak: 'break-all' }}>
                                                        {info.name}
                                                    </h2>
                                                    {info.storeId && (
                                                        <motion.div
                                                            animate={{ scale: [1, 1.1, 1] }}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #ff4d4d, #f97316)',
                                                                color: 'white',
                                                                padding: '4px 10px',
                                                                borderRadius: '10px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 900,
                                                                boxShadow: '0 4px 12px rgba(255, 77, 77, 0.3)',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            할인쿠폰
                                                        </motion.div>
                                                    )}
                                                </div>

                                                <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {summarizedDesc}
                                                </p>
                                            </div>

                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto',
                                                justifyContent: (windowWidth >= 640 && isEven) ? 'flex-end' : 'flex-start', marginTop: '18px',
                                                paddingBottom: '4px'
                                            }} className="hide-scrollbar">
                                                {info.phone && (
                                                    <a href={`tel:${info.phone}`} style={{
                                                        height: '38px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px',
                                                        background: '#0f172a', color: 'white', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap'
                                                    }}>
                                                        <Phone size={14} /> {info.phone}
                                                    </a>
                                                )}
                                                {info.mapUrl && (
                                                    <a href={info.mapUrl} target="_blank" rel="noreferrer" style={{
                                                        height: '38px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px',
                                                        background: '#f1f5f9', color: '#475569', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', border: '1px solid #e2e8f0'
                                                    }}>
                                                        <MapPin size={14} /> 구글맵
                                                    </a>
                                                )}
                                                {info.storeId && (
                                                    <button
                                                        onClick={() => handleItemClick(info.storeId)}
                                                        style={{
                                                            height: '38px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px',
                                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', borderRadius: '12px',
                                                            fontSize: '0.85rem', fontWeight: 800, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
                                                        }}
                                                    >
                                                        쿠폰받기
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {filteredInfos.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
                                <Search size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>검색 결과가 없습니다.</p>
                                <p style={{ fontSize: '0.9rem' }}>다른 키워드로 검색해보세요.</p>
                            </div>
                        )}
                    </>
                )}

                {hasMore && !loading && !localSearchQuery && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 48px',
                                borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                fontWeight: 800, color: '#0f172a', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {loadingMore ? <Loader2 size={20} className="animate-spin" /> : <ChevronDown size={20} />}
                            더 많은 정보 보기
                        </button>
                    </div>
                )}
            </main>

            {/* Admin Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                            zIndex: 40000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            style={{
                                background: 'white', width: '100%', maxWidth: '500px', borderRadius: '30px',
                                padding: '32px', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
                                maxHeight: '90vh', overflowY: 'auto'
                            }}
                        >
                            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 950, marginBottom: '24px', color: '#0f172a' }}>{editMode ? '정보 수정' : '신규 정보 등록'}</h2>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>업소명</label>
                                    <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>카테고리 (쉼표 구분)</label>
                                    <input placeholder="맛집, 한식, 삼겹살" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }} value={formData.categories} onChange={e => setFormData({ ...formData, categories: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>위치</label>
                                    <input placeholder="푸미흥" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>상세 설명</label>
                                    <textarea rows={4} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, resize: 'none' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>전화번호</label>
                                    <input style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>구글맵 링크</label>
                                    <input style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }} value={formData.mapUrl} onChange={e => setFormData({ ...formData, mapUrl: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>이미지 링크</label>
                                    <input style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }} value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>상세페이지 ID (storeId)</label>
                                    <input placeholder="예: store_123" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }} value={formData.storeId} onChange={e => setFormData({ ...formData, storeId: e.target.value })} />
                                </div>

                                <button type="submit" style={{ marginTop: '12px', padding: '18px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '18px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}>
                                    {editMode ? '수정 완료' : '등록 완료'}
                                </button>
                             </form>
                         </motion.div>
                     </motion.div>
                )}
             </AnimatePresence>
             <style>{`
                 .hide-scrollbar::-webkit-scrollbar {
                     display: none;
                 }
             `}</style>

             {/* Scroll To Top Button */}
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
                             bottom: windowWidth < 768 ? '96px' : '40px',
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
        </div>
    );
}
