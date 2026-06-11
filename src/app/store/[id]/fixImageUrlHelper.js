export function fixImageUrl(url) {
    if (!url) return 'https://coupong.online/index512.png';
    if (typeof url !== 'string') return 'https://coupong.online/index512.png';

    // ✅ 구글 콘텐츠 서버 이미지 처리 보완
    if (url.includes('googleusercontent.com')) {
        const baseUrl = url.split('=')[0]; 
        return `${baseUrl}=s1000-w1000-h1000-rw`;
    }

    if (url.startsWith('http')) return url;

    if (url.startsWith('stores/') || url.startsWith('coupons/') || url.startsWith('admin_gallery/') || url.startsWith('/storage')) {
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        return `https://firebasestorage.googleapis.com/v0/b/coupong-98b03.firebasestorage.app/o/${encodeURIComponent(cleanPath)}?alt=media`;
    }
    return url;
}
