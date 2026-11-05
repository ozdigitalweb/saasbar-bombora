import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Beer,
  Award,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Calendar,
  FileBarChart,
  TrendingUp,
  User,
  ShoppingBag,
} from 'lucide-react';
import {
  Cliente,
  Evento,
  Estabelecimento,
  ComandaSummary,
  FidelidadeExtrato,
  MultaPulseiraCalculo,
} from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { ComunicarPulseiraPerdidaModal } from '../operations/ComunicarPulseiraPerdidaModal.tsx';

interface RelatoriosFidelidadeViewProps {
  currentEstabelecimento: Estabelecimento | null;
  activeEvento: Evento | null;
  comandas: ComandaSummary[];
  onOpenCheckout?: (comandaId: string) => void;
}

export const RelatoriosFidelidadeView: React.FC<RelatoriosFidelidadeViewProps> = ({
  currentEstabelecimento,
  activeEvento,
  comandas,
  onOpenCheckout,
}) => {
  const [activeTab, setActiveTab] = useState<'fidelidade' | 'pulseira_perdida' | 'relatorios'>('fidelidade');

  // Fidelidade State
  const [ranking, setRanking] = useState<FidelidadeExtrato[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [selectedClienteExtrato, setSelectedClienteExtrato] = useState<FidelidadeExtrato | null>(null);
  const [isResgatando, setIsResgatando] = useState(false);

  // Pulseira Perdida State
  const [multas, setMultas] = useState<any[]>([]);
  const [isLoadingMultas, setIsLoadingMultas] = useState(false);
  const [isModalComunicarOpen, setIsModalComunicarOpen] = useState(false);
  const [calculoAtivo, setCalculoAtivo] = useState<MultaPulseiraCalculo | null>(null);
  const [isLoadingCalculo, setIsLoadingCalculo] = useState(false);

  // Feedback Toast / Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Fidelidade Ranking
  const loadFidelidade = async () => {
    if (!currentEstabelecimento) return;
    setIsLoadingRanking(true);
    try {
      const data = await api.getFidelidadeRanking(currentEstabelecimento.id);
      setRanking(data);
    } catch (e: any) {
      console.error('Failed to load fidelidade:', e);
    } finally {
      setIsLoadingRanking(false);
    }
  };

  // Load Multas Pulseiras
  const loadMultas = async () => {
    setIsLoadingMultas(true);
    try {
      const data = await api.getPulseirasPerdidas(activeEvento?.id);
      setMultas(data);
    } catch (e: any) {
      console.error('Failed to load multas pulseiras:', e);
    } finally {
      setIsLoadingMultas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fidelidade') {
      loadFidelidade();
    } else if (activeTab === 'pulseira_perdida') {
      loadMultas();
    }
  }, [activeTab, currentEstabelecimento, activeEvento]);

  // Resgatar Chopp de Cortesia
  const handleResgatarChopp = async (clienteId: string) => {
    setIsResgatando(true);
    setFeedback(null);
    try {
      const res = await api.resgatarChoppCortesia(clienteId);
      setFeedback({
        type: 'success',
        message: `${res.mensagem} (Restantes: ${res.restantes} cortesia(s))`,
      });
      await loadFidelidade();
      if (selectedClienteExtrato?.cliente.id === clienteId) {
        const updated = await api.getFidelidadeCliente(clienteId);
        setSelectedClienteExtrato(updated);
      }
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e.message || 'Erro ao resgatar chopp de cortesia.',
      });
    } finally {
      setIsResgatando(false);
    }
  };

  // Carregar cálculo dinâmico da multa
  const handleVerCalculoMulta = async (vinculoId: string) => {
    setIsLoadingCalculo(true);
    try {
      const calc = await api.getCalculoMultaPulseira(vinculoId);
      setCalculoAtivo(calc);
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e.message || 'Erro ao calcular multa da pulseira.',
      });
    } finally {
      setIsLoadingCalculo(false);
    }
  };

  const filteredRanking = ranking.filter((r) => {
    const q = searchCliente.toLowerCase();
    return (
      r.cliente.nome.toLowerCase().includes(q) ||
      r.cliente.celular.includes(q)
    );
  });

  // Comandas ativas com vínculo de pulseira para o modal de perda
  const comandasComPulseira = comandas.filter(
    (c) => c.status === 'aberta' && c.vinculoPulseiraEventoId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
              Relatórios & Fidelidade
            </h1>
            <Badge variant="teal">Inteligência & Retenção</Badge>
          </div>
          <p className="text-[0.875rem] text-[#64748B] mt-0.5">
            Fidelidade de duas estrelas (chopp de cortesia), regra de pulseira perdida (1x/5x) e métricas gerenciais.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-[8px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('fidelidade')}
            className={`px-3 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === 'fidelidade'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Fidelidade (2 Estrelas)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pulseira_perdida')}
            className={`px-3 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === 'pulseira_perdida'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Pulseira Perdida (1x / 5x)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relatorios')}
            className={`px-3 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === 'relatorios'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <FileBarChart className="w-3.5 h-3.5" />
            Painel Executivo
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-[10px] border flex items-center justify-between gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: SISTEMA DE FIDELIDADE DE DUAS ESTRELAS */}
      {/* ========================================================================= */}
      {activeTab === 'fidelidade' && (
        <div className="space-y-6">
          {/* Top Explanatory Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-teal-500/10 border border-amber-200/80 rounded-[12px] p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                  Regra Oficial de Fidelidade do SAASBAR
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Duas Estrelas: Reconhecimento por Ticket & Frequência
                </h3>
                <div className="text-xs text-[#334155] max-w-3xl leading-relaxed space-y-1.5 mt-1">
                  <div>
                    <strong className="text-amber-700">⭐ Estrela Amarela (Ticket Médio / Consumo - 4 Níveis):</strong>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium">
                        <span className="text-slate-400">★</span> Baixo (até R$ 150)
                      </span>
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                        <span className="text-amber-500">★</span> Médio (até R$ 250)
                      </span>
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                        <span className="text-amber-600">★</span> Alto (até R$ 500)
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 text-amber-950 border border-amber-400 px-2.5 py-0.5 rounded text-[11px] font-bold shadow-xs">
                        <span className="text-amber-600 text-sm">⭐</span> VIP (&gt; R$ 500 Dourada)
                      </span>
                    </div>
                  </div>
                  <p>
                    ⭐ <strong className="text-sky-700">Estrela Azul:</strong> Conquistada a cada ciclo de <strong>3 visitas</strong> completas.<br />
                    🍺 <strong className="text-emerald-700">Benefício Exclusivo:</strong> Cada estrela azul libera <strong>1 Chopp de Cortesia</strong> para resgate imediato no bar!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-3 rounded-[10px] border border-amber-200 shrink-0">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Beer className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Cortesias Ativas</span>
                  <span className="text-lg font-bold font-mono text-emerald-800">
                    {ranking.reduce((acc, curr) => acc + curr.cortesiasChopp.disponiveis, 0)} chopps
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking & Search */}
          <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0D9488]" />
                <h3 className="font-bold text-sm text-[#0F172A]">
                  Ranking de Clientes & Saldo de Estrelas
                </h3>
                <span className="text-xs text-slate-400 font-mono">({ranking.length} clientes)</span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  placeholder="Buscar por nome ou celular..."
                  className="w-full pl-9 pr-3 py-1.5 border border-[#E2E8F0] rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            {isLoadingRanking ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0D9488]" />
                <p className="text-xs font-medium">Carregando extrato de fidelidade...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-3 py-3 text-center">Visitas</th>
                      <th className="px-3 py-3 text-center">⭐ Estrela Amarela (Ticket Médio: 4 Níveis)</th>
                      <th className="px-3 py-3 text-center">⭐ Estrelas Azuis (Ciclos 3x)</th>
                      <th className="px-4 py-3 text-center">Chopp de Cortesia</th>
                      <th className="px-4 py-3 text-right">Gasto Histórico</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredRanking.map((r, idx) => (
                      <tr key={r.cliente.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[11px] font-bold text-slate-400 w-5">
                              #{idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-[#0F172A] block">{r.cliente.nome}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{r.cliente.celular}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {r.totalVisitas} visita(s)
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {r.progressoCicloVisitas}/3 no ciclo atual
                          </span>
                        </td>

                        {/* Estrela Amarela - 4 Níveis (Baixo, Médio, Alto, VIP) */}
                        <td className="px-3 py-3 text-center">
                          {r.nivelEstrelaAmarela === 'vip' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 text-amber-950 border border-amber-300 rounded-[8px] font-bold shadow-xs">
                              <span className="text-amber-500 text-base drop-shadow-xs">⭐</span>
                              <div className="text-left">
                                <span className="text-[11px] block leading-none font-bold text-amber-900 uppercase">
                                  VIP
                                </span>
                                <span className="text-[10px] text-amber-800 font-mono">
                                  {r.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            </div>
                          ) : r.nivelEstrelaAmarela === 'alto' ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/90 text-amber-950 border border-amber-300 rounded-[6px]">
                              <span className="text-amber-600 font-bold text-sm">★</span>
                              <div className="text-left">
                                <span className="text-[11px] block leading-none font-semibold text-amber-900">
                                  Alto
                                </span>
                                <span className="text-[10px] text-amber-700 font-mono">
                                  {r.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            </div>
                          ) : r.nivelEstrelaAmarela === 'medio' ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-[6px]">
                              <span className="text-amber-500 font-bold text-xs">★</span>
                              <div className="text-left">
                                <span className="text-[11px] block leading-none font-medium text-amber-800">
                                  Médio
                                </span>
                                <span className="text-[10px] text-amber-600 font-mono">
                                  {r.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-[6px]">
                              <span className="text-slate-400 font-bold text-xs">★</span>
                              <div className="text-left">
                                <span className="text-[11px] block leading-none font-medium text-slate-600">
                                  Baixo
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {r.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Blue Stars */}
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-sky-50 border border-sky-200 px-2 py-1 rounded-[6px]">
                            <span className="text-sky-500 font-bold">★</span>
                            <span className="font-mono font-bold text-xs text-sky-900">
                              {r.estrelasAzuis}
                            </span>
                          </div>
                        </td>

                        {/* Chopp Cortesia */}
                        <td className="px-4 py-3 text-center">
                          {r.cortesiasChopp.disponiveis > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[6px] font-bold font-mono text-xs">
                              <Beer className="w-3.5 h-3.5 text-emerald-700" />
                              {r.cortesiasChopp.disponiveis} Disponível!
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Faltam {r.visitasFaltantesParaChopp || 3} visita(s)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                          {r.totalGastoHistorico.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={isResgatando || r.cortesiasChopp.disponiveis <= 0}
                            onClick={() => handleResgatarChopp(r.cliente.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-[6px] transition-colors flex items-center gap-1.5 ml-auto"
                            title="Resgatar Chopp de Cortesia para o cliente"
                          >
                            <Beer className="w-3.5 h-3.5" />
                            Resgatar Chopp
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredRanking.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                          Nenhum cliente cadastrado ou com histórico de fidelidade.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: REGRA DE PULSEIRA PERDIDA (1X ANTES, 5X DEPOIS - NUNCA VALOR FIXO) */}
      {/* ========================================================================= */}
      {activeTab === 'pulseira_perdida' && (
        <div className="space-y-6">
          {/* Rule Card */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-[12px] p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full uppercase">
                  Regra Antifraude de Pulseira Perdida
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Tolerância de 30 minutos: 1x antes, 5x depois (Nunca Valor Fixo)
                </h3>
                <p className="text-xs text-rose-900 leading-relaxed max-w-2xl">
                  Ao registrar a perda da pulseira pelo cliente, inicia-se uma janela de tolerância de <strong>exatos 30 minutos</strong>.<br />
                  • <strong>Consumo até o prazo (≤ 30 min):</strong> Faturado normalmente com multiplicador <strong>1x</strong>.<br />
                  • <strong>Consumo após o prazo (&gt; 30 min):</strong> Faturado com multiplicador penal de <strong>5x</strong> sobre o consumo excedente.<br />
                  • <strong>Garantia do modelo:</strong> A cobrança é estritamente proporcional aos itens pedidos. Nunca é aplicada uma multa fixa arbitrária.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalComunicarOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[8px] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                Comunicar Perda de Pulseira
              </button>
            </div>
          </div>

          {/* List of reported lost bracelets */}
          <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-[#0F172A]">
                  Pulseiras com Perda Comunicada no Turno
                </h3>
              </div>
              <button
                type="button"
                onClick={loadMultas}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                title="Atualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isLoadingMultas ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-600" />
                <p className="text-xs font-medium">Carregando registros de perda...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Pulseira / Cliente</th>
                      <th className="px-3 py-3">Comunicado Em</th>
                      <th className="px-3 py-3">Prazo Tolerância (+30 min)</th>
                      <th className="px-3 py-3">Status Tolerância</th>
                      <th className="px-4 py-3 text-right">Multiplicador</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {multas.map((m) => {
                      const agora = new Date();
                      const prazo = new Date(m.prazoLimite);
                      const expirou = agora > prazo;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-rose-700 block">
                              {m.pulseiraCodigo}
                            </span>
                            <span className="text-[11px] text-[#0F172A] font-semibold">
                              {m.clienteNome} ({m.clienteCelular})
                            </span>
                          </td>

                          <td className="px-3 py-3 font-mono text-slate-600">
                            {new Date(m.comunicadoEm).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>

                          <td className="px-3 py-3 font-mono font-semibold text-slate-800">
                            {new Date(m.prazoLimite).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>

                          <td className="px-3 py-3">
                            {expirou ? (
                              <Badge variant="error">Tolerância Excedida (&gt; 30 min)</Badge>
                            ) : (
                              <Badge variant="warning">Em Tolerância (&lt; 30 min)</Badge>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                            5.0x após tolerância
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleVerCalculoMulta(m.vinculoPulseiraEventoId)}
                              className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-[6px] transition-colors inline-flex items-center gap-1.5"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              Auditar Cálculo
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {multas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                          Nenhum comunicado de pulseira perdida registrado neste evento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit & Detailed Calculation Drawer / Card */}
          {calculoAtivo && (
            <div className="bg-white rounded-[10px] border border-rose-300 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-sm text-[#0F172A]">
                    Auditoria do Cálculo de Multa Proporcional
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCalculoAtivo(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  Fechar Auditoria
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-[8px] border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Consumo na Tolerância (≤ 30 min)
                  </span>
                  <span className="font-mono font-bold text-sm text-[#0F172A] block mt-1">
                    {calculoAtivo.totalAntesPrazo1x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] text-emerald-700">Multiplicador 1.0x (Normal)</span>
                </div>

                <div className="p-3 bg-rose-50 rounded-[8px] border border-rose-200">
                  <span className="text-[10px] text-rose-800 uppercase block font-semibold">
                    Consumo Excedente (&gt; 30 min)
                  </span>
                  <span className="font-mono font-bold text-sm text-rose-700 block mt-1">
                    {calculoAtivo.totalAposPrazo5x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] text-rose-700 font-bold">
                    Multiplicador 5.0x (R$ {calculoAtivo.totalAposPrazo1x.toFixed(2)} normal × 5)
                  </span>
                </div>

                <div className="p-3 bg-[#0F172A] text-white rounded-[8px]">
                  <span className="text-[10px] text-slate-300 uppercase block font-semibold">
                    Total Devido da Comanda
                  </span>
                  <span className="font-mono font-bold text-base text-teal-300 block mt-1">
                    {calculoAtivo.totalFinalComanda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] text-slate-400">Total 1x + Total 5x</span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Comunicar Perda (Busca por Celular & Tolerância Oficial) */}
          <ComunicarPulseiraPerdidaModal
            isOpen={isModalComunicarOpen}
            onClose={() => setIsModalComunicarOpen(false)}
            activeEvento={activeEvento}
            currentEstabelecimento={currentEstabelecimento}
            onSuccess={() => {
              loadMultas();
              setFeedback({
                type: 'success',
                message: 'Perda registrada com sucesso! Cronômetro de 30 minutos em andamento.',
              });
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: PAINEL EXECUTIVO & RELATÓRIOS */}
      {/* ========================================================================= */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Comandas Abertas no Momento
              </span>
              <span className="text-[1.75rem] font-bold text-[#0F172A] font-mono leading-none mt-1 block">
                {comandas.filter((c) => c.status === 'aberta').length}
              </span>
            </div>

            <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Consumo em Aberto
              </span>
              <span className="text-[1.75rem] font-bold text-[#0D9488] font-mono leading-none mt-1 block">
                {comandas
                  .filter((c) => c.status === 'aberta')
                  .reduce((acc, curr) => acc + Number(curr.totalConsumo || 0), 0)
                  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Total de Clientes no Programa
              </span>
              <span className="text-[1.75rem] font-bold text-amber-600 font-mono leading-none mt-1 block">
                {ranking.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-5 shadow-xs">
            <h3 className="font-bold text-sm text-[#0F172A] mb-2">
              Resumo Operacional do Evento Ativo ({activeEvento?.nome || 'Geral'})
            </h3>
            <p className="text-xs text-slate-500">
              Modo de rebalanceamento configurado: <strong className="capitalize">{activeEvento?.modoRebalanceamento || 'Manual'}</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
