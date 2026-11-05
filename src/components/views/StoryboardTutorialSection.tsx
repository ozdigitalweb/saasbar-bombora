import React, { useState, useEffect } from 'react';
import {
  Clapperboard,
  Film,
  Play,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Smartphone,
  Tv,
  QrCode,
  Receipt,
  Users2,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Sparkle,
} from 'lucide-react';
import { EntityTab } from '../../types/index.ts';

export interface StoryboardScene {
  id: number;
  numberStr: string;
  title: string;
  subtitle: string;
  characters: string[];
  screenText: string;
  narration: string;
  visualComposition: string;
  stageName: string;
  durationEst: string;
  action: {
    label: string;
    icon: React.ElementType;
    badge: string;
    onExecute: () => void;
  };
  mockupType:
    | 'welcome'
    | 'setup'
    | 'checkin'
    | 'qr_scan'
    | 'cart'
    | 'routing'
    | 'kds_screen'
    | 'item_ready'
    | 'delivered'
    | 'fast_add'
    | 'security'
    | 'checkout_tip'
    | 'whatsapp_loyalty';
}

interface StoryboardTutorialSectionProps {
  onNavigateTab: (tab: EntityTab) => void;
  onOpenClienteMesa: () => void;
  onOpenKdsFisico: () => void;
  onOpenGarcomMobile: () => void;
  onOpenLancamentoRapido: () => void;
  onOpenCheckIn: () => void;
}

