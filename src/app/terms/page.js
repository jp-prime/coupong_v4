'use client';

import React from 'react';
import HeaderV2 from '@/components/style2/HeaderV2';
import Footer from '@/components/layout/Footer';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { playTickSound } from '@/utils/sound';

export default function TermsPage() {
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
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                        이용약관
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
                        비나통 서비스 이용약관
                    </h2>

                    {/* 제1장 총칙 */}
                    <section style={{ marginBottom: '40px' }}>
                        <h3 style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            marginBottom: '18px',
                            color: '#0f172a',
                            paddingLeft: '10px',
                            borderLeft: '4px solid #6366f1'
                        }}>
                            제1장 총칙
                        </h3>

                        <h4 style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            marginBottom: '8px',
                            color: '#1e293b'
                        }}>
                            제1조 (목적)
                        </h4>
                        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
                            본 약관은 STAR.KV CONSTRUCTION CONSULTING COMPANY LIMITED(이하 "회사")가 운영하는 "비나통(vinatong.store)"(이하 "서비스")을 이용함에 있어 회사와 회원(이용자 및 가맹점) 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                        </p>

                        <h4 style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            marginBottom: '8px',
                            color: '#1e293b'
                        }}>
                            제2조 (용어의 정의)
                        </h4>
                        <ul style={{ paddingLeft: '20px', color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
                            <li style={{ marginBottom: '6px' }}><strong>이용자(회원):</strong> 구글 로그인을 통해 가입하여 서비스를 이용하고, 제휴 업소의 할인 혜택을 받는 자를 말합니다.</li>
                            <li style={{ marginBottom: '6px' }}><strong>가맹점(업소):</strong> 회사와 제휴를 맺고 서비스를 통해 이용자에게 할인 혜택을 제공하며, 이에 대한 수수료를 회사에 지불하는 사업자를 말합니다.</li>
                            <li style={{ marginBottom: '6px' }}><strong>쿠폰:</strong> 이용자가 가맹점 이용 후 제시하여 할인을 받을 수 있는 모바일 확인증(QR 코드 스캔 방식 등)을 말합니다.</li>
                            <li style={{ marginBottom: '6px' }}><strong>포인트(충전금):</strong> 가맹점이 회사에 수수료를 지불하기 위해 미리 예치하는 금액을 말합니다.</li>
                        </ul>
                    </section>

                    {/* 제2장 서비스 이용 및 회원관리 */}
                    <section style={{ marginBottom: '40px' }}>
                        <h3 style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            marginBottom: '18px',
                            color: '#0f172a',
                            paddingLeft: '10px',
                            borderLeft: '4px solid #6366f1'
                        }}>
                            제2장 서비스 이용 및 회원관리
                        </h3>

                        <h4 style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            marginBottom: '8px',
                            color: '#1e293b'
                        }}>
                            제3조 (회원가입 및 정보수집)
                        </h4>
                        <ul style={{ paddingLeft: '20px', color: '#64748b', fontSize: '0.95rem' }}>
                            <li style={{ marginBottom: '6px' }}>서비스는 별도의 복잡한 가입 절차 없이 구글(Google) 로그인 연동을 통해 이용 가능합니다.</li>
                            <li style={{ marginBottom: '6px' }}>회사는 원활한 서비스 제공, 이용자 식별, 고객 상담을 위해 구글 로그인 시 제공되는 <strong>'닉네임'</strong>과 '이메일' 정보를 수집 및 이용합니다.</li>
                            <li style={{ marginBottom: '6px' }}>회원은 언제든지 정보 수정을 요청하거나 회원 탈퇴를 할 수 있으며, 탈퇴 시 수집된 정보는 관련 법령 및 개인정보처리방침에 따라 파기됩니다.</li>
                        </ul>
                    </section>

                    {/* 제3장 책임의 한계 및 면책 */}
                    <section style={{ marginBottom: '40px' }}>
                        <h3 style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            marginBottom: '18px',
                            color: '#0f172a',
                            paddingLeft: '10px',
                            borderLeft: '4px solid #6366f1'
                        }}>
                            제3장 책임의 한계 및 면책 (중요)
                        </h3>

                        <h4 style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            marginBottom: '8px',
                            color: '#1e293b'
                        }}>
                            제4조 (정보 제공 및 중개자 지위)
                        </h4>
                        <ul style={{ paddingLeft: '20px', color: '#64748b', fontSize: '0.95rem' }}>
                            <li style={{ marginBottom: '6px' }}><strong>단순 정보 제공:</strong> 회사는 이용자와 가맹점을 연결하는 통신판매중개자로서 시스템을 운영할 뿐이며, 가맹점이 제공하는 재화나 용역(서비스)의 당사자가 아닙니다.</li>
                            <li style={{ marginBottom: '6px' }}><strong>거래 책임의 주체:</strong> 가맹점이 제공하는 서비스의 품질, 가격, 할인율 적용, 위생, 안전 등 실제 거래와 관련된 모든 책임은 전적으로 가맹점에게 있습니다.</li>
                            <li style={{ marginBottom: '6px' }}><strong>분쟁의 해결:</strong> 이용자가 가맹점을 이용하는 과정에서 발생하는 모든 분쟁(서비스 불만족, 결제 오류, 사고 등)은 이용자의 판단하에 가맹점과 직접 해결해야 하며, 회사는 이에 대해 어떠한 법적 책임도 지지 않습니다.</li>
                        </ul>
                    </section>

                    {/* 회사 정보 */}
                    <div style={{
                        marginTop: '48px',
                        padding: '32px',
                        background: '#f8fafc',
                        borderRadius: '24px',
                        border: '1px solid #f1f5f9'
                    }}>
                        <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 8px 0' }}><strong>회사명:</strong> STAR.KV CONSTRUCTION CONSULTING COMPANY LIMITED</p>
                        <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 8px 0' }}><strong>문의 이메일:</strong> btmt2019@gmail.com</p>
                        <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0' }}>본 약관은 2024년 5월 20일부터 적용됩니다.</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
