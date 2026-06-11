<?php
/**
 * Dynamic Sitemap Generator (V3) - Ultra Robust
 */

// 모든 에러 보고 끄고 로깅만 수행 (혹은 완전히 끔)
error_reporting(0);
ini_set('display_errors', 0);

// XML 출력 전 공백 차단
ob_start();

function fetchFSList($projectId, $col) {
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/{$col}?pageSize=1000";
    $res = null;

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 타임아웃 넉넉히
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(["http" => ["method" => "GET", "timeout" => 10, "ignore_errors" => true]]);
        $res = @file_get_contents($url, false, $ctx);
    }

    if (!$res) return [];
    $data = json_decode($res, true);
    return (isset($data['documents']) && is_array($data['documents'])) ? $data['documents'] : [];
}

$projectId = "coupong-98b03";

// 1. 사이트 URL 계산
$scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$siteUrl = "{$scheme}://{$host}"; // 루트 설치 시 최적화
$siteUrl = rtrim($siteUrl, '/');

// XML 출력 시작
header('Content-Type: application/xml; charset=utf-8');
echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;

// 2. 고정 페이지 목록
$staticPages = [
    '' => ['freq' => 'daily', 'prio' => '1.0'],
    '/service-intro' => ['freq' => 'weekly', 'prio' => '0.9'],
    '/community' => ['freq' => 'daily', 'prio' => '0.8'],
    '/stores' => ['freq' => 'daily', 'prio' => '0.8'],
    '/market' => ['freq' => 'daily', 'prio' => '0.8'],
    '/partner-apply' => ['freq' => 'monthly', 'prio' => '0.7'],
    '/terms' => ['freq' => 'yearly', 'prio' => '0.3'],
    '/privacy' => ['freq' => 'yearly', 'prio' => '0.3'],
];

foreach ($staticPages as $path => $meta) {
    echo "  <url>" . PHP_EOL;
    echo "    <loc>" . $siteUrl . $path . "</loc>" . PHP_EOL;
    echo "    <changefreq>" . $meta['freq'] . "</changefreq>" . PHP_EOL;
    echo "    <priority>" . $meta['prio'] . "</priority>" . PHP_EOL;
    echo "  </url>" . PHP_EOL;
}

// 3. 프로모션 페이지
$promos = ['free-coupon', 'vietnam-hot-deal', 'qr-payment', 'community-guide', 'promotion-strategy'];
foreach ($promos as $id) {
    echo "  <url>" . PHP_EOL;
    echo "    <loc>" . $siteUrl . "/promo/" . $id . "</loc>" . PHP_EOL;
    echo "    <changefreq>weekly</changefreq>" . PHP_EOL;
    echo "    <priority>0.8</priority>" . PHP_EOL;
    echo "  </url>" . PHP_EOL;
}

// 4. 도시별 SEO 랜딩 페이지
$seoCities = ['hcm', 'danang', 'nhatrang', 'phuquoc', 'hanoi', 'vungtau'];
foreach ($seoCities as $city) {
    echo "  <url>" . PHP_EOL;
    echo "    <loc>" . $siteUrl . "/seo/" . $city . "</loc>" . PHP_EOL;
    echo "    <changefreq>weekly</changefreq>" . PHP_EOL;
    echo "    <priority>0.9</priority>" . PHP_EOL;
    echo "  </url>" . PHP_EOL;
}

// 4. 동적 데이터 (업소 및 게시글)
$collections = [
    'stores' => ['path' => '/store/', 'freq' => 'weekly', 'prio' => '0.9'],
    'coupons' => ['path' => '/store/', 'freq' => 'weekly', 'prio' => '0.8'],
    'promo_posts' => ['path' => '/promo/', 'freq' => 'daily', 'prio' => '0.9'],
    'market_posts' => ['path' => '/market/', 'freq' => 'daily', 'prio' => '0.7']
];

foreach ($collections as $colName => $cfg) {
    $docs = fetchFSList($projectId, $colName);
    foreach ($docs as $doc) {
        if (!isset($doc['name'])) continue;
        
        // 문서 ID 추출
        $parts = explode('/', $doc['name']);
        $docId = end($parts);
        if (!$docId) continue;

        // 슬러그(slug) 필드가 있으면 슬러그를 사용, 없으면 ID 사용
        $urlSlug = $docId;
        if (isset($doc['fields']['slug']['stringValue'])) {
            $urlSlug = urlencode($doc['fields']['slug']['stringValue']);
        }
        
        echo "  <url>" . PHP_EOL;
        echo "    <loc>" . $siteUrl . $cfg['path'] . $urlSlug . "</loc>" . PHP_EOL;
        if (isset($doc['updateTime'])) {
            $lastmod = date('Y-m-d', strtotime($doc['updateTime']));
            echo "    <lastmod>" . $lastmod . "</lastmod>" . PHP_EOL;
        }
        echo "    <changefreq>" . $cfg['freq'] . "</changefreq>" . PHP_EOL;
        echo "    <priority>" . $cfg['prio'] . "</priority>" . PHP_EOL;
        echo "  </url>" . PHP_EOL;
    }
}

echo '</urlset>';

// 출력값 정리 및 내보냄
$output = ob_get_clean();
echo trim($output);
?>
