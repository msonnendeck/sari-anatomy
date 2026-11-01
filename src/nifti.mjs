import * as nifti from 'nifti-reader-js';
export async function readVolume(file){
 if(file.size>80*1024*1024)throw new Error('Choose a volume smaller than 80 MB.');
 let buf=await file.arrayBuffer();if(nifti.isCompressed(buf))buf=nifti.decompress(buf);
 if(buf.byteLength>300*1024*1024)throw new Error('Expanded volume exceeds 300 MB.');
 if(!nifti.isNIFTI(buf))throw new Error('This is not a supported NIfTI volume. Choose .nii or .nii.gz.');
 const h=nifti.readHeader(buf),dims=h.dims.slice(1,4),n=dims.reduce((a,b)=>a*b,1);
 if(dims.some(d=>!Number.isInteger(d)||d<2||d>512)||n>40e6)throw new Error('Use a 3D volume with dimensions between 2 and 512 (under 40 million voxels).');
 if(h.dims[0]>3&&h.dims.slice(4,h.dims[0]+1).some(d=>d>1))throw new Error('Use a single 3D volume, not a time series.');
 const raw=nifti.readImage(h,buf),dv=new DataView(raw),types={2:['getUint8',1],4:['getInt16',2],8:['getInt32',4],16:['getFloat32',4],64:['getFloat64',8],256:['getInt8',1],512:['getUint16',2],768:['getUint32',4]},type=types[h.datatypeCode];
 if(!type)throw new Error('Unsupported voxel datatype. Use integer or floating-point scalar data.');
 if(raw.byteLength<n*type[1])throw new Error('The image data is incomplete.');
 const values=new Float32Array(n);let min=Infinity,max=-Infinity;
 for(let i=0;i<n;i++){let val=dv[type[0]](i*type[1],h.littleEndian);val=val*(h.scl_slope||1)+(h.scl_inter||0);if(!Number.isFinite(val))val=0;values[i]=val;min=Math.min(min,val);max=Math.max(max,val);}
 const binaryMask=Uint8Array.from(values,v=>v!==0?1:0);
 const data=new Uint8Array(n);for(let i=0;i<n;i++)data[i]=Math.max(0,Math.min(255,(values[i]-min)/(max-min||1)*255));
 return {id:`local-${Date.now()}`,name:file.name.replace(/\.nii(\.gz)?$/i,''),series:'Local NIfTI · voxel coordinates',dims,spacing:h.pixDims.slice(1,4).map(x=>Math.abs(x)||1),affine:h.affine,units:h.xyzt_units,data,reference:new Uint8Array(n),proposal:new Uint8Array(n),synthetic:false,binaryMask,orientation:'Native voxel axes · not reoriented',source:'Local file · remains in this browser',revision:0};
}
