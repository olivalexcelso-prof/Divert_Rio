
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Card, GameStatus } from '../types';
import { tts } from '../services/TTSService';

// Sub-componente para exibição de cada cartela individual
const CardDisplay: React.FC<{ card: Card; drawnNumbers: number[]; prizeType: string }> = ({ card, drawnNumbers, prizeType }) => {
  const isMarked = (num: number) => drawnNumbers.includes(num);
  
  // Lógica de cálculo de proximidade para o prêmio atual
  const getMissingCount = () => {
    const drawn = new Set(drawnNumbers);
    if (prizeType === 'QUADRA') {
      return Math.min(...card.numbers.map(row => 4 - row.filter(n => n !== 0 && drawn.has(n)).length));
    } else if (prizeType === 'LINHA') {
      return Math.min(...card.numbers.map(row => 5 - row.filter(n => n !== 0 && drawn.has(n)).length));
    } else {
      const allNums = card.numbers.flat().filter(n => n !== 0);
      return allNums.length - allNums.filter(n => drawn.has(n)).length;
    }
  };

  const missing = Math.max(0, getMissingCount());
  const isClose = missing === 1;

  return (
    <div className={`bg-white rounded-[1.8rem] p-4 shadow-2xl border-4 transition-all duration-500 transform
      ${isClose ? 'border-[#FF6B35] ring-8 ring-[#FF6B35]/20 scale-[1.05] z-10 shadow-[0_0_40px_rgba(255,107,53,0.3)]' : 'border-transparent opacity-95'}`}>
      
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">SÉRIE {card.id}</span>
        {isClose && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] animate-ping" />
            <span className="text-[10px] font-black text-[#FF6B35] uppercase italic animate-bounce tracking-tighter">ARMADA! (FALTA 1)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-9 gap-1.5 bg-gray-100 p-2.5 rounded-[1.2rem] border border-black/5 shadow-inner">
        {card.numbers.map((row, rIdx) => (
          row.map((num, cIdx) => (
            <div key={`${rIdx}-${cIdx}`} className={`aspect-square flex items-center justify-center rounded-lg text-[13px] font-black transition-all duration-300
              ${num === 0 ? 'bg-transparent' : isMarked(num) ? 'bg-gradient-to-br from-[#00D084] to-[#00A569] text-white shadow-lg scale-90 rotate-3' : 'bg-white text-gray-800 shadow-sm border border-black/5'}`}>
              {num !== 0 ? num : ''}
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

const BingoRoom: React.FC = () => {
  const { 
    user, users, gameState, userCards, buySeries, deposit, logout, adminConfig, seriesPrice, isProcessingPurchase 
  } = useGame();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Ativação do Sistema de Som (Locução)
  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    tts.toggle(newState);
    if (newState) {
      tts.speak("Sistema de narração ativado. Boa sorte a todos os jogadores!");
    }
  };

  // RANKING DE CARTELAS: Ordena as que têm mais chance de ganhar no topo
  const sortedCards = useMemo(() => {
    return [...userCards].sort((a, b) => {
      const getMissing = (card: Card) => {
        const drawn = new Set(gameState.drawnNumbers);
        if (gameState.currentPrizeType === 'QUADRA') {
          return Math.max(0, Math.min(...card.numbers.map(row => 4 - row.filter(n => n !== 0 && drawn.has(n)).length)));
        } else if (gameState.currentPrizeType === 'LINHA') {
          return Math.max(0, Math.min(...card.numbers.map(row => 5 - row.filter(n => n !== 0 && drawn.has(n)).length)));
        } else {
          const allNums = card.numbers.flat().filter(n => n !== 0);
          return Math.max(0, allNums.length - allNums.filter(n => drawn.has(n)).length);
        }
      };
      return getMissing(a) - getMissing(b);
    });
  }, [userCards, gameState.drawnNumbers, gameState.currentPrizeType]);

  return (
    <div className="flex flex-col h-screen bg-[#0F0F1E] text-white overflow-hidden font-inter">
      {/* Camadas de Fundo */}
      <div className="fixed inset-0 bg-cover bg-center opacity-10 pointer-events-none z-0 scale-110 transition-transform duration-[20s] animate-pulse" style={{ backgroundImage: `url('${adminConfig.bgRoom}')` }} />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0F0F1E]/60 via-[#0F0F1E] to-[#0F0F1E] z-0 pointer-events-none" />

      {/* HEADER PREMIUM REFINADO */}
      <header className="relative z-30 bg-[#1F1F3D]/80 backdrop-blur-2xl border-b border-white/10 px-6 py-4 flex justify-between items-center shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-black/40 px-4 py-2 rounded-full border border-white/10 flex items-center gap-4 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase leading-none tracking-widest">Saldo Atual</span>
              <span className="text-lg font-black text-[#00D084] font-poppins">R$ {user?.balance.toFixed(2)}</span>
            </div>
            <button onClick={() => setShowDeposit(true)} className="w-10 h-10 bg-[#00D084] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,208,132,0.4)] active:scale-90 transition-all hover:rotate-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center">
          <div className="flex items-center gap-3 mb-1">
             <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
             <h1 className="text-xs font-black tracking-[0.4em] uppercase text-white/80 italic font-poppins">{adminConfig.bingoName}</h1>
          </div>
          <div className="bg-[#9D4EDD]/10 border border-[#9D4EDD]/20 px-4 py-0.5 rounded-full">
            <p className="text-[8px] font-black text-[#9D4EDD] uppercase tracking-[0.2em]">{users.length} JOGADORES NA MESA</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleAudio}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all border ${audioEnabled ? 'bg-[#9D4EDD] border-[#9D4EDD] text-white shadow-[0_0_25px_rgba(157,78,221,0.5)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
          >
            {audioEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46l4.95 4.95M20.49 8.46l-4.95 4.95" /></svg>
            )}
          </button>
          <button onClick={() => setShowBuy(true)} className="bg-gradient-to-r from-[#00D084] to-[#00A569] text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
            Comprar Séries
          </button>
        </div>
      </header>

      {/* FEED DE LOCUÇÃO DINÂMICO */}
      <div className="relative z-30 bg-black/80 border-b border-white/5 px-6 py-2.5 h-10 flex items-center shadow-lg">
         <div className="flex items-center gap-3 shrink-0 mr-6 border-r border-white/10 pr-6">
            <span className="text-[8px] font-black uppercase text-[#9D4EDD] tracking-widest bg-[#9D4EDD]/10 px-3 py-1 rounded-lg border border-[#9D4EDD]/20 italic shadow-inner">Voz do Bingo</span>
         </div>
         <div className="flex-1 whitespace-nowrap overflow-hidden relative">
            <p className="text-[11px] font-black text-white/80 italic animate-marquee inline-block">
               {gameState.status === GameStatus.WAITING ? "Aguardando início do sorteio... Mesa trancada!" : 
                gameState.lastWinner ? `BINGO! Parabéns ao ganhador ${gameState.lastWinner.name}! Conferindo cartela...` :
                gameState.status === GameStatus.PLAYING ? `Sorteio em andamento! Estamos na rodada da ${gameState.currentPrizeType}. Boa sorte!` :
                `Próxima mesa em instantes às ${gameState.nextGameTime}. Prepare suas séries!`}
            </p>
         </div>
      </div>

      {/* ÁREA DE JOGO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-20">
        <div className="max-w-7xl mx-auto p-4 lg:p-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10 mb-12">
            
            {/* PAINEL LATERAL: BOLA ATUAL E PREMIAÇÃO */}
            <div className="flex lg:flex-col items-center lg:items-stretch gap-6">
              {/* DISPLAY DA BOLA (Reduzido e Moderno) */}
              <div className="bg-gradient-to-br from-[#1F1F3D] to-[#0F0F1E] rounded-[3rem] p-6 border border-white/10 shadow-2xl flex flex-col items-center justify-center min-w-[180px] lg:w-full aspect-square relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,208,132,0.1),transparent)]" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4 text-center">Bola Atual</span>
                
                <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center text-black shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-[8px] border-black/5">
                  <div className="absolute inset-0 rounded-full border-t-4 border-[#00D084] animate-spin-slow opacity-40" />
                  {gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.WAITING ? (
                    <span className="text-5xl font-black font-poppins animate-pop drop-shadow-lg">{gameState.currentBall || '--'}</span>
                  ) : (
                    <div className="flex flex-col items-center animate-pulse">
                       <span className="text-[11px] font-black text-[#00D084] leading-none mb-1">PRÓXIMA</span>
                       <span className="text-2xl font-black text-gray-800">{gameState.nextGameTime || '--:--'}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 text-center">
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Sorteio Digital</p>
                </div>
              </div>

              {/* LISTA DE PRÊMIOS DA RODADA */}
              <div className="flex-1 lg:flex-none grid grid-cols-2 lg:grid-cols-1 gap-3">
                {['QUADRA', 'LINHA', 'BINGO', 'ACUMULADO'].map(type => {
                  const isActive = gameState.currentPrizeType === type;
                  return (
                    <div key={type} className={`p-4 rounded-[1.8rem] border-2 transition-all duration-500 ${isActive ? 'bg-gradient-to-br from-[#00D084] to-[#00A569] border-[#00D084] text-white shadow-[0_15px_30px_rgba(0,208,132,0.3)] scale-105' : 'bg-black/30 border-white/5 opacity-30 grayscale'}`}>
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[8px] font-black uppercase tracking-widest">{type}</span>
                         {isActive && <div className="w-2 h-2 rounded-full bg-white animate-ping" />}
                      </div>
                      <span className="text-xl font-black italic tracking-tighter">R$ {gameState.prizes[type.toLowerCase() as keyof typeof gameState.prizes].toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PAINEL CENTRAL: HISTÓRICO DE BOLAS */}
            <div className="bg-black/30 backdrop-blur-3xl rounded-[4rem] border border-white/10 p-10 flex flex-col shadow-2xl relative overflow-hidden">
                <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                  <div className="flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">Histórico de Sorteio</h3>
                    <p className="text-[12px] font-bold text-[#00D084] uppercase mt-1 italic">Total de Bolas: {gameState.ballCount}</p>
                  </div>
                  <div className="bg-white/5 px-6 py-2 rounded-2xl border border-white/10">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Live Station</span>
                  </div>
                </header>

                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 gap-4">
                  {gameState.drawnNumbers.slice().reverse().map((n, i) => (
                    <div key={i} className={`aspect-square rounded-full flex items-center justify-center text-sm font-black shadow-xl transition-all duration-500 animate-pop
                      ${i === 0 
                        ? 'bg-gradient-to-br from-[#00D084] to-[#00A569] text-white scale-125 ring-4 ring-white/20 z-10 shadow-[0_0_30px_rgba(0,208,132,0.6)]' 
                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/20 transition-colors'}`}>
                      {n}
                    </div>
                  ))}
                  {gameState.drawnNumbers.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-10">
                      <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/30 flex items-center justify-center mb-6 animate-spin-slow">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.8em] text-center">Aguardando as primeiras bolas...</span>
                    </div>
                  )}
                </div>
            </div>
          </div>

          {/* MINHAS CARTELAS (RANKING EM TEMPO REAL) */}
          <section className="mt-6">
            <header className="flex items-center gap-6 mb-10">
              <div className="flex flex-col">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none font-poppins">Minhas Séries</h2>
                <div className="flex items-center gap-3 mt-3">
                   <div className="w-10 h-1 bg-[#00D084] rounded-full" />
                   <p className="text-[11px] font-black text-[#9D4EDD] uppercase tracking-widest">{userCards.length} SÉRIES REGISTRADAS</p>
                </div>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </header>

            {userCards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {sortedCards.map(card => (
                  <CardDisplay key={card.id} card={card} drawnNumbers={gameState.drawnNumbers} prizeType={gameState.currentPrizeType} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-black/20 rounded-[4rem] border-4 border-white/5 border-dashed">
                <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center mb-10 opacity-30 shadow-inner group transition-all duration-500">
                  <svg className="w-16 h-16 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <h3 className="text-3xl font-black uppercase mb-4 tracking-tighter italic text-white/70">Mesa Vazia</h3>
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-12 max-w-sm text-center leading-relaxed">Garanta agora suas séries para não perder o início da próxima rodada premiada!</p>
                <button 
                  onClick={() => setShowBuy(true)} 
                  className="bg-gradient-to-r from-[#00D084] to-[#00A569] text-white px-20 py-8 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-[0_25px_60px_rgba(0,208,132,0.4)] hover:scale-110 active:scale-95 transition-all"
                >
                  Entrar no Jogo
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* FOOTER FIXO / NAVEGAÇÃO */}
      <footer className="relative z-30 bg-[#1F1F3D] border-t border-white/10 py-6 px-12 flex justify-between items-center shrink-0 shadow-[0_-30px_60px_rgba(0,0,0,0.5)]">
        <button className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity group">
          <svg className="w-7 h-7 group-hover:text-[#9D4EDD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Resultados</span>
        </button>
        
        <button onClick={() => setShowDeposit(true)} className="relative -mt-16 group">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00D084] to-[#00A569] rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(0,208,132,0.5)] border-[8px] border-[#0F0F1E] group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <span className="text-[10px] font-black text-[#00D084] uppercase tracking-[0.4em] mt-3 block text-center drop-shadow-lg">PIX RÁPIDO</span>
        </button>

        <button onClick={() => setShowBuy(true)} className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity group">
          <svg className="w-7 h-7 group-hover:text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Loja Séries</span>
        </button>
      </footer>

      {/* MODAL DE DEPÓSITO */}
      {showDeposit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowDeposit(false)} />
          <div className="relative w-full max-w-md bg-[#1F1F3D] rounded-[4rem] p-12 border border-white/10 shadow-[0_60px_120px_rgba(0,0,0,0.8)] animate-pop">
            <h2 className="text-3xl font-black uppercase italic text-center mb-4 tracking-tighter">Recarregar Saldo</h2>
            <p className="text-center text-[10px] text-gray-500 font-black uppercase tracking-widest mb-10">Depósito Instantâneo via PIX</p>
            <div className="grid grid-cols-2 gap-6 mb-12">
              {[10, 20, 50, 100].map(val => (
                <button key={val} onClick={() => { deposit(val); setShowDeposit(false); }} className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] hover:bg-[#00D084] hover:border-[#00D084] hover:shadow-[0_0_30px_rgba(0,208,132,0.4)] transition-all flex flex-col items-center group">
                  <span className="text-[11px] font-black text-gray-600 uppercase mb-1 group-hover:text-white">Crédito</span>
                  <span className="text-3xl font-black text-white">R$ {val}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowDeposit(false)} className="w-full py-4 text-[10px] font-black uppercase text-gray-600 hover:text-white tracking-[0.5em] transition-colors">Talvez depois</button>
          </div>
        </div>
      )}

      {/* MODAL DE COMPRA */}
      {showBuy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowBuy(false)} />
          <div className="relative w-full max-w-md bg-[#1F1F3D] rounded-[4rem] p-12 border border-white/10 shadow-[0_60px_120px_rgba(0,0,0,0.8)] animate-pop">
            <h2 className="text-3xl font-black uppercase italic text-center mb-2 tracking-tighter font-poppins">Garantir Séries</h2>
            <p className="text-center text-[11px] text-gray-500 font-black uppercase tracking-widest mb-10">Valor da Mesa: R$ {seriesPrice.toFixed(2)}</p>
            <div className="grid grid-cols-2 gap-6 mb-10">
              {[1, 2, 5, 10].map(qty => (
                <button key={qty} disabled={isProcessingPurchase} onClick={async () => { const ok = await buySeries(qty); if (ok) setShowBuy(false); }} className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] hover:bg-[#9D4EDD] hover:border-[#9D4EDD] hover:shadow-[0_0_30px_rgba(157,78,221,0.4)] transition-all flex flex-col items-center disabled:opacity-20 group">
                  <span className="text-5xl font-black text-white mb-1 group-hover:scale-110 transition-transform font-poppins">{qty}</span>
                  <span className="text-[10px] text-white/40 font-black uppercase group-hover:text-white tracking-widest">Série{qty > 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
            {isProcessingPurchase && <p className="text-center text-[10px] text-[#00D084] font-black uppercase animate-pulse mb-6 tracking-widest">Registrando na Mesa...</p>}
            <button onClick={() => setShowBuy(false)} className="w-full py-4 text-[10px] font-black uppercase text-gray-600 hover:text-white tracking-[0.5em] transition-colors">Voltar</button>
          </div>
        </div>
      )}

      {/* OVERLAY DE VENCEDOR (ANÚNCIO SHOW) */}
      {gameState.lastWinner && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/99 backdrop-blur-3xl animate-fade-in">
          <div className="w-full max-w-xl bg-[#1F1F3D] rounded-[5rem] p-20 border-2 border-[#00D084]/40 text-center shadow-[0_0_150px_rgba(0,208,132,0.4)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-transparent via-[#00D084] to-transparent shadow-[0_0_50px_#00D084]" />
            
            <div className="w-40 h-40 bg-[#00D084] rounded-full mx-auto flex items-center justify-center mb-12 shadow-[0_0_80px_rgba(0,208,132,0.6)] animate-bounce border-[12px] border-white/10">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
            
            <h2 className="text-[9rem] font-black italic uppercase text-white mb-4 tracking-tighter leading-none font-poppins drop-shadow-[0_10px_40px_rgba(0,0,0,0.5)]">BINGO!</h2>
            <p className="text-[#00D084] text-3xl font-black uppercase tracking-[0.6em] mb-16 animate-pulse drop-shadow-lg italic">{gameState.lastWinner.prize}</p>
            
            <div className="bg-white/5 p-14 rounded-[4rem] border border-white/10 shadow-inner mb-10 relative">
              <p className="text-[12px] font-black uppercase text-gray-500 mb-6 tracking-[0.4em]">Ganhador(a) da Mesa:</p>
              <p className="text-6xl font-black text-white italic tracking-tighter font-poppins">{gameState.lastWinner.name}</p>
              {gameState.lastWinner.card && (
                <div className="mt-8 flex items-center justify-center gap-4 border-t border-white/5 pt-8">
                   <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">SÉRIE VENCEDORA:</span>
                   <span className="text-3xl font-black text-[#00D084] font-poppins"># {gameState.lastWinner.card.id}</span>
                </div>
              )}
            </div>
            
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.6em] animate-pulse">Pagamento automático em processamento...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BingoRoom;
