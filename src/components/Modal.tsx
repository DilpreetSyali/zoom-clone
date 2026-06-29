import type { PropsWithChildren, ReactNode } from "react";

export function Modal({ title, children, onClose }: PropsWithChildren<{ title: ReactNode; onClose: () => void }>) {
  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>{title}</h2>
          <button className="iconBtn" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
