/*
 * Kişisel QR Araç Etiketi – Kutu Tasarımı 2 "Sticker Kahraman"
 * Kaynak: Kutu Tasarım Brifi (23.09.2026) + Ambalaj Şartnamesi v1.0 (teknik kurallar)
 *
 * Ürünün kendisi (sticker) ön yüzün kahramanı: aracın sol ön çeyreğinin YAKIN PLANI (dışarıdan):
 * yan ayna, A-sütunu, tavan kenarı, açık antrasit cam + çapraz yansıma bantları, frit bandı, silecek,
 * torpido ızgarası, sarı kaput. Sticker camın sol alt köşesinde, büyük ve hafif eğik.
 * Konum anahtarı: mini araç önü (çizgisel) + sarı halka + kesikli zoom çizgisi + "Ön camın sol alt köşesine".
 * Siyah/sarı bölünme = cam / sarı kaput kenarı. Telefon sağ altta; tek callout "Okut: demo profil".
 *
 * Ortak araçlar Tasarım 1'den (window.KQRTasarim1.lib) gelir; tasarim1.js her zaman önce yüklenir.
 *   KQRTasarim2.render(ctx, GEO, opts)   ctx önceden mm → px ölçeklenmiş (1 birim = 1 mm)
 *   KQRTasarim2.ready()                  fontlar + ekran görüntüsü
 */
