import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, User, Smartphone, Mail } from 'lucide-react';
import { Usuario, Estabelecimento, PapelUsuario } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';

interface UsuariosViewProps {
  usuarios: Usuario[];
  currentEstabelecimento: Estabelecimento | null;
  onCreate: (data: {
    estabelecimentoId: string;
    nome: string;
    papel: PapelUsuario;
    celular?: string;
    email?: string;
    senha?: string;
    senhaHash?: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: {
      nome?: string;
      papel?: PapelUsuario;
      celular?: string;
      email?: string;
      senha?: string;
      senhaHash?: string;
    }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  currentEstabelecimento,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [filterPapel, setFilterPapel] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Usuario | null>(null);

  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState<PapelUsuario>('garcom');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setNome('');
    setPapel('garcom');
    setCelular('');
    setEmail('');
    setSenha('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingItem(user);
    setNome(user.nome);
    setPapel(user.papel);
    setCelular(user.celular || '');
    setEmail(user.email || '');
    setSenha('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !currentEstabelecimento) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          nome: nome.trim(),
          papel,
          celular: celular.trim() || undefined,
          email: email.trim() || undefined,
          senha: senha.trim() || undefined,
        });
      } else {
        await onCreate({
          estabelecimentoId: currentEstabelecimento.id,
          nome: nome.trim(),
          papel,
          celular: celular.trim() || undefined,
          email: email.trim() || undefined,
          senha: senha.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    if (filterPapel === 'todos') return true;
    return u.papel === filterPapel;
  });

  const getRoleBadge = (role: PapelUsuario) => {
    switch (role) {
      case 'gerente':
        return <Badge variant="teal">Gerente</Badge>;
      case 'operador_balcao':
        return <Badge variant="warning">Operador Balcão</Badge>;
      case 'garcom':
        return <Badge variant="neutral">Garçom</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getRoleDescription = (role: PapelUsuario) => {
    switch (role) {
      case 'gerente':
        return 'Acesso irrestrito a todos os módulos, fechamentos e configurações.';
      case 'operador_balcao':
        return 'Opera o drawer de Lançamento Rápido no balcão de pedidos do evento.';
      case 'garcom':
        return 'Atendimento nas mesas, vinculado a áreas e comissionamento.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
            Usuários & Permissões
          </h1>
          <p className="text-[0.875rem] text-[#64748B] mt-1">
            Controle de equipe nos três papéis oficiais: Garçom, Gerente e Operador de Balcão.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-[0.875rem]">
        {[
          { id: 'todos', label: 'Todos os Usuários', count: usuarios.length },
          {
            id: 'garcom',
            label: 'Garçons',
            count: usuarios.filter((u) => u.papel === 'garcom').length,
          },
          {
            id: 'gerente',
            label: 'Gerentes',
            count: usuarios.filter((u) => u.papel === 'gerente').length,
          },
          {
            id: 'operador_balcao',
            label: 'Operadores de Balcão',
            count: usuarios.filter((u) => u.papel === 'operador_balcao').length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterPapel(tab.id)}
            className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors flex items-center gap-1.5 ${
              filterPapel === tab.id
                ? 'bg-[#0D9488] text-white'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full ${
                filterPapel === tab.id ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.875rem] border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[0.75rem] font-semibold text-[#64748B] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-3.5">Nome / Colaborador</th>
                <th className="px-6 py-3.5">Papel Operacional</th>
                <th className="px-6 py-3.5">Celular</th>
                <th className="px-6 py-3.5">E-mail</th>
                <th className="px-6 py-3.5">Cadastrado em</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredUsuarios.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#0F172A]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                        {user.nome.charAt(0)}
                      </div>
                      <div>
                        <span>{user.nome}</span>
                        <span className="block text-[11px] text-[#64748B] font-mono">
                          ID: {user.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.papel)}</td>
                  <td className="px-6 py-4 text-[#334155]">
                    {user.celular ? (
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {user.celular}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#334155]">
                    {user.email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {user.email}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#64748B] text-xs">
                    {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(user)}
                        className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#64748B]">
                    Nenhum usuário encontrado nesta categoria.
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
        title={editingItem ? 'Editar Usuário' : 'Novo Usuário'}
        subtitle="Cadastro da equipe operacional do evento"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Lucas Almeida"
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Papel Operacional (Rigorosamente 3 perfis) *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'garcom', label: 'Garçom' },
                { id: 'operador_balcao', label: 'Operador de Balcão' },
                { id: 'gerente', label: 'Gerente / Supervisor' },
              ].map((role) => (
                <label
                  key={role.id}
                  className={`flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${
                    papel === role.id
                      ? 'border-[#0D9488] bg-teal-50/40 text-[#0F172A]'
                      : 'border-[#E2E8F0] bg-white text-[#334155] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="papel"
                    value={role.id}
                    checked={papel === role.id}
                    onChange={(e) => setPapel(e.target.value as PapelUsuario)}
                    className="mt-0.5 text-[#0D9488] focus:ring-[#0D9488]"
                  />
                  <div>
                    <span className="font-semibold block text-[0.875rem]">{role.label}</span>
                    <span className="text-xs text-[#64748B] block mt-0.5">
                      {getRoleDescription(role.id as PapelUsuario)}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
                Celular / WhatsApp
              </label>
              <input
                type="text"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
                E-mail (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@bombora.com"
                className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              {editingItem ? 'Nova Senha de Acesso (opcional)' : 'Senha de Acesso'}
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={editingItem ? 'Deixe em branco para manter a senha atual' : 'Padrão: 123456'}
              className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <span className="text-[11px] text-[#64748B] mt-1 block">
              {editingItem
                ? 'Preencha apenas caso queira redefinir a senha do colaborador (será criptografada com BCrypt).'
                : 'Senha que o usuário utilizará para acessar o sistema com seu e-mail ou celular (padrão: 123456).'}
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
              {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
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
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${itemToDelete?.nome}"? Este colaborador perderá o acesso e as atribuições no sistema.`}
      />
    </div>
  );
};
