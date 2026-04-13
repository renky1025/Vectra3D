import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { buildSvgModelGroup } from "./svgToModel";

function collectMeshes(group: THREE.Group): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
    }
  });

  return meshes;
}

describe("buildSvgModelGroup", () => {
  it("将带 fill 的 path 挤出为居中的 3D 模型", () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
        <path d="M0 0 L120 0 L120 60 L0 60 Z" fill="#ff6b35" />
      </svg>
    `;

    const group = buildSvgModelGroup(svg, { depth: 12 });
    const meshes = collectMeshes(group);
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const material = meshes[0].material as THREE.MeshStandardMaterial;

    expect(meshes).toHaveLength(1);
    expect(Math.abs(center.x)).toBeLessThan(0.0001);
    expect(Math.abs(center.y)).toBeLessThan(0.0001);
    expect(Math.abs(center.z)).toBeLessThan(0.0001);
    expect(material.color.getHexString()).toBe("ff6b35");
  });

  it("跳过 opacity 为 0 的透明 path", () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
        <path d="M0 0 L120 0 L120 60 L0 60 Z" fill="#000000" opacity="0" />
        <path d="M20 10 L100 10 L100 50 L20 50 Z" fill="#ffffff" />
      </svg>
    `;

    const group = buildSvgModelGroup(svg);
    const meshes = collectMeshes(group);
    const material = meshes[0].material as THREE.MeshStandardMaterial;

    expect(meshes).toHaveLength(1);
    expect(material.color.getHexString()).toBe("ffffff");
  });

  it("给重叠图层分配稳定的渲染顺序和轻微 z 偏移", () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
        <path d="M0 0 L120 0 L120 60 L0 60 Z" fill="#111111" />
        <path d="M20 10 L100 10 L100 50 L20 50 Z" fill="#ff8855" opacity="0.4" />
      </svg>
    `;

    const group = buildSvgModelGroup(svg, { depth: 12 });
    const meshes = collectMeshes(group);
    const front = meshes[0];
    const overlay = meshes[1];
    const frontBox = new THREE.Box3().setFromObject(front);
    const overlayBox = new THREE.Box3().setFromObject(overlay);
    const overlayMaterial = overlay.material as THREE.MeshStandardMaterial;

    expect(meshes).toHaveLength(2);
    expect(overlay.position.z).toBeGreaterThan(front.position.z);
    expect(overlay.renderOrder).toBeGreaterThan(front.renderOrder);
    expect(overlayMaterial.depthWrite).toBe(false);
    expect(overlayBox.min.z).toBeGreaterThanOrEqual(frontBox.max.z);
    expect(overlayMaterial.side).toBe(THREE.FrontSide);
  });

  it("支持只有 stroke 的基础 SVG 线稿", () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M10 10 L90 10 L90 90 L10 90 Z" stroke="#111111" stroke-width="8" fill="none" />
      </svg>
    `;

    const group = buildSvgModelGroup(svg, { depth: 8 });
    const meshes = collectMeshes(group);
    const material = meshes[0].material as THREE.MeshStandardMaterial;

    expect(meshes.length).toBeGreaterThan(0);
    expect(material.color.getHexString()).toBe("111111");
  });

  it("厚度参数会改变主体模型的 z 深度", () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
        <path d="M0 0 L120 0 L120 60 L0 60 Z" fill="#ff6b35" />
        <path d="M20 10 L100 10 L100 50 L20 50 Z" fill="#111111" />
      </svg>
    `;

    const thin = buildSvgModelGroup(svg, { depth: 4 });
    const thick = buildSvgModelGroup(svg, { depth: 20 });
    const thinBox = new THREE.Box3().setFromObject(thin);
    const thickBox = new THREE.Box3().setFromObject(thick);

    expect(thickBox.max.z - thickBox.min.z).toBeGreaterThan(thinBox.max.z - thinBox.min.z);
  });

  it("拒绝只有 stroke 没有 fill 的 SVG", () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M10 10 L90 10 L90 90" stroke="#111111" fill="none" />
      </svg>
    `;

    expect(() => buildSvgModelGroup(svg)).not.toThrow();
  });
});
