"""Optional asset regeneration: Python fontTools + DejaVu / URW Base35 fonts.
Versioned outlines are used by npm builds; Python is not a build dependency.
Run from the repository root: python scripts/generate-showroom-outlines.py
"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from pathlib import Path
import json
fonts={'bold':'/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','narrow':'/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Regular.otf'}
texts={'zy':('ZY','bold'),'reklam':('REKLAM','bold'),'lower':('DAHA İLERİYE','narrow'),'title':('ZY REKLAM','bold'),'idea':('FİKİR','bold'),'design':('TASARIM','bold'),'production':('ÜRETİM','bold'),'development':('GELİŞTİRME','bold')};data={}
for key,(text,font) in texts.items():
 f=TTFont(fonts[font]);g=f.getGlyphSet();cmap=f.getBestCmap();s=100/f['head'].unitsPerEm;x=0;paths=[]
 for c in text:
  name=cmap[ord(c)];p=SVGPathPen(g);g[name].draw(TransformPen(p,(s,0,0,-s,x,95)));paths.append(p.getCommands());x+=f['hmtx'][name][0]*s+(3 if font=='narrow' else 1)
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x:.3f} 120"><path fill="#ffffff" d="'+''.join(paths)+'"/></svg>'
 data[key]={'svg':svg,'width':x,'height':120,'text':text,'font':font}
Path(__file__).resolve().parents[1].joinpath('public/assets/showroom/letter-outlines.json').write_text(json.dumps(data,ensure_ascii=False))
Path(__file__).resolve().parents[1].joinpath('public/assets/showroom/FONT_NOTICES.txt').write_text(Path('/usr/share/doc/fonts-dejavu-core/copyright').read_text()+'\n'+Path('/usr/share/doc/fonts-urw-base35/copyright').read_text())
