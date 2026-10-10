/* Kişisel QR – araç etiketi (sticker) tasarım konseptleri
 * 4 konsept × 2 yön: dikey 50 × 80 mm, yatay 80 × 50 mm. Çizimler mm koordinatında; sayfa ölçekler.
 * Ortak öğeler tasarim1.js'ten gelir (logo ikonu, gerçek demo QR, palet). Etiketlerdeki QR gerçek ve demo profile gider.
 * Etiket camın içine yapıştırılır: çizimler dışarıdan görünüşü gösterir (üretimde ters baskı, matbaayla netleşecek).
 * Metinlerdeki iddialar koddan doğrulandı (etiketler.html → "Metinlerin dayanağı").
 */
(function () {
  const L = window.KQRTasarim1.lib, C = L.colors;
  const MONT = 'Montserrat, "Arial Black", Arial, sans-serif';
  const INTER = L.FONT;
  const R = 6;          // köşe yarıçapı (mm)
  const QZ = 3;         // QR sessiz bölgesi (modül): standart 4, telefonlar 2'de de okur; kart kenarı en az 3 modül
  const OLCU = { dikey: [50, 80], yatay: [80, 50] };
  const BOZ = '#C9CCD1';  // siyah zeminde ikincil metin (açık gri)

  // ------------------------------------------------------------ yazı
  function mf(ctx, size, w, fam) { ctx.font = `${w || 800} ${size}px ${fam || MONT}`; }
  function en(ctx, s, size, w, fam) { mf(ctx, size, w, fam); return ctx.measureText(s).width; }
  // satırların en genişini maxW'ye sığdıran punto (üst sınır maxS)
  function sigdir(ctx, satirlar, maxW, maxS, w, fam) {
    const m = Math.max(...satirlar.map(s => en(ctx, s, 10, w, fam)));
    return Math.min(maxS, 10 * maxW / m);
  }
  // büyük harf yüksekliği (mm / punto): Montserrat 0,70, Inter 0,727
  const capOran = fam => (fam === INTER ? 0.727 : 0.70);
  // Dikey blok: öğeleri [y0, y1] aralığında büyük harf yüksekliğine göre ortalar.
  // öğe: { s, size, renk, w, fam, sonra (sonraki öğeyle boşluk, mm), align, x }
  function blok(ctx, ogeler, cx, y0, y1) {
    const cap = o => o.size * capOran(o.fam);
    const top = ogeler.reduce((a, o, i) => a + cap(o) + (i < ogeler.length - 1 ? (o.sonra != null ? o.sonra : 1.2) : 0), 0);
    let y = y0 + (y1 - y0 - top) / 2;
    ogeler.forEach(o => {
      y += cap(o);
      mf(ctx, o.size, o.w, o.fam);
      ctx.fillStyle = o.renk; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(o.s, o.x != null ? o.x : cx, y);
      y += o.sonra != null ? o.sonra : 1.2;
    });
  }

  // ------------------------------------------------------------ ortak öğeler
  // Beyaz QR kartı: s kenarlı kare, içinde gerçek demo QR + QZ modül sessiz bölge
  function qrKart(ctx, x, y, s, o) {
    o = o || {};
    const Q = window.KQR_QR_DEMO, n = Q.rows.length, m = s / (n + 2 * QZ);
    L.rr(ctx, x, y, s, s, o.r != null ? o.r : 2.6);
    ctx.fillStyle = C.W; ctx.fill();
    if (o.cerceve) { ctx.lineWidth = o.cerceve; ctx.strokeStyle = o.cerceveRenk || C.K100; ctx.stroke(); }
    L.drawQR(ctx, Q, x + QZ * m, y + QZ * m, n * m, C.K100);
    sonQR = n * m;
  }
  let sonQR = 0;     // son çizilen QR'ın kenarı (mm): sayfada ölçü olarak gösterilir
  // Kamera odak köşeleri (vizör)
  function vizor(ctx, x, y, s, renk, lw, kol) {
    ctx.save();
    ctx.strokeStyle = renk; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
    const r = kol * 0.42;
    [[x, y, 1, 1], [x + s, y, -1, 1], [x, y + s, 1, -1], [x + s, y + s, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * kol); ctx.lineTo(cx, cy + dy * r);
      ctx.quadraticCurveTo(cx, cy, cx + dx * r, cy); ctx.lineTo(cx + dx * kol, cy);
      ctx.stroke();
    });
    ctx.restore();
  }
  // Marka: logo ikonu + "Kişisel QR" (Inter 800), (cx, cy) merkezli. Genişliği döndürür.
  function marka(ctx, cx, cy, h, renk, yaziRenk) {
    const fs = h * 0.78, ara = h * 0.3;
    const w = h + ara + L.tw(ctx, 'Kişisel QR', fs, 800), x = cx - w / 2;
    L.logoIcon(ctx, x, cy - h / 2, h, renk);
    L.txt(ctx, 'Kişisel QR', x + h + ara, cy + 0.36 * fs, { size: fs, w: 800, color: yaziRenk || renk });
    return w;
  }
  // Küçük logo + adres: "▣ kisiselqr.com"
  function adres(ctx, cx, cy, h, renk, yaziRenk) {
    const fs = h * 0.9, ara = h * 0.35;
    const w = h + ara + L.tw(ctx, 'kisiselqr.com', fs, 800), x = cx - w / 2;
    L.logoIcon(ctx, x, cy - h / 2, h, renk);
    L.txt(ctx, 'kisiselqr.com', x + h + ara, cy + 0.36 * fs, { size: fs, w: 800, color: yaziRenk || renk });
  }

  // ------------------------------------------------------------ uyarı ikonları (10 × 10 birim, çizgisel)
  // Profil sayfasındaki gerçek uyarı türleri (send_alert.php): car_window, lights_on, wrong_parking, flat_tire
  function ciz0(ctx, renk, lw) {
    ctx.strokeStyle = renk; ctx.fillStyle = renk; ctx.lineWidth = lw || 0.8;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
  }
  const UYARI = {
    cam(ctx, renk) {          // yan cam yarıya inik + aşağı ok
      ciz0(ctx, renk);
      ctx.beginPath(); ctx.moveTo(1, 9); ctx.lineTo(1, 5); ctx.lineTo(4.4, 1.2); ctx.lineTo(9, 1.2); ctx.lineTo(9, 9); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1.4, 6.2); ctx.lineTo(8.6, 6.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, 2.6); ctx.lineTo(6, 4.9); ctx.moveTo(4.9, 3.9); ctx.lineTo(6, 5); ctx.lineTo(7.1, 3.9); ctx.stroke();
    },
    far(ctx, renk) {          // far sembolü: D şekli + ışınlar
      ciz0(ctx, renk);
      ctx.beginPath(); ctx.moveTo(5.6, 1.6); ctx.quadraticCurveTo(9.6, 1.6, 9.6, 5); ctx.quadraticCurveTo(9.6, 8.4, 5.6, 8.4); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); [2.4, 4.0, 5.6, 7.2].forEach(y => { ctx.moveTo(0.5, y + 0.5); ctx.lineTo(4.0, y); }); ctx.stroke();
    },
    park(ctx, renk) {         // P levhası + çapraz çizgi → yanlış park
      ciz0(ctx, renk);
      L.rr(ctx, 1, 1, 8, 8, 1.4); ctx.stroke();
      mf(ctx, 6.2, 900, INTER); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('P', 5, 7.3);
      ctx.beginPath(); ctx.moveTo(1.6, 8.4); ctx.lineTo(8.4, 1.6); ctx.stroke();
    },
    lastik(ctx, renk) {       // basık lastik + jant
      ciz0(ctx, renk);
      ctx.beginPath(); ctx.arc(5, 4.6, 4.0, 0.8 * Math.PI, 2.2 * Math.PI);
      ctx.lineTo(9.2, 8.9); ctx.lineTo(0.8, 8.9); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, 4.9, 2.2, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, 4.9, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); [0, 1, 2, 3, 4].forEach(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        ctx.moveTo(5 + Math.cos(a) * 0.9, 4.9 + Math.sin(a) * 0.9); ctx.lineTo(5 + Math.cos(a) * 2.0, 4.9 + Math.sin(a) * 2.0); }); ctx.stroke();
    },
  };
  function ikon(ctx, ad, x, y, s, renk) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 10, s / 10); UYARI[ad](ctx, renk); ctx.restore();
  }
  const CIPLER = [['cam', 'Cam açık'], ['far', 'Far açık'], ['park', 'Yanlış park'], ['lastik', 'Lastik inik']];

  // ------------------------------------------------------------ 4 konsept
  const TASARIMLAR = [
    {
      id: 'klasik', no: '01', ad: 'Klasik Siyah-Sarı', renk: C.Y,
      metin: ['ARAÇ SAHİBİNE HABER VER', 'Kamerayla okut · uygulama gerekmez'],
      fikir: 'Kutuyla aynı siyah-sarı dil. Üstte marka bandı, ortada büyük QR, sarı alanda kime ve ne yapılacağı.',
      arti: ['Kime ulaşılacağı ilk kelimede belli.', 'Rakiplerin "ulaşmak için okutun" kalıbından çıkar.', 'Kutudaki çizimlerle aynı aile.'],
      risk: ['En güvenli seçenek, en az şaşırtan.'],
      dikey(ctx, w, h) {
        ctx.fillStyle = C.K100; ctx.fillRect(0, 0, w, h);
        marka(ctx, w / 2, 6, 5, C.Y);
        qrKart(ctx, 3, 11.5, 44);
        ctx.fillStyle = C.Y; ctx.fillRect(0, 57.5, w, 16.5);
        const s1 = sigdir(ctx, ['ARAÇ SAHİBİNE'], 40, 5, 900), s2 = sigdir(ctx, ['HABER VER'], 43, 7.4, 900);
        const s3 = sigdir(ctx, ['Kamerayla okut · uygulama gerekmez'], 43, 2.5, 800, INTER);
        blok(ctx, [{ s: 'ARAÇ SAHİBİNE', size: s1, renk: C.K100, w: 900, sonra: 1.3 },
                   { s: 'HABER VER', size: s2, renk: C.K100, w: 900, sonra: 1.6 },
                   { s: 'Kamerayla okut · uygulama gerekmez', size: s3, renk: C.K100, w: 800, fam: INTER }], w / 2, 57.5, 74);
        L.txt(ctx, 'kisiselqr.com', w / 2, 78.1, { size: 2.7, w: 800, color: C.Y, align: 'center' });
      },
      yatay(ctx, w, h) {
        ctx.fillStyle = C.K100; ctx.fillRect(0, 0, w, h);
        qrKart(ctx, 3, 3, 44);
        const x0 = 50, cw = w - x0 - 3, cx = x0 + cw / 2;
        marka(ctx, cx, 6.6, 4.2, C.Y);
        L.rr(ctx, x0, 11.5, cw, 23, 2.4); ctx.fillStyle = C.Y; ctx.fill();
        const s1 = sigdir(ctx, ['ARAÇ SAHİBİNE'], cw - 4, 4, 900), s2 = sigdir(ctx, ['HABER', 'VER'], cw - 4, 7.2, 900);
        blok(ctx, [{ s: 'ARAÇ SAHİBİNE', size: s1, renk: C.K100, w: 900, sonra: 1.5 },
                   { s: 'HABER', size: s2, renk: C.K100, w: 900, sonra: 1.1 },
                   { s: 'VER', size: s2, renk: C.K100, w: 900 }], cx, 11.5, 34.5);
        const s3 = sigdir(ctx, ['uygulama gerekmez'], cw, 2.4, 700, INTER);
        blok(ctx, [{ s: 'Kamerayla okut', size: s3, renk: C.W, w: 700, fam: INTER, sonra: 1.0 },
                   { s: 'uygulama gerekmez', size: s3, renk: C.W, w: 700, fam: INTER }], cx, 35, 42);
        L.txt(ctx, 'kisiselqr.com', cx, 46.2, { size: 2.6, w: 800, color: C.Y, align: 'center' });
      },
    },
    {
      id: 'numara', no: '02', ad: 'Numara Yerine', renk: C.Y,
      metin: ['NUMARA YERİNE KAREKODU OKUT', 'Araç sahibine anında haber ver'],
      fikir: 'Torpidodaki numaratör alışkanlığına doğrudan cevap: numara aramak yerine okut. QR iki satırın arasında; göz yukarıdan aşağı inerken QR\'a çarpar. Sarı zemin uzaktan en çok dikkat çeken renk.',
      arti: ['"Numara yok, bu ne?" şaşkınlığını çözer.', 'Numaratör kullanan herkese tanıdık bir karşılaştırma.'],
      risk: ['Ana cümle amacı değil yöntemi söyler.', 'Numara gizli demez (doğru), ama öyle anlaşılabilir.'],
      dikey(ctx, w, h) {
        ctx.fillStyle = C.Y; ctx.fillRect(0, 0, w, h);
        const s1 = sigdir(ctx, ['NUMARA YERİNE', 'KAREKODU OKUT'], 43, 6, 900);
        blok(ctx, [{ s: 'NUMARA YERİNE', size: s1, renk: C.K100, w: 900 }], w / 2, 2.2, 10.6);
        qrKart(ctx, 3, 11.4, 44, { cerceve: 1.1 });
        blok(ctx, [{ s: 'KAREKODU OKUT', size: s1, renk: C.K100, w: 900, sonra: 2.4 },
                   { s: 'Araç sahibine anında haber ver', size: sigdir(ctx, ['Araç sahibine anında haber ver'], 41, 2.6, 800, INTER), renk: C.K100, w: 800, fam: INTER }],
             w / 2, 55.4, 70.6);
        ctx.fillStyle = C.K100; ctx.fillRect(0, 71.2, w, h - 71.2);
        adres(ctx, w / 2, 75.6, 3, C.Y, C.Y);
      },
      yatay(ctx, w, h) {
        ctx.fillStyle = C.Y; ctx.fillRect(0, 0, w, h);
        qrKart(ctx, 3.5, 3.5, 43, { cerceve: 1.1 });
        const x0 = 49.5, cw = w - x0 - 3, cx = x0 + cw / 2;
        const s1 = sigdir(ctx, ['NUMARA YERİNE'], cw, 3.6, 900), s2 = sigdir(ctx, ['KAREKODU', 'OKUT'], cw, 6.2, 900);
        const s3 = sigdir(ctx, ['anında haber ver'], cw - 2, 2.5, 800, INTER);
        blok(ctx, [{ s: 'NUMARA YERİNE', size: s1, renk: C.K100, w: 900, sonra: 2.2 },
                   { s: 'KAREKODU', size: s2, renk: C.K100, w: 900, sonra: 1.2 },
                   { s: 'OKUT', size: s2, renk: C.K100, w: 900, sonra: 2.4 },
                   { s: 'Araç sahibine', size: s3, renk: C.K100, w: 800, fam: INTER, sonra: 1.0 },
                   { s: 'anında haber ver', size: s3, renk: C.K100, w: 800, fam: INTER }], cx, 3.5, 38.6);
        L.rr(ctx, x0, 40.4, cw, 6.1, 3.05); ctx.fillStyle = C.K100; ctx.fill();
        adres(ctx, cx, 43.45, 2.7, C.Y, C.Y);
      },
    },
    {
      id: 'sorun', no: '03', ad: 'Bir Sorun mu Var?', renk: '#FFFFFF',
      metin: ['BİR SORUN MU VAR?', 'Cam açık · Far açık · Yanlış park · Lastik inik', 'Okut, araç sahibine tek dokunuşla bildir'],
      fikir: 'Okutana neyi bildirebileceğini önceden gösterir. İkonlar profil sayfasındaki gerçek uyarı butonlarından seçildi. Beyaz zemin koyu camda en yüksek kontrast.',
      arti: ['Okutmak için sebep verir; ikonlar dil bilmeyene de anlatır.', 'Okutan kişi sayfada aynı butonları görür: beklenti ile deneyim aynı.'],
      risk: ['En kalabalık tasarım; QR biraz küçülür.', 'Beyaz zemin zamanla kirlenmiş görünebilir.'],
      dikey(ctx, w, h) {
        ctx.fillStyle = C.W; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = C.Y; ctx.fillRect(0, 0, w, 12.4);
        const s1 = sigdir(ctx, ['BİR SORUN', 'MU VAR?'], 40, 5.6, 900);
        blok(ctx, [{ s: 'BİR SORUN', size: s1, renk: C.K100, w: 900, sonra: 1.3 },
                   { s: 'MU VAR?', size: s1, renk: C.K100, w: 900 }], w / 2, 0.6, 12.4);
        // 4 uyarı çipi
        const cw = 10.6, ara = (w - 4 - 4 * cw) / 3, ls = 1.85;
        CIPLER.forEach(([ad, et], i) => {
          const x = 2 + i * (cw + ara), ix = x + (cw - 7.4) / 2;
          L.rr(ctx, ix, 14, 7.4, 7.4, 1.8); ctx.fillStyle = C.K100; ctx.fill();
          ikon(ctx, ad, ix + 1.1, 15.1, 5.2, C.Y);
          const p = et.split(' ');
          L.txt(ctx, p[0], x + cw / 2, 23.9, { size: ls, w: 800, color: C.K100, align: 'center' });
          L.txt(ctx, p[1], x + cw / 2, 26.1, { size: ls, w: 800, color: C.K100, align: 'center' });
        });
        qrKart(ctx, 5, 27.6, 40, { cerceve: 0.9 });
        const s3 = sigdir(ctx, ['araç sahibine tek dokunuşla bildir'], 42, 2.5, 800, INTER);
        blok(ctx, [{ s: 'Okut,', size: s3, renk: C.K100, w: 800, fam: INTER, sonra: 0.9 },
                   { s: 'araç sahibine tek dokunuşla bildir', size: s3, renk: C.K100, w: 800, fam: INTER }], w / 2, 67.6, 74.2);
        ctx.fillStyle = C.K100; ctx.fillRect(0, 75, w, h - 75);
        adres(ctx, w / 2, 77.6, 2.5, C.Y, C.Y);
      },
      yatay(ctx, w, h) {
        ctx.fillStyle = C.W; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = C.Y; ctx.fillRect(0, 0, w, 10.6);
        const s1 = sigdir(ctx, ['BİR SORUN MU VAR?'], w - 10, 6, 900);
        blok(ctx, [{ s: 'BİR SORUN MU VAR?', size: s1, renk: C.K100, w: 900 }], w / 2, 0.4, 10.6);
        qrKart(ctx, 3.5, 12.6, 34.4, { cerceve: 0.9 });
        // sağ sütun: 2 × 2 çip
        const x0 = 41, cw = w - x0 - 3;
        const hw = (cw - 1.6) / 2;
        CIPLER.forEach(([ad, et], i) => {
          const x = x0 + (i % 2) * (hw + 1.6), y = 13 + Math.floor(i / 2) * 9.2;
          L.rr(ctx, x, y, 6.6, 6.6, 1.6); ctx.fillStyle = C.K100; ctx.fill();
          ikon(ctx, ad, x + 1, y + 1, 4.6, C.Y);
          const p = et.split(' ');
          L.txt(ctx, p[0], x + 7.6, y + 2.9, { size: 2.1, w: 800, color: C.K100 });
          L.txt(ctx, p[1], x + 7.6, y + 5.6, { size: 2.1, w: 800, color: C.K100 });
        });
        const s3 = sigdir(ctx, ['araç sahibine tek dokunuşla bildir'], cw, 2.4, 800, INTER);
        blok(ctx, [{ s: 'Okut,', size: s3, renk: C.K100, w: 800, fam: INTER, sonra: 0.9, align: 'left', x: x0 },
                   { s: 'araç sahibine tek dokunuşla bildir', size: s3, renk: C.K100, w: 800, fam: INTER, align: 'left', x: x0 }], 0, 31.6, 38.4);
        L.rr(ctx, x0, 40.4, cw, 6.1, 3.05); ctx.fillStyle = C.K100; ctx.fill();
        adres(ctx, x0 + cw / 2, 43.45, 2.7, C.Y, C.Y);
      },
    },
    {
      id: 'vizor', no: '04', ad: 'Vizör', renk: '#0A0A0A',
      metin: ['OKUT, SAHİBİNE HABER VER', 'Uygulama gerekmez · tek dokunuşla bildir'],
      fikir: 'QR\'ın çevresinde telefon kamerasının odak köşeleri: "kamerayı buraya tut" demeden söyler. Tek büyük fiil: OKUT. Sade, premium.',
      arti: ['Okuma sırası tek: köşeler → OKUT → kime.', 'Gece farla aydınlanınca sarı köşeler ve OKUT öne çıkar.'],
      risk: ['"Sahibine" araç bağlamına dayanır.', 'En kısa metin, en az açıklama.'],
      dikey(ctx, w, h) {
        ctx.fillStyle = C.K100; ctx.fillRect(0, 0, w, h);
        marka(ctx, w / 2, 5.6, 4.4, C.Y, C.W);
        vizor(ctx, 4.6, 10.4, 40.8, C.Y, 1.15, 7);
        qrKart(ctx, 7.2, 13, 35.6, { r: 1.8 });
        const s1 = sigdir(ctx, ['OKUT,'], 38, 9.6, 900), s2 = sigdir(ctx, ['SAHİBİNE', 'HABER VER'], 38, 6, 900);
        const s3 = sigdir(ctx, ['Uygulama gerekmez · tek dokunuşla bildir'], 43, 2.3, 700, INTER);
        blok(ctx, [{ s: 'OKUT,', size: s1, renk: C.Y, w: 900, sonra: 2.1 },
                   { s: 'SAHİBİNE', size: s2, renk: C.W, w: 900, sonra: 1.3 },
                   { s: 'HABER VER', size: s2, renk: C.W, w: 900, sonra: 2.3 },
                   { s: 'Uygulama gerekmez · tek dokunuşla bildir', size: s3, renk: BOZ, w: 700, fam: INTER }], w / 2, 52.4, 75.4);
        L.txt(ctx, 'kisiselqr.com', w / 2, 78.6, { size: 2.3, w: 800, color: C.Y, align: 'center' });
      },
      yatay(ctx, w, h) {
        ctx.fillStyle = C.K100; ctx.fillRect(0, 0, w, h);
        vizor(ctx, 3.4, 3.4, 43.2, C.Y, 1.15, 7);
        qrKart(ctx, 6, 6, 38, { r: 1.8 });
        const x0 = 50, cw = w - x0 - 3, cx = x0 + cw / 2;
        marka(ctx, cx, 6.4, 3.8, C.Y, C.W);
        const s1 = sigdir(ctx, ['OKUT,'], cw, 10, 900), s2 = sigdir(ctx, ['SAHİBİNE', 'HABER VER'], cw, 5, 900);
        const s3 = sigdir(ctx, ['tek dokunuşla bildir'], cw, 2.3, 700, INTER);
        blok(ctx, [{ s: 'OKUT,', size: s1, renk: C.Y, w: 900, sonra: 2.0 },
                   { s: 'SAHİBİNE', size: s2, renk: C.W, w: 900, sonra: 1.2 },
                   { s: 'HABER VER', size: s2, renk: C.W, w: 900, sonra: 2.2 },
                   { s: 'Uygulama gerekmez', size: s3, renk: BOZ, w: 700, fam: INTER, sonra: 0.9 },
                   { s: 'tek dokunuşla bildir', size: s3, renk: BOZ, w: 700, fam: INTER }], cx, 10.8, 42.4);
        L.txt(ctx, 'kisiselqr.com', cx, 46.6, { size: 2.3, w: 800, color: C.Y, align: 'center' });
      },
    },
  ];

  // ------------------------------------------------------------ sahne: araç camı (önizleme, basılmaz)
  function camArka(ctx, W, H, zemin) {
    const g = ctx.createLinearGradient(0, 0, W * 0.6, H);
    if (zemin === 'gece') { g.addColorStop(0, '#0d1219'); g.addColorStop(1, '#05070a'); }
    else { g.addColorStop(0, '#3a4855'); g.addColorStop(0.55, '#222c35'); g.addColorStop(1, '#151b21'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // camın alt kenarında serigrafi (frit) noktaları + siyah bant
    ctx.fillStyle = '#050505'; ctx.fillRect(0, H - 2.2, W, 2.2);
    for (let r = 0; r < 4; r++) {
      const y = H - 3.2 - r * 1.25, rad = 0.5 - r * 0.1;
      for (let x = 0.6 + (r % 2) * 0.62; x < W; x += 1.25) { ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  function camOn(ctx, W, H, zemin) {
    ctx.save();
    ctx.fillStyle = zemin === 'gece' ? 'rgba(2,6,14,0.42)' : 'rgba(40,58,70,0.10)';   // cam tonu (+ gece karanlığı)
    ctx.fillRect(0, 0, W, H);
    // yansıma: çapraz açık şerit
    const g = ctx.createLinearGradient(W * 0.15, 0, W * 0.75, H);
    const a = zemin === 'gece' ? 0.07 : 0.16;
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.38, `rgba(255,255,255,${a})`);
    g.addColorStop(0.47, `rgba(255,255,255,${a * 0.35})`); g.addColorStop(0.56, `rgba(255,255,255,${a * 0.8})`);
    g.addColorStop(0.7, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (zemin === 'gece') {     // sokak lambası yansıması
      const r = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, W * 0.45);
      r.addColorStop(0, 'rgba(255,190,110,0.22)'); r.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ çizim
  // o: { zemin: 'duz' | 'gunduz' | 'gece', pay: kenar boşluğu mm (0 → yalnız etiket, şeffaf köşe), pxmm }
  function ciz(canvas, id, yon, o) {
    o = o || {};
    const d = TASARIMLAR.find(t => t.id === id), [w, h] = OLCU[yon];
    const M = o.pay != null ? o.pay : 9, zemin = o.zemin || 'duz';
    const W = w + 2 * M, H = h + 2 * M, k = o.pxmm || 10;
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = M > 0 && zemin !== 'duz';
    if (cam) camArka(ctx, W, H, zemin);
    ctx.save(); ctx.translate(M, M);
    if (M > 0 && !cam) {      // düz zeminde yumuşak gölge
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.32)'; ctx.shadowBlur = 2.4 * k; ctx.shadowOffsetY = 0.9 * k;
      L.rr(ctx, 0, 0, w, h, R); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
    }
    ctx.save(); L.rr(ctx, 0, 0, w, h, R); ctx.clip();
    d[yon](ctx, w, h);
    ctx.restore();
    if (M > 0 && !cam && id === 'sorun') {   // beyaz etiket açık zeminde seçilsin: önizleme kenarı (basılmaz)
      L.rr(ctx, 0, 0, w, h, R); ctx.lineWidth = 0.12; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
    }
    ctx.restore();
    if (cam) camOn(ctx, W, H, zemin);
    return { W, H, qr: sonQR };
  }

  function ready() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const s = 'ARAÇ SAHİBİNE BİR SORUN MU VAR? Kişisel QR kisiselqr.com ğüşıöç';
    const f = [700, 800, 900].map(w => document.fonts.load(`${w} 12px Montserrat`, s))
      .concat([700, 800, 900].map(w => document.fonts.load(`${w} 12px Inter`, s)));
    return Promise.all(f).catch(() => {});
  }

  window.KQREtiket = { TASARIMLAR, OLCU, ciz, ready };
})();
