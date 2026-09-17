import React, { useEffect, useRef, useState } from 'react';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { renderCardToCanvas } from '../utils/canvasRenderer';

interface CardCanvasProps {
  question: GKQuestion;
  designConfig: CardDesignConfig;
  className?: string;
  onRenderComplete?: () => void;
}

export const CardCanvas: React.FC<CardCanvasProps> = ({
  question,
  designConfig,
  className = '',
  onRenderComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    setIsRendering(true);

    const timer = setTimeout(async () => {
      if (canvasRef.current && !isCancelled) {
        try {
          await renderCardToCanvas(canvasRef.current, question, designConfig, 1920, 1080);
          if (!isCancelled) {
            setIsRendering(false);
            if (onRenderComplete) onRenderComplete();
          }
        } catch (err) {
          console.error('Error rendering card canvas:', err);
          if (!isCancelled) setIsRendering(false);
        }
      }
    }, 40); // 40ms debounce to keep typing responsive

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [question, designConfig, onRenderComplete]);

  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200/80 bg-white ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain block select-none"
        style={{ imageRendering: 'auto' }}
      />
      {isRendering && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none transition-opacity duration-200">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Updating Preview...
          </div>
        </div>
      )}
    </div>
  );
};
