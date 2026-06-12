import { StoreService } from '@/services/StoreService';
import { PromoService } from '@/services/PromoService';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
    const baseUrl = 'https://www.vinatong.store';

    // Static URLs
    const routes = [
        '',
        '/partner-apply',
        '/board',
        '/promos',
        '/discount-mall',
        '/localinfo',
        '/v3'
    ].map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1.0 : 0.8,
    }));

    // Dynamic Stores
    let storeRoutes = [];
    try {
        const stores = await StoreService.getAllStores();
        storeRoutes = stores.map(store => ({
            url: `${baseUrl}/store/${store.slug || store.id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));
    } catch (e) {
        console.error("Sitemap dynamic stores fetch failed", e);
    }

    // Dynamic Promos
    let promoRoutes = [];
    try {
        const promos = await PromoService.getPromos();
        promoRoutes = promos.map(promo => ({
            url: `${baseUrl}/promos?id=${promo.id}`,
            lastModified: promo.createdAt?.toDate ? promo.createdAt.toDate() : new Date(promo.createdAt || Date.now()),
            changeFrequency: 'weekly',
            priority: 0.6,
        }));
    } catch (e) {
        console.error("Sitemap dynamic promos fetch failed", e);
    }

    // Dynamic Boards
    let boardRoutes = [];
    try {
        const postsCol = collection(db, 'posts');
        const snapshot = await getDocs(postsCol);
        boardRoutes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                url: `${baseUrl}/board?id=${doc.id}`,
                lastModified: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                changeFrequency: 'daily',
                priority: 0.6,
            };
        });
    } catch (e) {
        console.error("Sitemap dynamic boards fetch failed", e);
    }

    return [...routes, ...storeRoutes, ...promoRoutes, ...boardRoutes];
}
