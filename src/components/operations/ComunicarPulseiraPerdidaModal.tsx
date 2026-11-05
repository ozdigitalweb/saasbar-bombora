import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  ArrowLeft,
  Clock,
  User,
  QrCode,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Evento, Estabelecimento, PulseiraPerdidaBuscaItem } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { Badge } from '../common/Badge.tsx';

interface ComunicarPulseiraPerdidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvento: Evento | null;
  currentEstabelecimento?: Estabelecimento | null;
  onSuccess?: (resultado: any) => void;
}

/**
 * Máscara brasileira para telefone celular:
 * (11) 99999-9999 ou (11) 8888-8888
 */
export function formatarCelularBrasileiro(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export const ComunicarPulseiraPerdidaModal: React.FC<ComunicarPulseiraPerdidaModalProps> = ({
  isOpen,
  onClose,
  activeEvento,
  currentEstabelecimento,
  onSuccess,
}) => {
  // Fluxo em 2 etapas
  const [etapa, setEtapa] = useState<1 | 2>(1);

  // Estados de entrada e busca
  const [celularInput, setCelularInput] = useState('');
  const [isBuscando, setIsBuscando] = useState(false);
  const [buscaErro, setBuscaErro] = useState<string | null>(null);
  const [vinculosEncontrados, setVinculosEncontrados] = useState<PulseiraPerdidaBuscaItem[]>([]);
  const [vinculoSelecionado, setVinculoSelecionado] = useState<PulseiraPerdidaBuscaItem | null>(null);

  // Estados de ação de tolerância
  const [isIniciandoTolerancia, setIsIniciandoTolerancia] = useState(false);
  const [resultadoTolerancia, setResultadoTolerancia] = useState<any | null>(null);
  const [sucessoFeedback, setSucessoFeedback] = useState<string | null>(null);

  // Reset ao abrir modal
  useEffect(() => {
    if (isOpen) {
      setEtapa(1);
      setCelularInput('');
      setIsBuscando(false);
      setBuscaErro(null);
      setVinculosEncontrados([]);
      setVinculoSelecionado(null);
      setIsIniciandoTolerancia(false);
      setResultadoTolerancia(null);
      setSucessoFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatado = formatarCelularBrasileiro(raw);
    setCelularInput(formatado);
    setBuscaErro(null);
  };

  const handleBuscarCliente = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const digitos = celularInput.replace(/\D/g, '');
    if (digitos.length < 10) {
      setBuscaErro('Informe um número de celular válido com DDD (mínimo 10 dígitos).');
      return;
    }

    setIsBuscando(true);
    setBuscaErro(null);
    setVinculosEncontrados([]);
    setVinculoSelecionado(null);
    setResultadoTolerancia(null);

    try {
      const resultados = await api.buscarPulseiraPorCelular(digitos, activeEvento?.id);

      if (!resultados || resultados.length === 0) {
        setBuscaErro('Nenhum cliente com pulseira ativa neste evento para este celular.');
        setVinculosEncontrados([]);
        return;
      }

      setVinculosEncontrados(resultados);

      // Se houver apenas 1 vínculo encontrado, seleciona automaticamente e avança para a Etapa 2
      if (resultados.length === 1) {
        setVinculoSelecionado(resultados[0]);
        setEtapa(2);
      }
      // Se houver mais de 1, permanece na etapa 1 exibindo a lista para escolha
    } catch (err: any) {
      console.error('Erro na busca por celular:', err);
      setBuscaErro(err.message || 'Erro ao consultar clientes por celular no servidor.');
    } finally {
      setIsBuscando(false);
    }
  };

  const handleSelecionarVinculoMultiplo = (item: PulseiraPerdidaBuscaItem) => {
    setVinculoSelecionado(item);
    setEtapa(2);
  };

  const handleIniciarTolerancia = async () => {
    if (!vinculoSelecionado) return;

    setIsIniciandoTolerancia(true);
    setBuscaErro(null);

    try {
      const res = await api.iniciarToleranciaPulseira(
        vinculoSelecionado.vinculoId,
        activeEvento?.id
      );

      setResultadoTolerancia(res);
      setSucessoFeedback('Tolerância de 30 minutos iniciada com sucesso no servidor!');

      // Atualiza o estado da tolerância no item selecionado para exibir o cronômetro
      setVinculoSelecionado((prev) =>
        prev
          ? {
              ...prev,
              tolerancia: {
                iniciada: true,
                comunicadoEm: res.comunicadoEm,
                prazoLimite: res.prazoLimite,
                minutosRestantes: 30,
                toleranciaExcedida: false,
              },
            }
          : null
      );

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      console.error('Erro ao iniciar tolerância:', err);
      setBuscaErro(err.message || 'Falha ao iniciar janela de tolerância de 30 min.');
    } finally {
      setIsIniciandoTolerancia(false);
    }
  };

  const handleVoltar = () => {
    setEtapa(1);
    setResultadoTolerancia(null);
    setSucessoFeedback(null);
    setBuscaErro(null);
  };

  const toleraciaJaAtiva = Boolean(
    vinculoSelecionado?.tolerancia?.iniciada || resultadoTolerancia
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 antialiased font-['Inter',sans-serif]">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl border border-rose-200 animate-fadeIn max-h-[92vh] overflow-y-auto">
        {/* Header com Título e Botão Fechar */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-['Space_Grotesk'] text-base sm:text-lg text-rose-700 leading-tight">
                Comunicar Pulseira Perdida
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {etapa === 1 ? 'Etapa 1 de 2: Identificação pelo Celular' : 'Etapa 2 de 2: Confirmação & Tolerância'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
            title="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso Vermelho com a Regra Oficial (DESIGN.md) */}
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-800 uppercase tracking-wide text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Regra Dinâmica de Segurança</span>
          </div>
          <p className="leading-relaxed text-rose-900/90 text-xs">
            Ao registrar a perda, o cliente tem <strong>30 minutos de tolerância</strong> cobrados em 1x normal. Itens consumidos após os 30 min terão multa dinâmica de <strong>5.0x</strong>.
          </p>
        </div>

        {/* Feedback de erro */}
        {buscaErro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{buscaErro}</p>
          </div>
        )}

        {/* Feedback de sucesso */}
        {sucessoFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-semibold">{sucessoFeedback}</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 1: BUSCA POR CELULAR DO CLIENTE */}
        {/* ========================================================================= */}
        {etapa === 1 && (
          <div className="space-y-4">
            <form onSubmit={handleBuscarCliente} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wide block mb-1">
                  CELULAR DO CLIENTE
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    autoFocus
                    value={celularInput}
                    onChange={handleCelularChange}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/20 rounded-xl text-base font-mono font-bold text-[#0F172A] placeholder:text-slate-400 transition-all outline-none"
                  />
                  {isBuscando && (
                    <div className="absolute right-3.5 top-3.5">
                      <RefreshCw className="w-5 h-5 text-[#0D9488] animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Informe o mesmo celular utilizado no check-in deste evento.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBuscando || celularInput.replace(/\D/g, '').length < 10}
                  className="flex-1 py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white font-bold font-['Space_Grotesk'] text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  {isBuscando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Buscando cliente...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Buscar cliente</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Caso de Mais de Um Vínculo Encontrado (Lista para Escolha) */}
            {vinculosEncontrados.length > 1 && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] uppercase">
                    Mais de uma pulseira encontrada ({vinculosEncontrados.length})
                  </span>
                  <span className="text-[11px] text-slate-500">Selecione para continuar</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {vinculosEncontrados.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelecionarVinculoMultiplo(item)}
                      className="p-3 bg-slate-50 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-300 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0F172A]">{item.nome}</span>
                          <span className="font-mono text-[11px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-semibold">
                            {item.pulseiraCodigoCurto}
                          </span>
                          {item.tolerancia.iniciada && (
                            <Badge variant="warning">Tolerância Ativa</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{item.mesaArea}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">{item.consumoFormatado}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelecionarVinculoMultiplo(item);
                        }}
                        className="px-3 py-1.5 bg-rose-600 group-hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Selecionar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: CARD DE CONFIRMAÇÃO & ACIONAMENTO DA TOLERÂNCIA */}
        {/* ========================================================================= */}
        {etapa === 2 && vinculoSelecionado && (
          <div className="space-y-4">
            {/* Card de Confirmação Detalhado */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0D9488] flex items-center justify-center font-bold text-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F172A] leading-tight">
                      {vinculoSelecionado.nome}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {vinculoSelecionado.celular}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    ID Pulseira
                  </span>
                  <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    {vinculoSelecionado.pulseiraCodigoCurto}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Mesa / Área */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    Mesa / Área
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5 text-xs">
                    {vinculoSelecionado.mesaArea}
                  </span>
                </div>

                {/* Consumo Acumulado */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" />
                    Consumo Acumulado
                  </span>
                  <span className="font-bold font-mono text-emerald-700 block mt-0.5 text-sm">
                    {vinculoSelecionado.consumoFormatado}
                  </span>
                </div>

                {/* Último Pedido */}
                <div className="col-span-2 p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Último Pedido
                      </span>
                      <span className="font-medium text-slate-700 text-xs">
                        {vinculoSelecionado.tempoUltimoPedidoTexto}
                      </span>
                    </div>
                  </div>
                  {vinculoSelecionado.ultimoPedidoEm && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(vinculoSelecionado.ultimoPedidoEm).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ESTADO: TOLERÂNCIA JÁ INICIADA (Mostrar tempo restante, SEM botão de reiniciar) */}
            {toleraciaJaAtiva ? (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Tolerância Ativa no Servidor
                  </span>
                  <Badge variant={vinculoSelecionado.tolerancia.toleranciaExcedida ? 'error' : 'success'}>
                    {vinculoSelecionado.tolerancia.toleranciaExcedida ? 'Prazo Excedido (5x)' : '1x Normal'}
                  </Badge>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Comunicado às:</span>
                    <span className="font-bold text-slate-900">
                      {vinculoSelecionado.tolerancia.comunicadoEm
                        ? new Date(vinculoSelecionado.tolerancia.comunicadoEm).toLocaleTimeString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Prazo limite tolerância:</span>
                    <span className="font-bold text-rose-700">
                      {vinculoSelecionado.tolerancia.prazoLimite
                        ? new Date(vinculoSelecionado.tolerancia.prazoLimite).toLocaleTimeString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-200">
                    <span className="text-slate-600 font-sans font-semibold">Tempo restante:</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {vinculoSelecionado.tolerancia.minutosRestantes !== null
                        ? `${vinculoSelecionado.tolerancia.minutosRestantes} min`
                        : '30 min'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-900/90 leading-relaxed font-sans">
                  O QR code desta pulseira já está <strong>bloqueado</strong>. O relógio de 30 minutos é gravado pelo servidor e não pode ser reiniciado por segurança.
                </p>

                {/* Botões quando tolerância já iniciada: SEM botão de reiniciar! */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleVoltar}
                    className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Buscar Outro Cliente</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold font-['Space_Grotesk'] text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Concluir & Fechar
                  </button>
                </div>
              </div>
            ) : (
              /* ESTADO: TOLERÂNCIA AINDA NÃO INICIADA (Botões Voltar e Iniciar Tolerância) */
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong>Atenção:</strong> Ao clicar em &quot;Iniciar Tolerância&quot;, o QR code desta pulseira será bloqueado imediatamente para novos pedidos e fechamento. O cronômetro oficial de 30 minutos será disparado.
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isIniciandoTolerancia}
                    onClick={handleVoltar}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    disabled={isIniciandoTolerancia}
                    onClick={handleIniciarTolerancia}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold font-['Space_Grotesk'] text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    {isIniciandoTolerancia ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gravando início no servidor...</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        <span>Iniciar Tolerância</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
