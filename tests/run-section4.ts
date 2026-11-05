import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/db/index.ts';
import {
  estabelecimento,
  pontoDePreparo,
  usuario,
  mesa,
  pulseira,
  cliente,
  itemCardapio,
  evento,
  vinculoPulseiraEvento,
  comanda,
  pedido,
  pedidoItem,
  pagamento,
  rateioTaxaServico,
} from '../src/db/schema.ts';
import {
  estabelecimentoService,
  pontoDePreparoService,
  usuarioService,
  mesaService,
  pulseiraService,
  clienteService,
  itemCardapioService,
  eventoService,
  vinculoPulseiraService,
  comandaService,
  pedidoService,
  fechamentoService,
} from '../src/server/db-services.ts';
import { eq } from 'drizzle-orm';

interface TestResult {
  id: string;
  name: string;
  expected: string;
  status: 'passou' | 'falhou';
  details: string;
}

const results: TestResult[] = [];

function record(id: string, name: string, expected: string, status: 'passou' | 'falhou', details: string) {
  results.push({ id, name, expected, status, details });
  const icon = status === 'passou' ? '✅' : '❌';
  console.log(`${icon} [${id}] ${name}: ${status.toUpperCase()}`);
  console.log(`   Esperado: ${expected}`);
  console.log(`   Obtido:   ${details}\n`);
}

