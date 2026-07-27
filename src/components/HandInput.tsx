import React, { useEffect, useRef } from 'react';
import { inputRefs } from '../store';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const HandTracker: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleMove = (ev: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      inputRefs.rightHand.x = clamp01(x);
      inputRefs.rightHand.y = clamp01(1 - y);
      inputRefs.rightHand.z = clamp01(1 - y);
    };

    const handleDown = () => {
      inputRefs.rightHand.pinch = true;
    };

    const handleUp = () => {
      inputRefs.rightHand.pinch = false;
    };

    node.addEventListener('pointermove', handleMove);
    node.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);

    return () => {
      node.removeEventListener('pointermove', handleMove);
      node.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }} />;
};
