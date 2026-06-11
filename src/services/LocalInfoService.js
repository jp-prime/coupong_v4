import { db } from '../firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, limit, startAfter, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'local_info';

export const LocalInfoService = {
    // 리스트 가져오기 (페이지네이션 지원)
    async getLocalInfos(lastVisible = null, pageSize = 18) {
        try {
            let q;
            if (lastVisible) {
                q = query(
                    collection(db, COLLECTION_NAME),
                    startAfter(lastVisible),
                    limit(pageSize)
                );
            } else {
                q = query(
                    collection(db, COLLECTION_NAME),
                    limit(pageSize)
                );
            }

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                return { data: [], lastVisible: null };
            }

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                data,
                lastVisible: snapshot.docs[snapshot.docs.length - 1]
            };
        } catch (error) {
            console.error("Critical Error in LocalInfoService.getLocalInfos:", error);
            if (error.message) console.error("Firebase Error Message:", error.message);
            return { data: [], lastVisible: null }; 
        }
    },

    // 정보 등록
    async addLocalInfo(info) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...info,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding local info:", error);
            throw error;
        }
    },

    // 정보 수정
    async updateLocalInfo(id, info) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...info,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating local info:", error);
            throw error;
        }
    },

    // 정보 삭제
    async deleteLocalInfo(id) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting local info:", error);
            throw error;
        }
    }
};
