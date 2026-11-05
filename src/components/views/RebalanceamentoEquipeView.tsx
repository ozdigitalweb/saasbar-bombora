import React, { useState, useEffect } from 'react';
import {
  Users2,
  LayoutGrid,
  Clock,
  Percent,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Evento,
  Estabelecimento,
  Usuario,
  Mesa,
  GarcomEquipeCard,
  RebalanceamentoDados,
} from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';

interface RebalanceamentoEquipeViewProps {
  currentEstabelecimento: Estabelecimento | null;
  activeEvento: Evento | null;
  usuarios: Usuario[];
  mesas: Mesa[];
}

export const RebalanceamentoEquipeView: React.FC<RebalanceamentoEquipeViewProps> = ({
  currentEstabelecimento,
  activeEvento,
  usuarios,
  mesas,
}) => {
  const [dados, setDados] = useState<RebalanceamentoDados | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);

  // Modal Meta Comissão
  const [isModalMetaOpen, setIsModalMetaOpen] = useState(false);
  const [selectedGarcom, setSelectedGarcom] = useState<GarcomEquipeCard | null>(null);
  const [metaMinutos, setMetaMinutos] = useState<number>(5);
  const [comissaoBase, setComissaoBase] = useState<number>(10);
  const [bonusPercentual, setBonusPercentual] = useState<number>(2);

  // Modal Atribuir Mesa
  const [isModalAtribuirOpen, setIsModalAtribuirOpen] = useState(false);
  const [garcomParaMesa, setGarcomParaMesa] = useState<string>('');
  const [mesaParaAtribuir, setMesaParaAtribuir] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDados = async () => {
    if (!currentEstabelecimento || !activeEvento) return;
    setIsLoading(true);
    try {
      const res = await api.getRebalanceamentoEquipe(activeEvento.id, currentEstabelecimento.id);
      setDados(res);
    } catch (e: any) {
      console.error('Failed to load rebalanceamento equipe:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDados();
  }, [currentEstabelecimento, activeEvento]);

  // Executar rebalanceamento automático
  const handleExecutarRebalanceamento = async () => {
    if (!activeEvento || !currentEstabelecimento) return;
    setIsRebalancing(true);
    setFeedback(null);
    try {
      const res = await api.executarRebalanceamento(activeEvento.id, currentEstabelecimento.id);
      const resumo = res.detalhesPorGarcom?.map((d: any) => `${d.nome}: ${d.mesasAlocadas} mesa(s) (Tempo: ${d.tempoRespostaMedio})`).join(' • ');
      setFeedback({
        type: 'success',
        message: `Rebalanceamento concluído por tempo de resposta médio (pronto ➔ visto)! ${resumo || `${res.mesasRebalanceadas} mesas redistribuídas`}. Garçons com pior tempo receberam alívio de carga.`,
      });
      await loadDados();
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e.message || 'Erro ao executar rebalanceamento.',
      });
    } finally {
      setIsRebalancing(false);
    }
  };

  // Salvar metas de comissão
  const handleSalvarMetas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGarcom || !activeEvento) return;

    try {
      await api.salvarMetaComissao({
        garcomId: selectedGarcom.garcomId,
        eventoId: activeEvento.id,
        metaMinutos,
        comissaoBase,
        bonus: bonusPercentual,
      });
      setFeedback({
        type: 'success',
        message: `Metas de comissão salvas para ${selectedGarcom.nome}!`,
      });
      setIsModalMetaOpen(false);
      await loadDados();
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e.message || 'Erro ao salvar metas.',
      });
    }
  };

  // Atribuir mesa individual
  const handleAtribuirMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!garcomParaMesa || !mesaParaAtribuir) return;

    try {
      await api.atribuirMesaGarcom(garcomParaMesa, mesaParaAtribuir);
      setFeedback({
        type: 'success',
        message: 'Mesa atribuída com sucesso ao garçom.',
      });
      setIsModalAtribuirOpen(false);
      setMesaParaAtribuir('');
      await loadDados();
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e.message || 'Erro ao atribuir mesa.',
      });
    }
  };

  // Desvincular mesa individual
  const handleRemoverMesa = async (garcomId: string, mesaId: string) => {
    try {
      await api.removerMesaGarcom(garcomId, mesaId);
      setFeedback({
        type: 'success',
        message: 'Mesa desvinculada do garçom.',
      });
      await loadDados();
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e.message || 'Erro ao desvincular mesa.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
              Equipe: Rebalanceamento & Comissões
            </h1>
            <Badge variant="teal">Gestão de Garçons</Badge>
          </div>
          <p className="text-[0.875rem] text-[#64748B] mt-0.5">
            Atribuição de áreas e mesas (garcom_area), metas de comissão com bônus por agilidade e balanceamento de carga.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalAtribuirOpen(true)}
            className="px-3.5 py-2 border border-[#E2E8F0] hover:bg-slate-50 text-[#334155] rounded-[8px] text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0D9488]" />
            Atribuir Mesa Manual
          </button>

          <button
            type="button"
            disabled={isRebalancing || !activeEvento}
            onClick={handleExecutarRebalanceamento}
            className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white rounded-[8px] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isRebalancing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Rebalanceando...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Rebalancear Mesas Automaticamente
              </>
            )}
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

      {/* Regra de Negócio: Critério de Rebalanceamento Inteligente */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-[10px] p-4 text-xs text-teal-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Critério Oficial de Rebalanceamento Automático de Mesas
          </span>
          <p className="text-slate-700 leading-relaxed">
            A redistribuição <strong>não é matemática igualitária</strong>. O critério é o <strong>tempo de resposta médio</strong> de cada garçom (do status <em>'pronto'</em> até <em>'visto'</em> nos itens dele).
            Quem tem pior tempo de resposta recebe <strong>menos carga</strong> na redistribuição para restabelecer a agilidade, enquanto quem atende mais rápido assume maior cota de mesas.
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Distribuição</span>
          <span className="text-xs font-bold text-[#0F766E] font-mono">Inversamente Proporcional</span>
        </div>
      </div>

      {/* Overview Stats */}
      {dados && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Garçons em Turno
            </span>
            <span className="text-[1.75rem] font-bold text-[#0F172A] font-mono leading-none mt-1 block">
              {dados.garcons.length}
            </span>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Mesas Cadastradas
            </span>
            <span className="text-[1.75rem] font-bold text-[#0D9488] font-mono leading-none mt-1 block">
              {dados.todasMesas.length}
            </span>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Média Alocada
            </span>
            <span className="text-[1.75rem] font-bold text-amber-600 font-mono leading-none mt-1 block">
              {dados.garcons.length > 0 ? (dados.todasMesas.length / dados.garcons.length).toFixed(1) : 0} mesas/garçom
            </span>
          </div>
        </div>
      )}

      {/* Cards de Garçons com Áreas & Comissões */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0D9488]" />
          <p className="text-xs font-medium">Carregando áreas e métricas de comissão...</p>
        </div>
      ) : dados && dados.garcons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dados.garcons.map((g) => (
            <div
              key={g.garcomId}
              className="bg-white rounded-[10px] border border-[#E2E8F0] p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Card */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#0F172A]">{g.nome}</h3>
                    <span className="text-xs text-slate-500 font-mono">{g.celular || 'Garçom'}</span>
                  </div>

                  <Badge
                    variant={
                      g.statusCarga === 'sobrecarregado'
                        ? 'error'
                        : g.statusCarga === 'ideal'
                        ? 'success'
                        : 'neutral'
                    }
                  >
                    {g.statusCarga === 'sobrecarregado'
                      ? 'Sobrecarregado'
                      : g.statusCarga === 'ideal'
                      ? 'Carga Ideal'
                      : 'Ocioso'}
                  </Badge>
                </div>

                {/* Performance & Comissão Metrics */}
                <div className="p-3 bg-slate-50 rounded-[8px] border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                    <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                      Tempo Resposta (Pronto ➔ Visto):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-[#0F172A]">
                        {g.tempoRespostaMedio} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">
                      Capacidade Redistribuição:
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        g.tempoRespostaSegundos <= 120
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : g.tempoRespostaSegundos > 300
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {g.tempoRespostaSegundos <= 120
                        ? 'Mais Ágil (Maior Cota)'
                        : g.tempoRespostaSegundos > 300
                        ? 'Tempo Alto (Alívio de Carga)'
                        : 'Ritmo Médio (Cota Padrão)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-slate-400" />
                      Comissão Base:
                    </span>
                    <span className="font-mono font-bold text-slate-800">{g.comissaoBasePercentual}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Bônus Agilidade:
                    </span>
                    <span className="font-mono font-bold text-emerald-700">+{g.bonusPercentual}%</span>
                  </div>
                </div>

                {/* Mesas Atribuídas */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider block">
                    Mesas Atribuídas ({g.totalMesas}):
                  </span>

                  <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                    {g.mesas.map((m) => (
                      <span
                        key={m.mesaId}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-teal-50 border border-teal-200 text-[#0F766E] rounded-[6px] text-xs font-medium"
                      >
                        <LayoutGrid className="w-3 h-3 text-[#0D9488]" />
                        {m.identificador}
                        <button
                          type="button"
                          onClick={() => handleRemoverMesa(g.garcomId, m.mesaId)}
                          className="hover:text-red-600 cursor-pointer ml-0.5"
                          title="Desvincular mesa"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {g.mesas.length === 0 && (
                      <span className="text-xs text-slate-400 italic">Nenhuma mesa atribuída.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGarcom(g);
                    setMetaMinutos(5);
                    setComissaoBase(g.comissaoBasePercentual);
                    setBonusPercentual(g.bonusPercentual);
                    setIsModalMetaOpen(true);
                  }}
                  className="px-3 py-1.5 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-[6px] text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  Editar Metas
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGarcomParaMesa(g.garcomId);
                    setIsModalAtribuirOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[6px] text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Mesa
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-12 text-center text-slate-400 shadow-xs">
          <Users2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-sm text-[#0F172A]">Nenhum garçom cadastrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre garçons no menu "Usuários & Papéis" para gerenciar áreas e metas de comissão.
          </p>
        </div>
      )}

      {/* Modal Editar Metas de Comissão */}
      <Modal
        isOpen={isModalMetaOpen}
        onClose={() => setIsModalMetaOpen(false)}
        title={`Metas & Comissão • ${selectedGarcom?.nome || 'Garçom'}`}
        subtitle="Configuração de meta de tempo de resposta e percentual de bonificação (garcom_comissao)."
      >
        <form onSubmit={handleSalvarMetas} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Meta de Tempo de Resposta (minutos)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              required
              value={metaMinutos}
              onChange={(e) => setMetaMinutos(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[8px] text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Tempo máximo ideal entre o pedido ficar pronto e a entrega na mesa.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Comissão Base (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={comissaoBase}
                onChange={(e) => setComissaoBase(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[8px] text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Bônus de Agilidade (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={bonusPercentual}
                onChange={(e) => setBonusPercentual(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[8px] text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalMetaOpen(false)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[8px] text-xs font-bold uppercase tracking-wider"
            >
              Salvar Metas
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Atribuir Mesa */}
      <Modal
        isOpen={isModalAtribuirOpen}
        onClose={() => setIsModalAtribuirOpen(false)}
        title="Atribuir Mesa ao Garçom"
        subtitle="Vincula uma mesa ao garçom no turno atual (garcom_area)."
      >
        <form onSubmit={handleAtribuirMesa} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Garçom
            </label>
            <select
              required
              value={garcomParaMesa}
              onChange={(e) => setGarcomParaMesa(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="">Selecione o garçom...</option>
              {usuarios
                .filter((u) => u.papel === 'garcom')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.celular || 'Garçom'})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Mesa / Lounge
            </label>
            <select
              required
              value={mesaParaAtribuir}
              onChange={(e) => setMesaParaAtribuir(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="">Selecione a mesa...</option>
              {mesas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.identificador} (QR: {m.qrCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalAtribuirOpen(false)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!garcomParaMesa || !mesaParaAtribuir}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white rounded-[8px] text-xs font-bold uppercase tracking-wider"
            >
              Atribuir Mesa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
