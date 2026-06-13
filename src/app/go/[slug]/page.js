'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StoreService } from '../../../services/StoreService';
import { Loader2 } from 'lucide-react';

export default function GoRedirectPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug;
    const [error, setError] = useState(false);

    useEffect(() => {
        const redirect = async () => {
            try {
                if (!slug) return;
                
                const store = await StoreService.getStoreBySlug(slug);
                if (store && (store.id || store._id)) {
                    // Redirect to the premium mini-home page
                    router.replace(`/mini-home/${store.id || store._id}`);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Redirect error:", err);
                setError(true);
            }
        };
        redirect();
    }, [slug, router]);

    if (error) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07090d', color: '#fff', textAlign: 'center', padding: '20px', fontFamily: "sans-serif" }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px' }}>페이지를 찾을 수 없습니다.</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>존재하지 않거나 삭제된 단축 주소입니다.</p>
                    <button onClick={() => router.replace('/')} style={{ background: '#d4af37', border: 'none', padding: '14px 28px', borderRadius: '16px', fontWeight: 800, color: '#000', cursor: 'pointer' }}>홈으로 이동</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07090d', color: '#fff', fontFamily: "sans-serif" }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite', marginBottom: '24px' }}>
                    <Loader2 size={44} color="#d4af37" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em', margin: 0 }}>PREMIUM EXPERIENCE</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>단축 주소로 연결 중입니다...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
