import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Tv,
  QrCode,
  Receipt,
  Users2,
  UtensilsCrossed,
  Sparkles,
  TrendingUp,
  Clock,
  HelpCircle,
  ChefHat,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkle,
  Zap,
  Clapperboard,
  Film,
} from 'lucide-react';
import { EntityTab, Usuario } from '../../types/index.ts';
import { StoryboardTutorialSection } from './StoryboardTutorialSection.tsx';

interface ManualAjudaViewProps {
  currentUser: Usuario | null;
  onNavigateTab: (tab: EntityTab) => void;
  onOpenClienteMesa: () => void;
  onOpenKdsFisico: () => void;
  onOpenGarcomMobile: () => void;
  onOpenLancamentoRapido: () => void;
  onOpenCheckIn: () => void;
}

type RoleFilter = 'all' | 'garcom' | 'operador_balcao' | 'gerente' | 'kds' | 'cliente';

export const ManualAjudaView: React.FC<ManualAjudaViewProps> = ({
  currentUser,
  onNavigateTab,
  onOpenClienteMesa,
  onOpenKdsFisico,
  onOpenGarcomMobile,
  onOpenLancamentoRapido,
  onOpenCheckIn,
}) => {
  const [activeMainMode, setActiveMainMode] = useState<'storyboard' | 'modulos'>('storyboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRole, setActiveRole] = useState<RoleFilter>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('storyboard_13_cenas');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Topics catalogue
  const topics = useMemo(
    () => [
      {
        id: 'storyboard_13_cenas',
        title: '🎬 Roteiro Storyboard (13 Cenas)',
        subtitle: 'A jornada completa de Ana: check-in na mesa, KDS, garçom, caixa e fidelidade',
        roles: ['gerente', 'garcom', 'operador_balcao', 'kds', 'cliente'] as RoleFilter[],
        icon: Clapperboard,
        badge: 'Roteiro Oficial',
        readTime: '6 min de jornada',
      },
      {
        id: 'ciclo_geral',
        title: 'Fluxo Operacional de Ponta a Ponta',
        subtitle: 'Como o bar opera desde a chegada do cliente até o pagamento final',
        roles: ['gerente', 'garcom', 'operador_balcao'] as RoleFilter[],
        icon: Zap,
        badge: 'Fundamental',
        readTime: '4 min de leitura',
      },
      {
        id: 'app_garcom',
        title: 'App Mobile do Garçom (As 5 Abas)',
        subtitle: 'Operação de campo em smartphones e tablets sem papel e sem atritos',
        roles: ['garcom', 'gerente'] as RoleFilter[],
        icon: Smartphone,
        badge: 'Operação de Campo',
        readTime: '5 min de leitura',
      },
      {
        id: 'autoatendimento_mesa',
        title: 'Autoatendimento na Mesa via QR Code',
        subtitle: 'Experiência do cliente sem aplicativo, com mesa liberada e pedidos diretos',
        roles: ['cliente', 'garcom', 'gerente'] as RoleFilter[],
        icon: QrCode,
        badge: 'Experiência do Cliente',
        readTime: '3 min de leitura',
      },
      {
        id: 'kds_cozinha_bar',
        title: 'Painel KDS de Cozinha e Bar (Telões Físicos)',
        subtitle: 'Roteamento inteligente por praça, cronômetro de preparo e metas de tempo',
        roles: ['kds', 'gerente', 'operador_balcao'] as RoleFilter[],
        icon: Tv,
        badge: 'Praças de Preparo',
        readTime: '4 min de leitura',
      },
      {
        id: 'fechamento_rateio_whatsapp',
        title: 'Fechamento de Conta, Rateio & WhatsApp',
        subtitle: '10% de serviço, gorjeta livre, divisão automática e envio de recibo sem papel',
        roles: ['operador_balcao', 'garcom', 'gerente'] as RoleFilter[],
        icon: Receipt,
        badge: 'Caixa & Financeiro',
        readTime: '4 min de leitura',
      },
      {
        id: 'fidelidade_estrelas',
        title: 'Programa de Fidelidade (Estrelas Azul & Amarela)',
        subtitle: 'Chopp cortesia a cada 3 visitas e benefícios por ticket médio',
        roles: ['gerente', 'operador_balcao'] as RoleFilter[],
        icon: Sparkles,
        badge: 'Retenção de Clientes',
        readTime: '3 min de leitura',
      },
      {
        id: 'rebalanceamento_equipe',
        title: 'Rebalanceamento de Mesas por Tempo de Resposta',
        subtitle: 'Distribuição justa e dinâmica de mesas baseada na agilidade da equipe',
        roles: ['gerente'] as RoleFilter[],
        icon: TrendingUp,
        badge: 'Gestão Inteligente',
        readTime: '3 min de leitura',
      },
      {
        id: 'cadastros_iniciais',
        title: 'Configuração Inicial & Cadastros',
        subtitle: 'Montagem de pontos de preparo, cardápio, mesas, pulseiras e equipe',
        roles: ['gerente'] as RoleFilter[],
        icon: Building2,
        badge: 'Setup',
        readTime: '4 min de leitura',
      },
    ],
    []
  );

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchesRole = activeRole === 'all' || t.roles.includes(activeRole);
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [topics, activeRole, searchQuery]);

  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || topics[0];
  }, [topics, selectedTopicId]);

  // Frequently Asked Questions
  const faqs = [
    {
      id: 'faq-1',
      question: 'Por que o cliente vê "Mesa não liberada" ao ler o QR Code?',
      answer:
        'Por regra de segurança, a mesa começa como "Livre". Ela só aceita pedidos do cliente após um garçom ou operador de balcão realizar a abertura (check-in) da comanda para aquela mesa. Isso impede que pessoas de fora façam pedidos fraudulentos em mesas vazias.',
      actionLabel: 'Ver Monitor de Comandas',
      onAction: () => onNavigateTab('monitor_comandas'),
    },
    {
      id: 'faq-2',
      question: 'O cliente pode pagar e fechar a comanda direto no celular dele?',
      answer:
        'Não! A tela do cliente na mesa é exclusiva para consulta de cardápio e envio de pedidos. O fechamento e recebimento de valores é feito 100% pela equipe (no app mobile do garçom ou no caixa/balcão), garantindo conferência financeira física e emissão do recibo.',
      actionLabel: 'Ir para Caixa & Rateio',
      onAction: () => onNavigateTab('fechamento_rateio'),
    },
    {
      id: 'faq-3',
      question: 'Como funciona a tolerância de 30 minutos na perda de pulseira?',
      answer:
        'Ao registrar uma pulseira como perdida, o sistema bloqueia novos lançamentos nela imediatamente. O cliente tem 30 minutos de tolerância sem cobrança de itens lançados indevidamente por terceiros após a comunicação da perda.',
      actionLabel: 'Abrir App do Garçom (Perda)',
      onAction: onOpenGarcomMobile,
    },
    {
      id: 'faq-4',
      question: 'Como o garçom recebe os 10% ou a gorjeta livre?',
      answer:
        'No momento do fechamento da comanda, o sistema calcula a taxa de serviço (10% padrão ou gorjeta livre digitada) e credita o rateio automaticamente para o garçom responsável e para os operadores de bar/cozinha.',
      actionLabel: 'Ver Rateios no Caixa',
      onAction: () => onNavigateTab('fechamento_rateio'),
    },
    {
      id: 'faq-5',
      question: 'O que indicam as cores verde, âmbar e vermelho no KDS?',
      answer:
        'Verde significa preparo dentro do tempo padrão (< 5 min). Âmbar alerta que o tempo está intermediário (5 a 10 min). Vermelho com pulso indica tempo crítico (> 10 min ou acima da meta do evento), exigindo atenção imediata do chef ou bartender.',
      actionLabel: 'Abrir Telão KDS',
      onAction: onOpenKdsFisico,
    },
    {
      id: 'faq-6',
      question: 'Como o cliente conquista o Chopp Cortesia?',
      answer:
        'A cada 3 visitas registradas no sistema, o cliente ganha 1 Estrela Azul e 1 Chopp de Cortesia para resgate. O operador ou garçom pode efetuar o resgate no momento da conta com 1 clique.',
      actionLabel: 'Ver Fidelidade',
      onAction: () => onNavigateTab('relatorios_fidelidade'),
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0F766E] to-[#0D9488] rounded-[16px] text-white p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <BookOpen className="w-80 h-80" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkle className="w-3.5 h-3.5" />
            <span>Central de Aprendizado e Ajuda Interativa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Manual Operacional do SAASBAR
          </h1>
          <p className="text-slate-100 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            Domine todas as funcionalidades do sistema com tutoriais visuais ilustrados,
            fluxos práticos de atendimento e links diretos para testar e operar cada ferramenta em tempo real.
          </p>

          {/* Quick Access Badges to Surfaces */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-teal-500/30">
            <span className="text-xs text-teal-200 font-medium">Acessos Rápidos às Telas:</span>
            <button
              onClick={onOpenGarcomMobile}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer border border-white/20"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-300" />
              App do Garçom
            </button>
            <button
              onClick={onOpenClienteMesa}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer border border-white/20"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              Autoatendimento na Mesa
            </button>
            <button
              onClick={onOpenKdsFisico}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer border border-white/20"
            >
              <Tv className="w-3.5 h-3.5 text-cyan-300" />
              Telão KDS Físico
            </button>
            <button
              onClick={onOpenLancamentoRapido}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-teal-400 text-slate-900 hover:bg-teal-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Lançamento Rápido
            </button>
          </div>
        </div>
      </div>

      {/* Main Switcher: Storyboard vs Detailed Modules */}
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setActiveMainMode('storyboard');
              setSelectedTopicId('storyboard_13_cenas');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
              activeMainMode === 'storyboard'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>🎬 Roteiro Storyboard (13 Cenas Ilustradas)</span>
          </button>

          <button
            onClick={() => setActiveMainMode('modulos')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
              activeMainMode === 'modulos'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 Guias por Módulo & Dúvidas (FAQ)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          {activeMainMode === 'storyboard' ? (
            <span className="flex items-center gap-1 text-[#0D9488] font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Modo Roteiro Oficial Ativo
            </span>
          ) : (
            <span>Base de Conhecimento & Procedimentos Operacionais</span>
          )}
        </div>
      </div>

      {/* Storyboard View Mode */}
      {activeMainMode === 'storyboard' && (
        <div className="space-y-6">
          <StoryboardTutorialSection
            onNavigateTab={onNavigateTab}
            onOpenClienteMesa={onOpenClienteMesa}
            onOpenKdsFisico={onOpenKdsFisico}
            onOpenGarcomMobile={onOpenGarcomMobile}
            onOpenLancamentoRapido={onOpenLancamentoRapido}
            onOpenCheckIn={onOpenCheckIn}
          />

          {/* Quick link card to modules */}
          <div className="bg-slate-50 border border-slate-200 rounded-[14px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <strong className="text-xs font-bold text-slate-900 block">
                Quer pesquisar regras específicas de negócio ou tirar dúvidas?
              </strong>
              <p className="text-xs text-slate-600">
                Consulte nossos guias detalhados por função (Garçom, Balcão/Caixa, KDS, Gerente) e as perguntas frequentes.
              </p>
            </div>
            <button
              onClick={() => setActiveMainMode('modulos')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-[8px] text-xs font-bold text-slate-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-[#0D9488]" />
              <span>Ver Guias por Módulo & FAQ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modules & Detailed FAQ Mode */}
      {activeMainMode === 'modulos' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquise por função (ex: garçom, kds, whatsapp, chopp, 10%)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-[8px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Interactive Role Tabs (Buttons) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Todos os Módulos' },
              { id: 'garcom', label: 'Garçom' },
              { id: 'operador_balcao', label: 'Balcão / Caixa' },
              { id: 'gerente', label: 'Gerente' },
              { id: 'kds', label: 'KDS (Cozinha/Bar)' },
              { id: 'cliente', label: 'Cliente (Mesa)' },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id as RoleFilter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] whitespace-nowrap transition-colors cursor-pointer ${
                  activeRole === role.id
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Learning Hub Layout: Left Master List / Right Detail Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Topics Index */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tópicos de Treinamento ({filteredTopics.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full text-left p-3.5 rounded-[10px] border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-teal-50/70 border-[#0D9488] ring-1 ring-[#0D9488]/30 shadow-xs'
                      : 'bg-white border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-[#0D9488] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-[#0F766E]' : 'text-slate-900'
                        }`}
                      >
                        {topic.title}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-[#0D9488]' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{topic.subtitle}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium">
                      <span>{topic.badge}</span>
                      <span aria-hidden="true">·</span>
                      <span>{topic.readTime}</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredTopics.length === 0 && (
              <div className="p-6 text-center bg-white border border-[#E2E8F0] rounded-[10px] text-slate-500 text-xs">
                Nenhum tópico encontrado para a busca "{searchQuery}".
              </div>
            )}
          </div>

          {/* Quick Cheatsheet Summary Card */}
          <div className="mt-6 p-4 rounded-[12px] bg-slate-900 text-white text-xs space-y-3">
            <div className="flex items-center gap-2 text-teal-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Regras Críticas da Operação</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Mesa Livre:</strong> Não recebe pedidos até ser liberada pelo garçom.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>
                  <strong>KDS de Praça Fixa:</strong> Nunca misture copa e cozinha no mesmo telão.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Fechamento Seguro:</strong> O cliente nunca fecha sozinho; equipe confere.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Content Area: Detailed Guide with Interactive Illustrations */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-xs">
            {/* Guide Header */}
            <div className="border-b border-[#E2E8F0] pb-6 mb-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="font-semibold text-[#0D9488] uppercase tracking-wider">
                  {currentTopic.badge}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentTopic.readTime}</span>
                <span aria-hidden="true">·</span>
                <span>Público: {currentTopic.roles.join(', ')}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                {currentTopic.title}
              </h2>
              <p className="text-sm text-slate-600 mt-1">{currentTopic.subtitle}</p>
            </div>

            {/* Dynamic Detailed Content Based on Selected Topic */}
            {selectedTopicId === 'storyboard_13_cenas' && (
              <div className="space-y-6">
                <StoryboardTutorialSection
                  onNavigateTab={onNavigateTab}
                  onOpenClienteMesa={onOpenClienteMesa}
                  onOpenKdsFisico={onOpenKdsFisico}
                  onOpenGarcomMobile={onOpenGarcomMobile}
                  onOpenLancamentoRapido={onOpenLancamentoRapido}
                  onOpenCheckIn={onOpenCheckIn}
                />
              </div>
            )}

            {selectedTopicId === 'ciclo_geral' && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                  <p>
                    O <strong>SAASBAR</strong> foi arquitetado para garantir que a equipe nunca perca tempo com papel, comandas perdidas ou confusão no atendimento. O ciclo operacional divide-se em 5 etapas sincronizadas em tempo real com o banco de dados.
                  </p>
                </div>

                {/* Illustrated Flow Diagram */}
                <div className="p-5 rounded-[12px] bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0D9488]" />
                    Diagrama Ilustrado do Fluxo Operacional
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-3 bg-white border border-slate-200 rounded-[8px] shadow-2xs flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0D9488] font-bold text-xs flex items-center justify-center mb-1.5">
                        1
                      </div>
                      <span className="text-xs font-bold text-slate-800">Check-in</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Mesa liberada ou Pulseira vinculada
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-[8px] shadow-2xs flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0D9488] font-bold text-xs flex items-center justify-center mb-1.5">
                        2
                      </div>
                      <span className="text-xs font-bold text-slate-800">Pedido</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Garçom, Balcão ou QR da Mesa
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-[8px] shadow-2xs flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0D9488] font-bold text-xs flex items-center justify-center mb-1.5">
                        3
                      </div>
                      <span className="text-xs font-bold text-slate-800">KDS Roteado</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Cozinha prepara comida / Bar bebidas
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-[8px] shadow-2xs flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0D9488] font-bold text-xs flex items-center justify-center mb-1.5">
                        4
                      </div>
                      <span className="text-xs font-bold text-slate-800">Entrega</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Garçom é avisado na Fila e entrega
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-[8px] shadow-2xs flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0D9488] font-bold text-xs flex items-center justify-center mb-1.5">
                        5
                      </div>
                      <span className="text-xs font-bold text-slate-800">Fechamento</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Rateio 10% + Recibo no WhatsApp
                      </span>
                    </div>
                  </div>
                </div>

                {/* Practical Steps */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Como executar no dia a dia:</h4>

                  <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-white border border-slate-200">
                    <span className="text-xs font-extrabold w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      1
                    </span>
                    <div className="text-xs text-slate-700 space-y-1">
                      <strong className="text-slate-900 block">Abrir Comanda / Check-in da Mesa:</strong>
                      Quando o cliente chega, o garçom seleciona a mesa no App Mobile ou no Monitor de Comandas e toca em "Liberar Mesa". A comanda passa para o status "Aberta", permitindo que o cliente peça pelo QR da mesa ou que a equipe lance itens.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-white border border-slate-200">
                    <span className="text-xs font-extrabold w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      2
                    </span>
                    <div className="text-xs text-slate-700 space-y-1">
                      <strong className="text-slate-900 block">Roteamento Automático de Pedidos:</strong>
                      Se o cliente pede 1 Chopp IPA e 1 Hambúrguer Artesanal, o sistema separa os itens automaticamente: o chopp vai direto para o telão do Bar/Copa, e o hambúrguer vai para o telão da Cozinha.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-white border border-slate-200">
                    <span className="text-xs font-extrabold w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      3
                    </span>
                    <div className="text-xs text-slate-700 space-y-1">
                      <strong className="text-slate-900 block">Pronto no KDS e Alerta ao Garçom:</strong>
                      Assim que o cozinheiro ou bartender toca em "Marcar Pronto", o item entra instantaneamente na "Fila de Entrega" do Garçom com um badge luminoso, cronômetro de meta e aviso sonoro/visual.
                    </div>
                  </div>
                </div>

                {/* Actionable Deep Links */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigateTab('monitor_comandas')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    Abrir Monitor de Comandas
                  </button>
                  <button
                    onClick={onOpenCheckIn}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                  >
                    Simular Novo Check-in
                  </button>
                </div>
              </div>
            )}

            {selectedTopicId === 'app_garcom' && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                  <p>
                    O <strong>App Mobile do Garçom</strong> foi desenhado com ergonomia de alta performance para operação com uma mão só em smartphones ou maquininhas inteligentes. Ele possui 5 abas essenciais:
                  </p>
                </div>

                {/* 5 Tabs Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-[10px] border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <Users2 className="w-4 h-4 text-[#0D9488]" />
                      <span>Aba 1: Atendimento</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Busca instantânea de clientes por telefone (com saudação VIP e contador de visitas), liberação de mesas em 1 toque e comunicação de pulseira perdida com tolerância de 30 min.
                    </p>
                  </div>

                  <div className="p-4 rounded-[10px] border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <UtensilsCrossed className="w-4 h-4 text-[#0D9488]" />
                      <span>Aba 2: Fazer Pedido</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Alternância rápida entre "Na Mesa" e "Na Pulseira". Cards de itens com botões de toque com tamanho mínimo de 48px para agilidade mesmo em salões lotados.
                    </p>
                  </div>

                  <div className="p-4 rounded-[10px] border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <Clock className="w-4 h-4 text-[#0D9488]" />
                      <span>Aba 3: Fila de Entrega</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Badge numérico visível de qualquer aba. Cronômetro dinâmico em segundos: se ultrapassar a meta configurada pelo gerente (ex: 2 min), pisca em vermelho até o garçom tocar em "Recebi".
                    </p>
                  </div>

                  <div className="p-4 rounded-[10px] border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <Receipt className="w-4 h-4 text-[#0D9488]" />
                      <span>Aba 4: Fechar Conta</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Cálculo de 10% ou gorjeta livre, recebimento PIX/Cartão e geração instantânea de link de recibo formatado para WhatsApp (wa.me) para envio direto ao cliente.
                    </p>
                  </div>

                  <div className="p-4 rounded-[10px] border border-slate-200 bg-slate-50 space-y-2 sm:col-span-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <TrendingUp className="w-4 h-4 text-[#0D9488]" />
                      <span>Aba 5: Meu Perfil (Privacidade Absoluta)</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Exibe apenas o desempenho individual do garçom logado (tempo médio de resposta, status perante a meta e comissão acumulada). Não exibe dados de outros funcionários para manter um clima saudável na equipe.
                    </p>
                  </div>
                </div>

                {/* Actionable Deep Links */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onOpenGarcomMobile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    Abrir App do Garçom Agora
                  </button>
                  <button
                    onClick={() => onNavigateTab('usuarios')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                  >
                    Gerenciar Usuários & Garçons
                  </button>
                </div>
              </div>
            )}

            {selectedTopicId === 'autoatendimento_mesa' && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                  <p>
                    O <strong>Autoatendimento na Mesa</strong> funciona direto no navegador do celular do cliente ao escanear o QR Code fixado na mesa. Não exige download na App Store nem cadastro burocrático de CPF.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-[12px] bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Estado 1: Mesa Não Liberada (Modo Consulta)</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Se o cliente escanear o QR de uma mesa vaga, ele consegue ver fotos, descrições e preços, mas o botão de enviar pedido fica travado com o aviso: <em>"Aguardando liberação pelo garçom"</em>.
                    </p>
                  </div>

                  <div className="p-4 rounded-[12px] bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Estado 2: Mesa Liberada (Modo Pedido Ativo)</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Assim que o garçom abre a comanda, o cliente adiciona itens ao carrinho, revisa e envia. O pedido vai direto para os telões KDS da Copa e Cozinha com a origem "Autoatendimento".
                    </p>
                  </div>
                </div>

                {/* Multiple devices note */}
                <div className="p-4 rounded-[10px] bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <strong className="text-slate-900 block font-bold">
                    Múltiplos Celulares na Mesma Mesa:
                  </strong>
                  <p>
                    Se 4 amigos sentarem na mesa 10 e todos escanearem o QR Code, todos verão os mesmos pedidos acumulados em tempo real na comanda compartilhada daquela mesa.
                  </p>
                </div>

                {/* Actionable Deep Links */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onOpenClienteMesa}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    Testar Tela do Cliente na Mesa
                  </button>
                  <button
                    onClick={() => onNavigateTab('mesas')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                  >
                    Ver Lista de Mesas & QR Codes
                  </button>
                </div>
              </div>
            )}

            {selectedTopicId === 'kds_cozinha_bar' && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                  <p>
                    O <strong>Kitchen Display System (KDS)</strong> do SAASBAR substitui as impressoras térmicas barulhentas por telas de TV ou tablets instalados nas praças de preparo (Copa/Bar, Cozinha Quente, Parrilla, etc.).
                  </p>
                </div>

                {/* Color-coded SLAs */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Sinalização Visual de Tempo de Espera:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-[8px] bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Normal (&lt; 5 min)</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Item recém-chegado. Preparo dentro do tempo esperado de excelência.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[8px] bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Alerta (5 a 10 min)</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Item aguardando há mais de 5 minutos. Requer atenção do cozinheiro/bartender.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[8px] bg-red-50 border border-red-300 text-xs text-red-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        <span>Crítico (&gt; 10 min)</span>
                      </div>
                      <p className="text-[11px] text-red-800">
                        Atraso detectado perante a meta do evento. Borda vermelha pulsante.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Praça Fixa principle */}
                <div className="p-4 rounded-[10px] bg-slate-900 text-white text-xs space-y-2">
                  <div className="flex items-center gap-2 text-teal-400 font-bold">
                    <Tv className="w-4 h-4" />
                    <span>Princípio da Praça Fixa (Sem Botão "Todas as Praças")</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Para evitar que o cozinheiro veja pedidos de chopp ou que o bartender veja pedidos de filé, a tela física do KDS é travada na praça correspondente e salva no navegador (localStorage). Ao recarregar a TV, ela nunca perde a praça configurada.
                  </p>
                </div>

                {/* Actionable Deep Links */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onOpenKdsFisico}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
                  >
                    <Tv className="w-4 h-4 text-teal-400" />
                    Abrir Telão KDS Físico
                  </button>
                  <button
                    onClick={() => onNavigateTab('pontos_preparo')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                  >
                    Configurar Pontos de Preparo
                  </button>
                </div>
              </div>
            )}

            {selectedTopicId === 'fechamento_rateio_whatsapp' && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                  <p>
                    O módulo de <strong>Fechamento & Rateio</strong> simplifica o fechamento de contas e o caixa do bar, com transparência total e divisão automática de gorjetas entre o salão e a retaguarda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-[10px] border border-slate-200 bg-slate-50 space-y-2">
                    <strong className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#0D9488]" />
                      Opções de Contribuição do Cliente
                    </strong>
                    <ul className="text-xs text-slate-600 space-y-1.5">
                      <li>• <strong>Taxa Padrão (10%):</strong> Calculada sobre o consumo total.</li>
                      <li>• <strong>Gorjeta Livre:</strong> Valor customizado digitado pelo cliente.</li>
                      <li>• <strong>Sem Taxa:</strong> Fechamento estritamente pelo valor dos itens.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-[10px] border border-slate-200 bg-slate-50 space-y-2">
                    <strong className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      Recibo sem Papel via WhatsApp (wa.me)
                    </strong>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ao finalizar o pagamento (PIX ou Cartão), o sistema gera um link direto para o WhatsApp do cliente com o detalhamento item a item, subtotal, taxa de serviço e comprovante fiscal, poupando bobinas de papel térmico.
                    </p>
                  </div>
                </div>

                {/* Rateio explanation */}
                <div className="p-4 rounded-[10px] bg-teal-50/70 border border-teal-200 text-xs text-teal-900 space-y-1">
                  <strong className="block font-bold">Rateio Transparente:</strong>
                  <span>
                    A comissão da taxa de serviço é rateada de acordo com as regras configuradas no estabelecimento, beneficiando o garçom responsável pelo atendimento e a equipe de suporte (bar e cozinha).
                  </span>
                </div>

                {/* Actionable Deep Links */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigateTab('fechamento_rateio')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    Ir para Fechamento & Caixa
                  </button>
                  <button
                    onClick={onOpenGarcomMobile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                  >
                    Testar Fechamento no App do Garçom
                  </button>
                </div>
              </div>
            )}

            {selectedTopicId === 'fidelidade_estrelas' && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                  <p>
                    O sistema de fidelidade do SAASBAR trabalha com <strong>duas estrelas exclusivas</strong>, incentivando tanto a frequência quanto o valor gasto por mesa.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-[12px] bg-blue-50 border border-blue-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Estrela Azul: Ciclos de Frequência (Chopp Cortesia)</span>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      A cada <strong>3 visitas</strong> concluídas com consumo, o cliente conquista 1 Estrela Azul e ganha 1 Chopp de Cortesia.
                    </p>
                    <div className="p-2.5 rounded-[6px] bg-white border border-blue-100 text-[11px] text-blue-900">
                      1ª visita (1/3) → 2ª visita (2/3) → <strong>3ª visita: 1 Estrela + Chopp Liberado!</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-[12px] bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                      <Sparkle className="w-4 h-4 text-amber-600" />
                      <span>Estrela Amarela: Ticket Médio VIP</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Classifica o cliente automaticamente pelo histórico de consumo médio:
                    </p>
                    <ul className="text-[11px] text-amber-900 space-y-1">
                      <li>• <strong>Baixo:</strong> Até R$ 100 por visita.</li>
                      <li>• <strong>Médio:</strong> De R$ 100 a R$ 500 por visita.</li>
                      <li>• <strong>VIP:</strong> Acima de R$ 500 (Atendimento Prioritário).</li>
                    </ul>
                  </div>
                </div>

                {/* Actionable Deep Links */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigateTab('relatorios_fidelidade')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ver Relatórios de Fidelidade
                  </button>
                  <button
                    onClick={() => onNavigateTab('clientes')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                  >
                    Cadastrar / Consultar Clientes
                  </button>
                </div>
              </div>
            )}

            {selectedTopicId === 'rebalanceamento_equipe' && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                  <p>
                    O <strong>Rebalanceamento de Mesas</strong> equilibra a carga de trabalho do salão de maneira científica, garantindo que clientes nunca fiquem esperando e que os garçons mais ágeis recebam o volume correto de atendimento.
                  </p>
                </div>

                <div className="p-4 rounded-[10px] bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <strong className="text-slate-900 block font-bold">
                    Como funciona o algoritmo por Tempo de Resposta:
                  </strong>
                  <p className="leading-relaxed">
                    O sistema mede quanto tempo cada garçom leva entre o item ficar pronto no KDS e o toque de "Recebi". Garçons com tempo de resposta mais baixo (mais rápidos) têm capacidade comprovada de atender mais mesas simultaneamente sem queda na qualidade.
                  </p>
                  <div className="p-3 bg-white border border-slate-200 rounded-[6px] text-[11px] text-slate-800">
                    <strong>Exemplo:</strong> Se o Garçom A atende em 2 min e o Garçom B em 8 min, em um salão com 20 mesas o algoritmo propõe 15 mesas para A e 5 mesas para B, evitando que o salão engargale.
                  </div>
                </div>

                {/* Actionable Deep Links */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigateTab('rebalanceamento_equipe')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Abrir Painel de Rebalanceamento
                  </button>
                </div>
              </div>
            )}

            {selectedTopicId === 'cadastros_iniciais' && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                  <p>
                    Para inaugurar ou configurar uma nova unidade no SAASBAR, siga a sequência recomendada abaixo para garantir que todas as dependências estejam perfeitas:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-[8px] bg-white border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Passo 1: Criar Pontos de Preparo
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ex: "Copa / Bar Principal", "Cozinha Quente", "Parrilla".
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('pontos_preparo')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                    >
                      Cadastrar
                    </button>
                  </div>

                  <div className="p-3.5 rounded-[8px] bg-white border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Passo 2: Cadastrar Cardápio & Roteamento
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Cada produto deve apontar para o seu Ponto de Preparo de destino.
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('cardapio')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                    >
                      Cadastrar
                    </button>
                  </div>

                  <div className="p-3.5 rounded-[8px] bg-white border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Passo 3: Criar Mesas com QR Code
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Geração automática de QR para impressão nas mesas físicas.
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('mesas')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                    >
                      Cadastrar
                    </button>
                  </div>

                  <div className="p-3.5 rounded-[8px] bg-white border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Passo 4: Cadastrar Usuários & Papéis
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Gerente, Garçom e Operador de Balcão com senhas seguras.
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('usuarios')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                    >
                      Cadastrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive FAQ & Troubleshooting Accordion */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-[#0D9488]" />
              <h3 className="text-lg font-bold text-slate-900">Perguntas Frequentes & Resolução de Dúvidas</h3>
            </div>
            <p className="text-xs text-slate-500">
              Respostas rápidas e práticas para as situações mais comuns do dia a dia no salão:
            </p>

            <div className="space-y-2 pt-2">
              {faqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border border-slate-200 rounded-[8px] overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100/70 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-900">{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                          isExpanded ? 'rotate-180 text-[#0D9488]' : ''
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="p-4 bg-white text-xs text-slate-700 border-t border-slate-200 space-y-3 animate-fadeIn">
                        <p className="leading-relaxed">{faq.answer}</p>
                        <div className="pt-2">
                          <button
                            onClick={faq.onAction}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:text-teal-700 transition-colors cursor-pointer"
                          >
                            <span>{faq.actionLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
  );
};
