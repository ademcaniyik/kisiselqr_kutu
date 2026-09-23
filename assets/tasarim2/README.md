# Tasarım 2 – "Sticker Kahraman"

Kaynak: *Kişisel QR Araç Etiketi – Kutu Tasarım Brifi* (23.09.2026) + Ambalaj Şartnamesi v1.0 (ölçü, tipografi, baskı kuralları).

`tasarim2.js`, açınımın tamamını mm koordinatlarında GEO verisinden çizer (`window.KQRTasarim2`). Sticker, telefon, logo, ikonlar ve QR'lar Tasarım 1'in ortak kitaplığından (`KQRTasarim1.lib`) gelir. Böylece ürün gerçekleri (birebir sticker, gerçek demo ekranı, gerçek QR'lar) iki tasarımda da aynı kalır.

## Konsept

Ön yüzün kahramanı ürünün kendisi. Kutuda aracın sol ön çeyreği **yakın planda**, dışarıdan görünüyor. Sahnede şu parçalar var: yan ayna, A-sütunu, tavan kenarı, açık antrasit ön cam ve üzerinde iki çift çapraz yansıma bandı (kırık beyaz, %16–22), camın üst ve sol kenarında ince kırık beyaz kontur, seramik frit bandı ve noktaları, park hâlindeki silecek, torpido ızgarası ve sarı kaput. Sticker camın **sol alt köşesinde**, frit bandının hemen üstünde duruyor: 25,6 mm genişlikte, A-sütununa paralel +6° eğik. Yansıma bantları sticker'ın da üstünden geçer, böylece sticker'ın camın üzerinde olduğu anlaşılır.

Yakın planın aracın neresi olduğu bir **konum anahtarıyla** gösteriliyor. Anahtar, aracın önden çizgisel mini görünümü (17,3 × 10,4 mm, kırık beyaz kontur). Ön camının sol alt köşesinde sarı mini sticker ve sarı halka var. Halkadan yakın plandaki sticker'a kesikli sarı bir "zoom" çizgisi iniyor, altında da **"Ön camın / sol alt köşesine"** etiketi yazıyor (Outfit 800 7,5 pt sarı + Inter 600 7 pt beyaz). İç dikiz aynası kadrajdan çıkarıldı. Önceki turda sticker'ın camın üst ortasında durduğu izlenimini bu ayna veriyordu.

Siyah/sarı bölünme ayrı bir grafik şerit değil, sahnenin kendisi: üstte siyah gövde ve cam, altta sarı **kaput kenarı**. Logodaki siyah/sarı yarım yapı böylece bir araç parçası olarak kutuya taşınıyor.

Telefon sağ altta ve kaputun önünde duruyor (22 × 44 mm). Tek bir callout var: **"Okut: demo profil"**. İnce sarı çizgi sticker'ın QR'ından telefondaki "Test Kullanıcısı" satırına gidiyor. Ön yüzdeki sticker'ın QR'ı gerçek ve demo profile yönlendiriyor. Fayda mesajları yalnız 4 ikon etiketinde yer alıyor, callout'larda tekrarlanmıyor.

## Panel panel yerleşim

| Yüzey | İçerik |
|---|---|
| **Ön (96 × 136)** | Sol üstte sarı logo (7,4 mm), sağ üstte "by Candemsoft" (7 pt, beyaz). Ortalı **KİŞİSEL QR** (Outfit 800, 23 pt, "QR" sarı) ve altında "Akıllı Araç Etiketi + Dijital Kartvizit" (Inter 600, 8,5 pt, kırık beyaz). Yakın plan araç sahnesinin sol alt köşesinde 25,6 mm sticker (+6°) duruyor. Sağında konum anahtarı var (mini araç + "Ön camın sol alt köşesine"), onun altında "Okut: demo profil". Sağ üstte sekizgen, "dur" tabelası biçiminde sarı rozet: "ARTIK numaratöre gerek yok" (Archivo 800, siyah, −8°). Sağ altta 22 × 44 mm telefon. Sarı kaput bandında 4 çizgisel ikon, her biri Ø14 siyah halka içinde, tek satır 7 pt etiketle: Numaran gizli · Anında bildirim · Dijital kartvizit · Aylık ücret yok. En alttaki 10 mm mühür bandında yalnız sarı zemin var. |
| **Arka (96 × 136)** | Siyah üst bölümde "Nasıl çalışır?" (Outfit 800, 13 pt, sarı) ve brifteki açıklama (Inter 500, 7,2 pt). Sarı yatay **adım şeridinde** 3 piktogram var: 1 Temizle (mendil camı siliyor), 2 Yapıştır (parmak sticker'ı cama bastırıyor), 3 Aktif Et (aktivasyon kartından telefona onay). Numaralar siyah daire içinde sarı. Siyah orta bölümde solda 5 özellik (sarı tik), sağda beyaz QR kartı var. Kartta 20,5 mm uygulama QR'ı, altında "Uygulamayı indir" ve "mobile.kisiselqr.com" (K100) yazıyor. Kutu içeriği tek satır. Beyaz yasal bantta K100 metinler var: Üretici Candemsoft, [adres], [KVKK], "Türkiye'de üretilmiştir", geri dönüşüm işareti + PAP 21, SKU. Ayrıca EAN-13 yer tutucusu (29,8 × 20,7 mm, sağ ve alt bigiden 8 mm). Sol metin sütunu ve QR kartı yan bigilerden 4,5 mm içeride (SAFE + 0,5 mm kesim toleransı). |
| **Euro başlık** | Sarı zemin ve boş delik. Deliğin 3,6 mm altında siyah logo (6 mm). 2. kat (Baslik2) açınımda 180° ters çizildi. |
| **Sol yan (18,5 mm)** | Siyah zemin. Dikey, alttan yukarı okunan KİŞİSEL QR (Outfit 800, beyaz + sarı "QR"). Altta dikey küçük sarı logo. |
| **Sağ yan (18,5 mm)** | Siyah zemin. Dikey kisiselqr.com (Outfit 700, sarı) ve "Araç + Dijital Kartvizit" (7,5 pt, beyaz). Lot kutusu 10 × 15 mm: beyaz, ortalı, alt bigiden 8 mm yukarıda, üstünde hiçbir şey yok. |
| **Üst kapak + toz kapakları** | Düz siyah. |
| **Alt kilitli kapak + geçme dili** | Düz siyah, metin yok. Ø20 mühür yarım dairesi yalnız zemin. Siyah seçildi, böylece genel oran brife yaklaştı. |
| **Tutkal payı / üst yapıştırma dili** | Baskısız (ekranda `#E9E5DA`). |

Taşma: Her baskılı yüzeyin zemini kesim hattından 3 mm dışarı taşıyor. Ön ve arka panel çizimleri panel sınırına kırpıldı, yani sahne yan panellere sızmıyor. Sahnedeki ince çizgiler (cam konturu, frit, ızgara yarıkları, tavan silüeti, kaput parlaması) yan bigilerden 3,2 mm önce bitiyor.

Renk oranı (baskılı alan, render'dan ölçüldü): siyah %52 · sarı %31 · beyaz + kırık beyaz %12 · antrasit %6. Telefon ekranı ve sticker palet istisnası.

## Tasarım 1'den farkları

| | Tasarım 1 | Tasarım 2 |
|---|---|---|
| Araç görseli | Aracın önden tam görünümü; sticker küçük (9,5 mm) | Sol ön çeyreğin yakın planı; sticker kahraman (25,6 mm). Tam araç yalnız küçük konum anahtarında |
| Siyah/sarı bölünme | Düz yatay çizgi (2/3) | Kaput kenarı: hafif eğik ve kavisli, üstünde beyaz parlama |
| Telefon | Büyük (28 × 56), sticker'dan bağımsız | 22 × 44, sticker QR'ına callout çizgisiyle bağlı |
| Rozet | Eğik dikdörtgen etiket, sol alt | Sekizgen "dur" tabelası, sağ üst |
| Başlık | Sola hizalı Inter Black | Ortalı Outfit ExtraBold |
| İkonlar | Çıplak ikon, iki satır etiket | Siyah halka içinde ikon, tek satır etiket |
| Arka yüz | Sticker görseli + tikler, adımlar tek satır | Sarı adım şeridi ve 3 piktogram, beyaz QR kartı, beyaz yasal bant |
| Alt kapak | Sarı | Siyah |

## Yer tutucular (Candemsoft'tan gelecek)

- **EAN-13 numarası:** Kesikli çerçeveli boş beyaz alan. Sahte barkod çizilmedi.
- **SKU, üretici adresi, KVKK metni:** Köşeli parantez içinde "bekleniyor".
- **Logo vektörü:** Tasarım 1'deki vektörel yeniden çizim kullanıldı. Resmî SVG/AI gelince değiştirilmeli.
- **Sticker'ın gerçek fotoğrafı (onay gerekli):** Brif, arka yüzün orta-soluna ~26 × 42 mm sticker fotoğrafı öneriyor. Bu konseptte sticker ön yüzde büyük olarak yer aldığı için arka yüzde yalnız adım 2 piktogramında (5,6 mm) görünüyor. Candemsoft fotoğrafı arka yüzde de isterse, adım şeridi küçültülüp sol orta alana 26 × 42 mm sticker eklenebilir. Bu durumda demo QR çözülmeli ve yanına "demo profil" notu konmalı.
- **Metinler:** "Ön camın sol alt köşesine" ve "Okut: demo profil" brif cümlelerinden türetildi, birebir alıntı değil. Candemsoft onayına sunulmalı.
- **Başlık fontu:** Outfit, brifteki "logoya yakın geometrik grotesk" önerisine uygun. Onay bekliyor.

## Lokal UV lak önerisi (Lak_Lokal katmanı)

- Ön yüz logosu.
- Ön camdaki sticker: **yalnız sticker konturunun içi.** Sticker'ın beyaz kenar konturu ve gölgesi lak dışında kalır, yansıma bantları da lak almaz. Parlak sticker ile mat cam arasındaki kontrast "camda duran etiket" hissini güçlendirir.
- Telefon ekranı.
- **Lak almaz:** rozet, konum anahtarı, ikon şeridi ve kaput bandı, mühür bandı, alt kapak, lot kutusu, arka yüzdeki uygulama QR'ı ve EAN-13 alanı (okutma güvenliği), tutkal payı.

## Kontrol

- QR çözümü (s=12 render, OpenCV): arka yüzde `https://mobile.kisiselqr.com`, ön yüzde sticker'dan `https://kisiselqr.com/qr/071qydlb` (demo profil, "Okut: demo profil" etiketli).
- Uygulama QR'ının sessiz alanı (29 modül, modül 0,707 mm, render pikselleriyle ölçüldü): üstte 3,0 mm (4,2 modül), solda ve sağda 4,5 mm (6,4 modül), altta "Uygulamayı indir" metninin üst kenarına kadar 3,9 mm (5,5 modül). Dört kenar da ≥ 4 modül.
- Metin boyutları: koyu zeminde ters metin ≥ 7 pt ve ≥ 500 ağırlık; açık zeminde normal metin ≥ 6 pt. Ürün adı 23 pt. Metinlerin kesim ve bigi hatlarına en yakın mesafesi ön yüzde 5,0 mm (logo yazısı, üst kenar), arka yüzde 4,5 mm.
- Renderlar `renders/t2_*.png` (front, back, header, left, right, top, bottom, full, full_dl, front_dl). Her render, boş bir porttan açılan Chrome'da, sayfa URL'si doğrulandıktan sonra alındı (`renders/t2_fx_render.py`). Böylece paralel çalışan ajanlarla port çakışması riski ortadan kalktı.
