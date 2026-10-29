# Turns the ibex reference images into black-and-white masks for trace-outline.mjs.
# Usage: powershell -File make-masks.ps1 -OutDir <dir>
# Each mask is a text file: "w h", then one row of 0/1 per line (1 = darker than the threshold).
param([Parameter(Mandatory = $true)] [string] $OutDir)

$images = Join-Path $PSScriptRoot '..\..\images'

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Text;

public static class InkMask {
  // Shrinks the image so its longer side is maxDim, then marks every pixel darker than threshold.
  // Returns the share of marked pixels.
  public static double Make(string path, string outPath, int maxDim, int threshold) {
    using (var src = new Bitmap(path)) {
      double s = Math.Min(1.0, (double)maxDim / Math.Max(src.Width, src.Height));
      int w = (int)Math.Round(src.Width * s), h = (int)Math.Round(src.Height * s);
      using (var bmp = new Bitmap(w, h))
      using (var g = Graphics.FromImage(bmp)) {
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.DrawImage(src, 0, 0, w, h);
        var sb = new StringBuilder();
        sb.Append(w).Append(' ').Append(h).Append('\n');
        long ink = 0;
        for (int y = 0; y < h; y++) {
          for (int x = 0; x < w; x++) {
            var c = bmp.GetPixel(x, y);
            bool on = 0.299 * c.R + 0.587 * c.G + 0.114 * c.B < threshold;
            if (on) ink++;
            sb.Append(on ? '1' : '0');
          }
          sb.Append('\n');
        }
        File.WriteAllText(outPath, sb.ToString());
        return (double)ink / ((double)w * h);
      }
    }
  }
}
'@

# The silhouettes are pure black on white; the top view is a photo, so it needs a lighter threshold.
$runs = @(
  @{ Name = 'side'; File = '13-side-silhouette.jpg'; Threshold = 128 },
  @{ Name = 'front'; File = '14-front-silhouette.jpg'; Threshold = 128 },
  @{ Name = 'top'; File = '09-top.jpg'; Threshold = 165 }
)
New-Item -ItemType Directory -Force $OutDir | Out-Null
foreach ($r in $runs) {
  $ink = [InkMask]::Make((Join-Path $images $r.File), (Join-Path $OutDir "$($r.Name).mask"), 900, $r.Threshold)
  '{0}: {1:P1} ink' -f $r.Name, $ink
}
