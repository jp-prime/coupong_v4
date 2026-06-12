import React, { memo } from 'react';

function convertTableToHtml(tableLines) {
    if (tableLines.length < 2) return tableLines.join('\n');
    const secondLine = tableLines[1].trim();
    const isDelimiter = /^\|(\s*:?-+:?\s*\|)+$/.test(secondLine);
    if (!isDelimiter) return tableLines.join('\n');

    const headers = tableLines[0]
        .split('|')
        .slice(1, -1)
        .map(h => h.trim());

    const alignments = secondLine
        .split('|')
        .slice(1, -1)
        .map(col => {
            const trimmed = col.trim();
            const left = trimmed.startsWith(':');
            const right = trimmed.endsWith(':');
            if (left && right) return 'center';
            if (right) return 'right';
            return 'left';
        });

    let html = '<div class="table-responsive"><table class="promo-table"><thead><tr>';
    headers.forEach((h, idx) => {
        const align = alignments[idx] || 'left';
        html += `<th style="text-align: ${align}">${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    for (let r = 2; r < tableLines.length; r++) {
        const cols = tableLines[r]
            .split('|')
            .slice(1, -1)
            .map(c => c.trim());
        html += '<tr>';
        headers.forEach((_, idx) => {
            const colVal = cols[idx] || '';
            const align = alignments[idx] || 'left';
            html += `<td style="text-align: ${align}">${colVal}</td>`;
        });
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
}

function parseMarkdownTables(text) {
    if (!text) return '';
    const lines = text.split('\n');
    let inTable = false;
    let tableLines = [];
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableLines = [line];
            } else {
                tableLines.push(line);
            }
        } else {
            if (inTable) {
                processedLines.push(convertTableToHtml(tableLines));
                inTable = false;
                tableLines = [];
            }
            processedLines.push(lines[i]);
        }
    }
    if (inTable) {
        processedLines.push(convertTableToHtml(tableLines));
    }
    return processedLines.join('\n');
}

const RenderWithShortcodes = memo(({ text, navigate, postImgs, linkedStore }) => {
    if (!text) return null;

    const parsedText = parseMarkdownTables(text);
    // 숏코드 분리 로직 (기존 PromoDetail에서 가져옴)
    const parts = parsedText.split(/(\[img\d+\]|cp\[[^\]]+\]|\[cp\]|bt\[[^\]]+\]|\[map\]|map\[[^\]]+\])/gi);
    const rendered = [];

    parts.forEach((part, idx) => {
        if (!part) return;

        // 이미지 숏코드: [img1] ~ [img5]
        const imgMatch = part.match(/\[img(\d+)\]/i);
        if (imgMatch) {
            const imgIdx = parseInt(imgMatch[1]) - 1;
            const imgUrl = postImgs && postImgs[imgIdx];
            if (imgUrl) {
                rendered.push(
                    <div key={idx} style={{ width: '100%', margin: '20px 0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <img src={imgUrl} alt={`content-${imgIdx}`} style={{ width: '100%', display: 'block' }} />
                    </div>
                );
            }
            return;
        }

        // 업체 정보 숏코드: [cp] 또는 cp[ID]
        if (part.toLowerCase() === '[cp]' || part.toLowerCase().startsWith('cp[')) {
            let shopId = linkedStore?.id;
            if (part.toLowerCase() !== '[cp]') {
                const cpMatch = part.match(/cp\[([^\]]+)\]/i);
                if (cpMatch) shopId = cpMatch[1];
            }
            if (shopId) {
                rendered.push(
                    <div key={idx} onClick={() => navigate(`/store/${shopId}`)} style={{ cursor: 'pointer', margin: '25px 0', padding: '20px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundImage: linkedStore?.thumbnail ? `url(${linkedStore.thumbnail})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a855f7', marginBottom: '2px' }}>추천 파트너</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>{linkedStore?.name || "상세 보기"}</div>
                        </div>
                        <div style={{ padding: '8px 16px', background: 'white', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, color: '#6366f1', border: '1px solid #e0e7ff' }}>상세보기</div>
                    </div>
                );
            }
            return;
        }

        // 버튼 숏코드: bt[라벨-URL]
        if (part.toLowerCase().startsWith('bt[')) {
            const btMatch = part.match(/bt\[([^\]]+)\]/i);
            const content = btMatch ? btMatch[1] : "";
            if (content) {
                const [label, ...urlParts] = content.split('-');
                const url = urlParts.join('-');
                rendered.push(
                    <div key={idx} style={{ display: 'flex', justifyContent: 'center', margin: '25px 0' }}>
                        <button onClick={() => window.open(url, '_blank')}
                            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '100px', fontSize: '1.1rem', fontWeight: 950, cursor: 'pointer', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }}
                        >
                            {label}
                        </button>
                    </div>
                );
            }
            return;
        }

        // 구글맵 숏코드: [map] 또는 map[URL]
        if (part.toLowerCase() === '[map]' || part.toLowerCase().startsWith('map[')) {
            let mapUrl = linkedStore?.mapIframeUrl;
            if (part.toLowerCase() !== '[map]') {
                const mapMatch = part.match(/map\[([^\]]+)\]/i);
                if (mapMatch) mapUrl = mapMatch[1];
            }
            
            if (mapUrl && mapUrl.includes('<iframe')) {
                const match = mapUrl.match(/src="([^"]+)"/);
                if (match) mapUrl = match[1];
            }

            if (mapUrl) {
                rendered.push(
                    <div key={idx} style={{ width: '100%', height: '300px', margin: '30px 0', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                        <iframe src={mapUrl} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    </div>
                );
            }
            return;
        }

        // 일반 본문 및 마크다운 스타일링 렌더링
        rendered.push(
            <div 
                key={idx} 
                className="promo-content-block"
                style={{ wordBreak: 'break-word', fontWeight: 400, fontSize: '1rem', color: '#334155' }}
                dangerouslySetInnerHTML={{ 
                    __html: part
                        .replace(/\r\n/g, '\n') // 윈도우 캐리지 리턴(\r\n)을 일괄 \n으로 치환하여 매칭 오류 차단
                        // 0-0. 마크다운 이미지 링크 및 링크 처리
                        .replace(/\[\!\s*\[([^\]]*)\]\(([^)]+)\)\s*\]\(([^)]+)\)/g, '<a href="$3" target="_blank" class="promo-link-img"><img src="$2" alt="$1" style="max-width: 100%; height: auto; display: block; border-radius: 12px; margin: 12px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" /></a>')
                        .replace(/\!\s*\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; display: block; border-radius: 12px; margin: 12px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />')
                        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="promo-link">$1</a>')
                        // 0. $ 로 시작하는 문단(Paragraph)을 감지하여 연한 라운드 박스로 렌더링 (인용구 스타일 전에 감지)
                        .replace(/^\s*\$\s*([^\n\r]+)/gm, '<div class="promo-callout-box">$1</div>')
                        // 0. 인용구 스타일 (> text) - 최우선 처리 (줄바꿈이 섞이지 않도록 \n 제외 패턴 사용)
                        .replace(/^>\s?([^\n\r]*)$/gm, '<blockquote class="promo-blockquote">$1</blockquote>')
                        // 0-1. 구분선/수평선 스타일 (---, ***, ___ 전체 매칭)
                        .replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="promo-hr" />')
                        // 0-2. 리스트 기호 (들여쓰기 및 o/◦ 기호 지원, HTML 태그 보호) - 순서를 위로 당겨 ** 강조 태그 변환 전에 먼저 리스트로 감쌉니다.
                        .replace(/^([\s]*)([•\-*o◦])([ \t]+|&nbsp;)([^\n]*)/gm, (match, spaces, bullet, spaceAfter, content) => {
                            const isSub = spaces.length > 0;
                            if ((bullet === 'o' || bullet === '◦') && !isSub) {
                                return match;
                            }
                            // 구분선(---, ***) 형태는 리스트에서 제외
                            if ((bullet === '-' || bullet === '*') && content.trim().length >= 2 && /^[-\*]+$/.test(bullet + content.trim())) {
                                return match;
                            }
                            // HTML 태그 내부 또는 속성 라인이 매칭되어 레이아웃이 붕괴하는 것을 차단
                            if (match.includes('<') || match.includes('>') || /class=/i.test(match) || /style=/i.test(match) || /on[a-z]+=/i.test(match) || /align=/i.test(match)) {
                                return match;
                            }
                            const liClass = isSub ? 'promo-li promo-li-sub' : 'promo-li';
                            return `<ul class="promo-ul"><li class="${liClass}"><div class="li-text-inner">${content}</div></li></ul>`;
                        })
                        // 1. 마크다운 굵게 (이모지 포함 소제목 라인은 블록 요소로 치환하여 여백을 제어)
                        .replace(/^([^\*\n\r]*?)\*\*(.*?)\*\*([^\*\n\r]*?)$/gm, (match, before, text, after) => {
                            // 라인 전체가 굵은글씨로 강조되거나 이모지만 섞인 소제목 형태인 경우만 h3로 변환
                            const totalText = (before + after).trim();
                            if (totalText === '' || /^[^\w\s가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/.test(totalText)) {
                                return `<h3 class="promo-sub-title">${before}${text}${after}</h3>`;
                            }
                            // 그 외 일반 텍스트 라인 속의 **는 strong으로 남겨둠
                            return `${before}<strong class="promo-bold">${text}</strong>${after}`;
                        })
                        .replace(/^([^_\n\r]*?)__(.*?)__([^_\n\r]*?)$/gm, (match, before, text, after) => {
                            const totalText = (before + after).trim();
                            if (totalText === '' || /^[^\w\s가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/.test(totalText)) {
                                return `<h3 class="promo-sub-title">${before}${text}${after}</h3>`;
                            }
                            return `${before}<strong class="promo-bold">${text}</strong>${after}`;
                        })
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="promo-bold">$1</strong>')
                        .replace(/__(.*?)__/g, '<strong class="promo-bold">$1</strong>')
                        // 2. 제목 스타일 (#, ##, ###, #### 및 기존 숫자 제목 지원)
                        .replace(/^#### (.*)$/gm, '<h4 class="promo-h4">$1</h4>')
                        .replace(/^### (.*)$/gm, '<h3 class="promo-sub-title">$1</h3>')
                        .replace(/^## (.*)$/gm, '<h2 class="promo-h2">$1</h2>')
                        .replace(/^# (.*)$/gm, '<h1 class="promo-h1">$1</h1>')
                        .replace(/^(\d+\. .*)$/gm, '<h2 class="promo-h2">$1</h2>')
                        // 3. 해시태그 칩 (글 시작, 마지막, 태그 뒤까지 완벽 인식)
                        .replace(/(^|\s|>|&nbsp;)#([^\s#<;"]+)/g, '$1<span class="promo-tag">#$2</span>')
                        // 5. 일반 줄바꿈 → <br> (HTML 블록 태그 사이 줄바꿈 제외)
                        .replace(/\n(?!<\/?(?:ul|li|h[1-6]|div|p|br|blockquote|hr))/g, '<br>')
                }}
            />
        );
    });

    return (
        <div className="promo-content-wrapper" style={{ width: '100%', fontWeight: 400, fontSize: '1rem' }}>
            <style>{`
                .promo-content-wrapper { width: 100%; display: block; color: #334155; font-family: var(--font-base); letter-spacing: -0.6px; white-space: normal; }
                .promo-content-wrapper * { line-height: 1.6; color: inherit; font-style: normal !important; }
                .promo-content-wrapper em, .promo-content-wrapper i { font-style: normal !important; }

                /* First elements within details shouldn't have top margins */
                .promo-content-wrapper > *:first-child { margin-top: 0 !important; }
                .promo-content-wrapper > .promo-content-block:first-child > *:first-child { margin-top: 0 !important; }

                /* ✅ 일반 텍스트 - 보통 굵기 */
                .promo-content-block { margin: 6px 0 !important; display: block; width: 100%; font-size: 1rem; font-weight: 400 !important; color: #334155; user-select: text !important; -webkit-user-select: text !important; }
                .promo-content-block:empty { display: none !important; margin: 0 !important; }

                /* ✅ 굵은 제목 스타일 및 하단 마진 8px로 설정 */
                .promo-content-wrapper h1, .promo-h1 { font-size: 1.45rem !important; font-weight: 900 !important; color: #1e293b !important; margin: 16px 0 8px 0 !important; display: block; }
                .promo-content-wrapper h2, .promo-h2 { font-size: 1.22rem !important; font-weight: 900 !important; color: #1e293b !important; margin: 18px 0 8px 0 !important; border-bottom: 2px solid #f1f5f9; padding-bottom: 4px !important; display: block; }
                .promo-content-wrapper h3 { font-size: 1.12rem !important; font-weight: 800 !important; color: #1e293b !important; margin: 12px 0 8px 0 !important; display: block; }
                .promo-content-wrapper h4, .promo-h4 { font-size: 1.05rem !important; font-weight: 800 !important; color: #1e293b !important; margin: 10px 0 8px 0 !important; display: block; }
                .promo-content-wrapper h2 + h2 { margin-top: -12px !important; border-bottom: none !important; padding-bottom: 0 !important; }

                .promo-sub-title { font-size: 1.1rem !important; font-weight: 900 !important; color: #1e293b !important; margin: 14px 0 8px 0 !important; display: block; }
                
                /* 제목 요소 바로 뒤에 오는 형제 요소의 margin-top 줄이기 */
                .promo-sub-title + br, .promo-h2 + br, h3 + br { display: none !important; } /* 제목 바로 다음의 불필요한 줄바꿈 제거 */
                .promo-content-wrapper > .promo-content-block:first-child .promo-sub-title:first-child { margin-top: 0 !important; }
                .promo-bold { font-weight: 700 !important; color: #1e293b !important; }
                .promo-tag { display: inline-block; background: #f1f5ff; color: #6366f1 !important; padding: 2px 10px; border-radius: 100px; font-size: 0.8rem; font-weight: 700 !important; margin: 4px 4px 4px 0; border: 1px solid #e0e7ff; }
                .promo-link { color: #6366f1 !important; text-decoration: underline !important; font-weight: 700 !important; word-break: break-all !important; }

                .promo-blockquote { 
                    margin: 12px 0 !important; 
                    padding: 10px 15px !important; 
                    border: 1px solid rgba(99, 102, 241, 0.2) !important;
                    border-left: 3.5px solid #6366f1 !important; 
                    background: rgba(99, 102, 241, 0.05) !important; 
                    color: #6366f1 !important; 
                    font-style: normal !important; 
                    display: block; 
                    font-weight: 400 !important;
                    border-radius: 8px !important;
                }
                .promo-blockquote * {
                    color: #6366f1 !important;
                    font-weight: 400 !important;
                }

                .promo-callout-box {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 12px 16px;
                    margin: 14px 0 !important;
                    color: #475569;
                    font-size: 1rem;
                    font-weight: 400;
                    line-height: 1.6;
                    display: block;
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.01);
                }

                .promo-hr { border: none !important; border-top: 1.5px solid #e2e8f0 !important; margin: 24px 0 !important; height: 0 !important; display: block; }

                .promo-ul { list-style: none !important; padding: 0 !important; padding-left: 0.8rem !important; margin: 1px 0 !important; }
                .promo-ul + .promo-ul { margin-top: -4px !important; }
                .promo-li { position: relative !important; padding-left: 1.2rem !important; margin-bottom: 2px !important; color: #475569; font-weight: 400; font-size: 1rem; }
                .promo-li::before { content: "•"; position: absolute !important; left: 0 !important; top: -0.1em !important; color: #6366f1 !important; font-size: 1.3em !important; font-weight: 900 !important; }
                .promo-li-sub { padding-left: 1.2rem !important; margin-left: 1rem !important; color: #556575; font-weight: 400; margin-bottom: 2px !important; }
                .promo-li-sub::before { content: "◦"; position: absolute !important; left: 0 !important; top: -0.2em !important; color: #94a3b8 !important; font-size: 1.3em !important; }
                .promo-content-wrapper { user-select: text !important; -webkit-user-select: text !important; }
                .table-responsive { width: 100%; overflow-x: auto; margin: 20px 0; border-radius: 12px; border: 1px solid #e2e8f0; }
                .promo-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
                .promo-table th { background-color: #f8fafc; color: #475569; font-weight: 700; padding: 12px 16px; border-bottom: 2px solid #e2e8f0; }
                .promo-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #334155; }
                .promo-table tr:last-child td { border-bottom: none; }
                .promo-table tr:nth-child(even) { background-color: #f8fafc; }
            `}</style>
            {rendered}
        </div>
    );
});

export default RenderWithShortcodes;
