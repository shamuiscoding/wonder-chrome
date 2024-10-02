import React from 'react';
import { Change } from 'diff';

interface DiffViewerProps {
  diffs: Change[];
  acceptChanges: () => void;
  setShowDiff: (showDiff: boolean) => void;
  position: { top: number; left: number };
  isStreaming: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffs, acceptChanges, setShowDiff, position, isStreaming }) => {
  return (
    <div
      className="fixed z-[100] w-[32rem] bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col"
      style={{ top: position.top, left: position.left }}>
      <pre className="flex-1 p-2 overflow-y-auto">
        {diffs.map((part, index) => {
          let color = 'white';
          if (part.added) color = 'green';
          else if (part.removed) color = 'red';

          return (
            <span
              key={index}
              style={{
                color,
                backgroundColor: part.added
                  ? 'rgba(0, 255, 0, 0.1)'
                  : part.removed
                    ? 'rgba(255, 0, 0, 0.1)'
                    : 'transparent',
                display: 'block',
              }}>
              {part.removed ? `- ${part.value}` : part.added ? `+ ${part.value}` : `  ${part.value}`}
            </span>
          );
        })}
      </pre>
      <div className="flex justify-end p-2 bg-gray-700">
        {isStreaming ? (
          <p className="text-white">Generating...</p>
        ) : (
          <div className="flex flex-row space-x-2">
            <button
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                acceptChanges();
              }}
              onMouseUp={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="hover:bg-green-600 transition-colors text-white">
              Accept Changes
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                setShowDiff(false);
              }}
              onMouseUp={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="hover:bg-red-600 transition-colors text-white">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
