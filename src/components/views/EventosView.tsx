import React, { useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Evento, Estabelecimento } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';

interface EventosViewProps {
  eventos: Evento[];
  activeEvento: Evento | null;
  currentEstabelecimento: Estabelecimento | null;
  onSelectActiveEvento: (evento: Evento) => void;
  onCreateEvento: (data: {
    estabelecimentoId: string;
    nome: string;
    dataInicio?: string;
    modoRebalanceamento?: 'automatico' | 'manual';
  }) => Promise<void>;
  onCloseEvento: (id: string) => Promise<void>;
}

export const EventosView: React.FC<EventosViewProps> = ({
  eventos,
  activeEvento,
  currentEstabelecimento,
  onSelectActiveEvento,
  onCreateEvento,
  onCloseEvento,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [modoRebalanceamento, setModoRebalanceamento] = useState<'automatico' | 'manual'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !currentEstabelecimento) return;

    setIsSubmitting(true);
    try {
      await onCreateEvento({
        estabelecimentoId: currentEstabelecimento.id,
        nome: nome.trim(),
        modoRebalanceamento,
      });
      setIsModalOpen(false);
      setNome('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
            Eventos & Turnos Operacionais
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Gestão de edições de festas, turnos e parâmetros operacionais de comissão.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Evento / Turno
        </button>
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventos.map((ev) => {
          const isActive = ev.id === activeEvento?.id;
          const isOngoing = !ev.dataFim;

          return (
            <div
              key={ev.id}
              className={`bg-white rounded-[10px] border p-5 shadow-xs transition-all flex flex-col justify-between ${
                isActive ? 'border-[#0D9488] ring-1 ring-[#0D9488]' : 'border-[#E2E8F0] hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-[8px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isActive && <Badge variant="teal">Selecionado</Badge>}
                    <Badge variant={isOngoing ? 'success' : 'neutral'}>
                      {isOngoing ? 'Em Andamento' : 'Encerrado'}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-[1.125rem] font-bold text-[#0F172A] leading-snug">
                  {ev.nome}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-[#64748B]">
                  <div className="flex items-center justify-between">
                    <span>Início:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {new Date(ev.dataInicio).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {ev.dataFim && (
                    <div className="flex items-center justify-between">
                      <span>Término:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {new Date(ev.dataFim).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span>Rebalanceamento:</span>
                    <span className="font-semibold text-[#0F172A] capitalize">
                      {ev.modoRebalanceamento}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E2E8F0]">
                {!isActive ? (
                  <button
                    type="button"
                    onClick={() => onSelectActiveEvento(ev)}
                    className="text-xs font-semibold text-[#0D9488] hover:underline"
                  >
                    Tornar Ativo no Monitor
                  </button>
                ) : (
                  <span className="text-[11px] text-teal-800 font-semibold">
                    ✓ Monitorando
                  </span>
                )}

                {isOngoing && (
                  <button
                    type="button"
                    onClick={() => onCloseEvento(ev.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Encerrar Evento
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Novo Evento / Turno"
        subtitle="Inicia uma nova rodada de comandas e consumo no estabelecimento"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Nome do Evento *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bombora Sunset #13, Noite Eletrônica"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Modo de Rebalanceamento de Mesas (DESIGN.md Seção 5)
            </label>
            <select
              value={modoRebalanceamento}
              onChange={(e) => setModoRebalanceamento(e.target.value as any)}
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white"
            >
              <option value="manual">Manual (Gerente ajusta atribuições)</option>
              <option value="automatico">Automático (Por tempo de resposta)</option>
            </select>
          </div>

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
              {isSubmitting ? 'Iniciando...' : 'Iniciar Evento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
