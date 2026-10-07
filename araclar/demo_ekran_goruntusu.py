#!/usr/bin/env python3
"""
Kutudaki telefon ekranı: gerçek profil sayfasının mobil ekran görüntüsü → assets/tasarim1/demo_profil_ekran.jpg
Chrome'u DevTools Protokolü ile mobil emülasyonda (430 pt, 3x = 1290 px) açar, sayfayı VİTRİN içeriğiyle
doldurur, "Araç Sahibine Bildir" bölümünü genişletip ekranı çeker.

Vitrin: sayfanın kendisi (tasarım, CSS, butonlar) canlıdakiyle aynıdır; yalnız örnek içerik değişir.
  - isim ve kısa bilgi örnek bir kişiyle değiştirilir
  - telefon butonu kaldırılır: profilde "numarayı gizle" açıkken sayfa tam böyle görünür (kutunun vaadi)
  - WhatsApp bağlantısı numarayı açık ettiği için LinkedIn ile değiştirilir
  - plaka (kutudaki araçla aynı) sayfanın kendi plaka bloğuyla isim altına eklenir

Gereksinim: Google Chrome, pip install websocket-client
Kullanım:   python araclar/demo_ekran_goruntusu.py [url]
"""
import base64, json, os, subprocess, sys, tempfile, time, urllib.request
import websocket

URL = sys.argv[1] if len(sys.argv) > 1 else 'https://kisiselqr.com/qr/071qydlb'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'tasarim1', 'demo_profil_ekran.jpg')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
W, H, DPR, PORT = 430, 932, 3, 9333
CLICK = """(()=>{const c=[...document.querySelectorAll('button,a,[role=button],summary,div')]
  .filter(e=>/Araç Sahibine Bildir/.test(e.textContent)).sort((a,b)=>a.textContent.length-b.textContent.length);
  const el=c.find(e=>e.tagName==='BUTTON'||e.tagName==='SUMMARY'||e.getAttribute('role')==='button')||c[0];
  if(el) el.click(); return !!el})()"""

VITRIN = {'isim': 'Ahmet Yılmaz', 'bilgi': 'Mimar · İstanbul', 'plaka': '34 ABC 123'}   # plaka: kutudaki araçla aynı
DOLDUR = """((V)=>{const q=s=>document.querySelector(s);
  const h=q('.profile-header h1'); if(h) h.textContent=V.isim;
  const im=q('.profile-photo'); if(im) im.alt=V.isim+' profil fotoğrafı';
  const b=q('.profile-header .bio'); if(b) b.textContent=V.bilgi;
  // plaka: profile.php'nin kendi plaka bloğu (profilde plaka girilince isim altında bu işaretleme basılır)
  if(h && V.plaka && !q('.license-plate-wrapper')) h.insertAdjacentHTML('afterend',
    '<div class="license-plate-wrapper" style="display:flex;justify-content:center;margin:15px 0;">'+
    '<div class="license-plate" style="display:inline-flex;align-items:stretch;background:#fff;border:2px solid #000;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;height:50px;">'+
    '<div class="tr-section" style="background:#003399;width:35px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding-bottom:4px;border-radius:6px 0 0 6px;">'+
    '<span style="color:#fff;font-size:12px;font-weight:bold;">TR</span></div>'+
    '<div class="plate-text" style="padding:0 15px;display:flex;align-items:center;justify-content:center;font-family:\\'Segoe UI\\',Roboto,Helvetica,Arial,sans-serif;font-size:26px;font-weight:800;color:#000;letter-spacing:1px;">'+
    V.plaka.toUpperCase()+'</div></div></div>');
  document.querySelectorAll('.contact-info').forEach(e=>e.remove());
  document.querySelectorAll('a.social-list-btn').forEach(a=>{ if(/wa\\.me|whatsapp/i.test(a.href)){
    a.href='https://www.linkedin.com/'; const i=a.querySelector('i'); if(i) i.className='fab fa-linkedin';
    const t=a.querySelector('.btn-title'); if(t) t.textContent='LinkedIn'; }});
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
