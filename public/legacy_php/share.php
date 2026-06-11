<?php
/**
 * Ultra-Robust Redirect Bridge (V8)
 * Smart detection: Checks BOTH coupons and shared_coupons if type is missing.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

function fetchFS($projectId, $col, $docId) {
    if (!$docId) return null;
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/{$col}/{$docId}";
    $ctx = stream_context_create(["http" => ["method" => "GET", "timeout" => 5, "ignore_errors" => true]]);
    $res = @file_get_contents($url, false, $ctx);
    if (!$res) return null;
    $data = json_decode($res, true);
    return (isset($data['fields']) && !isset($data['error'])) ? $data : null;
}

// 데이터 추출 핵심 함수 (가공되지 않은 원본값 혹은 배열의 첫 항목)
function getRawVal($doc, $keys, $preferredLang = 'ko', $returnFirstIfArray = true)
{
    if (!is_array($keys))
        $keys = [$keys];
    foreach ($keys as $k) {
        $f = $doc['fields'][$k] ?? null;
        if (!$f)
            continue;

        // 1. 단순 문자열인 경우
        if (isset($f['stringValue'])) {
            $val = $f['stringValue'];
            // JSON 문자열인 경우 파싱 시도
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

        // 2. 배열(arrayValue)인 경우
        if (isset($f['arrayValue']['values']) && count($f['arrayValue']['values']) > 0) {
            if ($returnFirstIfArray) {
                $first = $f['arrayValue']['values'][0];
                return $first['stringValue'] ?? '';
            }
            // 배열 전체를 반환해야 하는 경우
            $arr = [];
            foreach ($f['arrayValue']['values'] as $v) {
                if (isset($v['stringValue'])) $arr[] = $v['stringValue'];
            }
            return $arr;
        }

        // 3. 맵(mapValue)인 경우 (다국어 혹은 URL 객체)
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

// Google Hosted Image URL 최적화 헬퍼
function optimizeGoogleUrl($url) {
    if (strpos($url, 'lh3.googleusercontent.com') !== false) {
        $paramPos = strrpos($url, '=s');
        $baseUrl = ($paramPos !== false) ? substr($url, 0, $paramPos) : explode('=', $url)[0];
        return $baseUrl . "=s1000-w1000-h1000-rw";
    }
    return $url;
}
$projectId = "coupong-98b03";
$id = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['id'] ?? '');
$type = preg_replace('/[^a-z0-9]/', '', $_GET['type'] ?? '');

$scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$base = dirname($_SERVER['REQUEST_URI']);
if ($base === '/' || $base === '\\') $base = '';
$base = preg_replace('/\/public$/', '', $base);

// 1. SMART DETECTION: If type is missing, check 'coupons' first
if (!$type || $type === 'store') {
    $doc = fetchFS($projectId, "coupons", $id);
    if ($doc) {
        $type = 'store';
    } else if (!$type) {
        $type = 'coupon'; // Fallback
    }
}

// 2. FINAL ROUTING
if ($type === 'store') {
    $redirectUrl = "{$scheme}://{$host}{$base}/store/{$id}";
} else {
    $redirectUrl = "{$scheme}://{$host}{$base}/coupon/share2/{$id}";
}

// 3. SEO & META (기본값 설정)
$ogTitle = "🎁 특별한 쿠폰 선물이 도착했습니다! 🎁";
$ogDesc = "쿠퐁온라인에서 전하는 특별한 혜택을 지금 확인해보세요.";
$ogImage = "{$scheme}://{$host}{$base}/share512.png";

if ($id) {
    $targetCol = ($type === 'store') ? 'coupons' : 'shared_coupons';
    $doc = fetchFS($projectId, $targetCol, $id);
    
    if ($doc) {
        if ($type === 'store') {
            $name = getVal($doc, 'name');
            $slogan = getVal($doc, 'slogan');
            $location = getVal($doc, 'location');
            $category = getVal($doc, 'category');
            if ($name) {
                $locationPrefix = $location ? "{$location} " : "";
                $ogTitle = "{$locationPrefix}[{$name}] | 할인쿠폰 받으세요";
                $ogDesc = "{$slogan} {$name}에 가실때는 꼭 쿠폰을 챙기세요~!";
            }
            if ($slogan && !$name) $ogDesc = $slogan; 
            $img = getRawVal($doc, ['shareThumbnail', 'image', 'mainImage', 'gallery', 'images'], 'ko', true);
            if ($img && is_string($img)) {
                $img = optimizeGoogleUrl($img);
                $ogImage = (strpos($img, 'http') === 0) ? $img : "{$scheme}://{$host}" . (strpos($img, '/') === 0 ? '' : '/') . $img;
            }
        } else {
            // Shared Coupon logic
            $storeId = getVal($doc, "storeId");
            // If storeId is missing in root, check mapValue/fields (Firestore structure nuance)
            if (!$storeId && isset($doc['fields']['storeId']['stringValue'])) {
                $storeId = $doc['fields']['storeId']['stringValue'];
            }
            
            if ($storeId) {
                // 1순위: 공유 데이터(shared_coupons)에 직접 저장된 업체 정보 확인 (V9 Snapshot)
                $fixedName = getVal($doc, "storeName");
                $fixedThumb = getVal($doc, "storeThumbnail");
                $fixedSlogan = getVal($doc, "storeSlogan");

                // 상세 내용 요약 가져오기
                $sDoc = fetchFS($projectId, "coupons", $storeId);
                $storeDescSummary = "";
                if ($sDoc) {
                    $descRaw = getRawVal($sDoc, ['storeDescription', 'description', 'content', 'body'], 'ko', true);
                    if ($descRaw && is_string($descRaw)) {
                        $cleanDesc = preg_replace('/\[img\d+\]|cp\[[^\]]+\]|\[cp\]|bt\[[^\]]+\]|\[map\]|map\[[^\]]+\]/i', '', $descRaw);
                        $cleanDesc = trim(strip_tags($cleanDesc));
                        if ($cleanDesc) {
                            $storeDescSummary = mb_substr($cleanDesc, 0, 15, 'UTF-8') . "...";
                        }
                    }
                }

                if ($fixedName) {
                    $ogTitle = "할인쿠폰도착 [{$fixedName}]";
                    
                    $descParts = [];
                    if ($fixedSlogan) $descParts[] = $fixedSlogan;
                    if ($storeDescSummary) $descParts[] = $storeDescSummary;
                    
                    $ogDesc = implode(" | ", $descParts);
                    if (empty($ogDesc)) {
                        $ogDesc = "쿠퐁온라인에서 특별한 할인 혜택을 확인하세요!";
                    } else {
                        $ogDesc .= " - 쿠퐁온라인에서 확인하세요!";
                    }

                    if ($shareMemo) {
                        $ogDesc = $shareMemo;
                    }
                    
                    if ($fixedThumb) {
                        $fixedThumb = optimizeGoogleUrl($fixedThumb);
                        $ogImage = (strpos($fixedThumb, 'http') === 0) ? $fixedThumb : "{$scheme}://{$host}" . (strpos($fixedThumb, '/') === 0 ? '' : '/') . $fixedThumb;
                    }
                } else {
                    // 2순위: Fallback (기존 방식 - storeId로 업체 재조회)
                    if ($sDoc) {
                        $name = getVal($sDoc, "name");
                        $slogan = getVal($sDoc, "slogan");
                        $location = getVal($sDoc, "location");
                        
                        if ($name) {
                            $ogTitle = "할인쿠폰도착 [{$name}]";
                            
                            $descParts = [];
                            if ($slogan) $descParts[] = $slogan;
                            if ($storeDescSummary) $descParts[] = $storeDescSummary;
                            
                            $ogDesc = implode(" | ", $descParts);
                            if (empty($ogDesc)) {
                                $ogDesc = "쿠퐁온라인에서 특별한 할인 혜택을 확인하세요!";
                            } else {
                                $ogDesc .= " - 쿠퐁온라인에서 확인하세요!";
                            }
                        }
                        
                        $img = getRawVal($sDoc, ["shareThumbnail", "image", "mainImage", "gallery", "images"], 'ko', true);
                        if ($img && is_string($img)) {
                            $img = optimizeGoogleUrl($img);
                            $ogImage = (strpos($img, 'http') === 0) ? $img : "{$scheme}://{$host}" . (strpos($img, '/') === 0 ? '' : '/') . $img;
                        }
                    }
                }
            }
            
            // 공유 메시지가 있다면 설명에 추가
            $memo = getVal($doc, "shareMemo");
            if ($memo) {
                $ogDesc = "🎁 {$memo} \n" . $ogDesc;
            }
        }
    }
}

// Preserve other params
$q = $_GET; unset($q['id'], $q['type']);
if (!empty($q)) $redirectUrl .= (strpos($redirectUrl, '?') === false ? '?' : '&') . http_build_query($q);

?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-NL96FZKT');</script>
    <!-- End Google Tag Manager -->
    <title><?php echo $ogTitle; ?></title>
    <meta property="og:type" content="website" />
    <meta property="og:url" content="<?php echo $redirectUrl; ?>" />
    <meta property="og:title" content="<?php echo $ogTitle; ?>" />
    <meta property="og:description" content="<?php echo $ogDesc; ?>" />
    <meta property="og:image" content="<?php echo $ogImage; ?>" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?php echo $ogTitle; ?>" />
    <meta name="twitter:description" content="<?php echo $ogDesc; ?>" />
    <meta name="twitter:image" content="<?php echo $ogImage; ?>" />
    <script>window.location.replace("<?php echo $redirectUrl; ?>");</script>
</head>
<body style="background:#f8fafc; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; font-family:sans-serif;">
    <p>쿠퐁온라인으로 이동 중입니다...</p>
</body>
</html>
