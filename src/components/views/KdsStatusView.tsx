import React, { useState, useEffect } from 'react';
import { Tv, ChefHat, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PontoDePreparo, PedidoItemDetail, Evento } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { Badge } from '../common/Badge.tsx';

interface KdsStatusViewProps {
  pontos: PontoDePreparo[];
  activeEvento: Evento | null;
  onAdvanceStatus: (itemId: string, status: string) => Promise<void>;
  onOpenFullscreenKds?: () => void;
}

export const KdsStatusView: React.FC<KdsStatusViewProps> = ({
  pontos,
  activeEvento,
  onAdvanceStatus,
  onOpenFullscreenKds,
}) => {
  const [selectedPontoId, setSelectedPontoId] = useState<string>(pontos[0]?.id || '');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadKds = async () => {
    if (!selectedPontoId) return;
    setIsLoading(true);
    try {
      const data = await api.getKdsFila(selectedPontoId);
      setItems(data);
    } catch (e) {
      console.error('Failed to load KDS fila:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pontos.length > 0 && !selectedPontoId) {
      setSelectedPontoId(pontos[0].id);
    }
  }, [pontos]);

  useEffect(() => {
    loadKds();
    const timer = setInterval(loadKds, 8000);
    return () => clearInterval(timer);
  }, [selectedPontoId]);

  const selectedPonto = pontos.find((p) => p.id === selectedPontoId);

  // Group into "Em Preparo" and "Pronto"
  const emPreparo = items.filter(
    (i) => i.status === 'pendente' || i.status === 'em_preparo'
  );
  const prontos = items.filter((i) => i.status === 'pronto');

  const getWaitMinutes = (criadoEm: string) => {
    const diffMs = Date.now() - new Date(criadoEm).getTime();
    return Math.floor(diffMs / 60000);
  };

  const getWaitColor = (min: number) => {
    if (min <= 5) return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/20';
    if (min <= 10) return 'text-amber-400 border-amber-500/50 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/50 bg-rose-950/30 animate-pulse';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
              Monitor KDS (Copa & Cozinha)
            </h1>
            <Badge variant="teal">TV KDS Display</Badge>
          </div>
          <p className="text-[0.875rem] text-[#64748B] mt-0.5">
            Simulação da tela de expedição física montada em TV com números anônimos e tempo de espera.
          </p>
        </div>

        {/* Ponto Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] p-1.5 rounded-[8px]">
            <ChefHat className="w-4 h-4 text-[#0D9488]" />
            <select
              value={selectedPontoId}
              onChange={(e) => setSelectedPontoId(e.target.value)}
              className="font-semibold text-xs text-[#0F172A] bg-transparent focus:outline-none cursor-pointer"
            >
              {pontos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Tela KDS)
                </option>
              ))}
            </select>
          </div>

          {onOpenFullscreenKds && (
            <button
              onClick={onOpenFullscreenKds}
              className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Abrir KDS em tela cheia para monitor físico"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>Abrir Telão Físico KDS</span>
            </button>
          )}

          <button
            onClick={loadKds}
            className="p-2 border border-[#E2E8F0] rounded-[8px] hover:bg-slate-50 text-slate-600"
            title="Atualizar KDS"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0D9488]' : ''}`} />
          </button>
        </div>
      </div>

      {/* KDS Dark Screen (Strictly following Section 7 of DESIGN.md) */}
      <div className="bg-[#0B132B] text-slate-100 rounded-[16px] p-6 shadow-xl border border-slate-800">
        {/* KDS Screen Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-lg text-teal-300 tracking-wide uppercase">
              {selectedPonto?.nome || 'Tela KDS'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              &lt;5 min
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              5-10 min
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              &gt;10 min
            </span>
          </div>
        </div>

        {/* 2 Main Columns: EM PREPARO vs PRONTO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
          {/* Column 1: Em Preparo */}
          <div className="bg-slate-900/60 rounded-[12px] p-4 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="font-bold text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Em Preparo ({emPreparo.length})
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {emPreparo.map((it) => {
                const waitMin = getWaitMinutes(it.criadoEm);
                const waitStyle = getWaitColor(waitMin);

                return (
                  <div
                    key={it.id}
                    className={`p-4 rounded-[10px] border flex items-center justify-between transition-all ${waitStyle}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold font-mono tracking-tight">
                          {it.numeroExibicao}
                        </span>
                        <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-black/30 font-semibold">
                          {it.status === 'pendente' ? 'Fila' : 'Preparando'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold block mt-1 text-white">
                        {it.quantidade}x {it.itemNome}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-mono font-bold">
                        {waitMin} min atrás
                      </span>
                      <button
                        onClick={async () => {
                          await onAdvanceStatus(it.id, 'pronto');
                          await loadKds();
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Marcar Pronto ✓
                      </button>
                    </div>
                  </div>
                );
              })}

              {emPreparo.length === 0 && (
                <div className="h-40 flex items-center justify-center text-slate-500 text-xs italic">
                  Nenhum pedido pendente nesta praça.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Pronto */}
          <div className="bg-slate-900/60 rounded-[12px] p-4 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="font-bold text-sm uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Pronto para Entrega ({prontos.length})
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {prontos.map((it) => (
                <div
                  key={it.id}
                  className="p-4 rounded-[10px] border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 flex items-center justify-between"
                >
                  <div>
                    <span className="text-2xl font-bold font-mono tracking-tight block">
                      {it.numeroExibicao}
                    </span>
                    <span className="text-sm font-semibold text-white mt-1 block">
                      {it.quantidade}x {it.itemNome}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-mono text-emerald-400">
                      Aguardando Garçom
                    </span>
                    <button
                      onClick={async () => {
                        await onAdvanceStatus(it.id, 'entregue');
                        await loadKds();
                      }}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      Entregue
                    </button>
                  </div>
                </div>
              ))}

              {prontos.length === 0 && (
                <div className="h-40 flex items-center justify-center text-slate-500 text-xs italic">
                  Nenhum item pronto aguardando entrega.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
