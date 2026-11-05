import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  QrCode,
  UtensilsCrossed,
  Clock,
  Receipt,
  User,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Star,
  Smartphone,
  Send,
  RefreshCw,
  Bell,
  MessageCircle,
  CreditCard,
  Wine,
  ChefHat,
  ChevronRight,
  ShieldAlert,
  X,
  Award,
  TrendingUp,
  DollarSign,
  Phone,
  Flame,
  Check,
  Banknote,
} from 'lucide-react';
import {
  ItemCardapio,
  Mesa,
  Evento,
  Usuario,
  Estabelecimento,
  Cliente,
  FidelidadeExtrato,
} from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { ComunicarPulseiraPerdidaModal } from '../operations/ComunicarPulseiraPerdidaModal.tsx';

// High-fidelity image assets generated for menu
import cocktailImg from '../../assets/images/menu_craft_cocktail_1790994179642.jpg';
import burgerImg from '../../assets/images/menu_artisan_burger_1790994200082.jpg';
import beerImg from '../../assets/images/menu_cold_draft_beer_1790994248258.jpg';
import tapasImg from '../../assets/images/menu_bar_tapas_platter_1790994258503.jpg';

interface GarcomMobileAppViewProps {
  currentEstabelecimento: Estabelecimento | null;
  activeEvento: Evento | null;
  currentUser: Usuario | null;
  mesas: Mesa[];
  onBackToAdmin?: () => void;
}

type GarcomTab = 'checkin' | 'pedidos' | 'fila' | 'fechamento' | 'perfil';

interface CartItem {
  item: ItemCardapio;
  quantidade: number;
  observacoes?: string;
}

