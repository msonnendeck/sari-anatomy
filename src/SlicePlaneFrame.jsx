import React,{useMemo} from 'react';
import * as THREE from 'three';
import {cutNormal} from './navigation.mjs';
// Build in the same normalized coordinates as the volume clipping equation,
// then apply voxel spacing so oblique frames stay aligned on anisotropic scans.
export default function SlicePlaneFrame({volume,spatial}){
 const geometry=useMemo(()=>{
  const n=new THREE.Vector3(...cutNormal(spatial));
  const helper=Math.abs(n.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
  const u=new THREE.Vector3().crossVectors(helper,n).normalize(),v=new THREE.Vector3().crossVectors(n,u).normalize();
  const corners=[];for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5])corners.push(new THREE.Vector3(x,y,z));
  const halfU=Math.max(...corners.map(p=>Math.abs(p.dot(u))))+.015,halfV=Math.max(...corners.map(p=>Math.abs(p.dot(v))))+.015;
  const center=n.clone().multiplyScalar(spatial.offset),extent=volume.dims.map((d,i)=>d*volume.spacing[i]),max=Math.max(...extent),scale=new THREE.Vector3(extent[0]/max*3,extent[2]/max*3,extent[1]/max*3);
  const points=[[-1,-1],[1,-1],[1,1],[-1,1]].flatMap(([a,b])=>center.clone().addScaledVector(u,a*halfU).addScaledVector(v,b*halfV).multiply(scale).toArray());
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);return g;
 },[volume,spatial.pitch,spatial.yaw,spatial.offset]);
 React.useEffect(()=>()=>geometry.dispose(),[geometry]);
 if(!spatial.cut||!spatial.planeFrame||!['solid','volume','atlas'].includes(spatial.mode))return null;
 return <mesh geometry={geometry} renderOrder={20} raycast={()=>null}>
  <shaderMaterial transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false}
   vertexShader={'varying vec2 frameUv; void main(){frameUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}' }
   fragmentShader={'varying vec2 frameUv; void main(){vec2 e=min(frameUv,1.-frameUv);float d=min(e.x,e.y);if(d>.055)discard;float edge=1.-smoothstep(.001,.003,d);float glow=exp(-d*95.)*.14;gl_FragColor=vec4(.39,.77,.88,edge*.65+glow);}'}/>
 </mesh>;
}
