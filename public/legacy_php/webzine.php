<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
/**
 * COUPONG ONLINE - WEBZINE
 * 베트남 업소 정보 & 할인 소식 매거진
 */
header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

$projectId = "coupong-98b03";
$scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$base = ""; // root

// URL 파라미터에서 카테고리/지역 필터 가져오기
$filter = isset($_GET['filter']) ? $_GET['filter'] : 'ALL';

// --- HELPER FUNCTIONS ---

function fetchFSCollection($projectId, $col, $pageSize = 50) {
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/{$col}?pageSize={$pageSize}";
    $ctx = stream_context_create(["http" => ["method" => "GET", "timeout" => 5, "ignore_errors" => true]]);
    $res = @file_get_contents($url, false, $ctx);
    if (!$res) return [];
    $data = json_decode($res, true);
    return $data['documents'] ?? [];
}

function getRawVal($doc, $keys, $preferredLang = 'ko', $returnFirstIfArray = true) {
    if (!is_array($keys)) $keys = [$keys];
    foreach ($keys as $k) {
        $f = $doc['fields'][$k] ?? null;
        if (!$f) continue;
        if (isset($f['stringValue'])) {
            $val = $f['stringValue'];
            if ($returnFirstIfArray && (strpos($val, '[') === 0 || strpos($val, '{') === 0)) {
                $decoded = json_decode($val, true);
                if (is_array($decoded)) {
                    $extracted = '';
                    if (isset($decoded[0]['url'])) $extracted = $decoded[0]['url'];
                    elseif (isset($decoded[0])) $extracted = is_string($decoded[0]) ? $decoded[0] : (isset($decoded[0]['url']) ? $decoded[0]['url'] : '');
                    elseif (isset($decoded['url'])) $extracted = $decoded['url'];
                    if ($extracted !== '') return $extracted;
                }
            }
            if ($val !== '') return $val;
        }
        if (isset($f['arrayValue']['values']) && count($f['arrayValue']['values']) > 0) {
            if ($returnFirstIfArray) {
                $first = $f['arrayValue']['values'][0];
                return $first['stringValue'] ?? '';
            }
            $arr = [];
            foreach ($f['arrayValue']['values'] as $v) {
                if (isset($v['stringValue'])) $arr[] = $v['stringValue'];
            }
            return $arr;
        }
        if (isset($f['mapValue']['fields'])) {
            $mv = $f['mapValue']['fields'];
            if (isset($mv[$preferredLang]['stringValue'])) return $mv[$preferredLang]['stringValue'];
            if (isset($mv['ko']['stringValue'])) return $mv['ko']['stringValue'];
            if (isset($mv['vi']['stringValue'])) return $mv['vi']['stringValue'];
            if (isset($mv['en']['stringValue'])) return $mv['en']['stringValue'];
            if (isset($mv['url']['stringValue'])) return $mv['url']['stringValue'];
            foreach ($mv as $subField) {
                if (isset($subField['stringValue'])) return $subField['stringValue'];
            }
        }
    }
    return '';
}

function getVal($doc, $keys, $preferredLang = 'ko') {
    $val = getRawVal($doc, $keys, $preferredLang, true);
    return is_string($val) ? htmlspecialchars($val, ENT_QUOTES, 'UTF-8') : '';
}

function optimizeGoogleUrl($url) {
    if (strpos($url, 'lh3.googleusercontent.com') !== false) {
        $paramPos = strrpos($url, '=s');
        $baseUrl = ($paramPos !== false) ? substr($url, 0, $paramPos) : explode('=', $url)[0];
        return $baseUrl . "=s1000-w1000-h1000-rw";
    }
    return $url;
}

// --- VISITOR COUNTER LOGIC ---
$statFile = __DIR__ . "/visitor_stats.json";
if (!file_exists($statFile)) {
    $stats = ["total" => 0, "today" => 0, "last_date" => date("Y-m-d")];
} else {
    $stats = json_decode(file_get_contents($statFile), true);
}

$today = date("Y-m-d");
if ($stats['last_date'] !== $today) {
    $stats['today'] = 0;
    $stats['last_date'] = $today;
}

// Only increment if not already counted in this session
if (!isset($_SESSION['counted_visit'])) {
    $stats['total']++;
    $stats['today']++;
    $_SESSION['counted_visit'] = true;
    file_put_contents($statFile, json_encode($stats));
}

