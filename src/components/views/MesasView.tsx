import React, { useState } from 'react';
import { LayoutGrid, Plus, Edit2, Trash2, QrCode, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';
import { Mesa, Estabelecimento } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';

interface MesasViewProps {
  mesas: Mesa[];
  currentEstabelecimento: Estabelecimento | null;
  onCreate: (data: {
    estabelecimentoId: string;
    identificador: string;
    status: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: { identificador?: string; status?: string }
  ) => Promise<void>;
  onRegenerarQr?: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MesasView: React.FC<MesasViewProps> = ({
  mesas,
  currentEstabelecimento,
  onCreate,
  onUpdate,
  onRegenerarQr,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mesa | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Mesa | null>(null);
  const [mesaToRegenerate, setMesaToRegenerate] = useState<Mesa | null>(null);

  const [identificador, setIdentificador] = useState('');
  const [status, setStatus] = useState('livre');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    const nextNum = mesas.length + 1;
    const formattedNum = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setIdentificador(`Mesa ${formattedNum}`);
    setStatus('livre');
    setIsModalOpen(true);
  };

  const openEditModal = (mesa: Mesa) => {
    setEditingItem(mesa);
    setIdentificador(mesa.identificador);
    setStatus(mesa.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim() || !currentEstabelecimento) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          identificador: identificador.trim(),
          status,
        });
      } else {
        await onCreate({
          estabelecimentoId: currentEstabelecimento.id,
          identificador: identificador.trim(),
          status,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRegenerarQr = async () => {
    if (!mesaToRegenerate || !onRegenerarQr) return;
    setIsRegenerating(true);
    try {
      await onRegenerarQr(mesaToRegenerate.id);
      setMesaToRegenerate(null);
    } finally {
      setIsRegenerating(false);
    }
  };

  const getStatusBadge = (tableStatus: string) => {
    switch (tableStatus) {
      case 'livre':
        return <Badge variant="success">Livre</Badge>;
      case 'liberada':
        return <Badge variant="warning">Liberada (Sessão)</Badge>;
      case 'ocupada':
        return <Badge variant="teal">Ocupada</Badge>;
      default:
        return <Badge>{tableStatus}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
            Mesas & Autoatendimento QR
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Mesas, espreguiçadeiras e gazebos com QR code criptográfico de alta entropia gerado pelo servidor.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Mesa
        </button>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mesas.map((mesa) => (
          <div
            key={mesa.id}
            className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-[8px] bg-slate-100 flex items-center justify-center text-[#334155]">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                {getStatusBadge(mesa.status)}
              </div>
              <h3 className="text-[1.125rem] font-semibold text-[#0F172A]">
                {mesa.identificador}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-2.5 py-1.5 rounded-[6px] border border-slate-200">
                <QrCode className="w-4 h-4 text-[#0D9488] shrink-0" />
                <span className="font-mono text-xs text-[#334155] font-medium truncate" title={mesa.qrCode}>
                  {mesa.qrCode}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E2E8F0]">
              <span className="text-[11px] text-[#64748B]">Autoatendimento</span>
              <div className="flex items-center gap-1">
                {onRegenerarQr && (
                  <button
                    type="button"
                    onClick={() => setMesaToRegenerate(mesa)}
                    className="p-1.5 text-[#64748B] hover:text-[#0D9488] hover:bg-teal-50 rounded-[6px] transition-colors cursor-pointer"
                    title="Gerar novo QR Code (invalida o anterior)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditModal(mesa)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setItemToDelete(mesa)}
                  className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {mesas.length === 0 && (
          <div className="col-span-full bg-white rounded-[10px] border border-dashed border-[#E2E8F0] p-12 text-center text-[#64748B]">
            <LayoutGrid className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-[#0F172A]">Nenhuma mesa cadastrada</p>
            <p className="text-xs mt-1">Cadastre as mesas para gerar os QR codes automáticos de autoatendimento.</p>
          </div>
        )}
      </div>

      {/* Modal Criar / Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Mesa' : 'Nova Mesa'}
        subtitle="Identificação de autoatendimento por QR code"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Identificador da Mesa *
            </label>
            <input
              type="text"
              required
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder="Ex: Mesa 01, Deck Piscina 04, Gazebo VIP"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          {editingItem ? (
            <div className="bg-slate-50 p-3 rounded-[8px] border border-slate-200">
              <span className="block text-xs font-semibold text-[#0F172A] mb-1">
                QR Code Atual da Plaqueta
              </span>
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#0D9488]" />
                <span className="font-mono text-xs text-[#334155] font-semibold break-all">
                  {editingItem.qrCode}
                </span>
              </div>
              <span className="text-[11px] text-[#64748B] mt-1.5 block">
                Por segurança, o QR Code é gerado exclusivamente pelo servidor. Para trocá-lo, utilize o botão "Gerar novo QR" no card da mesa.
              </span>
            </div>
          ) : (
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-[8px] flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
              <div className="text-xs text-teal-900 leading-relaxed">
                <span className="font-semibold block mb-0.5">Geração Criptográfica Automática</span>
                O servidor gerará automaticamente um token unívoco de alta entropia (<code className="font-mono bg-teal-100/60 px-1 py-0.5 rounded">MESA-&lt;uuid&gt;</code>) contra adivinhação e falsificação.
              </div>
            </div>
          )}

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Status Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white"
            >
              <option value="livre">Livre (Aguardando cliente)</option>
              <option value="liberada">Liberada (Garçom liberou a sessão de autoatendimento)</option>
              <option value="ocupada">Ocupada (Consumo ativo)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-[#E2E8F0] text-[#334155] rounded-[10px] text-[0.875rem] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Mesa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmar Regeneração do QR Code */}
      <ConfirmDialog
        isOpen={!!mesaToRegenerate}
        onClose={() => setMesaToRegenerate(null)}
        onConfirm={handleConfirmRegenerarQr}
        title="Gerar Novo QR Code"
        description={`Tem certeza que deseja gerar um novo QR Code para a "${mesaToRegenerate?.identificador}"? O código atual (${mesaToRegenerate?.qrCode}) será invalidado imediatamente e placas impressas anteriores deixarão de funcionar.`}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await onDelete(itemToDelete.id);
          }
        }}
        title="Excluir Mesa"
        description={`Tem certeza que deseja excluir a "${itemToDelete?.identificador}"? O QR code associado deixará de funcionar.`}
      />
    </div>
  );
};
