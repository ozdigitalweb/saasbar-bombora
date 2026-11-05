import React, { useState, useEffect } from 'react';
import {
  Receipt,
  DollarSign,
  CreditCard,
  QrCode,
  Users,
  ChefHat,
  Tv,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
  Search,
  Sparkles,
  RefreshCw,
  Wine,
  UtensilsCrossed,
  ShieldCheck,
  Send,
  Banknote,
  AlertTriangle,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  ComandaSummary,
  Evento,
  Estabelecimento,
  Usuario,
  PreviaFechamento,
  RelatorioRateios,
  MetodoPagamento,
  TipoContribuicao,
} from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { Badge } from '../common/Badge.tsx';

interface FechamentoRateioViewProps {
  comandas: ComandaSummary[];
  activeEvento: Evento | null;
  currentEstabelecimento: Estabelecimento | null;
  usuarios: Usuario[];
  onComandaClosed: () => void;
  preselectedComandaId?: string | null;
}

export const FechamentoRateioView: React.FC<FechamentoRateioViewProps> = ({
  comandas,
  activeEvento,
  currentEstabelecimento,
  usuarios,
  onComandaClosed,
  preselectedComandaId,
}) => {
  const [activeTab, setActiveTab] = useState<'checkout' | 'relatorio' | 'conciliacao'>('checkout');

  // Checkout State
  const [selectedComandaId, setSelectedComandaId] = useState<string>(preselectedComandaId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [previa, setPrevia] = useState<PreviaFechamento | null>(null);
  const [isLoadingPrevia, setIsLoadingPrevia] = useState(false);

  // Payment Form State
  const [metodoPagamento, setMetodoPagamento] = useState<string>('pix');
  const [valorRecebidoInput, setValorRecebidoInput] = useState<string>('');
  const [bandeiraInput, setBandeiraInput] = useState<string>('');
  const [nsuInput, setNsuInput] = useState<string>('');
  const [tipoContribuicao, setTipoContribuicao] = useState<TipoContribuicao>('taxa_servico_10');
  const [gorjetaLivreValor, setGorjetaLivreValor] = useState<string>('15.00');
  const [selectedGarcomId, setSelectedGarcomId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Relatório State
  const [relatorio, setRelatorio] = useState<RelatorioRateios | null>(null);
  const [isLoadingRelatorio, setIsLoadingRelatorio] = useState(false);

  // Conciliação & Caixas State
  const [relatorioConciliacao, setRelatorioConciliacao] = useState<any>(null);
  const [isLoadingConciliacao, setIsLoadingConciliacao] = useState(false);
  const [maquinaCreditoInput, setMaquinaCreditoInput] = useState<string>('');
  const [maquinaDebitoInput, setMaquinaDebitoInput] = useState<string>('');

  // Modals State
  const [modalAbrirCaixa, setModalAbrirCaixa] = useState<{ garcomId: string; nome: string } | null>(null);
  const [fundoInicialInput, setFundoInicialInput] = useState<string>('100.00');
  const [modalSangria, setModalSangria] = useState<{ caixaId: string; garcomNome: string } | null>(null);
  const [valorSangriaInput, setValorSangriaInput] = useState<string>('100.00');
  const [motivoSangriaInput, setMotivoSangriaInput] = useState<string>('');
  const [modalFecharCaixa, setModalFecharCaixa] = useState<{ caixaId: string; garcomNome: string; esperado: number } | null>(null);
  const [dinheiroDeclaradoModalInput, setDinheiroDeclaradoModalInput] = useState<string>('');
  const [modalEstorno, setModalEstorno] = useState<{ cobrancaId: string; valor: string; metodo: string; comandaId: string } | null>(null);
  const [motivoEstornoInput, setMotivoEstornoInput] = useState<string>('');
  const [isProcessingModal, setIsProcessingModal] = useState(false);

  const garcons = usuarios.filter((u) => u.papel === 'garcom');
  const comandasAbertas = comandas.filter((c) => c.status === 'aberta');

  // If preselectedComandaId changed
  useEffect(() => {
    if (preselectedComandaId) {
      setSelectedComandaId(preselectedComandaId);
    } else if (comandasAbertas.length > 0 && !selectedComandaId) {
      setSelectedComandaId(comandasAbertas[0].id);
    }
  }, [preselectedComandaId, comandasAbertas]);

  // Load Previa when selectedComandaId changes
  useEffect(() => {
    if (!selectedComandaId) {
      setPrevia(null);
      return;
    }

    const loadPrevia = async () => {
      setIsLoadingPrevia(true);
      setFeedbackMessage(null);
      try {
        const data = await api.getPreviaFechamento(selectedComandaId);
        setPrevia(data);
        if (data.comanda.garcomResponsavelId) {
          setSelectedGarcomId(data.comanda.garcomResponsavelId);
        } else if (garcons.length > 0) {
          setSelectedGarcomId(garcons[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load previa:', err);
        setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao carregar prévia da comanda.' });
      } finally {
        setIsLoadingPrevia(false);
      }
    };

    loadPrevia();
  }, [selectedComandaId]);

  // Load Relatório
  const loadRelatorio = async () => {
    if (!currentEstabelecimento) return;
    setIsLoadingRelatorio(true);
    try {
      const data = await api.getRelatorioRateios(
        currentEstabelecimento.id,
        activeEvento?.id
      );
      setRelatorio(data);
    } catch (err: any) {
      console.error('Failed to load relatorio rateios:', err);
    } finally {
      setIsLoadingRelatorio(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'relatorio') {
      loadRelatorio();
    }
  }, [activeTab, currentEstabelecimento, activeEvento]);

  // Calculate live numbers
  const totalConsumo = previa?.totalConsumo || 0;
  let valorContribuicao = 0;
  if (tipoContribuicao === 'taxa_servico_10') {
    valorContribuicao = Math.round(totalConsumo * 0.10 * 100) / 100;
  } else if (tipoContribuicao === 'gorjeta_livre') {
    valorContribuicao = Math.max(0, Number(gorjetaLivreValor) || 0);
  } else {
    valorContribuicao = 0;
  }
  const totalFinal = totalConsumo + valorContribuicao;

  const loadConciliacao = async () => {
    if (!activeEvento) return;
    setIsLoadingConciliacao(true);
    try {
      const data = await api.getRelatorioConciliacao(
        activeEvento.id,
        maquinaCreditoInput ? Number(maquinaCreditoInput) : undefined,
        maquinaDebitoInput ? Number(maquinaDebitoInput) : undefined
      );
      setRelatorioConciliacao(data);
    } catch (err: any) {
      console.error('Failed to load conciliacao:', err);
    } finally {
      setIsLoadingConciliacao(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'conciliacao') {
      loadConciliacao();
    }
  }, [activeTab, activeEvento]);

  // Handle Checkout Submission
  const handleFecharComanda = async () => {
    if (!selectedComandaId) return;

    if (metodoPagamento === 'dinheiro') {
      const recebido = Number(valorRecebidoInput);
      if (isNaN(recebido) || Math.round(recebido * 100) < Math.round(totalFinal * 100)) {
        setFeedbackMessage({
          type: 'error',
          text: `Valor recebido em dinheiro (R$ ${(recebido || 0).toFixed(2)}) é menor que o total a pagar (R$ ${totalFinal.toFixed(2)}).`,
        });
        return;
      }
    }

    setIsProcessing(true);
    setFeedbackMessage(null);

    try {
      const idempotencyKey = `close-mgr-${selectedComandaId}-${Date.now()}`;
      const payload: any = {
        metodo: metodoPagamento,
        tipoContribuicao,
        valorContribuicao: tipoContribuicao === 'gorjeta_livre' ? valorContribuicao : undefined,
        garcomId: selectedGarcomId || undefined,
        idempotencyKey,
      };

      if (metodoPagamento === 'dinheiro') {
        payload.valorRecebido = Number(valorRecebidoInput);
      }
      if (metodoPagamento === 'cartao_credito' || metodoPagamento === 'cartao_debito') {
        if (bandeiraInput.trim()) payload.bandeira = bandeiraInput.trim();
        if (nsuInput.trim()) payload.nsu = nsuInput.trim();
      }

      const res = await api.fecharComandaEfetuarPagamento(selectedComandaId, payload);

      const trocoMsg = res.troco && Number(res.troco) > 0 ? ` | Troco: R$ ${Number(res.troco).toFixed(2)}` : '';
      setFeedbackMessage({
        type: 'success',
        text: `Comanda fechada com sucesso! Pagamento de ${res.totalPago.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })} registrado via ${metodoPagamento.toUpperCase()}${trocoMsg}.`,
      });

      onComandaClosed();
      setSelectedComandaId('');
      setPrevia(null);
      setValorRecebidoInput('');
      setBandeiraInput('');
      setNsuInput('');

      // Refresh report if tab is switched
      if (activeTab === 'relatorio') {
        loadRelatorio();
      } else if (activeTab === 'conciliacao') {
        loadConciliacao();
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Erro ao processar fechamento da comanda.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmarAbrirCaixa = async () => {
    if (!modalAbrirCaixa || !activeEvento) return;
    const fundo = Number(fundoInicialInput);
    if (isNaN(fundo) || fundo < 0) {
      setFeedbackMessage({ type: 'error', text: 'Informe um fundo de troco inicial válido.' });
      return;
    }
    setIsProcessingModal(true);
    try {
      await api.abrirCaixaGarcom(activeEvento.id, modalAbrirCaixa.garcomId, fundo);
      setFeedbackMessage({ type: 'success', text: `Caixa do garçom ${modalAbrirCaixa.nome} aberto com fundo de R$ ${fundo.toFixed(2)}!` });
      setModalAbrirCaixa(null);
      loadConciliacao();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao abrir caixa do garçom.' });
    } finally {
      setIsProcessingModal(false);
    }
  };

  const handleConfirmarSangria = async () => {
    if (!modalSangria) return;
    const valor = Number(valorSangriaInput);
    if (isNaN(valor) || valor <= 0) {
      setFeedbackMessage({ type: 'error', text: 'Informe um valor válido maior que zero para a sangria.' });
      return;
    }
    setIsProcessingModal(true);
    try {
      await api.registrarSangria(modalSangria.caixaId, valor, motivoSangriaInput || undefined);
      setFeedbackMessage({ type: 'success', text: `Sangria de R$ ${valor.toFixed(2)} registrada com sucesso para ${modalSangria.garcomNome}!` });
      setModalSangria(null);
      setMotivoSangriaInput('');
      loadConciliacao();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao registrar sangria.' });
    } finally {
      setIsProcessingModal(false);
    }
  };

  const handleConfirmarFecharCaixa = async () => {
    if (!modalFecharCaixa) return;
    const declarado = Number(dinheiroDeclaradoModalInput);
    if (isNaN(declarado) || declarado < 0) {
      setFeedbackMessage({ type: 'error', text: 'Informe o dinheiro físico declarado pelo garçom.' });
      return;
    }
    setIsProcessingModal(true);
    try {
      const res = await api.fecharCaixaGarcom(modalFecharCaixa.caixaId, declarado);
      setFeedbackMessage({
        type: 'success',
        text: `Caixa de ${modalFecharCaixa.garcomNome} fechado! Declarado: R$ ${declarado.toFixed(2)} | Esperado: R$ ${Number(res.dinheiroEsperado).toFixed(2)} | Diferença: R$ ${Number(res.diferenca).toFixed(2)}`,
      });
      setModalFecharCaixa(null);
      setDinheiroDeclaradoModalInput('');
      loadConciliacao();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao fechar caixa.' });
    } finally {
      setIsProcessingModal(false);
    }
  };

  const handleConfirmarEstorno = async () => {
    if (!modalEstorno) return;
    if (!motivoEstornoInput.trim()) {
      setFeedbackMessage({ type: 'error', text: 'O motivo do estorno é obrigatório.' });
      return;
    }
    setIsProcessingModal(true);
    try {
      await api.estornarCobranca(modalEstorno.cobrancaId, motivoEstornoInput.trim());
      setFeedbackMessage({
        type: 'success',
        text: `Cobrança de R$ ${modalEstorno.valor} estornada com sucesso pelo gerente!`,
      });
      setModalEstorno(null);
      setMotivoEstornoInput('');
      loadRelatorio();
      loadConciliacao();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao estornar cobrança.' });
    } finally {
      setIsProcessingModal(false);
    }
  };

  const filteredComandas = comandasAbertas.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.clienteNome?.toLowerCase().includes(q) ||
      c.pulseiraCodigoQr?.toLowerCase().includes(q) ||
      c.mesaIdentificador?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] tracking-tight">
              Fechamento & Rateio de Contas
            </h1>
            <Badge variant="teal">Financeiro & Caixa</Badge>
          </div>
          <p className="text-[0.875rem] text-[#64748B] mt-0.5">
            Checkout de comandas, pagamentos sem pré-autorização e rateio transparente da taxa de serviço por item.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-[8px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('checkout')}
            className={`px-4 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'checkout'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Caixa & Checkout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relatorio')}
            className={`px-4 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'relatorio'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Extrato & Rateio da Equipe
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('conciliacao')}
            className={`px-4 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'conciliacao'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Conciliação & Caixas
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-[10px] border flex items-center justify-between gap-3 text-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CAIXA & CHECKOUT */}
      {/* ========================================================================= */}
      {activeTab === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Comanda Selection & Extrato */}
          <div className="lg:col-span-7 space-y-4">
            {/* Comanda Picker */}
            <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  1. Selecionar Comanda Aberta para Fechamento
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {comandasAbertas.length} comanda(s) aberta(s)
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por cliente, QR da pulseira ou mesa..."
                  className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              {/* Comanda Selector Dropdown */}
              <div>
                <select
                  value={selectedComandaId}
                  onChange={(e) => setSelectedComandaId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-[8px] text-[0.875rem] font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="">Selecione uma comanda...</option>
                  {filteredComandas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.pulseiraCodigoQr ? `Pulseira ${c.pulseiraCodigoQr}` : c.mesaIdentificador || 'Comanda'} • {c.clienteNome || 'Cliente'} (
                      {(Number(c.totalConsumo) || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                      )
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Extrato Detalhado do Consumo */}
            {isLoadingPrevia ? (
              <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-12 text-center text-slate-400 shadow-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0D9488]" />
                <p className="text-xs font-medium">Calculando itens e prévia da conta...</p>
              </div>
            ) : previa ? (
              <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">
                      Extrato da Conta • {previa.comanda.clienteNome || 'Cliente'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {previa.comanda.pulseiraCodigoQr ? `Pulseira ${previa.comanda.pulseiraCodigoQr}` : previa.comanda.mesaIdentificador || 'Comanda'} • {previa.comanda.tipoAtendimento}
                    </p>
                  </div>
                  <Badge variant="teal">{previa.itens.length} itens consumidos</Badge>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Item Consumido</th>
                        <th className="px-3 py-2.5 text-center">Qtd</th>
                        <th className="px-3 py-2.5">Ponto / Destino</th>
                        <th className="px-3 py-2.5 text-right">Unitário</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {previa.itens.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-medium text-[#0F172A]">
                            <div className="flex items-center gap-2">
                              {it.tipo === 'bebida' ? (
                                <Wine className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              ) : (
                                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              <span>{it.nome}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold">
                            {it.quantidade}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                              {it.tipo === 'bebida' ? 'Copa / Bar' : 'Cozinha'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                            {it.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-[#0F172A]">
                            {it.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                      ))}

                      {previa.itens.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-xs">
                            Nenhum item lançado nesta comanda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal Consumo footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-700">Subtotal dos Produtos:</span>
                  <span className="font-mono font-bold text-base text-[#0F172A]">
                    {totalConsumo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-12 text-center text-slate-400 shadow-xs">
                <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm text-[#0F172A]">Nenhuma comanda selecionada</p>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione uma comanda no menu acima para abrir o extrato e calcular o fechamento.
                </p>
              </div>
            )}

            {/* Simulação Explicativa de Rateio por Item (Regra Seção 5) */}
            {previa && previa.itens.length > 0 && (
              <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5" />
                    Regra Seção 5: Rateio por Item da Taxa de Serviço (10%)
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Bebida 60/40 • Comida 60/20/20
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 bg-teal-50/50 p-2.5 rounded-[6px] border border-teal-100">
                  <p>
                    <strong>Bebidas:</strong> 60% Garçom / 40% Copa • <strong>Comidas:</strong> 60% Cozinha / 20% Garçom / 20% Copa.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-2 py-2">Tipo</th>
                        <th className="px-2 py-2 text-right">Taxa 10%</th>
                        <th className="px-2 py-2 text-right text-emerald-700">Garçom</th>
                        <th className="px-2 py-2 text-right text-sky-700">Copa</th>
                        <th className="px-2 py-2 text-right text-amber-700">Cozinha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-mono text-[11px]">
                      {previa.itens.map((it) => (
                        <tr key={it.id}>
                          <td className="px-3 py-1.5 font-sans font-medium text-[#0F172A]">
                            {it.nome} ({it.quantidade}x)
                          </td>
                          <td className="px-2 py-1.5 uppercase text-[10px] text-slate-500 font-sans">
                            {it.tipo}
                          </td>
                          <td className="px-2 py-1.5 text-right font-bold text-slate-700">
                            {it.taxaItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-2 py-1.5 text-right text-emerald-700 font-bold">
                            {it.rateioGarcom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-2 py-1.5 text-right text-sky-700 font-bold">
                            {it.rateioCopa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-2 py-1.5 text-right text-amber-700 font-bold">
                            {it.rateioCozinha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-mono text-xs font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 font-sans uppercase text-[10px] text-slate-700">
                          Total Rateio Simulado (10%)
                        </td>
                        <td className="px-2 py-2 text-right text-slate-900">
                          {previa.taxaServico10.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-2 py-2 text-right text-emerald-800">
                          {previa.rateio10Estimado.garcom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-2 py-2 text-right text-sky-800">
                          {previa.rateio10Estimado.copa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-2 py-2 text-right text-amber-800">
                          {previa.rateio10Estimado.cozinha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Checkout Controls & Payment Execution */}
          <div className="lg:col-span-5 space-y-4">
            {/* Step 2: Escolha da Taxa de Serviço / Gorjeta */}
            <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs space-y-3">
              <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                2. Taxa de Serviço & Contribuição
              </span>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Option 1: 10% */}
                <label
                  className={`p-3 rounded-[8px] border cursor-pointer transition-all flex items-center justify-between ${
                    tipoContribuicao === 'taxa_servico_10'
                      ? 'border-[#0D9488] bg-teal-50/30 ring-1 ring-[#0D9488]'
                      : 'border-[#E2E8F0] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tipoContribuicao"
                      value="taxa_servico_10"
                      checked={tipoContribuicao === 'taxa_servico_10'}
                      onChange={() => setTipoContribuicao('taxa_servico_10')}
                      className="text-[#0D9488] focus:ring-[#0D9488]"
                    />
                    <div>
                      <span className="font-semibold text-xs text-[#0F172A] block">
                        Taxa de Serviço 10% (Padrão)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Rateada entre Garçom, Copa e Cozinha
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#0D9488]">
                    + {(totalConsumo * 0.10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </label>

                {/* Option 2: Gorjeta Livre */}
                <label
                  className={`p-3 rounded-[8px] border cursor-pointer transition-all ${
                    tipoContribuicao === 'gorjeta_livre'
                      ? 'border-[#0D9488] bg-teal-50/30 ring-1 ring-[#0D9488]'
                      : 'border-[#E2E8F0] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tipoContribuicao"
                        value="gorjeta_livre"
                        checked={tipoContribuicao === 'gorjeta_livre'}
                        onChange={() => setTipoContribuicao('gorjeta_livre')}
                        className="text-[#0D9488] focus:ring-[#0D9488]"
                      />
                      <div>
                        <span className="font-semibold text-xs text-[#0F172A] block">
                          Gorjeta Livre (100% Garçom)
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Valor voluntário integral ao atendente
                        </span>
                      </div>
                    </div>
                  </div>

                  {tipoContribuicao === 'gorjeta_livre' && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">Valor (R$):</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={gorjetaLivreValor}
                        onChange={(e) => setGorjetaLivreValor(e.target.value)}
                        className="w-28 px-2.5 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                      />
                    </div>
                  )}
                </label>

                {/* Option 3: Nenhuma */}
                <label
                  className={`p-3 rounded-[8px] border cursor-pointer transition-all flex items-center justify-between ${
                    tipoContribuicao === 'nenhuma'
                      ? 'border-[#0D9488] bg-teal-50/30 ring-1 ring-[#0D9488]'
                      : 'border-[#E2E8F0] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tipoContribuicao"
                      value="nenhuma"
                      checked={tipoContribuicao === 'nenhuma'}
                      onChange={() => setTipoContribuicao('nenhuma')}
                      className="text-[#0D9488] focus:ring-[#0D9488]"
                    />
                    <div>
                      <span className="font-semibold text-xs text-[#0F172A] block">
                        Isento / Sem Taxa de Serviço
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Cliente optou por não contribuir
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-400">R$ 0,00</span>
                </label>
              </div>
            </div>

            {/* Step 3: Atribuição do Garçom */}
            <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs space-y-2">
              <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                3. Garçom Beneficiário
              </span>
              <select
                value={selectedGarcomId}
                onChange={(e) => setSelectedGarcomId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                <option value="">Selecione o garçom responsável...</option>
                {garcons.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} ({g.celular || 'Garçom'})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: Método de Pagamento (Sem Pré-autorização) */}
            <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  4. Método de Pagamento (Sem Pré-autorização)
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                  Direto no POS / Pix
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPagamento('pix')}
                  className={`p-3 rounded-[8px] border text-center transition-all ${
                    metodoPagamento === 'pix'
                      ? 'border-[#0D9488] bg-teal-50/50 text-[#0D9488] font-bold shadow-xs'
                      : 'border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs block">Pix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPagamento('cartao_credito')}
                  className={`p-3 rounded-[8px] border text-center transition-all ${
                    metodoPagamento === 'cartao_credito'
                      ? 'border-[#0D9488] bg-teal-50/50 text-[#0D9488] font-bold shadow-xs'
                      : 'border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs block">Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPagamento('cartao_debito')}
                  className={`p-3 rounded-[8px] border text-center transition-all ${
                    metodoPagamento === 'cartao_debito'
                      ? 'border-[#0D9488] bg-teal-50/50 text-[#0D9488] font-bold shadow-xs'
                      : 'border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs block">Débito</span>
                </button>
              </div>

              {metodoPagamento === 'pix' && (
                <div className="p-3 bg-slate-50 rounded-[8px] border border-slate-200 text-center space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Chave Pix do Estabelecimento ({currentEstabelecimento?.nome}):
                  </span>
                  <span className="font-mono text-xs font-bold text-[#0F172A] block select-all">
                    pix@bombora.bar.br
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Pagamento validado na conferência do caixa.
                  </span>
                </div>
              )}
            </div>

            {/* Total Card & Submit Action */}
            <div className="bg-[#0F172A] text-white rounded-[10px] p-5 shadow-lg space-y-4">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal Consumo:</span>
                  <span className="font-mono text-white">
                    {totalConsumo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {tipoContribuicao === 'taxa_servico_10'
                      ? 'Taxa de Serviço (10%):'
                      : tipoContribuicao === 'gorjeta_livre'
                      ? 'Gorjeta Voluntária:'
                      : 'Taxa de Serviço:'}
                  </span>
                  <span className="font-mono text-emerald-400">
                    +{valorContribuicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
                  <span className="text-sm font-bold uppercase text-white">Total a Pagar:</span>
                  <span className="font-mono text-2xl font-bold text-teal-300">
                    {totalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing || !selectedComandaId || totalConsumo <= 0}
                onClick={handleFecharComanda}
                className="w-full py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white rounded-[8px] font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processando Pagamento & Rateio...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Pagamento & Fechar Comanda</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                A comanda será arquivada, liberando a pulseira e a mesa para novos atendimentos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXTRATO & RATEIO DA EQUIPE */}
      {/* ========================================================================= */}
      {activeTab === 'relatorio' && (
        <div className="space-y-6">
          {isLoadingRelatorio ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0D9488]" />
              <p className="text-xs font-medium">Carregando relatório financeiro e rateios...</p>
            </div>
          ) : relatorio ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Faturamento de Consumo
                  </span>
                  <div className="mt-1">
                    <span className="text-[1.75rem] font-bold text-[#0F172A] font-mono leading-none">
                      {relatorio.totalFaturadoConsumo.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Taxas & Gorjetas Arrecadadas
                  </span>
                  <div className="mt-1">
                    <span className="text-[1.75rem] font-bold text-emerald-600 font-mono leading-none">
                      {relatorio.totalTaxasGorjetas.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Total Faturado no Caixa
                  </span>
                  <div className="mt-1">
                    <span className="text-[1.75rem] font-bold text-[#0D9488] font-mono leading-none">
                      {relatorio.totalGeral.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Comandas Encerradas
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-[1.75rem] font-bold text-[#0F172A] font-mono leading-none">
                      {relatorio.pagamentos.length}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">pagas e rateadas</span>
                  </div>
                </div>
              </div>

              {/* Rateio Breakdown by Beneficiary & Payment Method Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Beneficiaries Breakdown */}
                <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                      <Percent className="w-4 h-4 text-[#0D9488]" />
                      Distribuição do Rateio por Equipe
                    </h3>
                    <Badge variant="teal">Regra Seção 5</Badge>
                  </div>

                  <div className="space-y-3">
                    {/* Garçons */}
                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-[8px] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-emerald-700" />
                        <div>
                          <span className="font-bold text-xs text-emerald-900 block">Garçons (Atendimento)</span>
                          <span className="text-[11px] text-emerald-700">
                            60% Bebidas • 20% Comidas • 100% Gorjeta Livre
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-emerald-800">
                        {relatorio.rateioBeneficiarios.totalGarcons.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>

                    {/* Copa / Bar */}
                    <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-[8px] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Wine className="w-4 h-4 text-sky-700" />
                        <div>
                          <span className="font-bold text-xs text-sky-900 block">Copa / Bar</span>
                          <span className="text-[11px] text-sky-700">40% Bebidas • 20% Comidas</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-sky-800">
                        {relatorio.rateioBeneficiarios.totalCopa.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>

                    {/* Cozinha */}
                    <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-[8px] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ChefHat className="w-4 h-4 text-amber-700" />
                        <div>
                          <span className="font-bold text-xs text-amber-900 block">Cozinha Principal</span>
                          <span className="text-[11px] text-amber-700">60% Comidas</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-amber-800">
                        {relatorio.rateioBeneficiarios.totalCozinha.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Individual Waiters list */}
                  {relatorio.rateioBeneficiarios.garcons.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-2">
                        Comissão Individual por Garçom:
                      </span>
                      <div className="space-y-1.5">
                        {relatorio.rateioBeneficiarios.garcons.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50"
                          >
                            <span className="font-medium text-[#0F172A]">{g.nome}</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {g.totalComissao.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Methods Distribution */}
                <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#0D9488]" />
                      Métodos de Pagamento Utilizados
                    </h3>
                    <span className="text-[10px] text-slate-500">Sem pré-autorização</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-[8px] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <QrCode className="w-4 h-4 text-[#0D9488]" />
                        <span className="text-xs font-semibold text-slate-800">Pix Instantâneo</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#0F172A]">
                        {relatorio.metodoBreakdown.pix.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-[8px] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-semibold text-slate-800">Cartão de Crédito (POS)</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#0F172A]">
                        {relatorio.metodoBreakdown.cartao_credito.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-[8px] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-semibold text-slate-800">Cartão de Débito (POS)</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#0F172A]">
                        {relatorio.metodoBreakdown.cartao_debito.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#0F172A]">
                    Histórico de Comandas Fechadas & Pagamentos
                  </h3>
                  <button
                    type="button"
                    onClick={loadRelatorio}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                    title="Atualizar relatório"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Comanda / Cliente</th>
                        <th className="px-3 py-3">Método</th>
                        <th className="px-3 py-3">Contribuição</th>
                        <th className="px-3 py-3 text-right">Consumo</th>
                        <th className="px-3 py-3 text-right">Taxa / Gorjeta</th>
                        <th className="px-4 py-3 text-right">Total Pago</th>
                        <th className="px-4 py-3">Horário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {relatorio.pagamentos.map((p) => {
                        const total = (Number(p.valorConsumo) || 0) + (Number(p.valorContribuicao) || 0);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-[#0F172A] block">
                                {p.clienteNome || 'Cliente'}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {p.pulseiraCodigo ? `Pulseira ${p.pulseiraCodigo}` : p.mesaIdentificador || 'Comanda'}
                              </span>
                            </td>

                            <td className="px-3 py-3 font-semibold uppercase text-[10px] text-slate-700">
                              {p.metodo.replace('_', ' ')}
                            </td>

                            <td className="px-3 py-3">
                              <Badge
                                variant={
                                  p.tipoContribuicao === 'taxa_servico_10'
                                    ? 'teal'
                                    : p.tipoContribuicao === 'gorjeta_livre'
                                    ? 'success'
                                    : 'neutral'
                                }
                              >
                                {p.tipoContribuicao === 'taxa_servico_10'
                                  ? '10%'
                                  : p.tipoContribuicao === 'gorjeta_livre'
                                  ? 'Gorjeta'
                                  : 'Isento'}
                              </Badge>
                            </td>

                            <td className="px-3 py-3 text-right font-mono text-slate-600">
                              {Number(p.valorConsumo).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </td>

                            <td className="px-3 py-3 text-right font-mono font-semibold text-emerald-700">
                              +{Number(p.valorContribuicao).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-bold text-[#0F172A]">
                              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>

                            <td className="px-4 py-3 text-slate-500 text-[11px] font-mono">
                              {new Date(p.criadoEm).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        );
                      })}

                      {relatorio.pagamentos.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                            Nenhum pagamento registrado ainda neste evento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
