import { AIModel, Message } from '../types';

export interface ChatCompletionPayload {
  model?: string;
  messages: { role: string; content: string }[];
  systemPrompt?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface StreamCallbacks {
  onReasoningChunk?: (chunk: string) => void;
  onContentChunk?: (chunk: string) => void;
  onDone?: (fullContent: string, fullReasoning: string, usage?: any) => void;
  onError?: (error: Error) => void;
}

export async function executePythonCode(
  code: string,
  input?: string
): Promise<{ stdout: string; stderr: string; exitCode: number; executionTimeMs: number; success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/run-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, input }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Python execution failed with status ' + res.status }));
      return {
        stdout: '',
        stderr: err.error || `HTTP ${res.status}`,
        exitCode: 1,
        executionTimeMs: 0,
        success: false,
        error: err.error,
      };
    }

    return await res.json();
  } catch (e: any) {
    return {
      stdout: '',
      stderr: e.message || 'Network error running Python code',
      exitCode: 1,
      executionTimeMs: 0,
      success: false,
      error: e.message,
    };
  }
}

export async function fetchAvailableModels(): Promise<AIModel[]> {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error('Failed to fetch models');
    return await res.json();
  } catch (e) {
    console.warn('Using local fallback model list:', e);
    const { AVAILABLE_MODELS } = await import('../utils/models');
    return AVAILABLE_MODELS;
  }
}

export async function checkBackendHealth(): Promise<{ status: string; models: any[] }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed: ' + res.status);
    return await res.json();
  } catch (err: any) {
    return {
      status: 'error',
      models: [],
    };
  }
}

export async function sendChatMessageStream(
  payload: ChatCompletionPayload,
  callbacks: StreamCallbacks
): Promise<void> {
  const { model, messages, systemPrompt, temperature = 0.7, max_tokens = 2048 } = payload;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        systemPrompt,
        temperature,
        max_tokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({ error: 'HTTP ' + response.status }));
      throw new Error(errJson.error || `Server responded with ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedContent = '';
    let accumulatedReasoning = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const choice = parsed.choices?.[0];
          if (!choice) continue;

          // Check for reasoning chunk
          const delta = choice.delta || {};
          if (delta.reasoning) {
            accumulatedReasoning += delta.reasoning;
            callbacks.onReasoningChunk?.(delta.reasoning);
          } else if (delta.reasoning_details && Array.isArray(delta.reasoning_details)) {
            for (const rd of delta.reasoning_details) {
              if (rd.text) {
                accumulatedReasoning += rd.text;
                callbacks.onReasoningChunk?.(rd.text);
              }
            }
          }

          // Check for regular content chunk
          if (delta.content) {
            accumulatedContent += delta.content;
            callbacks.onContentChunk?.(delta.content);
          }
        } catch {
          // ignore chunk parse errors
        }
      }
    }

    callbacks.onDone?.(accumulatedContent, accumulatedReasoning);
  } catch (error: any) {
    console.error('Error in sendChatMessageStream:', error);
    callbacks.onError?.(error);
  }
}

export async function sendChatMessageDirect(
  payload: ChatCompletionPayload
): Promise<{ content: string; reasoning?: string; usage?: any }> {
  const { model, messages, systemPrompt, temperature = 0.7, max_tokens = 2048 } = payload;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      systemPrompt,
      temperature,
      max_tokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({ error: 'HTTP ' + response.status }));
    throw new Error(errJson.error || `Server responded with ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message || {};

  return {
    content: message.content || '',
    reasoning: message.reasoning || (message.reasoning_details?.[0]?.text) || undefined,
    usage: data.usage,
  };
}
