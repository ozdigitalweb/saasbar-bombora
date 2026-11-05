import React from 'react';
import {
  Building2,
  ChefHat,
  UtensilsCrossed,
  LayoutGrid,
  QrCode,
  Users2,
  UserCheck,
  Activity,
  Calendar,
  CalendarCheck,
  Percent,
  TrendingUp,
  Receipt,
  FileBarChart,
  Clock,
  Sparkles,
  Tv,
  Smartphone,
  BookOpen,
} from 'lucide-react';
import { EntityTab } from '../../types/index.ts';

interface SidebarProps {
  currentTab: EntityTab;
  onSelectTab: (tab: EntityTab) => void;
  counts: Record<string, number>;
  onOpenClienteMesa?: () => void;
  onOpenKdsFisico?: () => void;
  onOpenGarcomMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  onOpenClienteMesa,
  onOpenKdsFisico,
  onOpenGarcomMobile,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#E2E8F0]">
        <div className="w-8 h-8 rounded-[8px] bg-[#0D9488] flex items-center justify-center text-white font-bold text-base shadow-sm">
          SB
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#0F172A] tracking-tight text-[1rem]">
              SAASBAR
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[4px] bg-[#CCFBF1] text-[#0F766E]">
              Manager
            </span>
          </div>
          <span className="text-[11px] text-[#64748B]">Back-office Operacional</span>
        </div>
      </div>

      {/* Navigation Sections (Strictly ordered: Operação, Configuração, Equipe, Financeiro) */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* 1. OPERAÇÃO */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">
              Operação
            </span>
            <span className="text-[10px] text-[#0D9488] font-bold">Ao Vivo</span>
          </div>
          <ul className="space-y-0.5 text-[13px]">
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('monitor_comandas')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'monitor_comandas'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4" />
                  Monitor de Comandas
                </span>
                {counts.comandasAbertas !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                      currentTab === 'monitor_comandas'
                        ? 'bg-teal-800 text-white'
                        : 'bg-teal-50 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {counts.comandasAbertas}
                  </span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => onSelectTab('eventos')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'eventos'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4" />
                  Eventos & Turnos
                </span>
                {counts.eventos !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                      currentTab === 'eventos'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts.eventos}
                  </span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => onSelectTab('kds_status')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'kds_status'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Tv className="w-4 h-4" />
                  Monitor KDS (Cozinha)
                </span>
                <span
                  className={`text-[10px] px-1 rounded uppercase font-semibold ${
                    currentTab === 'kds_status'
                      ? 'bg-teal-800 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  TV KDS
                </span>
              </button>
            </li>

            {onOpenClienteMesa && (
              <li>
                <button
                  type="button"
                  onClick={onOpenClienteMesa}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 cursor-pointer shadow-2xs"
                >
                  <span className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    Cliente na Mesa (QR)
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                    Mobile
                  </span>
                </button>
              </li>
            )}

            {onOpenGarcomMobile && (
              <li>
                <button
                  type="button"
                  onClick={onOpenGarcomMobile}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 cursor-pointer shadow-2xs"
                >
                  <span className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-[#0D9488]" />
                    App do Garçom
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-teal-200 text-teal-900 font-bold">
                    Campo
                  </span>
                </button>
              </li>
            )}

            {onOpenKdsFisico && (
              <li>
                <button
                  type="button"
                  onClick={onOpenKdsFisico}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors text-slate-800 bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  <span className="flex items-center gap-2.5">
                    <Tv className="w-4 h-4 text-teal-400" />
                    Telão KDS Físico
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-teal-800 text-teal-200 font-bold">
                    TV
                  </span>
                </button>
              </li>
            )}

            <li>
              <div className="flex items-center justify-between px-3 py-2 rounded-[6px] text-slate-400 hover:bg-slate-50 cursor-not-allowed">
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Ocupação ao Vivo
                </span>
                <span className="text-[9px] uppercase px-1 rounded bg-slate-100 text-slate-400 font-medium">
                  Etapa 2
                </span>
              </div>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('rebalanceamento_equipe')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'rebalanceamento_equipe'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4" />
                  Rebalanceamento
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                    currentTab === 'rebalanceamento_equipe'
                      ? 'bg-teal-800 text-white'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  Equipe
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* 2. CONFIGURAÇÃO (Cadastros Ativos) */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">
              Configuração
            </span>
            <span className="text-[10px] text-[#0D9488] font-bold">Ativo</span>
          </div>
          <ul className="space-y-0.5 text-[13px]">
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('estabelecimento')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'estabelecimento'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4" />
                  Estabelecimento
                </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => onSelectTab('pontos_preparo')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'pontos_preparo'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ChefHat className="w-4 h-4" />
                  Pontos de Preparo
                </span>
                {counts.pontos !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                      currentTab === 'pontos_preparo'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts.pontos}
                  </span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => onSelectTab('cardapio')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'cardapio'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <UtensilsCrossed className="w-4 h-4" />
                  Cardápio & Itens
                </span>
                {counts.itens !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                      currentTab === 'cardapio'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts.itens}
                  </span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => onSelectTab('mesas')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'mesas'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4" />
                  Mesas (QR Code)
                </span>
                {counts.mesas !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                      currentTab === 'mesas'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts.mesas}
                  </span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => onSelectTab('pulseiras')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'pulseiras'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4" />
                  Pulseiras QR Code
                </span>
                {counts.pulseiras !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                      currentTab === 'pulseiras'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts.pulseiras}
                  </span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => onSelectTab('usuarios')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'usuarios'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users2 className="w-4 h-4" />
                  Usuários & Papéis
                </span>
                {counts.usuarios !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                      currentTab === 'usuarios'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts.usuarios}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>

        {/* 3. EQUIPE */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Equipe
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Gestão</span>
          </div>
          <ul className="space-y-0.5 text-[13px]">
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('usuarios')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[#334155] hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  Garçons e Balcão
                </span>
                <span className="text-[10px] text-[#0D9488] font-medium">Ver Usuários</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('rebalanceamento_equipe')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'rebalanceamento_equipe'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4" />
                  Áreas / Mesas Atribuídas
                </span>
                <span className="text-[10px] text-[#0D9488] font-bold">Ativo</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('rebalanceamento_equipe')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'rebalanceamento_equipe'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Percent className="w-4 h-4" />
                  Metas de Comissão
                </span>
                <span className="text-[10px] text-[#0D9488] font-bold">Ativo</span>
              </button>
            </li>
          </ul>
        </div>

        {/* 4. FINANCEIRO */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Financeiro
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Caixa</span>
          </div>
          <ul className="space-y-0.5 text-[13px]">
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('clientes')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'clientes'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  Clientes & Fidelidade
                </span>
                {counts.clientes !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-[4px] font-semibold ${
                      currentTab === 'clientes'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts.clientes}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('fechamento_rateio')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'fechamento_rateio'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4" />
                  Pagamentos & Rateio
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-[4px] font-bold ${
                    currentTab === 'fechamento_rateio'
                      ? 'bg-teal-800 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  Caixa
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('relatorios_fidelidade')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors ${
                  currentTab === 'relatorios_fidelidade'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#334155] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileBarChart className="w-4 h-4" />
                  Relatórios & Fidelidade
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-[4px] font-bold ${
                    currentTab === 'relatorios_fidelidade'
                      ? 'bg-teal-800 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  2 Estrelas
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* 5. AJUDA & TREINAMENTO */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">
              Suporte & Guia
            </span>
            <span className="text-[10px] text-[#0D9488] font-bold">Help</span>
          </div>
          <ul className="space-y-0.5 text-[13px]">
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('manual_ajuda')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] font-medium transition-colors cursor-pointer ${
                  currentTab === 'manual_ajuda'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#0F766E] bg-teal-50/50 hover:bg-teal-100/70 border border-teal-200/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[#0D9488]" />
                  Manual & Ajuda (Help)
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-[4px] font-bold ${
                    currentTab === 'manual_ajuda'
                      ? 'bg-teal-800 text-white'
                      : 'bg-[#CCFBF1] text-[#0F766E]'
                  }`}
                >
                  UX
                </span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Database & Stack Info in Footer */}
      <div className="p-3 border-t border-[#E2E8F0] bg-slate-50/70 text-[11px] text-[#64748B]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">PostgreSQL Cloud SQL</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          Drizzle ORM • Multi-tenant
        </div>
      </div>
    </aside>
  );
};
