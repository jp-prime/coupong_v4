<?php
/**
 * Advanced QR Overlay Script (V9.0) - High Engagement Design
 * Features: Centered Name/Slogan, Bottom Center QR with Caption
 */

error_reporting(0);
ini_set('display_errors', 0);
ini_set('memory_limit', '512M');

if (!extension_loaded('gd')) {
    header('HTTP/1.1 500 GD Library Missing');
    die('PHP GD library is required.');
}

// 1. Input Capture
$queryString = $_SERVER['QUERY_STRING'];
parse_str($queryString, $params);
$imgUrl = isset($params['img']) ? $params['img'] : '';
$qrData = isset($params['data']) ? $params['data'] : '';
$storeName = isset($params['name']) ? $params['name'] : '';
$slogan = isset($params['slogan']) ? $params['slogan'] : '';
$location = isset($params['loc']) ? $params['loc'] : '';
$qrCaption = "할인쿠폰 다운로드"; 

// Font Paths - Noto Sans KR for better aesthetics
$fontPath = __DIR__ . '/fonts/NotoSansKR-Medium.ttf'; 
$fontBoldPath = __DIR__ . '/fonts/NotoSansKR-Bold.ttf'; 

/**
 * Handle image fetching
 */
function getImage($url) {
    if (!$url) return null;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CoupongBOT/1.5');
    $data = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    return ($info['http_code'] === 200) ? @imagecreatefromstring($data) : null;
}

// 2. Generate Image
$canvasSize = 1080;
$final = imagecreatetruecolor($canvasSize, $canvasSize);
$white = imagecolorallocate($final, 255, 255, 255);
$black = imagecolorallocate($final, 0, 0, 0);
$yellow = imagecolorallocate($final, 255, 215, 0);
$cyan = imagecolorallocate($final, 0, 255, 255);
imagefill($final, 0, 0, $white);

if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') {
    // 2.1 Draw Background Image
    $base = getImage($imgUrl);
    if ($base) {
        $w = imagesx($base); $h = imagesy($base);
        // Fill mode for high-quality social media posts
        $ratio = max($canvasSize / $w, $canvasSize / $h); 
        $nw = (int)($w * $ratio); $nh = (int)($h * $ratio);
        imagecopyresampled($final, $base, (int)(($canvasSize-$nw)/2), (int)(($canvasSize-$nh)/2), 0, 0, $nw, $nh, $w, $h);
        imagedestroy($base);
    }

    // REMOVED Overlay for maximum brightness (requested: "왜 썸네일 배경이 어둡지?")

    // 2.2 Draw Center Name & Slogan & Location
    // Check if fonts exist, fallback to system malgun if not
    if (!file_exists($fontPath)) {
        $fontPath = __DIR__ . '/fonts/malgun.ttf';
        $fontBoldPath = __DIR__ . '/fonts/malgunbd.ttf';
    }
    $fRegular = file_exists($fontPath) ? $fontPath : '';
    $fBold = file_exists($fontBoldPath) ? $fontBoldPath : $fRegular;

    if ($fRegular) {
        // --- Location (Above Name) ---
        $locSize = 25;
        $nameY = (int)($canvasSize / 2);
        
        if ($location) {
            $locBbox = imagettfbbox($locSize, 0, $fRegular, $location);
            $locW = $locBbox[2] - $locBbox[0];
            $locX = (int)(($canvasSize - $locW) / 2);
            $locY = $nameY - 80;

            imagettftext($final, $locSize, 0, $locX + 2, $locY + 2, $black, $fRegular, $location);
            imagettftext($final, $locSize, 0, $locX, $locY, $cyan, $fRegular, $location);
        }

        // --- Store Name (BOLD, Medium Size) ---
        $nameSize = 60; 
        $nameBbox = imagettfbbox($nameSize, 0, $fBold, $storeName);
        $nameW = $nameBbox[2] - $nameBbox[0];
        $nameX = (int)(($canvasSize - $nameW) / 2);
        $nameY_final = $nameY;

        // Black Shadow Stroke for extreme readability on ANY image background
        for ($x_offset = -2; $x_offset <= 2; $x_offset++) {
            for ($y_offset = -2; $y_offset <= 2; $y_offset++) {
                imagettftext($final, $nameSize, 0, $nameX + $x_offset, $nameY_final + $y_offset, $black, $fBold, $storeName);
            }
        }
        imagettftext($final, $nameSize, 0, $nameX, $nameY_final, $white, $fBold, $storeName);

        // --- Slogan ---
        if ($slogan) {
            $sloganSize = 35;
            $sloganBbox = imagettfbbox($sloganSize, 0, $fRegular, $slogan);
            $sloganW = $sloganBbox[2] - $sloganBbox[0];
            $sloganX = (int)(($canvasSize - $sloganW) / 2);
            $sloganY = $nameY_final + 65;

            imagettftext($final, $sloganSize, 0, $sloganX + 2, $sloganY + 2, $black, $fRegular, $slogan);
            imagettftext($final, $sloganSize, 0, $sloganX, $sloganY, $yellow, $fRegular, $slogan);
        }
    }

    // 2.3 Draw BOTTOM RIGHT QR & Caption
    if ($qrData) {
        $qrSize = 230;
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=".$qrSize."x".$qrSize."&margin=10&data=" . urlencode($qrData);
        $qr = getImage($qrUrl);
        if ($qr) {
            $qx = (int)($canvasSize - $qrSize - 50); // RIGHT matched
            $qy = (int)($canvasSize - $qrSize - 50); // BOTTOM matched

            // Draw QR Background Box (White) with Shadow stroke for definition
            $shadowColor = imagecolorallocatealpha($final, 0, 0, 0, 60);
            imagefilledrectangle($final, $qx - 12, $qy - 45, $qx + $qrSize + 13, $qy + $qrSize + 13, $shadowColor);
            imagefilledrectangle($final, $qx - 15, $qy - 42, $qx + $qrSize + 15, $qy + $qrSize + 15, $white);
            
            // Draw Caption above QR
            if ($fRegular) {
                $capSize = 18;
                $capBbox = imagettfbbox($capSize, 0, $fRegular, $qrCaption);
                $capW = $capBbox[2] - $capBbox[0];
                $capX = $qx + (int)(($qrSize - $capW) / 2); // Centered relative to QR
                $capY = $qy - 12;
                imagettftext($final, $capSize, 0, $capX, $capY, $black, $fRegular, $qrCaption);
            }

            // Draw QR
            imagecopy($final, $qr, $qx, $qy, 0, 0, $qrSize, $qrSize);
            imagedestroy($qr);
        }
    }
}

// 3. Output
ob_start();
imagejpeg($final, null, 90);
$imgBytes = ob_get_clean();

header('Content-Type: image/jpeg');
header('Accept-Ranges: bytes');
header('Content-Length: ' . strlen($imgBytes));
header('Cache-Control: public, max-age=86400');
header('Connection: close');

if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') {
    echo $imgBytes;
}

imagedestroy($final);
?>
