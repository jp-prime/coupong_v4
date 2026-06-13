'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import VisitorCounter from '../common/VisitorCounter';

const Footer = () => {
    const { t } = useTranslation();
    const pathname = usePathname();
    // 스타일2 통합을 위해 푸터도 항상 라이트 모드 적용
    const isLightMode = true; 
    const isMainPage = pathname === '/' || ['/ko', '/en', '/vi', '/zh-CN'].includes(pathname || '');
    
    const bgColor = '#ffffff';
    const borderColor = '#e2e8f0';
    const textColorMain = '#0f172a';
    const textColorMuted = '#64748b';

    return (
        <div style={{
            marginTop: '0',
            paddingTop: '30px',
            borderTop: `1px solid ${borderColor}`,
            color: textColorMuted,
            fontSize: '0.8rem',
            lineHeight: '1.5',
            textAlign: 'center',
            paddingBottom: '85px',
            background: bgColor,
            position: 'relative'
        }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <Link href="/terms" style={{ color: textColorMuted, textDecoration: 'none', fontWeight: 500 }}>
                    {t('footer.terms')}
                </Link>
                <span style={{ color: borderColor }}>|</span>
                <Link href="/privacy" style={{ color: textColorMuted, textDecoration: 'none', fontWeight: 500 }}>
                    {t('footer.privacy')}
                </Link>
                <span style={{ color: borderColor }}>|</span>
                <a
                    href="https://open.kakao.com/o/sBuie8fi"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#f97316', textDecoration: 'none', fontWeight: 800 }}
                >
                    {t('footer.contact')}
                </a>
            </div>

            <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: textColorMain, fontFamily: 'var(--font-base)' }}>
                {t('footer.companyName')}
            </p>
            <p style={{ margin: '0 0 2px 0', fontFamily: 'var(--font-base)', fontSize: '0.75rem' }}>
                {t('footer.taxIdLabel')}: {t('footer.taxId')} | {t('footer.telLabel')}: {t('footer.tel')}
            </p>
            <p style={{ margin: 0, fontFamily: 'var(--font-base)', fontSize: '0.75rem' }}>
                <a href="mailto:btmt2019@gmail.com" style={{ color: textColorMuted, textDecoration: 'none' }}>
                    {t('footer.email')}
                </a>
            </p>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '16px', 
                marginTop: '16px', 
                marginBottom: '12px' 
            }}>
                <a
                    href="https://open.kakao.com/o/sBuie8fi"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
                        background: '#FEE500', color: '#371C1D', borderRadius: '12px', 
                        textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem',
                        boxShadow: '0 4px 12px rgba(254, 229, 0, 0.2)'
                    }}
                >
                    <img src="/kakao-icon.png" alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    카카오톡
                </a>
                <a
                    href="https://zalo.me/0787738261"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
                        background: '#0068FF', color: 'white', borderRadius: '12px', 
                        textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem',
                        boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)'
                    }}
                >
                    <img src="/zalo-icon.png" alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    Zalo
                </a>
            </div>



            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#cbd5e1', fontFamily: 'var(--font-base)' }}>
                {t('footer.copyright')}
            </p>
        </div>
    );
};

export default Footer;
