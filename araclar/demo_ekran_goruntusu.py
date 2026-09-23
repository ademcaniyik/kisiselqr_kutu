#!/usr/bin/env python3
"""
Demo profilin gerçek mobil ekran görüntüsünü alır → assets/tasarim1/demo_profil_ekran.jpg
Chrome'u DevTools Protokolü ile mobil emülasyonda (430 pt, 3x = 1290 px) açar,
"Araç Sahibine Bildir" bölümünü genişletip ekranı çeker.

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
    print('bildir paneli açıldı:', cmd('Runtime.evaluate', expression=CLICK, returnByValue=True)['result'].get('value'))
    time.sleep(2)
    shot = cmd('Page.captureScreenshot', format='jpeg', quality=86)
    open(OUT, 'wb').write(base64.b64decode(shot['data']))
    print('kaydedildi:', os.path.abspath(OUT))
finally:
    p.terminate()
