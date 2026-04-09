import type { QuaternionTuple, Vector3Tuple } from "@/lib/ar/types";

const EPSILON = 1e-6;

export const addVectors = (
  leftVector: Vector3Tuple,
  rightVector: Vector3Tuple
): Vector3Tuple => {
  return [
    leftVector[0] + rightVector[0],
    leftVector[1] + rightVector[1],
    leftVector[2] + rightVector[2]
  ];
};

export const clampNumber = (
  inputValue: number,
  minimumValue: number,
  maximumValue: number
): number => {
  return Math.min(Math.max(inputValue, minimumValue), maximumValue);
};

export const crossVectors = (
  leftVector: Vector3Tuple,
  rightVector: Vector3Tuple
): Vector3Tuple => {
  return [
    leftVector[1] * rightVector[2] - leftVector[2] * rightVector[1],
    leftVector[2] * rightVector[0] - leftVector[0] * rightVector[2],
    leftVector[0] * rightVector[1] - leftVector[1] * rightVector[0]
  ];
};

export const dotVectors = (
  leftVector: Vector3Tuple,
  rightVector: Vector3Tuple
): number => {
  return (
    leftVector[0] * rightVector[0] +
    leftVector[1] * rightVector[1] +
    leftVector[2] * rightVector[2]
  );
};

export const getVectorLength = (inputVector: Vector3Tuple): number => {
  return Math.sqrt(dotVectors(inputVector, inputVector));
};

export const isFiniteQuaternion = (
  inputQuaternion: QuaternionTuple
): boolean => {
  return inputQuaternion.every((value) => Number.isFinite(value));
};

export const isFiniteVector = (inputVector: Vector3Tuple): boolean => {
  return inputVector.every((value) => Number.isFinite(value));
};

export const lerpNumber = (
  startValue: number,
  endValue: number,
  interpolationFactor: number
): number => {
  return startValue + (endValue - startValue) * interpolationFactor;
};

export const lerpVectors = (
  startVector: Vector3Tuple,
  endVector: Vector3Tuple,
  interpolationFactor: number
): Vector3Tuple => {
  return [
    lerpNumber(startVector[0], endVector[0], interpolationFactor),
    lerpNumber(startVector[1], endVector[1], interpolationFactor),
    lerpNumber(startVector[2], endVector[2], interpolationFactor)
  ];
};

export const normalizeQuaternion = (
  inputQuaternion: QuaternionTuple
): QuaternionTuple => {
  const quaternionLength = Math.hypot(
    inputQuaternion[0],
    inputQuaternion[1],
    inputQuaternion[2],
    inputQuaternion[3]
  );

  if (quaternionLength < EPSILON) {
    return [0, 0, 0, 1];
  }

  return [
    inputQuaternion[0] / quaternionLength,
    inputQuaternion[1] / quaternionLength,
    inputQuaternion[2] / quaternionLength,
    inputQuaternion[3] / quaternionLength
  ];
};

export const normalizeVector = (
  inputVector: Vector3Tuple,
  fallbackVector: Vector3Tuple = [0, 0, 0]
): Vector3Tuple => {
  const vectorLength = getVectorLength(inputVector);

  if (vectorLength < EPSILON) {
    return fallbackVector;
  }

  return [
    inputVector[0] / vectorLength,
    inputVector[1] / vectorLength,
    inputVector[2] / vectorLength
  ];
};

export const nlerpQuaternions = (
  startQuaternion: QuaternionTuple,
  endQuaternion: QuaternionTuple,
  interpolationFactor: number
): QuaternionTuple => {
  const dotProduct =
    startQuaternion[0] * endQuaternion[0] +
    startQuaternion[1] * endQuaternion[1] +
    startQuaternion[2] * endQuaternion[2] +
    startQuaternion[3] * endQuaternion[3];

  const resolvedEndQuaternion =
    dotProduct < 0
      ? ([
          -endQuaternion[0],
          -endQuaternion[1],
          -endQuaternion[2],
          -endQuaternion[3]
        ] as QuaternionTuple)
      : endQuaternion;

  return normalizeQuaternion([
    lerpNumber(startQuaternion[0], resolvedEndQuaternion[0], interpolationFactor),
    lerpNumber(startQuaternion[1], resolvedEndQuaternion[1], interpolationFactor),
    lerpNumber(startQuaternion[2], resolvedEndQuaternion[2], interpolationFactor),
    lerpNumber(startQuaternion[3], resolvedEndQuaternion[3], interpolationFactor)
  ]);
};

export const quaternionFromBasis = (
  xAxis: Vector3Tuple,
  yAxis: Vector3Tuple,
  zAxis: Vector3Tuple
): QuaternionTuple => {
  const matrix00 = xAxis[0];
  const matrix01 = yAxis[0];
  const matrix02 = zAxis[0];
  const matrix10 = xAxis[1];
  const matrix11 = yAxis[1];
  const matrix12 = zAxis[1];
  const matrix20 = xAxis[2];
  const matrix21 = yAxis[2];
  const matrix22 = zAxis[2];

  const trace = matrix00 + matrix11 + matrix22;

  if (trace > 0) {
    const scale = Math.sqrt(trace + 1) * 2;
    return normalizeQuaternion([
      (matrix21 - matrix12) / scale,
      (matrix02 - matrix20) / scale,
      (matrix10 - matrix01) / scale,
      0.25 * scale
    ]);
  }

  if (matrix00 > matrix11 && matrix00 > matrix22) {
    const scale = Math.sqrt(1 + matrix00 - matrix11 - matrix22) * 2;
    return normalizeQuaternion([
      0.25 * scale,
      (matrix01 + matrix10) / scale,
      (matrix02 + matrix20) / scale,
      (matrix21 - matrix12) / scale
    ]);
  }

  if (matrix11 > matrix22) {
    const scale = Math.sqrt(1 + matrix11 - matrix00 - matrix22) * 2;
    return normalizeQuaternion([
      (matrix01 + matrix10) / scale,
      0.25 * scale,
      (matrix12 + matrix21) / scale,
      (matrix02 - matrix20) / scale
    ]);
  }

  const scale = Math.sqrt(1 + matrix22 - matrix00 - matrix11) * 2;
  return normalizeQuaternion([
    (matrix02 + matrix20) / scale,
    (matrix12 + matrix21) / scale,
    0.25 * scale,
    (matrix10 - matrix01) / scale
  ]);
};

export const scaleVector = (
  inputVector: Vector3Tuple,
  multiplier: number
): Vector3Tuple => {
  return [
    inputVector[0] * multiplier,
    inputVector[1] * multiplier,
    inputVector[2] * multiplier
  ];
};

export const subtractVectors = (
  leftVector: Vector3Tuple,
  rightVector: Vector3Tuple
): Vector3Tuple => {
  return [
    leftVector[0] - rightVector[0],
    leftVector[1] - rightVector[1],
    leftVector[2] - rightVector[2]
  ];
};

export const toScenePoint = (
  inputPoint: { x: number; y: number; z: number },
  viewportSize: { height: number; width: number }
): Vector3Tuple => {
  const viewportUnit = Math.min(viewportSize.width, viewportSize.height);

  return [
    (inputPoint.x - 0.5) * viewportSize.width,
    (0.5 - inputPoint.y) * viewportSize.height,
    -inputPoint.z * viewportUnit * 1.4
  ];
};
