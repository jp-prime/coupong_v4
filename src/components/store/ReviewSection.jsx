import React, { useState, useEffect } from 'react';
import { 
    Star, Edit, Trash2, User 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import { 
    doc, updateDoc, collection, query, where, addDoc, 
    deleteDoc, orderBy, onSnapshot, serverTimestamp, increment 
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useStoreHelpers } from '../../hooks/useStoreHelpers';

function ReviewSection({ businessId, isAdmin: propIsAdmin }) {
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const { user, isAdmin: contextIsAdmin } = useAuth();
    const isAdmin = contextIsAdmin || propIsAdmin;
    const [customAuthor, setCustomAuthor] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editComment, setEditComment] = useState('');
    const [editRating, setEditRating] = useState(5);
    const [isWriting, setIsWriting] = useState(false);
    const { getLocalizedString } = useStoreHelpers();

    useEffect(() => {
        if (!businessId) return;
        
        const q = query(
            collection(db, 'reviews'),
            where('businessId', '==', businessId),
            orderBy('date', 'desc')
        );

        let currentUnsubscribe = null;
        const startSnapshot = (currentQ, isFallback = false) => {
            if (currentUnsubscribe) currentUnsubscribe();
            currentUnsubscribe = onSnapshot(currentQ, (snapshot) => {
                const fetchedReviews = snapshot.docs.map(doc => {
                    try {
                        const data = doc.data();
                        let dateVal = data.date;
                        if (data.date?.toDate) {
                            dateVal = data.date.toDate().toISOString();
                        } else if (data.date && typeof data.date === 'object' && data.date.seconds) {
                            dateVal = new Date(data.date.seconds * 1000).toISOString();
                        }

                        return {
                            id: doc.id,
                            ...data,
                            date: dateVal || new Date().toISOString()
                        };
                    } catch (e) {
                        console.error("Single review parse error:", e);
                        return null;
                    }
                }).filter(Boolean);
                setReviews(fetchedReviews);
            }, (err) => {
                console.error("Reviews listener error:", err);
                if (!isFallback && (err.code === 'failed-precondition' || err.message.includes('index'))) {
                    const fallbackQ = query(collection(db, 'reviews'), where('businessId', '==', businessId));
                    startSnapshot(fallbackQ, true);
                }
            });
        };
        startSnapshot(q);
        return () => { if (currentUnsubscribe) currentUnsubscribe(); };
    }, [businessId]);

    const handleSubmit = async () => {
        if (!comment.trim()) return;
        if (!user) {
            if (window.confirm('리뷰 작성을 위해 로그인이 필요합니다.')) {
                window.location.href = '/login';
            }
            return;
        }
        const defaultAdminName = user.displayName || '관리자';
        const finalAuthor = (isAdmin && customAuthor.trim()) ? customAuthor.trim() : (isAdmin ? defaultAdminName : (user.displayName || '익명'));
        const isAnonymous = isAdmin && customAuthor.trim() !== '';

        try {
            console.log("Submitting review for businessId:", businessId);
            if (!businessId) {
                alert("매장 정보를 찾을 수 없어 리뷰를 등록할 수 없습니다.");
                return;
            }

            await addDoc(collection(db, 'reviews'), {
                businessId, rating, comment, author: finalAuthor,
                email: isAnonymous ? `admin-anon-${Date.now()}@coupong.com` : user.email,
                photoURL: isAnonymous ? '' : (user.photoURL || ''),
                date: serverTimestamp()
            });

            // Update review counts in both possible collections
            const bizRef = doc(db, 'coupons', businessId);
            try {
                await updateDoc(bizRef, { reviews: increment(1) });
            } catch (e) {
                try {
                    await updateDoc(doc(db, 'businesses', businessId), { reviews: increment(1) });
                } catch (e2) {
                    console.error("Failed to update review count:", e2);
                }
            }

            setComment(''); setRating(5); setCustomAuthor('');
            setIsWriting(false);
            alert('리뷰가 등록되었습니다.');
        } catch (err) { 
            console.error("Review submission error:", err);
            alert('리뷰 등록 중 오류가 발생했습니다: ' + err.message);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (window.confirm('리뷰를 삭제하시겠습니까?')) {
            try {
                await deleteDoc(doc(db, 'reviews', reviewId));
                const bizRef = doc(db, 'coupons', businessId);
                try {
                    await updateDoc(bizRef, { reviews: increment(-1) });
                } catch (e) {
                    try {
                        await updateDoc(doc(db, 'businesses', businessId), { reviews: increment(-1) });
                    } catch (e2) {}
                }
            } catch (err) { console.error(err); }
        }
    };

    const handleUpdateDate = async (rid, newDate) => {
        if (!newDate) return;
        try {
            const dateObj = new Date(newDate);
            if (isNaN(dateObj.getTime())) return;
            await updateDoc(doc(db, 'reviews', rid), { date: dateObj });
        } catch (e) { console.error(e); }
    };

    const startEdit = (review) => {
        setEditingReviewId(review.id);
        setEditComment(review.comment);
        setEditRating(review.rating);
    };

    const saveEdit = async (reviewId) => {
        try {
            await updateDoc(doc(db, 'reviews', reviewId), { comment: editComment, rating: editRating });
            setEditingReviewId(null);
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{ marginTop: '0px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '4px', height: '20px', background: '#6366f1', borderRadius: '2px' }} />
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: '#1e293b', letterSpacing: '-0.5px' }}>
                        리뷰 <span style={{ color: '#6366f1', fontWeight: 900, marginLeft: '6px' }}>Review</span>
                        <span style={{ fontSize: '1.05rem', color: '#94a3b8', marginLeft: '6px', fontWeight: 800 }}>({reviews.length})</span>
                    </h3>
                </div>
                {!isWriting && (
                    <button 
                        onClick={() => setIsWriting(true)}
                        style={{
                            padding: '8px 16px',
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '100px',
                            color: '#0f172a',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <Edit size={16} /> 리뷰 쓰기
                    </button>
                )}
            </div>

            {isWriting && (
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star 
                                    key={s} 
                                    size={28} 
                                    fill={s <= rating ? "#FFD700" : "none"} 
                                    color={s <= rating ? "#FFD700" : "#cbd5e1"} 
                                    onClick={() => setRating(s)} 
                                    style={{ cursor: 'pointer' }} 
                                />
                            ))}
                        </div>

                        {isAdmin && (
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px', marginBottom: '4px', display: 'block', fontWeight: '800' }}>작성자 이름 (관리자)</span>
                                <input 
                                    type="text" 
                                    value={customAuthor} 
                                    onChange={e => setCustomAuthor(e.target.value)} 
                                    placeholder={`미입력 시 '${user?.displayName || '관리자'}'로 표시`} 
                                    style={{ width: '100%', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '14px' }} 
                                />
                            </div>
                        )}

                        <textarea 
                            value={comment} 
                            onChange={e => setComment(e.target.value)} 
                            placeholder="방문 경험을 공유해 주세요." 
                            style={{ width: '100%', padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '15px', minHeight: '120px', marginBottom: '16px', resize: 'none' }} 
                        />
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={handleSubmit} 
                                style={{ flex: 2, padding: '16px', background: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: '950', fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
                            >
                                리뷰 등록하기
                            </button>
                            <button 
                                onClick={() => setIsWriting(false)} 
                                style={{ flex: 1, padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#64748b', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reviews.map(r => {
                    const isEditing = editingReviewId === r.id;
                    const isAnonymousAdmin = r.email?.includes('admin-anon-');
                    const currentAuthor = isAnonymousAdmin ? r.author : (user && r.email === user.email ? user.displayName : r.author);
                    const currentPhoto = isAnonymousAdmin ? '' : (user && r.email === user.email ? user.photoURL : r.photoURL);
                    let dateStr = r.date ? new Date(r.date).toISOString().split('T')[0] : '';

                    return (
                        <div key={r.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        {currentPhoto ? <img src={currentPhoto} alt={currentAuthor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={26} color="#94a3b8" />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.05rem', marginBottom: '4px', fontFamily: "'Pretendard', sans-serif" }}>{getLocalizedString(currentAuthor)}</div>
                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            {isEditing ? (
                                                [1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= editRating ? "#FFD700" : "none"} color={s <= editRating ? "#FFD700" : "#cbd5e1"} onClick={() => setEditRating(s)} style={{ cursor: 'pointer' }} />)
                                            ) : (
                                                [1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= r.rating ? "#FFD700" : "none"} color={s <= r.rating ? "#FFD700" : "transparent"} />)
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isAdmin ? (
                                        <input type="date" value={dateStr} onChange={(e) => handleUpdateDate(r.id, e.target.value)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', padding: '6px 10px', borderRadius: '10px', fontWeight: '800' }} />
                                    ) : (
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>{r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
                                    )}
                                </div>
                            </div>
                            {isEditing ? (
                                <div style={{ paddingLeft: '66px' }}>
                                    <textarea value={editComment} onChange={e => setEditComment(e.target.value)} style={{ width: '100%', padding: '14px', background: '#fff', border: '2px solid #ef4444', borderRadius: '12px', color: '#0f172a', fontSize: '15px', minHeight: '80px', marginBottom: '12px' }} />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => saveEdit(r.id)} style={{ padding: '10px 24px', background: '#6366f1', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '900' }}>수정 완료</button>
                                        <button onClick={() => setEditingReviewId(null)} style={{ padding: '10px 24px', background: '#64748b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '900' }}>취소</button>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.92rem', lineHeight: '1.45', color: '#334155', paddingLeft: '66px', margin: 0, whiteSpace: 'pre-wrap', fontWeight: 500, letterSpacing: '-0.3px' }}>{r.comment}</p>
                            )}
                            {isAdmin && !isEditing && (
                                <div style={{ paddingLeft: '66px', marginTop: '16px', display: 'flex', gap: '15px' }}>
                                    <button onClick={() => startEdit(r)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '850', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>수정</button>
                                    <button onClick={() => handleDeleteReview(r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '850', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>삭제</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ReviewSection;
