# Tasarım 1 – Kişisel QR · Siyah-Sarı

Kaynak: *Kişisel QR Araç Etiketi – Kutu Tasarım Brifi* (23.09.2026) + Ambalaj Şartnamesi v1.0 (ölçü, tipografi, baskı kuralları).

Tasarım görsel dosyası değil, kod olarak çizilir: `tasarim1.js`, açınımın tamamını **mm koordinatlarında** GEO verisinden (kutu_acinim.py çıktısı) okuyarak çizer. Ölçü değişirse tasarım otomatik yeniden yerleşir. `index.html` içinde "Tasarım 1" butonu bu modülü kullanır.

| Dosya | İçerik |
|---|---|
| `tasarim1.js` | Tüm panellerin çizimi, logo (vektörel yeniden çizim), ikonlar, sticker kopyası, telefon, gerçek oranlı araç ve büyüteç |
| `qr_kodlar.js` | Gerçek QR matrisleri (ECC M): `KQR_QR_APP` → `https://mobile.kisiselqr.com`, `KQR_QR_DEMO` → `https://kisiselqr.com/qr/071qydlb` (demo profil). `araclar/qr_uret.py` üretir, elle düzenlemeyin |
| `rozet_appstore_tr.svg`, `rozet_googleplay_tr.png` | Apple ve Google'ın resmi Türkçe mağaza rozetleri ("App Store'dan İndirin", "İndirin Google Play"); Apple marketing toolbox ve Google Play rozet sayfasından alındı, değiştirilmeden kullanılır |
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

Kutudaki sticker çizimleri (ön yüzdeki büyüteçte ve arka yüzde), Candemsoft'un ilettiği sticker görselinin **birebir vektör kopyası**: siyah çerçeve, beyaz QR kartı, sarı alanda "ARAÇ SAHİBİNE ULAŞMAK İÇİN KAREKODU OKUTUN", altta `www.kisiselqr.com`. Ölçüler referans görselden piksel ölçümüyle alındı (5:8). İçindeki QR gerçek ve **demo profile** gider. Arka yüzdeki sticker 21,5 mm genişlikte ve telefonla okutulabilir (300 ve 150 dpi render'larda OpenCV ile çözüldü).

## Yerleşim özeti

- **Ön yüz:** Siyah zemin: logo + "by Candemsoft", KİŞİSEL QR (24 pt), alt satır, araç, telefon, "Artık numaratöre gerek yok" rozeti ve **slogan "Herkese numaranı vermek zorunda değilsin."** (12 pt, "numaranı" sarı). Altta **24 mm sarı bant** (eskiden 45,5 mm): 4 ikon (7,2 mm) ve yanında 7 pt etiket; gruplar eşit aralıkla, slogan hizasından (6 mm) başlayıp sağda aynı payla biter.
  - **Araç (gerçek oranlı):** Modern bir sedanın önden görünüşü gerçek ölçülerle çizilir: gövde 1836 × 1480 mm, iz 1560 mm, lastik 215 mm, kutuda 1:35,7 (0,028). Sticker (50 × 80 mm) camın sol alt köşesinde **gerçek boyutunda** durur (kutuda ~1,4 mm), sarı halkayla işaretlidir. Sol üstteki büyüteç aynı köşeyi yakından gösterir: A sütunu, serigrafi bandı, silecek ve gerçek sticker tasarımı (içindeki demo QR okunur). Camın içinde torpido, direksiyon (sürücü tarafı), koltuklar ve dikiz aynası görünür. Plaka kurgusal (34 KQR 26), amblem markasız.
  - **İkonların dikey konumu:** Sarı alanın ortasına olabildiğince yakın. Sınır, alt kenarın ortasındaki Ø20 mühür etiketinin ön yüzdeki yarım dairesi: hiçbir ikon/etiket ona 0,8 mm'den fazla yaklaşmaz. Bu yüzden ikonlar tam ortanın ~2,3 mm üstünde kalır.
