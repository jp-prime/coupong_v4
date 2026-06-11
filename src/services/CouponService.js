import { db } from '../firebase';
import { collection, getDocs, getDoc, addDoc, doc, setDoc, deleteDoc, updateDoc, query, where, orderBy, serverTimestamp, limit, startAfter, getCountFromServer } from 'firebase/firestore';

const COUPON_COLLECTION = 'store_coupons';

export const CouponService = {
    // 1. 활성화된 모든 쿠폰 불러오기 (메인 진열용)
    getActiveCoupons: async () => {
        try {
            const q = query(
                collection(db, COUPON_COLLECTION),
                where("isActive", "==", true)
            );
            const querySnapshot = await getDocs(q);
            const coupons = [];
            querySnapshot.forEach((doc) => {
                coupons.push({ id: doc.id, ...doc.data() });
            });
            return coupons;
        } catch (error) {
            console.error("Error fetching active coupons:", error);
            return [];
        }
    },

    // 1-0. 활성화된 쿠폰 페이징 처리해서 불러오기 (무한 스크롤용)
    getPaginatedActiveCoupons: async (pageSize = 10, lastDoc = null) => {
        try {
            let q;
            if (lastDoc) {
                q = query(
                    collection(db, COUPON_COLLECTION),
                    where("isActive", "==", true),
                    orderBy("createdAt", "desc"),
                    startAfter(lastDoc),
                    limit(pageSize)
                );
            } else {
                q = query(
                    collection(db, COUPON_COLLECTION),
                    where("isActive", "==", true),
                    orderBy("createdAt", "desc"),
                    limit(pageSize)
                );
            }

            const querySnapshot = await getDocs(q);
            const coupons = [];
            querySnapshot.forEach((doc) => {
                coupons.push({ id: doc.id, ...doc.data() });
            });

            return {
                coupons,
                lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null
            };
        } catch (error) {
            console.error("Error fetching paginated coupons:", error);
            return { coupons: [], lastVisible: null };
        }
    },

    // 1-1. 전체 쿠폰 불러오기 (어드민 리스트용)
    getAllCoupons: async () => {
        try {
            const q = query(collection(db, COUPON_COLLECTION));
            const querySnapshot = await getDocs(q);
            const coupons = [];
            querySnapshot.forEach((doc) => {
                coupons.push({ id: doc.id, ...doc.data() });
            });
            return coupons.sort((a, b) => {
                const ta = a.createdAt?.seconds || 0;
                const tb = b.createdAt?.seconds || 0;
                return tb - ta;
            });
        } catch (error) {
            console.error("Error fetching all coupons:", error);
            return [];
        }
    },

    // 2. 특정 업소(Store)의 쿠폰 목록 불러오기
    getCouponsByStoreId: async (storeId) => {
        try {
            // legacy 데이터 호환성을 위해 ID 필드 체크하되, 순차적으로 하여 서버 부하 방지
            let q1 = query(collection(db, COUPON_COLLECTION), where("storeId", "==", storeId));
            let snap = await getDocs(q1);
            
            if (snap.empty) {
                let q2 = query(collection(db, COUPON_COLLECTION), where("merchantId", "==", storeId));
                snap = await getDocs(q2);
                if (snap.empty) {
                    let q3 = query(collection(db, COUPON_COLLECTION), where("mid", "==", storeId));
                    snap = await getDocs(q3);
                    if (snap.empty) {
                        let q4 = query(collection(db, COUPON_COLLECTION), where("store_id", "==", storeId));
                        snap = await getDocs(q4);
                    }
                }
            }
            
            const couponsMap = new Map();
            snap.forEach(doc => {
                couponsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });

            return Array.from(couponsMap.values()).sort((a, b) => {
                const orderA = (a.displayOrder === null || a.displayOrder === undefined) ? 9999 : Number(a.displayOrder);
                const orderB = (b.displayOrder === null || b.displayOrder === undefined) ? 9999 : Number(b.displayOrder);
                
                if (orderA !== orderB) return orderA - orderB;

                const ta = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt : 0);
                const tb = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt : 0);
                return tb - ta;
            });
        } catch (error) {
            console.error(`Error fetching coupons for store ${storeId}:`, error);
            return [];
        }
    },

    // 3. 단일 쿠폰 상세 불러오기
    getCouponById: async (couponId) => {
        try {
            const docRef = doc(db, COUPON_COLLECTION, couponId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching single coupon:`, error);
            throw error;
        }
    },

    // 4. 쿠폰 신규 발행
    addCoupon: async (couponData) => {
        try {
            const docRef = await addDoc(collection(db, COUPON_COLLECTION), {
                ...couponData,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: docRef.id, ...couponData };
        } catch (error) {
            console.error("Error issuing coupon:", error);
            throw error;
        }
    },

    // 5. 쿠폰 정보 수정
    updateCoupon: async (id, couponData) => {
        try {
            const docRef = doc(db, COUPON_COLLECTION, id);
            await setDoc(docRef, {
                ...couponData,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error updating coupon:", error);
            throw error;
        }
    },

    // 6. 쿠폰 삭제
    deleteCoupon: async (id) => {
        try {
            const docRef = doc(db, COUPON_COLLECTION, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting coupon:", error);
            throw error;
        }
    },

    // 7. 스마트 공유 쿠폰 생성
    createSharedCoupon: async (data) => {
        try {
            const sharedRef = collection(db, 'shared_coupons');
            const docRef = await addDoc(sharedRef, {
                ...data,
                status: 'active',
                redemptionCount: 0,
                isSelfUse: false, // 명시적으로 false 설정
                createdAt: serverTimestamp(),
                lastRedeemedAt: null
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating shared coupon:", error);
            throw error;
        }
    },

    // 8. 공유된 쿠폰 상세 정보 불러오기
    getSharedCoupon: async (sharedId) => {
        try {
            const docRef = doc(db, 'shared_coupons', sharedId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return { id: docSnap.id, ...data };
            }
            return null;
        } catch (error) {
            console.error("Error fetching shared coupon:", error);
            throw error;
        }
    },

    // 8.5 사용하기 (Self-Use) 직접 발급
    generateSelfUseCoupon: async (couponId, storeId, userUid, userName) => {
        try {
            const { serverTimestamp, addDoc, collection } = await import('firebase/firestore');
            const couponData = await CouponService.getCouponById(couponId);
            if (!couponData) throw new Error("Coupon not found");

            const sharedData = {
                couponId,
                storeId,
                senderUid: userUid,
                senderName: userName || '사용자',
                isSelfUse: true, // 본인 직접 사용 플래그
                status: 'active',
                createdAt: serverTimestamp(),
                rewardAmount: 0, // 리워드 연결 중지: 0으로 설정
                discount: couponData.discount || '',
                limitQuantity: couponData.limitQuantity || null,
                expirationDate: couponData.expirationDate || ''
            };

            const docRef = await addDoc(collection(db, 'shared_coupons'), sharedData);
            return docRef.id;
        } catch (error) {
            console.error("Error generating self-use coupon:", error);
            throw error;
        }
    },

    // 9. 쿠폰 사용 승인 (검증) + 리워드 분배 (70:20:10)
    redeemCoupon: async (sharedId, adminUid, usedByUid = null) => {
        try {
            const { runTransaction, serverTimestamp } = await import('firebase/firestore');
            const { SettingsService } = await import('./SettingsService');

            // Get settings OUTSIDE the transaction so it doesn't break Firestore read/write rules
            const settings = await SettingsService.getSettings();
            const dist = settings.rewardDistribution || { operator: 70, referrerA: 20, referrerB: 10 };

            // Admin Fallback UID lookup
            const { getDocs, query, where, limit } = await import('firebase/firestore');
            const userQuery = query(collection(db, 'users'), where('email', '==', 'btmt2019@gmail.com'), limit(1));
            const userSnap = await getDocs(userQuery);
            const adminFallbackUid = !userSnap.empty ? userSnap.docs[0].id : null;

            return await runTransaction(db, async (transaction) => {
                // =============== READ PHASE ===============

                // 1. 데이터 로드
                const sharedRef = doc(db, 'shared_coupons', sharedId);
                const sharedSnap = await transaction.get(sharedRef);
                if (!sharedSnap.exists()) throw new Error("Shared coupon not found");
                const sharedData = sharedSnap.data();

                const couponRef = doc(db, COUPON_COLLECTION, sharedData.couponId);
                const couponSnap = await transaction.get(couponRef);

                let couponData = null;
                if (couponSnap.exists()) {
                    couponData = couponSnap.data();
                    if (couponData.limitQuantity !== undefined && couponData.limitQuantity !== null) {
                        if (couponData.limitQuantity <= 0) throw new Error("Out of stock");
                    }
                }

                const storeRef = doc(db, 'coupons', sharedData.storeId);
                const storeSnap = await transaction.get(storeRef);
                const storeData = storeSnap.exists() ? storeSnap.data() : null;
                const managerUid = storeData ? (storeData.managerUid || storeData.ownerUid) : null;

                let storeOwnerRef = null;
                let storeOwnerData = null;
                if (managerUid) {
                    storeOwnerRef = doc(db, 'users', managerUid);
                    const storeOwnerSnap = await transaction.get(storeOwnerRef);
                    if (storeOwnerSnap.exists()) {
                        storeOwnerData = storeOwnerSnap.data();
                    }
                }

                const totalReward = sharedData.rewardAmount || 0;
                const aShare = Math.floor(totalReward * (dist.referrerA / 100));
                const bShare = Math.floor(totalReward * (dist.referrerB / 100));
                const isSelfUse = sharedData.isSelfUse || (usedByUid && usedByUid === sharedData.senderUid);

                let aData = null;
                let bData = null;
                let aRef = null;
                let bRef = null;

                // [리워드 대상 결정] 
                // 1순위: 직접 공유자 (senderUid)
                // 2순위: 사용자 자신의 추천인 (referredBy)
                // 3순위: 운영자 (adminFallbackUid)

                let targetReferrerId = null;
                if (sharedData.senderUid && !isSelfUse) {
                    targetReferrerId = sharedData.senderUid;
                } else {
                    // 사용자(usedByUid)의 추천인 검색 시도
                    if (usedByUid) {
                        const userRef = doc(db, 'users', usedByUid);
                        const userSnap = await transaction.get(userRef);
                        if (userSnap.exists()) {
                            targetReferrerId = userSnap.data().referredBy;
                        }
                    }
                    // 여전히 없으면 운영자
                    if (!targetReferrerId) {
                        targetReferrerId = adminFallbackUid;
                    }
                }

                if (targetReferrerId && aShare > 0) {
                    aRef = doc(db, 'users', targetReferrerId);
                    const aSnap = await transaction.get(aRef);
                    if (aSnap.exists()) {
                        aData = aSnap.data();

                        // [추천인 B] - A를 추천한 사람
                        if (aData.referredBy && bShare > 0) {
                            bRef = doc(db, 'users', aData.referredBy);
                            const bSnap = await transaction.get(bRef);
                            if (bSnap.exists()) {
                                bData = bSnap.data();
                            }
                        }
                    }
                }

                // 운영자 데이터 READ phase에서 미리 읽기 (write phase에서 재읽기 시 오류 방지)
                let operatorRef = null;
                let operatorData = null;
                if (adminFallbackUid) {
                    operatorRef = doc(db, 'users', adminFallbackUid);
                    const operatorSnap = await transaction.get(operatorRef);
                    if (operatorSnap.exists()) {
                        operatorData = operatorSnap.data();
                    }
                }

                // =============== WRITE PHASE ===============

                // 2. 수량 업데이트
                if (couponData && couponData.limitQuantity !== undefined && couponData.limitQuantity !== null) {
                    transaction.update(couponRef, {
                        limitQuantity: couponData.limitQuantity - 1,
                        updatedAt: serverTimestamp()
                    });
                }

                // 3. 리워드 지급 (rewardAmount가 0보다 큰 경우에만 실행)
                let actualDistributed = 0;
                const distributions = [];

                if (totalReward > 0) {
                    if (targetReferrerId && aShare > 0) {
                        // Update Referrer A points (User set(merge) instead of update to handle missing docs)
                        const aRefToUpdate = doc(db, 'users', targetReferrerId);
                        const currentAPoints = aData?.points || 0;
                        const currentAReward = aData?.totalRewardIncome || 0;
                        transaction.set(aRefToUpdate, {
                            points: currentAPoints + aShare,
                            totalRewardIncome: currentAReward + aShare,
                            updatedAt: serverTimestamp() // metadata for new docs
                        }, { merge: true });

                        distributions.push({ uid: targetReferrerId, role: 'referrer_A', amount: aShare });
                        actualDistributed += aShare;

                        if (bData && bRef) {
                            transaction.set(bRef, {
                                points: (bData.points || 0) + bShare,
                                totalRewardIncome: (bData.totalRewardIncome || 0) + bShare
                            }, { merge: true });
                            distributions.push({ uid: aData.referredBy, role: 'referrer_B', amount: bShare });
                            actualDistributed += bShare;
                        }
                    }

                    // 매장 점주 포인트 차감
                    if (storeOwnerRef && storeOwnerData && totalReward > 0) {
                        transaction.update(storeOwnerRef, {
                            points: (storeOwnerData.points || 0) - totalReward
                        });

                        const storeHistoryRef = doc(collection(db, 'points_history'));
                        transaction.set(storeHistoryRef, {
                            uid: managerUid,
                            amount: -totalReward,
                            type: 'coupon_redemption_deduction',
                            description: `쿠폰 승인 완료 - 매장 포인트 차감`,
                            sharedId,
                            storeId: sharedData.storeId,
                            timestamp: serverTimestamp()
                        });
                    }
                }

                const finalOperatorProfit = totalReward - actualDistributed;

                // 4. 상태 업데이트 및 기록
                // 남은 수량 계산 (limitQuantity가 있는 경우)
                const newQuantity = (couponData && couponData.limitQuantity !== undefined && couponData.limitQuantity !== null)
                    ? couponData.limitQuantity - 1
                    : null;

                transaction.update(sharedRef, {
                    // 수량 소진 시에만 redeemed 처리, 아니면 active 유지
                    ...(newQuantity !== null && newQuantity <= 0 ? { status: 'redeemed' } : {}),
                    redemptionCount: (sharedData.redemptionCount || 0) + 1,
                    lastRedeemedAt: serverTimestamp(),
                    lastRedeemedBy: adminUid,
                    totalDistributions: (sharedData.totalDistributions || 0) + distributions.length,
                    operatorProfit: (sharedData.operatorProfit || 0) + finalOperatorProfit
                });

                // 운영자 수익 처리: READ phase에서 이미 읽은 operatorData 사용 (수익이 있을 때만)
                if (operatorRef && finalOperatorProfit > 0) {
                    const operatorCurrentPoints = operatorData?.points || 0;
                    transaction.set(operatorRef, {
                        points: operatorCurrentPoints + finalOperatorProfit,
                        totalRewardIncome: (operatorData?.totalRewardIncome || 0) + finalOperatorProfit,
                        updatedAt: serverTimestamp()
                    }, { merge: true });

                    // 운영자 수익 히스토리 기록
                    const operatorHistoryRef = doc(collection(db, 'points_history'));
                    transaction.set(operatorHistoryRef, {
                        uid: adminFallbackUid,
                        amount: finalOperatorProfit,
                        type: 'operator_profit_sharing',
                        description: `쿠폰 운영 수익(70%) 적립 - ${storeData?.name || ''}`,
                        sharedId,
                        storeId: sharedData.storeId,
                        timestamp: serverTimestamp()
                    });
                }

                // 포인트 히스토리 기록 (각 유입자별)
                distributions.forEach(d => {
                    const historyRef = doc(collection(db, 'points_history'));
                    transaction.set(historyRef, {
                        uid: d.uid,
                        amount: d.amount,
                        type: 'referral_reward',
                        description: `${d.role === 'referrer_A' ? '직접 추천' : '상위 추천'} 리워드 적립`,
                        sharedId,
                        storeId: sharedData.storeId,
                        timestamp: serverTimestamp()
                    });
                });

                // 트랜잭션 로그 추가 (운영용 전체 로그)
                const logRef = doc(collection(db, 'reward_transactions'));
                transaction.set(logRef, {
                    sharedId,
                    storeId: sharedData.storeId,
                    storeName: storeData?.name || '알 수 없는 매장',
                    couponTitle: couponData?.title || '쿠폰',
                    senderUid: targetReferrerId,
                    // 1. 유저 DB 이름 우선, 2. 공유 데이터 이름(링크 생성 당시 이름), 3. 운영자 또는 알 수 없음
                    senderName: aData?.displayName || sharedData.senderName || (targetReferrerId === adminFallbackUid ? '운영자(자동배정)' : '알 수 없는 공유자'),
                    usedByUid: usedByUid,
                    totalReward, // 업소 차감액
                    rewardAmount: aShare, // 공유자 적립액 (UI 표시용)
                    distributions,
                    operatorProfit: finalOperatorProfit,
                    timestamp: serverTimestamp()
                });

                return true;
            });
        } catch (error) {
            console.error("Error redeeming coupon with rewards:", error);
            throw error;
        }
    },

    // 10. 전체 사용 내역 통계 (어드민용)
    getAllRedemptions: async () => {
        try {
            const q = query(
                collection(db, 'reward_transactions'),
                orderBy("timestamp", "desc"),
                limit(200)
            );
            const querySnapshot = await getDocs(q);
            const redemptions = [];
            querySnapshot.forEach((doc) => {
                redemptions.push({ id: doc.id, ...doc.data() });
            });
            return redemptions;
        } catch (error) {
            console.error("Error fetching all redemptions:", error);
            // 인덱스 오류 발생 시 정렬 없이 데이터만 가져오는 Fallback
            try {
                const qNoIndex = query(collection(db, 'reward_transactions'), limit(200));
                const snapNoIndex = await getDocs(qNoIndex);
                return snapNoIndex.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (inner) {
                return [];
            }
        }
    },

    // 10.5 내 추천 리워드 내역 가져오기 (MyPage용)
    getUserReferralRewards: async (userId) => {
        if (!userId) return [];
        try {
            const q = query(
                collection(db, 'reward_transactions'),
                where("senderUid", "==", userId),
                orderBy("timestamp", "desc"),
                limit(50)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'referral_reward'
            }));
        } catch (error) {
            console.error("Error fetching referral rewards:", error);
            try {
                // Fallback for missing index
                const qNoOrder = query(
                    collection(db, 'reward_transactions'),
                    where("senderUid", "==", userId),
                    limit(50)
                );
                const querySnapshot = await getDocs(qNoOrder);
                return querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data(), type: 'referral_reward' }))
                    .sort((a, b) => {
                        const tA = a.timestamp?.seconds || 0;
                        const tB = b.timestamp?.seconds || 0;
                        return tB - tA;
                    });
            } catch (inner) {
                return [];
            }
        }
    },

    // 11. 특정 매장 사용 내역 통계 (가맹점주용)
    getStoreRedemptions: async (storeId) => {
        try {
            const q = query(
                collection(db, 'reward_transactions'),
                where("storeId", "==", storeId)
            );
            const querySnapshot = await getDocs(q);
            const redemptions = [];
            querySnapshot.forEach((doc) => {
                redemptions.push({ id: doc.id, ...doc.data() });
            });
            return redemptions.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error fetching store redemptions:", error);
            return [];
        }
    },
    
    // 11.5 특정 매장 사용 건수만 빠르게 가져오기 (성능 최적화용)
    getStoreRedemptionsCount: async (storeId) => {
        try {
            const q = query(
                collection(db, 'reward_transactions'),
                where("storeId", "==", storeId)
            );
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error("Error fetching store redemptions count:", error);
            return 0;
        }
    },

    // 12. 내 공유 쿠폰 리스트 가져오기 (MyPage용)
    getMySharedCoupons: async (userId) => {
        try {
            const q = query(
                collection(db, 'shared_coupons'),
                where("senderUid", "==", userId)
            );
            const querySnapshot = await getDocs(q);
            const shared = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.isSelfUse !== true) {
                    shared.push({ id: doc.id, ...data });
                }
            });

            // Fetch store names for each shared coupon
            const storeIds = [...new Set(shared.map(s => s.storeId))];
            const storeNamesMap = {};

            await Promise.all(storeIds.map(async (sid) => {
                if (!sid) return;
                try {
                    const sDoc = await getDoc(doc(db, 'coupons', sid));
                    if (sDoc.exists()) {
                        storeNamesMap[sid] = sDoc.data().name;
                    }
                } catch (e) {
                    console.error("Error fetching store name for shared list:", e);
                }
            }));

            const enhancedShared = shared.map(s => {
                let sName = storeNamesMap[s.storeId] || '알 수 없는 매장';
                // 상점 이름이 객체(다국어)인 경우 한국어 우선 추출
                if (typeof sName === 'object' && sName !== null) {
                    sName = sName.ko || sName.en || sName.vi || '이름 없음';
                }
                return {
                    ...s,
                    storeName: sName
                };
            });

            return enhancedShared.sort((a, b) => {
                const timeA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
                const timeB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error fetching my shared coupons:", error);
            return [];
        }
    },

    // 13. 개인 포인트 히스토리 가져오기
    getMyPointHistory: async (userId) => {
        try {
            const q = query(
                collection(db, 'points_history'),
                where('uid', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            const history = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 로컬에서 정렬 (인덱스 에러 방지용)
            return history.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error fetching point history:", error);
            throw error;
        }
    }
};
