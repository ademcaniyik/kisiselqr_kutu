# Tasarım 1 – Kişisel QR · Siyah-Sarı

Kaynak: *Kişisel QR Araç Etiketi – Kutu Tasarım Brifi* (23.09.2026) + Ambalaj Şartnamesi v1.0 (ölçü, tipografi, baskı kuralları).

Tasarım görsel dosyası değil, kod olarak çizilir: `tasarim1.js`, açınımın tamamını **mm koordinatlarında** GEO verisinden (kutu_acinim.py çıktısı) okuyarak çizer. Ölçü değişirse tasarım otomatik yeniden yerleşir. `index.html` içinde "Tasarım 1" butonu bu modülü kullanır.

| Dosya | İçerik |
|---|---|
| `tasarim1.js` | Tüm panellerin çizimi, logo (vektörel yeniden çizim), ikonlar, sticker kopyası, telefon ve araç camı illüstrasyonu |
| `qr_kodlar.js` | Gerçek QR matrisleri (ECC M): `KQR_QR_APP` → `https://mobile.kisiselqr.com`, `KQR_QR_DEMO` → `https://kisiselqr.com/qr/071qydlb` (demo profil). `araclar/qr_uret.py` üretir, elle düzenlemeyin |
| `demo_profil_ekran.jpg` | Demo profilin gerçek mobil ekran görüntüsü (1290 × 2796 px, "Araç Sahibine Bildir" açık). `araclar/demo_ekran_goruntusu.py` yeniden çeker |

## Renkler (brif)

| Rol | HEX | CMYK (Fogra39) |
|---|---|---|
| Kişisel Siyah (geniş zemin) | `#0A0A0A` | 60 · 40 · 40 · 100 (zengin siyah) |
| Kişisel Sarı | `#FDD309` | 0 · 15 · 100 · 0 (5. renk önerisi Pantone 116 C) |
| Antrasit | `#2A2A2A` | 0 · 0 · 0 · 85 |
| Kırık beyaz | `#F4F4F2` | 0 · 0 · 2 · 3 |
| Küçük siyah metin | `#000000` | yalnız K100 |

Font: başlıklar Inter ExtraBold/Black (brifteki "logoya yakın grotesk" önerisi, onay bekliyor), gövde Inter. Sticker yazıları, ilettiğiniz sticker görseline uymak için Montserrat ExtraBold.

## Sticker

Kutudaki iki sticker çizimi (ön camdaki ve arka yüzdeki), Candemsoft'un ilettiği sticker görselinin **birebir vektör kopyası**: siyah çerçeve, beyaz QR kartı, sarı alanda "ARAÇ SAHİBİNE ULAŞMAK İÇİN KAREKODU OKUTUN", altta `www.kisiselqr.com`. Ölçüler referans görselden piksel ölçümüyle alındı (5:8). İçindeki QR gerçek ve **demo profile** gider. Arka yüzdeki sticker 21,5 mm genişlikte ve telefonla okutulabilir (300 ve 150 dpi render'larda OpenCV ile çözüldü).

## Yerleşim özeti

- **Ön yüz:** Üst 2/3 siyah (logo + "by Candemsoft", KİŞİSEL QR 24 pt, alt satır, ön cam + sticker, telefon, rozet), alt 1/3 sarı (4 ikon, 7 pt etiket). En alttaki 10 mm mühür bandında yalnızca zemin rengi var.
- **Arka yüz:** Siyah zemin. Sırasıyla "Nasıl çalışır?" ve açıklama, sticker görseli, 5 özellik, 3 adım, uygulama QR'ı ve kutu içeriği. Altta sarı yasal bant: üretici, KVKK, menşe, PAP 21, SKU ve EAN-13 alanı (bigiden ≥ 8 mm).
- **Euro başlık:** Sarı zemin, delik altında siyah logo (6 mm). Ön kat 180° katlandığı için **açınımda ters çizilir**.
- **Sol yan:** Dikey KİŞİSEL QR, altta logo ikonu. **Sağ yan:** kisiselqr.com + "Araç + Dijital Kartvizit", altta beyaz lot kutusu (laksız, selefonsuz).
- **Kapaklar:** Üst kapak ve toz kapakları düz siyah. Alt kapak ve geçme dili sarı, metin yok.
- **Tutkal payı ve üst yapıştırma dili:** Baskısız (ekranda ham karton rengi).
- **Taşma:** Baskılı her yüzeyin zemini kesim hattından 3 mm dışarı taşar.

## Yer tutucular (Candemsoft'tan gelecek)

| Öğe | Şu anki durum |
|---|---|
| Logo vektörü | Logo PNG'ye bakılarak yeniden çizildi. Resmî SVG/AI gelince değiştirilmeli. "ş" altındaki fazla işaret temizlendi |
| EAN-13 numarası | Kesikli çerçeveli boş alan. Sahte barkod çizilmedi |
| SKU, üretici adresi, KVKK metni | Köşeli parantez içinde "bekleniyor" |

## Lokal UV lak (Aşama 3'te ayrı katman olacak)

Ön yüz logosu, ön camdaki sticker ve telefon ekranı. Rozet, mühür bandı ve lot kutusu lak **almaz**.

## Bilinen açık noktalar

- `mobile.kisiselqr.com` hazır kabul edildi (Candemsoft onayı, 23.09.2026).
- Arka yüzde iki okunabilir QR var: sticker'daki demo profil QR'ı ("Okut: demo profil" etiketli) ve uygulama QR'ı ("Uygulamayı indir" etiketli). Kişiye özel aktivasyon QR'ı kutunun içindeki kartta.
- Demo profilde isim "Test Kullancısı" görünüyor (muhtemelen "Kullanıcısı" olmalı). Profilde düzeltilirse `python araclar/demo_ekran_goruntusu.py` ile ekran görüntüsü yenilenir.
- Bu bir konsept önizlemesidir. Baskıya hazır PDF/X, katmanlar (Bicak, Lak_Lokal, Metin, Grafik, Tasma, Muhur_Alani, Lot_Alani) ve outline edilmiş fontlar Aşama 3'te hazırlanacak.
