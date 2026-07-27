import * as THREE from 'three';

export const ICA_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.2, -3.0, -12.0),
  new THREE.Vector3(-1.4, -0.8, -11.5),
  new THREE.Vector3(-1.0, 0.5, -11.0),
  new THREE.Vector3(-1.2, 2.0, -10.5)
]);

export const CN_VI_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.5, -3.0, -11.8),
  new THREE.Vector3(-0.4, -0.5, -11.2),
  new THREE.Vector3(-0.6, 2.0, -10.8)
]);

export const PIVOT_L = new THREE.Vector3(-0.8, -2.5, 5.0);
export const PIVOT_R = new THREE.Vector3(0.8, -2.5, 5.0);
