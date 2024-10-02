import React, { useState, useEffect, useRef, useCallback } from 'react';
// Removed unused imports
import { DragPopup } from './components/dragPopup';
import { Editor } from './components/editor';

interface Position {
  top: number;
  left: number;
}

const App: React.FC = () => {
  const [selectedText, setSelectedText] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState<Position>({ top: 0, left: 0 });
  const [editorPosition, setEditorPosition] = useState<Position>({ top: 0, left: 0 });
  const [streamedResponse, setStreamedResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use useRef to store the port, ensuring it's persistent across renders
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const selectedRangeRef = useRef<Range | null>(null);
  const diffGeneratedDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize port connection once when the component mounts
    portRef.current = chrome.runtime.connect({ name: 'openaiStream' });

    // Listener for incoming messages
    const handleMessage = (message: any) => {
      switch (message.type) {
        case 'STREAM_DATA':
          setStreamedResponse(prev => {
            const newStream = prev + message.data;
            return newStream;
          });
          break;
        case 'STREAM_COMPLETE':
          setIsStreaming(false);
          break;
        case 'STREAM_ERROR':
          setError(message.error);
          setIsStreaming(false);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    };

    portRef.current.onMessage.addListener(handleMessage);

    // Cleanup on unmount
    return () => {
      if (portRef.current) {
        portRef.current.disconnect();
      }
    };
  }, []);

  // Handle text selection and display popup
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const selected = selection.toString();
        const range = selection.getRangeAt(0);
        selectedRangeRef.current = range.cloneRange();
        const rect = range.getBoundingClientRect();
        const position: Position = {
          top: rect.top + window.scrollY + rect.height,
          left: rect.left + window.scrollX,
        };

        setSelectedText(selected);
        setUserInstructions('');
        setPopupPosition(position);
        setPopupVisible(true);
      } else {
        setPopupVisible(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Function to send stream request
  const sendStreamRequest = useCallback(
    (type: 'PROCESS_TEXT' | 'QUICK_QUESTION') => {
      if (!portRef.current) {
        console.error('Port is not initialized.');
        return;
      }

      // Reset previous responses and errors
      setStreamedResponse('');
      setError(null);
      setIsStreaming(true);
      setPopupVisible(false);

      // Send the appropriate message to start streaming
      portRef.current.postMessage({
        type: 'START_STREAM',
        requestType: type,
        text: selectedText,
        userMessage: userInstructions,
      });
    },
    [selectedText, userInstructions],
  );

  // Handle streaming and update the DOM incrementally
  useEffect(() => {
    if (!selectedRangeRef.current) return;

    const range = selectedRangeRef.current;
    const createDiffContainer = () => {
      const diffContainer = document.createElement('div');
      diffContainer.className = 'diff-container';
      return diffContainer;
    };

    const createContentDiv = (className: string, styles: Partial<CSSStyleDeclaration>) => {
      const div = document.createElement('div');
      div.className = className;
      Object.assign(div.style, styles);
      return div;
    };

    if (!diffGeneratedDivRef.current) {
      const selectedContent = range.extractContents();
      const diffContainer = createDiffContainer();

      const diffOriginalDiv = createContentDiv('diff-original', {
        color: '#000',
        backgroundColor: '#e6ffec',
        borderLeft: '4px solid #2cbe4e',
        paddingLeft: '10px',
      });
      diffOriginalDiv.appendChild(selectedContent);

      const diffGeneratedDiv = createContentDiv('diff-generated', {
        color: '#000',
        backgroundColor: '#ffecec',
        borderLeft: '4px solid #d73a49',
        paddingLeft: '10px',
      });
      diffGeneratedDiv.innerText = streamedResponse;

      diffContainer.appendChild(diffOriginalDiv);
      diffContainer.appendChild(diffGeneratedDiv);

      // Insert the diff container at the position of the range
      range.insertNode(diffContainer);

      // Save reference to the generated div for updating
      diffGeneratedDivRef.current = diffGeneratedDiv;

      // Clear the selection
      window.getSelection()?.removeAllRanges();
    } else {
      // Streaming in progress, update the generated content
      if (diffGeneratedDivRef.current) {
        diffGeneratedDivRef.current.innerText = streamedResponse;
      }
    }
  }, [streamedResponse]);

  // Clean up after streaming is complete
  useEffect(() => {
    if (!isStreaming && diffGeneratedDivRef.current) {
      // Optionally, you can perform any additional actions here after streaming is complete
      // For example, reset the selected range
      selectedRangeRef.current = null;
    }
  }, [isStreaming]);

  // Handlers for Generate and Quick Question actions
  const onGenerate = () => {
    sendStreamRequest('PROCESS_TEXT');
  };

  const onQuickQuestion = () => {
    sendStreamRequest('QUICK_QUESTION');
  };

  const resetState = useCallback(() => {
    console.log('resetState');

    setPopupVisible(false);
    setEditorVisible(false);
    setSelectedText('');
    setUserInstructions('');
    setStreamedResponse('');
    setIsStreaming(false);
    setError(null);
    setPopupPosition({ top: 0, left: 0 });
    setEditorPosition({ top: 0, left: 0 });
    selectedRangeRef.current = null;
    diffGeneratedDivRef.current = null;
  }, []);

  return (
    <>
      {popupVisible && !editorVisible && (
        <DragPopup
          position={popupPosition}
          onAddToChat={() => {
            console.log('add to chat');
          }}
          onEdit={() => {
            setEditorVisible(true);
            setPopupVisible(false);
            setEditorPosition(popupPosition);
          }}
        />
      )}
      {editorVisible && (
        <Editor
          instructions={userInstructions}
          setInstructions={setUserInstructions}
          position={editorPosition}
          onClose={resetState}
          onGenerate={onGenerate}
          onQuickQuestion={onQuickQuestion}
          isStreaming={isStreaming}
        />
      )}
    </>
  );
};

export default App;
