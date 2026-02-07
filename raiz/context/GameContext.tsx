
import { Card, GameStatus, User, GameState, Transaction, ScheduledGame, AutoScheduleConfig } from '../types';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { engine } from '../services/GameEngine';
import { CardGenerator } from '../services/CardGenerator';

interface GameContextType {
  user: User | null;
  users: User[];
  gameState: GameState;
  login: (whatsapp: string, pass: string) => Promise<boolean>;
  adminLogin: (pass: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  buySeries: (quantity: number) => Promise<boolean>;
  deposit: (amount: number) => void;
  withdraw: (amount: number, data: { name: string, cpf: string, pix: string }) => Promise<boolean>;
  userCards: Card[];
  transactions: Transaction[];
  adminConfig: any;
  updateAdminConfig: (newConfig: any) => void;
  ranking: any[];
  generateFakes: () => void;
  updateUserBalance: (userId: string, newBalance: number) => void;
  seriesPrice: number;
  updateSeriesPrice: (price: number) => void;
  autoSchedule: AutoScheduleConfig;
  manualGames: ScheduledGame[];
  updateAutoSchedule: (config: AutoScheduleConfig) => void;
  addManualGame: (game: Partial<ScheduledGame>) => void;
  removeManualGame: (id: string) => void;
  fullSchedule: ScheduledGame[];
  updateGameStatePrizes: (prizes: any) => void;
  financials: { bruto: number; pagos: number; lucro: number; doacoes: number; };
  toggleEmergencyUnlock: () => void;
  isProcessingPurchase: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const KEYS = {
  USERS: 'bingo_pro_users_v12',
  TRANS: 'bingo_pro_trans_v12',
  CONFIG: 'bingo_pro_config_v12', 
  PRICE: 'bingo_pro_series_price_v12',
  AUTO: 'bingo_pro_auto_v12',
  MANUAL: 'bingo_pro_manual_v12',
  CARDS: 'bingo_pro_cards_v12',
  CURRENT_USER: 'bingo_pro_session_v12'
};

const safeJSON = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) { return fallback; }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => safeJSON(KEYS.USERS, []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => safeJSON(KEYS.TRANS, []));
  const [userCards, setUserCards] = useState<Card[]>(() => safeJSON(KEYS.CARDS, []));
  const [seriesPrice, setSeriesPrice] = useState<number>(() => Number(localStorage.getItem(KEYS.PRICE)) || 10.0);
  const [currentUser, setCurrentUser] = useState<User | null>(() => safeJSON(KEYS.CURRENT_USER, null));
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  
  const [adminConfig, setAdminConfig] = useState(() => safeJSON(KEYS.CONFIG, {
    bingoName: 'BINGO MASTER PRO',
    logoUrl: '',
    faviconUrl: '',
    pixKey: 'financeiro@bingo.com',
    withdrawWhatsapp: '+5511999999999',
    bonusAmount: 10.0,
    fakeNames: 'Ricardo, Ana, Bruno, Carlos, Diana, Edu, Fabio, Gisele, Helio, Igor',
    bgLogin: 'https://images.unsplash.com/photo-1518893063132-36e46dbe2428?q=80&w=2000',
    bgRoom: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000',
    bgOpacity: 0.15
  }));

  const [autoSchedule, setAutoSchedule] = useState<AutoScheduleConfig>(() => safeJSON(KEYS.AUTO, {
    firstGameTime: '10:00',
    intervalMinutes: 30,
    seriesPrice: 10,
    lastGameTime: '23:30',
    isEnabled: true
  }));

  const [manualGames, setManualGames] = useState<ScheduledGame[]>(() => safeJSON(KEYS.MANUAL, []));

