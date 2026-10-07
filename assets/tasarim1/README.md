# Tasarım 1 – Kişisel QR · Siyah-Sarı

Kaynak: *Kişisel QR Araç Etiketi – Kutu Tasarım Brifi* (23.09.2026) + Ambalaj Şartnamesi v1.0 (ölçü, tipografi, baskı kuralları).

Tasarım görsel dosyası değil, kod olarak çizilir: `tasarim1.js`, açınımın tamamını **mm koordinatlarında** GEO verisinden (kutu_acinim.py çıktısı) okuyarak çizer. Ölçü değişirse tasarım otomatik yeniden yerleşir. `index.html` içinde "Tasarım 1" butonu bu modülü kullanır.

| Dosya | İçerik |
|---|---|
| `tasarim1.js` | Tüm panellerin çizimi, logo (vektörel yeniden çizim), ikonlar, sticker kopyası, telefon, gerçek oranlı araç ve büyüteç |
| `qr_kodlar.js` | Gerçek QR matrisleri (ECC M): `KQR_QR_APP` → `https://mobile.kisiselqr.com`, `KQR_QR_DEMO` → `https://kisiselqr.com/qr/071qydlb` (demo profil). `araclar/qr_uret.py` üretir, elle düzenlemeyin |
| `rozet_appstore_tr.svg`, `rozet_googleplay_tr.png` | Apple ve Google'ın resmi Türkçe mağaza rozetleri ("App Store'dan İndirin", "İndirin Google Play"); Apple marketing toolbox ve Google Play rozet sayfasından alındı, değiştirilmeden kullanılır |
| `demo_profil_ekran.jpg` | Gerçek profil sayfasının mobil ekran görüntüsü (1290 × 2796 px), **vitrin içeriğiyle**: "Ahmet Yılmaz · Mimar · İstanbul", isim altında plaka **34 ABC 123** (kutudaki araçla aynı; sayfanın kendi plaka bloğu), telefon butonu yok (profilde "numarayı gizle" açıkken sayfa tam böyle görünür), WhatsApp yerine LinkedIn, "Araç Sahibine Bildir" açık. Sayfanın tasarımı canlıdakiyle aynı, yalnız örnek içerik değişir. `araclar/demo_ekran_goruntusu.py` yeniden çeker. Telefon çiziminde üstte iPhone durum çubuğu (9:41, sinyal, Wi-Fi, pil) var, sayfa onun altından başlar: profil fotoğrafı çentiğin altında kalmaz |

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

- **Ön yüz:** Siyah zemin: **büyük logo** (13 mm, sarı) + "by Candemsoft", başlık **AKILLI ARAÇ ETİKETİ** (tek satır, sığan en büyük boy ≤ 26 pt, "AKILLI" sarı) ve altında "+ Dijital Kartvizit" (10 pt), araç, telefon, "Artık numaratöre gerek yok" rozeti ve **slogan "Herkese numaranı vermek zorunda değilsin."** (12 pt, "numaranı" sarı). Rafta ilk soru "bu ne?" olduğu için başlık ürünü söyler; marka logosu büyütüldü, sönük kalmaz (6 Ekim). Altta **24 mm sarı bant** (eskiden 45,5 mm): 4 ikon (7,2 mm) ve yanında 7 pt etiket; gruplar eşit aralıkla, slogan hizasından (6 mm) başlayıp sağda aynı payla biter.
  - **Araç (gerçek oranlı):** Modern bir sedanın önden görünüşü gerçek ölçülerle çizilir: gövde 1836 × 1480 mm, iz 1560 mm, lastik 215 mm, kutuda 1:35,7 (0,028). Sticker (50 × 80 mm) camın sol alt köşesinde **gerçek boyutunda** durur (kutuda ~1,4 mm), sarı halkayla işaretlidir. Sol üstteki büyüteç aynı köşeyi yakından gösterir: A sütunu, serigrafi bandı, silecek ve gerçek sticker tasarımı (içindeki demo QR okunur). Camın içinde torpido, direksiyon (sürücü tarafı), koltuklar ve dikiz aynası görünür. Plaka kurgusal (34 ABC 123), amblem markasız.
  - **İkonların dikey konumu:** Sarı alanın ortasına olabildiğince yakın. Sınır, alt kenarın ortasındaki Ø20 mühür etiketinin ön yüzdeki yarım dairesi: hiçbir ikon/etiket ona 0,8 mm'den fazla yaklaşmaz. Bu yüzden ikonlar tam ortanın ~2,3 mm üstünde kalır.
