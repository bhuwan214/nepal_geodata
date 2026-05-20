import { useEffect, useRef } from "react";

const GAP = 22;
const INTERACTION_RADIUS = 69;
const DOT_BASE_COLOR = "#4a4848";
const DOT_HIGHLIGHT_COLOR = "#b3afaf";

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function mixColor(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);

  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;

  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;

  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);

  return `rgb(${r}, ${g}, ${bl})`;
}

function repelTarget(dot, mouseX, mouseY, radius) {
  const dx = mouseX - dot.ox;
  const dy = mouseY - dot.oy;
  const dist = Math.hypot(dx, dy);
  const influence = clamp01(1 - dist / radius);

  if (dist <= 0.0001 || influence <= 0) {
    return {
      tx: dot.ox,
      ty: dot.oy,
      influence,
    };
  }

  const push = influence * influence * 32;

  return {
    tx: dot.ox - (dx / dist) * push,
    ty: dot.oy - (dy / dist) * push,
    influence,
  };
}

// Kept for future use. We intentionally do not call this in the render loop.
function rippleTarget(dot, mouseX, mouseY, radius, time) {
  const dx = mouseX - dot.ox;
  const dy = mouseY - dot.oy;
  const dist = Math.hypot(dx, dy);
  const influence = clamp01(1 - dist / radius);

  if (influence <= 0) {
    return {
      tx: dot.ox,
      ty: dot.oy,
      influence,
    };
  }

  const wave = Math.sin(dist * 0.08 - time * 4) * influence * 14;
  const denom = Math.max(dist, 1);

  return {
    tx: dot.ox - (dx / denom) * wave,
    ty: dot.oy - (dy / denom) * wave,
    influence,
  };
}

function createDots(width, height) {
  const dots = [];
  const cols = Math.floor(width / GAP);
  const rows = Math.floor(height / GAP);
  const offsetX = (width - cols * GAP) / 2;
  const offsetY = (height - rows * GAP) / 2;

  for (let r = 0; r <= rows; r += 1) {
    for (let c = 0; c <= cols; c += 1) {
      const ox = offsetX + c * GAP;
      const oy = offsetY + r * GAP;
      dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 });
    }
  }

  return dots;
}

export default function DotBackgroundInteractive({ height = 420 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const dotsRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;

    if (!wrap || !canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    const resizeCanvas = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width));
      const heightPx = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(heightPx * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${heightPx}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = { width, height: heightPx };
      dotsRef.current = createDots(width, heightPx);
    };

    const onMouseMove = (event) => {
      const rect = wrap.getBoundingClientRect();
      mouseRef.current.x = event.clientX - rect.left;
      mouseRef.current.y = event.clientY - rect.top;
    };

    const onTouchMove = (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const rect = wrap.getBoundingClientRect();
      mouseRef.current.x = touch.clientX - rect.left;
      mouseRef.current.y = touch.clientY - rect.top;
    };

    const resetMouse = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    const render = () => {
      const { width, height: heightPx } = sizeRef.current;
      const dots = dotsRef.current;
      const mouse = mouseRef.current;

      // Keep ripple helper available for easy mode switch later.
      void rippleTarget;

      ctx.clearRect(0, 0, width, heightPx);
      timeRef.current += 0.016;

      for (const dot of dots) {
        // Default mode: repel. Ripple implementation exists but is intentionally not used.
        const { tx, ty, influence } = repelTarget(
          dot,
          mouse.x,
          mouse.y,
          INTERACTION_RADIUS
        );

        dot.vx += (tx - dot.x) * 0.18;
        dot.vy += (ty - dot.y) * 0.18;
        dot.vx *= 0.72;
        dot.vy *= 0.72;
        dot.x += dot.vx;
        dot.y += dot.vy;

        const radius = 1.5 + influence * 1.5;
        const alpha = 0.22 + influence * 0.78;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = mixColor(DOT_BASE_COLOR, DOT_HIGHLIGHT_COLOR, influence);
        ctx.globalAlpha = alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frameRef.current = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(wrap);

    wrap.addEventListener("mousemove", onMouseMove);
    wrap.addEventListener("mouseleave", resetMouse);
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", resetMouse);

    resizeCanvas();
    render();

    return () => {
      resizeObserver.disconnect();
      wrap.removeEventListener("mousemove", onMouseMove);
      wrap.removeEventListener("mouseleave", resetMouse);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", resetMouse);

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        height,
        background: "#ffffff",
        overflow: "hidden",
        borderRadius: 12,
        cursor: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
