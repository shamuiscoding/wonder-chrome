import { X, ChevronDown, Command } from 'lucide-react';

interface EditorProps {
  instructions: string;
  setInstructions: (instructions: string) => void;
  position: { top: number; left: number };
  onClose: () => void;
  onGenerate: () => void;
  onQuickQuestion: () => void;
  isStreaming: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  instructions,
  setInstructions,
  position,
  onClose,
  onGenerate,
  onQuickQuestion,
  isStreaming,
}) => {
  return (
    <div
      className="fixed z-50 w-[32rem] bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
      }}>
      <div className="relative pt-2 px-3">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-gray-400 hover:text-gray-200"
          aria-label="Close">
          <X size={16} />
        </button>
        <textarea
          value={instructions}
          onChange={e => {
            setInstructions(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          placeholder="Enter your instructions here..."
          className="w-full min-h-[2.5rem] bg-gray-800 text-gray-200 rounded p-2 text-xs resize-none focus:outline-none overflow-hidden"
          style={{ height: 'auto' }}
        />
      </div>
      <div className="flex justify-between items-center px-3 pb-2">
        <div className="flex flex-row space-x-2 items-center h-6">
          {instructions ? (
            <>
              <button
                onClick={onGenerate}
                onMouseUp={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="text-xs text-gray-200 hover:text-gray-100 bg-green-700 rounded-md px-2 py-1">
                {isStreaming ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={onQuickQuestion}
                onMouseUp={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="text-xs text-gray-200 hover:text-gray-100 px-2 py-1">
                Quick question
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-400">Esc to close</span>
          )}
        </div>
        <div className="flex flex-row space-x-2 items-center">
          <div className="flex items-center text-xs text-gray-400">
            <span>claude-3.5-sonnet</span>
            <ChevronDown size={14} className="ml-1" />
          </div>
          <button className="flex items-center text-xs text-gray-400 hover:text-gray-200">
            <Command size={14} className="mr-1" />
            <span>K to toggle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
