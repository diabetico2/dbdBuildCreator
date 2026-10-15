"""Parse downloaded wiki reference tables without executing remote HTML."""
import json
from html.parser import HTMLParser
from pathlib import Path

class Node:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []
    def text(self):
        if self.attrs.get('class','').find('iconLink') >= 0 or self.tag in ('script','style'):
            return ''
        return ' '.join(c if isinstance(c,str) else c.text() for c in self.children).strip()
    def find(self, tag=None, **attrs):
        result=[]
        for c in self.children:
            if isinstance(c,Node):
                if (not tag or c.tag==tag) and all(c.attrs.get(k)==v for k,v in attrs.items()): result.append(c)
                result.extend(c.find(tag,**attrs))
        return result

class Tree(HTMLParser):
    def __init__(self,s):
        super().__init__(); self.root=Node(); self.current=self.root; self.feed(s)
    def handle_starttag(self,tag,attrs):
        n=Node(tag,attrs,self.current); self.current.children.append(n)
        if tag not in ('img','input','br','hr','meta','link','source','wbr'): self.current=n
    def handle_endtag(self,tag):
        n=self.current
        while n.parent and n.tag!=tag:n=n.parent
        if n.parent:self.current=n.parent
    def handle_data(self,s):self.current.children.append(s)

root=Path(__file__).resolve().parents[2]/'.qa'
tree=Tree((root/'wiki-perks.html').read_text(encoding='utf8')).root
tables=tree.find('table')
table=next(t for t in tables if "A Nurse's Calling" in t.text() and 'Agitation' in t.text() and len(t.find('tr'))>100 and 'Ace in the Hole' not in t.text())
perks=[]
for tr in table.find('tr')[1:]:
    cells=[c for c in tr.children if isinstance(c,Node) and c.tag in ('th','td')]
    if len(cells)!=4:continue
    image=cells[0].find('img')[0]
    link=cells[1].find('a')[0]
    perks.append({'name':cells[1].text(),'source_url':'https://deadbydaylight.wiki.gg'+link.attrs['href'],'image_source':'https://deadbydaylight.wiki.gg'+image.attrs['src'],'effect':' '.join(cells[2].text().split()),'owner':' '.join(cells[3].text().split())})
(root/'wiki-perks.json').write_text(json.dumps(perks,ensure_ascii=False,indent=2),encoding='utf8')
kt=Tree((root/'wiki-killers.html').read_text(encoding='utf8')).root
portraits=[]
for d in kt.find('div'):
    if 'charPortraitWrapper' in d.attrs.get('class',''):
        a=d.find('a'); images=d.find('img')
        if a and images:portraits.append({'name':a[0].attrs.get('title'), 'url':'https://deadbydaylight.wiki.gg'+a[0].attrs.get('href',''),'image':'https://deadbydaylight.wiki.gg'+images[0].attrs.get('src','')})
(root/'wiki-roster.json').write_text(json.dumps(portraits,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'perks':len(perks),'owners':sorted(set(p['owner'] for p in perks)),'general':[p['name'] for p in perks if p['owner']=='General'],'killers':portraits},ensure_ascii=False))
