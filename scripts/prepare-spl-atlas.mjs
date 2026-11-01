import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { gunzipSync, gzipSync, deflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import * as nifti from "nifti-reader-js";
const source = process.argv[2];
if (!source) throw new Error("Provide the downloaded pinned SPL atlas directory");
const output = "public/data/spl-atlas";
mkdirSync(output, { recursive: true });
// This preparation script explicitly handles this atlas's signed-permutation LPS grid.
function read(name) {
  const b = readFileSync(`${source}/${name}`), split = b.indexOf(Buffer.from("\n\n"));
  const h = b.subarray(0, split).toString();
  if (!h.includes("space: left-posterior-superior") || !h.includes("encoding: gzip")) throw new Error("Unexpected source encoding");
  const dims = h.match(/sizes: (.*)/)[1].trim().split(/\s+/).map(Number);
  const origin = h.match(/space origin: \(([^)]+)\)/)[1].split(",").map(Number);
  const sp = Math.abs(Number(h.match(/space directions: \([^,]+,([^,]+),/)[1]));
  const raw = gunzipSync(b.subarray(split + 2)), float = h.includes("type: float");
  const outDims = [dims[2], dims[0], dims[1]], values = new Float32Array(outDims.reduce((a,b)=>a*b,1));
  if (raw.length !== values.length * (float ? 4 : 2)) throw new Error("Unexpected payload size");
  for (let z=0; z<outDims[2]; z++) for(let y=0; y<outDims[1]; y++) for(let x=0; x<outDims[0]; x++) {
    const i=(dims[0]-1-y)+dims[0]*((dims[1]-1-z)+dims[1]*(dims[2]-1-x));
    values[x+outDims[0]*(y+outDims[1]*z)] = float ? raw.readFloatLE(i*4) : raw.readInt16LE(i*2);
  }
  return {dims:outDims, sp, origin:[-origin[0]-(dims[2]-1)*sp,-origin[1]-(dims[0]-1)*sp,origin[2]-(dims[1]-1)*sp],values};
}
const image = read("A1_grayT1.nrrd"), label = read("hncma-atlas.nrrd");
const n = image.values.length, intensity = new Uint8Array(n), labels = new Uint16Array(n);
let max=0; for(const v of image.values) if(Number.isFinite(v)) max=Math.max(max,v);
const counts={}, sums={};
for(let z=0;z<image.dims[2];z++) for(let y=0;y<image.dims[1];y++) for(let x=0;x<image.dims[0];x++) {
  const i=x+image.dims[0]*(y+image.dims[1]*z);
  intensity[i]=Math.round(Math.max(0,image.values[i])/max*255);
  const q=[x,y,z].map((v,a)=>Math.round((image.origin[a]+v*image.sp-label.origin[a])/label.sp));
  const value=q.every((v,a)=>v>=0&&v<label.dims[a]) ? label.values[q[0]+label.dims[0]*(q[1]+label.dims[1]*q[2])] : 0;
  labels[i]=value;
  if(value){ counts[value]=(counts[value]||0)+1; const sum=sums[value] ||= [0,0,0]; sum[0]+=x;sum[1]+=y;sum[2]+=z; }
}
const h = new nifti.NIFTI1();
Object.assign(h,{littleEndian:true,dims:[3,...image.dims,1,1,1,1],pixDims:[1,image.sp,image.sp,image.sp,1,1,1,1],datatypeCode:2,numBitsPerVoxel:8,vox_offset:352,magic:"n+1",scl_slope:1,sform_code:1,xyzt_units:2,affine:[[image.sp,0,0,image.origin[0]],[0,image.sp,0,image.origin[1]],[0,0,image.sp,image.origin[2]],[0,0,0,1]],description:"SPL/NAC atlas; source .75mm grid; RAS permutation; uint8 display derivative"});
const nii=new Uint8Array(352+n);nii.set(new Uint8Array(h.toArrayBuffer()));nii.set(intensity,352);
writeFileSync(`${output}/t1.nii.gz`,gzipSync(nii));
// A genuine axial MRI preview; no generated medical illustration.
function pngChunk(type, data) {
  const typeBytes=Buffer.from(type), content=Buffer.concat([typeBytes,data]);let crc=0xffffffff;
  for(const byte of content){crc^=byte;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  const size=Buffer.alloc(4),checksum=Buffer.alloc(4);size.writeUInt32BE(data.length);checksum.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([size,content,checksum]);
}
const width=image.dims[0],height=image.dims[1],pixels=Buffer.alloc((width+1)*height), previewZ=160;
for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels[y*(width+1)+1+x]=Math.min(255,Math.round(intensity[x+width*((height-1-y)+height*previewZ)]*255/100));
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;
writeFileSync(`${output}/preview.png`,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk("IHDR",ihdr),pngChunk("IDAT",deflateSync(pixels)),pngChunk("IEND",Buffer.alloc(0))]));

