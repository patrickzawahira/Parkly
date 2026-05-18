// Web Speech API Type Definitions
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Voice guidance service using Web Speech API
class VoiceService {
  private synth: SpeechSynthesis | null = null;
  private recognition: SpeechRecognition | null = null;
  private isEnabled: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListeningState: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize Text-to-Speech
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }

      // Initialize Speech-to-Text
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false; // Stop after one sentence for better interaction loop
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
      this.stopListening();
    }
  }

  // --- Text to Speech ---

  speak(text: string, options?: { priority?: 'high' | 'normal'; rate?: number; pitch?: number; onEnd?: () => void }) {
    if (!this.isEnabled || !this.synth) {
      options?.onEnd?.();
      return;
    }

    // Stop any current speech
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  // --- Speech to Text ---

  startListening(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('Speech recognition not supported in this browser.');
      return;
    }

    if (this.isListeningState) {
      return; // Already listening
    }

    try {
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListeningState = false;
        onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListeningState = false;
      };

      this.recognition.start();
      this.isListeningState = true;
    } catch (e) {
      console.error('Failed to start recognition:', e);
      this.isListeningState = false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListeningState) {
      this.recognition.stop();
      this.isListeningState = false;
    }
  }

  isListening(): boolean {
    return this.isListeningState;
  }
}

export const voiceService = new VoiceService();

