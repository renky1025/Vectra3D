import { OrbitControls, Environment, ContactShadows, Center, Text3D } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, Suspense } from "react";
import type { Group } from "three";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

export type ExportType = 'gltf' | 'obj';
export type ExportTriggerType = { type: ExportType, timestamp: number };


type ModelCanvasProps = {
  model: Group | null;
  inputType?: "svg" | "text" | "image";
  textInput?: string;
  textDepth?: number;
  colorOverride?: string;
  materialType?: string;
  bgColor?: string;
  animationType?: string;
  lightingType?: string;
  exportTrigger?: ExportTriggerType | null;
};

function ExportHandler({ trigger, contentRef }: { trigger: ExportTriggerType | null | undefined, contentRef: React.RefObject<Group | null> }) {
  useEffect(() => {
    if (!trigger || !contentRef.current) return;
    const target = contentRef.current;
    
    try {
      if (trigger.type === 'gltf') {
        const exporter = new GLTFExporter();
        exporter.parse(target, (gltf) => {
          const output = typeof gltf === 'string' ? gltf : JSON.stringify(gltf, null, 2);
          const blob = new Blob([output], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `model-${Date.now()}.gltf`;
          link.click();
          URL.revokeObjectURL(url);
        }, (err) => console.error(err), { binary: false });
      } else if (trigger.type === 'obj') {
        const exporter = new OBJExporter();
        const result = exporter.parse(target);
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `model-${Date.now()}.obj`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export failed:", e);
    }
  }, [trigger, contentRef]);

  return null;
}

function EmptyStateModel() {
  return (
    <mesh rotation={[0.6, 0.7, 0]}>
      <torusKnotGeometry args={[18, 5, 128, 24]} />
      <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

function LightingSetup({ type }: { type: string }) {
  if (type === "outdoor") {
    return (
      <>
        <ambientLight intensity={1.8} />
        <directionalLight position={[100, 150, 100]} intensity={3.5} color="#fdfbd3" />
        <directionalLight position={[-50, -50, -50]} intensity={1} color="#b1cbff" />
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
      </>
    );
  }
  
  if (type === "dramatic") {
    return (
      <>
        <ambientLight intensity={0.5} />
        <spotLight position={[100, 100, 0]} intensity={8} penumbra={0.5} angle={0.5} color="#ff0044" />
        <spotLight position={[-100, 100, 100]} intensity={8} penumbra={0.5} angle={0.5} color="#0044ff" />
        <directionalLight position={[0, -100, -100]} intensity={2} />
      </>
    );
  }

  // Default / Studio - optimized soft lighting
  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[100, 140, 180]} intensity={2.5} castShadow />
      <directionalLight position={[-80, -40, -120]} intensity={0.8} />
      <spotLight position={[0, 200, 50]} intensity={1.5} penumbra={1} angle={0.6} />
      <Suspense fallback={null}>
        <Environment preset="studio" />
      </Suspense>
    </>
  );
}

function AnimationWrapper({ children, animType }: { children: React.ReactNode, animType: string }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // Reset basics
    let y = 0;
    let rx = 0;
    let ry = 0;
    let rz = 0;
    let s = 1;

    switch (animType) {
      case "spin":
        ry = t * 1.5;
        break;
      case "float":
        y = Math.sin(t * 3.5) * 5; // 微微上下移动, 不变形
        break;
      case "pulse":
        s = 1 + Math.sin(t * 4) * 0.06;
        break;
      case "wobble":
        rx = Math.sin(t * 4) * 0.15;
        rz = Math.cos(t * 4) * 0.15;
        break;
      case "swing":
        ry = Math.sin(t * 3) * 0.6;
        break;
      case "spin_float":
        ry = t * 1.5;
        y = Math.sin(t * 3.5) * 5;
        break;
      case "none":
      default:
        break;
    }

    // Apply with some smoothing to prevent pop when switching animations
    ref.current.position.y += (y - ref.current.position.y) * 0.1;
    ref.current.rotation.x += (rx - ref.current.rotation.x) * 0.1;
    ref.current.rotation.y += (ry - ref.current.rotation.y) * 0.1;
    ref.current.rotation.z += (rz - ref.current.rotation.z) * 0.1;
    
    const currentScale = ref.current.scale.x;
    const nextScale = currentScale + (s - currentScale) * 0.1;
    ref.current.scale.setScalar(nextScale);
  });

  return (
    <group ref={ref}>
      {children}
    </group>
  );
}

function getMaterialProps(type: string, colorOverride?: string) {
  const base = {
     color: colorOverride || '#ffffff'
  };
  
  if (type === 'gold') {
    return { ...base, metalness: 1.0, roughness: 0.2, transparent: false, opacity: 1.0 };
  } else if (type === 'metallic') {
    return { ...base, metalness: 0.8, roughness: 0.3, transparent: false, opacity: 1.0 };
  } else if (type === 'glass') {
    return { ...base, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.45, toneMapped: false };
  }
  // basic
  return { ...base, metalness: 0.1, roughness: 0.8, transparent: false, opacity: 1.0 };
}

export function ModelCanvas({ 
  model, 
  inputType = "svg",
  textInput = "",
  textDepth = 12,
  colorOverride,
  materialType = "basic",
  bgColor = "#5a98ea", 
  animationType = "float",
  lightingType = "studio",
  exportTrigger
}: ModelCanvasProps) {
  const exportTargetRef = useRef<Group>(null);
  
  return (
    <Canvas camera={{ position: [0, 0, 220], fov: 34 }}>
      <color attach="background" args={[bgColor]} />
      
      <LightingSetup type={lightingType} />
      <ExportHandler trigger={exportTrigger} contentRef={exportTargetRef} />
      
      {(inputType === 'svg' || inputType === 'image') && model ? (
        <AnimationWrapper animType={animationType}>
          <group ref={exportTargetRef}>
            <primitive object={model} />
          </group>
        </AnimationWrapper>
      ) : inputType === 'text' && textInput ? (
        <AnimationWrapper animType={animationType}>
          <group ref={exportTargetRef}>
            <Center>
              <Suspense fallback={null}>
                <Text3D 
                  font="/font.json"
                  size={40}
                  height={textDepth}
                  curveSegments={12}
                  bevelEnabled={true}
                  bevelThickness={1.5}
                  bevelSize={0.5}
                  bevelOffset={0}
                  bevelSegments={4}
                >
                  {textInput}
                  <meshStandardMaterial {...getMaterialProps(materialType, colorOverride)} />
                </Text3D>
              </Suspense>
            </Center>
          </group>
        </AnimationWrapper>
      ) : (
        <group ref={exportTargetRef}>
          <EmptyStateModel />
        </group>
      )}
      
      {/* 底部阴影 Contact Shadows */}
      <ContactShadows 
        position={[0, -90, 0]} 
        opacity={0.5} 
        scale={280} 
        blur={2.5} 
        far={120} 
        resolution={512}
        color="#000000"
      />
      
      <OrbitControls 
        enableDamping 
        makeDefault 
      />
    </Canvas>
  );
}
