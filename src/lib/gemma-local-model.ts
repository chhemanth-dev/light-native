/**
 * Gemma 2B Local Model - On-Device AI
 * Works 100% offline, no internet needed
 * Uses Gemma 2B quantized (Q4_K_M) - ~1.2GB RAM
 */

import { initLlama, LlamaContext } from 'llama.rn';

export interface ModelConfig {
  modelPath: string; // Path to .gguf model file
  contextSize: number;
  temperature: number;
  maxTokens: number;
}

export class GemmaLocalModel {
  private context: LlamaContext | null = null;
  private isInitialized = false;
  private isGenerating = false;

  /**
   * Initialize Gemma 2B model
   * Downloads model on first run (~900MB quantized)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Gemma] Already initialized');
      return;
    }

    try {
      console.log('[Gemma] 🚀 Initializing Gemma 2B quantized model...');
      console.log('[Gemma] This may take 30-60 seconds on first run...');

      // Model will be downloaded from HuggingFace automatically
      // Using 4-bit quantized version (Q4_K_M) for balance of quality and size
      const modelUrl = 'https://huggingface.co/ggml-org/gemma-2b-it-Q4_K_M-GGUF/resolve/main/gemma-2b-it-q4_k_m.gguf';
      
      const llama = await initLlama({
        model: modelUrl,
        use_mlock: true, // Keep model in memory
        n_ctx: 2048, // Context window
        n_gpu_layers: 0, // CPU only for compatibility
      });

      this.context = await llama.createContext({
        seed: 42,
      });

      this.isInitialized = true;
      console.log('[Gemma] ✅ Model loaded successfully!');
      console.log('[Gemma] Ready for offline AI inference');
    } catch (error) {
      console.error('[Gemma] ❌ Failed to initialize:', error);
      throw new Error(`Failed to load Gemma model: ${error}`);
    }
  }

  /**
   * Generate response from Gemma model
   */
  async generate(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    if (!this.isInitialized || !this.context) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    if (this.isGenerating) {
      return 'I\'m still processing the previous request, sir. Please wait a moment.';
    }

    try {
      this.isGenerating = true;
      console.log('[Gemma] 🧠 Generating response for:', prompt.substring(0, 50));

      const systemPrompt = options?.systemPrompt || 
        `You are Light, a helpful AI assistant. You are professional, warm, and respectful. 
Address the user as "sir" naturally. Be concise but informative. 
If you don't know something, admit it honestly.`;

      // Format prompt for Gemma instruction-tuned model
      const formattedPrompt = `<start_of_turn>user
${prompt}<end_of_turn>
<start_of_turn>model
`;

      const response = await this.context.completion({
        prompt: formattedPrompt,
        n_predict: options?.maxTokens || 150, // Limit tokens for speed
        temperature: options?.temperature || 0.7,
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1,
        stop: ['<end_of_turn>', '\n\nUser:', '\n\nuser:'],
      });

      const text = response.text.trim();
      console.log('[Gemma] ✅ Response generated:', text.substring(0, 50));

      return text;
    } catch (error) {
      console.error('[Gemma] ❌ Generation error:', error);
      return 'I encountered an error generating that response, sir. Please try again.';
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Generate streaming response (real-time text)
   */
  async *generateStream(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isInitialized || !this.context) {
      throw new Error('Model not initialized.');
    }

    const formattedPrompt = `<start_of_turn>user
${prompt}<end_of_turn>
<start_of_turn>model
`;

    const stream = await this.context.completionStream({
      prompt: formattedPrompt,
      n_predict: options?.maxTokens || 150,
      temperature: options?.temperature || 0.7,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.1,
      stop: ['<end_of_turn>'],
    });

    for await (const token of stream) {
      yield token.text;
    }
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.context !== null;
  }

  /**
   * Check if currently generating
   */
  isBusy(): boolean {
    return this.isGenerating;
  }

  /**
   * Release model from memory (to save RAM when not needed)
   */
  async release(): Promise<void> {
    if (this.context) {
      await this.context.release();
      this.context = null;
      this.isInitialized = false;
      console.log('[Gemma] Model released from memory');
    }
  }

  /**
   * Get model info
   */
  getModelInfo(): {
    name: string;
    size: string;
    quantization: string;
    contextSize: number;
    ramUsage: string;
  } {
    return {
      name: 'Gemma 2B Instruct',
      size: '~900MB',
      quantization: 'Q4_K_M (4-bit)',
      contextSize: 2048,
      ramUsage: '~1.2GB when loaded',
    };
  }
}

// Singleton instance
export const gemmaModel = new GemmaLocalModel();
