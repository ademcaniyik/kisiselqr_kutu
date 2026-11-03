/* Kişisel QR – kullanım kılavuzu (kutunun içine konan, ortadan tek kırımlı kâğıt)
 * Açık ölçü 180 × 130 mm, kapalı 90 × 130 mm (kutu iç ölçüsü 96 × 136 mm: her yanda 3 mm pay). Taşma 3 mm, güvenli alan 4 mm.
 * Dış yüz: [Arka | Kapak]. İç yüz: [Kurulum 1–4 | Hazırla ve dene 5–7]. Kapak açılınca iç yüz soldan sağa okunur.
 * Çizimler mm koordinatında; kutuyla aynı öğeler (logo, etiket v2, adım kutucukları, ikonlar, vitrin ekranı) tasarim1.js'ten.
 * Metinlerdeki her bilgi uygulama ve web kodundan doğrulandı (kilavuz.html → "Bilgilerin dayanağı").
 */
(function () {
  const L = window.KQRTasarim1.lib, C = L.colors, PT = L.PT;
  const W = 180, H = 130, P = 90, B = 3, SAFE = 4, M = 6;    // M: panel iç kenar boşluğu (güvenli alan + 2 mm)
  const KB = '#F4F4F2', GRI = '#55595F', CIZGI = '#D9D9D4';

  // ------------------------------------------------------------ yazı
  const t = (ctx, s, x, y, size, o) => L.txt(ctx, s, x, y, Object.assign({ size, w: 400, color: C.K100 }, o || {}));
  // Paragraf: kelime kaydırmalı, döndürdüğü değer son satırın altı (mm)
  function para(ctx, s, x, y, maxW, size, o) {
    o = o || {};
    const lh = o.lh || size * 1.32, w = o.w || 400;
    const satirlar = L.wrap(ctx, s, maxW, size, w);
    satirlar.forEach((ln, i) => t(ctx, ln, x, y + size * 0.74 + i * lh, size, { w, color: o.color || C.K100, align: o.align }));
    return y + size * 0.74 + (satirlar.length - 1) * lh + size * 0.32;
  }
  // Bölüm etiketi: sarı (ya da siyah) şerit üstünde küçük büyük harf
  function sekme(ctx, s, x, y, zemin, renk) {
    const fs = 6.6 * PT, w = L.tw(ctx, s, fs, 800) + 3.6;
    L.rr(ctx, x, y, w, 4.2, 1); ctx.fillStyle = zemin || C.Y; ctx.fill();
    t(ctx, s, x + 1.8, y + 2.95, fs, { w: 800, color: renk || C.K100 });
    return w;
  }
  function numara(ctx, n, cx, cy, r, zemin, renk) {
    ctx.fillStyle = zemin || C.Y; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    t(ctx, String(n), cx, cy + r * 0.5, r * 1.35, { w: 900, color: renk || C.K100, align: 'center' });
  }
  // Kutudaki adım kutucuğu (15,5 × 12,5 mm için çizilmiş), istenen genişliğe ölçeklenir. Numara dairesi çizilmez.
  function adim(ctx, i, x, y, w) {
    const k = w / 15.5;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.save(); L.rr(ctx, 0, 0, 15.5, 12.5, 1.4); ctx.clip();
    L.adimCizim(ctx, i, 0, 0, 15.5, 12.5);
    ctx.restore();
    // kutudaki numara dairesini kılavuzun numarasıyla örtmemek için: sol üst köşeyi zemin rengiyle kapat
    ctx.fillStyle = '#1A1A1A'; ctx.beginPath(); ctx.arc(2.1, 2.1, 1.75, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return w * 12.5 / 15.5;
  }

  // ------------------------------------------------------------ iç yüz, sol: kurulum (1–4)
  function icSol(ctx) {
    const x0 = M, cw = P - 2 * M;
    ctx.fillStyle = C.W; ctx.fillRect(-B, -B, P + B, H + 2 * B);
    let y = 7;
    sekme(ctx, 'KURULUM · 4 ADIM', x0, y);
    y = para(ctx, 'Etiketini 4 adımda çalıştır', x0, y + 6.2, cw, 12.5 * PT, { w: 800 }) + 3.4;

    const iw = 23, ih = iw * 12.5 / 15.5, tx = x0 + iw + 3.4, tw = cw - iw - 3.4;
    const bloklar = [
      { b: 'Uygulamayı indir', s: 'App Store ya da Google Play\'de "Kişisel QR"ı ara veya yandaki karekodu okut. Uygulama ücretsiz; iOS 15+ ve Android 7+ telefonlarda çalışır.', ciz: (x, y) => {
          L.rr(ctx, x, y, iw, ih, 1.4); ctx.fillStyle = C.W; ctx.fill(); ctx.lineWidth = 0.3; ctx.strokeStyle = C.K100; ctx.stroke();
          const q = ih - 3; L.appQR(ctx, x + iw - q - 1.6, y + 1.5, q);   // sağa yaslı: sol üstteki numara dairesi konum karesine binmesin
        } },
      { b: 'Camı temizle', s: 'Camın iç yüzünü temizle ve iyice kurula. Toz, yağ ya da nem kalırsa etiket tam yapışmaz.', ciz: (x, y) => adim(ctx, 0, x, y, iw) },
      { b: 'Camın içine yapıştır', s: 'Koruyucuyu soy, yazılı yüz dışarı bakacak şekilde camın iç yüzüne yapıştır. Ortadan kenarlara bastırarak havayı çıkar. Görüşünü kapatmayan bir yer seç.', ciz: (x, y) => adim(ctx, 1, x, y, iw) },
      { b: 'Uygulamadan aktif et', s: 'Uygulamada "Karekodu okutarak giriş yap"a dokun, etiketi dışarıdan okut, Google ya da Apple ile giriş yap. "QR Eşleşti" görünce tamam. Giriş yaptıysan: Ana Sayfa → "QR Kodunu Tanımla".', ciz: (x, y) => adim(ctx, 2, x, y, iw) },
    ];
    bloklar.forEach((k, i) => {
      if (i) { ctx.fillStyle = CIZGI; ctx.fillRect(x0, y - 2.4, cw, 0.2); }
      k.ciz(x0, y);
      numara(ctx, i + 1, x0 + 1.9, y + 1.9, 2.3, C.Y);
      let yy = para(ctx, k.b, tx, y - 0.2, tw, 8.6 * PT, { w: 800 }) + 0.6;
      yy = para(ctx, k.s, tx, yy, tw, 6.9 * PT);
      y = Math.max(y + ih, yy) + 3.6;
    });
    // uyarı şeridi: kamera değil uygulama
    const sy = y - 0.4, sh = H - 6 - sy;
    L.rr(ctx, x0, sy, cw, sh, 1.6); ctx.fillStyle = C.K100; ctx.fill();
    L.logoIcon(ctx, x0 + 2.6, sy + (sh - 5.4) / 2, 5.4, C.Y);
    const ux = x0 + 10.6, uw = cw - 13;
    let uy = para(ctx, 'Kamerayla değil, uygulamanın içinden okut.', ux, sy + 2.1, uw, 7.2 * PT, { w: 800, color: C.Y }) + 0.4;
    para(ctx, 'Aktif olmayan etiket kamerayla okutulunca "henüz aktif değil" sayfası açılır; bu normal.', ux, uy, uw, 6.6 * PT, { color: C.W });
  }

  // ------------------------------------------------------------ iç yüz, sağ: hazırla ve dene (5–7) + okutan ne görür
  function icSag(ctx) {
    const x0 = P + M, cw = P - 2 * M;
    ctx.fillStyle = C.W; ctx.fillRect(P, -B, P + B, H + 2 * B);
    let y = 7;
    sekme(ctx, 'HAZIRLA VE DENE', x0, y);
    y = para(ctx, 'Profilini hazırla, bir kez dene', x0, y + 6.2, cw, 12.5 * PT, { w: 800 }) + 3.6;
    const tx = x0 + 6.8, tw = cw - 6.8;
    const bloklar = [
      { b: 'Profilini doldur', s: '"Profili Düzenle"de Temel Bilgiler, Araç (plaka isteğe bağlı), Acil Durum ve Sosyal Medya sekmeleri var. Fotoğrafını, e-postanı, acil durum numaranı ve sağlık bilgilerini istersen profilde gizleyebilirsin. Ana Sayfa\'daki "Kişisel Sayfamı Önizle" ile başkalarının ne gördüğüne bak.' },
      { b: 'Bildirimlere izin ver', s: 'Uygulama bildirim izni isteyince "İzin ver"e dokun. "Profili Düzenle → Bildirim İzinleri"nde "Kullanıcıların size bildirim göndermesine izin ver" açık olsun. İzin kapalıysa uyarılar sana ulaşmaz.' },
      { b: 'Bir kez dene', s: 'Başka bir telefonla etiketini okut, bir uyarı gönder ve bildirimin geldiğini gör. Aynı uyarı aynı telefondan 15 dakikada bir gönderilebilir.' },
    ];
    bloklar.forEach((k, i) => {
      numara(ctx, i + 5, x0 + 2.4, y + 2.1, 2.4, C.K100, C.Y);
      let yy = para(ctx, k.b, tx, y - 0.1, tw, 8.6 * PT, { w: 800 }) + 0.6;
      y = para(ctx, k.s, tx, yy, tw, 6.9 * PT) + 4;
    });

    // Okutan kişi ne görür? (siyah kutu: vitrin ekranlı telefon + gerçek uyarı türleri)
    const by = y - 0.6, bh = H - 6 - by;
    L.rr(ctx, x0, by, cw, bh, 2); ctx.fillStyle = C.K100; ctx.fill();
    const ph = bh - 5, pw = ph * 0.5, px = x0 + 3;
    const ekran = L.vitrinEkrani();
    L.phone(ctx, px, by + 2.5, pw, ph, 10, ekran);
    const rx = px + pw + 3.6, rw = x0 + cw - 3 - rx;
    let ry = para(ctx, 'Okutan kişi ne görür?', rx, by + 3, rw, 8.6 * PT, { w: 800, color: C.Y }) + 0.8;
    ry = para(ctx, 'Uygulama indirmeden profil sayfanı açar, bir uyarıya dokunur; bildirim telefonuna gelir.', rx, ry, rw, 6.6 * PT, { color: C.W }) + 2;
    const E = window.KQREtiket;
    const liste = [['cam', 'Camınız açık'], ['far', 'Farlarınız açık'], ['park', 'Yanlış park'], ['lastik', 'Lastiğiniz inik']];
    liste.forEach(([ik, ad], i) => {
      const iy = ry + i * 5.1;
      L.rr(ctx, rx, iy, 4.1, 4.1, 0.9); ctx.fillStyle = C.Y; ctx.fill();
      if (E && E.ikon) E.ikon(ctx, ik, rx + 0.55, iy + 0.55, 3, C.K100);
      t(ctx, ad, rx + 5.4, iy + 2.85, 6.8 * PT, { w: 700, color: C.W });
    });
    ry += liste.length * 5.1 + 0.6;
    para(ctx, 'Ayrıca: dörtlüler yanıyor, hasar var, iletişim isteği ve dahası.', rx, ry, rw, 6.3 * PT, { color: '#C9CCD1' });
  }

  // ------------------------------------------------------------ dış yüz, sağ: kapak
  function kapak(ctx) {
    const x0 = P + M, cw = P - 2 * M;
    ctx.fillStyle = C.K; ctx.fillRect(P, -B, P + B, H + 2 * B);
    L.logo(ctx, x0, 8, 9.5, C.Y);
    let y = 24;
    t(ctx, 'KULLANIM KILAVUZU', x0, y, 7.4 * PT, { w: 800, color: C.Y });
    y = para(ctx, 'Akıllı Araç Etiketi', x0, y + 2.4, cw, 17 * PT, { w: 900, color: C.W }) + 1.4;
    para(ctx, 'Kurulum 4 adım. İçeriyi aç, 1. adımla uygulamayı indirerek başla.', x0, y, cw * 0.62, 7.6 * PT, { color: '#C9CCD1' });
    // etiket: hafif eğik, gölgeli
    ctx.save(); ctx.translate(P + 45, 70); ctx.rotate(0.08);
    L.etiket2(ctx, -15, -24, 30, { shadow: 26, edge: 6 });
    ctx.restore();
    // slogan (kutunun ön yüzüyle aynı)
    const sy = 104, ss = 10.5 * PT;
    const a1 = t(ctx, 'Herkese ', x0, sy, ss, { w: 800, color: C.W });
    const a2 = t(ctx, 'numaranı ', x0 + a1, sy, ss, { w: 800, color: C.Y });
    t(ctx, 'vermek', x0 + a1 + a2, sy, ss, { w: 800, color: C.W });
    t(ctx, 'zorunda değilsin.', x0, sy + 4.7, ss, { w: 800, color: C.W });
    // alt sarı bant
    ctx.fillStyle = C.Y; ctx.fillRect(P, H - 14, P + B, 14 + B);
    t(ctx, 'Uygulama ücretsiz · Abonelik yok', x0, H - 7.6, 7.4 * PT, { w: 800 });
    t(ctx, 'kisiselqr.com', x0 + cw, H - 7.6, 7.4 * PT, { w: 800, align: 'right' });
  }

  // ------------------------------------------------------------ dış yüz, sol: arka (sık sorulanlar, ek özellikler, güvenlik)
  function arka(ctx) {
    const x0 = M, cw = P - 2 * M;
    ctx.fillStyle = KB; ctx.fillRect(-B, -B, P + B, H + 2 * B);
    let y = 7;
    sekme(ctx, 'SORUN GİDERME', x0, y);
    y = para(ctx, 'Sık sorulanlar', x0, y + 6.2, cw, 12.5 * PT, { w: 800 }) + 2.6;
    const sss = [
      ['Okutunca "henüz aktif değil" yazıyor.', 'Etiket uygulamadan aktif edilmemiş. İçerideki 4. adımı yap.'],
      ['Bildirim gelmiyor.', 'Telefon ayarlarında Kişisel QR bildirimlerine izin ver, uygulamada giriş yapmış ol ve "Bildirim İzinleri" açık olsun.'],
      ['Bildirim almak istemiyorum.', '"Profili Düzenle → Bildirim İzinleri"ni kapat. İstediğin an yeniden açabilirsin.'],
      ['Bilgilerim değişti.', 'Uygulamadan güncelle. Etiket aynı kalır, yeniden yapıştırman gerekmez.'],
      ['Telefonumu değiştirdim.', 'Yeni telefona uygulamayı kur, aynı Google ya da Apple hesabıyla giriş yap.'],
      ['Etiket hasar gördü, okunmuyor.', 'kisiselqr.com\'dan WhatsApp ile yaz. 2 yıl içinde ücretsiz değiştiriyoruz.'],
    ];
    sss.forEach(([s, c]) => {
      y = para(ctx, s, x0, y, cw, 7.1 * PT, { w: 800 }) + 0.3;
      y = para(ctx, c, x0, y, cw, 6.7 * PT, { color: '#2A2A2A' }) + 2.1;
    });
    // Uygulamada ayrıca (kutudaki 6 özellik, sarı ikonlar siyah zeminde)
    const ky = y + 0.4, kh = 25;
    L.rr(ctx, x0, ky, cw, kh, 1.8); ctx.fillStyle = C.K100; ctx.fill();
    t(ctx, 'Uygulamada ayrıca', x0 + 3, ky + 4.4, 7.2 * PT, { w: 800, color: C.Y });
    const hw = (cw - 6) / 3;
    L.EK_OZELLIK.forEach(([ik, ad], i) => {
      const cx = x0 + 3 + (i % 3) * hw, cy = ky + 7 + Math.floor(i / 3) * 8.6, es = 5.2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(es / 10, es / 10); L.EK_IKON[ik](ctx); ctx.restore();
      const satir = L.wrap(ctx, ad, hw - es - 2.2, 6.2 * PT, 600);
      satir.forEach((ln, k) => t(ctx, ln, cx + es + 1.4, cy + 2.4 + (k - (satir.length - 1) / 2) * 2.6, 6.2 * PT, { w: 600, color: C.W }));
    });
    // güvenlik ve destek
    let gy = ky + kh + 3.4;
    const satirlar = [
      [['Güvenliğin için: ', 800], ['ödeme ya da şifre istemeyiz; adres kisiselqr.com', 400]],
      [['Acil durum hizmeti değildir; ', 800], ['tehlikede 112\'yi ara.', 400]],
      [['Destek: ', 800], ['kisiselqr.com (WhatsApp) · ', 400], ['KVKK: ', 800], ['kisiselqr.com/kvkk', 400]],
      [['Hizmet: ', 800], ['en az 3 yıl hizmet, 2 yıl ücretsiz değişim.', 400]],
    ];
    satirlar.forEach(parcalar => {
      let x = x0;
      parcalar.forEach(([s, w]) => { x += t(ctx, s, x, gy, 6.3 * PT, { w, color: '#2A2A2A' }); });
      gy += 2.85;
    });
  }

  // ------------------------------------------------------------ yüzler
  // yuz: 'dis' | 'ic'. o: { tasma (taşmayı göster), kilavuz (kırım/güvenli alan çizgileri), pxmm }
  function ciz(canvas, yuz, o) {
    o = o || {};
    const k = o.pxmm || 10, tasma = o.tasma !== false;
    const ox = tasma ? B : 0, CW = W + (tasma ? 2 * B : 0), CH = H + (tasma ? 2 * B : 0);
    canvas.width = Math.round(CW * k); canvas.height = Math.round(CH * k);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, CW, CH);
    ctx.save(); ctx.translate(ox, ox);
    if (!tasma) { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); }
    if (yuz === 'dis') { arka(ctx); kapak(ctx); } else { icSol(ctx); icSag(ctx); }
    if (o.kilavuz) {
      ctx.setLineDash([]); ctx.lineWidth = 0.25;
      ctx.strokeStyle = '#EC008C'; ctx.setLineDash([2.4, 1.4]);
      ctx.beginPath(); ctx.moveTo(P, -B); ctx.lineTo(P, H + B); ctx.stroke();                          // kırım
      ctx.setLineDash([]); ctx.strokeStyle = 'rgba(236,0,140,0.9)'; ctx.strokeRect(0, 0, W, H);       // kesim
      ctx.strokeStyle = 'rgba(0,160,255,0.85)'; ctx.setLineDash([1, 1]);                                // güvenli alan
      [[0, P], [P, W]].forEach(([a, b]) => ctx.strokeRect(a + SAFE, SAFE, b - a - 2 * SAFE, H - 2 * SAFE));
      ctx.setLineDash([]);
    }
    ctx.restore();
    return { W: CW, H: CH };
  }

  function ready() {
    const r = [window.KQRTasarim1.ready()];
    if (window.KQREtiket) r.push(window.KQREtiket.ready());
    return Promise.all(r).catch(() => {});
  }

  window.KQRKilavuz = { ciz, ready, OLCU: { W, H, P, B, SAFE } };
})();
