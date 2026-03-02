'use client';

import { useReducer, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
  correction?: {
    hasErrors: boolean;
    corrected: string;
    errors: Array<{
      type: string;
      original: string;
      correction: string;
      explanation: string;
    }>;
    feedback: string;
  };
}

type Action =
  | { type: 'ADD_USER_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'ADD_PROCESSING_MESSAGE'; payload: { id: string } }
  | { type: 'UPDATE_ASSISTANT_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'UPDATE_CORRECTION'; payload: { id: string; correction: Message['correction'] } }
  | { type: 'CLEAR_MESSAGES' };

interface SendMessageResult {
  userId: string;
  assistantId: string;
  response: string | null;
}

function messagesReducer(state: Message[], action: Action): Message[] {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return [
        ...state,
        {
          id: action.payload.id,
          role: 'user',
          content: action.payload.content,
          timestamp: new Date(),
        },
      ];
    case 'ADD_PROCESSING_MESSAGE':
      return [
        ...state,
        {
          id: action.payload.id,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isProcessing: true,
        },
      ];
    case 'UPDATE_ASSISTANT_MESSAGE':
      return state.map((msg) =>
        msg.id === action.payload.id
          ? { ...msg, content: action.payload.content, isProcessing: false }
          : msg
      );
    case 'UPDATE_CORRECTION':
      return state.map((msg) =>
        msg.id === action.payload.id ? { ...msg, correction: action.payload.correction } : msg
      );
    case 'CLEAR_MESSAGES':
      return [];
    default:
      return state;
  }
}

export function useConversation(sessionId: string) {
  const [messages, dispatch] = useReducer(messagesReducer, []);

  const addUserMessage = useCallback((content: string): string => {
    const id = `user-${Date.now()}`;
    dispatch({ type: 'ADD_USER_MESSAGE', payload: { id, content } });
    return id;
  }, []);

  const addProcessingMessage = useCallback(() => {
    const id = `assistant-${Date.now()}`;
    dispatch({ type: 'ADD_PROCESSING_MESSAGE', payload: { id } });
    return id;
  }, []);

  const updateAssistantMessage = useCallback((id: string, content: string) => {
    dispatch({ type: 'UPDATE_ASSISTANT_MESSAGE', payload: { id, content } });
  }, []);

  const updateUserMessageCorrection = useCallback((id: string, correction: Message['correction']) => {
    dispatch({ type: 'UPDATE_CORRECTION', payload: { id, correction } });
  }, []);

  const sendMessage = useCallback(
    async (text: string, onEarlyResponse?: (response: string, assistantId: string) => void): Promise<SendMessageResult> => {
      const userId = addUserMessage(text);
      const assistantId = addProcessingMessage();
      let response: string | null = null;

      try {
        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
        });

        const data = await apiResponse.json();
        
        if (data.success) {
          response = data.response;
          // Call onEarlyResponse IMMEDIATELY - start TTS before any other work
          // This ensures TTS fetch begins the moment we have the response
          if (onEarlyResponse) {
            // Don't await - let TTS start in parallel
            onEarlyResponse(data.response, assistantId);
          }
          // UI update happens after TTS has already started
          updateAssistantMessage(assistantId, data.response);
        } else {
          const errorMsg = 'Sorry, I encountered an error. Please try again.';
          if (onEarlyResponse) {
            onEarlyResponse(errorMsg, assistantId);
          }
          updateAssistantMessage(assistantId, errorMsg);
          response = errorMsg;
        }
      } catch (error) {
        console.error('Chat error:', error);
        const errorMsg = 'Sorry, I encountered an error. Please try again.';
        if (onEarlyResponse) {
          onEarlyResponse(errorMsg, assistantId);
        }
        updateAssistantMessage(assistantId, errorMsg);
        response = errorMsg;
      }

      return { userId, assistantId, response };
    },
    [sessionId, addUserMessage, addProcessingMessage, updateAssistantMessage]
  );

  const analyzeText = useCallback(async (text: string, messageId: string) => {
    try {
      const response = await fetch('/api/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      
      // Debug: log correction results
      console.log('[analyzeText] Correction result:', {
        hasErrors: data.hasErrors,
        errorCount: data.errors?.length || 0,
        errors: data.errors
      });

      if (data.success) {
        updateUserMessageCorrection(messageId, {
          hasErrors: data.hasErrors,
          corrected: data.corrected,
          errors: data.errors,
          feedback: data.feedback,
        });
        
        // Return the correction result for stats tracking
        return {
          hasErrors: data.hasErrors,
          corrected: data.corrected,
          errors: data.errors,
          feedback: data.feedback,
        };
      }
      return null;
    } catch (error) {
      console.error('Correction error:', error);
      return null;
    }
  }, [updateUserMessageCorrection]);

  const clearMessages = useCallback(async () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    await fetch(`/api/chat?sessionId=${sessionId}`, { method: 'DELETE' });
  }, [sessionId]);

  return {
    messages,
    sendMessage,
    analyzeText,
    clearMessages,
  };
}
