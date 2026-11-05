import React, { useState } from 'react';
import { UtensilsCrossed, Plus, Edit2, Trash2, ChefHat, DollarSign } from 'lucide-react';
import { ItemCardapio, PontoDePreparo, Estabelecimento } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';

interface CardapioViewProps {
  itens: ItemCardapio[];
  pontos: PontoDePreparo[];
  currentEstabelecimento: Estabelecimento | null;
  onCreate: (data: {
    estabelecimentoId: string;
    pontoDePreparoId: string;
    nome: string;
    preco: number;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: { pontoDePreparoId?: string; nome?: string; preco?: number }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const CardapioView: React.FC<CardapioViewProps> = ({
  itens,
  pontos,
  currentEstabelecimento,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [filterPonto, setFilterPonto] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCardapio | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemCardapio | null>(null);

  const [nome, setNome] = useState('');
  const [pontoDePreparoId, setPontoDePreparoId] = useState('');
  const [preco, setPreco] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setNome('');
    setPontoDePreparoId(pontos[0]?.id || '');
    setPreco('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ItemCardapio) => {
    setEditingItem(item);
    setNome(item.nome);
    setPontoDePreparoId(item.pontoDePreparoId);
    setPreco(String(item.preco));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPreco = parseFloat(preco.replace(',', '.'));
    if (!nome.trim() || !pontoDePreparoId || isNaN(numPreco) || !currentEstabelecimento) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          nome: nome.trim(),
          pontoDePreparoId,
          preco: numPreco,
        });
      } else {
        await onCreate({
          estabelecimentoId: currentEstabelecimento.id,
          pontoDePreparoId,
          nome: nome.trim(),
          preco: numPreco,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItens = itens.filter((item) => {
    if (filterPonto === 'todos') return true;
    return item.pontoDePreparoId === filterPonto;
  });

  const formatPrice = (val: string | number) => {
    const num = Number(val);
    return isNaN(num)
      ? 'R$ 0,00'
      : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
            Cardápio & Itens
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Cadastro de bebidas, coquetéis e porções associados aos pontos de preparo (KDS).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={pontos.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Novo Item de Cardápio
        </button>
      </div>

      {pontos.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-[10px] text-xs text-amber-900">
          Você precisa cadastrar pelo menos um <strong>Ponto de Preparo</strong> (ex: Copa ou Cozinha) antes de adicionar itens ao cardápio.
        </div>
      )}

      {/* Filter by Preparation Point */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-[0.875rem] overflow-x-auto">
        <button
          onClick={() => setFilterPonto('todos')}
          className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            filterPonto === 'todos'
              ? 'bg-[#0D9488] text-white'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
          }`}
        >
          Todos os Itens
          <span
            className={`text-xs px-1.5 py-0.2 rounded-full ${
              filterPonto === 'todos' ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {itens.length}
          </span>
        </button>

        {pontos.map((p) => {
          const count = itens.filter((i) => i.pontoDePreparoId === p.id).length;
          return (
            <button
              key={p.id}
              onClick={() => setFilterPonto(p.id)}
              className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filterPonto === p.id
                  ? 'bg-[#0D9488] text-white'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
              }`}
            >
              {p.nome}
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full ${
                  filterPonto === p.id ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.875rem] border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[0.75rem] font-semibold text-[#64748B] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-3.5">Nome do Item</th>
                <th className="px-6 py-3.5">Ponto de Preparo (Roteamento KDS)</th>
                <th className="px-6 py-3.5">Preço Unitário</th>
                <th className="px-6 py-3.5">Rateio Estimado (10%)</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredItens.map((item) => {
                const ponto = pontos.find((p) => p.id === item.pontoDePreparoId);
                const isBebida =
                  ponto?.nome.toLowerCase().includes('copa') ||
                  ponto?.nome.toLowerCase().includes('bar') ||
                  ponto?.nome.toLowerCase().includes('chopeira');

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#0F172A]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[6px] bg-slate-100 flex items-center justify-center text-[#334155]">
                          <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <span>{item.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="teal">
                        <span className="flex items-center gap-1">
                          <ChefHat className="w-3 h-3" />
                          {item.pontoDePreparoNome || ponto?.nome || 'Ponto Definido'}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0F172A] font-mono">
                      {formatPrice(item.preco)}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#64748B]">
                      {isBebida ? (
                        <span>Bebida: Garçom 60% • Copa 40%</span>
                      ) : (
                        <span>Comida: Coz 60% • Garçom 20% • Copa 20%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItens.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#64748B]">
                    Nenhum item cadastrado no cardápio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
        subtitle="Roteamento para a fila de preparo e rateio de serviço"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Nome do Item *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Gin Tropical Bombora, Chopp Artesanal 300ml, Ceviche"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Ponto de Preparo (KDS) *
            </label>
            <select
              required
              value={pontoDePreparoId}
              onChange={(e) => setPontoDePreparoId(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white"
            >
              <option value="" disabled>
                Selecione o ponto de preparo...
              </option>
              {pontos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Tela KDS)
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#64748B] mt-1 block">
              Define para qual monitor de expedição os pedidos deste item serão enviados.
            </span>
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Preço Unitário (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="Ex: 38.00"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] font-mono focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
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
              {isSubmitting ? 'Salvando...' : 'Salvar Item'}
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
        title="Excluir Item de Cardápio"
        description={`Tem certeza que deseja excluir "${itemToDelete?.nome}" do cardápio?`}
      />
    </div>
  );
};
