#!/usr/bin/env python3
"""assets/tasarim1/qr_kodlar.js dosyasını üretir.  pip install qrcode
Kullanım: python araclar/qr_uret.py [uygulama_url] [demo_url]"""
import json, os, sys
import qrcode

APP = sys.argv[1] if len(sys.argv) > 1 else 'https://mobile.kisiselqr.com'
DEMO = sys.argv[2] if len(sys.argv) > 2 else 'https://kisiselqr.com/qr/071qydlb'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'tasarim1', 'qr_kodlar.js')

def matris(url):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    q.add_data(url); q.make(fit=True)
    return {'url': url, 'rows': [''.join('1' if c else '0' for c in r) for r in q.get_matrix()]}

open(OUT, 'w').write(
    '/* Otomatik üretildi (python qrcode, ECC M) – elle düzenlemeyin.\n'
    ' * KQR_QR_APP : arka yüz "Uygulamayı indir" QR\'ı\n'
    ' * KQR_QR_DEMO: sticker illüstrasyonlarındaki QR (demo profil) */\n'
    'window.KQR_QR_APP = %s;\nwindow.KQR_QR_DEMO = %s;\n' % (json.dumps(matris(APP)), json.dumps(matris(DEMO))))
print('yazıldı:', os.path.abspath(OUT))
