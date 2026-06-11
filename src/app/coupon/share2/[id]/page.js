import SharedCouponClient from './SharedCouponClient';

async function getSharedCoupon(id) {
    try {
        const url = `https://firestore.googleapis.com/v1/projects/coupong-98b03/databases/(default)/documents/shared_coupons/${id}`;
        const res = await fetch(url, { next: { revalidate: 0 } });
        if (!res.ok) return null;
        const data = await res.json();
        
        if (!data || !data.fields) return null;
        
        // Firestore fields helper
        const getVal = (fields, key) => fields[key]?.stringValue || '';
        
        return {
            senderUid: getVal(data.fields, 'senderUid'),
            storeId: getVal(data.fields, 'storeId'),
            storeName: getVal(data.fields, 'storeName'),
            storeSlogan: getVal(data.fields, 'storeSlogan'),
            storeThumbnail: getVal(data.fields, 'storeThumbnail'),
            shareMemo: getVal(data.fields, 'shareMemo'),
        };
    } catch (e) {
        console.error("Failed to fetch shared coupon in server component:", e);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    const data = await getSharedCoupon(id);
    
    let ogTitle = "🎁 특별한 쿠폰 선물이 도착했습니다! 🎁";
    let ogDesc = "쿠퐁온라인에서 전하는 특별한 혜택을 지금 확인해보세요.";
    let ogImage = "https://coupong.online/share512.png";

    if (data) {
        if (data.storeName) {
            ogTitle = `할인쿠폰도착 [${data.storeName}]`;
            const descParts = [];
            if (data.storeSlogan) descParts.push(data.storeSlogan);
            if (data.shareMemo) descParts.push(data.shareMemo);
            ogDesc = descParts.length > 0 ? descParts.join(" | ") + " - 쿠퐁온라인에서 확인하세요!" : ogDesc;
        }
        if (data.storeThumbnail) {
            ogImage = data.storeThumbnail;
        }
    }

    return {
        title: ogTitle,
        description: ogDesc,
        openGraph: {
            title: ogTitle,
            description: ogDesc,
            images: [ogImage],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: ogTitle,
            description: ogDesc,
            images: [ogImage],
        }
    };
}

export default async function SharedCouponPage({ params }) {
    const { id } = await params;
    const data = await getSharedCoupon(id);
    
    return (
        <SharedCouponClient 
            sharedId={id} 
            senderUid={data?.senderUid || ''} 
            storeId={data?.storeId || ''} 
        />
    );
}
