import { db } from '../firebase';
import { collection, getDocs, getDoc, doc, query, addDoc, setDoc, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { SanityService } from './SanityService';

// 로컬과 웹 서버의 데이터 소스를 동일하게 맞추기 위해 컬렉션을 탄력적으로 운용
const STORE_COLLECTION = 'coupons'; // 웹 서버에서 주로 사용하는 레거시 컬렉션
const NEW_STORE_COLLECTION = 'stores'; // 신규 데이터가 저장되는 컬렉션

// 헬퍼 함수: 추천 업체를 제외한 일반 업체 가져오기 (데이터 누락 방지 핵심 로직)
const fetchRegularStores = async (db, prevNewLast, prevLegacyLast, needed, recommendedStoreIds, includeInactive) => {
    const { collection, getDocs, query, limit, startAfter } = await import('firebase/firestore');
    const NEW_STORE_COLLECTION = 'stores';
    const STORE_COLLECTION = 'coupons';

    let qNew = query(collection(db, NEW_STORE_COLLECTION), limit(needed * 2)); // 넉넉히 가져옴
    if (prevNewLast) qNew = query(collection(db, NEW_STORE_COLLECTION), startAfter(prevNewLast), limit(needed * 2));

    let qLegacy = query(collection(db, STORE_COLLECTION), limit(needed * 2));
    if (prevLegacyLast) qLegacy = query(collection(db, STORE_COLLECTION), startAfter(prevLegacyLast), limit(needed * 2));

    const [snapNew, snapLegacy] = await Promise.all([
        getDocs(qNew),
        getDocs(qLegacy)
    ]);

    const mergedDocs = [...snapNew.docs, ...snapLegacy.docs];
    const seenIds = new Set(recommendedStoreIds);
    let stores = [];
    let nextNewLast = prevNewLast;
    let nextLegacyLast = prevLegacyLast;

    for (const docSnap of mergedDocs) {
        if (stores.length >= needed) break;
        if (seenIds.has(docSnap.id)) continue;
        
        seenIds.add(docSnap.id);
        const data = docSnap.data();
        if (!data) continue;
        if (!includeInactive && data.isActive === false) continue;

        const source = docSnap.ref.parent.id;
        const finalImage = data.image || data.mainImage || 'https://images.unsplash.com/photo-1544025162-8e6ad793f605?auto=format&fit=crop&q=80&w=800';
        
        stores.push({
            id: docSnap.id,
            ...data,
            badgeMd: false,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().getTime() / 1000 : (data.createdAt ? (typeof data.createdAt === 'number' ? data.createdAt : new Date(data.createdAt).getTime() / 1000) : Date.now() / 1000),
            image: finalImage
        });

        // 사용한 문서 기준으로 커서 업데이트
        if (source === NEW_STORE_COLLECTION) nextNewLast = docSnap;
        if (source === STORE_COLLECTION) nextLegacyLast = docSnap;
    }

    return { stores, newLast: nextNewLast, legacyLast: nextLegacyLast };
};

let storesCache = null;

export const StoreService = {
    // 0. 캐시 초기화 (필요시 호출)
    clearCache: () => { 
        console.log("Clearing storesCache");
        storesCache = null; 
    },

    // 1. 업체 목록 불러오기 (캐싱 적용으로 초고속 반환)
    getAllStores: async (includeInactive = false) => {
        try {
            const result = await StoreService.getStoresPaged(includeInactive, 2000);
            return result.stores || [];
        } catch (error) {
            console.error("Error in getAllStores:", error);
            return [];
        }
    },

    // 1-1. 업체 목록 불러오기 (최적화 버전)
    getStoresPaged: async (includeInactive = false) => {
        try {
            // 1. 모든 업체 정보와 쿠폰 정보를 동시에 가져옴
            const [snapNew, snapLegacy, snapCoupons] = await Promise.all([
                getDocs(query(collection(db, NEW_STORE_COLLECTION), limit(100))),
                getDocs(query(collection(db, STORE_COLLECTION), limit(100))),
                getDocs(query(collection(db, 'store_coupons'), where('isActive', '==', true), limit(1000)))
            ]);

            // 2. 쿠폰 정보 맵핑 (O(N) 성능)
            const couponMap = new Map();
            snapCoupons.docs.forEach(d => {
                const data = d.data();
                if (!data.storeId) return;
                const existing = couponMap.get(data.storeId);
                const currentOrder = (data.displayOrder === null || data.displayOrder === undefined) ? 9999 : Number(data.displayOrder);
                
                // 더 낮은 순번(우선순위)이 있으면 업데이트
                if (!existing || currentOrder < existing.displayOrder) {
                    couponMap.set(data.storeId, {
                        displayOrder: currentOrder,
                        caption: data.caption || null,
                        isRecommended: !!data.isRecommended,
                        isShocking: !!data.isShocking,
                        discount: data.discount || null,
                        rewardAmount: data.rewardAmount || 0
                    });
                }
            });

            // 3. 업체 목록 병합
            const allStores = [];
            const seenIds = new Set();

            // Sanity 데이터 실시간 로드 및 맵 구성 (API Route로 CORS 방지)
            let sanityStores = [];
            try {
                sanityStores = await SanityService.getAllStores();
            } catch (e) {
                console.error("Failed to load sanity stores for listing:", e.message, e.stack);
            }

            const sanityMap = new Map();
            sanityStores.forEach(s => {
                if (s.id) sanityMap.set(s.id, s);
                if (s.sanityId) sanityMap.set(s.sanityId, s);
            });

            [...snapNew.docs, ...snapLegacy.docs].forEach(docSnap => {
                if (seenIds.has(docSnap.id)) return;
                seenIds.add(docSnap.id);

                const data = docSnap.data();
                if (!includeInactive && data.isActive === false) return;

                const c = couponMap.get(docSnap.id) || {};
                
                // 이미지 갤러리 파싱 로직 추가 (객체 배열 대응)
                const parseImages = () => {
                    const raw = data.gallery || data.images || data.store_images || data.photos || data.gallery_list || [];
                    let result = [];
                    if (Array.isArray(raw)) {
                        result = raw.map(item => {
                            if (typeof item === 'string') return item;
                            if (item && typeof item === 'object') return item.url || item.image || item.path || '';
                            return '';
                        }).filter(Boolean);
                    } else if (typeof raw === 'string') {
                        if (raw.startsWith('[')) {
                            try { 
                                const parsed = JSON.parse(raw);
                                if (Array.isArray(parsed)) {
                                    result = parsed.map(item => typeof item === 'object' ? (item.url || item.image || '') : item);
                                }
                            } catch (e) { 
                                result = raw.split(',').map(s => s.trim()).filter(Boolean); 
                            }
                        } else {
                            result = raw.split(',').map(s => s.trim()).filter(Boolean);
                        }
                    }
                    return result;
                };
                const galleryArr = parseImages();
                const finalImage = data.image || data.mainImage || data.thumbnail || data.main_image || data.image_url || data.main_img || galleryArr[0] || 'https://images.unsplash.com/photo-1544025162-8e6ad793f605?auto=format&fit=crop&q=80&w=800';

                let storeObj = {
                    id: docSnap.id,
                    ...data,
                    displayOrder: c.displayOrder ?? 9999,
                    caption: c.caption || null,
                    isRecommended: c.isRecommended || false,
                    isShocking: c.isShocking || false,
                    badgeMd: c.isRecommended || false,
                    discount: c.discount || data.discount || data.discountRate || data.dcRate || data.manualDiscountRate || null,
                    rewardAmount: c.rewardAmount || data.rewardAmount || data.manualRewardRate || 0,
                    vnIntro: data.vnIntro || null,
                    vnIntro2: data.vnIntro2 || null,
                    videoKeywords: data.videoKeywords || [],
                    videoKeywords2: data.videoKeywords2 || [],
                    image: finalImage,
                    images: galleryArr.length > 0 ? galleryArr : [finalImage]
                };

                // 만약 Sanity에도 등록된 가맹점이라면, 실시간으로 덮어쓰기 (대표 이미지와 다국어 텍스트 등)
                const sData = sanityMap.get(docSnap.id);
                if (sData) {
                    storeObj = {
                        ...storeObj,
                        name: sData.name,
                        category: sData.category,
                        slug: sData.slug || storeObj.slug,
                        slogan: sData.slogan,
                        address: sData.address,
                        location: sData.location,
                        description: sData.description,
                        storeDescription: sData.storeDescription,
                        phone: sData.phone,
                        phoneNumber: sData.phoneNumber,
                        image: sData.image, // Sanity 갤러리의 첫 이미지
                        images: sData.images, // Sanity 갤러리 전체
                        imageUrls: sData.imageUrls || [],
                        gallery: sData.gallery,
                        galleryTags: sData.galleryTags,
                        vnIntro: sData.vnIntro,
                        videoKeywords: sData.videoKeywords,
                        vnIntro2: sData.vnIntro2,
                        videoKeywords2: sData.videoKeywords2,
                        kakaoId: sData.kakaoId,
                        youtubeLink: sData.youtubeLink,
                        instagramLink: sData.instagramLink,
                        tiktokLink: sData.tiktokLink,
                        wordpressUrl: sData.wordpressUrl,
                        menuGroups: sData.menuGroups,
                        headerVideo: sData.headerVideo,
                        headerYoutube: sData.headerYoutube,
                        googleMapUrl: sData.googleMapUrl || storeObj.googleMapUrl || '',
                        mapUrl: sData.mapUrl || storeObj.mapUrl || '',
                        isSanityData: true
                    };
                }

                allStores.push(storeObj);
            });

            return { stores: allStores, lastVisible: null };
        } catch (error) {
            console.error("Fetch error:", error);
            return { stores: [], lastVisible: null };
        }
    },

    // 2. 특정 업체 정보 불러오기 (로컬-웹 서버 가교 역할)
    getStoreById: async (storeId) => {
        try {
            // 1차 시도: 'coupons' 컬렉션 (레거시)
            let docRef = doc(db, STORE_COLLECTION, storeId);
            let docSnap = await getDoc(docRef);
            
            // 없으면 2차 시도: 'stores' 컬렉션 (신규)
            if (!docSnap.exists()) {
                docRef = doc(db, NEW_STORE_COLLECTION, storeId);
                docSnap = await getDoc(docRef);
            }

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // 최적화: 리스트용 호출 시에는 쿠폰 여부 확인을 건너뛸 수 있도록 처리 (여기서는 기본 유지하되 속도 개선)
                // 실제 상점 상세 페이지에서는 어차피 쿠폰을 따로 로드하므로 여기서의 로딩은 최소화
                let hasRecommendedCoupon = data.isRecommended || data.badgeMd || false;
                if (!hasRecommendedCoupon) {
                    // 꼭 필요한 경우에만 최소한으로 쿼리
                    try {
                        const recSnap = await getDocs(query(
                            collection(db, 'store_coupons'),
                            where('storeId', '==', storeId),
                            where('isRecommended', '==', true),
                            where('isActive', '==', true),
                            limit(1)
                        ));
                        hasRecommendedCoupon = !recSnap.empty;
                    } catch (e) { /* ignore */ }
                }

                const finalImage = data.image || data.mainImage || data.thumbnail || data.main_image || data.image_url || data.main_img || (data.images && data.images[0]) || (data.store_images && data.store_images[0]) || (data.photos && data.photos[0]) || 'https://images.unsplash.com/photo-1544025162-8e6ad793f605?auto=format&fit=crop&q=80&w=800';
                
                const parseImages = () => {
                    const raw = data.gallery || data.images || data.store_images || data.photos || data.gallery_list || [];
                    if (Array.isArray(raw)) return raw;
                    if (typeof raw === 'string') {
                        if (raw.startsWith('[')) {
                            try { return JSON.parse(raw); } catch (e) { return raw.split(',').map(s => s.trim()).filter(Boolean); }
                        }
                        return raw.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    return [];
                };

                const galleryArr = parseImages();

                let storeObj = {
                    id: docSnap.id,
                    ...data,
                    name: data.name || data.store_name || data.title || data.store_title || "이름 없음",
                    address: data.address || data.location || data.store_address || data.addr || "",
                    location: data.location || data.address || data.store_address || data.addr || "",
                    phone: data.phoneNumber || data.phone || data.contact || data.store_phone || data.tel || "",
                    phoneNumber: data.phoneNumber || data.phone || data.contact || data.store_phone || data.tel || "",
                    description: data.storeDescription || data.description || data.comment || data.introduction || data.info || data.store_info || data.store_comment || data.store_introduce || data.content || data.body || data.memo || data.desc || "",
                    storeDescription: data.storeDescription || data.description || data.comment || data.introduction || data.info || data.store_info || data.store_comment || data.store_introduce || data.content || data.body || data.memo || data.desc || "",
                    
                    images: galleryArr,
                    gallery: galleryArr,
                    image: finalImage,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().getTime() / 1000 : (data.createdAt ? (typeof data.createdAt === 'number' ? data.createdAt : new Date(data.createdAt).getTime() / 1000) : Date.now() / 1000),
                    updatedAt: data.updatedAt || data.createdAt || "",
                    badgeMd: hasRecommendedCoupon || data.badgeMd || false,
                    badgeTop: data.badgeTop || false,
                    storeMode: data.storeMode || 'normal',
                    designStyle: data.designStyle || data.style || data.design_style || null
                };

                // Sanity 데이터 매칭 및 덮어쓰기 (API Route로 CORS 방지)
                try {
                    const sData = await SanityService.getStoreByIdOrSlug(storeId);
                    if (sData) {
                        storeObj = {
                            ...storeObj,
                            name: sData.name,
                            category: sData.category,
                            slug: sData.slug || storeObj.slug,
                            slogan: sData.slogan,
                            address: sData.address,
                            location: sData.location,
                            description: sData.description,
                            storeDescription: sData.storeDescription,
                            phone: sData.phone,
                            phoneNumber: sData.phoneNumber,
                            image: sData.image, // Sanity의 첫 번째 갤러리 이미지
                            images: sData.images, // Sanity의 갤러리 이미지 전체
                            imageUrls: sData.imageUrls || [],
                            gallery: sData.gallery,
                            galleryTags: sData.galleryTags,
                            vnIntro: sData.vnIntro,
                            videoKeywords: sData.videoKeywords,
                            vnIntro2: sData.vnIntro2,
                            videoKeywords2: sData.videoKeywords2,
                            kakaoId: sData.kakaoId,
                            youtubeLink: sData.youtubeLink,
                            instagramLink: sData.instagramLink,
                            tiktokLink: sData.tiktokLink,
                            wordpressUrl: sData.wordpressUrl,
                            menuGroups: sData.menuGroups,
                            headerVideo: sData.headerVideo,
                            headerYoutube: sData.headerYoutube,
                            googleMapUrl: sData.googleMapUrl || storeObj.googleMapUrl || '',
                            mapUrl: sData.mapUrl || storeObj.mapUrl || '',
                            isSanityData: true
                        };
                    }
                } catch (e) {
                    console.error("Failed to merge sanity data in getStoreById:", e);
                }

                return storeObj;
            }
            return null;
        } catch (error) {
            console.error("Error fetching single store:", error);
            throw error;
        }
    },

    // 2-1. 슬러그(맞춤 주소)로 업체 찾기
    getStoreBySlug: async (slug) => {
        try {
            const cleanSlug = slug.toLowerCase().trim();
            
            // 1. 두 컬렉션 모두에서 슬러그 조회 시도
            const [snap1, snap2] = await Promise.all([
                getDocs(query(collection(db, STORE_COLLECTION), where("slug", "==", cleanSlug))),
                getDocs(query(collection(db, NEW_STORE_COLLECTION), where("slug", "==", cleanSlug)))
            ]);
            
            const mergedDocs = [...snap1.docs, ...snap2.docs];
            
            if (mergedDocs.length > 0) {
                const docSnap = mergedDocs[0];
                return StoreService.getStoreById(docSnap.id); // 공통 변환 로직 사용을 위해 getStoreById 호출
            }

            // 2. 검색 결과가 없을 때 전체 목록에서 수동 필터링 (색인 생성 지연 대비)
            console.log("No store found by slug query, trying manual filter fallback...");
            const allStores = await StoreService.getAllStores();
            return allStores.find(s => s.slug?.toLowerCase().trim() === cleanSlug) || null;
            
        } catch (error) {
            console.error("Critical error in getStoreBySlug:", error);
            throw error;
        }
    },

    // 3. 새 업체 등록
    addStore: async (storeData) => {
        try {
            const docRef = await addDoc(collection(db, STORE_COLLECTION), {
                ...storeData,
                isActive: true,
                createdAt: new Date().toISOString()
            });
            StoreService.clearCache(); // 캐시 초기화
            return { id: docRef.id, ...storeData };
        } catch (error) {
            console.error("Error adding store:", error);
            throw error;
        }
    },

    // 4. 업체 정보 수정
    updateStore: async (id, storeData) => {
        try {
            const { deleteField, doc, getDoc, setDoc } = await import('firebase/firestore');
            
            // 1. 어느 컬렉션에 있는지 확인
            let collectionName = STORE_COLLECTION;
            const newDocRef = doc(db, NEW_STORE_COLLECTION, id);
            const newDocSnap = await getDoc(newDocRef);
            
            if (newDocSnap.exists()) {
                collectionName = NEW_STORE_COLLECTION;
            }

            // 2. 데이터 정규화
            const cleanedData = { 
                ...storeData,
                images: deleteField(),
                mainImage: deleteField(),
                thumbnail: deleteField(),
                main_image: deleteField(),
                image_url: deleteField(),
                gallery_list: deleteField(),
                photos: deleteField(),
                store_images: deleteField()
            };

            // 3. 올바른 컬렉션에 저장
            await setDoc(doc(db, collectionName, id), {
                ...cleanedData,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            StoreService.clearCache(); // 캐시 초기화
            console.log(`Updated store ${id} in collection: ${collectionName}`);
        } catch (error) {
            console.error("Error updating store:", error);
            throw error;
        }
    },

    // 5. 업체 삭제
    deleteStore: async (id) => {
        try {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, STORE_COLLECTION, id));
        } catch (error) {
            console.error("Error deleting store:", error);
            throw error;
        }
    },

    getStoresByManagerEmail: async (email, uid) => {
        if (!email && !uid) return [];
        const emailLower = email ? email.trim().toLowerCase() : '';
        const emailRaw = email ? email.trim() : '';

        try {
            const queries = [];
            const collections = [STORE_COLLECTION, NEW_STORE_COLLECTION];

            collections.forEach(colName => {
                const colRef = collection(db, colName);
                if (emailRaw) {
                    const searchTerms = Array.from(new Set([emailLower, emailRaw]));
                    searchTerms.forEach(term => {
                        queries.push(query(colRef, where("managerEmail", "==", term)));
                        queries.push(query(colRef, where("email", "==", term)));
                        queries.push(query(colRef, where("ownerEmail", "==", term)));
                    });
                }

                if (uid) {
                    queries.push(query(colRef, where("managerUid", "==", uid)));
                    queries.push(query(colRef, where("ownerUid", "==", uid)));
                    queries.push(query(colRef, where("uid", "==", uid)));
                }
            });

            const snapshots = await Promise.all(queries.map(q => getDocs(q)));

            let storesMap = new Map();
            snapshots.forEach(snapshot => {
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!storesMap.has(doc.id)) {
                        storesMap.set(doc.id, {
                            id: doc.id,
                            ...data,
                            address: data.address || data.location || "",
                            location: data.location || data.address || "",
                            phone: data.phoneNumber || data.phone || data.contact || "",
                            phoneNumber: data.phoneNumber || data.phone || data.contact || "",
                            image: data.image || data.mainImage || (data.images && data.images[0]) || 'https://images.unsplash.com/photo-1544025162-8e6ad793f605?auto=format&fit=crop&q=80&w=800',
                        });
                    }
                });
            });

            return Array.from(storesMap.values());
        } catch (error) {
            console.error("Error fetching stores by manager email:", error);
            return [];
        }
    },

    // 6. 관심업소(좋아요) 토글
    toggleLike: async (userId, storeId) => {
        try {
            const { runTransaction } = await import('firebase/firestore');
            return await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', userId);
                const storeRef = doc(db, STORE_COLLECTION, storeId);

                const userSnap = await transaction.get(userRef);
                const storeSnap = await transaction.get(storeRef);

                if (!userSnap.exists()) throw new Error("User not found");
                if (!storeSnap.exists()) throw new Error("Store not found");

                const userData = userSnap.data();
                const storeData = storeSnap.data();

                const likedStores = userData.likedStores || [];
                const isLiked = likedStores.includes(storeId);

                let newLikedStores;
                let likeCountChange;

                if (isLiked) {
                    newLikedStores = likedStores.filter(id => id !== storeId);
                    likeCountChange = -1;
                } else {
                    newLikedStores = [...likedStores, storeId];
                    likeCountChange = 1;
                }

                transaction.update(userRef, { likedStores: newLikedStores });
                transaction.update(storeRef, {
                    likeCount: Math.max(0, (storeData.likeCount || 0) + likeCountChange)
                });

                return !isLiked; // 리턴값은 새로운 상태 (true=좋아요됨, false=취소됨)
            });
        } catch (error) {
            console.error("Error toggling store like:", error);
            throw error;
        }
    },

    // 7. 사용자의 관심업소 목록 가져오기
    getLikedStores: async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return [];

            const likedStoreIds = userSnap.data().likedStores || [];
            if (likedStoreIds.length === 0) return [];

            // 병렬로 개별 상점 정보 가져오기
            const storePromises = likedStoreIds.map(id => StoreService.getStoreById(id));
            const stores = await Promise.all(storePromises);

            return stores.filter(Boolean);
        } catch (error) {
            console.error("Error fetching liked stores:", error);
            return [];
        }
    },

    // 8. 가맹 신청 내역 가져오기
    getPartnerApplications: async () => {
        try {
            const q = query(collection(db, 'partner_applications'));
            const querySnapshot = await getDocs(q);
            const apps = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sorting as fallback to avoid index issues
            return apps.sort((a, b) => {
                const getTime = (val) => {
                    if (!val) return 0;
                    if (val.toDate) return val.toDate().getTime();
                    if (val.seconds) return val.seconds * 1000;
                    if (typeof val === 'number') return val;
                    if (val instanceof Date) return val.getTime();
                    try { return new Date(val).getTime() || 0; } catch (e) { return 0; }
                };
                return getTime(b.createdAt) - getTime(a.createdAt);
            });
        } catch (error) {
            console.error("Error fetching partner applications:", error);
            return [];
        }
    },

    // 9. 가맹 신청 승인 처리
    approvePartnerApplication: async (appId, appData) => {
        try {
            const { runTransaction, serverTimestamp } = await import('firebase/firestore');

            return await runTransaction(db, async (transaction) => {
                // 1. 업소 등록 (coupons 컬렉션)
                const newStoreRef = doc(collection(db, STORE_COLLECTION));
                transaction.set(newStoreRef, {
                    name: appData.companyName,
                    managerEmail: appData.email,
                    managerUid: appData.uid,
                    googleMapUrl: appData.googleMapUrl,
                    storeDescription: appData.consultationDetail || '',
                    isActive: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    category: '기타', // 기본값
                    image: 'https://images.unsplash.com/photo-1544025162-8e6ad793f605?auto=format&fit=crop&q=80&w=800'
                });

                // 2. 유저 권한 부여 (users 컬렉션)
                const userRef = doc(db, 'users', appData.uid);
                transaction.update(userRef, {
                    isStoreOwner: true,
                    managedStoreId: newStoreRef.id,
                    updatedAt: serverTimestamp()
                });

                // 3. 신청서 상태 변경
                const appRef = doc(db, 'partner_applications', appId);
                transaction.update(appRef, {
                    status: 'approved',
                    approvedAt: serverTimestamp()
                });

                return newStoreRef.id;
            });
        } catch (error) {
            console.error("Error approving partner application:", error);
            throw error;
        }
    },

    // 10. SNS 홍보 트리거 (Make.com Webhook 호출)
    triggerSNSPromotion: async (storeId, snsData) => {
        try {
            // 관리자님의 Make.com Webhook URL
            const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/c3f8cmej9ossjmmtck6ykcvjgfi68hnq';

            // 실시간 전송 (Webhook)
            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId,
                    requestedAt: new Date().toISOString(),
                    ...snsData
                })
            });

            if (!response.ok) throw new Error('Webhook 전송 실패');

            // 전송 기록을 위해 Firestore에도 상태 업데이트 (선택사항)
            await setDoc(doc(db, STORE_COLLECTION, storeId), {
                snsPromotion: {
                    ...snsData,
                    status: 'sent_to_webhook',
                    lastPromotedAt: new Date().toISOString()
                }
            }, { merge: true });

            return true;
        } catch (error) {
            console.error("Error triggering SNS promotion via Webhook:", error);
            // Webhook URL이 설정되지 않았어도 Firestore 업데이트는 시도 (하이브리드 방식)
            await setDoc(doc(db, STORE_COLLECTION, storeId), {
                snsPromotion: {
                    ...snsData,
                    status: 'pending_trigger',
                    requestedAt: new Date().toISOString()
                }
            }, { merge: true });
            throw error;
        }
    },

    /**
     * 매장 상세 페이지 조회수 증가
     */
    incrementStoreView: async (storeId) => {
        if (!storeId) return;
        try {
            const { increment } = await import('firebase/firestore');
            await setDoc(doc(db, STORE_COLLECTION, storeId), {
                viewCount: increment(1)
            }, { merge: true });
        } catch (error) {
            console.error("Error incrementing store view:", error);
        }
    },

    /**
     * 특정 페이지 방문수 증가
     */
    incrementPageVisit: async (pageId) => {
        try {
            const { increment } = await import('firebase/firestore');
            const statsRef = doc(db, 'statistics', pageId);
            await setDoc(statsRef, {
                totalVisits: increment(1),
                lastVisitedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error(`Error incrementing ${pageId} visit:`, error);
        }
    },

    /**
     * 특정 페이지 통계 가져오기
     */
    subscribePageStats: (pageId, callback) => {
        const statsRef = doc(db, 'statistics', pageId);
        return onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            }
        }, (error) => {
            console.error(`Error subscribing to ${pageId} stats:`, error);
        });
    },
    
    /**
     * 전체 사이트 통계 가져오기
     */
    getGlobalStats: async (pageId = 'global_stats') => {
        try {
            const statsRef = doc(db, 'statistics', pageId);
            const snap = await getDoc(statsRef);
            return snap.exists() ? snap.data() : { totalVisits: 0 };
        } catch (error) {
            console.error(`Error fetching stats for ${pageId}:`, error);
            return { totalVisits: 0 };
        }
    },

    /**
     * 특정 업소에 관리자 이메일을 등록하고 임명 처리합니다.
     */
    assignManagerToStore: async (storeId, email) => {
        try {
            const { doc, getDoc, setDoc, query, collection, where, getDocs, runTransaction } = await import('firebase/firestore');
            
            const emailClean = email ? email.trim().toLowerCase() : '';
            if (!emailClean) {
                // 이메일이 없는 경우 기본값인 운영자 관리자 형태로 되돌림
                // coupons 및 stores 컬렉션 모두 초기화
                const couponsRef = doc(db, STORE_COLLECTION, storeId);
                const storesRef = doc(db, NEW_STORE_COLLECTION, storeId);

                await setDoc(couponsRef, {
                    managerEmail: '',
                    managerUid: ''
                }, { merge: true });

                try {
                    await setDoc(storesRef, {
                        managerEmail: '',
                        managerUid: ''
                    }, { merge: true });
                } catch (e) {}

                StoreService.clearCache();
                return { success: true, message: "관리자가 지정 해제되었습니다. (기본 운영자 권한 작동)" };
            }

            // 1. 해당 이메일을 가진 유저 UID 찾기
            const userQuery = query(collection(db, 'users'), where('email', '==', emailClean));
            const userSnap = await getDocs(userQuery);
            
            if (userSnap.empty) {
                return { success: false, error: "해당 이메일로 등록된 회원을 찾을 수 없습니다. 먼저 회원가입이 필요합니다." };
            }

            const targetUserDoc = userSnap.docs[0];
            const targetUid = targetUserDoc.id;

            // 2. 트랜잭션으로 가맹점 정보 및 유저 권한 동시 갱신
            await runTransaction(db, async (transaction) => {
                const couponsRef = doc(db, STORE_COLLECTION, storeId);
                const storesRef = doc(db, NEW_STORE_COLLECTION, storeId);
                const userRef = doc(db, 'users', targetUid);

                // 가맹점의 관리자 필드 업데이트 (coupons 컬렉션)
                transaction.set(couponsRef, {
                    managerEmail: emailClean,
                    managerUid: targetUid,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                // 가맹점의 관리자 필드 업데이트 (stores 컬렉션 - 존재하는 경우에만)
                try {
                    transaction.set(storesRef, {
                        managerEmail: emailClean,
                        managerUid: targetUid,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                } catch(e) {}

                // 임명된 유저의 권한 설정
                transaction.set(userRef, {
                    isStoreOwner: true,
                    managedStoreId: storeId,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            });

            StoreService.clearCache();
            return { success: true, message: "성공적으로 가맹점 관리자로 임명되었습니다." };
        } catch (error) {
            console.error("Error in assignManagerToStore:", error);
            throw error;
        }
    },
    
    /**
     * 특정 업소의 좋아요(관심업소) 토글 (서버 카운트 증가/감소)
     */
    toggleStoreLike: async (storeId, isLiked) => {
        try {
            const { doc, getDoc, setDoc, increment } = await import('firebase/firestore');
            
            // 1. 어느 컬렉션에 있는지 확인 (coupons 또는 stores)
            let collectionName = STORE_COLLECTION;
            let docRef = doc(db, STORE_COLLECTION, storeId);
            let docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                collectionName = NEW_STORE_COLLECTION;
                docRef = doc(db, NEW_STORE_COLLECTION, storeId);
                docSnap = await getDoc(docRef);
            }
            
            if (docSnap.exists()) {
                await setDoc(docRef, {
                    likeCount: increment(isLiked ? 1 : -1)
                }, { merge: true });
                
                // 캐시 초기화
                StoreService.clearCache();
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error in toggleStoreLike:", error);
            throw error;
        }
    }
};
