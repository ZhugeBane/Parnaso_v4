import React, { useState } from 'react';
import { register, login, checkUserExists, resetPassword } from '../services/authService';
import { User } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'recovery';

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Recovery State (0 = enter email, 1 = enter new password)
  const [recoveryStep, setRecoveryStep] = useState<0 | 1>(0);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMsg('');
    setRecoveryStep(0);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      try {
        if (mode === 'login') {
          const user = login(email, password);
          onLoginSuccess(user);
        } 
        else if (mode === 'register') {
          if (!name) throw new Error("Nome é obrigatório.");
          const user = register(name, email, password);
          if (user.isBlocked) {
             setSuccessMsg("Conta criada com sucesso! Aguarde a aprovação do administrador para fazer login.");
             setMode('login'); 
             setPassword('');
          } else {
             onLoginSuccess(user);
          }
        }
        else if (mode === 'recovery') {
          if (recoveryStep === 0) {
            // Step 1: Verify Email
            const exists = checkUserExists(email);
            if (!exists) throw new Error("Este e-mail não está cadastrado.");
            
            // Simulate sending email
            alert(`[SIMULAÇÃO]\nUm e-mail de redefinição foi enviado para: ${email}.\n\nAo clicar em 'OK', você será redirecionado para a tela de nova senha.`);
            setRecoveryStep(1);
            setSuccessMsg("Código verificado. Defina sua nova senha.");
          } else {
            // Step 2: Reset Password
            if (!password) throw new Error("A nova senha é obrigatória.");
            if (password.length < 4) throw new Error("A senha deve ter pelo menos 4 caracteres.");
            
            resetPassword(email, password);
            setSuccessMsg("Senha alterada com sucesso! Faça login.");
            setMode('login');
            setRecoveryStep(0);
            setPassword('');
          }
        }
      } catch (err: any) {
        setError(err.message || "Ocorreu um erro.");
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const getTitle = () => {
    if (mode === 'login') return "Login";
    if (mode === 'register') return "Criar Conta";
    if (mode === 'recovery') return recoveryStep === 0 ? "Recuperar Senha" : "Nova Senha";
    return "";
  };

  const getSubtitle = () => {
    if (mode === 'login') return "Preencha seus dados para entrar.";
    if (mode === 'register') return "Junte-se a comunidade de escritores.";
    if (mode === 'recovery') return recoveryStep === 0 ? "Informe seu e-mail para receber o link." : "Crie uma senha segura para sua conta.";
    return "";
  };

  const getButtonText = () => {
    if (loading) return "Processando...";
    if (mode === 'login') return "Entrar";
    if (mode === 'register') return "Cadastrar";
    if (mode === 'recovery') return recoveryStep === 0 ? "Enviar Link" : "Alterar Senha";
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in">
        
        {/* Left Side - Brand */}
        <div className="md:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <img src="logo.png" alt="Logo" className="w-12 h-12 object-contain" />
               <span className="text-xl font-bold tracking-tight">Projeto Parnaso</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              {mode === 'login' ? "Bem-vindo de volta, escritor." : 
               mode === 'register' ? "Comece sua obra-prima hoje." : 
               "Recupere o acesso."}
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Acompanhe sua produtividade, gerencie seu estresse e conquiste seus objetivos literários com uma plataforma feita para quem escreve.
            </p>
          </div>

          <div className="relative z-10 mt-8">
            <div className="flex gap-2">
               <div className="h-1 w-12 bg-teal-500 rounded-full"></div>
               <div className="h-1 w-3 bg-slate-600 rounded-full"></div>
               <div className="h-1 w-3 bg-slate-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{getTitle()}</h2>
            <p className="text-slate-500 mb-8">{getSubtitle()}</p>

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm flex items-center animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMsg}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-center animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nome</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              )}
              
              {/* Email Input - Always visible unless in Password Reset Step 2 */}
              {(mode !== 'recovery' || recoveryStep === 0) && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">E-mail</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              )}

              {/* Password Input - Visible in Login, Register, and Recovery Step 2 */}
              {(mode !== 'recovery' || recoveryStep === 1) && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                     <label className="text-sm font-medium text-slate-700">
                        {mode === 'recovery' ? 'Nova Senha' : 'Senha'}
                     </label>
                     {mode === 'login' && (
                       <button 
                         type="button"
                         onClick={() => handleSwitchMode('recovery')}
                         className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                       >
                         Esqueci a senha
                       </button>
                     )}
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold shadow-lg shadow-teal-100 transition-all transform active:scale-95 mt-4 ${
                  loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600 hover:-translate-y-1'
                }`}
              >
                {getButtonText()}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              {mode === 'login' && (
                <>
                  Não tem uma conta? 
                  <button onClick={() => handleSwitchMode('register')} className="ml-2 font-bold text-teal-600 hover:underline">
                    Cadastre-se
                  </button>
                </>
              )}
              {mode === 'register' && (
                <>
                  Já tem uma conta? 
                  <button onClick={() => handleSwitchMode('login')} className="ml-2 font-bold text-teal-600 hover:underline">
                    Faça Login
                  </button>
                </>
              )}
              {mode === 'recovery' && (
                 <button onClick={() => handleSwitchMode('login')} className="font-bold text-slate-500 hover:text-slate-800 hover:underline flex items-center justify-center gap-2 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Voltar ao Login
                 </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};