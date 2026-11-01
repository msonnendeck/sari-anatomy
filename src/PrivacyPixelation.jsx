import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";

// Pixelate the rendered image, never the anatomical mesh. Project the coverage
// box every frame so it follows the pelvis while the camera orbits and zooms.
export default function PrivacyPixelation() {
  const target = useFBO();
  const { gl, scene, camera, size } = useThree();
  const pass = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: { image: { value: null }, region: { value: new THREE.Vector4() }, resolution: { value: new THREE.Vector2() } },
      vertexShader: `varying vec2 uvScreen;
        void main(){ uvScreen=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `uniform sampler2D image; uniform vec4 region;
        uniform vec2 resolution; varying vec2 uvScreen;
        void main(){
          vec2 p=uvScreen;
          if(p.x>=region.x && p.y>=region.y && p.x<=region.z && p.y<=region.w){
            vec2 block=vec2(18.)/resolution;
            p=(floor(p/block)+.5)*block;
          }
          gl_FragColor=texture2D(image,p);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      depthTest: false, depthWrite: false,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const output = new THREE.Scene();
    output.add(new THREE.Mesh(geometry, material));
    return { output, material, geometry, camera: new THREE.Camera(), point: new THREE.Vector3() };
  }, []);
  useEffect(() => () => { pass.material.dispose(); pass.geometry.dispose(); }, [pass]);
  useFrame(() => {
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const x of [-.52, .52]) for (const y of [-.53, .22]) for (const z of [-.48, .52]) {
      pass.point.set(x, y, z).project(camera);
      const u = pass.point.x * .5 + .5, v = pass.point.y * .5 + .5;
      minX = Math.min(minX, u); minY = Math.min(minY, v);
      maxX = Math.max(maxX, u); maxY = Math.max(maxY, v);
    }
    pass.material.uniforms.region.value.set(minX, minY, maxX, maxY);
    pass.material.uniforms.resolution.value.set(size.width, size.height);
    pass.material.uniforms.image.value = target.texture;
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(target);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(previous);
    gl.clear();
    gl.render(pass.output, pass.camera);
  }, 1);
  return null;
}
