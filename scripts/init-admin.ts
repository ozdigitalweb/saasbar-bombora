import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/db/index.ts';
import { usuario, estabelecimento } from '../src/db/schema.ts';
import { usuarioService, estabelecimentoService } from '../src/server/db-services.ts';
import { hashPassword } from '../src/server/auth.ts';
import { eq } from 'drizzle-orm';

async function main() {
  const args = process.argv.slice(2);
  const [argEstNome, argNome, argEmail, argSenha, argCelular] = args;

  const estNome = argEstNome || process.env.INITIAL_ESTABELECIMENTO_NOME || 'Estabelecimento Principal';
  const gerenteNome = argNome || process.env.INITIAL_GERENTE_NOME || 'Gerente Geral';
  const gerenteEmail = argEmail || process.env.INITIAL_GERENTE_EMAIL || 'gerente@saasbar.com';
  const gerenteSenha = argSenha || process.env.INITIAL_GERENTE_SENHA || 'Admin@123456';
  const gerenteCelular = argCelular || process.env.INITIAL_GERENTE_CELULAR || '11999990001';

  if (!gerenteSenha || gerenteSenha.length < 8) {
    console.error('❌ Erro: A senha do gerente deve conter no mínimo 8 caracteres.');
    process.exit(1);
  }

  // Regra 7: Não faz nada se já existir um gerente cadastrado
  const existingGerentes = await db
    .select({ id: usuario.id, email: usuario.email, nome: usuario.nome })
    .from(usuario)
    .where(eq(usuario.papel, 'gerente'))
    .limit(1);

  if (existingGerentes.length > 0) {
    console.log(
      `ℹ️ [INIT-ADMIN] Operação abortada por segurança: já existe gerente cadastrado no sistema (${existingGerentes[0].email}).`
    );
    process.exit(0);
  }

  // Busca ou cria o primeiro estabelecimento
  const existingEsts = await db.select().from(estabelecimento).limit(1);
  let estId = existingEsts[0]?.id;

  if (!estId) {
    const createdEst = await estabelecimentoService.create({
      nome: estNome,
      tipo: 'bar_casa_noturna',
      config: { tempoLimiteValidacaoMin: 5 },
    });
    estId = createdEst.id;
    console.log(`✅ [INIT-ADMIN] Primeiro estabelecimento criado: "${estNome}" (ID: ${estId})`);
  } else {
    console.log(`ℹ️ [INIT-ADMIN] Vinculando ao estabelecimento existente: "${existingEsts[0].nome}" (ID: ${estId})`);
  }

  // Cria o primeiro gerente com senha criptografada (hash)
  const senhaHash = await hashPassword(gerenteSenha);
  const createdGerente = await usuarioService.create({
    estabelecimentoId: estId,
    nome: gerenteNome,
    email: gerenteEmail,
    celular: gerenteCelular,
    papel: 'gerente',
    senhaHash,
  });

  console.log(
    `✅ [INIT-ADMIN] Primeiro gerente criado com sucesso!\n   Nome: ${createdGerente.nome}\n   E-mail: ${createdGerente.email}\n   Celular: ${createdGerente.celular}\n   ID: ${createdGerente.id}\n   Papel: ${createdGerente.papel}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ [INIT-ADMIN] Falha na execução da instalação inicial:', err);
  process.exit(1);
});
