/*
 * Kişisel QR Araç Etiketi – Kutu Tasarımı 2 "Tasarım 1 + Yatay Sticker"
 *
 * 23 Kasım (Adem): Tasarım 2, Tasarım 1'in birebir kopyası; tek fark kutuda görünen sticker.
 * Dikey orijinal etiket (50 × 80) yerine Adem'in ilettiği YATAY sticker (80 × 50) kullanılır:
 * siyah zemin, sarı köşe çerçevesi içinde beyaz QR kartı, sağda logo, OKUT, SAHİBİNE HABER VER,
 * "Uygulama gerekmez / tek dokunuşla bildir" ve kisiselqr.com.
 *
 * Çizimin tamamı tasarim1.js'teki olustur(CFG) ile üretilir: Tasarım 1'de yapılan her değişiklik buraya da gelir.
 * Ölçüler referans görselden çıkarıldı (651 × 406 px sticker = 80 × 50 mm, 8,14 px/mm).
 * İçindeki QR gerçek ve demo profile gider (KQR_QR_DEMO, 29 modül, sessiz bölge ≥ 3 modül).
 *
 *   KQRTasarim2.render(ctx, GEO, opts)   ctx önceden mm → px ölçeklenmiş (1 birim = 1 mm)
 *   KQRTasarim2.ready()                  fontlar + görseller
 */
