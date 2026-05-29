# Genera los iconos de la app con System.Drawing (.NET). No necesita npm.
Add-Type -AssemblyName System.Drawing

$assets = Join-Path $PSScriptRoot '..\assets'
if (-not (Test-Path $assets)) { New-Item -ItemType Directory -Path $assets | Out-Null }

$blue   = [System.Drawing.ColorTranslator]::FromHtml('#1D4ED8')
$navy   = [System.Drawing.ColorTranslator]::FromHtml('#0B1F5C')
$white  = [System.Drawing.Color]::White
$light  = [System.Drawing.ColorTranslator]::FromHtml('#F5F5F7')

function New-Pentagon([double]$cx, [double]$cy, [double]$r, [double]$rotDeg) {
  $pts = @()
  for ($i = 0; $i -lt 5; $i++) {
    $a = ([Math]::PI / 180.0) * ($rotDeg + $i * 72)
    $pts += New-Object System.Drawing.PointF([single]($cx + [Math]::Cos($a) * $r), [single]($cy + [Math]::Sin($a) * $r))
  }
  return ,$pts
}

function Draw-Ball([System.Drawing.Graphics]$g, [double]$size, [Nullable[System.Drawing.Color]]$bg, [double]$scale) {
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  if ($bg) {
    $b = New-Object System.Drawing.SolidBrush($bg)
    $g.FillRectangle($b, 0, 0, [single]$size, [single]$size)
    $b.Dispose()
  }
  $c = $size / 2.0
  $r = $size * 0.30 * $scale

  # Bola blanca
  $wb = New-Object System.Drawing.SolidBrush($white)
  $g.FillEllipse($wb, [single]($c - $r), [single]($c - $r), [single]($r * 2), [single]($r * 2))
  $wb.Dispose()

  $navyBrush = New-Object System.Drawing.SolidBrush($navy)
  $navyPen   = New-Object System.Drawing.Pen($navy, [single]($r * 0.06))
  $navyPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $navyPen.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round

  # Pentágono central
  $central = New-Pentagon $c $c ($r * 0.34) -90
  $g.FillPolygon($navyBrush, $central)

  # Costuras radiales
  for ($i = 0; $i -lt 5; $i++) {
    $a = ([Math]::PI / 180.0) * (-90 + $i * 72)
    $x1 = $c + [Math]::Cos($a) * $r * 0.34
    $y1 = $c + [Math]::Sin($a) * $r * 0.34
    $x2 = $c + [Math]::Cos($a) * $r * 0.90
    $y2 = $c + [Math]::Sin($a) * $r * 0.90
    $g.DrawLine($navyPen, [single]$x1, [single]$y1, [single]$x2, [single]$y2)
  }

  # Pentágonos exteriores
  for ($i = 0; $i -lt 5; $i++) {
    $a = ([Math]::PI / 180.0) * (-90 + 36 + $i * 72)
    $px = $c + [Math]::Cos($a) * $r * 0.72
    $py = $c + [Math]::Sin($a) * $r * 0.72
    $poly = New-Pentagon $px $py ($r * 0.22) ($i * 72 - 90)
    $g.FillPolygon($navyBrush, $poly)
  }

  $navyBrush.Dispose()
  $navyPen.Dispose()
}

function Save-Icon([string]$name, [int]$size, [Nullable[System.Drawing.Color]]$bg, [double]$scale) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  Draw-Ball $g $size $bg $scale
  $path = Join-Path $assets $name
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output ("  OK " + $name + " (" + $size + "px)")
}

Save-Icon 'icon.png'          1024 $blue  1.0
Save-Icon 'adaptive-icon.png' 1024 $null  0.62
Save-Icon 'splash-icon.png'   512  $light 1.0
Save-Icon 'favicon.png'       48   $blue  1.0
Write-Output 'Iconos generados.'
