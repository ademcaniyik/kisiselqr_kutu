/*
 * Kişisel QR kutu – baskı PDF'i üreteci (tarayıcıda çalışır, harici kütüphane yok)
 *
 *   KQRMatbaa.olustur({ mod, GEO, ad, dpi, tur, onProgress })  → Promise<Uint8Array>
 *   KQRMatbaa.indir({ ...aynı, dosya })                        → PDF'i indirir
 *
 * tur = 'matbaa' : 1:1 açınım + 3 mm taşma, CMYK görsel, bıçak izi ayrı katmanda
 *                  (spot "Bicak", 0,25 pt, overprint), 2. sayfa yalnız bıçak.
 *                  TrimBox = açınım sınırı, BleedBox = +3 mm.
 * tur = 'maket'  : A3 dikey, %100 ölçek, siyah kesim/bigi çizgisi, 50 mm kontrol çizgisi.
 *
 * Grafik, tasarım modülünün render()'ı ile istenen dpi'da çizilip CMYK'ye çevrilir:
 * brifteki marka renkleri birebir CMYK değerlerine eşlenir, diğer renkler yaklaşık
 * (GCR) dönüşümle çevrilir. Yazılar görselin içindedir (vektör değil) — ofset seri
 * üretim için vektörel PDF/X ayrıca hazırlanmalıdır (Aşama 3).
 */
