import { db, storage } from '../firebase';
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
    increment,
    limit
} from 'firebase/firestore';
import { StorageService } from './StorageService';

export const DiscountService = {
    // 1. 상품 관련 기능
    
    // 전체 상품 목록 조회
    getDiscountProducts: async (isActiveOnly = true, managerId = null) => {
        try {
            const productsRef = collection(db, 'discount_products');
            let q = query(productsRef, orderBy('createdAt', 'desc'));
            
            const querySnapshot = await getDocs(q);
            let products = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 인덱스 없이도 동작하도록 인메모리 필터링 수행
            if (isActiveOnly) {
                products = products.filter(p => p.isActive === true);
            }
            if (managerId) {
                products = products.filter(p => p.managerId === managerId);
            }

            return products;
        } catch (error) {
            console.error("Error fetching discount products:", error);
            return [];
        }
    },

    // 단일 상품 상세 조회
    getProductById: async (productId) => {
        try {
            const docRef = doc(db, 'discount_products', productId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching product detail:", error);
            throw error;
        }
    },

    // 상품 등록
    createProduct: async (productData, images, managerId = null) => {
        try {
            let imageUrls = [];
            if (images && images.length > 0) {
                if (typeof images[0] === 'string') {
                    imageUrls = images;
                } else {
                    for (const image of images) {
                        const url = await StorageService.uploadImage(image, 'discount_products', {
                            maxSizeMB: 0.5,
                            initialQuality: 0.9
                        });
                        imageUrls.push(url);
                    }
                }
            }

            const docRef = await addDoc(collection(db, 'discount_products'), {
                ...productData,
                images: imageUrls,
                managerId: managerId,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                viewCount: 0,
                orderCount: 0
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating discount product:", error);
            throw error;
        }
    },

    // 상품 수정
    updateProduct: async (productId, productData, images) => {
        try {
            const docRef = doc(db, 'discount_products', productId);
            let updatedData = { ...productData, updatedAt: serverTimestamp() };
            
            if (images && images.length > 0) {
                updatedData.images = images;
            }

            await updateDoc(docRef, updatedData);
        } catch (error) {
            console.error("Error updating discount product:", error);
            throw error;
        }
    },

    // 상품 삭제
    deleteProduct: async (productId) => {
        try {
            const docRef = doc(db, 'discount_products', productId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting discount product:", error);
            throw error;
        }
    },

    // 2. 주문 관련 기능
    createOrder: async (orderData) => {
        try {
            const docRef = await addDoc(collection(db, 'discount_orders'), {
                ...orderData,
                status: 'pending',
                paymentMethod: 'COD',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            if (orderData.items && orderData.items.length > 0) {
                const productIds = [...new Set(orderData.items.map(item => item.productId))];
                for (const pid of productIds) {
                    const productRef = doc(db, 'discount_products', pid);
                    await updateDoc(productRef, {
                        orderCount: increment(1)
                    });
                }
            } else if (orderData.productId) {
                const productRef = doc(db, 'discount_products', orderData.productId);
                await updateDoc(productRef, {
                    orderCount: increment(1)
                });
            }

            return docRef.id;
        } catch (error) {
            console.error("Error creating discount order:", error);
            throw error;
        }
    },

    // 내 주문 내역 조회
    getMyOrders: async (userId) => {
        try {
            const q = query(
                collection(db, 'discount_orders'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching user orders:", error);
            return [];
        }
    },

    // 매니저 전용 주문 조회
    getOrdersByManager: async (managerId) => {
        try {
            const q = query(
                collection(db, 'discount_orders'),
                where('managerId', '==', managerId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching manager orders:", error);
            return [];
        }
    },

    // 전체 주문 목록 조회
    getAllOrders: async () => {
        try {
            const q = query(collection(db, 'discount_orders'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching all orders:", error);
            throw error;
        }
    },

    // 주문 상태 변경
    updateOrderStatus: async (orderId, status) => {
        try {
            const docRef = doc(db, 'discount_orders', orderId);
            await updateDoc(docRef, {
                status: status,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    }
};
