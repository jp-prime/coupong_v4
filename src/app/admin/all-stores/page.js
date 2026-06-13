"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Store,
    Trash2,
    Edit2,
    PauseCircle,
    PlayCircle,
    Loader2,
    Search,
    MapPin,
    Phone,
    Ticket,
    Eye,
    Share2,
    Video,
    ShieldCheck,
    QrCode
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StoreService } from '@/services/StoreService';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function AdminAllStoresPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('updatedAt'); // 'createdAt' or 'updatedAt'

    const [activeTab, setActiveTab] = useState('stores'); // 'stores' or 'applications'
    const [applications, setApplications] = useState([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [expandedAppId, setExpandedAppId] = useState(null);
    const [assignEmailMap, setAssignEmailMap] = useState({}); // storeId -> email
    const [assignLoadingMap, setAssignLoadingMap] = useState({}); // storeId -> boolean
    const { getLocalizedString, getTranslatedLocation, fixImageUrl } = useStoreHelpers();

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) {
            router.push('/login');
            return;
        }
        fetchStores();
        fetchApplications();
    }, [isAdmin, authLoading, router]);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const data = await StoreService.getAllStores(true);
            setStores(data);
        } catch (error) {
            console.error("Error fetching all stores:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async () => {
        setAppsLoading(true);
        try {
            const data = await StoreService.getPartnerApplications();
            setApplications(data);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setAppsLoading(false);
        }
    };

    const handleApprove = async (app) => {
        if (!window.confirm(`[${app.companyName}] 업소를 승인하고 정식 가맹점으로 등록하시겠습니까?`)) return;

        try {
            setAppsLoading(true);
            await StoreService.approvePartnerApplication(app.id, app);
            alert("승인이 완료되었습니다. 업소 목록에서 확인 가능합니다.");
            fetchStores();
            fetchApplications();
        } catch (error) {
            alert("승인 처리 중 오류가 발생했습니다.");
        } finally {
            setAppsLoading(false);
        }
    };

    const handleToggleStatus = async (storeId, currentStatus) => {
        const newStatus = currentStatus === false ? true : false;
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            const storeRef = doc(db, 'coupons', storeId);
            await updateDoc(storeRef, { isActive: newStatus });
            
            try {
                const newStoreRef = doc(db, 'stores', storeId);
                await updateDoc(newStoreRef, { isActive: newStatus });
            } catch (e) { /* ignore */ }

            setStores(stores.map(s => s.id === storeId ? { ...s, isActive: newStatus } : s));
        } catch (error) {
            console.error("Error toggling store status:", error);
            alert("상태 변경에 실패했습니다.");
        }
    };

    const handleDelete = async (storeId) => {
        if (!window.confirm("정말로 이 업체를 삭제하시겠습니까? 관련 쿠폰은 삭제되지 않을 수 있습니다.")) return;
        try {
            await StoreService.deleteStore(storeId);
            setStores(stores.filter(s => s.id !== storeId));
        } catch (error) {
            console.error("Error deleting store:", error);
            alert("업체 삭제에 실패했습니다.");
        }
    };

    const handleGenerateVideoCommand = (store) => {
        const galleryUrls = [
            store.image,
            ...(Array.isArray(store.gallery) ? store.gallery : [])
                .map(item => (typeof item === 'string' ? item : item.url))
        ].filter(Boolean).join(',');

        const cleanDesc = (getLocalizedString(store.storeDescription) || '').replace(/["']/g, "").replace(/\n/g, " ");
        const cleanSlogan = (getLocalizedString(store.slogan) || '').replace(/["']/g, "");

        const command = `node scripts/generate-video.cjs --id="${store.id}" --name="${getLocalizedString(store.name)}" --slogan="${cleanSlogan}" --description="${cleanDesc}" --gallery="${galleryUrls}"`;

        navigator.clipboard.writeText(command);
        alert(`[${getLocalizedString(store.name)}] 릴스 제작 명령어가 복사되었습니다!\n\n검은색 터미널 창에 붙여넣기(Ctrl+V) 하세요.`);
    };

    const handleSNSPromote = (store) => {
        alert("SNS 홍보 기능이 준비되었습니다.");
    };

    const handleAssignManager = async (storeId) => {
        const email = assignEmailMap[storeId] || '';
        setAssignLoadingMap(prev => ({ ...prev, [storeId]: true }));
        try {
            const res = await StoreService.assignManagerToStore(storeId, email);
            if (res.success) {
                alert(res.message);
                setStores(stores.map(s => s.id === storeId ? { ...s, managerEmail: email } : s));
            } else {
                alert(`오류: ${res.error}`);
            }
        } catch (error) {
            console.error("Assign manager failed:", error);
            alert("임명 처리 중 오류가 발생했습니다.");
        } finally {
            setAssignLoadingMap(prev => ({ ...prev, [storeId]: false }));
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    const filteredStores = stores
        .filter(store => {
            const searchTermLower = (searchTerm || '').toLowerCase();
            const nameStr = getLocalizedString(store.name)?.toLowerCase() || '';
            const locStr = getTranslatedLocation(store.location)?.toLowerCase() || '';
            
            return nameStr.includes(searchTermLower) ||
                (String(store.category || '').toLowerCase()).includes(searchTermLower) ||
                (locStr && locStr.includes(searchTermLower)) ||
                (String(store.address || '').toLowerCase()).includes(searchTermLower);
        })
        .sort((a, b) => {
            const timeA = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
            const timeB = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
            return timeB - timeA;
        });

    if (!isAdmin) return null;

    return (
        <div style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto', background: '#ffffff', minHeight: '100vh', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => router.push('/admin')}
                    style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', padding: '8px' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Store style={{ color: '#6366f1' }} size={20} /> 전체 업소 관리
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                        등록된 가맹점과 신규 신청을 관리합니다.
                    </p>
                    <div style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#3b82f6',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Ticket size={14} />
                        활성 쿠폰이 1개 이상 등록된 업체만 메인 페이지에 노출됩니다.
                    </div>
                </div>
            </div>

            {/* 탭 시스템 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
                <button
                    onClick={() => setActiveTab('stores')}
                    style={{
                        padding: '12px 20px', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
                        border: 'none', background: 'none', borderBottom: activeTab === 'stores' ? '3px solid #6366f1' : '3px solid transparent',
                        color: activeTab === 'stores' ? '#6366f1' : '#64748b',
                        transition: 'all 0.2s'
                    }}
                >
                    가맹점 목록 ({stores.length})
                </button>
                <button
                    onClick={() => setActiveTab('applications')}
                    style={{
                        padding: '12px 20px', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
                        border: 'none', background: 'none', borderBottom: activeTab === 'applications' ? '3px solid #6366f1' : '3px solid transparent',
                        color: activeTab === 'applications' ? '#6366f1' : '#64748b',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    신청 접수 ({applications.filter(a => a.status === 'pending').length})
                    {applications.filter(a => a.status === 'pending').length > 0 && (
                        <span style={{ width: '18px', height: '18px', background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {applications.filter(a => a.status === 'pending').length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'stores' ? (
                <>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="text"
                                placeholder="업체명 또는 카테고리 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px',
                                    border: '1px solid #e2e8f0', background: 'white',
                                    fontSize: '0.95rem', outline: 'none', color: '#0f172a'
                                }}
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '0 10px', borderRadius: '16px', border: '1px solid #e2e8f0',
                                background: 'white', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a',
                                outline: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value="createdAt">최신등록순</option>
                            <option value="updatedAt">최근수정순</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
                        ) : filteredStores.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>등록된 업체가 없습니다.</div>
                        ) : filteredStores.map(store => (
                            <div
                                key={store.id}
                                style={{
                                    background: '#f8fafc', padding: '20px', borderRadius: '24px',
                                    border: '1px solid #e2e8f0',
                                    opacity: store.isActive === false ? 0.6 : 1,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: `url(${fixImageUrl(store.image)}) center/cover`, border: '1px solid #e2e8f0' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{getLocalizedString(store.name)}</h3>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', fontWeight: 700 }}>
                                                {store.category}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                                                <MapPin size={12} /> {getTranslatedLocation(store.location) || '위치 정보 없음'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                                                <Phone size={12} /> {store.phoneNumber || store.phone || '연락처 정보 없음'}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', marginTop: '4px', flexWrap: 'wrap' }}>
                                                <span style={{ background: '#e2e8f0', color: '#334155', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                                    ID: {store.id}
                                                </span>
                                                {store.slug && (
                                                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                                        Slug: {store.slug}
                                                    </span>
                                                )}
                                                {store.isSanityData && (
                                                    <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                        Sanity
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* 관리자(매니저) 이메일 임명 인라인 폼 */}
                                            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#334155' }}>🔑 업소 관리자 임명</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        현재: <span style={{ color: store.managerEmail ? '#4f46e5' : '#ef4444', fontWeight: 900 }}>{store.managerEmail || '운영자(기본)'}</span>
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <input 
                                                        type="email"
                                                        placeholder="회원 이메일 입력"
                                                        value={assignEmailMap[store.id] !== undefined ? assignEmailMap[store.id] : (store.managerEmail || '')}
                                                        onChange={(e) => setAssignEmailMap(prev => ({ ...prev, [store.id]: e.target.value }))}
                                                        style={{
                                                            flex: 1,
                                                            padding: '6px 10px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #cbd5e1',
                                                            fontSize: '0.78rem',
                                                            outline: 'none',
                                                            background: 'white',
                                                            color: 'black'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleAssignManager(store.id)}
                                                        disabled={assignLoadingMap[store.id]}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            background: '#6366f1',
                                                            color: 'white',
                                                            border: 'none',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 900,
                                                            cursor: 'pointer',
                                                            opacity: assignLoadingMap[store.id] ? 0.7 : 1
                                                        }}
                                                    >
                                                        {assignLoadingMap[store.id] ? '반영중' : '임명'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                                                background: store.isActive !== false ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                                color: store.isActive !== false ? '#22c55e' : '#64748b'
                                            }}>
                                                {store.isActive !== false ? '노출중' : '숨겨짐'}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#a855f7' }}>
                                                <Eye size={14} /> {store.viewCount || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => handleToggleStatus(store.id, store.isActive)}
                                        style={{
                                            padding: '8px 12px', borderRadius: '10px', 
                                            background: store.isActive !== false ? 'rgba(100, 116, 139, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                            color: store.isActive !== false ? '#64748b' : '#22c55e', 
                                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        {store.isActive !== false ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{store.isActive !== false ? '숨기기' : '보이기'}</span>
                                    </button>
                                    <button
                                        onClick={() => window.open(`/store/${store.slug || store.id}`, '_blank')}
                                        style={{
                                            padding: '8px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.05)',
                                            color: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <Eye size={16} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>상세보기</span>
                                    </button>
                                    <button
                                        onClick={() => router.push(`/staff/store/${store.id}`)}
                                        style={{
                                            padding: '8px 14px', borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                            color: 'white', border: 'none', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                                            fontWeight: 900
                                        }}
                                    >
                                        <ShieldCheck size={15} />
                                        <span style={{ fontSize: '0.8rem' }}>STAFF 상세</span>
                                    </button>
                                    <button
                                        onClick={() => router.push(`/admin/coupons/${store.id}`)}
                                        style={{
                                            padding: '8px 12px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)',
                                            color: '#a855f7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <Ticket size={16} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>쿠폰 관리</span>
                                    </button>
                                    <button
                                        onClick={() => router.push(`/edit-store/${store.id}`)}
                                        style={{
                                            padding: '8px 12px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)',
                                            color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <Edit2 size={16} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>수정</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(store.id)}
                                        style={{
                                            padding: '8px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>삭제</span>
                                    </button>
                                    <button
                                        onClick={() => handleSNSPromote(store)}
                                        style={{
                                            padding: '8px 12px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)',
                                            color: '#22c55e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <Share2 size={16} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>SNS 홍보</span>
                                    </button>
                                    <button
                                        onClick={() => handleGenerateVideoCommand(store)}
                                        style={{
                                            padding: '8px 12px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)',
                                            color: '#a855f7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <Video size={16} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>릴스 제작</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {appsLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
                    ) : applications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>신청 내역이 없습니다.</div>
                    ) : (
                        applications.map(app => (
                            <div
                                key={app.id}
                                onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                                style={{
                                    background: '#f8fafc',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    background: expandedAppId === app.id ? 'rgba(168, 85, 247, 0.05)' : 'transparent'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {formatDate(app.createdAt).split(' ')[0]}
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {app.companyName}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {app.email}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                                            background: app.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                            color: app.status === 'approved' ? '#10b981' : '#a855f7',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {app.status === 'approved' ? '승인' : '검토중'}
                                        </span>
                                    </div>
                                </div>

                                {expandedAppId === app.id && (
                                    <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #e2e8f0', marginTop: '-1px' }}>
                                        <div style={{ paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                            <div style={{ fontSize: '0.9rem' }}>
                                                <span style={{ color: '#64748b', fontWeight: 600, marginRight: '8px' }}>신청자:</span>
                                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{app.nickname}</span>
                                            </div>
                                            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px dotted #e2e8f0' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 800 }}>입력된 주소:</div>
                                                <div style={{ fontSize: '0.9rem', wordBreak: 'break-all', color: '#0f172a' }}>{app.googleMapUrl || '주소 정보 없음'}</div>
                                            </div>
                                            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 800 }}>상담 내용:</div>
                                                <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', color: '#0f172a' }}>{app.consultationDetail || '내용 없음'}</div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                                                {app.googleMapUrl && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); window.open(app.googleMapUrl, '_blank'); }}
                                                        style={{
                                                            padding: '10px 16px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0',
                                                            fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                            color: '#0f172a'
                                                        }}
                                                    >
                                                        <MapPin size={16} /> 지도보기
                                                    </button>
                                                )}
                                                {app.status === 'pending' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleApprove(app); }}
                                                        style={{
                                                            padding: '10px 20px', borderRadius: '12px', background: '#a855f7', border: 'none',
                                                            color: 'white', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                                                            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
                                                        }}
                                                    >
                                                        승인 및 등록
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
