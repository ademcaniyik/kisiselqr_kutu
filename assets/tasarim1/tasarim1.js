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
  // Tek yol olarak doldurulur (drawQR gibi): kare kare fillRect, büyük boyda modüller arasında ince dikiş bırakıyordu.
  function logoIcon(ctx, x, y, s, fg) {
    const m = s / 7;
    ctx.beginPath();
    ICON.forEach((row, r) => {
      let k = 0;
      while (k < 7) {
        if (row[k] !== '1') { k++; continue; }
        let e = k; while (e < 7 && row[e] === '1') e++;
        ctx.rect(x + k * m, y + r * m, (e - k) * m, m);
        k = e;
      }
    });
    ctx.fillStyle = fg; ctx.fill('nonzero');
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

  // Gerçek QR matrisi çizer (qr_kodlar.js): KQR_QR_APP = mobile.kisiselqr.com, KQR_QR_DEMO = demo profil
  // Her satırdaki bitişik modüller tek dikdörtgen, tümü tek yol olarak doldurulur:
  // ayrı ayrı fillRect kenar yumuşatma dikişi (ince beyaz çizgiler) bırakır.
  function drawQR(ctx, Q, x, y, size, color) {
    if (!Q) return;
    const n = Q.rows.length, m = size / n;
    ctx.beginPath();
    Q.rows.forEach((row, r) => {
      let k = 0;
      while (k < n) {
        if (row[k] !== '1') { k++; continue; }
        let e = k; while (e < n && row[e] === '1') e++;
        ctx.rect(x + k * m, y + r * m, (e - k) * m, m);
        k = e;
      }
    });
    ctx.fillStyle = color || C.K100; ctx.fill('nonzero');
    return m;
  }
  function appQR(ctx, x, y, size) { return drawQR(ctx, window.KQR_QR_APP, x, y, size); }

  // ------------------------------------------------------------ sticker (ürünün kendisi)
  // Candemsoft'un ilettiği sticker görselinin birebir vektör kopyası (5:8, 50 × 80 mm).
  // Ölçüler referans görselden piksel olarak çıkarıldı: 764 × 1244 birimlik yerel ızgara.
  // İçindeki QR gerçek ve demo profile gider (KQR_QR_DEMO).
  const STK = { W: 764, H: 1244, R: 112, OUT: 7, TOP: 43, SIDE: 34, CARD_B: 792, CARD_R: 90, CARD_S: 5,
                YEL: 593, DIV0: 1142, DIV1: 1149, QX: 64, QY: 102, QS: 638,
                L1: 895, L2: 987, L3: 1077, LW: 718, URL_B: 1209, URL_W: 447 };
  const STK_FONT = 'Montserrat, "Arial Black", Arial, sans-serif';
  function sticker(ctx, x, y, w, opts) {
    opts = opts || {};
    const h = w * 1.6;
    ctx.save();
    ctx.translate(x, y); ctx.scale(w / STK.W, h / STK.H);
    const outer = () => rr(ctx, 0, 0, STK.W, STK.H, STK.R);
    if (opts.edge) {            // koyu zeminde kesim kenarı seçilsin: ince açık kontur (sticker tasarımı değişmez)
      ctx.save(); ctx.lineWidth = opts.edge; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; outer(); ctx.stroke(); ctx.restore();
    }
    if (opts.shadow) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = opts.shadow; ctx.shadowOffsetY = opts.shadow * 0.35;
      outer(); ctx.fillStyle = C.W; ctx.fill(); ctx.restore();
    }
    ctx.save(); outer(); ctx.clip();
    ctx.fillStyle = C.W; ctx.fillRect(0, 0, STK.W, STK.H);
    ctx.fillStyle = C.K100; ctx.fillRect(0, 0, STK.W, STK.YEL);                       // üst siyah çerçeve
    ctx.fillStyle = C.Y; ctx.fillRect(0, STK.YEL, STK.W, STK.DIV0 - STK.YEL);          // sarı alan
    ctx.fillStyle = C.K100; ctx.fillRect(0, STK.DIV0, STK.W, STK.DIV1 - STK.DIV0);     // ayırıcı çizgi
    ctx.lineWidth = 2 * STK.OUT; ctx.strokeStyle = C.K100; outer(); ctx.stroke();       // dış kontur
    ctx.restore();
    // beyaz QR kartı (siyah ince kontur)
    rr(ctx, STK.SIDE, STK.TOP, STK.W - 2 * STK.SIDE, STK.CARD_B - STK.TOP, STK.CARD_R);
    ctx.fillStyle = C.W; ctx.fill(); ctx.lineWidth = STK.CARD_S; ctx.strokeStyle = C.K100; ctx.stroke();
    drawQR(ctx, opts.qr === undefined ? window.KQR_QR_DEMO : opts.qr, STK.QX, STK.QY, STK.QS, C.K100);
    if (opts.yazisiz) { ctx.restore(); return h; }   // çok küçük çizimlerde yazılar okunmaz, gri leke olur
    // yazılar
    ctx.fillStyle = C.K100; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `800 100px ${STK_FONT}`;
    const fs = 100 * STK.LW / ctx.measureText('KAREKODU OKUTUN').width;
    ctx.font = `800 ${fs}px ${STK_FONT}`;
    ctx.fillText('ARAÇ SAHİBİNE', STK.W / 2, STK.L1);
    ctx.fillText('ULAŞMAK İÇİN', STK.W / 2, STK.L2);
    ctx.fillText('KAREKODU OKUTUN', STK.W / 2, STK.L3);
    ctx.font = `800 100px ${STK_FONT}`;
    const us = 100 * STK.URL_W / ctx.measureText('www.kisiselqr.com').width;
    ctx.font = `800 ${us}px ${STK_FONT}`;
    ctx.fillText('www.kisiselqr.com', STK.W / 2, STK.URL_B);
    ctx.restore();
    return h;
  }

  // Telefon ekranı: gerçek profil sayfasının mobil ekran görüntüsü, vitrin içeriğiyle (araclar/demo_ekran_goruntusu.py)
  const EKRAN_ZEMIN = '#F8F9FB';   // profil sayfasının zemini (ekran görüntüsünden ölçüldü): durum çubuğu bununla dolar
  // iPhone durum çubuğu: sol kulakta saat, sağ kulakta sinyal + Wi-Fi + pil. cy: çentiğin dikey ortası,
  // c0/c1: çentiğin sol/sağ kenarı.
  function durumCubugu(ctx, X, cy, SW, c0, c1) {
    const k = '#111111', soluk = 'rgba(17,17,17,0.45)';
    txt(ctx, '9:41', (X + c0) / 2, cy + 0.48, { size: 1.35, w: 600, color: k, align: 'center' });
    const r0 = (c1 + X + SW) / 2 - 2.75, alt = cy + 0.42;
    ctx.fillStyle = k;
    [0.32, 0.48, 0.64, 0.8].forEach((hh, i) => { rr(ctx, r0 + i * 0.36, alt - hh, 0.24, hh, 0.06); ctx.fill(); });
    const wx = r0 + 2.3;
    ctx.strokeStyle = k; ctx.lineWidth = 0.14; ctx.lineCap = 'round';
    [0.35, 0.6, 0.85].forEach(r => { ctx.beginPath(); ctx.arc(wx, alt, r, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(wx, alt - 0.06, 0.1, 0, Math.PI * 2); ctx.fill();
    const bx = r0 + 3.45, by = cy - 0.38, bw = 1.85, bh = 0.82;
    ctx.strokeStyle = soluk; ctx.lineWidth = 0.1; rr(ctx, bx, by, bw, bh, 0.24); ctx.stroke();
    ctx.fillStyle = k; rr(ctx, bx + 0.16, by + 0.16, bw - 0.6, bh - 0.32, 0.12); ctx.fill();
    ctx.fillStyle = soluk; rr(ctx, bx + bw + 0.08, by + 0.27, 0.12, 0.28, 0.05); ctx.fill();
  }
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');
  // SCREEN: ortak telefon (Tasarım 2–4, lib.phone varsayılanı). SCREEN_T1: Tasarım 1'in sade vitrin ekranı
  // (ad + plaka + bildirim butonları, 9 Ekim). 2–4'e dokunulmadığı için iki ayrı dosya.
  let SCREEN = null, SCREEN_T1 = null;
  function resimAl(ad) {
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = BASE + ad; });
  }
  function loadScreen() {
    return Promise.all([resimAl('demo_profil_ekran.jpg'), resimAl('vitrin_profil_ekran.jpg')])
      .then(([a, b]) => { SCREEN = a; SCREEN_T1 = b || a; });
  }

  // Mağaza rozetleri: Apple ve Google'ın resmi Türkçe rozet görselleri (değiştirilmeden kullanılır).
  // Kurallar: baskıda yükseklik ≥ 10 mm (Apple) / ≥ 7,6 mm (Google, App Store'dan küçük olamaz),
  // çevrede rozet yüksekliğinin ¼'ü kadar boşluk, birlikteyse siyah rozet ve App Store önde.
  const ROZET = { apple: null, google: null };
  const GOOGLE_KIRP = [0, 29, 646, 192];          // PNG'deki şeffaf payı at: rozetin kendisi (646 × 192 px)
  function resimYukle(src) {
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  }
  // App Store rozetinin iç siyahı SVG'de varsayılan dolgu (#000). Matbaa PDF'inde #000 = yalnız K100 (küçük metin),
  // zemin ise zengin siyah (#0A0A0A → 60/40/40/100): rozet zeminden soluk basılmasın diye varsayılan dolgu
  // #0A0A0A yapılır. Ekranda fark görünmez; beyaz yazı ve gri kenar (açık dolgulu yollar) aynen kalır.
  function appleRozetYukle() {
    return fetch(BASE + 'rozet_appstore_tr.svg').then(r => r.text())
      .then(t => resimYukle(URL.createObjectURL(new Blob([t.replace('<svg ', `<svg fill="${C.K}" `)], { type: 'image/svg+xml' }))))
      .catch(() => resimYukle(BASE + 'rozet_appstore_tr.svg'));
  }
  function loadRozetler() {
    return Promise.all([appleRozetYukle(), resimYukle(BASE + 'rozet_googleplay_tr.png')])
      .then(([a, g]) => { ROZET.apple = a; ROZET.google = g; });
  }
  // App Store önde, alt alta ve AYNI GENİŞLİKTE: App Store h yüksekliğinde (≥ 10 mm), Google Play aynı genişliğe
  // ölçeklenir, bu yüzden biraz daha yüksek olur (Google kuralı: diğer rozetlerle aynı boy ya da daha büyük;
  // Apple'ın buna kısıtı yok). Aradaki boşluk büyük rozetin ¼'ü. Döndürür: {w, h, gh (Google yüksekliği), ara}
  function magazaRozetleri(ctx, x, y, h) {
    const aw = ROZET_GEN(h), gh = aw * GOOGLE_KIRP[3] / GOOGLE_KIRP[2], ara = Math.max(h, gh) / 4;
    if (ROZET.apple) ctx.drawImage(ROZET.apple, x, y, aw, h);
    if (ROZET.google) ctx.drawImage(ROZET.google, GOOGLE_KIRP[0], GOOGLE_KIRP[1], GOOGLE_KIRP[2], GOOGLE_KIRP[3], x, y + h + ara, aw, gh);
    return { w: aw, h: h + ara + gh, gh, ara };
  }
  const ROZET_GEN = (h) => h * 151.29018 / 40;

  // ------------------------------------------------------------ zeminler
  function grounds(ctx, g) {
    const { P, yT, yBt, yp } = g;
    const GROUND = {
      On: C.K, Sol: C.K, Sag: C.K, Arka: C.K, Baslik2: C.Y, UstKapak: C.K,
      SolUstToz: C.K, SagUstToz: C.K, SolAltToz: C.K, SagAltToz: C.K, AltKapak: C.Y, Dil: C.Y,
    };
    const zones = [
      { pts: rectPts(P.Arka.x0, P.Arka.y0, P.Arka.x1, yT), c: C.Y },                 // Euro başlık 1. kat
      { pts: rectPts(P.On.x0, yBt - FRONT_BAND, P.On.x1, yBt), c: C.Y },            // ön alt sarı bant (ikonlar + mühür)
      { pts: rectPts(P.Arka.x0, yBt - BACK_BAND, P.Arka.x1, yBt), c: C.Y },          // arka yasal bant
    ];
    // 1) taşma: her baskılı yüzeyin konturu 2 × 3 mm kalınlıkta kendi renginde çizilir;
    //    komşu panelin dolgusu içerideki kısmı örter, yalnızca dışarı taşan 3 mm kalır.
    ctx.lineJoin = 'round'; ctx.lineWidth = 2 * BLEED;   // yuvarlak birleşim: taşma her köşede tam 3 mm, sivri uç yok
    ctx.setLineDash([]);
    Object.keys(GROUND).forEach(n => { ctx.strokeStyle = GROUND[n]; panelPath(ctx, P[n].p); ctx.stroke(); });
    zones.forEach(z => { if (z.c === C.W) return;   // beyaz = kâğıt: taşma gerekmez, komşu taşmanın üstüne beyaz basmasın
      ctx.strokeStyle = z.c; ctx.beginPath(); trace(ctx, z.pts); ctx.stroke(); });
    // 2) dolgular
    Object.keys(GROUND).forEach(n => { ctx.fillStyle = GROUND[n]; panelPath(ctx, P[n].p); ctx.fill('evenodd'); });
    zones.forEach(z => { ctx.fillStyle = z.c; ctx.beginPath(); trace(ctx, z.pts); ctx.fill(); });
    // 3) baskısız alanlar: tutkal payı, üst yapıştırma dili (dış yüz)
    ['Tutkal', 'UstDil'].forEach(n => { ctx.fillStyle = C.RAW; panelPath(ctx, P[n].p); ctx.fill(); });
  }
  const BACK_BAND = 37;     // arka yüz alt yasal bant (sarı). 30,5 → 32,5 (6 Ekim, Apple satırı) → 37 (9 Ekim: gereksinim, dayanım, 112, sahte QR)
  const FRONT_BAND = 24;    // ön yüz alt sarı bant: ikon satırı + alt kenar
  const MUHUR_D = 20, MUHUR_PAY = 0.8;   // Ø20 void mühür etiketi: yarısı ön yüzün alt kenarında, ortada (kutu_acinim.py)

  // ------------------------------------------------------------ ÖN YÜZ
  function front(ctx, w, h, px) {
    const L = SAFE + 2;
    // Üst: marka. Ürünün adı başlığa geçtiği için logo büyüdü (10 → 13 mm, sarı, lokal UV lak): marka sönük kalmaz.
    const LH = 13, LY = SAFE + 1.5;
    logo(ctx, L, LY, LH, C.Y);
    txt(ctx, 'by Candemsoft', w - SAFE - 2, LY + LH - 0.01 * LH, { size: 7 * PT, w: 500, color: C.W, align: 'right' });

    // Başlık: ürünün ne olduğu (raftaki ilk soru). Tek satır, genişliğe sığan en büyük boy (≤ 26 pt); "AKILLI" sarı.
    let ts = 26 * PT;
    while (tw(ctx, 'AKILLI ARAÇ ETİKETİ', ts, 900) > w - 2 * L) ts -= 0.02;
    const tY = LY + LH + 4.2 + 0.727 * ts;         // logonun 4,2 mm altı (büyük harf üstü)
    const w1 = txt(ctx, 'AKILLI ', L, tY, { size: ts, w: 900, color: C.Y });
    txt(ctx, 'ARAÇ ETİKETİ', L + w1, tY, { size: ts, w: 900, color: C.W });
    txt(ctx, '+ Dijital Kartvizit', L, tY + 6.0, { size: 10 * PT, w: 700, color: C.KB });

    const bandY = h - FRONT_BAND;              // sarı bandın üst kenarı
    const slogY = bandY - 16;                  // slogan bloğunun üstü (9 Ekim: slogan 12 → 14 pt, fayda öne)
    // Görsel alan: gerçek oranlı araç (önden) + camdaki sticker için büyüteç
    const vTop = 39, vBot = slogY - 1;
    ctx.save();
    ctx.beginPath(); ctx.rect(-BLEED, vTop, w + 2 * BLEED, vBot - vTop); ctx.clip();
    const st = arabaOn(ctx, { cx: 36.5, yer: 93.8, s: 0.028, px });
    ctx.restore();

    // Telefon mockup (~28 × 56 mm), sağa yakın; ekran lokal UV lak
    phone(ctx, w - SAFE - 2 - 28, 39.5, 28, 56, px, SCREEN_T1);

    // Büyüteç: sticker'ın yakın planı (sol üstte, araçla telefonun arasında kalmaz)
    buyutec(ctx, 12.9, 47.9, 8.7, st, px);

    // Rozet: sarı zemin, siyah yazı, eğik etiket (lak almaz). Kategoriye en hızlı köprü: 9 Ekim'de 8,3 → 9 pt.
    ctx.save();
    ctx.translate(52, 88.6); ctx.rotate(-6 * Math.PI / 180);
    ctx.fillStyle = C.Y; rr(ctx, -18.3, -5.1, 36.6, 10.2, 2.3); ctx.fill();
    txt(ctx, 'Artık numaratöre', 0, -0.6, { size: 9 * PT, w: 800, color: C.K100, align: 'center' });
    txt(ctx, 'gerek yok', 0, 2.95, { size: 9 * PT, w: 800, color: C.K100, align: 'center' });
    ctx.restore();

    // Slogan: "Herkese numaranı vermek zorunda değilsin." (iki satır, "numaranı" sarı; 14 pt)
    const sg = 14 * PT, sb1 = slogY + 0.73 * sg + 0.6, sb2 = sb1 + sg * 1.15;
    const sa = txt(ctx, 'Herkese ', L, sb1, { size: sg, w: 800, color: C.W });
    txt(ctx, 'numaranı', L + sa, sb1, { size: sg, w: 800, color: C.Y });
    txt(ctx, 'vermek zorunda değilsin.', L, sb2, { size: sg, w: 800, color: C.W });
    // Denemeye çağrı: arka yüzdeki örnek etiket rafta telefonla okutulabilir (sloganın sağında, sağa yaslı)
    const cs = 7.5 * PT;
    txt(ctx, "Arkadaki QR'ı", w - L, sb1 - 1.2, { size: cs, w: 700, color: C.Y, align: 'right' });
    txt(ctx, 'okut, dene →', w - L, sb1 + 2.0, { size: cs, w: 700, color: C.Y, align: 'right' });

    // İkon şeridi (sarı bant): 4 küçük çizgisel ikon (7,2 mm) + yanında 7 pt iki satırlık etiket
    // 9 Ekim: "Aylık ücret yok" → "Abonelik yok" (rakiplerde norm "ömür boyu"; aylık deyince yıllık soru kalıyordu)
    const items = [['gizli', 'Numaran', 'gizli'], ['bildirim', 'Anında', 'bildirim'],
                   ['kartvizit', 'Dijital', 'kartvizit'], ['ucretsiz', 'Abonelik', 'yok']];
    // gruplar eşit aralıkla dağıtılır: ilk grup L'de (logo/slogan hizası), son grup w − L'de biter
    const ic = 7.2, ls = 7 * PT;
    const gruplar = items.map(it => ic + 1.3 + Math.max(tw(ctx, it[1], ls, 600), tw(ctx, it[2], ls, 600)));
    const ara = (w - 2 * L - gruplar.reduce((a, b) => a + b, 0)) / (items.length - 1);
    const gxs = gruplar.map((g, i) => L + gruplar.slice(0, i).reduce((a, b) => a + b, 0) + i * ara);
    // Dikey konum: sarı alanın ortasına olabildiğince yakın. Sınır, alt kenarın ortasındaki Ø20 mühür
    // etiketinin ön yüzdeki yarım dairesi (metin/ikon giremez): her grup ona en az MUHUR_PAY uzak kalır.
    const muhurUzak = y => Math.min(...gxs.map((x0, i) => {
      const dx = Math.max(x0 - w / 2, 0, w / 2 - (x0 + gruplar[i]));
      return Math.hypot(dx, h - (y + ic));
    }));
    let iy = bandY + (FRONT_BAND - ic) / 2;
    while (muhurUzak(iy) < MUHUR_D / 2 + MUHUR_PAY) iy -= 0.05;
    items.forEach((it, i) => {
      const gx = gxs[i];
      ctx.save(); ctx.translate(gx, iy); ctx.scale(ic / 10, ic / 10); ICONS[it[0]](ctx); ctx.restore();
      txt(ctx, it[1], gx + ic + 1.3, iy + ic / 2 - 0.35, { size: ls, w: 600, color: C.K100 });
      txt(ctx, it[2], gx + ic + 1.3, iy + ic / 2 + 2.45, { size: ls, w: 600, color: C.K100 });
    });
    // Alt kenarın ortası: Ø20 mühür etiketi alanı – yalnızca zemin rengi
  }

  // ------------------------------------------------------------ ARAÇ (önden, gerçek oranlarla)
  // Modern bir kompakt otomobilin önden görünüşü gerçek ölçülerle tanımlanır (mm, x eksenden sağa, y yerden
  // yukarı) ve kutuya s ölçeğiyle çizilir. Ölçüler: gövde 1836 × 1480, iz 1560, lastik 215, ayna açıklığı 2074.
  // Sticker (50 × 80 mm) camın sol alt köşesinde GERÇEK boyutunda durur; ayrıca büyüteçte yakından gösterilir.
  // Ön görünüşte cam eğik olduğu için dikey ölçüler CAM_K oranında kısalır.
  const ARAC = { STK_X: -618, STK_Y: 1064, STK_W: 50, STK_H: 80, CAM_K: 0.45 };

  function yolCiz(ctx, segs, devam) {
    segs.forEach((g, i) => {
      if (g[0] === 'M') { if (devam && i === 0) ctx.lineTo(g[1], g[2]); else ctx.moveTo(g[1], g[2]); }
      else if (g[0] === 'L') ctx.lineTo(g[1], g[2]);
      else if (g[0] === 'Q') ctx.quadraticCurveTo(g[1], g[2], g[3], g[4]);
      else ctx.bezierCurveTo(g[1], g[2], g[3], g[4], g[5], g[6]);
    });
  }
  const aynala = segs => segs.map(g => g.map((v, i) => (i % 2 === 1 ? -v : v)));   // x → −x
  function tersYol(segs) {
    const uc = segs.map(g => [g[g.length - 2], g[g.length - 1]]);
    const out = [['M', ...uc[uc.length - 1]]];
    for (let i = segs.length - 1; i >= 1; i--) {
      const g = segs[i], p = uc[i - 1];
      if (g[0] === 'L') out.push(['L', ...p]);
      else if (g[0] === 'Q') out.push(['Q', g[1], g[2], ...p]);
      else out.push(['C', g[3], g[4], g[1], g[2], ...p]);
    }
    return out;
  }
  // sağ yarısı (üst ortadan alt ortaya) verilen simetrik kapalı şekil
  function simetrik(ctx, sag) { ctx.beginPath(); yolCiz(ctx, sag); yolCiz(ctx, tersYol(aynala(sag)), true); ctx.closePath(); }
  function sekil(ctx, segs) { ctx.beginPath(); yolCiz(ctx, segs); ctx.closePath(); }
  function ikiYan(ctx, segs, fn) { [segs, aynala(segs)].forEach((s, k) => { sekil(ctx, s); fn(k ? -1 : 1); }); }

  const GOVDE = [['M', 0, 1480], ['Q', 380, 1478, 598, 1452], ['Q', 652, 1446, 668, 1418], ['L', 762, 1186],
    ['Q', 800, 1082, 866, 998], ['Q', 906, 962, 912, 880], ['L', 918, 640], ['Q', 919, 470, 902, 405],
    ['Q', 890, 362, 846, 352], ['L', 700, 346], ['Q', 648, 344, 636, 310], ['L', 612, 228], ['Q', 600, 196, 560, 192], ['L', 0, 184]];
  const CAM = [['M', 0, 1416], ['Q', 330, 1413, 522, 1397], ['Q', 550, 1394, 557, 1370], ['L', 688, 1050],
    ['Q', 697, 1022, 668, 1019], ['Q', 330, 1010, 0, 1008]];
  const KAPUT = [['M', 0, 992], ['L', 716, 994], ['Q', 768, 992, 788, 958], ['L', 822, 832], ['Q', 828, 808, 800, 806],
    ['Q', 400, 792, 0, 776]];
  const IZGARA = [['M', 0, 744], ['L', 356, 730], ['Q', 392, 722, 386, 700], ['L', 346, 642], ['Q', 334, 628, 300, 628], ['L', 0, 630]];
  const ALT_GIRIS = [['M', 0, 524], ['L', 440, 518], ['Q', 480, 516, 472, 488], ['L', 444, 350], ['Q', 436, 324, 404, 322], ['L', 0, 316]];
  const PLAKA = { x: -255, y: 382, w: 510, h: 110 };     // TR plakası 520 × 110 (önden), kurgusal 34 ABC 123
  const FAR = [['M', 386, 706], ['Q', 600, 752, 850, 790], ['Q', 882, 793, 885, 768], ['Q', 888, 736, 858, 729],
    ['Q', 620, 700, 420, 672], ['Q', 378, 678, 386, 706]];
  const YAN_GIRIS = [['M', 566, 576], ['L', 690, 562], ['Q', 736, 557, 744, 520], ['L', 756, 438], ['Q', 761, 396, 724, 394],
    ['L', 604, 392], ['Q', 570, 393, 568, 426]];
  const SUTUN = [['M', 545, 1404], ['L', 636, 1421], ['L', 783, 1000], ['L', 703, 1010]];
  const YAN_CAM = [['M', 636, 1421], ['L', 666, 1419], ['L', 760, 1188], ['Q', 798, 1084, 860, 1000], ['L', 783, 1000]];
  const AYNA = [['M', 840, 1004], ['Q', 930, 984, 1000, 990], ['Q', 1042, 996, 1042, 1046], ['Q', 1042, 1100, 990, 1110],
    ['L', 886, 1108], ['Q', 846, 1104, 840, 1066]];
  const LASTIK = [['M', 668, 330], ['L', 886, 330], ['L', 888, 70], ['Q', 888, 8, 846, 4], ['L', 708, 4], ['Q', 666, 8, 666, 70]];

  // o: { cx, yer, s, px } → kutu mm; döndürür: sticker'ın kutudaki kutusu {x, y, w, h}
  function arabaOn(ctx, o) {
    const s = o.s, lw = mm => mm / s, px = o.px || 10;
    const isik = a => `rgba(255,255,255,${a})`;
    ctx.save();
    ctx.translate(o.cx, o.yer); ctx.scale(s, -s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // zemin parıltısı (stüdyo ışığı, aracı zemine oturtur)
    ctx.save(); ctx.scale(1, 0.085);
    const zg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1350);
    zg.addColorStop(0, isik(0.10)); zg.addColorStop(0.55, isik(0.035)); zg.addColorStop(1, isik(0));
    ctx.fillStyle = zg; ctx.beginPath(); ctx.arc(0, 0, 1350, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // temas gölgesi
    ctx.save(); ctx.scale(1, 0.06);
    const cs = ctx.createRadialGradient(0, 0, 0, 0, 0, 1000);
    cs.addColorStop(0, 'rgba(0,0,0,0.8)'); cs.addColorStop(0.75, 'rgba(0,0,0,0.55)'); cs.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cs; ctx.beginPath(); ctx.arc(0, 0, 1000, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // lastikler (gövdenin arkasında kalır): sırt yüzeyi silindir gibi gölgelenir
    ikiYan(ctx, LASTIK, k => {
      const tg = ctx.createLinearGradient(0, 0, 0, 340);
      tg.addColorStop(0, '#060707'); tg.addColorStop(0.3, '#1d1f21'); tg.addColorStop(0.62, '#17181a'); tg.addColorStop(1, '#0b0c0d');
      ctx.fillStyle = tg; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = lw(0.12);
      [736, 777, 818].forEach(x => { ctx.beginPath(); ctx.moveTo(k * x, 14); ctx.lineTo(k * x, 330); ctx.stroke(); });
      const omuz = ctx.createLinearGradient(k * 666, 0, k * 888, 0);
      omuz.addColorStop(0, 'rgba(0,0,0,0.6)'); omuz.addColorStop(0.18, 'rgba(0,0,0,0)'); omuz.addColorStop(0.82, 'rgba(0,0,0,0)'); omuz.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = omuz; ctx.fillRect(k > 0 ? 660 : -892, 0, 232, 340);
      ctx.restore();
      ctx.strokeStyle = isik(0.1); ctx.lineWidth = lw(0.1); ctx.stroke();
    });

    // gövde: temel dolgu (üst yüzeyler ışık alır)
    simetrik(ctx, GOVDE);
    const gg = ctx.createLinearGradient(0, 176, 0, 1480);
    gg.addColorStop(0, '#0f1011'); gg.addColorStop(0.18, '#18191b'); gg.addColorStop(0.45, '#212326');
    gg.addColorStop(0.62, '#272a2d'); gg.addColorStop(0.7, '#1f2124'); gg.addColorStop(0.93, '#2b2e32'); gg.addColorStop(1, '#43474c');
    ctx.fillStyle = gg; ctx.fill();
    // yan yüzeyler kenara doğru koyulaşır (hacim)
    ctx.save(); simetrik(ctx, GOVDE); ctx.clip();
    const yg = ctx.createLinearGradient(-930, 0, 930, 0);
    yg.addColorStop(0, 'rgba(0,0,0,0.55)'); yg.addColorStop(0.16, 'rgba(0,0,0,0)'); yg.addColorStop(0.84, 'rgba(0,0,0,0)'); yg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = yg; ctx.fillRect(-940, 150, 1880, 1350);
    ctx.restore();

    // kaput: yukarı bakan yüzey, gövdeden açık
    simetrik(ctx, KAPUT);
    const kg = ctx.createLinearGradient(0, 776, 0, 992);
    kg.addColorStop(0, '#24272a'); kg.addColorStop(0.35, '#3b3f44'); kg.addColorStop(1, '#30343a');
    ctx.fillStyle = kg; ctx.fill();
    ctx.save(); simetrik(ctx, KAPUT); ctx.clip();
    ctx.fillStyle = yg; ctx.fillRect(-940, 760, 1880, 240);
    const hs = ctx.createRadialGradient(-140, 905, 10, -140, 905, 560);
    hs.addColorStop(0, 'rgba(255,255,255,0.12)'); hs.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hs; ctx.fillRect(-940, 760, 1880, 240);
    // kaput kıvrımları (ışık + gölge çifti)
    [[1, 0.2], [-1, 0.2]].forEach(([k]) => {
      ctx.strokeStyle = isik(0.16); ctx.lineWidth = lw(0.16);
      ctx.beginPath(); ctx.moveTo(k * 238, 786); ctx.quadraticCurveTo(k * 300, 880, k * 372, 990); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.moveTo(k * 252, 786); ctx.quadraticCurveTo(k * 316, 880, k * 390, 990); ctx.stroke();
    });
    ctx.restore();
    // kaput ön kenarı parlaklığı + yan kapı (çamurluk) derz çizgileri
    ctx.strokeStyle = isik(0.42); ctx.lineWidth = lw(0.18);
    ctx.beginPath(); ctx.moveTo(-800, 806); ctx.quadraticCurveTo(-400, 792, 0, 776); ctx.quadraticCurveTo(400, 792, 800, 806); ctx.stroke();
    ctx.strokeStyle = '#060707'; ctx.lineWidth = lw(0.16);
    [1, -1].forEach(k => { ctx.beginPath(); ctx.moveTo(k * 788, 958); ctx.lineTo(k * 822, 832); ctx.stroke(); });

    // ön cam bölgesi: torpido gözü (cowl) + silecek
    ctx.fillStyle = '#0a0b0c';
    ctx.beginPath(); ctx.moveTo(-716, 994); ctx.lineTo(716, 994); ctx.lineTo(690, 1016); ctx.quadraticCurveTo(0, 1004, -690, 1016); ctx.closePath(); ctx.fill();

    // CAM: koyu, içi hafif görünür
    simetrik(ctx, CAM); ctx.fillStyle = '#0c0e11'; ctx.fill();
    ctx.save(); simetrik(ctx, CAM); ctx.clip();
    // arka cam ışığı (derinlik)
    ctx.fillStyle = isik(0.05);
    ctx.beginPath(); ctx.moveTo(-470, 1352); ctx.lineTo(470, 1352); ctx.lineTo(520, 1168); ctx.lineTo(-520, 1168); ctx.closePath(); ctx.fill();
    // koltuk sırtları ve başlıklar
    [-1, 1].forEach(k => {
      ctx.fillStyle = '#16181a'; rr(ctx, k * 355 - 165, 1100, 330, 140, 60); ctx.fill();
      ctx.fillStyle = '#1d2023'; rr(ctx, k * 355 - 86, 1222, 172, 108, 42); ctx.fill();
      ctx.strokeStyle = isik(0.07); ctx.lineWidth = lw(0.12); rr(ctx, k * 355 - 86, 1222, 172, 108, 42); ctx.stroke();
      ctx.fillStyle = '#131416'; rr(ctx, k * 300 - 58, 1200, 116, 66, 26); ctx.fill();
    });
    // direksiyon (sürücü = aracın solu = görüntünün sağı)
    ctx.strokeStyle = '#2b2e31'; ctx.lineWidth = lw(0.9);
    ctx.beginPath(); ctx.ellipse(362, 1092, 176, 124, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = isik(0.10); ctx.lineWidth = lw(0.14);
    ctx.beginPath(); ctx.ellipse(362, 1092, 190, 138, 0, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    // torpido (camın arkasında)
    ctx.fillStyle = '#111214';
    ctx.beginPath(); ctx.moveTo(-720, 1000); ctx.lineTo(-720, 1056); ctx.quadraticCurveTo(0, 1102, 720, 1056); ctx.lineTo(720, 1000); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#16181a';
    ctx.beginPath(); ctx.moveTo(214, 1084); ctx.quadraticCurveTo(362, 1146, 512, 1076); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = isik(0.09); ctx.lineWidth = lw(0.12);
    ctx.beginPath(); ctx.moveTo(-700, 1058); ctx.quadraticCurveTo(0, 1104, 700, 1058); ctx.stroke();
    // iç dikiz aynası + sensör kapağı
    ctx.fillStyle = '#050606'; rr(ctx, -72, 1352, 144, 70, 18); ctx.fill();
    ctx.fillStyle = '#121416'; rr(ctx, -124, 1296, 248, 58, 22); ctx.fill();
    ctx.strokeStyle = isik(0.32); ctx.lineWidth = lw(0.12); rr(ctx, -124, 1296, 248, 58, 22); ctx.stroke();
    // serigrafi (siyah seramik bant): üst kenar
    const sg = ctx.createLinearGradient(0, 1416, 0, 1360);
    sg.addColorStop(0, 'rgba(0,0,0,0.95)'); sg.addColorStop(0.55, 'rgba(0,0,0,0.85)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg; ctx.fillRect(-700, 1360, 1400, 60);
    // gökyüzü yansıması + çapraz parlamalar
    const rg = ctx.createLinearGradient(0, 1416, 0, 1008);
    rg.addColorStop(0, 'rgba(205,215,228,0.20)'); rg.addColorStop(0.45, 'rgba(205,215,228,0.05)'); rg.addColorStop(1, 'rgba(205,215,228,0.0)');
    ctx.fillStyle = rg; ctx.fillRect(-720, 1000, 1440, 420);
    ctx.fillStyle = isik(0.055);
    ctx.beginPath(); ctx.moveTo(-60, 1420); ctx.lineTo(90, 1420); ctx.lineTo(-170, 1000); ctx.lineTo(-320, 1000); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(140, 1420); ctx.lineTo(185, 1420); ctx.lineTo(-75, 1000); ctx.lineTo(-120, 1000); ctx.closePath(); ctx.fill();
    ctx.restore();
    // cam kenarı
    simetrik(ctx, CAM); ctx.strokeStyle = isik(0.42); ctx.lineWidth = lw(0.15); ctx.stroke();
    // silecekler
    ctx.strokeStyle = '#1b1d1f'; ctx.lineWidth = lw(0.32);
    ctx.beginPath(); ctx.moveTo(-36, 1013); ctx.lineTo(-650, 1027); ctx.moveTo(612, 1013); ctx.lineTo(70, 1024); ctx.stroke();
    ctx.strokeStyle = isik(0.22); ctx.lineWidth = lw(0.1);
    ctx.beginPath(); ctx.moveTo(-36, 1019); ctx.lineTo(-650, 1033); ctx.moveTo(612, 1019); ctx.lineTo(70, 1030); ctx.stroke();

    // A sütunları ve yan camlar
    ikiYan(ctx, YAN_CAM, () => { ctx.fillStyle = '#0b0d0f'; ctx.fill(); ctx.strokeStyle = isik(0.18); ctx.lineWidth = lw(0.1); ctx.stroke(); });
    ikiYan(ctx, SUTUN, () => {
      const pg = ctx.createLinearGradient(0, 1000, 0, 1420);
      pg.addColorStop(0, '#1d1f22'); pg.addColorStop(1, '#2c2f33');
      ctx.fillStyle = pg; ctx.fill();
    });
    // tavan kenarı ve gövde silüeti (kenar ışığı)
    simetrik(ctx, GOVDE); ctx.strokeStyle = isik(0.38); ctx.lineWidth = lw(0.16); ctx.stroke();
    ctx.strokeStyle = isik(0.55); ctx.lineWidth = lw(0.2);
    ctx.beginPath(); ctx.moveTo(-598, 1452); ctx.quadraticCurveTo(0, 1484, 598, 1452); ctx.stroke();
    // omuz çizgisi (aynadan fara)
    ctx.strokeStyle = isik(0.2); ctx.lineWidth = lw(0.14);
    [1, -1].forEach(k => { ctx.beginPath(); ctx.moveTo(k * 868, 990); ctx.quadraticCurveTo(k * 896, 900, k * 884, 800); ctx.stroke(); });

    // yan aynalar
    ikiYan(ctx, AYNA, k => {
      const ag = ctx.createLinearGradient(0, 990, 0, 1115);
      ag.addColorStop(0, '#16181a'); ag.addColorStop(1, '#30343a');
      ctx.fillStyle = ag; ctx.fill();
      ctx.strokeStyle = isik(0.4); ctx.lineWidth = lw(0.14); ctx.stroke();
      ctx.strokeStyle = isik(0.5); ctx.lineWidth = lw(0.12);   // üst kenar ışığı
      ctx.beginPath(); ctx.moveTo(k * 880, 1104); ctx.lineTo(k * 986, 1106); ctx.quadraticCurveTo(k * 1030, 1098, k * 1038, 1060); ctx.stroke();
    });

    // ızgara
    simetrik(ctx, IZGARA); ctx.fillStyle = '#0a0b0c'; ctx.fill();
    ctx.save(); simetrik(ctx, IZGARA); ctx.clip();
    ctx.strokeStyle = '#2a2d30'; ctx.lineWidth = lw(0.16);
    [716, 694, 672, 650].forEach(y => { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(400, y); ctx.stroke(); });
    ctx.restore();
    ctx.strokeStyle = isik(0.5); ctx.lineWidth = lw(0.14);
    ctx.beginPath(); ctx.moveTo(-356, 730); ctx.lineTo(0, 744); ctx.lineTo(356, 730); ctx.stroke();
    // amblem (markasız)
    ctx.fillStyle = '#15171a'; ctx.beginPath(); ctx.arc(0, 688, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = isik(0.7); ctx.lineWidth = lw(0.16); ctx.stroke();
    ctx.strokeStyle = isik(0.35); ctx.lineWidth = lw(0.1); ctx.beginPath(); ctx.arc(0, 688, 17, 0, Math.PI * 2); ctx.stroke();

    // farlar
    ikiYan(ctx, FAR, k => {
      const fg = ctx.createLinearGradient(0, 672, 0, 792);
      fg.addColorStop(0, '#08090a'); fg.addColorStop(1, '#2a2e33');
      ctx.fillStyle = fg; ctx.fill();
      ctx.strokeStyle = isik(0.55); ctx.lineWidth = lw(0.14); ctx.stroke();
      // gündüz farı (LED şerit, hafif ışıma)
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 0.6 * px;
      ctx.strokeStyle = '#F4F4F2'; ctx.lineWidth = lw(0.32);
      ctx.beginPath(); ctx.moveTo(k * 420, 712); ctx.quadraticCurveTo(k * 610, 750, k * 846, 781); ctx.stroke();
      ctx.restore();
      [[700, 742, 27], [566, 724, 21]].forEach(([x, y, r]) => {
        const lg = ctx.createRadialGradient(k * x - k * 6, y + 6, 2, k * x, y, r);
        lg.addColorStop(0, '#4a4f56'); lg.addColorStop(1, '#0b0c0e');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(k * x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isik(0.45); ctx.lineWidth = lw(0.1); ctx.stroke();
      });
    });

    // tampon: yatay kıvrım + alt hava girişi + yan girişler
    ctx.strokeStyle = isik(0.14); ctx.lineWidth = lw(0.14);
    ctx.beginPath(); ctx.moveTo(-560, 612); ctx.quadraticCurveTo(0, 626, 560, 612); ctx.stroke();
    simetrik(ctx, ALT_GIRIS); ctx.fillStyle = '#0a0b0c'; ctx.fill();
    ctx.save(); simetrik(ctx, ALT_GIRIS); ctx.clip();
    ctx.strokeStyle = '#1e2124'; ctx.lineWidth = lw(0.1);
    for (let d = -1100; d < 1100; d += 30) {
      ctx.beginPath(); ctx.moveTo(d, 280); ctx.lineTo(d + 280, 560); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(d, 560); ctx.lineTo(d + 280, 280); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = isik(0.32); ctx.lineWidth = lw(0.14);
    ctx.beginPath(); ctx.moveTo(-440, 518); ctx.lineTo(0, 524); ctx.lineTo(440, 518); ctx.stroke();
    // ön spoyler dudağı
    ctx.strokeStyle = isik(0.12); ctx.lineWidth = lw(0.12);
    ctx.beginPath(); ctx.moveTo(-560, 214); ctx.lineTo(560, 214); ctx.stroke();
    ikiYan(ctx, YAN_GIRIS, k => {
      ctx.fillStyle = '#0a0b0c'; ctx.fill(); ctx.strokeStyle = isik(0.22); ctx.lineWidth = lw(0.12); ctx.stroke();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = '#1e2124'; ctx.lineWidth = lw(0.12);
      [440, 470, 500, 530].forEach(y => { ctx.beginPath(); ctx.moveTo(k * 560, y); ctx.lineTo(k * 770, y + 6); ctx.stroke(); });
      ctx.restore();
      const sl = ctx.createRadialGradient(k * 660, 420, 2, k * 660, 420, 24);
      sl.addColorStop(0, '#d9dbdd'); sl.addColorStop(0.5, '#5b6066'); sl.addColorStop(1, '#16181b');
      ctx.fillStyle = sl; ctx.beginPath(); ctx.ellipse(k * 660, 420, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();

    // plaka (TR): 520 × 110 mm, kurgusal numara
    const pk = { x: o.cx + PLAKA.x * s, y: o.yer - (PLAKA.y + PLAKA.h) * s, w: PLAKA.w * s, h: PLAKA.h * s };
    ctx.fillStyle = '#E6E6E3'; rr(ctx, pk.x, pk.y, pk.w, pk.h, 0.35); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.12; rr(ctx, pk.x + 0.18, pk.y + 0.18, pk.w - 0.36, pk.h - 0.36, 0.25); ctx.stroke();
    ctx.fillStyle = '#1F4FA3'; ctx.fillRect(pk.x + 0.3, pk.y + 0.3, pk.h * 0.36, pk.h - 0.6);
    txt(ctx, 'TR', pk.x + 0.3 + pk.h * 0.18, pk.y + pk.h - 0.62, { size: pk.h * 0.2, w: 700, color: C.W, align: 'center' });
    const pyAlan = pk.w - 0.3 - pk.h * 0.36 - 0.9, pyz = '34 ABC 123';
    const pfs = Math.min(pk.h * 0.6, pk.h * 0.6 * pyAlan / tw(ctx, pyz, pk.h * 0.6, 600));
    txt(ctx, pyz, pk.x + 0.3 + pk.h * 0.36 + (pk.w - 0.3 - pk.h * 0.36) / 2, pk.y + pk.h / 2 + pfs * 0.36, { size: pfs, w: 600, color: '#000', align: 'center' });

    // sticker: camın sol alt köşesinde gerçek boyutunda (önden bakışta dikeyde kısalır)
    const st = { x: o.cx + ARAC.STK_X * s, w: ARAC.STK_W * s, h: ARAC.STK_H * ARAC.CAM_K * s };
    st.y = o.yer - (ARAC.STK_Y * s) - st.h;
    ctx.save(); ctx.translate(st.x, st.y); ctx.scale(1, ARAC.CAM_K); sticker(ctx, 0, 0, st.w, { yazisiz: true }); ctx.restore();
    return st;
  }

  // Büyüteç: camın sol alt köşesinin yakın planı (dik bakış). k = kutu mm / gerçek mm.
  // Sticker gerçek oranıyla durur: A sütunu, serigrafi bandı, torpido ve kaputla birlikte.
  function buyutec(ctx, bx, by, br, st, px) {
    const k = 0.12;
    // hedef işareti ve bağlantı çizgisi
    const hx = st.x + st.w / 2, hy = st.y + st.h / 2, hr = 1.9;
    const ang = Math.atan2(hy - by, hx - bx);
    ctx.save();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + Math.cos(ang) * (br + 0.3), by + Math.sin(ang) * (br + 0.3));
    ctx.lineTo(hx - Math.cos(ang) * hr, hy - Math.sin(ang) * hr); ctx.stroke();
    // büyüteç içi
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 1.6 * (px || 10);
    ctx.fillStyle = '#0c0e11'; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.clip();
    ctx.translate(bx, by); ctx.scale(k, k);
    ctx.translate(14, -12);                 // görüş merkezi sticker'ın sol altında: köşe görünsün
    // yerel eksen (gerçek mm, y aşağı): sticker merkezi (0,0), boyut 50 × 80. Cam yüzüne dik bakış.
    const R = br / k + 40;
    const ic = y => -50 + 0.18 * (40 - y);          // serigrafinin iç kenarı (A sütunu tarafı)
    const CAM_ALT = 66;                             // camın alt kenarı (serigrafi bitişi)
    // cam + içerisi
    const cg = ctx.createLinearGradient(0, -R, 0, R);
    cg.addColorStop(0, '#1a1f25'); cg.addColorStop(0.55, '#0e1115'); cg.addColorStop(1, '#0a0b0d');
    ctx.fillStyle = cg; ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.fillStyle = '#101113';                      // torpido üstü (camın arkasında)
    ctx.beginPath(); ctx.moveTo(-R, 47); ctx.quadraticCurveTo(0, 43, R, 46); ctx.lineTo(R, R); ctx.lineTo(-R, R); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-R, 47); ctx.quadraticCurveTo(0, 43, R, 46); ctx.stroke();
    // parlama
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.moveTo(30, -R); ctx.lineTo(70, -R); ctx.lineTo(10, R); ctx.lineTo(-30, R); ctx.closePath(); ctx.fill();
    // sticker (gerçek tasarım)
    sticker(ctx, -25, -40, 50, { edge: 3 });
    // serigrafi bandı: alt kenar ve A sütunu kenarı (noktalı geçiş)
    ctx.fillStyle = '#050505';
    ctx.fillRect(-R, CAM_ALT - 12, 2 * R, R);
    for (let x = -R; x < R; x += 4.2) for (let j = 0; j < 3; j++) {
      ctx.beginPath(); ctx.arc(x + (j % 2) * 2.1, CAM_ALT - 15 - j * 4.2, 1.5 - j * 0.45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(ic(-R), -R); ctx.lineTo(ic(R), R); ctx.lineTo(-R, R); ctx.lineTo(-R, -R); ctx.closePath(); ctx.fill();
    for (let y = -R; y < CAM_ALT - 12; y += 4.2) for (let j = 0; j < 3; j++) {
      ctx.beginPath(); ctx.arc(ic(y) + 3 + j * 4.2, y + (j % 2) * 2.1, 1.5 - j * 0.45, 0, Math.PI * 2); ctx.fill();
    }
    // A sütunu (lastik fitil + gövde rengi)
    const gx = y => ic(y) - 20;
    ctx.fillStyle = '#08090a';
    ctx.beginPath(); ctx.moveTo(gx(-R), -R); ctx.lineTo(gx(R), R); ctx.lineTo(-R, R); ctx.lineTo(-R, -R); ctx.closePath(); ctx.fill();
    const pg = ctx.createLinearGradient(-R, 0, gx(0) - 6, 0);
    pg.addColorStop(0, '#1a1c1f'); pg.addColorStop(1, '#34383d');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.moveTo(gx(-R) - 6, -R); ctx.lineTo(gx(R) - 6, R); ctx.lineTo(-R, R); ctx.lineTo(-R, -R); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(gx(-R) - 6, -R); ctx.lineTo(gx(R) - 6, R); ctx.stroke();
    // torpido kapağı (cowl), silecek ve kaput kenarı
    ctx.fillStyle = '#08090a'; ctx.fillRect(-R, CAM_ALT, 2 * R, 9);
    ctx.strokeStyle = '#1b1d1f'; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(-R, CAM_ALT + 3.5); ctx.lineTo(R, CAM_ALT + 2.2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-R, CAM_ALT + 1.8); ctx.lineTo(R, CAM_ALT + 0.5); ctx.stroke();
    const hg = ctx.createLinearGradient(0, CAM_ALT + 9, 0, R);
    hg.addColorStop(0, '#3e4248'); hg.addColorStop(1, '#202326');
    ctx.fillStyle = hg; ctx.fillRect(-R, CAM_ALT + 9, 2 * R, R);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-R, CAM_ALT + 9); ctx.lineTo(R, CAM_ALT + 9); ctx.stroke();
    ctx.restore();
    // mercek kenarı: sarı halka + koyu dış kontur + üstte cam parlaması
    ctx.save();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.0; ctx.beginPath(); ctx.arc(bx, by, br + 0.45, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(bx, by, br - 1.1, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function phone(ctx, x, y, w, h, px, ekran) {
    const SCR = ekran || SCREEN;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 2.5 * (px || 10); ctx.shadowOffsetY = 0.8 * (px || 10);
    ctx.fillStyle = '#1C1C1C'; rr(ctx, x, y, w, h, 4.2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#4A4A4A'; ctx.lineWidth = 0.35; rr(ctx, x, y, w, h, 4.2); ctx.stroke();
    const s = 1.3, X = x + s, Yy = y + s, SW = w - 2 * s, SH = h - 2 * s;
    ctx.fillStyle = '#101010'; rr(ctx, X, Yy, SW, SH, 3.1); ctx.fill();
    ctx.save(); rr(ctx, X, Yy, SW, SH, 3.1); ctx.clip();
    if (SCR) {
      // Üstte iPhone durum çubuğu (sayfa zemini rengi), sayfa onun altından başlar: ekran görüntüsü ekranın en
      // üstünden başlayınca profil fotoğrafının üstü çentiğin altında kalıyordu. Genişliğe oturur, alt fazlalık kırpılır.
      const SB = 3.5;
      ctx.fillStyle = EKRAN_ZEMIN; ctx.fillRect(X, Yy, SW, SB + 0.2);
      const ih = SW * SCR.naturalHeight / SCR.naturalWidth;
      ctx.drawImage(SCR, X, Yy + SB, SW, ih);
      ctx.fillStyle = C.K; rr(ctx, x + w / 2 - 4, Yy + 1.1, 8, 1.7, 0.85); ctx.fill();          // çentik
      durumCubugu(ctx, X, Yy + 1.95, SW, x + w / 2 - 4, x + w / 2 + 4);
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; rr(ctx, x + w / 2 - 3.6, Yy + SH - 0.95, 7.2, 0.42, 0.21); ctx.fill();   // ana çubuk
      ctx.restore();
      return;
    }
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
  // 3 adımlı kurulum çizimleri (~16 × 12,5 mm kutucuk içinde, çizgisel)
  function adimCizim(ctx, i, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#1A1A1A'; rr(ctx, x, y, w, h, 1.4); ctx.fill();
    ctx.strokeStyle = C.A; ctx.lineWidth = 0.25; rr(ctx, x, y, w, h, 1.4); ctx.stroke();
    rr(ctx, x, y, w, h, 1.4); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Ön camın sol alt köşesi, ön yüzdeki araçla aynı bakış (dışarıdan): A-sütunu yukarı doğru içe eğik,
    // cam alanı zeminden biraz açık. Sütun numara dairesinin sağından geçer, ona değmez.
    // Yalnız örnek konum: kutuda yer belirtilmez, etiket dilenen yere yapıştırılır.
    const yb = y + h - 2.6;                   // cam alt kenarı
    const kenar = () => {
      ctx.moveTo(x + 6.2, y - 0.5); ctx.lineTo(x + 2.9, yb - 0.5);
      ctx.quadraticCurveTo(x + 2.7, yb + 0.05, x + 3.6, yb);
      ctx.quadraticCurveTo(x + w / 2 + 3, yb + 0.35, x + w + 1, yb + 0.3);
    };
    const cam = () => {
      ctx.beginPath(); kenar(); ctx.lineTo(x + w + 1, y - 0.5); ctx.closePath();
      const gc = ctx.createLinearGradient(x + 2, y, x + w, y + h);
      gc.addColorStop(0, 'rgba(244,244,242,0.10)'); gc.addColorStop(1, 'rgba(244,244,242,0.03)');
      ctx.fillStyle = gc; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.35;
      ctx.beginPath(); kenar(); ctx.stroke();
    };
    // küçük sticker: koyu zeminde seçilsin diye beyaz kenar payıyla
    const miniSticker = (kx, ky, kw) => {
      ctx.fillStyle = C.W; rr(ctx, kx - 0.15, ky - 0.15, kw + 0.3, kw * 1.6 + 0.3, kw * 112 / 764 + 0.15); ctx.fill();
      sticker(ctx, kx, ky, kw, { yazisiz: true });
    };
    if (i === 0) {                            // Temizle: camı sil
      cam();
      const mx = x + 9.8, my = y + 5.0;
      ctx.save(); ctx.translate(mx, my); ctx.rotate(-0.35);
      ctx.fillStyle = C.KB; rr(ctx, -2.6, -1.8, 5.2, 3.6, 0.6); ctx.fill();
      ctx.strokeStyle = '#9A9A9A'; ctx.lineWidth = 0.2;
      ctx.beginPath(); ctx.moveTo(-1.8, -0.6); ctx.lineTo(1.8, -0.6); ctx.moveTo(-1.8, 0.6); ctx.lineTo(1.2, 0.6); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.35;
      ctx.beginPath(); ctx.arc(mx, my, 4.2, Math.PI * 0.62, Math.PI * 0.95); ctx.stroke();
      ctx.beginPath(); ctx.arc(mx, my, 5.2, Math.PI * 0.70, Math.PI * 0.90); ctx.stroke();
      [[x + 13.2, y + 2.2], [x + 12.4, y + 8.3]].forEach(([sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(sx - 0.7, sy); ctx.lineTo(sx + 0.7, sy); ctx.moveTo(sx, sy - 0.7); ctx.lineTo(sx, sy + 0.7); ctx.stroke();
      });
    } else if (i === 1) {                     // Yapıştır: örnek olarak camın köşesine (ön yüzdeki konumu)
      cam();
      const kw = 3.9;
      miniSticker(x + 6.0, yb - 0.9 - kw * 1.6, kw);
      ctx.save(); ctx.translate(x + 11.6, y + 8.0); ctx.rotate(-0.75);
      ctx.fillStyle = C.KB; rr(ctx, -1.15, -3.6, 2.3, 6.4, 1.15); ctx.fill();
      ctx.fillStyle = '#C9C9C9'; rr(ctx, -0.75, -3.25, 1.5, 1.5, 0.5); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.35;
      ctx.beginPath(); ctx.moveTo(x + 13.7, y + 1.8); ctx.lineTo(x + 11.0, y + 3.9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 11.0, y + 3.9); ctx.lineTo(x + 12.2, y + 3.9); ctx.moveTo(x + 11.0, y + 3.9); ctx.lineTo(x + 11.4, y + 2.8); ctx.stroke();
    } else {                                  // Aktif Et: etiketi uygulamanın içinden okut (kamerayla değil)
      const kw = 4.2, kx = x + 3.0, ky = y + 3.9;
      miniSticker(kx, ky, kw);
      ctx.fillStyle = 'rgba(253,211,9,0.28)';
      ctx.beginPath(); ctx.moveTo(x + 9.6, y + 6.2); ctx.lineTo(kx + kw + 0.2, ky - 0.1); ctx.lineTo(kx + kw + 0.2, ky + kw * 1.6 + 0.1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.K; rr(ctx, x + 9.3, y + 1.4, 4.6, 9.4, 0.9); ctx.fill();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.3; rr(ctx, x + 9.3, y + 1.4, 4.6, 9.4, 0.9); ctx.stroke();
      // uygulamanın tarama ekranı: üstte logo, ortada tarama çerçevesi, altta onay
      logoIcon(ctx, x + 10.85, y + 2.3, 1.5, C.Y);
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.22;
      const tx0 = x + 10.35, ty0 = y + 4.35, tsz = 2.5, tk = 0.7;
      [[tx0, ty0, 1, 1], [tx0 + tsz, ty0, -1, 1], [tx0, ty0 + tsz, 1, -1], [tx0 + tsz, ty0 + tsz, -1, -1]].forEach(([qx, qy, dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(qx + dx * tk, qy); ctx.lineTo(qx, qy); ctx.lineTo(qx, qy + dy * tk); ctx.stroke();
      });
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(x + 11.6, y + 8.75, 1.05, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.K; ctx.lineWidth = 0.28;
      ctx.beginPath(); ctx.moveTo(x + 11.12, y + 8.75); ctx.lineTo(x + 11.48, y + 9.15); ctx.lineTo(x + 12.12, y + 8.35); ctx.stroke();
    }
    ctx.restore();
    // adım numarası (sarı daire)
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(x + 2.1, y + 2.1, 1.65, 0, Math.PI * 2); ctx.fill();
    txt(ctx, String(i + 1), x + 2.1, y + 2.95, { size: 2.35, w: 800, color: C.K, align: 'center' });
  }

  // "Uygulamada ayrıca" ikonları (10 × 10 birim, sarı çizgisel). Yalnız uygulamada gerçekten olan özellikler
  // (kisiselqr_mobile, 6 Ekim): sağlık/acil durum bilgisi, kaza tespit tutanağı, çekici & yol yardımı (çekici,
  // lastikçi, tamirci), yakındaki otoparklar, nöbetçi eczaneler. Şarj istasyonu uygulamada yok (yalnız çeviri metni).
  function ekCizgi(ctx) {
    ctx.strokeStyle = C.Y; ctx.fillStyle = C.Y; ctx.lineWidth = 0.8;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
  }
  const EK_IKON = {
    acil(ctx) {             // kalp + nabız: acil durum ve sağlık bilgisi (kan grubu, acil durum numarası)
      ekCizgi(ctx);
      ctx.beginPath(); ctx.moveTo(5, 8.9);
      ctx.bezierCurveTo(1.0, 6.4, 0.3, 3.8, 1.4, 2.3); ctx.bezierCurveTo(2.6, 0.8, 4.4, 1.2, 5, 2.8);
      ctx.bezierCurveTo(5.6, 1.2, 7.4, 0.8, 8.6, 2.3); ctx.bezierCurveTo(9.7, 3.8, 9.0, 6.4, 5, 8.9);
      ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 0.65;
      ctx.beginPath(); ctx.moveTo(2.4, 5.1); ctx.lineTo(3.8, 5.1); ctx.lineTo(4.5, 3.7); ctx.lineTo(5.5, 6.5);
      ctx.lineTo(6.2, 5.1); ctx.lineTo(7.6, 5.1); ctx.stroke();
    },
    kaza(ctx) {             // pano + satırlar: kaza tespit tutanağı
      ekCizgi(ctx);
      rr(ctx, 1.9, 1.7, 6.2, 7.6, 0.9); ctx.stroke();
      rr(ctx, 3.6, 0.9, 2.8, 1.7, 0.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(3.4, 4.6); ctx.lineTo(6.6, 4.6); ctx.moveTo(3.4, 6.1); ctx.lineTo(6.6, 6.1);
      ctx.moveTo(3.4, 7.6); ctx.lineTo(5.3, 7.6); ctx.stroke();
    },
    cekici(ctx) {           // çekici: kabin + kasa + bom + kanca
      ekCizgi(ctx);
      ctx.beginPath(); ctx.moveTo(0.7, 7.3); ctx.lineTo(0.7, 5.1); ctx.lineTo(2.0, 3.3); ctx.lineTo(3.9, 3.3);
      ctx.lineTo(3.9, 5.5); ctx.lineTo(9.3, 5.5); ctx.lineTo(9.3, 7.3); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5.4, 5.5); ctx.lineTo(8.4, 1.3); ctx.lineTo(8.4, 3.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(7.9, 3.1, 0.5, 0, Math.PI * 0.9); ctx.stroke();
      [[2.4, 7.6], [7.5, 7.6]].forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.arc(cx, cy, 1.15, 0, Math.PI * 2); ctx.fillStyle = C.K; ctx.fill(); ctx.stroke();
      });
    },
    lastik(ctx) {           // lastik: dış/iç halka, göbek, diş izleri → lastikçi ve tamirci
      ekCizgi(ctx);
      ctx.beginPath(); ctx.arc(5, 5, 4.1, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, 5, 2.1, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, 5, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 0.6;
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4 + Math.PI / 8;
        ctx.beginPath(); ctx.moveTo(5 + 2.75 * Math.cos(a), 5 + 2.75 * Math.sin(a));
        ctx.lineTo(5 + 3.5 * Math.cos(a), 5 + 3.5 * Math.sin(a)); ctx.stroke();
      }
    },
    otopark(ctx) {          // otopark levhası: "P"
      ekCizgi(ctx);
      rr(ctx, 1.0, 1.0, 8.0, 8.0, 1.6); ctx.stroke();
      txt(ctx, 'P', 5, 7.4, { size: 6.6, w: 800, color: C.Y, align: 'center' });
    },
    eczane(ctx) {           // eczane işareti: "E"
      ekCizgi(ctx);
      rr(ctx, 1.0, 1.0, 8.0, 8.0, 1.6); ctx.stroke();
      txt(ctx, 'E', 5, 7.4, { size: 6.6, w: 800, color: C.Y, align: 'center' });
    },
  };
  // 3 sütuna sığsın diye kısa adlar (9 Ekim)
  const EK_OZELLIK = [['acil', 'Acil durum bilgisi'], ['kaza', 'Kaza tutanağı'],
                      ['cekici', 'Çekici, yol yardımı'], ['lastik', 'Lastikçi, tamirci'],
                      ['otopark', 'Yakındaki otoparklar'], ['eczane', 'Nöbetçi eczaneler']];

  function back(ctx, w, h, px) {
    const L = SAFE, R = w - SAFE;
    // Uygulama QR (sağ üst): beyaz zemin, 20 mm QR + 4 modül sessiz alan; altında "Uygulamayı indir"
    const Q = window.KQR_QR_APP, n = Q ? Q.rows.length : 29, qs = 20, qm = qs / n, qz = 4 * qm, box = qs + 2 * qz;
    const qx = R - box, qy = SAFE;
    ctx.fillStyle = C.W; ctx.fillRect(qx, qy, box, box);
    appQR(ctx, qx + qz, qy + qz, qs);
    txt(ctx, 'Uygulamayı indir', qx + box / 2, qy + box + 3.9, { size: 7.5 * PT, w: 700, color: C.W, align: 'center' });
    txt(ctx, 'mobile.kisiselqr.com', qx + box / 2, qy + box + 7.1, { size: 7 * PT, w: 600, color: C.Y, align: 'center' });
    // Sistem gereksinimi (kategori normu): App Store sayfası iOS 15.0+, Android minSdk 24 (Android 7.0), 9 Ekim
    txt(ctx, 'iOS 15+ · Android 7+', qx + box / 2, qy + box + 10.2, { size: 7 * PT, w: 500, color: C.KB, align: 'center' });

    // Üst-sol: başlık + açıklama (QR'ın solunda). Yapıştırma yeri belirtilmez: etiket dilenen yere yapıştırılır.
    txt(ctx, 'Nasıl çalışır?', L, 9.6, { size: 12 * PT, w: 800, color: C.Y });
    // 9 Ekim: açıklama kısaldı, altına koddan doğrulanmış 3 güven satırı geldi (rakip/psikoloji analizi)
    const desc = "Kişisel QR'ı aracına yapıştır. Sana ulaşmak isteyen QR'ı okutur; seçtiği uyarı telefonuna bildirim " +
                 'olarak gelir, numaran görünmez. Aynı profil, aracın olmasa da dijital kartvizitin olur.';
    const ds = 7.5 * PT;
    const dl = wrap(ctx, desc, qx - 3 - L, ds, 500);
    dl.forEach((ln, i) => txt(ctx, ln, L, 14.8 + i * 3.45, { size: ds, w: 500, color: C.W }));
    const guven = ['Okutanın uygulama indirmesi gerekmez.', 'Bildirimleri istediğin an kapatabilirsin.',
                   'Bilgilerin değişse de etiket aynı kalır.'];
    const gy0 = 14.8 + (dl.length - 1) * 3.45 + 4.2;
    guven.forEach((g, i) => {
      const y = gy0 + i * 3.15;
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(L + 1.15, y - 0.85, 1.15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.K; ctx.lineWidth = 0.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(L + 0.6, y - 0.85); ctx.lineTo(L + 1.02, y - 0.4); ctx.lineTo(L + 1.72, y - 1.32); ctx.stroke();
      txt(ctx, g, L + 3.3, y, { size: 7 * PT, w: 600, color: C.KB });
    });
    const ustAlt = Math.max(gy0 + (guven.length - 1) * 3.15 + 1, qy + box + 9.6);

    // Alt sıra ölçüleri önce hesaplanır: rozet yığını (eşit genişlik) ve onun üstündeki aktivasyon kutusu,
    // orta bloğun alt sınırını belirler.
    const bY = h - BACK_BAND, rh = 10, rw = ROZET_GEN(rh), gh = rw * GOOGLE_KIRP[3] / GOOGLE_KIRP[2];
    const rx = R - rw, ry0 = bY - 3 - (rh + Math.max(rh, gh) / 4 + gh);   // Google'ın altında ≥ ¼ boşluk (3 mm)
    const kb = ry0 - rh / 4 - 0.3, pad = 1.4;                                // 0,3: kontur rozet boşluğuna taşmasın
    const hs = 8.5 * PT, hY = ustAlt + 4.6;
    // Orta-sol: örnek sticker (ürünün birebir kopyası, 5:8, gölgeli; QR demo profile gider) ve üstünde
    // "ÖRNEK · Okut, dene" etiketi (9 Ekim: lider rakipte "Kodu Okut Dene" var; psikoloji: deneme kancası).
    // Etiket QR'ın üstüne binmez (binerse okunmaz). Boy, sağdaki blokla aynı yüksekliğe sığacak kadar.
    // Sol sütunun üstü güven satırlarının hemen altı (sağ sütundaki QR yazılarından bağımsız)
    const etH = 3.0, etAra = 0.9, ustS = gy0 + (guven.length - 1) * 3.15 + 1.8;
    const sw = Math.min(21.5, (kb - ustS - etH - etAra) / 1.6), sx = L + 0.75, fx = L + 0.75 + sw + 4, fw = R - fx;
    const kx = fx, kw = R - fx;
    const kts = 7 * PT, ktx = kx + pad + 5.2, ktW = kx + kw - pad - ktx;
    // "Etiketini": kutudaki örnek kamerayla okutulur, kendi etiketin uygulamadan (talimatlar çelişmesin)
    const govde = wrap(ctx, 'Etiketini kamerayla değil, uygulamadan okut.', ktW, kts, 500);
    const kh = pad + 2.6 + govde.length * 2.95 + 0.9 + pad * 0.6, ky = kb - kh;

    const blokH = etH + etAra + sw * 1.6, by0 = (ustS + kb - blokH) / 2;
    // etiket sticker'ın sol kenarına yaslı; en çok 4 mm'lik ara boşluğun 2,8 mm'sine taşabilir; yazı ≥ 6 pt
    const et = 'ÖRNEK · Okut, dene', etMax = sw + 2.8 - 2.4;
    let etS = 6.8 * PT; while (etS > 6 * PT && tw(ctx, et, etS, 800) > etMax) etS -= 0.02;
    etS = Math.max(etS, 6 * PT);
    const etW = tw(ctx, et, etS, 800) + 2.4;
    ctx.fillStyle = C.Y; rr(ctx, sx, by0, etW, etH, 1.2); ctx.fill();
    txt(ctx, et, sx + etW / 2, by0 + etH / 2 + 0.36 * etS, { size: etS, w: 800, color: C.K100, align: 'center' });
    sticker(ctx, sx, by0 + etH + etAra, sw, { shadow: 2.2 * (px || 10), edge: 14 });

    // Orta-sağ: "Uygulamada ayrıca" + 6 ikonlu özellik, 3 sütun × 2 satır (9 Ekim: güven satırlarına yer açmak için)
    const ei = 5.0, eg = 1.0, es = 7 * PT, ecA = 1.4, ecW = (fw - 2 * ecA) / 3;
    const satY0 = hY + 2.3, satH = Math.min(8.6, (ky - 2.0 - satY0) / 2);
    txt(ctx, 'Uygulamada ayrıca', fx, hY, { size: hs, w: 800, color: C.Y });
    EK_OZELLIK.forEach(([ik, ad], i) => {
      const ix = fx + (i % 3) * (ecW + ecA), iy = satY0 + Math.floor(i / 3) * satH, c = iy + ei / 2;
      ctx.save(); ctx.translate(ix, iy); ctx.scale(ei / 10, ei / 10); EK_IKON[ik](ctx); ctx.restore();
      const sat = wrap(ctx, ad, ecW - ei - eg, es, 500);
      const y0 = sat.length > 1 ? c - 0.475 - (sat.length - 2) * 2.75 / 2 : c + 0.9;
      sat.forEach((ln, k) => txt(ctx, ln, ix + ei + eg, y0 + k * 2.75, { size: es, w: 500, color: C.W }));
    });

    // Alt sıra: 3 adımlı kurulum (çizimli) | App Store + Google Play rozetleri (alt alta, eşit genişlik)
    magazaRozetleri(ctx, rx, ry0, rh);

    // Aktivasyon uyarısı: etiket, telefon kamerasıyla değil uygulamanın içinden okutulur
    // (özelliklerin altında; alt kenarı App Store rozetinin ¼ boşluğuna kadar)
    {
      ctx.fillStyle = '#161616'; rr(ctx, kx, ky, kw, kh, 1.6); ctx.fill();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.3; rr(ctx, kx, ky, kw, kh, 1.6); ctx.stroke();
      // mini telefon: uygulamanın tarama ekranı
      const tfx = kx + pad, tfy = ky + (kh - 6.6) / 2;
      ctx.fillStyle = C.K; rr(ctx, tfx, tfy, 3.7, 6.6, 0.7); ctx.fill();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.25; rr(ctx, tfx, tfy, 3.7, 6.6, 0.7); ctx.stroke();
      logoIcon(ctx, tfx + 1.25, tfy + 0.75, 1.2, C.Y);
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.2; ctx.lineCap = 'round';
      const fx0 = tfx + 0.75, fy1 = tfy + 2.55, fs0 = 2.2, kl = 0.6;
      [[fx0, fy1, 1, 1], [fx0 + fs0, fy1, -1, 1], [fx0, fy1 + fs0, 1, -1], [fx0 + fs0, fy1 + fs0, -1, -1]].forEach(([x, y, dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(x + dx * kl, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * kl); ctx.stroke();
      });
      txt(ctx, 'Aktivasyon için önce uygulamayı indir', ktx, ky + pad + 2.0, { size: kts, w: 700, color: C.Y });
      govde.forEach((ln, i) => txt(ctx, ln, ktx, ky + pad + 2.0 + 2.95 * (i + 1), { size: kts, w: 500, color: C.W }));
    }
    // sX1: büyük rozetin ¼ yükseklik boşluğu, kutucuk konturu (0,25 mm) taşsa da korunur
    const sX0 = L + 0.15, sX1 = rx - Math.max(rh, gh) / 4 - 0.3, sGap = 1.6, sW = (sX1 - sX0 - 2 * sGap) / 3, sH = 12.5;
    const sY = ry0 + 0.2;
    // alt yazılar kutucuk genişliğini aşmasın: 3. adımın taşan kelimesi rozetin ¼ boşluğuna girer ("Uygulamadan" girdi)
    const adimlar = [['Temizle', 'Camı sil'], ['Yapıştır', 'Dilediğin yere'], ['Aktif Et', 'Uygulamada okut']];
    adimlar.forEach(([t, alt], i) => {
      const x = sX0 + i * (sW + sGap);
      adimCizim(ctx, i, x, sY, sW, sH);
      txt(ctx, t, x + sW / 2, sY + sH + 3.3, { size: 7 * PT, w: 700, color: C.W, align: 'center' });
      wrap(ctx, alt, sW, 7 * PT, 500).forEach((ln, k) =>
        txt(ctx, ln, x + sW / 2, sY + sH + 6.2 + k * 2.9, { size: 7 * PT, w: 500, color: C.KB, align: 'center' }));
    });

    // Alt yasal bant (sarı zemin, K100): kutu içeriği, üretici, destek, KVKK, menşe | EAN-13 (bigiden 10 mm, kural ≥ 8)
    // En altta tam genişlikte Apple marka atıf satırı: App Store rozeti kullanıldığı için Apple'ın kılavuzu ister
    // (çevirisi serbest). Google Play rozet kılavuzunda böyle bir şart yok.
    // 9 Ekim eklemeleri: etiket ölçüsü, dayanım (Candemsoft test raporu gelene kadar yer tutucu; sitede
    // "su geçirmez & UV dayanımlı" yazıyor ama kanıt gerekli), "acil durum hizmeti değildir", sahte QR uyarısı.
    // Sol sütun genişliği EAN'a kadar (≈ 51,7 mm); sığmayan satır 6 pt'ye iner (şartname: yasal ≥ 6 pt).
    const ls = 6.5 * PT, lc = C.K100;
    const eanW = 29.8, eanH = 20.7, ex = w - 8 - eanW, ey = h - 10 - eanH, solW = ex - L - 3;
    let ly = bY + 3.6;
    [[['Kutu içeriği: ', 700], ['1 QR Etiket (5 × 8 cm)', 400]],
     [['[Su/UV dayanımı – test raporu bekleniyor]', 400]],
     [['Üretici: Candemsoft', 700]],
     [['[Adres – Candemsoft onayı bekleniyor]', 400]],
     [['Destek: ', 700], ['kisiselqr.com (WhatsApp)', 400]],
     [['KVKK Aydınlatma Metni: ', 700], ['kisiselqr.com/kvkk', 400]],
     [['Acil durum hizmeti değildir; tehlikede 112.', 600]],
     [['Ödeme ya da şifre istemez; adres kisiselqr.com', 400]],
     [["Türkiye'de üretilmiştir.", 600]]].forEach(parcalar => {
      const boy = parcalar.reduce((t, [s2, wt]) => t + tw(ctx, s2, ls, wt), 0) <= solW ? ls : 6 * PT;
      let x = L;
      parcalar.forEach(([s2, wt]) => { x += txt(ctx, s2, x, ly, { size: boy, w: wt, color: lc }); });
      ly += 2.45;
    });
    // geri dönüşüm + PAP 21 + SKU
    const pry = bY + 27.0;
    ctx.save(); ctx.translate(L + 2.1, pry - 0.9);
    ctx.strokeStyle = lc; ctx.fillStyle = lc; ctx.lineWidth = 0.32;
    for (let k = 0; k < 3; k++) {
      ctx.save(); ctx.rotate(k * 2 * Math.PI / 3);
      ctx.beginPath(); ctx.arc(0, 0, 1.75, -Math.PI * 0.95, -Math.PI * 0.45); ctx.stroke();
      const a = -Math.PI * 0.45, ax = 1.75 * Math.cos(a), ay = 1.75 * Math.sin(a);
      ctx.beginPath(); ctx.moveTo(ax + 0.55, ay + 0.05); ctx.lineTo(ax - 0.25, ay - 0.5); ctx.lineTo(ax - 0.3, ay + 0.45); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    txt(ctx, 'PAP 21', L + 5.0, pry, { size: ls, w: 700, color: lc });
    txt(ctx, 'SKU: [bekleniyor]', L + 14.2, pry, { size: ls, w: 400, color: lc });
    // Apple atıf satırı (yasal bilgi: şartname min. 6 pt; tam genişlik, alttan yukarı; son satır alt kenardan ≥ 4 mm)
    const as = 6 * PT;
    const apple = wrap(ctx, "Apple ve Apple logosu, Apple Inc.'in ABD'de ve diğer ülkelerde tescilli ticari markalarıdır. " +
                            "App Store, Apple Inc.'in hizmet markasıdır.", w - 2 * L, as, 400);
    apple.forEach((ln, i) => txt(ctx, ln, L, h - SAFE - 0.5 - (apple.length - 1 - i) * 2.4, { size: as, w: 400, color: lc }));
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
  // Dikey (alttan yukarı okunan) logo: ikon + "Kişisel QR" kelime işareti, merkez (0, 0)
  function dikeyLogo(ctx, lh, renk) { const lw = logoWidth(ctx, lh); logo(ctx, -lw / 2, -lh / 2, lh, renk); return lw; }
  // İki yan aynı düzende: logo (9,5 mm, sarı) + kisiselqr.com (4,4 mm, 800, beyaz) + "Akıllı Araç Etiketi"; sağda lot kutusu
  function yanKimlik(ctx, w, h) {
    vertical(ctx, w, h, h * 0.22, () => dikeyLogo(ctx, 9.5, C.Y));
    vertical(ctx, w, h, h * 0.56, () => {
      txt(ctx, 'kisiselqr.com', 0, -0.7, { size: 4.4, w: 800, color: C.W, align: 'center' });
      txt(ctx, 'Akıllı Araç Etiketi', 0, 3.3, { size: 7 * PT, w: 500, color: C.Y, align: 'center' });
    });
  }
  function sideLeft(ctx, w, h) { yanKimlik(ctx, w, h); }
  function sideRight(ctx, w, h) {
    yanKimlik(ctx, w, h);
    // lot / tarih kutucuğu: beyaz, laksız, SELEFONSUZ (inkjet)
    ctx.fillStyle = C.W; ctx.fillRect((w - 10) / 2, h - 8 - 15, 10, 15);
  }

  // ------------------------------------------------------------ EURO BAŞLIK
  function header(ctx, w, h, holeBottom) {
    const lh = 6, lw = logoWidth(ctx, lh);
    logo(ctx, (w - lw) / 2, holeBottom + 3.5, lh, C.K);
  }

  // ------------------------------------------------------------ İÇ BASKI (opsiyonel; maliyete göre karar verilecek)
  // Kutu yalnız alttan açılır (üst kısım kalıcı yapıştırılır, ölçü raporu). Müşterinin açınca gördüğü iç yüzey
  // alt kapak (Arka'ya bağlı) ile geçme dilinin iç yüzü: kapak açılıp aşağı sarkarken menteşe üstte, okunur yönde.
  // Gövde panellerinin içi 18 mm derin kutuda görünmez, tutkal alanlarına da baskı girmez: yalnız bu iki yüz basılır.
  // İç yüz kartonun arka yüzüdür, açınım yatayda aynalanır (kartona arkadan bakış). Tek renk K100: GC1'in krem
  // arka yüzüne düz siyah; zemin, taşma ve lak yok. Dairelerdeki rakamlar baskısız (kâğıt rengi).
  const IC_KARTON = '#EFEADF';   // GC1 arka yüzü: yalnız önizleme rengi, basılmaz
  function icKapak(ctx, w, h) {
    const k = C.K100, L = 4;
    logoIcon(ctx, L, 2.6, 5.4, k);
    txt(ctx, 'Önce beni oku', L + 7.0, 7.2, { size: 11 * PT, w: 800, color: k });
    txt(ctx, 'Kurulum 3 adım', w - L, 7.2, { size: 7 * PT, w: 600, color: k, align: 'right' });
    // adımlar: dolu daire + rakam (kâğıt), kısa metin; aralarda ok; iki uca yaslı, eşit aralıklı
    const adim = ['Camı temizle', 'Etiketi yapıştır', 'Uygulamadan aktif et'];
    const as = 7.5 * PT, r = 1.55, ara = 1.1, yb = 14.4;
    const gen = adim.map(s => 2 * r + ara + tw(ctx, s, as, 700));
    const bos = (w - 2 * L - gen.reduce((a, b) => a + b, 0)) / (adim.length - 1);
    let x = L;
    adim.forEach((s, i) => {
      ctx.fillStyle = k; ctx.beginPath(); ctx.arc(x + r, yb - 0.92, r, 0, Math.PI * 2); ctx.fill();
      txt(ctx, String(i + 1), x + r, yb - 0.1, { size: 2.3, w: 800, color: IC_KARTON, align: 'center' });
      txt(ctx, s, x + 2 * r + ara, yb, { size: as, w: 700, color: k });
      x += gen[i] + bos;
      if (i < adim.length - 1) {              // ok
        const ox = x - bos / 2, oy = yb - 0.92;
        ctx.strokeStyle = k; ctx.lineWidth = 0.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(ox - 1.1, oy); ctx.lineTo(ox + 1.1, oy);
        ctx.moveTo(ox + 0.4, oy - 0.7); ctx.lineTo(ox + 1.1, oy); ctx.lineTo(ox + 0.4, oy + 0.7); ctx.stroke();
      }
    });
  }
  function icDil(ctx, w, h) {
    // dilin iki ucunda 5 mm kilit kesiği ve R3 köşe: metin ortada, uçlardan ≥ 9 mm içeride
    // 9 Ekim: "test et" adımı eklendi. Rakiplerde en sık şikâyet "bildirim gelmiyor"; sorun ilk gün yakalanır.
    const k = C.K100, ms = 6.5 * PT;
    // buton adı bölünmesin: “QR Kodunu Tanımla” içinde bölünmez boşluk
    const satir = wrap(ctx, 'Etiketi telefonun kamerasıyla değil, Kişisel QR uygulamasında “QR\u00A0Kodunu\u00A0Tanımla” ile okut.',
                       w - 18, ms, 500)
      .concat(wrap(ctx, 'Yapıştırınca başka bir telefonla okut, bildirimin geldiğini gör.', w - 18, ms, 600));
    let y = 4.4;
    satir.forEach(ln => { txt(ctx, ln, w / 2, y, { size: ms, w: 500, color: k, align: 'center' }); y += 2.55; });
    txt(ctx, 'Yardım: kisiselqr.com', w / 2, y + 0.3, { size: ms, w: 700, color: k, align: 'center' });
  }
  function renderIc(ctx, GEO) {
    const { P } = geom(GEO), W = GEO.W;
    ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1);          // kartonun arka yüzü: aynalı, baskısız
    GEO.panels.forEach(p => { ctx.fillStyle = IC_KARTON; panelPath(ctx, p); ctx.fill('evenodd'); });
    ctx.restore();
    const ayna = q => [W - q.x1, q.y0, q.x1 - q.x0, q.y1 - q.y0];    // aynalı konum, içerik okunur yönde
    inPanel(ctx, ...ayna(P.AltKapak), 0, (w, h) => icKapak(ctx, w, h));
    inPanel(ctx, ...ayna(P.Dil), 0, (w, h) => icDil(ctx, w, h));
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
    // Baskı dosyasında (opts.baski) delik içi de boyalı kalır: bıçak keser, kayma olursa beyaz kenar görünmez.
    if (!(opts && opts.baski)) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      [P.Arka.p.holes[0], P.Baslik2.p.holes[0]].forEach(hh => { ctx.beginPath(); trace(ctx, hh); ctx.fill(); });
    }
    ctx.restore();
  }

  // 2D önizleme: bıçak (düz) + bigi (kesikli) üst katmanı
  function drawDieline(ctx, GEO) {
    ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    const tr = a => a * Math.PI / 180;
    GEO.texture.forEach(it => {
      if (it.t !== 'p' || !it.s) return;
      // kutu_acinim.py kesimi #191919 (K %90, yuvarlama) ve bigiyi #737373 olarak yazar
      const cut = it.s === '#191919' || it.s === '#1A1A1A', crease = it.s === '#737373';
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
    if (!document.fonts || !document.fonts.load) return Promise.all([loadScreen(), loadRozetler()]);
    const sample = 'KİŞİSEL QR ARAÇ SAHİBİNE ULAŞMAK İÇİN ğüşıöç ₺';
    const fonts = [400, 500, 600, 700, 800, 900].map(w => document.fonts.load(`${w} 12px Inter`, sample));
    fonts.push(document.fonts.load('800 12px Montserrat', sample));
    return Promise.all(fonts.concat([loadScreen(), loadRozetler()])).catch(() => {});
  }

  // Ortak araçlar: Tasarım 2–4 modülleri de aynı ürün gerçeklerini (sticker, QR, logo, ekran görüntüsü) kullanır.
  const lib = { geom, trace, panelPath, rectPts, rr, font, tw, txt, wrap, inPanel, logo, logoIcon, logoWidth,
                ICONS, drawQR, appQR, sticker, phone, drawDieline, magazaRozetleri, PT, SAFE, BLEED, FONT, STK_FONT, colors: C };
  window.KQRTasarim1 = { render, renderIc, drawDieline, ready, sticker, colors: C, lib };
})();
