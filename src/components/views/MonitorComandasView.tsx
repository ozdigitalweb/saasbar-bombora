import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Plus,
  Search,
  QrCode,
  LayoutGrid,
  User,
  ShoppingBag,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
  Filter,
  ShieldAlert,
  AlertTriangle,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  ComandaSummary,
  Evento,
  Usuario,
  Estabelecimento,
} from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { ComunicarPulseiraPerdidaModal } from '../operations/ComunicarPulseiraPerdidaModal.tsx';
import { api } from '../../lib/api.ts';

interface MonitorComandasViewProps {
  comandas: ComandaSummary[];
  activeEvento: Evento | null;
  eventos: Evento[];
  currentUser: Usuario | null;
  onSelectEvento: (evento: Evento) => void;
  onOpenLancamentoRapido: (comandaId?: string) => void;
  onOpenCheckIn: () => void;
  onViewComandaDetails: (comanda: ComandaSummary) => void;
  onOpenFechamento?: (comandaId: string) => void;
}

export const MonitorComandasView: React.FC<MonitorComandasViewProps> = ({
  comandas,
  activeEvento,
  eventos,
  currentUser,
  onSelectEvento,
  onOpenLancamentoRapido,
  onOpenCheckIn,
  onViewComandaDetails,
  onOpenFechamento,
}) => {
  const [filterStatus, setFilterStatus] = useState<'todas' | 'aberta' | 'fechada'>('aberta');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPulseiraPerdidaOpen, setIsPulseiraPerdidaOpen] = useState(false);
  const [pedidosPendentesValidacao, setPedidosPendentesValidacao] = useState<any[]>([]);
  const [isValidandoPedidoId, setIsValidandoPedidoId] = useState<string | null>(null);

  const carregarPedidosPendentes = useCallback(async () => {
    if (!activeEvento) return;
    try {
      const data = await api.getPedidosAguardandoValidacao(activeEvento.id);
      setPedidosPendentesValidacao(data || []);
    } catch (err) {
      console.error('Erro ao carregar pedidos pendentes no monitor:', err);
    }
  }, [activeEvento]);

  useEffect(() => {
    carregarPedidosPendentes();
    const interval = setInterval(carregarPedidosPendentes, 8000);
    return () => clearInterval(interval);
  }, [carregarPedidosPendentes]);

  const handleValidarPeloGerente = async (pedidoId: string) => {
    setIsValidandoPedidoId(pedidoId);
    try {
      await api.validarPedido(pedidoId, true);
      await carregarPedidosPendentes();
    } catch (err: any) {
      alert(err.message || 'Erro ao validar pedido.');
    } finally {
      setIsValidandoPedidoId(null);
    }
  };

  const filteredComandas = comandas.filter((c) => {
    const matchesStatus = filterStatus === 'todas' || c.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesClient = c.clienteNome?.toLowerCase().includes(query);
    const matchesPhone = c.clienteCelular?.includes(query);
    const matchesQr = c.pulseiraCodigoQr?.toLowerCase().includes(query);
    const matchesMesa = c.mesaIdentificador?.toLowerCase().includes(query);

    return matchesStatus && (matchesClient || matchesPhone || matchesQr || matchesMesa);
  });

  const totalConsumoEvento = comandas.reduce(
    (acc, curr) => acc + (Number(curr.totalConsumo) || 0),
    0
  );
  const totalComandasAbertas = comandas.filter((c) => c.status === 'aberta').length;
  const totalItensEvento = comandas.reduce((acc, curr) => acc + curr.totalItens, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Operational Event Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
              Monitor de Comandas
            </h1>
            <Badge variant="teal">Operação ao Vivo</Badge>
          </div>
          <p className="text-[0.875rem] text-[#64748B] mt-0.5">
            Acompanhamento em tempo real de consumo por pulseira e autoatendimento por mesa.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenCheckIn()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-[#E2E8F0] rounded-[10px] text-[0.875rem] font-medium text-[#334155] hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            + Abrir Comanda / Check-in
          </button>

          <button
            type="button"
            onClick={() => onOpenLancamentoRapido()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            + Lançamento Rápido (Balcão)
          </button>

          <button
            type="button"
            onClick={() => setIsPulseiraPerdidaOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-[10px] text-[0.875rem] font-medium transition-colors"
            title="Comunicar perda de pulseira por celular do cliente"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Pulseira Perdida
          </button>
        </div>
      </div>

      {/* Event Context Bar (Persistent Selector from DESIGN.md) */}
      <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-slate-100 flex items-center justify-center text-[#334155]">
            <Clock className="w-5 h-5 text-[#0D9488]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Evento Selecionado
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                aria-label="Selecionar Evento"
                value={activeEvento?.id || ''}
                onChange={(e) => {
                  const ev = eventos.find((x) => x.id === e.target.value);
                  if (ev) onSelectEvento(ev);
                }}
                className="font-bold text-[#0F172A] text-[1rem] bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0D9488] rounded py-0.5"
              >
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nome} {!ev.dataFim ? '(Em Andamento)' : '(Encerrado)'}
                  </option>
                ))}
              </select>
              {activeEvento && !activeEvento.dataFim && (
                <Badge variant="success">Ao Vivo</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#64748B]">
          <div>
            <span className="block font-medium uppercase text-[10px]">Início</span>
            <span className="font-semibold text-[#0F172A]">
              {activeEvento
                ? new Date(activeEvento.dataInicio).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </span>
          </div>
          <div>
            <span className="block font-medium uppercase text-[10px]">Modo Rebalanceamento</span>
            <span className="font-semibold text-[#0F172A] capitalize">
              {activeEvento?.modoRebalanceamento || 'Manual'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta Operacional: Pedidos Aguardando Validação (Mesas sem Garçom ou Garçom Fora de Turno) */}
      {pedidosPendentesValidacao.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-[10px] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="font-bold text-[#0F172A] text-sm font-['Space_Grotesk']">
                Pedidos Aguardando Validação ({pedidosPendentesValidacao.length})
              </h3>
            </div>
            <span className="text-xs text-amber-900 font-medium">
              Gerente pode validar diretamente pelo Monitor de Comandas
            </span>
          </div>

          <div className="space-y-2">
            {pedidosPendentesValidacao.map((p) => (
              <div
                key={p.pedidoId}
                className="bg-white p-3.5 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0F172A]">
                      Mesa {p.mesaIdentificador || 'S/N'}
                    </span>
                    {p.alertaSemGarcomResponsavel && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        {p.motivoAlertaSemGarcom === 'mesa_sem_garcom'
                          ? 'Mesa sem garçom atribuído'
                          : 'Garçom da área fora de turno'}
                      </span>
                    )}
                    {p.alertaTempoExcedido && (
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        Espera: {p.tempoEsperaMin} min
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold">Itens:</span>{' '}
                    {p.itens?.map((it: any) => `${it.quantidade}x ${it.itemNome}`).join(', ')}
                  </p>
                  {p.mensagemAlertaGerente && (
                    <p className="text-[11px] text-amber-800 font-medium">
                      ⚠️ {p.mensagemAlertaGerente}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isValidandoPedidoId === p.pedidoId}
                  onClick={() => handleValidarPeloGerente(p.pedidoId)}
                  className="px-3.5 py-2 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white rounded-lg text-xs font-bold font-['Space_Grotesk'] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  {isValidandoPedidoId === p.pedidoId ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Validar Pedido (Gerente)</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Comandas Abertas
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[1.75rem] font-bold text-[#0F172A] font-mono leading-none">
              {totalComandasAbertas}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              de {comandas.length} totais
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Consumo Total no Evento
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[1.75rem] font-bold text-[#0D9488] font-mono leading-none">
              {totalConsumoEvento.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Itens Expedidos ao KDS
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[1.75rem] font-bold text-[#0F172A] font-mono leading-none">
              {totalItensEvento}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Roteados</span>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Ticket Médio / Comanda
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[1.75rem] font-bold text-[#0F172A] font-mono leading-none">
              {(comandas.length > 0 ? totalConsumoEvento / comandas.length : 0).toLocaleString(
                'pt-BR',
                { style: 'currency', currency: 'BRL' }
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-[8px]">
          {(['aberta', 'fechada', 'todas'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-[6px] font-semibold uppercase transition-colors ${
                filterStatus === st
                  ? 'bg-white text-[#0D9488] shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              {st === 'aberta' ? 'Abertas' : st === 'fechada' ? 'Fechadas' : 'Todas'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, celular, pulseira ou mesa..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>
      </div>

      {/* Main Comandas Table */}
      <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.875rem] border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[0.75rem] font-semibold text-[#64748B] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-3.5">Identificador / Pulseira</th>
                <th className="px-6 py-3.5">Cliente</th>
                <th className="px-6 py-3.5">Mesa / Lounge</th>
                <th className="px-6 py-3.5">Garçom</th>
                <th className="px-6 py-3.5">Itens</th>
                <th className="px-6 py-3.5">Consumo Atual</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredComandas.map((cmd) => (
                <tr
                  key={cmd.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => onViewComandaDetails(cmd)}
                >
                  <td className="px-6 py-4 font-semibold text-[#0F172A]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
                        {cmd.tipoAtendimento === 'pulseira' ? (
                          <QrCode className="w-4 h-4" />
                        ) : (
                          <LayoutGrid className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="block font-mono text-[13px] text-[#0F172A] font-bold">
                          {cmd.pulseiraCodigoQr || cmd.mesaIdentificador || 'Comanda'}
                        </span>
                        <span className="block text-[11px] text-[#64748B] capitalize">
                          {cmd.tipoAtendimento}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-medium text-[#0F172A]">
                    <span>{cmd.clienteNome || 'Cliente Não Informado'}</span>
                    <span className="block text-[11px] text-[#64748B] font-mono">
                      {cmd.clienteCelular || '—'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-[#334155]">
                    {cmd.mesaIdentificador ? (
                      <span className="flex items-center gap-1 font-medium text-xs">
                        <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                        {cmd.mesaIdentificador}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Sem mesa fixa</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-[#334155] text-xs font-medium">
                    {cmd.garcomNome || <span className="text-slate-400 italic">Não atribuído</span>}
                  </td>

                  <td className="px-6 py-4 text-[#0F172A] font-mono text-xs font-bold">
                    {cmd.totalItens} {cmd.totalItens === 1 ? 'item' : 'itens'}
                  </td>

                  <td className="px-6 py-4 font-bold text-[#0F172A] font-mono">
                    {(Number(cmd.totalConsumo) || 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>

                  <td className="px-6 py-4">
                    <Badge variant={cmd.status === 'aberta' ? 'success' : 'neutral'}>
                      {cmd.status}
                    </Badge>
                  </td>

                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {cmd.status === 'aberta' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenLancamentoRapido(cmd.id)}
                            className="px-2.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[6px] text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Lançar itens no balcão"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Lançar
                          </button>

                          {onOpenFechamento && (
                            <button
                              type="button"
                              onClick={() => onOpenFechamento(cmd.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Fechar comanda e efetuar pagamento com rateio"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Pagar
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onViewComandaDetails(cmd)}
                        className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-[6px] text-xs font-medium text-[#334155] hover:bg-slate-50 transition-colors flex items-center gap-1"
                      >
                        Ver Detalhes
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredComandas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#64748B]">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-[#0F172A]">Nenhuma comanda encontrada</p>
                    <p className="text-xs mt-1">
                      Clique em &quot;+ Abrir Comanda / Check-in&quot; para vincular uma pulseira a um cliente no evento.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Comunicar Pulseira Perdida (Balcão / Operação) */}
      <ComunicarPulseiraPerdidaModal
        isOpen={isPulseiraPerdidaOpen}
        onClose={() => setIsPulseiraPerdidaOpen(false)}
        activeEvento={activeEvento}
      />
    </div>
  );
};
