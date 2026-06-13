'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Save, 
    Upload, 
    Image as ImageIcon, 
    Trash2, 
    Plus, 
    Store, 
    Layout, 
    MapPin, 
    Globe, 
    Phone, 
    Clock, 
    Menu as MenuIcon,
    AlertCircle,
    ChevronDown,
    X,
    ExternalLink,
    MessageCircle,
    MessageSquare,
    FileText
} from 'lucide-react';
import { StoreService } from '../../../../services/StoreService';
import { StorageService } from '../../../../services/StorageService';
import { useStoreHelpers } from '../../../../hooks/useStoreHelpers';

export default function AdminMiniHomeRegister() {
    const params = useParams();
    const storeId = params?.storeId;
    const isNew = !storeId || storeId === 'new';
    const router = useRouter();
    const { fixImageUrl } = useStoreHelpers();
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [galleryUrl, setGalleryUrl] = useState('');

    const [formData, setFormData] = useState({
        name: { ko: '', en: '', vi: '' },
        slogan: { ko: '', en: '', vi: '' },
        category: 'spa',
        location: 'D1',
        slug: '',
        address: { ko: '', en: '', vi: '' },
        phoneNumber: '',
        zaloId: '',
        kakaoId: '',
        businessHours: { ko: '10:00 - 22:00', en: '10:00 - 22:00', vi: '10:00 - 22:00' },
        storeDescription: { ko: '', en: '', vi: '' },
        mapIframeUrl: '',
        image: '',
        gallery: [],
        menu: [],
        isMiniHome: true
    });

    useEffect(() => {
        if (!isNew) {
            const fetchStore = async () => {
                try {
                    const data = await StoreService.getStoreById(storeId);
                    if (data) {
                        setFormData({
                            ...formData,
                            ...data,
                            name: typeof data.name === 'string' ? { ko: data.name, en: data.name, vi: data.name } : data.name || formData.name,
                            slogan: typeof data.slogan === 'string' ? { ko: data.slogan, en: data.slogan, vi: data.slogan } : data.slogan || formData.slogan,
                            address: typeof data.address === 'string' ? { ko: data.address, en: data.address, vi: data.address } : data.address || formData.address,
                            businessHours: typeof data.businessHours === 'string' ? { ko: data.businessHours, en: data.businessHours, vi: data.businessHours } : data.businessHours || formData.businessHours,
                            storeDescription: typeof data.storeDescription === 'string' ? { ko: data.storeDescription, en: data.storeDescription, vi: data.storeDescription } : data.storeDescription || formData.storeDescription,
                            gallery: Array.isArray(data.gallery) ? data.gallery : (typeof data.gallery === 'string' ? JSON.parse(data.gallery) : []),
                            menu: Array.isArray(data.menu) ? data.menu : (typeof data.menu === 'string' ? JSON.parse(data.menu) : [])
                        });
                    }
                } catch (error) {
                    console.error("Error fetching store:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchStore();
        }
    }, [storeId, isNew]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (isNew) {
                const newStoreId = await StoreService.createStore(formData);
                alert('업체가 성공적으로 등록되었습니다.');
                router.push(`/admin/minihome-register/${newStoreId}`);
            } else {
                await StoreService.updateStore(storeId, formData);
                alert('정보가 성공적으로 저장되었습니다.');
            }
        } catch (error) {
            console.error("Error saving store:", error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e, target) => {
        const file = e.target.files[0];
        if (!file) return;
        const pathId = isNew ? 'temp_' + Date.now() : storeId;
        setUploading(true);
        try {
            const url = await StorageService.uploadImage(file, `stores/${pathId}/${target === 'main' ? 'main' : Date.now()}`);
            if (target === 'main') setFormData(prev => ({ ...prev, image: url }));
            else setFormData(prev => ({ ...prev, gallery: [...prev.gallery, url] }));
        } catch (error) {
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const addGalleryUrl = () => {
        if (!galleryUrl) return;
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, galleryUrl] }));
        setGalleryUrl('');
    };

    const addMenuItem = () => {
        setFormData(prev => ({
            ...prev,
            menu: [...prev.menu, { 
                name: '메뉴 이름', 
                price: '000,000 VND', 
                description: '', 
                url: '' 
            }]
        }));
    };

    const updateMenuItem = (index, field, value) => {
        const newMenu = [...formData.menu];
        newMenu[index] = { ...newMenu[index], [field]: value };
        setFormData(prev => ({ ...prev, menu: newMenu }));
    };

    const removeMenuItem = (index) => {
        setFormData(prev => ({ ...prev, menu: prev.menu.filter((_, i) => i !== index) }));
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <p style={{ marginTop: '16px', fontWeight: 700, color: '#334155' }}>데이터 로딩 중...</p>
            </div>
        </div>
    );

    const SectionTitle = ({ icon: Icon, title }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '32px 0 16px 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            <Icon size={20} color="#d4af37" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#1e293b' }}>{title}</h2>
        </div>
    );

    return (
        <div style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '120px', color: '#0f172a' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => router.push('/admin/minihome-list')} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px', color: '#000', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#000' }}>{isNew ? '신규 미니홈 등록' : '디자인 및 정보 수정'}</h1>
                        {!isNew && <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: 600 }}>ID: {storeId}</p>}
                    </div>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    style={{ 
                        padding: '14px 28px', 
                        borderRadius: '18px', 
                        background: '#000', 
                        color: '#fff', 
                        border: 'none', 
                        fontWeight: 900, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s ease',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    {saving ? '처리 중...' : <><Save size={20} /> {isNew ? '업체 생성' : '저장하기'}</>}
                </button>
            </div>

            {/* Form */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
                {/* 업체 기본 정보 */}
                <SectionTitle icon={Store} title="업체 기본 정보" />
                <div style={{ display: 'grid', gap: '24px' }}>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>업체명 (Korean)</label>
                        <input type="text" value={formData.name?.ko || ''} onChange={e => setFormData({...formData, name: {...formData.name, ko: e.target.value}})} placeholder="업체 이름을 입력하세요." style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: 600, background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>단축 주소용 슬러그 (Custom URL Slug)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>coupong.online/go/</span>
                            <input 
                                type="text" 
                                value={formData.slug || ''} 
                                onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, '')})} 
                                placeholder="예: silkera" 
                                style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: 600, background: '#fff', color: '#000', boxSizing: 'border-box' }} 
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', margin: '4px 0 0 0' }}>* 영문 소문자와 숫자만 사용 가능합니다.</p>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>슬로건 / 한줄 요약 (Korean)</label>
                        <input type="text" value={formData.slogan?.ko || ''} onChange={e => setFormData({...formData, slogan: {...formData.slogan, ko: e.target.value}})} placeholder="업체를 한 줄로 설명해 보세요." style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: 600, background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                         <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>카테고리</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: 600, background: 'white', color: '#000', boxSizing: 'border-box' }}>
                                <option value="spa">SPA & MASSAGE</option>
                                <option value="restaurant">RESTAURANT</option>
                                <option value="salon">HAIR SALON</option>
                                <option value="bar">BAR & LOUNGE</option>
                                <option value="other">OTHER</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>지역 (Location)</label>
                            <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: 600, background: 'white', color: '#000', boxSizing: 'border-box' }}>
                                <option value="D1">1군 (District 1)</option>
                                <option value="D2">2군 (District 2 / Tao Dien)</option>
                                <option value="D3">3군 (District 3)</option>
                                <option value="D7">7군 (District 7 / Phu My Hung)</option>
                                <option value="D9">9군 (District 9 / Thu Duc)</option>
                                <option value="Binh Thanh">빈탄군 (Binh Thanh)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 연락처 및 소셜 미디어 */}
                <SectionTitle icon={Phone} title="연락처 및 소셜 미디어" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>전화번호</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input type="text" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} placeholder="010-0000-0000" style={{ width: '100%', padding: '16px 16px 16px 46px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>영업 시간</label>
                        <div style={{ position: 'relative' }}>
                            <Clock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input type="text" value={formData.businessHours?.ko || ''} onChange={e => setFormData({...formData, businessHours: {...formData.businessHours, ko: e.target.value}})} placeholder="예: 10:00 - 22:00" style={{ width: '100%', padding: '16px 16px 16px 46px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>Zalo ID</label>
                        <div style={{ position: 'relative' }}>
                            <MessageCircle size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#0068ff' }} />
                            <input type="text" value={formData.zaloId || ''} onChange={e => setFormData({...formData, zaloId: e.target.value})} placeholder="zalo_id_or_number" style={{ width: '100%', padding: '16px 16px 16px 46px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>Kakao ID</label>
                        <div style={{ position: 'relative' }}>
                            <MessageSquare size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#fee500' }} />
                            <input type="text" value={formData.kakaoId || ''} onChange={e => setFormData({...formData, kakaoId: e.target.value})} placeholder="kakao_id" style={{ width: '100%', padding: '16px 16px 16px 46px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                </div>

                {/* 위치 및 상세 설명 */}
                <SectionTitle icon={MapPin} title="위치 및 상세 설명" />
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>전체 주소 (Korean)</label>
                        <input type="text" value={formData.address?.ko || ''} onChange={e => setFormData({...formData, address: {...formData.address, ko: e.target.value}})} placeholder="구글 맵에 표시될 주소를 입력하세요." style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>구글 맵 Iframe URL / Embed 코드</label>
                        <div style={{ position: 'relative' }}>
                             <Globe size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                             <textarea value={formData.mapIframeUrl || ''} onChange={e => setFormData({...formData, mapIframeUrl: e.target.value})} placeholder="Google Maps '공유' -> '지도 퍼가기' -> iframe src 주소를 붙여넣으세요." style={{ width: '100%', padding: '16px 16px 16px 46px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', height: '100px', resize: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>업체 상세 소개 (Korean)</label>
                        <div style={{ position: 'relative' }}>
                            <FileText size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                            <textarea value={formData.storeDescription?.ko || ''} onChange={e => setFormData({...formData, storeDescription: {...formData.storeDescription, ko: e.target.value}})} placeholder="고객에게 전하고 싶은 메시지나 업체 소개글을 자유롭게 적어주세요." style={{ width: '100%', padding: '16px 16px 16px 46px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', height: '150px', resize: 'none', lineHeight: 1.6, background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                </div>

                {/* 대표 이미지 및 갤러리 */}
                <SectionTitle icon={ImageIcon} title="대표 이미지 및 갤러리" />
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '12px' }}>메인 대표 이미지 (Hero)</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ width: '140px', height: '140px', borderRadius: '24px', background: '#f1f5f9', overflow: 'hidden', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {formData.image ? <img src={fixImageUrl(formData.image)} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={32} color="#94a3b8" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                <input type="file" id="mainImage" hidden onChange={e => handleImageUpload(e, 'main')} />
                                <label htmlFor="mainImage" style={{ padding: '10px 16px', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#000' }}><Upload size={16} /> 파일 업로드</label>
                            </div>
                            <input type="text" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="또는 이미지 URL 직접 입력" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '12px' }}>갤러리 이미지 (슬라이드 및 포트폴리오)</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <input type="text" value={galleryUrl} onChange={e => setGalleryUrl(e.target.value)} placeholder="추가할 이미지 URL을 입력하세요" style={{ flex: 1, padding: '14px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        <button onClick={addGalleryUrl} style={{ background: '#d4af37', color: 'white', border: 'none', borderRadius: '14px', padding: '0 20px', fontWeight: 900, cursor: 'pointer' }}>URL 추가</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {formData.gallery?.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                <img src={fixImageUrl(url)} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }))} style={{ position: 'absolute', top: '5px', right: '5px', padding: '6px', background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <label style={{ aspectRatio: '1', border: '2px dashed #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
                            <input type="file" hidden onChange={e => handleImageUpload(e, 'gallery')} />
                            <Plus size={24} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>사진 추가</span>
                        </label>
                    </div>
                </div>

                {/* 메뉴 / 서비스 관리 */}
                <SectionTitle icon={MenuIcon} title="메뉴 및 서비스 상세" />
                <button onClick={addMenuItem} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'white', border: '2px dashed #d4af37', color: '#d4af37', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                    <Plus size={20} /> 메뉴 항목 추가하기
                </button>
                <div style={{ display: 'grid', gap: '16px' }}>
                    {formData.menu?.map((item, idx) => (
                        <div key={idx} style={{ padding: '24px', borderRadius: '24px', background: '#f8fafc', border: '1px solid #f1f5f9', display: 'grid', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 900, color: '#64748b', fontSize: '0.85rem' }}>메뉴 #{idx + 1}</span>
                                <button onClick={() => removeMenuItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <input type="text" value={item.name || ''} onChange={e => updateMenuItem(idx, 'name', e.target.value)} placeholder="메뉴 이름" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                                <input type="text" value={item.price || ''} onChange={e => updateMenuItem(idx, 'price', e.target.value)} placeholder="가격 (예: 200,000 VND)" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                            </div>
                            <textarea value={item.description || ''} onChange={e => updateMenuItem(idx, 'description', e.target.value)} placeholder="상세 설명" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '80px', resize: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                            <input type="text" value={item.url || ''} onChange={e => updateMenuItem(idx, 'url', e.target.value)} placeholder="메뉴 이미지 URL" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', color: '#000', boxSizing: 'border-box' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
