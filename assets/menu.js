/* Kişisel QR kutu sitesi – ortak üst menü (tüm sayfalarda aynı)
 * Kullanım: <body>'nin sonunda <script src="assets/menu.js"></script>. Menü <body>'nin başına eklenir.
 * - Sayfalar: SAYFALAR listesi. Etkin sayfa vurgulanır.
 * - "Bu sayfada": sayfanın bölümleri. [data-menu] öğeleri varsa onlar (etiket = data-menu değeri), yoksa h2 başlıkları.
 * - Dosyalar: indirilebilir çıktılar (DOSYALAR).
 * Menünün yüksekliği --kqr-menu-h değişkenine yazılır: sayfalardaki yapışkan araç çubukları onun altına oturur.
 */
(function () {
  const SAYFALAR = [
    ['index.html', 'Kutu stüdyosu', 'Kutu'],
    ['etiketler.html', 'Etiket tasarımları', 'Etiketler'],
    ['kilavuz.html', 'Kullanım kılavuzu', 'Kılavuz'],
  ];
  const DOSYALAR = [
    ['out/kisiselqr_tanitim.mp4', 'Tanıtım videosu · 9:16 MP4'],
    ['out/Kisisel_QR_Etiket_Deneme_Baskisi.pdf', 'Etiket deneme baskısı · A4 PDF'],
    ['out/Candemsoft_QR-Kutu_Acinim_v1.pdf', 'Bıçak izi (açınım) · PDF'],
    ['out/Candemsoft_QR-Kutu_Acinim_v1.svg', 'Bıçak izi (açınım) · SVG'],
    ['out/Candemsoft_QR-Kutu_BeyazMaket_A3_v1.pdf', 'Beyaz maket · A3 PDF'],
  ];

  const css = `
.kqr-menu{position:sticky; top:0; z-index:50; background:color-mix(in srgb, var(--surface, #161b22) 92%, transparent);
  backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); border-bottom:1px solid var(--rule, #30363d);
  font:500 14px/1.2 "Outfit", -apple-system, "Segoe UI", sans-serif; color:var(--ink, #f0f6fc)}
.kqr-menu *{box-sizing:border-box}
.kqr-menu .ic{max-width:1280px; margin:0 auto; padding:0 clamp(16px,3vw,36px); display:flex; align-items:center; gap:6px; min-height:52px}
.kqr-menu a{color:inherit; text-decoration:none}
.kqr-marka{display:flex; align-items:center; gap:8px; font-weight:800; margin-right:10px; white-space:nowrap}
.kqr-marka svg{width:22px; height:22px; flex:none}
.kqr-link{padding:8px 11px; border-radius:7px; white-space:nowrap; color:var(--muted, #8b949e)}
.kqr-link:hover{background:var(--surface-2, #21262d); color:var(--ink, #f0f6fc)}
.kqr-link[aria-current="page"]{color:var(--ink, #f0f6fc); background:var(--surface-2, #21262d); box-shadow:inset 0 -2px 0 #FDD309}
.kqr-ara{flex:1}
.kqr-sayfalar{display:contents}
.kqr-menu details{position:relative}
.kqr-menu summary{list-style:none; cursor:pointer; padding:8px 11px; border-radius:7px; color:var(--muted, #8b949e); white-space:nowrap; user-select:none}
.kqr-menu summary::-webkit-details-marker{display:none}
.kqr-menu summary::after{content:" ▾"; font-size:11px}
.kqr-menu summary:hover, .kqr-menu details[open] > summary{background:var(--surface-2, #21262d); color:var(--ink, #f0f6fc)}
.kqr-acilir{position:absolute; right:0; top:calc(100% + 6px); min-width:240px; max-height:70vh; overflow:auto; padding:6px;
  background:var(--surface, #161b22); border:1px solid var(--rule, #30363d); border-radius:10px; box-shadow:0 12px 32px rgba(0,0,0,.35); display:grid}
.kqr-acilir a{padding:9px 10px; border-radius:6px; color:var(--ink, #f0f6fc)}
.kqr-acilir a:hover{background:var(--surface-2, #21262d)}
.kqr-acilir .bas{font:600 10.5px/1 "IBM Plex Mono", ui-monospace, monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--muted, #8b949e); padding:10px 10px 6px}
.kqr-mobil{display:none}
@media (max-width:760px){
  .kqr-menu .masa{display:none}
  .kqr-mobil{display:block; margin-left:auto}
  .kqr-mobil .kqr-acilir{width:min(86vw,320px)}
}
.kqr-menu :focus-visible{outline:2px solid var(--focus, #58a6ff); outline-offset:2px}
html{scroll-padding-top:calc(var(--kqr-menu-h, 52px) + 12px)}`;

  const logo = '<svg viewBox="0 0 7 7" aria-hidden="true"><path fill="#FDD309" d="M0 0h3v1H0zM4 0h3v1H4zM0 1h1v1H0zM2 1h1v1H2zM4 1h1v1H4zM6 1h1v1H6zM0 2h3v1H0zM4 2h3v1H4zM3 3h1v1H3zM5 3h1v1H5zM0 4h3v1H0zM4 4h1v1H4zM6 4h1v1H6zM0 5h1v1H0zM2 5h1v1H2zM5 5h2v1H5zM0 6h3v1H0zM4 6h2v1H4z"/></svg>';   // tasarim1.js ICON matrisi

  const burada = (location.pathname.split('/').pop() || 'index.html');
  const etkin = SAYFALAR.some(s => s[0] === burada) ? burada : 'index.html';

  function bolumler() {
    let el = Array.from(document.querySelectorAll('[data-menu]'));
    const etiketli = el.length > 0;
    if (!etiketli) el = Array.from(document.querySelectorAll('main h2, .wrap h2')).filter(h => !h.closest('.report, .kqr-menu'));
    return el.filter(e => !e.closest('[hidden]')).map((e, i) => {
      if (!e.id) e.id = 'bolum-' + (i + 1);
      return [e.id, etiketli ? e.dataset.menu : e.textContent.trim()];
    });
  }
  const sayfaLink = ([h, ad]) => `<a class="kqr-link" href="${h}"${h === etkin ? ' aria-current="page"' : ''}>${ad}</a>`;
  const liste = (bas, ogeler) => ogeler.length ? `<div class="bas">${bas}</div>` + ogeler.join('') : '';

  function kur() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const b = bolumler();
    const bolumA = b.map(([id, ad]) => `<a href="#${id}">${ad}</a>`);
    const dosyaA = DOSYALAR.map(([h, ad]) => `<a href="${h}" target="_blank" rel="noopener">${ad}</a>`);
    const nav = document.createElement('nav');
    nav.className = 'kqr-menu'; nav.setAttribute('aria-label', 'Site menüsü');
    nav.innerHTML = `<div class="ic">
      <a class="kqr-marka" href="index.html">${logo}<span>Kişisel QR</span></a>
      <span class="kqr-sayfalar masa">${SAYFALAR.map(sayfaLink).join('')}</span>
      <span class="kqr-ara masa"></span>
      ${b.length ? `<details class="masa"><summary>Bu sayfada</summary><div class="kqr-acilir">${bolumA.join('')}</div></details>` : ''}
      <details class="masa"><summary>Dosyalar</summary><div class="kqr-acilir">${dosyaA.join('')}</div></details>
      <details class="kqr-mobil"><summary>Menü</summary><div class="kqr-acilir">
        ${liste('Sayfalar', SAYFALAR.map(([h, ad]) => `<a href="${h}"${h === etkin ? ' aria-current="page" style="box-shadow:inset 3px 0 0 #FDD309"' : ''}>${ad}</a>`))}
        ${liste('Bu sayfada', bolumA)}
        ${liste('Dosyalar', dosyaA)}
      </div></details>
    </div>`;
    document.body.insertBefore(nav, document.body.firstChild);
    // açılır menüler: dışarı tıklayınca, bağlantı seçilince ya da Esc ile kapanır
    const acilirlar = Array.from(nav.querySelectorAll('details'));
    const kapat = (haric) => acilirlar.forEach(d => { if (d !== haric) d.open = false; });
    acilirlar.forEach(d => d.addEventListener('toggle', () => { if (d.open) kapat(d); }));
    document.addEventListener('click', e => { if (!nav.contains(e.target)) kapat(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') kapat(); });
    nav.querySelectorAll('.kqr-acilir a').forEach(a => a.addEventListener('click', () => kapat()));
    const yaz = () => document.documentElement.style.setProperty('--kqr-menu-h', nav.offsetHeight + 'px');
    yaz(); window.addEventListener('resize', yaz);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur); else kur();
})();
