import React, { useState } from 'react';
import { LayoutGrid, Plus, Edit2, Trash2, QrCode, CheckCircle, Clock } from 'lucide-react';
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
    qrCode: string;
    status: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: { identificador?: string; qrCode?: string; status?: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MesasView: React.FC<MesasViewProps> = ({
  mesas,
  currentEstabelecimento,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mesa | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Mesa | null>(null);

  const [identificador, setIdentificador] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('livre');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    const nextNum = mesas.length + 1;
    const formattedNum = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setIdentificador(`Mesa ${formattedNum}`);
    setQrCode(`QR-MESA-${formattedNum}`);
    setStatus('livre');
    setIsModalOpen(true);
  };

  const openEditModal = (mesa: Mesa) => {
    setEditingItem(mesa);
    setIdentificador(mesa.identificador);
    setQrCode(mesa.qrCode);
    setStatus(mesa.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim() || !qrCode.trim() || !currentEstabelecimento) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          identificador: identificador.trim(),
          qrCode: qrCode.trim(),
          status,
        });
      } else {
        await onCreate({
          estabelecimentoId: currentEstabelecimento.id,
          identificador: identificador.trim(),
          qrCode: qrCode.trim(),
          status,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
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
            Mesas, espreguiçadeiras e gazebos habilitados para autoatendimento via QR code.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs"
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
              <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-1 rounded-[6px] border border-slate-200">
                <QrCode className="w-3.5 h-3.5 text-[#0D9488]" />
                <span className="font-mono text-xs text-[#334155] font-medium truncate">
                  {mesa.qrCode}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E2E8F0]">
              <span className="text-[11px] text-[#64748B]">Autoatendimento</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(mesa)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setItemToDelete(mesa)}
                  className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors"
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
            <p className="text-xs mt-1">Cadastre as mesas para gerar os QR codes de autoatendimento.</p>
          </div>
        )}
      </div>

      {/* Modal */}
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

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Código do QR Code Impresso *
            </label>
            <input
              type="text"
              required
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Ex: QR-MESA-01"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] font-mono focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <span className="text-[11px] text-[#64748B] mt-1 block">
              Código unívoco impresso na plaqueta física da mesa.
            </span>
          </div>

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
              className="px-4 py-2 border border-[#E2E8F0] text-[#334155] rounded-[10px] text-[0.875rem] font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Mesa'}
            </button>
          </div>
        </form>
      </Modal>

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
