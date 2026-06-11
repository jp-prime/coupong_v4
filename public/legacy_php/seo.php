<?php
/**
 * SEO Dynamic Rendering Bridge
 * 
 * 구글봇이나 네이버 예티 같은 검색 엔진 크롤러가 사이트에 접속할 때,
 * React(SPA)의 빈 껍데기가 아닌 텍스트 정보가 가득한 HTML을 제공하기 위해 사용됩니다.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

// 접근 로그 기록 (디버깅용)
$log = date('[Y-m-d H:i:s] ') . $_SERVER['REQUEST_URI'] . " | " . $_SERVER['HTTP_USER_AGENT'] . "\n";
@file_put_contents(__DIR__ . '/seo_access_log.txt', $log, FILE_APPEND);

function fetchFS($projectId, $col, $docId)
{
    if (!$docId)
        return null;
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/{$col}/" . rawurlencode($docId);
    $ctx = stream_context_create(["http" => ["method" => "GET", "timeout" => 5, "ignore_errors" => true]]);
    $res = @file_get_contents($url, false, $ctx);
    if (!$res)
        return null;
    $data = json_decode($res, true);
    return (isset($data['fields']) && !isset($data['error'])) ? $data : null;
}

/**
 * ✅ [New] Slug 기반 Firestore 데이터 조회 (REST Query)
 */
function fetchFSBySlug($projectId, $col, $slug)
{
    if (!$slug) return null;
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents:runQuery";
    $query = [
        'structuredQuery' => [
            'from' => [['collectionId' => $col]],
            'where' => [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'slug'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => $slug]
                ]
            ],
            'limit' => 1
        ]
    ];
    $ctx = stream_context_create([
        "http" => [
            "method" => "POST",
            "header" => "Content-Type: application/json\r\n",
            "content" => json_encode($query),
            "timeout" => 5,
            "ignore_errors" => true
        ]
    ]);
    $res = @file_get_contents($url, false, $ctx);
    if (!$res) return null;
    $data = json_decode($res, true);
    // runQuery 결과는 배열이며, 첫 번째 항목의 'document'를 사용
    if (isset($data[0]['document']['fields'])) return $data[0]['document'];
    return null;
}

/**
 * ✅ [New] Sanity REST API를 사용한 스토어 조회
 */
function fetchSanityStore($projectId, $dataset, $idOrSlug)
{
    if (!$idOrSlug) return null;
    
    $escaped = str_replace('"', '\\"', $idOrSlug);
    $query = '*[_type == "store" && (_id == "' . $escaped . '" || slug.current == "' . $escaped . '" || firestoreId == "' . $escaped . '")][0]{
        _id,
        firestoreId,
        name,
        nameVi,
        nameEn,
        category,
        slogan,
        sloganVi,
        sloganEn,
        phone,
        location,
        locationVi,
        locationEn,
        description,
        descriptionVi,
        descriptionEn,
        "images": images[].asset->url
    }';
    
    $url = "https://{$projectId}.api.sanity.io/v2023-05-03/data/query/{$dataset}?query=" . urlencode($query);
    
    $ctx = stream_context_create([
        "http" => [
            "method" => "GET",
            "timeout" => 5,
            "ignore_errors" => true
        ]
    ]);
    
    $res = @file_get_contents($url, false, $ctx);
    if (!$res) return null;
    
    $data = json_decode($res, true);
    if (isset($data['result']) && !empty($data['result'])) {
        return $data['result'];
    }
    return null;
}

/**
 * ✅ [New] Sanity 데이터를 기존 Firestore 다큐먼트 형식으로 매핑
 */