- **Arka yüz:** Siyah zemin. Üstte "Nasıl çalışır?" + açıklama, sağında uygulama QR'ı ("Uygulamayı indir · mobile.kisiselqr.com"). Ortada sticker (demo profil QR'ı) + 5 özellik. Altında **çizimli 3 adım** (1 Temizle – camı sil · 2 Yapıştır – sol alt köşe · 3 Aktif Et – kartı okut; cam köşesi ön yüzdeki araçla aynı bakışla, dışarıdan çizilir; alt etiketler 7 pt'nin altına inmez, gerekirse satır kayar) ve **App Store + Google Play rozetleri** (10 mm, alt alta, App Store önde). Özelliklerin altında **aktivasyon uyarısı**: "Aktivasyon için önce uygulamayı indir · Kartı kamerayla değil, uygulamadan okut." 3. adımın telefonu da uygulamanın tarama ekranını (logo + tarama çerçevesi + onay) gösterir. Sarı yasal bantta kutu içeriği, üretici, adres/KVKK yer tutucuları, menşe, PAP 21, SKU ve EAN-13 alanı (bigiden ≥ 8 mm).
- **Euro başlık:** Sarı zemin, delik altında siyah logo (6 mm). Ön kat 180° katlandığı için **açınımda ters çizilir**.
- **Yanlar:** İki yan aynı düzende: dikey Kişisel QR logosu (9,5 mm, sarı), `kisiselqr.com` (4,4 mm, 800, beyaz) ve altında "Araç + Dijital Kartvizit" (7 pt, sarı). Sağ yanda ek olarak beyaz lot kutusu (laksız, selefonsuz). Kutu kapalıyken iki yanda da logo ve web adresi görünür.
- **Kapaklar:** Üst kapak ve toz kapakları düz siyah. Alt kapak ve geçme dili sarı, metin yok.
- **Tutkal payı ve üst yapıştırma dili:** Baskısız (ekranda ham karton rengi).
- **Taşma:** Baskılı her yüzeyin zemini kesim hattından 3 mm dışarı taşar.

## Yer tutucular (Candemsoft'tan gelecek)

| Öğe | Şu anki durum |
|---|---|
| Logo vektörü | Logo PNG'ye bakılarak yeniden çizildi. Resmî SVG/AI gelince değiştirilmeli. "ş" altındaki fazla işaret temizlendi |
| EAN-13 numarası | Kesikli çerçeveli boş alan. Sahte barkod çizilmedi |
| SKU, üretici adresi, KVKK metni | Köşeli parantez içinde "bekleniyor" |

## Mağaza rozetleri – kullanım kuralları

- Apple: baskıda yükseklik ≥ 10 mm, çevrede rozet yüksekliğinin ¼'ü boşluk, başka mağaza rozetiyle birlikteyse siyah rozet ve App Store önce; rozet değiştirilemez, "App Store" çevrilmez.
- Google Play: baskıda ≥ 7,6 mm, App Store rozetiyle birlikteyse ondan küçük olamaz, çevrede ¼ yükseklik boşluk.
- Kutuda ikisi de 10 mm yükseklikte, aralarında 2,5 mm boşluk var; adım kutucuklarıyla aradaki boşluk kontur dahil ≥ 2,5 mm.
- Baskı rengi: App Store rozetinin iç siyahı SVG'de varsayılan dolgu (#000) olduğu için matbaa PDF'inde K100'e düşüyordu. Yüklenirken varsayılan dolgu `#0A0A0A` yapılır, böylece rozet zeminle aynı zengin siyahla (60/40/40/100) basılır (ekranda fark yok, yazı ve kenar rengi aynı). Google Play rozetinin siyahı yaklaşık dönüşümle 60/40/40/97 olur.

## Lokal UV lak (Aşama 3'te ayrı katman olacak)

Ön yüz logosu, büyüteçteki sticker ve telefon ekranı. Rozet, mühür alanı ve lot kutusu lak **almaz**.

## Bilinen açık noktalar

- `mobile.kisiselqr.com` hazır kabul edildi (Candemsoft onayı, 23.09.2026).
- "Sol alt köşe" dışarıdan bakışa göre (ön yüzdeki çizimle aynı). Etiket içeriden yapıştırılıyorsa sürücü bakışıyla sağ alt köşe olur; Candemsoft'tan teyit bekleniyor.
- Mühür: Ø20 void etiket, yarısı ön yüzün alt kenarının ortasında. İkonların sarı alanda tam ortalanması için alt 10 mm'nin siyah olması gerekir (o zaman sarı alan 14 mm olur ve ikonlar tam ortada kalır); karar bekleniyor.
- Aktivasyon akışı (mobil uygulama): Uygulamada "QR KODUNU TANIMLA" → fiziksel QR okutulur (`claim_qr`). Kutudaki uyarı bu yüzden "uygulamadan okut" der.
- Arka yüzde iki okunabilir QR var: sticker'daki demo profil QR'ı ("Okut: demo profil" etiketli) ve uygulama QR'ı ("Uygulamayı indir" etiketli). Kişiye özel aktivasyon QR'ı kutunun içindeki kartta.
- Demo profilde isim "Test Kullancısı" görünüyor (muhtemelen "Kullanıcısı" olmalı). Profilde düzeltilirse `python araclar/demo_ekran_goruntusu.py` ile ekran görüntüsü yenilenir.
- Bu bir konsept önizlemesidir. Baskıya hazır PDF/X, katmanlar (Bicak, Lak_Lokal, Metin, Grafik, Tasma, Muhur_Alani, Lot_Alani) ve outline edilmiş fontlar Aşama 3'te hazırlanacak.
