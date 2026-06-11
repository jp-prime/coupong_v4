import { db } from '../firebase';
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, runTransaction, serverTimestamp } from 'firebase/firestore';

export const UserService = {
    // 1. 모든 회원 목록 불러오기 (Firestore 'users' 컬렉션 기준)
    getAllUsers: async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('lastLogin', 'desc'));
            const querySnapshot = await getDocs(q);

            let users = [];
            querySnapshot.forEach((doc) => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return users;
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    },

    // 2. 특정 회원 정보 불러오기
    getUserById: async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return { id: userSnap.id, ...userSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching user detail:", error);
            throw error;
        }
    },

    // 3. 회원 권한 수정 (관리자 메모 또는 등급 등)
    updateUser: async (uid, userData) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                ...userData,
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    // 4. 회원 정보 삭제 (Firestore 문서 제거)
    deleteUser: async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            await deleteDoc(userRef);
            return true;
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },
    // 5. 포인트 충전 (관리자용)
    rechargePoints: async (uid, amount, reason) => {
        console.log(`Starting recharge for ${uid}: ${amount}P (${reason})`);
        try {
            const result = await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', uid);
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("User not found");

                const currentPoints = userSnap.data().points || 0;
                const newPoints = currentPoints + amount;

                // 1. 유저 포인트 업데이트
                transaction.update(userRef, {
                    points: newPoints,
                    updatedAt: serverTimestamp()
                });

                // 2. 히스토리 기록
                const historyRef = doc(collection(db, 'points_history'));
                transaction.set(historyRef, {
                    uid: uid,
                    amount: amount,
                    type: 'recharge',
                    description: reason || '관리자 포인트 충전',
                    timestamp: serverTimestamp()
                });

                console.log(`Transaction queued: User ${uid} updated to ${newPoints}P`);
                return true;
            });
            console.log("Recharge transaction committed successfully");
            return result;
        } catch (error) {
            console.error("Error recharging points:", error);
            throw error;
        }
    }
};
