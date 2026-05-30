# Redimensiona icon-source.png a los tamaños que necesita la app.
Add-Type -AssemblyName System.Drawing

$assets = Join-Path $PSScriptRoot '..\assets'
$src = Join-Path $assets 'icon-source.png'

function Resize-To([string]$outName, [int]$size, [System.Drawing.Color]$bg, [double]$scale) {
  $source = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  if ($bg -ne [System.Drawing.Color]::Transparent) {
    $b = New-Object System.Drawing.SolidBrush($bg)
    $g.FillRectangle($b, 0, 0, $size, $size)
    $b.Dispose()
  }

  $inner = [int]($size * $scale)
  $pad = [int](($size - $inner) / 2)
  $g.DrawImage($source, $pad, $pad, $inner, $inner)

  $bmp.Save((Join-Path $assets $outName), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $source.Dispose()
  Write-Output ("  OK " + $outName + " (" + $size + "px)")
}

$light = [System.Drawing.ColorTranslator]::FromHtml('#0B1F2E')

# Icono principal: el logo completo a 1024, fondo oscuro acorde al diseño
Resize-To 'icon.png'          1024 $light 1.0
# Adaptive (Android): logo con zona segura (margen), fondo se pone en app.json
Resize-To 'adaptive-icon.png' 1024 ([System.Drawing.Color]::Transparent) 0.80
# Splash: logo centrado
Resize-To 'splash-icon.png'   512  ([System.Drawing.Color]::Transparent) 1.0
# Favicon web
Resize-To 'favicon.png'       64   $light 1.0

Write-Output 'Iconos generados desde icon-source.png'
