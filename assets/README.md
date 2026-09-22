# Kişisel QR Kutu 3D Tasarım Görsel Rehberi

Bu klasör, 3D kutu modeline giydirilecek yüzey görsellerini barındırır.
Her tasarım için 6 ana yüzey ve başlık görsellerini aşağıdaki formatta ekleyebilirsiniz:

## Yüzey Boyutları ve Dosya Adları (1:1 mm Oranları)

| Dosya Adı | Yüzey | Boyut (mm) | Önerilen Çözünürlük (300 DPI / PX) |
|---|---|---|---|
| `front.jpg` | Ön Yüz | 96,5 × 136,5 mm | 1140 × 1612 px |
| `back.jpg` | Arka Yüz | 96,5 × 136,5 mm | 1140 × 1612 px |
| `left.jpg` | Sol Yan | 18,5 × 136,5 mm | 218 × 1612 px |
| `right.jpg` | Sağ Yan | 18,5 × 136,5 mm | 218 × 1612 px |
| `top.jpg` | Üst Kapak | 96,5 × 18,5 mm | 1140 × 218 px |
| `bottom.jpg` | Alt Kapak | 96,5 × 18,5 mm | 1140 × 218 px |
| `header_front.jpg` | Euro Başlık (Ön) | 95,5 × 34,0 mm | 1128 × 402 px |
| `header_back.jpg` | Euro Başlık (Arka) | 96,5 × 35,0 mm | 1140 × 413 px |

## Klasör Yapısı
```text
assets/
  ├── tasarim1/
  │   ├── front.jpg
  │   ├── back.jpg
  │   ├── left.jpg
  │   ├── right.jpg
  │   ├── top.jpg
  │   └── bottom.jpg
  ├── tasarim2/
  └── tasarim3/
```

> **İpucu:** Görseller bulunamadığında veya doğrudan web arayüzünden test edilmek istendiğinde, sistemde yerleşik olarak bulunan yüksek çözünürlüklü dinamik Canvas şablonları veya arayüzdeki "Görsel Yükle" paneli otomatik olarak devreye girer.
