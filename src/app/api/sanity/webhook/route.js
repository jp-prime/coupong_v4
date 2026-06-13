import { NextResponse } from 'next/server';
import { db } from '@/firebase'; // Use client Firebase instance directly
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

// ─── HELPER: Markdown Table to HTML Table Converter ────────────────
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

    let html = '<div style="width:100%; overflow-x:auto; margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 12px;"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;"><thead><tr style="background-color:#f8fafc; border-bottom: 2px solid #e2e8f0;">';
    headers.forEach((h, idx) => {
        const align = alignments[idx] || 'left';
        html += `<th style="text-align: ${align}; padding: 12px 16px; font-weight:700; color:#475569;">${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    for (let r = 2; r < tableLines.length; r++) {
        const cols = tableLines[r]
            .split('|')
            .slice(1, -1)
            .map(c => c.trim());
        const rowBg = r % 2 === 0 ? 'background-color:#f8fafc;' : 'background-color:#ffffff;';
        html += `<tr style="${rowBg} border-bottom: 1px solid #e2e8f0;">`;
        headers.forEach((_, idx) => {
            const colVal = cols[idx] || '';
            const align = alignments[idx] || 'left';
            html += `<td style="text-align: ${align}; padding: 12px 16px; color:#334155;">${colVal}</td>`;
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

// Simple Markdown to HTML parser implementation to bypass 'marked' dependency
function simpleMarkdownToHtml(markdownText) {
    if (!markdownText) return '';
    let html = markdownText
        .replace(/\r\n/g, '\n')
        // Bold tags
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Headings
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#6366f1;text-decoration:underline;">$1</a>')
        // Blockquotes
        .replace(/^>\s?([^\n]*)$/gm, '<blockquote style="border-left:4px solid #6366f1;padding-left:16px;margin:12px 0;color:#4b5563;font-style:italic;">$1</blockquote>')
        // Linebreaks
        .replace(/\n/g, '<br />');

    return html;
}

// ─── HELPER: Sanity Image URL Resolver ────────────────────────────────
function resolveSanityImageUrl(assetRef, projectId = '8xyje6wz', dataset = 'production') {
  if (!assetRef || typeof assetRef !== 'string') return '';
  if (assetRef.startsWith('image-')) {
    const parts = assetRef.substring(6).split('-');
    if (parts.length >= 2) {
      const ext = parts.pop();
      const idAndDimensions = parts.join('-');
      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${idAndDimensions}.${ext}`;
    }
  }
  return '';
}

