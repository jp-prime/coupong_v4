import { db } from '../firebase';
import {
    doc, setDoc, deleteDoc, getDoc, collection,
    getDocs, serverTimestamp, query, orderBy
} from 'firebase/firestore';

export const LikeService = {
    // 좋아요 토글 (추가/제거)
    toggleLike: async (uid, storeId, storeName) => {
        const likeRef = doc(db, 'users', uid, 'likes', storeId);
        const likeSnap = await getDoc(likeRef);

        if (likeSnap.exists()) {
            await deleteDoc(likeRef);
            return false; // 좋아요 해제
        } else {
            await setDoc(likeRef, {
                storeId,
                storeName: storeName || '',
                likedAt: serverTimestamp(),
            });
            return true; // 좋아요 추가
        }
    },

    // 특정 업소 좋아요 여부 확인
    isLiked: async (uid, storeId) => {
        if (!uid || !storeId) return false;
        const likeRef = doc(db, 'users', uid, 'likes', storeId);
        const likeSnap = await getDoc(likeRef);
        return likeSnap.exists();
    },

    // 해당 유저의 좋아요 목록 전체 조회
    getLikes: async (uid) => {
        if (!uid) return [];
        const likesRef = collection(db, 'users', uid, 'likes');
        const q = query(likesRef, orderBy('likedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
};
