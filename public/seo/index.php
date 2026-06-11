<?php
/**
 * SEO City Landing Pages - coupong.online
 * URL: /seo/{city-slug}
 * Cities: hcm, danang, nhatrang, phuquoc, hanoi, vungtau
 */

error_reporting(0);
ini_set('display_errors', 0);

// ── 도시 데이터 ──────────────────────────────────────────────
$cities = [
    'hcm' => [
        'name'  => '호치민',
        'en'    => 'Ho Chi Minh City',
        'title' => '호치민 한국식당·맛집·업소 할인쿠폰 | 쿠퐁온라인',
        'desc'  => '호치민(사이공) 한국식당, 맛집, 유흥업소, 골프클럽 등 베트남 최대 도시 업소 정보와 무료 할인쿠폰을 한곳에서! 쿠퐁온라인 – 베트남 업소 무료 홍보 플랫폼.',
        'og_image' => 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=630&fit=crop',
        'hero_img' => 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1400&h=600&fit=crop',
        'info'  => '호치민시(구 사이공)는 베트남 최대 경제 도시로 1군~12군에 걸쳐 수천 개의 한인 업소가 운영 중입니다. 2군(안푸·타오디엔), 7군(푸미흥), 빈탄 등에 한인타운이 형성되어 있으며, 한국 식당·카페·뷰티·골프·유흥 업소가 집중돼 있습니다.',
    ],
    'danang' => [
        'name'  => '다낭',
        'en'    => 'Da Nang',
        'title' => '다낭 한국식당·맛집·업소 할인쿠폰 | 쿠퐁온라인',
        'desc'  => '다낭 한국식당, 해산물 맛집, 마사지, 골프장 업소 정보와 무료 할인쿠폰! 호이안·미케비치 주변 업소 전체 목록. 쿠퐁온라인에서 확인하세요.',
        'og_image' => 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&h=630&fit=crop',
        'hero_img' => 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1400&h=600&fit=crop',
        'info'  => '다낭은 중부 베트남 최대 관광 도시로 미케비치, 논느억비치, 바나힐 등 명소와 인접한 호이안 구시가지가 유명합니다. 한인 업소는 미케비치 주변(응우옌반토아이 거리)과 시내 중심부에 집중되어 있으며, 골프 코스가 15개 이상 운영됩니다.',
    ],
    'nhatrang' => [
        'name'  => '나트랑',
        'en'    => 'Nha Trang',
        'title' => '나트랑(나짱) 한국식당·맛집·업소 할인쿠폰 | 쿠퐁온라인',
        'desc'  => '나트랑(나짱) 한국식당, 해산물 맛집, 머드스파, 워터파크 업소 정보와 무료 할인쿠폰! 빈펄 리조트 인근 전체 업소 목록.',
        'og_image' => 'https://images.unsplash.com/photo-1509233725247-49e657319a4e?w=1200&h=630&fit=crop',
        'hero_img' => 'https://images.unsplash.com/photo-1509233725247-49e657319a4e?w=1400&h=600&fit=crop',
        'info'  => '나트랑(Nha Trang)은 투명한 에메랄드빛 바다로 유명한 남부 해양 관광 도시입니다. 쩐푸 해변과 빈펄 리조트 주변에 한국 관광객 대상 식당 및 스파 업소가 밀집해 있으며, 머드스파와 아이랜드 투어가 인기입니다.',
    ],
    'phuquoc' => [
        'name'  => '푸꾸옥',
        'en'    => 'Phu Quoc',
        'title' => '푸꾸옥 한국식당·맛집·업소 할인쿠폰 | 쿠퐁온라인',
        'desc'  => '푸꾸옥 한국식당, 씨푸드 맛집, 리조트·스파 업소 정보와 무료 할인쿠폰! 즈엉동 야시장·사파리·케이블카 주변 전체 업소 목록.',
        'og_image' => 'https://images.unsplash.com/photo-1559592414-bfc7f8e0609b?w=1200&h=630&fit=crop',
        'hero_img' => 'https://images.unsplash.com/photo-1559592414-bfc7f8e0609b?w=1400&h=600&fit=crop',
        'info'  => '푸꾸옥은 베트남 최남단 섬으로 세계 최장 케이블카, 사파리, 즈엉동 야시장이 유명합니다. 한국인 관광객이 급증하며 즈엉동 시내와 롱비치(바이다이) 주변에 한국 식당과 투어 업체들이 자리 잡고 있습니다.',
    ],
    'hanoi' => [
        'name'  => '하노이',
        'en'    => 'Hanoi',
        'title' => '하노이 한국식당·맛집·업소 할인쿠폰 | 쿠퐁온라인',
        'desc'  => '하노이 한국식당, 분짜·쌀국수 맛집, 골프·마사지 업소 정보와 무료 할인쿠폰! 호안끼엠 호수·미딩·하이바쯩 주변 전체 업소 목록.',
        'og_image' => 'https://images.unsplash.com/photo-1555921015-5532091f6026?w=1200&h=630&fit=crop',
        'hero_img' => 'https://images.unsplash.com/photo-1555921015-5532091f6026?w=1400&h=600&fit=crop',
        'info'  => '하노이는 베트남의 수도로 천 년의 역사를 간직한 문화 중심지입니다. 미딩(MY Dinh)과 하이바쯩(Hai Ba Trung) 지구에 대기업 주재원 중심의 한인 커뮤니티가 형성되어 있으며, 한국 식당과 골프 투어 업체들이 집중돼 있습니다.',
    ],
    'vungtau' => [
        'name'  => '붕따우',
        'en'    => 'Vung Tau',
        'title' => '붕따우 한국식당·맛집·업소 할인쿠폰 | 쿠퐁온라인',
        'desc'  => '붕따우 한국식당, 해산물 맛집, 골프장·리조트 업소 정보와 무료 할인쿠폰! 호치민 근교 주말 여행지 붕따우 전체 업소 목록.',
        'og_image' => 'https://images.unsplash.com/photo-1586185105803-7003de0a7c94?w=1200&h=630&fit=crop',
        'hero_img' => 'https://images.unsplash.com/photo-1586185105803-7003de0a7c94?w=1400&h=600&fit=crop',
        'info'  => '붕따우(Vung Tau)는 호치민에서 차로 2시간 거리의 해변 도시로 한국 교민들의 주말 여행지로 인기입니다. 프론트비치(바이쯔억), 백비치(바이사우) 주변에 해산물 식당과 골프장이 밀집해 있으며, 석유산업 종사 외국인 거주자도 많습니다.',
    ],
];

