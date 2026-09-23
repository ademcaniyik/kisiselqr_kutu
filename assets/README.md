# Kişisel QR Kutu – Tasarım Modülleri

Bu klasördeki tasarımlar görsel dosyası değil, **kodla çizilen modüller**: `assets/tasarimN/tasarimN.js`.
Her modül açınımın tamamını (tüm paneller, Euro başlık, toz kapakları, alt kilitli kapak, tutkal payı)
**mm koordinatlarında** açınım geometrisinden (GEO) çizer. `index.html` bu çizimi hem 2D açınım
görünümünde gösterir hem de 3D kutuya doku olarak giydirir. Ölçü değişirse tasarım kendiliğinden yeniden yerleşir.

## Tasarımlar

| # | Ad | Konsept | Klasör |
|---|---|---|---|
| 1 | Kişisel QR · Siyah-Sarı | Brifteki temel yerleşim. Üst 2/3 siyah (logo, KİŞİSEL QR, önden araç camı + sticker, telefon, rozet), alt 1/3 sarı (4 ikon). Arka yüzde sticker, 5 özellik, 3 adım, uygulama QR'ı, sarı yasal bant. | `tasarim1/` |
| 2 | Sticker Kahraman | Kahraman ürünün kendisi. Ön camın sol alt köşesi yakın planda: A-sütunu, frit bandı ve silecekle birlikte camda duran büyük, eğik sticker. Önden mini araç anahtarı ile "Ön camın sol alt köşesine" konumu, sarı kaput bandında halkalı ikonlar. Arka yüzde sarı adım şeridi (Temizle › Yapıştır › Aktif Et). | `tasarim2/` |
| 3 | Gece Sahnesi | Sinematik gece sahnesi: sokak lambası altında 3/4 perspektiften park etmiş araç, ön camın sol alt köşesinde perspektifli sticker, ön planda elde telefon ve sticker'a giden sarı tarama ışını. Dişli kenarlı mühür rozeti, afiş künyesi gibi alta yerleşen KİŞİSEL QR. Arka yüzde 3 kareli film şeridi. | `tasarim3/` |
| 4 | Tipografik Izgara | İsviçre/editoryal tipografi: 12 kolonlu ızgara, çentikli ince kurallar, numaralı başlıklar. Ön yüz tam ortadan siyah/sarı bölünür, dev iki renkli "QR" harfleri bölünme çizgisine taşar. Araç piktogramında camın sol alt köşesine odak halkası. Arka yüzde dev 1-2-3 adım satırı ve 01–05 özellik listesi. | `tasarim4/` |

Her tasarımın ayrıntılı notları (yerleşim, lak, açık sorular, Candemsoft onayı bekleyen metinler) kendi klasöründeki `README.md` dosyasında.

## Modül sözleşmesi

```js
window.KQRTasarimN = {
  meta: { ad: 'Kısa ad', renk: '#hex', aciklama: 'Tek cümle' }, // buton etiketi ve renk noktası
  render(ctx, GEO, opts), // ctx mm → px ölçekli (1 birim = 1 mm), açınımın tamamını çizer
  ready()                 // Promise: fontlar + demo profil ekran görüntüsü yüklenince çözülür
};
```

- `tasarim1.js` her zaman önce yüklenir. Ortak öğeler `KQRTasarim1.lib` içindedir: açınım geometrisi, logo, ikonlar,
  birebir sticker (`sticker`), demo profil ekranlı telefon (`phone`), gerçek QR matrisleri (`qr_kodlar.js`).
  Ürün gerçekleri (sticker, demo ekranı, QR'lar) bu sayede tüm tasarımlarda aynı kalır.
- Palet her tasarımda aynıdır: Siyah `#0A0A0A`, Sarı `#FDD309`, Antrasit `#2A2A2A`, Kırık beyaz `#F4F4F2`,
  Beyaz `#FFFFFF`, küçük siyah metin K100 `#000000`.
- Yeni bir tasarım için `assets/tasarimN/tasarimN.js` oluşturulur; `index.html` içinde tasarım butonu
  (`data-design="tasarimN"`), `<script>` satırı ve `DESIGN_CONFIGS` girdisi (`theme: "mod:KQRTasarimN"`) eklenir.

## Kendi görsellerini yükle

Arayüzdeki **"Kendi Görsellerini Yükle"** paneli, hazır bir yüzey görselini (PNG/JPG) tarayıcıda seçili tasarımın
üstüne yerleştirir. Dosya sunucuya yüklenmez; sayfa yenilenince kaybolur. Görsel yüzeyin tamamına gerilir, bu yüzden
oranın aşağıdaki ölçülere uyması gerekir (300 DPI ≈ 11,8 px/mm):

| Alan | Boyut (mm) | 300 DPI (px) |
|---|---|---|
| Ön / Arka | 96,5 × 136,5 | 1140 × 1612 |
| Sol / Sağ yan | 18,5 × 136,5 | 218 × 1612 |
| Üst / Alt kapak | 96,5 × 18,5 | 1140 × 218 |
| Başlık (Euro, 2. kat) | 95,5 × 34,0 | 1128 × 402 |

Başlık görseli düz (okunur yönde) hazırlanır; açınımda 180° çevrilerek yerleştirilir ve Euro delikleri yeniden açılır.
