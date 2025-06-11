// components/MessageModal.js
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/MessageModal.css';

const MessageModal = ({ message, onClose, isSuccess }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className="message-modal-overlay">
      <div className="message-modal">
        <p className={isSuccess ? 'success-message' : 'error-message'}>{message}</p>
        <button onClick={onClose} className="ok-button">OK</button>
      </div>
    </div>
  );
};

export default MessageModal;