// ─── HELPER: WordPress Post Sync ──────────────────────────────────────
async function uploadImageToWordPress(imageUrl, title, credentials) {
  const wpUrl = process.env.VITE_WP_URL || process.env.WP_URL;
  if (!imageUrl || !wpUrl) return null;

  try {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let mimeType = imageRes.headers.get('content-type') || 'image/jpeg';
    let ext = 'jpg';
    if (mimeType.includes('png')) { ext = 'png'; mimeType = 'image/png'; }
    else if (mimeType.includes('webp')) { ext = 'webp'; mimeType = 'image/webp'; }
    else if (mimeType.includes('gif')) { ext = 'gif'; mimeType = 'image/gif'; }
    else if (mimeType.includes('svg')) { ext = 'svg'; mimeType = 'image/svg+xml'; }

    const fileName = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_thumb.${ext}`;

    const response = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Authorization': `Basic ${credentials}`
      },
      body: buffer
    });

    if (response.ok) {
      const media = await response.json();
      return media.id;
    }
  } catch (error) {
    console.error("Error uploading image to WordPress:", error);
  }
  return null;
}

async function publishToWordPress(postData, existingWpId = null) {
  const wpUrl = process.env.VITE_WP_URL || process.env.WP_URL;
  const wpUser = process.env.VITE_WP_USER || process.env.WP_USER;
  const wpPassword = process.env.VITE_WP_PASSWORD || process.env.WP_PASSWORD;

  if (!wpUrl || !wpUser || !wpPassword) return null;

  try {
    const credentials = Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');
    let rawContent = postData.content || '';

    // Convert Carousel block
    const carouselRegex = /```(?:carousel|gallery)([\s\S]*?)```/g;
    rawContent = rawContent.replace(carouselRegex, (match, blockContent) => {
      const lines = blockContent.split('\n');
      let htmlImages = '<div style="display: flex; flex-direction: column; gap: 20px; align-items: center; margin: 20px 0; width: 100%;">';
      let count = 0;
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const mdImgMatch = /!\[.*?\]\((.*?)\)/.exec(line);
        let imgUrl = '';
        if (mdImgMatch) { imgUrl = mdImgMatch[1]; } 
        else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('/')) { imgUrl = line; }
        if (imgUrl) {
          htmlImages += `<img src="${imgUrl}" style="width: 100%; max-height: 500px; object-fit: cover; border-radius: 20px; display: block; margin: 10px auto;" />`;
          count++;
        }
      }
      htmlImages += '</div>';
      return count > 0 ? htmlImages : '';
    });

    // Parse Markdown tables before HTML parsing
    rawContent = parseMarkdownTables(rawContent);

    // Apply Responsive, rounded styling to inline markdown images
    const mdImageInlineRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
    rawContent = rawContent.replace(mdImageInlineRegex, (match, alt, imgUrl) => {
      return `<img src="${imgUrl}" alt="${alt}" style="width: 100%; height: auto; max-height: 500px; object-fit: cover; border-radius: 20px; display: block; margin: 12px auto;" />`;
    });

    let enrichedContent = simpleMarkdownToHtml(rawContent);

    if (postData.thumbnailUrl) {
      enrichedContent = `<div style="text-align: center; margin-bottom: 20px;"><img src="${postData.thumbnailUrl}" alt="${postData.title}" style="width: 100%; height: auto; max-height: 500px; object-fit: cover; border-radius: 20px; display: block; margin: 0 auto;" /></div>\n` + enrichedContent;
    }

    const currentBannerUrl = postData.bannerImageUrl || "https://cdn.sanity.io/images/8xyje6wz/production/1d60b2d2c9402497f221e15614a4b8dc3c5ae833-1747x492.jpg";
    const currentBannerLink = postData.bannerLink || "https://www.vinatong.store";
    enrichedContent += `\n\n<div style="text-align: center; margin-top: 30px; margin-bottom: 20px;"><a href="${currentBannerLink}" target="_blank"><img src="${currentBannerUrl}" alt="홍보 배너" style="max-width: 100%; height: auto; border-radius: 8px;" /></a></div>`;

    const canonicalUrl = `https://www.vinatong.store/board?slug=${encodeURIComponent(postData.slug)}`;
    enrichedContent += `\n\n<p style="text-align: center; margin-top: 20px; font-size: 0.9em; color: #888;">이 글은 <a href="${canonicalUrl}" target="_blank">비나통(VinaTong)</a>에서 최초 발행되었습니다.</p>`;

    let featuredMediaId = null;
    if (postData.thumbnailUrl) {
      featuredMediaId = await uploadImageToWordPress(postData.thumbnailUrl, postData.title, credentials);
    }

    const bodyData = {
      title: postData.title,
      content: enrichedContent,
      status: 'publish',
      categories: [1],
      tags: [],
      slug: postData.slug,
      meta: {
        rank_math_title: postData.title,
        rank_math_description: postData.summary || postData.title,
        rank_math_canonical_url: canonicalUrl
      }
    };

    if (featuredMediaId) bodyData.featured_media = featuredMediaId;

    const url = existingWpId 
      ? `${wpUrl}/wp-json/wp/v2/posts/${existingWpId}`
      : `${wpUrl}/wp-json/wp/v2/posts`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      if (existingWpId && response.status === 404) {
        return await publishToWordPress(postData, null);
      }
      return null;
    }

    const wpPost = await response.json();
    return wpPost.id;
  } catch (error) {
    console.error("Failed to publish to WordPress:", error);
    return null;
  }
}

