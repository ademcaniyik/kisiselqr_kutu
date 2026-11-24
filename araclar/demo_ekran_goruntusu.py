#!/usr/bin/env python3
"""
Kutudaki telefon ekranı: gerçek profil sayfasının mobil ekran görüntüsü → assets/tasarim1/vitrin_profil_ekran.jpg
Chrome'u DevTools Protokolü ile mobil emülasyonda (430 pt, 3x = 1290 px) açar, sayfayı VİTRİN içeriğiyle
doldurur, "Araç Sahibine Bildir" bölümünü genişletip ekranı çeker.

Vitrin: sayfanın kendisi (tasarım, CSS, butonlar) canlıdakiyle aynıdır; yalnız örnek içerik değişir.
  - isim örnek bir kişiyle değiştirilir; kısa bilgi satırı ve sosyal bağlantılar kaldırılır (sade araç profili)
  - telefon butonu kaldırılır: web sayfası phone_hidden=1 iken tam böyle görünür (kutunun vaadi).
    DİKKAT (9 Ekim): uygulamada bu ayar henüz yok, yeni profillerde numara varsayılan olarak görünür.
  - sosyal: yalnız WhatsApp ve Instagram kalır, iki büyük logo kutucuğu olarak (14 Kasım, Adem). Bu, canlı sayfanın
    satır görünümünden farklı bir vitrin düzenidir: küçük telefon çiziminde logolar seçilsin diye.
    (9 Ekim–14 Kasım arası sosyal bağlantılar yoktu ve WhatsApp, LinkedIn ile değiştiriliyordu.)
  - zoom: sayfa içeriği büyütülür, telefon ekranında her şey daha iri görünür (alt kısım kırpılır)
  - plaka (kutudaki araçla aynı) sayfanın kendi plaka bloğuyla isim altına eklenir

Gereksinim: Google Chrome, pip install websocket-client
Kullanım:   python araclar/demo_ekran_goruntusu.py [url]
            TELEFON="0500 123 45 67" OUT=assets/tasarim2/vitrin_profil_ekran_tel.jpg python araclar/demo_ekran_goruntusu.py
            (TELEFON verilirse plakanın altına sayfanın kendi "Telefon ile Ara" butonu örnek numarayla eklenir: Tasarım 2)
"""
import base64, json, os, subprocess, sys, tempfile, time, urllib.request
import websocket

