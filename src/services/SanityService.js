import { createClient } from '@sanity/client';

const client = createClient({
  projectId: '8xyje6wz',
  dataset: 'production',
  useCdn: false, // 실시간 데이터 갱신 및 동기화를 위해 CDN 캐시 사용 해제
  apiVersion: '2023-05-03', // Sanity API 버전 지정
  requestTag: 'fresh',
});

export const SanityService = {
  /**
   * ID 또는 Slug를 기반으로 Sanity에서 가맹점 데이터를 상세 조회합니다.
   * @param {string} idOrSlug - 조회할 가맹점의 ID 또는 슬러그명
   */
  getStoreByIdOrSlug: async (idOrSlug) => {
    try {
      let decodedIdOrSlug = idOrSlug;
      try {
        decodedIdOrSlug = decodeURIComponent(idOrSlug);
      } catch (e) {}

      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/sanity/store/${encodeURIComponent(decodedIdOrSlug)}?t=${Date.now()}`);
        if (res.ok) {
          return await res.json();
        }
        throw new Error(`API returned ${res.status}`);
      }
      const query = `*[_type == "store" && (_id == $idOrSlug || slug.current == $idOrSlug || firestoreId == $idOrSlug)][0] {
        _id,
        firestoreId,
        "slug": slug.current,
        name,
        nameVi,
        nameEn,
        category,
        slogan,
        sloganVi,
        sloganEn,
        businessHours,
        phone,
        location,
        locationVi,
        locationEn,
        googleMapUrl,
        wordpressUrl,
        vnIntro,
        videoKeywords,
        vnIntro2,
        videoKeywords2,
        galleryTags,
        description,
        descriptionVi,
        descriptionEn,
        kakaoId,
        youtubeLink,
        instagramLink,
        tiktokLink,
        "images": images[].asset->url,
        imageUrls,
        "menuImages": menuImages[].asset->url,
        "headerVideo": headerVideo.asset->url,
        headerYoutube,
        menuGroups[] {
          groupName,
          "items": menus[] {
            name,
            price,
            note
          }
        }
      }`;

      let result = null;
      try {
        result = await client.fetch(query, { idOrSlug: decodedIdOrSlug }, { cache: 'no-store', next: { revalidate: 0 } });
      } catch (sanityError) {
        console.warn("⚠️ Sanity API Request failed (possible network/CORS block):", sanityError.message);
      }

      if (!result) return null;

      // 기존 Firebase 스토어 객체 구조와 연동될 수 있도록 필드 구조를 호환되게 매핑
      const uploadedImages = result.images || [];
      const linkImages = result.imageUrls || [];
      const gallery = [...uploadedImages, ...linkImages].filter(Boolean);
      const finalImage = gallery[0] || 'https://images.unsplash.com/photo-1544025162-8e6ad793f605?auto=format&fit=crop&q=80&w=800';

      return {
        id: result.firestoreId || result._id,
        sanityId: result._id,
        slug: result.slug || '',
        name: {
          ko: result.name || '',
          vi: result.nameVi || result.name || '',
          en: result.nameEn || result.name || ''
        },
        category: result.category || '기타',
        slogan: {
          ko: result.slogan || '',
          vi: result.sloganVi || result.slogan || '',
          en: result.sloganEn || result.slogan || ''
        },
        businessHours: result.businessHours || '',
        phone: result.phone || '',
        phoneNumber: result.phone || '',
        address: {
          ko: result.location || '',
          vi: result.locationVi || result.location || '',
          en: result.locationEn || result.location || ''
        },
        location: {
          ko: result.location || '',
          vi: result.locationVi || result.location || '',
          en: result.locationEn || result.location || ''
        },
        googleMapUrl: result.googleMapUrl || '',
        mapUrl: result.googleMapUrl || '',
        wordpressUrl: result.wordpressUrl || '',
        vnIntro: result.vnIntro || '',
        videoKeywords: result.videoKeywords || [],
        vnIntro2: result.vnIntro2 || '',
        videoKeywords2: result.videoKeywords2 || [],
        galleryTags: result.galleryTags || [],
        storeDescription: {
          ko: result.description || '',
          vi: result.descriptionVi || result.description || '',
          en: result.descriptionEn || result.description || ''
        },
        description: {
          ko: result.description || '',
          vi: result.descriptionVi || result.description || '',
          en: result.descriptionEn || result.description || ''
        },
        kakaoId: result.kakaoId || '',
        youtubeLink: result.youtubeLink || '',
        instagramLink: result.instagramLink || '',
        tiktokLink: result.tiktokLink || '',
        image: finalImage,
        images: gallery.length > 0 ? gallery : [finalImage],
        imageUrls: linkImages,
        gallery: gallery,
        headerVideo: result.headerVideo || '',
        headerYoutube: result.headerYoutube || '',
        menuGroups: result.menuGroups || [],
        menuImages: result.menuImages || [],
        isSanityData: true // Sanity 연동을 구분하기 위한 플래그
      };
    } catch (error) {
      console.error("❌ Sanity에서 상점 데이터를 가져오던 중 오류 발생:", error);
      return null;
    }
  },

  /**
   * Sanity에서 등록된 모든 가맹점 목록을 조회하여 다국어 구조로 반환합니다.
   */
  getAllStores: async () => {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/sanity/stores?t=${Date.now()}`);
        if (res.ok) {
          return await res.json();
        }
        throw new Error(`API returned ${res.status}`);
      }
      const query = `*[_type == "store"] {
        _id,
        firestoreId,
        "slug": slug.current,
        name,
        nameVi,
        nameEn,
        category,
        slogan,
        sloganVi,
        sloganEn,
        phone,
        location,
        locationVi,
        locationEn,
        googleMapUrl,
        wordpressUrl,
        vnIntro,
        videoKeywords,
        vnIntro2,
        videoKeywords2,
        galleryTags,
        description,
        descriptionVi,
        descriptionEn,
        kakaoId,
        youtubeLink,
        instagramLink,
        tiktokLink,
        "images": images[].asset->url,
        imageUrls
      }`;

       let results = [];
       try {
         results = await client.fetch(query, {}, { cache: 'no-store', next: { revalidate: 0 } });
       } catch (sanityError) {
         console.error("❌ Sanity API Request failed in getAllStores:", sanityError.message, sanityError.stack);
       }
      if (!results || results.length === 0) return [];

      return results.map(result => {
        const uploadedImages = result.images || [];
        const linkImages = result.imageUrls || [];
        const gallery = [...uploadedImages, ...linkImages].filter(Boolean);
        const finalImage = gallery[0] || 'https://images.unsplash.com/photo-1544025162-8e6ad793f605?auto=format&fit=crop&q=80&w=800';

        return {
          id: result.firestoreId || result._id,
          sanityId: result._id,
          slug: result.slug || '',
          name: {
            ko: result.name || '',
            vi: result.nameVi || result.name || '',
            en: result.nameEn || result.name || ''
          },
          category: result.category || '기타',
          slogan: {
            ko: result.slogan || '',
            vi: result.sloganVi || result.slogan || '',
            en: result.sloganEn || result.slogan || ''
          },
          businessHours: '',
          phone: result.phone || '',
          phoneNumber: result.phone || '',
          address: {
            ko: result.location || '',
            vi: result.locationVi || result.location || '',
            en: result.locationEn || result.location || ''
          },
          location: {
            ko: result.location || '',
            vi: result.locationVi || result.location || '',
            en: result.locationEn || result.location || ''
          },
          googleMapUrl: result.googleMapUrl || '',
          mapUrl: result.googleMapUrl || '',
          wordpressUrl: result.wordpressUrl || '',
          vnIntro: result.vnIntro || '',
          videoKeywords: result.videoKeywords || [],
          vnIntro2: result.vnIntro2 || '',
          videoKeywords2: result.videoKeywords2 || [],
          galleryTags: result.galleryTags || [],
          storeDescription: {
            ko: result.description || '',
            vi: result.descriptionVi || result.description || '',
            en: result.descriptionEn || result.description || ''
          },
          description: {
            ko: result.description || '',
            vi: result.descriptionVi || result.description || '',
            en: result.descriptionEn || result.description || ''
          },
          kakaoId: result.kakaoId || '',
          youtubeLink: result.youtubeLink || '',
          instagramLink: result.instagramLink || '',
          tiktokLink: result.tiktokLink || '',
          image: finalImage,
          images: gallery.length > 0 ? gallery : [finalImage],
          imageUrls: linkImages,
          gallery: gallery,
          headerVideo: '',
          headerYoutube: '',
          menuGroups: [],
          menuImages: [],
          isSanityData: true
        };
      });
    } catch (error) {
      console.error("❌ Sanity에서 전체 상점 목록을 가져오던 중 오류 발생:", error);
      return [];
    }
  },

  // ─── 게시판 관련 함수 ────────────────────────────────────────────

  /**
   * 게시판 '가맹점 정보' 탭에 노출할 Sanity store (publishToBoard == true)
   */
  getBoardStorePosts: async () => {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/sanity/board/stores');
        if (res.ok) return await res.json();
        throw new Error(`API returned ${res.status}`);
      }
      const query = `*[_type == "store" && publishToBoard == true && defined(description) && description != ""] | order(_updatedAt desc) {
        _id,
        firestoreId,
        "slug": slug.current,
        name,
        category,
        slogan,
        description,
        "images": images[].asset->url,
        imageUrls,
        _updatedAt
      }`;

      const results = await client.fetch(query, {}, { cache: 'no-store', next: { revalidate: 0 } });
      if (!results?.length) return [];

      return results.map((result) => {
        const uploadedImages = result.images || [];
        const linkImages = result.imageUrls || [];
        const gallery = [...uploadedImages, ...linkImages].filter(Boolean);
        const thumbnailUrl = gallery[0] || null;
        const summary = (result.slogan || result.description || '').replace(/[#*_>`\[\]]/g, '').slice(0, 160);

        return {
          _id: result._id,
          slug: result.slug || '',
          title: result.name || '업체명 없음',
          summary,
          category: '가맹점 정보',
          storeCategory: result.category || '가맹점',
          thumbnailUrl,
          publishedAt: result._updatedAt,
          isBoardStorePost: true,
        };
      });
    } catch (error) {
      console.error('❌ 게시판 가맹점 글 조회 오류:', error);
      return [];
    }
  },

  /**
   * 게시판 글 목록 조회
   * @param {string|null} category - 카테고리 필터 ('공지사항'|'이벤트'|'뉴스'|'일반'|null)
   * @param {number} limit - 최대 개수 (기본값: 50)
   */
  getBoardPosts: async (category = null, limit = 50) => {
    try {
      if (typeof window !== 'undefined') {
        const url = `/api/sanity/board/posts?limit=${limit}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
        const res = await fetch(url);
        if (res.ok) return await res.json();
        throw new Error(`API returned ${res.status}`);
      }
      const categoryFilter = category ? `&& category == $category` : '';
      const query = `*[_type == "boardPost" && isPublished == true ${categoryFilter}] | order(isPinned desc, publishedAt desc) [0...$limit] {
        _id,
        title,
        "slug": slug.current,
        category,
        summary,
        isPinned,
        publishedAt,
        tags,
        "thumbnailUrl": thumbnail.asset->url
      }`;

      const params = { limit };
      if (category) params.category = category;

      const results = await client.fetch(query, params);
      return results || [];
    } catch (error) {
      console.error("❌ 게시판 목록 조회 오류:", error);
      return [];
    }
  },

  /**
   * 게시판 글 상세 조회 (slug 기반)
   * @param {string} slug - 게시글 슬러그
   */
  getBoardPostBySlug: async (slug) => {
    try {
      let decodedSlug = slug;
      try {
        decodedSlug = decodeURIComponent(slug);
      } catch (e) {}

      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/sanity/board/post/${encodeURIComponent(decodedSlug)}`);
        if (res.ok) return await res.json();
        throw new Error(`API returned ${res.status}`);
      }
      const query = `*[_type == "boardPost" && slug.current == $slug && isPublished == true][0] {
        _id,
        title,
        "slug": slug.current,
        category,
        summary,
        content,
        isPinned,
        publishedAt,
        tags,
        "thumbnailUrl": thumbnail.asset->url,
        "bannerImageUrl": bannerImage.asset->url,
        bannerLink
      }`;

      const result = await client.fetch(query, { slug: decodedSlug });
      return result || null;
    } catch (error) {
      console.error("❌ 게시글 상세 조회 오류:", error);
      return null;
    }
  },

  /**
   * 게시판 글 검색
   * @param {string} keyword - 검색어
   */
  searchBoardPosts: async (keyword) => {
    try {
      const query = `*[_type == "boardPost" && isPublished == true && (
        title match $keyword ||
        summary match $keyword
      )] | order(isPinned desc, publishedAt desc) [0...30] {
        _id,
        title,
        "slug": slug.current,
        category,
        summary,
        isPinned,
        publishedAt,
        tags,
        "thumbnailUrl": thumbnail.asset->url
      }`;

      const results = await client.fetch(query, { keyword: `*${keyword}*` });
      return results || [];
    } catch (error) {
      console.error("❌ 게시판 검색 오류:", error);
      return [];
    }
  },

  /**
   * Sanity에서 메인 상단 슬라이드 배너 목록을 정렬 순서대로 가져옵니다.
   */
  getMainBanners: async () => {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/sanity/banners');
        if (res.ok) {
          return await res.json();
        }
        throw new Error(`API returned ${res.status}`);
      }
      const query = `*[_type == "mainBanner"] | order(order asc) {
        _id,
        title,
        tag,
        caption,
        "image": image.asset->url,
        videoUrl,
        "videoFile": video.asset->url,
        buttonText,
        buttonLink,
        buttonIcon,
        buttonBgColor,
        buttonTextColor
      }`;
      let results = [];
      try {
        results = await client.fetch(query, {}, { cache: 'no-store', next: { revalidate: 0 } });
      } catch (sanityError) {
        console.warn("⚠️ Sanity API Request failed in getMainBanners:", sanityError.message);
      }
      return results || [];
    } catch (error) {
      console.error("❌ 메인 배너 조회 오류:", error);
      return [];
    }
  }
};

