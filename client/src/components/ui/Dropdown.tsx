import { clsx } from 'clsx';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DropdownProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
  panelClassName?: string;
}

/**
 * Lightweight popover: click the trigger to open, click outside or press
 * Escape to close. The trigger stays in the DOM so its onClick can toggle.
 */
export function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
  panelClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => setOpen((o) => !o);

  return (
    <div ref={rootRef} className={clsx('relative inline-block', className)}>
      {trigger({ open, toggle })}
      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute z-40 mt-1.5 min-w-56 rounded-xl border border-line bg-surface py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  onClick,
  danger,
  active,
  children,
}: {
  icon?: ReactNode;
  label?: string;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-canvas',
        danger && 'text-danger hover:bg-danger/5',
        active && 'bg-primary-100/50',
      )}
    >
      {icon && <span className="text-ink-secondary">{icon}</span>}
      {label && <span className="flex-1">{label}</span>}
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 border-t border-line" />;
}
