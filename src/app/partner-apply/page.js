'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, CheckCircle2, Building2,
    Phone, Mail, User, Briefcase, MessageSquare, Store, Gift, BarChart2
} from 'lucide-react';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const STEPS = ['소개', '절차', '정보입력', '완료'];

const businessTypes = [
    '음식점/카페', '뷰티/미용', '헬스/스포츠', '교육/학원',
    '쇼핑/리테일', '숙박/여행', '의료/병원', '기타'
];

export default function PartnerApplyPage() {
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        managerName: '',
        phoneNumber: '',
        email: '',
        businessType: '',
        message: '',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.companyName.trim()) newErrors.companyName = '상호명을 입력해주세요';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = '연락처를 입력해주세요';
        if (!formData.email.trim()) newErrors.email = '이메일을 입력해주세요';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = '올바른 이메일 형식이 아닙니다';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsLoading(true);
        try {
            // 1. Firestore에 저장
            await addDoc(collection(db, 'partner_applications_v4'), {
                ...formData,
                status: 'pending',
                version: 'v4',
                createdAt: serverTimestamp(),
            });

            // 2. 이메일 전송 API 호출
            const res = await fetch('/api/send-partner-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('이메일 전송 실패');

            setStep(3); // 완료 스텝
        } catch (error) {
            console.error('입점신청 오류:', error);
            alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #faf5ff 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '50px 16px 100px 16px', // 상단 여백을 늘려 안정적으로 내려앉게 하고, 하단은 BottomNav 공간 확보
            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>
            {/* 로고 헤더 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '24px', textAlign: 'center' }}
            >
                <a href="/" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        background: 'white', padding: '10px 20px', borderRadius: '50px',
                        boxShadow: '0 4px 15px rgba(168,85,247,0.15)',
                        border: '1px solid rgba(168,85,247,0.2)'
                    }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Store size={18} color="white" />
                        </div>
                        <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e293b' }}>
                            비나통
                        </span>
                    </div>
                </a>
            </motion.div>

            {/* 메인 카드 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    background: step === 3 ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'white',
                    borderRadius: '28px',
                    padding: '36px 28px',
                    boxShadow: '0 25px 60px rgba(139,92,246,0.15), 0 0 0 1px rgba(168,85,247,0.08)',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* 배경 장식 */}
                {step !== 3 && (
                    <div style={{
                        position: 'absolute', top: -60, right: -60,
                        width: 200, height: 200, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                )}

                <AnimatePresence mode="wait">
                    {/* STEP 0: 소개 */}
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{
                                        width: '88px', height: '88px',
                                        background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(126,34,206,0.08))',
                                        borderRadius: '28px', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 24px',
                                        border: '2px solid rgba(168,85,247,0.15)'
                                    }}
                                >
                                    <Store size={44} color="#a855f7" />
                                </motion.div>
                                <h1 style={{
                                    fontSize: '1.9rem', fontWeight: 900, color: '#0f172a',
                                    margin: '0 0 16px', lineHeight: 1.25, letterSpacing: '-0.03em'
                                }}>
                                    교민에겐 혜택을!<br />
                                    <span style={{ color: '#a855f7' }}>업소엔 활력을!</span>
                                </h1>
                                <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.95rem', margin: 0 }}>
                                    베트남 교민 대상 쿠폰 플랫폼<br />
                                    <strong style={{ color: '#1e293b' }}>비나통</strong>에 무료로 입점하세요.<br />
                                    할인쿠폰으로 신규고객을 유치하고<br />
                                    단골도 늘려보세요!
                                </p>
                            </div>

                            {/* 혜택 하이라이트 */}
                            <div style={{
                                background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)',
                                border: '1px solid #e9d5ff',
                                borderRadius: '16px', padding: '16px', marginBottom: '24px'
                            }}>
                                {[
                                    { icon: '🎁', text: '입점비 완전 무료' },
                                    { icon: '📱', text: 'SNS 홍보 지원' },
                                    { icon: '📊', text: '쿠폰 사용 통계 제공' },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 0',
                                        borderBottom: i < 2 ? '1px solid rgba(168,85,247,0.1)' : 'none'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4c1d95' }}>{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setStep(1)} style={primaryBtn}>
                                신청 시작하기 <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 1: 절차 안내 */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{
                                    width: '64px', height: '64px',
                                    background: 'rgba(168,85,247,0.1)',
                                    borderRadius: '20px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                                }}>
                                    <CheckCircle2 size={32} color="#a855f7" />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                                    쿠폰 운영 절차
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                                    간편한 3단계 시스템으로 운영됩니다
                                </p>
                            </div>

                            <div style={{ position: 'relative', paddingLeft: '12px', marginBottom: '28px' }}>
                                <div style={{
                                    position: 'absolute', left: '23px', top: '20px', bottom: '20px',
                                    width: '2px', background: 'linear-gradient(to bottom, #a855f7, #7e22ce)',
                                    opacity: 0.2
                                }} />
                                {[
                                    { title: '고객 방문', desc: '쿠폰을 소지한 고객이 업소 방문', icon: <Store size={14} color="#a855f7" /> },
                                    { title: 'QR 스캔', desc: '관리자 화면에서 QR 코드 스캔으로 간편 처리', icon: <Gift size={14} color="#a855f7" /> },
                                    { title: '통계 확인', desc: '쿠폰 사용 현황 및 방문 데이터 자동 집계', icon: <BarChart2 size={14} color="#a855f7" /> },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 1 }}
                                    >
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: 'white', border: '2px solid #a855f7',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, boxShadow: '0 2px 8px rgba(168,85,247,0.2)'
                                        }}>
                                            {item.icon}
                                        </div>
                                        <div style={{
                                            background: '#f8fafc', border: '1px solid #f1f5f9',
                                            borderRadius: '16px', padding: '14px 18px', flex: 1
                                        }}>
                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem', marginBottom: '3px' }}>{item.title}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>{item.desc}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{
                                    textAlign: 'center', color: '#a855f7',
                                    fontWeight: 900, fontSize: '1rem', marginBottom: '24px'
                                }}
                            >
                                지금 바로 무료로 시작해보세요! ✨
                            </motion.div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setStep(0)} style={secondaryBtn}>
                                    <ArrowLeft size={18} /> 이전
                                </button>
                                <button onClick={() => setStep(2)} style={{ ...primaryBtn, flex: 2 }}>
                                    신청서 작성 <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: 폼 입력 */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                                    기본 정보 입력
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                                    담당자가 연락드릴 수 있도록 정확히 입력해주세요.
                                </p>
                            </div>

                            {/* 상호명 */}
                            <FormField
                                icon={<Building2 size={16} />}
                                label="상호명 *"
                                error={errors.companyName}
                            >
                                <input
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    placeholder="업소 이름을 입력해주세요"
                                    style={inputStyle(!!errors.companyName)}
                                />
                            </FormField>

                            {/* 담당자명 */}
                            <FormField icon={<User size={16} />} label="담당자명">
                                <input
                                    name="managerName"
                                    value={formData.managerName}
                                    onChange={handleChange}
                                    placeholder="사장님 또는 담당자 이름"
                                    style={inputStyle(false)}
                                />
                            </FormField>

                            {/* 연락처 */}
                            <FormField
                                icon={<Phone size={16} />}
                                label="연락처 *"
                                error={errors.phoneNumber}
                            >
                                <input
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="예: 010-1234-5678 또는 090-xxx-xxxx"
                                    style={inputStyle(!!errors.phoneNumber)}
                                />
                            </FormField>

                            {/* 이메일 */}
                            <FormField
                                icon={<Mail size={16} />}
                                label="이메일 *"
                                error={errors.email}
                            >
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="답변 받으실 이메일 주소"
                                    style={inputStyle(!!errors.email)}
                                />
                            </FormField>

                            {/* 업종 */}
                            <FormField icon={<Briefcase size={16} />} label="업종">
                                <select
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    style={{ ...inputStyle(false), cursor: 'pointer' }}
                                >
                                    <option value="">업종을 선택해주세요</option>
                                    {businessTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </FormField>

                            {/* 메시지 */}
                            <FormField icon={<MessageSquare size={16} />} label="추가 메시지">
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="궁금한 점이나 요청사항을 적어주세요"
                                    rows={3}
                                    style={{ ...inputStyle(false), resize: 'none', lineHeight: 1.6 }}
                                />
                            </FormField>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button onClick={() => setStep(1)} style={secondaryBtn}>
                                    <ArrowLeft size={18} /> 이전
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    style={{
                                        ...primaryBtn, flex: 2,
                                        opacity: isLoading ? 0.8 : 1,
                                        cursor: isLoading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isLoading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }}
                                            />
                                            전송 중...
                                        </>
                                    ) : (
                                        <>신청 완료하기 <CheckCircle2 size={20} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: 완료 */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, type: 'spring' }}
                            style={{ textAlign: 'center', color: 'white' }}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                style={{
                                    width: '96px', height: '96px',
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    borderRadius: '50%', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 28px', color: '#4ade80',
                                    border: '2px solid rgba(74, 222, 128, 0.3)'
                                }}
                            >
                                <CheckCircle2 size={48} />
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{ fontSize: '1.9rem', fontWeight: 900, margin: '0 0 16px' }}
                            >
                                신청 완료! 🎉
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '32px' }}
                            >
                                <strong style={{ color: '#c4b5fd' }}>{formData.companyName}</strong> 사장님,<br />
                               입점 신청서가 접수되었습니다.<br /><br />
                                확인 이메일을 발송했으며,<br />
                                <strong style={{ color: 'white' }}>2~3 영업일 내</strong>에 담당자가<br />
                                연락드릴 예정입니다.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <a
                                    href="https://open.kakao.com/o/sbCoGQyi"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px', padding: '16px', marginBottom: '28px',
                                        color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 700,
                                        textDecoration: 'none', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    💬 카카오톡 1:1 문의하기
                                </a>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                onClick={() => window.location.href = '/'}
                                style={primaryBtn}
                            >
                                홈으로 돌아가기
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* 진행 인디케이터 */}
            {step < 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        display: 'flex', gap: '8px', marginTop: '24px',
                        padding: '8px 16px', background: 'rgba(255,255,255,0.6)',
                        borderRadius: '20px', backdropFilter: 'blur(10px)'
                    }}
                >
                    {[0, 1, 2].map(idx => (
                        <div
                            key={idx}
                            style={{
                                width: idx === step ? '32px' : '8px',
                                height: '8px', borderRadius: '4px',
                                background: idx <= step ? '#a855f7' : 'rgba(168,85,247,0.2)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}

// 폼 필드 컴포넌트
function FormField({ icon, label, error, children }) {
    return (
        <div style={{ marginBottom: '18px' }}>
            <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.82rem', fontWeight: 800, color: '#475569',
                marginBottom: '7px', paddingLeft: '2px'
            }}>
                <span style={{ color: '#a855f7' }}>{icon}</span>
                {label}
            </label>
            {children}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, marginTop: '5px', paddingLeft: '2px' }}
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}

// 공통 스타일
const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `2px solid ${hasError ? '#fca5a5' : '#f1f5f9'}`,
    fontSize: '0.93rem',
    fontWeight: 500,
    outline: 'none',
    background: hasError ? '#fff5f5' : '#f8fafc',
    color: '#1e293b',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
});

const primaryBtn = {
    width: '100%',
    padding: '15px 24px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
    color: 'white',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 8px 20px rgba(168,85,247,0.3)',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
};

const secondaryBtn = {
    padding: '15px 20px',
    borderRadius: '14px',
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
};
