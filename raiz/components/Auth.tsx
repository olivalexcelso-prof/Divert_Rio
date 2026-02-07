import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<'PLAYER' | 'ADMIN'>('PLAYER');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [formData, setFormData] = useState({ fullName: '', whatsapp: '', cpf: '', password: '', confirmPassword: '' });
  
  const { login, register, adminLogin, adminConfig } = useGame();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    
    try {
      let success = false;
      if (authMode === 'ADMIN') {
        success = await adminLogin(adminPass);
        if (!success) {
          alert('Acesso Negado. Verifique a senha da diretoria.');
        }
      } else if (isLogin) {
        success = await login(formData.whatsapp, formData.password);
        if (!success) alert('Usuário não encontrado ou senha inválida.');
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert('As senhas digitadas são diferentes.');
          setLoading(false);
          return;
        }
        success = await register(formData);
        if (!success) alert('Este número de WhatsApp já possui uma conta ativa.');
      }
    } catch (err) {
      console.error("Auth Exception:", err);
      alert("Houve um erro no processamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, val: string) => setFormData(p => ({ ...p, [field]: val }));

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative p-6 bg-[#0F0F1E] overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-1000" 
        style={{ 
            backgroundImage: `url('${adminConfig.bgLogin}')`, 
            opacity: adminConfig.bgOpacity 
        }} 
      />
      <div className="absolute inset-0 bg-[#0F0F1E]/50 z-[1]" />

      <div className="z-10 bg-[#1F1F3D]/95 backdrop-blur-3xl rounded-[3rem] w-full max-w-md p-10 border border-white/10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] animate-pop relative overflow-hidden">
        <header className="text-center mb-10">
          <div className="mb-4 flex flex-col items-center">
             {adminConfig.logoUrl ? (
                 <img src={adminConfig.logoUrl} alt="Logo" className="h-20 mb-6 drop-shadow-2xl object-contain max-w-[80%]" />
             ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#00D084] to-[#9D4EDD] rounded-3xl flex items-center justify-center shadow-2xl rotate-3 mb-6">
                   <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
             )}
             <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">{adminConfig.bingoName}</h1>
             <div className="w-16 h-1.5 bg-[#00D084] mt-3 rounded-full mx-auto" />
          </div>
        </header>

        <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5">
          <button 
            type="button"
            onClick={() => { if (!loading) setAuthMode('PLAYER'); }} 
            className={`flex-1 py-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-[0.2em] ${authMode === 'PLAYER' ? 'bg-[#00D084] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Jogar
          </button>
          <button 
            type="button"
            onClick={() => { if (!loading) setAuthMode('ADMIN'); }} 
            className={`flex-1 py-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-[0.2em] ${authMode === 'ADMIN' ? 'bg-[#FF6B35] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Diretoria
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'PLAYER' ? (
            <>
              {!isLogin && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-[9px] text-gray-400 font-black uppercase mb-1 ml-1 block tracking-widest opacity-60">Nome Completo</label>
                    <input type="text" required value={formData.fullName} onChange={e => update('fullName', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-[#00D084]/50 transition-all placeholder-white/5" placeholder="Seu nome" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 font-black uppercase mb-1 ml-1 block tracking-widest opacity-60">CPF</label>
                    <input type="text" required value={formData.cpf} onChange={e => update('cpf', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-[#00D084]/50 transition-all placeholder-white/5" placeholder="000.000.000-00" />
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-[9px] text-gray-400 font-black uppercase mb-1 ml-1 block tracking-widest opacity-60">WhatsApp</label>
                <input type="tel" required value={formData.whatsapp} onChange={e => update('whatsapp', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-[#00D084]/50 transition-all placeholder-white/5" placeholder="(00) 00000-0000" />
              </div>

              <div>
                <label className="text-[9px] text-gray-400 font-black uppercase mb-1 ml-1 block tracking-widest opacity-60">Senha</label>
                <input type="password" required value={formData.password} onChange={e => update('password', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-[#00D084]/50 transition-all placeholder-white/5" placeholder="••••••••" />
              </div>

              {!isLogin && (
                <div className="animate-fade-in">
                  <label className="text-[9px] text-gray-400 font-black uppercase mb-1 ml-1 block tracking-widest opacity-60">Confirmar Senha</label>
                  <input type="password" required value={formData.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-[#00D084]/50 transition-all placeholder-white/5" placeholder="••••••••" />
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-[#00D084] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_40px_rgba(0,208,132,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4">
                {loading ? 'Processando...' : isLogin ? 'Entrar na Mesa' : 'Criar minha Conta'}
              </button>

              <p className="text-center mt-6">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black uppercase text-gray-500 hover:text-[#00D084] transition-colors tracking-widest">
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
                </button>
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="text-[9px] text-gray-400 font-black uppercase mb-1 ml-1 block tracking-widest opacity-60">Senha da Diretoria</label>
                <input type="password" required value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all placeholder-white/5" placeholder="Código de Acesso" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#FF6B35] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_40px_rgba(255,107,53,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4">
                {loading ? 'Validando...' : 'Acessar Painel'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;