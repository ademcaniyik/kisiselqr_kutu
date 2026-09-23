/*
 * Kişisel QR Araç Etiketi – Kutu Tasarımı 3 "Gece Sahnesi"
 * Sinematik hikâye: gece, sokak lambası altında park etmiş bir araç; biri ön camdaki
 * Kişisel QR sticker'ını telefonuyla okutuyor. Arka yüzde 3 kareli film şeridi.
 *
 * Açınımın tamamını mm koordinatlarında çizer (GEO, kutu_acinim.py). Ortak ürün öğeleri
 * (logo, sticker, telefon ekranı, QR'lar, ikonlar) KQRTasarim1.lib'den gelir.
 *
 *   KQRTasarim3.render(ctx, GEO, opts)   ctx önceden mm → px ölçeklenmiş (opts.px = px/mm)
 *   KQRTasarim3.ready()                  fontlar + ekran görüntüsü
 */
(function () {
  const L = window.KQRTasarim1.lib;
  const C = L.colors, PT = L.PT, SAFE = L.SAFE, BLEED = L.BLEED;
  const { rr, txt, tw, wrap, trace, panelPath, rectPts, inPanel } = L;
  const INTER = L.FONT;
  const OUTFIT = 'Outfit, Inter, "Helvetica Neue", Arial, sans-serif';

  // renk karışımları (yalnız palet renkleri + saydamlık → palet renkleri arası geçiş)
  const kb = a => `rgba(244,244,242,${a})`;
  const an = a => `rgba(42,42,42,${a})`;
  const ye = a => `rgba(253,211,9,${a})`;
  const bk = a => `rgba(10,10,10,${a})`;

  const FRONT_BAND = 101.5;   // ön yüz: sarı ikon bandının başladığı y (panel içi)
  const BACK_BAND = 33.2;     // arka yüz: alt yasal bant yüksekliği
  const LID_COLOR = C.Y;      // alt kilitli kapak + geçme dili (düz sarı: ön yüzün alt bandıyla aynı, Ø20 mühür alanı tek renk)

  function otxt(ctx, s, x, y, o) {            // Outfit / harf aralıklı metin
    ctx.font = `${o.w || 700} ${o.size}px ${o.fam || OUTFIT}`;
    ctx.letterSpacing = (o.ls || 0) + 'px';
    ctx.fillStyle = o.color || C.W; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
    const m = ctx.measureText(s).width;
    ctx.letterSpacing = '0px';
    return m;
  }
  function otw(ctx, s, size, w, ls, fam) {
    ctx.font = `${w || 700} ${size}px ${fam || OUTFIT}`; ctx.letterSpacing = (ls || 0) + 'px';
    const m = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return m;
  }
  const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

  // ------------------------------------------------------------ zeminler + taşma
  function grounds(ctx, g) {
    const { P, yT, yBt } = g;
    const GROUND = {
      On: C.K, Sol: C.K, Sag: C.K, Arka: C.K, Baslik2: C.Y, UstKapak: C.K,
      SolUstToz: C.K, SagUstToz: C.K, SolAltToz: C.K, SagAltToz: C.K, AltKapak: LID_COLOR, Dil: LID_COLOR,
    };
    const zones = [
      { pts: rectPts(P.Arka.x0, P.Arka.y0, P.Arka.x1, yT), c: C.Y },                 // Euro başlık 1. kat
      { pts: rectPts(P.On.x0, yT + FRONT_BAND, P.On.x1, yBt), c: C.Y },              // ön: sarı ikon bandı + mühür
      { pts: rectPts(P.Arka.x0, yBt - BACK_BAND, P.Arka.x1, yBt), c: C.Y },          // arka: yasal bant
    ];
    // taşma: kontur 2 × 3 mm kendi renginde; içeride kalan kısmı komşu dolgu örter
    ctx.lineJoin = 'miter'; ctx.miterLimit = 3; ctx.lineWidth = 2 * BLEED; ctx.setLineDash([]);
    Object.keys(GROUND).forEach(n => { ctx.strokeStyle = GROUND[n]; panelPath(ctx, P[n].p); ctx.stroke(); });
    zones.forEach(z => { ctx.strokeStyle = z.c; ctx.beginPath(); trace(ctx, z.pts); ctx.stroke(); });
    Object.keys(GROUND).forEach(n => { ctx.fillStyle = GROUND[n]; panelPath(ctx, P[n].p); ctx.fill('evenodd'); });
    zones.forEach(z => { ctx.fillStyle = z.c; ctx.beginPath(); trace(ctx, z.pts); ctx.fill(); });
    ['Tutkal', 'UstDil'].forEach(n => { ctx.fillStyle = C.RAW; panelPath(ctx, P[n].p); ctx.fill(); });
  }

  // ------------------------------------------------------------ SAHNE: sokak lambası (aracın arkasında)
  // Direk aracın arkasında kalır (araç sonra çizilir ve örter); ışık konisi aracın tavanına ve sol önündeki asfalta düşer.
  const LAMP = { px: 3.9, hx: 14.2, hy: 19.4 };
  function streetLamp(ctx, groundY) {
    const { px, hx, hy } = LAMP;
    const cone = ctx.createLinearGradient(0, hy, 0, groundY);
    cone.addColorStop(0, kb(0.16)); cone.addColorStop(0.6, kb(0.05)); cone.addColorStop(1, kb(0));
    ctx.fillStyle = cone;
    ctx.beginPath(); ctx.moveTo(hx - 2.0, hy + 0.8); ctx.lineTo(hx + 2.0, hy + 0.8); ctx.lineTo(hx + 24, groundY); ctx.lineTo(hx - 22, groundY); ctx.closePath(); ctx.fill();
    const halo = ctx.createRadialGradient(hx, hy + 0.6, 0, hx, hy + 0.6, 15);
    halo.addColorStop(0, kb(0.6)); halo.addColorStop(0.16, kb(0.24)); halo.addColorStop(0.5, kb(0.07)); halo.addColorStop(1, kb(0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(hx, hy + 0.6, 15, 0, Math.PI * 2); ctx.fill();
    // direk + kol (antrasit; lamba tarafında kırık beyaz ışık hattı)
    ctx.fillStyle = C.A;
    ctx.beginPath(); ctx.moveTo(px - 0.5, groundY); ctx.lineTo(px - 0.42, hy + 2.3); ctx.quadraticCurveTo(px - 0.28, hy - 1.5, px + 3.2, hy - 1.8);
    ctx.lineTo(hx, hy - 1.8); ctx.lineTo(hx, hy - 1.05); ctx.lineTo(px + 3.3, hy - 1.05); ctx.quadraticCurveTo(px + 0.45, hy - 0.85, px + 0.42, hy + 2.3);
    ctx.lineTo(px + 0.5, groundY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = kb(0.35); ctx.lineWidth = 0.16;
    ctx.beginPath(); ctx.moveTo(px + 0.46, hy + 14); ctx.lineTo(px + 0.4, hy + 2.4); ctx.stroke();
    ctx.fillStyle = C.A; ctx.beginPath(); ctx.moveTo(hx - 2.9, hy - 0.35); ctx.lineTo(hx + 2.9, hy - 0.35); ctx.lineTo(hx + 1.9, hy - 1.8); ctx.lineTo(hx - 1.9, hy - 1.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.KB; ctx.beginPath(); ctx.ellipse(hx, hy - 0.15, 2.35, 0.5, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ------------------------------------------------------------ SAHNE: araç — 3/4 perspektif, kenar ışığı (rim light)
  // Tasarım 1'in önden, simetrik kontur çiziminden bağımsız: aracın basit 3B modeli (metre) iğne deliği kamerayla
  // sahne mm'sine izdüşürülür. Kamera aracın sol-önünde, göz hizasının biraz üstünde; yakın yan yüz, ön cam ve kaput
  // perspektifte görünür, arka kısım kadrajın sol kenarından taşar, burun telefonun arkasında kalır.
  // Gövde siyah bir siluettir: tam kontur yok, yalnız arkadaki lambaya bakan kenarlar kırık beyaz ışık hattı alır.
  // Eksenler: X aracın sol (−) / sağ (+) yanı, Y yukarı, Z burun yönü (+).
  const V3 = {
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; },
    mad: (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k],
  };
  function camera(C3, T3, s, ox, oy) {
    const f = V3.norm(V3.sub(T3, C3)), r = V3.norm(V3.cross(f, [0, 1, 0])), u = V3.cross(r, f);
    return p => { const d = V3.sub(p, C3), z = V3.dot(d, f); return [ox + s * V3.dot(d, r) / z, oy - s * V3.dot(d, u) / z]; };
  }
  const CAR = {
    X: -0.9, WZ: 1.33, WR: 0.35, AR: 0.45, WY: 0.35,
    // ön cam: sol alt (yakın A direği dibi), sağ alt, sağ üst, sol üst
    WS: [[-0.82, 1.01, 0.98], [0.82, 1.01, 0.98], [0.66, 1.5, 0.25], [-0.66, 1.5, 0.25]],
  };
  // tavan hattı (sol): A direği tepesinden kavisle arka cama; t ∈ [0, 1]
  function roofRail(t, side) {
    const p0 = [-0.66, 1.5, 0.25], c = [-0.62, 1.615, -0.55], p1 = [-0.64, 1.52, -1.55], m = (1 - t) * (1 - t), n = 2 * t * (1 - t), q = t * t;
    const p = [m * p0[0] + n * c[0] + q * p1[0], m * p0[1] + n * c[1] + q * p1[1], m * p0[2] + n * c[2] + q * p1[2]];
    if (side > 0) p[0] = -p[0];
    return p;
  }
  const railPts = (t0, t1, side, n, dy, dx) => {
    const out = [];
    for (let i = 0; i <= n; i++) { const p = roofRail(t0 + (t1 - t0) * i / n, side); out.push([p[0] + (dx || 0), p[1] - (dy || 0), p[2]]); }
    return out;
  };
  // ön cam düzleminde (sol alt köşeden) u: taban boyunca sağa, v: cam yüzeyinde yukarı (u'ya dik) → 3B nokta
  function glassPoint(u, v) {
    const [A, B, , D] = CAR.WS;
    const eu = V3.norm(V3.sub(B, A)), ad = V3.sub(D, A);
    const ev = V3.norm(V3.mad(ad, eu, -V3.dot(ad, eu)));
    return V3.mad(V3.mad(A, eu, u), ev, v);
  }
  function arcZY(cz, cy, r, a0, a1, x, n) {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([x, cy + r * Math.sin(a), cz + r * Math.cos(a)]); }
    return out;
  }
  function car34(ctx, P, px) {
    const { X, WZ, WR, AR, WY, WS } = CAR;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const path = (pts, close) => {
      ctx.beginPath();
      pts.forEach((p, i) => { const q = P(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      if (close !== false) ctx.closePath();
    };
    const grad = (p0, p1, stops) => {
      const a = P(p0), b = P(p1), g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      stops.forEach(([o, c]) => g.addColorStop(o, c)); return g;
    };
    const fillPoly = (pts, ...styles) => { path(pts); styles.forEach(s => { ctx.fillStyle = s; ctx.fill(); }); };
    const rim = (pts, style, lw) => { path(pts, false); ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.stroke(); };

    // araç altı gölgesi (lamba havuzunu keser)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 2.2 * px;
    fillPoly([[-1.0, 0, -2.3], [1.05, 0, -2.3], [1.1, 0, 2.4], [-1.0, 0, 2.35]], C.K);
    ctx.restore();

    // uzak ön teker (tamponun altından görünen kısmı)
    fillPoly(arcZY(WZ, WY, WR, 0, Math.PI * 2, 0.9, 28), C.K);

    // yan yüz (yakın, X = −0,9): çamurluk kavisleri oyuk; üstten alta söner, arkadan lamba ışığı alır
    const side = [[X, 0.33, -2.15]].concat(arcZY(-WZ, WY, AR, Math.PI, 0, X, 16), arcZY(WZ, WY, AR, Math.PI, 0, X, 16),
      [[X, 0.33, 1.9], [X, 0.75, 1.9], [X, 1.0, 0.98], [X, 1.08, -2.0], [X, 1.0, -2.2], [X, 0.4, -2.2]]);
    fillPoly(side, C.K,
      grad([X, 1.06, 0], [X, 0.33, 0], [[0, an(0.7)], [0.5, an(0.22)], [1, an(0)]]),
      grad([X, 0.8, -2.2], [X, 0.8, 1.9], [[0, kb(0.1)], [0.5, kb(0.02)], [1, kb(0)]]));
    // omuz çizgisi (kapı hizası, lamba ışığında) + marşpiyel
    rim([[X, 0.72, 1.7], [X, 0.8, 0.2], [X, 0.85, -1.85]], grad([X, 0.8, -1.85], [X, 0.8, 1.7], [[0, kb(0.42)], [1, kb(0.04)]]), 0.22);
    rim([[X, 0.5, 0.86], [X, 0.5, -0.86]], an(1), 0.28);

    // ön yüz: yuvarlatılmış köşeler, üst kenar hafif geride (burun telefonun arkasında kalır)
    const fr = [[-0.9, 1.9], [-0.86, 2.05], [-0.76, 2.15], [-0.5, 2.2], [0.5, 2.2], [0.76, 2.15], [0.86, 2.05], [0.9, 1.9]];
    for (let i = 0; i < fr.length - 1; i++) {
      const [[x0, z0], [x1, z1]] = [fr[i], fr[i + 1]];
      fillPoly([[x0, 0.32, z0], [x1, 0.32, z1], [x1, 0.76, z1 - 0.06], [x0, 0.76, z0 - 0.06]], C.K,
        grad([0, 0.76, 2.2], [0, 0.32, 2.2], [[0, an(Math.max(0.12, 0.42 - i * 0.07))], [1, an(0)]]));
    }
    // kaput
    const hood = fr.map(([x, z]) => [x, 0.76, z - 0.06]).concat([[0.86, 1.0, 0.98], [-0.86, 1.0, 0.98]]);
    fillPoly(hood, C.K, grad([-0.86, 1.0, 0.98], [0.9, 0.76, 1.9], [[0, an(0.32)], [1, an(0.04)]]));
    ctx.save(); path(hood); ctx.clip();
    const hr = P([-0.5, 0.9, 1.35]), hg = ctx.createRadialGradient(hr[0], hr[1], 0, hr[0], hr[1], 8);
    hg.addColorStop(0, kb(0.1)); hg.addColorStop(1, kb(0));
    ctx.fillStyle = hg; ctx.fillRect(hr[0] - 9, hr[1] - 9, 18, 18);
    ctx.restore();

    // kabin yanı (direkler) + yan camlar
    const green = [[-0.86, 1.0, 0.98]].concat(railPts(0, 1, -1, 16), [[-0.76, 1.13, -2.08], [-0.86, 1.08, -2.0]]);
    fillPoly(green, C.K, an(0.35));
    const win1 = [[-0.845, 1.05, 0.8]].concat(railPts(0.05, 0.4, -1, 8, 0.05, -0.012), [[-0.845, 1.06, -0.46]]);
    const win2 = [[-0.845, 1.065, -0.6]].concat(railPts(0.47, 0.9, -1, 8, 0.05, -0.012), [[-0.79, 1.13, -1.86]]);
    [win1, win2].forEach((wp, i) => {
      fillPoly(wp, C.K, grad(wp[2], wp[0], [[0, an(1)], [1, an(0.5)]]));
      ctx.save(); path(wp); ctx.clip();
      const a = P(wp[3]), g = ctx.createLinearGradient(a[0] - 5, a[1] - 2, a[0] + 5, a[1] + 9);
      g.addColorStop(0, kb(0)); g.addColorStop(0.42, kb(i ? 0.2 : 0.12)); g.addColorStop(0.62, kb(0.02)); g.addColorStop(1, kb(0));
      ctx.fillStyle = g; path(wp); ctx.fill();
      ctx.restore();
    });
    // tavan (üstten ince şerit)
    const roof = railPts(0, 1, -1, 16).concat(railPts(0, 1, 1, 16).reverse());
    fillPoly(roof, C.K, grad(roofRail(1, -1), roofRail(0, -1), [[0, kb(0.22)], [0.6, an(0.8)], [1, an(0.6)]]));

    // ön cam: gövdeden açık, yansımalı cam + torpido gölgesi
    const wsTop = [roofRail(0, -1), [0, 1.535, 0.24], roofRail(0, 1)];
    const glassPath = () => { ctx.beginPath(); let q = P(WS[0]); ctx.moveTo(q[0], q[1]); q = P(WS[1]); ctx.lineTo(q[0], q[1]);
      const a = P(wsTop[2]), m = P(wsTop[1]), b = P(wsTop[0]); ctx.lineTo(a[0], a[1]); ctx.quadraticCurveTo(2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2, b[0], b[1]); ctx.closePath(); };
    glassPath(); ctx.fillStyle = C.K; ctx.fill();
    ctx.fillStyle = an(1); ctx.fill();
    ctx.save(); glassPath(); ctx.clip();
    ctx.fillStyle = grad(WS[3], WS[1], [[0, kb(0.2)], [0.45, kb(0.07)], [1, kb(0.03)]]); ctx.fillRect(0, 0, 200, 200);
    // tek, geniş, kavisli parlama (camın üst yarısında lambanın yansıması)
    { const a = P(glassPoint(0.05, 0.78)), b = P(glassPoint(1.2, 0.5)), c = P(glassPoint(1.64, 0.02)), d = P(glassPoint(1.1, 0.02)), e = P(glassPoint(0.4, 0.5));
      const sg = ctx.createLinearGradient(a[0], a[1], c[0], c[1]); sg.addColorStop(0, kb(0.12)); sg.addColorStop(1, kb(0.02));
      ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.quadraticCurveTo(e[0], e[1], a[0] - 1.2, a[1] + 1.6); ctx.closePath(); ctx.fill(); }
    fillPoly([WS[0], WS[1], glassPoint(1.7, 0.1), glassPoint(0, 0.1)], bk(0.6));             // torpido
    const lr = P(glassPoint(0.3, 0.66)), lg = ctx.createRadialGradient(lr[0], lr[1], 0, lr[0], lr[1], 10);
    lg.addColorStop(0, kb(0.24)); lg.addColorStop(0.5, kb(0.06)); lg.addColorStop(1, kb(0));
    ctx.fillStyle = lg; ctx.fillRect(lr[0] - 13, lr[1] - 13, 26, 26);
    ctx.restore();
    rim([WS[0], WS[1]], grad(WS[0], WS[1], [[0, kb(0.45)], [1, kb(0.12)]]), 0.26);          // cam alt fitili

    // yakın tekerler: lastik + jant + üst kenar ışığı
    [-WZ, WZ].forEach((zc, i) => {
      fillPoly(arcZY(zc, WY, WR, 0, Math.PI * 2, -0.93, 32), C.K);
      const rimP = arcZY(zc, WY, 0.22, 0, Math.PI * 2, -0.95, 32);
      fillPoly(rimP, C.K, grad([-0.95, WY + 0.22, zc], [-0.95, WY - 0.22, zc], [[0, an(1)], [1, an(0.3)]]));
      ctx.strokeStyle = kb(0.14); ctx.lineWidth = 0.18;
      for (let k = 0; k < 5; k++) {
        const a = k * Math.PI * 2 / 5 + 0.3;
        path([[-0.955, WY + 0.05 * Math.sin(a), zc + 0.05 * Math.cos(a)], [-0.955, WY + 0.2 * Math.sin(a), zc + 0.2 * Math.cos(a)]], false); ctx.stroke();
      }
      rim(arcZY(zc, WY, WR - 0.01, Math.PI * 0.95, Math.PI * 0.45, -0.93, 10), kb(i ? 0.2 : 0.4), 0.26);
      rim(arcZY(zc, WY, AR, Math.PI * 0.98, Math.PI * 0.35, X, 12), kb(i ? 0.28 : 0.5), 0.28);
    });

    // gündüz farı: ön köşeyi saran ince LED hattı
    const drl = [[0.9, 0.68, 1.84], [0.86, 0.685, 2.0], [0.76, 0.69, 2.1], [0.5, 0.69, 2.155], [-0.5, 0.69, 2.155], [-0.76, 0.69, 2.1], [-0.86, 0.685, 2.0], [-0.9, 0.68, 1.84]];
    ctx.save(); ctx.shadowColor = kb(0.9); ctx.shadowBlur = 0.9 * px;
    rim(drl, C.KB, 0.4); ctx.restore();
    rim(fr.slice(0, 5).map(([x, z]) => [x, 0.34, z]), an(1), 0.3);

    // kenar ışıkları (lamba solda, arkada ve yukarıda): arkaya doğru parlar, öne doğru söner
    rim(railPts(0, 1, -1, 16).concat([[-0.76, 1.13, -2.08]]),
      grad(roofRail(0, -1), roofRail(1, -1), [[0, kb(0.5)], [1, C.KB]]), 0.45);
    rim(wsTop, grad(wsTop[0], wsTop[2], [[0, kb(0.7)], [1, kb(0.16)]]), 0.34);
    rim([[-0.86, 1.0, 0.98], [-0.66, 1.5, 0.25]], grad([-0.86, 1.0, 0.98], [-0.66, 1.5, 0.25], [[0, kb(0.3)], [1, kb(0.75)]]), 0.36);
    rim([[-0.86, 1.0, 0.98], [-0.86, 1.08, -2.0]], grad([-0.86, 1.0, 0.98], [-0.86, 1.08, -2.0], [[0, kb(0.22)], [1, kb(0.75)]]), 0.3);
    rim([[-0.9, 0.75, 1.9], [-0.86, 1.0, 0.98]], grad([-0.9, 0.75, 1.9], [-0.86, 1.0, 0.98], [[0, kb(0.2)], [1, kb(0.5)]]), 0.3);
    // uzak kenarlar: yalnız silueti tanımlayan sönük hat
    rim([[0.82, 1.01, 0.98], [0.66, 1.5, 0.25]], kb(0.3), 0.26);
    rim([[0.86, 1.0, 0.98], [0.9, 0.76, 1.84], [0.86, 0.76, 1.99]], kb(0.14), 0.24);
    ctx.restore();
  }

  // ------------------------------------------------------------ SAHNE: el + telefon
  // Omuz üstü plan: telefonun arka kamerası araca, ekranı bize dönük. Telefon yerel koordinatlarında
  // (0,0 sol üst; w × h). handBack(): telefonun arkasında kalan avuç + aşağı inen bilek (sahnenin alt
  // kenarından çıkar, yan bigiye değmez). handFront(): sol kenardan kıvrılan başparmak + sağ kenarda
  // telefonu kavrayan 4 parmak ucu. Çizgisel silüet: siyah/antrasit dolgu, lamba tarafında kırık beyaz kontur.
  function handBack(ctx, w, h) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const palm = () => {
      ctx.beginPath();
      ctx.moveTo(-1.2, h * 0.64);
      ctx.bezierCurveTo(-3.6, h * 0.74, -3.9, h * 0.9, -1.2, h + 2.4);   // avuç sol kenarı (başparmak kökü)
      ctx.bezierCurveTo(0.8, h + 5.4, 2.6, h + 9, 3.4, h + 26);          // bileğin sol kenarı → aşağı
      ctx.lineTo(w - 1.4, h + 26);
      ctx.bezierCurveTo(w - 0.8, h + 12, w + 1.8, h + 5, w + 2.4, h * 0.95);  // bileğin sağ kenarı (yan bigiden uzak)
      ctx.lineTo(w + 2.6, h * 0.5);
      ctx.lineTo(w * 0.5, h * 0.5);
      ctx.closePath();
    };
    palm();
    ctx.fillStyle = C.K; ctx.fill();
    const fg = ctx.createLinearGradient(0, h * 0.8, 0, h + 20);
    fg.addColorStop(0, an(1)); fg.addColorStop(1, an(0));
    ctx.fillStyle = fg; ctx.fill();
    // kontur: lamba tarafı (sol) aydınlık, aşağı doğru karanlığa söner
    const eg = ctx.createLinearGradient(0, h * 0.7, 0, h + 18);
    eg.addColorStop(0, kb(0.9)); eg.addColorStop(0.55, kb(0.4)); eg.addColorStop(1, kb(0));
    ctx.strokeStyle = eg; ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(-1.2, h * 0.64);
    ctx.bezierCurveTo(-3.6, h * 0.74, -3.9, h * 0.9, -1.2, h + 2.4);
    ctx.bezierCurveTo(0.8, h + 5.4, 2.6, h + 9, 3.4, h + 26);
    ctx.stroke();
    const eg2 = ctx.createLinearGradient(0, h * 0.8, 0, h + 16);
    eg2.addColorStop(0, kb(0.35)); eg2.addColorStop(1, kb(0));
    ctx.strokeStyle = eg2; ctx.lineWidth = 0.26;
    ctx.beginPath(); ctx.moveTo(w + 2.4, h * 0.95); ctx.bezierCurveTo(w + 1.8, h + 5, w - 0.8, h + 12, w - 1.4, h + 26); ctx.stroke();
    // avuç çizgisi (telefonun altından görünen kısım)
    ctx.strokeStyle = kb(0.22); ctx.lineWidth = 0.2;
    ctx.beginPath(); ctx.moveTo(2.4, h + 2.2); ctx.quadraticCurveTo(w * 0.45, h + 4.6, w - 1.5, h + 2.0); ctx.stroke();
  }
  function handFront(ctx, w, h) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const skin = (x0, x1) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, C.A); g.addColorStop(1, C.K); return g;
    };
    // sağ kenar: telefonu arkadan kavrayan 4 parmak (işaret → serçe). Kalınlık, çerçeveye binme ve açı
    // parmaktan parmağa değişir (yelpaze); her parmakta uç boğumu (çerçeve kenarı) ve orta boğum çizgisi.
    const F = [[0.5, 3.5, 1.5, -7], [0.588, 3.8, 2.3, -2], [0.682, 3.6, 1.9, 3], [0.772, 3.0, 1.1, 9]];
    F.forEach(([f, fh, ov, deg], i) => {
      const y = h * f, x0 = w - ov, x1 = w + 3.0 - i * 0.35, cy = y + fh / 2;
      ctx.save(); ctx.translate(w, cy); ctx.rotate(deg * Math.PI / 180); ctx.translate(-w, -cy);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x0 + fh / 2, y);
      ctx.arc(x0 + fh / 2, cy, fh / 2, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(x1, y + fh);
      ctx.quadraticCurveTo(x1 + 1.2, cy, x1, y);
      ctx.closePath();
      ctx.fillStyle = skin(x1, x0); ctx.fill();
      ctx.strokeStyle = kb(0.72 - i * 0.1); ctx.lineWidth = 0.24; ctx.stroke();
      ctx.lineWidth = 0.17;
      ctx.strokeStyle = kb(0.34);
      ctx.beginPath(); ctx.moveTo(w + 0.55, y + fh * 0.2); ctx.quadraticCurveTo(w + 0.15, cy, w + 0.55, y + fh * 0.8); ctx.stroke();
      const jx = w + 2.1 - i * 0.3;
      ctx.strokeStyle = kb(0.2);
      ctx.beginPath(); ctx.moveTo(jx, y + fh * 0.26); ctx.quadraticCurveTo(jx - 0.3, cy, jx, y + fh * 0.74); ctx.stroke();
      ctx.restore();
    });
    // sol kenar: başparmak avuçtan yukarı çıkar, ucu çerçeveye kıvrılır
    ctx.beginPath();
    ctx.moveTo(-3.3, h * 0.88);
    ctx.bezierCurveTo(-4.4, h * 0.78, -3.6, h * 0.64, -1.6, h * 0.585);
    ctx.bezierCurveTo(-0.2, h * 0.55, 1.9, h * 0.565, 2.0, h * 0.605);
    ctx.bezierCurveTo(2.05, h * 0.64, 0.9, h * 0.655, 0.2, h * 0.7);
    ctx.bezierCurveTo(-0.5, h * 0.76, -0.4, h * 0.84, -0.2, h * 0.9);
    ctx.closePath();
    ctx.fillStyle = skin(-4, 2); ctx.fill();
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.3; ctx.stroke();
    ctx.strokeStyle = kb(0.4); ctx.lineWidth = 0.18;
    ctx.beginPath(); ctx.moveTo(-0.3, h * 0.575); ctx.quadraticCurveTo(1.1, h * 0.572, 1.5, h * 0.6); ctx.stroke();
  }

  // ------------------------------------------------------------ rozet: yuvarlak mühür
  function stamp(ctx, cx, cy, R, ang) {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 1.5 * (ctx.getTransform().a || 10); ctx.shadowOffsetY = 0.5 * (ctx.getTransform().a || 10);
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // dişli kenar (damga)
    ctx.fillStyle = C.Y; ctx.beginPath();
    const n = 44;
    for (let i = 0; i <= n * 2; i++) {
      const a = i * Math.PI / n, r = i % 2 ? R + 0.55 : R - 0.05;
      i ? ctx.lineTo(r * Math.cos(a), r * Math.sin(a)) : ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
    }
    ctx.fill();
    ctx.strokeStyle = C.K100; ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(0, 0, R - 1.05, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 0.28;
    const ri = R - 4.55;
    ctx.beginPath(); ctx.arc(0, 0, ri, 0, Math.PI * 2); ctx.stroke();
    // çevre yazısı (üst yay) : "CAMA NUMARA YAZMAYA SON"
    const ring = 'CAMA NUMARA YAZMAYA SON', rs = 6.2 * PT, rb = R - 3.75;
    ctx.font = `800 ${rs}px ${INTER}`; ctx.fillStyle = C.K100; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const sp = 0.16, total = [...ring].reduce((a, ch) => a + ctx.measureText(ch).width + sp, -sp);
    let a0 = -Math.PI / 2 - (total / rb) / 2;
    [...ring].forEach(ch => {
      const cw = ctx.measureText(ch).width, a = a0 + (cw / 2) / rb;
      ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.fillText(ch, 0, -rb); ctx.restore();
      a0 += (cw + sp) / rb;
    });
    // alt yay: yıldızlar
    [-0.62, -0.31, 0, 0.31, 0.62].forEach(d => {
      const a = Math.PI / 2 + d, x = (R - 2.8) * Math.cos(a), y = (R - 2.8) * Math.sin(a);
      star(ctx, x, y, 0.72, C.K100);
    });
    // merkez: ana rozet ifadesi
    const cs = 7.0 * PT;
    [['Artık', -2.35], ['numaratöre', 0.75], ['gerek yok', 3.85]].forEach(([s, y]) =>
      txt(ctx, s, 0, y + 0.95, { size: cs, w: 900, color: C.K100, align: 'center' }));
    ctx.restore();
  }
  function star(ctx, x, y, r, c) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr_ = i % 2 ? r * 0.45 : r;
      const px = x + rr_ * Math.cos(a), py = y + rr_ * Math.sin(a);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fillStyle = c; ctx.fill();
  }

  // ------------------------------------------------------------ ÖN YÜZ
  const FRONT_CAM = { C: [-4.6, 2.9, 10.3], T: [0.0, 0.9, 0.4], s: 318, ox: 45, oy: 51 };
  function front(ctx, w, h, px) {
    const groundY = 80;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, FRONT_BAND); ctx.clip();

    // gece: üstte siyah, ortada antrasit pus, lambanın sol öndeki asfalt havuzu
    const sky = ctx.createLinearGradient(0, 0, 0, FRONT_BAND);
    sky.addColorStop(0, an(0)); sky.addColorStop(0.45, an(0.3)); sky.addColorStop(0.72, an(0.5)); sky.addColorStop(1, an(0.1));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, FRONT_BAND);
    ctx.save(); ctx.translate(15, 71); ctx.scale(1, 0.32);
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 34);
    pool.addColorStop(0, kb(0.16)); pool.addColorStop(0.5, kb(0.06)); pool.addColorStop(1, kb(0));
    ctx.fillStyle = pool; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    streetLamp(ctx, groundY);

    // araç (3/4 perspektif)
    const K = FRONT_CAM, P3 = camera(K.C, K.T, K.s, K.ox, K.oy);
    car34(ctx, P3, px);
    // sol bigiye doğru karartma: aracın kadrajdan taşan arkasındaki ince ışık hatları bigiye ulaşmadan söner
    const lf = ctx.createLinearGradient(0, 0, 6, 0);
    lf.addColorStop(0, bk(0.92)); lf.addColorStop(0.4, bk(0.5)); lf.addColorStop(1, bk(0));
    ctx.fillStyle = lf; ctx.fillRect(0, 0, 6, FRONT_BAND);

    // telefon (sağ altta, omuz üstü plan; ekran bize, arka kamera araca dönük)
    const pw = 24, ph = 48, pcx = 73.6, pcy = 72.4, pa = -8 * Math.PI / 180;
    const PP = (x, y) => { const r = rot(x - pw / 2, y - ph / 2, pa); return [pcx + r[0], pcy + r[1]]; };

    // sticker: ön camın SOL ALT köşesi, cam düzleminde (perspektifle eğik). Gerçek 50 × 80 mm etiket,
    // okunurluk için sahnede büyütülmüş (≈ 21 × 34 cm eşdeğeri) — yine de camın yarısından azını kaplar.
    const su = 0.11, sv = 0.05, sW = 0.245, sH = sW * 1.6;
    const TL = P3(glassPoint(su, sv + sH)), TR = P3(glassPoint(su + sW, sv + sH)),
          BL = P3(glassPoint(su, sv)), BR = P3(glassPoint(su + sW, sv));
    const LW = 10, LH = 16;                       // sticker yerel ölçüsü (L.sticker 5:8)
    const toLocal = () => ctx.transform((TR[0] - TL[0]) / LW, (TR[1] - TL[1]) / LW, (BL[0] - TL[0]) / LH, (BL[1] - TL[1]) / LH, TL[0], TL[1]);

    // tarama ışını: telefonun üst kenarından sticker'a (dolgu sticker çevresinde ≤ 0,22)
    const [ax, ay] = PP(pw * 0.5, 0.9);
    const beam = ctx.createLinearGradient(ax, ay, (TL[0] + BR[0]) / 2, (TL[1] + BR[1]) / 2);
    beam.addColorStop(0, ye(0.03)); beam.addColorStop(0.75, ye(0.13)); beam.addColorStop(1, ye(0.22));
    ctx.fillStyle = beam;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(TR[0], TR[1]); ctx.lineTo(TL[0], TL[1]); ctx.lineTo(BL[0], BL[1]); ctx.lineTo(BR[0], BR[1]); ctx.closePath(); ctx.fill();
    const edgeG = ctx.createLinearGradient(ax, ay, TR[0], TR[1]);
    edgeG.addColorStop(0, ye(0.15)); edgeG.addColorStop(1, ye(0.85));
    ctx.strokeStyle = edgeG; ctx.lineWidth = 0.24; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(TR[0], TR[1]); ctx.moveTo(ax, ay); ctx.lineTo(BR[0], BR[1]); ctx.stroke();

    // sticker + sarı ışıma (camın üstünde, cam düzleminde)
    ctx.save(); toLocal();
    ctx.save(); ctx.shadowColor = ye(0.75); ctx.shadowBlur = 1.0 * px;
    ctx.fillStyle = C.W; rr(ctx, -0.25, -0.25, LW + 0.5, LH + 0.5, LW * 112 / 764 + 0.25); ctx.fill(); ctx.restore();
    L.sticker(ctx, 0, 0, LW, { edge: 16 });
    // tarama çizgisi: QR kartının üzerinden geçen yatay lazer + arkasında sönen iz
    const scy = LH * 0.44;
    const trail = ctx.createLinearGradient(0, scy - 3.2, 0, scy);
    trail.addColorStop(0, ye(0)); trail.addColorStop(1, ye(0.42));
    ctx.fillStyle = trail; ctx.fillRect(0.45, scy - 3.2, LW - 0.9, 3.2);
    ctx.save(); ctx.shadowColor = ye(1); ctx.shadowBlur = 0.8 * px;
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-1.6, scy); ctx.lineTo(LW + 1.6, scy); ctx.stroke(); ctx.restore();
    ctx.restore();
    // cam yansıması sticker'ın üst köşesinden geçer (etiket camın arkasında/üstünde okunur)
    ctx.save(); ctx.beginPath(); ctx.moveTo(TL[0], TL[1]); ctx.lineTo(TR[0], TR[1]); ctx.lineTo(BR[0], BR[1]); ctx.lineTo(BL[0], BL[1]); ctx.closePath(); ctx.clip();
    const rf = ctx.createLinearGradient(TL[0], TL[1], BR[0], BR[1]);
    rf.addColorStop(0, kb(0.16)); rf.addColorStop(0.3, kb(0.05)); rf.addColorStop(0.5, kb(0));
    ctx.fillStyle = rf; ctx.fillRect(TL[0] - 2, TL[1] - 2, 16, 16);
    ctx.restore();

    // sinematik vinyet
    const vg = ctx.createRadialGradient(w * 0.42, 50, 28, w * 0.42, 50, 78);
    vg.addColorStop(0, bk(0)); vg.addColorStop(1, bk(0.6));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, FRONT_BAND);
    // başlık için alt karartma
    const sc = ctx.createLinearGradient(0, 78, 0, 91);
    sc.addColorStop(0, bk(0)); sc.addColorStop(1, bk(0.92));
    ctx.fillStyle = sc; ctx.fillRect(0, 78, w, FRONT_BAND - 78);

    // el + telefon (ön plan)
    ctx.save();
    ctx.translate(pcx, pcy); ctx.rotate(pa); ctx.translate(-pw / 2, -ph / 2);
    handBack(ctx, pw, ph);
    L.phone(ctx, 0, 0, pw, ph, px);
    handFront(ctx, pw, ph);
    ctx.restore();

    ctx.restore();   // sahne kırpması

    // rozet: yuvarlak mühür (sarı zemin, siyah yazı; lak almaz)
    stamp(ctx, 78.6, 27.8, 12.6, -11 * Math.PI / 180);

    // üst: sarı logo (lokal UV lak) + by Candemsoft
    L.logo(ctx, SAFE + 2, SAFE + 1.5, 9, C.Y);
    txt(ctx, 'by Candemsoft', w - SAFE - 2, SAFE + 1.5 + 5.6, { size: 7 * PT, w: 500, color: C.W, align: 'right' });

    // ürün adı (film afişi künyesi gibi sahnenin altında) + alt satır
    const ts = 24 * PT, tx = SAFE + 2, tb = 93.2;
    const w1 = otxt(ctx, 'KİŞİSEL ', tx, tb, { size: ts, w: 800, color: C.W, ls: 0.15 });
    otxt(ctx, 'QR', tx + w1, tb, { size: ts, w: 800, color: C.Y, ls: 0.15 });
    txt(ctx, 'Akıllı Araç Etiketi + Dijital Kartvizit', tx, tb + 5.3, { size: 7.5 * PT, w: 600, color: C.KB });

    // sarı bant: 2 × 2 ikon ızgarası (10 × 10 mm ikon + 8 pt etiket)
    const items = [['gizli', 'Numaran', 'gizli'], ['bildirim', 'Anında', 'bildirim'],
                   ['kartvizit', 'Dijital', 'kartvizit'], ['ucretsiz', 'Aylık', 'ücret yok']];
    const colX = [SAFE + 2.2, w / 2 + 2.6], rowY = [FRONT_BAND + 2.6, FRONT_BAND + 13.6];
    items.forEach((it, i) => {
      const x = colX[i % 2], y = rowY[Math.floor(i / 2)];
      ctx.save(); ctx.translate(x, y); L.ICONS[it[0]](ctx); ctx.restore();
      txt(ctx, it[1], x + 12.6, y + 4.4, { size: 8 * PT, w: 700, color: C.K100 });
      txt(ctx, it[2], x + 12.6, y + 7.9, { size: 8 * PT, w: 700, color: C.K100 });
    });
    ctx.strokeStyle = C.K100; ctx.lineWidth = 0.25;
    ctx.beginPath(); ctx.moveTo(w / 2, rowY[0] + 0.5); ctx.lineTo(w / 2, rowY[1] + 9.5); ctx.stroke();
    // en alt 10 mm (mühür bandı): yalnız zemin rengi
  }

  // ------------------------------------------------------------ ARKA: film şeridi kareleri
  function frameGlass(ctx, fw, fh) {           // ön cam sol alt köşesi, yakın plan
    const gl = () => { ctx.beginPath(); ctx.moveTo(5.5, -1); ctx.lineTo(fw + 1, -1); ctx.lineTo(fw + 1, fh - 3.6); ctx.quadraticCurveTo(fw * 0.5, fh - 3.0, 1.8, fh - 3.2); ctx.closePath(); };
    gl();
    const g = ctx.createLinearGradient(0, 0, fw, fh);
    g.addColorStop(0, an(1)); g.addColorStop(1, an(0.25));
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); gl(); ctx.clip(); ctx.fillStyle = kb(0.06);
    ctx.beginPath(); ctx.moveTo(fw * 0.55, 0); ctx.lineTo(fw * 0.7, 0); ctx.lineTo(fw * 0.45, fh); ctx.lineTo(fw * 0.3, fh); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = C.KB; ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.moveTo(5.5, -1); ctx.lineTo(1.8, fh - 3.2); ctx.quadraticCurveTo(fw * 0.5, fh - 3.0, fw + 1, fh - 3.6); ctx.stroke();
  }
  function frame1(ctx, fw, fh) {                // Sticker'ı cama yapıştır
    frameGlass(ctx, fw, fh);
    const sw = 6.4, sh = sw * 1.6, tx = 5.2, ty = fh - 4.3 - sh;
    // hedef: camın sol alt köşesi (kesikli sarı çerçeve)
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.3; ctx.setLineDash([0.7, 0.5]);
    rr(ctx, tx, ty, sw, sh, sw * 112 / 764); ctx.stroke(); ctx.setLineDash([]);
    // sticker yerine doğru iniyor (hafif eğik, gölgeli)
    const x = tx + 10.2, y = ty - 2.6, a = 9 * Math.PI / 180;
    ctx.save(); ctx.translate(x + sw / 2, y + sh / 2); ctx.rotate(a);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    ctx.fillStyle = C.W; rr(ctx, -sw / 2, -sh / 2, sw, sh, sw * 112 / 764); ctx.fill(); ctx.restore();
    L.sticker(ctx, -sw / 2, -sh / 2, sw, { edge: 16 });
    ctx.restore();
    // hareket oku: sticker → hedef
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.45; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const x0 = x - 0.6, y0 = y + sh * 0.78, x1 = tx + sw + 0.9, y1 = ty + sh * 0.62;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 2.2, x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1 + 1.3, y1 + 0.2); ctx.lineTo(x1, y1); ctx.lineTo(x1 + 0.6, y1 + 1.2); ctx.stroke();
  }
  function frame2(ctx, fw, fh, px) {            // Biri QR'ı okutur
    frameGlass(ctx, fw, fh);
    const sw = 6.2, sh = sw * 1.6, x = 5.4, y = fh - 4.4 - sh;
    const pw = 7.6, ph = 15.2, pcx = fw - 5.4, pcy = fh * 0.5, pa = -10 * Math.PI / 180;
    const top = rot(0, -ph / 2 + 0.4, pa), ax = pcx + top[0], ay = pcy + top[1];
    const bm = ctx.createLinearGradient(ax, ay, x + sw, y + sh / 2);
    bm.addColorStop(0, ye(0.08)); bm.addColorStop(1, ye(0.45));
    ctx.fillStyle = bm;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x + sw + 0.8, y - 0.8); ctx.lineTo(x - 0.8, y - 0.8); ctx.lineTo(x - 0.8, y + sh + 0.8); ctx.lineTo(x + sw + 0.8, y + sh + 0.8); ctx.closePath(); ctx.fill();
    L.sticker(ctx, x, y, sw, { edge: 16 });
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.3;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x + sw + 0.8, y - 0.8); ctx.moveTo(ax, ay); ctx.lineTo(x + sw + 0.8, y + sh + 0.8); ctx.stroke();
    // L.phone köşe yarıçapı sabit (4,2 mm) → tam boy çizip ölçekle
    const sc = pw / 22;
    ctx.save(); ctx.translate(pcx, pcy); ctx.rotate(pa); ctx.scale(sc, sc);
    L.phone(ctx, -11, -22, 22, 44, px * sc);
    ctx.restore();
  }
  function frame3(ctx, fw, fh) {                // Bildirim sana gelir, numaran gizli
    // bildirim kartı
    const cx0 = 2.4, cy0 = 3.0, cw = fw - 4.8, ch = 7.6;
    ctx.fillStyle = C.KB; rr(ctx, cx0, cy0, cw, ch, 1.6); ctx.fill();
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(cx0 + 3.9, cy0 + ch / 2, 2.75, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(cx0 + 3.9 - 2.2, cy0 + ch / 2 - 2.2); ctx.scale(0.44, 0.44); L.ICONS.bildirim(ctx); ctx.restore();
    ctx.fillStyle = C.A; rr(ctx, cx0 + 8, cy0 + 2.1, cw - 11, 1.15, 0.55); ctx.fill();
    ctx.fillStyle = an(0.45); rr(ctx, cx0 + 8, cy0 + 4.4, cw - 15, 1.15, 0.55); ctx.fill();
    // çağrı sinyali
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.4; ctx.lineCap = 'round';
    [2.0, 3.3].forEach(r => { ctx.beginPath(); ctx.arc(cx0 + 3.9, cy0 + ch / 2, r + 2.4, -Math.PI * 0.85, -Math.PI * 0.62); ctx.stroke(); });
    // gizli numara: göz-çizgi ikonu + maskeli hane noktaları
    const ny = fh - 7.4;
    ctx.fillStyle = C.A; rr(ctx, cx0, ny - 2.6, cw, 7.0, 3.5); ctx.fill();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 0.3; rr(ctx, cx0, ny - 2.6, cw, 7.0, 3.5); ctx.stroke();
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(cx0 + 3.6, ny + 0.9, 2.45, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(cx0 + 3.6 - 1.9, ny + 0.9 - 1.9); ctx.scale(0.38, 0.38); L.ICONS.gizli(ctx); ctx.restore();
    const groups = [4, 3, 2, 2]; let dx = cx0 + 7.4;
    ctx.fillStyle = C.KB;
    groups.forEach(n => { for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(dx, ny + 0.9, 0.42, 0, Math.PI * 2); ctx.fill(); dx += 1.08; } dx += 0.75; });
  }

  // ------------------------------------------------------------ ARKA YÜZ
  function back(ctx, w, h, px) {
    const Lx = SAFE, R = w - SAFE, cw = R - Lx;
    otxt(ctx, 'Nasıl çalışır?', Lx, 9.8, { size: 13 * PT, w: 800, color: C.Y });
    const desc = "Kişisel QR'ı aracının ön camına yapıştır. Sana ulaşmak isteyen QR'ı telefonuyla okutur, " +
                 'bildirim sana gelir; numaran görünmez. Aynı profil dijital kartvizitin olur: widget ile paylaş, ' +
                 'sosyal medyada link olarak kullan.';
    const ds = 7.2 * PT;
    const dl = wrap(ctx, desc, cw, ds, 500);
    dl.forEach((ln, i) => txt(ctx, ln, Lx, 14.4 + i * 3.2, { size: ds, w: 500, color: C.W }));

    // film şeridi: 3 kare
    const fy0 = 26.9, fh0 = 24.2, gap = 2.6;
    ctx.fillStyle = C.A; rr(ctx, Lx, fy0, cw, fh0, 1.0); ctx.fill();
    ctx.fillStyle = C.K100;   // küçük delik kareleri tek kanal K100 (zengin siyah kayıt kaymasında renkli hale bırakır)
    for (let x = Lx + 1.4; x < R - 1.5; x += 2.75) {
      rr(ctx, x, fy0 + 0.75, 1.35, 1.0, 0.3); ctx.fill();
      rr(ctx, x, fy0 + fh0 - 1.75, 1.35, 1.0, 0.3); ctx.fill();
    }
    const fw = (cw - 2 * 1.2 - 2 * gap) / 3, fh = fh0 - 5.4, fy = fy0 + 2.7;
    const caps = [["Sticker'ı cama", 'yapıştır'], ["Biri QR'ı", 'okutur'], ['Bildirim sana gelir,', 'numaran gizli']];
    [frame1, frame2, frame3].forEach((fn, i) => {
      const fx = Lx + 1.2 + i * (fw + gap);
      ctx.save();
      ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
      ctx.fillStyle = C.K; ctx.fillRect(fx, fy, fw, fh);
      ctx.translate(fx, fy); fn(ctx, fw, fh, px);
      ctx.restore();
      // kare sırası ok'u
      if (i < 2) {
        const ax = fx + fw + gap / 2, ay = fy + fh / 2;
        ctx.strokeStyle = C.Y; ctx.lineWidth = 0.45; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(ax - 0.5, ay - 1.1); ctx.lineTo(ax + 0.55, ay); ctx.lineTo(ax - 0.5, ay + 1.1); ctx.stroke();
      }
      const mx = fx + fw / 2;
      txt(ctx, caps[i][0], mx, fy0 + fh0 + 3.5, { size: 7 * PT, w: 600, color: C.W, align: 'center' });
      txt(ctx, caps[i][1], mx, fy0 + fh0 + 6.5, { size: 7 * PT, w: 600, color: C.W, align: 'center' });
    });

    // 3 adım: 1 Temizle · 2 Yapıştır · 3 Aktif Et (sarı daire, siyah rakam)
    const steps = ['Temizle', 'Yapıştır', 'Aktif Et'], stY = 64.9, ss = 7.5 * PT;
    const gw = steps.map(s => 5.0 + 1.5 + tw(ctx, s, ss, 700));
    const sgap = (cw - gw.reduce((a, b) => a + b, 0)) / 2;
    let gx = Lx;
    steps.forEach((s, i) => {
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(gx + 2.5, stY - 0.95, 2.5, 0, Math.PI * 2); ctx.fill();
      txt(ctx, String(i + 1), gx + 2.5, stY + 0.1, { size: 3.0, w: 800, color: C.K100, align: 'center' });
      txt(ctx, s, gx + 6.5, stY, { size: ss, w: 700, color: C.W });
      if (i < 2) {
        const dx = gx + gw[i] + sgap / 2;
        ctx.fillStyle = an(1); ctx.fillRect(dx - sgap / 2 + 2, stY - 1.1, sgap - 4, 0.3);
      }
      gx += gw[i] + sgap;
    });

    // özellikler (sol) — sarı tik
    const feats = ['Numaran gizli kalır, sana yine ulaşılır.', 'Mesaj ve bildirim anında telefonunda.',
                   'Dijital kartvizitini uygulamada oluştur.', 'Profilini sosyal medyada paylaş.',
                   'Aracın olmasa da kullan: kartvizit olarak yeterli.'];
    const Q = window.KQR_QR_APP, n = Q ? Q.rows.length : 29, qs = 20, qm = qs / n, qz = 4 * qm, box = qs + 2 * qz;
    const qx = R - box, qy = 69.0;
    const fx = Lx, fwid = qx - 4 - fx - 4.4, fs = 7 * PT;
    let fyy = 72.0;
    feats.forEach(f => {
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(fx + 1.45, fyy - 0.85, 1.45, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.K100; ctx.lineWidth = 0.32; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(fx + 0.8, fyy - 0.85); ctx.lineTo(fx + 1.3, fyy - 0.3); ctx.lineTo(fx + 2.15, fyy - 1.4); ctx.stroke();
      const lines = wrap(ctx, f, fwid, fs, 500);
      lines.forEach((ln, i) => txt(ctx, ln, fx + 4.4, fyy + i * 2.95, { size: fs, w: 500, color: C.W }));
      fyy += lines.length > 1 ? 8.2 : 5.7;
    });

    // uygulama QR (sağ): beyaz zemin, 20 mm + 4 modül sessiz alan
    ctx.fillStyle = C.W; ctx.fillRect(qx, qy, box, box);
    L.appQR(ctx, qx + qz, qy + qz, qs);
    txt(ctx, 'Uygulamayı indir', qx + box / 2, qy + box + 3.4, { size: 7.5 * PT, w: 700, color: C.W, align: 'center' });
    txt(ctx, 'mobile.kisiselqr.com', qx + box / 2, qy + box + 6.5, { size: 7 * PT, w: 600, color: C.Y, align: 'center' });

    // alt yasal bant (sarı, K100)
    const bY = h - BACK_BAND, ls = 6.5 * PT, lc = C.K100;
    const eanW = 29.8, eanH = 20.7, ex = w - 8 - eanW, ey = h - 8 - eanH;
    const lw = ex - Lx - 3;
    // kutu içeriği (bandın üstü)
    let ly = bY + 4.3;
    txt(ctx, 'Kutu içeriği', Lx, ly, { size: 7 * PT, w: 800, color: lc }); ly += 2.95;
    ['1 QR Etiket · 1 Aktivasyon Kartı', '1 Temizleme Mendili'].forEach(t => { txt(ctx, t, Lx, ly, { size: 7 * PT, w: 500, color: lc }); ly += 2.95; });
    ly += 1.3;
    [['Üretici: Candemsoft', 700], ['[Adres – Candemsoft onayı bekleniyor]', 400],
     ['[KVKK bilgilendirme metni – onay bekleniyor]', 400], ["Türkiye'de üretilmiştir.", 600]].forEach(([s, wt]) => {
      wrap(ctx, s, lw, ls, wt).forEach(ln => { txt(ctx, ln, Lx, ly, { size: ls, w: wt, color: lc }); ly += 2.7; });
    });
    const ry = h - SAFE - 2.2;
    ctx.save(); ctx.translate(Lx + 2.1, ry - 0.9);
    ctx.strokeStyle = lc; ctx.fillStyle = lc; ctx.lineWidth = 0.32;
    for (let kk = 0; kk < 3; kk++) {
      ctx.save(); ctx.rotate(kk * 2 * Math.PI / 3);
      ctx.beginPath(); ctx.arc(0, 0, 1.75, -Math.PI * 0.95, -Math.PI * 0.45); ctx.stroke();
      const a = -Math.PI * 0.45, ax = 1.75 * Math.cos(a), ay = 1.75 * Math.sin(a);
      ctx.beginPath(); ctx.moveTo(ax + 0.55, ay + 0.05); ctx.lineTo(ax - 0.25, ay - 0.5); ctx.lineTo(ax - 0.3, ay + 0.45); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    txt(ctx, 'PAP 21', Lx + 5.0, ry, { size: ls, w: 700, color: lc });
    txt(ctx, 'SKU: [bekleniyor]', Lx + 14.2, ry, { size: ls, w: 400, color: lc });
    // EAN-13 yer tutucu (sahte barkod çizilmez)
    ctx.fillStyle = C.W; ctx.fillRect(ex, ey, eanW, eanH);
    ctx.strokeStyle = lc; ctx.lineWidth = 0.2; ctx.setLineDash([0.8, 0.6]); ctx.strokeRect(ex, ey, eanW, eanH); ctx.setLineDash([]);
    txt(ctx, 'EAN-13', ex + eanW / 2, ey + 8.4, { size: 2.9, w: 700, color: lc, align: 'center' });
    txt(ctx, 'numara bekleniyor', ex + eanW / 2, ey + 12.0, { size: 6.5 * PT, w: 500, color: lc, align: 'center' });
    txt(ctx, '29,8 × 20,7 mm · K100', ex + eanW / 2, ey + 15.2, { size: 6 * PT, w: 400, color: lc, align: 'center' });
  }

  // ------------------------------------------------------------ YANLAR
  function vertical(ctx, w, cy, fn) {           // alttan yukarı okunur
    ctx.save(); ctx.translate(w / 2, cy); ctx.rotate(-Math.PI / 2); fn(); ctx.restore();
  }
  function sideLeft(ctx, w, h) {
    const s = 7.4, t1 = 'KİŞİSEL ', t2 = 'QR';
    vertical(ctx, w, h * 0.46, () => {
      const a = otw(ctx, t1, s, 800, 0.2), b = otw(ctx, t2, s, 800, 0.2), x0 = -(a + b) / 2, by = 0.36 * s;
      otxt(ctx, t1, x0, by, { size: s, w: 800, color: C.W, ls: 0.2 });
      otxt(ctx, t2, x0 + a, by, { size: s, w: 800, color: C.Y, ls: 0.2 });
    });
    const ic = 8; L.logoIcon(ctx, (w - ic) / 2, h - SAFE - 2 - ic, ic, C.Y);
  }
  function sideRight(ctx, w, h) {
    vertical(ctx, w, (h - 8 - 15) * 0.5, () => {
      otxt(ctx, 'kisiselqr.com', 0, -0.9, { size: 4.3, w: 700, color: C.Y, align: 'center' });
      txt(ctx, 'Araç + Dijital Kartvizit', 0, 2.95, { size: 7.2 * PT, w: 600, color: C.W, align: 'center' });
    });
    // lot / tarih kutucuğu: beyaz, laksız, selefonsuz; üstünde hiçbir şey yok
    ctx.fillStyle = C.W; ctx.fillRect((w - 10) / 2, h - 8 - 15, 10, 15);
  }

  // ------------------------------------------------------------ EURO BAŞLIK
  function header(ctx, w, h, holeBottom) {
    const lh = 6, lw = L.logoWidth(ctx, lh);
    L.logo(ctx, (w - lw) / 2, holeBottom + 3.5, lh, C.K100);
  }

  // ------------------------------------------------------------ ana çizim
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
    const b2 = P.Baslik2;   // 2. kat: 180° katlanır → açınımda TERS
    inPanel(ctx, b2.x0, b2.y0, b2.x1 - b2.x0, b2.y1 - b2.y0, 180,
      (w, h) => header(ctx, w, h, (b2.y1 - g.hole2.cy) + g.hole2.h / 2));
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    [P.Arka.p.holes[0], P.Baslik2.p.holes[0]].forEach(hh => { ctx.beginPath(); trace(ctx, hh); ctx.fill(); });
    ctx.restore();
  }

  function ready() {
    const base = window.KQRTasarim1.ready();
    if (!document.fonts || !document.fonts.load) return base;
    const sample = 'KİŞİSEL QR Nasıl çalışır? kisiselqr.com ğüşıöç';
    return Promise.all([base].concat([600, 700, 800].map(wt => document.fonts.load(`${wt} 12px Outfit`, sample)))).catch(() => {});
  }

  window.KQRTasarim3 = {
    meta: { ad: 'Gece Sahnesi', renk: '#2A2A2A',
            aciklama: 'Sinematik gece sahnesi: sokak lambası altındaki aracın camındaki sticker telefonla okutuluyor; arkada 3 kareli film şeridi.' },
    render, ready,
  };
})();
