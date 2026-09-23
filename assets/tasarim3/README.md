# Tasarım 3 – "Gece Sahnesi"

Modül: `tasarim3.js` → `window.KQRTasarim3` (`meta`, `render(ctx, GEO, opts)`, `ready()`).
Ortak öğeler (logo, sticker, telefon ekranı, uygulama QR'ı, ikonlar, açınım geometrisi) `KQRTasarim1.lib` üzerinden gelir; tasarim1.js değiştirilmedi.

## Konsept
Sinematik bir hikâye: gece, sokak lambasının yanında park etmiş bir araç **3/4 perspektiften (sol-önden)** görünüyor.
Ön camın sol alt köşesinde Kişisel QR sticker'ı cam düzleminde, perspektifle eğik duruyor. Ön planda omuz üstü plan:
bir el telefonu tutuyor, telefonun üst kenarından sticker'a sarı bir tarama ışını gidiyor; sticker'ın üzerinden yatay
sarı bir tarama çizgisi (lazer) geçiyor ve etiket hafifçe ışıyor. Telefon ekranında gerçek demo profil (L.phone) görünüyor.
Mesaj rafta 3 saniyede okunur: "camdaki QR okutulur → sahibine ulaşılır".
Sahne yalnız palet renkleriyle kurulur (siyah zemin, antrasit ton geçişleri, kırık beyaz ışık/kenar, sarı yalnız ışın ve vurgu).

### Araç çizimi (illüstrasyon dili)
- Araç, basit bir 3B modelden (metre) iğne deliği kamerayla sahne mm'sine izdüşürülür (`camera()`, `car34()`).
  Ölçü değişirse ya da kamera (`FRONT_CAM`) oynatılırsa perspektif tutarlı kalır.
- Tam kontur çizilmez: gövde siyah bir **siluet**tir; yalnız arkadaki lambaya bakan kenarlar (tavan hattı, C direği,
  yakın A direği, bel çizgisi, çamurluk kavisleri) kırık beyaz **kenar ışığı** (rim light) alır ve öne doğru söner.
  Uzak kenarlar yalnız sönük bir hatla tanımlanır. Tek ışık öğesi ön köşeyi saran ince LED gündüz farıdır.
- Ön cam gövdeden açık, tek geniş kavisli parlama + torpido gölgesiyle cam olarak okunur. Sticker (`L.sticker`)
  cam düzleminin yerel eksenlerine affine dönüşümle oturtulur (`glassPoint()`); camın parlaması sticker'ın üst köşesinden geçer.
  Sticker okunurluk için sahnede büyütülmüştür (perspektifte ≈ 6,9 mm taban × 8,9 mm eğik yükseklik); camın o noktadaki yüksekliğinin (19,6 mm) %45'ini kaplar, çevresinde koyu cam kalır.
- Arka kısım kadrajın sol kenarından taşar, burun telefonun arkasında kalır. Lamba direği aracın arkasındadır.

## Panel panel yerleşim
- **Ön yüz (96 × 136):** üstte 0–101,5 mm arası tam genişlikte gece sahnesi (siyah → antrasit pus, lambanın asfalttaki ışık
  havuzu, sol üstte sokak lambası + ışık konisi, 3/4 perspektif araç, sinematik vinyet). Sol üstte sarı logo, sağ üstte
  "by Candemsoft" (7 pt/500 beyaz). Sağ üstte hafif eğik, dişli kenarlı yuvarlak **mühür rozet**: çevre yazısı "CAMA NUMARA YAZMAYA SON",
  merkezde "Artık numaratöre gerek yok" (sarı zemin, K100); telefonla arasında ≥ 6 mm boşluk. Sağ altta el + telefon (24 × 48 mm, −8°).
  Sahnenin alt kısmında film afişi künyesi gibi **KİŞİSEL QR** (Outfit 800, 24 pt; "QR" sarı) ve alt satır
  "Akıllı Araç Etiketi + Dijital Kartvizit" (7,5 pt). 101,5 mm'den aşağısı **sarı bant**: 2 × 2 ızgarada 10 mm ikonlar + 8 pt etiketler
  (Numaran gizli · Anında bildirim · Dijital kartvizit · Aylık ücret yok). En alt 10 mm mühür bandı yalnız sarı zemin.
- **Arka yüz:** "Nasıl çalışır?" (13 pt sarı) + brif açıklaması; **3 kareli film şeridi** (antrasit şerit, K100 delikli kenarlar):
  1) Sticker'ı cama yapıştır (hedef kesikli çerçeve + inen sticker + ok), 2) Biri QR'ı okutur (telefon + sarı ışın),
  3) Bildirim sana gelir, numaran gizli (bildirim kartı + maskeli numara hapı). Altında 1 Temizle · 2 Yapıştır · 3 Aktif Et,
  sarı tikli 5 özellik (sol, 5,7 mm aralık) ve beyaz zeminde 20 mm uygulama QR'ı + 4 modül sessiz alan, altında "Uygulamayı indir / mobile.kisiselqr.com" (sağ).
  En altta 33 mm sarı yasal bant (K100): kutu içeriği, üretici, yer tutucular, Türkiye'de üretilmiştir, PAP 21, SKU; sağda beyaz EAN-13 yer tutucu
  (29,8 × 20,7 mm, bigilerden 8 mm).
