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

  // Telefon ekranı: demo profilin gerçek mobil ekran görüntüsü (kisiselqr.com/qr/071qydlb)
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');
  let SCREEN = null;
  function loadScreen() {
    return new Promise(res => {
      const im = new Image();
      im.onload = () => { SCREEN = im; res(); };
      im.onerror = () => res();
      im.src = BASE + 'demo_profil_ekran.jpg';
    });
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
  // App Store önde, alt alta (dikey) ya da yan yana; h = rozet yüksekliği (mm). Döndürür: kapladığı {w, h}
  function magazaRozetleri(ctx, x, y, h, yon) {
    const aw = h * 151.29018 / 40, gw = h * GOOGLE_KIRP[2] / GOOGLE_KIRP[3], ara = h / 4;
    if (ROZET.apple) ctx.drawImage(ROZET.apple, x, y, aw, h);
    const gx = yon === 'yan' ? x + aw + ara : x, gy = yon === 'yan' ? y : y + h + ara;
    if (ROZET.google) ctx.drawImage(ROZET.google, GOOGLE_KIRP[0], GOOGLE_KIRP[1], GOOGLE_KIRP[2], GOOGLE_KIRP[3], gx, gy, gw, h);
    return yon === 'yan' ? { w: aw + ara + gw, h } : { w: Math.max(aw, gw), h: 2 * h + ara };
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
  const BACK_BAND = 30.5;   // arka yüz alt yasal bant yüksekliği (sarı)
  const FRONT_BAND = 24;    // ön yüz alt sarı bant: ikon satırı (14 mm) + mühür bandı (10 mm)

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

    const bandY = h - FRONT_BAND;              // sarı bandın üst kenarı
    const slogY = bandY - 14;                  // slogan bloğunun üstü
    const dy = 3;                              // araç + rozet, eski yerine göre 3 mm aşağıda
    // Görsel alan: aracın önden görünümü + cama yapışık sticker
    const vTop = 39, vBot = slogY - 1;
    ctx.save();
    ctx.beginPath(); ctx.rect(-BLEED, vTop, w + 2 * BLEED, vBot - vTop); ctx.clip();
    ctx.translate(0, dy);
    (window.KQR_CAM_OVERRIDE || windshield)(ctx, { w, vTop: vTop - dy, vBot: vBot - dy, px, BLEED, SAFE, C, PT, rr, txt, sticker });
    ctx.restore();

    // Telefon mockup (~28 × 56 mm), sağa yakın; ekran lokal UV lak
    phone(ctx, w - SAFE - 2 - 28, 39.5, 28, 56, px);

    // Rozet: sarı zemin, siyah yazı, eğik etiket (lak almaz)
    ctx.save();
    ctx.translate(22.2, 84.4 + dy); ctx.rotate(-6 * Math.PI / 180);
    ctx.fillStyle = C.Y; rr(ctx, -17, -4.75, 34, 9.5, 2.2); ctx.fill();
    txt(ctx, 'Artık numaratöre', 0, -0.55, { size: 8.3 * PT, w: 800, color: C.K100, align: 'center' });
    txt(ctx, 'gerek yok', 0, 2.75, { size: 8.3 * PT, w: 800, color: C.K100, align: 'center' });
    ctx.restore();

    // Slogan: "Herkese numaranı vermek zorunda değilsin." (iki satır, "numaranı" sarı)
    const sg = 12 * PT;
    const sa = txt(ctx, 'Herkese ', L, slogY + 0.73 * sg + 0.6, { size: sg, w: 800, color: C.W });
    txt(ctx, 'numaranı', L + sa, slogY + 0.73 * sg + 0.6, { size: sg, w: 800, color: C.Y });
    txt(ctx, 'vermek zorunda değilsin.', L, slogY + 0.73 * sg + 0.6 + sg * 1.18, { size: sg, w: 800, color: C.W });

    // İkon şeridi (sarı bant): 4 küçük çizgisel ikon (7,2 mm) + yanında 7 pt iki satırlık etiket
    const items = [['gizli', 'Numaran', 'gizli'], ['bildirim', 'Anında', 'bildirim'],
                   ['kartvizit', 'Dijital', 'kartvizit'], ['ucretsiz', 'Aylık', 'ücret yok']];
    // gruplar eşit aralıkla dağıtılır: ilk grup L'de (logo/slogan hizası), son grup w − L'de biter
    const ic = 7.2, ls = 7 * PT, iy = bandY + (14 - ic) / 2;
    const gruplar = items.map(it => ic + 1.3 + Math.max(tw(ctx, it[1], ls, 600), tw(ctx, it[2], ls, 600)));
    const ara = (w - 2 * L - gruplar.reduce((a, b) => a + b, 0)) / (items.length - 1);
    let gx = L;
    items.forEach((it, i) => {
      if (i) gx += gruplar[i - 1] + ara;
      ctx.save(); ctx.translate(gx, iy); ctx.scale(ic / 10, ic / 10); ICONS[it[0]](ctx); ctx.restore();
      txt(ctx, it[1], gx + ic + 1.3, iy + ic / 2 - 0.35, { size: ls, w: 600, color: C.K100 });
      txt(ctx, it[2], gx + ic + 1.3, iy + ic / 2 + 2.45, { size: ls, w: 600, color: C.K100 });
    });
    // En alt 10 mm: mühür bandı – yalnızca zemin rengi
  }

  // Ön cam illüstrasyonu: aracın önden sade çizgisel görünümü (tavan, ön cam, iç dikiz aynası,
  // yan aynalar, kaput, farlar, ızgara); sticker camın sol alt köşesinde, sarı odak köşeleriyle.
  // (3 adaylı tasarım turundan seçildi.) o: { w, vTop, vBot, px, BLEED, SAFE, C, PT, rr, txt, sticker }
  function windshield(ctx, o) {
    const C = o.C;
    const cx = 42;                       // araç eksen x
    const M = x => 2 * cx - x;           // sağa aynala

    function line(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
    function both(fn) { fn(x => x); fn(M); }

    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // ---------------------------------------------------------------- gövde
    // kabin (tavan + A sütunları)
    ctx.beginPath();
    ctx.moveTo(cx - 22.6, 44.2);
    ctx.quadraticCurveTo(cx, 41.2, cx + 22.6, 44.2);
    ctx.lineTo(cx + 30.6, 66.6);
    ctx.lineTo(cx - 30.6, 66.6);
    ctx.closePath();
    ctx.fillStyle = C.K; ctx.fill();

    // alt gövde (omuz → tampon)
    ctx.beginPath();
    ctx.moveTo(cx - 30.6, 66.4);
    ctx.quadraticCurveTo(cx - 34.2, 67.2, cx - 34.8, 70.2);
    ctx.lineTo(cx - 35.3, 80.5);
    ctx.quadraticCurveTo(cx - 35.3, 86.4, cx - 31, 86.8);
    ctx.lineTo(cx + 31, 86.8);
    ctx.quadraticCurveTo(cx + 35.3, 86.4, cx + 35.3, 80.5);
    ctx.lineTo(cx + 34.8, 70.2);
    ctx.quadraticCurveTo(cx + 34.2, 67.2, cx + 30.6, 66.4);
    ctx.closePath();
    ctx.fillStyle = C.K; ctx.fill();
    const gb = ctx.createLinearGradient(0, 66, 0, 88);
    gb.addColorStop(0, 'rgba(42,42,42,0.55)'); gb.addColorStop(1, 'rgba(42,42,42,0)');
    ctx.fillStyle = gb; ctx.fill();

    // gövde konturu
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(cx - 30.6, 66.6);
    ctx.quadraticCurveTo(cx - 34.2, 67.2, cx - 34.8, 70.2);
    ctx.lineTo(cx - 35.3, 80.5);
    ctx.quadraticCurveTo(cx - 35.3, 86.4, cx - 31, 86.8);
    ctx.lineTo(cx + 31, 86.8);
    ctx.quadraticCurveTo(cx + 35.3, 86.4, cx + 35.3, 80.5);
    ctx.lineTo(cx + 34.8, 70.2);
    ctx.quadraticCurveTo(cx + 34.2, 67.2, cx + 30.6, 66.6);
    ctx.stroke();
    // kabin konturu (tavan + A sütunu dışı)
    ctx.beginPath();
    ctx.moveTo(cx - 30.6, 66.6);
    ctx.lineTo(cx - 22.6, 44.2);
    ctx.quadraticCurveTo(cx, 41.2, cx + 22.6, 44.2);
    ctx.lineTo(cx + 30.6, 66.6);
    ctx.stroke();

    // ---------------------------------------------------------------- ön cam
    const gT = 45.4, gB = 66.2, hT = 21.0, hB = 27.8;   // üst/alt y, yarı genişlik
    const glass = () => {
      ctx.beginPath();
      ctx.moveTo(cx - hT, gT + 0.4);
      ctx.quadraticCurveTo(cx, gT - 1.6, cx + hT, gT + 0.4);
      ctx.lineTo(cx + hB, gB - 0.6);
      ctx.quadraticCurveTo(cx, gB + 1.2, cx - hB, gB - 0.6);
      ctx.closePath();
    };
    glass(); ctx.fillStyle = C.K; ctx.fill();
    const gg = ctx.createLinearGradient(cx - 30, gT, cx + 10, gB + 6);
    gg.addColorStop(0, C.A); gg.addColorStop(0.6, 'rgba(42,42,42,0.45)'); gg.addColorStop(1, 'rgba(42,42,42,0.2)');
    ctx.fillStyle = gg; ctx.fill();
    // yansıma bantları
    ctx.save(); glass(); ctx.clip();
    ctx.fillStyle = 'rgba(244,244,242,0.07)';
    ctx.beginPath(); ctx.moveTo(cx + 2, gT - 2); ctx.lineTo(cx + 9, gT - 2); ctx.lineTo(cx - 3, gB + 2); ctx.lineTo(cx - 10, gB + 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 11, gT - 2); ctx.lineTo(cx + 13, gT - 2); ctx.lineTo(cx + 1, gB + 2); ctx.lineTo(cx - 1, gB + 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    // cam konturu
    glass(); ctx.strokeStyle = C.W; ctx.lineWidth = 0.55; ctx.stroke();

    // iç dikiz aynası
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.3;
    line(cx, gT - 0.9, cx, gT + 1.2);
    ctx.fillStyle = C.A; o.rr(ctx, cx - 4.2, gT + 1.2, 8.4, 2.6, 1.2); ctx.fill(); ctx.stroke();

    // silecekler (cam alt kenarında park)
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.35;
    line(cx + 1.5, gB + 0.2, cx - 9.5, gB - 0.9);
    line(cx + 21, gB - 0.4, cx + 6.5, gB - 1.0);

    // ---------------------------------------------------------------- yan aynalar
    both(f => {
      // ayak
      ctx.beginPath();
      ctx.moveTo(f(cx - 30.4), 64.2); ctx.lineTo(f(cx - 32.6), 64.6); ctx.lineTo(f(cx - 32.6), 66.2); ctx.lineTo(f(cx - 30.9), 66.5);
      ctx.fillStyle = C.K; ctx.fill(); ctx.strokeStyle = C.KB; ctx.lineWidth = 0.35; ctx.stroke();
      // gövde
      ctx.beginPath();
      ctx.moveTo(f(cx - 32.4), 62.4);
      ctx.quadraticCurveTo(f(cx - 37.9), 62.0, f(cx - 37.8), 64.4);
      ctx.quadraticCurveTo(f(cx - 37.6), 66.9, f(cx - 33.4), 67.0);
      ctx.quadraticCurveTo(f(cx - 32.2), 67.0, f(cx - 32.2), 65.6);
      ctx.lineTo(f(cx - 32.2), 63.4);
      ctx.quadraticCurveTo(f(cx - 32.2), 62.4, f(cx - 32.4), 62.4);
      ctx.closePath();
      ctx.fillStyle = C.K; ctx.fill();
      ctx.strokeStyle = C.KB; ctx.lineWidth = 0.4; ctx.stroke();
    });

    // ---------------------------------------------------------------- kaput
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.3;
    // kaput ön kenarı
    ctx.beginPath(); ctx.moveTo(cx - 33.8, 71.2); ctx.quadraticCurveTo(cx, 73.2, cx + 33.8, 71.2); ctx.stroke();
    // kaput kıvrımları
    ctx.strokeStyle = C.A; ctx.lineWidth = 0.4;
    both(f => { ctx.beginPath(); ctx.moveTo(f(cx - 13), 67.6); ctx.quadraticCurveTo(f(cx - 11), 70, f(cx - 10), 72.4); ctx.stroke(); });

    // ---------------------------------------------------------------- farlar
    both(f => {
      ctx.beginPath();
      ctx.moveTo(f(cx - 33.9), 72.6);
      ctx.quadraticCurveTo(f(cx - 25), 73.4, f(cx - 17.5), 74.4);
      ctx.quadraticCurveTo(f(cx - 16.4), 74.6, f(cx - 17.2), 75.6);
      ctx.lineTo(f(cx - 19.5), 77.4);
      ctx.quadraticCurveTo(f(cx - 27), 77.2, f(cx - 33.2), 76.4);
      ctx.closePath();
      ctx.fillStyle = C.A; ctx.fill();
      ctx.strokeStyle = C.W; ctx.lineWidth = 0.35; ctx.stroke();
      // gündüz farı çizgisi
      ctx.strokeStyle = C.KB; ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.moveTo(f(cx - 32.4), 73.6); ctx.quadraticCurveTo(f(cx - 25), 74.3, f(cx - 19), 75.2); ctx.stroke();
      // mercek
      ctx.strokeStyle = C.KB; ctx.lineWidth = 0.25;
      ctx.beginPath(); ctx.arc(f(cx - 28.5), 75.4, 0.9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(f(cx - 25), 75.7, 0.9, 0, Math.PI * 2); ctx.stroke();
    });

    // ---------------------------------------------------------------- ızgara
    const grille = () => {
      ctx.beginPath();
      ctx.moveTo(cx - 14.8, 74.2); ctx.quadraticCurveTo(cx, 74.9, cx + 14.8, 74.2);
      ctx.lineTo(cx + 12.2, 79.6); ctx.quadraticCurveTo(cx, 80.3, cx - 12.2, 79.6);
      ctx.closePath();
    };
    grille(); ctx.fillStyle = C.K; ctx.fill();
    ctx.save(); grille(); ctx.clip();
    ctx.strokeStyle = C.A; ctx.lineWidth = 0.35;
    for (let y = 75.6; y < 80; y += 1.3) line(cx - 16, y, cx + 16, y);
    ctx.restore();
    grille(); ctx.strokeStyle = C.KB; ctx.lineWidth = 0.35; ctx.stroke();

    // tampon alt hava girişi
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(cx - 20, 82.6); ctx.lineTo(cx + 20, 82.6); ctx.lineTo(cx + 17.5, 85.4); ctx.lineTo(cx - 17.5, 85.4); ctx.closePath(); ctx.stroke();

    // ---------------------------------------------------------------- sticker (camın sol alt köşesi)
    const sw = 9.5, sh = sw * 1.6;
    const sx = cx - hB + 7.4, sy = gB - 1.9 - sh;
    // kesim kenarı: 0.2 mm beyaz pay (baskıda seçilsin)
    ctx.fillStyle = C.W; o.rr(ctx, sx - 0.2, sy - 0.2, sw + 0.4, sh + 0.4, sw * 112 / 764 + 0.2); ctx.fill();
    o.sticker(ctx, sx, sy, sw, { edge: 16 });

    // sarı odak köşe işaretleri
    const g = 0.9, L = 2.0, x0 = sx - g, y0 = sy - g, x1 = sx + sw + g, y1 = sy + sh + g;
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(x + dx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * L); ctx.stroke();
    });

    ctx.restore();
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
    if (SCREEN) {
      // genişliğe oturt, üstten hizala (alttaki fazlalık kırpılır)
      const ih = SW * SCREEN.naturalHeight / SCREEN.naturalWidth;
      ctx.drawImage(SCREEN, X, Yy, SW, ih);
      ctx.fillStyle = C.K; rr(ctx, x + w / 2 - 4, Yy + 1.1, 8, 1.7, 0.85); ctx.fill();          // çentik
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
  // 3 adımlı kurulum çizimleri (15 × 12,5 mm kutucuk içinde, çizgisel)
  function adimCizim(ctx, i, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#1A1A1A'; rr(ctx, x, y, w, h, 1.4); ctx.fill();
    ctx.strokeStyle = C.A; ctx.lineWidth = 0.25; rr(ctx, x, y, w, h, 1.4); ctx.stroke();
    rr(ctx, x, y, w, h, 1.4); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Ön camın sol alt köşesi, ön yüzdeki araçla aynı bakış (dışarıdan): A-sütunu yukarı doğru içe eğik,
    // cam alanı zeminden biraz açık. Sütun numara dairesinin sağından geçer, ona değmez.
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
    if (i === 0) {                            // Temizle: camı mendille sil
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
    } else if (i === 1) {                     // Yapıştır: sticker camın sol alt köşesine (ön yüzdeki konumu)
      cam();
      const kw = 3.9, kx = x + 6.0, ky = yb - 0.9 - kw * 1.6;
      ctx.fillStyle = C.W; rr(ctx, kx - 0.15, ky - 0.15, kw + 0.3, kw * 1.6 + 0.3, kw * 112 / 764 + 0.15); ctx.fill();
      sticker(ctx, kx, ky, kw, { yazisiz: true });
      ctx.save(); ctx.translate(x + 11.6, y + 8.0); ctx.rotate(-0.75);
      ctx.fillStyle = C.KB; rr(ctx, -1.15, -3.6, 2.3, 6.4, 1.15); ctx.fill();
      ctx.fillStyle = '#C9C9C9'; rr(ctx, -0.75, -3.25, 1.5, 1.5, 0.5); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.35;
      ctx.beginPath(); ctx.moveTo(x + 13.7, y + 1.8); ctx.lineTo(x + 11.0, y + 3.9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 11.0, y + 3.9); ctx.lineTo(x + 12.2, y + 3.9); ctx.moveTo(x + 11.0, y + 3.9); ctx.lineTo(x + 11.4, y + 2.8); ctx.stroke();
    } else {                                  // Aktif Et: aktivasyon kartını telefonla okut
      ctx.save(); ctx.translate(x + 4.6, y + 7.4); ctx.rotate(-0.12);
      ctx.fillStyle = C.W; rr(ctx, -3.6, -2.4, 7.2, 4.8, 0.5); ctx.fill();
      drawQR(ctx, window.KQR_QR_DEMO, -3.0, -1.9, 3.8, C.K100);
      ctx.fillStyle = '#7A7A7A'; ctx.fillRect(1.1, -1.4, 2.0, 0.45); ctx.fillRect(1.1, -0.5, 1.6, 0.45);
      ctx.restore();
      ctx.fillStyle = 'rgba(253,211,9,0.28)';
      ctx.beginPath(); ctx.moveTo(x + 9.6, y + 6.2); ctx.lineTo(x + 2.0, y + 4.3); ctx.lineTo(x + 2.4, y + 10.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.K; rr(ctx, x + 9.3, y + 1.4, 4.6, 9.4, 0.9); ctx.fill();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.3; rr(ctx, x + 9.3, y + 1.4, 4.6, 9.4, 0.9); ctx.stroke();
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(x + 11.6, y + 6.1, 1.35, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.K; ctx.lineWidth = 0.32;
      ctx.beginPath(); ctx.moveTo(x + 11.0, y + 6.1); ctx.lineTo(x + 11.45, y + 6.6); ctx.lineTo(x + 12.25, y + 5.6); ctx.stroke();
    }
    ctx.restore();
    // adım numarası (sarı daire)
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(x + 2.1, y + 2.1, 1.65, 0, Math.PI * 2); ctx.fill();
    txt(ctx, String(i + 1), x + 2.1, y + 2.95, { size: 2.35, w: 800, color: C.K, align: 'center' });
  }

  function back(ctx, w, h, px) {
    const L = SAFE, R = w - SAFE;
    // Uygulama QR (sağ üst): beyaz zemin, 20 mm QR + 4 modül sessiz alan; altında "Uygulamayı indir"
    const Q = window.KQR_QR_APP, n = Q ? Q.rows.length : 29, qs = 20, qm = qs / n, qz = 4 * qm, box = qs + 2 * qz;
    const qx = R - box, qy = SAFE;
    ctx.fillStyle = C.W; ctx.fillRect(qx, qy, box, box);
    appQR(ctx, qx + qz, qy + qz, qs);
    txt(ctx, 'Uygulamayı indir', qx + box / 2, qy + box + 3.9, { size: 7.5 * PT, w: 700, color: C.W, align: 'center' });
    txt(ctx, 'mobile.kisiselqr.com', qx + box / 2, qy + box + 7.1, { size: 7 * PT, w: 600, color: C.Y, align: 'center' });

    // Üst-sol: başlık + açıklama (QR'ın solunda)
    txt(ctx, 'Nasıl çalışır?', L, 9.6, { size: 12 * PT, w: 800, color: C.Y });
    const desc = "Kişisel QR'ı aracının ön camına yapıştır. Sana ulaşmak isteyen QR'ı telefonuyla okutur, " +
                 'bildirim sana gelir; numaran görünmez. Aynı profil dijital kartvizitin olur: widget ile paylaş, ' +
                 'sosyal medyada link olarak kullan.';
    const ds = 7.5 * PT;
    const dl = wrap(ctx, desc, qx - 3 - L, ds, 500);
    dl.forEach((ln, i) => txt(ctx, ln, L, 14.8 + i * 3.45, { size: ds, w: 500, color: C.W }));
    const ustAlt = Math.max(14.8 + (dl.length - 1) * 3.45 + 1, qy + box + 6.5);

    // Orta-sol: sticker (ürünün birebir kopyası, 5:8, gölgeli); içindeki QR demo profile gider
    const sw = 21.5, sx = L + 0.75, sy = ustAlt + 2.6;
    const sh = sticker(ctx, sx, sy, sw, { shadow: 2.2 * (px || 10), edge: 14 });
    txt(ctx, 'Okut: demo profil', sx + sw / 2, sy + sh + 3.3, { size: 7 * PT, w: 600, color: C.Y, align: 'center' });

    // Orta-sağ: 5 özellik, sarı tik
    const feats = ['Numaran gizli kalır, sana yine ulaşılır.', 'Mesaj ve bildirim anında telefonunda.',
                   'Dijital kartvizitini uygulamada oluştur.', 'Profilini sosyal medyada paylaş.',
                   'Aracın olmasa da kullan: kartvizit olarak yeterli.'];
    const fx = sx + sw + 4, fw = R - fx - 4.2, fs = 7 * PT;
    let fy = sy + 3.6;
    feats.forEach(f => {
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(fx + 1.5, fy - 0.85, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.K; ctx.lineWidth = 0.35; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(fx + 0.8, fy - 0.85); ctx.lineTo(fx + 1.35, fy - 0.25); ctx.lineTo(fx + 2.25, fy - 1.45); ctx.stroke();
      const lines = wrap(ctx, f, fw, fs, 500);
      lines.forEach((ln, i) => txt(ctx, ln, fx + 4.2, fy + i * 3.0, { size: fs, w: 500, color: C.W }));
      fy += lines.length > 1 ? 8.0 : 6.6;
    });

    // Alt sıra: 3 adımlı kurulum (çizimli) | App Store + Google Play rozetleri (10 mm, alt alta)
    const bY = h - BACK_BAND, rh = 10, rw = ROZET_GEN(rh);
    const rx = R - rw, ry0 = bY - 3 - (2 * rh + rh / 4);
    magazaRozetleri(ctx, rx, ry0, rh, 'alt');
    // sX1: rozetin ¼ yükseklik boşluğu, kutucuk konturu (0,25 mm) taşsa da korunur
    const sX0 = L + 0.15, sX1 = rx - rh / 4 - 0.3, sGap = 1.6, sW = (sX1 - sX0 - 2 * sGap) / 3, sH = 12.5;
    const sY = ry0 + 0.2;
    const adimlar = [['Temizle', 'Camı sil'], ['Yapıştır', 'Sol alt köşe'], ['Aktif Et', 'Kartı okut']];
    adimlar.forEach(([t, alt], i) => {
      const x = sX0 + i * (sW + sGap);
      adimCizim(ctx, i, x, sY, sW, sH);
      txt(ctx, t, x + sW / 2, sY + sH + 3.3, { size: 7 * PT, w: 700, color: C.W, align: 'center' });
      wrap(ctx, alt, sW, 7 * PT, 500).forEach((ln, k) =>
        txt(ctx, ln, x + sW / 2, sY + sH + 6.2 + k * 2.9, { size: 7 * PT, w: 500, color: C.KB, align: 'center' }));
    });

    // Alt yasal bant (sarı zemin, K100): kutu içeriği, üretici, KVKK, menşe | EAN-13 (bigiden ≥ 8 mm)
    const ls = 6.5 * PT, lc = C.K100;
    const eanW = 29.8, eanH = 20.7, ex = w - 8 - eanW, ey = h - 8 - eanH;
    const lw = ex - L - 3;
    let ly = bY + 3.9;
    [['Kutu içeriği', 700], ['1 QR Etiket · 1 Aktivasyon Kartı', 400], ['1 Temizleme Mendili', 400],
     ['Üretici: Candemsoft', 700], ['[Adres – Candemsoft onayı bekleniyor]', 400],
     ['[KVKK bilgilendirme metni – onay bekleniyor]', 400], ["Türkiye'de üretilmiştir.", 600]].forEach(([s, wt]) => {
      wrap(ctx, s, lw, ls, wt).forEach(ln => { txt(ctx, ln, L, ly, { size: ls, w: wt, color: lc }); ly += 2.7; });
    });
    // geri dönüşüm + PAP 21 + SKU
    const pry = h - SAFE - 1.7;
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
  // İki yan aynı düzende: logo (9,5 mm, sarı) + kisiselqr.com (4,4 mm, 800, beyaz) + alt satır; sağda lot kutusu
  function yanKimlik(ctx, w, h) {
    vertical(ctx, w, h, h * 0.22, () => dikeyLogo(ctx, 9.5, C.Y));
    vertical(ctx, w, h, h * 0.56, () => {
      txt(ctx, 'kisiselqr.com', 0, -0.7, { size: 4.4, w: 800, color: C.W, align: 'center' });
      txt(ctx, 'Araç + Dijital Kartvizit', 0, 3.3, { size: 7 * PT, w: 500, color: C.Y, align: 'center' });
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
  window.KQRTasarim1 = { render, drawDieline, ready, sticker, colors: C, lib };
})();
