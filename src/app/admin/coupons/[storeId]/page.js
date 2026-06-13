'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Loader2, Sparkles, AlertCircle, Ticket } from 'lucide-react';
import { CouponService } from '@/services/CouponService';
import { StoreService } from '@/services/StoreService';
import { useAuth } from '@/context/AuthContext';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function AdminCouponManagerPage() {
    const params = useParams();
    const storeId = params.storeId;
    const router = useRouter();
    const { isAdmin, isStoreOwner, managedStoreId, loading: authLoading } = useAuth();
    const { getLocalizedString } = useStoreHelpers();

    const [store, setStore] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    // Modal Form State
    const [langTab, setLangTab] = useState('ko');
    const [formData, setFormData] = useState({
        discount: { ko: '', en: '', vi: '', 'zh-CN': '' },
        description: { ko: '', en: '', vi: '', 'zh-CN': '' },
        isActive: true,
        isRecommended: false,
        isShocking: false,
        limitQuantity: null,
        deductionAmount: 20000,
        displayOrder: null, 
        caption: { ko: '', en: '', vi: '', 'zh-CN': '' }, 
        expirationDate: '',
        canCombine: true
    });

    useEffect(() => {
        if (authLoading) return;
        const isAuthorized = isAdmin || (isStoreOwner && managedStoreId === storeId);
        if (!isAuthorized) {
            router.push('/login');
            return;
        }
        fetchData();
    }, [storeId, isAdmin, isStoreOwner, managedStoreId, authLoading]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [storeData, couponData] = await Promise.all([
                StoreService.getStoreById(storeId),
                CouponService.getCouponsByStoreId(storeId)
            ]);
            setStore(storeData);
            setCoupons(couponData);
        } catch (error) {
            console.error("Error fetching admin coupon data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (coupon = null) => {
        setLangTab('ko');
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                discount: typeof coupon.discount === 'object' && coupon.discount !== null ? coupon.discount : { ko: coupon.discount || '', en: '', vi: '', 'zh-CN': '' },
                description: typeof coupon.description === 'object' && coupon.description !== null ? coupon.description : { ko: coupon.description || '', en: '', vi: '', 'zh-CN': '' },
                isActive: coupon.isActive !== false,
                isRecommended: coupon.isRecommended || false,
                isShocking: coupon.isShocking || false,
                limitQuantity: coupon.limitQuantity !== undefined ? coupon.limitQuantity : null,
                deductionAmount: coupon.deductionAmount || 1000,
                displayOrder: coupon.displayOrder !== undefined ? coupon.displayOrder : null,
                caption: typeof coupon.caption === 'object' && coupon.caption !== null ? coupon.caption : { ko: coupon.caption || '', en: '', vi: '', 'zh-CN': '' },
                expirationDate: coupon.expirationDate || '',
                canCombine: coupon.canCombine !== false
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                discount: { ko: '', en: '', vi: '', 'zh-CN': '' },
                description: { ko: '', en: '', vi: '', 'zh-CN': '' },
                isActive: true,
                isRecommended: false,
                isShocking: false,
                limitQuantity: null,
                deductionAmount: 20000,
                displayOrder: null,
                caption: { ko: '', en: '', vi: '', 'zh-CN': '' },
                expirationDate: '',
                canCombine: true
            });
        }
        setIsModalOpen(true);
    };

    const handleMultiChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let currentObj = prev[name];
            if (typeof currentObj !== 'object' || currentObj === null) {
                currentObj = { ko: currentObj || '', en: '', vi: '', 'zh-CN': '' };
            }
            return {
                ...prev,
                [name]: { ...currentObj, [langTab]: value }
            };
        });
    };

    const getMultiValue = (fieldName) => {
        const val = formData[fieldName];
        if (typeof val === 'object' && val !== null) {
            return val[langTab] || '';
        }
        return langTab === 'ko' ? (val || '') : '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const finalData = { ...formData, storeId };
            if (editingCoupon) {
                await CouponService.updateCoupon(editingCoupon.id, finalData);
                alert('쿠폰이 수정되었습니다.');
            } else {
                await CouponService.addCoupon(finalData);
                alert('신규 쿠폰이 발행되었습니다.');
            }
            StoreService.clearCache();
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving coupon:", error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('이 쿠폰을 정말 삭제하시겠습니까?')) return;
        setLoading(true);
        try {
            await CouponService.deleteCoupon(id);
            StoreService.clearCache();
            alert('쿠폰이 삭제되었습니다.');
            fetchData();
        } catch (error) {
            console.error("Error deleting coupon:", error);
            alert('삭제 중 오류가 발생했습니다.');
            setLoading(false);
        }
    };

    if (loading && !isModalOpen && coupons.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff' }}>
                <Loader2 className="animate-spin" size={40} color="#6366f1" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto', background: '#ffffff', minHeight: '100vh', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                        쿠폰 발행 및 관리
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 700, margin: '2px 0 0 0' }}>
                        {store ? getLocalizedString(store.name) : '로딩 중...'}
                    </p>
                    <div style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#6366f1',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Ticket size={14} />
                        활성 상태의 쿠폰이 1개 이상 있어야 일반 사용자에게 노출됩니다.
                    </div>
                </div>
            </div>

            {/* Actions */}
            <button
                onClick={() => handleOpenModal()}
                style={{
                    width: '100%', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px',
                    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                }}
            >
                <Plus size={20} /> 신규 쿠폰 발행
            </button>

            {/* Admin Notice Area */}
            <div style={{
                padding: '16px',
                background: 'rgba(99, 102, 241, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', gap: '8px', color: '#6366f1', marginBottom: '8px' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>알림 : 쿠폰 발행 및 수수료 정책</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6', wordBreak: 'keep-all' }}>
                    쿠폰 발행 시 차감 포인트는 고객이 실제 쿠폰으로 매장에서 매출이 발생했을 때 차감되는 <strong style={{ color: '#6366f1' }}>성공보수</strong>입니다.
                    업체 판매 가격마다 차등이 있으며, 미리 충전을 해두셔야 합니다. 남은 포인트는 이벤트 종료 후 언제든지 출금 회수 가능합니다.
                    <br /><br />
                    이 수수료는 시스템 운영비 + 고객의 공유 활동 리워드로 다시 업소를 위해 사용됩니다.
                </div>
            </div>

            {/* Coupon List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {coupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                        발행된 쿠폰이 없습니다.
                    </div>
                ) : coupons.map(coupon => (
                    <div
                        key={coupon.id}
                        style={{
                            padding: '20px', background: '#f8fafc', borderRadius: '24px',
                            border: '1px solid #e2e8f0', position: 'relative',
                            opacity: coupon.isActive ? 1 : 0.6
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                    {coupon.isRecommended && (
                                        <span style={{ background: '#0ea5e9', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>추천</span>
                                    )}
                                    {coupon.isShocking && (
                                        <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>HOT DEAL</span>
                                    )}
                                    {!coupon.isActive && (
                                        <span style={{ background: '#64748b', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>중단됨</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ef4444' }}>
                                        {getLocalizedString(coupon.discount)}
                                    </h3>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, background: '#e2e8f0', padding: '2px 8px', borderRadius: '6px' }}>
                                        수량: {coupon.limitQuantity === null || coupon.limitQuantity === undefined ? '무제한' : `${coupon.limitQuantity}개`}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                                    {getLocalizedString(coupon.description)}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    onClick={() => handleOpenModal(coupon)}
                                    style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: 'none', cursor: 'pointer' }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(coupon.id)}
                                    style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#64748b',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '12px',
                            borderTop: '1px solid #cbd5e1',
                            paddingTop: '12px'
                        }}>
                            <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                차감: {coupon.deductionAmount?.toLocaleString()} P
                            </span>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>
                                {coupon.canCombine ? '중복 가능' : '중복 불가'}
                            </span>
                            {coupon.displayOrder !== null && coupon.displayOrder !== undefined && (
                                <span style={{ background: '#000', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                                    노출 순번: {coupon.displayOrder}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 10px', 
                            zIndex: 1000, overflowY: 'auto'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{
                                width: '100%', maxWidth: '500px', background: '#ffffff', padding: '24px',
                                borderRadius: '28px', border: '1px solid #cbd5e1', position: 'relative',
                                margin: 'auto 0', maxHeight: 'none'
                            }}
                        >
                            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
                                <Sparkles style={{ color: '#6366f1' }} />
                                {editingCoupon ? '쿠폰 정보 수정' : '신규 쿠폰 발행'}
                            </h2>

                            {/* 언어 설정 탭 */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {[
                                    { id: 'ko', label: '한국어', icon: '🇰🇷' },
                                    { id: 'en', label: 'English', icon: '🇺🇸' },
                                    { id: 'vi', label: 'Tiếng Việt', icon: '🇻🇳' },
                                    { id: 'zh-CN', label: '中文', icon: '🇨🇳' }
                                ].map(lang => (
                                    <button
                                        key={lang.id}
                                        type="button"
                                        onClick={() => setLangTab(lang.id)}
                                        style={{
                                            padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none',
                                            background: langTab === lang.id ? '#6366f1' : 'rgba(100, 116, 139, 0.1)',
                                            color: langTab === lang.id ? 'white' : '#64748b',
                                            transition: 'all 0.2s', whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <span>{lang.icon}</span> {lang.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>할인/혜택 내용 * {langTab !== 'ko' && '(번역 수정)'}</label>
                                    <input
                                        type="text" required={langTab === 'ko'}
                                        name="discount"
                                        value={getMultiValue('discount')}
                                        onChange={handleMultiChange}
                                        placeholder="예: 10% 가격 할인, 메인메뉴 50% 할인"
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>상세 이용 조건 {langTab !== 'ko' && '(번역 수정)'}</label>
                                    <textarea
                                        rows={2}
                                        name="description"
                                        value={getMultiValue('description')}
                                        onChange={handleMultiChange}
                                        placeholder="예 : 평일 상시가능 / 주말 사용불가 / 특정조건"
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', resize: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                                        한정 수량 <span style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 500 }}>(미입력 시 무제한)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.limitQuantity === null ? '' : formData.limitQuantity}
                                        onChange={(e) => setFormData({ ...formData, limitQuantity: e.target.value === '' ? null : parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        메인 노출 순번 
                                        <span style={{ color: '#6366f1', fontSize: '0.7rem' }}>(1~10번 위주 사용, 낮을수록 상단)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.displayOrder === null ? '' : formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value === '' ? null : parseInt(e.target.value) })}
                                        placeholder="예: 1"
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', lineHeight: 1.4 }}>
                                        차감 포인트 {!isAdmin && <br />}
                                        {!isAdmin && <span style={{ display: 'block', color: '#6366f1', fontSize: '0.75rem', marginTop: '2px' }}>매출발생 시 건당 성공보수 수수료 (운영자와 협의필요)</span>}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.deductionAmount}
                                        onChange={(e) => isAdmin && setFormData({ ...formData, deductionAmount: parseInt(e.target.value) || 0 })}
                                        readOnly={!isAdmin}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            borderRadius: '12px',
                                            background: isAdmin ? '#f8fafc' : 'rgba(100, 116, 139, 0.05)',
                                            border: '1px solid #cbd5e1',
                                            color: isAdmin ? '#0f172a' : '#64748b',
                                            outline: 'none',
                                            cursor: isAdmin ? 'text' : 'not-allowed'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                                        카드 캡션 (메인 이미지 하단 문구) {langTab !== 'ko' && '(번역 수정)'}
                                    </label>
                                    <input
                                        type="text"
                                        name="caption"
                                        value={getMultiValue('caption')}
                                        onChange={handleMultiChange}
                                        placeholder="예: 기간한정 특가!, 50% 세일중"
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                                        유효 기간 표시 <span style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 500 }}>(미입력 시 상시진행)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.expirationDate}
                                        onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                                        onBlur={(e) => {
                                            const val = e.target.value;
                                            if (val) {
                                                const formatted = val.replace(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/, (match, y, m, d) => {
                                                    return `${y}.${m.padStart(2, '0')}.${d.padStart(2, '0')}`;
                                                });
                                                setFormData({ ...formData, expirationDate: formatted });
                                            }
                                        }}
                                        placeholder="예: 2026.12.31"
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>타 혜택 중복 사용 여부</label>
                                    <div style={{ display: 'flex', gap: '24px', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: '#0f172a' }}>
                                            <input
                                                type="radio"
                                                name="canCombine"
                                                checked={formData.canCombine === true}
                                                onChange={() => setFormData({ ...formData, canCombine: true })}
                                                style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                                            />
                                            중복 가능
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: '#0f172a' }}>
                                            <input
                                                type="radio"
                                                name="canCombine"
                                                checked={formData.canCombine === false}
                                                onChange={() => setFormData({ ...formData, canCombine: false })}
                                                style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                                            />
                                            중복 불가
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', marginTop: '4px', color: '#0f172a' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                        사용 가능 상태
                                    </label>
                                    {isAdmin && (
                                        <>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input type="checkbox" checked={formData.isRecommended} onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                추천 쿠폰 설정
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input type="checkbox" checked={formData.isShocking} onChange={(e) => setFormData({ ...formData, isShocking: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                HOT DEAL 지정 (운영자 권한)
                                            </label>
                                        </>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        marginTop: '10px', width: '100%', padding: '16px', borderRadius: '16px', background: '#6366f1',
                                        color: 'white', border: 'none', fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    저장하기
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
