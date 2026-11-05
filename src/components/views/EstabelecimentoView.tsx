import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Check,
  MessageSquare,
  Smartphone,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { Estabelecimento } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';
import { api } from '../../lib/api.ts';

interface EstabelecimentoViewProps {
  estabelecimentos: Estabelecimento[];
  currentEstabelecimento: Estabelecimento | null;
  onSelectEstabelecimento: (est: Estabelecimento) => void;
  onCreate: (data: { nome: string; tipo: string; config: Record<string, any> }) => Promise<void>;
  onUpdate: (id: string, data: { nome?: string; tipo?: string; config?: Record<string, any> }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EstabelecimentoView: React.FC<EstabelecimentoViewProps> = ({
  estabelecimentos,
  currentEstabelecimento,
  onSelectEstabelecimento,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Estabelecimento | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Estabelecimento | null>(null);

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('bar_casa_noturna');
  const [toleranciaMin, setToleranciaMin] = useState(30);
  const [multiplicador, setMultiplicador] = useState(5.0);
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Canal de envio e tela de depuração do gerente
  const [canalVerificacao, setCanalVerificacao] = useState<'sms' | 'whatsapp'>(
    (currentEstabelecimento?.canalVerificacaoPadrao as 'sms' | 'whatsapp') || 'sms'
  );
  const [isSalvandoCanal, setIsSalvandoCanal] = useState(false);
  const [codigosDebug, setCodigosDebug] = useState<any[]>([]);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);
  const [feedbackCanal, setFeedbackCanal] = useState<string | null>(null);

  useEffect(() => {
    if (currentEstabelecimento?.canalVerificacaoPadrao) {
      setCanalVerificacao(currentEstabelecimento.canalVerificacaoPadrao as 'sms' | 'whatsapp');
    }
  }, [currentEstabelecimento?.canalVerificacaoPadrao]);

  const [modoDepuracaoDesativado, setModoDepuracaoDesativado] = useState(false);
  const [motivoDesativado, setMotivoDesativado] = useState<string | null>(null);

  const carregarCodigosDebug = async () => {
    setIsLoadingDebug(true);
    try {
      const data = await api.getUltimosCodigosSms();
      if (data && typeof data === 'object' && !Array.isArray(data) && (data as any).desativado) {
        setModoDepuracaoDesativado(true);
        setMotivoDesativado((data as any).motivo || 'Modo simulado desativado.');
        setCodigosDebug([]);
      } else if (Array.isArray(data)) {
        setModoDepuracaoDesativado(false);
        setMotivoDesativado(null);
        setCodigosDebug(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar códigos simulados:', e);
    } finally {
      setIsLoadingDebug(false);
    }
  };

  useEffect(() => {
    carregarCodigosDebug();
    const interval = setInterval(carregarCodigosDebug, 5000);
    return () => clearInterval(interval);
  }, [currentEstabelecimento?.id]);

  const handleSalvarCanal = async () => {
    if (!currentEstabelecimento?.id) return;
    setIsSalvandoCanal(true);
    try {
      await api.updateCanalVerificacaoEstabelecimento(currentEstabelecimento.id, canalVerificacao);
      setFeedbackCanal(`Canal de envio padrão atualizado para ${canalVerificacao.toUpperCase()} com sucesso!`);
      setTimeout(() => setFeedbackCanal(null), 4000);
    } catch (e: any) {
      alert('Erro ao atualizar canal: ' + (e.message || 'Tente novamente'));
    } finally {
      setIsSalvandoCanal(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setNome('');
    setTipo('bar_casa_noturna');
    setToleranciaMin(30);
    setMultiplicador(5.0);
    setDescricao('');
    setIsModalOpen(true);
  };

  const openEditModal = (est: Estabelecimento) => {
    setEditingItem(est);
    setNome(est.nome);
    setTipo(est.tipo);
    setToleranciaMin(est.config?.tempoToleranciaPerdaMin || 30);
    setMultiplicador(est.config?.multiplicadorPerda || 5.0);
    setDescricao(est.config?.descricao || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setIsSubmitting(true);
    try {
      const config = {
        descricao: descricao.trim(),
        tempoToleranciaPerdaMin: Number(toleranciaMin) || 30,
        multiplicadorPerda: Number(multiplicador) || 5.0,
      };

      if (editingItem) {
        await onUpdate(editingItem.id, {
          nome: nome.trim(),
          tipo,
          config,
        });
      } else {
        await onCreate({
          nome: nome.trim(),
          tipo,
          config,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
            Estabelecimentos
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Gestão de casas, isolamento multi-tenant e parâmetros de operação.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Estabelecimento
        </button>
      </div>

      {/* Active Establishment Overview Card */}
      {currentEstabelecimento && (
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[10px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[1.25rem] font-semibold text-[#0F172A]">
                    {currentEstabelecimento.nome}
                  </h2>
                  <Badge variant="teal">Ativo</Badge>
                </div>
                <p className="text-[0.875rem] text-[#64748B] mt-0.5">
                  ID: <span className="font-mono text-xs">{currentEstabelecimento.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => openEditModal(currentEstabelecimento)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-[8px] text-[0.875rem] font-medium text-[#334155] hover:bg-slate-50 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Configurações
            </button>
          </div>

          {/* Business rules parameters from DESIGN.md */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
            <div className="bg-slate-50 rounded-[8px] p-3.5 border border-slate-200/80">
              <span className="text-[0.75rem] font-medium text-[#64748B] uppercase tracking-wider block">
                Tipo do Negócio
              </span>
              <span className="text-[1rem] font-semibold text-[#0F172A] mt-1 block">
                {currentEstabelecimento.tipo === 'bar_casa_noturna'
                  ? 'Bar & Casa Noturna (Festas)'
                  : currentEstabelecimento.tipo}
              </span>
            </div>

            <div className="bg-slate-50 rounded-[8px] p-3.5 border border-slate-200/80">
              <span className="text-[0.75rem] font-medium text-[#64748B] uppercase tracking-wider block">
                Regra de Pulseira Perdida
              </span>
              <span className="text-[1rem] font-semibold text-[#0F172A] mt-1 block">
                30 min tolerância • 5x consumo após
              </span>
            </div>

            <div className="bg-slate-50 rounded-[8px] p-3.5 border border-slate-200/80">
              <span className="text-[0.75rem] font-medium text-[#64748B] uppercase tracking-wider block">
                Tecnologia de Identificação
              </span>
              <span className="text-[1rem] font-semibold text-[#0F172A] mt-1 block">
                QR Code Impresso (Sem RFID)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Configuration & Manager Debug Screen for Verification Codes */}
      {currentEstabelecimento && (
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[1.125rem] font-bold text-[#0F172A] font-['Space_Grotesk']">
                  Canal de Envio & Tela de Depuração (Códigos de Mesa)
                </h3>
                <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                  Modo Simulado Ativo
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                Configure o canal padrão da casa (SMS ou WhatsApp) e visualize os códigos simulados em tempo real.
              </p>
            </div>

            <button
              onClick={carregarCodigosDebug}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-[8px] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDebug ? 'animate-spin text-[#0D9488]' : ''}`} />
              <span>Atualizar Códigos</span>
            </button>
          </div>

          {/* Feedback banner */}
          {feedbackCanal && (
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-300 text-teal-900 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0D9488]" />
              <span>{feedbackCanal}</span>
            </div>
          )}

          {/* Channel Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 block font-['Space_Grotesk']">
                Canal Padrão de Envio de Código:
              </span>
              <p className="text-[11px] text-slate-600">
                Os clientes que solicitarem código no autoatendimento receberão por este provedor.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300">
                <button
                  type="button"
                  onClick={() => setCanalVerificacao('sms')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    canalVerificacao === 'sms'
                      ? 'bg-[#0D9488] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SMS
                </button>
                <button
                  type="button"
                  onClick={() => setCanalVerificacao('whatsapp')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    canalVerificacao === 'whatsapp'
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  WhatsApp
                </button>
              </div>

              <button
                type="button"
                disabled={isSalvandoCanal}
                onClick={handleSalvarCanal}
                className="px-4 py-2 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {isSalvandoCanal ? 'Salvando...' : 'Salvar Canal'}
              </button>
            </div>
          </div>

          {/* Table / List of Debug Codes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Space_Grotesk']">
                Últimos Códigos Simulados Gerados ({codigosDebug.length}):
              </span>
              <span className="text-[11px] text-slate-500">
                Telefones gravados de forma mascarada para privacidade
              </span>
            </div>

            {modoDepuracaoDesativado ? (
              <div className="p-6 text-center bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center justify-center gap-1.5 text-amber-800">
                  <span>🔒 Tela de depuração desativada</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  {motivoDesativado || 'Provedor real de SMS/WhatsApp ativo ou ambiente de produção. Os códigos trafegam exclusivamente pela operadora externa.'}
                </p>
              </div>
            ) : codigosDebug.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Nenhum código simulado enviado recentemente para este estabelecimento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {codigosDebug.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 font-mono">
                        {c.telefoneMascarado}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          c.canal === 'whatsapp'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-teal-100 text-teal-800 border border-teal-300'
                        }`}
                      >
                        {c.canal}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Código Gerado
                        </span>
                        <span className="font-mono text-base font-black text-teal-800 tracking-wider">
                          {c.codigo}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono italic">
                        "{c.mensagem}"
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{new Date(c.criadoEm).toLocaleTimeString()}</span>
                      <span>Casa: {c.estabelecimentoNome}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Listing Table */}
      <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <h3 className="text-[1.125rem] font-semibold text-[#0F172A]">
            Todos os Estabelecimentos Cadastrados ({estabelecimentos.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.875rem] border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[0.75rem] font-semibold text-[#64748B] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-3.5">Nome</th>
                <th className="px-6 py-3.5">Tipo</th>
                <th className="px-6 py-3.5">Configuração</th>
                <th className="px-6 py-3.5">Criado em</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {estabelecimentos.map((est) => {
                const isSelected = est.id === currentEstabelecimento?.id;
                return (
                  <tr
                    key={est.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-teal-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        {est.nome}
                        {isSelected && <Badge variant="teal">Ativo</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#334155]">
                      <span className="capitalize">{est.tipo.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-[#64748B] text-xs">
                      {est.config?.descricao || 'Padrão SAASBAR'}
                    </td>
                    <td className="px-6 py-4 text-[#64748B] text-xs">
                      {new Date(est.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isSelected && (
                          <button
                            type="button"
                            onClick={() => onSelectEstabelecimento(est)}
                            className="px-2.5 py-1 text-xs font-medium text-[#0D9488] hover:bg-teal-50 rounded-[6px] border border-teal-200 transition-colors"
                          >
                            Ativar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(est)}
                          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {estabelecimentos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setItemToDelete(est)}
                            className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
        subtitle="Configuração cadastral e parâmetros multi-tenant"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Nome do Estabelecimento *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bombora Beach Bar & Lounge"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Tipo de Operação
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white"
            >
              <option value="bar_casa_noturna">Bar / Casa Noturna (Festas & Baladas)</option>
              <option value="restaurante">Restaurante</option>
              <option value="cafeteria">Cafeteria / Lounge</option>
            </select>
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Descrição / Observações Operacionais
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Piloto Bombora - Festas à beira de piscina"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-[10px] border border-slate-200 space-y-3">
            <span className="text-[0.75rem] font-semibold text-[#0F766E] uppercase tracking-wider block">
              Regras do Sistema Visual e Negócio (DESIGN.md)
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs text-[#334155]">
              <div>
                <label className="block font-medium mb-1">Tolerância perda pulseira (min)</label>
                <input
                  type="number"
                  value={toleranciaMin}
                  onChange={(e) => setToleranciaMin(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-[6px]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Multiplicador após tolerância</label>
                <input
                  type="number"
                  step="0.5"
                  value={multiplicador}
                  onChange={(e) => setMultiplicador(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-[6px]"
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-[#E2E8F0] text-[#334155] rounded-[10px] text-[0.875rem] font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Estabelecimento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await onDelete(itemToDelete.id);
          }
        }}
        title="Excluir Estabelecimento"
        description={`Tem certeza que deseja excluir o estabelecimento "${itemToDelete?.nome}"? Todos os pontos de preparo, mesas e itens associados serão removidos permanentemente.`}
      />
    </div>
  );
};
