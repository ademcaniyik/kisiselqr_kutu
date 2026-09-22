# Candemsoft QR Kutu – Aşama 1 Ölçü Raporu (v1)

Kaynak: Candemsoft_Ambalaj_Sartnamesi.pdf v1.0 · Tarih: 22.09.2026 · Üreteç: `kutu_acinim.py` (parametrik)

## 1. Özet

| | Değer |
|---|---|
| Kutu tipi | Euro askı delikli çift kat başlık + alt reverse-tuck slit lock, yan yapıştırmalı |
| İç ölçü (G × D × Y) | 96 × 18 × 136 mm |
| **Açınım (kesim) toplam ölçüsü** | **245 × 239 mm** (G × Y) |
| Taşma dahil | 251,01 × 245 mm |
| Karton | 350 g/m² GC1, t = 0,45 mm → bigi payı +0,5 mm |
| Kesilmiş karton alanı | ≈ 471,7 cm² |

## 2. Panel ve kapak ölçüleri (bigi-bigi, mm)

Dizilim (dış/baskı yüzünden, soldan sağa): **Sol – Ön – Sağ – Arka – Tutkal**. Üst kapak Ön’e, alt kilitli kapak Arka’ya bağlı; başlık Arka düzleminde.

| Parça | Ölçü | Not |
|---|---|---|
| Ön / Arka | 96,5 × 136,5 | iç 96 + 0,5 |
| Sol / Sağ yan | 18,5 × 136,5 | iç 18 + 0,5 |
| Tutkal payı | 15 × 136,5 | uçlar 15° eğimli, Sol yan iç yüzüne yapışır |
| Euro başlık 1. kat | 96,5 × 35 | Arka’nın devamı (bigi yok) |
| Euro başlık 2. kat | 95,5 × 34 | bigiden aşağı katlanır, köşe R3 |
| Üst kapak | 96,5 × 18,5 | Ön’e bağlı, kalıcı yapıştırılır |
| Üst yapıştırma dili | 94,5 × 12 | başlık katları arasına; **dış yüzü baskısız/selefonsuz** |
| Toz kapakları (4 adet) | 18,5 × 25 | yanlardan 1 mm boşluk, uç pahlı |
| Alt kapak | 96,5 × 18,5 | Arka’ya bağlı |
| Geçme dili | 94,5 × 15 | köşe R3, iki uçta 5 mm slit lock |
| Euro delik | 32×8 oval + Ø10 | delik üstü bigiden 8 mm, merkez 13 mm; iki katta ayna konumda |
| Lot kutucuğu | 10 (G) × 15 (Y) | Sağ yan, alt bigiden 8 mm yukarı, ortalı |
| Mühür alanı | Ø20 | alt kapağın serbest (açılma) kenarına ortalı: yarısı alt kapakta, yarısı Ön alt kenarda |

## 3. Otomatik kontroller (3D katlama modeli üzerinden)