// --- DATA FETCHING & FILTERING ---

$allStores = fetchFSCollection($projectId, "coupons", 50);
$lang = 'ko';

$filteredStores = [];
foreach ($allStores as $s) {
    if ($filter === 'ALL') {
        $filteredStores[] = $s;
    } else {
        $category = (string)getVal($s, 'category', $lang);
        $location = (string)getVal($s, 'location', $lang);
        $name = (string)getVal($s, 'name', $lang);
        
        $match = false;
        
        // 1. 특수 카테고리 처리
        if ($filter === '맛점 & 한국식당') {
            if (strpos($category, '식당') !== false || strpos($category, '맛집') !== false || strpos($category, '한식') !== false) $match = true;
        } else if ($filter === '뷰티 & 마사지') {
            if (strpos($category, '마사지') !== false || strpos($category, '뷰티') !== false || strpos($category, 'SPA') !== false || strpos($category, '이발') !== false) $match = true;
        } else if ($filter === '숙소 & 호텔') {
            if (strpos($category, '호텔') !== false || strpos($category, '숙소') !== false || strpos($category, '풀빌라') !== false || strpos($category, '아파트') !== false) $match = true;
        } else {
            // 2. 일반 지역 또는 카테고리 검색
            if (strpos($category, $filter) !== false || strpos($location, $filter) !== false || strpos($name, $filter) !== false) {
                $match = true;
            }
        }
        
        if ($match) $filteredStores[] = $s;
    }
}

// --- SEO CONFIG ---
$seoTitle = ($filter !== 'ALL' ? "[{$filter}] " : "") . "베트남업소 할인정보 & 맛집 베스트 10 | 쿠퐁온라인 웹진";
$seoDesc = "베트남 {$filter} 정보를 찾으시나요? 호치민, 다낭, 나트랑, 푸꾸옥, 하노이의 맛집, 마사지, 식당 정보를 한눈에! 업소 할인 정보를 실시간으로 확인하세요.";
$seoKeywords = "베트남업소, 베트남맛집베스트10, 베트남마사지, 베트남식당, {$filter}, 호치민, 다낭, 나트랑, 호이안, 푸꾸옥, 하노이, 베트남업소 할인정보";
$ogImage = "{$scheme}://{$host}/index512.png";

