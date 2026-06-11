'use client';

import React from 'react';
import HeaderV2 from '@/components/style2/HeaderV2';
import Footer from '@/components/layout/Footer';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { playTickSound } from '@/utils/sound';

export default function PrivacyPage() {
    const router = useRouter();

    const handleBack = () => {
        playTickSound();
        router.back();
    };

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <HeaderV2 />
            <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '40px 20px', color: '#1e293b', lineHeight: 1.8 }}>
                {/* Back Button & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <button
                        onClick={handleBack}
                        style={{
                            background: '#f8fafc',
                            border: '1px solid #f1f5f9',
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#1e293b',
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                        개인정보처리방침
                    </h1>
                </div>

                <div style={{
                    background: '#ffffff',
                    borderRadius: '32px',
                    padding: '40px 24px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
                    lineHeight: '1.8'
                }}>
                    <h2 style={{
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        marginBottom: '28px',
                        color: '#6366f1',
                        borderBottom: '2px solid #f1f5f9',
                        paddingBottom: '16px'
                    }}>
                        개인정보처리방침
                    </h2>

                    <p style={{ marginBottom: '32px', color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                        STAR.KV CONSTRUCTION CONSULTING COMPANY LIMITED(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 베트남 개인정보 보호 시행령(Decree 13)을 준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
                    </p>

                    <section style={{ marginBottom: '40px' }}>
                        <h3 style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            marginBottom: '18px',
                            color: '#0f172a',
                            paddingLeft: '10px',
                            borderLeft: '4px solid #6366f1'
                        }}>
                            1. 수집하는 개인정보의 항목
                        </h3>
                        <p style={{ color: '#64748b', marginBottom: '12px' }}>
                            회사는 구글(Google) 간편 로그인을 통해 회원가입 및 서비스를 제공하며, 최소한의 정보만을 수집합니다.
                        </p>
                        <ul style={{ paddingLeft: '20px', color: '#64748b' }}>
                            <li style={{ marginBottom: '6px' }}><strong>필수 수집 항목:</strong> 이메일 주소, 이름(또는 닉네임), 프로필 사진</li>
                            <li style={{ marginBottom: '6px' }}><strong>수집 방법:</strong> 구글 OAuth 2.0 연동을 통한 자동 수집</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h3 style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            marginBottom: '18px',
                            color: '#0f172a',
                            paddingLeft: '10px',
                            borderLeft: '4px solid #6366f1'
                        }}>
                            2. 개인정보의 수집 및 이용 목적
                        </h3>
                        <p style={{ color: '#64748b', marginBottom: '12px' }}>
                            수집된 정보는 다음의 목적을 위해서만 이용됩니다.
                        </p>
                        <ul style={{ paddingLeft: '20px', color: '#64748b' }}>
                            <li style={{ marginBottom: '6px' }}><strong>회원 관리:</strong> 본인 식별, 부정이용 방지</li>
                            <li style={{ marginBottom: '6px' }}><strong>서비스 제공:</strong> 할인 쿠폰 발급 및 내역 관리</li>
                            <li style={{ marginBottom: '6px' }}><strong>고객 지원:</strong> 민원 처리 및 공지사항 전달</li>
                        </ul>
                    </section>

                    <div style={{
                        marginTop: '48px',
                        padding: '24px',
                        background: '#f8fafc',
                        borderRadius: '24px',
                        border: '1px solid #f1f5f9',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', fontWeight: 800 }}>
                            시행일자: 2026년 2월 14일
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