| Kontrol | Sonuç | Ayrıntı |
|---|---|---|
| Gövde halkası kapanıyor (Arka serbest kenarı = Sol serbest kenarı) | ✅ | sapma 0.0000 mm |
| İç genişlik (G) 96 ±1 | ✅ | bigi-bigi 96,5 → iç ≈ 96,05 mm |
| İç derinlik (D) 18 ±1 | ✅ | bigi-bigi 18,5 → iç ≈ 18,05 mm |
| İç yükseklik (Y) 136 ±1 | ✅ | bigi-bigi 136,5 → iç ≈ 136,05 mm |
| Üst kapak serbest kenarı Arka düzlemine oturuyor | ✅ | z farkı 0.0000 mm |
| Başlık 1. ve 2. kat Euro delikleri üst üste | ✅ | eksen kayması 0.0000 mm, katlar arası 0.90 mm |
| Başlık 2. kat alt kenarı üst kapağa çarpmıyor | ✅ | boşluk 1 mm |
| Üst yapıştırma dili Euro deliğe ulaşmıyor | ✅ | dil üstü ile delik altı arası 5 mm |
| Geçme dili iç genişliğe sığıyor | ✅ | dil 94,5 mm / iç 96 mm |
| Geçme dili kutu içine, Ön panelin arkasına giriyor | ✅ | dil ucu Ön iç yüzünden 0,45 mm içeride |
| Toz kapakları birbirine çakışmıyor (üst ve alt) | ✅ | aradaki boşluk 46 mm |
| Toz kapağı genişliği derinliğe sığıyor | ✅ | 16,5 ≤ 18 mm |
| Tutkal payı Sol yan iç yüzünde kalıyor | ✅ | 15 mm / Sol iç 18 mm |
| Euro delik güvenli alanda (bigiden ≥ 4 mm) | ✅ | delik üstü bigiden 8 mm |
| Euro delik yatayda güvenli alanda | ✅ | yan boşluk 32,25 mm |
| Delik altında 3 mm metinsiz bant sonrası başlıkta alan kalıyor | ✅ | delik altı kullanılabilir 10 mm |
| Lot kutucuğu Sağ yan güvenli alanında | ✅ | yan pay 4,25 mm, bigiden 8 mm |
| Mühür yarısı alt kapağa sığıyor | ✅ | 10 mm / kapak 18,5 mm |
| Taşıyıcı kart iç ölçüye sığıyor | ✅ | 92×132 / 96×136 |
| Paket kalınlığı derinliğe sığıyor (varsayım) | ✅ | 8 / 18 mm – boşluk 10 mm |
| Açınım geçerli tek parça (kendini kesmiyor) | ✅ | alan 471,7 cm² |
| A3 maket sayfasına sığıyor | ✅ | 245×239 mm |

## 4. Varsayımlar

- Bigi payı = karton kalınlığı yuvarlaması: +0,5 mm her panelde (G, D, Y). Matbaanın makine/karton standardı farklıysa tek parametreyle değişir.
- Paket kalınlığı 8 mm varsayıldı (taşıyıcı kart + etiket + aktivasyon kartı + saşe mendil). D = 18 korunduğu için ~10 mm boşluk var.
- Euro başlık Arka düzleminde; 2. kat öne katlanır, baskılı yüzü öne bakar (şartname 3.1 “ön yüz tarafı”).
- Başlık 2. kat 1 mm kısa, yanlardan 0,5 mm içeride; katlandığında kenarlardan taşmaz.
- Üst kısım kalıcı yapıştırılır (kapak + dil başlık katları arasında); kutu yalnız alttan açılır.
- “8 mm aşağıda” ifadesi, deliğin (Ø10 dairenin) üst kenarı olarak yorumlandı.
- Slit lock detayı temsilidir (uçlarda 5 mm kesik); matbaanın standart kilit detayı ile değiştirilmelidir.
- Güvenlik etiketi şeffaf olduğu için Ön alt 10 mm bantta zemin rengi serbest; metin, ikon ve lokal UV lak yok.
- Lot kutucuğu 90° döndürüldü (10 G × 15 Y), laksız ve selefonsuz.
- Parmak oyuğu yok.
- **Başlık 2. kat (ön yüz) 180° katlandığı için grafiği açınımda baş aşağı yerleştirilmelidir** (3D önizlemede doğrulandı; Aşama 3 için kritik).

## 5. D = 12 mm senaryosu (içerik ölçümüne göre)

- Sağ/Sol yan panel: 12,5 mm → 4 mm güvenli alan sonrası kullanılabilir genişlik **4,5 mm**. Dikey metin 7 pt (≈2,5 mm cap) sığar ama tek satır.
- Lot kutucuğu (10 mm genişlik) **sığmaz**: yan pay 1,25 mm (gereken ≥ 4). 4 mm güvenli alanla sığması için D ≥ 17,5 mm gerekir.
  - Seçenekler: (a) Lot alanı inkjet için kritik metin sayılmayıp yan paydan muaf tutulur (kutucuk kenara 1,25 mm kalır); (b) lot kutucuğu Arka yüz alt bandına, barkodun yanına alınır; (c) kutucuk 15 × 6 mm’ye küçültülür (tek satır lot no).
