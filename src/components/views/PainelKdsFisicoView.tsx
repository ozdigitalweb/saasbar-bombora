import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  RefreshCw,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Wine,
  AlertTriangle,
  ArrowLeft,
  Volume2,
  VolumeX,
  Flame,
  BellRing,
  Lock,
} from 'lucide-react';
import { PontoDePreparo, Evento } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

interface PainelKdsFisicoViewProps {
  pontos: PontoDePreparo[];
  activeEvento: Evento | null;
  onAdvanceStatus: (itemId: string, status: string) => Promise<void>;
  onBackToAdmin?: () => void;
}

export const PainelKdsFisicoView: React.FC<PainelKdsFisicoViewProps> = ({
  pontos,
  activeEvento,
  onAdvanceStatus,
  onBackToAdmin,
}) => {
  // Physical TV/Screen is strictly locked to ONE preparation station (persisted in localStorage)
  const [selectedPontoId, setSelectedPontoId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kds_ponto_fixo_id');
      if (saved && pontos.some((p) => p.id === saved)) return saved;
    }
    return pontos[0]?.id || '';
  });

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Ensure selectedPontoId is valid when pontos list loads
  useEffect(() => {
    if (pontos.length > 0) {
      const isValid = pontos.some((p) => p.id === selectedPontoId);
      if (!isValid) {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('kds_ponto_fixo_id') : null;
        if (saved && pontos.some((p) => p.id === saved)) {
          setSelectedPontoId(saved);
        } else {
          setSelectedPontoId(pontos[0].id);
        }
      }
    }
  }, [pontos, selectedPontoId]);

  // Clock ticker every 1 second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handler to configure/fix this physical screen to a single station
  const handleFixarPraca = (pontoId: string) => {
    setSelectedPontoId(pontoId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kds_ponto_fixo_id', pontoId);
    }
  };

  // Load KDS data strictly for this single assigned station
  const loadKdsData = async () => {
    if (!selectedPontoId) return;
    setIsLoading(true);
    try {
      // Never pass undefined: always fetch items strictly for this physical station
      const data = await api.getKdsFila(selectedPontoId, activeEvento?.id);
      setItems(data);
    } catch (err) {
      console.error('Falha ao carregar fila do KDS para a praça:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKdsData();
    const interval = setInterval(loadKdsData, 4000); // 4s fast refresh for kitchen screens
    return () => clearInterval(interval);
  }, [selectedPontoId, activeEvento]);

  // Fullscreen handler for physical TV monitors
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Erro ao ativar tela cheia:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Erro ao sair da tela cheia:', err);
      });
      setIsFullscreen(false);
    }
  };

  // Wait time calculations with minutes & seconds
  const getElapsedSeconds = (criadoEm: string) => {
    const diff = Math.floor((Date.now() - new Date(criadoEm).getTime()) / 1000);
    return Math.max(0, diff);
  };

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Color threshold for wait time (Section requirement):
  // < 5m: Verde normal
  // 5m-10m: Amarelo alerta
  // > 10m: Vermelho crítico atrasado
  const getUrgencyConfig = (seconds: number) => {
    const mins = seconds / 60;
    if (mins < 5) {
      return {
        tier: 'normal',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-950/40',
        borderColor: 'border-emerald-500/60',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        label: '< 5 min',
        isCritical: false,
      };
    }
    if (mins < 10) {
      return {
        tier: 'alerta',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-950/40',
        borderColor: 'border-amber-500/70',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        label: '5-10 min',
        isCritical: false,
      };
    }
    return {
      tier: 'critico',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-950/60',
      borderColor: 'border-rose-500',
      badgeBg: 'bg-rose-500/30 text-rose-200 border-rose-500',
      label: '> 10 min Atrasado',
      isCritical: true,
    };
  };

  const pontoAtual = pontos.find((p) => p.id === selectedPontoId) || pontos[0];

  // Separate columns
  const pendentes = items.filter((i) => i.status === 'pendente');
  const emPreparo = items.filter((i) => i.status === 'em_preparo');
  const prontos = items.filter((i) => i.status === 'pronto');
  const historicoRecente = items.filter((i) => i.status === 'entregue' || i.status === 'visto').slice(0, 8);

  const totalAtivos = pendentes.length + emPreparo.length + prontos.length;
  const totalAtrasados = items.filter(
    (i) => (i.status === 'pendente' || i.status === 'em_preparo') && getElapsedSeconds(i.criadoEm) >= 600
  ).length;

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col font-mono select-none">
      {/* KDS Header Bar (High visibility for TV / tablets) */}
      <header className="bg-[#0B1021] border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-4">
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 text-xs font-sans font-semibold cursor-pointer"
              title="Voltar ao painel do gerente"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Painel Gerencial</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase flex items-center gap-2">
                  <span>KDS TELÃO FÍSICO</span>
                </h1>
                <span className="flex items-center gap-1 text-xs font-bold font-sans text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-500/50">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>PRAÇA FIXA: {pontoAtual?.nome.toUpperCase() || 'COZINHA'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Station switcher: ONLY single individual physical stations (No "Todas as Praças") */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs font-sans">
            <span className="text-[11px] text-slate-400 font-semibold px-2 hidden xl:inline">
              Configurar Tela:
            </span>
            {pontos.map((p) => {
              const isBar = p.nome.toLowerCase().includes('copa') || p.nome.toLowerCase().includes('bar');
              const isSelected = selectedPontoId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleFixarPraca(p.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Fixar esta TV física na estação ${p.nome}`}
                >
                  {isBar ? <Wine className="w-3.5 h-3.5" /> : <ChefHat className="w-3.5 h-3.5" />}
                  <span>{p.nome}</span>
                  {isSelected && <span className="text-[9px] bg-slate-950 text-amber-300 px-1 rounded">FIXA</span>}
                </button>
              );
            })}
          </div>

          {/* Quick Metrics Badges */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-slate-400">Em Aberto:</span>
              <span className="font-bold text-amber-400 text-sm">{totalAtivos}</span>
            </div>

            {totalAtrasados > 0 && (
              <div className="bg-rose-950/80 border border-rose-500/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-rose-300 font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{totalAtrasados} Atrasado(s) &gt;10m</span>
              </div>
            )}
          </div>

          {/* Clock & Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-300 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg tabular-nums">
              {currentTime.toLocaleTimeString('pt-BR')}
            </span>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title={soundEnabled ? 'Silenciar alertas sonoros' : 'Ativar alertas sonoros'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Tela cheia na TV da praça"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Legend & Threshold Banner */}
      <div className="bg-[#090D1C] border-b border-slate-800/80 px-6 py-2 flex items-center justify-between text-xs font-sans">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-[11px] font-bold">
            Escala de Tempo de Espera:
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Normal (&lt; 5 min)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Atenção (5 - 10 min)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            Crítico / Atrasado (&gt; 10 min)
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-xs">
          <span className="text-slate-400">
            Exibindo estritamente itens de: <strong className="text-white">{pontoAtual?.nome}</strong>
          </span>
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : 'text-slate-600'}`} />
        </div>
      </div>

      {/* 3 Main Physical Columns Grid: PENDENTE | EM PREPARO | PRONTO */}
      <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
        {/* ============================================================== */}
        {/* COLUNA 1: FILA / PENDENTE */}
        {/* ============================================================== */}
        <section className="bg-[#0A0F1E] border border-slate-800/90 rounded-2xl p-4 flex flex-col shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black tracking-wider uppercase text-amber-300 font-sans">
                Fila / Pendente
              </h2>
            </div>
            <span className="font-mono font-bold text-sm bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
              {pendentes.length}
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
            {pendentes.map((it) => {
              const seconds = getElapsedSeconds(it.criadoEm);
              const urgency = getUrgencyConfig(seconds);

              return (
                <div
                  key={it.id}
                  className={`p-4 rounded-xl border-2 transition-all ${urgency.bgColor} ${urgency.borderColor} ${
                    urgency.isCritical ? 'animate-pulse ring-2 ring-rose-500/40' : ''
                  }`}
                >
                  {/* Top line: #P Number + Timer */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-white tracking-tight">
                      {it.numeroExibicao}
                    </span>

                    <div className="flex items-center gap-1.5 font-bold text-sm tabular-nums">
                      <Clock className="w-4 h-4" />
                      <span className={urgency.textColor}>{formatElapsed(seconds)}</span>
                    </div>
                  </div>

                  {/* Destination (Mesa / Pulseira) + Station */}
                  <div className="flex items-center gap-2 text-xs font-sans font-semibold mt-1">
                    <span className="bg-slate-900/90 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      {it.mesaIdentificador || (it.pulseiraCodigoQr ? `Pulseira ${it.pulseiraCodigoQr}` : 'Balcão')}
                    </span>
                    <span className="text-slate-400">• {it.pontoNome}</span>
                  </div>

                  {/* Item Description */}
                  <div className="mt-2.5">
                    <span className="text-xl font-black text-white font-sans block leading-tight">
                      {it.quantidade}x {it.itemNome}
                    </span>
                  </div>

                  {/* Advance to 'Em Preparo' Action Button */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={async () => {
                        await onAdvanceStatus(it.id, 'em_preparo');
                        await loadKdsData();
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-lg font-sans transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Iniciar Preparo</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {pendentes.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs font-sans italic text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-slate-700 mb-2" />
                <span>Nenhum pedido pendente nesta praça ({pontoAtual?.nome}).</span>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* COLUNA 2: EM PREPARO (PREPARANDO AGORA) */}
        {/* ============================================================== */}
        <section className="bg-[#0A0F1E] border border-slate-800/90 rounded-2xl p-4 flex flex-col shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-black tracking-wider uppercase text-sky-300 font-sans">
                Em Preparo
              </h2>
            </div>
            <span className="font-mono font-bold text-sm bg-sky-500/20 text-sky-300 px-2.5 py-0.5 rounded-lg border border-sky-500/30">
              {emPreparo.length}
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
            {emPreparo.map((it) => {
              const seconds = getElapsedSeconds(it.criadoEm);
              const urgency = getUrgencyConfig(seconds);

              return (
                <div
                  key={it.id}
                  className={`p-4 rounded-xl border-2 transition-all ${urgency.bgColor} ${urgency.borderColor} ${
                    urgency.isCritical ? 'animate-pulse ring-2 ring-rose-500/40' : ''
                  }`}
                >
                  {/* Top line: #P Number + Timer */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-white tracking-tight">
                      {it.numeroExibicao}
                    </span>

                    <div className="flex items-center gap-1.5 font-bold text-sm tabular-nums">
                      <Clock className="w-4 h-4" />
                      <span className={urgency.textColor}>{formatElapsed(seconds)}</span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-2 text-xs font-sans font-semibold mt-1">
                    <span className="bg-slate-900/90 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                      {it.mesaIdentificador || (it.pulseiraCodigoQr ? `Pulseira ${it.pulseiraCodigoQr}` : 'Balcão')}
                    </span>
                    <span className="text-slate-400">• {it.pontoNome}</span>
                  </div>

                  {/* Item Description */}
                  <div className="mt-2.5">
                    <span className="text-xl font-black text-white font-sans block leading-tight">
                      {it.quantidade}x {it.itemNome}
                    </span>
                  </div>

                  {/* Advance to 'Pronto' Action Button */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={async () => {
                        await onAdvanceStatus(it.id, 'pronto');
                        await loadKdsData();
                      }}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-lg font-sans transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                    >
                      <BellRing className="w-4 h-4" />
                      <span>Marcar Pronto ✓</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {emPreparo.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs font-sans italic text-center p-4">
                <span>Nenhum pedido sendo preparado no momento nesta praça.</span>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* COLUNA 3: PRONTO / EXPEDIÇÃO (AGUARDANDO GARÇOM) */}
        {/* ============================================================== */}
        <section className="bg-[#0A0F1E] border border-slate-800/90 rounded-2xl p-4 flex flex-col shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-black tracking-wider uppercase text-emerald-300 font-sans">
                Pronto para Entrega
              </h2>
            </div>
            <span className="font-mono font-bold text-sm bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
              {prontos.length}
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
            {prontos.map((it) => (
              <div
                key={it.id}
                className="p-4 rounded-xl border-2 border-emerald-500/60 bg-emerald-950/20 text-emerald-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {it.numeroExibicao}
                  </span>
                  <span className="text-xs font-sans font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded border border-emerald-500/40">
                    Aguardando Garçom
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-sans font-semibold mt-1">
                  <span className="bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    {it.mesaIdentificador || (it.pulseiraCodigoQr ? `Pulseira ${it.pulseiraCodigoQr}` : 'Balcão')}
                  </span>
                  <span className="text-slate-400">• {it.pontoNome}</span>
                </div>

                <div className="mt-2.5">
                  <span className="text-xl font-black text-white font-sans block leading-tight">
                    {it.quantidade}x {it.itemNome}
                  </span>
                </div>

                {/* Mark as Delivered */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={async () => {
                      await onAdvanceStatus(it.id, 'entregue');
                      await loadKdsData();
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm uppercase tracking-wider rounded-lg font-sans transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Entregue à Mesa ✓</span>
                  </button>
                </div>
              </div>
            ))}

            {prontos.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs font-sans italic text-center p-4">
                <span>Nenhum pedido aguardando retirada pelo garçom nesta praça.</span>
              </div>
            )}
          </div>

          {/* Bottom Recent Delivered Strip */}
          {historicoRecente.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-500 font-sans font-bold uppercase block mb-1.5">
                Últimos Entregues ({pontoAtual?.nome}):
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                {historicoRecente.map((h) => (
                  <span
                    key={h.id}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                    title={`${h.quantidade}x ${h.itemNome}`}
                  >
                    {h.numeroExibicao} ✓
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
