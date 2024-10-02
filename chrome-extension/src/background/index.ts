/// <reference types="vite/client" />

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'openaiStream') {
    port.onMessage.addListener(async msg => {
      if (msg.type === 'START_STREAM') {
        const { requestType, text, userMessage } = msg;
        let prompt = '';

        // Customize the prompt based on the request type
        if (requestType === 'PROCESS_TEXT') {
          prompt = `Please modify the following text based on instructions. Only output the modified text. Do not include any other text or comments.\n\n${text}\n\nInstructions: ${userMessage}`;
        } else if (requestType === 'QUICK_QUESTION') {
          prompt = `Please answer the following question based on the provided text. Only output the answer. Do not include any other text or comments.\n\n${text}\n\nQuestion: ${userMessage}`;
        } else {
          port.postMessage({ type: 'STREAM_ERROR', error: 'Unknown request type.' });
          return;
        }

        try {
          const stream = await callOpenAIStream(prompt);
          if (stream) {
            const reader = stream.getReader();
            const decoder = new TextDecoder('utf-8');
            let doneReading = false;
            let buffer = '';

            while (!doneReading) {
              const { value, done } = await reader.read();
              doneReading = done;
              if (value) {
                buffer += decoder.decode(value, { stream: true });

                // Split the buffer by newlines to handle multiple data chunks
                const lines = buffer.split('\n');

                // Keep the last partial line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmedLine = line.trim();

                  // Ignore empty lines
                  if (trimmedLine === '') continue;

                  if (trimmedLine.startsWith('data: ')) {
                    const dataStr = trimmedLine.replace(/^data: /, '').trim();

                    if (dataStr === '[DONE]') {
                      doneReading = true;
                      port.postMessage({ type: 'STREAM_COMPLETE' });
                      break;
                    }

                    try {
                      const chunk = JSON.parse(dataStr);
                      const content = chunk.choices[0]?.delta?.content || '';

                      if (content) {
                        port.postMessage({ type: 'STREAM_DATA', data: content });
                      }
                    } catch (parseError) {
                      console.error('Failed to parse chunk:', parseError);
                      port.postMessage({ type: 'STREAM_ERROR', error: 'Failed to parse response from OpenAI.' });
                      doneReading = true;
                      break;
                    }
                  }
                }
              }
            }

            // Handle any remaining buffer after the loop ends
            if (buffer.trim() !== '' && buffer.trim() !== '[DONE]') {
              const trimmedBuffer = buffer.trim();
              if (trimmedBuffer.startsWith('data: ')) {
                const dataStr = trimmedBuffer.replace(/^data: /, '').trim();
                if (dataStr !== '[DONE]') {
                  try {
                    const chunk = JSON.parse(dataStr);
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                      port.postMessage({ type: 'STREAM_DATA', data: content });
                    }
                  } catch (parseError) {
                    console.error('Failed to parse remaining buffer:', parseError);
                  }
                }
              }
            }
          } else {
            console.error('Failed to get stream from OpenAI');
            port.postMessage({ type: 'STREAM_ERROR', error: 'Failed to get stream from OpenAI' });
          }
        } catch (error) {
          port.postMessage({ type: 'STREAM_ERROR', error: (error as Error).message });
        }
      }
    });
  }
});

// Function to call OpenAI API with streaming
async function callOpenAIStream(prompt: string) {
  // Fetch is used as OpenAI SDK is not fully compatible with browser environment
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Ensure the model name is correct
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  return response.body; // This is a ReadableStream
}
