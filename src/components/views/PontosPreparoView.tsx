import React, { useState } from 'react';
import { ChefHat, Plus, Edit2, Trash2, Tv, AlertCircle } from 'lucide-react';
import { PontoDePreparo, Estabelecimento } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';

interface PontosPreparoViewProps {
  pontos: PontoDePreparo[];
  currentEstabelecimento: Estabelecimento | null;
  onCreate: (data: { estabelecimentoId: string; nome: string }) => Promise<void>;
  onUpdate: (id: string, data: { nome: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const PontosPreparoView: React.FC<PontosPreparoViewProps> = ({
  pontos,
  currentEstabelecimento,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PontoDePreparo | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PontoDePreparo | null>(null);
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setNome('');
    setIsModalOpen(true);
  };

  const openEditModal = (ponto: PontoDePreparo) => {
    setEditingItem(ponto);
    setNome(ponto.nome);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !currentEstabelecimento) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, { nome: nome.trim() });
      } else {
        await onCreate({
          estabelecimentoId: currentEstabelecimento.id,
          nome: nome.trim(),
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
            Pontos de Preparo
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Copa, Bar, Cozinha e Balcões de expedição com telas KDS exclusivas.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Ponto de Preparo
        </button>
      </div>

      {/* Notice Banner adhering strictly to DESIGN.md */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-[10px] p-4 flex items-start gap-3 text-[0.875rem] text-[#0F766E]">
        <Tv className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block">Regra Operacional KDS (Sem Impressoras Térmicas)</span>
          <span className="text-teal-900/80 text-xs">
            Todo ponto de preparo cadastrado opera exclusivamente conectado a uma tela física KDS (painel de status com colunas &apos;Em preparo&apos; e &apos;Pronto&apos;). Não há impressão em papel de comandas.
          </span>
        </div>
      </div>

      {/* Grid of Preparation Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pontos.map((ponto) => (
          <div
            key={ponto.id}
            className="bg-white rounded-[10px] border border-[#E2E8F0] p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[8px] bg-slate-100 flex items-center justify-center text-[#334155]">
                  <ChefHat className="w-5 h-5" />
                </div>
                <Badge variant="teal">Tela KDS Ativa</Badge>
              </div>
              <h3 className="text-[1.125rem] font-semibold text-[#0F172A]">{ponto.nome}</h3>
              <p className="text-xs text-[#64748B] mt-1 font-mono">
                ID: {ponto.id.substring(0, 8)}...
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E2E8F0]">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-slate-400" />
                Monitor KDS
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(ponto)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setItemToDelete(ponto)}
                  className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {pontos.length === 0 && (
          <div className="col-span-3 bg-white rounded-[10px] border border-dashed border-[#E2E8F0] p-12 text-center text-[#64748B]">
            <ChefHat className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-[#0F172A]">Nenhum ponto de preparo cadastrado</p>
            <p className="text-xs mt-1">Cadastre a Copa, Bar e Cozinha para rotear os pedidos aos KDS.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Ponto de Preparo' : 'Novo Ponto de Preparo'}
        subtitle="Vinculado à tela física de expedição KDS"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Nome do Ponto de Preparo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bar Piscina, Cozinha Quente, Copa Central"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-[6px] text-xs text-[#64748B]">
            Este ponto receberá em tempo real os itens de pedidos cadastrados para preparação no KDS.
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
              {isSubmitting ? 'Salvando...' : 'Salvar Ponto'}
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
        title="Excluir Ponto de Preparo"
        description={`Tem certeza que deseja excluir o ponto de preparo "${itemToDelete?.nome}"? Itens do cardápio vinculados a este ponto precisarão ser reatribuídos.`}
      />
    </div>
  );
};