export const StoryboardTutorialSection: React.FC<StoryboardTutorialSectionProps> = ({
  onNavigateTab,
  onOpenClienteMesa,
  onOpenKdsFisico,
  onOpenGarcomMobile,
  onOpenLancamentoRapido,
  onOpenCheckIn,
}) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'player' | 'grid'>('player');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setHasSpeechSupport(true);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const scenes: StoryboardScene[] = [
    {
      id: 1,
      numberStr: 'Cena 01',
      title: 'A Chegada & A Filosofia SAASBAR',
      subtitle: 'Boas-vindas ao sistema ágil sem comandas de papel ou extravios',
      stageName: 'Recepção & Salão',
      characters: ['Ana (Cliente)', 'Hostess / Recepção'],
      durationEst: '15 seg',
      screenText: 'BEM-VINDO AO SAASBAR · O SISTEMA INTELIGENTE DE BARES E GASTROPUBS',
      narration:
        'Imagine um bar acolhedor onde não existem filas para pedir, pedidos extraviados ou comandas perdidas no caixa. Seja bem-vindo ao SAASBAR, a solução completa que integra salão, cozinha, bar e clientes em perfeita harmonia.',
      visualComposition:
        'Visão panorâmica do gastrobar à noite. A cliente Ana chega com os amigos ao salão. Na recepção, a atendente visualiza o mapa de mesas iluminado em tempo real no terminal do SAASBAR.',
      mockupType: 'welcome',
      action: {
        label: 'Ver Monitor de Comandas',
        icon: Receipt,
        badge: 'Salão',
        onExecute: () => onNavigateTab('monitor_comandas'),
      },
    },
    {
      id: 2,
      numberStr: 'Cena 02',
      title: 'Abertura de Turno & Configuração da Casa',
      subtitle: 'Gerente preparando praças de preparo, cardápio digital e metas de tempo',
      stageName: 'Retaguarda & Gestão',
      characters: ['Roberto (Gerente Geral)'],
      durationEst: '20 seg',
      screenText: 'ABERTURA DE TURNO · DEFINIÇÃO DE PRAÇAS & METAS DE SLA',
      narration:
        'Antes de abrir as portas da casa, o gerente Roberto inicia o turno no SAASBAR. Ele confere os estoques, revisa os preços no cardápio digital e define as metas de tempo de preparo para cada praça: Bar, Cozinha Quente e Salão.',
      visualComposition:
        'Painel gerencial exibindo as praças cadastradas (Copa/Bar e Cozinha), metas de SLA (< 5 minutos para bebidas e < 10 minutos para pratos quentes) e a ativação oficial do turno.',
      mockupType: 'setup',
      action: {
        label: 'Configurar Pontos de Preparo',
        icon: Layers,
        badge: 'Gerência',
        onExecute: () => onNavigateTab('pontos_preparo'),
      },
    },
    {
      id: 3,
      numberStr: 'Cena 03',
      title: 'Check-in na Mesa 04: Regra da Mesa Liberada',
      subtitle: 'Segurança operacional: a mesa só recebe pedidos após liberação explícita',
      stageName: 'Mesa 04 (Salão)',
      characters: ['Ana (Cliente)', 'Lucas (Garçom)'],
      durationEst: '25 seg',
      screenText: 'CHECK-IN SEGURO · MESA 04 LIBERADA PARA PEDIDOS',
      narration:
        'Ana e seus amigos escolhem a Mesa 04. O garçom Lucas se aproxima e, com dois toques no celular, abre a comanda da mesa. O status muda imediatamente de "Livre" para "Liberada". Essa trava de segurança impede que pedidos fraudulentos sejam feitos em mesas vazias.',
      visualComposition:
        'Lucas seleciona a Mesa 04 no App Mobile do Garçom. O indicador visual da mesa passa de cinza ("Livre") para verde vibrante ("Liberada"), autorizando o lançamento de pedidos e vinculando o atendimento.',
      mockupType: 'checkin',
      action: {
        label: 'Abrir App do Garçom (Check-in)',
        icon: Smartphone,
        badge: 'Operação',
        onExecute: onOpenGarcomMobile,
      },
    },
    {
      id: 4,
      numberStr: 'Cena 04',
      title: 'Autoatendimento na Mesa via QR Code',
      subtitle: 'Sem aplicativo para baixar: o cliente aponta a câmera e acessa o cardápio',
      stageName: 'Mesa 04 (Cliente)',
      characters: ['Ana (Cliente)'],
      durationEst: '20 seg',
      screenText: 'ZERO DOWNLOAD · CARDÁPIO INTERATIVO DIRETO NO NAVEGADOR',
      narration:
        'Ana aponta a câmera do seu celular para o QR Code fixado na Mesa 04. Sem baixar aplicativo da loja nem preencher formulários com CPF, o cardápio interativo do SAASBAR abre instantaneamente no navegador com fotos de alta qualidade e preços atualizados.',
      visualComposition:
        'Close-up na mão de Ana escaneando o QR Code da mesa de madeira. A tela do smartphone carrega a página do bar em frações de segundo, exibindo as categorias de Chopes Artesanais, Petiscos e Pratos.',
      mockupType: 'qr_scan',
      action: {
        label: 'Testar Autoatendimento na Mesa',
        icon: QrCode,
        badge: 'Experiência Cliente',
        onExecute: onOpenClienteMesa,
      },
    },
    {
      id: 5,
      numberStr: 'Cena 05',
      title: 'Validação Positiva & Carrinho Compartilhado',
      subtitle: 'Múltiplos amigos pedindo juntos na mesma comanda em tempo real',
      stageName: 'Mesa 04 (Comanda)',
      characters: ['Ana (Cliente)', 'Amigos da Mesa'],
      durationEst: '25 seg',
      screenText: 'MESA LIBERADA · CARRINHO COLETIVO EM TEMPO REAL',
      narration:
        'Como a mesa foi liberada no check-in, o botão de pedir está liberado. Ana escolhe 2 Chopes IPA e 1 Costela BBQ com observação "molho à parte". Seus amigos também abrem o cardápio em seus próprios celulares e acompanham o mesmo carrinho compartilhado.',
      visualComposition:
        'Interface do cliente destacando o banner verde "Mesa 04 · Aberta". O carrinho exibe 2 Chopes IPA (R$ 36,00) e 1 Costela BBQ (R$ 68,00). O valor total e itens acumulados são sincronizados entre todos na mesa.',
      mockupType: 'cart',
      action: {
        label: 'Abrir Tela do Cliente',
        icon: QrCode,
        badge: 'Cliente',
        onExecute: onOpenClienteMesa,
      },
    },
    {
      id: 6,
      numberStr: 'Cena 06',
      title: 'Envio do Pedido & Roteamento Inteligente Instantâneo',
      subtitle: 'Divisão automática entre Bar e Cozinha no exato milissegundo',
      stageName: 'Núcleo do Sistema',
      characters: ['Sistema SAASBAR', 'Ana'],
      durationEst: '20 seg',
      screenText: 'ROTEAMENTO INTELIGENTE · BAR E COZINHA SINCRONIZADOS',
      narration:
        'Ana clica em "Enviar Pedido". Em uma fração de segundo, o roteador inteligente do SAASBAR bifurca o pedido: os 2 Chopes IPA vão para a praça do Bar/Copa, e a Costela BBQ vai direto para a Cozinha Quente. Nenhum garçom precisa levar papel físico.',
      visualComposition:
        'Animação de dados em bifurcação: o pedido único da Mesa 04 se divide em dois feixes digitais — uma linha azul ruma para o Bar/Copa e uma linha laranja ruma para a Cozinha Quente.',
      mockupType: 'routing',
      action: {
        label: 'Ver Cardápio & Roteamento',
        icon: UtensilsCrossed,
        badge: 'Cardápio',
        onExecute: () => onNavigateTab('cardapio'),
      },
    },
    {
      id: 7,
      numberStr: 'Cena 07',
      title: 'Telão KDS em Operação: Cronômetro & Cores SLA',
      subtitle: 'Praça fixa sem poluição visual e gestão do tempo de preparo',
      stageName: 'Cozinha Quente & Bar',
      characters: ['Carlos (Chef de Cozinha)', 'Bartender'],
      durationEst: '30 seg',
      screenText: 'KDS DE PRAÇA FIXA · TEMPO REAL COM ALERTAS VERDE, ÂMBAR E VERMELHO',
      narration:
        'Na cozinha, o chef Carlos visualiza a Costela BBQ no KDS com cronômetro em contagem progressiva. As cores avisam a equipe: Verde para início (< 5min), Âmbar para atenção (5 a 10min) e Vermelho pulsante se aproximar do limite. A tela é fixa na praça e nunca mistura itens do bar.',
      visualComposition:
        'Telão KDS da Cozinha Quente com cards modernos de pedidos. O card da Mesa 04 exibe "1x Costela BBQ" com badge amarelo "Molho à parte" e cronômetro em 03:45 (verde normal).',
      mockupType: 'kds_screen',
      action: {
        label: 'Abrir Telão KDS Físico',
        icon: Tv,
        badge: 'Produção',
        onExecute: onOpenKdsFisico,
      },
    },
    {
      id: 8,
      numberStr: 'Cena 08',
      title: 'Prato Pronto & Notificação na Fila do Garçom',
      subtitle: 'Alerta vibratório imediato no smartphone de Lucas',
      stageName: 'Pass da Cozinha',
      characters: ['Carlos (Chef)', 'Lucas (Garçom)'],
      durationEst: '20 seg',
      screenText: 'ITEM PRONTO · ALERTA IMEDIATO NA FILA DE ENTREGA',
      narration:
        'Carlos finaliza a costela e toca em "Pronto" na tela touch do KDS. No mesmo instante, o smartphone do garçom Lucas vibra no bolso com a notificação: "Mesa 04: Costela BBQ pronta para retirada!". O cronômetro de resposta do salão é iniciado.',
      visualComposition:
        'Carlos dá o toque final na travessa e pressiona o botão "Pronto" no KDS. Na tela do celular de Lucas, a aba "Fila de Entrega" ganha um badge vermelho luminoso com aviso vibratório.',
      mockupType: 'item_ready',
      action: {
        label: 'Ver Fila de Entrega no App Garçom',
        icon: Smartphone,
        badge: 'Fila de Entrega',
        onExecute: onOpenGarcomMobile,
      },
    },
    {
      id: 9,
      numberStr: 'Cena 09',
      title: 'Retirada, Entrega na Mesa & Botão "Recebi"',
      subtitle: 'Agilidade no salão e medição do tempo médio de resposta',
      stageName: 'Mesa 04 & Salão',
      characters: ['Lucas (Garçom)', 'Ana (Cliente)'],
      durationEst: '20 seg',
      screenText: 'ENTREGA NA MESA · REGISTRO DO TEMPO DE RESPOSTA',
      narration:
        'Lucas retira o prato fumegante na boqueta da cozinha e entrega com um sorriso na Mesa 04 de Ana. Em seguida, clica em "Recebi" no seu aplicativo. O sistema computa que a entrega levou apenas 1 minuto e 15 segundos, registrando uma resposta exemplar.',
      visualComposition:
        'Lucas colocando a travessa de costela na mesa dos clientes. No celular, ele toca no botão verde "Recebi / Entregue". O cronômetro para e o indicador individual de velocidade é computado.',
      mockupType: 'delivered',
      action: {
        label: 'Acessar App do Garçom',
        icon: Smartphone,
        badge: 'App Mobile',
        onExecute: onOpenGarcomMobile,
      },
    },
    {
      id: 10,
      numberStr: 'Cena 10',
      title: 'Lançamento Rápido no Balcão & Pulseiras RFID',
      subtitle: 'Agilidade máxima para clientes que pedem diretamente no balcão',
      stageName: 'Balcão / Choperia',
      characters: ['Atendente do Balcão', 'Cliente Avulso'],
      durationEst: '20 seg',
      screenText: 'LANÇAMENTO RÁPIDO · CONSUMO NO BALCÃO EM 2 CLIQUES',
      narration:
        'No balcão, clientes avulsos ou portadores de pulseiras RFID pedem drinks rápidos. O operador usa a gaveta de Lançamento Rápido: digita o número da pulseira, clica no chopp e confirma em menos de três segundos, sem travar a fila do bar.',
      visualComposition:
        'Gaveta lateral de Lançamento Rápido sobreposta no sistema. Teclado numérico ágil, botões de toque com os 6 drinks mais vendidos e confirmação instantânea de lançamento.',
      mockupType: 'fast_add',
      action: {
        label: 'Simular Lançamento Rápido',
        icon: Zap,
        badge: 'Balcão',
        onExecute: onOpenLancamentoRapido,
      },
    },
    {
      id: 11,
      numberStr: 'Cena 11',
      title: 'Segurança Operacional: Tolerância de 30 min & Rebalanceamento',
      subtitle: 'Proteção contra perda de pulseira e distribuição científica de mesas',
      stageName: 'Caixa & Gestão',
      characters: ['Roberto (Gerente)', 'Cliente'],
      durationEst: '25 seg',
      screenText: 'BLINDAGEM OPERACIONAL · TOLERÂNCIA DE 30 MIN & REBALANCEAMENTO JUSTO',
      narration:
        'Imprevistos acontecem, mas o SAASBAR protege o negócio. Em caso de perda de pulseira, o sistema ativa imediatamente a tolerância de 30 minutos sem cobrança indevida. E se uma ala do salão lotar, o algoritmo de rebalanceamento redistribui mesas com base na agilidade de cada garçom.',
      visualComposition:
        'Tela dividida: à esquerda, o modal de "Bloqueio de Pulseira Perdida" com cronômetro de 30 minutos de tolerância. À direita, o painel do gerente sugerindo rebalanceamento inteligente de mesas por agilidade de resposta.',
      mockupType: 'security',
      action: {
        label: 'Ver Painel de Rebalanceamento',
        icon: Users2,
        badge: 'Equipe',
        onExecute: () => onNavigateTab('rebalanceamento_equipe'),
      },
    },
    {
      id: 12,
      numberStr: 'Cena 12',
      title: 'Fechamento de Conta, Divisão/Rateio & Gorjetas',
      subtitle: '10% de serviço ou gorjeta livre, divisão por amigo e transparência total',
      stageName: 'Mesa 04 (Caixa)',
      characters: ['Ana (Cliente)', 'Lucas (Garçom)'],
      durationEst: '25 seg',
      screenText: 'FECHAMENTO DESCOMPLICADO · RATEIO AUTOMÁTICO & GORJETA TRANSPARENTE',
      narration:
        'Ana pede a conta da Mesa 04. Lucas abre a aba de Fechamento: o sistema divide o valor igualmente entre os 3 amigos e aplica os 10% de serviço padrão — com opção de gorjeta livre digitada pelo cliente. O rateio de comissão é creditado automaticamente para a equipe.',
      visualComposition:
        'Tela de fechamento de conta com resumo detalhado. Seletor de serviço: [10% Padrão: R$ 10,40], [Gorjeta Livre], [Sem Taxa]. Divisão calculada: R$ 38,13 para cada um dos 3 pagantes nos botões PIX e Cartão.',
      mockupType: 'checkout_tip',
      action: {
        label: 'Ir para Fechamento & Rateio',
        icon: Receipt,
        badge: 'Financeiro',
        onExecute: () => onNavigateTab('fechamento_rateio'),
      },
    },
    {
      id: 13,
      numberStr: 'Cena 13',
      title: 'Recibo no WhatsApp sem Papel & Fidelidade (Chopp Cortesia!)',
      subtitle: 'Sustentabilidade ecológica, Estrela Azul e cliente encantado',
      stageName: 'Despedida & Fidelização',
      characters: ['Ana (Cliente VIP)', 'Lucas (Garçom)'],
      durationEst: '25 seg',
      screenText: 'RECIBO NO WHATSAPP · 3ª VISITA: ESTRELA AZUL & CHOPP CORTESIA!',
      narration:
        'Pagamento efetuado! Lucas clica em "Enviar Recibo por WhatsApp", gerando um link wa.me com o extrato detalhado sem gastar papel térmico. E o sistema comemora: é a 3ª visita de Ana! Ela conquista a Estrela Azul e 1 Chopp de Cortesia para voltar em breve.',
      visualComposition:
        'Smartphone de Ana recebendo mensagem formatada no WhatsApp com a conta detalhada. No sistema, modal celebrativo concede a Estrela Azul à Ana e gera o voucher do Chopp Cortesia com 1 clique.',
      mockupType: 'whatsapp_loyalty',
      action: {
        label: 'Ver Relatórios de Fidelidade',
        icon: Sparkles,
        badge: 'Fidelização',
        onExecute: () => onNavigateTab('relatorios_fidelidade'),
      },
    },
  ];

  const currentScene = scenes[activeSceneIndex];

  // Speech narration handler
  const handleToggleSpeak = () => {
    if (!hasSpeechSupport) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentScene.narration);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Change scene handler
  const handleSelectScene = (index: number) => {
    if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setActiveSceneIndex(index);
  };

  const handleNext = () => {
    if (activeSceneIndex < scenes.length - 1) {
      handleSelectScene(activeSceneIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeSceneIndex > 0) {
      handleSelectScene(activeSceneIndex - 1);
    }
  };

  // Render Schematic Visual Mockup per scene
  const renderVisualMockup = (type: StoryboardScene['mockupType']) => {
    switch (type) {
      case 'welcome':
        return (
          <div className="bg-slate-950 rounded-[12px] p-5 text-white border border-slate-800 shadow-inner space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">SAASBAR Salão Principal</span>
              </div>
              <span className="text-[11px] text-teal-400 font-mono">18 Mesas Ativas · 4 Livres</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                const isSelected = m === 4;
                const isOccupied = m % 3 === 0;
                return (
                  <div
                    key={m}
                    className={`p-2 rounded-[6px] text-center border transition-all ${
                      isSelected
                        ? 'bg-[#0D9488]/30 border-teal-400 text-teal-200 ring-2 ring-teal-400/50'
                        : isOccupied
                        ? 'bg-amber-950/40 border-amber-600/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold">Mesa</span>
                    <span className="block text-sm font-extrabold">{m < 10 ? `0${m}` : m}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Livre
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" /> Mesa 04 (Ana)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Em Atendimento
              </span>
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="bg-slate-900 rounded-[12px] p-4 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-teal-400 font-bold">Configuração de Praças & Metas</span>
              <span className="text-xs text-slate-400">Turno Noturno Ativo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-[8px] border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Bar & Choperia</span>
                  <span className="text-[10px] text-teal-300">Meta: &lt; 4 minutos</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Online
                </span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-[8px] border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Cozinha Quente / Parrilla</span>
                  <span className="text-[10px] text-amber-300">Meta: &lt; 10 minutos</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Online
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-[6px] bg-teal-950/40 border border-teal-800/50 text-[11px] text-teal-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Cardápio digital 100% sincronizado com roteamento automático por praça.</span>
            </div>
          </div>
        );

      case 'checkin':
        return (
          <div className="bg-white rounded-[12px] p-4 text-slate-900 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Smartphone className="w-4 h-4 text-[#0D9488]" />
                <span>App do Garçom · Mesa 04</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                Liberada
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-[8px] border border-emerald-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                04
              </div>
              <div className="min-w-0 flex-1">
                <strong className="text-xs text-emerald-950 block">Mesa 04 · Check-in Concluído</strong>
                <span className="text-[11px] text-emerald-800">
                  Atendimento iniciado por Lucas · QR Code e pedidos habilitados
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Regra de Proteção Ativa:</strong> Somente mesas com status{' '}
              <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono text-[10px]">
                'liberada'
              </code>{' '}
              ou{' '}
              <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono text-[10px]">
                'ocupada'
              </code>{' '}
              podem receber lançamentos de novos pedidos.
            </p>
          </div>
        );

      case 'qr_scan':
        return (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[12px] p-5 text-white border border-slate-700 shadow-md flex flex-col items-center text-center space-y-3">
            <div className="w-24 h-24 bg-white p-2 rounded-[12px] shadow-sm flex items-center justify-center">
              <QrCode className="w-20 h-20 text-slate-900" />
            </div>
            <div>
              <span className="text-[11px] text-amber-300 uppercase tracking-widest font-bold block">
                Mesa 04 · SAASBAR
              </span>
              <strong className="text-sm font-bold text-white block mt-0.5">
                Aponte a câmera para ver o cardápio
              </strong>
            </div>
            <div className="w-full bg-slate-800/80 rounded-[8px] p-2.5 text-[11px] text-slate-300 border border-slate-700">
              ⚡ Sem download na loja de apps · Abre direto no Safari / Chrome
            </div>
          </div>
        );

      case 'cart':
        return (
          <div className="bg-white rounded-[12px] p-4 text-slate-900 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Carrinho da Mesa 04 (Ana & Amigos)</span>
              <span className="text-xs font-bold text-[#0D9488]">R$ 104,00</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">2x Chopp IPA 500ml</span>
                  <span className="text-[10px] text-slate-500">Praça: Bar / Copa</span>
                </div>
                <span className="font-semibold text-slate-700">R$ 36,00</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">1x Costela BBQ Defumada</span>
                  <span className="text-[10px] text-amber-700 font-medium">Obs: Molho à parte</span>
                </div>
                <span className="font-semibold text-slate-700">R$ 68,00</span>
              </div>
            </div>
            <div className="p-2 bg-teal-50 border border-teal-200 rounded-[6px] text-[11px] text-teal-900 flex items-center justify-between">
              <span>Status: Mesa Liberada</span>
              <span className="font-bold text-[#0D9488]">Pronto para Enviar</span>
            </div>
          </div>
        );

      case 'routing':
        return (
          <div className="bg-slate-900 rounded-[12px] p-4 text-white border border-slate-800 space-y-4">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                Motor de Roteamento em Milissegundos
              </span>
              <span className="text-[11px] text-slate-400">1 Pedido Recebido → Dividido por Praça</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[8px] bg-blue-950/60 border border-blue-600/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-300 block">Praça 1: Copa / Bar</span>
                <strong className="text-xs text-white block">2x Chopp IPA 500ml</strong>
                <span className="text-[10px] text-blue-200">Enviado para Telão KDS Bar</span>
              </div>
              <div className="p-3 rounded-[8px] bg-amber-950/60 border border-amber-600/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Praça 2: Cozinha</span>
                <strong className="text-xs text-white block">1x Costela BBQ</strong>
                <span className="text-[10px] text-amber-200">Enviado para Telão KDS Cozinha</span>
              </div>
            </div>
            <div className="text-center text-[11px] text-slate-400">
              ✓ Sem impressoras térmicas barulhentas · Zero erro humano de triagem
            </div>
          </div>
        );

      case 'kds_screen':
        return (
          <div className="bg-slate-950 rounded-[12px] p-4 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">KDS Cozinha Quente (Praça Fixa)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                03:45 (Verde)
              </span>
            </div>
            <div className="p-3 rounded-[8px] bg-slate-900 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-teal-300">MESA 04 · Pedido #148</span>
                <span className="text-[10px] text-slate-400">Origem: Autoatendimento</span>
              </div>
              <div className="text-sm font-bold text-white">1x Costela BBQ Defumada</div>
              <div className="px-2 py-1 rounded bg-amber-900/40 text-amber-300 border border-amber-700/50 text-[10px] font-semibold">
                ⚠️ Obs: Molho à parte
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded hover:bg-emerald-500 transition-colors pointer-events-none"
                >
                  ✓ Marcar Pronto
                </button>
              </div>
            </div>
          </div>
        );

      case 'item_ready':
        return (
          <div className="bg-slate-900 rounded-[12px] p-4 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <strong className="text-xs text-white">Notificação no Smartphone do Garçom</strong>
              </div>
              <span className="text-[11px] text-teal-400">Lucas (Garçom)</span>
            </div>
            <div className="p-3 bg-red-950/40 border border-red-700/60 rounded-[8px] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-red-300">🔔 Prato Pronto para Retirada!</strong>
                <span className="text-[10px] font-mono text-red-200">Há 12 segundos</span>
              </div>
              <p className="text-xs text-slate-200 font-medium">Mesa 04: 1x Costela BBQ Defumada</p>
              <span className="text-[10px] text-slate-400 block">
                Local: Boqueta da Cozinha Quente · Meta de Retirada: 2 min
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Vibração ativa no bolso do garçom</span>
              <span className="text-teal-300 font-semibold">Aba Fila de Entrega (1)</span>
            </div>
          </div>
        );

      case 'delivered':
        return (
          <div className="bg-white rounded-[12px] p-4 text-slate-900 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">App do Garçom · Fila de Entrega</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Tempo: 01:15
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-[8px] flex items-center justify-between">
              <div>
                <strong className="text-xs text-slate-900 block">Mesa 04 · Costela BBQ</strong>
                <span className="text-[10px] text-slate-500">Entregue na mesa de Ana</span>
              </div>
              <span className="px-3 py-1.5 rounded-[6px] bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Recebi!
              </span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Tempo de resposta registrado com louvor no perfil individual de Lucas.</span>
            </div>
          </div>
        );

      case 'fast_add':
        return (
          <div className="bg-slate-900 rounded-[12px] p-4 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="font-bold text-teal-400">Gaveta de Lançamento Rápido</span>
              <span className="text-[11px] text-slate-400">Balcão / Pulseira RFID</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="Comanda / Pulseira: #04"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-200 font-semibold hover:border-teal-400 transition-colors">
                🍺 Chopp Pilsen
              </div>
              <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-200 font-semibold hover:border-teal-400 transition-colors">
                🍸 Gin Tônica
              </div>
              <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-200 font-semibold hover:border-teal-400 transition-colors">
                💧 Água c/ Gás
              </div>
            </div>
            <div className="text-center text-[10px] text-teal-300">
              Toque no produto → Lançamento imediato em 2 segundos
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="bg-slate-950 rounded-[12px] p-4 text-white border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Proteção Contra Perda de Pulseira</span>
            </div>
            <div className="p-3 rounded-[8px] bg-amber-950/40 border border-amber-800/60 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                <span>Pulseira #082 Comunicada Perdida</span>
                <span className="font-mono text-amber-400">Tolerância: 30:00 min</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Bloqueio instantâneo para novos consumos. O cliente fica isento de qualquer gasto indevido após a comunicação.
              </p>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-[6px] text-[11px] text-slate-400 flex items-center justify-between">
              <span>Rebalanceamento de Garçons:</span>
              <span className="text-teal-300 font-semibold">Automático por SLA</span>
            </div>
          </div>
        );

      case 'checkout_tip':
        return (
          <div className="bg-white rounded-[12px] p-4 text-slate-900 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Fechamento Mesa 04 · Extrato</span>
              <span className="font-bold text-slate-700">Consumo: R$ 104,00</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 py-1 rounded bg-[#0D9488] text-white font-bold text-center text-xs"
                >
                  10% Padrão (R$ 10,40)
                </button>
                <button
                  type="button"
                  className="flex-1 py-1 rounded bg-slate-100 text-slate-700 font-medium text-center text-xs"
                >
                  Gorjeta Livre
                </button>
                <button
                  type="button"
                  className="py-1 px-2 rounded bg-slate-100 text-slate-500 text-xs"
                >
                  Sem Taxa
                </button>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-[6px] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-teal-950 block">Divisão em 3 amigos</span>
                  <span className="text-[10px] text-teal-700">Total com 10%: R$ 114,40</span>
                </div>
                <strong className="text-sm font-extrabold text-[#0D9488]">R$ 38,13 / cada</strong>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Meios: PIX · Cartão · Dinheiro</span>
              <span className="text-emerald-700 font-semibold">Rateio Justo</span>
            </div>
          </div>
        );

      case 'whatsapp_loyalty':
        return (
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 rounded-[12px] p-4 text-white border border-emerald-800/50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
              <span className="text-xs font-bold text-emerald-400">Recibo WhatsApp & Fidelidade VIP</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Ecológico · Sem Papel
              </span>
            </div>
            <div className="p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-[8px] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Parabéns, Ana! 3ª Visita Concluída!</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                ★ 1 Estrela Azul conquistada · Cupom liberado:{' '}
                <strong className="text-amber-300">1 Chopp Artesanal Cortesia</strong> na próxima visita!
              </p>
            </div>
            <div className="p-2 bg-slate-900/80 rounded border border-slate-700 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Recibo enviado no WhatsApp:</span>
              <span className="text-emerald-400 font-mono">wa.me/551199...</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Storyboard Header Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488] uppercase tracking-wider mb-1">
            <Clapperboard className="w-4 h-4" />
            <span>Roteiro Storyboard Oficial · 13 Cenas do Tutorial</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            A Jornada Completa do Atendimento no SAASBAR
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Acompanhe o passo a passo ilustrado desde a recepção de Ana até a entrega, fechamento e fidelidade.
          </p>
        </div>

        {/* View mode toggle & audio narrator */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {hasSpeechSupport && (
            <button
              onClick={handleToggleSpeak}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[8px] border transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Ouvir a locução desta cena"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Pausar Locução</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Ouvir Locução</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-[8px] border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('player')}
              className={`px-3 py-1 font-semibold rounded-[6px] transition-colors cursor-pointer ${
                viewMode === 'player'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Passo a Passo
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 font-semibold rounded-[6px] transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas as 13 Cenas
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Quick-jump Pills */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-3 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {scenes.map((scene, idx) => {
            const isCurrent = idx === activeSceneIndex;
            return (
              <button
                key={scene.id}
                onClick={() => handleSelectScene(idx)}
                className={`px-3 py-1.5 text-xs rounded-[8px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-[#0D9488] text-white shadow-xs font-bold ring-2 ring-[#0D9488]/30'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {scene.id}
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{scene.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode 1: Interactive Player */}
      {viewMode === 'player' && (
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] overflow-hidden shadow-xs">
          {/* Player Progress Top Bar */}
          <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-[6px] bg-teal-500/20 text-teal-300 font-mono text-xs font-bold border border-teal-500/30">
                {currentScene.numberStr} / 13
              </span>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {currentScene.stageName} · Duração estimada: {currentScene.durationEst}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {currentScene.title}
                </h3>
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={activeSceneIndex === 0}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-[8px] border transition-colors cursor-pointer ${
                  activeSceneIndex === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                onClick={handleNext}
                disabled={activeSceneIndex === scenes.length - 1}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-[8px] border transition-colors cursor-pointer ${
                  activeSceneIndex === scenes.length - 1
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                    : 'bg-[#0D9488] hover:bg-teal-600 text-white border-teal-600'
                }`}
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Player Content Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Visual Schematic Mockup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#0D9488]" />
                  Composição Visual & Tela Ilustrada da Cena
                </span>
                <span className="text-[11px]">Personagens: {currentScene.characters.join(', ')}</span>
              </div>
              {renderVisualMockup(currentScene.mockupType)}
              <p className="text-xs text-slate-500 italic px-1 pt-1">
                {currentScene.visualComposition}
              </p>
            </div>

            {/* On-screen Text (Lettering) */}
            <div className="p-4 rounded-[10px] bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                🏷️ Texto em Tela (Lettering / Destaque Visual)
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono tracking-tight">
                {currentScene.screenText}
              </p>
            </div>

            {/* Narration Block */}
            <div className="p-5 rounded-[12px] bg-teal-50/60 border border-teal-200/80 space-y-2 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-xs font-extrabold text-[#0F766E] uppercase tracking-wider">
                    🎙️ Locução & Roteiro Falado
                  </span>
                </div>
                {hasSpeechSupport && (
                  <button
                    onClick={handleToggleSpeak}
                    className="text-[11px] font-bold text-[#0D9488] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {isSpeaking ? 'Silenciar Áudio' : 'Ouvir Esta Cena'}
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                "{currentScene.narration}"
              </p>
            </div>

            {/* Action Deep-link Call to Action */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800 block">Praticar agora no sistema:</span>
                <span>Clique para abrir a tela correspondente a esta cena do roteiro.</span>
              </div>

              <button
                onClick={currentScene.action.onExecute}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold rounded-[8px] transition-all cursor-pointer shadow-xs hover:shadow"
              >
                <currentScene.action.icon className="w-4 h-4" />
                <span>{currentScene.action.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: All 13 Scenes Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scenes.map((scene, idx) => {
            const isCurrent = idx === activeSceneIndex;
            return (
              <div
                key={scene.id}
                className={`bg-white border rounded-[14px] p-5 flex flex-col justify-between transition-all hover:shadow-xs ${
                  isCurrent
                    ? 'border-[#0D9488] ring-2 ring-[#0D9488]/20 shadow-xs'
                    : 'border-[#E2E8F0]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                      {scene.numberStr}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{scene.stageName}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{scene.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{scene.subtitle}</p>
                  </div>

                  {/* Narration excerpt */}
                  <div className="p-3 bg-slate-50 rounded-[8px] border border-slate-100 text-[11px] text-slate-700 leading-relaxed italic line-clamp-3">
                    "{scene.narration}"
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      handleSelectScene(idx);
                      setViewMode('player');
                    }}
                    className="text-xs font-bold text-[#0D9488] hover:text-teal-700 cursor-pointer flex items-center gap-1"
                  >
                    <span>Ver Cena Completa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={scene.action.onExecute}
                    className="p-1.5 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title={scene.action.label}
                  >
                    <scene.action.icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
