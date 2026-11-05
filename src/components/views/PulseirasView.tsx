import React, { useState } from 'react';
import { QrCode, Plus, Edit2, Trash2, Smartphone, ShieldAlert } from 'lucide-react';
import { Pulseira, Estabelecimento } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';

interface PulseirasViewProps {
  pulseiras: Pulseira[];
  currentEstabelecimento: Estabelecimento | null;
  onCreate: (data: { estabelecimentoId: string; codigoQr: string }) => Promise<void>;
  onUpdate: (id: string, data: { codigoQr: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const PulseirasView: React.FC<PulseirasViewProps> = ({
  pulseiras,
  currentEstabelecimento,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pulseira | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Pulseira | null>(null);
  const [codigoQr, setCodigoQr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    const nextNum = pulseiras.length + 1;
    const formatted = nextNum < 10 ? `00${nextNum}` : nextNum < 100 ? `0${nextNum}` : `${nextNum}`;
    setCodigoQr(`BOMBORA-PULS-${formatted}`);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Pulseira) => {
    setEditingItem(p);
    setCodigoQr(p.codigoQr);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoQr.trim() || !currentEstabelecimento) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, { codigoQr: codigoQr.trim() });
      } else {
        await onCreate({
          estabelecimentoId: currentEstabelecimento.id,
          codigoQr: codigoQr.trim(),
        });
      }
      setIsModalOpen(false);
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
            Pulseiras QR Code
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Acervo de pulseiras físicas reutilizáveis com QR code impresso, lidas pela câmera do celular do garçom.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Pulseira
        </button>
      </div>

      {/* Rules Banner (Strictly enforcing no RFID, QR code printed) */}
      <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 flex items-start gap-3 text-[0.875rem] text-[#334155]">
        <Smartphone className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#0F172A] block">
            Tecnologia de Identificação: QR Code Impresso
          </span>
          <span className="text-xs text-[#64748B] block mt-0.5">
            A comanda da pulseira é vinculada temporariamente ao cliente em cada evento. A leitura é realizada diretamente pela câmera do celular do garçom. Não utiliza chips RFID, antenas ou leitores fixos.
          </span>
        </div>
      </div>

      {/* Grid of Wristbands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {pulseiras.map((pulseira) => (
          <div
            key={pulseira.id}
            className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-[8px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
                  <QrCode className="w-4 h-4" />
                </div>
                <Badge variant="teal">Reutilizável</Badge>
              </div>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Código QR Impresso
              </span>
              <p className="text-[1rem] font-bold text-[#0F172A] font-mono mt-1">
                {pulseira.codigoQr}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E2E8F0]">
              <span className="text-[11px] text-[#64748B]">Pronta p/ evento</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(pulseira)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setItemToDelete(pulseira)}
                  className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {pulseiras.length === 0 && (
          <div className="col-span-full bg-white rounded-[10px] border border-dashed border-[#E2E8F0] p-12 text-center text-[#64748B]">
            <QrCode className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-[#0F172A]">Nenhuma pulseira cadastrada</p>
            <p className="text-xs mt-1">Cadastre as pulseiras gravadas com QR code para vincular aos clientes.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Pulseira' : 'Cadastrar Pulseira'}
        subtitle="Identificador unívoco do QR code físico"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Código do QR Code Impresso *
            </label>
            <input
              type="text"
              required
              value={codigoQr}
              onChange={(e) => setCodigoQr(e.target.value)}
              placeholder="Ex: BOMBORA-PULS-001"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] font-mono focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <span className="text-[11px] text-[#64748B] mt-1 block">
              Deve corresponder exatamente ao valor impresso no QR code da pulseira.
            </span>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Pulseira'}
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
        title="Excluir Pulseira"
        description={`Tem certeza que deseja excluir a pulseira "${itemToDelete?.codigoQr}"?`}
      />
    </div>
  );
};
