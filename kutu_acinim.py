#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Candemsoft Akıllı Araç QR Etiketi – Kutu açınımı (Aşama 1, teknik bıçak izi)

Euro askı delikli çift kat başlık + alt kilitli geçme kapak (reverse tuck, slit lock),
tek parça, yan yapıştırmalı karton kutu için 1:1 mm açınım üretir.

Çıktılar (OUT klasörüne):
  *_Acinim_<v>.svg        1 birim = 1 mm, katmanlı (Illustrator / Inkscape)
  *_Acinim_<v>.pdf        1:1, OCG katmanları, "Bicak" spot renk + overprint
  *_BeyazMaket_A3_<v>.pdf A3, %100 ölçek, 50 mm referans çizgili
  *_Olcu_Raporu_<v>.md    ölçü raporu + otomatik kontroller
  kutu_geometri.json      3D önizleme verisi

Kullanım:  python kutu_acinim.py [çıktı_klasörü]
Gereksinim: shapely, reportlab (yalnızca font genişlikleri için)
"""
import math, json, os, sys, zlib

# =====================================================================
# PARAMETRELER  (ölçüler mm; yalnızca bu bloğu değiştirin)
# =====================================================================
G  = 96.0    # iç genişlik
D  = 18.0    # iç derinlik
Y  = 136.0   # iç yükseklik
T  = 0.45    # karton kalınlığı (350 g/m² GC1)
H  = 35.0    # Euro başlık yüksekliği
GL = 15.0    # tutkal payı genişliği
STACK = 8.0  # içerik paket kalınlığı (VARSAYIM – ölçülünce güncelleyin)
VERSION = "v1"

# --- ikincil parametreler ---
DUST_L = 25.0         # toz kapağı boyu
DUST_INSET = 1.0      # toz kapağı yan boşluğu
TUCK_H = 15.0         # alt geçme dili yüksekliği
TUCK_R = 3.0          # geçme dili köşe radüsü
TUCK_INSET = 1.0      # geçme dili yan boşluğu (her yan)
SLIT = 5.0            # slit lock kesik boyu
TOPGLUE_H = 12.0      # üst kapak yapıştırma dili
TOPGLUE_INSET = 1.0
HDR_GAP = 1.0         # başlık 2. kat kısaltma (katlama payı)
HDR_INSET = 0.5       # başlık 2. kat yan boşluğu
HDR_R = 3.0           # başlık üst köşe radüsü
GLUE_TAPER_DEG = 15.0 # tutkal payı uç eğimi
HOLE_TOP = 8.0        # Euro delik üst kenarı – başlık bigisi
OVAL_W, OVAL_H, CIRCLE_D = 32.0, 8.0, 10.0
BLEED, SAFE, HOLE_CLEAR = 3.0, 4.0, 3.0
SEAL_D = 20.0
LOT_W, LOT_H, LOT_UP = 10.0, 15.0, 8.0
CARRIER = (92.0, 132.0); ACT_CARD = (85.6, 54.0); WIPE = (60.0, 80.0)
# =====================================================================

ALLOW = math.ceil(T * 2 - 1e-9) / 2          # bigi payı (t=0,45 → 0,5)
gp, dp, yp = G + ALLOW, D + ALLOW, Y + ALLOW   # bigi-bigi panel ölçüleri
H2 = H - HDR_GAP

# kolonlar (dış/baskı yüzünden bakış, soldan sağa)
xS0 = 0.0; xS1 = dp                 # Sol yan
xF0 = xS1; xF1 = xF0 + gp           # Ön
xR0 = xF1; xR1 = xR0 + dp           # Sağ yan
xB0 = xR1; xB1 = xB0 + gp           # Arka
xG0 = xB1; xG1 = xG0 + GL           # Tutkal payı
TOP_EXT = max(H + H2, dp + TOPGLUE_H, DUST_L)
BOT_EXT = max(dp + TUCK_H, DUST_L)
yT = TOP_EXT          # gövde üst bigisi
yF = yT - H           # başlık katlama bigisi
yBt = yT + yp         # gövde alt bigisi
yc = yBt + dp         # alt kapak / geçme dili bigisi
W = xG1; HH = yT + yp + BOT_EXT
xFc = (xF0 + xF1) / 2; xBc = (xB0 + xB1) / 2; xRc = (xR0 + xR1) / 2; xSc = (xS0 + xS1) / 2
RR, RC = OVAL_H / 2, CIRCLE_D / 2
HA = (OVAL_W - OVAL_H) / 2
cy1 = yF + HOLE_TOP + RC            # 1. kat delik merkezi
cy2 = yF - HOLE_TOP - RC            # 2. kat delik merkezi (ayna)
HAIR = 0.25 / (72 / 25.4)           # 0,25 pt → mm


def fmt(v, nd=2):
    s = f"{v:.{nd}f}".rstrip('0').rstrip('.')
    return s.replace('.', ',')


# ------------------------------------------------------------------ yol
class Path:
    def __init__(s):
        s.c = []; s.cur = None; s.start = None
    def m(s, x, y):
        s.c.append(('M', x, y)); s.cur = (x, y); s.start = (x, y); return s
    def l(s, x, y):
        s.c.append(('L', x, y)); s.cur = (x, y); return s
    def a(s, cx, cy, r, a0, a1):
        sx, sy = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
        if s.cur is None:
            s.m(sx, sy)
        elif math.hypot(sx - s.cur[0], sy - s.cur[1]) > 1e-6:
            s.l(sx, sy)
        s.c.append(('A', cx, cy, r, a0, a1))
        s.cur = (cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1)))
        return s
    def z(s):
        s.c.append(('Z',)); s.cur = s.start; return s
    def points(s, step=3):
        pts = []
        for c in s.c:
            if c[0] in 'ML':
                pts.append((c[1], c[2]))
            elif c[0] == 'A':
                _, cx, cy, r, a0, a1 = c
                n = max(2, int(abs(a1 - a0) / step) + 1)
                for i in range(1, n + 1):
                    t = math.radians(a0 + (a1 - a0) * i / n)
                    pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
        out = []
        for p in pts:
            if not out or math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > 1e-9:
                out.append(p)
        if len(out) > 1 and math.hypot(out[0][0] - out[-1][0], out[0][1] - out[-1][1]) < 1e-9:
            out.pop()
        return out


def rect(x0, y0, x1, y1):
    return Path().m(x0, y0).l(x1, y0).l(x1, y1).l(x0, y1).z()

def poly(pts, closed=True):
    p = Path().m(*pts[0])
    for q in pts[1:]:
        p.l(*q)
    return p.z() if closed else p

def line(x0, y0, x1, y1):
    return Path().m(x0, y0).l(x1, y1)

def euro_hole(cx, cy, ha=HA, rr=RR, rc=RC):
    """32×8 oval (stadyum) ∪ Ø10 daire, tek kapalı kontur."""
    xi = math.sqrt(rc * rc - rr * rr)
    ai = math.degrees(math.atan2(rr, xi))
    p = Path().m(cx + xi, cy - rr).l(cx + ha, cy - rr)
    p.a(cx + ha, cy, rr, -90, 90).l(cx + xi, cy + rr)
    p.a(cx, cy, rc, ai, 180 - ai).l(cx - ha, cy + rr)
    p.a(cx - ha, cy, rr, 90, 270).l(cx - xi, cy - rr)
    p.a(cx, cy, rc, 180 + ai, 360 - ai)
    return p.z()


# ------------------------------------------------------------ geometri
def dust_pts(xa, xb, c, s):
    L, i = DUST_L, DUST_INSET
    return [(xa, c), (xa + i, c + s * 2), (xa + i, c + s * (L - 5)), (xa + i + 2, c + s * L),
            (xb - i - 2, c + s * L), (xb - i, c + s * (L - 5)), (xb - i, c + s * 2), (xb, c)]

gi, ti, hi = TOPGLUE_INSET, TUCK_INSET, HDR_INSET
tg = GL * math.tan(math.radians(GLUE_TAPER_DEG))
ytop = yF - H2

def topglue_pts():
    return [(xF0 + gi, yT - dp), (xF0 + gi, yT - dp - TOPGLUE_H + 2), (xF0 + gi + 2, yT - dp - TOPGLUE_H),
            (xF1 - gi - 2, yT - dp - TOPGLUE_H), (xF1 - gi, yT - dp - TOPGLUE_H + 2), (xF1 - gi, yT - dp)]

def header2_path():
    p = Path().m(xB0 + hi, yF).l(xB0 + hi, ytop + HDR_R)
    p.a(xB0 + hi + HDR_R, ytop + HDR_R, HDR_R, 180, 270).l(xB1 - hi - HDR_R, ytop)
    p.a(xB1 - hi - HDR_R, ytop + HDR_R, HDR_R, 270, 360).l(xB1 - hi, yF)
    return p.z()

def tuck_path():
    p = Path().m(xB1, yc).l(xB1 - ti, yc + 2).l(xB1 - ti, yc + TUCK_H - TUCK_R)
    p.a(xB1 - ti - TUCK_R, yc + TUCK_H - TUCK_R, TUCK_R, 0, 90).l(xB0 + ti + TUCK_R, yc + TUCK_H)
    p.a(xB0 + ti + TUCK_R, yc + TUCK_H - TUCK_R, TUCK_R, 90, 180).l(xB0 + ti, yc + 2).l(xB0, yc)
    return p.z()

def glue_pts():
    return [(xG0, yT), (xG1, yT + tg), (xG1, yBt - tg), (xG0, yBt)]

def outline():
    o = Path().m(xS0, yT)
    for q in dust_pts(xS0, xS1, yT, -1)[1:]:
        o.l(*q)
    o.l(xF0, yT - dp)
    for q in topglue_pts():
        o.l(*q)
    o.l(xF1, yT - dp).l(xF1, yT)
    for q in dust_pts(xR0, xR1, yT, -1)[1:]:
        o.l(*q)
    # Euro başlık (2 kat)
    o.l(xB0, yF).l(xB0 + hi, yF).l(xB0 + hi, ytop + HDR_R)
    o.a(xB0 + hi + HDR_R, ytop + HDR_R, HDR_R, 180, 270).l(xB1 - hi - HDR_R, ytop)
    o.a(xB1 - hi - HDR_R, ytop + HDR_R, HDR_R, 270, 360).l(xB1 - hi, yF).l(xB1, yF).l(xB1, yT)
    for q in glue_pts()[1:]:
        o.l(*q)
    # alt kapak + geçme dili
    o.l(xB1, yc).l(xB1 - ti, yc + 2).l(xB1 - ti, yc + TUCK_H - TUCK_R)
    o.a(xB1 - ti - TUCK_R, yc + TUCK_H - TUCK_R, TUCK_R, 0, 90).l(xB0 + ti + TUCK_R, yc + TUCK_H)
    o.a(xB0 + ti + TUCK_R, yc + TUCK_H - TUCK_R, TUCK_R, 90, 180).l(xB0 + ti, yc + 2).l(xB0, yc).l(xB0, yBt)
    for q in list(reversed(dust_pts(xR0, xR1, yBt, 1)))[1:]:
        o.l(*q)
    o.l(xF0, yBt)
    for q in list(reversed(dust_pts(xS0, xS1, yBt, 1)))[1:-1]:
        o.l(*q)
    return o.z()

CREASES = [
    (xS1, yT, xS1, yBt), (xF1, yT, xF1, yBt), (xR1, yT, xR1, yBt), (xB1, yT, xB1, yBt),
    (xS0, yT, xS1, yT), (xF0, yT, xF1, yT), (xR0, yT, xR1, yT),
    (xF0 + gi, yT - dp, xF1 - gi, yT - dp),
    (xB0 + hi, yF, xB1 - hi, yF),
    (xS0, yBt, xS1, yBt), (xR0, yBt, xR1, yBt), (xB0, yBt, xB1, yBt),
    (xB0 + SLIT, yc, xB1 - SLIT, yc),
]
SLITS = [(xB0, yc, xB0 + SLIT, yc), (xB1 - SLIT, yc, xB1, yc)]


# ------------------------------------------------------- görüntü listesi
class DL:
    def __init__(s):
        s.items = []
    def path(s, layer, role, p, **kw):
        s.items.append(dict(k='path', layer=layer, role=role, p=p, **kw))
    def text(s, layer, role, x, y, txt, size, rot=0, bold=False, anchor='middle'):
        s.items.append(dict(k='text', layer=layer, role=role, x=x, y=y, txt=txt, size=size,
                            rot=rot, bold=bold, anchor=anchor))


def hatch(polygon, spacing=1.6, ang=45):
    from shapely.geometry import LineString
    minx, miny, maxx, maxy = polygon.bounds
    L = (maxx - minx) + (maxy - miny)
    out = []
    t = -L
    while t < L:
        ln = LineString([(minx + t, maxy), (minx + t + L, maxy - L)]) if ang == 45 else None
        g = polygon.intersection(ln)
        for seg in getattr(g, 'geoms', [g]):
            if seg.geom_type == 'LineString' and seg.length > 0.05:
                (a, b) = list(seg.coords)[0], list(seg.coords)[-1]
                out.append(line(a[0], a[1], b[0], b[1]))
        t += spacing
    return out


def shp_to_paths(geom):
    paths = []
    for g in getattr(geom, 'geoms', [geom]):
        for ring in [g.exterior] + list(g.interiors):
            paths.append(poly(list(ring.coords)[:-1]))
    return paths


def build():
    from shapely.geometry import Polygon
    dl = DL()
    OUT = outline()
    H1 = euro_hole(xBc, cy1); H2p = euro_hole(xBc, cy2)
    flat = Polygon(OUT.points(), [H1.points(), H2p.points()])

    # --- Tasma
    bleed = flat.buffer(BLEED, join_style=2, mitre_limit=3)
    for p in shp_to_paths(bleed):
        dl.path('Tasma', 'bleed', p)

    # --- Tutkal alanları
    gpoly = Polygon(glue_pts())
    dl.path('Tutkal_Alani', 'glue', poly(glue_pts()))
    for h in hatch(gpoly):
        dl.path('Tutkal_Alani', 'glue_hatch', h)
    tpts = topglue_pts()
    dl.path('Tutkal_Alani', 'glue', poly(tpts))
    for h in hatch(Polygon(tpts)):
        dl.path('Tutkal_Alani', 'glue_hatch', h)

    # --- Lot kutucuğu (Sağ yan, 90° dönük)
    lx0, lx1 = xRc - LOT_W / 2, xRc + LOT_W / 2
    ly1 = yBt - LOT_UP; ly0 = ly1 - LOT_H
    dl.path('Lot_Alani', 'lot', rect(lx0, ly0, lx1, ly1))
    dl.text('Lot_Alani', 'lot_t', xRc - 0.6, (ly0 + ly1) / 2, 'LOT / TARİH', 1.7, rot=-90, bold=True)
    dl.text('Lot_Alani', 'lot_t', xRc + 1.9, (ly0 + ly1) / 2, f'{fmt(LOT_W)}×{fmt(LOT_H)}', 1.4, rot=-90)

    # --- Mühür alanı (alt kapağın serbest kenarı ↔ Ön alt kenar)
    r = SEAL_D / 2
    dl.path('Muhur_Alani', 'seal', Path().m(xFc - r, yBt).a(xFc, yBt, r, 180, 360).z())
    dl.path('Muhur_Alani', 'seal', Path().m(xBc - r, yc).a(xBc, yc, r, 180, 360).z())
    dl.text('Muhur_Alani', 'seal_t', xFc, yBt - r - 2.2, 'MÜHÜR Ø20 – yarısı (metin/ikon/lokal lak yok)', 1.6)
    dl.text('Muhur_Alani', 'seal_t', xBc + r + 1.5, yc - 3.2, 'MÜHÜR Ø20 – yarısı', 1.6, bold=True, anchor='start')
    dl.text('Muhur_Alani', 'seal_t', xBc + r + 1.5, yc - 1.2, 'serbest (açılma) kenarına ortalı', 1.3, anchor='start')

    # --- Güvenli alan
    S = SAFE
    safes = [
        (xS0 + S, yT + S, xS1 - S, yBt - S), (xF0 + S, yT + S, xF1 - S, yBt - S),
        (xR0 + S, yT + S, xR1 - S, yBt - S), (xB0 + S, yF + S, xB1 - S, yBt - S),
        (xB0 + hi + S, ytop + S, xB1 - hi - S, yF - S),
        (xF0 + S, yT - dp + S, xF1 - S, yT - S), (xB0 + S, yBt + S, xB1 - S, yc - S),
    ]
    for (a, b, c, d) in safes:
        if c > a and d > b:
            dl.path('Guvenli_Alan', 'safe', rect(a, b, c, d))
    for cy in (cy1, cy2):
        dl.path('Guvenli_Alan', 'keepout', euro_hole(xBc, cy, HA, RR + HOLE_CLEAR, RC + HOLE_CLEAR))

    # --- Bıçak
    dl.path('Bicak', 'cut', OUT)
    dl.path('Bicak', 'cut', H1); dl.path('Bicak', 'cut', H2p)
    for (a, b, c, d) in SLITS:
        dl.path('Bicak', 'cut', line(a, b, c, d))
    for (a, b, c, d) in CREASES:
        dl.path('Bicak', 'crease', line(a, b, c, d))

    # --- Bilgi: panel adları
    L = 'Bilgi'
    def ttl(x, y, t1, t2=None, rot=0, s1=3.2, s2=2.0, gap=3.6):
        dl.text(L, 'label', x, y, t1, s1, rot=rot, bold=True)
        if t2:
            if rot == 0:
                dl.text(L, 'note', x, y + gap, t2, s2)
            else:
                dl.text(L, 'note', x + gap, y, t2, s2, rot=rot)
    ym = yT + yp / 2
    ttl(xSc - 1.2, ym, 'SOL YAN', f'{fmt(dp)} × {fmt(yp)}', rot=-90)
    ttl(xFc, ym, 'ÖN YÜZ', f'{fmt(gp)} × {fmt(yp)}')
    dl.text(L, 'note', xFc, ym + 7.2, 'dış (baskı) yüzü görünümü', 1.8)
    ttl(xRc - 1.2, ym - 12, 'SAĞ YAN', f'{fmt(dp)} × {fmt(yp)}', rot=-90)
    ttl(xBc, ym, 'ARKA YÜZ', f'{fmt(gp)} × {fmt(yp)}')
    dl.text(L, 'label', xG0 + GL / 2 - 1.2, ym, 'TUTKAL PAYI', 3.0, rot=-90, bold=True)
    dl.text(L, 'note', xG0 + GL / 2 + 2.6, ym, f'{fmt(GL)} mm – baskısız / selefonsuz / laksız', 1.7, rot=-90)
    ttl(xBc, yT - 6.0, 'BAŞLIK – 1. KAT (arka yüz)', 'iç yüzüne: üst yapıştırma dili + 2. kat', s1=2.4, s2=1.5, gap=2.6)
    # 2. kat 180° katlanır: katlanmış kutuda düz okunsun diye etiket açınımda ters yazılır
    dl.text(L, 'label', xBc, yF - 5.5, 'BAŞLIK – 2. KAT (ön yüz)', 2.4, rot=180, bold=True)
    dl.text(L, 'note', xBc, 5.0, 'DİKKAT: Bu panelin grafiği açınımda 180° TERS yerleşir (katlanınca düz okunur)', 1.5)
    dl.text(L, 'note', xBc, 7.6, 'bigiden aşağı katlanır, iç yüzü tutkallı', 1.5)
    ttl(xFc, yT - dp / 2 - 1, 'ÜST KAPAK', f'{fmt(gp)} × {fmt(dp)}', s1=2.6, s2=1.7, gap=3)
    dl.text(L, 'label', xFc, yT - dp - TOPGLUE_H / 2 - 1.4, f'ÜST YAPIŞTIRMA DİLİ {fmt(gp - 2 * gi)} × {fmt(TOPGLUE_H)}', 1.9, bold=True)
    dl.text(L, 'note', xFc, yT - dp - TOPGLUE_H / 2 + 1.6, 'dış yüzü baskısız/selefonsuz – başlık katları arasına yapışır', 1.4)
    for xc in (xSc, xRc):
        dl.text(L, 'label', xc, yT - DUST_L / 2, 'TOZ KAPAĞI', 1.9, rot=-90, bold=True)
        dl.text(L, 'label', xc, yBt + DUST_L / 2, 'TOZ KAPAĞI', 1.9, rot=-90, bold=True)
    dl.text(L, 'label', xB0 + 22, yBt + 8.5, 'ALT KAPAK', 2.4, bold=True)
    dl.text(L, 'note', xB0 + 22, yBt + 11.8, f'{fmt(gp)} × {fmt(dp)}', 1.7)
    dl.text(L, 'label', xBc, yc + 8.2, 'GEÇME DİLİ (slit lock)', 2.2, bold=True)
    dl.text(L, 'note', xBc, yc + 11.2, 'yalnızca zemin rengi – metin yok', 1.5)
    dl.text(L, 'note', xB0 + 2.2, yc + 4.4, f'slit {fmt(SLIT)}', 1.3, anchor='start')
    dl.text(L, 'note', xB1 - 2.2, yc + 4.4, f'slit {fmt(SLIT)}', 1.3, anchor='end')
    dl.text(L, 'note', xBc + HA + RR + 2.5, cy1 - 0.4, 'Euro delik', 1.6, anchor='start')
    dl.text(L, 'note', xBc + HA + RR + 2.5, cy1 + 1.8, f'{fmt(OVAL_W)}×{fmt(OVAL_H)} + Ø{fmt(CIRCLE_D)}', 1.6, anchor='start')
    dl.text(L, 'note', xBc + HA + RR + 2.5, cy2 + 0.8, '2. kat deliği (ayna)', 1.5, anchor='start')

    # --- Bilgi: ölçüler
    def arrow(x, y, dx, dy):
        a, w = 1.5, 0.45
        n = math.hypot(dx, dy); ux, uy = dx / n, dy / n
        dl.path(L, 'arrow', poly([(x, y), (x - ux * a - uy * w, y - uy * a + ux * w), (x - ux * a + uy * w, y - uy * a - ux * w)]))
    def dim_h(x1, x2, y, label, ext=None, size=2.0, above=True):
        dl.path(L, 'dim', line(x1, y, x2, y))
        arrow(x1, y, -1, 0); arrow(x2, y, 1, 0)
        for (x, e) in ((x1, ext[0] if ext else None), (x2, ext[1] if ext else None)):
            if e is not None:
                dl.path(L, 'dim', line(x, e, x, y + (-1.2 if e > y else 1.2)))
        dl.text(L, 'dim_t', (x1 + x2) / 2, y - 0.9 if above else y + 2.6, label, size)
    def dim_v(y1, y2, x, label, ext=None, size=2.0, right=True):
        dl.path(L, 'dim', line(x, y1, x, y2))
        arrow(x, y1, 0, -1); arrow(x, y2, 0, 1)
        for (y, e) in ((y1, ext[0] if ext else None), (y2, ext[1] if ext else None)):
            if e is not None:
                dl.path(L, 'dim', line(e, y, x + (1.2 if x > e else -1.2), y))
        dl.text(L, 'dim_t', x + (2.6 if right else -0.9), (y1 + y2) / 2, label, size, rot=-90)

    tops = {xS0: yT - DUST_L, xS1: min(yT - DUST_L, yT - dp - TOPGLUE_H), xF1: min(yT - dp - TOPGLUE_H, yT - DUST_L),
            xR1: 0.0, xB1: 0.0, xG1: yT + tg}
    cols = [(xS0, xS1), (xS1, xF1), (xF1, xR1), (xR1, xB1), (xB1, xG1)]
    yc1 = -8.0
    for (a, b) in cols:
        dim_h(a, b, yc1, fmt(b - a), ext=(tops[a] - 1.5, tops[b] - 1.5))
    dim_h(xS0, xG1, -17.0, f'{fmt(W)} (toplam açınım genişliği)', ext=(yc1 - 1.2, yc1 - 1.2), size=2.4)
    xr1 = W + 8.0
    rows = [(0.0, yF), (yF, yT), (yT, yBt), (yBt, yc), (yc, yc + TUCK_H)]
    for (a, b) in rows:
        dim_v(a, b, xr1, fmt(b - a))
    for yy in (0.0, yF, yT, yBt, yc, yc + TUCK_H):
        e = xB1 + 1.5 if yy not in (yT, yBt) else xG0 + 1.5
        if yy == yT:
            e = xG0 + 1.5
        dl.path(L, 'dim', line(e, yy, xr1 + 1.2, yy))
    dim_v(0.0, HH, W + 17.0, f'{fmt(HH)} (toplam açınım yüksekliği)', size=2.4)
    dl.path(L, 'dim', line(xr1 + 1.2, 0.0, W + 18.2, 0.0)); dl.path(L, 'dim', line(xB1 - 1, HH, W + 18.2, HH))
    xl = -8.0
    dim_v(yT - DUST_L, yT, xl, fmt(DUST_L), ext=(xS0 + 0.5, None), right=False)
    dim_v(yT, yBt, xl, fmt(yp), right=False)
    dim_v(yBt, yBt + DUST_L, xl, fmt(DUST_L), ext=(None, xS0 + 0.5), right=False)
    for yy in (yT, yBt):
        dl.path(L, 'dim', line(xS0 - 1.5, yy, xl - 1.2, yy))
    xd = xF1 - 9.0
    dim_v(yT - dp, yT, xd, fmt(dp), size=1.7)
    dim_v(yT - dp - TOPGLUE_H, yT - dp, xd, fmt(TOPGLUE_H), size=1.7)
    dim_v(yF, yF + HOLE_TOP, xBc - HA - RR - 5, fmt(HOLE_TOP), size=1.8, right=False)
    dl.path(L, 'dim', line(xBc - HA - RR - 6.5, yF + HOLE_TOP, xBc - 1, yF + HOLE_TOP))
    dim_h(xB0 + ti, xB1 - ti, HH + 7.0, f'{fmt(gp - 2 * ti)} (geçme dili)', ext=(yc + 2 + 1.5, yc + 2 + 1.5), above=False)
    dim_v(yBt - LOT_UP, yBt, xR1 - 1.8, fmt(LOT_UP), size=1.3)

    return dl, flat, bleed, OUT, H1, H2p


# --------------------------------------------------------- stiller
def cmyk(c, m, y, k):
    return ('cmyk', c, m, y, k)
SPOT = ('spot', 'Bicak', 0, 1, 0, 0)
K = lambda k: cmyk(0, 0, 0, k)

STYLES = {
    'dieline': {
        'cut': dict(stroke=SPOT, w=HAIR, op=True),
        'crease': dict(stroke=SPOT, w=HAIR, dash=(3, 1.5), op=True),
        'bleed': dict(stroke=cmyk(.7, 0, 0, 0), w=HAIR),
        'safe': dict(stroke=cmyk(.7, 0, 1, 0), w=HAIR, dash=(1, 1)),
        'keepout': dict(stroke=cmyk(.7, 0, 1, 0), w=HAIR, dash=(0.6, 0.6)),
        'glue': dict(fill=cmyk(0, 0, .28, 0)),
        'glue_hatch': dict(stroke=cmyk(0, .2, .6, .2), w=0.1),
        'lot': dict(fill=cmyk(.18, 0, 0, 0), stroke=cmyk(.9, .5, 0, 0), w=0.15),
        'lot_t': dict(color=cmyk(.9, .6, 0, .2)),
        'seal': dict(fill=cmyk(0, .22, .38, 0), stroke=cmyk(0, .7, 1, 0), w=0.15, dash=(1, .6)),
        'seal_t': dict(color=cmyk(0, .75, 1, .25)),
        'label': dict(color=K(.85)), 'note': dict(color=K(.7)),
        'dim': dict(stroke=K(.75), w=0.1), 'arrow': dict(fill=K(.75)), 'dim_t': dict(color=K(.85)),
    },
    'maket': {
        'cut': dict(stroke=K(1), w=0.25),
        'crease': dict(stroke=K(.75), w=0.2, dash=(2.5, 1.5)),
        'glue_hatch': dict(stroke=K(.35), w=0.1),
        'lot': dict(stroke=K(.4), w=0.1), 'lot_t': dict(color=K(.45)),
        'seal': dict(stroke=K(.4), w=0.1, dash=(1, .6)), 'seal_t': dict(color=K(.45)),
        'label': dict(color=K(.45)), 'note': dict(color=K(.4)),
    },
    'texture': {
        'cut': dict(stroke=K(.9), w=0.35),
        'crease': dict(stroke=K(.55), w=0.25, dash=(3, 1.5)),
        'glue': dict(fill=cmyk(0, 0, .28, 0)), 'glue_hatch': dict(stroke=cmyk(0, .2, .6, .2), w=0.12),
        'lot': dict(fill=cmyk(.18, 0, 0, 0), stroke=cmyk(.9, .5, 0, 0), w=0.2),
        'lot_t': dict(color=cmyk(.9, .6, 0, .2)),
        'seal': dict(fill=cmyk(0, .22, .38, 0), stroke=cmyk(0, .7, 1, 0), w=0.2, dash=(1, .6)),
        'seal_t': dict(color=cmyk(0, .75, 1, .25)),
        'label': dict(color=K(.8)), 'note': dict(color=K(.65)),
    },
}

LAYERS = [  # alttan üste çizim sırası; (id, görünen ad)
    ('Tasma', 'Tasma'), ('Tutkal_Alani', 'Tutkal_Alani'), ('Lot_Alani', 'Lot_Alani'),
    ('Muhur_Alani', 'Muhur_Alani'), ('Guvenli_Alan', 'Guvenli_Alan'), ('Bilgi', 'Bilgi'), ('Bicak', 'Bıçak'),
]


def rgb_hex(col):
    if col[0] == 'spot':
        return '#EC008C'
    _, c, m, y, k = col
    r, g, b = [round(255 * (1 - v) * (1 - k)) for v in (c, m, y)]
    return f'#{r:02X}{g:02X}{b:02X}'


# ------------------------------------------------------------ metin
from reportlab.pdfbase.pdfmetrics import stringWidth
_TRW = str.maketrans('ğĞşŞıİ', 'gGsSiI')

def text_width(s, size, bold):
    return stringWidth(s.translate(_TRW), 'Helvetica-Bold' if bold else 'Helvetica', size)

def text_origin(it):
    """Metnin başlangıç taban çizgisi noktası (x,y) – dikey ortalı, anchor'a göre yatay."""
    th = math.radians(it['rot'])
    ux, uy = math.cos(th), math.sin(th)
    vx, vy = math.sin(th), -math.cos(th)            # görsel "yukarı"
    w = text_width(it['txt'], it['size'], it['bold'])
    f = {'start': 0, 'middle': .5, 'end': 1}[it['anchor']]
    cap = 0.36 * it['size']
    x = it['x'] - ux * w * f - vx * cap
    y = it['y'] - uy * w * f - vy * cap
    return x, y


