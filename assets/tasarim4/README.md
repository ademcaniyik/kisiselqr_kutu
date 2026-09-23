# Tasarım 4: "Tipografik Izgara"

Modül: `tasarim4.js` → `window.KQRTasarim4` (`meta`, `render(ctx, GEO, opts)`, `ready()`).
Ortak ürün öğeleri (logo, sticker, telefon, QR matrisleri, ikonlar) `KQRTasarim1.lib` üzerinden gelir. tasarim1.js değiştirilmedi.
Yalnız Inter (400–900) kullanılır. Montserrat 800 yalnız lib'in sticker çiziminde yer alır.

## Konsept
İsviçre / editoryal tipografi. Her 96,5 mm'lik geniş panel aynı **12 kolonlu ızgaraya** oturur
(5 mm dış boşluk, 2 mm oluk). Süsleme yerine ızgaranın kendisi görünür: kolon çentikli ince kural çizgileri,
numaralı küçük başlıklar (01–04, 01–05) ve sola yaslı (flush-left) yazı blokları.
Ön yüz, logodaki siyah/sarı yarı bölünmeyi **tam ortadan** (y = h/2) uygular. Dev **"QR"** harfleri
bölünme çizgisine taşar: siyah yarıda sarı, sarı yarıda siyah (clip ile iki renkli). İllüstrasyon
minimal ve diyagramatik: aracın önden piktogramı, camın sol alt köşesindeki sticker ve oklu etiket.

## Panel panel yerleşim
- **Ön yüz** (siyah üst yarı / sarı alt yarı)
  - Üst satır: sarı logo solda, "by Candemsoft" sağda (7 pt beyaz 500). Altında kolon çentikli ince kural.
  - Ürün adı "KİŞİSEL QR" 22 pt Inter 900 ("QR" sarı). Alt satır "Akıllı Araç Etiketi + Dijital Kartvizit" 8 pt 600.
  - Rozet: sağda Ø18 mm sarı daire, içinde "Artık numaratöre gerek yok" (7,2 pt 800, K100).
  - Vaat cümlesi: "Numaranız görünmeden size ulaşsınlar." 10 pt SemiBold (şartname: ana vaat 10–11 pt). Kolon 2'den başlar, sarı kısa kural ile işaretli.
  - Dev "QR" (kolon 1–8): bölünme çizgisinin üstünde sarı, altında siyah.
  - Telefon (L.phone, 23 × 46 mm): ızgaranın sağ kenarına yaslı, bölünme çizgisini keser. **Gölgesiz**: lib'in yarı saydam
    gölgesi sarı yarıda koyu bir hale bırakıyor ve sağ bigiye yaklaşıyordu.
  - Diyagram: aracın önden siyah piktogramı (×1,14), antrasit ön cam ve sarı cam konturu. Cam yüksek çizilir (9,5 birim).
    Sticker (L.sticker, ürünün birebir kopyası) camın **sol alt köşesine** oturur: genişlik 3,9 birim (baskıda 4,4 mm),
    cam yüksekliğinin ~%66'sı. Alt kontura ve eğik sol kenara ≥ 0,5 mm pay kalır, üstünde ve sağında cam görünür.
    Etrafında sarı odak halkası var. Soldan gelen ok ve etiket: "ÖN CAMA YAPIŞTIR / sol alt köşe / QR etiketin yeri".
    Tekerler ikon şeridinin kuralına basar (zemin çizgisi).
  - İkon şeridi: 4 hücre × 3 kolon, ince siyah (K100) dikey kurallarla ayrık. Her hücrede ikon, sağ üstte numara (01–04)
    ve iki satır etiket var (Numaran gizli · Anında bildirim · Dijital kartvizit · Aylık ücret yok).
  - En alt 10 mm mühür bandı: yalnız sarı zemin.
