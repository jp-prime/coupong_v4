/**
 * 웹 오디오 API를 사용하여 즉각적이고 리소스 과부하가 없는 효과음(클릭음)을 생성하는 유틸리티
 */

export const playTickSound = () => {
    if (typeof window === 'undefined') return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // 브라우저 자동재생(Autoplay) 정책 우회
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // 높은 피치의 경쾌하고 짧은 사인파 스윕 사운드 생성 (1300Hz -> 300Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
        
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        console.warn("Audio Context Play Sound Failed", e);
    }
};