# ------------------------------------------------------------ SVG
def svg_d(p):
    out = []
    for c in p.c:
        if c[0] == 'M': out.append(f'M{c[1]:.3f} {c[2]:.3f}')
        elif c[0] == 'L': out.append(f'L{c[1]:.3f} {c[2]:.3f}')
        elif c[0] == 'A':
            _, cx, cy, r, a0, a1 = c
            ex, ey = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
            large = 1 if abs(a1 - a0) > 180 else 0
            sweep = 1 if a1 > a0 else 0
            out.append(f'A{r:.3f} {r:.3f} 0 {large} {sweep} {ex:.3f} {ey:.3f}')
        elif c[0] == 'Z': out.append('Z')
    return ' '.join(out)

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def write_svg(dl, mode, path, page, offset, extra=None, title=''):
    pw, ph = page; ox, oy = offset
    st = STYLES[mode]
    o = ['<?xml version="1.0" encoding="UTF-8"?>',
         f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" '
         f'version="1.1" width="{pw:.3f}mm" height="{ph:.3f}mm" viewBox="0 0 {pw:.3f} {ph:.3f}">',
         f'<title>{esc(title)}</title>',
         '<desc>1 birim = 1 mm. Bicak katmanı: spot renk "Bicak" (ekranda #EC008C), 0,25 pt, overprint (overprint ve spot tanımı PDF dosyasında).</desc>']
    for lid, lname in LAYERS + ([('Sayfa', 'Sayfa')] if extra else []):
        items = [it for it in dl.items if it['layer'] == lid and it['role'] in st] if lid != 'Sayfa' else extra.items
        if not items:
            continue
        o.append(f'<g id="{lid}" data-name="{lname}" inkscape:groupmode="layer" inkscape:label="{lname}" '
                 f'transform="translate({ox:.3f} {oy:.3f})">' if lid != 'Sayfa' else
                 f'<g id="{lid}" data-name="{lname}" inkscape:groupmode="layer" inkscape:label="{lname}">')
        for it in items:
            s = (STYLES[mode] if lid != 'Sayfa' else PAGE_STYLE)[it['role']]
            if it['k'] == 'path':
                attrs = [f'd="{svg_d(it["p"])}"']
                attrs.append(f'fill="{rgb_hex(s["fill"])}"' if 'fill' in s else 'fill="none"')
                if 'stroke' in s:
                    attrs.append(f'stroke="{rgb_hex(s["stroke"])}" stroke-width="{s["w"]:.4f}"')
                    if 'dash' in s:
                        attrs.append(f'stroke-dasharray="{s["dash"][0]} {s["dash"][1]}"')
                o.append(f'<path {" ".join(attrs)}/>')
            else:
                x, y = text_origin(it)
                rot = f' transform="rotate({it["rot"]} {x:.3f} {y:.3f})"' if it['rot'] else ''
                o.append(f'<text x="{x:.3f}" y="{y:.3f}" font-family="Helvetica, Arial, sans-serif" '
                         f'font-size="{it["size"]}" font-weight="{"bold" if it["bold"] else "normal"}" '
                         f'fill="{rgb_hex(s["color"])}"{rot}>{esc(it["txt"])}</text>')
        o.append('</g>')
    o.append('</svg>')
    open(path, 'w', encoding='utf-8').write('\n'.join(o))


