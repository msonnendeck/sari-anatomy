import React, { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function texture(data, dims, linear = true) {
  const t = new THREE.Data3DTexture(data, ...dims);
  t.format = THREE.RedFormat;
  t.type = THREE.UnsignedByteType;
  t.minFilter = t.magFilter = linear ? THREE.LinearFilter : THREE.NearestFilter;
  t.unpackAlignment = 1;
  t.needsUpdate = true;
  return t;
}

export default function SolidVolume({ volume, spatial, revision, displaySettings }) {
  const mesh = useRef();
  const image = useMemo(() => texture(volume.data, volume.dims), [volume]);
  const labels = useMemo(() => texture(volume.tissues || new Uint8Array(volume.data.length), volume.dims, false), [volume]);
  const mask = useMemo(() => {
    const data = spatial.isolate.startsWith("tissue-") ? Uint8Array.from(volume.tissues || volume.reference, (n) => n === Number(spatial.isolate.slice(-1)) ? 1 : 0) : spatial.isolate === "proposal" ? volume.proposal : volume.reference;
    return texture(data, volume.dims, false);
  }, [volume, spatial.isolate, revision]);
  const extent = volume.dims.map((n, i) => n * volume.spacing[i]);
  const scale = extent.map((n) => n / Math.max(...extent) * 3);
  const uniforms = useMemo(() => ({
    image: { value: image }, labels: { value: labels }, mask: { value: mask },
    eye: { value: new THREE.Vector3() }, plane: { value: new THREE.Vector4() },
    cut: { value: true }, isolate: { value: false }, threshold: { value: .12 },
    colored: { value: false }, windowRange: { value: new THREE.Vector2() },
  }), [image, labels, mask]);
  useEffect(() => () => image.dispose(), [image]);
  useEffect(() => () => labels.dispose(), [labels]);
  useEffect(() => () => mask.dispose(), [mask]);
  useFrame(({ camera }) => {
    if (!mesh.current) return;
    const active = mesh.current.material.uniforms;
    active.image.value = image; active.labels.value = labels; active.mask.value = mask;
    mesh.current.updateWorldMatrix(true, false);
    mesh.current.worldToLocal(active.eye.value.copy(camera.position));
    const pitch = spatial.pitch * Math.PI / 180, yaw = spatial.yaw * Math.PI / 180;
    active.plane.value.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch), spatial.offset);
    active.cut.value = spatial.cut;
    active.isolate.value = spatial.isolate !== "all";
    active.threshold.value = spatial.threshold / 255;
    active.colored.value = spatial.color && !!volume.tissues;
    active.windowRange.value.set(((displaySettings?.level ?? 105) - (displaySettings?.window ?? 210) / 2) / 255, (displaySettings?.window ?? 210) / 255);
  });
  return <mesh ref={mesh} scale={scale}>
    <boxGeometry args={[1, 1, 1]} />
    <shaderMaterial key={`${volume.id}-${spatial.isolate}-${revision}`} uniforms={uniforms} side={THREE.BackSide}
      vertexShader={`varying vec3 local; void main(){local=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
      fragmentShader={`precision highp float; precision highp sampler3D;
        uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
        uniform sampler3D image; uniform sampler3D labels; uniform sampler3D mask;
        uniform vec3 eye; uniform vec4 plane; uniform bool cut; uniform bool isolate;
        uniform float threshold; uniform bool colored; uniform vec2 windowRange; varying vec3 local;
        // Object x/y/z correspond to voxel x/z/-y, matching the orthogonal views.
        vec3 voxel(vec3 p){return vec3(p.x+.5,.5-p.z,p.y+.5);}
        float density(vec3 p){return texture(image,voxel(p)).r;}
        void main(){
          vec3 ray=normalize(local-eye);
          vec3 inv=1./ray;
          vec3 a=(-vec3(.5)-eye)*inv, b=(vec3(.5)-eye)*inv;
          vec3 lo=min(a,b), hi=max(a,b);
          float start=max(0.,max(lo.x,max(lo.y,lo.z)));
          float end=min(hi.x,min(hi.y,hi.z));
          bool hit=false; vec3 p; float value=0.;
          float stepSize=max((end-start)/480.,.001);
          for(int i=0;i<512;i++){
            float distance=start+float(i)*stepSize;
            if(distance>end) break;
            p=eye+ray*distance;
            if(cut && dot(p,plane.xyz)>plane.w) continue;
            if(isolate && texture(mask,voxel(p)).r<.001) continue;
            value=density(p);
            if(value>threshold || isolate){hit=true;break;}
          }
          if(!hit) discard;
          vec3 gradient=vec3(density(p+vec3(.004,0,0))-density(p-vec3(.004,0,0)),density(p+vec3(0,.004,0))-density(p-vec3(0,.004,0)),density(p+vec3(0,0,.004))-density(p-vec3(0,0,.004)));
          vec3 normal=normalize(gradient+vec3(.00001));
          bool cutFace=cut && abs(dot(p,plane.xyz)-plane.w)<stepSize*2.;
          float light=cutFace ? 1. : .48+.52*abs(dot(normal,normalize(vec3(1,2,3))));
          float gray=clamp((value-windowRange.x)/windowRange.y,0.,1.);
          vec3 color=cutFace ? vec3(pow(gray,2.2))*light : vec3(.38,.48,.50)*light;
          if(colored){
            float tissue=texture(labels,voxel(p)).r*255.;
            vec3 tint=tissue>2.5 ? vec3(.43,.73,.91) : tissue>1.5 ? vec3(.86,.66,.43) : tissue>.5 ? vec3(.72,.49,.78) : vec3(.62,.67,.68);
            color=tint*(.35+.65*value)*light;
          }
          gl_FragColor=vec4(color,1.);
          // Write the actual first-hit depth, rather than the back of the box.
          vec4 clip=projectionMatrix*modelViewMatrix*vec4(p,1.);
          gl_FragDepth=(clip.z/clip.w)*.5+.5;
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`} />
  </mesh>;
}
