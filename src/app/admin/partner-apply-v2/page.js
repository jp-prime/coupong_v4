"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ClipboardList, 
    Search, 
    Calendar, 
    Phone, 
    Mail, 
    MapPin, 
    Gift, 
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Building2,
    Megaphone,
    Video,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function AdminPartnerApplicationsPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) {
            router.push('/login');
            return;
        }
        fetchApplications();
    }, [isAdmin, authLoading]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            
            const q = query(collection(db, 'partner_applications_v2'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const apps = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setApplications(apps);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            
            await updateDoc(doc(db, 'partner_applications_v2', id), {
                status: newStatus
            });
            setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
            if (selectedApp?.id === id) {
                setSelectedApp(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("상태 수정 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("정말로 이 신청서를 삭제하시겠습니까?")) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            
            await deleteDoc(doc(db, 'partner_applications_v2', id));
            setApplications(prev => prev.filter(app => app.id !== id));
            setSelectedApp(null);
        } catch (error) {
            console.error("Error deleting application:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const filteredApps = applications.filter(app => 
        app.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.phoneNumber?.includes(searchTerm)
    );

    const getPlanIcon = (plan) => {
        switch(plan) {
            case 'basic': return <Megaphone size={16} />;
            case 'premium': return <Video size={16} />;
            default: return <Gift size={16} />;
        }
    };

    const getPlanColor = (plan) => {
        switch(plan) {
            case 'basic': return '#3b82f6';
            case 'premium': return '#a855f7';
            default: return '#64748b';
        }
    };

    const DetailItem = ({ label, value, icon, isMultiline, isLink }) => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                {icon} {label}
            </div>
            {isLink ? (
                <a 
                    href={value} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                        fontSize: '0.9rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px',
                        wordBreak: 'break-all', textDecoration: 'none', fontWeight: 600
                    }}
                >
                    링크 열기 <ExternalLink size={14} />
                </a>
            ) : (
                <div style={{ 
                    fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, 
                    whiteSpace: isMultiline ? 'pre-wrap' : 'normal',
                    background: '#f8fafc', padding: '10px', borderRadius: '10px'
                }}>
                    {value || '-'}
                </div>
            )}
        </div>
    );

    const StatusButton = ({ active, onClick, color, label, icon }) => (
        <button
            onClick={onClick}
            style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', borderRadius: '10px', border: `1.5px solid ${active ? color : '#e2e8f0'}`,
                background: active ? `${color}10` : 'white', color: active ? color : '#64748b',
                fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
            }}
        >
            {icon} {label}
        </button>
    );

    if (authLoading || (loading && applications.length === 0)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
                <Loader2 className="animate-spin" size={40} color="#6366f1" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 16px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc', paddingBottom: '80px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <button 
                        onClick={() => router.push('/admin')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}
                    >
                        <ArrowLeft size={14} /> 관리자 홈으로
                    </button>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ClipboardList color="#6366f1" />
                        입점신청 현황
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>베트남 가맹점 입점 제휴 신청 내역입니다.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="업소명, 이메일 검색..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '10px 16px 10px 40px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            width: '240px',
                            background: '#ffffff'
                        }}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '1.2fr 1fr' : '1fr', gap: '24px' }}>
                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredApps.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                            <p style={{ color: '#94a3b8' }}>접수된 신청서가 없습니다.</p>
                        </div>
                    ) : (
                        filteredApps.map(app => (
                            <div
                                key={app.id}
                                onClick={() => setSelectedApp(app)}
                                style={{
                                    background: 'white',
                                    padding: '16px',
                                    borderRadius: '20px',
                                    border: `2px solid ${selectedApp?.id === app.id ? '#6366f1' : '#e2e8f0'}`,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '12px', 
                                            background: `${getPlanColor(app.plan)}15`, color: getPlanColor(app.plan),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {getPlanIcon(app.plan)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{app.companyName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{app.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ 
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800,
                                        background: app.status === 'pending' ? '#fff7ed' : (app.status === 'approved' ? '#f0fdf4' : '#fef2f2'),
                                        color: app.status === 'pending' ? '#c2410c' : (app.status === 'approved' ? '#15803d' : '#dc2626')
                                    }}>
                                        {app.status === 'pending' ? '검토중' : (app.status === 'approved' ? '승인됨' : '반려')}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={14} /> {app.createdAt?.seconds ? format(app.createdAt.seconds * 1000, 'yyyy.MM.dd') : '-'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Phone size={14} /> {app.phoneNumber}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail View */}
                {selectedApp && (
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '24px',
                            border: '1px solid #e2e8f0',
                            padding: '24px',
                            height: 'fit-content',
                            position: 'sticky',
                            top: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>상세 내역</h2>
                            <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>닫기</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <DetailItem label="업소명" value={selectedApp.companyName} icon={<Building2 size={16} />} />
                            <DetailItem label="연락처" value={selectedApp.phoneNumber} icon={<Phone size={16} />} />
                            <DetailItem label="이메일" value={selectedApp.email} icon={<Mail size={16} />} />
                            <DetailItem label="선택 플랜" value={selectedApp.plan?.toUpperCase()} icon={getPlanIcon(selectedApp.plan)} />
                            <DetailItem label="쿠폰 상세" value={selectedApp.couponDetail} icon={<Gift size={16} />} isMultiline />
                            <DetailItem 
                                label="구글맵 위치" 
                                value={selectedApp.googleMapUrl} 
                                icon={<MapPin size={16} />} 
                                isLink 
                            />
                            
                            <div style={{ marginTop: '12px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>상태 변경</p>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                    <StatusButton 
                                        active={selectedApp.status === 'approved'} 
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                                        color="#10B981"
                                        label="승인"
                                        icon={<CheckCircle2 size={16} />}
                                    />
                                    <StatusButton 
                                        active={selectedApp.status === 'rejected'} 
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                                        color="#EF4444"
                                        label="반려"
                                        icon={<XCircle size={16} />}
                                    />
                                    <StatusButton 
                                        active={selectedApp.status === 'pending'} 
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'pending')}
                                        color="#F59E0B"
                                        label="대기"
                                        icon={<Clock size={16} />}
                                    />
                                </div>
                                <button 
                                    onClick={() => handleDelete(selectedApp.id)}
                                    style={{ 
                                        width: '100%', padding: '12px', borderRadius: '12px', 
                                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2',
                                        fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    삭제하기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
