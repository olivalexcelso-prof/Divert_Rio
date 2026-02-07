
class TTSService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  public enabled: boolean = true;
  public volume: number = 0.9;
  private queue: string[] = [];
  private speaking: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoice();
    }
  }

  private loadVoice() {
    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.lang.includes('pt') && v.name.toLowerCase().includes('female')) 
                 || voices.find(v => v.lang.includes('pt'))
                 || voices[0];
  }

  public speak(text: string, priority: boolean = false) {
    if (!this.enabled || !this.synth) return;
    
    if (priority) {
      this.synth.cancel();
      this.queue = [];
      this.processSpeak(text);
      return;
    }

    this.queue.push(text);
    if (!this.speaking) {
      this.next();
    }
  }

  private next() {
    if (this.queue.length === 0) {
      this.speaking = false;
      return;
    }
    const text = this.queue.shift()!;
    this.processSpeak(text);
  }

  private processSpeak(text: string) {
    this.speaking = true;
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.volume = this.volume;
    utterance.onend = () => this.next();
    utterance.onerror = () => this.next();
    this.synth.speak(utterance);
  }

  public setVolume(val: number) {
    this.volume = val;
  }

  public toggle(state: boolean) {
    this.enabled = state;
    if (!state) this.synth.cancel();
  }
}

export const tts = new TTSService();