// ── URL에서 도시 slug 파싱 ───────────────────────────────────
$uri = $_SERVER['REQUEST_URI'] ?? '';
$parts = explode('/', trim($uri, '/'));
// /seo/{slug} 형태를 지원
$slug = end($parts);
if ($slug === 'index.php' || $slug === '') $slug = 'hcm';
if (!isset($cities[$slug])) {
    header('HTTP/1.0 404 Not Found');
    echo '<h1>페이지를 찾을 수 없습니다.</h1>';
    exit;
}
$city = $cities[$slug];

// ── Firestore에서 업체 목록 가져오기 ───────────────────────
$projectId = 'coupong-98b03';
$fsUrl = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/coupons?pageSize=200";
$stores = [];

if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $fsUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $res = curl_exec($ch);
    curl_close($ch);
} else {
    $ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 8, 'ignore_errors' => true]]);
    $res = @file_get_contents($fsUrl, false, $ctx);
}

if ($res) {
    $data = json_decode($res, true);
    if (isset($data['documents'])) {
        foreach ($data['documents'] as $doc) {
            $f = $doc['fields'] ?? [];
            $nameParts = explode('/', $doc['name']);
            $id = end($nameParts);

            $name    = $f['name']['stringValue'] ?? '';
            $slogan  = $f['slogan']['stringValue'] ?? '';
            $phone   = $f['phoneNumber']['stringValue'] ?? ($f['phone']['stringValue'] ?? '');
            $active  = $f['isActive']['booleanValue'] ?? true;
            $discount = $f['discount']['stringValue'] ?? '';
            $title   = $f['title']['stringValue'] ?? '';

            // 비활성 또는 이름 없는 업체 제외
            if (!$name || $active === false) continue;
            // 쿠폰 미발행 업체 제외 (discount 또는 title 없으면 제외)
            if (!$discount && !$title) continue;

            $stores[] = ['id' => $id, 'name' => $name, 'slogan' => $slogan, 'phone' => $phone, 'discount' => $discount ?: $title];
        }
    }
}

$scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$canonicalUrl = "{$scheme}://{$host}/seo/{$slug}";
$siteUrl = "{$scheme}://{$host}";
?>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link rel="icon" type="image/png" href="/favicon.png" />
<title><?= htmlspecialchars($city['title']) ?></title>
<meta name="description" content="<?= htmlspecialchars($city['desc']) ?>"/>
<meta name="keywords" content="베트남업소 할인쿠폰, 베트남업소정보, 베트남맛집 순위, 베트남 한국식당, 베트남 업소 무료홍보, 베트남 한국식당 추천, 베트남 커뮤니티, 베트남 골프여행, 베트남 유흥업소, <?= $city['name'] ?> 맛집, <?= $city['name'] ?> 한국식당, <?= $city['name'] ?> 할인쿠폰, <?= $city['en'] ?>"/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="<?= $canonicalUrl ?>"/>
<!-- OG / Twitter -->
<meta property="og:type" content="website"/>
<meta property="og:url" content="<?= $canonicalUrl ?>"/>
<meta property="og:title" content="<?= htmlspecialchars($city['title']) ?>"/>
<meta property="og:description" content="<?= htmlspecialchars($city['desc']) ?>"/>
<meta property="og:image" content="<?= $city['og_image'] ?>"/>
<meta property="og:site_name" content="쿠퐁온라인 (COUPONG ONLINE)"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:image" content="<?= $city['og_image'] ?>"/>
<!-- GTM -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NL96FZKT');</script>
<!-- JSON-LD -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "<?= htmlspecialchars($city['title']) ?>",
  "description": "<?= htmlspecialchars($city['desc']) ?>",
  "url": "<?= $canonicalUrl ?>",
  "inLanguage": "ko",
  "publisher": {
    "@type": "Organization",
    "name": "쿠퐁온라인",
    "url": "<?= $siteUrl ?>"
  }
}
</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#f8fafc;color:#1e293b}
a{color:#7c3aed;text-decoration:none}
a:hover{text-decoration:underline}
/* Hero */
.hero{position:relative;height:340px;overflow:hidden;display:flex;align-items:flex-end}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.15) 60%);z-index:1}
.hero-content{position:relative;z-index:2;padding:32px 24px;width:100%}
.hero-content h1{font-size:clamp(1.4rem,5vw,2.2rem);font-weight:900;color:#fff;line-height:1.3;letter-spacing:-.02em;margin-bottom:8px}
.hero-content p{font-size:.95rem;color:rgba(255,255,255,.85);font-weight:600;max-width:640px}
/* Nav pills */
.city-nav{display:flex;gap:8px;flex-wrap:wrap;padding:16px 20px;background:#fff;border-bottom:1px solid #e2e8f0}
.city-nav a{padding:6px 14px;border-radius:20px;font-size:.8rem;font-weight:700;background:#f1f5f9;color:#475569;transition:all .2s}
.city-nav a.active,.city-nav a:hover{background:#7c3aed;color:#fff}
/* Content */
.container{max-width:860px;margin:0 auto;padding:32px 20px}
.section-title{font-size:1.2rem;font-weight:900;color:#0f172a;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #7c3aed}
/* City Info Card */
.info-card{background:#fff;border-radius:20px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.06);margin-bottom:32px;border:1px solid #e2e8f0;line-height:1.8;font-size:.97rem;color:#334155}
/* Keywords */
.keywords{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px}
.kw-tag{background:#f5f3ff;color:#6d28d9;padding:6px 14px;border-radius:20px;font-size:.8rem;font-weight:700}
/* Store list */
.store-list{display:flex;flex-direction:column;gap:14px}
.store-card{background:#fff;border-radius:16px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.05);border:1px solid #f1f5f9;flex-wrap:wrap}
.store-info{flex:1;min-width:0}
.store-name{font-size:1.05rem;font-weight:900;color:#0f172a;margin-bottom:3px}
.store-slogan{font-size:.83rem;color:#64748b;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.store-phone{font-size:.82rem;color:#a855f7;font-weight:700;margin-top:2px}
.store-btn{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;padding:8px 16px;border-radius:10px;font-size:.8rem;font-weight:800;white-space:nowrap;box-shadow:0 4px 10px rgba(124,58,237,.3)}
.store-btn:hover{opacity:.9;text-decoration:none}
/* No stores */
.no-store{text-align:center;padding:40px;color:#94a3b8;font-weight:600}
/* Footer */
.footer{background:#0f172a;color:rgba(255,255,255,.6);text-align:center;padding:28px 20px;font-size:.82rem;margin-top:48px}
.footer a{color:#a78bfa;font-weight:700}
@media(max-width:480px){.hero{height:260px}.store-card{flex-direction:column;align-items:flex-start}}
/* Header */
.site-header{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:860px;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,0,0,0.06);box-shadow:0 4px 12px rgba(0,0,0,0.05);height:64px}
.site-header .logo{display:flex;align-items:baseline;text-decoration:none;gap:0}
.site-header .logo .www{font-size:.78rem;font-weight:700;color:#94a3b8;letter-spacing:-.5px}
.site-header .logo .brand{font-size:1.25rem;font-weight:900;background:linear-gradient(135deg,#a855f7 0%,#7c3aed 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-.02em}
.site-header .logo .tld{font-size:.78rem;font-weight:700;color:#94a3b8;letter-spacing:-.5px}
.site-header .header-nav{display:flex;align-items:center;gap:8px}
.site-header .header-nav a{padding:7px 14px;border-radius:20px;font-size:.8rem;font-weight:700;background:#f5f3ff;color:#7c3aed;text-decoration:none;transition:all .2s}
.site-header .header-nav a:hover{background:#7c3aed;color:#fff}
.header-spacer{height:64px}
</style>
</head>
<body>
<!-- 앱 헤더 바 -->
<header class="site-header">
  <a href="/" class="logo">
    <span class="www">www.</span><span class="brand">Coupong</span><span class="tld">.online</span>
  </a>
  <nav class="header-nav">
    <a href="/">🏠 홈</a>
    <a href="/partner-apply">📋 업소등록</a>
  </nav>
</header>
<div class="header-spacer"></div>
<!-- Hero -->
<div class="hero">
  <img src="<?= $city['hero_img'] ?>" alt="<?= $city['name'] ?> 베트남 전경" loading="eager"/>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <h1>🇻🇳 <?= $city['name'] ?> 업소 할인쿠폰 & 맛집 정보</h1>
    <p>베트남업소 할인쿠폰 · 한국식당 추천 · 무료홍보 플랫폼 — 쿠퐁온라인</p>
  </div>
</div>

<!-- 도시 선택 네비게이션 -->
<nav class="city-nav" aria-label="도시 선택">
<?php foreach ($cities as $s => $c): ?>
  <a href="/seo/<?= $s ?>" class="<?= $s === $slug ? 'active' : '' ?>"><?= $c['name'] ?></a>
<?php endforeach; ?>
  <a href="/">🏠 쿠퐁 홈</a>
</nav>

<div class="container">

  <!-- 도시 정보 -->
  <h2 class="section-title">📍 <?= $city['name'] ?>(<?= $city['en'] ?>) 지역 정보</h2>
  <div class="info-card"><?= nl2br(htmlspecialchars($city['info'])) ?></div>

  <!-- 키워드 태그 -->
  <div class="keywords">
    <?php
    $kws = [
      '베트남업소 할인쿠폰','베트남업소정보','베트남맛집 순위','베트남 한국식당',
      '베트남 업소 무료홍보','베트남 한국식당 추천','베트남 커뮤니티',
      '베트남 골프여행','베트남 유흥업소',
      $city['name'].' 맛집', $city['name'].' 한국식당', $city['name'].' 할인쿠폰',
      $city['name'].' 업소정보'
    ];
    foreach ($kws as $kw): ?>
      <span class="kw-tag">#<?= htmlspecialchars($kw) ?></span>
    <?php endforeach; ?>
  </div>

  <!-- 업체 리스트 -->
  <h2 class="section-title">🎟 할인쿠폰 사용업체 전체 목록 (<?= count($stores) ?>개)</h2>
  <?php if (empty($stores)): ?>
    <div class="no-store">현재 등록된 업체 정보를 불러오는 중입니다...</div>
  <?php else: ?>
  <div class="store-list">
    <?php foreach ($stores as $s): ?>
    <div class="store-card">
      <div class="store-info">
        <div class="store-name"><?= htmlspecialchars($s['name']) ?></div>
        <?php if ($s['discount']): ?>
        <div style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:.78rem;font-weight:800;padding:2px 10px;border-radius:20px;margin:3px 0;"><?= htmlspecialchars($s['discount']) ?></div>
        <?php endif; ?>
        <?php if ($s['slogan']): ?>
        <div class="store-slogan"><?= htmlspecialchars($s['slogan']) ?></div>
        <?php endif; ?>
        <?php if ($s['phone']): ?>
        <div class="store-phone">📞 <?= htmlspecialchars($s['phone']) ?></div>
        <?php endif; ?>
      </div>
      <a href="<?= $siteUrl ?>/store/<?= htmlspecialchars($s['id']) ?>" class="store-btn" rel="noopener">쿠폰 받기 →</a>
    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>

</div>

<!-- Footer -->
<footer class="footer">
  <p>베트남 할인쿠폰 다운로드 &amp; 업소 무료 홍보 플랫폼</p>
  <p style="margin-top:6px"><a href="<?= $siteUrl ?>">www.coupong.online</a> &nbsp;|&nbsp; <a href="<?= $siteUrl ?>/partner-apply">업소 무료 등록하기</a></p>
  <p style="margin-top:10px;font-size:.75rem">호치민 · 다낭 · 나트랑 · 푸꾸옥 · 하노이 · 붕따우 베트남 전지역 업소 정보</p>
</footer>
</body>
</html>
