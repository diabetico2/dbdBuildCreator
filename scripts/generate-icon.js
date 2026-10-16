// Ícone geométrico original. Gera ICO de 64 px sem dependência gráfica.
import {mkdir,writeFile} from 'node:fs/promises';
const size=64,rowBytes=size*4,maskBytes=size*size/8;
const pixels=Buffer.alloc(rowBytes*size);
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 const slash=y>10&&y<54&&[12,27,42].some(start=>x>start+(54-y)*0.17&&x<start+6+(54-y)*0.17);
 const i=((size-1-y)*size+x)*4;
 pixels[i]=slash?76:20;pixels[i+1]=slash?65:17;pixels[i+2]=slash?188:16;pixels[i+3]=255;
}
const bmp=Buffer.alloc(40);bmp.writeUInt32LE(40,0);bmp.writeInt32LE(size,4);bmp.writeInt32LE(size*2,8);bmp.writeUInt16LE(1,12);bmp.writeUInt16LE(32,14);bmp.writeUInt32LE(pixels.length+maskBytes,20);
const header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header[6]=size;header[7]=size;header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(bmp.length+pixels.length+maskBytes,14);header.writeUInt32LE(22,18);
await mkdir(new URL('../src-tauri/icons/',import.meta.url),{recursive:true});
await writeFile(new URL('../src-tauri/icons/icon.ico',import.meta.url),Buffer.concat([header,bmp,pixels,Buffer.alloc(maskBytes)]));
