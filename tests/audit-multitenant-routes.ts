import express from 'express';
import { apiRouter } from '../src/server/api-router.ts';
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
} from '../src/server/db-services.ts';
import { generateToken } from '../src/server/auth.ts';

interface RouteAudit {
  route: string;
  method: string;
  recurso: string;
  statusEsperado: number;
  statusObtido: number;
  bloqueado: boolean;
  detalhe: string;
}

const auditResults: RouteAudit[] = [];

async function runAudit() {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const prefix = `aud_${Date.now().toString().slice(-6)}`;

  // 1. Setup 2 tenants
  const estAlfa = await estabelecimentoService.create({ nome: `Alfa ${prefix}`, tipo: 'bar_casa_noturna' });
  const estBeta = await estabelecimentoService.create({ nome: `Beta ${prefix}`, tipo: 'restaurante' });

  // JWT belonging to Tenant Beta (attacker trying to touch Tenant Alfa resources)
  const tokenBetaGerente = generateToken({
    userId: 'user-beta-gerente',
    estabelecimentoId: estBeta.id,
    nome: 'Gerente Beta',
    papel: 'gerente',
  });

  const authHeaders = {
    Authorization: `Bearer ${tokenBetaGerente}`,
    'Content-Type': 'application/json',
  };

  // 2. Setup Resources belonging to Tenant Alfa
  const pontoAlfa = await pontoDePreparoService.create({ estabelecimentoId: estAlfa.id, nome: 'Copa Alfa' });
  const userAlfa = await usuarioService.create({ estabelecimentoId: estAlfa.id, nome: 'User Alfa', papel: 'garcom', senhaHash: 'hash' });
  const mesaAlfa = await mesaService.create({ estabelecimentoId: estAlfa.id, identificador: `M-ALFA`, qrCode: `QR-ALFA-${prefix}` });
  const pulseiraAlfa = await pulseiraService.create({ estabelecimentoId: estAlfa.id, codigoQr: `PUL-ALFA-${prefix}` });
  const clienteAlfa = await clienteService.create({ estabelecimentoId: estAlfa.id, nome: 'Cliente Alfa', celular: `11988${prefix.slice(-6)}` });
  const itemAlfa = await itemCardapioService.create({ estabelecimentoId: estAlfa.id, pontoDePreparoId: pontoAlfa.id, nome: 'Bebida Alfa', preco: 20 });
  const eventoAlfa = await eventoService.create({ estabelecimentoId: estAlfa.id, nome: `Show Alfa ${prefix}`, dataInicio: new Date() });
  const vinculoAlfa = await vinculoPulseiraService.create({ pulseiraId: pulseiraAlfa.id, clienteId: clienteAlfa.id, eventoId: eventoAlfa.id });
  const comandaAlfa = await comandaService.create({ eventoId: eventoAlfa.id, tipoAtendimento: 'mesa', mesaId: mesaAlfa.id });
  const pedidoAlfa = await pedidoService.createWithRouting({
    comandaId: comandaAlfa.id,
    origem: 'garcom',
    itens: [{ itemCardapioId: itemAlfa.id, quantidade: 1 }],
  });
  const itemPedidoAlfaId = pedidoAlfa.itens[0].id;

  async function check(method: string, path: string, body?: any, recurso?: string) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: authHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const status = res.status;
    const bloqueado = status === 403;
    const audit: RouteAudit = {
      route: `${method} /api${path}`,
      method,
      recurso: recurso || path.split('/')[1],
      statusEsperado: 403,
      statusObtido: status,
      bloqueado,
      detalhe: bloqueado ? '403 Forbidden: estabelecimento_id validado com sucesso' : `Falha: retornou ${status}`,
    };
    auditResults.push(audit);
    console.log(`${bloqueado ? '✅' : '❌'} [AUDIT] ${audit.route} -> ${status} (${bloqueado ? 'BLOQUEOU OUTRO TENANT' : 'VAZOU DADOS'})`);
  }

  console.log('\n--- AUDITORIA MULTI-TENANT: ROTAS COM ID DE RECURSO ---\n');

  // 1. Estabelecimento
  await check('GET', `/estabelecimentos/${estAlfa.id}`, undefined, 'estabelecimento');
  await check('PUT', `/estabelecimentos/${estAlfa.id}`, { nome: 'Hack' }, 'estabelecimento');
  await check('DELETE', `/estabelecimentos/${estAlfa.id}`, undefined, 'estabelecimento');

  // 2. Pontos de preparo
  await check('GET', `/pontos-de-preparo/${pontoAlfa.id}`, undefined, 'ponto_de_preparo');
  await check('POST', '/pontos-de-preparo', { estabelecimentoId: estAlfa.id, nome: 'Invasor' }, 'ponto_de_preparo');
  await check('PUT', `/pontos-de-preparo/${pontoAlfa.id}`, { nome: 'Hack' }, 'ponto_de_preparo');
  await check('DELETE', `/pontos-de-preparo/${pontoAlfa.id}`, undefined, 'ponto_de_preparo');

  // 3. Usuários
  await check('GET', `/usuarios/${userAlfa.id}`, undefined, 'usuario');
  await check('POST', '/usuarios', { estabelecimentoId: estAlfa.id, nome: 'Invasor', papel: 'garcom' }, 'usuario');
  await check('PUT', `/usuarios/${userAlfa.id}`, { nome: 'Hack' }, 'usuario');
  await check('DELETE', `/usuarios/${userAlfa.id}`, undefined, 'usuario');

  // 4. Mesas
  await check('GET', `/mesas/${mesaAlfa.id}`, undefined, 'mesa');
  await check('POST', '/mesas', { estabelecimentoId: estAlfa.id, identificador: 'M-HACK', qrCode: 'QR-HACK' }, 'mesa');
  await check('PUT', `/mesas/${mesaAlfa.id}`, { identificador: 'M-HACK' }, 'mesa');
  await check('DELETE', `/mesas/${mesaAlfa.id}`, undefined, 'mesa');

  // 5. Pulseiras
  await check('GET', `/pulseiras/${pulseiraAlfa.id}`, undefined, 'pulseira');
  await check('POST', '/pulseiras', { estabelecimentoId: estAlfa.id, codigoQr: 'PUL-HACK' }, 'pulseira');
  await check('PUT', `/pulseiras/${pulseiraAlfa.id}`, { codigoQr: 'PUL-HACK' }, 'pulseira');
  await check('DELETE', `/pulseiras/${pulseiraAlfa.id}`, undefined, 'pulseira');

  // 6. Clientes
  await check('GET', `/clientes/${clienteAlfa.id}`, undefined, 'cliente');
  await check('POST', '/clientes', { estabelecimentoId: estAlfa.id, nome: 'Cli Hack', celular: '11999999999' }, 'cliente');
  await check('PUT', `/clientes/${clienteAlfa.id}`, { nome: 'Cli Hack' }, 'cliente');
  await check('DELETE', `/clientes/${clienteAlfa.id}`, undefined, 'cliente');

  // 7. Itens de cardápio
  await check('GET', `/itens-cardapio/${itemAlfa.id}`, undefined, 'item_cardapio');
  await check('POST', '/itens-cardapio', { estabelecimentoId: estAlfa.id, pontoDePreparoId: pontoAlfa.id, nome: 'Hack', preco: 10 }, 'item_cardapio');
  await check('PUT', `/itens-cardapio/${itemAlfa.id}`, { nome: 'Hack' }, 'item_cardapio');
  await check('DELETE', `/itens-cardapio/${itemAlfa.id}`, undefined, 'item_cardapio');

  // 8. Eventos
  await check('GET', `/eventos?estabelecimentoId=${estAlfa.id}`, undefined, 'evento');
  await check('GET', `/eventos/ativo?estabelecimentoId=${estAlfa.id}`, undefined, 'evento');
  await check('POST', '/eventos', { estabelecimentoId: estAlfa.id, nome: 'Hack Event' }, 'evento');
  await check('PUT', `/eventos/${eventoAlfa.id}/encerrar`, undefined, 'evento');

  // 9. Vínculos de pulseira
  await check('GET', `/vinculos-pulseira?eventoId=${eventoAlfa.id}`, undefined, 'vinculo_pulseira');
  await check('POST', '/vinculos-pulseira', { pulseiraId: pulseiraAlfa.id, clienteId: clienteAlfa.id, eventoId: eventoAlfa.id }, 'vinculo_pulseira');
  await check('GET', `/vinculos-pulseira/buscar-qr?codigoQr=${pulseiraAlfa.codigoQr}&eventoId=${eventoAlfa.id}`, undefined, 'vinculo_pulseira');

  // 10. Comandas
  await check('GET', `/comandas?eventoId=${eventoAlfa.id}`, undefined, 'comanda');
  await check('GET', `/comandas/buscar-pulseira?codigoQr=${pulseiraAlfa.codigoQr}&eventoId=${eventoAlfa.id}`, undefined, 'comanda');
  await check('GET', `/comandas/por-mesa/${mesaAlfa.id}?eventoId=${eventoAlfa.id}`, undefined, 'comanda');
  await check('GET', `/comandas/${comandaAlfa.id}`, undefined, 'comanda');
  await check('POST', '/comandas', { eventoId: eventoAlfa.id, tipoAtendimento: 'mesa', mesaId: mesaAlfa.id }, 'comanda');
  await check('PUT', `/comandas/${comandaAlfa.id}/status`, { status: 'fechada' }, 'comanda');

  // 11. Pedidos e Pedido-Itens
  await check('POST', '/pedidos/lancamento-rapido', { comandaId: comandaAlfa.id, itens: [{ itemCardapioId: itemAlfa.id, quantidade: 1 }] }, 'pedido');
  await check('PUT', `/pedidos-itens/${itemPedidoAlfaId}/status`, { status: 'pronto' }, 'pedido_item');

  // 12. Fechamento e Rateio
  await check('GET', `/comandas/${comandaAlfa.id}/previa-fechamento`, undefined, 'fechamento');
  await check('POST', `/comandas/${comandaAlfa.id}/fechar-pagamento`, { metodo: 'pix' }, 'fechamento');
  await check('POST', `/comandas/${comandaAlfa.id}/recibo-whatsapp`, undefined, 'fechamento');
  await check('GET', `/relatorios/rateios?estabelecimentoId=${estAlfa.id}`, undefined, 'relatorio_rateio');

  // 13. Pulseiras perdidas
  await check('POST', '/pulseiras-perdidas/comunicar', { vinculoPulseiraEventoId: vinculoAlfa.id }, 'pulseira_perdida');
  await check('GET', `/pulseiras-perdidas/calculo/${vinculoAlfa.id}`, undefined, 'pulseira_perdida');
  await check('GET', `/pulseiras-perdidas?eventoId=${eventoAlfa.id}`, undefined, 'pulseira_perdida');

  // 14. Fidelidade
  await check('GET', `/fidelidade/ranking?estabelecimentoId=${estAlfa.id}`, undefined, 'fidelidade');
  await check('GET', `/fidelidade/cliente/${clienteAlfa.id}`, undefined, 'fidelidade');
  await check('POST', `/fidelidade/resgatar-chopp/${clienteAlfa.id}`, undefined, 'fidelidade');

  // 15. Equipe e Garçom
  await check('GET', `/equipe/rebalanceamento?estabelecimentoId=${estAlfa.id}&eventoId=${eventoAlfa.id}`, undefined, 'equipe');
  await check('POST', '/equipe/atribuir-mesa', { garcomId: userAlfa.id, mesaId: mesaAlfa.id }, 'equipe');
  await check('DELETE', '/equipe/remover-mesa', { garcomId: userAlfa.id, mesaId: mesaAlfa.id }, 'equipe');
  await check('POST', '/equipe/meta-comissao', { garcomId: userAlfa.id, eventoId: eventoAlfa.id, metaMinutos: 2 }, 'equipe');
  await check('POST', '/equipe/executar-rebalanceamento', { estabelecimentoId: estAlfa.id, eventoId: eventoAlfa.id }, 'equipe');
  await check('GET', `/garcom/clientes/buscar?celular=${clienteAlfa.celular}&estabelecimentoId=${estAlfa.id}`, undefined, 'garcom');
  await check('POST', '/garcom/check-in-pulseira', { estabelecimentoId: estAlfa.id, eventoId: eventoAlfa.id, codigoQrPulseira: 'PUL-NEW', nome: 'New', celular: '11988888888' }, 'garcom');
  await check('POST', '/garcom/mesas/liberar', { mesaId: mesaAlfa.id, eventoId: eventoAlfa.id }, 'garcom');
  await check('POST', `/garcom/fila-entrega/${itemPedidoAlfaId}/recebi`, undefined, 'garcom');
  await check('GET', `/garcom/perfil/${userAlfa.id}`, undefined, 'garcom');

  server.close();

  const total = auditResults.length;
  const passed = auditResults.filter((r) => r.bloqueado).length;
  const failed = total - passed;

  console.log('\n====================================================');
  console.log(`TOTAL DE ROTAS AUDITADAS: ${total}`);
  console.log(`ISOLADAS COM SUCESSO (403): ${passed}`);
  console.log(`VULNERÁVEIS / FALHAS: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Erro na execução da auditoria:', err);
  process.exit(1);
});
