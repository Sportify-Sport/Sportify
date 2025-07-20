import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/modal.css';

const Modal = ({ onClose, children, isOpen }) => {
  // Debug modal open/close state
  useEffect(() => {
    console.log('Modal isOpen:', isOpen);
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        console.log('Escape key pressed, calling onClose');
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  // Ensure modal-root exists
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error('Modal root element not found');
    return null;
  }

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        console.log('Modal overlay clicked');
        onClose();
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Modal content clicked, stopping propagation');
        }}
      >
        <button
          className="modal-close"
          onClick={(e) => {
            e.preventDefault();
            console.log('Close button clicked');
            onClose();
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;