function mapSanityToFirestoreLike($sanityDoc)
{
    if (!$sanityDoc) return null;
    
    $fields = [];
    
    $simpleStringFields = [
        '_id' => 'id',
        'category' => 'category',
        'phone' => 'phone',
        'businessHours' => 'businessHours',
        'googleMapUrl' => 'googleMapUrl',
    ];
    foreach ($simpleStringFields as $sKey => $fKey) {
        if (isset($sanityDoc[$sKey])) {
            $fields[$fKey] = ['stringValue' => $sanityDoc[$sKey]];
        }
    }
    
    $langFields = [
        'name' => ['name', 'nameVi', 'nameEn'],
        'slogan' => ['slogan', 'sloganVi', 'sloganEn'],
        'location' => ['location', 'locationVi', 'locationEn'],
        'description' => ['description', 'descriptionVi', 'descriptionEn'],
        'storeDescription' => ['description', 'descriptionVi', 'descriptionEn'],
    ];
    
    foreach ($langFields as $fKey => $sKeys) {
        $fields[$fKey] = [
            'mapValue' => [
                'fields' => [
                    'ko' => ['stringValue' => $sanityDoc[$sKeys[0]] ?? ''],
                    'vi' => ['stringValue' => $sanityDoc[$sKeys[1]] ?? $sanityDoc[$sKeys[0]] ?? ''],
                    'en' => ['stringValue' => $sanityDoc[$sKeys[2]] ?? $sanityDoc[$sKeys[0]] ?? '']
                ]
            ]
        ];
    }
    
    if (isset($sanityDoc['images']) && is_array($sanityDoc['images'])) {
        $imgValues = [];
        foreach ($sanityDoc['images'] as $imgUrl) {
            $imgValues[] = ['stringValue' => $imgUrl];
        }
        $fields['gallery'] = [
            'arrayValue' => [
                'values' => $imgValues
            ]
        ];
        if (count($imgValues) > 0) {
            $fields['thumbnail'] = ['stringValue' => $sanityDoc['images'][0]];
            $fields['image'] = ['stringValue' => $sanityDoc['images'][0]];
        }
    }
    
    return [
        'name' => $sanityDoc['_id'],
        'fields' => $fields
    ];
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
            // 배열 전체를 반환해야 하는 경우 (예: gallery 이미지 추출용)
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

// 기존 인터페이스 유지 (HTML 이스케이프 적용)
function getVal($doc, $keys, $preferredLang = 'ko')
{
    $val = getRawVal($doc, $keys, $preferredLang, true);
    return is_string($val) ? htmlspecialchars($val, ENT_QUOTES, 'UTF-8') : '';
}

// Google Hosted Image URL 최적화 헬퍼 (s1000-w1000-h1000-rw 강제 적용)
function optimizeGoogleUrl($url)
{
    if (strpos($url, 'lh3.googleusercontent.com') !== false) {
        $paramPos = strrpos($url, '=s');
        $baseUrl = ($paramPos !== false) ? substr($url, 0, $paramPos) : explode('=', $url)[0];
        return $baseUrl . "=s1000-w1000-h1000-rw";
    }
    return $url;
}

// 갤러리 이미지 데이터 파싱 헬퍼
function getGalleryImages($doc)
{
    // 원본 데이터를 가져옴 (파싱하지 않음)
    $galleryRaw = getRawVal($doc, 'gallery', 'ko', false);
    $images = [];

    if (is_array($galleryRaw)) {
        // Firestore ArrayValue인 경우
        foreach ($galleryRaw as $img) {
            $images[] = htmlspecialchars($img, ENT_QUOTES, 'UTF-8');
        }
    } elseif ($galleryRaw) {
        // JSON 문자열이거나 콤마 구분자 문자열인 경우
        if (strpos(trim($galleryRaw), '[') === 0) {
            $parsed = json_decode($galleryRaw, true);
            if (is_array($parsed)) {
                foreach ($parsed as $item) {
                    if (is_string($item)) $images[] = htmlspecialchars($item, ENT_QUOTES, 'UTF-8');
                    else if (isset($item['url'])) $images[] = htmlspecialchars($item['url'], ENT_QUOTES, 'UTF-8');
                }
            }
        } else {
            $parts = explode(',', $galleryRaw);
            foreach ($parts as $p) {
                if (trim($p)) $images[] = htmlspecialchars(trim($p), ENT_QUOTES, 'UTF-8');
            }
        }
    }
    return $images;
}

$projectId = "coupong-98b03";
$rawId = $_GET['id'] ?? ''; // 한글 슬러그 허용
$id = htmlspecialchars($rawId, ENT_QUOTES, 'UTF-8');
$type = $_GET['type'] ?? 'store';

$scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$requestUri = $_SERVER['REQUEST_URI'];

// 1. Legacy PHP 301 Redirect Logic (기존 PHP 주소 대응)
if (strpos($requestUri, 'store.php') !== false || strpos($requestUri, 'view.php') !== false) {
    if ($id) {
        header("HTTP/1.1 301 Moved Permanently");
        header("Location: {$scheme}://{$host}/store/{$id}");
        exit();
    }
}

// 2. 데이터 조회 로직 (Type에 따라 분기)
$doc = null;
if ($type === 'go') {
    // 슬러그로 상점 조회 (Firestore Query) - 양쪽 컬렉션 모두 시도
    foreach (['stores', 'coupons'] as $colName) {
        $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents:runQuery";
        $query = [
            "structuredQuery" => [
                "from" => [["collectionId" => $colName]],
                "where" => [
                    "fieldFilter" => [
                        "field" => ["fieldPath" => "slug"],
                        "op" => "EQUAL",
                        "value" => ["stringValue" => $rawId]
                    ]
                ],
                "limit" => 1
            ]
        ];
        $ctx = stream_context_create([
            "http" => [
                "method" => "POST",
                "header" => "Content-Type: application/json\r\n",
                "content" => json_encode($query),
                "timeout" => 5
            ]
        ]);
        $res = @file_get_contents($url, false, $ctx);
        if ($res) {
            $data = json_decode($res, true);
            if (isset($data[0]['document'])) {
                $doc = $data[0]['document'];
                $type = 'store';
                break;
            }
        }
    }
} else if ($type === 'promo') {
    // 프로모션 조회
    $doc = fetchFS($projectId, "promo_posts", $rawId);
    if (!$doc) {
        // 슬러그로 프로모션 조회 시도
        $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents:runQuery";
        $query = [
            "structuredQuery" => [
                "from" => [["collectionId" => "promo_posts"]],
                "where" => [
                    "fieldFilter" => [
                        "field" => ["fieldPath" => "slug"],
                        "op" => "EQUAL",
                        "value" => ["stringValue" => $rawId]
                    ]
                ],
                "limit" => 1
            ]
        ];
        $ctx = stream_context_create([
            "http" => [
                "method" => "POST",
                "header" => "Content-Type: application/json\r\n",
                "content" => json_encode($query),
                "timeout" => 5
            ]
        ]);
        $res = @file_get_contents($url, false, $ctx);
        if ($res) {
            $data = json_decode($res, true);
            if (isset($data[0]['document'])) {
                $doc = $data[0]['document'];
            }
        }
    }
} else if ($type === 'board') {
    // 게시판 조회
    $doc = fetchFS($projectId, "board_posts", $rawId);
    if (!$doc) {
        // 슬러그로 게시판 조회 시도
        $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents:runQuery";
        $query = [
            "structuredQuery" => [
                "from" => [["collectionId" => "board_posts"]],
                "where" => [
                    "fieldFilter" => [
                        "field" => ["fieldPath" => "slug"],
                        "op" => "EQUAL",
                        "value" => ["stringValue" => $rawId]
                    ]
                ],
                "limit" => 1
            ]
        ];
        $ctx = stream_context_create([
            "http" => [
                "method" => "POST",
                "header" => "Content-Type: application/json\r\n",
                "content" => json_encode($query),
                "timeout" => 5
            ]
        ]);
        $res = @file_get_contents($url, false, $ctx);
        if ($res) {
            $data = json_decode($res, true);
            if (isset($data[0]['document'])) {
                $doc = $data[0]['document'];
            }
        }
    }
} else if ($type === 'promos' || $type === 'webzine') {
    // 홍보 게시판/웹진 리스트 조회 (최신순 20개)
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents:runQuery";
    $query = [
        "structuredQuery" => [
            "from" => [["collectionId" => "promo_posts"]],
            "orderBy" => [["field" => ["fieldPath" => "createdAt"], "direction" => "DESCENDING"]],
            "limit" => 20
        ]
    ];
    $ctx = stream_context_create([
        "http" => [
            "method" => "POST",
            "header" => "Content-Type: application/json\r\n",
            "content" => json_encode($query),
            "timeout" => 5
        ]
    ]);
    $res = @file_get_contents($url, false, $ctx);
    if ($res) {
        $data = json_decode($res, true);
        $posts = [];
        foreach ($data as $item) {
            if (isset($item['document'])) $posts[] = $item['document'];
        }
        $doc = ['list' => $posts]; // 리스트 모드 표시
    }
} else {
    // 기본 상점 조회 (stores 시도 후 없으면 coupons 시도)
    $doc = fetchFS($projectId, "stores", $rawId);
    if (!$doc) {
        $doc = fetchFS($projectId, "coupons", $rawId);
    }
    // ID 조회 실패 시, 등록된 슬러그(slug) 매칭으로 2차 조회 시도 (한국어/영어 슬러그 대응)
    if (!$doc) {
        $doc = fetchFSBySlug($projectId, "stores", $rawId);
    }
    if (!$doc) {
        $doc = fetchFSBySlug($projectId, "coupons", $rawId);
    }
    // 3차로 Sanity에서 조회 시도 (새니티 등록 상점 대응)
    if (!$doc) {
        $sanityDoc = fetchSanityStore("8xyje6wz", "production", $rawId);
        if ($sanityDoc) {
            $doc = mapSanityToFirestoreLike($sanityDoc);
        }
    }
}

// 기본값 설정 (에러 시나리오용)
$name = "쿠퐁온라인 (COUPONG ONLINE)";
$category = "베트남 업소 정보";
$location = "베트남";
$slogan = "베트남 현지 실시간 할인 혜택 및 QR코드 쿠폰 서비스";
$description = "베트남 호치민, 다낭, 하노이 등 주요 도시의 맛집, 한국 식당, 생활 서비스 정보를 확인하고 무료 할인 쿠폰을 받으세요.";
$phone = "";
$ogImage = "{$scheme}://{$host}{$base}/share512.png";

if ($doc) {
    // ✅ 언어 감지 로직 (URL 분석)
    $requestUri = $_SERVER['REQUEST_URI'];
    $currentLang = 'ko'; // 기본값
    if (strpos($requestUri, '/vi/') !== false)
        $currentLang = 'vi';
    else if (strpos($requestUri, '/en/') !== false)
        $currentLang = 'en';
    else if (strpos($requestUri, '/zh-CN/') !== false)
        $currentLang = 'zh-CN';

    $name = getVal($doc, ($type === 'promo' || $type === 'board' ? 'title' : 'name'), $currentLang);
    $category = getVal($doc, 'category', $currentLang);
    $location = getVal($doc, 'location', $currentLang);
    $slogan = getVal($doc, 'slogan', $currentLang);
    // 항상 Raw 값을 가져옴
    $description = getRawVal($doc, ($type === 'promo' || $type === 'board' ? ['content', 'description', 'summary'] : ['storeDescription', 'description', 'info']), $currentLang, true);
    $phone = getVal($doc, ['phone', 'phoneNumber'], $currentLang);

    // 이미지 처리 (Raw 값을 가져와서 작업)
    $img = getRawVal($doc, ['thumbnail', 'shareThumbnail', 'image', 'mainImage', 'gallery', 'images'], $currentLang, true);
    if ($img && is_string($img)) {
        $img = optimizeGoogleUrl($img);
        $ogImage = (strpos($img, 'http') === 0) ? $img : "{$scheme}://{$host}" . (strpos($img, '/') === 0 ? '' : '/') . $img;
    }
}

$locationPrefix = $location ? "{$location} " : "";

// ✅ 언어별 SEO 템플릿 설정
if ($currentLang === 'vi') {
    $pageTitle = "{$locationPrefix}[{$name}] | Nhà hàng Hàn Quốc, Địa điểm tham quan tại Việt Nam";
    $ogTitle = "{$locationPrefix}[{$name}] | Nhận voucher giảm giá ngay";
    $descriptionSuffix = "Thông tin địa điểm du lịch, nhà hàng Hàn Quốc, dịch vụ đời sống tại {$location}, Việt Nam.";
}
else if ($currentLang === 'en') {
    $pageTitle = "{$locationPrefix}[{$name}] | Best Places to Visit, Korean Restaurants in Vietnam";
    $ogTitle = "{$locationPrefix}[{$name}] | Get your discount coupon";
    $descriptionSuffix = "Must-visit places, Korean restaurants, and lifestyle services in {$location}, Vietnam.";
}
else {
    // Korean (Default)
    $pageTitle = "{$locationPrefix}[{$name}] | 쿠퐁온라인 공식홈페이지";
    $ogTitle = "{$locationPrefix}[{$name}] | 쿠퐁온라인 공식홈페이지";
    $descriptionSuffix = "베트남 호치민 푸미흥 맛집,마사지,이발소등 업소 정보와 엄선된 업체들의 할인 쿠폰을 지금 확인하세요.";
}

$metaDesc = "{$name} ({$slogan}) - " . $descriptionSuffix;

if ($type === 'promo') {
    $pageTitle = $name;
    $ogTitle = $pageTitle;
} else if ($type === 'discount-mall') {
    $pageTitle = "쿠퐁 할인몰 | 베트남 최저가 쇼핑 & 혜택";
    $ogTitle = $pageTitle;
    $metaDesc = "베트남 현지 맛집, 마사지, 생활 서비스 할인권을 최저가로 구매하세요. 쿠퐁온라인 할인몰만의 특별한 혜택!";
} else if ($type === 'printing') {
    $pageTitle = "쿠퐁 프린팅 | 베트남 명함, 전단지, QR 쿠폰 제작";
    $ogTitle = $pageTitle;
    $metaDesc = "베트남 현지 비즈니스를 위한 명함 제작, 전단지 디자인, QR 코드 쿠폰 시스템 구축 서비스를 만나보세요.";
} else if ($type === 'market') {
    $pageTitle = "쿠퐁 마켓 | 베트남 중고거래 & 벼룩시장";
    $ogTitle = $pageTitle;
    $metaDesc = "호치민, 다낭, 하노이 등 베트남 전역의 믿을 수 있는 중고거래! 가전, 가구, 생활용품 마켓을 이용해 보세요.";
} else if ($type === 'promos' || $type === 'webzine') {
    $pageTitle = ($type === 'webzine' ? "쿠퐁 웹진 | 베트남 비즈니스 매거진" : "쿠퐁 홍보 게시판 | 베트남 업체 소식 & 정보");
    $ogTitle = $pageTitle;
    $metaDesc = "베트남 현지 비즈니스 소식, 업체 홍보, 할인 정보 및 유용한 생활 정보를 실시간으로 확인하세요.";
} else if ($type === 'community') {
    $pageTitle = "쿠퐁 커뮤니티 | 베트남 생활 정보 공유";
    $ogTitle = $pageTitle;
    $metaDesc = "베트남 호치민, 하노이, 다낭 교민들과 소통하고 생생한 현지 정보를 나누는 커뮤니티입니다.";
} else if ($type === 'service-intro') {
    $pageTitle = "서비스 소개 | 쿠퐁온라인(COUPONG ONLINE)";
    $ogTitle = $pageTitle;
    $metaDesc = "프리미엄 베트남 비즈니스 플랫폼 쿠퐁의 다양한 서비스와 혜택을 소개합니다.";
} else if ($type === 'privacy' || $type === 'terms') {
    $pageTitle = ($type === 'privacy' ? "개인정보처리방침" : "이용약관") . " | 쿠퐁온라인";
    $ogTitle = $pageTitle;
    $metaDesc = "쿠퐁온라인의 법적 고지 및 정책 사항을 확인하실 수 있습니다.";
}

if ($description) {
    // 쇼트코드 및 HTML 태그 제거 로직 추가
    $cleanDesc = preg_replace('/\[img\d+\]|cp\[[^\]]+\]|\[cp\]|bt\[[^\]]+\]|\[map\]|map\[[^\]]+\]/i', '', $description);
    $cleanDesc = strip_tags($cleanDesc);
    $cleanDesc = html_entity_decode($cleanDesc, ENT_QUOTES, 'UTF-8');
    $cleanDesc = trim(preg_replace('/\s+/', ' ', $cleanDesc));
    
    $metaDesc .= " " . mb_substr($cleanDesc, 0, 200, 'UTF-8') . "...";
}

// 스토어 상세 커스텀 메타데이터 포맷
if ($type === 'store') {
    $ogTitle = ($location ? "[{$location}] " : "") . $name;
    
    $cleanDesc = "";
    if ($description) {
        $cleanDesc = preg_replace('/\[img\d+\]|cp\[[^\]]+\]|\[cp\]|bt\[[^\]]+\]|\[map\]|map\[[^\]]+\]/i', '', $description);
        $cleanDesc = strip_tags($cleanDesc);
        $cleanDesc = html_entity_decode($cleanDesc, ENT_QUOTES, 'UTF-8');
        $cleanDesc = trim(preg_replace('/\s+/', ' ', $cleanDesc));
    }
    
    $summary = $cleanDesc ? mb_substr($cleanDesc, 0, 120, 'UTF-8') . "..." : "";
    if ($slogan && $summary) {
        $metaDesc = "{$slogan} - {$summary}";
    } else if ($slogan) {
        $metaDesc = "{$slogan} - {$name}의 상세 정보와 혜택을 확인하세요.";
    } else if ($summary) {
        $metaDesc = $summary;
    } else {
        $metaDesc = "{$name} - 쿠퐁온라인에서 상세 정보와 혜택을 확인하세요.";
    }
    $pageTitle = $ogTitle . " | 쿠퐁온라인";
}

// Semantic HTML 출력 (구글 봇 등 분석용)
?><!DOCTYPE html>
<html lang="<?php echo $currentLang; ?>">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title><?php echo $pageTitle; ?></title>
    <meta name="description" content="<?php echo $metaDesc; ?>" />
    
    <!-- Open Graph (SNS 등 공유용 메타 설정 백업) -->
    <meta property="og:title" content="<?php echo $ogTitle; ?>" />
    <meta property="og:description" content="<?php echo $metaDesc; ?>" />
    <?php if ($ogImage): ?>
    <meta property="og:image" content="<?php echo $ogImage; ?>" />
    <?php
endif; ?>
    <?php 
        $langPath = ($currentLang !== 'ko') ? "/{$currentLang}" : "";
        $canonicalUrl = "{$scheme}://{$host}{$langPath}";
        if ($type === 'store') $canonicalUrl .= "/store/{$id}";
        else if ($type === 'mini-home') $canonicalUrl .= "/mini-home/{$id}";
        else if ($type === 'promo') $canonicalUrl .= "/promo/{$id}";
        else if ($type === 'go') $canonicalUrl .= "/go/{$id}";
        else $canonicalUrl .= "/{$type}";
    ?>
    <meta property="og:url" content="<?php echo $canonicalUrl; ?>" />
    <meta property="og:type" content="website" />
    
    <!-- URL 정식 주소 (캐노니컬 태그) -->
    <link rel="canonical" href="<?php echo $canonicalUrl; ?>" />

    <!-- 비-봇 유저들을 위한 클라이언트 사이드 리다이렉트 (안전장치) -->
    <script>
        if (!/googlebot|google-inspectiontool|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora\ link\ preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|yeti|daumoa|kakaotalk-scrap|discordbot|telegrambot|whatsapp|line|skype|viber/i.test(navigator.userAgent)) {
            // 주소창의 현재 경로를 유지하면서 SPA로 진입하도록 유도 (goto 파라미터를 사용하여 무한 루프 방지)
            window.location.replace("/?goto=" + encodeURIComponent(window.location.pathname + window.location.search));
        }
    </script>

    <!-- ✅ JSON-LD 구조화 데이터 (LocalBusiness) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": <?php echo json_encode($name, JSON_UNESCAPED_UNICODE); ?>,
      "image": <?php echo json_encode($ogImage, JSON_UNESCAPED_SLASHES); ?>,
      "description": <?php echo json_encode($metaDesc, JSON_UNESCAPED_UNICODE); ?>,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": <?php echo json_encode($location, JSON_UNESCAPED_UNICODE); ?>,
        "addressCountry": "VN"
      },
      "url": <?php echo json_encode($canonicalUrl, JSON_UNESCAPED_SLASHES); ?>,
      "telephone": <?php echo json_encode($phone, JSON_UNESCAPED_UNICODE); ?>
    }
    </script>
