/*
 * Kişisel QR Araç Etiketi – Kutu Tasarımı 1 (Siyah / Sarı)
 * Kaynak: "Kişisel QR Araç Etiketi – Kutu Tasarım Brifi" + Ambalaj Şartnamesi v1.0
 *
 * Açınımın tamamını mm koordinatlarında çizer. Panel konumları GEO'dan
 * (kutu_acinim.py çıktısı) okunur; ölçü değişirse tasarım yeniden yerleşir.
 *
 *   KQRTasarim1.render(ctx, GEO)        ctx önceden mm → px ölçeklenmiş olmalı
 *   KQRTasarim1.drawDieline(ctx, GEO)   2D önizleme için bıçak/bigi üst katmanı
 *   KQRTasarim1.ready()                 Inter fontları yüklenince çözülür
 */
(function () {
  const C = {
    K: '#0A0A0A',   // Kişisel Siyah (geniş zemin, zengin siyah)
    Y: '#FDD309',   // Kişisel Sarı (Pantone 116 C yakını)
    A: '#2A2A2A',   // Antrasit
    KB: '#F4F4F2',  // Kırık beyaz
    W: '#FFFFFF',
    K100: '#000000', // küçük siyah metin / barkod: tek kanal K100
    RAW: '#E9E5DA',  // baskısız karton (tutkal alanları)
  };
  const PT = 25.4 / 72;           // 1 pt → mm
  const SAFE = 4, BLEED = 3;
  const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

  // ------------------------------------------------------------ geometri
  function geom(GEO) {
    const P = {};
    GEO.panels.forEach(p => {
      const xs = p.pts.map(q => q[0]), ys = p.pts.map(q => q[1]);
      P[p.name] = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), p };
    });
    const hc = h => {
      const xs = h.map(q => q[0]), ys = h.map(q => q[1]);
      return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2,
               h: Math.max(...ys) - Math.min(...ys) };
    };
    const yT = P.On.y0, yBt = P.On.y1;
    return { P, yT, yBt, yp: yBt - yT, gp: P.On.x1 - P.On.x0, dp: P.Sol.x1 - P.Sol.x0,
             hole1: hc(P.Arka.p.holes[0]), hole2: hc(P.Baslik2.p.holes[0]) };
  }

  // ------------------------------------------------------------ yardımcılar
  function trace(ctx, pts) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }
  function panelPath(ctx, p) {
    ctx.beginPath(); trace(ctx, p.pts); (p.holes || []).forEach(h => trace(ctx, h));
  }
  function rectPts(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function font(ctx, size, w) { ctx.font = `${w || 400} ${size}px ${FONT}`; }
  function tw(ctx, s, size, w) { font(ctx, size, w); return ctx.measureText(s).width; }
  function txt(ctx, s, x, y, o) {
    o = o || {};
    font(ctx, o.size, o.w);
    ctx.fillStyle = o.color || C.W; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
    return ctx.measureText(s).width;
  }
  function wrap(ctx, s, maxW, size, w) {
    const out = []; let cur = '';
    s.split(' ').forEach(word => {
      const t = cur ? cur + ' ' + word : word;
      if (tw(ctx, t, size, w) <= maxW) cur = t; else { if (cur) out.push(cur); cur = word; }
    });
    if (cur) out.push(cur);
    return out;
  }
  function inPanel(ctx, x0, y0, w, h, rot, fn) {
    ctx.save();
    if (rot === 180) { ctx.translate(x0 + w, y0 + h); ctx.rotate(Math.PI); } else ctx.translate(x0, y0);
    fn(w, h);
    ctx.restore();
  }

  // ------------------------------------------------------------ logo (vektörel yeniden çizim)
  // Logodaki QR ikonu dekoratiftir, okutulamaz. Kutudaki gerçek QR'ların yanına konmaz.
  const ICON = ['1110111', '1010101', '1110111', '0001010', '1110101', '1010011', '1110110'];
  function logoIcon(ctx, x, y, s, fg) {
    const m = s / 7; ctx.fillStyle = fg;
    ICON.forEach((row, r) => [...row].forEach((c, k) => {
      if (c === '1') ctx.fillRect(x + k * m, y + r * m, m + 0.015, m + 0.015);
    }));
  }
  function logo(ctx, x, y, h, fg) {
    logoIcon(ctx, x, y, h, fg);
    const fs = h * 0.5, tx = x + h * 1.18;
    txt(ctx, 'Kişisel', tx, y + 0.727 * fs, { size: fs, w: 800, color: fg });
    txt(ctx, 'QR', tx, y + h - 0.01 * h, { size: fs, w: 800, color: fg });
    return h * 1.18 + tw(ctx, 'Kişisel', fs, 800);
  }
  function logoWidth(ctx, h) { return h * 1.18 + tw(ctx, 'Kişisel', h * 0.5, 800); }

  // ------------------------------------------------------------ ikonlar (10 × 10 mm, çizgisel)
  function iconStroke(ctx, lw) {
    ctx.strokeStyle = C.K100; ctx.fillStyle = C.K100; ctx.lineWidth = lw || 0.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
  }
  const ICONS = {
    gizli(ctx) {            // göz + çapraz çizgi
      iconStroke(ctx);
      ctx.beginPath(); ctx.moveTo(0.8, 5); ctx.quadraticCurveTo(5, -0.4, 9.2, 5); ctx.quadraticCurveTo(5, 10.4, 0.8, 5); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, 5, 1.7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1.6, 8.6); ctx.lineTo(8.4, 1.4); ctx.stroke();
    },
    bildirim(ctx) {         // zil + titreşim çizgileri
      iconStroke(ctx);
      ctx.beginPath(); ctx.moveTo(2.7, 7.2); ctx.lineTo(2.7, 4.7); ctx.arc(5, 4.7, 2.3, Math.PI, 0); ctx.lineTo(7.3, 7.2);
      ctx.lineTo(8.2, 7.9); ctx.lineTo(1.8, 7.9); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, 8.8, 0.75, 0, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, 1.6); ctx.lineTo(5, 2.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, 4.9, 4.3, Math.PI * 1.08, Math.PI * 1.32); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, 4.9, 4.3, Math.PI * 1.68, Math.PI * 1.92); ctx.stroke();
    },
    kartvizit(ctx) {        // kart + kişi
      iconStroke(ctx);
      rr(ctx, 0.6, 1.9, 8.8, 6.2, 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(3.2, 4.3, 1.05, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(3.2, 7.4, 1.9, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5.6, 4.0); ctx.lineTo(8.1, 4.0); ctx.moveTo(5.6, 5.6); ctx.lineTo(7.4, 5.6); ctx.stroke();
    },
    ucretsiz(ctx) {         // takvim + ₺ + çapraz çizgi → "aylık ücret yok"
      iconStroke(ctx);
      rr(ctx, 1.0, 1.8, 8.0, 7.2, 0.9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1.0, 3.9); ctx.lineTo(9.0, 3.9); ctx.moveTo(3.2, 0.9); ctx.lineTo(3.2, 2.6);
      ctx.moveTo(6.8, 0.9); ctx.lineTo(6.8, 2.6); ctx.stroke();
      txt(ctx, '₺', 5, 8.1, { size: 3.9, w: 700, color: C.K100, align: 'center' });
      ctx.beginPath(); ctx.moveTo(0.6, 9.5); ctx.lineTo(9.4, 0.5); ctx.stroke();
    },
  };

  // Karar verici olmayan, dekoratif QR benzeri desen (sticker illüstrasyonu için; okutulmaz)
  function decoQR(ctx, x, y, s, fg, n) {
    n = n || 17; const m = s / n; ctx.fillStyle = fg;
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const finder = (r0, c0) => {
      ctx.fillRect(x + c0 * m, y + r0 * m, 7 * m, 7 * m);
      ctx.save(); ctx.fillStyle = ctx.__bg || C.W; ctx.fillRect(x + (c0 + 1) * m, y + (r0 + 1) * m, 5 * m, 5 * m); ctx.restore();
      ctx.fillRect(x + (c0 + 2) * m, y + (r0 + 2) * m, 3 * m, 3 * m);
    };
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const inF = (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
      if (!inF && rnd() > 0.52) ctx.fillRect(x + c * m, y + r * m, m + 0.01, m + 0.01);
    }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
  }

  // Gerçek uygulama QR'ı (mobile.kisiselqr.com), beyaz zemin + 4 modül sessiz alan
  function appQR(ctx, x, y, size) {
    const Q = window.KQR_QR_APP; if (!Q) return;
    const n = Q.rows.length, m = size / n;
    ctx.fillStyle = C.K100;
    Q.rows.forEach((row, r) => [...row].forEach((c, k) => {
      if (c === '1') ctx.fillRect(x + k * m, y + r * m, m + 0.01, m + 0.01);
    }));
    return m;
  }

  // ------------------------------------------------------------ zeminler
  function grounds(ctx, g) {
    const { P, yT, yBt, yp } = g;
    const GROUND = {
      On: C.K, Sol: C.K, Sag: C.K, Arka: C.K, Baslik2: C.Y, UstKapak: C.K,
      SolUstToz: C.K, SagUstToz: C.K, SolAltToz: C.K, SagAltToz: C.K, AltKapak: C.Y, Dil: C.Y,
    };
    const zones = [
      { pts: rectPts(P.Arka.x0, P.Arka.y0, P.Arka.x1, yT), c: C.Y },                 // Euro başlık 1. kat
      { pts: rectPts(P.On.x0, yT + yp * 2 / 3, P.On.x1, yBt), c: C.Y },              // ön alt 1/3 sarı
      { pts: rectPts(P.Arka.x0, yBt - BACK_BAND, P.Arka.x1, yBt), c: C.Y },          // arka yasal bant
    ];
    // 1) taşma: her baskılı yüzeyin konturu 2 × 3 mm kalınlıkta kendi renginde çizilir;
    //    komşu panelin dolgusu içerideki kısmı örter, yalnızca dışarı taşan 3 mm kalır.
    ctx.lineJoin = 'miter'; ctx.miterLimit = 3; ctx.lineWidth = 2 * BLEED; ctx.setLineDash([]);
    Object.keys(GROUND).forEach(n => { ctx.strokeStyle = GROUND[n]; panelPath(ctx, P[n].p); ctx.stroke(); });
    zones.forEach(z => { ctx.strokeStyle = z.c; ctx.beginPath(); trace(ctx, z.pts); ctx.stroke(); });
    // 2) dolgular
    Object.keys(GROUND).forEach(n => { ctx.fillStyle = GROUND[n]; panelPath(ctx, P[n].p); ctx.fill('evenodd'); });
    zones.forEach(z => { ctx.fillStyle = z.c; ctx.beginPath(); trace(ctx, z.pts); ctx.fill(); });
    // 3) baskısız alanlar: tutkal payı, üst yapıştırma dili (dış yüz)
    ['Tutkal', 'UstDil'].forEach(n => { ctx.fillStyle = C.RAW; panelPath(ctx, P[n].p); ctx.fill(); });
  }
  const BACK_BAND = 30.5;   // arka yüz alt yasal bant yüksekliği (sarı)

  // ------------------------------------------------------------ ÖN YÜZ
  function front(ctx, w, h, px) {
    const L = SAFE + 2;
    // Üst: sarı logo (lokal UV lak) + "by Candemsoft"
    logo(ctx, L, SAFE + 2, 10, C.Y);
    txt(ctx, 'by Candemsoft', w - SAFE - 2, SAFE + 2 + 6.4, { size: 7 * PT, w: 500, color: C.W, align: 'right' });

    // Başlık: KİŞİSEL QR (24 pt, beyaz + sarı "QR") ve alt satır
    const ts = 24 * PT;
    const w1 = txt(ctx, 'KİŞİSEL ', L, 29.5, { size: ts, w: 900, color: C.W });
    txt(ctx, 'QR', L + w1, 29.5, { size: ts, w: 900, color: C.Y });
    txt(ctx, 'Akıllı Araç Etiketi + Dijital Kartvizit', L, 35.2, { size: 9 * PT, w: 600, color: C.KB });

    // Görsel alan: araç ön camının sol alt köşesi (çizgisel)
    const vTop = 39, vBot = h * 2 / 3;
    ctx.save();
    ctx.beginPath(); ctx.rect(-BLEED, vTop, w + 2 * BLEED, vBot - vTop); ctx.clip();
    // cam
    const gx0 = 7, gyB = vBot - 12;               // A-sütunu üst noktası, cam alt kenarı
    ctx.beginPath();
    ctx.moveTo(gx0, vTop - 1); ctx.lineTo(w + BLEED, vTop - 1); ctx.lineTo(w + BLEED, gyB - 3.5);
    ctx.quadraticCurveTo(w * 0.55, gyB - 1.2, 24, gyB);
    ctx.quadraticCurveTo(19.5, gyB + 0.2, 18.4, gyB - 3.2);
    ctx.closePath();
    const grd = ctx.createLinearGradient(0, vTop, w, vBot);
    grd.addColorStop(0, '#171717'); grd.addColorStop(1, '#0E0E0E');
    ctx.fillStyle = grd; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.3; ctx.stroke();
    // A-sütunu iç çizgisi ve torpido
    ctx.strokeStyle = C.A; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(gx0 - 3.2, vTop - 1); ctx.lineTo(15.2, gyB - 1.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.25;
    ctx.beginPath(); ctx.moveTo(-BLEED, gyB + 4.2); ctx.quadraticCurveTo(w * 0.5, gyB + 2.6, w + BLEED, gyB + 1.2); ctx.stroke();
    // cam yansımaları
    ctx.strokeStyle = C.A; ctx.lineWidth = 0.6;
    [[40, vTop + 2, 58, vTop + 16], [46, vTop + 2, 68, vTop + 20]].forEach(s => {
      ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); ctx.stroke();
    });
    // cama yapışık sticker (5:8), sol alt köşe – sarı vurgu (lokal UV lak)
    const sw = 9, sh = 14.4, sx = 22.5, sy = gyB - sh - 3.2;
    ctx.save();
    ctx.translate(sx + sw / 2, sy + sh / 2); ctx.rotate(-0.035);
    ctx.strokeStyle = 'rgba(253,211,9,0.30)'; ctx.lineWidth = 1.6; rr(ctx, -sw / 2 - 0.4, -sh / 2 - 0.4, sw + 0.8, sh + 0.8, 1.2); ctx.stroke();
    ctx.fillStyle = C.Y; rr(ctx, -sw / 2, -sh / 2, sw, sh, 0.9); ctx.fill();
    ctx.fillStyle = C.K; rr(ctx, -sw / 2 + 0.9, -sh / 2 + 0.9, sw - 1.8, sw - 1.8, 0.4); ctx.fill();
    ctx.__bg = C.K; decoQR(ctx, -sw / 2 + 1.6, -sh / 2 + 1.6, sw - 3.2, C.Y, 13); ctx.__bg = null;
    txt(ctx, 'Kişisel QR', 0, sh / 2 - 2.6, { size: 1.35, w: 800, color: C.K100, align: 'center' });
    txt(ctx, 'Okut, bana ulaş', 0, sh / 2 - 1.1, { size: 0.95, w: 600, color: C.K100, align: 'center' });
    ctx.restore();
    ctx.restore();

    // Telefon mockup (~28 × 56 mm), sağa yakın; ekran lokal UV lak
    phone(ctx, w - SAFE - 2 - 28, 38.5, 28, 56, px);

    // Rozet: sarı zemin, siyah yazı, eğik etiket (lak almaz)
    ctx.save();
    ctx.translate(22.2, vBot - 6.6); ctx.rotate(-6 * Math.PI / 180);
    ctx.fillStyle = C.Y; rr(ctx, -17, -4.75, 34, 9.5, 2.2); ctx.fill();
    txt(ctx, 'Artık numaratöre', 0, -0.55, { size: 8.3 * PT, w: 800, color: C.K100, align: 'center' });
    txt(ctx, 'gerek yok', 0, 2.75, { size: 8.3 * PT, w: 800, color: C.K100, align: 'center' });
    ctx.restore();

    // İkon şeridi: sarı bant üzerinde 4 siyah çizgisel ikon (10 × 10 mm) + 7 pt etiket
    const items = [['gizli', 'Numaran', 'gizli'], ['bildirim', 'Anında', 'bildirim'],
                   ['kartvizit', 'Dijital', 'kartvizit'], ['ucretsiz', 'Aylık', 'ücret yok']];
    const colW = (w - 2 * SAFE) / 4, iy = vBot + 6;
    items.forEach((it, i) => {
      const cxm = SAFE + colW * (i + 0.5);
      ctx.save(); ctx.translate(cxm - 5, iy); ICONS[it[0]](ctx); ctx.restore();
      txt(ctx, it[1], cxm, iy + 14.2, { size: 7 * PT, w: 600, color: C.K100, align: 'center' });
      txt(ctx, it[2], cxm, iy + 17.2, { size: 7 * PT, w: 600, color: C.K100, align: 'center' });
    });
    // En alt 10 mm: mühür bandı – yalnızca zemin rengi
  }

  function phone(ctx, x, y, w, h, px) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 2.5 * (px || 10); ctx.shadowOffsetY = 0.8 * (px || 10);
    ctx.fillStyle = '#1C1C1C'; rr(ctx, x, y, w, h, 4.2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#4A4A4A'; ctx.lineWidth = 0.35; rr(ctx, x, y, w, h, 4.2); ctx.stroke();
    const s = 1.3, X = x + s, Yy = y + s, SW = w - 2 * s, SH = h - 2 * s;
    ctx.fillStyle = '#101010'; rr(ctx, X, Yy, SW, SH, 3.1); ctx.fill();
    ctx.save(); rr(ctx, X, Yy, SW, SH, 3.1); ctx.clip();
    ctx.fillStyle = C.K; rr(ctx, x + w / 2 - 4, Yy + 1.1, 8, 1.7, 0.85); ctx.fill();            // çentik
    // profil
    const cxp = x + w / 2;
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(cxp, Yy + 10.2, 4.1, 0, Math.PI * 2); ctx.fill();
    txt(ctx, 'AY', cxp, Yy + 11.3, { size: 3.0, w: 800, color: C.K, align: 'center' });
    txt(ctx, 'Ayşe Yılmaz', cxp, Yy + 18.6, { size: 2.3, w: 700, color: C.W, align: 'center' });
    txt(ctx, 'Dijital kartvizit · örnek profil', cxp, Yy + 21.3, { size: 1.35, w: 500, color: '#9A9A9A', align: 'center' });
    // sosyal
    [-6, -2, 2, 6].forEach((d, i) => {
      ctx.fillStyle = i === 0 ? C.Y : C.A; ctx.beginPath(); ctx.arc(cxp + d, Yy + 25.4, 1.45, 0, Math.PI * 2); ctx.fill();
    });
    // butonlar
    ctx.fillStyle = C.Y; rr(ctx, X + 2.2, Yy + 29.2, SW - 4.4, 4.9, 2.45); ctx.fill();
    txt(ctx, 'Mesaj gönder', cxp, Yy + 32.3, { size: 1.9, w: 700, color: C.K, align: 'center' });
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.28; rr(ctx, X + 2.2, Yy + 35.5, SW - 4.4, 4.9, 2.45); ctx.stroke();
    txt(ctx, 'Ara · numara gizli', cxp, Yy + 38.6, { size: 1.75, w: 600, color: C.W, align: 'center' });
    // bildirim kartı
    ctx.fillStyle = '#1D1D1D'; rr(ctx, X + 2.2, Yy + 42, SW - 4.4, 7.4, 1.2); ctx.fill();
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(X + 4.6, Yy + 45.7, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5A5A5A'; ctx.fillRect(X + 6.6, Yy + 44.2, 12, 0.9); ctx.fillRect(X + 6.6, Yy + 46.3, 8.5, 0.9);
    ctx.fillStyle = '#6A6A6A'; rr(ctx, x + w / 2 - 4, Yy + SH - 1.6, 8, 0.6, 0.3); ctx.fill();      // ana çubuk
    ctx.restore();
  }

  // ------------------------------------------------------------ ARKA YÜZ
  function back(ctx, w, h, px) {
    const L = SAFE, R = w - SAFE, cw = R - L;
    // Üst: başlık + açıklama
    txt(ctx, 'Nasıl çalışır?', L, 9.6, { size: 12 * PT, w: 800, color: C.Y });
    const desc = "Kişisel QR'ı aracının ön camına yapıştır. Sana ulaşmak isteyen QR'ı telefonuyla okutur, " +
                 'bildirim sana gelir; numaran görünmez. Aynı profil dijital kartvizitin olur: widget ile paylaş, ' +
                 'sosyal medyada link olarak kullan.';
    const ds = 7.5 * PT;
    wrap(ctx, desc, cw, ds, 400).forEach((ln, i) => txt(ctx, ln, L, 14.8 + i * 3.45, { size: ds, w: 400, color: C.W }));

    // Orta-sol: sticker görseli (5:8, gölgeli) – YER TUTUCU, gerçek fotoğraf/baskı görseli gelince değişecek
    const sw = 23, sh = 36.8, sx = L, sy = 33;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 2.2 * (px || 10); ctx.shadowOffsetX = 0.6 * (px || 10); ctx.shadowOffsetY = 0.9 * (px || 10);
    ctx.fillStyle = C.Y; rr(ctx, sx, sy, sw, sh, 1.8); ctx.fill();
    ctx.restore();
    ctx.fillStyle = C.K; rr(ctx, sx + 2, sy + 2, sw - 4, sw - 4, 0.8); ctx.fill();
    ctx.__bg = C.K; decoQR(ctx, sx + 3.4, sy + 3.4, sw - 6.8, C.Y, 17); ctx.__bg = null;
    txt(ctx, 'Kişisel QR', sx + sw / 2, sy + sw + 3.6, { size: 3.0, w: 800, color: C.K100, align: 'center' });
    txt(ctx, 'Okut, bana ulaş', sx + sw / 2, sy + sw + 6.6, { size: 2.1, w: 600, color: C.K100, align: 'center' });
    txt(ctx, 'numaran gizli kalır', sx + sw / 2, sy + sw + 9.2, { size: 1.7, w: 500, color: C.K100, align: 'center' });

    // Orta-sağ: 5 özellik, sarı tik
    const feats = ['Numaran gizli kalır, sana yine ulaşılır.', 'Mesaj ve bildirim anında telefonunda.',
                   'Dijital kartvizitini uygulamada oluştur.', 'Profilini sosyal medyada paylaş.',
                   'Aracın olmasa da kullan: kartvizit olarak yeterli.'];
    const fx = sx + sw + 4, fw = R - fx - 4.2, fs = 7 * PT;
    let fy = 36.2;
    feats.forEach(f => {
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(fx + 1.5, fy - 0.85, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.K; ctx.lineWidth = 0.35; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(fx + 0.8, fy - 0.85); ctx.lineTo(fx + 1.35, fy - 0.25); ctx.lineTo(fx + 2.25, fy - 1.45); ctx.stroke();
      const lines = wrap(ctx, f, fw, fs, 500);
      lines.forEach((ln, i) => txt(ctx, ln, fx + 4.2, fy + i * 3.0, { size: fs, w: 500, color: C.W }));
      fy += lines.length > 1 ? 8.0 : 6.6;
    });

    // Adımlar: 1 Temizle · 2 Yapıştır · 3 Aktif Et
    const steps = ['Temizle', 'Yapıştır', 'Aktif Et'], stY = 76.5, ss = 7.5 * PT;
    const gw = steps.map(s => 5.2 + 1.6 + tw(ctx, s, ss, 600));
    const gap = (cw - gw.reduce((a, b) => a + b, 0)) / 2;
    let gx = L;
    steps.forEach((s, i) => {
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(gx + 2.6, stY - 0.95, 2.6, 0, Math.PI * 2); ctx.fill();
      txt(ctx, String(i + 1), gx + 2.6, stY + 0.1, { size: 3.1, w: 800, color: C.K, align: 'center' });
      txt(ctx, s, gx + 6.8, stY, { size: ss, w: 600, color: C.W });
      gx += gw[i] + gap;
    });

    // Uygulama QR: beyaz zemin, 20 mm QR + 4 modül sessiz alan
    const Q = window.KQR_QR_APP, n = Q ? Q.rows.length : 29, qs = 20, qm = qs / n, qz = 4 * qm;
    const qx = L, qy = 79.9, box = qs + 2 * qz;
    ctx.fillStyle = C.W; ctx.fillRect(qx, qy, box, box);
    appQR(ctx, qx + qz, qy + qz, qs);
    const tx = qx + box + 3.2;
    txt(ctx, 'Uygulamayı indir', tx, qy + 4.4, { size: 7.5 * PT, w: 700, color: C.W });
    txt(ctx, 'mobile.kisiselqr.com', tx, qy + 7.9, { size: 7 * PT, w: 600, color: C.Y });
    txt(ctx, 'Kutu içeriği', tx, qy + 14.2, { size: 7 * PT, w: 700, color: C.KB });
    txt(ctx, '1 QR Etiket · 1 Aktivasyon Kartı', tx, qy + 17.4, { size: 7 * PT, w: 400, color: C.W });
    txt(ctx, '1 Temizleme Mendili', tx, qy + 20.6, { size: 7 * PT, w: 400, color: C.W });

    // Alt yasal bant (sarı zemin, K100): üretici, KVKK, menşe | EAN-13 (bigiden ≥ 8 mm)
    const bY = h - BACK_BAND, ls = 6.5 * PT, lc = C.K100;
    const eanW = 29.8, eanH = 20.7, ex = w - 8 - eanW, ey = h - 8 - eanH;
    const lw = ex - L - 3;
    let ly = bY + 5.0;
    [['Üretici: Candemsoft', 700], ['[Adres – Candemsoft onayı bekleniyor]', 400],
     ['[KVKK bilgilendirme metni – onay bekleniyor]', 400], ["Türkiye'de üretilmiştir.", 600]].forEach(([s, wt]) => {
      wrap(ctx, s, lw, ls, wt).forEach(ln => { txt(ctx, ln, L, ly, { size: ls, w: wt, color: lc }); ly += 2.85; });
    });
    // geri dönüşüm + PAP 21 + SKU
    const ry = h - SAFE - 2.2;
    ctx.save(); ctx.translate(L + 2.1, ry - 0.9);
    ctx.strokeStyle = lc; ctx.fillStyle = lc; ctx.lineWidth = 0.32;
    for (let k = 0; k < 3; k++) {
      ctx.save(); ctx.rotate(k * 2 * Math.PI / 3);
      ctx.beginPath(); ctx.arc(0, 0, 1.75, -Math.PI * 0.95, -Math.PI * 0.45); ctx.stroke();
      const a = -Math.PI * 0.45, ax = 1.75 * Math.cos(a), ay = 1.75 * Math.sin(a);
      ctx.beginPath(); ctx.moveTo(ax + 0.55, ay + 0.05); ctx.lineTo(ax - 0.25, ay - 0.5); ctx.lineTo(ax - 0.3, ay + 0.45); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    txt(ctx, 'PAP 21', L + 5.0, ry, { size: ls, w: 700, color: lc });
    txt(ctx, 'SKU: [bekleniyor]', L + 14.2, ry, { size: ls, w: 400, color: lc });
    // EAN-13 yer tutucu – numara Candemsoft'tan gelecek (sahte barkod çizilmez)
    ctx.fillStyle = C.W; ctx.fillRect(ex, ey, eanW, eanH);
    ctx.strokeStyle = lc; ctx.lineWidth = 0.2; ctx.setLineDash([0.8, 0.6]); ctx.strokeRect(ex, ey, eanW, eanH); ctx.setLineDash([]);
    txt(ctx, 'EAN-13', ex + eanW / 2, ey + 8.4, { size: 2.9, w: 700, color: lc, align: 'center' });
    txt(ctx, 'numara bekleniyor', ex + eanW / 2, ey + 11.6, { size: 2.0, w: 500, color: lc, align: 'center' });
    txt(ctx, '%80 · 29,8 × 20,7 mm · K100', ex + eanW / 2, ey + 14.3, { size: 1.6, w: 400, color: lc, align: 'center' });
  }

  // ------------------------------------------------------------ YANLAR
  function vertical(ctx, w, h, cy, fn) {      // alttan yukarı okunan eksen: x ↑, y →
    ctx.save(); ctx.translate(w / 2, cy); ctx.rotate(-Math.PI / 2); fn(); ctx.restore();
  }
  function sideLeft(ctx, w, h) {
    const s = 7.2, t1 = 'KİŞİSEL ', t2 = 'QR';
    vertical(ctx, w, h, h * 0.42, () => {
      const a = tw(ctx, t1, s, 900), b = tw(ctx, t2, s, 900), x0 = -(a + b) / 2, by = 0.36 * s;
      txt(ctx, t1, x0, by, { size: s, w: 900, color: C.W });
      txt(ctx, t2, x0 + a, by, { size: s, w: 900, color: C.Y });
    });
    const ic = 8; logoIcon(ctx, (w - ic) / 2, h - SAFE - 2 - ic, ic, C.Y);
  }
  function sideRight(ctx, w, h) {
    const s1 = 4.2, s2 = 7 * PT;
    vertical(ctx, w, h, (h - 8 - 15) * 0.47, () => {
      txt(ctx, 'kisiselqr.com', 0, -0.9, { size: s1, w: 700, color: C.Y, align: 'center' });
      txt(ctx, 'Araç + Dijital Kartvizit', 0, 2.9, { size: s2, w: 500, color: C.W, align: 'center' });
    });
    // lot / tarih kutucuğu: beyaz, laksız, SELEFONSUZ (inkjet)
    ctx.fillStyle = C.W; ctx.fillRect((w - 10) / 2, h - 8 - 15, 10, 15);
  }

  // ------------------------------------------------------------ EURO BAŞLIK
  function header(ctx, w, h, holeBottom) {
    const lh = 6, lw = logoWidth(ctx, lh);
    logo(ctx, (w - lw) / 2, holeBottom + 3.5, lh, C.K);
  }

  // ------------------------------------------------------------ ana çizim
  function render(ctx, GEO, opts) {
    opts = opts || {};
    const g = geom(GEO), { P, yT, yBt, yp, gp, dp } = g;
    const px = opts.px || 10;
    ctx.save();
    grounds(ctx, g);
    inPanel(ctx, P.On.x0, yT, gp, yp, 0, (w, h) => front(ctx, w, h, px));
    inPanel(ctx, P.Arka.x0, yT, gp, yp, 0, (w, h) => back(ctx, w, h, px));
    inPanel(ctx, P.Sol.x0, yT, dp, yp, 0, (w, h) => sideLeft(ctx, w, h));
    inPanel(ctx, P.Sag.x0, yT, dp, yp, 0, (w, h) => sideRight(ctx, w, h));
    // başlık 1. kat (arka yüz, düz)
    inPanel(ctx, P.Arka.x0, P.Arka.y0, gp, yT - P.Arka.y0, 0,
      (w, h) => header(ctx, w, h, g.hole1.cy - P.Arka.y0 + g.hole1.h / 2));
    // başlık 2. kat (ön yüz): 180° katlandığı için açınımda TERS çizilir
    const b2 = P.Baslik2;
    inPanel(ctx, b2.x0, b2.y0, b2.x1 - b2.x0, b2.y1 - b2.y0, 180,
      (w, h) => header(ctx, w, h, (b2.y1 - g.hole2.cy) + g.hole2.h / 2));
    // Euro delikleri boş kalsın
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    [P.Arka.p.holes[0], P.Baslik2.p.holes[0]].forEach(hh => { ctx.beginPath(); trace(ctx, hh); ctx.fill(); });
    ctx.restore();
  }

  // 2D önizleme: bıçak (düz) + bigi (kesikli) üst katmanı
  function drawDieline(ctx, GEO) {
    ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    const tr = a => a * Math.PI / 180;
    GEO.texture.forEach(it => {
      if (it.t !== 'p' || !it.s) return;
      const cut = it.s === '#1A1A1A', crease = it.s === '#737373';
      if (!cut && !crease) return;
      ctx.beginPath();
      it.c.forEach(c => {
        if (c[0] === 'M') ctx.moveTo(c[1], c[2]);
        else if (c[0] === 'L') ctx.lineTo(c[1], c[2]);
        else if (c[0] === 'A') ctx.arc(c[1], c[2], c[3], tr(c[4]), tr(c[5]), c[5] < c[4]);
        else if (c[0] === 'Z') ctx.closePath();
      });
      ctx.strokeStyle = '#EC008C'; ctx.lineWidth = 0.25; ctx.setLineDash(crease ? [3, 1.5] : []); ctx.stroke();
    });
    ctx.restore();
  }

  function ready() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const sample = 'KİŞİSEL QR ğüşıöç ₺';
    return Promise.all([400, 500, 600, 700, 800, 900].map(w => document.fonts.load(`${w} 12px Inter`, sample)))
      .catch(() => {});
  }

  window.KQRTasarim1 = { render, drawDieline, ready, colors: C };
})();