- **Arka yüz:** Siyah zemin. Üstte "Nasıl çalışır?" + açıklama (yapıştırma yeri belirtilmez; "aracın olmasa da kullanabilirsin"), sağında uygulama QR'ı ("Uygulamayı indir · mobile.kisiselqr.com"). Ortada sticker (demo profil QR'ı) ve sağında **"Uygulamada ayrıca"**: 6 ikonlu özellik, 2 sütun × 3 satır (acil durum bilgisi, kaza tespit tutanağı, çekici ve yol yardımı, lastikçi ve tamirci, yakındaki otoparklar, nöbetçi eczaneler). Hepsi uygulamada gerçekten var (mobil kod, 6 Ekim); şarj istasyonu uygulamada olmadığı için yok. Eski 5 maddelik tik listesi kalktı: içeriği açıklamada ve ön yüzdeki ikon şeridinde zaten vardı. Altında **aktivasyon uyarısı**: "Aktivasyon için önce uygulamayı indir · Etiketi kamerayla değil, uygulamadan okut." En altta **çizimli 3 adım** (1 Temizle – Camı sil · 2 Yapıştır – Dilediğin yere · 3 Aktif Et – Uygulamada okut; 3. adımda telefon, uygulamanın tarama ekranıyla etiketi okutur; alt etiketler 7 pt'nin altına inmez, gerekirse satır kayar ama kutucuk genişliğini aşmaz) ve **App Store + Google Play rozetleri** (10 mm, alt alta, App Store önde).
- **Arka yasal bant (32,5 mm, sarı, K100):** Kutu içeriği (1 QR Etiket), üretici, adres yer tutucusu, destek (`kisiselqr.com`, sitedeki WhatsApp destek hattı), `KVKK Aydınlatma Metni: kisiselqr.com/kvkk`, menşe, PAP 21, SKU. En altta tam genişlikte **Apple atıf satırı** (6 pt). EAN-13 alanı bigiden 10 mm (kural ≥ 8 mm).
- **Euro başlık:** Sarı zemin, delik altında siyah logo (6 mm). Ön kat 180° katlandığı için **açınımda ters çizilir**.
- **Yanlar:** İki yan aynı düzende: dikey Kişisel QR logosu (9,5 mm, sarı), `kisiselqr.com` (4,4 mm, 800, beyaz) ve altında "Akıllı Araç Etiketi" (7 pt, sarı). Sağ yanda ek olarak beyaz lot kutusu (laksız, selefonsuz). Kutu kapalıyken iki yanda da logo ve web adresi görünür.
- **Kapaklar:** Üst kapak ve toz kapakları düz siyah. Alt kapak ve geçme dili sarı, metin yok.
- **Tutkal payı ve üst yapıştırma dili:** Baskısız (ekranda ham karton rengi).
- **Taşma:** Baskılı her yüzeyin zemini kesim hattından 3 mm dışarı taşar.
- **İç baskı (opsiyonel, maliyete göre karar verilecek):** `renderIc`. Kutu yalnız alttan açıldığı için müşterinin gördüğü iç yüzey alt kapak ve geçme dili; ikisinin iç yüzüne tek renk siyah (K100, GC1'in krem arka yüzüne). Kapak: logo + "Önce beni oku", "Kurulum 3 adım" ve 1 Camı temizle → 2 Etiketi yapıştır → 3 Uygulamadan aktif et. Dil: "Etiketi telefonun kamerasıyla değil, Kişisel QR uygulamasında “QR Kodunu Tanımla” ile okut. Yardım: kisiselqr.com". Kapak aşağı sarkarken okunur yönde (menteşe üstte). Sitede 2D açınımda "İç yüz" seçeneğiyle görünür.

## Yer tutucular (Candemsoft'tan gelecek)

| Öğe | Şu anki durum |
|---|---|
| Logo vektörü | Logo PNG'ye bakılarak yeniden çizildi. Resmî SVG/AI gelince değiştirilmeli. "ş" altındaki fazla işaret temizlendi |
| EAN-13 numarası | Kesikli çerçeveli boş alan. Sahte barkod çizilmedi |
| SKU, üretici adresi | Köşeli parantez içinde "bekleniyor" |
| KVKK | Metnin tamamı yerine kısa adres: `kisiselqr.com/kvkk` (canlı) |

## Mağaza rozetleri – kullanım kuralları

- Apple: baskıda yükseklik ≥ 10 mm, çevrede rozet yüksekliğinin ¼'ü boşluk, başka mağaza rozetiyle birlikteyse siyah rozet ve App Store önce; rozet değiştirilemez, "App Store" çevrilmez.
- Google Play: baskıda ≥ 7,6 mm, App Store rozetiyle birlikteyse ondan küçük olamaz, çevrede ¼ yükseklik boşluk.
- Apple, App Store rozeti kullanılınca marka atıf satırı ister; çevirisi serbest. Yasal bantta: "Apple ve Apple logosu, Apple Inc.'in ABD'de ve diğer ülkelerde tescilli ticari markalarıdır. App Store, Apple Inc.'in hizmet markasıdır." (6 pt). Google Play rozet kılavuzunda böyle bir şart yok.
- Kutuda iki rozet **aynı genişlikte** (37,8 mm), alt alta: App Store 10 mm, Google Play 11,2 mm yükseklikte. Google Play'in biraz daha yüksek olması kurala uygun: Google rozeti diğerleriyle aynı boyda ya da daha büyük olmalı; Apple'ın diğer mağaza rozetleriyle boy kısıtı yok. Aralarında 2,8 mm (büyük rozetin ¼'ü); adım kutucukları ve aktivasyon kutusuyla boşluklar kontur dahil korunur.
- Baskı rengi: App Store rozetinin iç siyahı SVG'de varsayılan dolgu (#000) olduğu için matbaa PDF'inde K100'e düşüyordu. Yüklenirken varsayılan dolgu `#0A0A0A` yapılır, böylece rozet zeminle aynı zengin siyahla (60/40/40/100) basılır (ekranda fark yok, yazı ve kenar rengi aynı). Google Play rozetinin siyahı yaklaşık dönüşümle 60/40/40/97 olur.

## Lokal UV lak (Aşama 3'te ayrı katman olacak)

Ön yüz logosu, büyüteçteki sticker ve telefon ekranı. Rozet, mühür alanı ve lot kutusu lak **almaz**.

## Bilinen açık noktalar

- `mobile.kisiselqr.com` hazır kabul edildi (Candemsoft onayı, 23.09.2026).
- Yapıştırma yeri belirtilmez (Adem, 6 Ekim): kullanıcı dilediği yere yapıştırır. Çizimlerdeki cam köşesi yalnız örnek.
- Kurulum sırası Temizle → Yapıştır → Aktif Et olarak kalır (Adem, 6 Ekim).
- Kutuda kazı-kazan ya da herhangi bir kod doğrulaması yok (Adem, 6 Ekim): aktivasyon, etiketin kendi QR'ının uygulamada okutulmasıdır. Ayrı aktivasyon kartı ve taşıyıcı kart tasarlanmıyor; kutu içeriği şimdilik yalnız etiket. Temizleme mendili askıda: bulunursa "Kutu içeriği" satırına eklenir.
- Mühür: Ø20 void etiket, yarısı ön yüzün alt kenarının ortasında. İkonların sarı alanda tam ortalanması için alt 10 mm'nin siyah olması gerekir (o zaman sarı alan 14 mm olur ve ikonlar tam ortada kalır); karar bekleniyor.
- Aktivasyon akışı (mobil uygulama): Uygulamada "QR KODUNU TANIMLA" → fiziksel QR okutulur (`claim_qr`). Kutudaki uyarı bu yüzden "uygulamadan okut" der.
- Arka yüzde iki okunabilir QR var: sticker'daki demo profil QR'ı (etiketsiz; "Okut: demo profil" yazısı 4 Ekim'de kaldırıldı) ve uygulama QR'ı ("Uygulamayı indir" etiketli). Sticker, sağdaki blokla (başlık + özellikler + aktivasyon kutusu) dikeyde ortalı.
- Sticker QR'ı canlıdaki demo profile gider (`kisiselqr.com/qr/071qydlb`). Orada hâlâ "Test Kullancısı" adı ve dolgu bir numara görünüyor; bildirim butonları açık. Demo profil de ön yüzdeki vitrinle aynı yapılırsa (ad, numarayı gizle, WhatsApp yerine LinkedIn) rafta okutan aynı profili görür.
- Matbaa PDF'inde toplam mürekkep %300'le sınırlı (en yüksek %298). Önceden neredeyse siyah gürültülü piksellerde %340'a çıkıyordu.
- Bu bir konsept önizlemesidir. Baskıya hazır PDF/X, katmanlar (Bicak, Lak_Lokal, Metin, Grafik, Tasma, Muhur_Alani, Lot_Alani) ve outline edilmiş fontlar Aşama 3'te hazırlanacak.
