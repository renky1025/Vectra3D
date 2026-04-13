import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

export type SvgModelOptions = {
  depth?: number;
  colorOverride?: string;
  targetSize?: number;
};

const DEFAULT_DEPTH = 10;
const DEFAULT_TARGET_SIZE = 120;
const DEFAULT_COLOR = "#0f766e";
const EMPTY_MODEL_ERROR = "当前至少需要可见的 fill 或 stroke SVG 内容";
const OVERLAY_Z_STEP = 0.06;

type SvgLoaderPath = {
  subPaths?: Array<{
    getPoints: () => THREE.Vector2[];
  }>;
  color?: THREE.Color | string;
  userData?: {
    style?: {
      fill?: string;
      opacity?: number | string;
      stroke?: string;
      strokeWidth?: number | string;
      strokeLineJoin?: string;
      strokeLineCap?: string;
      strokeMiterLimit?: number | string;
    };
  };
};

function readOpacity(path: SvgLoaderPath): number {
  const rawOpacity = path.userData?.style?.opacity;

  if (rawOpacity === undefined || rawOpacity === null || rawOpacity === "") {
    return 1;
  }

  const opacity = typeof rawOpacity === "number" ? rawOpacity : Number(rawOpacity);
  return Number.isFinite(opacity) ? opacity : 1;
}

function isFillSupported(path: SvgLoaderPath): boolean {
  const fill = path.userData?.style?.fill?.trim().toLowerCase();
  const opacity = readOpacity(path);

  if (!fill) {
    return false;
  }

  return fill !== "none" && fill !== "transparent" && opacity > 0.001;
}

function readStrokeWidth(path: SvgLoaderPath): number {
  const rawWidth = path.userData?.style?.strokeWidth;

  if (rawWidth === undefined || rawWidth === null || rawWidth === "") {
    return 1;
  }

  const width = typeof rawWidth === "number" ? rawWidth : Number(rawWidth);
  return Number.isFinite(width) ? width : 1;
}

function isStrokeSupported(path: SvgLoaderPath): boolean {
  const stroke = path.userData?.style?.stroke?.trim().toLowerCase();
  const opacity = readOpacity(path);
  const strokeWidth = readStrokeWidth(path);

  if (!stroke) {
    return false;
  }

  return stroke !== "none" && stroke !== "transparent" && strokeWidth > 0 && opacity > 0.001;
}

function createMaterialColor(path: SvgLoaderPath, colorOverride?: string): THREE.ColorRepresentation {
  if (colorOverride) {
    return colorOverride;
  }

  if (path.userData?.style?.fill) {
    return path.userData.style.fill;
  }

  if (path.color) {
    return path.color;
  }

  return DEFAULT_COLOR;
}

function createStrokeColor(path: SvgLoaderPath, colorOverride?: string): THREE.ColorRepresentation {
  if (colorOverride) {
    return colorOverride;
  }

  const stroke = path.userData?.style?.stroke;

  if (stroke) {
    return stroke;
  }

  return createMaterialColor(path, colorOverride);
}

function normalizeGroup(group: THREE.Group, targetSize: number): void {
  group.scale.set(1, -1, 1);

  const initialBox = new THREE.Box3().setFromObject(group);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  const longestSide = Math.max(initialSize.x, initialSize.y, initialSize.z);

  if (longestSide > 0) {
    const scale = targetSize / longestSide;
    group.scale.multiplyScalar(scale);
  }

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);
}

export function disposeGroup(group: THREE.Group | null): void {
  if (!group) {
    return;
  }

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.geometry.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
      return;
    }

    child.material.dispose();
  });
}

function createLayerMaterial(
  color: THREE.ColorRepresentation,
  opacity: number,
  layerIndex: number,
  side: THREE.Side = THREE.DoubleSide
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color,
    opacity,
    transparent: opacity < 0.999,
    depthWrite: opacity >= 0.999,
    side,
    roughness: 0.52,
    metalness: 0.08
  });

  material.polygonOffset = true;
  material.polygonOffsetFactor = -layerIndex;
  material.polygonOffsetUnits = -1;
  return material;
}

function estimateFillArea(path: SvgLoaderPath): number {
  if (!isFillSupported(path)) {
    return 0;
  }

  const shapes = SVGLoader.createShapes(path as never);

  return shapes.reduce((total, shape) => {
    const contourArea = Math.abs(THREE.ShapeUtils.area(shape.getPoints()));
    const holeArea = shape.holes.reduce(
      (sum, hole) => sum + Math.abs(THREE.ShapeUtils.area(hole.getPoints())),
      0
    );

    return total + contourArea - holeArea;
  }, 0);
}

