import { useEffect, useRef, useState } from "react";

const TAU = Math.PI * 2;

export default function AnimatedHeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!root || !canvas || !context) return;

    let width = 1;
    let height = 1;
    let frame = 0;
    let reveal = 0;
    let revealTarget = 0;
    let pointerX = 0.5;
    let pointerY = 0.48;
    let targetX = pointerX;
    let targetY = pointerY;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        revealTarget = 0;
        return;
      }

      targetX = (event.clientX - rect.left) / rect.width;
      targetY = (event.clientY - rect.top) / rect.height;
      revealTarget = 1;
    };

    const closeScene = () => {
      revealTarget = 0;
      targetX = 0.5;
      targetY = 0.48;
    };

    const releaseTouch = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") closeScene();
    };

    const curtainPath = (
      side: "left" | "right",
      center: number,
      openingHalf: number,
      time: number,
    ) => {
      const path = new Path2D();
      const overlap = (1 - reveal) * 18;
      const boundaryAt = (y: number) => {
        const progress = y / height;
        const primaryWave = Math.sin(progress * TAU * 1.15 + time * 0.00028 + (side === "left" ? 0 : 1.8)) * 12;
        const detailWave = Math.sin(progress * TAU * 3.1 - time * 0.00017 + (side === "left" ? 0.7 : 2.2)) * 5;
        const pointerTilt = (progress - pointerY) * (pointerX - 0.5) * width * 0.06;
        return side === "left"
          ? center - openingHalf + overlap + primaryWave + detailWave + pointerTilt
          : center + openingHalf - overlap + primaryWave + detailWave + pointerTilt;
      };

      if (side === "left") {
        path.moveTo(0, 0);
        path.lineTo(boundaryAt(0), 0);
        for (let y = 0; y <= height; y += 14) path.lineTo(boundaryAt(y), y);
        path.lineTo(0, height);
      } else {
        path.moveTo(width, 0);
        path.lineTo(boundaryAt(0), 0);
        for (let y = 0; y <= height; y += 14) path.lineTo(boundaryAt(y), y);
        path.lineTo(width, height);
      }

      path.closePath();
      return { path, boundaryAt };
    };

    const drawScene = (time: number) => {
      const shortSide = Math.min(width, height);

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#01070d");
      sky.addColorStop(0.3, "#061824");
      sky.addColorStop(0.55, "#0a3540");
      sky.addColorStop(0.72, "#10606a");
      sky.addColorStop(1, "#08252d");
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      for (let star = 0; star < 34; star += 1) {
        const starX = ((Math.sin(star * 91.73) + 1) * 0.5) * width;
        const starY = ((Math.sin(star * 47.19 + 2.4) + 1) * 0.5) * height * 0.52;
        const twinkle = 0.35 + Math.sin(time * 0.0012 + star * 1.7) * 0.18;
        context.fillStyle = `rgba(205, 255, 251, ${twinkle})`;
        context.beginPath();
        context.arc(starX, starY, star % 6 === 0 ? 1.35 : 0.75, 0, TAU);
        context.fill();
      }

      const sunX = width * 0.34 + (pointerX - 0.5) * width * 0.035 + Math.sin(time * 0.00012) * shortSide * 0.012;
      const sunY = height * 0.42 + (pointerY - 0.5) * height * 0.025;
      const sunRadius = shortSide * 0.105;
      const sunGlow = context.createRadialGradient(sunX, sunY, sunRadius * 0.15, sunX, sunY, sunRadius * 2.6);
      sunGlow.addColorStop(0, "rgba(231, 255, 252, 1)");
      sunGlow.addColorStop(0.32, "rgba(139, 235, 230, 0.9)");
      sunGlow.addColorStop(0.68, "rgba(0, 190, 196, 0.2)");
      sunGlow.addColorStop(1, "rgba(0, 190, 196, 0)");
      context.fillStyle = sunGlow;
      context.beginPath();
      context.arc(sunX, sunY, sunRadius * 2.6, 0, TAU);
      context.fill();

      context.fillStyle = "#d9f3f0";
      context.beginPath();
      context.arc(sunX, sunY, sunRadius, 0, TAU);
      context.fill();

      for (let band = 0; band < 3; band += 1) {
        const cloudY = height * (0.27 + band * 0.105);
        context.beginPath();
        context.moveTo(-30, cloudY);
        for (let x = -30; x <= width + 30; x += 18) {
          const wave = Math.sin(x * 0.012 + time * (0.00016 + band * 0.000035) + band) * (8 + band * 3);
          context.lineTo(x, cloudY + wave);
        }
        context.lineTo(width + 30, cloudY + 18 + band * 8);
        context.lineTo(-30, cloudY + 18 + band * 8);
        context.closePath();
        context.fillStyle = `rgba(3, 13, 20, ${0.13 + band * 0.055})`;
        context.fill();
      }

      const horizon = height * 0.69;
      context.beginPath();
      context.moveTo(0, height);
      context.lineTo(0, horizon);
      for (let x = 0; x <= width; x += 12) {
        const ridge =
          Math.sin(x * 0.011 + 0.8) * height * 0.027 +
          Math.sin(x * 0.027 - 1.4) * height * 0.012;
        context.lineTo(x, horizon + ridge);
      }
      context.lineTo(width, height);
      context.closePath();
      context.fillStyle = "#031015";
      context.fill();

      const vignette = context.createRadialGradient(
        width * 0.5,
        height * 0.48,
        shortSide * 0.08,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.75,
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(0, 3, 6, 0.58)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      const curtainCenter = width * (0.5 + (pointerX - 0.5) * 0.1);
      const openingHalf = width * reveal * (width < 600 ? 0.4 : 0.43);
      const leftCurtain = curtainPath("left", curtainCenter, openingHalf, time);
      const rightCurtain = curtainPath("right", curtainCenter, openingHalf, time);

      const leftShade = context.createLinearGradient(0, 0, curtainCenter, 0);
      leftShade.addColorStop(0, "#010508");
      leftShade.addColorStop(0.72, "#020d11");
      leftShade.addColorStop(1, "#03191d");
      context.fillStyle = leftShade;
      context.fill(leftCurtain.path);

      const rightShade = context.createLinearGradient(curtainCenter, 0, width, 0);
      rightShade.addColorStop(0, "#03191d");
      rightShade.addColorStop(0.28, "#020d11");
      rightShade.addColorStop(1, "#010508");
      context.fillStyle = rightShade;
      context.fill(rightCurtain.path);

      const drawEdge = (boundaryAt: (y: number) => number) => {
        context.beginPath();
        context.moveTo(boundaryAt(0), 0);
        for (let y = 0; y <= height; y += 14) context.lineTo(boundaryAt(y), y);
        context.stroke();
      };

      context.save();
      context.strokeStyle = `rgba(44, 211, 210, ${0.04 + reveal * 0.18})`;
      context.lineWidth = 1.15;
      context.shadowColor = `rgba(0, 194, 196, ${reveal * 0.2})`;
      context.shadowBlur = 14 * reveal;
      drawEdge(leftCurtain.boundaryAt);
      drawEdge(rightCurtain.boundaryAt);
      context.restore();
    };

    const render = (time: number) => {
      reveal += (revealTarget - reveal) * 0.055;
      pointerX += (targetX - pointerX) * 0.075;
      pointerY += (targetY - pointerY) * 0.075;
      drawScene(time);
      frame = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", updatePointer, { passive: true });
    window.addEventListener("pointerup", releaseTouch, { passive: true });
    window.addEventListener("pointercancel", releaseTouch, { passive: true });
    window.addEventListener("pointerleave", closeScene);
    window.addEventListener("blur", closeScene);
    resize();
    setIsReady(true);
    frame = window.requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", updatePointer);
      window.removeEventListener("pointerup", releaseTouch);
      window.removeEventListener("pointercancel", releaseTouch);
      window.removeEventListener("pointerleave", closeScene);
      window.removeEventListener("blur", closeScene);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`hero-sunset absolute inset-0 overflow-hidden${isReady ? " is-ready" : ""}`}
      aria-hidden="true"
    >
      <div className="hero-sunset__fallback absolute inset-0" />
      <canvas ref={canvasRef} className="hero-sunset__canvas absolute inset-0" />
      <div className="hero-sunset__veil absolute inset-0" />
      <div className="hero-sunset__grain absolute inset-0" />
    </div>
  );
}