  useEffect(() => {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.TRANS, JSON.stringify(transactions));
    localStorage.setItem(KEYS.CARDS, JSON.stringify(userCards));
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(adminConfig));
    localStorage.setItem(KEYS.PRICE, seriesPrice.toString());
    localStorage.setItem(KEYS.AUTO, JSON.stringify(autoSchedule));
    localStorage.setItem(KEYS.MANUAL, JSON.stringify(manualGames));
    if (currentUser) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(currentUser));
    else localStorage.removeItem(KEYS.CURRENT_USER);
  }, [users, transactions, userCards, adminConfig, seriesPrice, autoSchedule, manualGames, currentUser]);

  useEffect(() => {
    return engine.subscribe(setGameState);
  }, []);

  // Lógica de Crédito Automático de Prêmios
  useEffect(() => {
    if (gameState.lastWinner && currentUser && gameState.lastWinner.name === currentUser.username) {
      const prizeType = gameState.lastWinner.prize as keyof typeof gameState.prizes;
      const amount = gameState.prizes[prizeType] || 0;
      
      if (amount > 0) {
        updateUserBalance(currentUser.id, currentUser.balance + amount);
        const trans: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          type: 'PRIZE',
          amount,
          description: `Prêmio ${gameState.lastWinner.prize} recebido!`,
          status: 'COMPLETED',
          date: new Date().toISOString()
        };
        setTransactions(prev => [...prev, trans]);
      }
    }
  }, [gameState.lastWinner]);

  const fullSchedule = useMemo(() => {
    const list: ScheduledGame[] = [...manualGames];
    if (autoSchedule.isEnabled) {
      let current = new Date();
      const [h, m] = autoSchedule.firstGameTime.split(':').map(Number);
      current.setHours(h, m, 0, 0);
      const [eh, em] = autoSchedule.lastGameTime.split(':').map(Number);
      const end = new Date();
      end.setHours(eh, em, 0, 0);

      while (current <= end) {
        const time = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
        if (!list.find(g => g.time === time)) {
          list.push({ id: `auto-${time}`, time, price: seriesPrice, isManual: false });
        }
        current.setMinutes(current.getMinutes() + autoSchedule.intervalMinutes);
      }
    }
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [autoSchedule, manualGames, seriesPrice]);

  useEffect(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const next = fullSchedule.find(g => g.time >= currentTime) || fullSchedule[0];
    engine.setNextScheduledGame(next || null);
  }, [fullSchedule]);

  const login = async (whatsapp: string, pass: string) => {
    const u = users.find(x => x.whatsapp === whatsapp && x.password === pass);
    if (u) {
      setCurrentUser(u);
      return true;
    }
    return false;
  };

  const adminLogin = async (pass: string) => {
    if (pass === 'admin123' || pass === 'diretoria2024') {
      setCurrentUser({ id: 'admin', username: 'Diretoria', whatsapp: '', cpf: '', balance: 0, isAdmin: true, referralCode: '', bonusSeriesCount: 0 });
      return true;
    }
    return false;
  };

  const register = async (data: any) => {
    if (users.find(u => u.whatsapp === data.whatsapp)) return false;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: data.fullName.split(' ')[0] + Math.floor(Math.random() * 1000),
      fullName: data.fullName,
      whatsapp: data.whatsapp,
      cpf: data.cpf,
      password: data.password,
      balance: adminConfig.bonusAmount, // FIX: Saldo inicial do bônus configurado
      isAdmin: false,
      referralCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      bonusSeriesCount: 0,
      referralStats: { totalInvited: 0, totalEarnedSeries: 0 }
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    
    // Log de bônus inicial
    const trans: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: newUser.id,
      type: 'BONUS',
      amount: adminConfig.bonusAmount,
      description: 'Bônus de Boas-vindas',
      status: 'COMPLETED',
      date: new Date().toISOString()
    };
    setTransactions(prev => [...prev, trans]);
    
    return true;
  };

  const logout = () => setCurrentUser(null);

  const buySeries = async (quantity: number) => {
    if (!currentUser) return false;
    const total = quantity * seriesPrice;
    if (currentUser.balance < total) {
      alert("Saldo insuficiente para comprar estas séries.");
      return false;
    }
    
    setIsProcessingPurchase(true);
    const newCards = [];
    for (let i = 0; i < quantity; i++) {
      newCards.push(...CardGenerator.generateSeries(currentUser.id).map(c => ({ ...c, userName: currentUser.username })));
    }
    
    engine.registerCards(newCards);
    setUserCards(prev => [...prev, ...newCards]);
    updateUserBalance(currentUser.id, currentUser.balance - total);
    
    const trans: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      type: 'PURCHASE',
      amount: total,
      description: `Compra de ${quantity} Séries`,
      status: 'COMPLETED',
      date: new Date().toISOString()
    };
    setTransactions(prev => [...prev, trans]);
    setIsProcessingPurchase(false);
    return true;
  };

  const withdraw = async (amount: number, data: { name: string, cpf: string, pix: string }) => {
    if (!currentUser || currentUser.balance < amount) return false;
    
    // 1. Deduz saldo
    updateUserBalance(currentUser.id, currentUser.balance - amount);
    
    // 2. Registra transação
    const trans: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      type: 'WITHDRAW',
      amount,
      description: 'Saque solicitado',
      status: 'PENDING',
      date: new Date().toISOString()
    };
    setTransactions(prev => [...prev, trans]);
    
    // 3. Link WhatsApp formatado
    const msg = `Olá Diretoria! Gostaria de solicitar um saque.\n\nNome: ${data.name}\nCPF: ${data.cpf}\nPIX: ${data.pix}\nValor: R$ ${amount.toFixed(2)}`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${adminConfig.withdrawWhatsapp}?text=${encoded}`, '_blank');
    
    return true;
  };

  const updateUserBalance = (userId: string, newBalance: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: newBalance } : u));
    if (currentUser?.id === userId) setCurrentUser({ ...currentUser, balance: newBalance });
  };

  const deposit = (amount: number) => {
    if (!currentUser) return;
    updateUserBalance(currentUser.id, currentUser.balance + amount);
    setTransactions(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      type: 'DEPOSIT',
      amount,
      description: 'Depósito via PIX',
      status: 'COMPLETED',
      date: new Date().toISOString()
    }]);
  };

  const financials = useMemo(() => {
    const purchaseTrans = transactions.filter(t => t.type === 'PURCHASE');
    const prizeTrans = transactions.filter(t => t.type === 'PRIZE');
    const bruto = purchaseTrans.reduce((acc, t) => acc + t.amount, 0);
    const pagos = prizeTrans.reduce((acc, t) => acc + t.amount, 0);
    return { bruto, pagos, lucro: bruto - pagos, doacoes: 0 };
  }, [transactions]);

  useEffect(() => {
    engine.setRevenue(financials.bruto);
  }, [financials.bruto]);

  return (
    <GameContext.Provider value={{
      user: currentUser, users, gameState, login, adminLogin, register, logout,
      buySeries, deposit, withdraw, userCards, transactions, adminConfig,
      updateAdminConfig: setAdminConfig, ranking: [], generateFakes: () => {},
      updateUserBalance, seriesPrice, updateSeriesPrice: setSeriesPrice,
      autoSchedule, manualGames, updateAutoSchedule: setAutoSchedule,
      addManualGame: g => setManualGames(p => [...p, { ...g, id: Math.random().toString() } as ScheduledGame]),
      removeManualGame: id => setManualGames(p => p.filter(x => x.id !== id)),
      fullSchedule, updateGameStatePrizes: engine.updatePrizes, financials,
      toggleEmergencyUnlock: engine.toggleEmergencyUnlock, isProcessingPurchase
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
