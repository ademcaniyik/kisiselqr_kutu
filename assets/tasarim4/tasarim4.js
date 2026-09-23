/*
 * Kişisel QR – Kutu Tasarımı 4: "Tipografik Izgara"
 * İsviçre / editoryal tipografi: 12 kolonlu katı ızgara, ince kural çizgileri, numaralı küçük başlıklar.
 * Ön yüz logodaki siyah/sarı yarı bölünmeyi tam ortadan uygular; dev "QR" harfleri bölünme çizgisine
 * taşar (siyah yarıda sarı, sarı yarıda siyah). Araç ön camı piktogram/diyagram dilinde.
 *
 *   KQRTasarim4.render(ctx, GEO, opts)   ctx önceden mm → px ölçeklenmiş (1 birim = 1 mm)
 *   KQRTasarim4.ready()                  fontlar + ekran görüntüsü
 *
 * Ortak ürün gerçekleri (logo, sticker, telefon, QR matrisleri, ikonlar) tasarim1.js'teki lib'den gelir.
 */
(function () {
  const T1 = window.KQRTasarim1;
  const L = T1.lib;
  const C = L.colors;
  const { PT, SAFE, BLEED } = L;
  const INTER = 'Inter, "Helvetica Neue", Arial, sans-serif';

  // ------------------------------------------------------------ ızgara (her 96,5 mm panelde aynı)
  const M = 5;                 // dış kenar boşluğu (güvenli alan 4 mm + 1)
  const COLS = 12, GUT = 2;
  function grid(w) {
    const gw = w - 2 * M, cw = (gw - (COLS - 1) * GUT) / COLS;
    return { gw, cw, x: i => M + i * (cw + GUT), span: n => n * cw + (n - 1) * GUT, R: w - M };
  }

  // ------------------------------------------------------------ metin yardımcıları
  function F(ctx, size, w, fam) { ctx.font = `${w || 400} ${size}px ${fam || INTER}`; }
  function T(ctx, s, x, y, o) {
    o = o || {};
    F(ctx, o.size, o.w, o.fam);
    ctx.fillStyle = o.color || C.W; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
    return ctx.measureText(s).width;
  }
  function W(ctx, s, size, w, fam) { F(ctx, size, w, fam); return ctx.measureText(s).width; }
  function rule(ctx, x0, y, x1, color, lw) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw || 0.2; ctx.lineCap = 'butt'; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
  }
  function vrule(ctx, x, y0, y1, color, lw) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw || 0.2; ctx.lineCap = 'butt'; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); ctx.restore();
  }
  // ızgara kolon işaretleri: kural çizgisi üzerinde 12 kolonun başlangıçlarını gösteren kısa çentikler
  function ticks(ctx, g, y, color, len) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 0.2; ctx.beginPath();
    for (let i = 0; i <= COLS; i++) {
      const x = i === COLS ? g.R : g.x(i);
      ctx.moveTo(x, y); ctx.lineTo(x, y + len);
      if (i > 0 && i < COLS) { ctx.moveTo(x - GUT, y); ctx.lineTo(x - GUT, y + len); }
    }
    ctx.stroke(); ctx.restore();
  }

  // ------------------------------------------------------------ zeminler + taşma
  const BAND_Y = 91;        // arka yüz: beyaz bilgi bandının başladığı y (panel içi)
  function grounds(ctx, g) {
    const { P, yT, yBt, yp } = g;
    // Alt kilitli kapak + geçme dili düz sarı (brif: "düz siyah ya da sarı — ön yüzün alt bandıyla aynı"):
    // ön yüzün sarı alt yarısı kutunun tabanına devam eder. Metinsiz; Ø20 mühür alanı yalnız zemin.
    const GROUND = {
      On: C.K, Sol: C.K, Sag: C.K, Arka: C.K, Baslik2: C.Y, UstKapak: C.K,
      SolUstToz: C.K, SagUstToz: C.K, SolAltToz: C.K, SagAltToz: C.K, AltKapak: C.Y, Dil: C.Y,
    };
    const zones = [
      { pts: L.rectPts(P.Arka.x0, P.Arka.y0, P.Arka.x1, yT), c: C.Y },            // Euro başlık 1. kat
      { pts: L.rectPts(P.On.x0, yT + yp / 2, P.On.x1, yBt), c: C.Y },             // ön yüz alt yarı: sarı
      { pts: L.rectPts(P.Arka.x0, yT + BAND_Y, P.Arka.x1, yBt), c: C.W },          // arka bilgi bandı: saf beyaz (QR + EAN zemini)
    ];
    // 1) taşma: her baskılı yüzeyin konturu 2 × 3 mm kalınlıkta kendi renginde; komşu panel dolgusu
    //    içerideki yarıyı örter, yalnız kesimden dışarı taşan 3 mm kalır.
    ctx.lineJoin = 'miter'; ctx.miterLimit = 3; ctx.lineWidth = 2 * BLEED; ctx.setLineDash([]);
    Object.keys(GROUND).forEach(n => { ctx.strokeStyle = GROUND[n]; L.panelPath(ctx, P[n].p); ctx.stroke(); });
    zones.forEach(z => { ctx.strokeStyle = z.c; ctx.beginPath(); L.trace(ctx, z.pts); ctx.stroke(); });
    // 2) dolgular
    Object.keys(GROUND).forEach(n => { ctx.fillStyle = GROUND[n]; L.panelPath(ctx, P[n].p); ctx.fill('evenodd'); });
    zones.forEach(z => { ctx.fillStyle = z.c; ctx.beginPath(); L.trace(ctx, z.pts); ctx.fill(); });
    // 3) baskısız: tutkal payı + üst yapıştırma dili
    ['Tutkal', 'UstDil'].forEach(n => { ctx.fillStyle = C.RAW; L.panelPath(ctx, P[n].p); ctx.fill(); });
  }

  // ------------------------------------------------------------ ÖN YÜZ
  function front(ctx, w, h, px) {
    const g = grid(w), R = g.R, S = h / 2;           // S: siyah/sarı bölünme çizgisi (tam orta)

    // --- üst satır: sarı logo (lokal UV lak) + "by Candemsoft"
    const LH = 8, LY = 5.5;
    L.logo(ctx, M, LY, LH, C.Y);
    T(ctx, 'by Candemsoft', R, LY + LH - 0.25, { size: 7 * PT, w: 500, color: C.W, align: 'right' });
    rule(ctx, M, 16.5, R, C.KB, 0.2);
    ticks(ctx, g, 16.5, C.KB, 0.9);

    // --- ürün adı + alt satır (flush-left, ızgara kolon 1)
    const ts = 22 * PT, tb = 26.6;
    const a = T(ctx, 'KİŞİSEL ', M, tb, { size: ts, w: 900, color: C.W });
    T(ctx, 'QR', M + a, tb, { size: ts, w: 900, color: C.Y });
    T(ctx, 'Akıllı Araç Etiketi + Dijital Kartvizit', M, 32.2, { size: 8 * PT, w: 600, color: C.KB });

    // --- rozet: sarı yuvarlak etiket, siyah yazı (lak almaz)
    const rr_ = 9.1, rcx = R - rr_, rcy = 27.0;
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(rcx, rcy, rr_, 0, Math.PI * 2); ctx.fill();
    const bs = 7.2 * PT;
    T(ctx, 'Artık', rcx, rcy - 2.3, { size: bs, w: 800, color: C.K100, align: 'center' });
    T(ctx, 'numaratöre', rcx, rcy + 0.85, { size: bs, w: 800, color: C.K100, align: 'center' });
    T(ctx, 'gerek yok', rcx, rcy + 4.0, { size: bs, w: 800, color: C.K100, align: 'center' });

    rule(ctx, M, 37.6, R, C.KB, 0.2);

    // --- vaat cümlesi (brif: mesaj hiyerarşisi 2; şartname: ana vaat Inter SemiBold 10–11 pt) — sarı kısa kural ile
    //     işaretli (kural üst kenarı 1. satırın büyük harf üstüyle hizalı), kolon 2'den başlar
    const vs = 10 * PT, vb = 43.9;
    ctx.fillStyle = C.Y; ctx.fillRect(M, vb - 0.727 * vs, g.cw, 0.9);
    T(ctx, 'Numaranız görünmeden', g.x(1), vb, { size: vs, w: 600, color: C.W });
    T(ctx, 'size ulaşsınlar.', g.x(1), vb + 4.2, { size: vs, w: 600, color: C.W });

    // --- dev "QR": bölünme çizgisine taşar; siyah yarıda sarı, sarı yarıda siyah (logodaki gibi)
    giantQR(ctx, w, h, S);

    // --- telefon: ızgaranın sağ kenarına oturur, bölünme çizgisini keser (ekran lokal UV lak).
    //     Gölgesiz: lib'in yumuşak gölgesi sarı yarıda yarı saydam koyu hale bırakıyor (baskıda şeffaflık/overprint
    //     sorunu) ve sağ bigiye 2,8 mm'ye yaklaşıyordu. lib gölgeyi px ile ölçekler; ~0 px → gölge çerçevenin altında kalır.
    const phw = 23, phx = R - phw, phy = 38.9, phh = phw * 2;
    L.phone(ctx, phx, phy, phw, phh, 1e-6);

    // --- diyagram: ön cam piktogramı + sticker konumu (sol alt köşe)
    diagram(ctx, g, S);

    // --- ikon şeridi: 4 hücre × 3 kolon, numaralı küçük başlıklar, hücreler ince siyah kurallarla ayrık
    const items = [['gizli', '01', 'Numaran', 'gizli'], ['bildirim', '02', 'Anında', 'bildirim'],
                   ['kartvizit', '03', 'Dijital', 'kartvizit'], ['ucretsiz', '04', 'Aylık', 'ücret yok']];
    const iy = 109.0;
    rule(ctx, M, iy - 1.6, R, C.K100, 0.25);
    items.forEach((it, i) => {
      const cx0 = g.x(i * 3);
      if (i > 0) vrule(ctx, cx0 - GUT / 2, iy - 1.6, iy + 16.4, C.K100, 0.2);
      const x0 = cx0 + (i > 0 ? 0.4 : 0);
      ctx.save(); ctx.translate(x0, iy); L.ICONS[it[0]](ctx); ctx.restore();
      T(ctx, it[1], cx0 + g.span(3), iy + 2.2, { size: 6.5 * PT, w: 800, color: C.K100, align: 'right' });
      T(ctx, it[2], x0, iy + 13.2, { size: 7 * PT, w: 600, color: C.K100 });
      T(ctx, it[3], x0, iy + 16.0, { size: 7 * PT, w: 600, color: C.K100 });
    });
    // en alt 10 mm: mühür bandı — yalnız zemin rengi
  }

  function giantQR(ctx, w, h, S) {
    const g = grid(w);
    const maxW = g.x(8) - 2 - M;                 // telefonun soluna kadar (8 kolon)
    let fs = 46;
    F(ctx, fs, 900, INTER);
    const mq = ctx.measureText('Q'), mr = ctx.measureText('R');
    const kern = -0.035 * fs;
    // görünür genişlik: Q'nun sol kenarından R'nin sağ kenarına
    const vis = mq.actualBoundingBoxLeft + mq.width + kern + mr.actualBoundingBoxRight;
    const k = Math.min(1, maxW / vis);
    fs *= k;
    F(ctx, fs, 900, INTER);
    const q = ctx.measureText('Q');
    const cap = ctx.measureText('R').actualBoundingBoxAscent;
    const base = S + cap * 0.46;                 // bölünme çizgisi harflerin ortasından biraz yukarıda
    const x0 = M + q.actualBoundingBoxLeft;
    const xR = x0 + q.width + kern * k;
    const draw = col => {
      ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Q', x0, base); ctx.fillText('R', xR, base);
    };
    ctx.save(); ctx.beginPath(); ctx.rect(-BLEED, -BLEED, w + 2 * BLEED, S + BLEED); ctx.clip(); draw(C.Y); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(-BLEED, S, w + 2 * BLEED, h - S + BLEED); ctx.clip(); draw(C.K); ctx.restore();
    return { base, cap, fs };
  }

  // Ön cam piktogramı: aracın önden görünüşü, katı siyah silüet; cam antrasit; sticker camın sol alt
  // köşesinde; soldan oklu etiket "sol alt köşe".
  function diagram(ctx, g, S) {
    const cx = 64.2, top = 90.0;                 // araç ekseni, tavan üstü (yerel; tekerler ikon şeridi kuralına basar)
    const K = C.K, Y = C.Y;
    const ZK = 1.14, gy = top + 17.4;            // piktogram ölçeği: zemin çizgisi (ikon kuralı) sabit kalır
    const tx = (x) => cx + (x - cx) * ZK, ty = (y) => gy + (y - gy) * ZK;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.translate(cx, gy); ctx.scale(ZK, ZK); ctx.translate(-cx, -gy);

    // gövde silüeti
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(cx - 11.5, top);                                  // tavan
      ctx.quadraticCurveTo(cx, top - 0.7, cx + 11.5, top);
      ctx.quadraticCurveTo(cx + 13.2, top + 0.1, cx + 13.8, top + 1.6);
      ctx.lineTo(cx + 17.2, top + 9.4);                           // A sütunu
      ctx.quadraticCurveTo(cx + 21.8, top + 9.9, cx + 22.2, top + 12);
      ctx.lineTo(cx + 22.4, top + 14.4);
      ctx.quadraticCurveTo(cx + 22.4, top + 15.8, cx + 21, top + 15.8);
      ctx.lineTo(cx + 19.8, top + 15.8);
      ctx.lineTo(cx + 19.8, top + 17.4);                           // teker
      ctx.lineTo(cx + 15.2, top + 17.4);
      ctx.lineTo(cx + 15.2, top + 15.8);
      ctx.lineTo(cx - 15.2, top + 15.8);
      ctx.lineTo(cx - 15.2, top + 17.4);
      ctx.lineTo(cx - 19.8, top + 17.4);
      ctx.lineTo(cx - 19.8, top + 15.8);
      ctx.lineTo(cx - 21, top + 15.8);
      ctx.quadraticCurveTo(cx - 22.4, top + 15.8, cx - 22.4, top + 14.4);
      ctx.lineTo(cx - 22.2, top + 12);
      ctx.quadraticCurveTo(cx - 21.8, top + 9.9, cx - 17.2, top + 9.4);
      ctx.lineTo(cx - 13.8, top + 1.6);
      ctx.quadraticCurveTo(cx - 13.2, top + 0.1, cx - 11.5, top);
      ctx.closePath();
    };
    body(); ctx.fillStyle = K; ctx.fill();
    // yan aynalar
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx + s * 16.4, top + 7.6); ctx.lineTo(cx + s * 19.6, top + 6.9);
      ctx.quadraticCurveTo(cx + s * 20.6, top + 6.9, cx + s * 20.5, top + 8.0);
      ctx.lineTo(cx + s * 20.2, top + 9.0); ctx.lineTo(cx + s * 16.9, top + 9.2); ctx.closePath();
      ctx.fillStyle = K; ctx.fill();
    });
    // ön cam (antrasit) + sarı ayırıcı — cam yüksek tutulur ki sticker camın alt-sol köşesinde, üstünde cam kalarak dursun
    const gT = top + 0.9, gB = top + 10.4, hT = 11.0, hB = 15.6;
    const xL = y => cx - hT - (hB - hT) * (y - gT) / (gB - gT);   // camın eğik sol kenarının x'i
    const glass = () => {
      ctx.beginPath();
      ctx.moveTo(cx - hT, gT); ctx.quadraticCurveTo(cx, gT - 0.6, cx + hT, gT);
      ctx.lineTo(cx + hB, gB); ctx.quadraticCurveTo(cx, gB + 0.5, cx - hB, gB); ctx.closePath();
    };
    glass(); ctx.fillStyle = C.A; ctx.fill();
    ctx.strokeStyle = Y; ctx.lineWidth = 0.3; ctx.stroke();
    // iç dikiz aynası
    ctx.fillStyle = K; L.rr(ctx, cx - 2.3, gT + 0.3, 4.6, 1.1, 0.5); ctx.fill();
    // farlar + ızgara (sarı boşluk) — cam büyüdüğü için 1 mm aşağıda
    const fy = top + 1.0;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx + s * 20.6, fy + 11.4); ctx.lineTo(cx + s * 13.4, fy + 11.9);
      ctx.lineTo(cx + s * 14.0, fy + 13.3); ctx.lineTo(cx + s * 20.2, fy + 13.1); ctx.closePath();
      ctx.fillStyle = Y; ctx.fill();
    });
    ctx.fillStyle = Y;
    L.rr(ctx, cx - 9.5, fy + 12.0, 19, 0.45, 0.2); ctx.fill();
    L.rr(ctx, cx - 8.5, fy + 13.1, 17, 0.45, 0.2); ctx.fill();

    // sticker: camın SOL ALT köşesi. Cam yüksekliğinin ~%66'sı (sh / (gB − gT) = 6,24 / 9,5); alt kontura 0,7, eğik sol
    // kenara (üst köşede) 0,65 birim pay → cam içinde kalır (baskıda kontura ≥ 0,5 mm), üstünde ve sağında cam görünür.
    const sw = 3.9, sh = sw * 1.6;
    const sy = gB - 0.7 - sh, sx = xL(sy) + 0.65;
    ctx.fillStyle = C.W; L.rr(ctx, sx - 0.15, sy - 0.15, sw + 0.3, sh + 0.3, sw * 0.147 + 0.15); ctx.fill();
    L.sticker(ctx, sx, sy, sw, { edge: 10 });
    // sarı odak halkası
    const scx = sx + sw / 2, scy = sy + sh / 2, ringR = sh * 0.72;
    ctx.strokeStyle = Y; ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(scx, scy, ringR, 0, Math.PI * 2); ctx.stroke();

    ctx.restore();

    // oklu etiket: soldan sticker'a. Ok siyah; araç gövdesi üstünden geçtiği yerde sarı kılıfla seçilir.
    const lx = M, ay = ty(scy);
    T(ctx, 'ÖN CAMA YAPIŞTIR', lx, ay - 2.4, { size: 6.5 * PT, w: 800, color: C.K100 });
    T(ctx, 'sol alt köşe', lx, ay + 1.0, { size: 8 * PT, w: 700, color: C.K100 });
    T(ctx, 'QR etiketin yeri', lx, ay + 4.2, { size: 6.5 * PT, w: 500, color: C.K100 });
    const ax0 = lx + W(ctx, 'sol alt köşe', 8 * PT, 700) + 1.5;
    const ax1 = tx(scx) - ringR * ZK - 0.25;
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = Y; ctx.lineWidth = 0.9;                     // kılıf
    ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1 - 1.2, ay); ctx.stroke();
    ctx.fillStyle = Y; ctx.beginPath(); ctx.moveTo(ax1 + 0.35, ay); ctx.lineTo(ax1 - 1.75, ay - 1.05); ctx.lineTo(ax1 - 1.75, ay + 1.05); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.K100; ctx.lineWidth = 0.3;                // ok
    ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1 - 1.1, ay); ctx.stroke();
    ctx.fillStyle = C.K100; ctx.beginPath(); ctx.moveTo(ax1, ay); ctx.lineTo(ax1 - 1.4, ay - 0.7); ctx.lineTo(ax1 - 1.4, ay + 0.7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ------------------------------------------------------------ ARKA YÜZ
  function back(ctx, w, h, px) {
    const g = grid(w), R = g.R;
    // --- başlık + açıklama
    T(ctx, 'Nasıl çalışır?', M, 10.6, { size: 13 * PT, w: 800, color: C.Y });
    T(ctx, 'KİŞİSEL QR', R, 10.6, { size: 7 * PT, w: 800, color: C.KB, align: 'right' });
    rule(ctx, M, 13.2, R, C.KB, 0.2);
    ticks(ctx, g, 13.2, C.KB, 0.9);
    const desc = "Kişisel QR'ı aracının ön camına yapıştır. Sana ulaşmak isteyen QR'ı telefonuyla okutur, " +
                 'bildirim sana gelir; numaran görünmez. Aynı profil dijital kartvizitin olur: widget ile paylaş, ' +
                 'sosyal medyada link olarak kullan.';
    const ds = 7.5 * PT;
    const dl = L.wrap(ctx, desc, g.gw, ds, 500);
    dl.forEach((ln, i) => T(ctx, ln, M, 18.2 + i * 3.4, { size: ds, w: 500, color: C.W }));
    let y = 18.2 + (dl.length - 1) * 3.4 + 3.6;
    rule(ctx, M, y, R, C.KB, 0.2);

    // --- adımlar: büyük 1-2-3 rakamları (3 × 4 kolon)
    const steps = ['Temizle', 'Yapıştır', 'Aktif Et'];
    const nfs = 17, sy = y + 1.2;
    F(ctx, nfs, 900, INTER);
    const ncap = ctx.measureText('1').actualBoundingBoxAscent;
    steps.forEach((s, i) => {
      const x0 = g.x(i * 4);
      if (i > 0) vrule(ctx, x0 - GUT / 2, y, sy + ncap + 2.4, C.A, 0.3);
      const nw = T(ctx, String(i + 1), x0 + (i > 0 ? 1 : 0), sy + ncap, { size: nfs, w: 900, color: C.Y });
      T(ctx, 'Adım 0' + (i + 1), x0 + (i > 0 ? 1 : 0) + nw + 1.6, sy + ncap - 3.7, { size: 7 * PT, w: 600, color: C.KB });
      T(ctx, s, x0 + (i > 0 ? 1 : 0) + nw + 1.6, sy + ncap, { size: 9 * PT, w: 700, color: C.W });
    });
    y = sy + ncap + 2.4;
    rule(ctx, M, y, R, C.KB, 0.2);

    // --- sticker (ürünün birebir kopyası, demo profil QR'ı) + 5 özellik (numaralı editoryal liste)
    const stw = 21, stx = M + 0.6, sty = y + 3.2;
    const sth = L.sticker(ctx, stx, sty, stw, { shadow: 2 * (px || 10), edge: 14 });
    T(ctx, 'Okut: demo profil', stx + stw / 2, sty + sth + 3.2, { size: 7 * PT, w: 600, color: C.Y, align: 'center' });

    // 5. madde 7 pt'de (ters yazı alt sınırı) tek satıra sığmıyor (55,4 mm > 49 mm): anlam yerinden dengeli iki satır
    const feats = ['Numaran gizli kalır, sana yine ulaşılır.', 'Mesaj ve bildirim anında telefonunda.',
                   'Dijital kartvizitini uygulamada oluştur.', 'Profilini sosyal medyada paylaş.',
                   'Aracın olmasa da kullan:\nkartvizit olarak yeterli.'];
    const fx = g.x(4), tx = g.x(5) + 0.5, fw = R - tx, fs = 7 * PT;
    let fy = y + 1.2;
    const rowH = (sty + sth + 3.9 - fy) / feats.length;
    feats.forEach((f, i) => {
      const lines = [].concat(...f.split('\n').map(p => L.wrap(ctx, p, fw, fs, 500)));
      const blockH = (lines.length - 1) * 2.9;
      const base = fy + rowH / 2 + 0.9 - blockH / 2;
      T(ctx, '0' + (i + 1), fx, base, { size: fs, w: 800, color: C.Y });
      lines.forEach((ln, k) => T(ctx, ln, tx, base + k * 2.9, { size: fs, w: 500, color: C.W }));
      fy += rowH;
      if (i < feats.length - 1) rule(ctx, fx, fy, R, C.A, 0.3);
    });

    // --- beyaz bilgi bandı: 3 × 3 ızgara
    //     satır 1: A = uygulama QR'ı | B = kutu içeriği | C = EAN-13 yer tutucu
    //     satır 2: A = "Uygulamayı indir" / URL | C = geri dönüşüm (PAP 21) + SKU — satır taban çizgileri ortak
    //     satır 3: tam genişlik ince kural + iki kolonlu yasal satırlar
    const bY = BAND_Y, lc = C.K100, ls = 6.3 * PT;
    const Q = window.KQR_QR_APP, n = Q ? Q.rows.length : 29, qs = 20, qm = qs / n, qz = 4 * qm;
    const qx = M + 0.2, qy = bY + 3.3;
    ctx.fillStyle = C.W; ctx.fillRect(qx - qz, qy - qz, qs + 2 * qz, qs + 2 * qz);   // beyaz zemin + 4 modül sessiz alan
    L.appQR(ctx, qx, qy, qs);
    const r2a = qy + qs + qz + 2.85, r2b = qy + qs + qz + 5.75;                       // satır 2 taban çizgileri
    T(ctx, 'Uygulamayı indir', M, r2a, { size: 7.5 * PT, w: 800, color: lc });
    T(ctx, 'mobile.kisiselqr.com', M, r2b, { size: 7 * PT, w: 600, color: lc });

    // C: EAN-13 yer tutucu — beyaz zemin, 29,8 × 20,7 mm, sahte barkod çizilmez. Izgaranın 8. kolon başına oturur
    //    (x = 56,6) → sağ (Arka/Tutkal) bigiden ~10,1 mm; her durumda en az 9 mm (≥ 8 mm kuralı + ±1 mm bıçak toleransı).
    //    Kesikli kontur kutunun İÇİNE çizilir (baskı kutu dışına taşmaz).
    const eanW = 29.8, eanH = 20.7, ex = Math.min(g.x(7), w - 9 - eanW), ey = qy;
    ctx.fillStyle = C.W; ctx.fillRect(ex, ey, eanW, eanH);
    ctx.strokeStyle = lc; ctx.lineWidth = 0.2; ctx.setLineDash([0.8, 0.6]);
    ctx.strokeRect(ex + 0.1, ey + 0.1, eanW - 0.2, eanH - 0.2); ctx.setLineDash([]);

    // B: kutu içeriği — 4. kolon + oluk (QR'ın 4 modüllük sessiz alanının ~1,2 mm dışında); EAN kutusuna 2,4 mm kala biter
    const kx = g.x(3) + GUT, kR = ex - 2.4;
    T(ctx, 'Kutu içeriği', kx, qy + 1.8, { size: 7 * PT, w: 800, color: lc });
    rule(ctx, kx, qy + 3.2, kR, lc, 0.2);
    ['QR Etiket', 'Aktivasyon Kartı', 'Temizleme Mendili'].forEach((it, i) => {
      const yy = qy + 6.6 + i * 3.3;
      T(ctx, '1', kx, yy, { size: 7 * PT, w: 800, color: lc });
      T(ctx, it, kx + 2.4, yy, { size: 7 * PT, w: 500, color: lc });
    });

    // C satır 2 (brif "en alt: geri dönüşüm işareti + PAP 21, SKU"): üç oklu geri dönüşüm üçgeni, içinde 21;
    //    yanında PAP kısaltması ve SKU — taban çizgileri A sütunuyla aynı
    const tri = 7.0, triH = tri * Math.sqrt(3) / 2, tb = r2b + 0.4;
    mobius(ctx, ex + tri / 2, tb - triH, tri, lc, '21');
    T(ctx, 'PAP', ex + tri + 1.6, r2a, { size: ls, w: 800, color: lc });
    T(ctx, 'SKU: [bekleniyor]', ex + tri + 1.6, r2b, { size: ls, w: 500, color: lc });
    T(ctx, 'EAN-13', ex + eanW / 2, ey + 8.6, { size: 2.9, w: 700, color: lc, align: 'center' });
    T(ctx, 'numara bekleniyor', ex + eanW / 2, ey + 11.8, { size: 6.2 * PT, w: 500, color: lc, align: 'center' });
    T(ctx, '29,8 × 20,7 mm · K100', ex + eanW / 2, ey + 14.8, { size: 6 * PT, w: 500, color: lc, align: 'center' });

    // yasal satırlar: tam genişlik ince kural + 2 kolon (K100, 6,3 pt)
    const lgY = qy + qs + qz + 8.0;
    rule(ctx, M, lgY, R, lc, 0.2);
    const c2 = g.x(6);
    T(ctx, 'Üretici: Candemsoft', M, lgY + 3.0, { size: ls, w: 700, color: lc });
    T(ctx, '[Adres – onay bekleniyor]', M, lgY + 5.7, { size: ls, w: 500, color: lc });
    T(ctx, '[KVKK metni – onay bekleniyor]', c2, lgY + 3.0, { size: ls, w: 500, color: lc });
    T(ctx, "Türkiye'de üretilmiştir.", c2, lgY + 5.7, { size: ls, w: 700, color: lc });
  }

  // Malzeme tanımlama işareti (97/129/EC): üç kovalayan oklu üçgen, ortasında malzeme kodu.
  // (cx, y0) = üst köşe, side = kenar uzunluğu. Her ok bir kenarın ortasından başlar, köşeyi yuvarlak döner ve
  // ok başı sonraki kenarın ortasında biter (saat yönü) — ♳ tipi standart görünüm.
  function mobius(ctx, cx, y0, side, col, num) {
    const h = side * Math.sqrt(3) / 2;
    const V = [[cx, y0], [cx + side / 2, y0 + h], [cx - side / 2, y0 + h]];
    const L1 = side * 0.44, L2 = side * 0.33, r = side * 0.16, ah = side * 0.15, hw = side * 0.07, lw = 0.4;
    const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
    const at = (P, d, k) => [P[0] + d[0] * k, P[1] + d[1] * k];
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    for (let i = 0; i < 3; i++) {
      const A = V[(i + 2) % 3], B = V[i], Cn = V[(i + 1) % 3], d1 = unit(A, B), d2 = unit(B, Cn);
      const p0 = at(B, d1, -L1), p1 = at(B, d1, -r), p2 = at(B, d2, r), p3 = at(B, d2, L2), tip = at(p3, d2, ah);
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.quadraticCurveTo(B[0], B[1], p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]); ctx.stroke();
      const nx = -d2[1], ny = d2[0];
      ctx.beginPath(); ctx.moveTo(tip[0], tip[1]);
      ctx.lineTo(p3[0] + nx * hw, p3[1] + ny * hw); ctx.lineTo(p3[0] - nx * hw, p3[1] - ny * hw); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // kod: üçgenin alt yarısında ortalı (taban okunun başından ve eğik kenarlardan ≥ 0,5 mm)
    T(ctx, num, cx, y0 + h - 1.0, { size: 6 * PT, w: 800, color: col, align: 'center' });
  }

  // ------------------------------------------------------------ YANLAR (alttan yukarı okunan)
  function vertical(ctx, w, cy, fn) { ctx.save(); ctx.translate(w / 2, cy); ctx.rotate(-Math.PI / 2); fn(); ctx.restore(); }

  // Dikey ızgara cetveli: ön/arka yüzdeki kolon çentikli kuralın yan yüzdeki karşılığı. Geniş panellerle aynı adım
  // (kolon + oluk = 7,375 mm, çift çentik: kolon başı + oluk başı). y0 → y1 arasında, çentikler sağa.
  function vruler(ctx, x, y0, y1, color) {
    const cw = grid(96.5).cw, step = cw + GUT;
    vrule(ctx, x, y0, y1, color, 0.2);
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 0.2; ctx.beginPath();
    for (let y = y0; y <= y1 + 1e-6; y += step) {
      ctx.moveTo(x, y); ctx.lineTo(x + 0.9, y);
      if (y + cw <= y1) { ctx.moveTo(x, y + cw); ctx.lineTo(x + 0.9, y + cw); }
    }
    ctx.stroke(); ctx.restore();
  }

  function sideLeft(ctx, w, h) {
    // Alt: logo ikonu (sarı). Üstünde, alttan yukarı okunan KİŞİSEL QR; metin ikonun üstündeki kurala yaslı (flush).
    const ic = 7.5, icy = h - M - ic;
    L.logoIcon(ctx, (w - ic) / 2, icy, ic, C.Y);
    rule(ctx, M, icy - 3, w - M, C.KB, 0.2);
    const s = 7.8, start = icy - 6.5;             // metnin başladığı y (alttan)
    let len = 0;
    vertical(ctx, w, start, () => {
      const by = 0.36 * s;
      const a = T(ctx, 'KİŞİSEL ', 0, by, { size: s, w: 900, color: C.W });
      len = a + T(ctx, 'QR', a, by, { size: s, w: 900, color: C.Y });
    });
    // metnin üstündeki boş siyah alan: yazının ekseninde dikey ızgara cetveli (üst bigiden 5 mm, yazıya 4 mm)
    const rStep = grid(96.5).cw + GUT, rTop = M, rBot = start - len - 4;
    vruler(ctx, w / 2, rTop, rTop + Math.floor((rBot - rTop) / rStep) * rStep, C.KB);
  }

  function sideRight(ctx, w, h) {
    const lotY = h - 8 - 15;
    // Üstten başlayan dikey blok: kisiselqr.com (sarı) + Araç + Dijital Kartvizit (beyaz)
    const s1 = 4.4, s2 = 7.5 * PT;
    const L1 = W(ctx, 'kisiselqr.com', s1, 700), L2 = W(ctx, 'Araç + Dijital Kartvizit', s2, 600);
    const top = M + 1;                               // metnin sona erdiği üst sınır
    const tEnd = top + Math.max(L1, L2);
    vertical(ctx, w, tEnd, () => {
      T(ctx, 'kisiselqr.com', 0, -0.4, { size: s1, w: 700, color: C.Y });
      T(ctx, 'Araç + Dijital Kartvizit', 0, 3.5, { size: s2, w: 600, color: C.W });
    });
    // metinle lot kutusu arasındaki boş alan: aynı dikey ızgara cetveli (yazıya 4 mm, lot kutusuna ≥ 6 mm boşluk)
    const rStep = grid(96.5).cw + GUT, rTop = tEnd + 4, rBot = lotY - 6;
    vruler(ctx, w / 2, rTop, rTop + Math.floor((rBot - rTop) / rStep) * rStep, C.KB);
    // lot / tarih kutucuğu: beyaz, laksız, selefonsuz; üstünde hiçbir şey yok
    ctx.fillStyle = C.W; ctx.fillRect((w - 10) / 2, lotY, 10, 15);
  }

  // ------------------------------------------------------------ EURO BAŞLIK (sarı, delik altında siyah logo ~6 mm)
  function header(ctx, w, h, holeBottom) {
    const lh = 6, lw = L.logoWidth(ctx, lh), lx = (w - lw) / 2, ly = holeBottom + 3.6;
    L.logo(ctx, lx, ly, lh, C.K100);             // küçük siyah metin → tek kanal K100 (zengin siyah yalnız geniş zeminde)
    // editoryal çerçeve: logonun iki yanında ince siyah kural (kenarlardan ≥ 8 mm içeride)
    rule(ctx, 8, ly + lh / 2, lx - 3, C.K100, 0.25);
    rule(ctx, lx + lw + 3, ly + lh / 2, w - 8, C.K100, 0.25);
  }

  // ------------------------------------------------------------ ana çizim
  function render(ctx, GEO, opts) {
    opts = opts || {};
    const g = L.geom(GEO), { P, yT, yp, gp, dp } = g;
    const px = opts.px || 10;
    ctx.save();
    grounds(ctx, g);
    L.inPanel(ctx, P.On.x0, yT, gp, yp, 0, (w, h) => front(ctx, w, h, px));
    L.inPanel(ctx, P.Arka.x0, yT, gp, yp, 0, (w, h) => back(ctx, w, h, px));
    L.inPanel(ctx, P.Sol.x0, yT, dp, yp, 0, (w, h) => sideLeft(ctx, w, h));
    L.inPanel(ctx, P.Sag.x0, yT, dp, yp, 0, (w, h) => sideRight(ctx, w, h));
    // başlık 1. kat (arka taraf, düz)
    L.inPanel(ctx, P.Arka.x0, P.Arka.y0, gp, yT - P.Arka.y0, 0,
      (w, h) => header(ctx, w, h, g.hole1.cy - P.Arka.y0 + g.hole1.h / 2));
    // başlık 2. kat (ön taraf): 180° katlandığı için açınımda TERS çizilir
    const b2 = P.Baslik2;
    L.inPanel(ctx, b2.x0, b2.y0, b2.x1 - b2.x0, b2.y1 - b2.y0, 180,
      (w, h) => header(ctx, w, h, (b2.y1 - g.hole2.cy) + g.hole2.h / 2));
    // Euro delikleri boş
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    [P.Arka.p.holes[0], P.Baslik2.p.holes[0]].forEach(hh => { ctx.beginPath(); L.trace(ctx, hh); ctx.fill(); });
    ctx.restore();
  }

  // Yalnız Inter (400–900) kullanılır; T1.ready() Inter + Montserrat (sticker) + ekran görüntüsünü yükler.
  function ready() { return T1.ready(); }

  window.KQRTasarim4 = {
    meta: { ad: 'Tipografik Izgara', renk: '#FDD309',
            aciklama: 'İsviçre/editoryal ızgara: ortadan bölünen siyah/sarı ön yüz, bölünmeye taşan dev QR harfleri ve diyagram dilinde ön cam.' },
    render, ready,
  };
})();
