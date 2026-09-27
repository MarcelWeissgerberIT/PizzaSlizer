#!/usr/bin/env python3
"""Lädt die mit OpenArt generierten Rohbilder herunter und bereitet sie fürs Spiel auf.

- Weißer Hintergrund wird per Flood-Fill (nur von außen zusammenhängend) transparent gemacht,
  damit weißer Käse im Inneren erhalten bleibt.
- Pizzen werden auf einen exakten Kreis zugeschnitten, damit die Kollisions-Geometrie
  im Spiel (Kreis mit Radius = halbe Bildbreite) stimmt.
- Pizzen, Logo und Schneider werden als WebP mit Alpha gespeichert, Hintergrund als JPEG, Icons werden aus der Salami-Pizza erzeugt.

Aufruf:  python3 tools/process_assets.py [--skip-download]
Die Quell-URLs stehen in tools/asset_sources.json.
"""
import json, os, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'tools', 'raw')
SOURCES = os.path.join(ROOT, 'tools', 'asset_sources.json')

def download(name, url):
    os.makedirs(RAW, exist_ok=True)
    dst = os.path.join(RAW, name + '.png')
    if not os.path.exists(dst):
        print('  lade', name)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r, open(dst, 'wb') as f:
            f.write(r.read())
    return dst

def key_background(img, thresh=232):
    """Macht den von außen erreichbaren nahezu weißen Hintergrund transparent."""
    from scipy import ndimage
    img = img.convert('RGBA')
    arr = np.array(img)
    rgb = arr[..., :3].astype(np.int16)
    minc = rgb.min(axis=2)
    near_white = minc >= thresh
    labels, n = ndimage.label(near_white)
    border = np.unique(np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]]))
    border = border[border != 0]
    bg = np.isin(labels, border)
    # Weiche Kante: 1px erweiterter Rand bekommt Alpha nach Helligkeit
    band = ndimage.binary_dilation(bg, iterations=2) & ~bg
    alpha = arr[..., 3].copy()
    alpha[bg] = 0
    soft = np.clip((255 - minc) * 255 / (255 - thresh + 1), 0, 255).astype(np.uint8)
    alpha[band] = np.minimum(alpha[band], soft[band])
    arr[..., 3] = alpha
    return Image.fromarray(arr, 'RGBA')

def bbox_of_alpha(img, min_alpha=20):
    a = np.array(img)[..., 3]
    ys, xs = np.where(a > min_alpha)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def make_pizza(src, dst, size=720):
    img = key_background(Image.open(src))
    x0, y0, x1, y1 = bbox_of_alpha(img)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    r = max(x1 - x0, y1 - y0) / 2
    box = (int(round(cx - r)), int(round(cy - r)), int(round(cx + r)), int(round(cy + r)))
    img = img.crop(box).resize((size, size), Image.LANCZOS)
    # Exakte Kreismaske mit weicher Kante
    mask = Image.new('L', (size * 2, size * 2), 0)
    ImageDraw.Draw(mask).ellipse((6, 6, size * 2 - 6, size * 2 - 6), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    a = np.minimum(np.array(img)[..., 3], np.array(mask))
    arr = np.array(img); arr[..., 3] = a
    Image.fromarray(arr, 'RGBA').save(dst, quality=88, method=6)
    print('  ->', os.path.relpath(dst, ROOT))

def make_cutout(src, dst, max_size, thresh=232):
    img = key_background(Image.open(src), thresh)
    x0, y0, x1, y1 = bbox_of_alpha(img)
    pad = 8
    img = img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    img.save(dst, quality=90, method=6)
    print('  ->', os.path.relpath(dst, ROOT), img.size)

def make_background(src, dst):
    img = Image.open(src).convert('RGB')
    img.save(dst, 'JPEG', quality=82, optimize=True, progressive=True)
    print('  ->', os.path.relpath(dst, ROOT), img.size)

def make_icons(pizza_png, out_dir):
    pizza = Image.open(pizza_png).convert('RGBA')
    for s in (192, 512):
        bg = Image.new('RGBA', (s, s), (59, 34, 20, 255))
        p = pizza.resize((int(s * 0.82), int(s * 0.82)), Image.LANCZOS)
        off = (s - p.width) // 2
        bg.alpha_composite(p, (off, off))
        bg.convert('RGB').save(os.path.join(out_dir, f'icon-{s}.png'), optimize=True)
        print('  -> icon', s)

def main():
    with open(SOURCES) as f:
        sources = json.load(f)
    pizzas_dir = os.path.join(ROOT, 'assets', 'pizzas')
    ui_dir = os.path.join(ROOT, 'assets', 'ui')
    os.makedirs(pizzas_dir, exist_ok=True); os.makedirs(ui_dir, exist_ok=True)
    print('Pizzen:')
    for key, url in sources['pizzas'].items():
        make_pizza(download('pizza_' + key, url), os.path.join(pizzas_dir, key + '.webp'))
    print('UI:')
    make_background(download('background', sources['ui']['background']), os.path.join(ui_dir, 'background.jpg'))
    make_cutout(download('logo', sources['ui']['logo']), os.path.join(ui_dir, 'logo.webp'), 900, thresh=228)
    make_cutout(download('cutter', sources['ui']['cutter']), os.path.join(ui_dir, 'cutter.webp'), 400)
    make_icons(os.path.join(pizzas_dir, 'salami.webp'), ui_dir)

if __name__ == '__main__':
    main()
