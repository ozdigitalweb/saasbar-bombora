export type PapelUsuario = 'garcom' | 'gerente' | 'operador_balcao';

export interface Estabelecimento {
  id: string;
  nome: string;
  tipo: string;
  config: {
    descricao?: string;
    tempoToleranciaPerdaMin?: number;
    multiplicadorPerda?: number;
    [key: string]: any;
  };
  canalVerificacaoPadrao?: 'sms' | 'whatsapp';
  criadoEm: string;
}

export interface CodigoSimuladoDebug {
  id: string;
  estabelecimentoId: string;
  estabelecimentoNome: string;
  telefone: string;
  telefoneMascarado: string;
  canal: 'sms' | 'whatsapp';
  codigo: string;
  mensagem: string;
  criadoEm: string | Date;
}

export interface PontoDePreparo {
  id: string;
  estabelecimentoId: string;
  nome: string;
}

export interface Usuario {
  id: string;
  estabelecimentoId: string;
  nome: string;
  papel: PapelUsuario;
  celular?: string | null;
  email?: string | null;
  senha?: string;
  senhaHash?: string;
  criadoEm: string;
}

export interface Mesa {
  id: string;
  estabelecimentoId: string;
  identificador: string;
  qrCode: string;
  status: 'livre' | 'liberada' | 'ocupada' | string;
}

export interface Pulseira {
  id: string;
  estabelecimentoId: string;
  codigoQr: string;
}

export interface Cliente {
  id: string;
  estabelecimentoId: string;
  nome: string;
  celular: string;
  email?: string | null;
  criadoEm: string;
  totalVisitas?: number;
  ticketMedio?: number;
}

export interface ItemCardapio {
  id: string;
  estabelecimentoId: string;
  pontoDePreparoId: string;
  nome: string;
  preco: string | number;
  pontoDePreparoNome?: string;
}

export interface Evento {
  id: string;
  estabelecimentoId: string;
  nome: string;
  dataInicio: string;
  dataFim?: string | null;
  metaTempoRespostaPadrao?: string | null;
  modoRebalanceamento: 'automatico' | 'manual';
}

export interface VinculoPulseiraEvento {
  id: string;
  pulseiraId: string;
  clienteId: string;
  eventoId: string;
  mesaId?: string | null;
  inicio: string;
  fim?: string | null;
  status: 'ativo' | 'encerrado' | 'invalidado_perda';
  clienteNome?: string;
  clienteCelular?: string;
  pulseiraCodigoQr?: string;
  mesaIdentificador?: string;
}

export interface PedidoItemDetail {
  id: string;
  pedidoId: string;
  itemCardapioId: string;
  pontoDePreparoId: string;
  quantidade: number;
  numeroExibicao: string;
  status: 'pendente' | 'em_preparo' | 'pronto' | 'visto' | 'entregue';
  criadoEm: string;
  prontoEm?: string | null;
  vistoEm?: string | null;
  entregueEm?: string | null;
  itemNome?: string;
  itemPreco?: string | number;
  pontoNome?: string;
}

export interface PedidoDetail {
  id: string;
  comandaId: string;
  origem: 'garcom' | 'autoatendimento' | 'operador_balcao';
  criadoPor?: string | null;
  criadoEm: string;
  criadoPorNome?: string;
  telefoneVerificado?: boolean;
  confirmadoPresencialmente?: boolean;
  verificacaoMetodo?: 'sms' | 'whatsapp' | 'presencial';
  statusValidacao?: 'pendente' | 'validado' | 'recusado';
  itens: PedidoItemDetail[];
}

export interface ComandaSummary {
  id: string;
  eventoId: string;
  tipoAtendimento: 'pulseira' | 'mesa';
  vinculoPulseiraEventoId?: string | null;
  mesaId?: string | null;
  garcomResponsavelId?: string | null;
  status: 'aberta' | 'fechada';
  abertaEm: string;
  fechadaEm?: string | null;
  clienteNome?: string;
  clienteCelular?: string;
  pulseiraCodigoQr?: string;
  mesaIdentificador?: string;
  garcomNome?: string;
  totalConsumo: number;
  totalItens: number;
  pedidos?: PedidoDetail[];
}

