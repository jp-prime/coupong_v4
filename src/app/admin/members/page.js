"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, ChevronLeft, Calendar, Mail, Star, Loader2, PlusCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserService } from '@/services/UserService';

export default function AdminMemberManagerPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, new
    const [sortBy, setSortBy] = useState('points'); // points, lastLogin, reward

    // Recharge Modal State
    const [showRecharge, setShowRecharge] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [rechargeReason, setRechargeReason] = useState('관리자 충전');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) {
            router.push('/login');
            return;
        }
        fetchUsers();
    }, [isAdmin, authLoading, router]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const userData = await UserService.getAllUsers();
            setUsers(userData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }) +
            ' ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        if (filter === 'active') return matchesSearch && user.lastLogin;
        return matchesSearch;
    }).sort((a, b) => {
        if (sortBy === 'points') {
            return (b.points || 0) - (a.points || 0);
        } else if (sortBy === 'lastLogin') {
            const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
            const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
            return dateB - dateA;
        } else if (sortBy === 'reward') {
            return (b.totalRewardIncome || 0) - (a.totalRewardIncome || 0);
        }
        return 0;
    });

    const openRechargeModal = (user) => {
        setSelectedUser(user);
        setRechargeAmount('');
        setShowRecharge(true);
    };

    const handleRechargeSubmit = async () => {
        if (!rechargeAmount || isNaN(rechargeAmount)) {
            alert('올바른 금액을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await UserService.rechargePoints(selectedUser.id, parseInt(rechargeAmount), rechargeReason);
            alert(`${selectedUser.displayName}님에게 ${rechargeAmount}P가 충전되었습니다.`);
            setShowRecharge(false);
            fetchUsers(); // Refresh list
        } catch (error) {
            alert('충전 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (uid, name) => {
        if (!window.confirm(`${name || '이 회원'}님의 모든 정보를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            await UserService.deleteUser(uid);
            setUsers(users.filter(u => u.id !== uid));
            alert('회원 정보가 삭제되었습니다.');
        } catch (error) {
            console.error("Error deleting user:", error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    if (!isAdmin) return null;

    return (
        <div style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto', background: '#ffffff', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => router.push('/admin')}
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#0f172a' }}
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>회원 관리</h1>
                <div style={{ marginLeft: 'auto', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                    총 {users.length}명
                </div>
            </div>

            {/* Search & Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                        <input
                            type="text"
                            placeholder="이름 또는 이메일 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 14px 14px 44px', borderRadius: '16px',
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                color: '#0f172a', fontSize: '0.9rem', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Sort Options */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                        { id: 'points', label: '포인트순' },
                        { id: 'lastLogin', label: '최근접속순' },
                        { id: 'reward', label: '리워드수입순' }
                    ].map(option => (
                        <button
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1px solid',
                                borderColor: sortBy === option.id ? '#a855f7' : '#e2e8f0',
                                background: sortBy === option.id ? '#a855f7' : 'transparent',
                                color: sortBy === option.id ? 'white' : '#64748b',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* User List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <Loader2 className="animate-spin" style={{ color: '#a855f7' }} />
                        <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem' }}>회원 정보를 불러오는 중...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '24px', color: '#64748b' }}>
                        검색 결과가 없습니다.
                    </div>
                ) : (
                    filteredUsers.map((user, index) => (
                        <div
                            key={user.id}
                            style={{
                                background: '#f8fafc',
                                padding: '16px',
                                borderRadius: '20px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px'
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '16px',
                                background: user.photoURL ? `url(${user.photoURL}) center/cover` : '#f1f5f9',
                                display: 'flex', alignItems: 'center', justify_content: 'center',
                                color: '#94a3b8', fontWeight: 800, fontSize: '1.2rem',
                                flexShrink: 0, border: user.photoURL ? 'none' : '1px solid #e2e8f0'
                            }}>
                                {user.photoURL ? null : <Users size={24} color="#94a3b8" />}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.displayName || '이름 없음'}
                                    </span>
                                    {user.provider === 'google' && (
                                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'white' }}>G</div>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Mail size={12} /> {user.email || 'Email 없음'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', opacity: 0.8 }}>
                                        <Calendar size={12} /> 최근접속: {formatDate(user.lastLogin)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Star size={14} fill="currentColor" /> {(user.points || 0).toLocaleString()}
                                </div>
                                <button
                                    onClick={() => openRechargeModal(user)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px',
                                        background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'none',
                                        fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    <PlusCircle size={12} /> 충전
                                </button>
                            </div>

                            <button
                                onClick={() => handleDeleteUser(user.id, user.displayName)}
                                style={{ background: 'none', border: 'none', color: '#64748b', padding: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                            >
                                삭제
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div style={{ height: '80px' }} />

            {/* Recharge Modal */}
            {showRecharge && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div
                        onClick={() => setShowRecharge(false)}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                    />
                    <div
                        style={{
                            position: 'relative', background: 'white', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>포인트 충전</h3>
                            <button onClick={() => setShowRecharge(false)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>충전 대상</div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{selectedUser?.displayName} ({selectedUser?.email})</div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>충전 금액 (P)</div>
                            <input
                                type="number"
                                placeholder="충전할 금액 입력"
                                value={rechargeAmount}
                                onChange={(e) => setRechargeAmount(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0',
                                    fontSize: '1.2rem', fontWeight: 800, color: '#a855f7', textAlign: 'center',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>충전 사유</div>
                            <input
                                type="text"
                                placeholder="상세 내역 (예: 이벤트 지급)"
                                value={rechargeReason}
                                onChange={(e) => setRechargeReason(e.target.value)}
                                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#0f172a', outline: 'none' }}
                            />
                        </div>

                        <button
                            onClick={handleRechargeSubmit}
                            disabled={isSubmitting}
                            style={{
                                width: '100%', padding: '18px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', border: 'none',
                                borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 8px 16px rgba(168, 85, 247, 0.3)'
                            }}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : '충전 완료하기'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