(function () {
  const T1 = window.KQRTasarim1;
  const L = T1.lib;
  const C = L.colors, PT = L.PT, SAFE = L.SAFE, BLEED = L.BLEED;
  const { rr, trace, panelPath, rectPts, inPanel } = L;
  const OUT = 'Outfit, Inter, "Helvetica Neue", Arial, sans-serif';
  const ARC = 'Archivo, Inter, "Helvetica Neue", Arial, sans-serif';
  const INT = L.FONT;
  const D2R = Math.PI / 180;

  // ------------------------------------------------------------ yazı yardımcıları (font ailesi seçilebilir)
  function fnt(ctx, size, w, fam) { ctx.font = `${w || 500} ${size}px ${fam || INT}`; }
  function tw(ctx, s, size, w, fam) { fnt(ctx, size, w, fam); return ctx.measureText(s).width; }
  function tx(ctx, s, x, y, o) {
    fnt(ctx, o.size, o.w, o.fam);
    ctx.fillStyle = o.color || C.W; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
    return ctx.measureText(s).width;
  }
  function wrap(ctx, s, maxW, size, w, fam) {
    const out = []; let cur = '';
    s.split(' ').forEach(word => {
      const t = cur ? cur + ' ' + word : word;
      if (tw(ctx, t, size, w, fam) <= maxW) cur = t; else { if (cur) out.push(cur); cur = word; }
    });
    if (cur) out.push(cur);
    return out;
  }
  function clipRect(ctx, x0, y0, x1, y1) { ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); }

  // ------------------------------------------------------------ ön yüz sabitleri (panel içi mm)
  // Sahne: aracın SOL ön çeyreğinin yakın planı (dışarıdan bakış). Sol dış ayna, A-sütunu, tavan kenarı,
  // cam (açık antrasit + çapraz yansıma bantları), camın sol alt köşesinde sticker, silecek, torpido ızgarası,
  // sarı kaput. Cam alt kenarı ve kaput kenarı sağa (aracın ortasına) doğru hafifçe iner.
  const GLASS_B = x => 86.4 + 2.4 * x / 96.5;                                    // cam alt kenarı (frit dahil)
  const HOOD_E = x => 92.6 + 3.0 * x / 96.5 - 0.9 * Math.sin(Math.PI * x / 96.5);  // kaput arka kenarı (siyah/sarı bölünme)
  const HOOD_ZONE = 96.4;                        // grounds() sarı taşma bölgesinin üstü (kaput eğrisinin altında)
  const PIN_B = [13.4, GLASS_B(13.4)], PIN_T = [23.6, 33.2];   // cam sol kenarı = A-sütunu iç kenarı (alt, üst)
  const POUT_B = [9.3, 87.6], POUT_T = [19.4, 32.3];          // A-sütunu dış kenarı (gövde konturu)
  const ROOF = x => { const t = (x - PIN_T[0]) / (96.5 - PIN_T[0]); return 33.2 - 2.0 * t + 0.5 * t * t; };  // cam üst kenarı (aracın ortasına doğru yükselir)
  const ROOF_O = x => ROOF(x) - 2.3;             // tavanın dış silüeti
  const pinX = y => PIN_B[0] + (PIN_T[0] - PIN_B[0]) * (PIN_B[1] - y) / (PIN_B[1] - PIN_T[1]);
  const poutX = y => POUT_B[0] + (POUT_T[0] - POUT_B[0]) * (POUT_B[1] - y) / (POUT_B[1] - POUT_T[1]);
  const RT = 3.6;                               // camın sol üst köşe yarıçapı
  const LINE_END = 3.2;                          // ince çizgiler yan bigilerden ≥ 3 mm önce biter
  const STK_POS = { sw: 25.6, cx: 35.6, cy: 62.0, rot: 6 };    // sticker: 25,6 mm, +6° (A-sütununa paralel), camın sol alt köşesi
  const COL_X = 52.6;                            // sticker ile telefon/rozet arasındaki açıklama sütunu
  const PHONE = { w: 22, h: 44, y: 55.4 };
  const BACK_STEPS = [27.5, 55.0];               // arka yüz: sarı adım şeridi (panel içi y)
  const BACK_LEGAL = 104.0;                      // arka yüz: beyaz yasal bant başlangıcı

  // ------------------------------------------------------------ zeminler + taşma
  function grounds(ctx, g) {
    const { P, yT, yBt } = g;
    const GROUND = {
      On: C.K, Sol: C.K, Sag: C.K, Arka: C.K, Baslik2: C.Y, UstKapak: C.K,
      SolUstToz: C.K, SagUstToz: C.K, SolAltToz: C.K, SagAltToz: C.K, AltKapak: C.K, Dil: C.K,   // alt kilitli kapak düz siyah (oran dengesi)
    };
    const zones = [
      { pts: rectPts(P.Arka.x0, P.Arka.y0, P.Arka.x1, yT), c: C.Y },                                   // Euro başlık 1. kat
      { pts: rectPts(P.On.x0, yT + HOOD_ZONE, P.On.x1, yBt), c: C.Y },                                 // ön: sarı kaput
      { pts: rectPts(P.Arka.x0, yT + BACK_STEPS[0], P.Arka.x1, yT + BACK_STEPS[1]), c: C.Y },          // arka: adım şeridi
      { pts: rectPts(P.Arka.x0, yT + BACK_LEGAL, P.Arka.x1, yBt), c: C.W },                            // arka: yasal bant
    ];
    // 1) taşma: her yüzeyin konturu 2 × 3 mm kalınlıkta; komşu panel dolgusu içerideki kısmı örter
    ctx.lineJoin = 'miter'; ctx.miterLimit = 3; ctx.lineWidth = 2 * BLEED; ctx.setLineDash([]);
    Object.keys(GROUND).forEach(n => { ctx.strokeStyle = GROUND[n]; panelPath(ctx, P[n].p); ctx.stroke(); });
    zones.forEach(z => { ctx.strokeStyle = z.c; ctx.beginPath(); trace(ctx, z.pts); ctx.stroke(); });
    // 2) dolgular
    Object.keys(GROUND).forEach(n => { ctx.fillStyle = GROUND[n]; panelPath(ctx, P[n].p); ctx.fill('evenodd'); });
    zones.forEach(z => { ctx.fillStyle = z.c; ctx.beginPath(); trace(ctx, z.pts); ctx.fill(); });
    // 3) baskısız: tutkal payı + üst yapıştırma dili
    ['Tutkal', 'UstDil'].forEach(n => { ctx.fillStyle = C.RAW; panelPath(ctx, P[n].p); ctx.fill(); });
  }

  // ============================================================ ÖN YÜZ
  function front(ctx, w, h, px) {
    ctx.save();
    clipRect(ctx, 0, 0, w, h);          // yan paneller komşu: çizim panel dışına taşmaz (taşma yalnız zeminde)

    const stk = scene(ctx, w, px);      // yakın plan ön cam + sticker + kaput → sticker köşe noktaları

    // --- Üst: sarı logo (sol üst, lokal UV lak) + "by Candemsoft"
    L.logo(ctx, SAFE + 2, SAFE + 1.2, 7.4, C.Y);
    tx(ctx, 'by Candemsoft', w - SAFE - 2, SAFE + 1.2 + 4.9, { size: 7 * PT, w: 500, color: C.W, align: 'right' });

    // --- Başlık: KİŞİSEL QR (Outfit 800, 23 pt) ortalı + alt satır
    const ts = 23 * PT, t1 = 'KİŞİSEL ', t2 = 'QR';
    const a = tw(ctx, t1, ts, 800, OUT), b = tw(ctx, t2, ts, 800, OUT), x0 = (w - a - b) / 2, by = 21.8;
    tx(ctx, t1, x0, by, { size: ts, w: 800, fam: OUT, color: C.W });
    tx(ctx, t2, x0 + a, by, { size: ts, w: 800, fam: OUT, color: C.Y });
    tx(ctx, 'Akıllı Araç Etiketi + Dijital Kartvizit', w / 2, 27.2, { size: 8.5 * PT, w: 600, color: C.KB, align: 'center' });

    // --- Konum anahtarı: mini araç önü + sarı nokta (camın sol alt köşesi) → yakın plandaki sticker
    locator(ctx, COL_X, 34.0, stk);

    // --- Telefon (sağ alt, kaputun önünde) + "Okut: demo profil" (sticker QR'ı → telefondaki demo profil)
    const ph = { x: w - SAFE - PHONE.w, y: PHONE.y, w: PHONE.w, h: PHONE.h };
    L.phone(ctx, ph.x, ph.y, ph.w, ph.h, px);
    callout(ctx, ph, stk);

    // --- Rozet: sekizgen "dur" etiketi, sarı zemin, siyah yazı (lak almaz)
    badge(ctx, w - SAFE - 10.5, 43.6, 10.8);

    // --- İkon şeridi (sarı kaput üzerinde): 4 çizgisel ikon, siyah halka içinde, tek satır 7 pt etiket
    const items = [['gizli', 'Numaran gizli'], ['bildirim', 'Anında bildirim'],
                   ['kartvizit', 'Dijital kartvizit'], ['ucretsiz', 'Aylık ücret yok']];
    const colW = (w - 2 * SAFE) / 4, cy = 108.4;
    items.forEach((it, i) => {
      const cx = SAFE + colW * (i + 0.5);
      ctx.strokeStyle = C.K100; ctx.lineWidth = 0.45; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, 7.1, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.translate(cx - 5, cy - 5); L.ICONS[it[0]](ctx); ctx.restore();
      tx(ctx, it[1], cx, cy + 12.2, { size: 7 * PT, w: 700, color: C.K100, align: 'center' });
    });
    // En alt 10 mm (126,5–136,5): mühür bandı – yalnız zemin rengi
    ctx.restore();
  }

  // ------------------------------------------------------------ yakın plan ön cam sahnesi
  function glassPath(ctx, w) {
    const r = 2.2, yb = PIN_B[1] - r * 1.1;
    ctx.beginPath();
    ctx.moveTo(PIN_T[0] + RT, ROOF(PIN_T[0] + RT));
    for (let x = PIN_T[0] + RT + 2; x < w + 1; x += 2) ctx.lineTo(x, ROOF(x));
    ctx.lineTo(w + 1, ROOF(w + 1));
    ctx.lineTo(w + 1, GLASS_B(w + 1));
    for (let x = w; x > PIN_B[0] + r; x -= 2) ctx.lineTo(x, GLASS_B(x));
    ctx.lineTo(PIN_B[0] + r, GLASS_B(PIN_B[0] + r));
    ctx.quadraticCurveTo(PIN_B[0], PIN_B[1], pinX(yb), yb);
    ctx.lineTo(pinX(PIN_T[1] + RT), PIN_T[1] + RT);
    ctx.quadraticCurveTo(PIN_T[0], PIN_T[1], PIN_T[0] + RT, ROOF(PIN_T[0] + RT));
    ctx.closePath();
  }
  // Cam kenarından içeri doğru frit (seramik baskı) bandı + noktalı geçiş. p0→p1 kenar, n içe normal
  function frit(ctx, p0, p1, n, band) {
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), ux = (p1[0] - p0[0]) / len, uy = (p1[1] - p0[1]) / len;
    ctx.fillStyle = C.K;
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p1[0] + n[0] * band, p1[1] + n[1] * band); ctx.lineTo(p0[0] + n[0] * band, p0[1] + n[1] * band);
    ctx.closePath(); ctx.fill();
    const pitch = 0.62;
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      const r = 0.24 * (1 - j / 4.5), off = band + (j + 0.5) * pitch, sh = (j % 2) * pitch / 2;
      for (let s = sh; s < len; s += pitch) {
        const x = p0[0] + ux * s + n[0] * off, y = p0[1] + uy * s + n[1] * off;
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  function scene(ctx, w, px) {
    const xe = w - LINE_END;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);

    // ---- CAM: açık antrasit (siyah gövdeden ayrışır), üstte daha açık → altta koyulaşır
    glassPath(ctx, w);
    const gg = ctx.createLinearGradient(0, 33, 0, 104);
    gg.addColorStop(0, C.A); gg.addColorStop(0.4, C.A); gg.addColorStop(1, C.K);
    ctx.fillStyle = gg; ctx.fill();
    ctx.save(); glassPath(ctx, w); ctx.clip();
    // frit bandı: alt kenar + sol kenar
    const nx = PIN_B[1] - PIN_T[1], ny = PIN_T[0] - PIN_B[0], nl = Math.hypot(nx, ny);   // sol kenar içe normal
    frit(ctx, [xe, GLASS_B(xe)], [PIN_B[0] + 1, GLASS_B(PIN_B[0] + 1)], [0, -1], 1.7);
    frit(ctx, [pinX(PIN_B[1] - 1), PIN_B[1] - 1], [pinX(PIN_T[1] + RT), PIN_T[1] + RT], [nx / nl, ny / nl], 1.3);
    ctx.restore();

    // ---- A-SÜTUNU (camın solu): siyah gövde, ortasında antrasit hacim çizgisi
    const pil = () => {
      ctx.beginPath();
      ctx.moveTo(POUT_B[0], POUT_B[1]); ctx.lineTo(POUT_T[0], POUT_T[1]);
      ctx.quadraticCurveTo(POUT_T[0] + 0.2, ROOF_O(POUT_T[0]) + 0.2, PIN_T[0] + RT + 2, ROOF_O(PIN_T[0] + RT + 2));
      ctx.lineTo(PIN_T[0] + RT + 2, ROOF(PIN_T[0] + RT + 2));
      ctx.lineTo(PIN_T[0] + RT, ROOF(PIN_T[0] + RT));
      ctx.quadraticCurveTo(PIN_T[0], PIN_T[1], pinX(PIN_T[1] + RT), PIN_T[1] + RT);
      ctx.lineTo(PIN_B[0], PIN_B[1]); ctx.closePath();
    };
    pil(); ctx.fillStyle = C.K; ctx.fill();
    ctx.save(); pil(); ctx.clip();
    ctx.strokeStyle = C.A; ctx.lineWidth = 1.1; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo((POUT_B[0] + PIN_B[0]) / 2 + 0.3, 88); ctx.lineTo((POUT_T[0] + PIN_T[0]) / 2 + 0.2, 32); ctx.stroke();
    ctx.restore();

    // ---- SOL DIŞ AYNA (A-sütunu dibinde, gövdeden dışarı taşar) – aracın yanını anlatan ana ipucu
    const mA = [poutX(71.8), 71.8], mB = [poutX(77.8), 77.8];
    const mirror = () => {                      // ayna kapağı: dışa doğru hafif yükselen, köşeleri yuvarlak gövde
      ctx.beginPath();
      ctx.moveTo(mA[0] + 0.3, mA[1]);
      ctx.lineTo(6.4, 69.0);
      ctx.quadraticCurveTo(3.9, 68.6, 3.8, 71.0);
      ctx.lineTo(3.8, 75.0);
      ctx.quadraticCurveTo(3.9, 77.5, 6.4, 77.7);
      ctx.lineTo(mB[0] + 0.3, mB[1]);
      ctx.closePath();
    };
    mirror(); ctx.fillStyle = C.K; ctx.fill();
    ctx.save(); mirror(); ctx.clip();
    ctx.fillStyle = C.A; ctx.beginPath(); ctx.moveTo(3, 67); ctx.lineTo(13, 67); ctx.lineTo(13, 72.2);                // üst kapak hacmi
    ctx.lineTo(3, 71.6); ctx.closePath(); ctx.fill();
    ctx.restore();
    mirror(); ctx.strokeStyle = C.KB; ctx.lineWidth = 0.35; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = 'rgba(244,244,242,0.6)'; ctx.lineWidth = 0.25;                                             // sinyal çizgisi
    ctx.beginPath(); ctx.moveTo(4.9, 75.6); ctx.lineTo(9.6, 76.2); ctx.stroke();

    // ---- gövde silüeti (kırık beyaz): A-sütunu dış kenarı → tavan kenarı; aynanın altında kapı/çamurluk
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.35; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(poutX(mA[1] - 0.1), mA[1] - 0.1); ctx.lineTo(poutX(PIN_T[1] + RT), PIN_T[1] + RT);
    ctx.quadraticCurveTo(POUT_T[0] + 0.2, ROOF_O(POUT_T[0]) + 0.2, POUT_T[0] + RT + 1.2, ROOF_O(POUT_T[0] + RT + 1.2));
    for (let x = POUT_T[0] + RT + 3; x < xe; x += 2) ctx.lineTo(x, ROOF_O(x));
    ctx.lineTo(xe, ROOF_O(xe)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(poutX(mB[1] + 0.1), mB[1] + 0.1); ctx.lineTo(POUT_B[0] + 0.05, POUT_B[1] - 0.3); ctx.stroke();

    // ---- STICKER (kahraman): 26 mm, +5° eğik, camın sol alt köşesinde, frit bandının hemen üstünde
    const S = STK_POS, sw = S.sw, sh = sw * 1.6, rot = S.rot * D2R;
    ctx.save();
    ctx.translate(S.cx, S.cy); ctx.rotate(rot);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 1.4 * px; ctx.shadowOffsetX = 0.2 * px; ctx.shadowOffsetY = 0.4 * px;
    rr(ctx, -sw / 2, -sh / 2, sw, sh, sw * 112 / 764); ctx.fillStyle = C.K; ctx.fill(); ctx.restore();
    L.sticker(ctx, -sw / 2, -sh / 2, sw, { edge: 12 });
    ctx.restore();
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const P = (u, v) => [S.cx + u * cs - v * sn, S.cy + u * sn + v * cs];      // sticker yerel → panel
    const stk = { tl: P(-sw / 2, -sh / 2), tr: P(sw / 2, -sh / 2), br: P(sw / 2, sh / 2), bl: P(-sw / 2, sh / 2),
                  qr: P(sw * (0.5 - 0.04), -sh / 2 + sh * 0.33), P };

    // ---- CAM YANSIMASI: çapraz kırık beyaz bantlar (camın dış yüzünde → sticker'ın da üstünden geçer)
    ctx.save();
    glassPath(ctx, w); ctx.clip();
    const band = (xTop, wd, a) => {             // üstte xTop'tan başlayıp sola-aşağı inen paralel bant
      const k = 0.62;                           // eğim: her 1 mm aşağıda 0,62 mm sola
      ctx.fillStyle = `rgba(244,244,242,${a})`;
      ctx.beginPath();
      ctx.moveTo(xTop, 30); ctx.lineTo(xTop + wd, 30);
      ctx.lineTo(xTop + wd - k * 62, 92); ctx.lineTo(xTop - k * 62, 92); ctx.closePath(); ctx.fill();
    };
    band(94.0, 5.4, 0.18); band(101.2, 1.8, 0.22);         // sağ çift bant: telefonun sol altında + sağ üst köşede
    band(37.6, 3.8, 0.16); band(43.0, 1.3, 0.2);           // sol çift bant: cam köşesi → sticker'ın sol üst köşesi
    ctx.restore();

    // ---- cam konturu: sol kenar + üst kenar (tavan) + alt kenar – ön camın çerçevesi
    ctx.save();
    ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(244,244,242,0.4)'; ctx.lineWidth = 0.3;   // cam kenarı fitili (ince, yarı saydam)
    const r = 2.2, yb = PIN_B[1] - r * 1.1;
    ctx.beginPath();
    ctx.moveTo(xe, ROOF(xe));
    for (let x = xe - 2; x > PIN_T[0] + RT; x -= 2) ctx.lineTo(x, ROOF(x));
    ctx.lineTo(PIN_T[0] + RT, ROOF(PIN_T[0] + RT));
    ctx.quadraticCurveTo(PIN_T[0], PIN_T[1], pinX(PIN_T[1] + RT), PIN_T[1] + RT);
    ctx.lineTo(pinX(yb), yb);
    ctx.quadraticCurveTo(PIN_B[0], PIN_B[1], PIN_B[0] + r, GLASS_B(PIN_B[0] + r));
    ctx.lineTo(xe, GLASS_B(xe));
    ctx.stroke();

    // ---- torpido ızgarası (cowl): cam alt kenarı ile kaput arası siyah, antrasit yarıklar
    ctx.beginPath(); ctx.moveTo(-1, GLASS_B(-1) + 0.2);
    for (let x = 0; x <= w + 1; x += 2) ctx.lineTo(x, GLASS_B(x) + 0.2);
    for (let x = w + 1; x >= -1; x -= 2) ctx.lineTo(x, HOOD_E(x) + 0.3);
    ctx.closePath(); ctx.fillStyle = C.K; ctx.fill();
    ctx.strokeStyle = C.A; ctx.lineWidth = 0.5; ctx.lineCap = 'round';
    for (let x = 16; x < xe - 1; x += 2.3) {
      const y0 = GLASS_B(x) + 1.5, y1 = HOOD_E(x) - 1.1;
      if (y1 - y0 > 0.8) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x - 0.7, y1); ctx.stroke(); }
    }

    // ---- silecek: pivot ızgarada, kol + süpürge camın alt kenarında park hâlinde
    const piv = [60, HOOD_E(60) - 2.4];
    const b0 = [17.4, GLASS_B(17.4) - 1.0], b1 = [55, GLASS_B(55) - 1.25];
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.K; ctx.lineWidth = 1.6;                      // süpürge gövdesi
    ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke();
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.3;
    ctx.beginPath(); ctx.moveTo(b0[0] + 0.6, b0[1] - 0.6); ctx.lineTo(b1[0] - 0.6, b1[1] - 0.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(244,244,242,0.55)'; ctx.lineWidth = 0.22;  // lastik ağzı
    ctx.beginPath(); ctx.moveTo(b0[0] + 0.3, b0[1] + 0.9); ctx.lineTo(b1[0] - 0.3, b1[1] + 0.9); ctx.stroke();
    const am = [36, (b0[1] + b1[1]) / 2 - 0.1];                   // kol süpürge ortasına bağlanır
    ctx.strokeStyle = C.KB; ctx.lineWidth = 2.0;
    ctx.beginPath(); ctx.moveTo(piv[0], piv[1]); ctx.lineTo(am[0], am[1] - 0.2); ctx.stroke();
    ctx.strokeStyle = C.K; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(piv[0], piv[1]); ctx.lineTo(am[0], am[1] - 0.2); ctx.stroke();
    ctx.fillStyle = C.K; ctx.beginPath(); ctx.arc(piv[0], piv[1], 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.3; ctx.stroke();
    ctx.fillStyle = C.A; ctx.beginPath(); ctx.arc(piv[0], piv[1], 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.K; rr(ctx, am[0] - 1.5, am[1] - 1.0, 3.0, 1.4, 0.5); ctx.fill();
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.22; ctx.stroke();

    // ---- sarı kaput (siyah/sarı bölünme): kenar parlaması beyaz, sonra düz sarı
    ctx.beginPath(); ctx.moveTo(-1, HOOD_E(-1));
    for (let x = 0; x <= w + 1; x += 2) ctx.lineTo(x, HOOD_E(x));
    ctx.lineTo(w + 1, 140); ctx.lineTo(-1, 140); ctx.closePath();
    ctx.fillStyle = C.Y; ctx.fill();
    ctx.save(); ctx.clip();
    const hg = ctx.createLinearGradient(0, 92, 0, 99.5);
    hg.addColorStop(0, 'rgba(255,255,255,0.5)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg; ctx.fillRect(-1, 90, w + 2, 12);
    ctx.restore();
    ctx.strokeStyle = C.W; ctx.lineWidth = 0.35;
    ctx.beginPath(); for (let x = LINE_END; x <= xe; x += 1.5) (x === LINE_END ? ctx.moveTo : ctx.lineTo).call(ctx, x, HOOD_E(x) + 0.55); ctx.stroke();
    ctx.restore();
    ctx.restore();
    return stk;
  }

  // ------------------------------------------------------------ konum anahtarı: mini araç önü (çizgisel) + sarı nokta
  // Tüm aracın önden küçük görünümü; sticker'ın yeri (camın sol alt köşesi) sarı noktayla işaretli.
  // Noktadan yakın plandaki sticker'a kesikli "zoom" çizgisi + etiket "Ön camın / sol alt köşesine".
  function locator(ctx, lx, y, stk) {
    const s = 1.08;                                      // mini araç: 17,3 × 10,4 mm; gövde sol kenarı metin sütununa hizalı
    const x = lx - 0.5 * s;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash([]);
    // gövde (kaput + tampon) ve kabin
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(0.5, 8.4); ctx.lineTo(0.5, 6.5); ctx.quadraticCurveTo(0.6, 5.2, 2.2, 5.0);
      ctx.lineTo(3.0, 4.9); ctx.lineTo(4.9, 1.2); ctx.quadraticCurveTo(8.5, 0.2, 12.1, 1.2); ctx.lineTo(14.0, 4.9);
      ctx.lineTo(14.8, 5.0); ctx.quadraticCurveTo(16.4, 5.2, 16.5, 6.5); ctx.lineTo(16.5, 8.4);
      ctx.quadraticCurveTo(16.5, 9.1, 15.8, 9.1); ctx.lineTo(1.2, 9.1); ctx.quadraticCurveTo(0.5, 9.1, 0.5, 8.4); ctx.closePath();
    };
    body(); ctx.fillStyle = C.K; ctx.fill();
    // ön cam
    const ws = () => { ctx.beginPath(); ctx.moveTo(3.8, 4.6); ctx.lineTo(5.4, 1.75); ctx.quadraticCurveTo(8.5, 0.95, 11.6, 1.75); ctx.lineTo(13.2, 4.6); ctx.closePath(); };
    ws(); ctx.fillStyle = C.A; ctx.fill();
    ctx.save(); ws(); ctx.clip();
    ctx.fillStyle = 'rgba(244,244,242,0.22)';
    ctx.beginPath(); ctx.moveTo(10.2, 0.5); ctx.lineTo(11.4, 0.5); ctx.lineTo(9.4, 5); ctx.lineTo(8.2, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.3;
    body(); ctx.stroke(); ws(); ctx.stroke();
    // aynalar
    [[2.9, -1], [14.1, 1]].forEach(([mx, d]) => {
      ctx.beginPath(); ctx.moveTo(mx, 4.3); ctx.quadraticCurveTo(mx + d * 1.9, 3.5, mx + d * 2.0, 4.4);
      ctx.quadraticCurveTo(mx + d * 1.7, 5.0, mx + d * 0.2, 4.9); ctx.closePath();
      ctx.fillStyle = C.K; ctx.fill(); ctx.stroke();
    });
    // farlar + ızgara + tekerlek izleri
    [[1.3, 1], [15.7, -1]].forEach(([fx, d]) => {
      ctx.beginPath(); ctx.moveTo(fx, 6.1); ctx.lineTo(fx + d * 3.4, 6.4); ctx.lineTo(fx + d * 3.0, 7.2); ctx.lineTo(fx, 7.0); ctx.closePath(); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(6.1, 6.6); ctx.lineTo(10.9, 6.6); ctx.lineTo(10.3, 7.9); ctx.lineTo(6.7, 7.9); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(1.6, 9.6); ctx.lineTo(3.4, 9.6); ctx.moveTo(13.6, 9.6); ctx.lineTo(15.4, 9.6); ctx.stroke();
    // sticker'ın yeri: camın SOL ALT köşesi (sarı mini sticker, cam alt kenarına ve A-sütununa dayalı + halka)
    const mx = 5.0, my = 3.8, rg = 1.35;
    ctx.fillStyle = C.Y; rr(ctx, mx - 0.45, my - 0.7, 0.9, 1.4, 0.2); ctx.fill();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.32; ctx.beginPath(); ctx.arc(mx, my, rg, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // kesikli zoom çizgisi: halkadan yakın plandaki sticker'ın sağ üst köşesine
    const hx = x + mx * s, hy = y + my * s;
    const tr = stk.tr, ang = Math.atan2(tr[1] - hy, tr[0] - hx);
    ctx.save();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.35; ctx.setLineDash([0.9, 0.55]); ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(hx + (rg * s + 0.3) * Math.cos(ang), hy + (rg * s + 0.3) * Math.sin(ang)); ctx.lineTo(tr[0] + 0.6, tr[1] - 0.2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // etiket (sütun: "Okut: demo profil" ile aynı sol hiza)
    tx(ctx, 'Ön camın', lx, y + 14.0, { size: 7.5 * PT, w: 800, fam: OUT, color: C.Y });
    tx(ctx, 'sol alt köşesine', lx, y + 17.2, { size: 7 * PT, w: 600, color: C.W });
  }

  // ------------------------------------------------------------ callout: sticker QR'ı → telefondaki demo profil
  function callout(ctx, ph, stk) {
    const ih = (ph.w - 2.6) * 2796 / 1290, sy = ph.y + 1.3;
    const ty = sy + ih * 0.185;                 // telefonda "Test Kullanıcısı" satırı
    const lx = COL_X, by = ty + 0.6;            // "Okut:" taban çizgisi (çizgi telefon satırıyla aynı hizada)
    const w1 = tx(ctx, 'Okut:', lx, by, { size: 7.5 * PT, w: 800, fam: OUT, color: C.Y });
    tx(ctx, 'demo profil', lx, by + 3.1, { size: 7 * PT, w: 600, color: C.W });
    const ly = by - 0.95, q = stk.qr, tx0 = ph.x + 3.4;
    ctx.save();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(lx - 1.0, ly); ctx.lineTo(q[0] + 0.9, q[1]); ctx.stroke();                     // → sticker QR
    ctx.beginPath(); ctx.moveTo(lx + w1 + 1.2, ly); ctx.lineTo(ph.x - 1.2, ly); ctx.lineTo(tx0, ty); ctx.stroke(); // → telefon
    [q, [tx0, ty]].forEach(([dx, dy]) => {
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(dx, dy, 0.75, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.K; ctx.lineWidth = 0.25; ctx.stroke();
    });
    ctx.restore();
  }

  // ------------------------------------------------------------ rozet: sekizgen "dur" etiketi (numaratör devri bitti)
  function badge(ctx, cx, cy, R) {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(-8 * D2R);
    const oct = r => {
      ctx.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k + 0.5) * Math.PI / 4; (k ? ctx.lineTo : ctx.moveTo).call(ctx, r * Math.cos(a), r * Math.sin(a)); }
      ctx.closePath();
    };
    ctx.lineJoin = 'round';
    oct(R - 0.4); ctx.fillStyle = C.Y; ctx.fill(); ctx.strokeStyle = C.Y; ctx.lineWidth = 0.8; ctx.stroke();
    oct(R - 1.5); ctx.strokeStyle = C.K100; ctx.lineWidth = 0.4; ctx.stroke();
    tx(ctx, 'ARTIK', 0, -3.3, { size: 7 * PT, w: 800, fam: ARC, color: C.K100, align: 'center' });
    let s = 8 * PT; while (tw(ctx, 'numaratöre', s, 800, ARC) > 2 * (R - 1.5) * 0.924 - 3.0 && s > 7.2 * PT) s -= 0.02;
    tx(ctx, 'numaratöre', 0, 0.75, { size: s, w: 800, fam: ARC, color: C.K100, align: 'center' });
    tx(ctx, 'gerek yok', 0, 4.25, { size: s, w: 800, fam: ARC, color: C.K100, align: 'center' });
    ctx.restore();
  }

  // ============================================================ ARKA YÜZ
  function back(ctx, w, h, px) {
    ctx.save();
    clipRect(ctx, 0, 0, w, h);
    const Lx = SAFE + 0.5, R = w - SAFE - 0.5, cw = R - Lx;      // +0,5 mm kesim/katlama toleransı

    // --- Üst: başlık + açıklama (koyu zeminde ters metin ≥ 7 pt, ≥ 500)
    tx(ctx, 'Nasıl çalışır?', Lx, 10.2, { size: 13 * PT, w: 800, fam: OUT, color: C.Y });
    const desc = "Kişisel QR'ı aracının ön camına yapıştır. Sana ulaşmak isteyen QR'ı telefonuyla okutur, " +
                 'bildirim sana gelir; numaran görünmez. Aynı profil dijital kartvizitin olur: widget ile paylaş, ' +
                 'sosyal medyada link olarak kullan.';
    const ds = 7.2 * PT;
    wrap(ctx, desc, cw, ds, 500).forEach((ln, i) => tx(ctx, ln, Lx, 14.8 + i * 3.2, { size: ds, w: 500, color: C.W }));

    // --- Sarı adım şeridi: 3 piktogram (mendil, yapıştırma eli, telefon)
    steps(ctx, w, BACK_STEPS[0], BACK_STEPS[1]);

    // --- Özellik listesi (sol) + uygulama QR kartı (sağ)
    const card = { x: R - 29.6, y: 59.2, w: 29.6 };
    const feats = ['Numaran gizli kalır, sana yine ulaşılır.', 'Mesaj ve bildirim anında telefonunda.',
                   'Dijital kartvizitini uygulamada oluştur.', 'Profilini sosyal medyada paylaş.',
                   'Aracın olmasa da kullan: kartvizit olarak yeterli.'];
    const fx = Lx, fw = card.x - 4 - fx - 4.4, fs = 7 * PT;
    let fy = 62.6;
    feats.forEach(f => {
      ctx.strokeStyle = C.Y; ctx.lineWidth = 0.55; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(fx + 0.2, fy - 1.1); ctx.lineTo(fx + 1.15, fy - 0.1); ctx.lineTo(fx + 2.9, fy - 2.3); ctx.stroke();
      const lines = wrap(ctx, f, fw, fs, 500);
      lines.forEach((ln, i) => tx(ctx, ln, fx + 4.4, fy + i * 2.95, { size: fs, w: 500, color: C.W }));
      fy += lines.length * 2.95 + 3.05;
    });

    // uygulama QR kartı: beyaz, 20,5 mm QR, her yanda ≥ 4 modül sessiz alan, altında metin (K100).
    // Alt sessiz alan metnin ÜST kenarına göre ölçülür: "Uygulamayı indir" satırının yükselen harfleri
    // (l, d, İ noktası) taban çizgisinin ~2,0 mm üstüne çıkar → taban çizgisi QR altından 4,4 modül + 2,9 mm aşağıda.
    const Q = window.KQR_QR_APP, n = Q ? Q.rows.length : 29, qs = 20.5, qm = qs / n;
    const qx = card.x + (card.w - qs) / 2, qy = card.y + 4.4 * qm;
    const cardH = 4.4 * qm + qs + 4.4 * qm + 8.4;
    ctx.fillStyle = C.W; rr(ctx, card.x, card.y, card.w, cardH, 1.6); ctx.fill();
    L.drawQR(ctx, Q, qx, qy, qs, C.K100);
    const ty = qy + qs + 4.4 * qm + 0.6;
    tx(ctx, 'Uygulamayı indir', card.x + card.w / 2, ty + 2.3, { size: 7.5 * PT, w: 800, color: C.K100, align: 'center' });
    let us = 7 * PT; while (tw(ctx, 'mobile.kisiselqr.com', us, 600) > card.w - 2.4 && us > 6 * PT) us -= 0.02;
    tx(ctx, 'mobile.kisiselqr.com', card.x + card.w / 2, ty + 5.7, { size: us, w: 600, color: C.K100, align: 'center' });

    // --- Kutu içeriği (tek satır)
    const ky = 100.2, k1 = 'Kutu içeriği  ', ks = 7 * PT;
    const kw = tx(ctx, k1, Lx, ky, { size: ks, w: 700, color: C.Y });
    tx(ctx, '1 QR Etiket · 1 Aktivasyon Kartı · 1 Temizleme Mendili', Lx + kw, ky, { size: ks, w: 500, color: C.W });

    // --- Beyaz yasal bant (K100): üretici, KVKK, menşe | EAN-13 (bigiden ≥ 8 mm)
    const lc = C.K100, ls = 6.5 * PT;
    const eanW = 29.8, eanH = 20.7, ex = w - 8 - eanW, ey = h - 8 - eanH;
    const lw = ex - Lx - 3;
    let ly = BACK_LEGAL + 5.4;
    [['Üretici: Candemsoft', 700], ['[Adres – Candemsoft onayı bekleniyor]', 500],
     ['[KVKK bilgilendirme metni – onay bekleniyor]', 500], ["Türkiye'de üretilmiştir.", 700]].forEach(([s, wt]) => {
      wrap(ctx, s, lw, ls, wt).forEach(ln => { tx(ctx, ln, Lx, ly, { size: ls, w: wt, color: lc }); ly += 2.9; });
    });
    const ry = h - SAFE - 2.2;
    recycle(ctx, Lx + 2.1, ry - 0.9, lc);
    tx(ctx, 'PAP 21', Lx + 5.0, ry, { size: ls, w: 700, color: lc });
    tx(ctx, 'SKU: [bekleniyor]', Lx + 14.4, ry, { size: ls, w: 500, color: lc });
    // EAN-13 yer tutucu (sahte barkod çizilmez)
    ctx.fillStyle = C.W; ctx.fillRect(ex, ey, eanW, eanH);
    ctx.strokeStyle = lc; ctx.lineWidth = 0.2; ctx.setLineDash([0.8, 0.6]); ctx.strokeRect(ex, ey, eanW, eanH); ctx.setLineDash([]);
    tx(ctx, 'EAN-13', ex + eanW / 2, ey + 8.6, { size: 2.9, w: 700, color: lc, align: 'center' });
    tx(ctx, 'numara bekleniyor', ex + eanW / 2, ey + 11.8, { size: 6 * PT, w: 500, color: lc, align: 'center' });
    tx(ctx, '%80 · 29,8 × 20,7 mm', ex + eanW / 2, ey + 14.6, { size: 6 * PT, w: 500, color: lc, align: 'center' });
    ctx.restore();
  }

  function recycle(ctx, x, y, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 0.32;
    for (let k = 0; k < 3; k++) {
      ctx.save(); ctx.rotate(k * 2 * Math.PI / 3);
      ctx.beginPath(); ctx.arc(0, 0, 1.75, -Math.PI * 0.95, -Math.PI * 0.45); ctx.stroke();
      const a = -Math.PI * 0.45, ax = 1.75 * Math.cos(a), ay = 1.75 * Math.sin(a);
      ctx.beginPath(); ctx.moveTo(ax + 0.55, ay + 0.05); ctx.lineTo(ax - 0.25, ay - 0.5); ctx.lineTo(ax - 0.3, ay + 0.45); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ adım şeridi + piktogramlar (K100 çizgi, sarı zemin)
  function steps(ctx, w, y0, y1) {
    const Lx = SAFE, cw = w - 2 * SAFE, cellW = cw / 3;
    const names = ['Temizle', 'Yapıştır', 'Aktif Et'], pics = [picWipe, picPress, picActivate];
    names.forEach((nm, i) => {
      const x = Lx + cellW * i, cx = x + cellW / 2;
      ctx.save(); ctx.translate(cx - 9, y0 + 3.6); pics[i](ctx); ctx.restore();
      // numara: siyah daire, sarı rakam + adım adı (tek satır)
      const lab = y1 - 4.4, nw = tw(ctx, nm, 8 * PT, 800, OUT), gx = cx - (nw + 5.6) / 2;
      ctx.fillStyle = C.K100; ctx.beginPath(); ctx.arc(gx + 2.05, lab - 0.98, 2.05, 0, Math.PI * 2); ctx.fill();
      tx(ctx, String(i + 1), gx + 2.05, lab, { size: 2.7, w: 800, fam: OUT, color: C.Y, align: 'center' });
      tx(ctx, nm, gx + 5.6, lab, { size: 8 * PT, w: 800, fam: OUT, color: C.K100 });
      if (i < 2) {           // hücreler arası ok
        const ax = x + cellW, ay = y0 + 11.2;
        ctx.strokeStyle = C.K100; ctx.lineWidth = 0.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(ax - 1.0, ay - 1.6); ctx.lineTo(ax + 0.6, ay); ctx.lineTo(ax - 1.0, ay + 1.6); ctx.stroke();
      }
    });
  }
  function pen(ctx, lw) { ctx.strokeStyle = C.K100; ctx.fillStyle = C.K100; ctx.lineWidth = lw || 0.45; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]); }
  function glassPane(ctx) {         // piktogram ortak: ön cam kesiti (18 × 15 alan)
    pen(ctx);
    ctx.beginPath(); ctx.moveTo(2.6, 1.0); ctx.lineTo(18, 1.0); ctx.moveTo(0.4, 14.2); ctx.lineTo(18, 14.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.6, 1.0); ctx.lineTo(0.4, 14.2); ctx.stroke();
  }
  function sparkle(ctx, x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
  }
  function picWipe(ctx) {           // mendil camı siliyor
    glassPane(ctx);
    ctx.save(); ctx.translate(10.4, 7.6); ctx.rotate(-12 * D2R);
    pen(ctx); ctx.fillStyle = C.Y;
    rr(ctx, -4.2, -3.4, 8.4, 6.8, 0.8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1.4, -3.4); ctx.lineTo(4.2, -0.6); ctx.stroke();          // katlı köşe
    pen(ctx, 0.3);
    ctx.beginPath(); ctx.moveTo(-2.6, 0.4); ctx.lineTo(1.6, 0.4); ctx.moveTo(-2.6, 1.9); ctx.lineTo(0.6, 1.9); ctx.stroke();
    ctx.restore();
    pen(ctx, 0.4);                                                                          // silme hareketi
    ctx.beginPath(); ctx.arc(10.4, 7.6, 6.6, Math.PI * 0.72, Math.PI * 1.02); ctx.stroke();
    ctx.beginPath(); ctx.arc(10.4, 7.6, 8.0, Math.PI * 0.78, Math.PI * 0.98); ctx.stroke();
    pen(ctx); sparkle(ctx, 16.2, 4.2, 1.35); sparkle(ctx, 16.0, 11.4, 0.9);
  }
  function picPress(ctx) {          // parmak sticker'ı cama bastırıyor
    glassPane(ctx);
    L.sticker(ctx, 4.2, 2.6, 5.6, {});
    // parmak (sarı dolgu, siyah kontur) sticker'ın alt sağ köşesine bastırır
    pen(ctx); ctx.fillStyle = C.Y;
    ctx.beginPath();
    ctx.moveTo(9.0, 10.4); ctx.quadraticCurveTo(8.6, 8.4, 10.4, 8.6);
    ctx.lineTo(16.4, 10.8); ctx.quadraticCurveTo(18.6, 11.8, 18.4, 14.2);
    ctx.lineTo(18.3, 16.6); ctx.lineTo(13.0, 16.6); ctx.lineTo(12.8, 13.6);
    ctx.lineTo(10.0, 11.7); ctx.quadraticCurveTo(9.1, 11.2, 9.0, 10.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10.0, 9.2); ctx.quadraticCurveTo(10.8, 9.9, 10.2, 10.9); ctx.stroke();   // tırnak
    ctx.beginPath(); ctx.moveTo(14.4, 12.3); ctx.quadraticCurveTo(15.6, 13.0, 15.4, 14.5); ctx.stroke(); // boğum
    pen(ctx, 0.35);                                                                         // bastırma işaretleri
    ctx.beginPath(); ctx.moveTo(11.6, 7.0); ctx.lineTo(12.4, 5.6); ctx.moveTo(13.4, 7.9); ctx.lineTo(14.8, 6.9);
    ctx.moveTo(14.8, 9.2); ctx.lineTo(16.4, 8.9); ctx.stroke();
  }
  function picActivate(ctx) {       // aktivasyon kartı → telefon (onay)
    pen(ctx);
    // kart
    ctx.save(); ctx.translate(0.6, 6.4); ctx.rotate(-8 * D2R);
    rr(ctx, 0, 0, 8.2, 5.4, 0.7); ctx.fillStyle = C.Y; ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.K100; rr(ctx, 1.0, 3.0, 4.6, 1.3, 0.3); ctx.fill();       // kazı-kazan alanı
    ctx.beginPath(); ctx.moveTo(1.0, 1.4); ctx.lineTo(5.6, 1.4); ctx.stroke();
    ctx.restore();
    // telefon
    ctx.save(); ctx.translate(10.6, 0.6);
    pen(ctx); rr(ctx, 0, 0, 7.4, 14.0, 1.3); ctx.fillStyle = C.Y; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.8, 1.2); ctx.lineTo(4.6, 1.2); ctx.stroke();
    ctx.fillStyle = C.K100; ctx.beginPath(); ctx.arc(3.7, 7.0, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(2.6, 7.0); ctx.lineTo(3.4, 7.8); ctx.lineTo(4.9, 6.1); ctx.stroke();
    ctx.restore();
    // tarama yayı
    pen(ctx, 0.35); ctx.setLineDash([0.6, 0.6]);
    ctx.beginPath(); ctx.moveTo(8.2, 5.4); ctx.quadraticCurveTo(9.2, 3.2, 10.2, 3.8); ctx.stroke(); ctx.setLineDash([]);
  }

  // ============================================================ YANLAR
  function vertical(ctx, w, cy, fn) { ctx.save(); ctx.translate(w / 2, cy); ctx.rotate(-Math.PI / 2); fn(); ctx.restore(); }
  function sideLeft(ctx, w, h) {
    ctx.save(); clipRect(ctx, 0, 0, w, h);
    const s = 7.4, t1 = 'KİŞİSEL ', t2 = 'QR';
    vertical(ctx, w, 60, () => {
      const a = tw(ctx, t1, s, 800, OUT), b = tw(ctx, t2, s, 800, OUT), x0 = -(a + b) / 2, by = 0.36 * s;
      tx(ctx, t1, x0, by, { size: s, w: 800, fam: OUT, color: C.W });
      tx(ctx, t2, x0 + a, by, { size: s, w: 800, fam: OUT, color: C.Y });
    });
    // altta küçük logo (dikey, alttan yukarı okunur)
    const lh = 5.6, lw = L.logoWidth(ctx, lh);
    ctx.save(); ctx.translate((w - lh) / 2, h - SAFE - 2); ctx.rotate(-Math.PI / 2);
    L.logo(ctx, 0, 0, lh, C.Y);
    ctx.restore();
    ctx.restore();
  }
  function sideRight(ctx, w, h) {
    ctx.save(); clipRect(ctx, 0, 0, w, h);
    vertical(ctx, w, (h - 8 - 15) * 0.5, () => {
      tx(ctx, 'kisiselqr.com', 0, -0.7, { size: 4.4, w: 700, fam: OUT, color: C.Y, align: 'center' });
      tx(ctx, 'Araç + Dijital Kartvizit', 0, 3.3, { size: 7.5 * PT, w: 600, color: C.W, align: 'center' });
    });
    // lot / tarih kutucuğu: beyaz, laksız, selefonsuz (10 G × 15 Y, alt bigiden 8 mm)
    ctx.fillStyle = C.W; ctx.fillRect((w - 10) / 2, h - 8 - 15, 10, 15);
    ctx.restore();
  }

  // ============================================================ EURO BAŞLIK
  function header(ctx, w, h, holeBottom) {
    const lh = 6, lw = L.logoWidth(ctx, lh);
    L.logo(ctx, (w - lw) / 2, holeBottom + 3.6, lh, C.K100);
  }

  // ============================================================ ana çizim
  function render(ctx, GEO, opts) {
    opts = opts || {};
    const g = L.geom(GEO), { P, yT, yp, gp, dp } = g;
    const px = opts.px || 10;
    ctx.save();
    grounds(ctx, g);
    inPanel(ctx, P.On.x0, yT, gp, yp, 0, (w, h) => front(ctx, w, h, px));
    inPanel(ctx, P.Arka.x0, yT, gp, yp, 0, (w, h) => back(ctx, w, h, px));
    inPanel(ctx, P.Sol.x0, yT, dp, yp, 0, (w, h) => sideLeft(ctx, w, h));
    inPanel(ctx, P.Sag.x0, yT, dp, yp, 0, (w, h) => sideRight(ctx, w, h));
    inPanel(ctx, P.Arka.x0, P.Arka.y0, gp, yT - P.Arka.y0, 0,
      (w, h) => header(ctx, w, h, g.hole1.cy - P.Arka.y0 + g.hole1.h / 2));
    const b2 = P.Baslik2;           // 2. kat 180° katlanır → açınımda ters
    inPanel(ctx, b2.x0, b2.y0, b2.x1 - b2.x0, b2.y1 - b2.y0, 180,
      (w, h) => header(ctx, w, h, (b2.y1 - g.hole2.cy) + g.hole2.h / 2));
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    [P.Arka.p.holes[0], P.Baslik2.p.holes[0]].forEach(hh => { ctx.beginPath(); trace(ctx, hh); ctx.fill(); });
    ctx.restore();
  }

  function ready() {
    const base = T1.ready();
    if (!document.fonts || !document.fonts.load) return base;
    const sample = 'KİŞİSEL QR Nasıl çalışır? numaratöre ğüşıöç';
    const f = [];
    [600, 700, 800].forEach(w => { f.push(document.fonts.load(`${w} 12px Outfit`, sample)); f.push(document.fonts.load(`${w} 12px Archivo`, sample)); });
    return Promise.all([base].concat(f)).catch(() => {});
  }

  window.KQRTasarim2 = {
    meta: { ad: 'Sticker Kahraman', renk: '#FDD309',
            aciklama: 'Ürünün kendisi kahraman: yakın plan ön camda büyük sticker, sarı kaput bandı ve callout\'lu küçük telefon.' },
    render, ready,
  };
})();