export const GarcomMobileAppView: React.FC<GarcomMobileAppViewProps> = ({
  currentEstabelecimento,
  activeEvento,
  currentUser,
  mesas,
  onBackToAdmin,
}) => {
  // Navigation: 5 fixed bottom tabs (thumb-zone)
  const [activeTab, setActiveTab] = useState<GarcomTab>('checkin');

  // Mobile frame simulator toggle for desktop testing
  const [isMobileSimulation, setIsMobileSimulation] = useState(true);

  // Global toast feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error' | 'info', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // =========================================================================
  // TAB 1: CHECK-IN (CLIENTE & PULSEIRA)
  // =========================================================================
  const [searchCelular, setSearchCelular] = useState('');
  const [isSearchingCliente, setIsSearchingCliente] = useState(false);
  const [foundCliente, setFoundCliente] = useState<Cliente | null>(null);
  const [fidelidadeData, setFidelidadeData] = useState<FidelidadeExtrato | null>(null);
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [saudacaoText, setSaudacaoText] = useState('');

  // Form for new client if not found (Name + Celular, NO CPF)
  const [novoNome, setNovoNome] = useState('');
  const [novoCelular, setNovoCelular] = useState('');

  // Physical wristband & table assignment
  const [qrPulseira, setQrPulseira] = useState('');
  const [selectedMesaIdCheckIn, setSelectedMesaIdCheckIn] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);


  // Modal: Pulseira Perdida (30 min tolerance timer via Celular)
  const [showPerdaModal, setShowPerdaModal] = useState(false);

  // Search existing customer by phone
  const handleBuscarCliente = async (celularToSearch?: string) => {
    const cel = (celularToSearch || searchCelular).trim();
    if (!cel || cel.length < 8) {
      showFeedback('error', 'Digite um número de celular válido para busca.');
      return;
    }
    setIsSearchingCliente(true);
    try {
      const res = await api.buscarClienteGarcom(cel, currentEstabelecimento?.id);
      if (res.encontrado && res.cliente) {
        setFoundCliente(res.cliente);
        setFidelidadeData(res.fidelidade);
        setIsRecorrente(res.recorrente);
        setSaudacaoText(res.saudacao);
        showFeedback('success', `Cliente ${res.cliente.nome} localizado!`);
      } else {
        setFoundCliente(null);
        setFidelidadeData(null);
        setIsRecorrente(false);
        setNovoCelular(cel);
        showFeedback('info', 'Cliente novo não cadastrado. Preencha o nome para check-in.');
      }
    } catch (err: any) {
      console.error('Erro ao buscar cliente:', err);
      showFeedback('error', err.message || 'Erro ao buscar cliente');
    } finally {
      setIsSearchingCliente(false);
    }
  };

  // Submit check-in of wristband + customer
  const handleConfirmarCheckIn = async () => {
    if (!qrPulseira.trim()) {
      showFeedback('error', 'Informe ou escaneie o código QR da pulseira física.');
      return;
    }
    if (!activeEvento) {
      showFeedback('error', 'Nenhum evento ativo selecionado para vinculação.');
      return;
    }
    if (!foundCliente && (!novoNome.trim() || !novoCelular.trim())) {
      showFeedback('error', 'Informe o nome e celular do novo cliente.');
      return;
    }

    setIsCheckingIn(true);
    try {
      const payload: any = {
        estabelecimentoId: currentEstabelecimento?.id,
        codigoQrPulseira: qrPulseira.trim(),
        eventoId: activeEvento.id,
        mesaId: selectedMesaIdCheckIn || undefined,
        garcomId: currentUser?.id,
      };

      if (foundCliente) {
        payload.clienteId = foundCliente.id;
      } else {
        payload.nome = novoNome.trim();
        payload.celular = novoCelular.trim();
      }

      const res = await api.checkInPulseiraGarcom(payload);
      showFeedback('success', `Check-in realizado! Pulseira ${res.pulseira.codigoQr} vinculada a ${res.cliente.nome}.`);

      // Reset form
      setQrPulseira('');
      setSearchCelular('');
      setFoundCliente(null);
      setNovoNome('');
      setNovoCelular('');
      setSelectedMesaIdCheckIn('');
    } catch (err: any) {
      console.error('Erro no check-in:', err);
      showFeedback('error', err.message || 'Falha ao vincular pulseira');
    } finally {
      setIsCheckingIn(false);
    }
  };


  // =========================================================================
  // TAB 2: PEDIDOS (CARDÁPIO RÁPIDO & ROTEAMENTO DIRETO)
  // =========================================================================
  const [itensCardapio, setItensCardapio] = useState<ItemCardapio[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<'todos' | 'bebidas' | 'comidas'>('todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmittingPedido, setIsSubmittingPedido] = useState(false);

  // Destination of order (by Table or by Wristband)
  const [destinoTipo, setDestinoTipo] = useState<'mesa' | 'pulseira'>('mesa');
  const [targetMesaId, setTargetMesaId] = useState(mesas[0]?.id || '');
  const [targetPulseiraQr, setTargetPulseiraQr] = useState('');

  // Observation modal per item
  const [itemObservacaoModal, setItemObservacaoModal] = useState<ItemCardapio | null>(null);
  const [obsText, setObsText] = useState('');

  const loadMenu = async () => {
    if (!currentEstabelecimento?.id) return;
    setIsLoadingMenu(true);
    try {
      const data = await api.getItensCardapio(currentEstabelecimento.id);
      setItensCardapio(data);
    } catch (err) {
      console.error('Erro ao carregar cardápio:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [currentEstabelecimento]);

  const getItemImage = (nome: string) => {
    const n = nome.toLowerCase();
    if (n.includes('chopp') || n.includes('cerveja') || n.includes('beer')) return beerImg;
    if (n.includes('gin') || n.includes('drink') || n.includes('cocktail') || n.includes('caipirinha')) return cocktailImg;
    if (n.includes('burger') || n.includes('hamburguer') || n.includes('carne') || n.includes('sanduiche')) return burgerImg;
    return tapasImg;
  };

  const addToCart = (item: ItemCardapio, obs?: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id
            ? { ...ci, quantidade: ci.quantidade + 1, observacoes: obs || ci.observacoes }
            : ci
        );
      }
      return [...prev, { item, quantidade: 1, observacoes: obs }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === itemId);
      if (existing && existing.quantidade > 1) {
        return prev.map((ci) =>
          ci.item.id === itemId ? { ...ci, quantidade: ci.quantidade - 1 } : ci
        );
      }
      return prev.filter((ci) => ci.item.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((acc, ci) => acc + (Number(ci.item.preco) || 0) * ci.quantidade, 0);
  const cartCount = cart.reduce((acc, ci) => acc + ci.quantidade, 0);

  const filteredMenu = itensCardapio.filter((it) => {
    const matchSearch =
      it.nome.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (it.pontoDePreparoNome || '').toLowerCase().includes(menuSearch.toLowerCase());
    if (!matchSearch) return false;
    if (categoriaFiltro === 'todos') return true;
    const pNome = (it.pontoDePreparoNome || '').toLowerCase();
    if (categoriaFiltro === 'bebidas') return pNome.includes('copa') || pNome.includes('bar');
    if (categoriaFiltro === 'comidas') return pNome.includes('cozinha') || pNome.includes('lanche');
    return true;
  });

  // Pedidos de autoatendimento aguardando validação pelo garçom
  const [pedidosValidacao, setPedidosValidacao] = useState<any[]>([]);
  const [isLoadingValidacao, setIsLoadingValidacao] = useState(false);
  const [confirmadosPresencialMap, setConfirmadosPresencialMap] = useState<Record<string, boolean>>({});
  const [subAbaPedidos, setSubAbaPedidos] = useState<'lancar' | 'validar_mesa'>('lancar');
  const [isProcessandoValidacao, setIsProcessandoValidacao] = useState<string | null>(null);

  const carregarPedidosValidacao = async () => {
    if (!activeEvento?.id) return;
    setIsLoadingValidacao(true);
    try {
      const data = await api.getPedidosAguardandoValidacao(activeEvento.id);
      setPedidosValidacao(data);
    } catch (e) {
      console.error('Erro ao carregar pedidos aguardando validação:', e);
    } finally {
      setIsLoadingValidacao(false);
    }
  };

  useEffect(() => {
    if (activeEvento?.id) {
      carregarPedidosValidacao();
      const interval = setInterval(carregarPedidosValidacao, 5000);
      return () => clearInterval(interval);
    }
  }, [activeEvento?.id]);

  const handleValidarPedidoGarcom = async (pItem: any) => {
    setIsProcessandoValidacao(pItem.pedidoId);
    try {
      const confirmadoPresencial = Boolean(confirmadosPresencialMap[pItem.pedidoId]);
      await api.validarPedido(pItem.pedidoId, confirmadoPresencial);
      showFeedback('success', `Pedido da ${pItem.mesaIdentificador || 'mesa'} validado com sucesso!`);
      await carregarPedidosValidacao();
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao validar pedido.');
    } finally {
      setIsProcessandoValidacao(null);
    }
  };

  // Submit order to kitchen/bar
  const handleEnviarPedidoGarcom = async () => {
    if (cart.length === 0) {
      showFeedback('error', 'Selecione ao menos um item no cardápio.');
      return;
    }
    if (!activeEvento) {
      showFeedback('error', 'Nenhum evento ativo selecionado.');
      return;
    }

    setIsSubmittingPedido(true);
    try {
      let comandaAlvoId = '';

      if (destinoTipo === 'mesa') {
        if (!targetMesaId) throw new Error('Selecione uma mesa para o pedido.');
        const resMesa = await api.getComandaPorMesa(targetMesaId, activeEvento.id);
        if (!resMesa || !resMesa.comanda) {
          // Table not open yet: open it automatically for the session!
          const cmdAberta = await api.liberarMesaGarcom(targetMesaId, activeEvento.id, currentUser?.id);
          comandaAlvoId = cmdAberta.comanda.id;
        } else {
          comandaAlvoId = resMesa.comanda.id;
        }
      } else {
        if (!targetPulseiraQr.trim()) throw new Error('Informe o QR da pulseira.');
        const resPul = await api.getComandaPorPulseira(targetPulseiraQr.trim(), activeEvento.id);
        if (!resPul || !resPul.id) {
          throw new Error('Comanda não encontrada para esta pulseira.');
        }
        comandaAlvoId = resPul.id;
      }

      await api.lancamentoRapido({
        comandaId: comandaAlvoId,
        origem: 'garcom',
        itens: cart.map((ci) => ({
          itemCardapioId: ci.item.id,
          quantidade: ci.quantidade,
        })),
      });

      showFeedback('success', `Pedido de ${cartCount} itens enviado para Copa & Cozinha!`);
      setCart([]);
    } catch (err: any) {
      console.error('Erro ao enviar pedido:', err);
      showFeedback('error', err.message || 'Falha ao enviar pedido');
    } finally {
      setIsSubmittingPedido(false);
    }
  };

  // =========================================================================
  // TAB 3: FILA (FILA DE ENTREGA COM ALERTA PULSANTE)
  // =========================================================================
  const [filaEntrega, setFilaEntrega] = useState<any[]>([]);
  const [isLoadingFila, setIsLoadingFila] = useState(false);
  const [currentTimeTicker, setCurrentTimeTicker] = useState<Date>(new Date());

  const loadFilaEntrega = async () => {
    if (!activeEvento) return;
    try {
      const items = await api.getFilaEntregaGarcom(activeEvento.id, currentUser?.id);
      setFilaEntrega(items);
    } catch (err) {
      console.error('Erro ao atualizar fila de entrega:', err);
    }
  };

  useEffect(() => {
    loadFilaEntrega();
    const interval = setInterval(loadFilaEntrega, 3000); // 3s polling for delivery queue
    const clock = setInterval(() => setCurrentTimeTicker(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, [activeEvento, currentUser]);

  const handleMarcarRecebido = async (itemId: string, itemNome: string) => {
    try {
      await api.confirmarRecebimentoItem(itemId);
      showFeedback('success', `Item "${itemNome}" retirado e marcado como visto!`);
      await loadFilaEntrega();
      // Also refresh profile performance metrics
      if (currentUser?.id && activeEvento?.id) {
        loadPerfil();
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao confirmar retirada');
    }
  };

  // =========================================================================
  // TAB 4: FECHAMENTO & RATEIO
  // =========================================================================
  const [fechamentoBuscaTipo, setFechamentoBuscaTipo] = useState<'mesa' | 'pulseira'>('mesa');
  const [fechamentoMesaId, setFechamentoMesaId] = useState(mesas[0]?.id || '');
  const [fechamentoPulseiraQr, setFechamentoPulseiraQr] = useState('');
  const [comandaFechamento, setComandaFechamento] = useState<any>(null);
  const [isLoadingFechamento, setIsLoadingFechamento] = useState(false);

  // 3 Contribution options: taxa_servico_10 | gorjeta_livre | nenhuma
  const [tipoContribuicao, setTipoContribuicao] = useState<'taxa_servico_10' | 'gorjeta_livre' | 'nenhuma'>('taxa_servico_10');
  const [valorGorjetaLivre, setValorGorjetaLivre] = useState<string>('10.00');

  // 4 Payment methods: pix | cartao_credito | cartao_debito | dinheiro
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro'>('pix');
  const [valorRecebidoDinheiro, setValorRecebidoDinheiro] = useState<string>('');
  const [bandeiraCartao, setBandeiraCartao] = useState<string>('');
  const [nsuCartao, setNsuCartao] = useState<string>('');
  const [isProcessandoFechamento, setIsProcessandoFechamento] = useState(false);

  // Caixa do Garçom
  const [statusCaixaGarcom, setStatusCaixaGarcom] = useState<any>(null);
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false);
  const [dinheiroDeclaradoInput, setDinheiroDeclaradoInput] = useState('');
  const [isProcessandoCaixa, setIsProcessandoCaixa] = useState(false);

  // Post-closing receipt
  const [fechamentoConcluido, setFechamentoConcluido] = useState<any>(null);
  const [linkWhatsApp, setLinkWhatsApp] = useState<string | null>(null);

  const carregarStatusCaixa = async () => {
    if (!currentUser || !activeEvento) return;
    try {
      const res = await api.getStatusCaixaGarcom(currentUser.id, activeEvento.id);
      setStatusCaixaGarcom(res);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    carregarStatusCaixa();
  }, [currentUser?.id, activeEvento?.id, activeTab]);

  const handleBuscarComandaFechamento = async () => {
    if (!activeEvento) return;
    setIsLoadingFechamento(true);
    setComandaFechamento(null);
    setFechamentoConcluido(null);
    setLinkWhatsApp(null);
    setValorRecebidoDinheiro('');
    setBandeiraCartao('');
    setNsuCartao('');
    try {
      let cmd: any = null;
      if (fechamentoBuscaTipo === 'mesa') {
        const res = await api.getComandaPorMesa(fechamentoMesaId, activeEvento.id);
        cmd = res?.comanda;
      } else {
        cmd = await api.getComandaPorPulseira(fechamentoPulseiraQr.trim(), activeEvento.id);
      }

      if (!cmd || cmd.status !== 'aberta') {
        showFeedback('error', 'Nenhuma comanda aberta encontrada para esta mesa/pulseira.');
      } else {
        setComandaFechamento(cmd);
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao buscar comanda');
    } finally {
      setIsLoadingFechamento(false);
    }
  };

  const calcularTotalFinal = () => {
    if (!comandaFechamento) return 0;
    const consumo = Number(comandaFechamento.totalConsumo) || 0;
    if (tipoContribuicao === 'taxa_servico_10') {
      return Math.round(consumo * 1.10 * 100) / 100;
    }
    if (tipoContribuicao === 'gorjeta_livre') {
      return Math.round((consumo + (Number(valorGorjetaLivre) || 0)) * 100) / 100;
    }
    return Math.round(consumo * 100) / 100;
  };

  const calcularTrocoCentavos = () => {
    const total = calcularTotalFinal();
    const totalCentavos = Math.round(total * 100);
    const recebidoCentavos = Math.round((Number(valorRecebidoDinheiro) || 0) * 100);
    return recebidoCentavos - totalCentavos;
  };

  const handleEfetuarFechamento = async () => {
    if (!comandaFechamento) return;
    if (isProcessandoFechamento) return; // Prevent double click

    const total = calcularTotalFinal();

    if (metodoPagamento === 'dinheiro') {
      const trocoCentavos = calcularTrocoCentavos();
      if (!valorRecebidoDinheiro || trocoCentavos < 0) {
        showFeedback('error', `Valor recebido em dinheiro deve ser maior ou igual a R$ ${total.toFixed(2)}`);
        return;
      }
    }

    setIsProcessandoFechamento(true);
    try {
      const idempotencyKey = `close-${comandaFechamento.id}-${Date.now()}`;
      const payload: any = {
        metodo: metodoPagamento,
        tipoContribuicao,
        garcomId: currentUser?.id,
        idempotencyKey,
      };
      if (tipoContribuicao === 'gorjeta_livre') {
        payload.valorContribuicao = Number(valorGorjetaLivre) || 0;
      }
      if (metodoPagamento === 'dinheiro') {
        payload.valorRecebido = Number(valorRecebidoDinheiro);
      }
      if (metodoPagamento === 'cartao_credito' || metodoPagamento === 'cartao_debito') {
        if (bandeiraCartao.trim()) payload.bandeira = bandeiraCartao.trim();
        if (nsuCartao.trim()) payload.nsu = nsuCartao.trim();
      }

      const res = await api.fecharComandaEfetuarPagamento(comandaFechamento.id, payload);
      setFechamentoConcluido(res);
      const metodoLabel = metodoPagamento === 'dinheiro' ? 'DINHEIRO' : metodoPagamento === 'pix' ? 'PIX' : metodoPagamento === 'cartao_credito' ? 'CRÉDITO' : 'DÉBITO';
      showFeedback('success', `Comanda fechada com sucesso no ${metodoLabel}!`);

      // Refresh caixa status
      carregarStatusCaixa();

      // Automatically generate WhatsApp receipt link
      try {
        const wa = await api.gerarReciboWhatsApp(comandaFechamento.id);
        if (wa.sucesso && wa.linkGerado) {
          setLinkWhatsApp(wa.linkGerado);
        }
      } catch (e) {
        // ignore
      }

      // Refresh delivery queue & comanda state
      setComandaFechamento(null);
    } catch (err: any) {
      console.error('Erro no fechamento:', err);
      showFeedback('error', err.message || 'Falha ao processar pagamento');
    } finally {
      setIsProcessandoFechamento(false);
    }
  };

  const handleFecharCaixaGarcom = async () => {
    if (!statusCaixaGarcom?.caixa?.id) return;
    const declarado = Number(dinheiroDeclaradoInput);
    if (isNaN(declarado) || declarado < 0) {
      showFeedback('error', 'Informe um valor válido para o dinheiro declarado.');
      return;
    }
    setIsProcessandoCaixa(true);
    try {
      const res = await api.fecharCaixaGarcom(statusCaixaGarcom.caixa.id, declarado);
      showFeedback(
        'success',
        `Caixa fechado com sucesso! Declarado: R$ ${declarado.toFixed(2)} | Esperado: R$ ${Number(res.dinheiroEsperado).toFixed(2)} | Diferença: R$ ${Number(res.diferenca).toFixed(2)}`
      );
      setModalFecharCaixa(false);
      setDinheiroDeclaradoInput('');
      carregarStatusCaixa();
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao fechar caixa');
    } finally {
      setIsProcessandoCaixa(false);
    }
  };

  // =========================================================================
  // TAB 5: PERFIL (DESEMPENHO INDIVIDUAL DO GARÇOM)
  // =========================================================================
  const [perfilGarcom, setPerfilGarcom] = useState<any>(null);
  const [isLoadingPerfil, setIsLoadingPerfil] = useState(false);

  const loadPerfil = async () => {
    if (!currentUser?.id) return;
    setIsLoadingPerfil(true);
    try {
      const data = await api.getPerfilGarcom(currentUser.id, activeEvento?.id);
      setPerfilGarcom(data);
    } catch (err) {
      console.error('Erro ao carregar perfil do garçom:', err);
    } finally {
      setIsLoadingPerfil(false);
    }
  };

  useEffect(() => {
    loadPerfil();
  }, [currentUser, activeEvento]);

  useEffect(() => {
    if (activeTab === 'perfil') {
      loadPerfil();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center justify-start pb-24 font-['Inter',sans-serif] selection:bg-[#0D9488]/20">
      {/* Top Utility Header (Switch surface, quick table status) */}
      <div className="w-full bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] font-semibold transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Painel Gerente</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 font-bold text-[#0D9488]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] animate-pulse" />
            <span className="font-['Space_Grotesk'] text-sm tracking-tight uppercase">APP GARÇOM</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
            {currentUser?.nome?.split(' ')[0] || 'Garçom'}
          </span>
          <button
            onClick={() => setIsMobileSimulation(!isMobileSimulation)}
            className="flex items-center gap-1 text-[#64748B] hover:text-[#0F172A] font-medium py-1 px-2 rounded-md hover:bg-slate-100 cursor-pointer"
            title="Alternar moldura mobile"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="hidden sm:inline">{isMobileSimulation ? 'Tela Cheia' : 'Moldura'}</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Mobile Frame */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileSimulation
            ? 'max-w-[420px] my-3 shadow-2xl rounded-[32px] border border-[#E2E8F0] overflow-hidden bg-white min-h-[820px] flex flex-col'
            : 'max-w-2xl px-4 py-3 flex-1 flex flex-col'
        }`}
      >
        {/* Floating feedback toast */}
        {feedback && (
          <div
            className={`m-4 p-3.5 rounded-2xl border text-sm font-semibold flex items-center gap-2.5 shadow-lg animate-fadeIn z-50 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : feedback.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-teal-50 text-teal-900 border-teal-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#0D9488] shrink-0" />
            )}
            <span className="flex-1 text-xs">{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: CHECK-IN (CLIENTE & PULSEIRA) */}
        {/* ========================================================================= */}
        {activeTab === 'checkin' && (
          <div className="p-5 space-y-5 flex-1 flex flex-col">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider font-['Space_Grotesk']">
                  Recepção & Mesas
                </span>
              </div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#0F172A] mt-1">
                Check-in de Cliente
              </h1>
              <p className="text-sm text-[#64748B]">
                Busque pelo celular ou cadastre para vincular à pulseira física.
              </p>
            </div>

            {/* Step 1: Customer Phone Search */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wide block">
                1. Celular do Cliente
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={searchCelular}
                    onChange={(e) => setSearchCelular(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscarCliente()}
                    placeholder="Ex: 11988887777"
                    className="w-full pl-10 pr-3 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-base text-[#0F172A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSearchingCliente}
                  onClick={() => handleBuscarCliente()}
                  className="px-5 py-3.5 bg-[#0D9488] hover:bg-[#0F766E] active:scale-95 text-white font-bold text-sm rounded-2xl cursor-pointer flex items-center justify-center transition-all shadow-xs"
                >
                  {isSearchingCliente ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Recurring Customer Profile Display (Stars & Greeting) */}
            {foundCliente && (
              <div className="p-4 rounded-2xl bg-[#CCFBF1]/40 border border-teal-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                    <span className="text-xs font-bold text-[#0F766E] font-['Space_Grotesk'] uppercase tracking-wider">
                      Cliente Recorrente
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B] font-medium">
                    {fidelidadeData?.totalVisitas || 1} visitas
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold font-['Space_Grotesk'] text-[#0F172A]">
                    {saudacaoText || `${foundCliente.nome} de volta!`}
                  </h3>
                </div>

                {/* 2 FIDELITY STARS DISPLAY */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-200/60">
                  {/* Yellow Star (Ticket Médio: Baixo / Médio / Alto / VIP) */}
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center gap-2.5">
                    <Star
                      className={`w-6 h-6 shrink-0 ${
                        fidelidadeData?.nivelEstrelaAmarela === 'vip'
                          ? 'text-amber-500 fill-amber-400 animate-pulse'
                          : fidelidadeData?.nivelEstrelaAmarela === 'alto'
                          ? 'text-amber-500 fill-amber-300'
                          : fidelidadeData?.nivelEstrelaAmarela === 'medio'
                          ? 'text-amber-500 fill-amber-200'
                          : 'text-amber-400'
                      }`}
                    />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                        Estrela Amarela
                      </span>
                      <span className="text-xs font-bold text-[#0F172A] font-['Space_Grotesk']">
                        {fidelidadeData?.nivelEstrelaAmarela ? fidelidadeData.nivelEstrelaAmarela.toUpperCase() : 'BAIXO'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Ticket: R$ {Number(fidelidadeData?.ticketMedio || 0).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Blue Star (Ciclo de 3 visitas: vazada 1/3, transparente 2/3, sólida 3/3) */}
                  <div className="p-2.5 rounded-xl bg-white border border-sky-200 flex items-center gap-2.5">
                    <Star
                      className={`w-6 h-6 shrink-0 ${
                        fidelidadeData?.progressoCicloVisitas === 3
                          ? 'text-sky-500 fill-sky-400'
                          : fidelidadeData?.progressoCicloVisitas === 2
                          ? 'text-sky-500 fill-sky-200/60'
                          : 'text-sky-400'
                      }`}
                    />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider block">
                        Estrela Azul
                      </span>
                      <span className="text-xs font-bold text-[#0F172A] font-['Space_Grotesk']">
                        {fidelidadeData?.progressoCicloVisitas || 1}/3 do ciclo
                      </span>
                      {fidelidadeData?.cortesiasChopp?.disponiveis ? (
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          {fidelidadeData.cortesiasChopp.disponiveis} chopp liberado!
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 block">
                          {fidelidadeData?.visitasFaltantesParaChopp || 2} p/ chopp cortesia
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If New Client (Form Name + Phone, No CPF) */}
            {!foundCliente && searchCelular && !isSearchingCliente && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Novo Cadastro (Rápido em Campo — Sem CPF)
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Nome Completo do Cliente
                  </label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Carolina Mendes"
                    className="w-full px-3.5 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Celular (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={novoCelular}
                    onChange={(e) => setNovoCelular(e.target.value)}
                    placeholder="Ex: 11988887777"
                    className="w-full px-3.5 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Wristband QR & Table Association */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wide block">
                2. Pulseira Física & Mesa
              </label>

              <div className="relative">
                <QrCode className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={qrPulseira}
                  onChange={(e) => setQrPulseira(e.target.value)}
                  placeholder="Escanear ou digitar QR da Pulseira (Ex: PUL-042)"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-base font-mono font-bold text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
                  Mesa Opcional (se o cliente for sentar agora):
                </label>
                <select
                  value={selectedMesaIdCheckIn}
                  onChange={(e) => setSelectedMesaIdCheckIn(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
                >
                  <option value="">Sem mesa fixa (Balcão / Circulando)</option>
                  {mesas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.identificador} {m.status === 'ocupada' ? '• (Em uso)' : '• Livre'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Large Primary Action Button */}
            <div className="pt-2 mt-auto">
              <button
                type="button"
                disabled={isCheckingIn || !qrPulseira}
                onClick={handleConfirmarCheckIn}
                className="w-full min-h-[52px] py-4 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white font-bold font-['Space_Grotesk'] text-base rounded-2xl transition-all shadow-md shadow-teal-900/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCheckingIn ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Vinculando pulseira ao evento...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Check-in & Pulseira</span>
                  </>
                )}
              </button>
            </div>

            {/* Discrete link for lost wristband */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowPerdaModal(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline underline-offset-2 cursor-pointer transition-colors"
              >
                Pulseira perdida? Comunicar perda imediata
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PEDIDOS (CARDÁPIO RÁPIDO & ROTEAMENTO / VALIDAÇÃO DE AUTOATENDIMENTO) */}
        {/* ========================================================================= */}
        {activeTab === 'pedidos' && (
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            {/* Sub-Aba Toggle: Fazer Pedido vs Validar Autoatendimento */}
            <div className="grid grid-cols-2 gap-2 bg-slate-200 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setSubAbaPedidos('lancar')}
                className={`py-2 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
                  subAbaPedidos === 'lancar'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Lançar Pedido
              </button>
              <button
                type="button"
                onClick={() => setSubAbaPedidos('validar_mesa')}
                className={`py-2 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  subAbaPedidos === 'validar_mesa'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>Validar Mesa</span>
                {pedidosValidacao.length > 0 && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      subAbaPedidos === 'validar_mesa'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-amber-500 text-slate-950 animate-pulse'
                    }`}
                  >
                    {pedidosValidacao.length}
                  </span>
                )}
              </button>
            </div>

            {subAbaPedidos === 'validar_mesa' ? (
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[#0F172A]">
                      Validação de Autoatendimento
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      Confirme os pedidos enviados pelos clientes nas mesas antes do preparo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={carregarPedidosValidacao}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingValidacao ? 'animate-spin text-[#0D9488]' : ''}`} />
                  </button>
                </div>

                {pedidosValidacao.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <h3 className="font-bold font-['Space_Grotesk'] text-base text-[#0F172A]">
                      Nenhum pedido pendente
                    </h3>
                    <p className="text-xs text-[#64748B] max-w-xs">
                      Todos os pedidos de autoatendimento das mesas já foram validados ou não há novos pedidos no momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pedidosValidacao.map((p) => {
                      const isVerificado = Boolean(p.telefoneVerificado);
                      const isConfPresencial = Boolean(confirmadosPresencialMap[p.pedidoId]);
                      const isProcessing = isProcessandoValidacao === p.pedidoId;

                      return (
                        <div
                          key={p.pedidoId}
                          className="p-4 rounded-2xl border-2 border-slate-200 bg-white space-y-3 shadow-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold font-['Space_Grotesk'] text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg">
                                  {p.mesaIdentificador || 'Mesa'}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(p.criadoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="text-xs text-slate-600 font-mono mt-1 block">
                                Telefone: {p.telefoneCliente ? p.telefoneCliente.slice(0, 4) + '****' + p.telefoneCliente.slice(-4) : 'Não informado'}
                              </span>
                            </div>

                            {isVerificado ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Verificado ({p.verificacaoMetodo?.toUpperCase() || 'SMS'})</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Código não recebido</span>
                              </span>
                            )}
                          </div>

                          {/* Itens do pedido */}
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block font-['Space_Grotesk']">
                              Itens para o Bar / Cozinha:
                            </span>
                            {p.itens?.map((it: any) => (
                              <div key={it.id} className="flex items-center justify-between text-xs text-slate-900">
                                <span className="font-semibold">{it.quantidade}x {it.itemNome}</span>
                                <span className="text-slate-500 text-[11px]">{it.pontoNome}</span>
                              </div>
                            ))}
                          </div>

                          {/* Regra de validação presencial para telefones não verificados */}
                          {!isVerificado && (
                            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                              <div className="flex items-start gap-2 text-xs text-amber-900 font-medium">
                                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                <span>
                                  O cliente não informou o código por SMS/WhatsApp. É obrigatório confirmar o telefone presencialmente na mesa antes de liberar.
                                </span>
                              </div>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-amber-300 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isConfPresencial}
                                  onChange={(e) =>
                                    setConfirmadosPresencialMap((prev) => ({
                                      ...prev,
                                      [p.pedidoId]: e.target.checked,
                                    }))
                                  }
                                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                />
                                <span>Telefone confirmado presencialmente</span>
                              </label>
                            </div>
                          )}

                          {/* Botão de validar */}
                          <button
                            type="button"
                            disabled={(!isVerificado && !isConfPresencial) || isProcessing}
                            onClick={() => handleValidarPedidoGarcom(p)}
                            className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white font-bold font-['Space_Grotesk'] text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Validando...</span>
                              </>
                            ) : !isVerificado ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>
                                  {isConfPresencial
                                    ? 'Validar Pedido com Confirmação Presencial'
                                    : 'Confirme Presencialmente para Validar'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Validar Pedido (Telefone Verificado)</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Header with Destination (Mesa ou Pulseira) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider font-['Space_Grotesk']">
                      Lançamento Rápido
                    </span>
                    <span className="text-xs text-[#64748B] font-medium">
                      {cartCount} {cartCount === 1 ? 'item' : 'itens'} no carrinho
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#0F172A]">
                    Lançar Pedido
                  </h1>

              {/* Destination selector toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDestinoTipo('mesa')}
                  className={`py-2 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
                    destinoTipo === 'mesa' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Na Mesa
                </button>
                <button
                  type="button"
                  onClick={() => setDestinoTipo('pulseira')}
                  className={`py-2 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
                    destinoTipo === 'pulseira' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Na Pulseira
                </button>
              </div>

              {destinoTipo === 'mesa' ? (
                <select
                  value={targetMesaId}
                  onChange={(e) => setTargetMesaId(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
                >
                  {mesas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.identificador} {m.status === 'ocupada' ? '• (Em uso)' : '• Livre'}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={targetPulseiraQr}
                  onChange={(e) => setTargetPulseiraQr(e.target.value)}
                  placeholder="Digitar QR da Pulseira (Ex: PUL-042)"
                  className="w-full px-3.5 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-mono font-bold text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
                />
              )}
            </div>

            {/* Menu Search & Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Buscar chopp, drink, porção..."
                  className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
                <button
                  onClick={() => setCategoriaFiltro('todos')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer ${
                    categoriaFiltro === 'todos' ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-[#64748B]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setCategoriaFiltro('bebidas')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    categoriaFiltro === 'bebidas' ? 'bg-[#0D9488] text-white' : 'bg-slate-100 text-[#64748B]'
                  }`}
                >
                  <Wine className="w-3.5 h-3.5" />
                  <span>Copa / Bar</span>
                </button>
                <button
                  onClick={() => setCategoriaFiltro('comidas')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    categoriaFiltro === 'comidas' ? 'bg-[#0D9488] text-white' : 'bg-slate-100 text-[#64748B]'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Cozinha</span>
                </button>
              </div>
            </div>

            {/* Large Menu Cards List (Touch target min 48px, padding generous 16-20px) */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {isLoadingMenu ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#0D9488]" />
                  <span>Carregando itens...</span>
                </div>
              ) : filteredMenu.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum item encontrado no cardápio.
                </div>
              ) : (
                filteredMenu.map((item) => {
                  const cartItem = cart.find((ci) => ci.item.id === item.id);
                  const preco = Number(item.preco) || 0;
                  const imgSrc = getItemImage(item.nome);

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center gap-3.5 hover:border-teal-300 transition-all shadow-xs"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img src={imgSrc} alt={item.nome} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-[#0F172A] truncate leading-tight">
                          {item.nome}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold font-['Space_Grotesk'] text-sm text-[#0D9488]">
                            {preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-[11px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                            {item.pontoDePreparoNome || 'Bar/Cozinha'}
                          </span>
                        </div>
                      </div>

                      {/* +/- Quantity Buttons (Large touch area >= 48px) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cartItem ? (
                          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer text-sm"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold font-['Space_Grotesk'] text-base text-[#0F172A]">
                              {cartItem.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="w-9 h-9 rounded-lg bg-[#0D9488] text-white font-bold flex items-center justify-center hover:bg-[#0F766E] cursor-pointer text-sm"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="min-h-[48px] px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold font-['Space_Grotesk'] text-sm rounded-xl flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Pedir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Total & Send Order Action */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-xs text-[#64748B] block">
                      Total ({cartCount} {cartCount === 1 ? 'item' : 'itens'}):
                    </span>
                    <span className="text-xl font-bold font-['Space_Grotesk'] text-[#0D9488]">
                      {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isSubmittingPedido}
                  onClick={handleEnviarPedidoGarcom}
                  className="w-full min-h-[52px] py-4 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white font-bold font-['Space_Grotesk'] text-base rounded-2xl transition-all shadow-md shadow-teal-900/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingPedido ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Roteando para Copa & Cozinha...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Enviar Pedido ({cartCount} itens)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )}

        {/* ========================================================================= */}
        {/* TAB 3: FILA (FILA DE ENTREGA COM ALERTA VISUAL PULSANTE) */}
        {/* ========================================================================= */}
        {activeTab === 'fila' && (
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider font-['Space_Grotesk']">
                  Pronto para Retirada
                </span>
                <button
                  onClick={loadFilaEntrega}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#0F172A] mt-1 flex items-center gap-2">
                <span>Fila de Entrega</span>
                {filaEntrega.length > 0 && (
                  <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-bounce">
                    {filaEntrega.length}
                  </span>
                )}
              </h1>
              <p className="text-sm text-[#64748B]">
                Itens finalizados no KDS aguardando retirada. Toque em <strong>"Recebi"</strong> para confirmar.
              </p>

              {/* Indicador de meta configurada para o garçom */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>
                    Meta configurada: <strong>{perfilGarcom?.metaTempoResposta?.slice(3, 5) || '03'} min</strong> (alerta crítico vermelho se exceder)
                  </span>
                </span>
              </div>
            </div>

            {/* Ready items list (Pulsing alert until 'Recebi' is clicked) */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {filaEntrega.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  <h3 className="font-bold font-['Space_Grotesk'] text-base text-[#0F172A]">
                    Tudo Entregue!
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-xs">
                    Nenhum pedido aguardando retirada no momento. Assim que a Copa ou Cozinha aprontar um item, ele aparecerá aqui com alerta sonoro e visual.
                  </p>
                </div>
              ) : (
                filaEntrega.map((item) => {
                  const metaSegundos = item.metaSegundos || perfilGarcom?.metaSegundos || 180;
                  const metaMinutos = Math.floor(metaSegundos / 60);
                  const minutosPronto = Math.floor(item.segundosPronto / 60);
                  const segundosPronto = item.segundosPronto % 60;
                  // Limiar crítico alinhado com garcom_comissao.meta_tempo_resposta
                  const isAtrasado = item.segundosPronto >= metaSegundos;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 transition-all space-y-3 shadow-md ${
                        isAtrasado
                          ? 'bg-rose-50 border-rose-400 animate-pulse'
                          : 'bg-amber-50/70 border-amber-400'
                      }`}
                    >
                      {/* Top Line: #P Number + Timer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black font-['Space_Grotesk'] text-[#0F172A]">
                            {item.numeroExibicao}
                          </span>
                          <span className="text-xs font-bold font-['Space_Grotesk'] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 border border-amber-300">
                            {item.pontoNome || 'Bar/Cozinha'}
                          </span>
                        </div>

                        {/* Pulsing Alert Badge with Running Time and Dynamic Threshold */}
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isAtrasado
                              ? 'bg-rose-500 text-white animate-bounce shadow-xs'
                              : 'bg-amber-400 text-slate-950 animate-pulse'
                          }`}
                        >
                          {isAtrasado ? <AlertTriangle className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                          <span>
                            {isAtrasado
                              ? `Atrasado > ${metaMinutos}m (${minutosPronto}:${String(segundosPronto).padStart(2, '0')})`
                              : `Pronto há ${minutosPronto}:${String(segundosPronto).padStart(2, '0')} (Meta: ${metaMinutos}m)`}
                          </span>
                        </div>
                      </div>

                      {/* Destination: Table or Wristband & Customer */}
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <span className="bg-white border border-slate-300 px-2 py-0.5 rounded-lg text-slate-900 font-bold">
                          {item.mesaIdentificador || (item.pulseiraCodigoQr ? `Pulseira ${item.pulseiraCodigoQr}` : 'Balcão')}
                        </span>
                        <span>• {item.clienteNome}</span>
                      </div>

                      {/* Item description */}
                      <div className="text-lg font-bold text-[#0F172A] leading-tight">
                        {item.quantidade}x {item.itemNome}
                      </div>

                      {/* Large 'Recebi' Button (Min 48px height, tactile confirmation) */}
                      <button
                        type="button"
                        onClick={() => handleMarcarRecebido(item.id, item.itemNome)}
                        className="w-full min-h-[48px] py-3 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold font-['Space_Grotesk'] text-sm rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-900/10"
                      >
                        <Check className="w-5 h-5" />
                        <span>Recebi & Entregando à Mesa ✓</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FECHAMENTO & RATEIO */}
        {/* ========================================================================= */}
        {activeTab === 'fechamento' && (
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <div>
              <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider font-['Space_Grotesk']">
                Caixa Móvel
              </span>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#0F172A] mt-1">
                Fechamento de Conta
              </h1>
              <p className="text-sm text-[#64748B]">
                Localize a comanda, escolha a contribuição e forma de pagamento.
              </p>
            </div>

            {/* Search Comanda by Mesa or Pulseira */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFechamentoBuscaTipo('mesa')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    fechamentoBuscaTipo === 'mesa' ? 'bg-[#0F172A] text-white' : 'text-[#64748B]'
                  }`}
                >
                  Por Mesa
                </button>
                <button
                  type="button"
                  onClick={() => setFechamentoBuscaTipo('pulseira')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    fechamentoBuscaTipo === 'pulseira' ? 'bg-[#0F172A] text-white' : 'text-[#64748B]'
                  }`}
                >
                  Por Pulseira
                </button>
              </div>

              {fechamentoBuscaTipo === 'mesa' ? (
                <div className="flex gap-2">
                  <select
                    value={fechamentoMesaId}
                    onChange={(e) => setFechamentoMesaId(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A]"
                  >
                    {mesas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.identificador} {m.status === 'ocupada' ? '• (Em uso)' : '• Livre'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleBuscarComandaFechamento}
                    className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Buscar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fechamentoPulseiraQr}
                    onChange={(e) => setFechamentoPulseiraQr(e.target.value)}
                    placeholder="Digitar QR da Pulseira (Ex: PUL-042)"
                    className="flex-1 px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-mono font-bold text-[#0F172A]"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarComandaFechamento}
                    className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Buscar
                  </button>
                </div>
              )}
            </div>

            {/* Active Comanda Details */}
            {comandaFechamento && (
              <div className="space-y-4 animate-fadeIn flex-1 flex flex-col">
                {/* Total Consumo Card */}
                <div className="p-4 rounded-2xl bg-[#CCFBF1]/30 border border-teal-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-[#0F766E] tracking-wider block">
                      Consumo Produtos (Casa)
                    </span>
                    <span className="text-2xl font-black font-['Space_Grotesk'] text-[#0D9488]">
                      {Number(comandaFechamento.totalConsumo || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                  <div className="text-right text-xs text-[#64748B]">
                    <span className="block font-semibold text-[#0F172A]">
                      {comandaFechamento.clienteNome || 'Cliente'}
                    </span>
                    <span>{comandaFechamento.mesaIdentificador || comandaFechamento.pulseiraCodigoQr}</span>
                  </div>
                </div>

                {/* 3 Contribution Options (10% | Gorjeta Livre | Nenhuma) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wide block">
                    Contribuição de Serviço:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoContribuicao('taxa_servico_10')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        tipoContribuicao === 'taxa_servico_10'
                          ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Taxa 10%</span>
                      <span className="text-[10px] opacity-90">
                        + {(Number(comandaFechamento.totalConsumo) * 0.1).toFixed(2)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoContribuicao('gorjeta_livre')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        tipoContribuicao === 'gorjeta_livre'
                          ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Gorjeta Livre</span>
                      <span className="text-[10px] opacity-90">100% Garçom</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoContribuicao('nenhuma')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        tipoContribuicao === 'nenhuma'
                          ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Nenhuma</span>
                      <span className="text-[10px] opacity-90">R$ 0,00</span>
                    </button>
                  </div>

                  {tipoContribuicao === 'gorjeta_livre' && (
                    <div className="pt-1">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Valor da Gorjeta Livre (R$):
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={valorGorjetaLivre}
                        onChange={(e) => setValorGorjetaLivre(e.target.value)}
                        placeholder="Ex: 15.00"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-base font-bold text-[#0D9488]"
                      />
                    </div>
                  )}
                </div>

                {/* 4 Payment Methods (Pix | Débito | Crédito | Dinheiro) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wide block">
                    Forma de Pagamento (Registro Manual):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setMetodoPagamento('pix')}
                      className={`py-3 px-1 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        metodoPagamento === 'pix'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Pix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMetodoPagamento('cartao_debito')}
                      className={`py-3 px-1 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        metodoPagamento === 'cartao_debito'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Débito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMetodoPagamento('cartao_credito')}
                      className={`py-3 px-1 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        metodoPagamento === 'cartao_credito'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMetodoPagamento('dinheiro')}
                      className={`py-3 px-1 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        metodoPagamento === 'dinheiro'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Dinheiro</span>
                    </button>
                  </div>

                  {/* Dinheiro specifics: Valor Recebido & Troco */}
                  {metodoPagamento === 'dinheiro' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                        <span>PAGAMENTO EM DINHEIRO FÍSICO</span>
                        <span className="text-amber-800 font-mono">
                          Total: R$ {calcularTotalFinal().toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                          Valor Recebido do Cliente (R$):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={calcularTotalFinal()}
                          value={valorRecebidoDinheiro}
                          onChange={(e) => setValorRecebidoDinheiro(e.target.value)}
                          placeholder={`Mínimo: ${calcularTotalFinal().toFixed(2)}`}
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-base font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      {valorRecebidoDinheiro !== '' && (
                        <div
                          className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-between ${
                            calcularTrocoCentavos() >= 0
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-red-100 text-red-900 border border-red-300'
                          }`}
                        >
                          <span>
                            {calcularTrocoCentavos() >= 0
                              ? 'Troco a devolver:'
                              : 'Valor insuficiente:'}
                          </span>
                          <span className="text-sm font-black">
                            {calcularTrocoCentavos() >= 0
                              ? `R$ ${(calcularTrocoCentavos() / 100).toFixed(2)}`
                              : `Faltam R$ ${(Math.abs(calcularTrocoCentavos()) / 100).toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cartão specifics (Bandeira e NSU opcionais + Aviso PCI) */}
                  {(metodoPagamento === 'cartao_credito' || metodoPagamento === 'cartao_debito') && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cobre na maquininha física e registre os dados abaixo (opcionais):</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                            Bandeira (opcional)
                          </label>
                          <input
                            type="text"
                            value={bandeiraCartao}
                            onChange={(e) => setBandeiraCartao(e.target.value)}
                            placeholder="Visa, Master, Elo..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                            NSU / Comprovante (opcional)
                          </label>
                          <input
                            type="text"
                            value={nsuCartao}
                            onChange={(e) => setNsuCartao(e.target.value)}
                            placeholder="Ex: 987654"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        Segurança PCI: Nunca digitar ou armazenar número de cartão, validade ou código de segurança (CVV).
                      </p>
                    </div>
                  )}

                  {metodoPagamento === 'pix' && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                      <span>Confirmação manual: verifique o comprovante Pix apresentado pelo cliente antes de finalizar.</span>
                    </div>
                  )}
                </div>

                {/* Total Final Payable & Button */}
                <div className="pt-2 mt-auto space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">Total a Pagar:</span>
                    <span className="text-2xl font-black font-['Space_Grotesk'] text-[#0F172A]">
                      {calcularTotalFinal().toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={
                      isProcessandoFechamento ||
                      (metodoPagamento === 'dinheiro' && (!valorRecebidoDinheiro || calcularTrocoCentavos() < 0))
                    }
                    onClick={handleEfetuarFechamento}
                    className="w-full min-h-[52px] py-4 bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white font-bold font-['Space_Grotesk'] text-base rounded-2xl transition-all shadow-md shadow-emerald-900/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessandoFechamento ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Processando pagamento & fechamento...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirmar Pagamento & Fechar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Post-closing Receipt & WhatsApp Share */}
            {fechamentoConcluido && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 animate-fadeIn text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold font-['Space_Grotesk'] text-emerald-950">
                  Conta Encerrada com Sucesso!
                </h3>
                <p className="text-xs text-emerald-800">
                  Comanda fechada, rateios calculados e mesa liberada no sistema.
                </p>

                {linkWhatsApp && (
                  <div className="pt-2">
                    <a
                      href={linkWhatsApp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[48px] py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold font-['Space_Grotesk'] text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Enviar Recibo via WhatsApp (wa.me)</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PERFIL (DESEMPENHO INDIVIDUAL DO GARÇOM) */}
        {/* ========================================================================= */}
        {activeTab === 'perfil' && (
          <div className="p-5 space-y-5 flex-1 flex flex-col">
            <div>
              <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider font-['Space_Grotesk']">
                Seu Desempenho em Campo
              </span>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#0F172A] mt-1">
                Perfil do Garçom
              </h1>
              <p className="text-sm text-[#64748B]">
                Métricas individuais no evento ativo. Sem comparação ou ranking externo.
              </p>
            </div>

            {/* Waiter Header Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#CCFBF1] text-[#0D9488] font-bold font-['Space_Grotesk'] text-xl flex items-center justify-center border border-teal-200">
                {currentUser?.nome ? currentUser.nome.slice(0, 2).toUpperCase() : 'GA'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg font-['Space_Grotesk'] text-[#0F172A]">
                  {currentUser?.nome || 'Garçom de Campo'}
                </h3>
                <span className="text-xs text-[#64748B] block">
                  Papel: Operação de Salão & Bar
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {currentUser?.celular || ''}
                </span>
              </div>
            </div>

            {/* Response Time Metric */}
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Tempo Médio de Resposta
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Do status "Pronto" até "Visto"
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black font-['Space_Grotesk'] text-[#0F172A]">
                  {perfilGarcom?.tempoRespostaMedio || '02:30'} min
                </span>

                {/* Target Status Indicator */}
                {perfilGarcom?.dentroDaMeta ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dentro da Meta (&lt; {perfilGarcom?.metaTempoResposta?.slice(3, 5) || '3'}m)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Atenção: Meta é {perfilGarcom?.metaTempoResposta?.slice(3, 5) || '3'}m</span>
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 text-xs text-[#64748B] flex items-center justify-between">
                <span>Itens avaliados no evento:</span>
                <strong className="text-[#0F172A]">{perfilGarcom?.totalItensAvaliados || 0} pedidos</strong>
              </div>
            </div>

            {/* Accumulated Commission & Tips in Event */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#CCFBF1]/40 to-white border border-teal-200 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider block font-['Space_Grotesk']">
                Sua Comissão Acumulada no Evento
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black font-['Space_Grotesk'] text-[#0D9488]">
                  {Number(perfilGarcom?.comissaoConsolidada || perfilGarcom?.comissaoAcumulada || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
                <span className="text-xs text-[#0F766E] font-semibold bg-[#CCFBF1] px-2.5 py-1 rounded-lg">
                  Consolidada
                </span>
              </div>
              {Number(perfilGarcom?.comissaoAConsolidar || 0) > 0 && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span>A consolidar (dinheiro pendente):</span>
                  <strong className="font-mono">
                    {Number(perfilGarcom.comissaoAConsolidar).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                </div>
              )}
              <p className="text-[11px] text-[#64748B] pt-1">
                Comissões em Pix e Cartão consolidam na hora. Comissões em dinheiro consolidam ao fechar o caixa do turno.
              </p>
            </div>

            {/* Caixa do Garçom & Dinheiro em Mãos */}
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    Caixa Individual do Garçom
                  </span>
                </div>
                {statusCaixaGarcom?.temCaixaAberto ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Aberto
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                    Fechado
                  </span>
                )}
              </div>

              {statusCaixaGarcom?.temCaixaAberto ? (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Fundo de Troco</span>
                      <strong className="text-[#0F172A] text-sm">
                        R$ {Number(statusCaixaGarcom.fundoInicial || 0).toFixed(2)}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Cobranças em Dinheiro</span>
                      <strong className="text-emerald-700 text-sm">
                        + R$ {Number(statusCaixaGarcom.somaCobrancasDinheiro || 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-900 block">Dinheiro Atual em Mãos:</span>
                      <span className="text-[10px] text-amber-700">Fundo + Cobranças - Sangrias</span>
                    </div>
                    <span className="text-xl font-black font-['Space_Grotesk'] text-amber-950">
                      R$ {Number(statusCaixaGarcom.dinheiroEmMaos || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Alerta de Sangria se exceder o limite */}
                  {statusCaixaGarcom.alertaSangria && (
                    <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Alerta: Limite em mãos excedido!</span>
                      </div>
                      <p className="text-[11px] text-red-800">
                        Você está com R$ {Number(statusCaixaGarcom.dinheiroEmMaos).toFixed(2)} em mãos, acima do limite permitido de R$ {Number(statusCaixaGarcom.limiteDinheiro).toFixed(2)}. Solicite uma sangria ao gerente.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setDinheiroDeclaradoInput('');
                      setModalFecharCaixa(true);
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Declarar Dinheiro & Fechar Caixa</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">
                  Nenhum caixa aberto no momento. O gerente registra a abertura com o fundo de troco inicial.
                </p>
              )}
            </div>

            {/* Modal Fechar Caixa */}
            {modalFecharCaixa && statusCaixaGarcom?.caixa && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#0F172A] font-['Space_Grotesk']">
                      Fechamento de Caixa do Garçom
                    </h3>
                    <button
                      type="button"
                      onClick={() => setModalFecharCaixa(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fundo inicial:</span>
                      <strong className="text-slate-800">R$ {Number(statusCaixaGarcom.fundoInicial).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cobranças em dinheiro:</span>
                      <strong className="text-emerald-700">+ R$ {Number(statusCaixaGarcom.somaCobrancasDinheiro).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sangrias realizadas:</span>
                      <strong className="text-red-700">- R$ {Number(statusCaixaGarcom.somaSangrias).toFixed(2)}</strong>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-sm">
                      <span className="text-slate-700">Esperado pelo sistema:</span>
                      <span className="text-slate-900 font-mono">
                        R$ {Number(statusCaixaGarcom.dinheiroEmMaos).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Dinheiro Físico Declarado (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={dinheiroDeclaradoInput}
                      onChange={(e) => setDinheiroDeclaradoInput(e.target.value)}
                      placeholder="Conte o dinheiro e digite o total..."
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {dinheiroDeclaradoInput !== '' && (
                    <div className="p-2.5 bg-slate-100 rounded-xl text-xs flex justify-between items-center font-bold">
                      <span>Diferença apurada:</span>
                      <span
                        className={`font-mono text-sm ${
                          Number(dinheiroDeclaradoInput) - statusCaixaGarcom.dinheiroEmMaos >= 0
                            ? 'text-emerald-700'
                            : 'text-red-700'
                        }`}
                      >
                        {Number(dinheiroDeclaradoInput) - statusCaixaGarcom.dinheiroEmMaos >= 0 ? '+' : ''}
                        R$ {(Number(dinheiroDeclaradoInput) - statusCaixaGarcom.dinheiroEmMaos).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setModalFecharCaixa(false)}
                      className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isProcessandoCaixa || dinheiroDeclaradoInput === ''}
                      onClick={handleFecharCaixaGarcom}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      {isProcessandoCaixa ? 'Fechando...' : 'Confirmar Fechamento'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tables Assigned */}
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  {perfilGarcom?.totalMesasAtribuidas || 0}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0F172A]">Mesas sob seus Cuidados</h4>
                  <span className="text-xs text-[#64748B]">Setor e praça ativa</span>
                </div>
              </div>
              <span className="text-xs text-[#0D9488] font-bold">Atribuídas</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FIXED BOTTOM NAVIGATION BAR (Thumb-zone — Min Height 48px per target) */}
        {/* ========================================================================= */}
        <nav className="mt-auto border-t border-[#E2E8F0] bg-white px-2 py-2 flex items-center justify-around shrink-0 select-none">
          {/* Tab 1: Check-in */}
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className={`min-h-[48px] flex-1 py-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'checkin'
                ? 'text-[#0D9488] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-[11px] font-['Space_Grotesk']">Check-in</span>
          </button>

          {/* Tab 2: Pedidos */}
          <button
            type="button"
            onClick={() => setActiveTab('pedidos')}
            className={`min-h-[48px] flex-1 py-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer relative ${
              activeTab === 'pedidos'
                ? 'text-[#0D9488] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[11px] font-['Space_Grotesk']">Pedidos</span>
            {pedidosValidacao.length > 0 ? (
              <span className="absolute top-1 right-3 px-1.5 min-w-[18px] h-[18px] bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {pedidosValidacao.length}
              </span>
            ) : cartCount > 0 ? (
              <span className="absolute top-1 right-3 w-4 h-4 bg-[#0D9488] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            ) : null}
          </button>

          {/* Tab 3: Fila (With Pulsing Badge Counter visible across all tabs) */}
          <button
            type="button"
            onClick={() => setActiveTab('fila')}
            className={`min-h-[48px] flex-1 py-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer relative ${
              activeTab === 'fila'
                ? 'text-[#0D9488] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <div className="relative">
              <Clock className="w-5 h-5" />
              {filaEntrega.length > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1.5 min-w-[18px] h-[18px] bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
                  {filaEntrega.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-['Space_Grotesk']">Fila</span>
          </button>

          {/* Tab 4: Fechamento */}
          <button
            type="button"
            onClick={() => setActiveTab('fechamento')}
            className={`min-h-[48px] flex-1 py-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'fechamento'
                ? 'text-[#0D9488] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[11px] font-['Space_Grotesk']">Fechamento</span>
          </button>

          {/* Tab 5: Perfil */}
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`min-h-[48px] flex-1 py-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'perfil'
                ? 'text-[#0D9488] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-['Space_Grotesk']">Perfil</span>
          </button>
        </nav>
      </div>


      {/* ========================================================================= */}
      {/* MODAL: PULSEIRA PERDIDA (30 MIN TOLERÂNCIA) */}
      {/* ========================================================================= */}
      {/* MODAL: COMUNICAR PULSEIRA PERDIDA (BUSCA POR CELULAR & TOLERÂNCIA 30 MIN) */}
      {/* ========================================================================= */}
      <ComunicarPulseiraPerdidaModal
        isOpen={showPerdaModal}
        onClose={() => setShowPerdaModal(false)}
        activeEvento={activeEvento}
        currentEstabelecimento={currentEstabelecimento}
        onSuccess={() => {
          showFeedback('success', 'Perda registrada! Tolerância de 30 minutos iniciada no servidor.');
        }}
      />
    </div>
  );
};
