"""Generate showroom vector lettering from the approved wordmark and matching glyphs.
Optional tool: Python fontTools. npm builds use the versioned JSON, not Python.
The source brand SVG and existing hero are never rewritten.
"""
from pathlib import Path
from xml.etree import ElementTree as ET
from fontTools.svgLib.path import parse_path
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import json
root = Path(__file__).resolve().parents[1]
source = ET.parse(root / 'public/assets/brand/zy-reklam-wordmark.svg').getroot()
paths = source.findall('{http://www.w3.org/2000/svg}path')
glyphs = {}
for letter, path in zip('ZYREKLAM', paths):
    bounds = BoundsPen(None); parse_path(path.attrib['d'], bounds)
    x0, y0, x1, y1 = bounds.bounds
    scale = 100 / (y1-y0)
    pen = SVGPathPen(None)
    parse_path(path.attrib['d'], TransformPen(pen, (scale,0,0,scale,-x0*scale,-y0*scale)))
    glyphs[letter] = (pen.getCommands(), (x1-x0)*scale)
# Additional original glyphs follow the logo's rounded corners and 18-unit metal strokes.
custom = {
'D': ('M0 0H43Q78 0 78 35V65Q78 100 43 100H0Z M18 18V82H42Q60 82 60 64V36Q60 18 42 18Z',78),
'H': ('M0 0H18V41H59V0H77V100H59V59H18V100H0Z',77),
'I': ('M0 0H18V100H0Z',18),
'F': ('M0 100V26Q0 0 26 0H77V18H28Q18 18 18 28V41H70V59H18V100Z',77),
'G': ('M78 0V18H28Q18 18 18 28V72Q18 82 28 82H60V60H43V42H78V100H26Q0 100 0 74V26Q0 0 26 0Z',78),
'S': ('M77 0V18H27Q18 18 18 27Q18 36 27 36H51Q78 36 78 63V73Q78 100 51 100H0V82H50Q60 82 60 72V64Q60 54 50 54H27Q0 54 0 27Q0 0 27 0Z',78),
'T': ('M0 0H80V18H49V100H31V18H0Z',80),
'U': ('M0 0H18V70Q18 82 30 82H48Q60 82 60 70V0H78V72Q78 100 50 100H28Q0 100 0 72Z',78),
}
glyphs.update(custom)
glyphs['İ']=(glyphs['I'][0]+' M0 -24H18V-7H0Z',18)
glyphs['Ü']=(glyphs['U'][0]+' M13 -24H30V-7H13Z M48 -24H65V-7H48Z',78)
glyphs['Ş']=(glyphs['S'][0]+' M32 105H47L43 120H24V111H34Z',78)
texts={'zy':'ZY','reklam':'REKLAM','lower':'DAHA İLERİYE','title':'ZY REKLAM','idea':'FİKİR','design':'TASARIM','production':'ÜRETİM','development':'GELİŞTİRME'}
data={}
for key,text in texts.items():
    x=0; glyph_records=[]; chunks=[]
    for char in text:
        if char==' ': x+=30; continue
        path,width=glyphs[char]; pen=SVGPathPen(None)
        parse_path(path,TransformPen(pen,(1,0,0,1,x,24)))
        d=pen.getCommands(); chunks.append(f'<path fill-rule="evenodd" fill="#fff" d="{d}"/>')
        glyph_records.append({'char':char,'x':x,'width':width,'path':d})
        x+=width+7
    data[key]={'svg':f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x} 144">'+''.join(chunks)+'</svg>','width':x,'height':144,'capHeight':100,'text':text,'font':'approved-wordmark-geometric'}
(root/'public/assets/showroom/letter-outlines.json').write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