async function deleteFromWordPress(wpPostId) {
  const wpUrl = process.env.VITE_WP_URL || process.env.WP_URL;
  const wpUser = process.env.VITE_WP_USER || process.env.WP_USER;
  const wpPassword = process.env.VITE_WP_PASSWORD || process.env.WP_PASSWORD;
  if (!wpUrl || !wpUser || !wpPassword || !wpPostId) return;

  try {
    const credentials = Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');
    await fetch(`${wpUrl}/wp-json/wp/v2/posts/${wpPostId}?force=true`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
  } catch (error) {
    console.error(`Error deleting WordPress post ${wpPostId}:`, error);
  }
}

// ─── HELPER: Wix Post Sync ────────────────────────────────────────────
async function publishToWix(postData, existingWixId = null) {
  const wixApiKey = process.env.WIX_API_KEY;
  const wixSiteId = process.env.WIX_SITE_ID;
  if (!wixApiKey || !wixSiteId) return null;

  const canonicalUrl = `https://www.vinatong.store/board?slug=${encodeURIComponent(postData.slug)}`;
  const defaultMemberId = "57e2e0ac-8ef5-495a-b8cd-0e4e9528773c";

  let rawContent = postData.content || '';
  
  const carouselRegex = /```(?:carousel|gallery)([\s\S]*?)```/g;
  rawContent = rawContent.replace(carouselRegex, (match, blockContent) => {
    const lines = blockContent.split('\n');
    let htmlImages = '<div style="display: flex; flex-direction: column; gap: 20px; align-items: center; margin: 20px 0; width: 100%;">';
    let count = 0;
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      const mdImgMatch = /!\[.*?\]\((.*?)\)/.exec(line);
      let imgUrl = '';
      if (mdImgMatch) { imgUrl = mdImgMatch[1]; } 
      else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('/')) { imgUrl = line; }
      if (imgUrl) {
        htmlImages += `<img src="${imgUrl}" style="width: 100%; max-height: 500px; object-fit: cover; border-radius: 20px; display: block; margin: 10px auto;" />`;
        count++;
      }
    }
    htmlImages += '</div>';
    return count > 0 ? htmlImages : '';
  });

  rawContent = parseMarkdownTables(rawContent);

  const mdImageInlineRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  rawContent = rawContent.replace(mdImageInlineRegex, (match, alt, imgUrl) => {
    return `<img src="${imgUrl}" alt="${alt}" style="width: 100%; height: auto; max-height: 500px; object-fit: cover; border-radius: 20px; display: block; margin: 12px auto;" />`;
  });

  let enrichedHtml = simpleMarkdownToHtml(rawContent);
  
  if (postData.thumbnailUrl) {
    enrichedHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${postData.thumbnailUrl}" style="width: 100%; height: auto; max-height: 500px; object-fit: cover; border-radius: 20px; display: block; margin: 0 auto;" alt="대표 이미지"></div>` + enrichedHtml;
  }

  const currentBannerUrl = postData.bannerImageUrl || "https://cdn.sanity.io/images/8xyje6wz/production/1d60b2d2c9402497f221e15614a4b8dc3c5ae833-1747x492.jpg";
  const currentBannerLink = postData.bannerLink || "https://www.vinatong.store";
  enrichedHtml += `<div style="text-align: center; margin-top: 30px; margin-bottom: 20px;"><a href="${currentBannerLink}" target="_blank"><img src="${currentBannerUrl}" alt="홍보 배너" style="max-width: 100%; height: auto; border-radius: 8px;" /></a></div>`;
  enrichedHtml += `<p style="text-align: center; margin-top: 20px; font-size: 0.9em; color: #888;">이 글은 <a href="${canonicalUrl}" target="_blank">비나통(VinaTong)</a>에서 최초 발행되었습니다.</p>`;

  const payload = {
    draftPost: {
      title: postData.title,
      memberId: defaultMemberId,
      richContent: {
        nodes: [
          {
            type: "HTML",
            htmlData: {
              html: `<div class="wix-custom-content" style="font-family: sans-serif; line-height: 1.6; color: #334155;">${enrichedHtml}</div>`,
              containerData: {
                alignment: "CENTER",
                width: { custom: "100%" },
                textWrap: false
              }
            }
          }
        ]
      }
    },
    publish: true
  };

  if (postData.thumbnailUrl) {
    payload.draftPost.coverMedia = { image: { url: postData.thumbnailUrl } };
  }

  try {
    const url = existingWixId 
      ? `https://www.wixapis.com/blog/v3/draft-posts/${existingWixId}`
      : 'https://www.wixapis.com/blog/v3/draft-posts';
      
    const response = await fetch(url, {
      method: existingWixId ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': wixApiKey,
        'wix-site-id': wixSiteId
      },
      body: JSON.stringify(existingWixId ? { draftPost: payload.draftPost, fieldMask: { paths: ["title", "richContent", "coverMedia"] } } : payload)
    });

    if (response.ok) {
      const resJson = await response.json();
      const postId = resJson.draftPost ? resJson.draftPost.id : existingWixId;
      
      if (existingWixId) {
        await fetch(`https://www.wixapis.com/blog/v3/draft-posts/${postId}/publish`, {
          method: 'POST',
          headers: { 'Authorization': wixApiKey, 'wix-site-id': wixSiteId }
        });
      }
      return postId;
    }
  } catch (error) {
    console.error("Failed to sync with Wix:", error);
  }
  return null;
}

async function deleteFromWix(wixPostId) {
  const wixApiKey = process.env.WIX_API_KEY;
  const wixSiteId = process.env.WIX_SITE_ID;
  if (!wixApiKey || !wixSiteId || !wixPostId) return;

  try {
    await fetch(`https://www.wixapis.com/blog/v3/draft-posts/${wixPostId}`, {
      method: 'DELETE',
      headers: { 'Authorization': wixApiKey, 'wix-site-id': wixSiteId }
    });
  } catch (error) {
    console.error(`Error deleting Wix post ${wixPostId}:`, error);
  }
}

