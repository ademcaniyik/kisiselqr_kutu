# Tasarım 2 – Tasarım 1 + Yatay Sticker

23 Kasım 2026 (Adem): Tasarım 2, Tasarım 1'in birebir kopyasıdır. Tek fark, kutuda görünen sticker:
dikey orijinal etiket (50 × 80 mm) yerine yatay sticker (80 × 50 mm).

- Çizim `assets/tasarim1/tasarim1.js` içindeki `KQRTasarim1.olustur(CFG)` ile üretilir. `CFG` boşsa Tasarım 1 çıkar.
  Tasarım 1'e yapılan her değişiklik (metin, yerleşim, yasal bant) Tasarım 2'ye de kendiliğinden gelir.
- `tasarim2.js` yalnız yatay sticker'ı (`yatayStk`) ve yerleşim ayarlarını verir:
  camdaki gerçek ölçü 80 × 50, büyüteç görüş noktası, 2. ve 3. adımdaki küçük sticker'ların ölçüsü ve konumu.
- Sticker ölçüleri Adem'in ilettiği görselden çıkarıldı (8,14 px/mm). QR gerçek, demo profile gider (KQR_QR_DEMO).
- Arka yüz (24 Kasım, Adem) Tasarım 1'den farklı: EAN-13 yok, yasal metin tam genişlikte (bant 37 → 28 mm),
  SKU son satırın sağında, kutu içeriğinde "8 × 5 cm". Aktivasyon kutusu tam genişlikte; "Uygulamada ayrıca" 2 sütun.
  DENE, örnek sticker'ın üstünde ortalı sarı sekme (aşağı oklu). Örnek sticker ≈ 29 mm, QR ≈ 11 mm; OpenCV ile okundu,
  baskı provasında telefonla da denenmeli. Ayarlar `tasarim2.js` içindeki `arka: {...}` nesnesinde.
- Eski "Sticker Kahraman" tasarımı git geçmişinde (`git show 447cd74:assets/tasarim2/tasarim2.js`).

## Ön yüz (24 Kasım)
- `vitrin_profil_ekran_tel.jpg`: telefon ekranı, Tasarım 1'in vitrin ekranıyla aynı ama plakanın altında sayfanın kendi "Telefon ile Ara" butonu var (örnek numara 0500 123 45 67; 0500 kullanılmayan bir GSM öneki). Üretim: `TELEFON="0500 123 45 67" OUT=assets/tasarim2/vitrin_profil_ekran_tel.jpg python araclar/demo_ekran_goruntusu.py`.
- Büyüteç büyük (r 11,2 mm, yakınlaştırma 0,22): baskıda örnek sticker ve QR ayrıntısı seçilsin.
- "by Candemsoft" yazısı ve eğik "Artık numaratöre gerek yok" rozeti yok; sağ yan kapakta lot kutusu yok.