- **Arka yüz** (siyah, altta saf beyaz bilgi bandı)
  - "Nasıl çalışır?" (13 pt sarı) ve sağda "KİŞİSEL QR" künyesi. Altında kolon çentikli kural ve brifteki 3 cümlelik açıklama (7,5 pt 500).
  - Adımlar: 3 × 4 kolon. Dev sarı **1 · 2 · 3** rakamları yanında "Adım 01 / Temizle", "Adım 02 / Yapıştır", "Adım 03 / Aktif Et".
    Aralarında ince antrasit dikey kurallar var.
  - Solda 21 mm genişlikte sticker (demo profil QR'ı çözülüyor), altında "Okut: demo profil".
  - Sağda brifteki 5 özellik: 01–05 numaralı editoryal liste, antrasit ince ayraçlarla. 5. madde 7 pt'de (ters yazı alt sınırı)
    tek satıra sığmadığı için anlam yerinden dengeli iki satıra bölünür: "Aracın olmasa da kullan: / kartvizit olarak yeterli."
  - Beyaz bant (ızgara A | B | C):
    - A: uygulama QR'ı 20 mm (+4 modül sessiz alan), altında "Uygulamayı indir" / "mobile.kisiselqr.com".
    - B: Kutu içeriği (1 QR Etiket · 1 Aktivasyon Kartı · 1 Temizleme Mendili). QR sessiz alanının dışında başlar.
    - C: EAN-13 yer tutucu 29,8 × 20,7 mm, 8. kolon başında. Sağ (Arka/Tutkal) bigiden 10,1 mm, alt bigiden 21,5 mm.
      Kesikli kontur kutunun içine çizilir. Altında malzeme işareti (üç oklu üçgen, içinde 21) + "PAP" + "SKU: [bekleniyor]".
    - Altta tam genişlik kural ve iki kolonlu yasal satırlar (6,3 pt K100): Üretici: Candemsoft · [Adres – onay bekleniyor] ·
      [KVKK metni – onay bekleniyor] · Türkiye'de üretilmiştir.
- **Sol yan** (siyah): alttan yukarı "KİŞİSEL QR" (Inter 900, "QR" sarı), altında ince kural ve sarı logo ikonu.
  Üstteki boş alanda ızgaranın dikey karşılığı: kolon çentikli dikey cetvel (7,375 mm adım).
- **Sağ yan** (siyah): üstte dikey "kisiselqr.com" (sarı) ve "Araç + Dijital Kartvizit" (beyaz). Ortada aynı dikey ızgara cetveli.
  Altta lot kutusu: 10 × 15 mm beyaz, yatayda ortalı, alt bigiden 8 mm, üstünde hiçbir şey yok.
- **Euro başlık** (iki kat sarı): delik altında siyah logo (6 mm, **K100**: küçük siyah metin tek kanal) ve iki yanında ince K100 kural
  (kenarlardan 8 mm, delikten ≥ 3 mm). 2. kat (Baslik2) açınımda 180° ters çizilir. İki delik destination-out ile boş.
- **Üst toz kapakları / üst kapak / alt toz kapakları**: düz siyah, metinsiz.
- **Alt kilitli kapak + geçme dili**: düz **sarı** (brif: "ön yüzün alt bandıyla aynı"). Ön yüzün sarı alt yarısı kutunun tabanına
  devam eder. Metin yok, Ø20 mühür alanı yalnız zemin.
- **Tutkal payı ve üst yapıştırma dili**: baskısız (#E9E5DA).
- Taşma: tüm zeminler (ön yüzün sarı yarısı ve arkadaki beyaz bant dahil) kesimden 3 mm dışarı taşar.

## Tasarım 1'den (ve 2–3'ten) farkları
- T1'de ön yüzde büyük çizgisel araç ve telefon illüstrasyonu var, siyah üst / sarı alt bant (alt ~%33). T4'te bölünme tam ortada
  ve kompozisyonun kendisi. Ana grafik öğe tipografi (dev iki renkli "QR"), illüstrasyon küçük bir piktogram.
- T2 fotoğrafik büyük sticker ve açıklama çizgileri, T3 gece sahnesi, perspektifli araç ve elde telefon kullanıyor. T4 düz ve diyagramatik,
  ızgara odaklı: kurallar, kolon çentikleri, numaralı başlıklar.
- Arka yüzde T4 dev 1-2-3 rakamlarıyla editoryal bir adım satırı ve numaralı özellik listesi kullanır.

## Yer tutucular ve açık sorular (onay bekleyen)
- EAN-13 numarası (kutu yalnız yer tutucu, sahte barkod çizilmedi), SKU, üretici adresi, KVKK metni.
- Logo vektörü (şimdilik lib'deki yeniden çizim), sticker'ın gerçek baskı dosyası/fotoğrafı.
- "sol alt köşe" araca **dışarıdan** bakan kişiye göre çizildi (diğer tasarımlarla aynı). Türkiye'de sürücü tarafı dışarıdan bakınca
  sağda kalır. Hangi köşenin kastedildiği Candemsoft'a sorulmalı; gerekirse metin "(dışarıdan bakınca)" diye netleştirilir.
- Hitap: brif metinleri "Numaranız … size" (siz) ile "Numaran gizli" (sen) karışık. Metin onayında tek hitaba indirilmeli.

## Lokal UV lak önerisi (Lak_Lokal katmanı)
- Ön yüz: dev "QR" harflerinin sarı (üst) yarısı ve logo. Mat selefon üstünde parlak kontrast verir.
- Ön yüz: telefon ekranı ve diyagramdaki sticker (gerçek ürünün parlaklığını taklit eder).
- Arka yüz: dev 1-2-3 rakamları.
- Lak ALMAZ: lot kutusu (laksız, selefonsuz), EAN-13 alanı, uygulama QR'ı ve sessiz alanı, arka sticker'daki demo QR,
  rozet, mühür bandı, alt kapaktaki Ø20 mühür alanı, tutkal payları.

## Kontroller (son render)
- QR çözümü (`t4_back.png`, s=12): `https://mobile.kisiselqr.com` ve demo profil `https://kisiselqr.com/qr/071qydlb` çözülüyor.
- Ön cam sticker'ı (`t4_front_s24.png`): cam konturuna en yakın mesafe 0,56 mm. Cam iç yüksekliğinin %66'sı (beyaz kenarla %69).
  Dört köşesi de camın (antrasit) içinde.
- EAN kesikli konturu: sağ bigiden 10,08 mm, alt bigiden 21,5 mm.
- Euro başlık logosu iki katta da #000000 (K100).
- Lot kutusu: 10,00 × 15,00 mm, iki yandan 4,25 mm (ortalı), alt bigiden 8,00 mm, içi tamamen beyaz.
- Ön ve arka yüzde kenardan 4 mm'lik şeritlerde zemin dışı piksel yok. Ön yüz mühür bandında sarı dışı piksel yok.
- Palet oranı (açınım, s=5): siyah %47,3 · sarı %35,0 · beyaz/kırık beyaz %13,8 · antrasit %3,8 (alt kapak ve dil sarı olduğu için sarı payı arttı; ±15 puan içinde).
