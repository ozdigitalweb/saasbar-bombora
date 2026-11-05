import React from 'react';
import { Building2, RefreshCw, UserCheck, ChevronDown, LogOut, QrCode, Tv, Smartphone, BookOpen } from 'lucide-react';
import { Estabelecimento, Usuario } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';

interface HeaderProps {
  estabelecimentos: Estabelecimento[];
  currentEstabelecimento: Estabelecimento | null;
  onSelectEstabelecimento: (est: Estabelecimento) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date;
  currentUser: Usuario | null;
  onLogout: () => void;
  onOpenClienteMesa?: () => void;
  onOpenKdsFisico?: () => void;
  onOpenGarcomMobile?: () => void;
  onOpenManualAjuda?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  estabelecimentos,
  currentEstabelecimento,
  onSelectEstabelecimento,
  onRefresh,
  isRefreshing,
  lastUpdated,
  currentUser,
  onLogout,
  onOpenClienteMesa,
  onOpenKdsFisico,
  onOpenGarcomMobile,
  onOpenManualAjuda,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'gerente':
        return 'Gerente Geral';
      case 'operador_balcao':
        return 'Operador de Balcão';
      case 'garcom':
        return 'Garçom';
      default:
        return role || 'Usuário';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Active Establishment Context Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] bg-slate-100 flex items-center justify-center text-[#334155]">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              Estabelecimento Ativo
            </span>
            <div className="relative">
              <select
                aria-label="Selecionar Estabelecimento Ativo"
                value={currentEstabelecimento?.id || ''}
                onChange={(e) => {
                  const found = estabelecimentos.find((x) => x.id === e.target.value);
                  if (found) onSelectEstabelecimento(found);
                }}
                className="font-semibold text-[#0F172A] text-[0.875rem] pr-6 bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0D9488] rounded py-0.5 appearance-none"
              >
                {estabelecimentos.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nome}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-0 top-1.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Temporal freshness label required by DESIGN.md */}
        <div className="hidden md:flex items-center gap-2 text-[12px] text-[#64748B] bg-slate-50 px-2.5 py-1 rounded-[6px] border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sincronizado às {formatTime(lastUpdated)}</span>
        </div>
      </div>

      {/* Right: Surface Launchers, Refresh action, Profile & Logout */}
      <div className="flex items-center gap-2.5">
        {onOpenClienteMesa && (
          <button
            onClick={onOpenClienteMesa}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-[8px] transition-colors cursor-pointer shadow-2xs"
            title="Abrir tela do cliente na mesa (Autoatendimento QR)"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Cliente na Mesa</span>
          </button>
        )}

        {onOpenGarcomMobile && (
          <button
            onClick={onOpenGarcomMobile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-[8px] transition-colors cursor-pointer shadow-2xs"
            title="Abrir App Mobile do Garçom"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="hidden sm:inline">App Garçom</span>
          </button>
        )}

        {onOpenKdsFisico && (
          <button
            onClick={onOpenKdsFisico}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-[8px] transition-colors cursor-pointer shadow-2xs"
            title="Abrir Painel KDS para telas físicas de Copa & Cozinha"
          >
            <Tv className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Telão KDS</span>
          </button>
        )}

        {onOpenManualAjuda && (
          <button
            onClick={onOpenManualAjuda}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0F766E] bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-[8px] transition-colors cursor-pointer shadow-2xs"
            title="Abrir Manual Operacional & Help do Sistema"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="hidden sm:inline">Ajuda & Manual</span>
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[0.875rem] font-medium text-[#334155] border border-[#E2E8F0] rounded-[8px] hover:bg-slate-50 transition-colors disabled:opacity-60"
          title="Recarregar dados do banco de dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0D9488]' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>

        {currentUser && (
          <div className="flex items-center gap-3 pl-3 border-l border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-[13px] font-semibold text-[#0F172A] leading-tight">
                  {currentUser.nome}
                </span>
                <span className="text-[11px] text-[#0D9488] font-medium">
                  {getRoleLabel(currentUser.papel)}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors ml-1"
              title="Sair do sistema (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