URL = sys.argv[1] if len(sys.argv) > 1 else 'https://kisiselqr.com/qr/071qydlb'
# Tasarım 1 kendi ekranını kullanır (vitrin_profil_ekran.jpg). demo_profil_ekran.jpg, Tasarım 2–4'ün ortak
# telefonunda kalan önceki görüntüdür (7 Ekim); Adem'in isteğiyle 2–4'e dokunulmuyor (9 Ekim).
OUT = os.environ.get('OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'tasarim1', 'vitrin_profil_ekran.jpg')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
W, H, DPR, PORT = 430, 932, 3, 9333
CLICK = """(()=>{const c=[...document.querySelectorAll('button,a,[role=button],summary,div')]
  .filter(e=>/Araç Sahibine Bildir/.test(e.textContent)).sort((a,b)=>a.textContent.length-b.textContent.length);
  const el=c.find(e=>e.tagName==='BUTTON'||e.tagName==='SUMMARY'||e.getAttribute('role')==='button')||c[0];
  if(el) el.click(); return !!el})()"""

# Vitrin: ad + plaka + WhatsApp/Instagram + bildirim butonları (14 Kasım). Bilgi satırı gösterilmez.
VITRIN = {'isim': 'Ahmet Yılmaz', 'bilgi': '', 'plaka': '34 ABC 123',   # plaka: kutudaki araçla aynı
          'sosyal': ['whatsapp', 'instagram'], 'zoom': 1.3, 'telefon': os.environ.get('TELEFON', '')}
DOLDUR = """((V)=>{const q=s=>document.querySelector(s);
  const h=q('.profile-header h1'); if(h) h.textContent=V.isim;
  const im=q('.profile-photo'); if(im) im.alt=V.isim+' profil fotoğrafı';
  const b=q('.profile-header .bio'); if(b){ if(V.bilgi) b.textContent=V.bilgi; else b.remove(); }
  if(!V.sosyal || !V.sosyal.length) document.querySelectorAll('.social-media-list').forEach(e=>e.remove());
  else {
    const RENK={whatsapp:'#25D366',instagram:'#E1306C'}, AD={whatsapp:'WhatsApp',instagram:'Instagram'};
    const tur=a=>/wa\.me|whatsapp/i.test(a.href)?'whatsapp':(/instagram/i.test(a.href)?'instagram':'');
    document.querySelectorAll('a.social-list-btn').forEach(a=>{ if(!V.sosyal.includes(tur(a))) a.remove(); });
    document.querySelectorAll('.social-media-list').forEach(l=>{
      l.style.cssText+=';display:grid;grid-template-columns:1fr 1fr;gap:14px;';
      [...l.children].forEach(c=>{ if(!c.querySelector('a.social-list-btn') && !c.matches('a.social-list-btn')) c.remove(); });
    });
    document.querySelectorAll('a.social-list-btn').forEach(a=>{ const t=tur(a);
      a.style.cssText+=';order:'+(t==='whatsapp'?0:1)+';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 6px;margin:0;height:auto;min-height:0;max-height:none;overflow:visible;border:2px solid '+RENK[t]+';';
      const i=a.querySelector('i'); if(i){ i.className=t==='whatsapp'?'fab fa-whatsapp':'fab fa-instagram';
        i.style.cssText='font-size:86px;line-height:1;display:block;width:auto;height:auto;min-height:86px;margin:0;color:'+RENK[t]+';';
        if(i.parentElement!==a) i.parentElement.style.cssText='margin:0;width:auto;height:auto;font-size:86px;text-align:center;'; }
      const ti=a.querySelector('.btn-title'); if(ti){ ti.textContent=AD[t]; ti.style.cssText='font-size:21px;font-weight:700;margin:0;'; }
      a.querySelectorAll(':scope > *:not(i):not(.btn-title)').forEach(x=>{ if(!x.contains(i)&&!x.contains(ti)) x.style.display='none'; });
    });
  }
  if(V.zoom) document.body.style.zoom=V.zoom;
  // plaka: profile.php'nin kendi plaka bloğu (profilde plaka girilince isim altında bu işaretleme basılır)
  if(h && V.plaka && !q('.license-plate-wrapper')) h.insertAdjacentHTML('afterend',
    '<div class="license-plate-wrapper" style="display:flex;justify-content:center;margin:15px 0;">'+
    '<div class="license-plate" style="display:inline-flex;align-items:stretch;background:#fff;border:2px solid #000;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;height:50px;">'+
    '<div class="tr-section" style="background:#003399;width:35px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding-bottom:4px;border-radius:6px 0 0 6px;">'+
    '<span style="color:#fff;font-size:12px;font-weight:bold;">TR</span></div>'+
    '<div class="plate-text" style="padding:0 15px;display:flex;align-items:center;justify-content:center;font-family:\\'Segoe UI\\',Roboto,Helvetica,Arial,sans-serif;font-size:26px;font-weight:800;color:#000;letter-spacing:1px;">'+
    V.plaka.toUpperCase()+'</div></div></div>');
  document.querySelectorAll('.contact-info').forEach(e=>e.remove());
  // telefon: profile.php'nin kendi telefon butonu (phone_hidden kapalıyken plakanın altında böyle basılır)
  const pw=q('.license-plate-wrapper');
  if(V.telefon && pw) pw.insertAdjacentHTML('afterend',
    '<div class="contact-info" style="margin:0 !important;padding:0 !important;border:none !important;">'+
    '<div class="contact-buttons-row" style="margin:4px 0 !important;gap:6px !important;">'+
    '<a href="#" class="contact-btn phone-btn"><div class="btn-icon"><i class="fas fa-phone"></i></div>'+
    '<div class="btn-content"><span class="btn-title">Telefon ile Ara</span><span class="btn-subtitle">'+V.telefon+'</span></div>'+
    '<div class="btn-arrow"><i class="fas fa-chevron-right"></i></div></a></div></div>');
  return !!h})(%s)""" % json.dumps(VITRIN, ensure_ascii=False)

prof = tempfile.mkdtemp()
p = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--remote-debugging-port={PORT}',
                      f'--remote-allow-origins=http://127.0.0.1:{PORT}', f'--user-data-dir={prof}', 'about:blank'],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(60):
        try:
            tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json')); break
        except Exception:
            time.sleep(0.2)
    tab = [t for t in tabs if t.get('type') == 'page'][0]
    ws = websocket.create_connection(tab['webSocketDebuggerUrl'], timeout=30, suppress_origin=True)
    n = [0]
    def cmd(m, **pr):
        n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': m, 'params': pr}))
        while True:
            r = json.loads(ws.recv())
            if r.get('id') == n[0]: return r.get('result', r)
    cmd('Emulation.setDeviceMetricsOverride', width=W, height=H, deviceScaleFactor=DPR, mobile=True, screenWidth=W, screenHeight=H)
    cmd('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=5)
    cmd('Emulation.setUserAgentOverride', userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) '
        'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
    cmd('Page.enable'); cmd('Page.navigate', url=URL); time.sleep(6)
    print('vitrin içeriği:', cmd('Runtime.evaluate', expression=DOLDUR, returnByValue=True)['result'].get('value'))
    print('bildir paneli açıldı:', cmd('Runtime.evaluate', expression=CLICK, returnByValue=True)['result'].get('value'))
    time.sleep(2)
    shot = cmd('Page.captureScreenshot', format='jpeg', quality=86)
    open(OUT, 'wb').write(base64.b64decode(shot['data']))
    print('kaydedildi:', os.path.abspath(OUT))
finally:
    p.terminate()