?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $seoTitle; ?></title>
    <meta name="description" content="<?php echo $seoDesc; ?>">
    <meta name="keywords" content="<?php echo $seoKeywords; ?>">
    
    <!-- Open Graph -->
    <meta property="og:title" content="<?php echo $seoTitle; ?>">
    <meta property="og:description" content="<?php echo $seoDesc; ?>">
    <meta property="og:image" content="<?php echo $ogImage; ?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo "{$scheme}://{$host}/webzine.php" . ($filter !== 'ALL' ? "?filter=" . urlencode($filter) : ""); ?>">

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Outfit:wght@400;700;800&family=Nanum+Square+Neo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --color-primary: #a855f7;
            --color-secondary: #ec4899;
            --color-bg-base: #020617;
            --color-bg-elevated: #0f172a;
            --color-text-main: #f8fafc;
            --color-text-muted: #94a3b8;
            --color-accent: #3b82f6;
            --font-main: 'Outfit', 'Nanum Square Neo', sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: var(--color-bg-base);
            color: var(--color-text-main);
            font-family: var(--font-main);
            line-height: 1.6;
            overflow-x: hidden;
        }

        .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }

        /* HEADER */
        header {
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .logo {
            font-family: 'Montserrat', sans-serif;
            font-weight: 900;
            font-size: 1.5rem;
            background: linear-gradient(135deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-decoration: none;
        }

        /* HERO SECTION */
        .hero {
            padding: 60px 0 40px;
            text-align: center;
            background: radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
        }
        .hero-badge {
            display: inline-block;
            padding: 6px 16px;
            background: rgba(168, 85, 247, 0.2);
            color: var(--color-primary);
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 800;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .hero h1 {
            font-size: 2.8rem;
            font-weight: 800;
            margin-bottom: 15px;
            line-height: 1.1;
            letter-spacing: -2px;
        }
        .hero p {
            color: var(--color-text-muted);
            font-size: 1rem;
            max-width: 600px;
            margin: 0 auto;
        }

        /* WEBZINE GRID */
        .zine-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 25px;
            margin-bottom: 80px;
        }
        .zine-card {
            background: var(--color-bg-elevated);
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.05);
            transition: all 0.3s ease;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            display: flex;
            flex-direction: column;
        }
        .zine-card:hover {
            transform: translateY(-10px);
            border-color: var(--color-primary);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .zine-img {
            width: 100%;
            height: 200px;
            background-size: cover;
            background-position: center;
            position: relative;
        }
        .zine-category {
            position: absolute;
            top: 15px;
            left: 15px;
            padding: 4px 10px;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(5px);
            border-radius: 8px;
            font-size: 0.7rem;
            font-weight: 700;
            color: white;
        }
        .zine-content {
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .zine-location {
            font-size: 0.7rem;
            color: var(--color-primary);
            font-weight: 800;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .zine-title {
            font-size: 1.15rem;
            font-weight: 800;
            margin-bottom: 10px;
            line-height: 1.3;
        }
        .zine-slogan {
            font-size: 0.85rem;
            color: var(--color-text-muted);
            margin-bottom: 15px;
            flex: 1;
        }
        .zine-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        .zine-btn {
            padding: 7px 14px;
            background: var(--color-primary);
            color: white;
            border-radius: 10px;
            font-size: 0.75rem;
            font-weight: 800;
        }

        /* FILTERS */
        .filter-bar {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 15px 0 25px;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .filter-bar::-webkit-scrollbar { display: none; }
        .filter-tag {
            padding: 8px 18px;
            background: var(--color-bg-elevated);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 700;
            white-space: nowrap;
            color: var(--color-text-muted);
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
        }
        .filter-tag:hover {
            border-color: var(--color-primary);
            color: var(--color-text-main);
        }
        .filter-tag.active {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
            box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
        }

        /* SEO CONTENT BLOCK */
        .seo-content {
            padding: 60px 0;
            border-top: 1px solid rgba(255,255,255,0.05);
            color: var(--color-text-muted);
            font-size: 0.9rem;
        }
        .seo-content h2 { color: white; margin-bottom: 15px; font-size: 1.4rem; }
        .seo-content p { margin-bottom: 12px; }

        /* FOOTER */
        footer {
            padding: 50px 0;
            background: #020617;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer-logo { margin-bottom: 15px; display: inline-block; }
        .footer-copy { font-size: 0.75rem; color: #475569; }

        /* VISITOR BAR */
        .visitor-bar {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(12px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 15px 0;
            position: sticky;
            bottom: 0;
            z-index: 999;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
        }
        .visitor-stats {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 40px;
        }
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }
        .stat-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--color-text-muted);
            font-weight: 800;
        }
        .stat-value {
            font-size: 1.1rem;
            font-weight: 900;
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-family: 'Montserrat', sans-serif;
            text-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
            animation: pulse 2s infinite alternate;
        }
        @keyframes pulse {
            from { opacity: 0.8; transform: scale(1); }
            to { opacity: 1; transform: scale(1.05); }
        }

        @media (max-width: 600px) {
            .hero h1 { font-size: 2rem; }
            .zine-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .zine-content { padding: 15px; }
            .zine-title { font-size: 1rem; }
            .zine-img { height: 160px; }
            .visitor-stats { gap: 20px; }
            .stat-value { font-size: 1rem; }
        }
    </style>
</head>
<body>

    <header>
        <div class="container" style="display: flex; width: 100%; justify-content: space-between; align-items: center;">
            <a href="/" class="logo">COUPONG</a>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted);">WEBZINE Vol.01</div>
        </div>
    </header>

    <div class="hero">
        <div class="container">
            <span class="hero-badge">베트남업소 할인정보</span>
            <h1><?php echo $filter === 'ALL' ? '베트남 생활 & 여행' : $filter; ?><br>프리미엄 로컬 가이드</h1>
            <p><?php echo $filter === 'ALL' ? '호치민, 다낭, 하노이 등 베트남 전역' : $filter; ?>의 엄선된 맛집과 실시간 할인 혜택을 만나보세요.</p>
        </div>
    </div>

    <div class="container">
        <div class="filter-bar">
            <?php 
            $tags = ['ALL', '맛점 & 한국식당', '뷰티 & 마사지', '숙소 & 호텔', '호치민', '다낭', '하노이', '나트랑', '푸꾸옥'];
            foreach ($tags as $tag) {
                $isActive = ($filter === $tag) ? 'active' : '';
                $url = "webzine.php" . ($tag === 'ALL' ? "" : "?filter=" . urlencode($tag));
                echo "<a href='{$url}' class='filter-tag {$isActive}'>{$tag}</a>";
            }
            ?>
        </div>

        <?php if (empty($filteredStores)): ?>
            <div style="padding: 100px 0; text-align: center; color: var(--color-text-muted);">
                <p>해당 카테고리의 업소가 아직 등록되지 않았습니다.</p>
                <a href="webzine.php" style="color: var(--color-primary); margin-top: 20px; display: inline-block;">전체 보기</a>
            </div>
        <?php else: ?>
            <div class="zine-grid">
                <?php foreach ($filteredStores as $s): 
                    $id = basename($s['name']);
                    $name = getVal($s, 'name', $lang);
                    $slogan = getVal($s, 'slogan', $lang);
                    $category = getVal($s, 'category', $lang);
                    $location = getVal($s, 'location', $lang);
                    $img = getRawVal($s, ['image', 'mainImage', 'gallery', 'shareThumbnail'], $lang, true);
                    if ($img) $img = optimizeGoogleUrl($img);
                    else $img = "share512.png";
                ?>
                <a href="/store/<?php echo $id; ?>" class="zine-card">
                    <div class="zine-img" style="background-image: url('<?php echo $img; ?>')">
                        <span class="zine-category"><?php echo $category; ?></span>
                    </div>
                    <div class="zine-content">
                        <div class="zine-location">📍 <?php echo $location; ?></div>
                        <h2 class="zine-title"><?php echo $name; ?></h2>
                        <p class="zine-slogan"><?php echo $slogan; ?></p>
                        <div class="zine-footer">
                            <span style="font-size: 0.7rem; color: var(--color-primary); font-weight: 800;">DISCOUNT READY</span>
                            <div class="zine-btn">쿠폰 받기</div>
                        </div>
                    </div>
                </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <section class="seo-content">
            <h2>베트남 최고의 현지 파트너, 쿠퐁온라인 웹진</h2>
            <p>베트남업소 정보를 찾고 계신가요? 쿠퐁온라인은 베트남 맛집 베스트 10 정보부터 베트남 마사지, 한식당, 로컬 식당까지 가장 신뢰할 수 있는 정보를 제공합니다. 호치민, 다낭, 나트랑, 호이안, 푸꾸옥, 하노이 등 베트남 주요 관광 도시와 거주 지역의 모든 업소 정보를 실시간으로 업데이트하고 있습니다.</p>
            <p>베트남 생활이 더 즐거워지는 베트남 생활 꿀팁부터, 완벽한 베트남 여행을 위한 코스 추천, 그리고 베트남 골프 여행객들을 위한 주변 맛집 정보까지! 특히 저희가 엄선한 베트남 업소 할인 정보를 통해 현지에서의 경험을 더욱 경제적이고 풍성하게 만들어 보세요.</p>
            <p>본 플랫폼은 검색 엔진 최적화(SEO)를 통해 더 많은 분이 베트남의 좋은 업소를 발견할 수 있도록 돕고 있습니다. 베트남 여행의 필수앱, 쿠퐁온라인과 함께 스마트한 로컬 라이프를 즐기시길 바랍니다.</p>
        </section>
    </div>

    <div class="visitor-bar">
        <div class="container">
            <div class="visitor-stats">
                <div class="stat-item">
                    <span class="stat-label">TODAY VISITORS</span>
                    <span class="stat-value"><?php echo number_format($stats['today']); ?></span>
                </div>
                <div style="width: 1px; height: 25px; background: rgba(255,255,255,0.1);"></div>
                <div class="stat-item">
                    <span class="stat-label">TOTAL VISITORS</span>
                    <span class="stat-value"><?php echo number_format($stats['total']); ?></span>
                </div>
            </div>
        </div>
    </div>

    <footer>
        <div class="container">
            <div class="logo footer-logo">COUPONG</div>
            <p style="margin-bottom: 20px; color: var(--color-text-muted); font-size: 0.85rem;">베트남 전역 업소 정보 및 할인 쿠폰 서비스</p>
            <div class="footer-copy">&copy; 2024 COUPONG ONLINE. All rights reserved.</div>
        </div>
    </footer>

</body>
</html>