- Üst kapak ve alt kapak 12,5 mm → güvenli alan yüksekliği 4,5 mm. Mühür yarısı (10 mm) alt kapağa hâlâ sığar.
- Tutkal payı 15 mm > 12 mm iç derinlik: **12 mm’ye düşürülmeli** (yan panelden taşar).
- Açınım genişliği 245 → 233 mm olur.

## 6. Matbaaya sorulacaklar

- Bu kutu tipi (hang-tab çift kat + reverse tuck slit lock) standart bıçak kütüphanenizde var mı? Açınımı kendi bıçağınıza oturtup vektörel (AI/PDF) gönderir misiniz? (Şartname 1.2)
- 350 g GC1 + mat selefon için bigi payınız nedir? Biz +0,5 mm kullandık. Bigi kanal/derinlik ayarı ve 18 mm yanlarda çatlama riski?
- Tutkal payı ve üst yapıştırma dilinin dış yüzü selefonsuz kalmalı. Selefonda maskeleme (lokal boşluk) mümkün mü, yoksa tutkal payında selefon kazıma/özel yapıştırıcı mı?
- **Lot kutucuğu hem laksız hem SELEFONSUZ olmalı**: inkjet mürekkebi selefon üzerinde tutmaz. Tabaka selefonunda 10×15 mm lokal boşluk bırakılabilir mi? Alternatifler: selefona tutan UV-kürlenen inkjet, lazer kodlama ya da lot etiketi.
- Başlık katlarını ve üst kapak dilini yapıştırma makinesi yapabilir mi, yoksa elle ek işlem mi? Maliyet farkı?
- Euro delik iki katta ayrı kesiliyor. Katlama toleransınız ne? Ön (2. kat) deliği 0,5 mm büyütelim mi?
- Slit lock ölçü standardınız (5 mm kesik yerine) ve minimum bıçak köşe radüsünüz?
- Ø20 void mühür etiketini kim tedarik edecek ve uygulayacak (elle/otomatik)? Konum toleransı ± kaç mm?
- Beyaz maket numunesi (bıçak testi) teslim süresi ve adedi?
- 245 × 239 mm açınımın 70×100 tabakaya kaç adet yerleştiği ve fire oranı?
- Gerçek içerik kalınlığı ~8 mm çıkarsa D’yi küçültelim mi, yoksa içerik oynamasın diye iç destek kartonu mu ekleyelim?

## 7. Dosyalar ve sınırlamalar

- `Candemsoft_QR-Kutu_Acinim_v1.pdf`: 1:1, PDF katmanları (OCG), Bıçak = Separation “Bicak” (%100 M alternatif), 0,25 pt, overprint. Taslak PDF, PDF/X değildir; Illustrator PDF katmanlarını açarken birleştirebilir.
- `Candemsoft_QR-Kutu_Acinim_v1.svg`: width/height mm, viewBox 1 birim = 1 mm; katmanlar `<g id>` + `data-name` (Illustrator’da katman adı). SVG’de spot renk/overprint yoktur, Bıçak ekranda #EC008C’dir. Illustrator’da spot renk olarak yeniden atanmalıdır.
- `Candemsoft_QR-Kutu_BeyazMaket_A3_v1.pdf`: A3, %100, 50 mm yatay + dikey kontrol çizgisi.
- `Candemsoft_QR-Kutu_3D_Onizleme.html`: katlama animasyonlu 3D önizleme.
- `kutu_acinim.py`: parametrik üreteç. G, D, Y, T, H, GL ve STACK en üstte; tek komutla tüm dosyalar ve bu rapor yeniden üretilir.
- Bilgi katmanındaki metinler font olarak durur (baskıya çıkmaz). Aşama 3’te outline edilecek.
