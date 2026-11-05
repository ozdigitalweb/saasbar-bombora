import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Star,
  Gift,
  Smartphone,
  Mail,
  Sparkles,
} from 'lucide-react';
import { Cliente, Estabelecimento } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';

interface ClientesViewProps {
  clientes: Cliente[];
  currentEstabelecimento: Estabelecimento | null;
  onSearch: (search: string) => void;
  onCreate: (data: {
    estabelecimentoId: string;
    nome: string;
    celular: string;
    email?: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: { nome?: string; celular?: string; email?: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  clientes,
  currentEstabelecimento,
  onSearch,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Cliente | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Cliente | null>(null);

  const [nome, setNome] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch(val);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setNome('');
    setCelular('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Cliente) => {
    setEditingItem(c);
    setNome(c.nome);
    setCelular(c.celular);
    setEmail(c.email || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !celular.trim() || !currentEstabelecimento) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          nome: nome.trim(),
          celular: celular.trim(),
          email: email.trim() || undefined,
        });
      } else {
        await onCreate({
          estabelecimentoId: currentEstabelecimento.id,
          nome: nome.trim(),
          celular: celular.trim(),
          email: email.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for the two-star loyalty system (strictly from DESIGN.md)
  const renderYellowStar = (ticket: number = 220) => {
    if (ticket > 500) {
      return (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[6px]" title="Ticket Médio > R$ 500 (VIP)">
          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span className="text-xs font-bold text-amber-700">VIP</span>
        </div>
      );
    } else if (ticket > 250) {
      return (
        <div className="flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/60 px-2 py-0.5 rounded-[6px]" title="Ticket Médio Alto (R$ 250 - R$ 500)">
          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-500" />
          <span className="text-xs font-medium text-amber-800">Alto</span>
        </div>
      );
    } else if (ticket > 150) {
      return (
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-[6px]" title="Ticket Médio (R$ 150 - R$ 250)">
          <Star className="w-3.5 h-3.5 fill-amber-200 text-amber-400" />
          <span className="text-xs font-medium text-slate-700">Médio</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-[6px]" title="Ticket Baixo (Até R$ 150)">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-medium text-slate-600">Baixo</span>
        </div>
      );
    }
  };

  // Blue star: 3-visit cycle (vazada -> transparente -> sólida + cortesia chopp)
  const renderBlueStar = (visits: number = 3) => {
    const cyclePosition = ((visits - 1) % 3) + 1; // 1, 2, or 3
    if (cyclePosition === 3) {
      return (
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-[6px]" title="Ciclo Completo: 3ª Visita - Cortesia de Chopp 300ml liberada!">
          <Star className="w-4 h-4 fill-blue-600 text-blue-700" />
          <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
            3/3 <Gift className="w-3 h-3 text-blue-600" />
          </span>
        </div>
      );
    } else if (cyclePosition === 2) {
      return (
        <div className="flex items-center gap-1.5 bg-blue-50/50 border border-blue-100 px-2 py-0.5 rounded-[6px]" title="Ciclo: 2ª Visita (Semipreenchida)">
          <Star className="w-3.5 h-3.5 fill-blue-200 text-blue-500" />
          <span className="text-xs font-medium text-blue-700">2/3</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-[6px]" title="Ciclo: 1ª Visita (Vazada)">
          <Star className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-slate-600">1/3</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
            Clientes & Fidelidade
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Cadastro por Nome e Celular (sem CPF) com sistema de fidelidade por duas estrelas.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Cliente
        </button>
      </div>

      {/* Loyalty Rule System Banner (Strictly from DESIGN.md) */}
      <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#0D9488]" />
          <h3 className="text-[0.875rem] font-semibold text-[#0F172A]">
            Regra Oficial de Fidelidade SAASBAR (Duas Estrelas • Isolado por Casa)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#334155]">
          <div className="p-3 bg-amber-50/50 rounded-[8px] border border-amber-200/50 flex items-start gap-2.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900 block">
                Estrela Amarela (Consumo / Ticket)
              </span>
              <span className="text-amber-800/80">
                Baixo (&lt;R$150) • Médio (&lt;R$250) • Alto (&lt;R$500) • <strong>VIP Dourada</strong> (&gt;R$500).
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-[8px] border border-blue-200/50 flex items-start gap-2.5">
            <Star className="w-4 h-4 fill-blue-600 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-900 block">
                Estrela Azul (Frequência em Ciclos de 3 Visitas)
              </span>
              <span className="text-blue-800/80">
                1ª vazada → 2ª transparente → 3ª sólida: <strong>Gera 1 Chopp 300ml cortesia</strong> liberado ao garçom no check-in.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nome ou celular do cliente..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>
        <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Listing Table */}
      <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.875rem] border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[0.75rem] font-semibold text-[#64748B] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-3.5">Nome do Cliente</th>
                <th className="px-6 py-3.5">Celular (Chave)</th>
                <th className="px-6 py-3.5">E-mail</th>
                <th className="px-6 py-3.5">Estrela Ticket</th>
                <th className="px-6 py-3.5">Estrela Frequência</th>
                <th className="px-6 py-3.5">Cadastrado em</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {clientes.map((cliente, idx) => (
                <tr key={cliente.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#0F172A]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                        {cliente.nome.charAt(0)}
                      </div>
                      <div>
                        <span>{cliente.nome}</span>
                        <span className="block text-[11px] text-[#64748B] font-mono">
                          ID: {cliente.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#0F172A] font-medium">
                    <span className="flex items-center gap-1.5 font-mono text-xs">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      {cliente.celular}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#334155] text-xs">
                    {cliente.email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {cliente.email}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {/* Simulated realistic data for the star view */}
                    {renderYellowStar(idx === 0 ? 550 : idx === 1 ? 320 : 180)}
                  </td>
                  <td className="px-6 py-4">
                    {renderBlueStar(idx === 0 ? 3 : idx === 1 ? 2 : 1)}
                  </td>
                  <td className="px-6 py-4 text-[#64748B] text-xs">
                    {new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(cliente)}
                        className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(cliente)}
                        className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {clientes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[#64748B]">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal (Strictly without CPF field as defined in DESIGN.md) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Cliente' : 'Novo Cliente'}
        subtitle="Cadastro permanente para reconhecimento e fidelidade"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fernanda Costa"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Celular / WhatsApp * (Chave de Check-in)
            </label>
            <input
              type="text"
              required
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="(11) 99888-7766"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <span className="text-[11px] text-[#64748B] mt-1 block">
              Usado para busca rápida no check-in da pulseira e envio opcional do recibo.
            </span>
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              E-mail (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-[6px] text-xs text-amber-900">
            <strong>Diretriz do Sistema:</strong> O SAASBAR nunca solicita CPF ou documento de identificação aos clientes nas festas e eventos.
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
              {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
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
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cadastro de "${itemToDelete?.nome}"? O histórico de visitas e estrelas associadas será removido.`}
      />
    </div>
  );
};
