"""Restaura imagens a partir das fontes fixadas no manifesto. Requer Pillow==12.3.0."""
import hashlib, io, json, urllib.request
from pathlib import Path
import PIL
from PIL import Image

if PIL.__version__!='12.3.0': raise RuntimeError('Use Pillow==12.3.0 para reproduzir os arquivos.')
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'src/asset-manifest.json').read_text(encoding='utf-8'))
for asset in manifest['assets']:
    destination=(root/'public'/asset['path']).resolve()
    if not destination.is_relative_to((root/'public/catalog').resolve()): raise ValueError('Caminho inválido')
    if destination.exists() and hashlib.sha256(destination.read_bytes()).hexdigest()==asset['sha256']: continue
    request=urllib.request.Request(asset['source_url'],headers={'User-Agent':'DBD-Build-Companion/0.3'})
    with urllib.request.urlopen(request,timeout=30) as response: data=response.read(20_000_001)
    if len(data)>20_000_000: raise ValueError('Fonte acima de 20 MB')
    image=Image.open(io.BytesIO(data)).convert('RGBA')
    image.thumbnail((320,440) if asset['kind']=='portrait' else (192,192),Image.Resampling.LANCZOS)
    buffer=io.BytesIO();image.save(buffer,format='WEBP',quality=85,method=6);result=buffer.getvalue()
    if hashlib.sha256(result).hexdigest()!=asset['sha256']: raise ValueError(f"Fonte ou conversão mudou: {asset['id']}; revise antes de atualizar o manifesto.")
    destination.parent.mkdir(parents=True,exist_ok=True)
    temporary=destination.with_suffix('.tmp');temporary.write_bytes(result);temporary.replace(destination)
    print(asset['id'])
print('Imagens conferidas e restauradas.')