// ─── MAIN POST HANDLER ───────────────────────────────────────────────
export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const expectedToken = process.env.SANITY_WEBHOOK_TOKEN || 'cp_sanity_tok_e91c784b802ad';

    if (expectedToken && token !== expectedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { _id, _type } = body;

        if (!_type || (_type !== 'boardPost' && _type !== 'store')) {
            return NextResponse.json({ message: `Skipped type: ${_type}` });
        }

        const isDraft = _id && _id.startsWith('drafts.');
        const docId = isDraft ? _id.replace('drafts.', '') : _id;
        const isStore = _type === 'store';

        const isPublished = body.isPublished;
        let isActive = isPublished !== false && !isDraft;
        if (isStore && body.publishToBoard !== true) {
            isActive = false;
        }

        // Firestore reference using Client SDK
        const docRef = doc(db, 'board_posts', docId);

        if (!isActive) {
            const existingDoc = await getDoc(docRef);
            if (existingDoc.exists()) {
                const existingData = existingDoc.data();
                const existingWpId = existingData.wpPostId;
                const existingWixId = existingData.wixPostId;

                await Promise.all([
                    existingWpId ? deleteFromWordPress(existingWpId) : Promise.resolve(),
                    existingWixId ? deleteFromWix(existingWixId) : Promise.resolve()
                ]);
            }
            await deleteDoc(docRef);
            return NextResponse.json({ message: 'Deleted and synchronized successfully' });
        }

        let postData = {};

        if (isStore) {
            let thumbnailUrl = '';
            const images = body.images;
            if (Array.isArray(images) && images.length > 0 && images[0].asset) {
                const assetRef = images[0].asset._ref || images[0].asset._id;
                if (assetRef) {
                    thumbnailUrl = resolveSanityImageUrl(assetRef);
                    if (thumbnailUrl) thumbnailUrl += '?w=1000&h=1000&fit=crop';
                }
            }

            const storeName = body.name || '';
            const targetStoreId = body.firestoreId || docId;
            const storeLink = `https://coupong.online/store/${targetStoreId}`;
            const storeDetailButtonHtml = `<div style="text-align: center; margin-top: 30px; margin-bottom: 20px;"><a href="${storeLink}" target="_blank" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; border-radius: 30px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); font-size: 0.95rem;">🏪 ${storeName} 상세보기 바로가기</a></div>`;

            const descriptionText = body.description || body.slogan || '';
            const content = descriptionText ? (descriptionText + "\n\n" + storeDetailButtonHtml) : storeDetailButtonHtml;
            const sloganText = body.slogan ? body.slogan.trim() : '';

            postData = {
                title: sloganText ? `${storeName} - ${sloganText}` : storeName,
                slug: body.slug && body.slug.current ? `store-${body.slug.current}` : `store-${docId}`,
                category: '가맹점정보',
                isPinned: false,
                isPublished: true,
                summary: body.slogan || '',
                content: content,
                thumbnailUrl: thumbnailUrl,
                bannerImageUrl: '',
                bannerLink: '',
                tags: body.category ? [body.category] : [],
                publishedAt: body.publishedAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } else {
            const { title, slug, category, isPinned, summary, content, thumbnail, publishedAt, tags, bannerImage, bannerLink } = body;

            let thumbnailUrl = '';
            if (thumbnail && thumbnail.asset) {
                const assetRef = thumbnail.asset._ref || thumbnail.asset._id;
                if (assetRef) {
                    thumbnailUrl = resolveSanityImageUrl(assetRef);
                    if (thumbnailUrl) thumbnailUrl += '?w=1000&h=1000&fit=crop';
                }
            }

            let bannerImageUrl = '';
            if (bannerImage && bannerImage.asset) {
                const assetRef = bannerImage.asset._ref || bannerImage.asset._id;
                if (assetRef) bannerImageUrl = resolveSanityImageUrl(assetRef);
            }

            postData = {
                title: title || '',
                slug: slug && slug.current ? slug.current : '',
                category: category || '일반',
                isPinned: !!isPinned,
                isPublished: true,
                summary: summary || '',
                content: content || '',
                thumbnailUrl: thumbnailUrl,
                bannerImageUrl: bannerImageUrl,
                bannerLink: bannerLink || '',
                tags: Array.isArray(tags) ? tags.map(t => typeof t === 'object' ? (t.label || t.name) : t).filter(Boolean) : [],
                publishedAt: publishedAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        const existingDoc = await getDoc(docRef);
        let existingWpId = null;
        let existingWixId = null;

        if (existingDoc.exists()) {
            const data = existingDoc.data();
            existingWpId = data.wpPostId || null;
            existingWixId = data.wixPostId || null;
        }

        const [wpPostId, wixPostId] = await Promise.all([
            publishToWordPress(postData, existingWpId),
            publishToWix(postData, existingWixId)
        ]);

        if (wpPostId) postData.wpPostId = wpPostId;
        if (wixPostId) postData.wixPostId = wixPostId;

        await setDoc(docRef, postData, { merge: true });

        return NextResponse.json({ message: 'Success', wpPostId, wixPostId });
    } catch (error) {
        console.error("Webhook processing failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
