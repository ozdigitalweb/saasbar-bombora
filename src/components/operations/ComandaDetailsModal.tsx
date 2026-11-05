import React from 'react';
import {
  X,
  QrCode,
  User,
  LayoutGrid,
  Clock,
  Tv,
  Plus,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { ComandaSummary } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { api } from '../../lib/api.ts';

interface ComandaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: ComandaSummary | null;
  onOpenLancamento: (comandaId: string) => void;
  onOpenFechamento?: (comandaId: string) => void;
  onUpdateItemStatus: (itemId: string, status: string) => Promise<void>;
  onToggleComandaStatus: (comandaId: string, currentStatus: string) => Promise<void>;
  onPedidoValidated?: () => void;
}

export const ComandaDetailsModal: React.FC<ComandaDetailsModalProps> = ({
  isOpen,
  onClose,
  comanda,
  onOpenLancamento,
  onOpenFechamento,
  onUpdateItemStatus,
  onToggleComandaStatus,
  onPedidoValidated,
}) => {
  if (!isOpen || !comanda) return null;

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'pronto':
        return <Badge variant="success">Pronto KDS</Badge>;
      case 'em_preparo':
        return <Badge variant="warning">Em Preparo</Badge>;
      case 'entregue':
        return <Badge variant="neutral">Entregue</Badge>;
      case 'visto':
        return <Badge variant="teal">Visto Garçom</Badge>;
      default:
        return <Badge variant="neutral">Pendente</Badge>;
    }
  };

  const nextStatus = (curr: string) => {
    if (curr === 'pendente') return 'em_preparo';
    if (curr === 'em_preparo') return 'pronto';
    if (curr === 'pronto') return 'entregue';
    return 'pendente';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comanda ${comanda.pulseiraCodigoQr ? `Pulseira ${comanda.pulseiraCodigoQr}` : comanda.mesaIdentificador || ''}`}
      subtitle={`Cliente: ${comanda.clienteNome || 'Cliente'} • Status: ${comanda.status.toUpperCase()}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
              {comanda.tipoAtendimento === 'pulseira' ? (
                <QrCode className="w-5 h-5" />
              ) : (
                <LayoutGrid className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[1.125rem] text-[#0F172A]">
                  {comanda.clienteNome || 'Cliente'}
                </span>
                <Badge variant={comanda.status === 'aberta' ? 'success' : 'neutral'}>
                  {comanda.status}
                </Badge>
              </div>
              <span className="text-xs text-[#64748B] font-mono">
                {comanda.clienteCelular || 'Sem celular'} • Aberta às{' '}
                {new Date(comanda.abertaEm).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                Total de Itens
              </span>
              <span className="text-[1.25rem] font-bold text-[#0F172A] font-mono">
                {comanda.totalItens}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                Consumo Total
              </span>
              <span className="text-[1.5rem] font-bold text-[#0D9488] font-mono">
                {(Number(comanda.totalConsumo) || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLancamento(comanda.id);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[8px] text-[0.875rem] font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Lançar Itens no Balcão
          </button>

          {comanda.status === 'aberta' ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenFechamento) {
                  onOpenFechamento(comanda.id);
                } else {
                  onToggleComandaStatus(comanda.id, comanda.status);
                }
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] text-[0.875rem] font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Fechar Comanda (Checkout & Rateio)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleComandaStatus(comanda.id, comanda.status)}
              className="px-3.5 py-2 border border-[#E2E8F0] rounded-[8px] text-[0.875rem] font-medium text-[#334155] hover:bg-slate-50 transition-colors"
            >
              Reabrir Comanda
            </button>
          )}
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Pedidos & Itens Expedidos para o KDS
          </span>

          {(!comanda.pedidos || comanda.pedidos.length === 0) ? (
            <div className="p-8 border border-dashed border-[#E2E8F0] rounded-[10px] text-center text-xs text-slate-400">
              Nenhum pedido lançado nesta comanda ainda.
            </div>
          ) : (
            comanda.pedidos.map((ped, idx) => (
              <div
                key={ped.id}
                className="bg-white border border-[#E2E8F0] rounded-[10px] overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between text-xs text-[#334155]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0F172A]">
                      Pedido #{comanda.pedidos ? comanda.pedidos.length - idx : 1}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="capitalize">
                      Origem: {ped.origem.replace('_', ' ')}
                    </span>
                    {ped.statusValidacao === 'aguardando_validacao' && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        Aguardando Validação
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {ped.statusValidacao === 'aguardando_validacao' && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.validarPedido(ped.id, true);
                            if (onPedidoValidated) onPedidoValidated();
                            onClose();
                          } catch (e: any) {
                            alert(e.message || 'Erro ao validar pedido.');
                          }
                        }}
                        className="px-2.5 py-1 bg-[#0D9488] hover:bg-teal-700 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Validar Pedido (Gerente)</span>
                      </button>
                    )}
                    <span className="text-slate-500 font-mono">
                      {new Date(ped.criadoEm).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[#E2E8F0]">
                  {ped.itens.map((it) => (
                    <div
                      key={it.id}
                      className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {it.numeroExibicao}
                        </span>
                        <div>
                          <span className="font-semibold text-[13px] text-[#0F172A] block">
                            {it.quantidade}x {it.itemNome}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Tv className="w-3 h-3 text-[#0D9488]" />
                            {it.pontoNome}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono font-semibold text-[#0F172A]">
                          {(
                            (Number(it.itemPreco) || 0) * it.quantidade
                          ).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {getItemStatusBadge(it.status)}
                          <button
                            type="button"
                            onClick={() => onUpdateItemStatus(it.id, nextStatus(it.status))}
                            className="text-[10px] text-slate-500 hover:text-[#0D9488] underline px-1 py-0.5"
                            title="Avançar status operacional"
                          >
                            Avançar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