async function runSection4Tests() {
  console.log('======================================================================');
  console.log('EXECUTANDO TESTES DA SEÇÃO 4: FECHAMENTO, PAGAMENTO E RATEIO DE TAXAS');
  console.log('======================================================================\n');

  const prefix = `s4_${Date.now().toString().slice(-6)}`;

  // 1. Setup inicial isolado para a Seção 4
  const est = await estabelecimentoService.create({
    nome: `Bar Seção 4 ${prefix}`,
    tipo: 'bar_casa_noturna',
  });

  const evt = await eventoService.create({
    estabelecimentoId: est.id,
    nome: `Noite de Testes Seção 4 ${prefix}`,
    dataInicio: new Date(),
  });

  const pontoCopa = await pontoDePreparoService.create({
    estabelecimentoId: est.id,
    nome: `Copa Bar ${prefix}`,
  });

  const pontoCozinha = await pontoDePreparoService.create({
    estabelecimentoId: est.id,
    nome: `Cozinha Principal ${prefix}`,
  });

  const itemBebida = await itemCardapioService.create({
    estabelecimentoId: est.id,
    pontoDePreparoId: pontoCopa.id,
    nome: `Bebida Artesanal ${prefix}`,
    preco: 38.0,
  });

  const itemComida = await itemCardapioService.create({
    estabelecimentoId: est.id,
    pontoDePreparoId: pontoCozinha.id,
    nome: `Prato Principal ${prefix}`,
    preco: 34.0,
  });

  const garcomPadrao = await usuarioService.create({
    estabelecimentoId: est.id,
    nome: `Garçom Padrão ${prefix}`,
    papel: 'garcom',
    senhaHash: 'hash',
  });

  // Função auxiliar para criar comanda com R$ 72 de consumo (R$ 38 bebida + R$ 34 comida)
  async function criarComandaRef(sufixo: string, garcomId: string) {
    const cli = await clienteService.create({
      estabelecimentoId: est.id,
      nome: `Cliente ${sufixo}`,
      celular: `1196${Math.floor(100000 + Math.random() * 900000)}`,
    });
    const pul = await pulseiraService.create({
      estabelecimentoId: est.id,
      codigoQr: `PUL-S4-${sufixo}-${prefix}`,
    });
    const m = await mesaService.create({
      estabelecimentoId: est.id,
      identificador: `M4-${sufixo}`,
      qrCode: `QR-S4-${sufixo}-${prefix}`,
    });
    const vinc = await vinculoPulseiraService.create({
      pulseiraId: pul.id,
      clienteId: cli.id,
      eventoId: evt.id,
      mesaId: m.id,
    });
    const cmd = await comandaService.create({
      eventoId: evt.id,
      tipoAtendimento: 'pulseira',
      vinculoPulseiraEventoId: vinc.id,
      mesaId: m.id,
      garcomResponsavelId: garcomId,
    });

    await pedidoService.create({
      comandaId: cmd.id,
      itens: [
        { itemCardapioId: itemBebida.id, quantidade: 1 }, // R$ 38,00 Copa
        { itemCardapioId: itemComida.id, quantidade: 1 }, // R$ 34,00 Cozinha
      ],
    });

    return { cmd, cli, pul, mesa: m, vinc };
  }

  // =========================================================================
  // 4.1: Fechar com taxa de serviço 10%
  // Consumo: R$ 72,00 (bebida R$ 38,00 Copa + comida R$ 34,00 Cozinha)
  // Valores fixos esperados:
  // - Garçom  = R$ 2,96 (60% de R$ 3,80 bebida = R$ 2,28 + 20% de R$ 3,40 comida = R$ 0,68)
  // - Copa    = R$ 2,20 (40% de R$ 3,80 bebida = R$ 1,52 + 20% de R$ 3,40 comida = R$ 0,68)
  // - Cozinha = R$ 2,04 (60% de R$ 3,40 comida = R$ 2,04)
  // - Soma total das taxas = R$ 7,20 (10% exato de R$ 72,00)
  // =========================================================================
  console.log('--- Executando Teste 4.1: Fechamento com taxa 10% (R$ 72 de consumo) ---');
  const ESPERADO_GARCOM_41 = 2.96;
  const ESPERADO_COPA_41 = 2.20;
  const ESPERADO_COZINHA_41 = 2.04;
  const ESPERADO_SOMA_TAXA_41 = 7.20;

  const ref1 = await criarComandaRef('TAXA10', garcomPadrao.id);
  const fech1 = await fechamentoService.fecharComandaEfetuarPagamento({
    comandaId: ref1.cmd.id,
    metodo: 'pix',
    tipoContribuicao: 'taxa_servico_10',
    garcomId: garcomPadrao.id,
  });

  // Consulta direta ao banco de dados na tabela rateio_taxa_servico
  const rateiosDbRef1 = await db
    .select({
      id: rateioTaxaServico.id,
      pontoNome: pontoDePreparo.nome,
      valorGarcom: rateioTaxaServico.valorGarcom,
      valorPontoPreparo: rateioTaxaServico.valorPontoPreparo,
    })
    .from(rateioTaxaServico)
    .innerJoin(pedidoItem, eq(rateioTaxaServico.pedidoItemId, pedidoItem.id))
    .innerJoin(pedido, eq(pedidoItem.pedidoId, pedido.id))
    .innerJoin(pontoDePreparo, eq(rateioTaxaServico.pontoDePreparoId, pontoDePreparo.id))
    .where(eq(pedido.comandaId, ref1.cmd.id));

  let dbGarcom41 = 0;
  let dbCopa41 = 0;
  let dbCozinha41 = 0;

  for (const r of rateiosDbRef1) {
    dbGarcom41 += Number(r.valorGarcom) || 0;
    const pNome = r.pontoNome.toLowerCase();
    const vPonto = Number(r.valorPontoPreparo) || 0;
    if (pNome.includes('cozinha')) {
      dbCozinha41 += vPonto;
    } else {
      dbCopa41 += vPonto;
    }
  }

  dbGarcom41 = Math.round(dbGarcom41 * 100) / 100;
  dbCopa41 = Math.round(dbCopa41 * 100) / 100;
  dbCozinha41 = Math.round(dbCozinha41 * 100) / 100;
  const dbSomaTaxa41 = Math.round((dbGarcom41 + dbCopa41 + dbCozinha41) * 100) / 100;

  const passou41 =
    dbGarcom41 === ESPERADO_GARCOM_41 &&
    dbCopa41 === ESPERADO_COPA_41 &&
    dbCozinha41 === ESPERADO_COZINHA_41 &&
    dbSomaTaxa41 === ESPERADO_SOMA_TAXA_41;

  record(
    '4.1',
    'Fechar com taxa de serviço 10% (R$72 de consumo: R$38 bebida + R$34 comida)',
    `Valores fixos: Garçom=R$${ESPERADO_GARCOM_41.toFixed(2)}, Copa=R$${ESPERADO_COPA_41.toFixed(2)}, Cozinha=R$${ESPERADO_COZINHA_41.toFixed(2)}, Soma=R$${ESPERADO_SOMA_TAXA_41.toFixed(2)}`,
    passou41 ? 'passou' : 'falhou',
    `rateio_taxa_servico conferido no banco: Garçom=R$ ${dbGarcom41.toFixed(2)}, Copa=R$ ${dbCopa41.toFixed(2)}, Cozinha=R$ ${dbCozinha41.toFixed(2)}. Soma total=R$ ${dbSomaTaxa41.toFixed(2)}.`
  );

  // =========================================================================
  // 4.2: Fechar com gorjeta livre de R$ 15,00
  // Consumo: R$ 72,00 (bebida R$ 38,00 + comida R$ 34,00) + Gorjeta R$ 15,00
  // Regra crítica:
  // - O garçom deve receber ESTRITAMENTE R$ 15,00 no rateio_taxa_servico
  // - O valor do consumo (R$ 72,00) NÃO é ganho do garçom (é pagamento de produtos da casa)
  // - Total cobrado do cliente = R$ 87,00 (72 consumo + 15 gorjeta)
  // - Copa e Cozinha = R$ 0,00
  // =========================================================================
  console.log('--- Executando Teste 4.2: Gorjeta livre de R$ 15,00 (Consumo R$ 72 + Gorjeta R$ 15) ---');
  const garcomGorjeta = await usuarioService.create({
    estabelecimentoId: est.id,
    nome: `Garçom Gorjeta ${prefix}`,
    papel: 'garcom',
    senhaHash: 'hash',
  });

  const ref2 = await criarComandaRef('GORJETA15', garcomGorjeta.id);
  const fech2 = await fechamentoService.fecharComandaEfetuarPagamento({
    comandaId: ref2.cmd.id,
    metodo: 'cartao_credito',
    tipoContribuicao: 'gorjeta_livre',
    valorContribuicao: 15.0,
    garcomId: garcomGorjeta.id,
  });

  // Consulta direta ao rateio_taxa_servico
  const rateiosDbRef2 = await db
    .select({
      id: rateioTaxaServico.id,
      valorGarcom: rateioTaxaServico.valorGarcom,
      valorPontoPreparo: rateioTaxaServico.valorPontoPreparo,
      garcomId: rateioTaxaServico.garcomId,
    })
    .from(rateioTaxaServico)
    .innerJoin(pedidoItem, eq(rateioTaxaServico.pedidoItemId, pedidoItem.id))
    .innerJoin(pedido, eq(pedidoItem.pedidoId, pedido.id))
    .where(eq(pedido.comandaId, ref2.cmd.id));

  const totalGarcomNoRateio = rateiosDbRef2.reduce(
    (acc, r) => acc + (Number(r.valorGarcom) || 0),
    0
  );
  const totalPontoNoRateio = rateiosDbRef2.reduce(
    (acc, r) => acc + (Number(r.valorPontoPreparo) || 0),
    0
  );

  const pagtoRef2 = (
    await db.select().from(pagamento).where(eq(pagamento.comandaId, ref2.cmd.id))
  )[0];

  const consumoProdutos = Number(pagtoRef2.valor); // R$ 72,00
  const gorjetaRegistrada = Number(pagtoRef2.valorContribuicao); // R$ 15,00
  const totalCobradoCliente = consumoProdutos + gorjetaRegistrada; // R$ 87,00

  const garcomRecebeuApenasGorjeta = totalGarcomNoRateio === 15.0;
  const garcomNaoRecebeuConsumo = totalGarcomNoRateio !== 87.0 && totalGarcomNoRateio !== 72.0;
  const copaCozinhaZeradas = totalPontoNoRateio === 0.0;
  const totalClienteBate87 = totalCobradoCliente === 87.0 && fech2.totalPago === 87.0;

  const passou42 =
    garcomRecebeuApenasGorjeta &&
    garcomNaoRecebeuConsumo &&
    copaCozinhaZeradas &&
    totalClienteBate87;

  record(
    '4.2',
    'Fechar com gorjeta livre de R$15,00 (Consumo R$72 + Gorjeta R$15)',
    'Garçom recebe estritamente R$15,00 no rateio_taxa_servico (consumo R$72 não entra no ganho do garçom)',
    passou42 ? 'passou' : 'falhou',
    `rateio_taxa_servico.valorGarcom = R$ ${totalGarcomNoRateio.toFixed(2)} (100% gorjeta). Consumo produtos da casa = R$ ${consumoProdutos.toFixed(2)}. Total cobrado do cliente = R$ ${totalCobradoCliente.toFixed(2)}.`
  );

  // =========================================================================
  // 4.3: Fechar com nenhuma contribuição
  // Total pago = R$ 72,00 (apenas o consumo). Zero registros em rateio_taxa_servico.
  // =========================================================================
  console.log('--- Executando Teste 4.3: Fechamento com nenhuma contribuição ---');
  const ref3 = await criarComandaRef('ZEROTAXA', garcomPadrao.id);
  const fech3 = await fechamentoService.fecharComandaEfetuarPagamento({
    comandaId: ref3.cmd.id,
    metodo: 'pix',
    tipoContribuicao: 'nenhuma',
    garcomId: garcomPadrao.id,
  });

  const rateiosDbRef3 = await db
    .select()
    .from(rateioTaxaServico)
    .innerJoin(pedidoItem, eq(rateioTaxaServico.pedidoItemId, pedidoItem.id))
    .innerJoin(pedido, eq(pedidoItem.pedidoId, pedido.id))
    .where(eq(pedido.comandaId, ref3.cmd.id));

  const passou43 =
    fech3.totalPago === 72.0 &&
    fech3.valorContribuicao === 0 &&
    fech3.rateiosInseridos === 0 &&
    rateiosDbRef3.length === 0;

  record(
    '4.3',
    'Fechar com nenhuma contribuição',
    'Total pago = R$72,00 (apenas o consumo), zero registros em rateio_taxa_servico',
    passou43 ? 'passou' : 'falhou',
    `Total pago R$ ${fech3.totalPago.toFixed(2)}. Registros em rateio_taxa_servico para a comanda: ${rateiosDbRef3.length}.`
  );

  // =========================================================================
  // 4.4: Fechar comanda no débito
  // pagamento.metodo = cartao_debito, status = pago, sem pre-auth
  // =========================================================================
  console.log('--- Executando Teste 4.4: Fechamento no débito ---');
  const ref4 = await criarComandaRef('DEBITO', garcomPadrao.id);
  const fech4 = await fechamentoService.fecharComandaEfetuarPagamento({
    comandaId: ref4.cmd.id,
    metodo: 'cartao_debito',
    tipoContribuicao: 'nenhuma',
  });

  const pagtoDb4 = fech4.pagamento;
  const passou44 = pagtoDb4.metodo === 'cartao_debito' && pagtoDb4.status === 'pago';

  record(
    '4.4',
    'Fechar comanda no débito',
    'pagamento.metodo = cartao_debito, status = pago, sem pre-auth',
    passou44 ? 'passou' : 'falhou',
    `Pagamento registrado como "${pagtoDb4.metodo}" com status "${pagtoDb4.status}".`
  );

  // =========================================================================
  // 4.5: Conferir status pós-fechamento
  // comanda.status='fechada', vinculo.status='encerrado', mesa='livre'
  // =========================================================================
  console.log('--- Executando Teste 4.5: Conferência de status pós-fechamento ---');
  const cmdPos = (await db.select().from(comanda).where(eq(comanda.id, ref4.cmd.id)))[0];
  const vincPos = (
    await db.select().from(vinculoPulseiraEvento).where(eq(vinculoPulseiraEvento.id, ref4.vinc.id))
  )[0];
  const mesaPos = (await db.select().from(mesa).where(eq(mesa.id, ref4.mesa.id)))[0];

  const fechouCmd = cmdPos.status === 'fechada';
  const encerrouVinc = vincPos.status === 'encerrado';
  const liberouMesa = mesaPos.status === 'livre';
  const passou45 = fechouCmd && encerrouVinc && liberouMesa;

  record(
    '4.5',
    'Conferir status pós-fechamento',
    "comanda.status='fechada', vinculo.status='encerrado', mesa='livre'",
    passou45 ? 'passou' : 'falhou',
    `Comanda fechadaEm="${cmdPos.fechadaEm?.toISOString()}", vínculo status="${vincPos.status}", mesa status="${mesaPos.status}".`
  );

  console.log('======================================================================');
  const aprovados = results.filter((r) => r.status === 'passou').length;
  const reprovados = results.filter((r) => r.status === 'falhou').length;
  console.log(`RESULTADO DA SEÇÃO 4: ${aprovados}/${results.length} PASSARAM (${reprovados} FALHAS)`);
  console.log('======================================================================');
}

runSection4Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro na execução dos testes da Seção 4:', err);
    process.exit(1);
  });
