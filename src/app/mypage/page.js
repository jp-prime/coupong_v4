'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Heart, Clock, Star, LogOut, ChevronRight,
    Gift, Coins, ArrowLeft, Store, MessageSquare, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LikeService } from '@/services/LikeService';
import { db } from '@/firebase';
import {
    collection, query, where, orderBy,
    limit, getDocs
} from 'firebase/firestore';

const TABS = [
    { key: 'likes', label: '좋아요', icon: Heart },
    { key: 'recent', label: '최근이용', icon: Clock },
    { key: 'points', label: '포인트', icon: Coins },
];

export default function MyPage() {
    const router = useRouter();
    const { user, logout, loading, isAdmin, isStoreOwner } = useAuth();
    const [activeTab, setActiveTab] = useState('likes');
    const [likes, setLikes] = useState([]);
    const [recentUses, setRecentUses] = useState([]);
    const [pointHistory, setPointHistory] = useState([]);
    const [dataLoading, setDataLoading] = useState(false);

    // 비로그인 리다이렉트
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    // 탭 데이터 로드
    useEffect(() => {
        if (!user?.uid) return;
        setDataLoading(true);

        const loaders = {
            likes: () => LikeService.getLikes(user.uid),
            recent: async () => {
                const q = query(
                    collection(db, 'coupon_uses'),
                    where('uid', '==', user.uid),
                    limit(20)
                );
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // 클라이언트에서 날짜 정렬
                return data.sort((a, b) => {
                    const ta = a.usedAt?.toDate?.()?.getTime() ?? 0;
                    const tb = b.usedAt?.toDate?.()?.getTime() ?? 0;
                    return tb - ta;
                });
            },
            points: async () => {
                const q = query(
                    collection(db, 'points_history'),
                    where('uid', '==', user.uid),
                    limit(30)
                );
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // 클라이언트에서 날짜 정렬
                return data.sort((a, b) => {
                    const ta = a.timestamp?.toDate?.()?.getTime() ?? 0;
                    const tb = b.timestamp?.toDate?.()?.getTime() ?? 0;
                    return tb - ta;
                });
            },
        };

        loaders[activeTab]()
            .then(data => {
                if (activeTab === 'likes') setLikes(data);
                else if (activeTab === 'recent') setRecentUses(data);
                else setPointHistory(data);
            })
            .catch(console.error)
            .finally(() => setDataLoading(false));
    }, [activeTab, user?.uid]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Store size={36} color="#6366f1" />
                </motion.div>
            </div>
        );
    }

    if (!user) return null;

    const displayName = user.displayName || user.email?.split('@')[0] || '회원';
    const points = user.points ?? 0;
    const photoURL = user.photoURL;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #f0f4ff 0%, #faf5ff 100%)',
            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
            paddingBottom: '40px'
        }}>
            {/* 헤더 */}
            <div style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
                padding: '0 20px 32px',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* 배경 원 장식 */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

                {/* 네비 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', paddingBottom: '24px', position: 'relative', zIndex: 1 }}>
                    <button onClick={() => router.push('/')} style={ghostBtn}>
                        <ArrowLeft size={20} />
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.9rem' }}>마이페이지</span>
                    <button onClick={handleLogout} style={ghostBtn}>
                        <LogOut size={18} />
                    </button>
                </div>

                {/* 프로필 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1, marginBottom: '16px' }}>
                    <div style={{
                        width: '68px', height: '68px', borderRadius: '22px',
                        background: photoURL ? 'transparent' : 'linear-gradient(135deg, #818cf8, #a855f7)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0
                    }}>
                        {photoURL
                            ? <img src={photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '1.8rem', color: 'white', fontWeight: 900 }}>{displayName[0]?.toUpperCase()}</span>
                        }
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {displayName}
                            {isAdmin && (
                                <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 800 }}>운영자</span>
                            )}
                            {!isAdmin && isStoreOwner && (
                                <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 800 }}>가맹점주</span>
                            )}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', marginTop: '2px' }}>{user.email}</div>
                    </div>
                </div>

                {/* 관리자 / 점주 퀵 링크 */}
                {(isAdmin || isStoreOwner) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            position: 'relative', zIndex: 1, marginTop: '8px', marginBottom: '8px'
                        }}
                    >
                        <button
                            onClick={() => router.push(isAdmin ? '/admin' : '/admin/store-owner')}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '14px',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                border: 'none', color: 'white', fontWeight: 900, fontSize: '0.88rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            <Store size={16} /> {isAdmin ? '총괄 어드민 제어판 이동' : '가맹점 파트너 센터 이동'} <ChevronRight size={16} />
                        </button>
                    </motion.div>
                )}

                {/* 포인트 카드 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        marginTop: '24px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '18px', padding: '16px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backdropFilter: 'blur(10px)', position: 'relative', zIndex: 1
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Gift size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 600 }}>보유 포인트</div>
                            <div style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
                                {points.toLocaleString()}<span style={{ fontSize: '0.9rem', fontWeight: 700, marginLeft: '3px' }}>P</span>
                            </div>
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                        borderRadius: '10px', padding: '6px 12px',
                        color: '#fbbf24', fontSize: '0.78rem', fontWeight: 800
                    }}>
                        가입 축하 🎉
                    </div>
                </motion.div>
            </div>

            {/* 탭 */}
            <div style={{ padding: '20px 16px 0' }}>
                <div style={{
                    display: 'flex', background: 'white', borderRadius: '16px',
                    padding: '4px', gap: '4px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    border: '1px solid #f1f5f9'
                }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flex: 1, padding: '10px 8px', borderRadius: '12px',
                                    border: 'none', cursor: 'pointer', fontWeight: 800,
                                    fontSize: '0.82rem', transition: 'all 0.25s',
                                    background: isActive ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'transparent',
                                    color: isActive ? 'white' : '#94a3b8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                    boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                                    fontFamily: 'inherit'
                                }}
                            >
                                <Icon size={15} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 탭 콘텐츠 */}
            <div style={{ padding: '16px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {dataLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                    <Store size={28} color="#6366f1" />
                                </motion.div>
                            </div>
                        ) : (
                            <>
                                {/* 좋아요 탭 */}
                                {activeTab === 'likes' && (
                                    <>
                                        <SectionTitle icon={<Heart size={16} color="#f43f5e" />} title={`좋아요한 업소 ${likes.length}개`} />
                                        {likes.length === 0 ? (
                                            <EmptyState icon="💔" text="아직 좋아요한 업소가 없습니다" sub="업소 상세 페이지에서 ♥ 버튼을 눌러보세요" />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {likes.map((item, i) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        onClick={() => router.push(`/store/${item.storeId}`)}
                                                        style={listCard}
                                                    >
                                                        <div style={{
                                                            width: '44px', height: '44px', borderRadius: '14px',
                                                            background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                        }}>
                                                            <Heart size={20} color="#f43f5e" fill="#f43f5e" />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{item.storeName || '업소명'}</div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '2px' }}>
                                                                {item.likedAt?.toDate?.()?.toLocaleDateString('ko-KR') || ''}
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={16} color="#cbd5e1" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* 최근 이용 탭 */}
                                {activeTab === 'recent' && (
                                    <>
                                        <SectionTitle icon={<Clock size={16} color="#6366f1" />} title="최근 쿠폰 이용 업소" />
                                        {recentUses.length === 0 ? (
                                            <EmptyState icon="🎟️" text="아직 쿠폰 사용 내역이 없습니다" sub="업소를 방문해 쿠폰을 사용해보세요!" />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {recentUses.map((item, i) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        onClick={() => item.storeId && router.push(`/store/${item.storeId}`)}
                                                        style={{ ...listCard, cursor: item.storeId ? 'pointer' : 'default' }}
                                                    >
                                                        <div style={{
                                                            width: '44px', height: '44px', borderRadius: '14px',
                                                            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                        }}>
                                                            <Store size={20} color="#6366f1" />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{item.storeName || '업소'}</div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '2px' }}>
                                                                {item.usedAt?.toDate?.()?.toLocaleString('ko-KR') || item.usedAt || ''}
                                                            </div>
                                                        </div>
                                                        {item.storeId && <ChevronRight size={16} color="#cbd5e1" />}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* 포인트 내역 탭 */}
                                {activeTab === 'points' && (
                                    <>
                                        <SectionTitle icon={<TrendingUp size={16} color="#f59e0b" />} title="포인트 내역" />

                                        {/* 현재 잔액 요약 카드 */}
                                        <div style={{
                                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                            borderRadius: '16px', padding: '16px 20px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            marginBottom: '12px', border: '1px solid #fcd34d'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Gift size={20} color="#d97706" />
                                                <span style={{ fontWeight: 800, color: '#92400e', fontSize: '0.9rem' }}>현재 보유 포인트</span>
                                            </div>
                                            <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#78350f' }}>
                                                {points.toLocaleString()}<span style={{ fontSize: '0.85rem', marginLeft: '2px' }}>P</span>
                                            </span>
                                        </div>

                                        {/* 히스토리 목록 — 없으면 포인트 기반 폴백 표시 */}
                                        {pointHistory.length === 0 && points <= 0 ? (
                                            <EmptyState icon="💰" text="포인트 내역이 없습니다" sub="쿠폰 사용 시 포인트가 적립됩니다" />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                                {/* Firestore 히스토리가 없지만 포인트가 있으면 폴백 카드 표시 */}
                                                {pointHistory.length === 0 && points > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        style={{ ...listCard, cursor: 'default' }}
                                                    >
                                                        <div style={{
                                                            width: '44px', height: '44px', borderRadius: '14px',
                                                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                        }}>
                                                            <Gift size={20} color="#d97706" />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>🎉 회원가입 축하 포인트</div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>
                                                                {user.signupDate
                                                                    ? new Date(user.signupDate).toLocaleDateString('ko-KR')
                                                                    : '가입일'}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontWeight: 900, fontSize: '1rem', color: '#10b981' }}>
                                                            +{points.toLocaleString()}P
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Firestore 히스토리 목록 */}
                                                {pointHistory.map((item, i) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        style={{ ...listCard, cursor: 'default' }}
                                                    >
                                                        <div style={{
                                                            width: '44px', height: '44px', borderRadius: '14px',
                                                            background: item.amount > 0 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                        }}>
                                                            <Gift size={20} color={item.amount > 0 ? '#d97706' : '#ef4444'} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{item.description || item.type}</div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>
                                                                {item.timestamp?.toDate?.()?.toLocaleDateString('ko-KR') || ''}
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontWeight: 900, fontSize: '1rem',
                                                            color: item.amount > 0 ? '#10b981' : '#ef4444'
                                                        }}>
                                                            {item.amount > 0 ? '+' : ''}{item.amount?.toLocaleString()}P
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* 빠른 메뉴 */}
                <div style={{ marginTop: '24px' }}>
                    <SectionTitle icon={<User size={16} color="#6366f1" />} title="메뉴" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { label: '입점 신청', icon: Store, path: '/partner-apply', color: '#a855f7' },
                            { label: '게시판', icon: MessageSquare, path: '/board', color: '#6366f1' },
                        ].map((menu, i) => {
                            const Icon = menu.icon;
                            return (
                                <button
                                    key={i}
                                    onClick={() => router.push(menu.path)}
                                    style={{ ...listCard, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        background: `${menu.color}18`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Icon size={18} color={menu.color} />
                                    </div>
                                    <span style={{ flex: 1, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{menu.label}</span>
                                    <ChevronRight size={16} color="#cbd5e1" />
                                </button>
                            );
                        })}

                        {/* 로그아웃 */}
                        <button
                            onClick={handleLogout}
                            style={{ ...listCard, border: '1px solid #fee2e2', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                        >
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: '#fef2f2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <LogOut size={18} color="#ef4444" />
                            </div>
                            <span style={{ flex: 1, fontWeight: 700, color: '#ef4444', fontSize: '0.95rem' }}>로그아웃</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ icon, title }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', marginTop: '4px' }}>
            {icon}
            <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1e293b' }}>{title}</span>
        </div>
    );
}

function EmptyState({ icon, text, sub }) {
    return (
        <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'white', borderRadius: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{icon}</div>
            <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>{text}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{sub}</div>
        </div>
    );
}

const ghostBtn = {
    width: '38px', height: '38px', borderRadius: '11px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
};

const listCard = {
    background: 'white', borderRadius: '16px', padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: '12px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    transition: 'all 0.2s'
};
