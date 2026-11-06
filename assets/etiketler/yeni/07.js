/* 07 · OKUT: dev tipografi afişi. Etiketin kendisi tek kelime; O harfi QR'ın çerçevesi.
 * O = kalın siyah yuvarlatılmış kare halka, içi beyaz QR kartı (gerçek demo QR, 3 modül sessiz bölge).
 * Dikey: O üstte tam genişlik, KUT altında aynı genişliğe yaslı; altta siyah bantta (2 mm içeride) kime / ne + adres.
 * Yatay: O solda tam yükseklik, K-U-T sağında üst üste dizili (O'nun üst ve alt çizgisine oturan ızgara),
 *        en sağda siyah dikey bantta (2 mm içeride) kime / ne + adres (aşağıdan yukarı okunur).
 */
(function () {
  const E = window.KQREtiket, Y = E.yardim, L = Y.L, C = Y.C;
  const { INTER, BOZ, mf, sigdir, blok, qrKart, adres } = Y;

  const CAP = 0.70;   // Montserrat büyük harf yüksekliği / punto
  const AKSAN = 0.24; // İ noktası / Ç çengeli: büyük harf çizgisinin üstüne (altına) taşma ≈ punto × 0,24
  // KUT harflerinin kalınlığı: 800 → gövde ≈ 4 mm, O halkasıyla (T = 4) aynı; 900'de 5 mm olup O'yu "çerçeve" gibi ayırıyordu
  const KW = 800;
  // Tek harfin mürekkep ölçüsü → { sol, gen }
  function murekkep(ctx, s, size) {
    mf(ctx, size, KW); const m = ctx.measureText(s);
    return { sol: m.actualBoundingBoxLeft, gen: m.actualBoundingBoxLeft + m.actualBoundingBoxRight };
  }
  // Harfleri yan yana dizer: mürekkep x..x+gen aralığına yaslı (harf arası eşit). yUst = büyük harf üst çizgisi.
  function yasli(ctx, harfler, x, yUst, gen, renk, araOran) {
    const ar = araOran != null ? araOran : 0.06;
    const top10 = harfler.reduce((a, s) => a + murekkep(ctx, s, 10).gen, 0);
    const size = 10 * gen / (top10 + 10 * ar * (harfler.length - 1));
    const k = harfler.map(s => Object.assign({ s }, murekkep(ctx, s, size)));
    const ara = (gen - k.reduce((a, o) => a + o.gen, 0)) / (k.length - 1);
    mf(ctx, size, KW); ctx.fillStyle = renk; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    let cx = x;
    k.forEach(o => { ctx.fillText(o.s, cx + o.sol, yUst + size * CAP); cx += o.gen + ara; });
    return { size, cap: size * CAP, ara };
  }
  // O harfi: siyah halka (kalınlık t) + içinde beyaz QR kartı. Dış köşe ro büyük, iç köşe ri küçük (halka köşegende
  // ≈ 2,3 mm'ye incelir, kenarlarda t). ri küçük tutulur: 38 mm kartta sessiz bölge 3,3 mm; r = 9 köşeyi köşegende 2,6 mm kesiyor ve
  // küçük ölçekte (k=6) okuyucu sağ alt köşeyi siyah halkayla karıştırıyordu. r = 5 → 1,5 mm kesik, 1,8 mm beyaz kalır.
  function halka(ctx, x, y, s, t, ro, ri) {
    L.rr(ctx, x, y, s, s, ro); ctx.fillStyle = C.K100; ctx.fill();
    qrKart(ctx, x + t, y + t, s - 2 * t, { r: ri });
  }

  E.ekle({
    id: 'okut', no: '07', ad: 'OKUT', renk: '#FDD309',
    metin: ['OKUT', 'ARAÇ SAHİBİNE HABER VER', 'kisiselqr.com'],
    fikir: 'Etiket tek bir kelime: OKUT. O harfi QR\'ın çerçevesi; ne yapılacağı ile nereye bakılacağı aynı yerde. ' +
      'Poster dili: sarı zemin, dev siyah harfler, kenardan kenara ızgara (O ile KUT aynı genişliğe / yüksekliğe yaslı). ' +
      'Siyah bant sonucu söyler: araç sahibine haber ver. Okutan için uygulama gerekmez, sayfa tarayıcıda açılır; bu yüzden tek fiil yeter.',
    arti: ['Uzaktan tek bir şey okunur: OKUT. Camdaki cümle kalabalığı etiketlerden ve 00–04\'ten belirgin biçimde ayrışır.',
      'QR harfin içinde: tipografi QR\'a binmez, beyaz kart ve 3 modül sessiz bölge korunur; kartın köşesi sessiz bölgeyi yalnız 1,5 mm keser, QR\'ı kesmez.',
      'Metin en aza indi: OKUT + kime + adres. Yanlış anlaşılacak iddia (gizlilik, anındalık, su geçirmezlik) yok.',
      'Sarı-siyah tam kontrast; gece camında da ilk görünen sarı blok ve siyah harfler.'],
    risk: ['"O" harfinin QR olduğu ilk bakışta herkese geçmeyebilir; kelime "KUT" diye okunabilir.',
      'Siyah halka yer kapladığı için QR kartı 38 mm (QR ≈ 31,5 mm); 00–04\'teki 44 mm karttan küçük. Uzak okumada daha az pay.',
      'Yatayda alt satır 90° döndürülmüş; okumak için baş eğmek gerekir.',
      'Yatayda sağ banttaki yazı küçük (≈ 3,4 punto) ve döndürülmüş; asıl mesajı OKUT taşır, bant ikincil.',
      'Hangi uyarıların gönderilebileceğini (cam, far, park, lastik) göstermez.'],
    // Siyah bant kenara taşmaz: dört yanda 2 mm sarı pay, köşesi etiket köşesiyle eş merkezli (r = 6 − 2). Gece koyu camda
    // etiketin dış hattı sarı kalır (tam taşan bant camla birleşiyordu); yatayda adres kenara 0,9 mm yaklaşıyordu.
    dikey(ctx, w, h) {
      ctx.fillStyle = C.Y; ctx.fillRect(0, 0, w, h);
      const m = 2, S = w - 2 * m, T = 4, G = 2.4;
      halka(ctx, m, m, S, T, 13, 5);
      const yK = m + S + G;
      const kut = yasli(ctx, ['K', 'U', 'T'], m, yK, S, C.K100);
      const yb = yK + kut.cap + G, bh = h - m - yb;
      L.rr(ctx, m, yb, S, bh, 4); ctx.fillStyle = C.K100; ctx.fill();
      const s1 = sigdir(ctx, ['ARAÇ SAHİBİNE HABER VER'], S - 4, 5, 900);
      // ana satır + adres (logo ikonu yüksekliği) birlikte bantta dikey ortalı; İ noktası payı üstte
      const ah = 2.6, ara = 1.9, a = s1 * AKSAN, top = a + s1 * CAP + ara + ah;
      const y0 = yb + (bh - top) / 2 + a;
      blok(ctx, [{ s: 'ARAÇ SAHİBİNE HABER VER', size: s1, renk: C.Y, w: 900 }], w / 2, y0, y0 + s1 * CAP);
      adres(ctx, w / 2, y0 + s1 * CAP + ara + ah / 2, ah, C.Y, BOZ);
    },
    yatay(ctx, w, h) {
      ctx.fillStyle = C.Y; ctx.fillRect(0, 0, w, h);
      const m = 2, S = h - 2 * m, T = 4, G = 2.0;
      halka(ctx, m, m, S, T, 13, 5);
      // K, U, T üst üste: üç büyük harf + iki aralık = O'nun yüksekliği
      const ara = 2.3, cap = (S - 2 * ara) / 3, size = cap / CAP, x0 = m + S + G;
      const k = ['K', 'U', 'T'].map(s => Object.assign({ s }, murekkep(ctx, s, size)));
      const kw = Math.max(...k.map(o => o.gen));
      mf(ctx, size, KW); ctx.fillStyle = C.K100; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      k.forEach((o, i) => ctx.fillText(o.s, x0 + (kw - o.gen) / 2 + o.sol, m + i * (cap + ara) + cap));
      // sağ siyah bant (2 mm içeride): döndürülmüş yazı, aşağıdan yukarı. Döndürülmüş çerçevede y artışı = sağa.
      const xb = x0 + kw + G, bw = w - m - xb;
      L.rr(ctx, xb, m, bw, S, 4); ctx.fillStyle = C.K100; ctx.fill();
      ctx.save(); ctx.translate(xb + bw / 2, h / 2); ctx.rotate(-Math.PI / 2);
      const ah = 2.45;                    // adres ikon yüksekliği; yazı puntosu ah × 0,9 = 2,2
      const g1 = 0.9, g2 = 1.3, pad = 1.0;
      // iki satır + adres, İ noktası payıyla birlikte bant genişliğine (bw − 2·pad) sığar
      const s1 = Math.min(sigdir(ctx, ['SAHİBİNE', 'HABER VER'], S - 8, 4.0, 900),
        (bw - 2 * pad - g1 - g2 - ah) / (2 * CAP + AKSAN));
      const a = s1 * AKSAN, top = a + 2 * s1 * CAP + g1 + g2 + ah;
      const y0 = -top / 2 + a;
      blok(ctx, [{ s: 'SAHİBİNE', size: s1, renk: C.Y, w: 900, sonra: g1 },
                 { s: 'HABER VER', size: s1, renk: C.Y, w: 900 }], 0, y0, y0 + 2 * s1 * CAP + g1);
      adres(ctx, 0, y0 + 2 * s1 * CAP + g1 + g2 + ah / 2, ah, C.Y, BOZ);
      ctx.restore();
    },
  });
})();