- **Sol yan:** siyah; alttan yukarı KİŞİSEL QR (beyaz + sarı "QR"), altta 8 mm sarı logo ikonu.
- **Sağ yan:** siyah; dikey kisiselqr.com (sarı) + "Araç + Dijital Kartvizit" (beyaz); lot kutusu 10 × 15 mm beyaz, ortalı, alt bigiden 8 mm yukarıda.
- **Euro başlık:** sarı zemin; her iki katta deliğin altında ~6 mm K100 logo; 2. kat 180° ters çizilir, delikler destination-out ile boş.
- **Üst kapak + üst toz kapakları:** düz siyah. **Alt kilitli kapak + geçme dili:** düz sarı (ön yüzün alt bandıyla aynı; Ø20 mühür
  etiketi ön bant ile kapağın serbest kenarı arasında tek renk zemine gelir). Metin yok.
- **Tutkal payı + üst yapıştırma dili:** baskısız (#E9E5DA).

## Tasarım 1'den farkları
- Tasarım 1 düz siyah zeminde **önden, simetrik, tam konturlu** çizgisel araç + yanında dik telefon mockup'ı kullanır.
  Burada araç **3/4 perspektifte, kadrajdan taşan, konturu olmayan bir siluet**tir; biçimi yalnız lamba kenar ışığıyla okunur.
  Far mercekleri, ızgara, hava girişi, dikiz aynası, silecekler ve çapraz yansıma bantları yok.
- Sticker düz bir çıkartma olarak değil, **cam düzleminde perspektifle** durur; odak L köşeleri yerine sarı tarama çizgisi + hafif ışıma.
- Ön yüz baştan sona **tek bir sinematik sahne** (ışık, atmosfer, vinyet, omuz üstü el); telefon-sticker ilişkisi tarama ışınıyla **eylem olarak** gösterilir.
- Ürün adı üstte değil, film afişi gibi sahnenin altında; rozet bant/etiket değil **dişli kenarlı yuvarlak mühür**.
- İkonlar tek sıra yerine 2 × 2 ızgara; arka yüz madde listesinden önce **film şeridi hikâyesi** ile anlatır.

## Yer tutucular (Candemsoft onayı bekleniyor)
- `[Adres – Candemsoft onayı bekleniyor]`, `[KVKK bilgilendirme metni – onay bekleniyor]`, `SKU: [bekleniyor]`
- EAN-13: beyaz yer tutucu kutu, sahte barkod çizilmedi.
- Sticker görseli ve profil ekranı L.sticker / L.phone'daki mevcut kaynaklar; nihai baskı görseli ve vektörel logo gelince aynı fonksiyonlarla değişir.

## Lokal UV lak önerisi
- Ön yüz: sarı logo, sticker illüstrasyonu (+ tarama çizgisi), tarama ışınının kenar çizgileri, KİŞİSEL QR başlığı, telefon ekranı.
  Mat selefon üzerinde parlak lak, gece sahnesinde "ışıyan" öğeleri öne çıkarır.
- Mühür rozeti lak almaz (brif). Alt mühür bandı da lak almaz.
- Arka yüz: yalnız film şeridindeki sticker'lar ve sarı tikler. Uygulama QR'ı, EAN yer tutucu ve lot kutusu **laksız**.
