import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import type { ExportTriggerType } from "./components/ModelCanvas";
import type { Group } from "three";
import { ModelCanvas } from "./components/ModelCanvas";
import { buildSvgModelGroup, disposeGroup, SvgModelOptions } from "./lib/svgToModel";
import ImageTracer from "./lib/imagetracer.js";
import "./styles.css";

const SAMPLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" version="1.1" desc="Created with imagetracer.js version 1.2.6" id="svg-6m1yc5rja" style="width: 100%; height: auto;"><path fill="rgb(0,0,0)" stroke="rgb(0,0,0)" stroke-width="0" opacity="0" d="M 0 0 L 640 0 L 640 291 L 560 291 L 560 133.5 L 559.5 133 L 80 133 L 80 292 L 0 292 L 0 0 Z "/><path fill="rgb(0,0,0)" stroke="rgb(0,0,0)" stroke-width="0" opacity="0" d="M 160 217 L 199 217 L 199 291 L 160 291 L 160 217 Z "/><path fill="rgb(0,0,0)" stroke="rgb(0,0,0)" stroke-width="0" opacity="0" d="M 441 217 L 480 217 L 480 291 L 441 291 L 441 217 Z "/><path fill="rgb(0,0,0)" stroke="rgb(0,0,0)" stroke-width="0" opacity="0" d="M 0 375 L 80 375 L 80 455.5 L 80.5 456 L 119 456 L 119 534 L 160 534 L 160 456 L 199 456 L 199 534 L 240 534 L 240 456.5 L 243.5 456 L 245.5 456 L 247.5 457 L 249.5 456 L 251.5 456 L 253.5 457 L 255.5 456 L 257.5 456 L 259.5 457 L 261.5 456 L 263.5 456 L 265.5 457 L 267.5 456 L 269.5 456 L 271.5 457 L 273.5 456 L 275.5 456 L 277.5 457 L 279.5 456 L 281.5 456 L 283.5 457 L 285.5 456 L 287.5 456 L 289.5 457 L 291.5 456 L 293.5 456 L 295.5 457 L 297.5 456 L 299.5 456 L 301.5 457 L 303.5 456 L 305.5 456 L 307.5 457 L 309.5 456 L 311.5 456 L 313.5 457 L 315.5 456 L 317.5 456 L 319.5 457 L 321.5 456 L 323.5 456 L 325.5 457 L 327.5 456 L 329.5 456 L 331.5 457 L 333.5 456 L 335.5 456 L 337.5 457 L 339.5 456 L 341.5 456 L 343.5 457 L 345.5 456 L 347.5 456 L 349.5 457 L 351.5 456 L 353.5 456 L 355.5 457 L 357.5 456 L 359.5 456 L 361.5 457 L 363.5 456 L 365.5 456 L 367.5 457 L 369.5 456 L 371.5 456 L 373.5 457 L 375.5 456 L 377.5 456 L 379.5 457 L 381.5 456 L 383.5 456 L 385.5 457 L 387.5 456 L 389.5 456 L 391.5 457 L 393.5 456 L 395.5 456 Q 400 455.5 400 456.5 L 400 534 L 441 534 L 441 456 L 480 456 L 480 534 L 521 534 L 521 456 L 559.5 456 L 560 455.5 L 560 375 L 640 375 L 640 640 L 0 640 L 0 375 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 80.5 133 L 560 133.5 L 80.5 134 L 80.5 133 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 160.5 216 L 200 216 L 200 292 L 160 291.5 L 199 291 L 199 217 L 160.5 217 L 160.5 216 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 440 216 L 480 216.5 L 441 217 L 441 291 L 479.5 291 L 479.5 292 L 440 292 L 440 216 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 560.5 291 L 640 291.5 L 560.5 292 L 560.5 291 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 0.5 374 L 80 374.5 L 0.5 375 L 0.5 374 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 560.5 374 L 640 374.5 L 560.5 375 L 560.5 374 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 80.5 455 L 120 455 L 120 533 L 159.5 533 L 159.5 534 L 119 534 L 119 456 L 80.5 456 L 80.5 455 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 160.5 455 L 200 455 L 200 533 L 239.5 533 L 239.5 534 L 199 534 L 199 456 L 160.5 456 L 160.5 455 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 240.5 455 L 400 455.5 L 394.5 457 L 392.5 456 L 390.5 456 L 388.5 457 L 386.5 456 L 384.5 456 L 382.5 457 L 380.5 456 L 378.5 456 L 376.5 457 L 374.5 456 L 372.5 456 L 370.5 457 L 368.5 456 L 366.5 456 L 364.5 457 L 362.5 456 L 360.5 456 L 358.5 457 L 356.5 456 L 354.5 456 L 352.5 457 L 350.5 456 L 348.5 456 L 346.5 457 L 344.5 456 L 342.5 456 L 340.5 457 L 338.5 456 L 336.5 456 L 334.5 457 L 332.5 456 L 330.5 456 L 328.5 457 L 326.5 456 L 324.5 456 L 322.5 457 L 320.5 456 L 318.5 456 L 316.5 457 L 314.5 456 L 312.5 456 L 310.5 457 L 308.5 456 L 306.5 456 L 304.5 457 L 302.5 456 L 300.5 456 L 298.5 457 L 296.5 456 L 294.5 456 L 292.5 457 L 290.5 456 L 288.5 456 L 286.5 457 L 284.5 456 L 282.5 456 L 280.5 457 L 278.5 456 L 276.5 456 L 274.5 457 L 272.5 456 L 270.5 456 L 268.5 457 L 266.5 456 L 264.5 456 L 262.5 457 L 260.5 456 L 258.5 456 L 256.5 457 L 254.5 456 L 252.5 456 L 250.5 457 L 248.5 456 L 246.5 456 L 244.5 457 L 240.5 456 L 240.5 455 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 440 455 L 480 455.5 L 441 456 L 441 534 L 400.5 534 L 400.5 533 L 440 533 L 440 455 Z "/><path fill="rgb(216,117,85)" stroke="rgb(216,117,85)" stroke-width="0" opacity="0.43529411764705883" d="M 520 455 L 560 455.5 L 521 456 L 521 534 L 480.5 534 L 480.5 533 L 520 533 L 520 455 Z "/><path fill="rgb(217,119,87)" stroke="rgb(217,119,87)" stroke-width="0" opacity="0.996078431372549" d="M 559.5 134 L 560 291.5 L 559 291.5 L 559.5 134 Z "/><path fill="rgb(217,119,87)" stroke="rgb(217,119,87)" stroke-width="0" opacity="1" d="M 80 134 L 559 134 L 559 292 L 640 292 L 640 374 L 560 374 L 560 455 L 520 455 L 520 533 L 480 533 L 480 455 L 440 455 L 440 533 L 400 533 L 400 455 L 240 455 L 240 533 L 200 533 L 200 455 L 160 455 L 160 533 L 120 533 L 120 455 L 80.5 455 L 80 454.5 L 80 374 L 0 374 L 0 292 L 80 292 L 80 134 Z M 160 216 L 160 292 L 200 292 L 200 216 L 160 216 Z M 440 216 L 440 292 L 480 292 L 480 216 L 440 216 Z "/>
</svg>
`.trim();

function AccordionSection({
  title,
  icon,
  isOpen,
  onToggle,
  children
}: {
  title: string,
  icon: string,
  isOpen: boolean,
  onToggle: () => void,
  children: React.ReactNode
}) {
  return (
    <div className={`section ${isOpen ? 'is-open' : ''}`}>
      <div className="section-header" onClick={onToggle}>
        <div className="section-icon">{icon}</div>
        <div className="section-title">{title}</div>
        <div className="section-arrow">›</div>
      </div>
      <div className="section-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  const [svgText, setSvgText] = useState(SAMPLE_SVG);
  const [inputType, setInputType] = useState<"svg" | "text" | "image">("svg");
  const [textInput, setTextInput] = useState("AI 3D");
  const [depth, setDepth] = useState(12);
  const [useColorOverride, setUseColorOverride] = useState(false);
  const [colorOverride, setColorOverride] = useState("#FFD700");
  const [model, setModel] = useState<Group | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Image to SVG processing state
  const [imageColors, setImageColors] = useState(16);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoveBg, setImageRemoveBg] = useState(true);

  // New UI states matching screenshot #2 (Blue BG)
  const [bgColor, setBgColor] = useState("#5a98ea");
  const [materialType, setMaterialType] = useState("metallic");
  const [animationType, setAnimationType] = useState("float"); // None, Spin, Float, Pulse, Wobble, Swing, Spin + Float
  const [lightingType, setLightingType] = useState("outdoor");
  const [exportTrigger, setExportTrigger] = useState<ExportTriggerType | null>(null);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    object: true,
    background: false,
    material: false,
    texture: false,
    animation: true,
    lighting: false,
    export: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const deferredSvgText = useDeferredValue(svgText);
  const deferredDepth = useDeferredValue(depth);
  const deferredColorOverride = useDeferredValue(colorOverride);
  const deferredMaterialType = useDeferredValue(materialType);

  useEffect(() => {
    let nextModel: Group | null = null;
    try {
      const options: SvgModelOptions = {
        depth: deferredDepth,
        colorOverride: useColorOverride ? deferredColorOverride : undefined,
      };

      nextModel = buildSvgModelGroup(deferredSvgText, options);

      if (nextModel) {
        nextModel.traverse((child: any) => {
          if (child.isMesh && child.material) {

            // Apply Color Override if needed
            if (useColorOverride) {
              child.material.color.set(deferredColorOverride);
            }

            // Apply Material Settings
            if (deferredMaterialType === 'gold') {
              child.material.metalness = 1.0;
              child.material.roughness = 0.2;
              child.material.transparent = false;
              child.material.opacity = 1.0;
            } else if (deferredMaterialType === 'metallic') {
              child.material.metalness = 0.8;
              child.material.roughness = 0.3;
              child.material.transparent = false;
              child.material.opacity = 1.0;
            } else if (deferredMaterialType === 'glass') {
              child.material.metalness = 0.1;
              child.material.roughness = 0.05;
              child.material.transparent = true;
              child.material.opacity = 0.45;
            } else if (deferredMaterialType === 'basic') {
              child.material.metalness = 0.1;
              child.material.roughness = 0.8;
              child.material.transparent = false;
              child.material.opacity = 1.0;
            }
          }
        });
      }

      setErrorMessage("");
      setModel(nextModel);
    } catch (error) {
      if (!model) setModel(null);
      setErrorMessage(error instanceof Error ? error.message : "SVG 解析失败");
    }

    return () => { };
  }, [deferredColorOverride, deferredDepth, deferredSvgText, useColorOverride, deferredMaterialType]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      startTransition(() => {
        setSvgText(text);
        setUseColorOverride(false); // Reset to ensure original color is prioritized
      });
    });
    event.target.value = "";
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setImagePreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function processImage() {
    if (!imagePreview) return;
    setImageProcessing(true);
    setErrorMessage("");

    let finalImageUrl = imagePreview;

    if (imageRemoveBg) {
      try {
        finalImageUrl = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(imagePreview);
            
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            
            // Assume top-left pixel is the background color
            const bgR = data[0];
            const bgG = data[1];
            const bgB = data[2];
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              const a = data[i+3];
              
              if (a > 0 && Math.abs(r - bgR) < 25 && Math.abs(g - bgG) < 25 && Math.abs(b - bgB) < 25) {
                data[i+3] = 0; // Set to transparent
              }
            }
            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = () => resolve(imagePreview);
          img.src = imagePreview;
        });
      } catch (err) {
        console.warn("Background removal failed, proceeding with original", err);
      }
    }

    setTimeout(() => {
      try {
        const OPTS = {
          numberofcolors: imageColors,
          blurradius: 0,
          blurdelta: 20,
          strokewidth: 0,
          scale: 1,
          viewbox: true,
          ltres: 1,
          qtres: 1,
        };
        const tracer = ImageTracer;
        tracer.imageToSVG(finalImageUrl, (svgstr: string) => {
          if (!svgstr) {
            setErrorMessage("Image tracing failed.");
          } else {
            // Fix svg document sizes
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(svgstr, "image/svg+xml");
              const svgEl = doc.querySelector("svg");
              if (svgEl) {
                if (!svgEl.hasAttribute("viewBox") && svgEl.hasAttribute("width") && svgEl.hasAttribute("height")) {
                  svgEl.setAttribute("viewBox", `0 0 ${svgEl.getAttribute("width")} ${svgEl.getAttribute("height")}`);
                }
                svgEl.removeAttribute("width");
                svgEl.removeAttribute("height");
                svgstr = new XMLSerializer().serializeToString(doc);
              }
            } catch (e) {
              console.error(e);
            }
            startTransition(() => {
              setSvgText(svgstr);
              setUseColorOverride(false);
            });
          }
          setImageProcessing(false);
        }, OPTS);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Error converting image");
        setImageProcessing(false);
      }
    }, 100);
  }

  return (
    <div className="app-container">
      <div className="canvas-area">
        <ModelCanvas
          model={(inputType === 'svg' || inputType === 'image') ? model : null}
          inputType={inputType}
          textInput={textInput}
          textDepth={depth}
          colorOverride={useColorOverride ? colorOverride : undefined}
          materialType={materialType}
          bgColor={bgColor}
          animationType={animationType}
          lightingType={lightingType}
          exportTrigger={exportTrigger}
        />
      </div>

      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <span className="logo-icon">V</span>
            <span className="logo-text">Vectra 3D</span>
          </div>
          <button className="sidebar-close" title="Collapse Sidebar">×</button>
        </div>

        <AccordionSection
          title="Object"
          icon="⬡"
          isOpen={openSections.object}
          onToggle={() => toggleSection('object')}
        >
          <div className="control-group">
            <div className="select-wrapper">
              <select className="select-box" value={inputType} onChange={(e) => setInputType(e.target.value as any)}>
                <option value="svg">SVG File Import</option>
                <option value="text">3D Text Generation</option>
                <option value="image">Image to SVG</option>
              </select>
            </div>
          </div>

          {inputType === 'svg' ? (
            <div className="control-group">
              <label className="control-label">SVG Source</label>
              <div className="file-input-wrapper">
                <input type="file" accept=".svg,image/svg+xml" onChange={handleFileChange} style={{ width: '100%' }} />
              </div>
            </div>
          ) : inputType === 'text' ? (
            <div className="control-group">
              <label className="control-label">Text Content (English)</label>
              <input
                type="text"
                className="select-box"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
              />
            </div>
          ) : (
            <>
              <div className="control-group">
                <label className="control-label">Raster Image Source</label>
                <div className="file-input-wrapper">
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ width: '100%' }} />
                </div>
                {imagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '4px' }} />
                  </div>
                )}
              </div>
              <div className="control-group">
                <label className="control-label">Trace Colors: {imageColors}</label>
                <div className="range-slider">
                  <input
                    type="range"
                    min="2"
                    max="64"
                    step="2"
                    value={imageColors}
                    onChange={(e) => setImageColors(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="control-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={imageRemoveBg}
                    onChange={(e) => setImageRemoveBg(e.target.checked)}
                  />
                  Auto-Remove Background
                </label>
              </div>
              <div className="control-group">
                <button
                  className="btn-primary"
                  onClick={processImage}
                  disabled={!imagePreview || imageProcessing}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#3b82f6', color: 'white', border: 'none', cursor: imageProcessing || !imagePreview ? 'not-allowed' : 'pointer' }}
                >
                  {imageProcessing ? 'Processing...' : 'Convert & Render 3D ✨'}
                </button>
              </div>
            </>
          )}

          <div className="control-group">
            <label className="control-label">Extrude Depth: {depth}</label>
            <div className="range-slider">
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="control-group">
              <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: 0 }}>{errorMessage}</p>
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Background"
          icon="▨"
          isOpen={openSections.background}
          onToggle={() => toggleSection('background')}
        >
          <div className="control-group">
            <label className="control-label">Color</label>
            <div className="color-picker">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Material"
          icon="❖"
          isOpen={openSections.material}
          onToggle={() => toggleSection('material')}
        >
          <div className="control-group">
            <div className="select-wrapper">
              <select
                className="select-box"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
              >
                <option value="basic">Basic</option>
                <option value="metallic">Metallic</option>
                <option value="gold">Gold</option>
                <option value="glass">Glass</option>
              </select>
            </div>
          </div>

          {openSections.material && (
            <div className="sub-section">
              <div className="sub-section-title">Advanced</div>

              <div className="control-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useColorOverride}
                    onChange={(e) => setUseColorOverride(e.target.checked)}
                  />
                  Color Override
                </label>
              </div>

              {useColorOverride && (
                <div className="control-group">
                  <div className="color-picker">
                    <input
                      type="color"
                      value={colorOverride}
                      onChange={(e) => setColorOverride(e.target.value)}
                    />
                    <input
                      type="text"
                      value={colorOverride}
                      onChange={(e) => setColorOverride(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Texture"
          icon="▦"
          isOpen={openSections.texture}
          onToggle={() => toggleSection('texture')}
        >
          <div className="control-group">
            <div className="select-wrapper">
              <select className="select-box">
                <option value="none">None</option>
                <option value="noise">Noise</option>
                <option value="brushed">Brushed</option>
              </select>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Animation"
          icon="▷"
          isOpen={openSections.animation}
          onToggle={() => toggleSection('animation')}
        >
          <div className="control-group">
            <div className="select-wrapper">
              <select
                className="select-box"
                value={animationType}
                onChange={(e) => setAnimationType(e.target.value)}
              >
                <option value="none">None</option>
                <option value="spin">Spin</option>
                <option value="float">Float</option>
                <option value="pulse">Pulse</option>
                <option value="wobble">Wobble</option>
                <option value="swing">Swing</option>
                <option value="spin_float">Spin + Float</option>
              </select>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Lighting"
          icon="☀"
          isOpen={openSections.lighting}
          onToggle={() => toggleSection('lighting')}
        >
          <div className="control-group">
            <div className="select-wrapper">
              <select
                className="select-box"
                value={lightingType}
                onChange={(e) => setLightingType(e.target.value)}
              >
                <option value="studio">Studio</option>
                <option value="outdoor">Outdoor</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Export 3D"
          icon="↓"
          isOpen={openSections.export}
          onToggle={() => toggleSection('export')}
        >
          <div className="control-group">
            <button
              className="btn-secondary"
              onClick={() => setExportTrigger({ type: 'gltf', timestamp: Date.now() })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#e2e8f0', color: '#1e293b', border: '1px solid #cbd5e1', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              🚀 Export as GLTF
            </button>
            <button
              className="btn-secondary"
              onClick={() => setExportTrigger({ type: 'obj', timestamp: Date.now() })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#e2e8f0', color: '#1e293b', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              📦 Export as OBJ
            </button>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}

export default App;
