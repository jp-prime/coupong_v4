'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
// import { useTranslation } from 'react-i18next';
import { auth, googleProvider, db } from '../firebase';

// Force account selection every time
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    updateProfile,
    updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { StoreService } from '../services/StoreService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // const { i18n } = useTranslation();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isViewer, setIsViewer] = useState(false);
    const [isStoreOwner, setIsStoreOwner] = useState(false);
    const [managedStores, setManagedStores] = useState([]);
    const [managedStoreId, setManagedStoreId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastActivityState, setLastActivityState] = useState(Date.now()); // kept for backwards compatibility if needed
    const lastActivity = useRef(Date.now());

    const selectManagedStore = (storeId) => {
        setManagedStoreId(storeId);
    };

    // Admin emails (Only one operator allowed)
    const ADMIN_EMAILS = [
        'btmt2019@gmail.com'
    ];

    const VIEWER_EMAILS = [
        'pcb448800@gmail.com'
    ];

    const checkAdminStatus = (userEmail) => {
        if (!userEmail) return false;
        return ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail.toLowerCase());
    };



    // Email Simple Login/Signup (Refined with Password)
    const signInWithEmail = async (emailData, mode = 'signup') => {
        try {
            const { name, email, password, phone } = emailData;
            await setPersistence(auth, browserLocalPersistence);

            let firebaseUser;
            if (mode === 'signup') {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                firebaseUser = result.user;

                // Update Firebase Profile
                await updateProfile(firebaseUser, {
                    displayName: name
                });

                // 추천인 확인
                const referrerUid = localStorage.getItem('referred_by_uid');

                // Initial Firestore Setup for New User (Basic Info)
                const userRef = doc(db, 'users', firebaseUser.uid);
                const newUserData = {
                    email: email,
                    displayName: name,
                    phoneNumber: phone || '',
                    lastLogin: new Date().toISOString(),
                    provider: 'email',
                    signupDate: new Date().toISOString()
                };

                if (referrerUid) {
                    newUserData.referredBy = referrerUid;
                    localStorage.removeItem('referred_by_uid');
                }

                await setDoc(userRef, newUserData, { merge: true });

                // ✅ 웰컴 포인트 20,000 직접 저장 (타이밍 이슈 방지)
                try {
                    const { runTransaction } = await import('firebase/firestore');
                    const welcomeHistoryRef = doc(db, 'points_history', `welcome_${firebaseUser.uid}`);
                    await runTransaction(db, async (transaction) => {
                        const welcomeSnap = await transaction.get(welcomeHistoryRef);
                        if (!welcomeSnap.exists()) {
                            // 포인트 업데이트
                            transaction.update(userRef, { points: 20000 });
                            // 히스토리 기록
                            transaction.set(welcomeHistoryRef, {
                                uid: firebaseUser.uid,
                                amount: 20000,
                                type: 'welcome_bonus',
                                description: '🎉 회원가입 축하 포인트',
                                timestamp: serverTimestamp()
                            });
                        }
                    });
                } catch (pointsError) {
                    console.error('Welcome points setup failed:', pointsError);
                }

                // 이메일 알림 추가 (Admin용)
                try {
                    await addDoc(collection(db, 'mail'), {
                        to: ['btmt2019@gmail.com'],
                        message: {
                            subject: `[쿠퐁온라인] 신규 회원가입 - ${name} (${email})`,
                            html: `
                                <h3>신규 회원이 가입되었습니다. (이메일 가입)</h3>
                                <p><strong>이름:</strong> ${name}</p>
                                <p><strong>이메일:</strong> ${email}</p>
                                <p><strong>전화번호:</strong> ${phone || '미입력'}</p>
                                <p><strong>가입일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                                <hr>
                                <p>어드민 페이지에서 회원 정보를 확인해주세요.</p>
                            `
                        },
                        createdAt: serverTimestamp()
                    });
                } catch (emailError) {
                    console.error("Signup email notification failed:", emailError);
                }
                // Points will be handled by syncUserToFirestore called in onAuthStateChanged
            } else {
                const result = await signInWithEmailAndPassword(auth, email, password);
                firebaseUser = result.user;

                // Sync Last Login
                const userRef = doc(db, 'users', firebaseUser.uid);
                await setDoc(userRef, {
                    lastLogin: new Date().toISOString()
                }, { merge: true });
            }

            await firebaseUser.reload();
            return firebaseUser;
        } catch (error) {
            console.error('Email auth error:', error);
            // Translate common Firebase errors (V2: Hardcoded Korean temporarily)
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('이미 가입된 이메일입니다.');
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
            } else if (error.code === 'auth/invalid-credential') {
                throw new Error('로그인 정보가 올바르지 않습니다.');
            }
            throw error;
        }
    };



    // Google Sign In - Refined for PWA Standalone & In-App stability
    const signInWithGoogle = async () => {
        try {
            // Persistence is handled at init level. Only use it here if explicitly needed.
            // await setPersistence(auth, browserLocalPersistence);

            const isUA = navigator.userAgent.toLowerCase();
            const isInApp = isUA.includes('kakao') || isUA.includes('zalo') || isUA.includes('instagram') || isUA.includes('fbav') || isUA.includes('fban') || isUA.includes('line') || isUA.includes('naver');
            
            if (isInApp) {
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            try {
                const result = await signInWithPopup(auth, googleProvider);
                return result.user;
            } catch (popupError) {
                console.warn('Popup blocked/failed, switching to Redirect:', popupError.code);
                await signInWithRedirect(auth, googleProvider);
            }
        } catch (error) {
            console.error('Login engine error:', error);
            if (error.code === 'auth/unauthorized-domain') {
                alert('🚨 보안 에러: 현재 도메인이 Firebase 승인 목록에 없습니다. 관리자 콘솔에서 추가해주세요.');
            } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                alert('로그인 처리 중 오류 발생: ' + (error.code || error.message));
            }
            throw error;
        }
    };

    const syncUserToFirestore = async (firebaseUser) => {
        if (!firebaseUser) return;
        try {
            const { runTransaction } = await import('firebase/firestore');
            const userRef = doc(db, 'users', firebaseUser.uid);
            const welcomeHistoryRef = doc(db, 'points_history', `welcome_${firebaseUser.uid}`);

            await runTransaction(db, async (transaction) => {
                const userSnap = await transaction.get(userRef);
                const welcomeSnap = await transaction.get(welcomeHistoryRef);

                let userData = {
                    email: firebaseUser.email,
                    lastLogin: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                if (firebaseUser.displayName) userData.displayName = firebaseUser.displayName;
                if (firebaseUser.photoURL) userData.photoURL = firebaseUser.photoURL;

                if (!userSnap.exists()) {
                    // New User
                    userData.signupDate = serverTimestamp();
                    userData.points = 20000;
                    userData.displayName = userData.displayName || firebaseUser.email.split('@')[0];

                    // Welcome Bonus History
                    transaction.set(welcomeHistoryRef, {
                        uid: firebaseUser.uid,
                        amount: 20000,
                        type: 'welcome_bonus',
                        description: '회원가입 축하 포인트 적립',
                        timestamp: serverTimestamp()
                    });

                    // Check referral
                    const referrerUid = localStorage.getItem('referred_by_uid');
                    if (referrerUid) {
                        userData.referredBy = referrerUid;
                        localStorage.removeItem('referred_by_uid');
                    }

                    transaction.set(userRef, userData);

                    // 이메일 알림 추가 (Google 등 첫 로그인 시)
                    const mailRef = doc(collection(db, 'mail'));
                    transaction.set(mailRef, {
                        to: ['btmt2019@gmail.com'],
                        message: {
                            subject: `[쿠퐁온라인] 신규 회원가입 - ${userData.displayName || firebaseUser.email}`,
                            html: `
                                <h3>신규 회원이 가입되었습니다. (${firebaseUser.providerData[0]?.providerId || 'google'} 가입)</h3>
                                <p><strong>이름:</strong> ${userData.displayName || '이름없음'}</p>
                                <p><strong>이메일:</strong> ${firebaseUser.email}</p>
                                <p><strong>가입일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                                <hr>
                                <p>어드민 페이지에서 회원 정보를 확인해주세요.</p>
                            `
                        },
                        createdAt: serverTimestamp()
                    });
                } else {
                    // Existing User
                    const existingData = userSnap.data();

                    // Check if welcome bonus was missed (older users or race condition)
                    if (!welcomeSnap.exists() && (!existingData.points || existingData.points === 0)) {
                        userData.points = (existingData.points || 0) + 20000;
                        transaction.set(welcomeHistoryRef, {
                            uid: firebaseUser.uid,
                            amount: 20000,
                            type: 'welcome_bonus',
                            description: '회원가입 축하 포인트 적립',
                            timestamp: serverTimestamp()
                        });
                    }

                    transaction.update(userRef, userData);
                }
            });
        } catch (e) {
            console.error('Error syncing user data:', e);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsAdmin(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateActivity = () => {
        lastActivity.current = Date.now();
    };

    useEffect(() => {
        // Initialize persistence at start
        setPersistence(auth, browserLocalPersistence).catch(console.error);

        // Handle redirect result
        const handleRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result && result.user) {
                    console.log('Redirect login success:', result.user.email);
                    // syncUserToFirestore will be handled by onAuthStateChanged
                }
            } catch (error) {
                console.error('Redirect result error:', error);
                if (error.code === 'auth/unauthorized-domain') {
                    alert('🚨 보안 에러: Firebase 설정에서 현재 도메인을 승인된 도메인에 추가해주세요.');
                } else if (error.code === 'auth/internal-error') {
                    console.warn('Firebase internal error during redirect handler');
                } else if (error.code !== 'auth/cancelled-popup-request') {
                    // Show a bit more info for debugging
                    console.warn('Redirect hand-off common error:', error.code);
                    if (error.code === 'auth/popup-closed-by-user') return;
                    // Dont alert for common non-critical codes
                }
            }
        };
        handleRedirect();
    }, []);

    // 1. Auth & User Document Listener
    useEffect(() => {
        let unsubscribeDoc = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            // Clean up previous doc listener if switching users
            if (unsubscribeDoc) {
                unsubscribeDoc();
                unsubscribeDoc = null;
            }

            if (firebaseUser) {
                console.log('Auth state: Logged in', firebaseUser.email);
                
                // 1. Initial Sync (Run in background to avoid blocking UI)
                if (firebaseUser.email) {
                    syncUserToFirestore(firebaseUser).catch(e => console.error("Background sync error:", e));
                }

                // 2. Real-time Document Listener
                const userRef = doc(db, 'users', firebaseUser.uid);
                
                // Firestore 데이터를 가져오기 전이라도 인증 정보를 먼저 UI에 반영 (깜빡임 방지)
                setUser({ ...firebaseUser });

                unsubscribeDoc = onSnapshot(userRef, async (userSnap) => {
                    const firestoreData = userSnap.exists() ? userSnap.data() : {};
                    
                    const mergedUser = {
                        ...firebaseUser,
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || firestoreData.email,
                        displayName: firebaseUser.displayName || firestoreData.displayName,
                        photoURL: firebaseUser.photoURL || firestoreData.photoURL,
                        ...firestoreData
                    };

                    setUser(mergedUser);
                    
                    const emailLower = (mergedUser.email || "").toLowerCase();
                    const isAdminUser = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(emailLower);
                    setIsAdmin(isAdminUser);
                    setIsViewer(VIEWER_EMAILS.map(e => e.toLowerCase()).includes(emailLower));

                    // 업체 정보 확인 (비동기로 배경에서 처리, 메인 로딩을 방해하지 않음)
                    const emailRaw = mergedUser.email || "";
                    StoreService.getStoresByManagerEmail(emailRaw, mergedUser.uid).then(foundStores => {
                        if (foundStores && foundStores.length > 0) {
                            setIsStoreOwner(true);
                            setManagedStores(foundStores);
                            setManagedStoreId(id => id || foundStores[0].id);
                        } else {
                            setIsStoreOwner(false);
                            setManagedStores([]);
                            setManagedStoreId(null);
                        }
                    }).catch(err => console.error("Store check error:", err))
                      .finally(() => setLoading(false));
                }, (error) => {
                    console.error("Firestore snapshot error:", error);
                    setLoading(false);
                });
            } else {
                console.log('Auth state: Logged out');
                setUser(null);
                setIsAdmin(false);
                setIsViewer(false);
                setIsStoreOwner(false);
                setManagedStoreId(null);
                setManagedStores([]);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity.current > 86400000) { // 24 hours
                console.log('Session expired due to inactivity');
                logout();
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [user]);

    // Activity tracking
    useEffect(() => {
        if (!user) return;
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        const activityHandler = () => updateActivity();
        events.forEach(e => window.addEventListener(e, activityHandler));
        return () => events.forEach(e => window.removeEventListener(e, activityHandler));
    }, [user]);

    const userEmail = user?.email || null;

    const updateUserProfile = async (data) => {
        if (!auth.currentUser) return;
        try {
            await updateProfile(auth.currentUser, data);
            await auth.currentUser.reload();

            // Sync to Firestore immediately after update
            await syncUserToFirestore(auth.currentUser);

            // Merge with current state to preserve points, etc.
            setUser(prev => ({
                ...prev,
                ...auth.currentUser,
                displayName: data.displayName || prev.displayName,
                photoURL: data.photoURL || prev.photoURL
            }));
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    const changePassword = async (newPassword) => {
        if (!auth.currentUser) throw new Error("No user logged in");
        try {
            await updatePassword(auth.currentUser, newPassword);
            return true;
        } catch (error) {
            console.error("Error changing password:", error);
            throw error;
        }
    };

    const refreshManagedStores = async () => {
        if (!user) return;
        try {
            console.log('Refreshing managed stores for:', user.email, 'UID:', user.uid);
            const emailRaw = user.email || "";
            const foundStores = await StoreService.getStoresByManagerEmail(emailRaw, user.uid);

            if (foundStores && foundStores.length > 0) {
                setIsStoreOwner(true);
                setManagedStores(foundStores);
                setManagedStoreId(prevId => prevId || foundStores[0].id);
            } else {
                setIsStoreOwner(false);
                setManagedStores([]);
                setManagedStoreId(null);
            }
        } catch (error) {
            console.error("Failed to refresh managed stores:", error);
        }
    };

    const value = {
        user,
        isAdmin,
        isViewer,
        isStoreOwner,
        managedStores,
        managedStoreId,
        selectManagedStore,
        loading,
        signInWithGoogle,
        signInWithEmail,
        updateUserProfile,
        changePassword,
        logout,
        lastActivity: lastActivity.current,
        refreshManagedStores
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
