import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const SETTINGS_DOC_ID = 'system_config';
const SETTINGS_COLLECTION = 'settings';

export const SettingsService = {
    /**
     * Get system settings. If not exists, returns default values.
     */
    getSettings: async () => {
        try {
            const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                // Default reward distribution: 70% Operator, 20% Referrer A, 10% Referrer B
                const defaults = {
                    rewardDistribution: {
                        operator: 70,
                        referrerA: 20,
                        referrerB: 10
                    },
                    storeDetailStyle: 'style2',
                    siteStyle: 1, // Default to Style 1
                    updatedAt: serverTimestamp()
                };
                await setDoc(docRef, defaults);
                return defaults;
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            return {
                rewardDistribution: { operator: 70, referrerA: 20, referrerB: 10 }
            };
        }
    },

    /**
     * Update system settings.
     */
    updateSettings: async (newSettings) => {
        try {
            const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            await setDoc(docRef, {
                ...newSettings,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error updating settings:", error);
            throw error;
        }
    },

    /**
     * Subscribe to settings changes.
     */
    subscribe: (callback) => {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            }
        }, (error) => {
            console.error("Error subscribing to settings:", error);
        });
    },

    /**
     * Force all clients to refresh.
     */
    forceRefresh: async () => {
        try {
            const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            await setDoc(docRef, {
                requiredRefreshTimestamp: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error triggering force refresh:", error);
            throw error;
        }
    }
};
