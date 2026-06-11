"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Clock, 
    ChevronLeft, 
    Megaphone, 
    Calendar
} from 'lucide-react';
import { PromoService } from '@/services/PromoService';
import { StoreService } from '@/services/StoreService';
import HeaderV2 from '@/components/style2/HeaderV2';
import RenderWithShortcodes from '@/components/promo/RenderWithShortcodes';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function PromosClient({ initialSelectedPromo }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { fixImageUrl } = useStoreHelpers();
    
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPromo, setSelectedPromo] = useState(initialSelectedPromo || null);
    const [linkedStore, setLinkedStore] = useState(null);

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const data = await PromoService.getPromos();
            setPromos(data);
        } catch (error) {
            console.error("Failed to fetch promos:", error);
        } finally {
            setLoading(false);
        }
    };

    // Watch query parameter id
    const queryId = searchParams.get('id');
    useEffect(() => {
        if (!loading && promos.length > 0 && queryId) {
            const found = promos.find(p => p.id === queryId);
            if (found && (!selectedPromo || selectedPromo.id !== queryId)) {
                setSelectedPromo(found);
            }
        }
    }, [queryId, promos, loading]);

    // When a promo is selected, look up the linked store if there is one
    useEffect(() => {
        const checkLinkedStore = async () => {
            if (selectedPromo) {
                setLinkedStore(null);
                let storeId = selectedPromo.storeId || selectedPromo.linkedStoreId;
                if (!storeId && selectedPromo.content) {
                    const cpMatch = selectedPromo.content.match(/cp\[([^\]]+)\]/i);
                    if (cpMatch) storeId = cpMatch[1];
                }
                if (storeId) {
                    try {
                        const sData = await StoreService.getStoreById(storeId);
                        if (sData) {
                            setLinkedStore({
                                id: sData.id,
                                name: typeof sData.name === 'object' ? (sData.name.ko || sData.name.vi || '') : sData.name,
                                thumbnail: sData.image || ''
                            });
                        }
                    } catch (e) {
                        console.error("Failed to fetch linked store details:", e);
                    }
                }
            }
        };
        checkLinkedStore();
    }, [selectedPromo]);

    const handlePromoClick = (promo) => {
        setSelectedPromo(promo);
        router.replace(`/promos?id=${promo.id}`, { scroll: false });
    };

    const handleClose = () => {
        setSelectedPromo(null);
        router.replace('/promos', { scroll: false });
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '100px', color: '#1e293b' }}>
            <HeaderV2 />

            <div style={{
                background: '#ffffff',
                padding: '24px 20px 32px',
                textAlign: 'left',
                borderBottom: '1px solid #f1f5f9'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Megaphone size={18} color="#6366f1" />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6366f1', letterSpacing: '0.5px' }}>PROMOTIONS & DEALS</span>
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 950, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-1.2px' }}>
                        홍보 게시판 <span style={{ color: '#6366f1' }}>Promotions</span>
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, fontWeight: 600 }}>
                        호치민 현지 제휴 업체들의 스페셜 할인 및 상세 소식을 전해드립니다.
                    </p>
                </div>
            </div>

            <div style={{ padding: '20px 16px', maxWidth: '800px', margin: '0 auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
                        <Clock size={32} color="#6366f1" className="animate-spin" />
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>홍보 소식을 불러오는 중...</p>
                    </div>
                ) : promos.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {promos.map(promo => {
                            const dateStr = promo.createdAt?.toDate ? promo.createdAt.toDate().toLocaleDateString() : (promo.createdAt ? new Date(promo.createdAt).toLocaleDateString() : '방금');
                            return (
                                <motion.div
                                    key={promo.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePromoClick(promo)}
                                    style={{
                                        background: '#ffffff', borderRadius: '24px', padding: '20px',
                                        border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', gap: '20px',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                                        alignItems: 'center'
                                    }}
                                >
                                    {promo.thumbnail && (
                                        <div style={{ width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={fixImageUrl(promo.thumbnail)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                            <Calendar size={14} />
                                            <span>{dateStr}</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {promo.title}
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>
                                            {promo.content ? promo.content.replace(/\[[^\]]+\]/g, '') : ''}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
                        <Megaphone size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                        <p style={{ fontWeight: 700 }}>등록된 홍보글이 없습니다.</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedPromo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                background: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
                            }}
                        >
                            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#1e293b', display: 'flex', alignItems: 'center', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
                                <span style={{ flex: 1, textAlign: 'center', fontWeight: 900, color: '#1e293b', fontSize: '1rem' }}>홍보글 상세</span>
                                <div style={{ width: '24px' }} />
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                                    <Calendar size={14} />
                                    <span>{selectedPromo.createdAt?.toDate ? selectedPromo.createdAt.toDate().toLocaleString() : '방금'}</span>
                                </div>

                                <h2 style={{ fontSize: '1.4rem', fontWeight: 950, marginBottom: '24px', color: '#0f172a', lineHeight: 1.3 }}>
                                    {selectedPromo.title}
                                </h2>

                                <div style={{ marginBottom: '40px' }}>
                                    <RenderWithShortcodes 
                                        text={selectedPromo.content} 
                                        navigate={(path) => router.push(path)}
                                        postImgs={selectedPromo.images || []}
                                        linkedStore={linkedStore}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
