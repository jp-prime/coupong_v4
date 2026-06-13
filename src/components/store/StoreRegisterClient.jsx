'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Camera, Loader2, Plus, X, Globe, MapPin, Phone, Info, ChevronLeft, ChevronRight, Sparkles, Link2, Copy, Zap, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StoreService } from '../../services/StoreService';

import { categories } from '../../data/coupons';
import { useStoreHelpers } from '../../hooks/useStoreHelpers';
import HeaderV2 from '../../components/style2/HeaderV2';

export default function StoreRegisterClient() {
    const { fixImageUrl } = useStoreHelpers();
    const router = useRouter();
    const params = useParams();
    const editId = params?.id;
    const { isAdmin, isStoreOwner, managedStoreId, user, loading: authLoading, refreshManagedStores } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        if (editId) {
            const isAuthorized = isAdmin || (isStoreOwner && managedStoreId === editId);
            if (!isAuthorized) {
                alert('이 매장 정보를 수정할 권한이 없습니다.');
                router.push('/');
            }
        }
    }, [editId, isAdmin, isStoreOwner, managedStoreId, authLoading, router]);

    const [loading, setLoading] = useState(!!editId);
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [galleryUrlInput, setGalleryUrlInput] = useState('');
    const [menuImagesUrlInput, setMenuImagesUrlInput] = useState('');
    const [managerPoints, setManagerPoints] = useState(0);

    const [langTab, setLangTab] = useState('ko');
    const [seoGenerating, setSeoGenerating] = useState(false);

    const generateStoreSeoAndTranslations = async () => {
        const getKoVal = (field) => {
            const val = formData[field];
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) return val.ko || '';
            return val || '';
        };

        const koName = getKoVal('name');
        const koSlogan = getKoVal('slogan');
        const koDescription = getKoVal('storeDescription');
        const koLocation = getKoVal('location');
        const koAddress = getKoVal('address');
        const koNotice = getKoVal('notice');

        if (!koName) {
            alert("먼저 한국어 업체명을 입력해 주세요!");
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        if (!apiKey) {
            alert("API 키가 설정되지 않았습니다. 환경 변수를 확인해 주세요.");
            return;
        }

        setSeoGenerating(true);
        try {
            const prompt = `You are a professional localizer and SEO expert for businesses in Vietnam. Translate and optimize the following store information from Korean to English (en), Vietnamese (vi), and Simplified Chinese (zh-CN).

### Store Details (in Korean):
- Category: ${formData.category}
- Name: ${koName}
- Slogan: ${koSlogan}
- Description: ${koDescription}
- Neighborhood Location: ${koLocation}
- Address: ${koAddress}
- Notice: ${koNotice}

### Requirements:
1. Provide accurate, professional, local translations for Name, Slogan, Description, Location, Address, and Notice in "en", "vi", and "zh-CN".
2. Generate a highly optimized string of comma-separated SEO keywords in Korean (max 10 keywords) that match this business category and location (e.g. "푸미흥 삼겹살, 호치민 고기집, 푸미흥 맛집, 한식당" etc.) for "keywords".
3. Return ONLY a valid JSON object matching the exact structure below. Do not add markdown backticks or explanation:
{
  "name": { "en": "...", "vi": "...", "zh-CN": "..." },
  "slogan": { "en": "...", "vi": "...", "zh-CN": "..." },
  "storeDescription": { "en": "...", "vi": "...", "zh-CN": "..." },
  "location": { "en": "...", "vi": "...", "zh-CN": "..." },
  "address": { "en": "...", "vi": "...", "zh-CN": "..." },
  "notice": { "en": "...", "vi": "...", "zh-CN": "..." },
  "keywords": "keyword1, keyword2, keyword3"
}`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: 'application/json' }
                    })
                }
            );

            if (!response.ok) {
                let errMsg = `Status ${response.status}`;
                try {
                    const errJson = await response.json();
                    if (errJson?.error?.message) {
                        errMsg = errJson.error.message;
                    }
                } catch (e) {}
                throw new Error(`Gemini API error: ${errMsg}`);
            }

            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) throw new Error("API 응답이 비어있습니다.");
            
            let cleanText = textResponse.trim();
            if (cleanText.startsWith("```")) {
                cleanText = cleanText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
            }
            const data = JSON.parse(cleanText);
            
            setFormData(prev => {
                const updateField = (field, translations) => {
                    const currentVal = prev[field];
                    const isObj = typeof currentVal === 'object' && currentVal !== null && !Array.isArray(currentVal);
                    const baseKo = isObj ? (currentVal.ko || '') : (currentVal || '');
                    return {
                        ko: baseKo,
                        en: translations[field]?.en || '',
                        vi: translations[field]?.vi || '',
                        'zh-CN': translations[field]?.['zh-CN'] || ''
                    };
                };

                return {
                    ...prev,
                    name: updateField('name', data),
                    slogan: updateField('slogan', data),
                    storeDescription: updateField('storeDescription', data),
                    location: updateField('location', data),
                    address: updateField('address', data),
                    notice: updateField('notice', data),
                    keywords: data.keywords || prev.keywords || ''
                };
            });

            alert("✨ AI 원클릭 번역 및 SEO 키워드 생성이 성공적으로 완료되었습니다! 언어 탭을 클릭하여 각 국가별 자동 번역 결과를 확인해 보세요.");
        } catch (err) {
            console.error("AI Store SEO Generation failed:", err);
            alert("AI 번역/SEO 세팅 중 오류가 발생했습니다: " + err.message);
        } finally {
            setSeoGenerating(false);
        }
    };

    const getMultiValue = (field) => {
        const val = formData[field];
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) return val[langTab] || '';
        return langTab === 'ko' ? (val || '') : '';
    };

    const handleMultiChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const currentVal = prev[name];
            const isObj = typeof currentVal === 'object' && currentVal !== null && !Array.isArray(currentVal);
            const newVal = isObj ? { ...currentVal } : { ko: currentVal || '' };
            newVal[langTab] = value;
            return { ...prev, [name]: newVal };
        });
    };

    const [formData, setFormData] = useState({
        name: '',
        category: 'dining',
        location: '',
        storeDescription: '',
        phoneNumber: '',
        address: '',
        googleMapUrl: '',
        mapIframeUrl: '',
        website: '',
        email: '',
        videoUrl: '',
        managerEmail: '',
        slogan: '',
        slug: '',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
        gallery: [], 
        menu: [],
        storeMode: 'normal', 
        snsPromotion: {
            instagramCaption: '',
            facebookCaption: '',
            tiktokCaption: '',
            youtubeCaption: '',
            hashtags: '#쿠퐁온라인 #베트남맛집 #호치민맛집 #할인쿠폰 #coupong #qr코드가맹점 #베트남업소무료광고 #베트남교민커뮤니티 #KhuyếnKhuyênThịMÓNNướngHànQuốc #NhàHàngHànQuốc #MãGiảmGiá #Massage',
            status: 'none'
        },
        badgeMd: false,
        badgeTop: false,
        isAdultOnly: false,
        shareThumbnail: '',
        designStyle: 'style5', 
        instagramLink: '',
        tiktokLink: '',
        facebookLink: '',
        youtubeLink: '',
        remarks: '',
        galleryTags: '', 
        centerTags: '', 
        logo: '', 
        logoHeight: '60', 
        menuImages: [], 
        wordpressUrl: '', 
        hideDefaultMenu: false 
    });

    useEffect(() => {
        if (editId) {
            fetchStoreData(editId);
        }
    }, [editId]);

    const fetchStoreData = async (id) => {
        setLoading(true);
        try {
            const store = await StoreService.getStoreById(id);
            if (store) {
                let galleryArr = [];
                if (Array.isArray(store.gallery)) {
                    galleryArr = store.gallery;
                } else if (typeof store.gallery === 'string') {
                    try {
                        galleryArr = JSON.parse(store.gallery);
                    } catch (e) {
                        galleryArr = store.gallery.split(',').map(s => s.trim()).filter(Boolean).map(url => ({ url }));
                    }
                }

                let storeCategory = store.category ? String(store.category).trim() : 'other';
                const lowerCat = storeCategory.toLowerCase();
                
                if (lowerCat.includes('식당') || lowerCat.includes('음식') || lowerCat === 'dining') {
                    storeCategory = 'dining';
                } else if (lowerCat.includes('카페') || lowerCat.includes('베이커리') || lowerCat === 'cafe') {
                    storeCategory = 'cafe';
                } else if (lowerCat.includes('미용') || lowerCat.includes('헤어') || lowerCat === 'beauty') {
                    storeCategory = 'beauty';
                } else if (lowerCat.includes('마사지') || lowerCat.includes('스파') || lowerCat === 'massage') {
                    storeCategory = 'massage';
                } else if (lowerCat.includes('유흥') || lowerCat === 'nightlife') {
                    storeCategory = 'nightlife';
                } else if (lowerCat.includes('마트') || lowerCat === 'mart') {
                    storeCategory = 'mart';
                } else if (lowerCat.includes('호텔') || lowerCat === 'hotel') {
                    storeCategory = 'hotel';
                } else if (lowerCat.includes('학원') || lowerCat === 'academy') {
                    storeCategory = 'academy';
                } else if (lowerCat.includes('골프') || lowerCat.includes('레저') || lowerCat === 'golf') {
                    storeCategory = 'golf';
                } else if (lowerCat.includes('여행') || lowerCat === 'travel') {
                    storeCategory = 'travel';
                } else if (lowerCat.includes('패션') || lowerCat === 'fashion') {
                    storeCategory = 'fashion';
                } else if (lowerCat.includes('생활') || lowerCat === 'service') {
                    storeCategory = 'service';
                } else if (lowerCat.includes('부동산') || lowerCat === 'estate') {
                    storeCategory = 'estate';
                } else {
                    const matchedCat = categories.find(c => c.id?.toLowerCase() === lowerCat || Object.values(c.name || {}).some(n => n.toLowerCase() === lowerCat));
                    if (matchedCat) {
                        storeCategory = matchedCat.id;
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    ...store,
                    storeDescription: store.description || store.storeDescription || prev.storeDescription || '',
                    category: storeCategory,
                    gallery: Array.isArray(galleryArr) ? galleryArr : [],
                    menu: Array.isArray(store.menu) ? store.menu : [],
                    snsPromotion: store.snsPromotion || {
                        instagramCaption: '',
                        facebookCaption: '',
                        tiktokCaption: '',
                        hashtags: '#쿠퐁온라인 #베트남맛집 #할인쿠폰',
                        status: 'none'
                    },
                    slug: store.slug || '',
                    shareThumbnail: store.shareThumbnail || '',
                    googleMapUrl: store.googleMapUrl || (store.mapUrl && !store.mapUrl.includes('<iframe') ? store.mapUrl : ''),
                    mapIframeUrl: store.mapIframeUrl || (store.mapUrl && store.mapUrl.includes('<iframe') ? store.mapUrl : ''),
                    galleryTags: Array.isArray(store.galleryTags) ? store.galleryTags.join(', ') : (store.galleryTags || ''),
                    centerTags: Array.isArray(store.centerTags) ? store.centerTags.join(', ') : (store.centerTags || store.tags || ''),
                    keywords: Array.isArray(store.keywords) ? store.keywords.join(', ') : (store.keywords || ''),
                    wordpressUrl: store.wordpressUrl || '',
                    hideDefaultMenu: store.hideDefaultMenu || false
                }));

                const mUid = store.managerUid || store.ownerUid;
                if (mUid) {
                    try {
                        const { UserService } = await import('../../services/UserService');
                        const mUser = await UserService.getUserById(mUid);
                        if (mUser) setManagerPoints(mUser.points || 0);
                    } catch (err) {
                        console.error("Error fetching manager points:", err);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching store:", error);
        } finally {
            setLoading(false);
        }
    };

    const displayCategories = categories.map(c => c.id);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = (name === 'image' || name === 'shareThumbnail') ? fixImageUrl(value) : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { StorageService } = await import('../../services/StorageService');
            const storeName = formData.name.ko || formData.name.en || formData.name.vi || 'coupong-store';
            const url = await StorageService.uploadImage(file, 'logos', 'standard', `${storeName}-logo`);
            setFormData(prev => ({ ...prev, logo: url }));
        } catch (error) {
            alert('로고 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { StorageService } = await import('../../services/StorageService');
            const storeName = formData.name.ko || formData.name.en || formData.name.vi || 'coupong-store';
            const url = await StorageService.uploadImage(file, 'stores', 'standard', storeName);
            setFormData(prev => ({ ...prev, image: url }));
        } catch (error) {
            alert('사진 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const parseGallery = (galleryData) => {
        if (!galleryData) return [];
        if (Array.isArray(galleryData)) {
            return galleryData.map(item => typeof item === 'string' ? { url: item } : item);
        }
        try {
            const parsed = JSON.parse(galleryData);
            if (Array.isArray(parsed)) {
                return parsed.map(item => typeof item === 'string' ? { url: item } : item);
            }
        } catch (e) { }
        return [];
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingGallery(true);
        try {
            const { StorageService } = await import('../../services/StorageService');
            const uploadPromises = files.map(file => StorageService.uploadImage(file, 'stores'));
            const urls = await Promise.all(uploadPromises);

            const currentGallery = parseGallery(formData.gallery);
            const newGalleryItems = urls.map(url => ({ url, title: '', price: '' }));
            const newGallery = [...currentGallery, ...newGalleryItems];

            setFormData(prev => ({ ...prev, gallery: newGallery }));
        } catch (error) {
            alert('갤러리 사진 업로드에 실패했습니다.');
        } finally {
            setUploadingGallery(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalName = typeof formData.name === 'object' && formData.name !== null ? formData.name.ko : formData.name;
        if (!finalName) {
            alert('한국어 업체명은 필수입니다.');
            return;
        }

        if (!formData.image || formData.image.trim() === '') {
            alert('메인 이미지는 필수입니다.');
            return;
        }

        setLoading(true);
        try {
            const editorDiv = document.getElementById('store-description-editor');
            let currentDesc = formData.storeDescription;
            if (editorDiv) {
                const val = editorDiv.innerHTML;
                if (typeof currentDesc === 'object' && currentDesc !== null) {
                    currentDesc = { ...currentDesc, [langTab]: val };
                } else {
                    if (langTab === 'ko') {
                        currentDesc = val;
                    } else {
                        currentDesc = { ko: currentDesc || '', [langTab]: val };
                    }
                }
            }

            let normalizedData = {
                ...formData,
                description: currentDesc,
                storeDescription: currentDesc,
                gallery: Array.isArray(formData.gallery) ? formData.gallery : parseGallery(formData.gallery),
                galleryTags: formData.galleryTags ? formData.galleryTags.split(',').map(s => s.trim()).filter(Boolean) : [],
                centerTags: formData.centerTags ? formData.centerTags.split('/').map(s => s.trim()).filter(Boolean) : [],
                keywords: formData.keywords ? formData.keywords.split(',').map(s => s.trim()).filter(Boolean) : []
            };

            if (!editId && !isAdmin) {
                normalizedData.managerEmail = user?.email || '';
                normalizedData.managerUid = user?.uid || '';
            } else {
                normalizedData.managerEmail = formData.managerEmail?.trim().toLowerCase() || '';

                if (isAdmin && normalizedData.managerEmail) {
                    try {
                        const { collection, query, where, getDocs } = await import('firebase/firestore');
                        const { db } = await import('../../firebase');
                        const q = query(collection(db, 'users'), where('email', '==', normalizedData.managerEmail));
                        const snap = await getDocs(q);
                        if (!snap.empty) {
                            normalizedData.managerUid = snap.docs[0].id;
                        }
                    } catch (e) { console.error('Error fetching UID by email:', e); }
                } else if (!editId && user?.uid) {
                    normalizedData.managerUid = user.uid;
                }
            }
            normalizedData.email = formData.email?.trim().toLowerCase() || '';

            if (editId) {
                const existingStore = await StoreService.getStoreById(editId);
                normalizedData.isActive = existingStore?.isActive !== undefined ? existingStore.isActive : true;
                await StoreService.updateStore(editId, normalizedData);
                if (refreshManagedStores) await refreshManagedStores();
                alert('업체 정보가 수정되었습니다.');
                
                if (normalizedData.designStyle === 'style3') {
                    if (window.confirm('영상 상세 페이지로 이동하여 확인하시겠습니까?')) {
                        router.push(`/store/${editId}`);
                        return;
                    }
                }
            } else {
                normalizedData.isActive = true;
                const newDoc = await StoreService.addStore(normalizedData);
                if (refreshManagedStores) await refreshManagedStores();
                alert('업체가 등록되었습니다.');
                router.push(`/store/${newDoc.id}`);
                return;
            }
            router.back();
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRecharge = async () => {
        let targetUid = formData.managerUid || formData.ownerUid;
        let targetEmail = formData.managerEmail || formData.email;
        let targetName = "매니저";

        if (!targetUid && targetEmail) {
            try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('../../firebase');
                const q = query(collection(db, 'users'), where('email', '==', targetEmail.trim().toLowerCase()));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    targetUid = snap.docs[0].id;
                    targetName = snap.docs[0].data().displayName || "매니저";
                }
            } catch (e) {
                console.error('Error searching manager UID:', e);
            }
        }

        if (!targetUid && isAdmin) {
            const useAdmin = window.confirm(
                `연결된 매니저 계정이 없습니다.\n운영자 본인 계정(${user.email})으로 충전하시겠습니까?`
            );
            if (useAdmin) {
                targetUid = user.uid;
                targetName = "운영자(본인)";
                targetEmail = user.email;
            }
        }

        if (!targetUid) {
            alert('매니저 계정이 등록되어 있지 않습니다.');
            return;
        }

        const currentVal = prompt(
            `[${targetName}] 계정으로 포인트를 적용합니다.\n충전/차감할 금액을 입력하세요.`,
            '10000'
        );

        if (!currentVal || isNaN(currentVal)) return;
        const amount = parseInt(currentVal);

        setLoading(true);
        try {
            const { UserService } = await import('../../services/UserService');
            const reason = `매장 포인트 조정 (대상: ${targetEmail}, 처리: ${user.email})`;
            await UserService.rechargePoints(targetUid, amount, reason);
            alert(`${targetName} 계정에 ${amount.toLocaleString()} P가 성공적으로 반영되었습니다.`);
            fetchStoreData(editId);
        } catch (error) {
            alert('포인트 처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)', color: 'black', fontSize: '0.95rem',
        outline: 'none', transition: 'all 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)',
        marginBottom: '6px', fontWeight: 600, paddingLeft: '4px'
    };

    const sectionStyle = {
        background: 'var(--color-bg-elevated)', padding: '24px', borderRadius: '24px',
        border: '1px solid var(--color-border)', marginBottom: '16px'
    };

    const galleryGridRef = useRef(null);
    const descriptionEditorRef = useRef(null);

    useEffect(() => {
        if (descriptionEditorRef.current && document.activeElement !== descriptionEditorRef.current) {
            const currentVal = getMultiValue('storeDescription') || '';
            if (descriptionEditorRef.current.innerHTML !== currentVal) {
                descriptionEditorRef.current.innerHTML = currentVal;
            }
        }
    }, [formData.storeDescription, langTab, loading]);

    const applyTag = (command, value = null) => {
        if (typeof document === "undefined") return;
        if (command === 'h1') document.execCommand('formatBlock', false, 'H1');
        else if (command === 'h2') document.execCommand('formatBlock', false, 'H2');
        else if (command === 'h3') document.execCommand('formatBlock', false, 'H3');
        else if (command === 'list') document.execCommand('insertUnorderedList');
        else if (command === 'list-num') document.execCommand('insertOrderedList');
        else if (command === 'link') {
            const url = prompt('링크 주소를 입력하세요 (http://...)');
            if (url) document.execCommand('createLink', false, url);
        }
        else if (command === 'color') {
            document.execCommand('foreColor', false, value);
        }
        else document.execCommand(command);
    };

    const handlePaste = (e) => {
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        if (!text) return;
        e.preventDefault();
        let contentToInsert = "";
        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            contentToInsert = doc.body.innerHTML
                .replace(/<p/gi, '<div')
                .replace(/<\/p>/gi, '</div>');
        } else {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
            const isBulletList = lines.every(l => /^[-*•]/.test(l));
            const isNumList = lines.every(l => /^\d+[.)]/.test(l));
            if (lines.length > 1 && (isBulletList || isNumList)) {
                const tag = isBulletList ? 'ul' : 'ol';
                const padding = isBulletList ? '1.2em' : '1.5em';
                const listItems = lines.map(line => {
                    const cleanContent = line.replace(/^([-*•]|\d+[.)])\s*/, '').trim();
                    return `<li style="margin-bottom: 5px;">${cleanContent}</li>`;
                }).join('\n');
                contentToInsert = `<${tag} style="margin: 10px 0; padding-left: ${padding};">${listItems}</${tag}>`;
            } else {
                contentToInsert = text.replace(/\n/g, '<br>');
            }
        }
        document.execCommand('insertHTML', false, contentToInsert);
        handleMultiChange({ target: { name: 'storeDescription', value: e.currentTarget.innerHTML }});
    };

    if (loading && editId) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ background: 'white', minHeight: '100vh', color: 'black' }}>
            <HeaderV2 />
            <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'black', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                    {editId ? '업체 정보 수정' : '새 업체 등록'}
                </h1>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                    { id: 'ko', label: '🇰🇷 한국어 (기본)' },
                    { id: 'en', label: '🇺🇸 English' },
                    { id: 'vi', label: '🇻🇳 Tiếng Việt' },
                    { id: 'zh-CN', label: '🇨🇳 中文(简体)' }
                ].map(lang => (
                    <button
                        type="button"
                        key={lang.id}
                        onClick={() => setLangTab(lang.id)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: `1px solid ${langTab === lang.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: langTab === lang.id ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                            color: langTab === lang.id ? 'white' : 'var(--color-text-muted)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
                borderRadius: '24px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContext: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} color="#a855f7" className={seoGenerating ? "animate-pulse" : ""} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 950, color: '#4f46e5' }}>
                            Gemini 2.5 AI 스토어 다국어 & SEO 엔진
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    disabled={seoGenerating}
                    onClick={generateStoreSeoAndTranslations}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '14px',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
                        transition: 'all 0.2s',
                        fontFamily: "'Pretendard', sans-serif"
                    }}
                >
                    <Sparkles size={16} /> AI 원스톱 글로벌 다국어 번역 & SEO 세팅 실행
                </button>
            </div>

            <div style={{ ...sectionStyle, background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(99, 102, 241, 0.05))', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <label style={{ ...labelStyle, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> 등록 목적 선택
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, storeMode: 'normal' }))}
                        style={{
                            padding: '16px 12px', borderRadius: '16px', border: '2px solid',
                            borderColor: formData.storeMode === 'normal' ? 'var(--color-primary)' : 'var(--color-border)',
                            background: formData.storeMode === 'normal' ? 'white' : 'transparent',
                            color: formData.storeMode === 'normal' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                        }}
                    >
                        <Plus size={24} color={formData.storeMode === 'normal' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>쿠폰 협력업체</div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, storeMode: 'info' }))}
                        style={{
                            padding: '16px 12px', borderRadius: '16px', border: '2px solid',
                            borderColor: formData.storeMode === 'info' ? '#3b82f6' : 'var(--color-border)',
                            background: formData.storeMode === 'info' ? 'white' : 'transparent',
                            color: formData.storeMode === 'info' ? '#3b82f6' : 'var(--color-text-muted)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                        }}
                    >
                        <Info size={24} color={formData.storeMode === 'info' ? '#3b82f6' : 'var(--color-text-muted)'} />
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>베트남 업소 정보용</div>
                        </div>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={sectionStyle}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="var(--color-primary)" /> 업소 로고 (정사각형 권장)
                    </label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '20px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid var(--color-border)' }}>
                            {formData.logo ? (
                                <img src={fixImageUrl(formData.logo)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    <Info size={24} />
                                </div>
                            )}
                            <label style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s'
                            }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                                <Camera size={20} />
                                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                name="logo"
                                value={formData.logo || ''}
                                onChange={handleChange}
                                placeholder="로고 URL 직접 입력"
                                style={{ ...inputStyle, fontSize: '0.8rem', padding: '10px', marginBottom: '12px' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>표시 높이(px):</label>
                                <input
                                    type="number"
                                    name="logoHeight"
                                    value={formData.logoHeight || '60'}
                                    onChange={handleChange}
                                    placeholder="60"
                                    style={{ ...inputStyle, width: '80px', padding: '6px 10px', fontSize: '0.85rem' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={sectionStyle}>
                    <div style={{ position: 'relative', height: '200px', borderRadius: '16px', overflow: 'hidden', background: '#f1f5f9', marginBottom: '16px' }}>
                        <img src={fixImageUrl(formData.image)} alt="Store Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <label style={{
                            position: 'absolute', bottom: '12px', right: '12px', background: 'var(--color-primary)',
                            color: 'white', padding: '8px 16px', borderRadius: '10px', display: 'flex',
                            alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}>
                            <Camera size={16} />
                            사진 변경
                            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </label>
                        {uploading && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Loader2 size={32} className="animate-spin" />
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>또는 이미지 링크 직접 입력</label>
                        <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            style={{ ...inputStyle, fontSize: '0.85rem' }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <label style={{ ...labelStyle, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Globe size={14} /> 공유용 썸네일
                        </label>
                        {formData.shareThumbnail && (
                            <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', height: '120px', background: '#f1f5f9', position: 'relative' }}>
                                <img src={formData.shareThumbnail} alt="Share Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, shareThumbnail: '' }))}
                                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                name="shareThumbnail"
                                value={formData.shareThumbnail}
                                onChange={handleChange}
                                placeholder="이미지 URL 직접 입력 또는 파일 선택"
                                style={{ ...inputStyle, fontSize: '0.85rem', flex: 1, marginBottom: 0 }}
                            />
                            <label style={{
                                background: '#6366f1', color: 'white', padding: '0 16px', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap'
                            }}>
                                파일 선택
                                <input type="file" accept="image/*" onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    setUploading(true);
                                    try {
                                        const { StorageService } = await import('../../services/StorageService');
                                        const url = await StorageService.uploadImage(file, 'stores');
                                        setFormData(prev => ({ ...prev, shareThumbnail: url }));
                                    } catch (error) {
                                        alert('공유 썸네일 업로드 실패');
                                    } finally {
                                        setUploading(false);
                                    }
                                }} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>업체명 * {langTab !== 'ko' && '(번역 수정)'}</label>
                        <input type="text" name="name" value={getMultiValue('name')} onChange={handleMultiChange} required={langTab === 'ko'} placeholder="업소 이름을 입력하세요" style={inputStyle} />
                    </div>

                    {langTab === 'ko' && (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ ...labelStyle, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Globe size={14} /> 단축주소 설정 (영문 소문자/숫자만, 예: bestsalon)
                            </label>
                            <input 
                                type="text" 
                                name="slug" 
                                value={formData.slug || ''} 
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                                    setFormData(p => ({ ...p, slug: val }));
                                }} 
                                placeholder="예: bestsalon (미설정시 ID로 주소 자동 생성)" 
                                style={inputStyle} 
                            />
                            {formData.slug && (
                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 4px', fontWeight: 600 }}>
                                    설정 시 주소: <span style={{ color: '#4f46e5' }}>https://coupong.online/store/{formData.slug}</span>
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label style={labelStyle}>슬로건 {langTab !== 'ko' && '(번역 수정)'}</label>
                        <input type="text" name="slogan" value={getMultiValue('slogan')} onChange={handleMultiChange} placeholder="업소명 아래에 표시될 간단한 홍보 문구" style={inputStyle} />
                    </div>
                </div>

                <div style={sectionStyle}>
                    <label style={labelStyle}>카테고리 설정</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {displayCategories.map(cat => (
                            <button
                                key={cat} type="button"
                                onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                                style={{
                                    padding: '10px 4px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                                    border: '1.5px solid', cursor: 'pointer', transition: 'all 0.2s',
                                    borderColor: formData.category === cat ? 'var(--color-primary)' : 'var(--color-border)',
                                    background: formData.category === cat ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                                    color: formData.category === cat ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                }}
                            >
                                {categories.find(c => c.id === cat)?.name?.ko || cat.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label style={labelStyle}>✨ 검색 키워드 (쉼표로 구분)</label>
                        <input
                            type="text"
                            name="keywords"
                            value={formData.keywords || ''}
                            onChange={handleChange}
                            placeholder="예: 삼겹살, 맛집, 호치민"
                            style={inputStyle}
                        />
                    </div>
                </div>

                {isAdmin && (
                    <div style={sectionStyle}>
                        <label style={{ ...labelStyle, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={16} /> 상세 페이지 디자인 스타일
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                            {[
                                { id: 'style5', name: '기본형 (스타일 5)', desc: '바텀시트 UI(최신)' },
                                { id: 'style6', name: '프리미엄 (스타일 6)', desc: '현대식 모바일 UX(추천)' },
                                { id: 'seo_style', name: 'SEO 스타일', desc: '틱톡/SNS 스타일' }
                            ].map(style => (
                                <button
                                    key={style.id} type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, designStyle: style.id }))}
                                    style={{
                                        padding: '16px 4px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 800,
                                        border: '2px solid', cursor: 'pointer', transition: 'all 0.23s',
                                        borderColor: formData.designStyle === style.id ? 'var(--color-primary)' : 'var(--color-border)',
                                        background: formData.designStyle === style.id ? 'rgba(168, 85, 247, 0.08)' : 'white',
                                        color: formData.designStyle === style.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center'
                                    }}
                                >
                                    <span>{style.name}</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{style.desc}</span>
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ ...labelStyle, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles size={14} /> ✨ 중앙 애니메이션 태그 (/로 줄바꿈)
                                </label>
                                <input
                                    type="text"
                                    name="centerTags"
                                    value={formData.centerTags || ''}
                                    onChange={handleChange}
                                    placeholder="예: 20px 폰트 / 중앙 정렬"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ ...labelStyle, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Camera size={14} /> 📸 갤러리 애니메이션 태그 (쉼표로 구분)
                                </label>
                                <input
                                    type="text"
                                    name="galleryTags"
                                    value={formData.galleryTags || ''}
                                    onChange={handleChange}
                                    placeholder="예: 실시간 예약, 1:1 서비스"
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div style={sectionStyle}>
                    <label style={{ ...labelStyle, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Link2 size={16} /> SNS 홍보 링크 설정
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.8rem', marginBottom: '4px' }}>
                                유튜브 링크
                            </label>
                            <input
                                type="text"
                                name="youtubeLink"
                                value={formData.youtubeLink || ''}
                                onChange={handleChange}
                                placeholder="https://www.youtube.com/..."
                                style={{ ...inputStyle, background: 'white', color: '#1e293b', marginBottom: 0 }}
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.8rem', marginBottom: '4px' }}>
                                인스타그램 링크
                            </label>
                            <input
                                type="text"
                                name="instagramLink"
                                value={formData.instagramLink || ''}
                                onChange={handleChange}
                                placeholder="https://www.instagram.com/..."
                                style={{ ...inputStyle, background: 'white', color: '#1e293b', marginBottom: 0 }}
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.8rem', marginBottom: '4px' }}>
                                틱톡 링크
                            </label>
                            <input
                                type="text"
                                name="tiktokLink"
                                value={formData.tiktokLink || ''}
                                onChange={handleChange}
                                placeholder="https://www.tiktok.com/..."
                                style={{ ...inputStyle, background: 'white', color: '#1e293b', marginBottom: 0 }}
                            />
                        </div>
                    </div>
                </div>

                <div style={sectionStyle}>
                    <label style={labelStyle}>매장 소개글 {langTab !== 'ko' && '(번역 수정)'}</label>
                    <div style={{ 
                        display: 'flex', gap: '6px', padding: '10px', background: '#f8fafc', 
                        border: '1px solid #e2e8f0', borderRadius: '16px 16px 0 0', borderBottom: 'none',
                        flexWrap: 'wrap', marginTop: '8px'
                    }}>
                        {[
                            { id: 'bold', icon: <Bold size={18} />, label: '굵게' },
                            { id: 'italic', icon: <Italic size={18} />, label: '기울임' },
                            { id: 'h1', icon: <Heading1 size={18} />, label: 'H1' },
                            { id: 'h2', icon: <Heading2 size={18} />, label: 'H2' },
                            { id: 'h3', icon: <Heading3 size={18} />, label: 'H3' },
                            { id: 'list', icon: <List size={18} />, label: '점 목록' },
                            { id: 'list-num', icon: <ListOrdered size={18} />, label: '숫자 목록' },
                            { id: 'link', icon: <Link2 size={18} />, label: '링크' }
                        ].map(tool => (
                            <button
                                key={tool.id}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    applyTag(tool.id);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '6px 10px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                    background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800,
                                    color: '#475569', transition: 'all 0.2s'
                                }}
                            >
                                {tool.icon} {tool.label}
                            </button>
                        ))}
                    </div>
                    
                    <div 
                        id="store-description-editor"
                        ref={descriptionEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onPaste={handlePaste}
                        onBlur={(e) => {
                            handleMultiChange({ target: { name: 'storeDescription', value: e.currentTarget.innerHTML }});
                        }}
                        style={{ 
                            ...inputStyle, 
                            minHeight: '200px', 
                            borderRadius: '0 0 16px 16px',
                            background: 'white',
                            borderTop: 'none',
                            outline: 'none',
                            overflowY: 'auto',
                            userSelect: 'text',
                            WebkitUserSelect: 'text'
                        }}
                    />
                </div>

                <div style={sectionStyle}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1' }}>
                        <Link2 size={16} /> 🌐 워드프레스 본문 임베드 연동 (선택)
                    </label>
                    <input
                        type="text"
                        name="wordpressUrl"
                        value={formData.wordpressUrl || ''}
                        onChange={handleChange}
                        placeholder="예: https://coupong.online/2026/05/24/예제-글/"
                        style={{ ...inputStyle, marginBottom: '16px' }}
                    />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                        <input
                            type="checkbox"
                            id="hideDefaultMenu"
                            name="hideDefaultMenu"
                            checked={!!formData.hideDefaultMenu}
                            onChange={(e) => setFormData(p => ({ ...p, hideDefaultMenu: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="hideDefaultMenu" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'black', cursor: 'pointer' }}>
                            기존 등록된 메뉴 숨기기
                        </label>
                    </div>
                </div>

                <div style={sectionStyle}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 전화번호</label>
                        <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="090-xxxx-xxxx" style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🍴 대표 메뉴 설정
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(formData.menu || []).map((item, index) => (
                                <div key={index} style={{ padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="메뉴명"
                                            value={item.name}
                                            onChange={(e) => {
                                                const newMenu = [...formData.menu];
                                                newMenu[index].name = e.target.value;
                                                setFormData(p => ({ ...p, menu: newMenu }));
                                            }}
                                            style={{ ...inputStyle, marginBottom: 0, flex: 2, padding: '10px 14px', fontSize: '0.9rem' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="가격"
                                            value={item.price}
                                            onChange={(e) => {
                                                const newMenu = [...formData.menu];
                                                newMenu[index].price = e.target.value;
                                                setFormData(p => ({ ...p, menu: newMenu }));
                                            }}
                                            style={{ ...inputStyle, marginBottom: 0, flex: 1.2, padding: '10px 14px', fontSize: '0.9rem' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newMenu = formData.menu.filter((_, i) => i !== index);
                                                setFormData(p => ({ ...p, menu: newMenu }));
                                            }}
                                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, menu: [...(p.menu || []), { name: '', price: '', description: '' }] }))}
                                style={{
                                    padding: '12px', borderRadius: '12px', background: 'white', border: '1px dashed #cbd5e1',
                                    color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                <Plus size={18} /> 메뉴 추가하기
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>비고 (쿠폰 상단 노출 문구)</label>
                        <input type="text" name="remarks" value={formData.remarks || ''} onChange={handleChange} placeholder="예: 2인이상 사용가능" style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>동네 (지역명) {langTab !== 'ko' && '(번역 수정)'}</label>
                        <input type="text" name="location" value={getMultiValue('location')} onChange={handleMultiChange} placeholder="예: 7군 푸미흥" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>상세 주소 {langTab !== 'ko' && '(번역 수정)'}</label>
                        <input type="text" name="address" value={getMultiValue('address')} onChange={handleMultiChange} placeholder="정확한 도로 주소를 입력하세요" style={{ ...inputStyle, marginBottom: '16px' }} />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%', padding: '18px', borderRadius: '18px', background: 'var(--color-primary)',
                        color: 'white', border: 'none', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer',
                        marginTop: '20px', marginBottom: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {editId ? '정보 수정 완료' : '업체 등록 신청하기'}
                </button>
            </form>
            </div>
        </div>
    );
}