(function () {
  const PT = 72 / 25.4, BLEED = 3, SLUG = 12, SLUG_ALT = 18;

  // ------------------------------------------------------------ renk
  // Brif paleti → CMYK (0–255). Tutkal alanlarının ekran rengi baskısız (mürekkepsiz) sayılır.
  const MARKA = new Map([
    [0x0A0A0A, [153, 102, 102, 255]],  // Kişisel Siyah, geniş zemin: zengin siyah 60/40/40/100
    [0xFDD309, [0, 38, 255, 0]],       // Kişisel Sarı 0/15/100/0
    [0x2A2A2A, [0, 0, 0, 217]],        // Antrasit 0/0/0/85
    [0xF4F4F2, [0, 0, 5, 8]],          // Kırık beyaz 0/0/2/3
    [0xFFFFFF, [0, 0, 0, 0]],
    [0x000000, [0, 0, 0, 255]],        // küçük siyah metin: yalnız K100
    [0xE9E5DA, [0, 0, 0, 0]],          // tutkal payı / yapıştırma dili: baskısız
  ]);
  function cmyk(r, g, b) {
    const R = r / 255, G = g / 255, B = b / 255;
    const K = 1 - Math.max(R, G, B);
    if (K >= 0.999) return [0, 0, 0, 255];
    let C = (1 - R - K) / (1 - K), M = (1 - G - K) / (1 - K), Y = (1 - B - K) / (1 - K);
    // nötr koyu tonlar zengin siyaha yumuşak geçsin (K-only ile 60/40/40/100 arasında kopukluk olmasın)
    if (Math.max(r, g, b) - Math.min(r, g, b) <= 8 && K > 0.75) {
      const f = Math.min(1, (K - 0.75) / 0.21);
      C = Math.max(C, 0.6 * f); M = Math.max(M, 0.4 * f); Y = Math.max(Y, 0.4 * f);
    }
    return [Math.round(C * 255), Math.round(M * 255), Math.round(Y * 255), Math.round(K * 255)];
  }

  // ------------------------------------------------------------ yardımcılar
  const f = v => (Math.abs(v) < 1e-6 ? 0 : v).toFixed(4).replace(/\.?0+$/, '') || '0';
  const bytes = s => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; };
  const utf16 = s => '<FEFF' + Array.from(s).map(ch => ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join('') + '>';
  const CP1252 = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99 };
  const TR = { 'Ğ': 128, 'ğ': 129, 'İ': 130, 'ı': 131, 'Ş': 132, 'ş': 133 };   // /Differences ile Helvetica glifleri
  function pdfStr(s) {
    let o = '(';
    for (const ch of s) {
      let v = TR[ch] !== undefined ? TR[ch] : (CP1252[ch] !== undefined && ch !== '€' && ch !== '‚' && ch !== '„' && ch !== '…' ? CP1252[ch] : ch.charCodeAt(0));
      if (v > 255) v = 63;                       // '?'
      const c = String.fromCharCode(v);
      if (c === '(' || c === ')' || c === '\\') o += '\\' + c;
      else if (v < 32 || v > 126) o += '\\' + v.toString(8).padStart(3, '0');
      else o += c;
    }
    return o + ')';
  }
  function yolOps(cmds) {
    let o = '';
    cmds.forEach(c => {
      if (c[0] === 'M') o += `${f(c[1])} ${f(c[2])} m\n`;
      else if (c[0] === 'L') o += `${f(c[1])} ${f(c[2])} l\n`;
      else if (c[0] === 'Z') o += 'h\n';
      else if (c[0] === 'A') {
        const [, cx, cy, r, a0, a1] = c;
        const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90 - 1e-9));
        for (let i = 0; i < n; i++) {
          const t0 = (a0 + (a1 - a0) * i / n) * Math.PI / 180, t1 = (a0 + (a1 - a0) * (i + 1) / n) * Math.PI / 180;
          const k = 4 / 3 * Math.tan((t1 - t0) / 4);
          const p0 = [cx + r * Math.cos(t0), cy + r * Math.sin(t0)], p3 = [cx + r * Math.cos(t1), cy + r * Math.sin(t1)];
          const p1 = [p0[0] - k * r * Math.sin(t0), p0[1] + k * r * Math.cos(t0)];
          const p2 = [p3[0] + k * r * Math.sin(t1), p3[1] - k * r * Math.cos(t1)];
          o += `${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])} ${f(p3[0])} ${f(p3[1])} c\n`;
        }
      }
    });
    return o;
  }
  // GEO dokusundaki kesim (#191919) ve bigi (#737373) yolları
  function bicakYollari(GEO) {
    const kes = [], bigi = [];
    GEO.texture.forEach(it => {
      if (it.t !== 'p' || !it.s) return;
      if (it.s === '#191919' || it.s === '#1A1A1A') kes.push(it.c);
      else if (it.s === '#737373') bigi.push(it.c);
    });
    return { kes, bigi };
  }
  function bicakOps(GEO, renk, genislik) {
    const { kes, bigi } = bicakYollari(GEO);
    let o = `${renk}\n${f(genislik)} w 0 J 1 j\n[] 0 d\n`;
    kes.forEach(c => { o += yolOps(c) + 'S\n'; });
    o += '[3 1.5] 0 d\n';
    bigi.forEach(c => { o += yolOps(c) + 'S\n'; });
    return o;
  }
  const bekle = () => new Promise(r => setTimeout(r, 0));

  async function sikistir(u8) {
    if (typeof CompressionStream === 'undefined') throw new Error('Bu tarayıcı PDF sıkıştırmayı desteklemiyor; Chrome, Edge, Safari 16.4+ ya da Firefox 113+ kullanın.');
    const buf = await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer();
    return new Uint8Array(buf);
  }

  // ------------------------------------------------------------ grafik (CMYK)
  async function grafik(mod, GEO, dpi, ilerleme) {
    const s = dpi / 25.4, wmm = GEO.W + 2 * BLEED, hmm = GEO.H + 2 * BLEED;
    const cw = Math.round(wmm * s), ch = Math.round(hmm * s);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Tuval oluşturulamadı (' + cw + '×' + ch + ' px). Daha düşük çözünürlük seçin.');
    ctx.setTransform(s, 0, 0, s, BLEED * s, BLEED * s);
    mod.render(ctx, GEO, { px: s, baski: true });   // baski: Euro delik içine de taşma
    // Euro delikler: tasarımlar delik çevresine 3 mm taşma basar; ortası boş kalabilir. Baskıda delik
    // bıçakla atıldığı için içini, kenarından 1,5 mm içerideki zemin rengiyle tamamen doldur (tutarlı görünüm).
    GEO.panels.forEach(p => (p.holes || []).forEach(h => {
      const xs = h.map(q => q[0]), ys = h.map(q => q[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, top = Math.min(...ys);
      const px = ctx.getImageData(Math.round((cx + BLEED) * s), Math.round((top + 1.5 + BLEED) * s), 1, 1).data;
      if (px[3] < 250) return;
      ctx.save(); ctx.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`; ctx.beginPath();
      ctx.moveTo(h[0][0], h[0][1]); for (let i = 1; i < h.length; i++) ctx.lineTo(h[i][0], h[i][1]); ctx.closePath();
      ctx.fill(); ctx.restore();
    }));
    ilerleme && ilerleme(0.15, 'Renkler CMYK\'ye çevriliyor');
    await bekle();
    const out = new Uint8Array(cw * ch * 4), cache = new Map();
    const SERIT = 256;
    for (let y0 = 0; y0 < ch; y0 += SERIT) {
      const hh = Math.min(SERIT, ch - y0);
      const px = ctx.getImageData(0, y0, cw, hh).data;
      let o = y0 * cw * 4;
      for (let i = 0; i < px.length; i += 4, o += 4) {
        const a = px[i + 3];
        let r = px[i], g = px[i + 1], b = px[i + 2];
        if (a < 255) { const t = a / 255; r = Math.round(r * t + 255 * (1 - t)); g = Math.round(g * t + 255 * (1 - t)); b = Math.round(b * t + 255 * (1 - t)); }
        const key = (r << 16) | (g << 8) | b;
        let v = MARKA.get(key) || cache.get(key);
        if (!v) { v = cmyk(r, g, b); cache.set(key, v); }
        out[o] = v[0]; out[o + 1] = v[1]; out[o + 2] = v[2]; out[o + 3] = v[3];
      }
      ilerleme && ilerleme(0.15 + 0.55 * (y0 + hh) / ch, 'Renkler CMYK\'ye çevriliyor');
      await bekle();
    }
    cv.width = cv.height = 1;   // belleği bırak
    ilerleme && ilerleme(0.72, 'Sıkıştırılıyor');
    const z = await sikistir(out);
    return { cw, ch, wmm, hmm, z };
  }

  // ------------------------------------------------------------ PDF yazımı
  function pdfYaz(nesneler, kok, info) {
    const parts = [], ofs = [];
    let pos = 0;
    const ekle = u => { parts.push(u); pos += u.length; };
    ekle(bytes('%PDF-1.6\n%')); ekle(new Uint8Array([0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
    const maxId = Math.max(...nesneler.map(n => n.id));
    nesneler.sort((a, b) => a.id - b.id).forEach(n => {
      ofs[n.id] = pos;
      if (n.akis) {
        ekle(bytes(`${n.id} 0 obj\n${n.sozluk.replace('%LEN%', n.akis.length)}\nstream\n`));
        ekle(n.akis); ekle(bytes('\nendstream\nendobj\n'));
      } else ekle(bytes(`${n.id} 0 obj\n${n.sozluk}\nendobj\n`));
    });
    const xref = pos;
    let x = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= maxId; i++) x += ofs[i] !== undefined ? `${String(ofs[i]).padStart(10, '0')} 00000 n \n` : '0000000000 65535 f \n';
    x += `trailer\n<< /Size ${maxId + 1} /Root ${kok} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    ekle(bytes(x));
    const all = new Uint8Array(pos); let p = 0;
    parts.forEach(u => { all.set(u, p); p += u.length; });
    return all;
  }

  const ENC = '<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [128 /Gbreve /gbreve /Idotaccent /dotlessi /Scedilla /scedilla] >>';
  const tarih = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
  const mm = v => String(Math.round(v * 10) / 10).replace('.', ',');

  async function olustur(o) {
    const { mod, GEO, ad, dpi = 400, tur = 'matbaa', onProgress } = o;
    if (!mod || !mod.render) throw new Error('Bu seçenek için baskı dosyası yok; önce bir tasarım seçin.');
    if (mod.ready) await mod.ready();
    const ilerleme = onProgress || null;
    ilerleme && ilerleme(0.02, 'Açınım ' + dpi + ' dpi çiziliyor');
    await bekle();
    const G = await grafik(mod, GEO, dpi, ilerleme);
    ilerleme && ilerleme(0.9, 'PDF yazılıyor');
    const N = [];
    const infoMetni = `Kişisel QR · Araç Etiketi Kutusu · ${ad} · Açınım ${mm(GEO.W)} × ${mm(GEO.H)} mm, 1:1 · Taşma ${BLEED} mm · İç ölçü ${GEO.inner.map(mm).join(' × ')} mm · ${tarih()}`;
    N.push({ id: 7, sozluk: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding 9 0 R >>` });
    N.push({ id: 8, sozluk: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding 9 0 R >>` });
    N.push({ id: 9, sozluk: ENC });
    N.push({ id: 10, sozluk: '<< /Type /ExtGState /OP true /op true /OPM 1 >>' });
    N.push({ id: 11, sozluk: `<< /Type /XObject /Subtype /Image /Width ${G.cw} /Height ${G.ch} /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Filter /FlateDecode /Length %LEN% >>`, akis: G.z });
    N.push({ id: 15, sozluk: `<< /Title ${utf16('Kişisel QR kutu – ' + ad)} /Creator (kisiselqr_kutu matbaa_pdf.js) /Producer (kisiselqr_kutu) >>` });

    const spot = '[/Separation /Bicak /DeviceCMYK << /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [0 1 0 0] /N 1 >>]';
    const res = (ocgler) => `/Resources << /Font << /F1 7 0 R /F2 8 0 R >> /XObject << /Im1 11 0 R >> /ExtGState << /GSop 10 0 R >> /ColorSpace << /CSB ${spot} >> /Properties << ${ocgler} >> >>`;
    const yazi = (x, y, boy, s, kalin) => `BT /${kalin ? 'F2' : 'F1'} ${boy} Tf ${f(x)} ${f(y)} Td ${pdfStr(s)} Tj ET\n`;

    if (tur === 'matbaa') {
      const pw = G.wmm + 2 * SLUG, ph = G.hmm + SLUG + SLUG_ALT;           // mm
      const W = pw * PT, H = ph * PT;
      const ox = SLUG + BLEED, oy = SLUG + BLEED;                           // açınım (0,0) sayfada (mm, üstten)
      const trim = [ox * PT, H - (oy + GEO.H) * PT, (ox + GEO.W) * PT, H - oy * PT];
      const bleed = [trim[0] - BLEED * PT, trim[1] - BLEED * PT, trim[2] + BLEED * PT, trim[3] + BLEED * PT];
      const box = a => `[${a.map(f).join(' ')}]`;
      const cmDieline = `${f(PT)} 0 0 ${f(-PT)} ${f(ox * PT)} ${f(H - oy * PT)} cm`;
      const bilgi = [
        [infoMetni, true],
        [`Grafik: CMYK görsel ${dpi} dpi (marka renkleri birebir: siyah zemin 60/40/40/100, sarı 0/15/100/0, antrasit K85, küçük metin K100; diğerleri yaklaşık dönüşüm). Tutkal alanları baskısız.`, false],
        [`Bıçak: ayrı katman, spot renk "Bicak" (baskıya çıkmaz), 0,25 pt, overprint; düz = kesim, kesikli = bigi. TrimBox = açınım sınırı, BleedBox = +3 mm. 2. sayfa: yalnız bıçak izi.`, false],
        [`NOT: Numune / dijital baskı dosyasıdır; yazılar görselin içindedir. Ofset seri üretim için vektörel PDF/X-4 (Fogra39, outline font) ayrıca hazırlanacaktır. EAN, SKU, adres ve KVKK alanları onay bekliyor.`, true],
      ];
      const bilgiOps = (sayfa2) => {
        let s = '0 0 0 1 k\n';
        const satirlar = sayfa2 ? [[`Kişisel QR · ${ad} · BIÇAK İZİ (yalnız) · Açınım ${mm(GEO.W)} × ${mm(GEO.H)} mm, 1:1 · spot "Bicak" 0,25 pt, overprint · düz = kesim, kesikli = bigi · ${tarih()}`, true]] : bilgi;
        satirlar.forEach(([t, k], i) => { s += yazi(SLUG * PT, (SLUG_ALT - 5 - i * 3.4) * PT, 6.5, t, k); });
        return s;
      };
      const c1 = `/OC /OCg BDC\nq ${f(G.wmm * PT)} 0 0 ${f(G.hmm * PT)} ${f(SLUG * PT)} ${f(H - (SLUG + G.hmm) * PT)} cm /Im1 Do Q\nEMC\n`
        + `/OC /OCb BDC\nq /GSop gs ${cmDieline}\n${bicakOps(GEO, '/CSB CS 1 SCN', 0.25 / PT)}Q\nEMC\n`
        + `/OC /OCi BDC\n${bilgiOps(false)}EMC\n`;
      const c2 = `/OC /OCb BDC\nq /GSop gs ${cmDieline}\n${bicakOps(GEO, '/CSB CS 1 SCN', 0.25 / PT)}Q\nEMC\n/OC /OCi BDC\n${bilgiOps(true)}EMC\n`;
      const oc = '/OCg 12 0 R /OCb 13 0 R /OCi 14 0 R';
      const kutular = `/MediaBox [0 0 ${f(W)} ${f(H)}] /TrimBox ${box(trim)} /BleedBox ${box(bleed)}`;
      N.push({ id: 1, sozluk: `<< /Type /Catalog /Pages 2 0 R /OCProperties << /OCGs [12 0 R 13 0 R 14 0 R] /D << /Name (Katmanlar) /Order [13 0 R 12 0 R 14 0 R] /ON [12 0 R 13 0 R 14 0 R] /OFF [] >> >> >>` });
      N.push({ id: 2, sozluk: '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>' });
      N.push({ id: 3, sozluk: `<< /Type /Page /Parent 2 0 R ${kutular} /Contents 4 0 R ${res(oc)} >>` });
      N.push({ id: 4, sozluk: '<< /Length %LEN% >>', akis: bytes(c1) });
      N.push({ id: 5, sozluk: `<< /Type /Page /Parent 2 0 R ${kutular} /Contents 6 0 R ${res(oc)} >>` });
      N.push({ id: 6, sozluk: '<< /Length %LEN% >>', akis: bytes(c2) });
      N.push({ id: 12, sozluk: `<< /Type /OCG /Name ${utf16('Grafik (CMYK)')} >>` });
      N.push({ id: 13, sozluk: `<< /Type /OCG /Name ${utf16('Bıçak')} >>` });
      N.push({ id: 14, sozluk: `<< /Type /OCG /Name ${utf16('Bilgi')} >>` });
    } else {
      // A3 renkli maket: %100 ölçek, siyah kesim/bigi, 50 mm kontrol çizgileri
      const pw = 297, ph = 420, W = pw * PT, H = ph * PT;
      if (G.wmm > pw - 10 || G.hmm > ph - 90) throw new Error('Açınım A3 sayfaya sığmıyor.');
      const gx = (pw - G.wmm) / 2, gy = 38;                                  // taşmalı görselin sol üstü (mm, üstten)
      const ox = gx + BLEED, oy = gy + BLEED;
      const cm = `${f(PT)} 0 0 ${f(-PT)} ${f(ox * PT)} ${f(H - oy * PT)} cm`;
      const yUst = v => H - v * PT;
      let c = `q ${f(G.wmm * PT)} 0 0 ${f(G.hmm * PT)} ${f(gx * PT)} ${f(H - (gy + G.hmm) * PT)} cm /Im1 Do Q\n`;
      c += `q ${cm}\n${bicakOps(GEO, '0 0 0 1 K', 0.3 / PT)}Q\n0 0 0 1 k\n`;
      c += yazi(15 * PT, yUst(15), 13, `RENKLİ MAKET – Kişisel QR kutu · ${ad}`, true);
      c += yazi(15 * PT, yUst(21.5), 8, 'Yazdırırken "Gerçek boyut / %100" seçin, "Sayfaya sığdır" KAPALI olsun. Aşağıdaki 50 mm çizgileri cetvelle kontrol edin.', false);
      c += yazi(15 * PT, yUst(26.5), 8, `Açınım ${mm(GEO.W)} × ${mm(GEO.H)} mm · düz çizgi: kes · kesikli çizgi: bigi (katla) · beyaz kalan tutkal alanlarına yapıştırıcı sürün · ${tarih()}`, false);
      const ry = gy + G.hmm + 16;
      c += `0 0 0 1 K ${f(0.35 * PT)} w [] 0 d\n${f(15 * PT)} ${f(yUst(ry))} m ${f(65 * PT)} ${f(yUst(ry))} l S\n`;
      for (let i = 0; i <= 5; i++) { const x = 15 + i * 10, t = (i === 0 || i === 5) ? 2.5 : 1.5; c += `${f(x * PT)} ${f(yUst(ry - t))} m ${f(x * PT)} ${f(yUst(ry + t))} l S\n`; }
      c += yazi(26 * PT, yUst(ry + 7), 8, '50 mm (yatay kontrol)', false);
      const vx = pw - 20;
      c += `${f(vx * PT)} ${f(yUst(ry - 4))} m ${f(vx * PT)} ${f(yUst(ry + 46))} l S\n`;
      for (let i = 0; i <= 5; i++) { const yy = ry - 4 + i * 10, t = (i === 0 || i === 5) ? 2.5 : 1.5; c += `${f((vx - t) * PT)} ${f(yUst(yy))} m ${f((vx + t) * PT)} ${f(yUst(yy))} l S\n`; }
      c += `q 0 1 -1 0 ${f((vx - 5) * PT)} ${f(yUst(ry + 31))} cm BT /F1 8 Tf 0 0 Td ${pdfStr('50 mm (dikey kontrol)')} Tj ET Q\n`;
      [['KATLAMA SIRASI', true],
       ['1. Kesik çizgileri cetvel + boş tükenmez kalemle hafifçe çizip katlayın.', false],
       ['2. Tutkal payını Sol yan panelin iç yüzüne yapıştırın.', false],
       ['3. Üst toz kapaklarını içe katlayın, üst kapağı kapatın; dili başlığın 1. katına yapıştırın.', false],
       ['4. Başlığın 2. katını bigiden aşağı katlayıp yapıştırın; iki Euro delik çakışmalı.', false],
       ['5. Alt toz kapaklarını içe, alt kapağı kapatın; geçme dilini Ön panelin arkasına sokun.', false]]
        .forEach(([t, k], i) => { c += yazi(80 * PT, yUst(ry - 2 + i * 5), k ? 9 : 8, t, k); });
      N.push({ id: 1, sozluk: '<< /Type /Catalog /Pages 2 0 R >>' });
      N.push({ id: 2, sozluk: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' });
      N.push({ id: 3, sozluk: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(W)} ${f(H)}] /Contents 4 0 R ${res('')} >>` });
      N.push({ id: 4, sozluk: '<< /Length %LEN% >>', akis: bytes(c) });
    }
    const pdf = pdfYaz(N, 1, 15);
    ilerleme && ilerleme(1, 'Hazır');
    return pdf;
  }

  async function indir(o) {
    const pdf = await olustur(o);
    const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = o.dosya || 'kisiselqr_kutu.pdf';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    return pdf.length;
  }

  window.KQRMatbaa = { olustur, indir, cmyk, MARKA };
})();