export type EntityTab =
  | 'monitor_comandas'
  | 'eventos'
  | 'kds_status'
  | 'fechamento_rateio'
  | 'rebalanceamento_equipe'
  | 'relatorios_fidelidade'
  | 'estabelecimento'
  | 'pontos_preparo'
  | 'cardapio'
  | 'mesas'
  | 'pulseiras'
  | 'usuarios'
  | 'clientes'
  | 'manual_ajuda';

export type MetodoPagamento = 'pix' | 'cartao_credito' | 'cartao_debito';
export type TipoContribuicao = 'taxa_servico_10' | 'gorjeta_livre' | 'nenhuma';

export interface PreviaFechamentoItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  subtotal: number;
  pontoId: string;
  pontoNome: string;
  tipo: 'bebida' | 'comida';
  taxaItem: number;
  rateioGarcom: number;
  rateioCopa: number;
  rateioCozinha: number;
}

export interface PreviaFechamento {
  comanda: ComandaSummary;
  itens: PreviaFechamentoItem[];
  totalConsumo: number;
  taxaServico10: number;
  rateio10Estimado: {
    garcom: number;
    copa: number;
    cozinha: number;
  };
}

export interface RelatorioRateios {
  totalFaturadoConsumo: number;
  totalTaxasGorjetas: number;
  totalGeral: number;
  metodoBreakdown: {
    pix: number;
    cartao_credito: number;
    cartao_debito: number;
  };
  rateioBeneficiarios: {
    totalGarcons: number;
    totalCopa: number;
    totalCozinha: number;
    garcons: Array<{
      id: string;
      nome: string;
      totalComissao: number;
    }>;
  };
  pagamentos: Array<{
    id: string;
    comandaId: string;
    metodo: MetodoPagamento;
    valorConsumo: string;
    tipoContribuicao: TipoContribuicao;
    valorContribuicao: string;
    criadoEm: string;
    clienteNome?: string;
    pulseiraCodigo?: string;
    mesaIdentificador?: string;
    garcomNome?: string;
    garcomId?: string;
    eventoNome?: string;
  }>;
}

export interface MultaPulseiraCalculo {
  multa: {
    id: string;
    vinculoPulseiraEventoId: string;
    comunicadoEm: string;
    prazoLimite: string;
    valorAposPrazo: string;
    multiplicador: string;
  };
  minutosDecorridos: number;
  toleranciaExcedida: boolean;
  prazoLimite: string;
  comunicadoEm: string;
  itensAntesPrazo: Array<{
    id: string;
    nome: string;
    preco: number;
    quantidade: number;
    subtotal: number;
    criadoEm: string;
    multiplicador: number;
    totalCobrado: number;
  }>;
  itensAposPrazo: Array<{
    id: string;
    nome: string;
    preco: number;
    quantidade: number;
    subtotal: number;
    criadoEm: string;
    multiplicador: number;
    totalCobrado: number;
    multaAdicional: number;
  }>;
  totalAntesPrazo1x: number;
  totalAposPrazo1x: number;
  totalAposPrazo5x: number;
  multaAdicionalTotal: number;
  totalFinalComanda: number;
}

export type NivelEstrelaAmarela = 'baixo' | 'medio' | 'alto' | 'vip';

export interface FidelidadeExtrato {
  cliente: Cliente;
  totalVisitas: number;
  ticketMedio: number;
  nivelEstrelaAmarela: NivelEstrelaAmarela;
  nivelEstrelaAmarelaLabel: string;
  estrelasAmarelas: number;
  estrelasAzuis: number;
  progressoCicloVisitas: number;
  visitasFaltantesParaChopp: number;
  totalGastoHistorico: number;
  cortesiasChopp: {
    totalAcumuladas: number;
    utilizadas: number;
    disponiveis: number;
  };
}

export interface GarcomEquipeCard {
  garcomId: string;
  nome: string;
  celular?: string;
  mesas: Array<{
    mesaId: string;
    identificador: string;
    status: string;
    comandasAtivas: number;
    atribuidoEm: string;
  }>;
  totalMesas: number;
  totalComandasAtivas: number;
  metaTempoResposta: string;
  comissaoBasePercentual: number;
  bonusPercentual: number;
  tempoRespostaMedio: string;
  tempoRespostaSegundos: number;
  totalItensAvaliados: number;
  atingiuMeta: boolean;
  statusCarga: 'sobrecarregado' | 'ideal' | 'ocioso';
}

