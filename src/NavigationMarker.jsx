import React from "react";
import { voxelToScene } from "./navigation.mjs";
export default function NavigationMarker({volume,position}) {
  return <mesh position={voxelToScene(volume,[position.sagittal,position.coronal,position.axial])} renderOrder={1000}>
    <sphereGeometry args={[.023,16,12]} />
    <meshBasicMaterial color="#62bbf0" depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>;
}