</head>
<body style="font-family: sans-serif; padding: 20px;">
    <header>
        <h1><?php echo $name; ?></h1>
        <?php if ($slogan): ?><h2><?php echo $slogan; ?></h2><?php
endif; ?>
        <p><strong>카테고리:</strong> <?php echo $category; ?> | <strong>위치:</strong> <?php echo $location; ?></p>
    </header>
    
    <main>
        <?php
$mainImage = getVal($doc, ['image', 'mainImage']);
if ($mainImage)
    $mainImage = optimizeGoogleUrl($mainImage);

$galleryImages = getGalleryImages($doc);

if ($mainImage): ?>
        <div>
            <img src="<?php echo $mainImage; ?>" alt="<?php echo $name; ?> 메인 이미지" style="max-width: 600px; width: 100%; height: auto;" />
        </div>
        <?php
endif; ?>
        
        <article>
            <h3>업체 소개</h3>
            <div style="white-space: pre-wrap;"><?php 
                // 에디터의 HTML을 그대로 출력하되 안전을 위해 strip_tags에 일부 태그만 허용 (스크립트 제거)
                echo strip_tags($description, '<p><br><h1><h2><h3><h4><ul><li><b><strong><i><em><img><a><div><span>');
            ?></div>
        </article>

        <?php if ($phone): ?>
        <section>
            <h3>연락처 / 예약문의</h3>
            <p><?php echo $phone; ?></p>
        </section>
        <?php
