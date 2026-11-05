import React, { useState } from 'react';
import { Lock, Mail, Smartphone, ArrowRight, ShieldCheck, UserCheck, QrCode, Tv, BookOpen } from 'lucide-react';
import { Usuario } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario, token: string) => void;
  onOpenClienteMesa?: () => void;
  onOpenKdsFisico?: () => void;
  onOpenGarcomMobile?: () => void;
  onOpenManualAjuda?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onOpenClienteMesa,
  onOpenKdsFisico,
  onOpenGarcomMobile,
  onOpenManualAjuda,
}) => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !senha) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.login(login.trim(), senha);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar. Verifique o celular/e-mail e a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (emailOrPhone: string) => {
    setLogin(emailOrPhone);
    setSenha('123456');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-[12px] bg-[#0D9488] text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-sm">
            SB
          </div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
            SAASBAR
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Painel Operacional e Gestão de Bares
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-[1.25rem] font-semibold text-[#0F172A]">
              Entrar na Plataforma
            </h2>
            <p className="text-[0.875rem] text-[#64748B] mt-0.5">
              Acesso restrito para equipe e supervisão
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-[8px] text-[0.875rem] text-[#DC2626] flex items-start gap-2.5">
              <span className="font-semibold block">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1.5">
                Celular ou E-mail
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="carlos@bombora.com.br ou (11) 98765-4321"
                  className="w-full pl-3.5 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[0.875rem] font-medium text-[#0F172A]">
                  Senha
                </label>
                <span className="text-[11px] text-[#64748B]">Padrão: 123456</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
            >
              <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Roles Credentials */}
          <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-3">
              Perfis de Demonstração (Clique para preencher)
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('carlos@bombora.com.br')}
                className="w-full text-left p-2.5 rounded-[8px] border border-[#E2E8F0] hover:border-[#0D9488] hover:bg-teal-50/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-[13px] font-semibold text-[#0F172A] block group-hover:text-[#0D9488]">
                    Carlos Silva (Gerente)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    carlos@bombora.com.br • Acesso total
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#CCFBF1] text-[#0F766E] font-medium">
                  gerente
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rafael@bombora.com.br')}
                className="w-full text-left p-2.5 rounded-[8px] border border-[#E2E8F0] hover:border-[#0D9488] hover:bg-teal-50/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-[13px] font-semibold text-[#0F172A] block group-hover:text-[#0D9488]">
                    Rafael Mendes (Balcão)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    rafael@bombora.com.br • Lançamento Rápido
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#FEF3C7] text-[#B45309] font-medium">
                  operador_balcao
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('lucas@bombora.com.br')}
                className="w-full text-left p-2.5 rounded-[8px] border border-[#E2E8F0] hover:border-[#0D9488] hover:bg-teal-50/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-[13px] font-semibold text-[#0F172A] block group-hover:text-[#0D9488]">
                    Lucas Almeida (Garçom)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    lucas@bombora.com.br • Fila de entrega
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 font-medium">
                  garcom
                </span>
              </button>
            </div>
          </div>

          {(onOpenClienteMesa || onOpenKdsFisico) && (
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Superfícies Operacionais sem Login:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {onOpenClienteMesa && (
                  <button
                    type="button"
                    onClick={onOpenClienteMesa}
                    className="p-2.5 rounded-[8px] border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mesa (QR)</span>
                  </button>
                )}

                {onOpenGarcomMobile && (
                  <button
                    type="button"
                    onClick={onOpenGarcomMobile}
                    className="p-2.5 rounded-[8px] border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-[#0D9488] shrink-0" />
                    <span>App Garçom</span>
                  </button>
                )}

                {onOpenKdsFisico && (
                  <button
                    type="button"
                    onClick={onOpenKdsFisico}
                    className="p-2.5 rounded-[8px] border border-slate-700 bg-slate-900 hover:bg-slate-800 text-teal-300 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Tv className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Telão KDS</span>
                  </button>
                )}
              </div>

              {onOpenManualAjuda && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenManualAjuda}
                    className="w-full p-2.5 rounded-[8px] border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-[#0F766E] flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-[#0D9488]" />
                    <span>Manual Operacional & Help do Sistema (Guia UX)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="text-center mt-6 text-[12px] text-[#64748B] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
          <span>Autenticação própria com senha criptografada via BCrypt + JWT</span>
        </div>
      </div>
    </div>
  );
};
