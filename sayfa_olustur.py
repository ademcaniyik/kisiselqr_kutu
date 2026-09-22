#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""kutu_acinim.py çıktılarından 3D önizleme HTML'ini üretir.
Kullanım: python sayfa_olustur.py [out_klasörü]"""
import json, os, re, sys, base64, html

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out')
geo = json.load(open(os.path.join(OUT, 'kutu_geometri.json'), encoding='utf-8'))
v = geo['version']
md = open(os.path.join(OUT, f'Candemsoft_QR-Kutu_Olcu_Raporu_{v}.md'), encoding='utf-8').read()
svg = open(os.path.join(OUT, f'Candemsoft_QR-Kutu_Acinim_{v}.svg'), 'rb').read()


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'`(.+?)`', r'<code>\1</code>', s)
    return s


def md2html(text):
    out, lines, i = [], text.splitlines(), 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1; continue
        if ln.startswith('#'):
            n = len(ln) - len(ln.lstrip('#'))
            out.append(f'<h{n}>{inline(ln[n:].strip())}</h{n}>'); i += 1; continue
        if ln.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')]); i += 1
            head, body = rows[0], [r for r in rows[2:]]
            t = '<div class="tbl"><table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in head) + '</tr></thead><tbody>'
            t += ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>' for r in body)
            out.append(t + '</tbody></table></div>'); continue
        if ln.lstrip().startswith('- '):
            items = []
            while i < len(lines) and lines[i].lstrip().startswith('- '):
                if lines[i].startswith('  ') and items:
                    items[-1] += f'<ul><li>{inline(lines[i].strip()[2:])}</li></ul>'
                else:
                    items.append(inline(lines[i].strip()[2:]))
                i += 1
            out.append('<ul>' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'); continue
        para = []
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(('#', '|', '- ')):
            para.append(lines[i].strip()); i += 1
        out.append(f'<p>{inline(" ".join(para))}</p>')
    return '\n'.join(out)


def fmt(x):
    return f'{x:.2f}'.rstrip('0').rstrip('.').replace('.', ',')

tpl = open(os.path.join(HERE, 'sablon_3d.html'), encoding='utf-8').read()
g = dict(geo); g.pop('bleed', None)
rep = {
    '__VERSION__': v,
    '__INNER__': ' × '.join(fmt(x) for x in geo['inner']),
    '__FLAT__': f'{fmt(geo["W"])} × {fmt(geo["H"])}',
    '__BLEED__': f'{fmt(geo["bleed"][0])} × {fmt(geo["bleed"][1])}',
    '__T__': fmt(geo['T']),
    '__CARRIER__': f'{fmt(geo["carrier"][0])}×{fmt(geo["carrier"][1])}',
    '__STACK__': fmt(geo['stack']),
    '__SVG_SRC__': 'data:image/svg+xml;base64,' + base64.b64encode(svg).decode(),
    '__REPORT__': md2html(md),
    '__GEO__': json.dumps(g, ensure_ascii=False, separators=(',', ':')),
}
page = tpl
for k, val in rep.items():
    page = page.replace(k, val)
open(os.path.join(OUT, 'Candemsoft_QR-Kutu_3D_Onizleme.html'), 'w', encoding='utf-8').write(
    '<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n' + page.replace('<div class="wrap">', '</head>\n<body>\n<div class="wrap">', 1) + '\n</body>\n</html>\n')
open(os.path.join(OUT, 'artifact_3d.html'), 'w', encoding='utf-8').write(page)
print('ok', len(page))
