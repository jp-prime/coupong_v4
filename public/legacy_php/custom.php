<?php
/**
 * Manual/Custom URL Sharing Bridge
 * Allows setting manual Title, Description, and Image for any URL.
 */

header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Parameters
$id = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['id'] ?? '');

$title = $_GET['t'] ?? '';
$desc = $_GET['d'] ?? '';
$image = $_GET['i'] ?? '';
$url = $_GET['u'] ?? '/'; // Default to home

$projectId = "coupong-98b03";

function fetchFS($projectId, $col, $docId) {
    if (!$docId) return null;
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/{$col}/{$docId}";
    $ctx = stream_context_create(["http" => ["method" => "GET", "timeout" => 5, "ignore_errors" => true]]);
    $res = @file_get_contents($url, false, $ctx);
    if (!$res) return null;
    $data = json_decode($res, true);
    return (isset($data['fields']) && !isset($data['error'])) ? $data : null;
}

// If ID provided, fetch from Firestore
if ($id) {
    $doc = fetchFS($projectId, 'custom_shares', $id);
    if ($doc) {
        $fields = $doc['fields'];
        $title = $fields['title']['stringValue'] ?? $title;
        $desc = $fields['desc']['stringValue'] ?? $desc;
        $image = $fields['image']['stringValue'] ?? $image;
        $url = $fields['url']['stringValue'] ?? $url;
    }
}

// Fallbacks if empty
if (empty($title)) $title = '쿠퐁온라인 - 베트남 생활의 프리미엄 파트너';
if (empty($desc)) $desc = '호치민, 다낭 등 베트남 전역의 맛집, 뷰티, 쇼핑 할인 정보를 확인하세요.';

// Protocol/Host info
$scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];

// Image fallback logic
if (empty($image)) {
    $image = "{$scheme}://{$host}/share512.png";
} else if (strpos($image, 'http') !== 0) {
    // If it's a relative path, prepend host
    $image = "{$scheme}://{$host}" . (strpos($image, '/') === 0 ? '' : '/') . $image;
}

// Redirect URL logic
$redirectUrl = $url;
if (strpos($url, 'http') !== 0) {
    // If it's a relative path (starts with /), prepend host
    $redirectUrl = "{$scheme}://{$host}" . (strpos($url, '/') === 0 ? '' : '/') . $url;
}

// Security: escaping for HTML
$safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
$safeDesc = htmlspecialchars($desc, ENT_QUOTES, 'UTF-8');
$safeImage = htmlspecialchars($image, ENT_QUOTES, 'UTF-8');
$safeUrl = htmlspecialchars($redirectUrl, ENT_QUOTES, 'UTF-8');

?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <title><?php echo $safeTitle; ?></title>
    
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="<?php echo $safeUrl; ?>" />
    <meta property="og:title" content="<?php echo $safeTitle; ?>" />
    <meta property="og:description" content="<?php echo $safeDesc; ?>" />
    <meta property="og:image" content="<?php echo $safeImage; ?>" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?php echo $safeTitle; ?>" />
    <meta name="twitter:description" content="<?php echo $safeDesc; ?>" />
    <meta name="twitter:image" content="<?php echo $safeImage; ?>" />

    <!-- Redirection -->
    <script>window.location.replace("<?php echo $safeUrl; ?>");</script>
</head>
<body style="background:#0f172a; color:#f8fafc; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; margin:0; font-family:sans-serif; text-align:center;">
    <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(10px);">
        <p style="margin-bottom: 20px; font-weight: 700;">쿠퐁온라인 연결 중...</p>
        <div style="width: 40px; height: 40px; border: 4px solid rgba(168, 85, 247, 0.2); border-top-color: #a855f7; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        <p style="margin-top: 20px; font-size: 0.8rem; color: #94a3b8;">잠시만 기다려주세요.</p>
    </div>
</body>
</html>
