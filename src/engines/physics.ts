import * as THREE from 'three';
import { PIVOT_L, PIVOT_R } from '../anatomy';
import { inputRefs } from '../store';

// Physics configuration constants
const LEVERAGE = 3.0;
const INPUT_SCALE_XY = 12;
const INPUT_SCALE_Z = 25;

/**
 * PhysicsEngine handles fulcrum-based simulation of surgical instruments.
 * Uses object pooling to avoid GC pressure during the update loop.
 */
export class PhysicsEngine {
  // Reusable objects to avoid per-frame allocations
  private readonly _tempPos = new THREE.Vector3();
  private readonly _lookAtMat = new THREE.Matrix4();
  private readonly _qRoll = new THREE.Quaternion();
  private readonly _upVector = new THREE.Vector3(0, 1, 0);
  private readonly _rollAxis = new THREE.Vector3(0, 0, 1);

  // Pooled result objects - reused every frame
  private readonly _scopePos = new THREE.Vector3();
  private readonly _scopeRot = new THREE.Quaternion();
  private readonly _toolPos = new THREE.Vector3();
  private readonly _toolRot = new THREE.Quaternion();
  private readonly _lVec = new THREE.Vector3();
  private readonly _rVec = new THREE.Vector3();

  // Result object structure (reused)
  private readonly _result = {
    scope: { pos: this._scopePos, rot: this._scopeRot },
    tool: { pos: this._toolPos, rot: this._toolRot }
  };

  /**
   * Updates simulation state based on hand input.
   * Returns references to internal pooled objects - do not store these references.
   */
  update(): { scope: { pos: THREE.Vector3; rot: THREE.Quaternion }; tool: { pos: THREE.Vector3; rot: THREE.Quaternion } } {
    // Reset positions to defaults
    this._scopePos.set(0, 0, 10);
    this._scopeRot.identity();
    this._toolPos.set(10, 10, 10);
    this._toolRot.identity();

    // Left hand controls scope
    const lh = inputRefs.leftHand;
    this._tempPos.set(lh.x * INPUT_SCALE_XY, lh.y * INPUT_SCALE_XY, lh.z * INPUT_SCALE_Z);
    this._lVec.subVectors(this._tempPos, PIVOT_L).negate();

    this._scopePos.copy(PIVOT_L).add(this._lVec.multiplyScalar(LEVERAGE));

    this._lookAtMat.lookAt(this._scopePos, PIVOT_L, this._upVector);
    this._scopeRot.setFromRotationMatrix(this._lookAtMat);
    this._qRoll.setFromAxisAngle(this._rollAxis, lh.rot);
    this._scopeRot.multiply(this._qRoll);

    // Right hand controls tool
    const rh = inputRefs.rightHand;
    this._tempPos.set(rh.x * INPUT_SCALE_XY, rh.y * INPUT_SCALE_XY, rh.z * INPUT_SCALE_Z);
    this._rVec.subVectors(this._tempPos, PIVOT_R).negate();

    this._toolPos.copy(PIVOT_R).add(this._rVec.multiplyScalar(LEVERAGE));

    this._lookAtMat.lookAt(PIVOT_R, this._toolPos, this._upVector);
    this._toolRot.setFromRotationMatrix(this._lookAtMat);

    return this._result;
  }
}