const labelBytes=Buffer.alloc(n*2);for(let i=0;i<n;i++)labelBytes.writeUInt16LE(labels[i],i*2);
writeFileSync(`${output}/labels.u16.gz`,gzipSync(labelBytes));
const table={};
for(const line of readFileSync(`${source}/hncma-atlas-lut.ctbl`,"utf8").split(/\r?\n/)) {
  const parts=line.trim().split(/\s+/);if(!/^\d+$/.test(parts[0]))continue;
  const [id,name,...rgba]=parts;table[id]={id:Number(id),name:name.replaceAll("_"," "),color:rgba.slice(0,3).map(Number)};
}
const positions=[],indices=[],regions=[],hashes={};
const center=image.origin.map((v,a)=>v+image.dims[a]*image.sp/2), scale=3/Math.max(...image.dims.map(v=>v*image.sp));
for(const file of readdirSync(source).filter(n=>n.endsWith(".vtk")).sort()) {
  const id=Number(file.match(/^Model_(\d+)_/)[1]); if(!table[id])continue;
  const b=readFileSync(`${source}/${file}`), p=b.indexOf(Buffer.from("POINTS ")), lineEnd=b.indexOf(10,p), pointCount=Number(b.subarray(p,lineEnd).toString().split(" ")[1]), start=lineEnd+1;
  const positionBase=positions.length/3;
  for(let i=0;i<pointCount;i++) {
    const x=b.readFloatBE(start+i*12),y=b.readFloatBE(start+i*12+4),z=b.readFloatBE(start+i*12+8);
    positions.push((x-center[0])*scale,(z-center[2])*scale,-(y-center[1])*scale);
  }
  const strip=b.indexOf(Buffer.from("TRIANGLE_STRIPS "),start+pointCount*12);
  const poly=strip>=0 ? strip : b.indexOf(Buffer.from("POLYGONS "),start+pointCount*12);
  if(poly<0)throw new Error("No polygon cells in source");
  const end=b.indexOf(10,poly), faceCount=Number(b.subarray(poly,end).toString().split(" ")[1]);
  let offset=end+1;const indexStart=indices.length;
  for(let i=0;i<faceCount;i++) {
    const count=b.readInt32BE(offset);offset+=4;const face=[];
    for(let j=0;j<count;j++){const vertex=b.readInt32BE(offset);offset+=4;if(vertex<0||vertex>=pointCount)throw new Error("Bad source index");face.push(vertex+positionBase);}
    if(strip>=0) { for(let j=0;j<count-2;j++) { const tri=j%2 ? [face[j+1],face[j],face[j+2]] : [face[j],face[j+1],face[j+2]]; if(new Set(tri).size===3)indices.push(...tri); } }
    else for(let j=1;j<count-1;j++)indices.push(face[0],face[j],face[j+1]);
  }
  const count=counts[id]||0;
  regions.push({...table[id],indexStart,indexCount:indices.length-indexStart,source:file,voxelCount:count,centroid:count?sums[id].map(v=>Math.round(v/count)):null,group:id>=1000&&id<3000?"Cortex":[4,43,15,24].includes(id)?"Ventricles":[2,41].includes(id)?"White matter":[7,46].includes(id)?"Cerebellum":"Deep structures"});
  hashes[file]=createHash("sha256").update(b).digest("hex");
}
const model=Buffer.alloc(8+positions.length*4+indices.length*4);model.writeUInt32LE(positions.length,0);model.writeUInt32LE(indices.length,4);
positions.forEach((v,i)=>model.writeFloatLE(v,8+i*4));indices.forEach((v,i)=>model.writeUInt32LE(v,8+positions.length*4+i*4));
writeFileSync(`${output}/surfaces.bin.gz`,gzipSync(model));
writeFileSync(`${output}/atlas.json`,JSON.stringify({sourceCommit:"bec24db25aad5f7600e2df3becfb1f883e61ff56",dims:image.dims,spacing:image.sp,origin:image.origin,regions,table},null,2));
for(const file of ["A1_grayT1.nrrd","hncma-atlas.nrrd","hncma-atlas-lut.ctbl"]) hashes[file]=createHash("sha256").update(readFileSync(`${source}/${file}`)).digest("hex");
writeFileSync(`${output}/source-checksums.json`,JSON.stringify(hashes,null,2));
console.log({dims:image.dims,origin:image.origin,maximumIntensity:max,regions:regions.length,triangles:indices.length/3});