function addBaseFillMeshes(
  group: THREE.Group,
  path: SvgLoaderPath,
  depth: number,
  colorOverride: string | undefined,
  layerIndex: number
): boolean {
  if (!isFillSupported(path)) {
    return false;
  }

  const opacity = readOpacity(path);
  const shapes = SVGLoader.createShapes(path as never);
  let created = false;

  for (const shape of shapes) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 10
    });

    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geometry,
      createLayerMaterial(createMaterialColor(path, colorOverride), opacity, layerIndex, THREE.DoubleSide)
    );
    mesh.position.z = 0;
    mesh.renderOrder = layerIndex;
    group.add(mesh);
    created = true;
  }

  return created;
}

function addFillOverlayMeshes(
  group: THREE.Group,
  path: SvgLoaderPath,
  depth: number,
  colorOverride: string | undefined,
  layerIndex: number
): boolean {
  if (!isFillSupported(path)) {
    return false;
  }

  const opacity = readOpacity(path);
  const shapes = SVGLoader.createShapes(path as never);
  let created = false;

  for (const shape of shapes) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 10
    });
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geometry,
      createLayerMaterial(createMaterialColor(path, colorOverride), opacity, layerIndex, THREE.DoubleSide)
    );
    // Align with base so it stacks along Z but still uses offset for z-fighting
    mesh.position.z = 0;
    mesh.renderOrder = layerIndex;
    group.add(mesh);
    created = true;
  }

  return created;
}

function addStrokeMeshes(
  group: THREE.Group,
  path: SvgLoaderPath,
  depth: number,
  colorOverride: string | undefined,
  layerIndex: number
): boolean {
  if (!isStrokeSupported(path) || !path.subPaths?.length) {
    return false;
  }

  const opacity = readOpacity(path);
  let created = false;

  for (const subPath of path.subPaths) {
    const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData?.style as never);

    if (!geometry) {
      continue;
    }

    const mesh = new THREE.Mesh(
      geometry,
      createLayerMaterial(createStrokeColor(path, colorOverride), opacity, layerIndex, THREE.DoubleSide)
    );
    mesh.position.z = depth + layerIndex * OVERLAY_Z_STEP;
    mesh.renderOrder = layerIndex;
    group.add(mesh);
    created = true;
  }

  return created;
}

export function buildSvgModelGroup(svgText: string, options: SvgModelOptions = {}): THREE.Group {
  if (!svgText.trim()) {
    throw new Error("SVG 内容为空");
  }

  const depth = Math.max(1, options.depth ?? DEFAULT_DEPTH);
  const targetSize = options.targetSize ?? DEFAULT_TARGET_SIZE;
  const loader = new SVGLoader();
  const data = loader.parse(svgText);
  const group = new THREE.Group();
  let visibleLayerIndex = 1;
  const fillPaths = data.paths.filter((path) => isFillSupported(path as SvgLoaderPath)) as SvgLoaderPath[];

  let baseFillPath: SvgLoaderPath | null = null;
  let baseFillArea = -1;

  for (const path of fillPaths) {
    const area = estimateFillArea(path);

    if (area > baseFillArea) {
      baseFillArea = area;
      baseFillPath = path;
    }
  }

  if (baseFillPath) {
    addBaseFillMeshes(group, baseFillPath, depth, options.colorOverride, 0);
  }

  for (const path of data.paths as SvgLoaderPath[]) {
    if (path === baseFillPath) {
      if (isStrokeSupported(path)) {
        addStrokeMeshes(group, path, depth, options.colorOverride, visibleLayerIndex);
        visibleLayerIndex += 1;
      }

      continue;
    }

    const hasFill = addFillOverlayMeshes(group, path, depth, options.colorOverride, visibleLayerIndex);
    const strokeLayerIndex = hasFill ? visibleLayerIndex + 1 : visibleLayerIndex;
    const hasStroke = addStrokeMeshes(group, path, depth, options.colorOverride, strokeLayerIndex);

    if (hasFill) {
      visibleLayerIndex += 1;
    }

    if (hasStroke) {
      visibleLayerIndex += 1;
    }
  }

  if (group.children.length === 0) {
    throw new Error(EMPTY_MODEL_ERROR);
  }

  normalizeGroup(group, targetSize);
  return group;
}
