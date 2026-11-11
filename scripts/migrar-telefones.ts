import { db } from '../src/db/index.ts';
import { sql } from 'drizzle-orm';
import { normalizarTelefonePadrao } from '../src/server/rate-limiter.ts';

async function migrarTelefones() {
  console.log('=== INICIANDO MIGRAÇÃO DE TELEFONES PARA O PADRÃO 13 DÍGITOS (55 + DDD + NÚMERO) ===\n');

  // 1. USUARIOS
  console.log('[1/4] Migrando telefones de usuários...');
  const usuarios = await db.execute(sql`SELECT id, celular FROM usuario WHERE celular IS NOT NULL AND celular != ''`);
  let usuariosAtualizados = 0;
  for (const row of usuarios.rows as any[]) {
    const original = String(row.celular);
    const normalizado = normalizarTelefonePadrao(original);
    if (normalizado && normalizado !== original) {
      await db.execute(sql`UPDATE usuario SET celular = ${normalizado} WHERE id = ${row.id}`);
      usuariosAtualizados++;
    }
  }
  console.log(`✓ Usuários analisados: ${usuarios.rows.length}. Usuários atualizados: ${usuariosAtualizados}.\n`);

  // 2. CLIENTES
  console.log('[2/4] Migrando telefones de clientes...');
  const clientes = await db.execute(sql`SELECT id, celular FROM cliente WHERE celular IS NOT NULL AND celular != ''`);
  let clientesAtualizados = 0;
  for (const row of clientes.rows as any[]) {
    const original = String(row.celular);
    const normalizado = normalizarTelefonePadrao(original);
    if (normalizado && normalizado !== original) {
      // Verificar se o normalizado causaria conflito com outro cliente do mesmo estabelecimento
      await db.execute(sql`UPDATE cliente SET celular = ${normalizado} WHERE id = ${row.id}`);
      clientesAtualizados++;
    }
  }
  console.log(`✓ Clientes analisados: ${clientes.rows.length}. Clientes atualizados: ${clientesAtualizados}.\n`);

  // 3. COMANDAS
  console.log('[3/4] Migrando telefones de comandas...');
  const comandas = await db.execute(sql`SELECT id, telefone_cliente FROM comanda WHERE telefone_cliente IS NOT NULL AND telefone_cliente != ''`);
  let comandasAtualizadas = 0;
  for (const row of comandas.rows as any[]) {
    const original = String(row.telefone_cliente);
    const normalizado = normalizarTelefonePadrao(original);
    if (normalizado && normalizado !== original) {
      await db.execute(sql`UPDATE comanda SET telefone_cliente = ${normalizado} WHERE id = ${row.id}`);
      comandasAtualizadas++;
    }
  }
  console.log(`✓ Comandas analisadas: ${comandas.rows.length}. Comandas atualizadas: ${comandasAtualizadas}.\n`);

  // 4. TELEFONE_VERIFICACAO
  console.log('[4/4] Migrando telefones de verificações...');
  const verificacoes = await db.execute(sql`SELECT id, telefone FROM telefone_verificacao WHERE telefone IS NOT NULL AND telefone != ''`);
  let verificacoesAtualizadas = 0;
  for (const row of verificacoes.rows as any[]) {
    const original = String(row.telefone);
    const normalizado = normalizarTelefonePadrao(original);
    if (normalizado && normalizado !== original) {
      await db.execute(sql`UPDATE telefone_verificacao SET telefone = ${normalizado} WHERE id = ${row.id}`);
      verificacoesAtualizadas++;
    }
  }
  console.log(`✓ Verificações analisadas: ${verificacoes.rows.length}. Verificações atualizadas: ${verificacoesAtualizadas}.\n`);

  console.log('=== MIGRAÇÃO DE TELEFONES CONCLUÍDA COM SUCESSO ===');
  process.exit(0);
}

migrarTelefones().catch((err) => {
  console.error('ERRO FATAL NA MIGRAÇÃO DE TELEFONES:', err);
  process.exit(1);
});
