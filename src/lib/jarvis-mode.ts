/**
 * JARVIS Mode - Continuous Listening
 * Like Tony Stark's JARVIS - always listening, instant response, natural interruption
 * 
 * Features:
 * - Always listening (no need to say "Hey Light" repeatedly)
 * - Natural interruption (just start talking)
 * - Continuous conversation (remembers context)
 * - No manual stop needed
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { assistant } from './assistant';
import { pauseWakeWord, resumeWakeWord } from './wakeword';

const SpeechModule = Platform.OS === 'android' ? NativeModules.SpeechModule : null;
let _emitter: NativeEventEmitter | null = null;

export class JarvisMode {
  private active = false;
  private listening = false;
  private speaking = false;
  private recognizer: any = null;
  private silenceTimeout: any = null;
  private lastSpeechTime = 0;
  
  /**
   * Start JARVIS mode - continuous listening
   */
  async start(): Promise<void> {
    if (this.active) {
      console.log('[JARVIS] Already active');
      return;
    }
    
    if (!SpeechModule) {
      console.error('[JARVIS] Speech module not available');
      return;
    }
    
    this.active = true;
    console.log('[JARVIS] 🤖 JARVIS mode activated - continuous listening');
    
    // Pause wake word (we're now always listening)
    pauseWakeWord();
    
    // Start continuous listening
    this.startContinuousListening();
  }
  
  /**
   * Stop JARVIS mode
   */
  async stop(): Promise<void> {
    if (!this.active) return;
    
    this.active = false;
    this.listening = false;
    this.speaking = false;
    
    console.log('[JARVIS] 🛑 JARVIS mode deactivated');
    
    // Stop listening
    if (SpeechModule) {
      try {
        await SpeechModule.stopListening();
      } catch (error) {
        console.error('[JARVIS] Error stopping listening:', error);
      }
    }
    
    // Clear timeouts
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    // Resume wake word
    resumeWakeWord();
  }
  
  /**
   * Start continuous speech recognition
   */
  private async startContinuousListening(): Promise<void> {
    if (!this.active || this.listening) return;
    
    this.listening = true;
    console.log('[JARVIS] 👂 Listening...');
    
    if (!_emitter && SpeechModule) {
      _emitter = new NativeEventEmitter(SpeechModule);
    }
    
    // Listen for partial results (live transcription)
    _emitter?.addListener('onSpeechPartial', (data: { transcript: string }) => {
      this.onPartialSpeech(data.transcript);
    });
    
    // Listen for final results
    _emitter?.addListener('onSpeechResult', async (data: { transcript: string }) => {
      await this.onFinalSpeech(data.transcript);
    });
    
    // Listen for errors
    _emitter?.addListener('onSpeechError', (error: any) => {
      console.log('[JARVIS] Speech error, restarting...', error);
      this.restartListening();
    });
    
    // Listen for end of speech
    _emitter?.addListener('onSpeechEnd', () => {
      console.log('[JARVIS] Speech ended, restarting...');
      this.restartListening();
    });
    
    try {
      await SpeechModule.startListening();
    } catch (error) {
      console.error('[JARVIS] Error starting listening:', error);
      this.restartListening();
    }
  }
  
  /**
   * Handle partial speech (live transcription)
   */
  private onPartialSpeech(transcript: string): void {
    if (!transcript || transcript.trim().length === 0) return;
    
    console.log('[JARVIS] Partial:', transcript);
    this.lastSpeechTime = Date.now();
    
    // Reset silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    
    // Set new silence timeout (if silent for 2 seconds, process the command)
    this.silenceTimeout = setTimeout(() => {
      if (transcript.trim().length > 0) {
        this.onFinalSpeech(transcript);
      }
    }, 2000);
  }
  
  /**
   * Handle final speech (complete command)
   */
  private async onFinalSpeech(transcript: string): Promise<void> {
    if (!transcript || transcript.trim().length === 0) return;
    
    // Clear silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    const command = transcript.trim();
    console.log('[JARVIS] Command:', command);
    
    // Check if it's a stop command
    if (this.isStopCommand(command)) {
      console.log('[JARVIS] Stop command detected');
      await assistant.endSession();
      this.speaking = false;
      this.restartListening();
      return;
    }
    
    // Process the command
    this.speaking = true;
    
    try {
      await assistant.handleInput(command);
    } catch (error) {
      console.error('[JARVIS] Error handling command:', error);
    }
    
    // Wait a bit for response to complete, then resume listening
    setTimeout(() => {
      this.speaking = false;
      this.restartListening();
    }, 1000);
  }
  
  /**
   * Check if command is a stop/cancel command
   */
  private isStopCommand(command: string): boolean {
    const lower = command.toLowerCase();
    const stopWords = [
      'stop', 'cancel', 'nevermind', 'never mind', 'forget it',
      'shut up', 'be quiet', 'that\'s enough', 'enough'
    ];
    
    return stopWords.some(word => lower.includes(word));
  }
  
  /**
   * Restart listening after a brief pause
   */
  private restartListening(): void {
    if (!this.active) return;
    
    this.listening = false;
    
    // Brief pause to avoid rapid restarts
    setTimeout(() => {
      if (this.active && !this.listening) {
        this.startContinuousListening();
      }
    }, 500);
  }
  
  /**
   * Check if JARVIS mode is active
   */
  isActive(): boolean {
    return this.active;
  }
  
  /**
   * Check if currently listening
   */
  isListening(): boolean {
    return this.listening;
  }
  
  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.speaking;
  }
}

// Singleton instance
export const jarvisMode = new JarvisMode();
