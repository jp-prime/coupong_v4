import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    increment
} from 'firebase/firestore';
import { StorageService } from './StorageService';

export const QnaService = {
    // Q&A 게시글 생성
    createPost: async (postData, images) => {
        try {
            let imageUrls = [];
            if (images && images.length > 0) {
                for (const image of images) {
                    const url = await StorageService.uploadImage(image, 'qna_posts', {
                        maxSizeMB: 1.0,
                        initialQuality: 0.95
                    });
                    imageUrls.push(url);
                }
            }

            const docRef = await addDoc(collection(db, 'qna_posts'), {
                ...postData,
                images: imageUrls,
                status: 'pending', // pending, answered
                commentCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating qna post:", error);
            throw error;
        }
    },

    // Q&A 목록 조회
    getPosts: async () => {
        try {
            // 인덱스 오류 방지를 위해 기본 createdAt으로만 가져온 뒤 메모리에서 정렬
            const q = query(collection(db, 'qna_posts'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 메모리 정렬: displayOrder(오름차순), displayOrder가 같으면 createdAt(내림차순)
            return posts.sort((a, b) => {
                const orderA = a.displayOrder !== undefined ? Number(a.displayOrder) : 100;
                const orderB = b.displayOrder !== undefined ? Number(b.displayOrder) : 100;
                
                if (orderA !== orderB) return orderA - orderB;
                
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error fetching qna posts:", error);
            throw error;
        }
    },

    // Q&A 상세 조회
    getPostById: async (id) => {
        try {
            const docRef = doc(db, 'qna_posts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching qna detail:", error);
            throw error;
        }
    },

    // Q&A 수정
    updatePost: async (id, updateData, newImages, existingImages) => {
        try {
            const docRef = doc(db, 'qna_posts', id);
            const docSnap = await getDoc(docRef);
            const prevData = docSnap.exists() ? docSnap.data() : {};
            const prevImages = prevData.images || [];

            const finalData = {
                ...updateData,
                updatedAt: serverTimestamp()
            };

            // 이미지 업데이트 로직
            if (newImages !== undefined || existingImages !== undefined) {
                // Filter out blob URLs that might be passed from local previews
                let imageUrls = (existingImages || []).filter(url => 
                    typeof url === 'string' && url.startsWith('http')
                );

                // 1. Storage에서 제거된 이미지 삭제
                const removedImages = prevImages.filter(url => !imageUrls.includes(url));
                for (const url of removedImages) {
                    await StorageService.deleteImage(url);
                }

                // 2. 새 이미지 업로드
                if (newImages && newImages.length > 0) {
                    for (const image of newImages) {
                        const url = await StorageService.uploadImage(image, 'qna_posts', {
                            maxSizeMB: 1.0,
                            initialQuality: 0.95
                        });
                        imageUrls.push(url);
                    }
                }
                finalData.images = imageUrls;
            }

            await updateDoc(docRef, finalData);
            return true;
        } catch (error) {
            console.error("Error updating qna post:", error);
            throw error;
        }
    },

    // Q&A 삭제
    deletePost: async (id, imageUrls) => {
        try {
            if (imageUrls && imageUrls.length > 0) {
                for (const url of imageUrls) {
                    await StorageService.deleteImage(url);
                }
            }
            await deleteDoc(doc(db, 'qna_posts', id));
            return true;
        } catch (error) {
            console.error("Error deleting qna post:", error);
            throw error;
        }
    },

    // 답변(댓글) 작성
    addComment: async (commentData) => {
        try {
            const docRef = await addDoc(collection(db, 'qna_comments'), {
                ...commentData,
                createdAt: serverTimestamp()
            });

            // 게시글의 상태를 'answered'로 변경하고 댓글 수 증가 (파이어베이스 글인 경우에만)
            if (commentData.postId) {
                const postRef = doc(db, 'qna_posts', commentData.postId);
                const postSnap = await getDoc(postRef);
                if (postSnap.exists()) {
                    await updateDoc(postRef, {
                        status: 'answered',
                        commentCount: increment(1)
                    });
                }
            }

            return docRef.id;
        } catch (error) {
            console.error("Error adding qna comment:", error);
            throw error;
        }
    },

    // 답변(댓글) 목록 조회
    getComments: async (postId) => {
        try {
            const q = query(
                collection(db, 'qna_comments'),
                where('postId', '==', postId)
            );
            const querySnapshot = await getDocs(q);
            let comments = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return comments.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
                return timeA - timeB;
            });
        } catch (error) {
            console.error("Error fetching qna comments:", error);
            throw error;
        }
    },

    // 답변 삭제
    deleteComment: async (id, postId) => {
        try {
            await deleteDoc(doc(db, 'qna_comments', id));
            if (postId) {
                const postRef = doc(db, 'qna_posts', postId);
                const postSnap = await getDoc(postRef);
                if (postSnap.exists()) {
                    await updateDoc(postRef, {
                        commentCount: increment(-1)
                    });
                }
            }
            return true;
        } catch (error) {
            console.error("Error deleting qna comment:", error);
            throw error;
        }
    },
    
    // 게시글 조회수 증가
    incrementPostView: async (postId) => {
        if (!postId) return;
        try {
            const postRef = doc(db, 'qna_posts', postId);
            await updateDoc(postRef, {
                viewCount: increment(1)
            });
        } catch (error) {
            console.error("Error incrementing post view:", error);
        }
    }
};
