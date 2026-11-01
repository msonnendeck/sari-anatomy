export function expandMask(raster,bounds,width,height) {
  const {left,top,right,bottom}=bounds;
  const maskWidth=right-left,maskHeight=bottom-top;
  if (![left,top,right,bottom].every(Number.isInteger) || left<0 || top<0 || right>width || bottom>height || maskWidth<1 || maskHeight<1 || raster.length!==maskWidth*maskHeight) throw new Error('Invalid SAM mask bounds');
  const fullMask=new Uint8Array(width*height);
  for(let y=0;y<maskHeight;y++)for(let x=0;x<maskWidth;x++)fullMask[left+x+(top+y)*width]=raster[x+y*maskWidth]?1:0;
  return fullMask;
}
