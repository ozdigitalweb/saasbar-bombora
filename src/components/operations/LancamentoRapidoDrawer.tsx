import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  QrCode,
  ChefHat,
  Tv,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  User,
  LayoutGrid,
} from 'lucide-react';
import {
  ComandaSummary,
  ItemCardapio,
  PontoDePreparo,
  Usuario,
  Evento,
} from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';

interface LancamentoRapidoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvento: Evento | null;
  comandasAbertas: ComandaSummary[];
  itensCardapio: ItemCardapio[];
  pontosDePreparo: PontoDePreparo[];
  currentUser: Usuario | null;
  preselectedComandaId?: string | null;
  onSubmitPedido: (data: {
    comandaId: string;
    origem: 'operador_balcao' | 'garcom' | 'autoatendimento';
    criadoPor?: string;
    itens: Array<{ itemCardapioId: string; quantidade: number }>;
  }) => Promise<void>;
}

export const LancamentoRapidoDrawer: React.FC<LancamentoRapidoDrawerProps> = ({
  isOpen,
  onClose,
  activeEvento,
  comandasAbertas,
  itensCardapio,
  pontosDePreparo,
  currentUser,
  preselectedComandaId,
  onSubmitPedido,
}) => {
  const [selectedComandaId, setSelectedComandaId] = useState<string>('');
  const [searchPulseira, setSearchPulseira] = useState<string>('');
  const [searchItem, setSearchItem] = useState<string>('');
  const [selectedPontoFilter, setSelectedPontoFilter] = useState<string>('todos');
  const [cart, setCart] = useState<Array<{ item: ItemCardapio; quantidade: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial selected comanda if passed
  useEffect(() => {
    if (preselectedComandaId) {
      setSelectedComandaId(preselectedComandaId);
    } else if (comandasAbertas.length > 0 && !selectedComandaId) {
      setSelectedComandaId(comandasAbertas[0].id);
    }
  }, [preselectedComandaId, comandasAbertas]);

  // Reset cart when closed
  useEffect(() => {
    if (!isOpen) {
      setCart([]);
      setError(null);
      setSearchItem('');
      setSearchPulseira('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedComanda =
    comandasAbertas.find((c) => c.id === selectedComandaId) ||
    comandasAbertas.find((c) =>
      c.pulseiraCodigoQr?.toLowerCase().includes(searchPulseira.toLowerCase().trim())
    ) ||
    null;

  const handleAddToCart = (item: ItemCardapio) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { item, quantidade: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const nextQty = i.quantidade + delta;
            return nextQty > 0 ? { ...i, quantidade: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as Array<{ item: ItemCardapio; quantidade: number }>
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const filteredCardapio = itensCardapio.filter((item) => {
    const matchesSearch = item.nome.toLowerCase().includes(searchItem.toLowerCase());
    const matchesPonto =
      selectedPontoFilter === 'todos' || item.pontoDePreparoId === selectedPontoFilter;
    return matchesSearch && matchesPonto;
  });

  const cartTotal = cart.reduce((acc, curr) => {
    return acc + (Number(curr.item.preco) || 0) * curr.quantidade;
  }, 0);

  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantidade, 0);

  const handleSubmit = async () => {
    if (!selectedComanda) {
      setError('Selecione ou identifique uma comanda / pulseira válida.');
      return;
    }
    if (cart.length === 0) {
      setError('Adicione pelo menos um item ao pedido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmitPedido({
        comandaId: selectedComanda.id,
        origem: currentUser?.papel === 'garcom' ? 'garcom' : 'operador_balcao',
        criadoPor: currentUser?.id,
        itens: cart.map((i) => ({
          itemCardapioId: i.item.id,
          quantidade: i.quantidade,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao lançar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-[2px] flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-[#E2E8F0]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[1.125rem] font-bold text-[#0F172A] leading-tight">
                  Lançamento Rápido no Balcão
                </h2>
                <Badge variant="teal">Operação</Badge>
              </div>
              <p className="text-[12px] text-[#64748B]">
                {activeEvento?.nome || 'Evento Atual'} • Operador:{' '}
                {currentUser?.nome || 'Balcão'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-[6px] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-[0.875rem] text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Seleção / Leitura da Pulseira */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                1. Identificar Pulseira ou Comanda do Cliente
              </span>
              {selectedComanda && <Badge variant="success">Comanda Aberta</Badge>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0F172A] mb-1">
                  Selecionar Comanda Aberta
                </label>
                <select
                  value={selectedComandaId}
                  onChange={(e) => setSelectedComandaId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="">Selecione a comanda...</option>
                  {comandasAbertas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.pulseiraCodigoQr ? `Pulseira ${c.pulseiraCodigoQr}` : c.mesaIdentificador || 'Comanda'} • {c.clienteNome || 'Cliente'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0F172A] mb-1">
                  Ou Digite / Bipe o QR da Pulseira
                </label>
                <input
                  type="text"
                  value={searchPulseira}
                  onChange={(e) => setSearchPulseira(e.target.value)}
                  placeholder="Ex: BOMBORA-PULS-001"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] text-[0.875rem] font-mono focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            {/* Display Selected Customer Info Card */}
            {selectedComanda ? (
              <div className="bg-white rounded-[8px] p-3 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] block">
                      {selectedComanda.clienteNome || 'Cliente Não Identificado'}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {selectedComanda.clienteCelular || 'Sem celular'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedComanda.mesaIdentificador && (
                    <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded border">
                      <LayoutGrid className="w-3 h-3 text-[#0D9488]" />
                      <span>{selectedComanda.mesaIdentificador}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Consumo Atual</span>
                    <span className="font-bold text-[#0F172A] font-mono">
                      {(Number(selectedComanda.totalConsumo) || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-700 italic">
                Nenhuma comanda selecionada. Selecione na lista acima ou bipa o QR da pulseira.
              </p>
            )}
          </div>

          {/* STEP 2: Busca e Adição de Itens do Cardápio */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider block">
              2. Escolher Itens do Cardápio (Roteamento Automático KDS)
            </span>

            {/* Filter by Preparation Point */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedPontoFilter('todos')}
                className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors whitespace-nowrap ${
                  selectedPontoFilter === 'todos'
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {pontosDePreparo.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPontoFilter(p.id)}
                  className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                    selectedPontoFilter === p.id
                      ? 'bg-[#0D9488] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ChefHat className="w-3 h-3" />
                  {p.nome}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                placeholder="Buscar item por nome (ex: Gin, Chopp, Ceviche)..."
                className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredCardapio.map((item) => {
                const ponto = pontosDePreparo.find((p) => p.id === item.pontoDePreparoId);
                const precoNum = Number(item.preco) || 0;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-[8px] border border-[#E2E8F0] hover:border-teal-300 hover:bg-teal-50/20 transition-colors flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-[13px] text-[#0F172A] block truncate">
                        {item.nome}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-xs text-[#0D9488]">
                          {precoNum.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Tv className="w-2.5 h-2.5" />
                          {item.pontoDePreparoNome || ponto?.nome}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="w-8 h-8 rounded-[6px] bg-slate-100 group-hover:bg-[#0D9488] group-hover:text-white text-slate-700 flex items-center justify-center transition-colors shrink-0"
                      title="Adicionar ao pedido"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {filteredCardapio.length === 0 && (
                <div className="col-span-2 p-6 text-center text-xs text-slate-400">
                  Nenhum item encontrado no cardápio.
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Carrinho & Roteamento Visual dos Itens */}
          <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider block">
                3. Itens do Pedido ({totalItemsCount})
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Limpar itens
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-[8px] text-center text-xs text-slate-400">
                Nenhum item selecionado. Clique em &quot;+&quot; nos itens do cardápio acima para adicionar.
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((entry) => {
                  const ponto = pontosDePreparo.find((p) => p.id === entry.item.pontoDePreparoId);
                  const subtotal = (Number(entry.item.preco) || 0) * entry.quantidade;

                  return (
                    <div
                      key={entry.item.id}
                      className="flex items-center justify-between p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                    >
                      <div className="flex-1 pr-3">
                        <span className="font-semibold text-[#0F172A] text-[13px] block">
                          {entry.item.nome}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                          <span className="font-mono">
                            {Number(entry.item.preco).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}{' '}
                            cada
                          </span>
                          <span>•</span>
                          <span className="text-[#0F766E] font-medium flex items-center gap-1">
                            <Tv className="w-3 h-3" />
                            Roteia para: {entry.item.pontoDePreparoNome || ponto?.nome}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white border border-[#E2E8F0] rounded-[6px]">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(entry.item.id, -1)}
                            className="p-1 text-slate-600 hover:text-black"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-bold text-xs">{entry.quantidade}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(entry.item.id, 1)}
                            className="p-1 text-slate-600 hover:text-black"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-[#0F172A] w-20 text-right">
                          {subtotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(entry.item.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer with Subtotal & Submit Action */}
        <div className="p-6 border-t border-[#E2E8F0] bg-white shrink-0 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-medium">
              Subtotal do Pedido
            </span>
            <span className="text-[1.5rem] font-bold text-[#0F172A] font-mono leading-none">
              {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#E2E8F0] text-[#334155] rounded-[10px] text-[0.875rem] font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSubmitting || cart.length === 0 || !selectedComanda}
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Enviando ao KDS...' : 'Lançar Pedido (KDS)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
