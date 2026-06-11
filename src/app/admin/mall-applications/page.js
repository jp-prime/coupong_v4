"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ClipboardList, 
    Search, 
    Calendar, 
    Phone, 
    Mail, 
    Package, 
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Percent,
    Image as ImageIcon,
    ArrowLeft,
    User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function AdminMallApplicationsPage() {
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
            
            const q = query(collection(db, 'mall_applications'), orderBy('createdAt', 'desc'));
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
            
            await updateDoc(doc(db, 'mall_applications', id), {
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
            
            await deleteDoc(doc(db, 'mall_applications', id));
            setApplications(prev => prev.filter(app => app.id !== id));
            setSelectedApp(null);
        } catch (error) {
            console.error("Error deleting application:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const filteredApps = applications.filter(app => 
        app.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.contact?.includes(searchTerm)
    );

    const DetailItem = ({ label, value, icon, isMultiline, isAccent }) => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {icon} {label}
            </div>
            <div style={{ 
                fontSize: '0.95rem', color: isAccent ? '#a855f7' : '#1e293b', fontWeight: 800, 
                whiteSpace: isMultiline ? 'pre-wrap' : 'normal',
                background: '#f8fafc', padding: '14px 16px', borderRadius: '16px',
                lineHeight: 1.6
            }}>
                {value || '-'}
            </div>
        </div>
    );

    const StatusButton = ({ active, onClick, color, label, icon }) => (
        <button
            onClick={onClick}
            style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '12px', borderRadius: '14px', border: `2px solid ${active ? color : '#e2e8f0'}`,
                background: active ? `${color}10` : 'white', color: active ? color : '#64748b',
                fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.23s'
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
        <div style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc', paddingBottom: '80px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <button 
                        onClick={() => router.push('/admin')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}
                    >
                        <ArrowLeft size={14} /> 어드민 홈으로
                    </button>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 950, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ClipboardList color="#a855f7" />
                        할인몰 입점 신청 관리
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>할인몰 입점 신청 내역을 관리하고 검토합니다.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="제품명, 신청자, 연락처 검색..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '12px 16px 12px 42px',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.95rem',
                            outline: 'none',
                            width: '320px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                            background: '#ffffff'
                        }}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '1fr 1fr' : '1fr', gap: '32px' }}>
                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredApps.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '32px', border: '1.5px dashed #e2e8f0' }}>
                            <Package size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                            <p style={{ color: '#64748b', fontWeight: 600 }}>접수된 신청서가 없습니다.</p>
                        </div>
                    ) : (
                        filteredApps.map(app => (
                            <div
                                key={app.id}
                                onClick={() => setSelectedApp(app)}
                                style={{
                                    background: 'white',
                                    padding: '20px',
                                    borderRadius: '24px',
                                    border: `2.5px solid ${selectedApp?.id === app.id ? '#a855f7' : 'transparent'}`,
                                    cursor: 'pointer',
                                    boxShadow: selectedApp?.id === app.id ? '0 12px 24px rgba(168, 85, 247, 0.1)' : '0 4px 12px rgba(0,0,0,0.02)',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '14px' }}>
                                        <div style={{ 
                                            width: '56px', height: '56px', borderRadius: '16px', 
                                            background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9'
                                        }}>
                                            {app.imageUrl ? (
                                                <img src={app.imageUrl} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', marginBottom: '2px' }}>{app.productName}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{app.applicantName} | {app.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ 
                                        padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800,
                                        background: app.status === 'pending' ? '#fff7ed' : (app.status === 'approved' ? '#f0fdf4' : '#fef2f2'),
                                        color: app.status === 'pending' ? '#c2410c' : (app.status === 'approved' ? '#15803d' : '#dc2626')
                                    }}>
                                        {app.status === 'pending' ? '검토중' : (app.status === 'approved' ? '승인됨' : '반려')}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #f8fafc', paddingTop: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={14} /> {app.createdAt?.seconds ? format(app.createdAt.seconds * 1000, 'yyyy.MM.dd') : '-'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Phone size={14} /> {app.contact}
                                    </div>
                                    {app.commissionRate && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a855f7', fontWeight: 800 }}>
                                            <Percent size={14} /> {app.commissionRate}%
                                        </div>
                                    )}
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
                            borderRadius: '32px',
                            border: '1px solid #e2e8f0',
                            padding: '32px',
                            height: 'fit-content',
                            position: 'sticky',
                            top: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 950, letterSpacing: '-0.5px' }}>상세 보기</h2>
                            <button onClick={() => setSelectedApp(null)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '50%' }}>
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {selectedApp.imageUrl && (
                                <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #f1f5f9', maxHeight: '300px' }}>
                                    <img src={selectedApp.imageUrl} alt="Ref" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }} />
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <DetailItem label="제품명" value={selectedApp.productName} icon={<Package size={16} />} />
                                <DetailItem label="수수료 (%)" value={selectedApp.commissionRate ? `${selectedApp.commissionRate}%` : '미입력'} icon={<Percent size={16} />} isAccent />
                            </div>

                            <DetailItem label="제품 소개" value={selectedApp.productIntro} icon={<ClipboardList size={16} />} isMultiline />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <DetailItem label="신청자" value={selectedApp.applicantName} icon={<User size={16} />} />
                                <DetailItem label="연락처" value={selectedApp.contact} icon={<Phone size={16} />} />
                            </div>
                            <DetailItem label="이메일" value={selectedApp.email} icon={<Mail size={16} />} />
                            
                            <div style={{ marginTop: '16px', paddingTop: '24px', borderTop: '2px solid #f8fafc' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '16px' }}>상태 관리</p>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
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
                                        width: '100%', padding: '16px', borderRadius: '16px', 
                                        background: '#fef2f2', color: '#dc2626', border: 'none',
                                        fontSize: '0.95rem', fontWeight: 900, cursor: 'pointer'
                                    }}
                                >
                                    신청서 삭제하기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
