import { relations } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
  interval,
  primaryKey,
  unique,
  index,
  uniqueIndex,
  boolean,
} from 'drizzle-orm/pg-core';

// Enums exactly as defined in saasbar-modelo-dados.md
export const papelUsuarioEnum = pgEnum('papel_usuario', [
  'garcom',
  'gerente',
  'operador_balcao',
]);

export const tipoAtendimentoEnum = pgEnum('tipo_atendimento', [
  'pulseira',
  'mesa',
]);

export const statusComandaEnum = pgEnum('status_comanda', [
  'aberta',
  'fechada',
]);

export const statusVinculoEnum = pgEnum('status_vinculo', [
  'ativo',
  'encerrado',
  'invalidado_perda',
]);

export const statusPedidoItemEnum = pgEnum('status_pedido_item', [
  'pendente',
  'em_preparo',
  'pronto',
  'visto',
  'entregue',
]);

export const origemPedidoEnum = pgEnum('origem_pedido', [
  'garcom',
  'autoatendimento',
  'operador_balcao',
]);

export const metodoPagamentoEnum = pgEnum('metodo_pagamento', [
  'pix',
  'cartao_credito',
  'cartao_debito',
  'dinheiro',
]);

export const tipoContribuicaoEnum = pgEnum('tipo_contribuicao', [
  'taxa_servico_10',
  'gorjeta_livre',
  'nenhuma',
]);

export const modoRebalanceamentoEnum = pgEnum('modo_rebalanceamento', [
  'automatico',
  'manual',
]);