(function () {
  const T1 = window.KQRTasarim1;
  const BASE2 = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');   // assets/tasarim2/
  if (!T1 || !T1.olustur) return;
  const L = T1.lib;
  const SIYAH = '#0B0B0B', SARI = '#FDD309', BEYAZ = '#FFFFFF', SONUK = '#D6D6D6';
  const MONT = 'Montserrat, "Arial Black", Arial, sans-serif';
  const INTER = L.FONT;

  // Yerel ızgara: 80 × 50 mm (sticker'ın gerçek ölçüsü)
  const S = {
    W: 80, H: 50, R: 5.5,
    CER: { x0: 2.95, y0: 2.85, x1: 46.1, y1: 47.1, kol: 7.6, kal: 1.1, r: 1.6 },   // sarı köşe çerçevesi
    KART: { x: 6.0, y: 6.0, s: 37.9, r: 2.4 },                                      // beyaz QR kartı
    QR: { x: 9.3, y: 9.3, s: 31.3 },                                                // 29 modül × 1,08 mm
    SAG: 63.6,                                                                      // sağ sütunun ekseni
  };

  // Genişliğe sığdırılmış metin: hedef genişliğe göre punto bulunur, taban çizgisine yazılır.
  function sigYaz(ctx, s, cx, base, gen, w, fam, renk, maxBoy) {
    ctx.font = `${w} 10px ${fam}`;
    let boy = 10 * gen / ctx.measureText(s).width;
    if (maxBoy) boy = Math.min(boy, maxBoy);
    ctx.font = `${w} ${boy}px ${fam}`;
    ctx.fillStyle = renk; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, cx, base);
    return boy;
  }

  function cerceve(ctx) {
    const c = S.CER, k = c.kal, a = c.kol;
    ctx.save();
    ctx.strokeStyle = SARI; ctx.lineWidth = k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const h = k / 2, x0 = c.x0 + h, y0 = c.y0 + h, x1 = c.x1 - h, y1 = c.y1 - h, r = c.r;
    const kose = (ax, ay, bx, by, cx, cy) => {
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.arcTo(bx, by, cx, cy, r); ctx.lineTo(cx, cy); ctx.stroke();
    };
    kose(x0, y0 + a, x0, y0, x0 + a, y0);
    kose(x1 - a, y0, x1, y0, x1, y0 + a);
    kose(x1, y1 - a, x1, y1, x1 - a, y1);
    kose(x0 + a, y1, x0, y1, x0, y1 - a);
    ctx.restore();
  }

  // Aynı imza Tasarım 1'in sticker'ıyla: (ctx, x, y, w, opts) → yükseklik. opts: yazisiz, edge, shadow, qr
  function yatayStk(ctx, x, y, w, opts) {
    opts = opts || {};
    const k = w / S.W, h = S.H * k;
    ctx.save();
    ctx.translate(x, y); ctx.scale(k, k);
    const dis = () => L.rr(ctx, 0, 0, S.W, S.H, S.R);
    if (opts.shadow) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = opts.shadow; ctx.shadowOffsetY = opts.shadow * 0.35;
      dis(); ctx.fillStyle = SIYAH; ctx.fill(); ctx.restore();
    }
    dis(); ctx.fillStyle = SIYAH; ctx.fill();
    if (opts.edge) {             // koyu zeminde kesim kenarı seçilsin: ince açık kontur (Tasarım 1'deki gibi, ekran px'i)
      ctx.save(); ctx.lineWidth = opts.edge * 80 / 764; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; dis(); ctx.stroke(); ctx.restore();
    }
    cerceve(ctx);
    L.rr(ctx, S.KART.x, S.KART.y, S.KART.s, S.KART.s, S.KART.r); ctx.fillStyle = BEYAZ; ctx.fill();
    L.drawQR(ctx, opts.qr === undefined ? window.KQR_QR_DEMO : opts.qr, S.QR.x, S.QR.y, S.QR.s, '#000000');
    if (opts.yazisiz) {          // çok küçük çizimde yazılar gri leke olur: yalnız OKUT bloğunun izi
      ctx.fillStyle = SARI; ctx.fillRect(S.SAG - 13, 16, 26, 5.6);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(S.SAG - 11, 24, 22, 2.6); ctx.fillRect(S.SAG - 13, 28.2, 26, 2.6);
      ctx.restore(); return h;
    }
    // logo: sarı ikon + beyaz "Kişisel QR"
    const ly = 4.4, lh = 3.7;
    L.logoIcon(ctx, 53.7, ly, lh, SARI);
    ctx.font = `800 10px ${INTER}`;
    const lb = 10 * 14.8 / ctx.measureText('Kişisel QR').width;
    ctx.font = `800 ${lb}px ${INTER}`; ctx.fillStyle = BEYAZ; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Kişisel QR', 53.7 + lh + 1.0, ly + lh / 2 + lb * 0.36);
    // yazı bloğu
    sigYaz(ctx, 'OKUT', S.SAG, 21.95, 26.5, 900, MONT, SARI);
    sigYaz(ctx, 'SAHİBİNE', S.SAG, 26.8, 22.0, 800, MONT, BEYAZ);
    sigYaz(ctx, 'HABER VER', S.SAG, 31.0, 26.7, 800, MONT, BEYAZ);
    sigYaz(ctx, 'Uygulama gerekmez', S.SAG, 35.05, 22.6, 600, INTER, SONUK);
    sigYaz(ctx, 'tek dokunuşla bildir', S.SAG, 37.55, 21.9, 600, INTER, SONUK);
    sigYaz(ctx, 'kisiselqr.com', S.SAG, 46.45, 15.0, 800, MONT, SARI);
    ctx.restore();
    return h;
  }

  // Mağaza rozetleri (24 Kasım, Adem): resmi rozetlerdeki "İndirin" yazıları orantısız duruyordu, istenmedi.
  // İki rozet aynı ölçüde ve aynı düzende: siyah zemin, gri kontur, solda logo (Apple: resmi rozetteki yol,
  // Google: resmi rozetteki renkli Play ikonu), sağda tek satır ve aynı puntoda mağaza adı.
  const ELMA = ['M24.76888,20.30068a4.94881,4.94881,0,0,1,2.35656-4.15206,5.06566,5.06566,0,0,0-3.99116-2.15768c-1.67924-.17626-3.30719,1.00483-4.1629,1.00483-.87227,0-2.18977-.98733-3.6085-.95814a5.31529,5.31529,0,0,0-4.47292,2.72787c-1.934,3.34842-.49141,8.26947,1.3612,10.97608.9269,1.32535,2.01018,2.8058,3.42763,2.7533,1.38706-.05753,1.9051-.88448,3.5794-.88448,1.65876,0,2.14479.88448,3.591.8511,1.48838-.02416,2.42613-1.33124,3.32051-2.66914a10.962,10.962,0,0,0,1.51842-3.09251A4.78205,4.78205,0,0,1,24.76888,20.30068Z', 'M22.03725,12.21089a4.87248,4.87248,0,0,0,1.11452-3.49062,4.95746,4.95746,0,0,0-3.20758,1.65961,4.63634,4.63634,0,0,0-1.14371,3.36139A4.09905,4.09905,0,0,0,22.03725,12.21089Z'];
  const ELMA_KUTU = { x0: 10.0, x1: 27.65, y0: 8.75, y1: 30.45 };   // yolların sınırı (rozet SVG birimi)
  const PLAY_KUTU = [48, 63, 110, 124];                             // rozet PNG'sinde Play ikonu (px)
  function rozetCiz(ctx, o) {
    const bh = o.h, bw = o.w, r = bh * 0.17, ih = bh * 0.56, pad = bh * 0.36, ara = bh * 0.3;
    const rozet = (y, ikon, ad) => {
      L.rr(ctx, o.x, y, bw, bh, r); ctx.fillStyle = '#0A0A0A'; ctx.fill();
      ctx.lineWidth = 0.25; ctx.strokeStyle = '#A6A6A6'; L.rr(ctx, o.x + 0.125, y + 0.125, bw - 0.25, bh - 0.25, r - 0.1); ctx.stroke();
      const iw = ikon(o.x + pad, y + (bh - ih) / 2);
      return { tx: o.x + pad + iw + ara, y };
    };
    const elma = (x, y) => {
      const k = ih / (ELMA_KUTU.y1 - ELMA_KUTU.y0);
      ctx.save(); ctx.translate(x - ELMA_KUTU.x0 * k, y - ELMA_KUTU.y0 * k); ctx.scale(k, k);
      ctx.fillStyle = '#FFFFFF'; ELMA.forEach(d => ctx.fill(new Path2D(d))); ctx.restore();
      return (ELMA_KUTU.x1 - ELMA_KUTU.x0) * k;
    };
    const play = (x, y) => {
      const [px, py, pw, ph] = PLAY_KUTU, iw = ih * pw / ph;
      // PNG'deki koyu zemin rozet zemininden farklı ton; 'lighten' ile yalnız renkli ikon kalır
      if (o.google) { ctx.save(); ctx.globalCompositeOperation = 'lighten'; ctx.drawImage(o.google, px, py, pw, ph, x, y, iw, ih); ctx.restore(); }
      return iw;
    };
    const y2 = o.y + o.h + o.ara + (o.gh - bh) / 2;      // Google yuvasında dikey ortalı
    const a = rozet(o.y, elma, 'App Store'), g = rozet(y2, play, 'Google Play');
    // ortak punto: iki ad da kendi alanına sığar, aynı boyda yazılır
    const tx = Math.max(a.tx, g.tx), alan = o.x + bw - pad * 0.8 - tx;
    ctx.font = '600 10px ' + INTER;
    const boy = Math.min(bh * 0.42, 10 * alan / Math.max(ctx.measureText('App Store').width, ctx.measureText('Google Play').width));
    ctx.font = '600 ' + boy + 'px ' + INTER; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    [[a, 'App Store'], [g, 'Google Play']].forEach(([b, ad]) => ctx.fillText(ad, tx, b.y + bh / 2 + boy * 0.36));
  }

  const M = T1.olustur({
    rozetCiz,
    sticker: yatayStk,
    stkOran: S.H / S.W, stkROran: S.R / S.W,
    stkW: S.W, stkH: S.H,               // camdaki gerçek ölçü
    buyutecKay: [-15, -12],               // büyüteçte sol alt köşe görünsün (A sütunu ve serigrafi ile)
    mini1: { w: 5.6, x: 4.6 },          // "Yapıştır" adımı: camın köşesinde
    mini2: { w: 5.6, x: 2.6, y: 5.6 },  // "Aktif Et" adımı: telefonun solunda
    // Arka yüz (24 Kasım, Adem): EAN-13 yok; yasal metin tam genişlikte, bant inceldi. Kazanılan yerle örnek
    // sticker büyüdü (QR okunur kalsın), "Uygulamada ayrıca" 2 sütuna indi.
    // Ön yüz (24 Kasım, Adem): eğik "Artık numaratöre gerek yok" rozeti kalktı; sloganla aynı fikri tekrarlıyordu.
    onRozetYok: true,
    byYok: true,                         // ön yüzde sağ üstteki "by Candemsoft" yok (24 Kasım, Adem)
    // Telefon ekranında plakanın altında sayfanın kendi "Telefon ile Ara" butonu, örnek numarayla (24 Kasım, Adem).
    // 0500 kullanılmayan bir GSM öneki: kutudaki numara gerçek bir kişiye ait olmasın.
    vitrinEkran: BASE2 + 'vitrin_profil_ekran_tel.jpg',
    // Büyüteç büyüdü, yakınlaştırma arttı: baskıda örnek sticker ve QR ayrıntısı seçilsin (Adem)
    buyutec: { x: 15.6, y: 50.4, r: 11.2, k: 0.22 },
    lotYok: true,                        // sağ yan kapaktaki beyaz lot/tarih kutusu yok (24 Kasım, Adem)
    arka: {
      eanYok: true, bant: 29.5, ornekGen: 33, etH: 5.0, etOran: 0.5, etAra: 1.8, ustPay: 3.4, ozSutun: 2, aktTam: true, sutunAra: 4,
      // Görsel denge (24 Kasım, Adem): kısa açıklama, tek satırlık özellik adları, küçük rozet + geniş adımlar,
      // aktivasyon kutusu "DENE" çağrısıyla çelişmesin (örnek kamerayla denenir, kendi etiketin uygulamadan).
      aciklama: 'Etiketi camın içine yapıştır. Okutan kişi uygulamasız uyarı gönderir, bildirim sana gelir. ' +
                'Numaranı istersen gizleyebilirsin.',
      ekOzellik: [['acil', 'Acil bilgiler'], ['kaza', 'Kaza tutanağı'], ['cekici', 'Yol yardımı'],
                  ['lastik', 'Lastikçi, tamirci'], ['otopark', 'Otoparklar'], ['eczane', 'Nöbetçi eczane']],
      aktBaslik: 'Kendi etiketini uygulamadan etkinleştir',
      aktGovde: 'Uygulamayı indir, etiketini uygulamanın içinden okut. Kutudaki örneği kamerayla deneyebilirsin.',
      rozetH: 8, adimH: 11.5, altHiza: true,
      yasal: (URETICI, ADRES) => [
        [['Kutu içeriği: ', 700], ['1 QR Etiket (8 × 5 cm), yüzey temizleme mendili, kullanım kılavuzu', 400]],
        [['Üretici: ', 700], [URETICI, 400]],
        [['Adres: ', 700], [ADRES, 400]],
        [['Destek: ', 700], ['info@kisiselqr.com', 400]],
        [['KVKK Aydınlatma Metni: ', 700], ['kisiselqr.com/kvkk', 400]],
        [['Acil durum hizmeti değildir; tehlikede 112.', 600]],
        [['Ödeme ya da şifre istemez; adres kisiselqr.com', 400]],
        [["Türkiye'de üretilmiştir.", 600]],
      ],
    },
  });
  const hazir = M.ready;
  M.ready = () => {
    const ek = document.fonts && document.fonts.load
      ? ['900 12px Montserrat', '800 12px Montserrat', '600 12px Inter'].map(f => document.fonts.load(f, 'OKUT SAHİBİNE HABER VER'))
      : [];
    return Promise.all([hazir()].concat(ek)).catch(() => {});
  };
  M.yatayStk = yatayStk;
  M.meta = { ad: 'Yatay Sticker', renk: '#FDD309',
             aciklama: "Tasarım 1'in birebir kopyası; kutuda dikey orijinal etiket yerine yatay sticker (80 × 50)." };
  window.KQRTasarim2 = M;
})();
