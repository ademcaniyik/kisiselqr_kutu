/* 08 · Levha
 * Yol işaretlerinin dilinden ilham: sarı levha + içten siyah bordür, siyah "yön levhası" (ucu QR'ı gösteren ok biçimli
 * plaka) üzerinde OKUT, dolu piktogram kutusunda bildirim zili + HABER VER, tabanda sarı-siyah çapraz şerit.
 * QR levhanın "bilgi paneli". Resmî bir levhanın kopyası değil: renkler marka sarısı/siyahı, piktogramlar
 * (vizörlü telefon, bildirim zili) Kişisel QR'a özgü.
 * Okuma sırası: OKUT (ok QR'ı gösterir) → QR → HABER VER → kime (araç sahibine).
 */
(function () {
  const E = window.KQREtiket, Y = E.yardim, L = Y.L, C = Y.C, INTER = Y.INTER;
  const RR = 4.5;                   // levha köşe yarıçapı (mm)
  const BI = 2.35, BLW = 0.7;       // bordür: çizgi ekseni kenardan içeri, çizgi kalınlığı (dış kenarı kesimden 2 mm içeride)
  const IC = BI + BLW / 2;          // bordürün iç kenarı

  // ------------------------------------------------------------ levha zemini + bordür
  function zemin(ctx, w, h) { ctx.fillStyle = C.Y; ctx.fillRect(0, 0, w, h); }
  function bordur(ctx, w, h) {
    L.rr(ctx, BI, BI, w - 2 * BI, h - 2 * BI, RR - BI);
    ctx.lineWidth = BLW; ctx.strokeStyle = C.K100; ctx.stroke();
  }
  function icYol(ctx, w, h) { L.rr(ctx, IC, IC, w - 2 * IC, h - 2 * IC, RR - IC); }

  // Sarı-siyah çapraz şerit: [x, y, bw, bh] kutusu, bordürün içine kırpılır
  function serit(ctx, w, h, x, y, bw, bh, adim) {
    ctx.save();
    icYol(ctx, w, h); ctx.clip();
    ctx.beginPath(); ctx.rect(x, y, bw, bh); ctx.clip();
    ctx.fillStyle = C.Y; ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = C.K100; ctx.beginPath();
    for (let s = x - bh - adim; s < x + bw + adim; s += 2 * adim) {
      ctx.moveTo(s, y + bh); ctx.lineTo(s + adim, y + bh); ctx.lineTo(s + adim + bh, y); ctx.lineTo(s + bh, y); ctx.closePath();
    }
    ctx.fill();
    // şeridin üst kenarında ince siyah çizgi: levha içinde ayrı bir taban bandı gibi okunur
    ctx.fillRect(x, y, bw, 0.45);
    ctx.restore();
  }
  // Şeridin üstünde siyah hap içinde logo + adres (hh ≥ 4,08 → adres punto ≥ 2,2 mm).
  // Sarı dış çizgi (kl): hap siyah şeritlerle kaynaşmasın, şeridin üstünde ayrı bir etiket gibi okunsun.
  function adresHap(ctx, cx, cy, hh, kl) {
    const ih = hh * 0.6, fs = ih * 0.9, ara = ih * 0.35;
    const tw = ih + ara + L.tw(ctx, 'kisiselqr.com', fs, 800), pw = tw + hh * 1.1;
    if (kl) { L.rr(ctx, cx - pw / 2 - kl, cy - hh / 2 - kl, pw + 2 * kl, hh + 2 * kl, hh / 2 + kl); ctx.fillStyle = C.Y; ctx.fill(); }
    L.rr(ctx, cx - pw / 2, cy - hh / 2, pw, hh, hh / 2); ctx.fillStyle = C.K100; ctx.fill();
    Y.adres(ctx, cx, cy, ih, C.Y, C.Y);
  }

  // ------------------------------------------------------------ yön levhası (ok biçimli plaka)
  // Gövde [x, y, bw, bh] + uc uzunluğunda sivri uç; yon 'asagi' (uç alt kenarın ortasında) | 'sol' (uç sol kenarın ortasında)
  function plakaYol(ctx, x, y, bw, bh, uc, yon) {
    ctx.beginPath();
    if (yon === 'asagi') {
      ctx.moveTo(x, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + bh);
      ctx.lineTo(x + bw / 2, y + bh + uc); ctx.lineTo(x, y + bh);
    } else {
      ctx.moveTo(x, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + bh);
      ctx.lineTo(x, y + bh); ctx.lineTo(x - uc, y + bh / 2);
    }
    ctx.closePath();
  }
  // Siyah plaka + içte sarı bordür çizgisi (levha dili). Köşeler hafif yuvarlak.
  // [x, y, bw, bh] ve uc dış ölçüdür: yuvarlatma konturu dışa taşar, yol yr kadar içeriden çizilir.
  function plaka(ctx, x, y, bw, bh, uc, yon) {
    const yr = 0.55, ic = 0.75, lw = 0.4;    // köşe yuvarlatma, iç çizginin kenardan uzaklığı, kalınlığı
    if (yon === 'asagi') { x += yr; y += yr; bw -= 2 * yr; bh -= 2 * yr; uc -= 0.3; }
    else { x += yr * 1.6; y += yr; bw -= yr * 2.6; bh -= 2 * yr; }
    ctx.save();
    ctx.lineJoin = 'round';
    plakaYol(ctx, x, y, bw, bh, uc, yon);
    ctx.fillStyle = C.K100; ctx.fill();
    ctx.lineWidth = 2 * yr; ctx.strokeStyle = C.K100; ctx.stroke();       // yuvarlak köşe (dışa yr taşar)
    // iç çizgi: şekle kırpılmış iki kalın kontur (sarı ic+lw, üstüne siyah ic) → içeride lw kalınlıkta sarı bant
    plakaYol(ctx, x, y, bw, bh, uc, yon); ctx.clip();
    ctx.lineWidth = 2 * (ic + lw); ctx.strokeStyle = C.Y; ctx.stroke();
    ctx.lineWidth = 2 * ic; ctx.strokeStyle = C.K100; ctx.stroke();
    ctx.restore();
    // kırpılmış konturların kenar yumuşatması dış kenarda ince sarı bir kılcal çizgi bırakıyordu: dış konturu yeniden siyah çiz
    ctx.save(); ctx.lineJoin = 'round';
    plakaYol(ctx, x, y, bw, bh, uc, yon); ctx.lineWidth = 2 * yr; ctx.strokeStyle = C.K100; ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------ piktogramlar (10 × 10 birim, dolu levha üslubu)
  const PIK = {
    telefon(ctx, r, z) {        // telefon + ekranda kamera vizörü ve QR noktası → okut. z: ekran (zemin) rengi
      L.rr(ctx, 2.4, 0.4, 5.2, 9.2, 1.05); ctx.fillStyle = r; ctx.fill();
      L.rr(ctx, 2.98, 1.45, 4.04, 6.7, 0.35); ctx.fillStyle = z; ctx.fill();
      Y.vizor(ctx, 3.45, 3.0, 3.1, r, 0.4, 1.0);
      ctx.fillStyle = r;
      [[0, 0], [1, 1], [0, 2], [2, 0], [2, 2], [1, 0], [2, 1]].forEach(([i, j]) => ctx.fillRect(4.22 + i * 0.55, 3.77 + j * 0.55, 0.5, 0.5));
      ctx.beginPath(); ctx.arc(5, 8.85, 0.36, 0, Math.PI * 2); ctx.fillStyle = z; ctx.fill();
    },
    zil(ctx, r) {               // bildirim zili + titreşim yayları → haber ver
      ctx.fillStyle = r; ctx.strokeStyle = r;
      ctx.beginPath(); ctx.arc(5, 1.55, 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, 1.9);
      ctx.bezierCurveTo(7.1, 1.9, 7.25, 3.7, 7.25, 5.3); ctx.lineTo(7.35, 6.4); ctx.lineTo(8.3, 7.4);
      ctx.lineTo(1.7, 7.4); ctx.lineTo(2.65, 6.4); ctx.lineTo(2.75, 5.3);
      ctx.bezierCurveTo(2.75, 3.7, 2.9, 1.9, 5, 1.9); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(5, 7.95, 0.95, 0, Math.PI); ctx.fill();
      ctx.lineWidth = 0.62; ctx.lineCap = 'round';
      [3.4, 4.6].forEach(rad => {
        ctx.beginPath(); ctx.arc(5, 4.6, rad, -0.30 * Math.PI, 0.02 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(5, 4.6, rad, 0.98 * Math.PI, 1.30 * Math.PI); ctx.stroke();
      });
    },
  };
  function pik(ctx, ad, x, y, s, renk, z) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 10, s / 10); PIK[ad](ctx, renk, z); ctx.restore();
  }
  // Siyah piktogram kutusu (levhadaki sembol paneli) + sarı piktogram
  function kutu(ctx, ad, x, y, s) {
    L.rr(ctx, x, y, s, s, s * 0.16); ctx.fillStyle = C.K100; ctx.fill();
    const p = s * 0.11;
    pik(ctx, ad, x + p, y + p, s - 2 * p, C.Y, C.K100);
  }

  // Plaka içeriği: sarı telefon piktogramı + OKUT, (x0..x1) aralığında ortalı, cy dikey merkez.
  // ps, plakanın sarı iç çizgisinin içinde kalmalı: iç yükseklik = ph − 3,4 mm (telefon gövdesi ps × 0,92).
  function okutYazi(ctx, x0, x1, cy, ps, maxS) {
    const ara = ps * 0.24, fs = Y.sigdir(ctx, ['OKUT'], x1 - x0 - ps - ara, maxS, 900);
    const tw = Y.en(ctx, 'OKUT', fs, 900), gw = ps + ara + tw, gx = (x0 + x1 - gw) / 2;
    pik(ctx, 'telefon', gx, cy - ps / 2, ps, C.Y, C.K100);
    Y.blok(ctx, [{ s: 'OKUT', size: fs, renk: C.Y, w: 900, align: 'left', x: gx + ps + ara }], 0, cy - ps / 2, cy + ps / 2);
  }
  // Zil kutusu + iki satır HABER / VER, (x0..x1) aralığında ortalı (al = 'sol' → x0'a yaslı)
  function haberGrup(ctx, x0, x1, y, ks, al) {
    const ara = ks * 0.2, fs = Y.sigdir(ctx, ['HABER'], x1 - x0 - ks - ara, 7.4, 900);
    const capH = fs * 0.70, gap = ks - 2 * capH;              // iki satır kutu yüksekliğini doldursun
    const fs2 = gap < 1.0 ? (ks - 1.0) / 1.4 : fs;           // satır arası en az 1 mm
    const tw = Y.en(ctx, 'HABER', fs2, 900), gw = ks + ara + tw;
    const gx = al === 'sol' ? x0 : (x0 + x1 - gw) / 2;
    kutu(ctx, 'zil', gx, y, ks);
    const tx = gx + ks + ara, c2 = fs2 * 0.70, g2 = ks - 2 * c2;
    Y.blok(ctx, [{ s: 'HABER', size: fs2, renk: C.K100, w: 900, align: 'left', x: tx, sonra: g2 },
                 { s: 'VER', size: fs2, renk: C.K100, w: 900, align: 'left', x: tx }], 0, y, y + ks);
  }

  E.ekle({
    id: 'levha', no: '08', ad: 'Levha', renk: C.Y, r: RR,
    metin: ['OKUT · HABER VER', 'Araç sahibine tek dokunuşla'],
    fikir: 'Yol levhası dili: sarı levha ve içten siyah bordür, ucu QR\'ı gösteren siyah yön levhasında OKUT, '
      + 'dolu piktogram kutusunda bildirim zili ile HABER VER, tabanda sarı-siyah çapraz şerit. QR levhanın bilgi paneli. '
      + 'Trafikte her gün okunan bir görsel dil olduğu için yazı okunmadan da "buraya bak, okut, haber ver" sırası kurulur. '
      + 'Yatayda yön levhası sola, QR\'a döner: ayrı bir kompozisyon.',
    arti: ['Ok biçimli plaka göze yön verir: ilk bakış OKUT\'a, uç doğrudan QR\'a.',
           'Bordür, yön plakası ve çapraz şerit 00–07\'de yok; araç ve yol bağlamını ilk bakışta kurar.',
           'Telefon ve zil piktogramları dil bilmeyene de "okut, haber ver" der.',
           'Gece farla aydınlanınca sarı levha koyu camda en parlak yüzey olur.'],
    risk: ['Levha görünümü bazılarına resmî bir uyarı gibi gelebilir; bu yüzden renkler ve piktogramlar markaya özgü tutuldu, resmî bir işaret taklit edilmedi.',
           'Zil piktogramı ilk kez gören birine alarm gibi gelebilir; yanındaki HABER VER bunu kapatır.',
           'Bordürün dış kenarı kesimden 2 mm içeride: kesim ±0,5 mm kayarsa sarı pay bir kenarda 1,5, karşıda 2,5 mm olur; matbaayla kesim toleransı konuşulmalı.',
           'Sarı zemin 00/01/02/06/07 ile aynı renk ailesi; ayrışma rengin değil biçimin (bordür, plaka, şerit) işi.'],
    dikey(ctx, w, h) {
      zemin(ctx, w, h);
      const x0 = 5, cw = 40;                                   // ortak sütun: plaka, QR, haber grubu aynı genişlikte
      // 1 · yön levhası: OKUT, uç QR'ı gösterir
      const py = 3.7, ph = 9.0, uc = 3.6;
      plaka(ctx, x0, py, cw, ph, uc, 'asagi');
      okutYazi(ctx, x0 + 2, x0 + cw - 2, py + ph / 2 + 0.3, 5.2, 6.8);   // +0,3: ok ucu altta boşluk açar, göz ortası biraz aşağıda
      // 2 · bilgi paneli: QR
      const qy = py + ph + uc + 0.6;
      Y.qrKart(ctx, x0, qy, cw, { cerceve: 0.8 });
      // 3 · zil + HABER VER, altında kime
      const gy = qy + cw + 1.3, ks = 8.0;
      haberGrup(ctx, x0, x0 + cw, gy, ks);
      const sy = 71.6;
      const s3 = Y.sigdir(ctx, ['Araç sahibine tek dokunuşla'], cw + 2, 2.6, 800, INTER);
      Y.blok(ctx, [{ s: 'Araç sahibine tek dokunuşla', size: s3, renk: C.K100, w: 800, fam: INTER }], w / 2, gy + ks, sy);
      // 4 · taban: çapraz şerit + adres
      serit(ctx, w, h, 0, sy, w, h - sy, 1.9);
      const kl = 0.4, bandH = h - IC - sy - 0.45;           // hap + sarı dış çizgi şerit yüksekliğini tam doldurur
      adresHap(ctx, w / 2, sy + 0.45 + bandH / 2, bandH - 2 * kl, kl);
      bordur(ctx, w, h);
    },
    yatay(ctx, w, h) {
      zemin(ctx, w, h);
      // bilgi paneli: QR solda, dikeyde ortalı
      const qs = 40, qx = 4.3, qy = (h - qs) / 2;
      Y.qrKart(ctx, qx, qy, qs, { cerceve: 0.8 });
      // sağ sütun: sola, QR'a dönen yön levhası
      const uc = 3.0, tip = qx + qs + 1.3, bx = tip + uc, x1 = w - 4.3, ph = 9.4;
      plaka(ctx, bx, qy, x1 - bx, ph, uc, 'sol');
      okutYazi(ctx, bx + 0.4, x1 - 2.6, qy + ph / 2, 5.4, 7.0);
      // zil + HABER VER (sütuna yaslı), altında kime
      const cx0 = tip + 0.6, ks = 8.4, sy = 36.6;
      const s3 = Y.sigdir(ctx, ['Araç sahibine', 'tek dokunuşla'], x1 - cx0, 2.5, 800, INTER);
      const altH = 2 * s3 * 0.727 + 1.0, bos = (sy - (qy + ph) - ks - altH) / 3;   // grup ve alt yazı eşit aralıkla
      const gy = qy + ph + bos;
      haberGrup(ctx, cx0, x1, gy, ks, 'sol');
      Y.blok(ctx, [{ s: 'Araç sahibine', size: s3, renk: C.K100, w: 800, fam: INTER, align: 'left', x: cx0, sonra: 1.0 },
                   { s: 'tek dokunuşla', size: s3, renk: C.K100, w: 800, fam: INTER, align: 'left', x: cx0 }], 0, gy + ks + bos, gy + ks + bos + altH);
      // taban: çapraz şerit (sağ alt) + adres
      const sx = qx + qs + 1.7;
      serit(ctx, w, h, sx, sy, w - sx, h - sy, 1.9);
      adresHap(ctx, (sx + w - IC) / 2, sy + 0.45 + (h - IC - sy - 0.45) / 2, 4.3, 0.4);
      bordur(ctx, w, h);
    },
  });
})();
