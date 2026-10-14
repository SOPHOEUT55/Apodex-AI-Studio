/**
 * Audio Recording & Transcription Client Service
 * Uses Google Gemini model: gemini-3.5-transcribe
 */

export interface TranscriptionResult {
  success: boolean;
  transcript: string;
  model: string;
  mimeType: string;
  charCount: number;
  wordCount: number;
}

/**
 * Converts a Blob to a base64 encoded string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Sends audio to server to transcribe with gemini-3.5-transcribe
 */
export async function transcribeAudioWithGemini(
  audioBlob: Blob,
  prompt?: string
): Promise<TranscriptionResult> {
  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || 'audio/webm';

  const response = await fetch('/api/audio/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioData: base64Audio,
      mimeType,
      prompt,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Audio transcription failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    success: true,
    transcript: data.transcript || '',
    model: data.model || 'gemini-3.5-transcribe',
    mimeType: data.mimeType || mimeType,
    charCount: data.charCount || (data.transcript || '').length,
    wordCount: data.wordCount || ((data.transcript || '').trim() ? (data.transcript || '').trim().split(/\s+/).length : 0),
  };
}

/**
 * Robust cross-browser microphone recorder helper
 */
export class MicrophoneRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;

  public async start(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }

    this.recordedChunks = [];
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Detect supported mime type
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg';
    }

    this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(200); // 200ms slice
    this.startTime = Date.now();
  }

  public stop(): Promise<{ blob: Blob; mimeType: string; durationSec: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('Recorder is not active.'));
        return;
      }

      const durationSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });

        // Stop all tracks to release mic light
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }

        resolve({ blob, mimeType, durationSec });
      };

      this.mediaRecorder.stop();
    });
  }

  public isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