// 1. estabelecimento
export const estabelecimento = pgTable('estabelecimento', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: text('nome').notNull(),
  tipo: text('tipo').notNull().default('bar_casa_noturna'),
  config: jsonb('config').notNull().default({}),
  canalVerificacaoPadrao: text('canal_verificacao_padrao').notNull().default('sms'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

// 2. ponto_de_preparo
export const pontoDePreparo = pgTable('ponto_de_preparo', {
  id: uuid('id').defaultRandom().primaryKey(),
  estabelecimentoId: uuid('estabelecimento_id')
    .notNull()
    .references(() => estabelecimento.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
});

// 3. usuario
export const usuario = pgTable(
  'usuario',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    estabelecimentoId: uuid('estabelecimento_id')
      .notNull()
      .references(() => estabelecimento.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    papel: papelUsuarioEnum('papel').notNull(),
    celular: text('celular'),
    email: text('email'),
    senhaHash: text('senha_hash').notNull().default(''),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_usuario_estabelecimento_email').on(table.estabelecimentoId, table.email),
    uniqueIndex('idx_usuario_estabelecimento_celular').on(table.estabelecimentoId, table.celular),
  ]
);

// 4. mesa
export const mesa = pgTable(
  'mesa',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    estabelecimentoId: uuid('estabelecimento_id')
      .notNull()
      .references(() => estabelecimento.id, { onDelete: 'cascade' }),
    identificador: text('identificador').notNull(),
    qrCode: text('qr_code').notNull().unique(),
    status: text('status').notNull().default('livre'),
  },
  (table) => [
    index('idx_mesa_estabelecimento_status').on(table.estabelecimentoId, table.status),
  ]
);

// 5. garcom_area
export const garcomArea = pgTable(
  'garcom_area',
  {
    garcomId: uuid('garcom_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'cascade' }),
    mesaId: uuid('mesa_id')
      .notNull()
      .references(() => mesa.id, { onDelete: 'cascade' }),
    atribuidoEm: timestamp('atribuido_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.garcomId, table.mesaId] }),
  ]
);

// 6. pulseira
export const pulseira = pgTable('pulseira', {
  id: uuid('id').defaultRandom().primaryKey(),
  estabelecimentoId: uuid('estabelecimento_id')
    .notNull()
    .references(() => estabelecimento.id, { onDelete: 'cascade' }),
  codigoQr: text('codigo_qr').notNull().unique(),
});

// 7. cliente
export const cliente = pgTable(
  'cliente',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    estabelecimentoId: uuid('estabelecimento_id')
      .notNull()
      .references(() => estabelecimento.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    celular: text('celular').notNull(),
    email: text('email'),
    cortesiasUtilizadas: integer('cortesias_utilizadas').notNull().default(0),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_cliente_estabelecimento_celular').on(table.estabelecimentoId, table.celular),
  ]
);

// 8. evento
export const evento = pgTable('evento', {
  id: uuid('id').defaultRandom().primaryKey(),
  estabelecimentoId: uuid('estabelecimento_id')
    .notNull()
    .references(() => estabelecimento.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  dataInicio: timestamp('data_inicio', { withTimezone: true }).notNull(),
  dataFim: timestamp('data_fim', { withTimezone: true }),
  metaTempoRespostaPadrao: interval('meta_tempo_resposta_padrao'),
  modoRebalanceamento: modoRebalanceamentoEnum('modo_rebalanceamento')
    .notNull()
    .default('manual'),
  limiteDinheiroCaixa: numeric('limite_dinheiro_caixa', { precision: 10, scale: 2 })
    .default('500.00'),
  toleranciaConciliacao: numeric('tolerancia_conciliacao', { precision: 10, scale: 2 })
    .default('10.00'),
});

// 9. vinculo_pulseira_evento
export const vinculoPulseiraEvento = pgTable(
  'vinculo_pulseira_evento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pulseiraId: uuid('pulseira_id')
      .notNull()
      .references(() => pulseira.id),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id),
    eventoId: uuid('evento_id')
      .notNull()
      .references(() => evento.id),
    mesaId: uuid('mesa_id').references(() => mesa.id),
    inicio: timestamp('inicio', { withTimezone: true }).notNull().defaultNow(),
    fim: timestamp('fim', { withTimezone: true }),
    status: statusVinculoEnum('status').notNull().default('ativo'),
  },
  (table) => [
    index('idx_vinculo_pulseira_status').on(table.pulseiraId, table.status),
  ]
);

// 10. comanda
export const comanda = pgTable(
  'comanda',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventoId: uuid('evento_id')
      .notNull()
      .references(() => evento.id),
    tipoAtendimento: tipoAtendimentoEnum('tipo_atendimento').notNull(),
    vinculoPulseiraEventoId: uuid('vinculo_pulseira_evento_id').references(
      () => vinculoPulseiraEvento.id
    ),
    mesaId: uuid('mesa_id').references(() => mesa.id),
    garcomResponsavelId: uuid('garcom_responsavel_id').references(
      () => usuario.id
    ),
    status: statusComandaEnum('status').notNull().default('aberta'),
    telefoneCliente: text('telefone_cliente'),
    telefoneVerificado: boolean('telefone_verificado').notNull().default(false),
    verificacaoMetodo: text('verificacao_metodo'),
    verificadoEm: timestamp('verificado_em', { withTimezone: true }),
    abertaEm: timestamp('aberta_em', { withTimezone: true }).notNull().defaultNow(),
    fechadaEm: timestamp('fechada_em', { withTimezone: true }),
  },
  (table) => [
    index('idx_comanda_evento_status').on(table.eventoId, table.status),
  ]
);

// 11. item_cardapio
export const itemCardapio = pgTable('item_cardapio', {
  id: uuid('id').defaultRandom().primaryKey(),
  estabelecimentoId: uuid('estabelecimento_id')
    .notNull()
    .references(() => estabelecimento.id, { onDelete: 'cascade' }),
  pontoDePreparoId: uuid('ponto_de_preparo_id')
    .notNull()
    .references(() => pontoDePreparo.id),
  nome: text('nome').notNull(),
  preco: numeric('preco', { precision: 10, scale: 2 }).notNull(),
});

// 12. pedido
export const pedido = pgTable('pedido', {
  id: uuid('id').defaultRandom().primaryKey(),
  comandaId: uuid('comanda_id')
    .notNull()
    .references(() => comanda.id),
  origem: origemPedidoEnum('origem').notNull(),
  telefoneVerificado: boolean('telefone_verificado').notNull().default(false),
  confirmadoPresencialmente: boolean('confirmado_presencialmente').notNull().default(false),
  verificacaoMetodo: text('verificacao_metodo'),
  statusValidacao: text('status_validacao').notNull().default('pendente'),
  validadoPor: uuid('validado_por').references(() => usuario.id),
  validadoEm: timestamp('validado_em', { withTimezone: true }),
  motivoRecusa: text('motivo_recusa'),
  criadoPor: uuid('criado_por').references(() => usuario.id),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

// 13. pedido_item
export const pedidoItem = pgTable(
  'pedido_item',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pedidoId: uuid('pedido_id')
      .notNull()
      .references(() => pedido.id),
    itemCardapioId: uuid('item_cardapio_id')
      .notNull()
      .references(() => itemCardapio.id),
    pontoDePreparoId: uuid('ponto_de_preparo_id')
      .notNull()
      .references(() => pontoDePreparo.id),
    quantidade: integer('quantidade').notNull().default(1),
    numeroExibicao: text('numero_exibicao').notNull(),
    status: statusPedidoItemEnum('status').notNull().default('pendente'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
    prontoEm: timestamp('pronto_em', { withTimezone: true }),
    vistoEm: timestamp('visto_em', { withTimezone: true }),
    entregueEm: timestamp('entregue_em', { withTimezone: true }),
  },
  (table) => [
    index('idx_pedido_item_ponto_status').on(table.pontoDePreparoId, table.status),
    index('idx_pedido_item_pedido_id').on(table.pedidoId),
  ]
);

// 14. pagamento
export const pagamento = pgTable(
  'pagamento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    comandaId: uuid('comanda_id')
      .notNull()
      .references(() => comanda.id),
    metodo: metodoPagamentoEnum('metodo').notNull(),
    valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
    tipoContribuicao: tipoContribuicaoEnum('tipo_contribuicao')
      .notNull()
      .default('nenhuma'),
    valorContribuicao: numeric('valor_contribuicao', { precision: 10, scale: 2 }),
    status: text('status').notNull().default('pendente'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_pagamento_comanda_id').on(table.comandaId),
  ]
);

// 15. rateio_taxa_servico
export const rateioTaxaServico = pgTable('rateio_taxa_servico', {
  id: uuid('id').defaultRandom().primaryKey(),
  pedidoItemId: uuid('pedido_item_id')
    .notNull()
    .references(() => pedidoItem.id),
  pontoDePreparoId: uuid('ponto_de_preparo_id')
    .notNull()
    .references(() => pontoDePreparo.id),
  garcomId: uuid('garcom_id')
    .notNull()
    .references(() => usuario.id),
  valorGarcom: numeric('valor_garcom', { precision: 10, scale: 2 }).notNull(),
  valorPontoPreparo: numeric('valor_ponto_preparo', {
    precision: 10,
    scale: 2,
  }).notNull(),
});

// 16. multa_pulseira_perdida
export const multaPulseiraPerdida = pgTable('multa_pulseira_perdida', {
  id: uuid('id').defaultRandom().primaryKey(),
  vinculoPulseiraEventoId: uuid('vinculo_pulseira_evento_id')
    .notNull()
    .references(() => vinculoPulseiraEvento.id),
  comunicadoEm: timestamp('comunicado_em', { withTimezone: true }).notNull().defaultNow(),
  prazoLimite: timestamp('prazo_limite', { withTimezone: true }).notNull(),
  valorAposPrazo: numeric('valor_apos_prazo', { precision: 10, scale: 2 }),
  multiplicador: numeric('multiplicador', { precision: 3, scale: 1 })
    .notNull()
    .default('5.0'),
});

// 17. recibo_envio
export const reciboEnvio = pgTable('recibo_envio', {
  id: uuid('id').defaultRandom().primaryKey(),
  comandaId: uuid('comanda_id')
    .notNull()
    .references(() => comanda.id),
  canal: text('canal').notNull().default('whatsapp'),
  linkGerado: text('link_gerado').notNull(),
  enviadoEm: timestamp('enviado_em', { withTimezone: true }),
});

// 18. garcom_comissao
export const garcomComissao = pgTable(
  'garcom_comissao',
  {
    garcomId: uuid('garcom_id')
      .notNull()
      .references(() => usuario.id),
    eventoId: uuid('evento_id')
      .notNull()
      .references(() => evento.id),
    metaTempoResposta: interval('meta_tempo_resposta').notNull(),
    comissaoBasePercentual: numeric('comissao_base_percentual', {
      precision: 5,
      scale: 2,
    }).notNull(),
    bonusPercentual: numeric('bonus_percentual', {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default('0'),
    tempoRespostaMedio: interval('tempo_resposta_medio'),
  },
  (table) => [
    primaryKey({ columns: [table.garcomId, table.eventoId] }),
  ]
);

// 19. cobranca
export const cobranca = pgTable(
  'cobranca',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    estabelecimentoId: uuid('estabelecimento_id')
      .notNull()
      .references(() => estabelecimento.id, { onDelete: 'cascade' }),
    eventoId: uuid('evento_id')
      .references(() => evento.id, { onDelete: 'cascade' }),
    comandaId: uuid('comanda_id')
      .notNull()
      .references(() => comanda.id, { onDelete: 'cascade' }),
    metodo: text('metodo').notNull(), // 'pix' | 'credito' | 'debito' | 'dinheiro'
    valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
    valorRecebido: numeric('valor_recebido', { precision: 10, scale: 2 }),
    troco: numeric('troco', { precision: 10, scale: 2 }),
    bandeira: text('bandeira'),
    nsu: text('nsu'),
    tipoContribuicao: tipoContribuicaoEnum('tipo_contribuicao')
      .notNull()
      .default('nenhuma'),
    valorContribuicao: numeric('valor_contribuicao', { precision: 10, scale: 2 }),
    status: text('status').notNull().default('aprovada'), // 'aprovada' | 'estornada'
    idempotencyKey: text('idempotency_key'),
    registradoPor: uuid('registrado_por').references(() => usuario.id),
    estornadoPor: uuid('estornado_por').references(() => usuario.id),
    estornadoEm: timestamp('estornado_em', { withTimezone: true }),
    motivoEstorno: text('motivo_estorno'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_cobranca_comanda_id').on(table.comandaId),
    index('idx_cobranca_estabelecimento_id').on(table.estabelecimentoId),
    index('idx_cobranca_evento_id').on(table.eventoId),
    index('idx_cobranca_idempotency').on(table.idempotencyKey),
  ]
);

// 20. caixa_garcom
export const caixaGarcom = pgTable(
  'caixa_garcom',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    estabelecimentoId: uuid('estabelecimento_id')
      .notNull()
      .references(() => estabelecimento.id, { onDelete: 'cascade' }),
    eventoId: uuid('evento_id')
      .notNull()
      .references(() => evento.id, { onDelete: 'cascade' }),
    garcomId: uuid('garcom_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'cascade' }),
    fundoTrocoInicial: numeric('fundo_troco_inicial', { precision: 10, scale: 2 })
      .notNull()
      .default('0.00'),
    abertoEm: timestamp('aberto_em', { withTimezone: true }).notNull().defaultNow(),
    abertoPor: uuid('aberto_por').references(() => usuario.id),
    fechadoEm: timestamp('fechado_em', { withTimezone: true }),
    dinheiroDeclarado: numeric('dinheiro_declarado', { precision: 10, scale: 2 }),
    dinheiroEsperado: numeric('dinheiro_esperado', { precision: 10, scale: 2 }),
    diferenca: numeric('diferenca', { precision: 10, scale: 2 }),
    status: text('status').notNull().default('aberto'), // 'aberto' | 'fechado'
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_caixa_garcom_evento').on(table.eventoId),
    index('idx_caixa_garcom_garcom').on(table.garcomId),
  ]
);

// 21. sangria_caixa
export const sangriaCaixa = pgTable(
  'sangria_caixa',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    estabelecimentoId: uuid('estabelecimento_id')
      .notNull()
      .references(() => estabelecimento.id, { onDelete: 'cascade' }),
    caixaId: uuid('caixa_id')
      .notNull()
      .references(() => caixaGarcom.id, { onDelete: 'cascade' }),
    valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
    registradaPor: uuid('registrada_por')
      .notNull()
      .references(() => usuario.id),
    registradaEm: timestamp('registrada_em', { withTimezone: true }).notNull().defaultNow(),
    motivo: text('motivo'),
  },
  (table) => [
    index('idx_sangria_caixa_caixa_id').on(table.caixaId),
  ]
);

// 22. telefone_verificacao
export const telefoneVerificacao = pgTable(
  'telefone_verificacao',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    estabelecimentoId: uuid('estabelecimento_id')
      .notNull()
      .references(() => estabelecimento.id, { onDelete: 'cascade' }),
    mesaId: uuid('mesa_id').references(() => mesa.id),
    comandaId: uuid('comanda_id').references(() => comanda.id),
    telefone: text('telefone').notNull(),
    codigoHash: text('codigo_hash').notNull(),
    salt: text('salt').notNull(),
    canal: text('canal').notNull().default('sms'), // 'sms' | 'whatsapp'
    status: text('status').notNull().default('pendente'), // 'pendente' | 'verificado' | 'bloqueado' | 'expirado'
    tentativas: integer('tentativas').notNull().default(0),
    expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
    verificadoEm: timestamp('verificado_em', { withTimezone: true }),
    ip: text('ip'),
  },
  (table) => [
    index('idx_tel_verif_est_tel').on(table.estabelecimentoId, table.telefone),
    index('idx_tel_verif_mesa').on(table.mesaId),
    index('idx_tel_verif_criado').on(table.criadoEm),
  ]
);

// Drizzle Relations
export const estabelecimentoRelations = relations(estabelecimento, ({ many }) => ({
  pontosDePreparo: many(pontoDePreparo),
  usuarios: many(usuario),
  mesas: many(mesa),
  pulseiras: many(pulseira),
  clientes: many(cliente),
  eventos: many(evento),
  itensCardapio: many(itemCardapio),
}));

export const pontoDePreparoRelations = relations(pontoDePreparo, ({ one, many }) => ({
  estabelecimento: one(estabelecimento, {
    fields: [pontoDePreparo.estabelecimentoId],
    references: [estabelecimento.id],
  }),
  itensCardapio: many(itemCardapio),
  pedidosItens: many(pedidoItem),
}));

export const usuarioRelations = relations(usuario, ({ one, many }) => ({
  estabelecimento: one(estabelecimento, {
    fields: [usuario.estabelecimentoId],
    references: [estabelecimento.id],
  }),
  garcomAreas: many(garcomArea),
  comandasResponsavel: many(comanda),
  comissoes: many(garcomComissao),
}));

export const mesaRelations = relations(mesa, ({ one, many }) => ({
  estabelecimento: one(estabelecimento, {
    fields: [mesa.estabelecimentoId],
    references: [estabelecimento.id],
  }),
  garcomAreas: many(garcomArea),
  vinculos: many(vinculoPulseiraEvento),
  comandas: many(comanda),
}));

export const pulseiraRelations = relations(pulseira, ({ one, many }) => ({
  estabelecimento: one(estabelecimento, {
    fields: [pulseira.estabelecimentoId],
    references: [estabelecimento.id],
  }),
  vinculos: many(vinculoPulseiraEvento),
}));

export const clienteRelations = relations(cliente, ({ one, many }) => ({
  estabelecimento: one(estabelecimento, {
    fields: [cliente.estabelecimentoId],
    references: [estabelecimento.id],
  }),
  vinculos: many(vinculoPulseiraEvento),
}));

export const itemCardapioRelations = relations(itemCardapio, ({ one, many }) => ({
  estabelecimento: one(estabelecimento, {
    fields: [itemCardapio.estabelecimentoId],
    references: [estabelecimento.id],
  }),
  pontoDePreparo: one(pontoDePreparo, {
    fields: [itemCardapio.pontoDePreparoId],
    references: [pontoDePreparo.id],
  }),
  pedidosItens: many(pedidoItem),
}));

export const cobrancaRelations = relations(cobranca, ({ one }) => ({
  comanda: one(comanda, {
    fields: [cobranca.comandaId],
    references: [comanda.id],
  }),
  estabelecimento: one(estabelecimento, {
    fields: [cobranca.estabelecimentoId],
    references: [estabelecimento.id],
  }),
  registradoPorUser: one(usuario, {
    fields: [cobranca.registradoPor],
    references: [usuario.id],
  }),
}));

export const caixaGarcomRelations = relations(caixaGarcom, ({ one, many }) => ({
  garcom: one(usuario, {
    fields: [caixaGarcom.garcomId],
    references: [usuario.id],
  }),
  evento: one(evento, {
    fields: [caixaGarcom.eventoId],
    references: [evento.id],
  }),
  sangrias: many(sangriaCaixa),
}));

export const sangriaCaixaRelations = relations(sangriaCaixa, ({ one }) => ({
  caixa: one(caixaGarcom, {
    fields: [sangriaCaixa.caixaId],
    references: [caixaGarcom.id],
  }),
  registradaPorUser: one(usuario, {
    fields: [sangriaCaixa.registradaPor],
    references: [usuario.id],
  }),
}));

export const telefoneVerificacaoRelations = relations(telefoneVerificacao, ({ one }) => ({
  estabelecimento: one(estabelecimento, {
    fields: [telefoneVerificacao.estabelecimentoId],
    references: [estabelecimento.id],
  }),
  mesa: one(mesa, {
    fields: [telefoneVerificacao.mesaId],
    references: [mesa.id],
  }),
  comanda: one(comanda, {
    fields: [telefoneVerificacao.comandaId],
    references: [comanda.id],
  }),
}));

