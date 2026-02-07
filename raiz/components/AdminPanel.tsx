
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { engine } from '../services/GameEngine';

const AdminPanel: React.FC = () => {
  const { 
    logout, gameState, adminConfig, users, financials, transactions,
    autoSchedule, updateAutoSchedule, addManualGame, removeManualGame, fullSchedule,
    updateAdminConfig, generateFakes, updateUserBalance, toggleEmergencyUnlock
  } = useGame();
  
  const [tab, setTab] = useState('schedule');
  const [draftAuto, setDraftAuto] = useState(autoSchedule);
  const [manualForm, setManualForm] = useState({
    time: '12:00', price: 3.0, quadra: 0, linha: 0, bingo: 0
  });

  const [localConfig, setLocalConfig] = useState(adminConfig);

  const handleSaveConfig = () => {
    updateAdminConfig(localConfig);
    alert('Configurações salvas com sucesso!');
  };

  const handleSaveAutoStart = () => {
    updateAutoSchedule({ 
      ...autoSchedule, 
      firstGameTime: draftAuto.firstGameTime, 
      intervalMinutes: draftAuto.intervalMinutes 
    });
    alert('Programação de Início Automático salva!');
  };

  const handleSaveAutoEnd = () => {
    updateAutoSchedule({ 
      ...autoSchedule, 
      lastGameTime: draftAuto.lastGameTime 
    });
    alert('Programação de Término Automático salva!');
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    addManualGame({
      time: manualForm.time,
      price: manualForm.price,
      manualPrizes: {
        quadra: manualForm.quadra,
        linha: manualForm.linha,
        bingo: manualForm.bingo
      }
    });
    alert(`Partida Manual salva para às ${manualForm.time}.`);
  };

  const menuItems = [
    { id: 'schedule', label: 'Programação', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'dash', label: 'Monitor', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'users', label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
    { id: 'visual', label: 'Visual', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'finance', label: 'Regras', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="min-h-screen bg-[#0F0F1E] flex flex-col md:flex-row text-white font-poppins">
      <aside className="w-full md:w-80 bg-black/40 border-r border-white/5 p-8 flex flex-col shadow-2xl relative z-20">
        <div className="mb-10 text-center">
            {adminConfig.logoUrl ? <img src={adminConfig.logoUrl} className="h-10 mx-auto object-contain" alt="Logo" /> : <div className="w-10 h-10 bg-[#00D084] rounded-lg mx-auto flex items-center justify-center font-black shadow-lg shadow-green-500/20">B</div>}
            <h1 className="text-[10px] font-black tracking-widest uppercase opacity-40 mt-3 italic">Diretoria</h1>
        </div>

        <div className="mb-10 space-y-4">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2 opacity-50">Controle Direto</p>
          <button 
            onClick={() => engine.stopGame()} 
            className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-5 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Resetar Sistema
          </button>
          <button 
            onClick={toggleEmergencyUnlock} 
            className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 border ${!gameState.isEntryLocked ? 'bg-[#00D084] text-white' : 'bg-white/5 text-gray-500 border-white/10'}`}
          >
            {!gameState.isEntryLocked ? 'Mesa Destravada' : 'Destravar Mesa'}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map(m => (
            <button key={m.id} onClick={() => setTab(m.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase transition-all ${tab === m.id ? 'bg-[#9D4EDD] text-white shadow-xl shadow-purple-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={m.icon}></path></svg>
              {m.label}
            </button>
          ))}
        </nav>
        
        <button onClick={logout} className="mt-8 px-6 py-4 text-[10px] font-black text-gray-600 border border-white/5 rounded-2xl hover:text-red-400 hover:border-red-400/20 uppercase tracking-widest transition-all">Encerrar Sessão</button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-[#0F0F1E]">
        {tab === 'schedule' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-pop">
            <header className="flex justify-between items-end border-b border-white/5 pb-10">
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Grade de Jogos</h2>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-4">Programação Automática e Eventos Manuais</p>
               </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="space-y-8">
                <section className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-8 relative overflow-hidden group shadow-2xl">
                  <h3 className="text-[#00D084] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3">Início Automático</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] text-gray-500 font-black uppercase block tracking-widest opacity-50">Hora de Início</label>
                      <input type="time" value={draftAuto.firstGameTime} onChange={e => setDraftAuto({...draftAuto, firstGameTime: e.target.value})} className="w-full bg-black/40 p-6 rounded-2xl text-white outline-none border border-white/10 focus:border-[#00D084] text-2xl font-black" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] text-gray-500 font-black uppercase block tracking-widest opacity-50">Intervalo (Minutos)</label>
                      <input type="number" value={draftAuto.intervalMinutes} onChange={e => setDraftAuto({...draftAuto, intervalMinutes: Number(e.target.value)})} className="w-full bg-black/40 p-6 rounded-2xl text-white outline-none border border-white/10 focus:border-[#00D084] text-2xl font-black" />
                    </div>
                  </div>
                  <button onClick={handleSaveAutoStart} className="w-full bg-[#00D084] py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest">Salvar Início</button>
                </section>

                <section className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-8 relative overflow-hidden shadow-2xl">
                  <h3 className="text-[#FF6B35] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3">Término Automático</h3>
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 font-black uppercase block tracking-widest opacity-50">Hora de Encerramento</label>
                    <input type="time" value={draftAuto.lastGameTime} onChange={e => setDraftAuto({...draftAuto, lastGameTime: e.target.value})} className="w-full bg-black/40 p-6 rounded-2xl text-white outline-none border border-white/10 focus:border-[#FF6B35] text-2xl font-black" />
                  </div>
                  <button onClick={handleSaveAutoEnd} className="w-full bg-[#FF6B35] py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest">Salvar Término</button>
                </section>
              </div>

              <section className="bg-white/5 p-10 rounded-[3rem] border border-[#9D4EDD]/30 space-y-10 flex flex-col relative overflow-hidden shadow-2xl">
                <header>
                  <h3 className="text-[#9D4EDD] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3">Partida Manual Especial</h3>
                </header>
                <div className="space-y-8 flex-1">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] text-gray-500 font-black uppercase block tracking-widest opacity-50">Início</label>
                      <input type="time" value={manualForm.time} onChange={e => setManualForm({...manualForm, time: e.target.value})} className="w-full bg-black/40 p-6 rounded-2xl text-white outline-none border border-white/10 focus:border-[#9D4EDD] text-2xl font-black" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] text-gray-500 font-black uppercase block tracking-widest opacity-50">Preço R$</label>
                      <input type="number" value={manualForm.price} onChange={e => setManualForm({...manualForm, price: Number(e.target.value)})} className="w-full bg-black/40 p-6 rounded-2xl text-white outline-none border border-white/10 focus:border-[#9D4EDD] text-2xl font-black" />
                    </div>
                  </div>
                  <div className="bg-black/30 p-8 rounded-[2rem] border border-white/5 space-y-4">
                     <div className="flex justify-between items-center"><span className="text-[10px] text-gray-500 uppercase">Quadra R$</span><input type="number" value={manualForm.quadra} onChange={e => setManualForm({...manualForm, quadra: Number(e.target.value)})} className="bg-transparent text-right text-xl font-black outline-none text-[#00D084] w-24" /></div>
                     <div className="flex justify-between items-center"><span className="text-[10px] text-gray-500 uppercase">Linha R$</span><input type="number" value={manualForm.linha} onChange={e => setManualForm({...manualForm, linha: Number(e.target.value)})} className="bg-transparent text-right text-xl font-black outline-none text-[#00D084] w-24" /></div>
                     <div className="flex justify-between items-center"><span className="text-[10px] text-gray-500 uppercase">Bingo R$</span><input type="number" value={manualForm.bingo} onChange={e => setManualForm({...manualForm, bingo: Number(e.target.value)})} className="bg-transparent text-right text-xl font-black outline-none text-[#00D084] w-24" /></div>
                  </div>
                </div>
                <button onClick={handleAddManual} className="w-full bg-[#9D4EDD] py-7 rounded-[2rem] font-black text-xs uppercase tracking-widest">Agendar Manual</button>
              </section>
            </div>

            <div className="bg-black/40 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-10 bg-white/5 text-xs font-black uppercase tracking-widest text-gray-500">Cronograma de Hoje</div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-0">
                {fullSchedule.map((game, idx) => (
                  <div key={idx} className={`p-8 border border-white/5 flex flex-col items-center group relative ${game.isManual ? 'bg-[#9D4EDD]/10' : ''}`}>
                    <span className={`text-2xl font-black ${game.isManual ? 'text-[#9D4EDD]' : 'text-white/80'}`}>{game.time}</span>
                    <span className="text-[8px] font-black uppercase mt-2 opacity-50">{game.isManual ? 'Manual' : 'Auto'}</span>
                    {game.isManual && <button onClick={() => removeManualGame(game.id)} className="absolute top-2 right-2 text-red-500 opacity-30 hover:opacity-100">×</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'dash' && (
          <div className="space-y-8 animate-pop">
            <header className="bg-white/5 p-10 rounded-[3rem] border border-white/10 flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic">Fluxo de Operação</h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[{l: 'Bruto', v: financials.bruto, c: 'text-white'}, {l: 'Pagos', v: financials.pagos, c: 'text-red-400'}, {l: 'Usuários', v: users.length, c: 'text-[#9D4EDD]'}, {l: 'Lucro', v: financials.lucro, c: 'text-[#00D084]'}].map((s, i) => (
                <div key={i} className="bg-black/40 p-10 rounded-[2.5rem] border border-white/10">
                  <p className="text-[9px] text-gray-600 font-black uppercase mb-2 tracking-widest">{s.l}</p>
                  <p className={`text-3xl font-black ${s.c}`}>R$ {s.v.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="bg-black/40 rounded-[3rem] border border-white/10 overflow-hidden">
               <div className="p-8 bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">Fluxo de Caixa Recente</div>
               <table className="w-full text-left">
                  <tbody className="divide-y divide-white/5">
                    {transactions.slice().reverse().slice(0, 10).map(t => (
                      <tr key={t.id} className="text-[11px] hover:bg-white/5 transition-colors">
                        <td className="p-6 opacity-40">{new Date(t.date).toLocaleTimeString()}</td>
                        <td className="p-6 font-bold">{t.description}</td>
                        <td className={`p-6 font-black text-right ${t.type === 'PRIZE' || t.type === 'PURCHASE' ? 'text-red-400' : 'text-[#00D084]'}`}>
                          {t.type === 'PRIZE' || t.type === 'PURCHASE' ? '-' : '+'} R$ {t.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-8 animate-pop">
            <header className="flex justify-between items-center">
               <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gestão de Jogadores</h2>
               <button onClick={generateFakes} className="bg-[#9D4EDD] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Povoar com Fakes</button>
            </header>
            <div className="bg-black/40 rounded-[3rem] border border-white/10 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                  <tr><th className="p-10">Jogador</th><th className="p-10">Saldo</th><th className="p-10 text-right">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-10 font-bold">{u.username} {u.isFake && <span className="text-[8px] opacity-30 ml-2">(FAKE)</span>}</td>
                      <td className="p-10 text-[#00D084] font-black">R$ {u.balance.toFixed(2)}</td>
                      <td className="p-10 text-right">
                         <div className="flex justify-end gap-2">
                            <button onClick={() => updateUserBalance(u.id, u.balance + 10)} className="w-10 h-10 bg-[#00D084]/20 text-[#00D084] rounded-xl font-black hover:bg-[#00D084] hover:text-white transition-all">+</button>
                            <button onClick={() => updateUserBalance(u.id, Math.max(0, u.balance - 10))} className="w-10 h-10 bg-red-400/20 text-red-400 rounded-xl font-black hover:bg-red-400 hover:text-white transition-all">-</button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'visual' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-pop">
            <header>
               <h2 className="text-3xl font-black tracking-tighter uppercase italic">Identidade Visual</h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                  <h3 className="text-[10px] font-black text-[#00D084] uppercase tracking-widest">Marca</h3>
                  <div className="space-y-4">
                    <label className="text-[9px] text-gray-500 font-black uppercase block">URL do Logo</label>
                    <input value={localConfig.logoUrl} onChange={e => setLocalConfig({...localConfig, logoUrl: e.target.value})} className="w-full bg-black/40 p-4 rounded-xl text-white outline-none border border-white/10 text-xs" />
                  </div>
               </div>
               <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                  <h3 className="text-[10px] font-black text-[#9D4EDD] uppercase tracking-widest">Ambiente</h3>
                  <div className="space-y-4">
                    <label className="text-[9px] text-gray-500 font-black uppercase block">Opacidade ({Math.round(localConfig.bgOpacity * 100)}%)</label>
                    <input type="range" min="0" max="1" step="0.1" value={localConfig.bgOpacity} onChange={e => setLocalConfig({...localConfig, bgOpacity: parseFloat(e.target.value)})} className="w-full accent-[#00D084]" />
                  </div>
               </div>
            </div>
            <button onClick={handleSaveConfig} className="w-full bg-[#00D084] py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl">Salvar Identidade Visual</button>
          </div>
        )}

        {tab === 'finance' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-pop">
            <header>
               <h2 className="text-3xl font-black tracking-tighter uppercase italic">Regras e Financeiro</h2>
            </header>
            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[9px] text-gray-500 font-black uppercase block">Nome do Bingo</label>
                    <input value={localConfig.bingoName} onChange={e => setLocalConfig({...localConfig, bingoName: e.target.value})} className="w-full bg-black/40 p-5 rounded-2xl text-white outline-none border border-white/10 text-sm font-bold" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] text-gray-500 font-black uppercase block">Bônus R$</label>
                    <input type="number" value={localConfig.bonusAmount} onChange={e => setLocalConfig({...localConfig, bonusAmount: parseFloat(e.target.value)})} className="w-full bg-black/40 p-5 rounded-2xl text-white outline-none border border-white/10 text-sm font-bold" />
                  </div>
               </div>
               <button onClick={handleSaveConfig} className="w-full bg-[#9D4EDD] py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl">Salvar Regras</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
