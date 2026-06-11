<?php
/**
 * Dynamic OG Image Generator for Coupong
 * Overlays fixed text "🎁쿠폰선물도착🎁 지금확인해보세요!" in the center.
 */

header("Content-Type: image/jpeg");

$imgUrl = isset($_GET['img']) ? $_GET['img'] : '';
if (!$imgUrl) {
    // Return a default logo if no image is provided
    readfile(__DIR__ . "/logo512.png");
    exit;
}

// Load the source image
$source = null;
$ext = strtolower(pathinfo($imgUrl, PATHINFO_EXTENSION));

// Simple check for data URLs or clear extensions
if (strpos($imgUrl, 'data:image') === 0) {
    // Handle data URLs if needed, but usually we get full URLs
    $data = explode(',', $imgUrl);
    $source = imagecreatefromstring(base64_decode($data[1]));
} else {
    // Try to load from URL. Note: allow_url_fopen must be enabled in php.ini
    $content = @file_get_contents($imgUrl);
    if ($content) {
        $source = imagecreatefromstring($content);
    }
}

if (!$source) {
    // Fallback if image loading fails
    $source = imagecreatetruecolor(800, 400);
    $bg = imagecolorallocate($source, 240, 243, 250);
    imagefill($source, 0, 0, $bg);
}

$width = imagesx($source);
$height = imagesy($source);

// Text to overlay
$text1 = "🎁쿠폰선물도착🎁";
$text2 = "지금확인해보세요!";
$font = 'C:\Windows\Fonts\malgunbd.ttf'; // Malgun Gothic Bold for Windows XAMPP

if (!file_exists($font)) {
    // Try standard sans-serif fallback if font not found
    $font = 'C:\Windows\Fonts\arial.ttf';
}

$fontSize1 = $width * 0.06; // Scale font based on image width
$fontSize2 = $width * 0.045;

// Color definition (White text, Semi-transparent Black box)
$white = imagecolorallocate($source, 255, 255, 255);
$blackOverlay = imagecolorallocatealpha($source, 0, 0, 0, 40); // 0-127 (40 is ~30% alpha)

// Calculate positions for text 1
$bbox1 = imagettfbbox($fontSize1, 0, $font, $text1);
$textWidth1 = $bbox1[2] - $bbox1[0];
$textHeight1 = $bbox1[1] - $bbox1[7];
$x1 = ($width - $textWidth1) / 2;
$y1 = ($height / 2) - ($textHeight1 / 2);

// Calculate positions for text 2
$bbox2 = imagettfbbox($fontSize2, 0, $font, $text2);
$textWidth2 = $bbox2[2] - $bbox2[0];
$textHeight2 = $bbox2[1] - $bbox2[7];
$x2 = ($width - $textWidth2) / 2;
$y2 = $y1 + $textHeight1 + ($fontSize2 * 1.5);

// Draw Background Box (Full width bar or centered box?)
// User asked for "Thumbnail Center", so let's make a centered rounded-like rectangle overlay
$padding = 30;
$boxY1 = $y1 - $textHeight1 - $padding;
$boxY2 = $y2 + $padding;
$boxHeight = $boxY2 - $boxY1;

// Draw a semi-transparent horizontal bar across the middle
imagefilledrectangle($source, 0, $boxY1, $width, $boxY2, $blackOverlay);

// Overlay Text 1
imagettftext($source, $fontSize1, 0, $x1, $y1, $white, $font, $text1);

// Overlay Text 2
imagettftext($source, $fontSize2, 0, $x2, $y2, $white, $font, $text2);

// Output the image
imagejpeg($source, null, 90);
imagedestroy($source);
?>
