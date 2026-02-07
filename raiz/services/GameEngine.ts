
import { GameStatus, GameState, ScheduledGame, Card } from '../types';
import { tts } from './TTSService';

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export class GameEngine {
  private static instance: GameEngine;
  private state: GameState;
  private observers: ((state: GameState) => void)[] = [];
  private schedulerInterval: any = null;
  
  private allCardsInPlay: Card[] = [];
  private nextScheduledGame: ScheduledGame | null = null;
  private currentRevenue: number = 0;
  private announcedMinutes: Set<number> = new Set();

  private readonly BALL_INTERVAL = 6000; 
  private readonly CELEBRATION_PAUSE = 15000; 
  private readonly INTRO_PAUSE = 10000;

  private constructor() {
    this.state = this.getInitialState();
    this.startScheduler();
    this.startSync();
  }

  public static getInstance(): GameEngine {
    if (!GameEngine.instance) GameEngine.instance = new GameEngine();
    return GameEngine.instance;
  }

  private getInitialState(): GameState {
    return {
      status: GameStatus.SCHEDULED,
      drawnNumbers: [],
      currentBall: null,
      prizes: { quadra: 0, linha: 0, bingo: 0, acumulado: 0 },
      currentPrizeType: 'QUADRA',
      ballCount: 0,
      nextGameTime: null,
      currentSeriesPrice: 10,
      lastWinner: null,
      isEntryLocked: false
    };
  }

  private startScheduler() {
    if (this.schedulerInterval) clearInterval(this.schedulerInterval);
    this.schedulerInterval = setInterval(() => {
      this.checkProximityAnnouncements();
      
      if (this.state.status !== GameStatus.SCHEDULED || !this.nextScheduledGame) return;
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime === this.nextScheduledGame.time) {
        this.startGame();
      }
    }, 10000);
  }

  private checkProximityAnnouncements() {
    if (this.state.status !== GameStatus.SCHEDULED || !this.nextScheduledGame) return;
    
    const now = new Date();
    const [h, m] = this.nextScheduledGame.time.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    
    const diffMs = target.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins > 0 && diffMins <= 3 && !this.announcedMinutes.has(diffMins)) {
      const msg = diffMins === 1 
        ? "Atenção jogadores! Falta apenas um minuto para o início da nossa próxima mesa. Garante já suas cartelas!" 
        : `Atenção! Faltam ${diffMins} minutos para o início do próximo sorteio!`;
      tts.speak(msg, true);
      this.announcedMinutes.add(diffMins);
    }
  }

  private startSync() {
    setInterval(() => this.notify(), 1000);
  }

  public subscribe(observer: (state: GameState) => void) {
    this.observers.push(observer);
    observer(this.state);
    return () => { this.observers = this.observers.filter(o => o !== observer); };
  }

  private notify() {
    this.observers.forEach(o => o({ ...this.state }));
  }

  public setNextScheduledGame(game: ScheduledGame | null) {
    if (this.nextScheduledGame?.time !== game?.time) {
      this.announcedMinutes.clear();
    }
    this.nextScheduledGame = game;
    this.state.nextGameTime = game ? game.time : null;
    this.state.currentSeriesPrice = game ? game.price : 10;
    this.state.isManualCurrent = game ? game.isManual : false;
    this.updatePrizesFromRevenue();
  }

  public setRevenue(revenue: number) {
    this.currentRevenue = revenue;
    this.updatePrizesFromRevenue();
  }

  public updatePrizes(manualPrizes: any) {
    this.state.prizes = { ...this.state.prizes, ...manualPrizes };
    this.notify();
  }

  private updatePrizesFromRevenue() {
    // CORREÇÃO FINAL: Premiação dinâmica 100% baseada na arrecadação real da mesa
    // Quadra: 10% | Linha: 15% | Bingo: 40% | Acumulado: 10%
    if (this.state.isManualCurrent && this.nextScheduledGame?.manualPrizes) {
      this.state.prizes = {
        quadra: this.nextScheduledGame.manualPrizes.quadra,
        linha: this.nextScheduledGame.manualPrizes.linha,
        bingo: this.nextScheduledGame.manualPrizes.bingo,
        acumulado: this.currentRevenue * 0.1
      };
    } else {
      this.state.prizes = {
        quadra: this.currentRevenue * 0.1,
        linha: this.currentRevenue * 0.15,
        bingo: this.currentRevenue * 0.4,
        acumulado: this.currentRevenue * 0.1
      };
    }
  }

  public registerCards(cards: Card[]) {
    const existingIds = new Set(this.allCardsInPlay.map(c => c.id));
    const newCards = cards.filter(c => !existingIds.has(c.id));
    this.allCardsInPlay.push(...newCards);
  }

  public async startGame() {
    if (this.state.status === GameStatus.PLAYING) return;

    this.state.status = GameStatus.WAITING;
    this.state.isEntryLocked = true;
    this.state.drawnNumbers = [];
    this.state.ballCount = 0;
    this.state.currentBall = null;
    this.state.lastWinner = null;
    this.state.currentPrizeType = 'QUADRA';

    const welcomeMsg = `Atenção! Mesa trancada. Bem-vindos a mais uma rodada! Os prêmios de hoje são: R$ ${this.state.prizes.quadra.toFixed(2)} para Quadra, R$ ${this.state.prizes.linha.toFixed(2)} para Linha e R$ ${this.state.prizes.bingo.toFixed(2)} para o grande Bingo! Boa sorte a todos!`;
    tts.speak(welcomeMsg, true);
    
    await new Promise(r => setTimeout(r, this.INTRO_PAUSE));
    
    this.state.status = GameStatus.PLAYING;
    this.runGameLoop();
  }

  private async runGameLoop() {
    const balls = Array.from({ length: 90 }, (_, i) => i + 1);
    const random = new SeededRandom(Date.now());
    const shuffled = [...balls].sort(() => random.next() - 0.5);

    while (this.state.status === GameStatus.PLAYING && shuffled.length > 0) {
      const ball = shuffled.shift()!;
      this.state.currentBall = ball;
      this.state.drawnNumbers.push(ball);
      this.state.ballCount++;
      
      this.narrateBall(ball);
      this.notify();

      const winner = this.checkWinners();
      if (winner) {
        await this.handleWin(winner);
        if (this.state.currentPrizeType === 'FINISHED') break;
      }

      await new Promise(r => setTimeout(r, this.BALL_INTERVAL));
    }

    this.finishGame();
  }

  private narrateBall(ball: number) {
    let prefix = '';
    if (ball <= 15) prefix = 'B ';
    else if (ball <= 30) prefix = 'I ';
    else if (ball <= 45) prefix = 'N ';
    else if (ball <= 60) prefix = 'G ';
    else prefix = 'O ';
    tts.speak(`${prefix} ${ball}`, true);
  }

  private checkWinners(): { name: string; type: string; card: Card } | null {
    const drawn = new Set(this.state.drawnNumbers);

    for (const card of this.allCardsInPlay) {
      if (this.state.currentPrizeType === 'QUADRA') {
        for (const row of card.numbers) {
          if (row.filter(n => n !== 0 && drawn.has(n)).length >= 4) {
            return { name: card.userName || 'Jogador', type: 'QUADRA', card };
          }
        }
      } else if (this.state.currentPrizeType === 'LINHA') {
        for (const row of card.numbers) {
          if (row.filter(n => n !== 0 && drawn.has(n)).length >= 5) {
            return { name: card.userName || 'Jogador', type: 'LINHA', card };
          }
        }
      } else if (this.state.currentPrizeType === 'BINGO') {
        const allNums = card.numbers.flat().filter(n => n !== 0);
        if (allNums.every(n => drawn.has(n))) {
          return { name: card.userName || 'Jogador', type: 'BINGO', card };
        }
      }
    }
    return null;
  }

  private async handleWin(winner: { name: string; type: string; card: Card }) {
    this.state.lastWinner = { 
      name: winner.name, 
      prize: winner.type,
      card: winner.card
    };
    
    tts.speak(`BINGO! Temos um ganhador para ${winner.type}! Meus parabéns ${winner.name}! Conferindo a cartela vencedora.`, true);
    
    this.notify();
    await new Promise(r => setTimeout(r, this.CELEBRATION_PAUSE));
    
    this.state.lastWinner = null;
    if (winner.type === 'QUADRA') this.state.currentPrizeType = 'LINHA';
    else if (winner.type === 'LINHA') this.state.currentPrizeType = 'BINGO';
    else if (winner.type === 'BINGO') this.state.currentPrizeType = 'FINISHED';
    
    this.notify();
  }

  public finishGame() {
    this.state.status = GameStatus.FINISHED;
    this.allCardsInPlay = [];
    this.announcedMinutes.clear();
    this.notify();
    setTimeout(() => {
      this.state = this.getInitialState();
      this.notify();
    }, 5000);
  }

  public stopGame() {
    this.state.status = GameStatus.FINISHED;
    this.finishGame();
  }

  public toggleEmergencyUnlock() {
    this.state.isEntryLocked = !this.state.isEntryLocked;
    this.notify();
  }

  public getState() { return this.state; }
}

export const engine = GameEngine.getInstance();
