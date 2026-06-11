import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react'; 
import { StoreService } from '../../services/StoreService';

const VisitorCounter = ({ pageId, offset = 0, style = {} }) => {
  const [visitorCount, setVisitorCount] = useState(0);
  const [liveCount, setLiveCount] = useState(3); // Default live count

  useEffect(() => {
    if (!pageId) return;
    
    // 1. Increment visit count (once per session)
    const sessionKey = `visited_${pageId}`;
    if (typeof window !== "undefined" && !sessionStorage.getItem(sessionKey)) {
      StoreService.incrementPageVisit(pageId);
      sessionStorage.setItem(sessionKey, 'true');
    }

    // 2. Subscribe to real-time updates for Total Count
    const unsubscribe = StoreService.subscribePageStats(pageId, (data) => {
      // ✅ 자동 증가 보정 로직 추가 (하루 평균 약 110명)
      const startDate = new Date('2024-04-01'); // 기준일
      const today = new Date();
      const diffInDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const autoIncrement = Math.max(0, diffInDays * 110); 

      // 실제 데이터 + 자동 보정치 + 수동 offset 합산
      setVisitorCount((data.totalVisits || 0) + autoIncrement + offset);
    });

    // 3. Simulated Live Count (between 10 and 30)
    // Initial random value
    const baseLive = Math.floor(Math.random() * 15) + 12; // 12 ~ 27
    setLiveCount(baseLive);
    
    const interval = setInterval(() => {
      setLiveCount(prev => {
        // 70% chance to change, 30% stay same for realism
        if (Math.random() < 0.3) return prev; 
        
        const change = Math.random() > 0.5 ? 1 : -1;
        let next = prev + change;
        
        // Boundaries
        if (next < 10) next = 11;
        if (next > 30) next = 29;
        
        return next;
      });
    }, 3000); // 3 seconds for active feel

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      clearInterval(interval);
    };
  }, [pageId, offset]);

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      ...style
    }}>
      {/* Live Count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '50px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
        fontSize: '0.65rem',
        fontWeight: '900',
        fontFamily: "'Pretendard', sans-serif",
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#ef4444',
          boxShadow: '0 0 8px #ef4444',
          animation: 'pulse 2s infinite'
        }} />
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
        <span>LIVE {liveCount}명 접속중</span>
      </div>

      {/* Cumulative Count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '50px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
        fontSize: '0.7rem',
        fontWeight: '700',
        fontFamily: "'Pretendard', sans-serif",
      }}>
        <Users size={12} style={{ opacity: 0.6 }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem' }}>TOTAL</span>
        <span style={{ letterSpacing: '0.05em' }}>{visitorCount.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default VisitorCounter;
