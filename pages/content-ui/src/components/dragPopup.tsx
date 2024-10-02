import React from 'react';

interface PopupProps {
  position: { top: number; left: number };
  onAddToChat: () => void;
  onEdit: () => void;
}

export const DragPopup: React.FC<PopupProps> = ({ position, onAddToChat, onEdit }) => {
  return (
    <div
      className="absolute bg-white border border-gray-300 p-2.5 shadow-md z-50 rounded-md flex flex-row items-center space-x-2"
      style={{
        top: position.top,
        left: position.left,
      }}>
      <button onClick={onAddToChat} className="text-sm text-gray-500 hover:text-gray-700">
        Add to chat
      </button>
      <button onClick={onEdit} className="text-sm text-gray-500 hover:text-gray-700">
        Edit
      </button>
    </div>
  );
};
