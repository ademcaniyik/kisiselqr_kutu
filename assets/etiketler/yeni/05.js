/* Kişisel QR – etiket konsepti 05: Gösterge Paneli
 * Aracın gösterge panelindeki uyarı ışıkları (tell-tale) estetiği: antrasit zemin, siyah "gösterge camı" içinde
 * sarı yanan 4 uyarı ikonu (profil sayfasındaki gerçek uyarılar: car_window, lights_on, wrong_parking, flat_tire),
 * QR "ekran", altta dijital gösterge (LCD) kutusunda adres. Sarı çerçeve (bezel) gece camında etiketi seçilir kılar.
 * Mesaj: "Bir uyarı mı yandı? → okut, sahibine bildir".
 */
(function () {
  const E = window.KQREtiket, Y = E.yardim, L = Y.L, C = Y.C, MONT = Y.MONT, INTER = Y.INTER;

  const ANT = '#1B1E22', ANT2 = '#0E1012';     // antrasit zemin (üst → alt)
  const CAM = '#050607';                       // gösterge camı (iç panel)
  const KONTUR = '#3A3F46';                    // iç panel ince kenar
  const SONUK = '#C9CCD1';                     // ikincil metin (açık gri)
  const R = Y.R;                               // köşe yarıçapı 6 mm
  const BEZ = 2.4, BEZ_LW = 0.7;               // sarı çerçeve: kenardan içeri, kalınlık (dış kenarı 2,05 mm: güvenli pay içinde)

  // ------------------------------------------------------------ yardımcılar
  function zemin(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
    g.addColorStop(0, ANT); g.addColorStop(1, ANT2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // sarı çerçeve (bezel): gece camında etiketin sınırı
    L.rr(ctx, BEZ, BEZ, w - 2 * BEZ, h - 2 * BEZ, R - BEZ);
    ctx.lineWidth = BEZ_LW; ctx.strokeStyle = C.Y; ctx.stroke();
  }
  // Gösterge camı: koyu iç panel + ince kontur + üstte hafif parlama
  function panel(ctx, x, y, w, h, r) {
    L.rr(ctx, x, y, w, h, r); ctx.fillStyle = CAM; ctx.fill();
    ctx.lineWidth = 0.3; ctx.strokeStyle = KONTUR; ctx.stroke();
    ctx.save(); L.rr(ctx, x, y, w, h, r); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h * 0.5);
    ctx.restore();
  }
  // Yanan uyarı ışığı: sarı hale + sarı ikon, (cx, cy) merkezli, s ikon kenarı
  function lamba(ctx, ad, cx, cy, s) {
    const r = s * 0.95, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(253,211,9,0.40)'); g.addColorStop(0.5, 'rgba(253,211,9,0.14)'); g.addColorStop(1, 'rgba(253,211,9,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    Y.ikon(ctx, ad, cx - s / 2, cy - s / 2, s, C.Y);
  }
  // Dijital gösterge (LCD) kutusu: siyah, ince kontur, sarı yazı; solda marka ikonu (logodaki dekoratif QR, okutulmaz)
  function lcd(ctx, x, y, w, h, s, size) {
    panel(ctx, x, y, w, h, Math.min(1.4, h / 2));
    Y.mf(ctx, size, 800, INTER);
    const tw = ctx.measureText(s).width, ic = size * 0.92, ara = size * 0.45;
    const x0 = x + (w - (tw + ic + ara)) / 2, cy = y + h / 2;
    L.logoIcon(ctx, x0, cy - ic / 2, ic, C.Y);
    Y.mf(ctx, size, 800, INTER); ctx.fillStyle = C.Y;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x0 + ic + ara, cy + size * 0.727 / 2);
  }
  // Gösterge ölçeği: ince çentik dizisi (dekor), x0 → x1, y taban; her 5'te biri uzun
  function centik(ctx, x0, x1, y, n, renk) {
    ctx.save(); ctx.strokeStyle = renk; ctx.lineCap = 'butt';
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, uzun = i % 5 === 0;
      ctx.lineWidth = uzun ? 0.32 : 0.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - (uzun ? 1.3 : 0.7)); ctx.stroke();
    }
    ctx.restore();
  }
  // "OKUT" + iki satır kilidi: büyük sarı OKUT, sağında üst üste beyaz iki satır; büyük harf yükseklikleri eşit.
  // (cx, yUst) blok ortası ve üst kenar, maxW genişlik. Toplam büyük harf yüksekliğini döndürür.
  function kilit(ctx, cx, yUst, maxW, sag, o) {
    o = o || {};   // o.olc: çizmeden yalnız yüksekliği döndür
    const ara = o.ara || 1.8, satAra = o.satAra || 0.9;
    // sağ satırların punto/genişlik oranı; OKUT'un büyük harf yüksekliği = 2 × satır + satAra
    const wSag = Math.max(...sag.map(s => Y.en(ctx, s, 10, 900))) / 10;   // genişlik / punto
    const wOk = Y.en(ctx, 'OKUT', 10, 900) / 10;
    // OKUT punto P: cap 0,7P = 2·0,7p + satAra → P = 2p + satAra/0,7 ; genişlik: wOk·P + ara + wSag·p = maxW
    let p = (maxW - ara - wOk * satAra / 0.7) / (2 * wOk + wSag);
    if (o.maxP) p = Math.min(p, o.maxP);
    const P = 2 * p + satAra / 0.7, capP = 0.7 * P, capp = 0.7 * p;
    const tot = wOk * P + ara + wSag * p, x0 = cx - tot / 2;
    if (o.olc) return capP;
    Y.mf(ctx, P, 900); ctx.fillStyle = C.Y; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('OKUT', x0, yUst + capP);
    const xs = x0 + wOk * P + ara;
    Y.mf(ctx, p, 900); ctx.fillStyle = C.W;
    ctx.fillText(sag[0], xs, yUst + capp);
    ctx.fillText(sag[1], xs, yUst + 2 * capp + satAra);
    return capP;
  }

  E.ekle({
    id: 'gosterge', no: '05', ad: 'Gösterge Paneli', renk: ANT,
    metin: ['BİR UYARI MI YANDI?', 'Cam · Far · Park · Lastik (ikonlar)', 'OKUT, SAHİBİNE BİLDİR', 'Uygulama gerekmez (yatay)', 'kisiselqr.com'],
    fikir: 'Her sürücünün tanıdığı dil: gösterge panelinde sarı yanan uyarı ışıkları. Etiketin kendisi küçük bir gösterge paneli; ' +
           'siyah "gösterge camı" içinde profil sayfasındaki 4 gerçek uyarının ikonları yanıyor, QR panelin ekranı, adres marka ikonuyla dijital göstergede. ' +
           'Okuma sırası: uyarı ışıkları → "Bir uyarı mı yandı?" → QR → OKUT, sahibine bildir. Sarı çerçeve gece camında etiketin sınırını çizer. ' +
           'Yatay ayrı kompozisyon: solda dikey ışık sütunu, ortada QR, sağda okuma sütunu; üç sütun QR kartının üst/alt kenarına hizalı.',
    arti: ['00–04\'ten görsel olarak tamamen ayrı: sarı/siyah blok yerine antrasit + yanan ikonlar; otomotiv ürünü gibi durur.',
           'İkonlar sürücülerin zaten bildiği tell-tale dili; okutan kişi sayfada aynı 4 uyarı butonunu görür.',
           '"Bir uyarı mı yandı?" soru kalıbı merak uyandırır, cevabı (OKUT) hemen altında ve en büyük yazı.',
           'Sarı çerçeve ve sarı ikonlar gece, farla aydınlanınca seçilir; koyu zemin gündüz camla bütünleşip "fabrika çıkışı" görünür.'],
    risk: ['Koyu zemin uzaktan, gündüz koyu camda 01/02 kadar dikkat çekmez; dikkat yükü sarı çerçeve ve ikonlarda.',
           'Hale (glow) ve antrasit geçişi baskıda raster/degrade ister; tek renk serigrafide düz antrasit + düz sarı ikona sadeleşir.',
           'Sarı çerçeve kenardan 2,4 mm içeride (dış kenarı 2,05 mm, güvenli pay içinde); kesim ±0,5 mm kayarsa bir yanda pay görünür biçimde daralır, matbaa toleransıyla netleşmeli.',
           'İkon adları (CAM, FAR, PARK, LASTİK) ve "Uygulama gerekmez" 2,2–2,3 mm: yakından okunur, uzaktan yalnız ikonlar ve OKUT seçilir.',
           'Dikeyde "Uygulama gerekmez" yer almıyor (yer yok); bu bilgi yalnız yatayda.',
           'Adres göstergesindeki marka ikonu logodaki dekoratif QR deseni; QR\'ın yanında küçük de olsa ikinci bir "kod" gibi görünebilir (okutulmaz; ≈2,4 mm, gerçek QR ≈33 mm).',
           '"Uyarı yandı" mecazı; ikonlar araç sahibinin göstergesi sanılabilir, ama "sahibine bildir" ile anlam kapanır.'],

    // ---------------------------------------------------------- dikey 50 × 80
    dikey(ctx, w, h) {
      zemin(ctx, w, h);
      // gösterge camı: 4 uyarı ışığı + kısa adları
      // tüm öğeler 40 mm'lik ortak sütunda (QR kartı genişliği): panel, QR, OKUT kilidi, LCD aynı kenarlara yaslı
      const qs = 40, px = (w - qs) / 2, py = 4.0, pw = qs, ph = 11.4;   // py: çerçeve içinde ≥1,25 mm
      panel(ctx, px, py, pw, ph, 2.4);
      const etiket = ['CAM', 'FAR', 'PARK', 'LASTİK'];
      const ls = Math.max(2.2, Y.sigdir(ctx, etiket, pw / 4 - 1.6, 2.3, 800, INTER));
      Y.CIPLER.forEach(([ad], i) => {
        const cx = px + pw * (i + 0.5) / 4;
        lamba(ctx, ad, cx, py + 4.4, 5.4);
        Y.mf(ctx, ls, 800, INTER); ctx.fillStyle = SONUK; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(etiket[i], cx, py + ph - 1.3);
      });
      // başlık
      const s1 = Y.sigdir(ctx, ['BİR UYARI MI YANDI?'], qs, 4.4, 900);   // QR sütunu genişliğinde
      Y.blok(ctx, [{ s: 'BİR UYARI MI YANDI?', size: s1, renk: C.W, w: 900 }], w / 2, py + ph + 0.3, py + ph + 5.9);
      // QR ekranı
      const qy = py + ph + 6.4;
      Y.qrKart(ctx, px, qy, qs, { r: 2.2 });
      // dijital gösterge: adres; alt pay üst payla simetrik (panel üstü py), LCD alta yaslı
      const lh = 4.9, ly = h - py - lh;
      // OKUT kilidi: QR sütunu genişliğinde, QR alt kenarı ile LCD arasında dikey ortalı
      const ko = { ara: 1.6, satAra: 0.8 }, kSag = ['SAHİBİNE', 'BİLDİR'];
      const kh = kilit(ctx, w / 2, 0, qs, kSag, Object.assign({ olc: true }, ko));
      kilit(ctx, w / 2, qy + qs + (ly - qy - qs - kh) / 2, qs, kSag, ko);
      lcd(ctx, px + 3, ly, qs - 6, lh, 'kisiselqr.com', 2.6);
    },

    // ---------------------------------------------------------- yatay 80 × 50
    // Gösterge paneli düzeni: solda dikey uyarı ışıkları sütunu, ortada QR ekranı, sağda okuma (başlık, OKUT, LCD).
    yatay(ctx, w, h) {
      zemin(ctx, w, h);
      // ızgara: üç sütun (ışıklar, QR, okuma) QR kartının üst ve alt kenarına hizalı
      const m = 4.0, qs = 39, gy = (h - qs) / 2;   // m: çerçeve içinde ≥1,25 mm
      // sol: uyarı ışıkları sütunu
      const sw = 10.6, sh = qs;
      panel(ctx, m, gy, sw, sh, 2.4);
      const etiket = ['CAM', 'FAR', 'PARK', 'LASTİK'];
      const ls = Math.max(2.2, Y.sigdir(ctx, etiket, sw - 1.4, 2.3, 800, INTER));
      Y.CIPLER.forEach(([ad], i) => {
        const cy = gy + sh * (i + 0.5) / 4, cx = m + sw / 2;
        lamba(ctx, ad, cx, cy - 1.4, 4.8);
        Y.mf(ctx, ls, 800, INTER); ctx.fillStyle = SONUK; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(etiket[i], cx, cy + 3.7);
      });
      // orta: QR ekranı
      const qx = m + sw + 2.0, qy = gy;
      Y.qrKart(ctx, qx, qy, qs, { r: 2.2 });
      // sağ: okuma sütunu
      const x0 = qx + qs + 2.2, cw = w - m - x0, cx = x0 + cw / 2;
      // tek yığın: başlık → (çentik ölçeği) → OKUT → SAHİBİNE BİLDİR → uygulama gerekmez; LCD'nin üstündeki alanda dikey ortalı
      const lh = 5.4, ly = qy + qs - lh;
      const s1 = Y.sigdir(ctx, ['BİR UYARI', 'MI YANDI?'], cw, 4.0, 900);
      const so = Y.sigdir(ctx, ['OKUT'], cw, 9, 900), s2 = Y.sigdir(ctx, ['SAHİBİNE', 'BİLDİR'], cw, 3.6, 900);
      const s3 = Math.max(2.2, Y.sigdir(ctx, ['Uygulama', 'gerekmez'], cw, 2.4, 700, INTER));
      const BOS = 4.4;    // başlık ile OKUT arası: çentik ölçeği bu boşluğun ortasında
      const og = [{ s: 'BİR UYARI', size: s1, renk: C.W, w: 900, sonra: 1.1 },
                  { s: 'MI YANDI?', size: s1, renk: C.W, w: 900, sonra: BOS },
                  { s: 'OKUT', size: so, renk: C.Y, w: 900, sonra: 1.6 },
                  { s: 'SAHİBİNE', size: s2, renk: C.W, w: 900, sonra: 0.9 },
                  { s: 'BİLDİR', size: s2, renk: C.W, w: 900, sonra: 2.0 },
                  { s: 'Uygulama', size: s3, renk: SONUK, w: 700, fam: INTER, sonra: 0.8 },
                  { s: 'gerekmez', size: s3, renk: SONUK, w: 700, fam: INTER }];
      // yığın QR'ın üst kenarından LCD'ye kadar tam yayılır (başlık üstü QR üstüyle hizalı):
      // artan boşluk başlık–OKUT (çentik) ve BİLDİR–"Uygulama" aralıklarına eşit bölünür
      const y0 = qy, y1 = ly - 1.6;
      const capOf = o => o.size * (o.fam === INTER ? 0.727 : 0.70);
      const top = og.reduce((a, o, i) => a + capOf(o) + (i < og.length - 1 ? o.sonra : 0), 0);
      const fazla = Math.max(0, (y1 - y0) - top) / 2;
      og[1].sonra += fazla; og[4].sonra += fazla;
      Y.blok(ctx, og, cx, y0, y1);
      const tAlt = y0 + capOf(og[0]) + og[0].sonra + capOf(og[1]);
      centik(ctx, x0 + 0.4, x0 + cw - 0.4, tAlt + og[1].sonra / 2 + 0.65, 20, '#5A6068');
      lcd(ctx, x0, ly, cw, lh, 'kisiselqr.com', Math.min(2.5, Y.sigdir(ctx, ['kisiselqr.com'], cw - 4.2, 2.5, 800, INTER)));
    },
  });
})();
