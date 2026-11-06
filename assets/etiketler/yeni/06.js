/* Kişisel QR – etiket konsepti 06: Dostça Not
 * Siyah taban (camla bütünleşir) üstünde hafif eğik, bantla tutturulmuş, sağ alt köşesi kıvrık sarı yapışkan not.
 * Not, araç sahibinin ağzından kibar bir rica: "Selam! Aracımda bir sorun mu var? Okut, bana haber ver. Teşekkürler!"
 * El yazısı hissi yalnız çizimle verilir (yeni font yok): Montserrat'a eğim (shear), ana cümlenin altında elle çizilmiş
 * dalgalı çizgi (yatayda kıvrılıp QR'a ok olur), gülen yüz ve kalp. QR kartı nota yapıştırılmış beyaz kâğıt: not eğik,
 * kart notun eğimini geri alır, modüller etiket kenarına paralel kalır. Gerçek demo QR.
 */
(function () {
  const E = window.KQREtiket, Y = E.yardim, L = Y.L, C = Y.C, MONT = Y.MONT, INTER = Y.INTER;

  const KAGIT = C.Y, KAGIT_K = '#F3C800', KAGIT_ARKA = '#FFEC8A', MUREKKEP = '#0A0A0A';
  const EGIM = -0.2;          // el yazısı eğimi (x kayması / yükseklik)

  // ------------------------------------------------------------ el çizimi yardımcıları
  // Eğik (el yazısı hissi) metin; (x, y) taban çizgisi. Genişliği döndürür.
  function yaz(ctx, s, x, y, size, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, o.egim != null ? o.egim : EGIM, 1, 0, 0);
    Y.mf(ctx, size, o.w || 900, o.fam || MONT);
    ctx.fillStyle = o.renk || MUREKKEP; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, 0, 0);
    const g = ctx.measureText(s).width; ctx.restore(); return g;
  }
  function kalem(ctx, renk, lw) {
    ctx.strokeStyle = renk || MUREKKEP; ctx.lineWidth = lw || 0.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
  }
  // Elle çizilmiş dalgalı alt çizgi (uçta hafif yukarı kalkar)
  function dalga(ctx, x0, x1, y, o) {
    o = o || {};
    const a = o.genlik || 0.4, n = Math.max(2, Math.round((x1 - x0) / (o.adim || 4.5)));
    ctx.save(); kalem(ctx, o.renk, o.lw || 0.6);
    ctx.beginPath(); ctx.moveTo(x0, y + 0.15);
    for (let i = 0; i < n; i++) {
      const xa = x0 + (x1 - x0) * (i + 0.5) / n, xb = x0 + (x1 - x0) * (i + 1) / n;
      ctx.quadraticCurveTo(xa, y + (i % 2 ? a : -a), xb, y + (i === n - 1 ? -0.45 : 0));
    }
    ctx.stroke(); ctx.restore();
  }
  // Küçük el çizimi gülen yüz
  function gulen(ctx, cx, cy, r) {
    ctx.save(); kalem(ctx, MUREKKEP, r * 0.2);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = MUREKKEP;
    ctx.beginPath(); ctx.arc(cx - r * 0.36, cy - r * 0.24, r * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.36, cy - r * 0.24, r * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.02, r * 0.52, 0.17 * Math.PI, 0.83 * Math.PI); ctx.stroke();
    ctx.restore();
  }
  // Küçük dolu kalp; (cx, cy) merkez, s genişlik
  function kalp(ctx, cx, cy, s) {
    const h = s / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12); ctx.fillStyle = MUREKKEP;
    ctx.beginPath(); ctx.moveTo(0, h * 0.95);
    ctx.bezierCurveTo(-h * 1.15, h * 0.1, -h * 1.0, -h * 0.95, 0, -h * 0.35);
    ctx.bezierCurveTo(h * 1.0, -h * 0.95, h * 1.15, h * 0.1, 0, h * 0.95);
    ctx.fill(); ctx.restore();
  }
  // Yumuşak gölge: shadowBlur/offset dönüşümden etkilenmez, mm → piksel çevrilir
  function golge(ctx, blur, off, renk) {
    const t = ctx.getTransform(), k = Math.hypot(t.a, t.b);
    ctx.shadowColor = renk || 'rgba(90,70,0,0.32)'; ctx.shadowBlur = blur * k; ctx.shadowOffsetY = off * k;
  }
  // Yapışkan bant: (cx, cy) merkezli, açılı, tırtıklı uçlu, krem renkli şerit
  function bant(ctx, cx, cy, w, h, aci) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(aci * Math.PI / 180);
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, n = 6, d = 0.4;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0);
    for (let i = 1; i <= n; i++) ctx.lineTo(x1 + (i % 2 ? -d : 0), y0 + h * i / n);
    ctx.lineTo(x0, y0 + h);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(x0 + (i % 2 ? d : 0), y0 + h * i / n);
    ctx.closePath();
    ctx.save(); golge(ctx, 0.5, 0.15, 'rgba(0,0,0,0.25)'); ctx.fillStyle = 'rgba(245,241,226,0.88)'; ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.22;
    ctx.beginPath(); ctx.moveTo(x0 + 1.2, y0 + h * 0.28); ctx.lineTo(x1 - 1.2, y0 + h * 0.28); ctx.stroke();
    ctx.restore();
  }
  // Yapışkan not: (x, y) sol üst, w × h, sağ alt köşe f kadar kıvrık, aci derece eğik.
  // icerik(ctx, w, h) notun yerel koordinatında, kıvrık köşe dışarıda kalacak şekilde kırpılmış çizilir.
  function not(ctx, x, y, w, h, f, aci, icerik) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(aci * Math.PI / 180); ctx.translate(-w / 2, -h / 2);
    const yol = () => {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h - f);
      ctx.quadraticCurveTo(w - f * 0.42, h - f * 0.42, w - f, h);
      ctx.lineTo(0, h); ctx.closePath();
    };
    // kâğıt: büyük bölümü düz sarı, alt uca doğru çok hafif koyulaşır (serbest uç)
    yol();
    const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
    g.addColorStop(0, KAGIT); g.addColorStop(0.8, KAGIT); g.addColorStop(1, KAGIT_K);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); yol(); ctx.clip();
    // üstteki yapışkan şeridin hafif izi
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, 0, w, 4.2);
    // kıvrığın kâğıda düşen gölgesi
    const gx = w - f * 0.5, gy = h - f * 0.5, sg = ctx.createRadialGradient(gx, gy, 0, gx, gy, f * 1.3);
    sg.addColorStop(0, 'rgba(120,90,0,0.30)'); sg.addColorStop(1, 'rgba(120,90,0,0)');
    ctx.fillStyle = sg; ctx.fillRect(w - f * 2.2, h - f * 2.2, f * 2.2, f * 2.2);
    icerik(ctx, w, h);
    ctx.restore();
    // kıvrılan köşenin arka yüzü (açık sarı)
    ctx.beginPath(); ctx.moveTo(w, h - f);
    ctx.quadraticCurveTo(w - f * 0.42, h - f * 0.42, w - f, h);
    ctx.quadraticCurveTo(w - f * 0.78, h - f * 0.62, w - f * 0.92, h - f * 0.98);
    ctx.quadraticCurveTo(w - f * 0.55, h - f * 0.86, w, h - f);
    ctx.closePath();
    const ag = ctx.createLinearGradient(w - f, h - f, w - f * 0.4, h - f * 0.4);
    ag.addColorStop(0, '#FFF7CC'); ag.addColorStop(1, KAGIT_ARKA);
    ctx.fillStyle = ag; ctx.fill();
    ctx.lineWidth = 0.1; ctx.strokeStyle = 'rgba(150,115,0,0.5)'; ctx.stroke();
    ctx.restore();
  }
  // Nota yapıştırılmış QR kartı: hafif gölgeli beyaz kart + gerçek demo QR.
  // geri: notun eğimi (derece); kart kendi merkezinde geri döndürülür, QR modülleri etiket kenarına paralel kalır (baskıda keskin).
  function kart(ctx, x, y, s, geri) {
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2); ctx.rotate(-(geri || 0) * Math.PI / 180); ctx.translate(-s / 2, -s / 2);
    ctx.save(); golge(ctx, 0.8, 0.22);
    L.rr(ctx, 0, 0, s, s, 1.4); ctx.fillStyle = C.W; ctx.fill(); ctx.restore();
    Y.qrKart(ctx, 0, 0, s, { r: 1.4 });
    ctx.restore();
  }
  // Alt çizgi + ok tek kalem darbesi: metnin altında dalgalanır, sonra kıvrılıp hedefe (QR) uzanır.
  function cizOk(ctx, x0, x1, y, hedef, o) {
    o = o || {};
    ctx.save(); kalem(ctx, o.renk, o.lw || 0.6);
    const n = Math.max(2, Math.round((x1 - x0) / 4.2)), a = 0.38;
    ctx.beginPath(); ctx.moveTo(x0, y + 0.15);
    for (let i = 0; i < n; i++) {
      const xa = x0 + (x1 - x0) * (i + 0.5) / n, xb = x0 + (x1 - x0) * (i + 1) / n;
      ctx.quadraticCurveTo(xa, y + (i % 2 ? a : -a), xb, y);
    }
    // S kıvrımı: çizgi sağa devam eder, yukarı döner, sonunda yatay olarak hedefe (QR kartına) girer
    const k1 = [x1 + (o.k1 || 2.0), y], k = [hedef[0] - (o.k2 || 2.2), hedef[1]];
    ctx.bezierCurveTo(k1[0], k1[1], k[0], k[1], hedef[0], hedef[1]); ctx.stroke();
    const ang = Math.atan2(hedef[1] - k[1], hedef[0] - k[0]), u = o.uc || 1.3;
    ctx.beginPath();
    ctx.moveTo(hedef[0] + Math.cos(ang + 2.55) * u, hedef[1] + Math.sin(ang + 2.55) * u);
    ctx.lineTo(hedef[0], hedef[1]);
    ctx.lineTo(hedef[0] + Math.cos(ang - 2.6) * u * 0.95, hedef[1] + Math.sin(ang - 2.6) * u * 0.95);
    ctx.stroke(); ctx.restore();
  }

  E.ekle({
    id: 'not', no: '06', ad: 'Dostça Not', renk: C.Y, r: 3.2,
    metin: ['Okut, bana haber ver!', 'Selam! Aracımda bir sorun mu var?', 'Teşekkürler!', 'kisiselqr.com'],
    fikir: 'Cama bırakılmış kibar bir not: siyah taban camla bütünleşir, üstünde bantla tutturulmuş, sağ alt köşesi kıvrık sarı bir yapışkan not durur. Dil afiş değil, araç sahibinin ricası: "Selam! Aracımda bir sorun mu var? Okut, bana haber ver! Teşekkürler!". El yazısı hissi yeni font olmadan verildi: eğik Montserrat, ana cümlenin altında elle çizilmiş dalgalı çizgi (yatayda çizgi kıvrılıp QR\'a ok olur), gülen yüz ve kalp. QR kartı nota yapıştırılmış beyaz kâğıt; not hafif eğik, QR kartı etiket kenarına paralel.',
    arti: ['00–04\'ün afiş / buyruk dilinden tamamen ayrı: insan sesi, rica eden sıcak ton; okutana "yardım edebilirsin" der.',
           'Not kâğıdı herkesin tanıdığı "sana bir mesaj var" işareti; camdaki otopark, servis, sigorta etiketlerinden ayrışır.',
           'Hiyerarşi net: en iri ve altı çizili yazı iki satırlık eylem ("Okut, bana / haber ver!": dikey 5,6 mm, yatay ~4,6 mm), selam 3,3–3,6 mm, soru ~2,9 mm.',
           'QR kartı 38,4 mm (dikey) / 38 mm (yatay), eksene hizalı; demo QR k=14 ve k=6\'da düz, gündüz ve gece camında okundu.'],
    risk: ['Eylem yazısı (dikey 5,6 / yatay ~4,6 mm, küçük harf) 01–04\'teki büyük harf başlıklar kadar iri değil; 2 m\'den okunurluğu daha zayıf. Dikkati sarı not şekli çeker.',
           'QR, metne yer açmak için 01–04\'ten biraz küçük (QR ≈ 31–32 mm); okuma mesafesi biraz kısalır.',
           'Neyin bildirilebileceği (cam, far, park, lastik) yazmıyor; okutma sebebini 03 kadar açık vermez.',
           'Bant, kıvrık köşe ve gölgeler yarı saydam / degrade: matbaada düz renge düşebilir, deneme baskısı şart. Bant ve sarı notun eğik köşeleri 2 mm güvenli payın içine giriyor (süs; kesim kayarsa siyah çerçeve eşitsiz görünür, eğik not bunu gizler).',
           'Eğik (sahte el yazısı) metin bazı gözlere yapay gelebilir; samimi ton "ciddi değil" diye de okunabilir.',
           'Etiket camın içinden ters baskıyla bakılır: kıvrık köşe ve gölge yönü üretimde kontrol edilmeli.'],

    // ---------------------------------------------------------- 50 × 80 mm
    // Hiyerarşi: eylem (2 satır, ~5,6 mm, 900) > selam (3,6 mm) > soru (Inter ~3 mm). Tek satırda eylem ancak ~3,6 mm'ye sığıyordu.
    // Alt güvenli pay: adres (logo + metin, q kuyruğu dahil) alt kenardan ≥ 2,4 mm içeride.
    dikey(ctx, w, h) {
      ctx.fillStyle = C.K100; ctx.fillRect(0, 0, w, h);
      const nx = 2.2, ny = 2.0, nw = w - 2 * nx, nh = 71.4, ACI = -1.0;
      not(ctx, nx, ny, nw, nh, 5.4, ACI, (ctx, W, H) => {
        const sx = 3.2;
        // selam + gülen yüz: sıcak giriş, ana mesajdan belirgin küçük
        const ss = 3.6, ys = 7.4, gs = yaz(ctx, 'Selam!', sx + 0.4, ys, ss, { w: 800 });
        gulen(ctx, sx + 0.4 + gs + 2.9, ys - ss * 0.36, 1.45);
        // soru
        const q = 'Aracımda bir sorun mu var?', s2 = Y.sigdir(ctx, [q], W - 2 * sx, 3.0, 700, INTER);
        Y.mf(ctx, s2, 700, INTER); ctx.fillStyle = MUREKKEP; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const yq = ys + 2.0 + s2 * 0.727;
        ctx.fillText(q, sx, yq);
        // ana eylem: notun en iri yazısı, iki satır + elle çizilmiş dalgalı alt çizgi
        const a = ['Okut, bana', 'haber ver!'], s3 = Y.sigdir(ctx, a, W - 2 * sx - 2, 5.6, 900);
        const y1 = yq + 2.5 + s3 * 0.7, y2 = y1 + s3 * 0.7 + 1.7;
        yaz(ctx, a[0], sx + 0.9, y1, s3);
        const g2 = yaz(ctx, a[1], sx + 0.9, y2, s3);
        dalga(ctx, sx + 0.3, sx + g2 + 0.6, y2 + 1.5, { adim: 4.4, genlik: 0.38, lw: 0.6 });
        // QR kartı (eksene hizalı)
        const k = 38.4, kx = (W - k) / 2, ky = y2 + 3.0;
        kart(ctx, kx, ky, k, ACI);
        // imza + kalp
        const ts = 3.2, ty = ky + k + 1.5 + ts * 0.7, gt = yaz(ctx, 'Teşekkürler!', sx + 0.6, ty, ts, { w: 800 });
        kalp(ctx, sx + 0.6 + gt + 2.0, ty - ts * 0.36, 2.2);
      });
      bant(ctx, w / 2 + 0.4, ny + 0.3, 14.5, 4.2, 2.5);
      Y.adres(ctx, w / 2, 76.3, 2.5, C.Y, C.Y);
    },

    // ---------------------------------------------------------- 80 × 50 mm
    yatay(ctx, w, h) {
      ctx.fillStyle = C.K100; ctx.fillRect(0, 0, w, h);
      const nx = 2.0, ny = 2.0, nw = w - 2 * nx, nh = 41.6, ACI = -0.7, F = 3.8;
      not(ctx, nx, ny, nw, nh, F, ACI, (ctx, W, H) => {
        // kart kıvrık köşeden uzak: köşesi kıvrığın katlanma çizgisine değmesin
        const k = 38.0, kx = W - k - 3.8, ky = (H - k) / 2 - 0.2;
        const sx = 3.0, kol = kx - sx - 2.6;               // sol sütun genişliği (eylem yazısı için olabildiğince geniş)
        const ss = 3.3, ys = 7.6, gs = yaz(ctx, 'Selam!', sx + 0.4, ys, ss, { w: 800 });
        gulen(ctx, sx + 0.4 + gs + 2.7, ys - ss * 0.36, 1.35);
        const q = ['Aracımda bir', 'sorun mu var?'], s2 = Y.sigdir(ctx, q, kol, 2.9, 700, INTER);
        Y.mf(ctx, s2, 700, INTER); ctx.fillStyle = MUREKKEP; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const y2 = ys + 2.4 + s2 * 0.727;
        ctx.fillText(q[0], sx, y2); ctx.fillText(q[1], sx, y2 + s2 * 1.3);
        const a = ['Okut, bana', 'haber ver!'], s3 = Y.sigdir(ctx, a, kol - 1.2, 5.6, 900);
        const y3 = y2 + s2 * 1.3 + 3.8 + s3 * 0.7;
        yaz(ctx, a[0], sx + 0.9, y3, s3);
        const g3 = yaz(ctx, a[1], sx + 0.9, y3 + s3 * 1.12, s3);
        // "haber ver!" altında dalgalanan çizgi kıvrılıp QR'a uzanır
        cizOk(ctx, sx + 0.3, sx + g3 + 0.2, y3 + s3 * 1.12 + 1.7, [kx - 0.7, y3 + s3 * 0.45], { lw: 0.58, uc: 1.15 });
        const ts = 3.2, gt = yaz(ctx, 'Teşekkürler!', sx + 0.6, H - 3.6, ts, { w: 800 });
        kalp(ctx, sx + 0.6 + gt + 2.1, H - 3.6 - ts * 0.34, 2.2);
        kart(ctx, kx, ky, k, ACI);
      });
      bant(ctx, 7.9, 2.6, 11.5, 3.9, -28);
      Y.adres(ctx, w / 2, 46.3, 2.5, C.Y, C.Y);
    },
  });
})();
