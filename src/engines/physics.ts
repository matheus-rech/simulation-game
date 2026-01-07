import * as THREE from 'three';
import { PIVOT_L, PIVOT_R } from '../anatomy';
import { inputRefs } from '../store';

const LEVERAGE = 3.0;

export class PhysicsEngine {
  private _tempPos = new THREE.Vector3();
  private _lookAtMat = new THREE.Matrix4();
  private _qRoll = new THREE.Quaternion();

  update() {
    const result = {
      scope: { pos: new THREE.Vector3(0, 0, 10), rot: new THREE.Quaternion() },
      tool: { pos: new THREE.Vector3(10, 10, 10), rot: new THREE.Quaternion() }
    };

    const lh = inputRefs.leftHand;
    const lRaw = this._tempPos.set(lh.x * 12, lh.y * 12, lh.z * 25);
    const lVec = new THREE.Vector3().subVectors(lRaw, PIVOT_L).negate();

    result.scope.pos.copy(PIVOT_L).add(lVec.multiplyScalar(LEVERAGE));

    this._lookAtMat.lookAt(result.scope.pos, PIVOT_L, new THREE.Vector3(0, 1, 0));
    result.scope.rot.setFromRotationMatrix(this._lookAtMat);
    this._qRoll.setFromAxisAngle(new THREE.Vector3(0, 0, 1), lh.rot);
    result.scope.rot.multiply(this._qRoll);

    const rh = inputRefs.rightHand;
    const rRaw = this._tempPos.set(rh.x * 12, rh.y * 12, rh.z * 25);
    const rVec = new THREE.Vector3().subVectors(rRaw, PIVOT_R).negate();

    result.tool.pos.copy(PIVOT_R).add(rVec.multiplyScalar(LEVERAGE));

    this._lookAtMat.lookAt(PIVOT_R, result.tool.pos, new THREE.Vector3(0, 1, 0));
    result.tool.rot.setFromRotationMatrix(this._lookAtMat);

    return result;
  }
}
