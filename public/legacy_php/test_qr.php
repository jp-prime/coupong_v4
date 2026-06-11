<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!extension_loaded('gd')) {
    echo "GD library is NOT loaded.";
    exit;
}

$img = imagecreatetruecolor(200, 200);
$red = imagecolorallocate($img, 255, 0, 0);
imagefill($img, 0, 0, $red);

header('Content-Type: image/png');
imagepng($img);
imagedestroy($img);
?>
