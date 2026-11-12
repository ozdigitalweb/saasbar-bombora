import { db } from '../src/db/index.ts';
import { sql } from 'drizzle-orm';

async function verificarDuplicatasEIndices() {
  console.log('=== VERIFICAÇÃO DE DUPLICATAS E STATUS DOS ÍNDICES ÚNICOS ===\n');

  // 1. Verificar duplicatas em usuario por email
  console.log('[1/3] Verificando duplicatas de email em usuario...');
  const dupUserEmail = await db.execute(sql`
    SELECT estabelecimento_id, lower(email) as email_lower, count(*) as total
    FROM usuario
    WHERE email IS NOT NULL AND trim(email) != ''
    GROUP BY estabelecimento_id, lower(email)
    HAVING count(*) > 1
  `);
  if (dupUserEmail.rows.length > 0) {
    console.warn('ATENÇÃO: Foram encontradas duplicatas de email em usuario:', dupUserEmail.rows);
  } else {
    console.log('✓ Nenhuma duplicata de email em usuario encontrada.');
  }

  // 2. Verificar duplicatas em usuario por celular
  console.log('[2/3] Verificando duplicatas de celular em usuario...');
  const dupUserCelular = await db.execute(sql`
    SELECT estabelecimento_id, celular, count(*) as total
    FROM usuario
    WHERE celular IS NOT NULL AND trim(celular) != ''
    GROUP BY estabelecimento_id, celular
    HAVING count(*) > 1
  `);
  if (dupUserCelular.rows.length > 0) {
    console.warn('ATENÇÃO: Foram encontradas duplicatas de celular em usuario:', dupUserCelular.rows);
  } else {
    console.log('✓ Nenhuma duplicata de celular em usuario encontrada.');
  }

  // 3. Verificar duplicatas em cliente por celular (único mantido)
  console.log('[3/3] Verificando duplicatas de celular em cliente...');
  const dupClienteCelular = await db.execute(sql`
    SELECT estabelecimento_id, celular, count(*) as total
    FROM cliente
    WHERE celular IS NOT NULL AND trim(celular) != ''
    GROUP BY estabelecimento_id, celular
    HAVING count(*) > 1
  `);
  if (dupClienteCelular.rows.length > 0) {
    console.warn('ATENÇÃO: Foram encontradas duplicatas de celular em cliente:', dupClienteCelular.rows);
  } else {
    console.log('✓ Nenhuma duplicata de celular em cliente encontrada.');
  }

  console.log('\n--- Verificando existência dos índices únicos no catálogo do PostgreSQL ---');
  const indices = await db.execute(sql`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE tablename IN ('usuario', 'cliente')
      AND indexname LIKE '%estabelecimento%'
    ORDER BY tablename, indexname;
  `);
  for (const row of indices.rows as any[]) {
    console.log(`✓ [${row.tablename}] ${row.indexname}: ${row.indexdef}`);
  }

  console.log('\n=== VERIFICAÇÃO DE DUPLICATAS E ÍNDICES CONCLUÍDA COM SUCESSO ===');
  process.exit(0);
}

verificarDuplicatasEIndices().catch((err) => {
  console.error('ERRO:', err);
  process.exit(1);
});
