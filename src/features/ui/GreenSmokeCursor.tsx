import { useEffect, useRef } from "react";

export default function GreenSmokeCursor() {
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const animate = () => {
      const ease = 0.08;
      x += (tx - x) * ease;
      y += (ty - y) * ease;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="smokeLayer" aria-hidden="true">
      <div ref={glowRef} className="smokeGlow" />
      <div className="smokeNoise" />
    </div>
  );
}