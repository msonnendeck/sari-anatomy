import {slicePoint,planeOffset} from './navigation.mjs';
// Saving visual provenance must never silently discard a reviewed question.
export function questionViews(capture,volume,axis,spatial,media){
 let questionSnapshotId=null,imageSnapshotId=null;
 try{
  questionSnapshotId=capture();
  if(media)imageSnapshotId=capture({position:{sagittal:media.anchor[0],coronal:media.anchor[1],axial:media.anchor[2]},point:slicePoint(volume,axis,media.anchor),spatial:{...spatial,offset:planeOffset(volume,media.anchor,spatial)}});
  return {questionSnapshotId,imageSnapshotId,error:null};
 }catch(error){return {questionSnapshotId,imageSnapshotId,error};}
}