endif; ?>

        <?php if (!empty($galleryImages)): ?>
        <section>
            <h3>갤러리 사진</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                <?php foreach ($galleryImages as $idx => $imgUrl): ?>
                    <?php
        $imgSrc = $imgUrl;
        if (strpos($imgUrl, 'http') !== 0) {
            $imgSrc = (strpos($imgUrl, '/') === 0) ? "{$scheme}://{$host}{$imgUrl}" : "{$scheme}://{$host}/{$imgUrl}";
        }
?>
                    <img src="<?php echo $imgSrc; ?>" alt="<?php echo $name; ?> 갤러리 사진 <?php echo $idx + 1; ?>" style="max-width: 300px; width: 100%; height: auto;" />
                <?php
    endforeach; ?>
            </div>
        </section>
        <?php
endif; ?>
        <?php if (isset($doc['list'])): ?>
        <section>
            <h3>최신 게시글 목록</h3>
            <ul style="list-style: none; padding: 0;">
                <?php foreach ($doc['list'] as $p): ?>
                    <?php 
                        $pTitle = getVal($p, 'title', $currentLang);
                        $pSlug = getVal($p, 'slug', $currentLang);
                        $pDesc = getVal($p, 'content', $currentLang);
                    ?>
                    <li style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <h4><a href="<?php echo "{$scheme}://{$host}{$base}/promo/" . urlencode($pSlug); ?>"><?php echo $pTitle; ?></a></h4>
                        <p style="font-size: 0.9rem; color: #666;"><?php echo mb_substr(strip_tags($pDesc), 0, 100, 'UTF-8'); ?>...</p>
                    </li>
                <?php endforeach; ?>
            </ul>
        </section>
        <?php endif; ?>
    </main>
    
    <footer>
        <p>베트남 프리미엄 할인쿠폰 쿠퐁온라인(COUPONG ONLINE)에서 <strong><?php echo $name; ?></strong>의 무료 쿠폰 혜택을 확인하세요.</p>
        <p><a href="<?php echo "{$scheme}://{$host}{$base}/"; ?>">메인 페이지로 돌아가기</a></p>
    </footer>
</body>
</html>