export interface RebalanceamentoDados {
  garcons: GarcomEquipeCard[];
  todasMesas: Mesa[];
  criterio: string;
}

export interface PulseiraPerdidaBuscaItem {
  id: string;
  vinculoPulseiraEventoId: string;
  vinculoId: string;
  clienteId: string;
  nome: string;
  celular: string;
  pulseiraId: string;
  pulseiraCodigo: string;
  pulseiraCodigoCurto: string;
  mesaId: string | null;
  mesaArea: string;
  comandaId: string | null;
  consumoAcumulado: number;
  consumoFormatado: string;
  ultimoPedidoEm: string | null;
  tempoUltimoPedidoMin: number | null;
  tempoUltimoPedidoTexto: string;
  status: string;
  tolerancia: {
    iniciada: boolean;
    comunicadoEm: string | null;
    prazoLimite: string | null;
    minutosRestantes: number | null;
    toleranciaExcedida: boolean;
  };
}

export type MetodoCobranca = 'pix' | 'credito' | 'debito' | 'dinheiro';

export interface Cobranca {
  id: string;
  estabelecimentoId: string;
  eventoId?: string | null;
  comandaId: string;
  metodo: MetodoCobranca | string;
  valor: string | number;
  valorRecebido?: string | number | null;
  troco?: string | number | null;
  bandeira?: string | null;
  nsu?: string | null;
  tipoContribuicao: TipoContribuicao;
  valorContribuicao?: string | number | null;
  status: 'aprovada' | 'estornada';
  idempotencyKey?: string | null;
  registradoPor?: string | null;
  estornadoPor?: string | null;
  estornadoEm?: string | null;
  motivoEstorno?: string | null;
  criadoEm: string;
}

export interface CaixaGarcom {
  id: string;
  estabelecimentoId: string;
  eventoId: string;
  garcomId: string;
  fundoTrocoInicial: string | number;
  abertoEm: string;
  abertoPor?: string | null;
  fechadoEm?: string | null;
  dinheiroDeclarado?: string | number | null;
  dinheiroEsperado?: string | number | null;
  diferenca?: string | number | null;
  status: 'aberto' | 'fechado';
  criadoEm: string;
}

export interface SangriaCaixa {
  id: string;
  estabelecimentoId: string;
  caixaId: string;
  valor: string | number;
  registradaPor: string;
  registradaEm: string;
  motivo?: string | null;
}

export interface StatusCaixaGarcom {
  temCaixaAberto: boolean;
  caixa: CaixaGarcom | null;
  fundoInicial: number;
  somaCobrancasDinheiro: number;
  somaSangrias: number;
  dinheiroEmMaos: number;
  limiteDinheiro: number;
  alertaSangria: boolean;
  sangrias?: SangriaCaixa[];
}

export interface RelatorioConciliacao {
  eventoId: string;
  tolerancia: number;
  limiteDinheiroPadrao: number;
  totalGeralAprovado: number;
  resumoMetodos: {
    pix: { totalAprovado: number; quantidade: number };
    credito: {
      totalAprovado: number;
      quantidade: number;
      totalMaquininha: number;
      diferenca: number;
      nivelAlerta: 'ok' | 'alerta' | 'critico';
    };
    debito: {
      totalAprovado: number;
      quantidade: number;
      totalMaquininha: number;
      diferenca: number;
      nivelAlerta: 'ok' | 'alerta' | 'critico';
    };
    dinheiro: { totalAprovado: number; quantidade: number };
  };
  garcons: Array<{
    garcomId: string;
    nome: string;
    statusCaixa: 'aberto' | 'fechado' | 'sem_caixa';
    caixaId: string | null;
    fundoTrocoInicial: number;
    totalSangrias: number;
    dinheiroEmMaos: number;
    alertaSangria: boolean;
    limiteDinheiro: number;
    dinheiroEsperado: number | null;
    dinheiroDeclarado: number | null;
    diferencaCaixa: number | null;
    nivelAlertaCaixa: 'ok' | 'alerta' | 'critico';
    totaisPorMetodo: {
      dinheiro: number;
      credito: number;
      debito: number;
      pix: number;
      totalGeral: number;
    };
    comissao: {
      consolidada: number;
      aConsolidar: number;
      total: number;
    };
  }>;
}

