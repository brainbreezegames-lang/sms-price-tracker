import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';

let isTouch = false;
if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', () => { isTouch = true; }, { passive: true, capture: true });
  window.addEventListener('mousemove', (e) => {
    if (e.movementX !== 0 || e.movementY !== 0) {
      isTouch = false;
    }
  }, { passive: true, capture: true });
}

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'right' | 'left';
  maxWidth?: number;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps & { triggerOnTouch?: boolean }> = ({
  content,
  children,
  side = 'top',
  maxWidth = 260,
  delay = 200,
  triggerOnTouch = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (isTouch && !triggerOnTouch) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = side === 'right' ? r.right :
        side === 'left' ? r.left :
          r.left + r.width / 2;
      const y = side === 'bottom' ? r.bottom :
        side === 'right' || side === 'left' ? r.top + r.height / 2 :
          r.top;
      setCoords({ x, y });
      setVisible(true);
    }, delay);
  }, [side, delay, triggerOnTouch]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible || !isTouch) return;
    const dismiss = (e: TouchEvent | MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    document.addEventListener('touchstart', dismiss, { passive: true, capture: true });
    return () => document.removeEventListener('touchstart', dismiss, { capture: true });
  }, [visible, hide]);

  const gap = 8;
  const transform =
    side === 'top' ? `translate(-50%, calc(-100% - ${gap}px))` :
      side === 'bottom' ? `translate(-50%, ${gap}px)` :
        side === 'right' ? `translate(${gap}px, -50%)` :
          `translate(calc(-100% - ${gap}px), -50%)`;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex items-center"
      >
        {children}
      </span>

      {visible && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            transform,
            zIndex: 9999,
            pointerEvents: 'none',
            maxWidth,
          }}
          className="tooltip-enter rounded-lg px-3 py-2 shadow-lg shadow-black/10 dark:shadow-black/40 whitespace-pre-wrap
            bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-600/50
            text-[12px] leading-relaxed font-normal text-slate-700 dark:text-slate-200
            backdrop-blur-sm"
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
};

export const InfoTooltip: React.FC<{
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'right' | 'left';
  className?: string;
}> = ({ content, side = 'top', className }) => (
  <Tooltip content={content} side={side} triggerOnTouch={true}>
    <span
      tabIndex={0}
      aria-label="More information"
      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full cursor-help shrink-0
        bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold leading-none select-none
        hover:bg-brand-100 dark:hover:bg-brand-400/20 hover:text-brand-700 dark:hover:text-brand-400
        transition-colors ${className ?? ''}`}
    >
      ?
    </span>
  </Tooltip>
);
