'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, Gift } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { playTickSound } from '@/utils/sound';

export default function LoginPage() {
    const router = useRouter();
    const { signInWithEmail, signInWithGoogle } = useAuth();

    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
    });

    // 화면 드래그 방지 및 강제 줌 제한 효과 설정
    useEffect(() => {
        const preventTouch = (e) => {
            if (e.touches.length > 1 || e.scale !== undefined) {
                e.preventDefault();
            }
        };
        const preventGesture = (e) => {
            e.preventDefault();
        };
        
        document.body.style.overscrollBehavior = 'none';
        document.body.style.touchAction = 'pan-x pan-y';
        
        window.addEventListener('touchmove', preventTouch, { passive: false });
        window.addEventListener('gesturestart', preventGesture, { passive: false });
        window.addEventListener('gesturechange', preventGesture, { passive: false });
        
        return () => {
            document.body.style.overscrollBehavior = 'auto';
            document.body.style.touchAction = 'auto';
            window.removeEventListener('touchmove', preventTouch);
            window.removeEventListener('gesturestart', preventGesture);
            window.removeEventListener('gesturechange', preventGesture);
        };
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            if (mode === 'signup') {
                if (!form.name.trim()) { setError('이름을 입력해주세요.'); setIsLoading(false); return; }
                if (form.password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); setIsLoading(false); return; }
                await signInWithEmail({ name: form.name, email: form.email, password: form.password, phone: form.phone }, 'signup');
            } else {
                await signInWithEmail({ email: form.email, password: form.password }, 'login');
            }
            router.push('/mypage');
        } catch (err) {
            setError(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            router.push('/mypage');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('구글 로그인에 실패했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '24px 16px',
            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            {/* 뒤로가기 */}
            <button
                onClick={() => {
                    playTickSound();
                    router.back();
                }}
                style={{
                    position: 'fixed', top: '20px', left: '20px',
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                }}
            >
                <ArrowLeft size={20} />
            </button>

            {/* 로고 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '32px', textAlign: 'center' }}
            >
                <img 
                    src="/비나통_로고.png" 
                    alt="비나통 로고" 
                    style={{ height: '42px', width: 'auto', display: 'block', margin: '0 auto 12px', objectFit: 'contain' }} 
                />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                    베트남 교민 할인 쿠폰 플랫폼
                </p>
            </motion.div>

            {/* 카드 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    width: '100%', maxWidth: '420px',
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '28px', padding: '32px 28px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
                }}
            >
                {/* 탭 전환 */}
                <div style={{
                    display: 'flex', background: 'rgba(255,255,255,0.05)',
                    borderRadius: '14px', padding: '4px', marginBottom: '28px'
                }}>
                    {[
                        { key: 'login', label: '로그인' },
                        { key: 'signup', label: '회원가입' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setMode(tab.key); setError(''); }}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '11px',
                                border: 'none', cursor: 'pointer', fontWeight: 800,
                                fontSize: '0.95rem', transition: 'all 0.25s',
                                background: mode === tab.key ? 'white' : 'transparent',
                                color: mode === tab.key ? '#0f172a' : 'rgba(255,255,255,0.5)',
                                boxShadow: mode === tab.key ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 회원가입 포인트 배너 */}
                <AnimatePresence>
                    {mode === 'signup' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: '20px' }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(168,85,247,0.15))',
                                border: '1px solid rgba(129,140,248,0.3)',
                                borderRadius: '14px', padding: '14px 16px',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #818cf8, #a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <Gift size={18} color="white" />
                            </div>
                            <div>
                                <div style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>
                                    🎉 가입 축하 <span style={{ color: '#a5b4fc' }}>20,000 포인트</span> 지급!
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
                                    가입 즉시 포인트 적립됩니다
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, x: mode === 'signup' ? 10 : -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* 이름 (회원가입만) */}
                            {mode === 'signup' && (
                                <InputField
                                    icon={<User size={16} />}
                                    name="name"
                                    placeholder="이름"
                                    value={form.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                />
                            )}

                            {/* 이메일 */}
                            <InputField
                                icon={<Mail size={16} />}
                                name="email"
                                type="email"
                                placeholder="이메일 주소"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />

                            {/* 전화번호 (회원가입만) */}
                            {mode === 'signup' && (
                                <InputField
                                    icon={<Phone size={16} />}
                                    name="phone"
                                    placeholder="전화번호 (선택)"
                                    value={form.phone}
                                    onChange={handleChange}
                                    autoComplete="tel"
                                />
                            )}

                            {/* 비밀번호 */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', padding: '13px 16px',
                                }}>
                                    <Lock size={16} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                                    <input
                                        name="password"
                                        type={showPw ? 'text' : 'password'}
                                        placeholder={mode === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호'}
                                        value={form.password}
                                        onChange={handleChange}
                                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                        required
                                        style={inputInnerStyle}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(p => !p)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, flexShrink: 0 }}
                                    >
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* 에러 메시지 */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                                    color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600
                                }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%', padding: '15px',
                            borderRadius: '14px', border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                            color: 'white', fontWeight: 800, fontSize: '1rem',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.8 : 1,
                            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                            transition: 'all 0.2s', marginBottom: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            fontFamily: 'inherit'
                        }}
                    >
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                            />
                        ) : (
                            mode === 'login' ? '로그인' : '회원가입 하기'
                        )}
                    </button>
                </form>

                {/* 구분선 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>또는</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* 구글 로그인 */}
                <button
                    onClick={handleGoogle}
                    disabled={isLoading}
                    style={{
                        width: '100%', padding: '13px',
                        borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.06)', color: 'white',
                        fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        transition: 'all 0.2s', fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google로 계속하기
                </button>
            </motion.div>

            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', marginTop: '24px', textAlign: 'center' }}>
                로그인 시 비나통 이용약관에 동의합니다.
            </p>
        </div>
    );
}

function InputField({ icon, name, type = 'text', placeholder, value, onChange, autoComplete }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '13px 16px', marginBottom: '12px',
        }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{icon}</span>
            <input
                name={name} type={type} placeholder={placeholder}
                value={value} onChange={onChange} autoComplete={autoComplete}
                required={name !== 'phone'}
                style={inputInnerStyle}
            />
        </div>
    );
}

const inputInnerStyle = {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: 'white', fontSize: '0.95rem', fontWeight: 500,
    fontFamily: 'inherit',
    '::placeholder': { color: 'rgba(255,255,255,0.3)' }
};