# ------------------------------------------------------------ PDF
PT = 72 / 25.4
TR_CODES = {'Ğ': 128, 'ğ': 129, 'İ': 130, 'ı': 131, 'Ş': 132, 'ş': 133}

def pdf_str(s):
    b = bytearray()
    for ch in s:
        if ch in TR_CODES: b.append(TR_CODES[ch])
        else: b += ch.encode('cp1252', errors='replace')
    out = ''
    for v in b:
        c = chr(v)
        if c in '()\\': out += '\\' + c
        elif v < 32 or v > 126: out += f'\\{v:03o}'
        else: out += c
    return '(' + out + ')'

def pdf_path(p):
    ops = []
    for c in p.c:
        if c[0] == 'M': ops.append(f'{c[1]:.4f} {c[2]:.4f} m')
        elif c[0] == 'L': ops.append(f'{c[1]:.4f} {c[2]:.4f} l')
        elif c[0] == 'A':
            _, cx, cy, r, a0, a1 = c
            n = max(1, math.ceil(abs(a1 - a0) / 90 - 1e-9))
            for i in range(n):
                t0 = math.radians(a0 + (a1 - a0) * i / n); t1 = math.radians(a0 + (a1 - a0) * (i + 1) / n)
                kap = 4 / 3 * math.tan((t1 - t0) / 4)
                p0 = (cx + r * math.cos(t0), cy + r * math.sin(t0)); p3 = (cx + r * math.cos(t1), cy + r * math.sin(t1))
                p1 = (p0[0] - kap * r * math.sin(t0), p0[1] + kap * r * math.cos(t0))
                p2 = (p3[0] + kap * r * math.sin(t1), p3[1] - kap * r * math.cos(t1))
                ops.append(f'{p1[0]:.4f} {p1[1]:.4f} {p2[0]:.4f} {p2[1]:.4f} {p3[0]:.4f} {p3[1]:.4f} c')
        elif c[0] == 'Z': ops.append('h')
    return '\n'.join(ops)

