import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export const PromoService = {
    getPromos: async () => {
        try {
            const q = query(collection(db, 'promo_posts'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching promo posts:", error);
            return [];
        }
    },
    getPromoById: async (id) => {
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const docRef = doc(db, 'promo_posts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching promo post by ID:", error);
            return null;
        }
    }
};
