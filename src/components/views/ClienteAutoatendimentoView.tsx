import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Wine,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  Sparkles,
  Info,
  ChevronRight,
  ArrowLeft,
  X,
  RefreshCw,
  QrCode,
  Smartphone,
  Sun,
  Flame,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Edit3,
  MessageSquare,
  Check,
  Phone,
} from 'lucide-react';
import { ItemCardapio, Mesa, Evento } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

// High-fidelity image assets generated for menu
import cocktailImg from '../../assets/images/menu_craft_cocktail_1790994179642.jpg';
import burgerImg from '../../assets/images/menu_artisan_burger_1790994200082.jpg';
import beerImg from '../../assets/images/menu_cold_draft_beer_1790994248258.jpg';
import tapasImg from '../../assets/images/menu_bar_tapas_platter_1790994258503.jpg';

interface ClienteAutoatendimentoViewProps {
  currentEstabelecimentoId: string;
  activeEvento: Evento | null;
  mesas: Mesa[];
  onBackToAdmin?: () => void;
}

interface CartItem {
  item: ItemCardapio;
  quantidade: number;
  observacoes?: string;
}

export const ClienteAutoatendimentoView: React.FC<ClienteAutoatendimentoViewProps> = ({
  currentEstabelecimentoId,
  activeEvento,
  mesas,
  onBackToAdmin,
}) => {
  // Active table selection (defaults to first available)
  const [selectedMesaId, setSelectedMesaId] = useState<string>(mesas[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'cardapio' | 'pedidos' | 'carrinho'>('cardapio');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');

  // Menu items & comanda data
  const [itensCardapio, setItensCardapio] = useState<ItemCardapio[]>([]);
  const [comandaMesa, setComandaMesa] = useState<any>(null);
  const [mesaLiberada, setMesaLiberada] = useState<boolean>(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isLoadingComanda, setIsLoadingComanda] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackNaoVerificado, setFeedbackNaoVerificado] = useState<string | null>(null);

  // Phone verification states
  const [telefoneInformado, setTelefoneInformado] = useState<string>('');
  const [telefoneInput, setTelefoneInput] = useState<string>('');
  const [erroTelefoneInput, setErroTelefoneInput] = useState<string | null>(null);
  const [sessaoMesaVerificada, setSessaoMesaVerificada] = useState<boolean>(false);
  const [verificacaoMetodoSessao, setVerificacaoMetodoSessao] = useState<string | null>(null);

  // Verification modal states
  const [isVerificacaoModalOpen, setIsVerificacaoModalOpen] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');
  const [isSolicitandoCodigo, setIsSolicitandoCodigo] = useState(false);
  const [isVerificandoCodigo, setIsVerificandoCodigo] = useState(false);
  const [canalEnvio, setCanalEnvio] = useState<'sms' | 'whatsapp'>('sms');
  const [segundosCooldown, setSegundosCooldown] = useState(0);
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);
  const [tentativasCodigo, setTentativasCodigo] = useState(0);
  const [clienteReconhecido, setClienteReconhecido] = useState<any>(null);

  // Custom observation modal for item
  const [selectedItemForObs, setSelectedItemForObs] = useState<ItemCardapio | null>(null);
  const [tempObsText, setTempObsText] = useState('');

  // Mobile frame simulator toggle for desktop preview
  const [isMobileSimulation, setIsMobileSimulation] = useState(true);

  const selectedMesa = mesas.find((m) => m.id === selectedMesaId) || mesas[0];

  // Helper formatting functions
  const formatarTelefone = (val: string) => {
    const digitos = val.replace(/\D/g, '').slice(0, 11);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  };

  const mascararTelefoneExibicao = (tel: string) => {
    const d = String(tel || '').replace(/\D/g, '');
    if (!d) return '***';
    if (d.length >= 10) {
      return `(${d.slice(0, 2)}) *****-${d.slice(-4)}`;
    }
    return tel;
  };

  // Cooldown countdown timer for resending code
  useEffect(() => {
    if (segundosCooldown <= 0) return;
    const timer = setInterval(() => {
      setSegundosCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [segundosCooldown]);

  // Check table session status (without leaking customer info)
  const verificarSessaoMesa = async (mesaId: string, evtId?: string) => {
    if (!mesaId || !evtId) return;
    try {
      const sessao = await api.getSessaoMesa(mesaId, evtId);
      if (sessao && sessao.telefoneVerificado) {
        setSessaoMesaVerificada(true);
        setVerificacaoMetodoSessao(sessao.verificacaoMetodo || 'sms');
      } else {
        setSessaoMesaVerificada(false);
        setVerificacaoMetodoSessao(null);
      }
    } catch (e) {
      console.warn('Erro ao consultar sessão da mesa:', e);
    }
  };

  // Helper to pick contextual photo for item
  const getItemImage = (nome: string) => {
    const n = nome.toLowerCase();
    if (n.includes('chopp') || n.includes('cerveja') || n.includes('beer')) return beerImg;
    if (n.includes('gin') || n.includes('drink') || n.includes('cocktail') || n.includes('caipirinha')) return cocktailImg;
    if (n.includes('burger') || n.includes('hamburguer') || n.includes('carne') || n.includes('sanduiche')) return burgerImg;
    return tapasImg;
  };

  // Load Menu
  const loadMenu = async () => {
    if (!currentEstabelecimentoId) return;
    setIsLoadingMenu(true);
    try {
      const data = await api.getItensCardapio(currentEstabelecimentoId);
      setItensCardapio(data);
    } catch (err) {
      console.error('Erro ao carregar cardápio:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Load Comanda & Placed Items for Table
  const loadComanda = async () => {
    if (!selectedMesaId || !activeEvento) return;
    setIsLoadingComanda(true);
    try {
      const res = await api.getComandaPorMesa(selectedMesaId, activeEvento.id);
      const isLib = !!res?.liberada && !!res?.comanda;
      setMesaLiberada(isLib);
      setComandaMesa(res?.comanda || null);
    } catch (err) {
      console.error('Erro ao carregar comanda da mesa:', err);
      setMesaLiberada(false);
      setComandaMesa(null);
    } finally {
      setIsLoadingComanda(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [currentEstabelecimentoId]);

  useEffect(() => {
    if (mesas.length > 0 && !selectedMesaId) {
      setSelectedMesaId(mesas[0].id);
    }
  }, [mesas]);

  useEffect(() => {
    loadComanda();
    verificarSessaoMesa(selectedMesaId, activeEvento?.id);
    const interval = setInterval(loadComanda, 5000);
    return () => clearInterval(interval);
  }, [selectedMesaId, activeEvento]);

  // Cart operations
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

  const cartTotal = cart.reduce(
    (acc, ci) => acc + (Number(ci.item.preco) || 0) * ci.quantidade,
    0
  );
  const cartItemCount = cart.reduce((acc, ci) => acc + ci.quantidade, 0);

  // Initial access to menu by informing phone
  const handleAcessarCardapio = async (e: React.FormEvent) => {
    e.preventDefault();
    const telDigits = telefoneInput.replace(/\D/g, '');
    if (telDigits.length < 10) {
      setErroTelefoneInput('Informe um número válido com DDD (mínimo 10 dígitos).');
      return;
    }
    setErroTelefoneInput(null);
    setTelefoneInformado(telDigits);
    await verificarSessaoMesa(selectedMesaId, activeEvento?.id);
  };

  // Dispara envio do código de verificação
  const dispararCodigoVerificacao = async () => {
    if (!telefoneInformado || !currentEstabelecimentoId) return;
    setIsSolicitandoCodigo(true);
    setErroCodigo(null);
    try {
      const res = await api.solicitarCodigoVerificacao({
        estabelecimentoId: currentEstabelecimentoId,
        mesaId: selectedMesaId,
        comandaId: comandaMesa?.id,
        telefone: telefoneInformado,
        canal: canalEnvio,
      });
      if (res.canal) setCanalEnvio(res.canal);
      setSegundosCooldown(res.segundosParaReenvio || 60);
    } catch (err: any) {
      setErroCodigo(err.message || 'Erro ao enviar código de verificação.');
    } finally {
      setIsSolicitandoCodigo(false);
    }
  };

  // Submit order handler: triggers verification if not yet verified for this table session
  const handleEnviarPedido = async () => {
    if (cart.length === 0 || !comandaMesa) return;

    // Regra: "uma vez por sessão da mesa"
    if (sessaoMesaVerificada) {
      await processarEnvioPedido({ telefoneVerificado: true });
      return;
    }

    // Código só é pedido ao tocar em 'Enviar pedido'
    setIsVerificacaoModalOpen(true);
    setCodigoInput('');
    setErroCodigo(null);
    setTentativasCodigo(0);
    await dispararCodigoVerificacao();
  };

  // Cliente confirma código de 6 dígitos
  const handleConfirmarCodigo = async () => {
    if (codigoInput.trim().length !== 6) {
      setErroCodigo('O código deve conter exatamente 6 dígitos.');
      return;
    }

    setIsVerificandoCodigo(true);
    setErroCodigo(null);
    try {
      const res = await api.verificarCodigoTelefone({
        estabelecimentoId: currentEstabelecimentoId,
        mesaId: selectedMesaId,
        comandaId: comandaMesa?.id,
        telefone: telefoneInformado,
        codigo: codigoInput.trim(),
      });

      // Sucesso na verificação!
      setSessaoMesaVerificada(true);
      setVerificacaoMetodoSessao(res.verificacaoMetodo || canalEnvio);
      if (res.cliente) {
        setClienteReconhecido(res.cliente);
      }
      setIsVerificacaoModalOpen(false);

      // Libera e envia o pedido
      await processarEnvioPedido({
        telefoneVerificado: true,
        verificacaoMetodo: res.verificacaoMetodo || canalEnvio,
      });

      setFeedbackSuccess(
        res.cliente
          ? `Bem-vindo, ${res.cliente.nome}! Pedido enviado para o Bar & Cozinha com telefone verificado.`
          : 'Telefone verificado com sucesso! Pedido enviado para preparo.'
      );
    } catch (err: any) {
      setTentativasCodigo((prev) => prev + 1);
      setErroCodigo(err.message || 'Código incorreto.');
    } finally {
      setIsVerificandoCodigo(false);
    }
  };

  // Regra: "Código que não chegou: o cliente toca em ‘Não recebi o código’ e o pedido é enviado marcado como ‘telefone não verificado’."
  const handleNaoRecebiCodigo = async () => {
    setIsVerificacaoModalOpen(false);
    await processarEnvioPedido({
      telefoneVerificado: false,
      codigoNaoRecebido: true,
    });
    setFeedbackNaoVerificado(
      'Pedido enviado! Como o código não foi confirmado por SMS/WhatsApp, o garçom confirmará seu telefone presencialmente na mesa antes de liberar para o preparo.'
    );
  };

  // Executa o envio do pedido ao backend
  const processarEnvioPedido = async (opts: {
    telefoneVerificado: boolean;
    codigoNaoRecebido?: boolean;
    verificacaoMetodo?: string;
  }) => {
    setIsSubmittingOrder(true);
    try {
      await api.lancamentoRapido({
        comandaId: comandaMesa.id,
        origem: 'autoatendimento',
        itens: cart.map((ci) => ({
          itemCardapioId: ci.item.id,
          quantidade: ci.quantidade,
        })),
        telefone: telefoneInformado,
        telefoneVerificado: opts.telefoneVerificado,
        codigoNaoRecebido: opts.codigoNaoRecebido,
      });

      setCart([]);
      setActiveTab('pedidos');
      await loadComanda();
      setTimeout(() => {
        setFeedbackSuccess(null);
        setFeedbackNaoVerificado(null);
      }, 7000);
    } catch (err: any) {
      console.error('Erro ao enviar pedido:', err);
      alert('Falha ao enviar pedido: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Filter menu items
  const filteredItems = itensCardapio.filter((item) => {
    const matchesSearch =
      item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pontoDePreparoNome || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategoria === 'todos') return true;
    if (selectedCategoria === 'bebidas') {
      const n = (item.pontoDePreparoNome || '').toLowerCase();
      return n.includes('copa') || n.includes('bar') || n.includes('chopeira');
    }
    if (selectedCategoria === 'comidas') {
      const n = (item.pontoDePreparoNome || '').toLowerCase();
      return n.includes('cozinha') || n.includes('lanche') || n.includes('prato');
    }
    return true;
  });

  // Extract all placed items from comanda pedidos
  const placedItems: any[] = [];
  if (comandaMesa?.pedidos) {
    for (const ped of comandaMesa.pedidos) {
      if (ped.itens) {
        for (const it of ped.itens) {
          placedItems.push({
            ...it,
            pedidoOrigem: ped.origem,
            pedidoCriadoEm: ped.criadoEm,
          });
        }
      }
    }
  }

  // Helper for Status Badge & Description
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return {
          label: 'Na Fila',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock,
          desc: 'Aguardando início do preparo',
        };
      case 'em_preparo':
        return {
          label: 'Em Preparo',
          color: 'bg-teal-100 text-teal-900 border-teal-300 animate-pulse',
          icon: ChefHat,
          desc: 'A equipe está preparando seu pedido',
        };
      case 'pronto':
        return {
          label: 'Pronto!',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          icon: Bell,
          desc: 'Pronto! O garçom está levando à mesa',
        };
      case 'entregue':
      case 'visto':
        return {
          label: 'Entregue',
          color: 'bg-stone-100 text-stone-700 border-stone-300',
          icon: CheckCircle2,
          desc: 'Entregue na sua mesa',
        };
      default:
        return {
          label: status,
          color: 'bg-stone-100 text-stone-600 border-stone-200',
          icon: Clock,
          desc: '',
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EE] text-[#1C1917] flex flex-col items-center justify-start pb-12 font-['Inter',sans-serif] selection:bg-[#0D9488]/20">
      {/* Top Utility Bar (Back to admin + Mesa Switcher + Simulator toggle) */}
      <div className="w-full bg-[#FFEFD9] border-b border-[#F2DEBF] px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="flex items-center gap-1.5 text-stone-700 hover:text-stone-900 font-medium transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-[#FCE3C3]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Painel Gerente</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-teal-800 font-medium">
            <QrCode className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="hidden sm:inline font-semibold">Autoatendimento:</span>
            <select
              value={selectedMesaId}
              onChange={(e) => setSelectedMesaId(e.target.value)}
              className="bg-white border border-[#E3CDAA] rounded px-2 py-0.5 text-stone-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#0D9488] cursor-pointer shadow-2xs"
            >
              {mesas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.identificador} {m.status === 'ocupada' ? '• (Em uso)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileSimulation(!isMobileSimulation)}
            className="flex items-center gap-1 text-stone-700 hover:text-stone-900 font-medium transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-[#FCE3C3]"
            title="Alternar entre modo smartphone e tela cheia"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="hidden sm:inline">
              {isMobileSimulation ? 'Tela Cheia' : 'Moldura Mobile'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileSimulation
            ? 'max-w-[420px] my-4 shadow-xl rounded-[32px] border border-[#ECD9BF] overflow-hidden bg-[#FFFDF9]'
            : 'max-w-2xl px-4 py-4'
        }`}
      >
        {/* App Header (Brand & Table Identification - Pool Party / Daytime Vibe) */}
        <header className="bg-gradient-to-b from-[#FFEFD9] to-[#FFFDF9] border-b border-[#F0DFCA] px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-['Space_Grotesk'] font-bold tracking-wider text-teal-800 uppercase bg-[#CCFBF1] px-2.5 py-0.5 rounded-full border border-teal-300">
                  {selectedMesa?.identificador || 'Mesa'}
                </span>
                <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pool Party & Bar</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-[#1C1917] tracking-tight mt-1 flex items-center gap-1.5">
                <span>Cardápio na Mesa</span>
                <Sparkles className="w-4 h-4 text-[#0D9488] inline" />
              </h1>
            </div>

            {/* Quick Live Tab Button */}
            <button
              onClick={() => setActiveTab('pedidos')}
              className="relative p-2.5 rounded-2xl bg-white border border-[#E9D9C3] text-stone-700 hover:text-teal-700 hover:border-teal-400 transition-colors cursor-pointer shadow-xs"
              title="Acompanhar meus pedidos"
            >
              <Clock className="w-4 h-4 text-[#0D9488]" />
              {placedItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0D9488] text-white font-bold font-['Space_Grotesk'] text-[10px] flex items-center justify-center shadow-md">
                  {placedItems.length}
                </span>
              )}
            </button>
          </div>

          {/* Feedback banner */}
          {feedbackSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-teal-50 border border-teal-300 text-teal-900 text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span className="font-medium">{feedbackSuccess}</span>
            </div>
          )}

          {/* Feedback telefone não verificado (enviado com código não chegado) */}
          {feedbackNaoVerificado && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2 shadow-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold font-['Space_Grotesk'] block text-amber-900">
                  Pedido Aguardando Confirmação Presencial
                </span>
                <p className="text-[11px] leading-relaxed text-amber-800">{feedbackNaoVerificado}</p>
              </div>
            </div>
          )}

          {/* Phone information pill in header */}
          {telefoneInformado && (
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#F0DFCA]/70 text-xs">
              <span className="text-stone-700 font-bold flex items-center gap-1.5 font-['Space_Grotesk']">
                <Phone className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>{mascararTelefoneExibicao(telefoneInformado)}</span>
              </span>
              {sessaoMesaVerificada ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>Verificado ({verificacaoMetodoSessao?.toUpperCase() || 'SMS'})</span>
                </span>
              ) : (
                <span className="text-[10px] font-medium text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                  Código ao enviar pedido
                </span>
              )}
              <button
                type="button"
                onClick={() => setTelefoneInformado('')}
                className="ml-auto text-[10px] text-teal-700 hover:text-teal-900 font-semibold underline cursor-pointer"
                title="Trocar número de telefone"
              >
                Alterar
              </button>
            </div>
          )}

          {/* Waiting for Waiter Liberation Banner (Test 10.1) */}
          {!mesaLiberada && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-['Space_Grotesk'] text-stone-900">
                  Mesa aguardando liberação pelo garçom
                </strong>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                  Cardápio em modo consulta. Para enviar pedidos, o garçom precisa abrir a comanda da mesa.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* STEP 1: PHONE GATE (Cliente informa telefone para ver cardápio) */}
        {!telefoneInformado ? (
          <div className="p-6 space-y-6">
            <div className="text-center space-y-2 pt-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-[#0D9488] shadow-sm">
                <Smartphone className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[#1C1917]">
                Acesse o Cardápio da Mesa
              </h2>
              <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                Informe seu WhatsApp ou celular para navegar pelas opções e realizar pedidos direto da sua mesa.
              </p>
            </div>

            <form onSubmit={handleAcessarCardapio} className="space-y-4 max-w-sm mx-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 font-['Space_Grotesk']">
                  Seu Celular ou WhatsApp:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={telefoneInput}
                    onChange={(e) => setTelefoneInput(formatarTelefone(e.target.value))}
                    placeholder="(11) 98888-0000"
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DCB8] rounded-xl text-sm font-bold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] shadow-xs"
                    autoFocus
                  />
                </div>
                {erroTelefoneInput && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{erroTelefoneInput}</span>
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-stone-700 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  O código de verificação só será solicitado ao tocar em <strong>"Confirmar e Enviar Pedido"</strong>, uma vez por sessão da mesa.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold font-['Space_Grotesk'] text-sm rounded-xl transition-all shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Ver Cardápio da Mesa</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Navigation Pill Bar */}
            <div className="px-5 pt-4 pb-2 flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('cardapio')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'cardapio'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'bg-[#FFEFD9] text-stone-700 hover:text-stone-900 hover:bg-[#FDE4C2]'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Cardápio</span>
              </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pedidos'
                ? 'bg-[#0D9488] text-white shadow-sm'
                : 'bg-[#FFEFD9] text-stone-700 hover:text-stone-900 hover:bg-[#FDE4C2]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Status dos Itens ({placedItems.length})</span>
          </button>

          {cart.length > 0 && (
            <button
              onClick={() => setActiveTab('carrinho')}
              className={`py-2 px-3 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'carrinho'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Carrinho ({cartItemCount})</span>
            </button>
          )}
        </div>

        {/* TAB 1: CARDÁPIO DIGITAL */}
        {activeTab === 'cardapio' && (
          <div className="p-5 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar bebidas, porções, drinks refrescantes..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9DCB8] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] shadow-2xs transition-colors"
              />
            </div>

            {/* Category Segmented Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
              <button
                onClick={() => setSelectedCategoria('todos')}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategoria === 'todos'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-[#FFEFD9] text-stone-700 hover:text-stone-900 hover:bg-[#FCE2C0]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedCategoria('bebidas')}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedCategoria === 'bebidas'
                    ? 'bg-[#0D9488] text-white font-bold shadow-2xs'
                    : 'bg-[#FFEFD9] text-stone-700 hover:text-stone-900 hover:bg-[#FCE2C0]'
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Bebidas & Bar</span>
              </button>
              <button
                onClick={() => setSelectedCategoria('comidas')}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedCategoria === 'comidas'
                    ? 'bg-[#0D9488] text-white font-bold shadow-2xs'
                    : 'bg-[#FFEFD9] text-stone-700 hover:text-stone-900 hover:bg-[#FCE2C0]'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Porções & Cozinha</span>
              </button>
            </div>

            {/* Product Cards List */}
            <div className="space-y-3">
              {isLoadingMenu ? (
                <div className="p-12 text-center text-stone-500 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#0D9488]" />
                  <span>Carregando cardápio...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-10 text-center text-stone-500 text-xs bg-white rounded-2xl border border-[#EDE2D2]">
                  Nenhum item encontrado no cardápio desta categoria.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const cartItem = cart.find((ci) => ci.item.id === item.id);
                  const preco = Number(item.preco) || 0;
                  const imgSrc = getItemImage(item.nome);

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-[#EFE5D6] hover:border-[#0D9488]/40 rounded-2xl p-3.5 flex gap-3 transition-all hover:shadow-sm"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 relative border border-stone-200">
                        <img
                          src={imgSrc}
                          alt={item.nome}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info & Actions */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-baseline justify-between gap-1">
                            <h3 className="font-bold font-['Space_Grotesk'] text-sm text-[#1C1917] leading-snug">
                              {item.nome}
                            </h3>
                            <span className="font-bold font-['Space_Grotesk'] text-sm text-[#0D9488] shrink-0">
                              {preco.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <span>Preparo:</span>
                            <span className="text-stone-700 font-medium">
                              {item.pontoDePreparoNome || 'Bar / Cozinha'}
                            </span>
                          </span>
                        </div>

                        {/* Quantity / Add Button */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F5EDE1]">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemForObs(item);
                              setTempObsText(cartItem?.observacoes || '');
                            }}
                            className="text-[11px] text-[#0D9488] hover:text-teal-800 font-medium underline underline-offset-2 cursor-pointer"
                          >
                            {cartItem?.observacoes ? 'Editar obs' : '+ Obs / Ponto'}
                          </button>

                          {cartItem ? (
                            <div className="flex items-center gap-2 bg-[#FFF8EE] rounded-lg p-1 border border-[#E9DEC8]">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 rounded bg-stone-200 text-stone-800 font-bold flex items-center justify-center hover:bg-stone-300 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold font-['Space_Grotesk'] text-xs text-stone-900 px-1">
                                {cartItem.quantidade}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-6 h-6 rounded bg-[#0D9488] text-white flex items-center justify-center hover:bg-teal-700 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3.5 py-1 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACOMPANHAMENTO DE STATUS POR ITEM */}
        {activeTab === 'pedidos' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#1C1917] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0D9488]" />
                  <span>Pedidos da Sua Mesa</span>
                </h2>
                <p className="text-[11px] text-stone-500">
                  Status atualizado em tempo real pelo Bar e Cozinha.
                </p>
              </div>

              <button
                onClick={loadComanda}
                className="p-1.5 rounded-lg bg-white border border-[#E8DEC8] text-stone-600 hover:text-stone-900 shadow-2xs"
                title="Atualizar agora"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingComanda ? 'animate-spin text-[#0D9488]' : ''}`}
                />
              </button>
            </div>

            {/* List of Ordered Items */}
            {placedItems.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-[#EDE2D2] text-stone-500 text-xs space-y-2">
                <UtensilsCrossed className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="font-semibold text-stone-700 font-['Space_Grotesk']">Nenhum pedido realizado ainda.</p>
                <p className="text-stone-500 text-[11px]">
                  Escolha suas bebidas e porções no cardápio e envie para preparo.
                </p>
                <button
                  onClick={() => setActiveTab('cardapio')}
                  className="mt-2 px-4 py-2 bg-[#0D9488] text-white rounded-xl font-bold text-xs inline-block cursor-pointer shadow-xs hover:bg-teal-700"
                >
                  Ver Cardápio
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {placedItems.map((it) => {
                  const statusInfo = getStatusBadge(it.status);
                  const StatusIcon = statusInfo.icon;
                  const preco = Number(it.itemPreco) || 0;
                  const subtotal = preco * it.quantidade;

                  return (
                    <div
                      key={it.id}
                      className="bg-white border border-[#EFE5D6] rounded-2xl p-4 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-['Space_Grotesk'] text-sm text-[#0D9488]">
                              {it.numeroExibicao}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              • {it.pontoNome || 'Bar/Cozinha'}
                            </span>
                          </div>
                          <h4 className="font-bold font-['Space_Grotesk'] text-sm text-stone-900 mt-0.5">
                            {it.quantidade}x {it.itemNome}
                          </h4>
                        </div>

                        <span className="font-bold font-['Space_Grotesk'] text-xs text-stone-800">
                          {subtotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>

                      {/* Live Status Tracker Pill & Description */}
                      <div className="pt-2 border-t border-[#F5EDE1] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{statusInfo.label}</span>
                          </span>
                          <span className="text-[11px] text-stone-500">
                            {statusInfo.desc}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Consumo Card */}
            {comandaMesa && (
              <div className="p-4 rounded-2xl bg-[#FFEFD9] border border-[#ECD9BF] flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] text-stone-600 uppercase tracking-wider block font-semibold">
                    Consumo Total da Mesa
                  </span>
                  <span className="text-xl font-bold font-['Space_Grotesk'] text-[#0D9488]">
                    {Number(comandaMesa.totalConsumo || 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                <span className="text-xs text-stone-600 font-medium">
                  {comandaMesa.totalItens || 0} itens consumidos
                </span>
              </div>
            )}

            {/* Informational Banner: NO CLOSING ACCOUNT ON MOBILE */}
            <div className="p-4 rounded-2xl bg-[#FFF8EE] border border-amber-300 text-stone-800 text-xs flex gap-3 items-start shadow-2xs">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-stone-900 block font-['Space_Grotesk']">
                  Como funciona o fechamento da conta?
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Para conferir e fechar sua conta com pagamento (Pix, Débito ou Crédito), solicite ao
                  garçom da mesa ou dirija-se ao caixa do estabelecimento. O autoatendimento no celular é
                  dedicado a realizar pedidos e acompanhar o preparo!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CARRINHO & REVISÃO DO PEDIDO */}
        {activeTab === 'carrinho' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E4D2] pb-3">
              <div>
                <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#1C1917] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#0D9488]" />
                  <span>Seu Pedido Pendente</span>
                </h2>
                <span className="text-[11px] text-stone-500">
                  Mesa {selectedMesa?.identificador}
                </span>
              </div>
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
              >
                Limpar carrinho
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="p-12 text-center text-stone-500 text-xs">
                Seu carrinho está vazio. Adicione itens no cardápio.
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((ci) => {
                  const preco = Number(ci.item.preco) || 0;
                  const subtotal = preco * ci.quantidade;

                  return (
                    <div
                      key={ci.item.id}
                      className="p-3.5 rounded-xl bg-white border border-[#EFE5D6] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex-1">
                        <span className="font-bold font-['Space_Grotesk'] text-xs text-stone-900 block">
                          {ci.item.nome}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {ci.item.pontoDePreparoNome || 'Bar/Cozinha'}
                        </span>
                        {ci.observacoes && (
                          <span className="text-[10px] text-amber-700 block italic mt-0.5">
                            Obs: "{ci.observacoes}"
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold font-['Space_Grotesk'] text-xs text-[#0D9488]">
                          {subtotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>

                        <div className="flex items-center gap-1 bg-[#FFF8EE] rounded p-1 border border-[#E9DEC8]">
                          <button
                            onClick={() => removeFromCart(ci.item.id)}
                            className="w-5 h-5 rounded bg-stone-200 text-stone-800 flex items-center justify-center text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold font-['Space_Grotesk'] text-xs text-stone-900 px-1">
                            {ci.quantidade}
                          </span>
                          <button
                            onClick={() => addToCart(ci.item)}
                            className="w-5 h-5 rounded bg-[#0D9488] text-white flex items-center justify-center text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Subtotal preview */}
                <div className="p-4 rounded-xl bg-[#FFEFD9] border border-[#ECD9BF] flex items-center justify-between">
                  <span className="text-xs text-stone-700 font-semibold">Total a Enviar:</span>
                  <span className="font-bold font-['Space_Grotesk'] text-lg text-[#0D9488]">
                    {cartTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  disabled={!mesaLiberada || isSubmittingOrder || cart.length === 0}
                  onClick={handleEnviarPedido}
                  className="w-full py-3.5 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white font-bold font-['Space_Grotesk'] text-sm rounded-xl transition-all shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {!mesaLiberada ? (
                    <span>🔒 Mesa Aguardando Liberação pelo Garçom</span>
                  ) : isSubmittingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando para Bar & Cozinha...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar e Enviar Pedido ({cartItemCount} itens)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sticky Bottom Cart Bar (visible when browsing menu with items in cart) */}
        {activeTab === 'cardapio' && cart.length > 0 && (
          <div className="p-4 border-t border-[#F0E4D2] bg-[#FFFDF9]/95 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg">
            <div>
              <span className="text-[11px] text-stone-500 block">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'} no carrinho
              </span>
              <span className="font-bold font-['Space_Grotesk'] text-base text-[#0D9488]">
                {cartTotal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <button
              onClick={() => setActiveTab('carrinho')}
              className="py-2.5 px-4 bg-[#0D9488] hover:bg-teal-700 text-white rounded-xl font-bold font-['Space_Grotesk'] text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm shadow-teal-800/20 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Pedido</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            </div>
          )}
        </>
      )}
    </div>

      {/* Observation Modal */}
      {selectedItemForObs && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9DEC8] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F0E4D2] pb-2">
              <h3 className="font-bold font-['Space_Grotesk'] text-sm text-stone-900">Observação para a Copa/Cozinha</h3>
              <button
                onClick={() => setSelectedItemForObs(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-xs text-[#0D9488] font-bold font-['Space_Grotesk'] block">
                {selectedItemForObs.nome}
              </span>
              <p className="text-[11px] text-stone-500 mt-1">
                Especifique o ponto da carne, gelo extra, limão espremido, etc.
              </p>
              <textarea
                value={tempObsText}
                onChange={(e) => setTempObsText(e.target.value)}
                placeholder="Ex: Gelo e limão, sem cebola..."
                rows={3}
                className="w-full mt-2 p-2.5 bg-[#FFF8EE] border border-[#E8DEC8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedItemForObs(null)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  addToCart(selectedItemForObs, tempObsText);
                  setSelectedItemForObs(null);
                }}
                className="flex-1 py-2 bg-[#0D9488] hover:bg-teal-700 text-white rounded-lg text-xs font-bold font-['Space_Grotesk']"
              >
                Salvar & Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Code Modal */}
      {isVerificacaoModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9DEC8] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#F0E4D2] pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg text-[#0D9488]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold font-['Space_Grotesk'] text-sm text-stone-900">
                  Confirmação do Telefone
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVerificacaoModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-stone-600 leading-relaxed">
                Enviamos um código de 6 dígitos via{' '}
                <strong className="text-teal-800 uppercase font-bold">
                  {canalEnvio}
                </strong>{' '}
                para o número:{' '}
                <strong className="text-stone-900">
                  {mascararTelefoneExibicao(telefoneInformado)}
                </strong>
              </p>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 font-['Space_Grotesk']">
                  Digite o código de 6 dígitos:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.3em] font-mono text-xl font-bold py-2.5 bg-[#FFF8EE] border border-[#E8DEC8] rounded-xl text-stone-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  autoFocus
                />
              </div>

              {erroCodigo && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{erroCodigo}</span>
                </div>
              )}

              <div className="text-[11px] text-stone-500 flex items-center justify-between">
                <span>Expira em 5 minutos</span>
                <span>Máx. 3 tentativas</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={codigoInput.length !== 6 || isVerificandoCodigo}
                onClick={handleConfirmarCodigo}
                className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-['Space_Grotesk'] flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-transform"
              >
                {isVerificandoCodigo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Código e Enviar Pedido</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={segundosCooldown > 0 || isSolicitandoCodigo}
                  onClick={dispararCodigoVerificacao}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer text-center"
                >
                  {segundosCooldown > 0
                    ? `Reenviar (${segundosCooldown}s)`
                    : 'Reenviar Código'}
                </button>

                <button
                  type="button"
                  onClick={handleNaoRecebiCodigo}
                  className="flex-1 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer text-center"
                  title="O pedido é enviado e o garçom confirma seu telefone presencialmente"
                >
                  Não recebi o código
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