def pdf_col(col, stroke):
    if col[0] == 'spot':
        return f'/CSBicak {"CS" if stroke else "cs"} 1 {"SCN" if stroke else "scn"}'
    _, c, m, y, k = col
    return f'{c:.3f} {m:.3f} {y:.3f} {k:.3f} {"K" if stroke else "k"}'

def pdf_items(items, styles):
    o = []
    for it in items:
        s = styles[it['role']]
        o.append('q')
        if s.get('op'): o.append('/GSop gs')
        if it['k'] == 'path':
            if 'fill' in s: o.append(pdf_col(s['fill'], False))
            if 'stroke' in s:
                o.append(pdf_col(s['stroke'], True)); o.append(f'{s["w"]:.4f} w')
                o.append(f'[{s["dash"][0]} {s["dash"][1]}] 0 d' if 'dash' in s else '[] 0 d')
            o.append(pdf_path(it['p']))
            o.append('B' if ('fill' in s and 'stroke' in s) else ('f' if 'fill' in s else 'S'))
        else:
            x, y = text_origin(it)
            th = math.radians(it['rot'])
            ca, sa = math.cos(th), math.sin(th)
            o.append(pdf_col(s['color'], False))
            o.append(f'BT /{"F2" if it["bold"] else "F1"} {it["size"]} Tf {ca:.5f} {sa:.5f} {sa:.5f} {-ca:.5f} {x:.4f} {y:.4f} Tm '
                     f'{pdf_str(it["txt"])} Tj ET')
        o.append('Q')
    return o

def utf16(s):
    return '<FEFF' + s.encode('utf-16-be').hex().upper() + '>'

def write_pdf(dl, mode, path, page, offset, extra=None, layered=True, title=''):
    pw, ph = page; ox, oy = offset
    st = STYLES[mode]
    objs = {}
    def add(n, body): objs[n] = body
    content = [f'{PT:.6f} 0 0 {-PT:.6f} 0 {ph * PT:.4f} cm']   # mm, y aşağı
    ocg_nums = []; props = []
    nxt = 20
    if extra:
        content.append('q'); content += pdf_items(extra.items, PAGE_STYLE); content.append('Q')
    for lid, lname in LAYERS:
        items = [it for it in dl.items if it['layer'] == lid and it['role'] in st]
        if not items: continue
        if layered:
            add(nxt, f'<< /Type /OCG /Name {utf16(lname)} >>')
            ocg_nums.append(nxt); props.append(f'/L{nxt} {nxt} 0 R')
            content.append(f'/OC /L{nxt} BDC')
            nxt += 1
        content.append(f'q 1 0 0 1 {ox:.4f} {oy:.4f} cm')
        content += pdf_items(items, st)
        content.append('Q')
        if layered: content.append('EMC')
    raw = '\n'.join(content).encode('latin-1')
    comp = zlib.compress(raw, 9)
    enc = ('<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences '
           '[128 /Gbreve /gbreve /Idotaccent /dotlessi /Scedilla /scedilla] >>')
    ocprops = ''
    if layered:
        refs = ' '.join(f'{n} 0 R' for n in ocg_nums)
        order = ' '.join(f'{n} 0 R' for n in reversed(ocg_nums))
        ocprops = f'/OCProperties << /OCGs [{refs}] /D << /Name (Katmanlar) /Order [{order}] /ON [{refs}] /OFF [] >> >>'
    add(1, f'<< /Type /Catalog /Pages 2 0 R {ocprops} >>')
    add(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
    mb = f'[0 0 {pw * PT:.4f} {ph * PT:.4f}]'
    prop_s = f'/Properties << {" ".join(props)} >>' if props else ''
    add(3, f'<< /Type /Page /Parent 2 0 R /MediaBox {mb} /TrimBox {mb} /Contents 4 0 R '
           f'/Resources << /Font << /F1 5 0 R /F2 6 0 R >> /ExtGState << /GSop 8 0 R >> '
           f'/ColorSpace << /CSBicak [/Separation /Bicak /DeviceCMYK 9 0 R] >> {prop_s} >> >>')
    add(4, None)
    add(5, f'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding 7 0 R >>')
    add(6, f'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding 7 0 R >>')
    add(7, enc)
    add(8, '<< /Type /ExtGState /OP true /op true /OPM 1 >>')
    add(9, '<< /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [0 1 0 0] /N 1 >>')
    add(10, f'<< /Title {utf16(title)} /Producer (kutu_acinim.py) /Creator (Candemsoft Ambalaj Asama1) >>')
    out = bytearray(b'%PDF-1.6\n%\xe2\xe3\xcf\xd3\n')
    offs = {}
    for n in sorted(objs):
        offs[n] = len(out)
        if n == 4:
            out += f'4 0 obj\n<< /Length {len(comp)} /Filter /FlateDecode >>\nstream\n'.encode() + comp + b'\nendstream\nendobj\n'
        else:
            out += f'{n} 0 obj\n{objs[n]}\nendobj\n'.encode('latin-1')
    mx = max(objs)
    xref = len(out)
    out += f'xref\n0 {mx + 1}\n0000000000 65535 f \n'.encode()
    for n in range(1, mx + 1):
        out += (f'{offs[n]:010d} 00000 n \n' if n in offs else '0000000000 65535 f \n').encode()
    out += f'trailer\n<< /Size {mx + 1} /Root 1 0 R /Info 10 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode()
    open(path, 'wb').write(bytes(out))


# ---------------------------------------------- sayfa öğeleri (başlık/lejant)
PAGE_STYLE = {
    'pt_title': dict(color=K(.9)), 'pt_text': dict(color=K(.75)), 'pt_line': dict(stroke=K(1), w=0.25),
    'pt_thin': dict(stroke=K(.6), w=0.15),
    'lg_cut': dict(stroke=SPOT, w=HAIR * 3), 'lg_crease': dict(stroke=SPOT, w=HAIR * 3, dash=(3, 1.5)),
    'lg_bleed': dict(stroke=cmyk(.7, 0, 0, 0), w=HAIR * 3), 'lg_safe': dict(stroke=cmyk(.7, 0, 1, 0), w=HAIR * 3, dash=(1, 1)),
    'lg_glue': dict(fill=cmyk(0, 0, .28, 0), stroke=cmyk(0, .2, .6, .2), w=0.1),
    'lg_lot': dict(fill=cmyk(.18, 0, 0, 0), stroke=cmyk(.9, .5, 0, 0), w=0.15),
    'lg_seal': dict(fill=cmyk(0, .22, .38, 0), stroke=cmyk(0, .7, 1, 0), w=0.15),
}

def page_dieline(ox, oy):
    pg = DL()
    y0 = oy + HH + 16
    pg.text('Sayfa', 'pt_title', ox, y0, f'Candemsoft Akıllı Araç QR Etiketi – Kutu Açınımı (Bıçak İzi) {VERSION}', 3.4, bold=True, anchor='start')
    pg.text('Sayfa', 'pt_text', ox, y0 + 5,
            f'İç ölçü {fmt(G)} (G) × {fmt(D)} (D) × {fmt(Y)} (Y) mm  •  Euro başlık {fmt(H)} mm  •  350 g/m² GC1, t={fmt(T)} mm  •  '
            f'Açınım {fmt(W)} × {fmt(HH)} mm  •  Ölçek 1:1, mm  •  Dış (baskı) yüzü görünümü', 2.2, anchor='start')
    leg = [('lg_cut', 'Kesim – spot "Bicak", 0,25 pt, overprint'), ('lg_crease', 'Bigi – spot "Bicak", kesikli'),
           ('lg_bleed', f'Taşma sınırı ({fmt(BLEED)} mm)'), ('lg_safe', f'Güvenli alan ({fmt(SAFE)} mm) / delik çevresi {fmt(HOLE_CLEAR)} mm'),
           ('lg_glue', 'Tutkal alanı – baskısız/selefonsuz/laksız'), ('lg_lot', 'Lot kutucuğu – laksız + SELEFONSUZ (inkjet)'),
           ('lg_seal', f'Mühür alanı Ø{fmt(SEAL_D)} – metin/ikon/lokal lak yok')]
    for i, (role, txt) in enumerate(leg):
        cx = ox + (i % 3) * 88; cy = y0 + 11 + (i // 3) * 5.2
        if role in ('lg_glue', 'lg_lot', 'lg_seal'):
            pg.path('Sayfa', role, rect(cx, cy - 1.6, cx + 8, cy + 1.2))
        else:
            pg.path('Sayfa', role, line(cx, cy, cx + 8, cy))
        pg.text('Sayfa', 'pt_text', cx + 10, cy, txt, 2.0, anchor='start')
    pg.text('Sayfa', 'pt_text', ox, y0 + 28, 'Katmanlar: Bıçak, Bilgi, Guvenli_Alan, Muhur_Alani, Lot_Alani, Tutkal_Alani, Tasma. '
            'Bıçak dışındaki katmanlar yardımcıdır, baskıya çıkmaz.', 1.9, anchor='start')
    return pg


def page_maket(ox, oy, pw):
    pg = DL()
    pg.text('Sayfa', 'pt_title', 15, 14, f'BEYAZ MAKET – Candemsoft QR Kutu Açınımı {VERSION}  (A3, %100)', 4.2, bold=True, anchor='start')
    pg.text('Sayfa', 'pt_text', 15, 20.5, 'Yazdırırken "Gerçek boyut / %100" seçin; "Sayfaya sığdır" KAPALI olsun. '
            'Aşağıdaki 50 mm çizgileri cetvelle kontrol edin.', 2.4, anchor='start')
    pg.text('Sayfa', 'pt_text', 15, 25.5, f'İç ölçü {fmt(G)}×{fmt(D)}×{fmt(Y)} mm  •  Açınım {fmt(W)}×{fmt(HH)} mm  •  '
            'Düz çizgi: kes  •  Kesikli çizgi: bigi (katla)  •  Taralı: tutkal', 2.4, anchor='start')
    ry = oy + HH + 14
    pg.path('Sayfa', 'pt_line', line(15, ry, 65, ry))
    for i in range(6):
        pg.path('Sayfa', 'pt_line', line(15 + i * 10, ry - (2.5 if i in (0, 5) else 1.5), 15 + i * 10, ry + (2.5 if i in (0, 5) else 1.5)))
    pg.text('Sayfa', 'pt_text', 40, ry + 6, '50 mm (yatay kontrol)', 2.4)
    vx = pw - 20
    pg.path('Sayfa', 'pt_line', line(vx, ry - 4, vx, ry + 46))
    for i in range(6):
        yy = ry - 4 + i * 10
        pg.path('Sayfa', 'pt_line', line(vx - (2.5 if i in (0, 5) else 1.5), yy, vx + (2.5 if i in (0, 5) else 1.5), yy))
    pg.text('Sayfa', 'pt_text', vx - 5, ry + 21, '50 mm (dikey kontrol)', 2.4, rot=-90)
    steps = ['KATLAMA SIRASI',
             '1. Kesik çizgilerin hepsini cetvel + boş tükenmez kalemle hafifçe çizip katlayın.',
             '2. Tutkal payını Sol yan panelin İÇ yüzüne yapıştırın (gövde halkası).',
             '3. Üst toz kapaklarını içe katlayın, üst kapağı kapatın; yapıştırma dilini başlık',
             '    1. katının iç (ön) yüzüne yapıştırın.',
             '4. Başlık 2. katını bigiden aşağı katlayıp yapıştırın – iki Euro delik çakışmalı.',
             '5. Alt toz kapaklarını içe, alt kapağı kapatın; geçme dilini Ön panelin arkasına sokun.',
             '6. Kontrol: iç ölçü yaklaşık 96 × 18 × 136 mm, 92×132 taşıyıcı kart rahat girmeli.']
    for i, s in enumerate(steps):
        pg.text('Sayfa', 'pt_title' if i == 0 else 'pt_text', 80, ry - 2 + i * 5, s, 2.6 if i == 0 else 2.3,
                bold=(i == 0), anchor='start')
    return pg


# ------------------------------------------------------ 3D (katlama) verisi
import numpy as np

def panels_def():
    """Katlama ağacı: (ad, poligon, delikler, ebeveyn, menteşe p0,p1, yön, açı, faz, z-ofset)"""
    P = []
    def add(name, pts, parent, h0, h1, direction='in', ang=90, phase=(0, 1), off=0.0, holes=()):
        P.append(dict(name=name, pts=pts, holes=[h.points(6) if isinstance(h, Path) else h for h in holes],
                      parent=parent, h0=h0, h1=h1, dir=direction, ang=ang, phase=phase, off=off))
    R = lambda a, b, c, d: [(a, b), (c, b), (c, d), (a, d)]
    add('On', R(xF0, yT, xF1, yBt), None, (0, 0), (0, 1))
    add('Sol', R(xS0, yT, xS1, yBt), 'On', (xF0, yT), (xF0, yBt), phase=(0, .3))
    add('Sag', R(xR0, yT, xR1, yBt), 'On', (xF1, yT), (xF1, yBt), phase=(0, .3))
    add('Arka', R(xB0, yF, xB1, yBt), 'Sag', (xR1, yT), (xR1, yBt), phase=(.05, .35), holes=[euro_hole(xBc, cy1)])
    add('Tutkal', glue_pts(), 'Arka', (xB1, yT), (xB1, yBt), phase=(.05, .32), off=-T)
    add('SolUstToz', dust_pts(xS0, xS1, yT, -1), 'Sol', (xS0, yT), (xS1, yT), phase=(.35, .47), off=-T)
    add('SagUstToz', dust_pts(xR0, xR1, yT, -1), 'Sag', (xR0, yT), (xR1, yT), phase=(.35, .47), off=-T)
    add('UstKapak', R(xF0, yT - dp, xF1, yT), 'On', (xF0, yT), (xF1, yT), phase=(.45, .58))
    add('UstDil', topglue_pts(), 'UstKapak', (xF0 + gi, yT - dp), (xF1 - gi, yT - dp), direction='out', phase=(.5, .62), off=-T)
    add('Baslik2', header2_path().points(6), 'Arka', (xB0 + hi, yF), (xB1 - hi, yF), ang=180, phase=(.6, .74),
        off=2 * T, holes=[euro_hole(xBc, cy2)])
    add('SolAltToz', dust_pts(xS0, xS1, yBt, 1), 'Sol', (xS0, yBt), (xS1, yBt), phase=(.74, .84), off=-T)
    add('SagAltToz', dust_pts(xR0, xR1, yBt, 1), 'Sag', (xR0, yBt), (xR1, yBt), phase=(.74, .84), off=-T)
    add('AltKapak', R(xB0, yBt, xB1, yc), 'Arka', (xB0, yBt), (xB1, yBt), phase=(.82, .92))
    add('Dil', tuck_path().points(6), 'AltKapak', (xB0, yc), (xB1, yc), phase=(.9, 1), off=-T)
    return P

def v3(p):
    return np.array([p[0], -p[1], 0.0])

def rot_axis(axis, th):
    a = axis / np.linalg.norm(axis); x, y, z = a
    c, s = math.cos(th), math.sin(th); C = 1 - c
    return np.array([[c + x * x * C, x * y * C - z * s, x * z * C + y * s],
                     [y * x * C + z * s, c + y * y * C, y * z * C - x * s],
                     [z * x * C - y * s, z * y * C + x * s, c + z * z * C]])

def local_fold(pn, th):
    """Ebeveyn çerçevesinde 4x4 dönüşüm (menteşe etrafında θ)."""
    p0, p1 = v3(pn['h0']), v3(pn['h1'])
    Rm = rot_axis(p1 - p0, th)
    M = np.eye(4); M[:3, :3] = Rm; M[:3, 3] = p0 - Rm @ p0
    O = np.eye(4); O[2, 3] = pn['off']
    return M @ O

def resolve_signs(P):
    for pn in P:
        if pn['parent'] is None:
            pn['angle'] = 0.0; continue
        cen = np.mean([v3(q) for q in pn['pts']], axis=0)
        M = local_fold(dict(pn, off=0), math.radians(90))
        z = (M @ np.append(cen, 1))[2]
        inward = z < 0
        sign = 1 if inward else -1
        if pn['dir'] == 'out': sign = -sign
        pn['angle'] = sign * pn['ang']

def world_mats(P, t=1.0):
    byname = {p['name']: p for p in P}; W_ = {}
    def get(n):
        if n in W_: return W_[n]
        pn = byname[n]
        if pn['parent'] is None:
            W_[n] = np.eye(4); return W_[n]
        a, b = pn['phase']
        f = min(1, max(0, (t - a) / (b - a)))
        W_[n] = get(pn['parent']) @ local_fold(pn, math.radians(pn['angle'] * f))
        return W_[n]
    for p in P: get(p['name'])
    return W_

def wpt(Wm, name, p):
    return (Wm[name] @ np.append(v3(p), 1))[:3]


# ------------------------------------------------------------ kontroller
def checks(flat, P):
    R = []
    def ok(name, cond, detail):
        R.append((name, bool(cond), detail))
    Wm = world_mats(P, 1.0)
    # halka kapanışı
    d1 = np.linalg.norm(wpt(Wm, 'Arka', (xB1, yT)) - wpt(Wm, 'Sol', (xS0, yT)))
    d2 = np.linalg.norm(wpt(Wm, 'Arka', (xB1, yBt)) - wpt(Wm, 'Sol', (xS0, yBt)))
    ok('Gövde halkası kapanıyor (Arka serbest kenarı = Sol serbest kenarı)', max(d1, d2) < 1e-6, f'sapma {max(d1, d2):.4f} mm')
    # dış (bigi) ve iç ölçüler
    xs = [wpt(Wm, 'Sol', (xSc, yT))[0], wpt(Wm, 'Sag', (xRc, yT))[0]]
    zs = [wpt(Wm, 'On', (xFc, yT))[2], wpt(Wm, 'Arka', (xBc, yT))[2]]
    ys = [wpt(Wm, 'On', (xFc, yT))[1], wpt(Wm, 'On', (xFc, yBt))[1]]
    gw, gd, gh = abs(xs[1] - xs[0]), abs(zs[1] - zs[0]), abs(ys[1] - ys[0])
    iw, idp, ih = gw - T, gd - T, gh - T
    ok('İç genişlik (G) 96 ±1', abs(iw - G) <= 1, f'bigi-bigi {fmt(gw)} → iç ≈ {fmt(iw)} mm')
    ok('İç derinlik (D) 18 ±1', abs(idp - D) <= 1, f'bigi-bigi {fmt(gd)} → iç ≈ {fmt(idp)} mm')
    ok('İç yükseklik (Y) 136 ±1', abs(ih - Y) <= 1, f'bigi-bigi {fmt(gh)} → iç ≈ {fmt(ih)} mm')
    # üst kapak arka düzleme oturuyor
    e = wpt(Wm, 'UstKapak', (xFc, yT - dp))
    ok('Üst kapak serbest kenarı Arka düzlemine oturuyor', abs(e[2] - zs[1]) < 1e-6 and abs(e[1] - ys[0]) < 1e-6,
       f'z farkı {abs(e[2] - zs[1]):.4f} mm')
    # Euro delikler çakışıyor
    c1 = wpt(Wm, 'Arka', (xBc, cy1)); c2 = wpt(Wm, 'Baslik2', (xBc, cy2))
    dxy = math.hypot(c1[0] - c2[0], c1[1] - c2[1])
    ok('Başlık 1. ve 2. kat Euro delikleri üst üste', dxy < 0.01, f'eksen kayması {dxy:.4f} mm, katlar arası {abs(c1[2] - c2[2]):.2f} mm')
    # başlık 2. kat alt kenarı – üst kapak
    b2 = wpt(Wm, 'Baslik2', (xBc, ytop)); gap = b2[1] - ys[0]
    ok('Başlık 2. kat alt kenarı üst kapağa çarpmıyor', gap > 0, f'boşluk {fmt(gap)} mm')
    # üst yapıştırma dili Euro deliğe girmiyor
    dtop = wpt(Wm, 'UstDil', (xFc, yT - dp - TOPGLUE_H))[1]
    hole_bottom = wpt(Wm, 'Arka', (xBc, yF + HOLE_TOP + 2 * RC))[1]
    ok('Üst yapıştırma dili Euro deliğe ulaşmıyor', dtop < hole_bottom, f'dil üstü ile delik altı arası {fmt(hole_bottom - dtop)} mm')
    # dil + toz kapakları
    ok('Geçme dili iç genişliğe sığıyor', gp - 2 * ti <= G - 0.5, f'dil {fmt(gp - 2 * ti)} mm / iç {fmt(G)} mm')
    tip = wpt(Wm, 'Dil', (xBc, yc + TUCK_H))
    inside = (zs[1] < tip[2] <= zs[0]) and ys[1] < tip[1] < ys[0]
    ok('Geçme dili kutu içine, Ön panelin arkasına giriyor', inside, f'dil ucu Ön iç yüzünden {fmt(abs(tip[2] - zs[0]), 2)} mm içeride')
    ok('Toz kapakları birbirine çakışmıyor (üst ve alt)', 2 * DUST_L < G, f'aradaki boşluk {fmt(G - 2 * DUST_L)} mm')
    ok('Toz kapağı genişliği derinliğe sığıyor', dp - 2 * DUST_INSET <= D, f'{fmt(dp - 2 * DUST_INSET)} ≤ {fmt(D)} mm')
    gz = wpt(Wm, 'Tutkal', (xG1, (yT + yBt) / 2))
    ok('Tutkal payı Sol yan iç yüzünde kalıyor', GL <= D and abs(gz[0] - xs[0]) < T + 1e-6, f'{fmt(GL)} mm / Sol iç {fmt(D)} mm')
    # güvenli alan
    ok('Euro delik güvenli alanda (bigiden ≥ 4 mm)', HOLE_TOP >= SAFE, f'delik üstü bigiden {fmt(HOLE_TOP)} mm')
    ok('Euro delik yatayda güvenli alanda', (gp - OVAL_W) / 2 >= SAFE + HOLE_CLEAR, f'yan boşluk {fmt((gp - OVAL_W) / 2)} mm')
    ok('Delik altında 3 mm metinsiz bant sonrası başlıkta alan kalıyor', H - (HOLE_TOP + 2 * RC + HOLE_CLEAR) - SAFE > 0,
       f'delik altı kullanılabilir {fmt(H - (HOLE_TOP + 2 * RC + HOLE_CLEAR) - SAFE)} mm')
    lot_margin = (dp - LOT_W) / 2
    ok('Lot kutucuğu Sağ yan güvenli alanında', lot_margin >= SAFE and LOT_UP >= SAFE, f'yan pay {fmt(lot_margin)} mm, bigiden {fmt(LOT_UP)} mm')
    ok('Mühür yarısı alt kapağa sığıyor', SEAL_D / 2 <= dp - SAFE / 2, f'{fmt(SEAL_D / 2)} mm / kapak {fmt(dp)} mm')
    # içerik
    ok('Taşıyıcı kart iç ölçüye sığıyor', CARRIER[0] <= G - 2 and CARRIER[1] <= Y - 2, f'{fmt(CARRIER[0])}×{fmt(CARRIER[1])} / {fmt(G)}×{fmt(Y)}')
    ok('Paket kalınlığı derinliğe sığıyor (varsayım)', STACK <= D, f'{fmt(STACK)} / {fmt(D)} mm – boşluk {fmt(D - STACK)} mm')
    ok('Açınım geçerli tek parça (kendini kesmiyor)', flat.is_valid and flat.geom_type == 'Polygon', f'alan {fmt(flat.area / 100, 1)} cm²')
    ok('A3 maket sayfasına sığıyor', W <= 297 - 20 and HH <= 420 - 110, f'{fmt(W)}×{fmt(HH)} mm')
    return R


def scenario(Dv):
    dpv = Dv + ALLOW
    lot_m = (dpv - LOT_W) / 2
    return dict(D=Dv, dp=dpv, W=2 * dpv + 2 * gp + GL, safe_w=dpv - 2 * SAFE, lot_margin=lot_m,
                lot_ok=lot_m >= SAFE, lot_min_D=LOT_W + 2 * SAFE - ALLOW,
                top_safe=dpv - 2 * SAFE, seal_ok=SEAL_D / 2 <= dpv,
                dust_ok=dpv - 2 * DUST_INSET > 0, glue_ok=GL <= Dv)


# ------------------------------------------------------------ rapor
def report(R, bleed):
    bx0, by0, bx1, by1 = bleed.bounds
    s12 = scenario(12.0)
    L = []
    a = L.append
    a(f'# Candemsoft QR Kutu – Aşama 1 Ölçü Raporu ({VERSION})')
    a('')
    a('Kaynak: Candemsoft_Ambalaj_Sartnamesi.pdf v1.0 · Tarih: 22.09.2026 · Üreteç: `kutu_acinim.py` (parametrik)')
    a('')
    a('## 1. Özet')
    a('')
    a('| | Değer |'); a('|---|---|')
    a(f'| Kutu tipi | Euro askı delikli çift kat başlık + alt reverse-tuck slit lock, yan yapıştırmalı |')
    a(f'| İç ölçü (G × D × Y) | {fmt(G)} × {fmt(D)} × {fmt(Y)} mm |')
    a(f'| **Açınım (kesim) toplam ölçüsü** | **{fmt(W)} × {fmt(HH)} mm** (G × Y) |')
    a(f'| Taşma dahil | {fmt(bx1 - bx0)} × {fmt(by1 - by0)} mm |')
    a(f'| Karton | 350 g/m² GC1, t = {fmt(T)} mm → bigi payı +{fmt(ALLOW)} mm |')
    a(f'| Kesilmiş karton alanı | ≈ {fmt(FLAT_AREA / 100, 1)} cm² |')
    a('')
    a('## 2. Panel ve kapak ölçüleri (bigi-bigi, mm)')
    a('')
    a('Dizilim (dış/baskı yüzünden, soldan sağa): **Sol – Ön – Sağ – Arka – Tutkal**. Üst kapak Ön’e, alt kilitli kapak Arka’ya bağlı; başlık Arka düzleminde.')
    a('')
    a('| Parça | Ölçü | Not |'); a('|---|---|---|')
    a(f'| Ön / Arka | {fmt(gp)} × {fmt(yp)} | iç 96 + {fmt(ALLOW)} |')
    a(f'| Sol / Sağ yan | {fmt(dp)} × {fmt(yp)} | iç 18 + {fmt(ALLOW)} |')
    a(f'| Tutkal payı | {fmt(GL)} × {fmt(yp)} | uçlar {fmt(GLUE_TAPER_DEG, 0)}° eğimli, Sol yan iç yüzüne yapışır |')
    a(f'| Euro başlık 1. kat | {fmt(gp)} × {fmt(H)} | Arka’nın devamı (bigi yok) |')
    a(f'| Euro başlık 2. kat | {fmt(gp - 2 * hi)} × {fmt(H2)} | bigiden aşağı katlanır, köşe R{fmt(HDR_R)} |')
    a(f'| Üst kapak | {fmt(gp)} × {fmt(dp)} | Ön’e bağlı, kalıcı yapıştırılır |')
    a(f'| Üst yapıştırma dili | {fmt(gp - 2 * gi)} × {fmt(TOPGLUE_H)} | başlık katları arasına; **dış yüzü baskısız/selefonsuz** |')
    a(f'| Toz kapakları (4 adet) | {fmt(dp)} × {fmt(DUST_L)} | yanlardan {fmt(DUST_INSET)} mm boşluk, uç pahlı |')
    a(f'| Alt kapak | {fmt(gp)} × {fmt(dp)} | Arka’ya bağlı |')
    a(f'| Geçme dili | {fmt(gp - 2 * ti)} × {fmt(TUCK_H)} | köşe R{fmt(TUCK_R)}, iki uçta {fmt(SLIT)} mm slit lock |')
    a(f'| Euro delik | {fmt(OVAL_W)}×{fmt(OVAL_H)} oval + Ø{fmt(CIRCLE_D)} | delik üstü bigiden {fmt(HOLE_TOP)} mm, merkez {fmt(HOLE_TOP + RC)} mm; iki katta ayna konumda |')
    a(f'| Lot kutucuğu | {fmt(LOT_W)} (G) × {fmt(LOT_H)} (Y) | Sağ yan, alt bigiden {fmt(LOT_UP)} mm yukarı, ortalı |')
    a(f'| Mühür alanı | Ø{fmt(SEAL_D)} | alt kapağın serbest (açılma) kenarına ortalı: yarısı alt kapakta, yarısı Ön alt kenarda |')
    a('')
    a('## 3. Otomatik kontroller (3D katlama modeli üzerinden)')
    a('')
    a('| Kontrol | Sonuç | Ayrıntı |'); a('|---|---|---|')
    for n, good, d in R:
        a(f'| {n} | {"✅" if good else "❌"} | {d} |')
    a('')
    a('## 4. Varsayımlar')
    a('')
    for s in [
        f'Bigi payı = karton kalınlığı yuvarlaması: +{fmt(ALLOW)} mm her panelde (G, D, Y). Matbaanın makine/karton standardı farklıysa tek parametreyle değişir.',
        f'Paket kalınlığı {fmt(STACK)} mm varsayıldı (taşıyıcı kart + etiket + aktivasyon kartı + saşe mendil). D = {fmt(D)} korunduğu için ~{fmt(D - STACK)} mm boşluk var.',
        'Euro başlık Arka düzleminde; 2. kat öne katlanır, baskılı yüzü öne bakar (şartname 3.1 “ön yüz tarafı”).',
        f'Başlık 2. kat {fmt(HDR_GAP)} mm kısa, yanlardan {fmt(HDR_INSET)} mm içeride; katlandığında kenarlardan taşmaz.',
        'Üst kısım kalıcı yapıştırılır (kapak + dil başlık katları arasında); kutu yalnız alttan açılır.',
        '“8 mm aşağıda” ifadesi, deliğin (Ø10 dairenin) üst kenarı olarak yorumlandı.',
        'Slit lock detayı temsilidir (uçlarda 5 mm kesik); matbaanın standart kilit detayı ile değiştirilmelidir.',
        'Güvenlik etiketi şeffaf olduğu için Ön alt 10 mm bantta zemin rengi serbest; metin, ikon ve lokal UV lak yok.',
        'Lot kutucuğu 90° döndürüldü (10 G × 15 Y), laksız ve selefonsuz.',
        'Parmak oyuğu yok.',
        '**Başlık 2. kat (ön yüz) 180° katlandığı için grafiği açınımda baş aşağı yerleştirilmelidir** (3D önizlemede doğrulandı; Aşama 3 için kritik).',
    ]:
        a(f'- {s}')
    a('')
    a(f'## 5. D = 12 mm senaryosu (içerik ölçümüne göre)')
    a('')
    a(f'- Sağ/Sol yan panel: {fmt(s12["dp"])} mm → 4 mm güvenli alan sonrası kullanılabilir genişlik **{fmt(s12["safe_w"])} mm**. Dikey metin 7 pt (≈2,5 mm cap) sığar ama tek satır.')
    a(f'- Lot kutucuğu ({fmt(LOT_W)} mm genişlik) **sığmaz**: yan pay {fmt(s12["lot_margin"])} mm (gereken ≥ {fmt(SAFE)}). 4 mm güvenli alanla sığması için D ≥ {fmt(s12["lot_min_D"])} mm gerekir.')
    a('  - Seçenekler: (a) Lot alanı inkjet için kritik metin sayılmayıp yan paydan muaf tutulur (kutucuk kenara 1,25 mm kalır); (b) lot kutucuğu Arka yüz alt bandına, barkodun yanına alınır; (c) kutucuk 15 × 6 mm’ye küçültülür (tek satır lot no).')
    a(f'- Üst kapak ve alt kapak {fmt(s12["dp"])} mm → güvenli alan yüksekliği {fmt(s12["top_safe"])} mm. Mühür yarısı (10 mm) alt kapağa hâlâ sığar.')
    a(f'- Tutkal payı {fmt(GL)} mm > {fmt(12)} mm iç derinlik: **12 mm’ye düşürülmeli** (yan panelden taşar).')
    a(f'- Açınım genişliği {fmt(W)} → {fmt(s12["W"])} mm olur.')
    a('')
    a('## 6. Matbaaya sorulacaklar')
    a('')
    for s in [
        'Bu kutu tipi (hang-tab çift kat + reverse tuck slit lock) standart bıçak kütüphanenizde var mı? Açınımı kendi bıçağınıza oturtup vektörel (AI/PDF) gönderir misiniz? (Şartname 1.2)',
        f'350 g GC1 + mat selefon için bigi payınız nedir? Biz +{fmt(ALLOW)} mm kullandık. Bigi kanal/derinlik ayarı ve 18 mm yanlarda çatlama riski?',
        'Tutkal payı ve üst yapıştırma dilinin dış yüzü selefonsuz kalmalı. Selefonda maskeleme (lokal boşluk) mümkün mü, yoksa tutkal payında selefon kazıma/özel yapıştırıcı mı?',
        '**Lot kutucuğu hem laksız hem SELEFONSUZ olmalı**: inkjet mürekkebi selefon üzerinde tutmaz. Tabaka selefonunda 10×15 mm lokal boşluk bırakılabilir mi? Alternatifler: selefona tutan UV-kürlenen inkjet, lazer kodlama ya da lot etiketi.',
        'Başlık katlarını ve üst kapak dilini yapıştırma makinesi yapabilir mi, yoksa elle ek işlem mi? Maliyet farkı?',
        'Euro delik iki katta ayrı kesiliyor. Katlama toleransınız ne? Ön (2. kat) deliği 0,5 mm büyütelim mi?',
        f'Slit lock ölçü standardınız ({fmt(SLIT)} mm kesik yerine) ve minimum bıçak köşe radüsünüz?',
        'Ø20 void mühür etiketini kim tedarik edecek ve uygulayacak (elle/otomatik)? Konum toleransı ± kaç mm?',
        'Beyaz maket numunesi (bıçak testi) teslim süresi ve adedi?',
        f'{fmt(W)} × {fmt(HH)} mm açınımın 70×100 tabakaya kaç adet yerleştiği ve fire oranı?',
        'Gerçek içerik kalınlığı ~8 mm çıkarsa D’yi küçültelim mi, yoksa içerik oynamasın diye iç destek kartonu mu ekleyelim?',
    ]:
        a(f'- {s}')
    a('')
    a('## 7. Dosyalar ve sınırlamalar')
    a('')
    a(f'- `Candemsoft_QR-Kutu_Acinim_{VERSION}.pdf`: 1:1, PDF katmanları (OCG), Bıçak = Separation “Bicak” (%100 M alternatif), 0,25 pt, overprint. Taslak PDF, PDF/X değildir; Illustrator PDF katmanlarını açarken birleştirebilir.')
    a(f'- `Candemsoft_QR-Kutu_Acinim_{VERSION}.svg`: width/height mm, viewBox 1 birim = 1 mm; katmanlar `<g id>` + `data-name` (Illustrator’da katman adı). SVG’de spot renk/overprint yoktur, Bıçak ekranda #EC008C’dir. Illustrator’da spot renk olarak yeniden atanmalıdır.')
    a(f'- `Candemsoft_QR-Kutu_BeyazMaket_A3_{VERSION}.pdf`: A3, %100, 50 mm yatay + dikey kontrol çizgisi.')
    a('- `Candemsoft_QR-Kutu_3D_Onizleme.html`: katlama animasyonlu 3D önizleme.')
    a('- `kutu_acinim.py`: parametrik üreteç. G, D, Y, T, H, GL ve STACK en üstte; tek komutla tüm dosyalar ve bu rapor yeniden üretilir.')
    a('- Bilgi katmanındaki metinler font olarak durur (baskıya çıkmaz). Aşama 3’te outline edilecek.')
    return '\n'.join(L) + '\n'


# ------------------------------------------------------------ ana
def main():
    global FLAT_AREA
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
    os.makedirs(out, exist_ok=True)
    dl, flat, bleed, OUTL, H1, H2p = build()
    FLAT_AREA = flat.area
    base = 'Candemsoft_QR-Kutu'
    title = f'Candemsoft QR Kutu Açınımı {VERSION}'
    # 1) açınım
    ml, mt, mr, mb = 26.0, 26.0, 34.0, 52.0
    page = (W + ml + mr, HH + mt + mb)
    pg = page_dieline(ml, mt)
    write_svg(dl, 'dieline', os.path.join(out, f'{base}_Acinim_{VERSION}.svg'), page, (ml, mt), extra=pg, title=title)
    write_pdf(dl, 'dieline', os.path.join(out, f'{base}_Acinim_{VERSION}.pdf'), page, (ml, mt), extra=pg, title=title)
    # 2) A3 beyaz maket
    a3 = (297.0, 420.0); ox, oy = (a3[0] - W) / 2, 40.0
    write_pdf(dl, 'maket', os.path.join(out, f'{base}_BeyazMaket_A3_{VERSION}.pdf'), a3, (ox, oy),
              extra=page_maket(ox, oy, a3[0]), layered=False, title=f'Beyaz Maket A3 {VERSION}')
    # 3) 3D veri
    P = panels_def(); resolve_signs(P)
    tex = []
    for it in dl.items:
        s = STYLES['texture'].get(it['role'])
        if s is None: continue
        if it['k'] == 'path':
            tex.append(dict(t='p', c=it['p'].c, s=rgb_hex(s['stroke']) if 'stroke' in s else None, w=s.get('w'),
                            d=s.get('dash'), f=rgb_hex(s['fill']) if 'fill' in s else None))
        else:
            x, y = text_origin(it)
            tex.append(dict(t='t', x=x, y=y, r=it['rot'], z=it['size'], b=it['bold'], s=it['txt'], f=rgb_hex(s['color'])))
    geo = dict(version=VERSION, W=W, H=HH, T=T, inner=[G, D, Y], stack=STACK, carrier=CARRIER, act=ACT_CARD, wipe=WIPE,
               frontRect=[xF0, yT, xF1, yBt], dp=dp, gp=gp, yp=yp,
               panels=[dict(name=p['name'], pts=p['pts'], holes=p['holes'], parent=p['parent'], h0=p['h0'], h1=p['h1'],
                            angle=p['angle'], phase=p['phase'], off=p['off']) for p in P],
               texture=tex)
    R = checks(flat, P)
    geo['checks'] = [dict(n=n, ok=g, d=d) for n, g, d in R]
    geo['bleed'] = [bleed.bounds[2] - bleed.bounds[0], bleed.bounds[3] - bleed.bounds[1]]
    json.dump(geo, open(os.path.join(out, 'kutu_geometri.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    # 4) rapor
    open(os.path.join(out, f'{base}_Olcu_Raporu_{VERSION}.md'), 'w', encoding='utf-8').write(report(R, bleed))
    print(f'Açınım: {fmt(W)} × {fmt(HH)} mm   (taşma dahil {fmt(bleed.bounds[2] - bleed.bounds[0])} × {fmt(bleed.bounds[3] - bleed.bounds[1])})')
    for n, good, d in R:
        print(('OK  ' if good else 'HATA') + f'  {n}  —  {d}')
    print('D=12 senaryosu:', scenario(12.0))
    return 0 if all(g for _, g, _ in R) else 1

FLAT_AREA = 0.0
if __name__ == '__main__':
    sys.exit(main())
