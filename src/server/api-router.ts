import { Router, Request, Response, NextFunction } from 'express';
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
  multaPulseiraService,
  fidelidadeService,
  rebalanceamentoService,
  reciboEnvioService,
  cobrancaService,
  caixaGarcomService,
  conciliacaoService,
  envioCodigoService,
  telefoneVerificacaoService,
  mascararTelefone,
  normalizarTelefone,
} from './db-services.ts';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  requireAuth,
  requireRole,
  validateTenantAccess,
  getCallerTenantId,
  AuthRequest,
} from './auth.ts';
import {
  loginRateLimiter,
  autoatendimentoRateLimiter,
  buscaCelularRateLimiter,
  mascararCelular,
  normalizarCelular,
} from './rate-limiter.ts';

export const apiRouter = Router();

// ==========================================
// LISTA EXPLÍCITA DE ROTAS PÚBLICAS & RATE LIMITING
// ==========================================
// 1. POST /auth/login: login da equipe (garçom, operador, gerente) com loginRateLimiter
// 2. GET /status: healthcheck de monitoramento do servidor
// 3. GET /cliente/mesa-por-qr: cliente escaneia o QR físico da mesa para identificar mesa/comanda
// 4. POST /cliente/solicitar-codigo: cliente solicita código OTP de 6 dígitos via SMS/WhatsApp
// 5. POST /cliente/verificar-codigo: cliente valida o código de 6 dígitos digitado
// 6. GET /cliente/sessao-mesa: cliente consulta se a sessão da mesa já está verificada
// 7. POST /cliente/pedido: envio de pedido pelo cliente na mesa (autoatendimento com rate limit)
// 8. POST /pedidos/lancamento-rapido: envio de pedido pelo cliente quando origem === 'autoatendimento'
export function isPublicRoute(method: string, path: string, body?: any): boolean {
  const m = method.toUpperCase();
  const p = path.replace(/\/+$/, '') || '/';

  if (m === 'POST' && p === '/auth/login') return true;
  if (m === 'GET' && p === '/status') return true;
  if (m === 'GET' && p === '/cliente/mesa-por-qr') return true;
  if (m === 'POST' && p === '/cliente/solicitar-codigo') return true;
  if (m === 'POST' && p === '/cliente/verificar-codigo') return true;
  if (m === 'GET' && p === '/cliente/sessao-mesa') return true;
  if (m === 'POST' && p === '/cliente/pedido') return true;
  if (m === 'POST' && p === '/pedidos/lancamento-rapido' && body?.origem === 'autoatendimento') {
    return true;
  }
  return false;
}

// ==========================================
// MIDDLEWARE GLOBAL DE AUTENTICAÇÃO POR PADRÃO
// (Exige autenticação em todas as rotas exceto a lista explícita acima)
// ==========================================
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (isPublicRoute(req.method, req.path, req.body)) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded) {
        (req as AuthRequest).user = decoded;
      }
    }
    return next();
  }

  // Qualquer rota não pública sem autenticação válida é rejeitada com 401
  requireAuth(req as AuthRequest, res, next);
});

// ==========================================
// AUTHENTICATION (Login com Celular/Email + Senha)
// ==========================================
apiRouter.post('/auth/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { login, senha, estabelecimentoId } = req.body;
    if (!login?.trim() || !senha) {
      return res.status(400).json({ error: 'Informe o celular ou e-mail e a senha.' });
    }

    const user = await usuarioService.findByLogin(login.trim(), estabelecimentoId);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seus dados de acesso.' });
    }

    const isValid = await comparePassword(senha, user.senhaHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seus dados de acesso.' });
    }

    const token = generateToken({
      userId: user.id,
      estabelecimentoId: user.estabelecimentoId,
      nome: user.nome,
      papel: user.papel,
    });

    res.json({
      token,
      user: {
        id: user.id,
        estabelecimentoId: user.estabelecimentoId,
        nome: user.nome,
        papel: user.papel,
        celular: user.celular,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Erro ao realizar login' });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    const user = await usuarioService.getById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({
      id: user.id,
      estabelecimentoId: user.estabelecimentoId,
      nome: user.nome,
      papel: user.papel,
      celular: user.celular,
      email: user.email,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar perfil' });
  }
});

// Health and bootstrap
apiRouter.get('/status', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

apiRouter.get('/bootstrap', async (req: Request, res: Response) => {
  try {
    const callerEstId = getCallerTenantId(req);
    if (!callerEstId) {
      return res.status(401).json({ error: 'Usuário não autenticado ou sem estabelecimento' });
    }

    const current = await estabelecimentoService.getById(callerEstId);
    if (!current) {
      return res.status(404).json({ error: 'Estabelecimento do usuário não encontrado' });
    }

    const [pontos, usuarios, mesas, pulseiras, clientes, itens, eventos, activeEvento] =
      await Promise.all([
        pontoDePreparoService.getAll(current.id),
        usuarioService.getAll(current.id),
        mesaService.getAll(current.id),
        pulseiraService.getAll(current.id),
        clienteService.getAll(current.id),
        itemCardapioService.getAll(current.id),
        eventoService.getAll(current.id),
        eventoService.getActive(current.id),
      ]);

    let comandasCount = 0;
    if (activeEvento) {
      const activeComandas = await comandaService.getAll(activeEvento.id, 'aberta');
      comandasCount = activeComandas.length;
    }

    res.json({
      estabelecimentos: [current],
      currentEstabelecimento: current,
      eventos,
      activeEvento,
      counts: {
        pontos: pontos.length,
        usuarios: usuarios.length,
        mesas: mesas.length,
        pulseiras: pulseiras.length,
        clientes: clientes.length,
        itens: itens.length,
        eventos: eventos.length,
        comandasAbertas: comandasCount,
      },
    });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: error.message || 'Erro no bootstrap do sistema' });
  }
});

// ==========================================
// 1. ESTABELECIMENTO CRUD (SÓ GERENTE)
// ==========================================
apiRouter.get('/estabelecimentos', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const callerEstId = getCallerTenantId(req);
    if (!callerEstId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const current = await estabelecimentoService.getById(callerEstId);
    res.json(current ? [current] : []);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar estabelecimentos' });
  }
});

apiRouter.get('/estabelecimentos/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    if (!validateTenantAccess(req, req.params.id)) {
      return res.status(403).json({ error: 'Acesso negado: estabelecimento pertence a outro tenant.' });
    }
    const item = await estabelecimentoService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar estabelecimento' });
  }
});

apiRouter.post('/estabelecimentos', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { nome, tipo, config } = req.body;
    if (!nome?.trim()) {
      return res.status(400).json({ error: 'O nome do estabelecimento é obrigatório' });
    }
    const created = await estabelecimentoService.create({ nome: nome.trim(), tipo, config });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar estabelecimento' });
  }
});

apiRouter.put('/estabelecimentos/:id', requireAuth, requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    if (!validateTenantAccess(req, req.params.id)) {
      return res.status(403).json({ error: 'Acesso negado: você só pode gerenciar seu próprio estabelecimento.' });
    }
    const { nome, tipo, config } = req.body;
    const updated = await estabelecimentoService.update(req.params.id, {
      ...(nome ? { nome: nome.trim() } : {}),
      ...(tipo ? { tipo } : {}),
      ...(config ? { config } : {}),
    });
    if (!updated) return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar estabelecimento' });
  }
});

apiRouter.delete('/estabelecimentos/:id', requireAuth, requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    if (!validateTenantAccess(req, req.params.id)) {
      return res.status(403).json({ error: 'Acesso negado: você só pode gerenciar seu próprio estabelecimento.' });
    }
    const deleted = await estabelecimentoService.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    res.json({ message: 'Estabelecimento excluído com sucesso', deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir estabelecimento' });
  }
});

// ==========================================
// 2. PONTO DE PREPARO CRUD
// ==========================================
apiRouter.get('/pontos-de-preparo', async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId } = req.query;
    const targetEst = typeof estabelecimentoId === 'string' ? estabelecimentoId : undefined;
    if (targetEst && !validateTenantAccess(req, targetEst)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await pontoDePreparoService.getAll(targetEst);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar pontos de preparo' });
  }
});

apiRouter.get('/pontos-de-preparo/:id', async (req: Request, res: Response) => {
  try {
    const item = await pontoDePreparoService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Ponto de preparo não encontrado' });
    if (!validateTenantAccess(req, item.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar ponto de preparo' });
  }
});

apiRouter.post('/pontos-de-preparo', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, nome } = req.body;
    if (!estabelecimentoId || !nome?.trim()) {
      return res.status(400).json({ error: 'estabelecimentoId e nome são obrigatórios' });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    const created = await pontoDePreparoService.create({
      estabelecimentoId,
      nome: nome.trim(),
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar ponto de preparo' });
  }
});

apiRouter.put('/pontos-de-preparo/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await pontoDePreparoService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ponto de preparo não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const { nome } = req.body;
    if (!nome?.trim()) {
      return res.status(400).json({ error: 'O nome é obrigatório' });
    }
    const updated = await pontoDePreparoService.update(req.params.id, { nome: nome.trim() });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar ponto de preparo' });
  }
});

apiRouter.delete('/pontos-de-preparo/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await pontoDePreparoService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ponto de preparo não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const deleted = await pontoDePreparoService.delete(req.params.id);
    res.json({ message: 'Ponto de preparo excluído com sucesso', deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir ponto de preparo' });
  }
});

// ==========================================
// 3. USUARIO CRUD (SÓ GERENTE)
// ==========================================
apiRouter.get('/usuarios', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, papel } = req.query;
    const callerEstId = getCallerTenantId(req);
    const targetEst = typeof estabelecimentoId === 'string' ? estabelecimentoId : callerEstId || undefined;
    if (targetEst && !validateTenantAccess(req, targetEst)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await usuarioService.getAll(
      targetEst,
      typeof papel === 'string' ? (papel as any) : undefined
    );
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar usuários' });
  }
});

apiRouter.get('/usuarios/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const item = await usuarioService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (!validateTenantAccess(req, item.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar usuário' });
  }
});

apiRouter.post('/usuarios', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, nome, papel, celular, email, senha, senhaHash } = req.body;
    if (!estabelecimentoId || !nome?.trim() || !papel) {
      return res.status(400).json({ error: 'estabelecimentoId, nome e papel são obrigatórios' });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    const validPapels = ['garcom', 'gerente', 'operador_balcao'];
    if (!validPapels.includes(papel)) {
      return res.status(400).json({
        error: `Papel inválido. Deve ser um de: ${validPapels.join(', ')}`,
      });
    }

    // Regra 6: Senha obrigatória, mínimo de 8 caracteres; sem padrão '123456'
    const rawPassword = senha || senhaHash;
    if (!rawPassword || typeof rawPassword !== 'string' || rawPassword.trim().length < 8) {
      return res.status(400).json({ error: 'A senha é obrigatória e deve ter no mínimo 8 caracteres.' });
    }
    const hashed = await hashPassword(rawPassword.trim());

    const created = await usuarioService.create({
      estabelecimentoId,
      nome: nome.trim(),
      papel,
      celular: celular?.trim(),
      email: email?.trim(),
      senhaHash: hashed,
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao cadastrar usuário' });
  }
});

apiRouter.put('/usuarios/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await usuarioService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const { nome, papel, celular, email, senha, senhaHash } = req.body;
    if (papel) {
      const validPapels = ['garcom', 'gerente', 'operador_balcao'];
      if (!validPapels.includes(papel)) {
        return res.status(400).json({
          error: `Papel inválido. Deve ser um de: ${validPapels.join(', ')}`,
        });
      }
    }
    let finalSenhaHash: string | undefined = undefined;
    const rawNewPassword = senha || senhaHash;
    if (rawNewPassword !== undefined) {
      if (typeof rawNewPassword !== 'string' || rawNewPassword.trim().length < 8) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
      }
      finalSenhaHash = await hashPassword(rawNewPassword.trim());
    }
    const updated = await usuarioService.update(req.params.id, {
      ...(nome ? { nome: nome.trim() } : {}),
      ...(papel ? { papel } : {}),
      ...(celular !== undefined ? { celular: celular.trim() } : {}),
      ...(email !== undefined ? { email: email.trim() } : {}),
      ...(finalSenhaHash !== undefined ? { senhaHash: finalSenhaHash } : {}),
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar usuário' });
  }
});

apiRouter.delete('/usuarios/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await usuarioService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const deleted = await usuarioService.delete(req.params.id);
    res.json({ message: 'Usuário excluído com sucesso', deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir usuário' });
  }
});

// ==========================================
// 4. MESA CRUD
// ==========================================
apiRouter.get('/mesas', async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId } = req.query;
    const targetEst = typeof estabelecimentoId === 'string' ? estabelecimentoId : undefined;
    if (targetEst && !validateTenantAccess(req, targetEst)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await mesaService.getAll(targetEst);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar mesas' });
  }
});

apiRouter.get('/mesas/:id', async (req: Request, res: Response) => {
  try {
    const item = await mesaService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Mesa não encontrada' });
    if (!validateTenantAccess(req, item.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar mesa' });
  }
});

apiRouter.post('/mesas', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, identificador, qrCode, status } = req.body;
    if (!estabelecimentoId || !identificador?.trim() || !qrCode?.trim()) {
      return res.status(400).json({
        error: 'estabelecimentoId, identificador e qrCode são obrigatórios',
      });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    const created = await mesaService.create({
      estabelecimentoId,
      identificador: identificador.trim(),
      qrCode: qrCode.trim(),
      status: status || 'livre',
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao cadastrar mesa' });
  }
});

apiRouter.put('/mesas/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await mesaService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Mesa não encontrada' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const { identificador, qrCode, status } = req.body;
    const updated = await mesaService.update(req.params.id, {
      ...(identificador ? { identificador: identificador.trim() } : {}),
      ...(qrCode ? { qrCode: qrCode.trim() } : {}),
      ...(status ? { status } : {}),
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar mesa' });
  }
});

apiRouter.delete('/mesas/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await mesaService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Mesa não encontrada' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const deleted = await mesaService.delete(req.params.id);
    res.json({ message: 'Mesa excluída com sucesso', deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir mesa' });
  }
});

// ==========================================
// 5. PULSEIRA CRUD
// ==========================================
apiRouter.get('/pulseiras', async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId } = req.query;
    const targetEst = typeof estabelecimentoId === 'string' ? estabelecimentoId : undefined;
    if (targetEst && !validateTenantAccess(req, targetEst)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await pulseiraService.getAll(targetEst);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar pulseiras' });
  }
});

apiRouter.get('/pulseiras/:id', async (req: Request, res: Response) => {
  try {
    const item = await pulseiraService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Pulseira não encontrada' });
    if (!validateTenantAccess(req, item.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar pulseira' });
  }
});

apiRouter.post('/pulseiras', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, codigoQr } = req.body;
    if (!estabelecimentoId || !codigoQr?.trim()) {
      return res.status(400).json({
        error: 'estabelecimentoId e codigoQr são obrigatórios',
      });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    const created = await pulseiraService.create({
      estabelecimentoId,
      codigoQr: codigoQr.trim(),
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao cadastrar pulseira' });
  }
});

apiRouter.put('/pulseiras/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await pulseiraService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Pulseira não encontrada' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const { codigoQr } = req.body;
    if (!codigoQr?.trim()) {
      return res.status(400).json({ error: 'O codigoQr é obrigatório' });
    }
    const updated = await pulseiraService.update(req.params.id, {
      codigoQr: codigoQr.trim(),
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar pulseira' });
  }
});

apiRouter.delete('/pulseiras/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await pulseiraService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Pulseira não encontrada' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const deleted = await pulseiraService.delete(req.params.id);
    res.json({ message: 'Pulseira excluída com sucesso', deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir pulseira' });
  }
});

// ==========================================
// 6. CLIENTE CRUD
// ==========================================
apiRouter.get('/clientes', async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, search } = req.query;
    const targetEst = typeof estabelecimentoId === 'string' ? estabelecimentoId : undefined;
    if (targetEst && !validateTenantAccess(req, targetEst)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await clienteService.getAll(
      targetEst,
      typeof search === 'string' ? search : undefined
    );
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar clientes' });
  }
});

apiRouter.get('/clientes/:id', async (req: Request, res: Response) => {
  try {
    const item = await clienteService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (!validateTenantAccess(req, item.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar cliente' });
  }
});

apiRouter.post('/clientes', async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, nome, celular, email } = req.body;
    if (!estabelecimentoId || !nome?.trim() || !celular?.trim()) {
      return res.status(400).json({
        error: 'estabelecimentoId, nome e celular são obrigatórios. (Sem CPF)',
      });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    const created = await clienteService.create({
      estabelecimentoId,
      nome: nome.trim(),
      celular: celular.trim(),
      email: email?.trim(),
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao cadastrar cliente' });
  }
});

apiRouter.put('/clientes/:id', async (req: Request, res: Response) => {
  try {
    const existing = await clienteService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const { nome, celular, email } = req.body;
    const updated = await clienteService.update(req.params.id, {
      ...(nome ? { nome: nome.trim() } : {}),
      ...(celular ? { celular: celular.trim() } : {}),
      ...(email !== undefined ? { email: email ? email.trim() : null } : {}),
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar cliente' });
  }
});

apiRouter.delete('/clientes/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await clienteService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const deleted = await clienteService.delete(req.params.id);
    res.json({ message: 'Cliente excluído com sucesso', deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir cliente' });
  }
});

// ==========================================
// 7. ITEM DE CARDAPIO CRUD
// ==========================================
apiRouter.get('/itens-cardapio', async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId } = req.query;
    const targetEst = typeof estabelecimentoId === 'string' ? estabelecimentoId : undefined;
    if (targetEst && !validateTenantAccess(req, targetEst)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await itemCardapioService.getAll(targetEst);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar itens do cardápio' });
  }
});

apiRouter.get('/itens-cardapio/:id', async (req: Request, res: Response) => {
  try {
    const item = await itemCardapioService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item de cardápio não encontrado' });
    if (!validateTenantAccess(req, item.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar item de cardápio' });
  }
});

apiRouter.post('/itens-cardapio', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, pontoDePreparoId, nome, preco } = req.body;
    if (!estabelecimentoId || !pontoDePreparoId || !nome?.trim() || preco === undefined) {
      return res.status(400).json({
        error: 'estabelecimentoId, pontoDePreparoId, nome e preco são obrigatórios',
      });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    const numPreco = Number(preco);
    if (isNaN(numPreco) || numPreco < 0) {
      return res.status(400).json({ error: 'Preço deve ser um número válido e positivo' });
    }
    const created = await itemCardapioService.create({
      estabelecimentoId,
      pontoDePreparoId,
      nome: nome.trim(),
      preco: numPreco,
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar item de cardápio' });
  }
});

apiRouter.put('/itens-cardapio/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await itemCardapioService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Item de cardápio não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const { pontoDePreparoId, nome, preco } = req.body;
    const numPreco = preco !== undefined ? Number(preco) : undefined;
    if (numPreco !== undefined && (isNaN(numPreco) || numPreco < 0)) {
      return res.status(400).json({ error: 'Preço deve ser um número válido e positivo' });
    }
    const updated = await itemCardapioService.update(req.params.id, {
      ...(pontoDePreparoId ? { pontoDePreparoId } : {}),
      ...(nome ? { nome: nome.trim() } : {}),
      ...(numPreco !== undefined ? { preco: numPreco } : {}),
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar item de cardápio' });
  }
});

apiRouter.delete('/itens-cardapio/:id', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await itemCardapioService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Item de cardápio não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const deleted = await itemCardapioService.delete(req.params.id);
    res.json({ message: 'Item de cardápio excluído com sucesso', deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir item de cardápio' });
  }
});

// ==========================================
// 8. EVENTOS OPERACIONAIS
// ==========================================
apiRouter.get('/eventos', async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId } = req.query;
    if (!estabelecimentoId || typeof estabelecimentoId !== 'string') {
      return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await eventoService.getAll(estabelecimentoId);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar eventos' });
  }
});

apiRouter.get('/eventos/ativo', async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId } = req.query;
    if (!estabelecimentoId || typeof estabelecimentoId !== 'string') {
      return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const active = await eventoService.getActive(estabelecimentoId);
    res.json(active);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar evento ativo' });
  }
});

apiRouter.post('/eventos', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, nome, dataInicio, modoRebalanceamento } = req.body;
    if (!estabelecimentoId || !nome?.trim()) {
      return res.status(400).json({ error: 'estabelecimentoId e nome são obrigatórios' });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    const created = await eventoService.create({
      estabelecimentoId,
      nome: nome.trim(),
      dataInicio,
      modoRebalanceamento,
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar evento' });
  }
});

apiRouter.put('/eventos/:id/encerrar', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await eventoService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Evento não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const closed = await eventoService.close(req.params.id);
    res.json(closed);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao encerrar evento' });
  }
});

// ==========================================
// 9. VÍNCULOS DE PULSEIRA AO EVENTO
// ==========================================
apiRouter.get('/vinculos-pulseira', async (req: Request, res: Response) => {
  try {
    const { eventoId } = req.query;
    if (!eventoId || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'eventoId é obrigatório' });
    }
    const ev = await eventoService.getById(eventoId);
    if (ev && !validateTenantAccess(req, ev.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await vinculoPulseiraService.getByEvento(eventoId);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar vínculos de pulseira' });
  }
});

apiRouter.post('/vinculos-pulseira', async (req: Request, res: Response) => {
  try {
    const { pulseiraId, clienteId, eventoId, mesaId } = req.body;
    if (!pulseiraId || !clienteId || !eventoId) {
      return res.status(400).json({ error: 'pulseiraId, clienteId e eventoId são obrigatórios' });
    }
    const ev = await eventoService.getById(eventoId);
    if (!ev) return res.status(404).json({ error: 'Evento não encontrado' });
    if (!validateTenantAccess(req, ev.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    const vinculo = await vinculoPulseiraService.create({
      pulseiraId,
      clienteId,
      eventoId,
      mesaId,
    });
    res.status(201).json(vinculo);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao vincular pulseira' });
  }
});

apiRouter.get('/vinculos-pulseira/buscar-qr', async (req: Request, res: Response) => {
  try {
    const { codigoQr, eventoId } = req.query;
    if (!codigoQr || !eventoId || typeof codigoQr !== 'string' || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'codigoQr e eventoId são obrigatórios' });
    }
    const ev = await eventoService.getById(eventoId);
    if (ev && !validateTenantAccess(req, ev.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const found = await vinculoPulseiraService.getActiveByPulseiraQr(codigoQr, eventoId);
    if (!found) {
      return res.status(404).json({ error: 'Nenhum vínculo ativo encontrado para este QR de pulseira' });
    }
    res.json(found);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar vínculo por QR' });
  }
});

// ==========================================
// 10. MONITOR DE COMANDAS
// ==========================================
apiRouter.get('/comandas', async (req: Request, res: Response) => {
  try {
    const { eventoId, status } = req.query;
    if (!eventoId || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'eventoId é obrigatório' });
    }
    const ev = await eventoService.getById(eventoId);
    if (ev && !validateTenantAccess(req, ev.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const list = await comandaService.getAll(
      eventoId,
      status === 'aberta' || status === 'fechada' ? status : undefined
    );
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar comandas' });
  }
});

apiRouter.get('/comandas/buscar-pulseira', async (req: Request, res: Response) => {
  try {
    const { codigoQr, eventoId } = req.query;
    if (!codigoQr || !eventoId || typeof codigoQr !== 'string' || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'codigoQr e eventoId são obrigatórios' });
    }
    const ev = await eventoService.getById(eventoId);
    if (ev && !validateTenantAccess(req, ev.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const cmd = await comandaService.findByPulseiraQr(codigoQr, eventoId);
    if (!cmd) {
      return res.status(404).json({ error: 'Nenhuma comanda aberta encontrada para esta pulseira' });
    }
    res.json(cmd);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar comanda por pulseira' });
  }
});

apiRouter.get('/comandas/por-mesa/:mesaId', async (req: Request, res: Response) => {
  try {
    const { mesaId } = req.params;
    const { eventoId } = req.query;
    if (!mesaId || !eventoId || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'mesaId e eventoId são obrigatórios' });
    }

    const m = await mesaService.getById(mesaId);
    if (m && !validateTenantAccess(req, m.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    const openCmd = await comandaService.findByMesa(mesaId, eventoId);
    if (!openCmd) {
      return res.json({ liberada: false, comanda: null });
    }

    res.json({ liberada: true, comanda: openCmd });
  } catch (error: any) {
    console.error('Erro ao buscar comanda por mesa:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar comanda por mesa' });
  }
});

apiRouter.get('/comandas/:id', async (req: Request, res: Response) => {
  try {
    const cmd = await comandaService.getById(req.params.id);
    if (!cmd) return res.status(404).json({ error: 'Comanda não encontrada' });
    if (!validateTenantAccess(req, cmd.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    res.json(cmd);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar detalhes da comanda' });
  }
});

apiRouter.post('/comandas', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const { eventoId, tipoAtendimento, vinculoPulseiraEventoId, mesaId, garcomResponsavelId } = req.body;
    if (!eventoId || !tipoAtendimento) {
      return res.status(400).json({ error: 'eventoId e tipoAtendimento são obrigatórios' });
    }
    const ev = await eventoService.getById(eventoId);
    if (!ev) return res.status(404).json({ error: 'Evento não encontrado' });
    if (!validateTenantAccess(req, ev.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }
    if (tipoAtendimento === 'pulseira' && !vinculoPulseiraEventoId) {
      return res.status(400).json({ error: 'vinculoPulseiraEventoId é obrigatório para atendimento por pulseira' });
    }
    if (tipoAtendimento === 'mesa' && !mesaId) {
      return res.status(400).json({ error: 'mesaId é obrigatório para atendimento por mesa' });
    }

    const created = await comandaService.create({
      eventoId,
      tipoAtendimento,
      vinculoPulseiraEventoId,
      mesaId,
      garcomResponsavelId,
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao abrir comanda' });
  }
});

apiRouter.put('/comandas/:id/status', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const cmd = await comandaService.getById(req.params.id);
    if (!cmd) return res.status(404).json({ error: 'Comanda não encontrada' });
    if (!validateTenantAccess(req, cmd.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const { status } = req.body;
    if (status !== 'aberta' && status !== 'fechada') {
      return res.status(400).json({ error: 'Status deve ser "aberta" ou "fechada"' });
    }
    const updated = await comandaService.updateStatus(req.params.id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar status da comanda' });
  }
});

// ==========================================
// 11. LANÇAMENTO RÁPIDO, AUTOATENDIMENTO & VERIFICAÇÃO DE TELEFONE
// ==========================================

// Rota pública segura para o autoatendimento localizar mesa pelo QR token de alta entropia
apiRouter.get('/cliente/mesa-por-qr', autoatendimentoRateLimiter, async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.query;
    if (!qrCode || typeof qrCode !== 'string') {
      return res.status(400).json({ error: 'QR Code da mesa é obrigatório.' });
    }
    const mesaFound = await mesaService.getByQrCode(qrCode);
    if (!mesaFound) {
      return res.status(404).json({ error: 'Mesa não encontrada com o QR code fornecido.' });
    }
    res.json({ mesa: mesaFound });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar mesa pelo QR code.' });
  }
});

// Rota pública segura para solicitar envio de código de 6 dígitos no autoatendimento
apiRouter.post('/cliente/solicitar-codigo', autoatendimentoRateLimiter, async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, mesaId, comandaId, telefone, canal } = req.body;
    if (!estabelecimentoId || !telefone) {
      return res.status(400).json({ error: 'estabelecimentoId e telefone são obrigatórios.' });
    }

    const resultado = await telefoneVerificacaoService.solicitarCodigo({
      estabelecimentoId,
      mesaId,
      comandaId,
      telefone,
      canal,
      ip: req.ip || req.socket.remoteAddress || undefined,
    });

    // Regra: "o código aparece só no log do servidor e numa tela de depuração do gerente"
    const { codigoDebug, ...respostaCliente } = resultado;
    res.status(200).json(respostaCliente);
  } catch (error: any) {
    console.error('Erro ao solicitar código de verificação:', error);
    res.status(400).json({ error: error.message || 'Erro ao enviar código de verificação' });
  }
});

// Rota pública segura para validar o código de 6 dígitos digitado pelo cliente
apiRouter.post('/cliente/verificar-codigo', autoatendimentoRateLimiter, async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, mesaId, comandaId, telefone, codigo } = req.body;
    if (!estabelecimentoId || !telefone || !codigo) {
      return res.status(400).json({ error: 'estabelecimentoId, telefone e codigo são obrigatórios.' });
    }

    const resultado = await telefoneVerificacaoService.verificarCodigo({
      estabelecimentoId,
      mesaId,
      comandaId,
      telefone,
      codigo,
    });

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro ao verificar código:', error);
    res.status(400).json({ error: error.message || 'Código de verificação incorreto ou expirado' });
  }
});

// Checa status de verificação da sessão da mesa (sem vazar dados de clientes)
apiRouter.get('/cliente/sessao-mesa', autoatendimentoRateLimiter, async (req: Request, res: Response) => {
  try {
    const { mesaId, eventoId } = req.query;
    if (!mesaId || !eventoId || typeof mesaId !== 'string' || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'mesaId e eventoId são obrigatórios.' });
    }

    const status = await telefoneVerificacaoService.getStatusSessaoMesa(mesaId, eventoId);
    res.json(status);
  } catch (error: any) {
    console.error('Erro ao consultar sessão da mesa:', error);
    res.status(500).json({ error: error.message || 'Erro ao consultar sessão da mesa' });
  }
});

const handleLancamentoRapido = async (req: Request, res: Response) => {
  try {
    const {
      comandaId,
      origem,
      criadoPor,
      itens,
      telefone,
      codigoNaoRecebido,
      confirmadoPresencialmente,
      telefoneVerificado: reqTelVerificado,
    } = req.body;

    if (!comandaId || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'comandaId e itens são obrigatórios' });
    }

    const cmd = await comandaService.getById(comandaId);
    if (!cmd) return res.status(404).json({ error: 'Comanda não encontrada' });

    if (origem !== 'autoatendimento') {
      const callerUser = (req as AuthRequest).user;
      if (!callerUser) {
        return res.status(401).json({ error: 'Não autenticado' });
      }
      const allowed = ['garcom', 'gerente', 'operador_balcao'];
      if (!allowed.includes(callerUser.papel)) {
        return res.status(403).json({ error: `Acesso negado para o papel "${callerUser.papel}".` });
      }
      if (!validateTenantAccess(req, cmd.estabelecimentoId)) {
        return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
      }
    }

    let telVerificado = false;
    let confPresencial = false;
    let metodoVerif: 'sms' | 'whatsapp' | 'presencial' | undefined = undefined;

    if (origem === 'autoatendimento') {
      if (codigoNaoRecebido) {
        // Cliente tocou em "Não recebi o código": pedido segue desmarcado para confirmação presencial
        telVerificado = false;
        confPresencial = false;
        metodoVerif = undefined;
      } else {
        // Checar se a comanda/sessão da mesa já está verificada
        const isCmdVerificado = Boolean(cmd.telefoneVerificado || reqTelVerificado);
        if (isCmdVerificado) {
          telVerificado = true;
          metodoVerif = (cmd.verificacaoMetodo as any) || 'sms';
        } else {
          // Telefone não verificado e não informou que não recebeu
          telVerificado = false;
        }
      }
    } else {
      // Pedidos criados pelo garçom / operador de balcão nascem validados
      telVerificado = true;
      confPresencial = true;
      metodoVerif = 'presencial';
    }

    const resultado = await pedidoService.createWithRouting({
      comandaId,
      origem: origem || 'operador_balcao',
      criadoPor,
      itens,
      telefoneVerificado: telVerificado,
      confirmadoPresencialmente: Boolean(confirmadoPresencialmente || confPresencial),
      verificacaoMetodo: metodoVerif,
    });

    res.status(201).json(resultado);
  } catch (error: any) {
    console.error('Erro no lançamento de pedido:', error);
    res.status(500).json({ error: error.message || 'Erro ao lançar pedido' });
  }
};

// Rota pública para envio de pedido pelo cliente via autoatendimento (mesa QR)
apiRouter.post('/cliente/pedido', autoatendimentoRateLimiter, async (req: Request, res: Response) => {
  req.body = { ...req.body, origem: 'autoatendimento' };
  return handleLancamentoRapido(req, res);
});

// Lançamento rápido de pedidos (Balcão e Autoatendimento)
apiRouter.post('/pedidos/lancamento-rapido', autoatendimentoRateLimiter, handleLancamentoRapido);

// Validação de pedido de mesa pelo garçom (com ou sem confirmação presencial de telefone)
apiRouter.post('/pedidos/:id/validar', requireAuth, requireRole(['garcom', 'gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const callerUser = (req as AuthRequest).user;
    const callerEstId = getCallerTenantId(req);
    const { confirmadoPresencialmente } = req.body;

    if (!callerUser || !callerEstId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const resultado = await telefoneVerificacaoService.validarPedidoPresencial({
      pedidoId: req.params.id,
      garcomId: callerUser.userId || callerUser.id || '',
      confirmadoPresencialmente: Boolean(confirmadoPresencialmente),
      estabelecimentoId: callerEstId,
    });

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro ao validar pedido:', error);
    res.status(400).json({ error: error.message || 'Erro ao validar pedido' });
  }
});

// Recusa de pedido pelo garçom (não gera nada no KDS)
apiRouter.post('/pedidos/:id/recusar', requireAuth, requireRole(['garcom', 'gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const callerUser = (req as AuthRequest).user;
    const callerEstId = getCallerTenantId(req);
    const { motivoRecusa } = req.body;

    if (!callerUser || !callerEstId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const resultado = await pedidoService.recusarPedido({
      pedidoId: req.params.id,
      garcomId: callerUser.userId || callerUser.id || '',
      motivoRecusa: motivoRecusa || 'Recusado pelo garçom.',
      estabelecimentoId: callerEstId,
    });

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro ao recusar pedido:', error);
    res.status(400).json({ error: error.message || 'Erro ao recusar pedido' });
  }
});

// Listar pedidos de autoatendimento aguardando validação pelo garçom
apiRouter.get('/pedidos/aguardando-validacao', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventoId } = req.query;
    if (!eventoId || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'eventoId é obrigatório' });
    }
    const callerUser = (req as AuthRequest).user;
    const callerEstId = getCallerTenantId(req);
    if (!callerEstId) {
      return res.status(401).json({ error: 'Estabelecimento não identificado.' });
    }
    const garcomId = callerUser?.papel === 'garcom' ? (callerUser.userId || callerUser.id) : undefined;
    const pedidos = await pedidoService.getPedidosAguardandoValidacao(eventoId, callerEstId, garcomId);
    res.json(pedidos);
  } catch (error: any) {
    console.error('Erro ao listar pedidos aguardando validação:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar pedidos aguardando validação' });
  }
});

// Tela de depuração do gerente: visualização dos códigos simulados enviados recentemente
// Regra: Tela de depuração e log de códigos desativados quando houver provedor real ou em produção
apiRouter.get('/debug/ultimos-codigos-sms', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    if (!envioCodigoService.isDepuracaoAtiva()) {
      return res.json({
        desativado: true,
        motivo: 'Modo simulado de depuração desativado (provedor real configurado ou ambiente de produção).',
        codigos: [],
      });
    }
    const callerEstId = getCallerTenantId(req);
    const codigos = envioCodigoService.getUltimosCodigosSimulados(callerEstId || undefined);
    res.json(codigos);
  } catch (error: any) {
    console.error('Erro ao listar códigos de depuração:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar códigos de depuração' });
  }
});

// Configuração do canal de verificação padrão do estabelecimento (SMS ou WhatsApp)
apiRouter.put('/estabelecimentos/:id/canal-verificacao', requireAuth, requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { canal } = req.body;
    if (canal !== 'sms' && canal !== 'whatsapp') {
      return res.status(400).json({ error: 'Canal deve ser "sms" ou "whatsapp".' });
    }
    if (!validateTenantAccess(req, req.params.id)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    const updated = await estabelecimentoService.update(req.params.id, {
      canalVerificacaoPadrao: canal,
    } as any);

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar canal de verificação:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar canal de verificação' });
  }
});

apiRouter.put('/pedidos-itens/:id/status', async (req: Request, res: Response) => {
  try {
    const existing = await pedidoService.getItemById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Item de pedido não encontrado' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    const { status } = req.body;
    const valid = ['pendente', 'em_preparo', 'pronto', 'visto', 'entregue'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Deve ser um de: ${valid.join(', ')}` });
    }

    const updated = await pedidoService.updateItemStatus(req.params.id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar status do item no KDS' });
  }
});

apiRouter.get('/kds/fila', async (req: Request, res: Response) => {
  try {
    const { pontoDePreparoId, eventoId } = req.query;
    const items = await pedidoService.getKdsItems(
      typeof pontoDePreparoId === 'string' ? pontoDePreparoId : undefined,
      typeof eventoId === 'string' ? eventoId : undefined
    );
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao consultar fila do KDS' });
  }
});

// ==========================================
// 12. FECHAMENTO & RATEIO DE CONTAS
// ==========================================
apiRouter.get('/comandas/:id/previa-fechamento', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const cmd = await comandaService.getById(req.params.id);
    if (!cmd) return res.status(404).json({ error: 'Comanda não encontrada' });
    if (!validateTenantAccess(req, cmd.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const previa = await fechamentoService.getPrevia(req.params.id);
    res.json(previa);
  } catch (error: any) {
    console.error('Erro na prévia de fechamento:', error);
    res.status(500).json({ error: error.message || 'Erro ao calcular prévia de fechamento' });
  }
});

apiRouter.post('/comandas/:id/fechar-pagamento', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const cmd = await comandaService.getById(req.params.id);
    if (!cmd) return res.status(404).json({ error: 'Comanda não encontrada' });
    if (!validateTenantAccess(req, cmd.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    // PCI Compliance: Never accept card numbers, expiration or CVV
    if (
      req.body.numeroCartao ||
      req.body.numero_cartao ||
      req.body.cartao ||
      req.body.cvv ||
      req.body.validade
    ) {
      return res.status(400).json({
        error: 'Por conformidade de segurança e PCI, dados sensíveis de cartão (número, validade, CVV) nunca podem ser enviados ou armazenados.',
      });
    }

    const {
      metodo,
      tipoContribuicao,
      valorContribuicao,
      valorRecebido,
      bandeira,
      nsu,
      idempotencyKey,
      garcomId,
    } = req.body;

    const validMetodos = ['pix', 'cartao_credito', 'cartao_debito', 'credito', 'debito', 'dinheiro'];
    if (!validMetodos.includes(metodo)) {
      return res.status(400).json({
        error: 'Método de pagamento inválido. Escolha entre: pix, credito, debito ou dinheiro.',
      });
    }

    const validContribuicoes = ['taxa_servico_10', 'gorjeta_livre', 'nenhuma'];
    if (tipoContribuicao && !validContribuicoes.includes(tipoContribuicao)) {
      return res.status(400).json({
        error: 'Tipo de contribuição inválido. Escolha entre: taxa_servico_10, gorjeta_livre ou nenhuma.',
      });
    }

    const callerUser = (req as AuthRequest).user;
    const finalIdempotencyKey = idempotencyKey || (req.headers['idempotency-key'] as string);

    const resultado = await fechamentoService.fecharComandaEfetuarPagamento({
      comandaId: req.params.id,
      metodo,
      tipoContribuicao: tipoContribuicao || 'taxa_servico_10',
      valorContribuicao: valorContribuicao ? Number(valorContribuicao) : undefined,
      valorRecebido: valorRecebido !== undefined ? Number(valorRecebido) : undefined,
      bandeira,
      nsu,
      idempotencyKey: finalIdempotencyKey,
      garcomId: garcomId || callerUser?.id,
      registradoPor: callerUser?.id,
    });

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro no fechamento da comanda:', error);
    res.status(500).json({ error: error.message || 'Erro ao fechar comanda e efetuar pagamento' });
  }
});

apiRouter.post('/comandas/:id/recibo-whatsapp', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const cmd = await comandaService.getById(req.params.id);
    if (!cmd) return res.status(404).json({ error: 'Comanda não encontrada' });
    if (!validateTenantAccess(req, cmd.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const result = await reciboEnvioService.gerarReciboWhatsApp(req.params.id);
    res.json(result);
  } catch (error: any) {
    console.error('Erro ao gerar recibo WhatsApp:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar recibo WhatsApp' });
  }
});

apiRouter.get('/relatorios/rateios', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId, eventoId } = req.query;
    if (!estabelecimentoId || typeof estabelecimentoId !== 'string') {
      return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    const relatorio = await fechamentoService.getRelatorioRateios(
      estabelecimentoId,
      typeof eventoId === 'string' ? eventoId : undefined
    );
    res.json(relatorio);
  } catch (error: any) {
    console.error('Erro ao gerar relatório de rateios:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar relatório de rateios' });
  }
});

// ==========================================
// 12.1 COBRANÇAS MANUAIS, CAIXA DO GARÇOM E CONCILIAÇÃO
// ==========================================

// Registrar cobrança manual avulsa/direta
apiRouter.post('/cobrancas/registrar-manual', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const { comandaId, metodo, tipoContribuicao, valorContribuicao, valorRecebido, bandeira, nsu, idempotencyKey, garcomId } = req.body;
    if (!comandaId) return res.status(400).json({ error: 'comandaId é obrigatório' });

    const cmd = await comandaService.getById(comandaId);
    if (!cmd) return res.status(404).json({ error: 'Comanda não encontrada' });
    if (!validateTenantAccess(req, cmd.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    // PCI Compliance: Never accept or store card numbers, validity, or CVV
    if (req.body.numeroCartao || req.body.numero_cartao || req.body.cvv || req.body.validade) {
      return res.status(400).json({
        error: 'Por conformidade de segurança e PCI, dados sensíveis de cartão (número, validade, CVV) nunca podem ser enviados ou armazenados.',
      });
    }

    const callerUser = (req as AuthRequest).user;
    const finalIdempotencyKey = idempotencyKey || (req.headers['idempotency-key'] as string);

    const resultado = await cobrancaService.createCobrancaManual({
      comandaId,
      metodo: metodo || 'dinheiro',
      tipoContribuicao: tipoContribuicao || 'taxa_servico_10',
      valorContribuicao: valorContribuicao ? Number(valorContribuicao) : undefined,
      valorRecebido: valorRecebido !== undefined ? Number(valorRecebido) : undefined,
      bandeira,
      nsu,
      idempotencyKey: finalIdempotencyKey,
      garcomId: garcomId || callerUser?.id,
      registradoPor: callerUser?.id,
      estabelecimentoId: cmd.estabelecimentoId,
    });

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro ao registrar cobrança manual:', error);
    res.status(400).json({ error: error.message || 'Erro ao registrar cobrança manual' });
  }
});

// Estorno de cobrança (apenas gerente com motivo obrigatório)
apiRouter.post('/cobrancas/:id/estornar', requireAuth, requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    if (!motivo || !motivo.trim()) {
      return res.status(400).json({ error: 'Motivo do estorno é obrigatório.' });
    }

    const cob = await cobrancaService.getById(req.params.id);
    if (!cob) return res.status(404).json({ error: 'Cobrança não encontrada.' });
    if (!validateTenantAccess(req, cob.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: cobrança pertence a outro estabelecimento.' });
    }

    const callerUser = (req as AuthRequest).user;
    const resultado = await cobrancaService.estornar({
      cobrancaId: req.params.id,
      usuarioId: callerUser?.id || '',
      papel: callerUser?.papel || 'gerente',
      motivo: motivo.trim(),
      estabelecimentoId: cob.estabelecimentoId,
    });

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro ao estornar cobrança:', error);
    res.status(400).json({ error: error.message || 'Erro ao estornar cobrança' });
  }
});

// Buscar cobranças de uma comanda
apiRouter.get('/cobrancas/comanda/:id', async (req: Request, res: Response) => {
  try {
    const cobrancas = await cobrancaService.getByComandaId(req.params.id);
    res.json(cobrancas);
  } catch (error: any) {
    console.error('Erro ao buscar cobranças da comanda:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar cobranças da comanda' });
  }
});

// Abertura de caixa do garçom pelo gerente
apiRouter.post('/caixas-garcom/abrir', requireAuth, requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const { eventoId, garcomId, fundoTrocoInicial } = req.body;
    if (!eventoId || !garcomId) {
      return res.status(400).json({ error: 'eventoId e garcomId são obrigatórios.' });
    }

    const callerEstId = getCallerTenantId(req) || req.body.estabelecimentoId;
    if (!callerEstId) return res.status(400).json({ error: 'Estabelecimento não identificado.' });

    const callerUser = (req as AuthRequest).user;
    const caixa = await caixaGarcomService.abrir({
      eventoId,
      garcomId,
      fundoTrocoInicial: Number(fundoTrocoInicial || 0),
      abertoPor: callerUser?.id || '',
      estabelecimentoId: callerEstId,
    });

    res.status(201).json({ sucesso: true, caixa });
  } catch (error: any) {
    console.error('Erro ao abrir caixa do garçom:', error);
    res.status(400).json({ error: error.message || 'Erro ao abrir caixa do garçom' });
  }
});

// Registrar sangria de caixa
apiRouter.post('/caixas-garcom/:id/sangria', requireAuth, requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const { valor, motivo } = req.body;
    if (!valor || Number(valor) <= 0) {
      return res.status(400).json({ error: 'Valor da sangria deve ser maior que zero.' });
    }

    const callerEstId = getCallerTenantId(req) || (req.body.estabelecimentoId as string);
    const callerUser = (req as AuthRequest).user;

    const sangria = await caixaGarcomService.registrarSangria({
      caixaId: req.params.id,
      valor: Number(valor),
      registradaPor: callerUser?.id || '',
      motivo: motivo || undefined,
      estabelecimentoId: callerEstId || '',
    });

    res.status(201).json({ sucesso: true, sangria });
  } catch (error: any) {
    console.error('Erro ao registrar sangria:', error);
    res.status(400).json({ error: error.message || 'Erro ao registrar sangria' });
  }
});

// Fechar caixa do garçom (garçom declara dinheiro)
apiRouter.post('/caixas-garcom/:id/fechar', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const { dinheiroDeclarado } = req.body;
    if (dinheiroDeclarado === undefined || dinheiroDeclarado === null) {
      return res.status(400).json({ error: 'dinheiroDeclarado é obrigatório no fechamento do caixa.' });
    }

    const callerEstId = getCallerTenantId(req) || req.body.estabelecimentoId;
    const resultado = await caixaGarcomService.fechar({
      caixaId: req.params.id,
      dinheiroDeclarado: Number(dinheiroDeclarado),
      estabelecimentoId: callerEstId || '',
    });

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro ao fechar caixa do garçom:', error);
    res.status(400).json({ error: error.message || 'Erro ao fechar caixa do garçom' });
  }
});

// Consultar status do caixa do garçom (dinheiro em mãos, limite e alerta de sangria)
apiRouter.get('/caixas-garcom/status', async (req: Request, res: Response) => {
  try {
    const { garcomId, eventoId } = req.query;
    if (!garcomId || !eventoId || typeof garcomId !== 'string' || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'garcomId e eventoId são obrigatórios.' });
    }

    const callerEstId = getCallerTenantId(req) || (req.query.estabelecimentoId as string);
    const status = await caixaGarcomService.getStatus(garcomId, eventoId, callerEstId || '');
    res.json(status);
  } catch (error: any) {
    console.error('Erro ao consultar status do caixa do garçom:', error);
    res.status(500).json({ error: error.message || 'Erro ao consultar status do caixa' });
  }
});

// Listar caixas por evento
apiRouter.get('/caixas-garcom/evento/:eventoId', requireAuth, async (req: Request, res: Response) => {
  try {
    const callerEstId = getCallerTenantId(req) || (req.query.estabelecimentoId as string);
    const caixas = await caixaGarcomService.listPorEvento(req.params.eventoId, callerEstId || '');
    res.json(caixas);
  } catch (error: any) {
    console.error('Erro ao listar caixas do evento:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar caixas' });
  }
});

// Relatório de Conciliação para o Painel do Gerente
apiRouter.get('/conciliacao/relatorio', requireAuth, requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { eventoId, maquinaCredito, maquinaDebito } = req.query;
    if (!eventoId || typeof eventoId !== 'string') {
      return res.status(400).json({ error: 'eventoId é obrigatório.' });
    }

    const callerEstId = getCallerTenantId(req) || (req.query.estabelecimentoId as string);
    if (!callerEstId) return res.status(400).json({ error: 'Estabelecimento não identificado.' });

    const relatorio = await conciliacaoService.getRelatorio(
      eventoId,
      callerEstId,
      {
        credito: maquinaCredito ? Number(maquinaCredito) : undefined,
        debito: maquinaDebito ? Number(maquinaDebito) : undefined,
      }
    );

    res.json(relatorio);
  } catch (error: any) {
    console.error('Erro ao gerar relatório de conciliação:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar relatório de conciliação' });
  }
});

// ==========================================
// 13. PULSEIRA PERDIDA (MULTA 30 MIN 1X / 5X)
// ==========================================

// 13.1 Busca de clientes por número de celular (com proteção antifraude e rate limiting)
const handleBuscarPorCelular = async (req: Request, res: Response) => {
  try {
    const celular = (req.query.celular || req.body.celular) as string | undefined;
    const eventoId = (req.query.eventoId || req.body.eventoId) as string | undefined;

    if (!celular || typeof celular !== 'string' || !celular.trim()) {
      return res.status(400).json({ error: 'Número de celular é obrigatório para busca.' });
    }

    const callerEstId =
      getCallerTenantId(req) ||
      (req.query.estabelecimentoId as string) ||
      (req.body.estabelecimentoId as string);

    if (!callerEstId) {
      return res.status(400).json({ error: 'Estabelecimento não identificado.' });
    }

    // Mascarar o celular nos logs para conformidade com privacidade
    console.log(
      `[Pulseira Perdida] Busca por celular: ${mascararCelular(celular)} (evento: ${eventoId || 'ativo'}, est: ${callerEstId})`
    );

    const resultados = await multaPulseiraService.buscarPorCelular(
      celular,
      callerEstId,
      typeof eventoId === 'string' ? eventoId : undefined
    );

    res.json(resultados);
  } catch (error: any) {
    console.error('Erro ao buscar cliente por celular para pulseira perdida:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar vínculos por celular.' });
  }
};

apiRouter.get('/pulseiras-perdidas/buscar-por-celular', requireRole(['gerente', 'operador_balcao']), buscaCelularRateLimiter, handleBuscarPorCelular);
apiRouter.post('/pulseiras-perdidas/buscar-por-celular', requireRole(['gerente', 'operador_balcao']), buscaCelularRateLimiter, handleBuscarPorCelular);

// 13.2 Iniciar tolerância de 30 minutos (Idempotente, valida tenant/evento, grava horário do servidor e audita)
const handleIniciarToleranciaPerda = async (req: Request, res: Response) => {
  try {
    const { vinculoPulseiraEventoId, eventoId } = req.body;
    if (!vinculoPulseiraEventoId) {
      return res.status(400).json({ error: 'vinculoPulseiraEventoId é obrigatório' });
    }
    const vinc = await vinculoPulseiraService.getById(vinculoPulseiraEventoId);
    if (!vinc) {
      return res.status(404).json({ error: 'Vínculo de pulseira não encontrado' });
    }
    if (!validateTenantAccess(req, vinc.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    if (eventoId && vinc.eventoId !== eventoId) {
      return res.status(400).json({ error: 'O vínculo não pertence ao evento informado.' });
    }

    const authReq = req as AuthRequest;
    const callerInfo = authReq.user
      ? { nome: authReq.user.nome, papel: authReq.user.papel }
      : undefined;

    const registro = await multaPulseiraService.iniciarTolerancia(
      vinculoPulseiraEventoId,
      vinc.estabelecimentoId,
      authReq.user?.userId,
      callerInfo
    );

    res.status(201).json(registro);
  } catch (error: any) {
    console.error('Erro ao iniciar tolerância de pulseira perdida:', error);
    res.status(500).json({ error: error.message || 'Erro ao iniciar tolerância de pulseira perdida' });
  }
};

apiRouter.post('/pulseiras-perdidas/iniciar-tolerancia', requireRole(['gerente', 'operador_balcao']), handleIniciarToleranciaPerda);
apiRouter.post('/pulseiras-perdidas/comunicar', requireRole(['gerente', 'operador_balcao']), handleIniciarToleranciaPerda);

apiRouter.get('/pulseiras-perdidas/calculo/:vinculoId', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const vinc = await vinculoPulseiraService.getById(req.params.vinculoId);
    if (!vinc) return res.status(404).json({ error: 'Nenhum registro de vínculo encontrado' });
    if (!validateTenantAccess(req, vinc.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const calculo = await multaPulseiraService.getCalculoMulta(req.params.vinculoId);
    if (!calculo) return res.status(404).json({ error: 'Nenhum registro de perda encontrado para este vínculo' });
    res.json(calculo);
  } catch (error: any) {
    console.error('Erro ao calcular multa de pulseira:', error);
    res.status(500).json({ error: error.message || 'Erro ao calcular multa de pulseira' });
  }
});

apiRouter.get('/pulseiras-perdidas', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const { eventoId } = req.query;
    if (eventoId && typeof eventoId === 'string') {
      const ev = await eventoService.getById(eventoId);
      if (ev && !validateTenantAccess(req, ev.estabelecimentoId)) {
        return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
      }
    }
    const lista = await multaPulseiraService.listar(typeof eventoId === 'string' ? eventoId : undefined);
    res.json(lista);
  } catch (error: any) {
    console.error('Erro ao listar pulseiras perdidas:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar pulseiras perdidas' });
  }
});

// ==========================================
// 14. SISTEMA DE FIDELIDADE DE DUAS ESTRELAS
// ==========================================
apiRouter.get('/fidelidade/ranking', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const { estabelecimentoId } = req.query;
    if (!estabelecimentoId || typeof estabelecimentoId !== 'string') {
      return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const ranking = await fidelidadeService.listarRanking(estabelecimentoId);
    res.json(ranking);
  } catch (error: any) {
    console.error('Erro ao listar ranking de fidelidade:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar fidelidade' });
  }
});

apiRouter.get('/fidelidade/cliente/:clienteId', async (req: Request, res: Response) => {
  try {
    const cli = await clienteService.getById(req.params.clienteId);
    if (!cli) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (!validateTenantAccess(req, cli.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const extrato = await fidelidadeService.getExtratoCliente(req.params.clienteId);
    res.json(extrato);
  } catch (error: any) {
    console.error('Erro ao obter extrato de fidelidade:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter extrato de fidelidade' });
  }
});

apiRouter.post('/fidelidade/resgatar-chopp/:clienteId', requireRole(['gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const cli = await clienteService.getById(req.params.clienteId);
    if (!cli) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (!validateTenantAccess(req, cli.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const resultado = await fidelidadeService.resgatarChopp(req.params.clienteId);
    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao resgatar chopp de cortesia:', error);
    res.status(400).json({ error: error.message || 'Erro ao resgatar chopp' });
  }
});

// ==========================================
// 15. REBALANCEAMENTO & COMISSÃO DE GARÇONS (SÓ GERENTE)
// ==========================================
apiRouter.get('/equipe/rebalanceamento', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { eventoId, estabelecimentoId } = req.query;
    if (!eventoId || !estabelecimentoId) {
      return res.status(400).json({ error: 'eventoId e estabelecimentoId são obrigatórios' });
    }
    if (!validateTenantAccess(req, String(estabelecimentoId))) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const dados = await rebalanceamentoService.getAreasEComissoes(
      String(eventoId),
      String(estabelecimentoId)
    );
    res.json(dados);
  } catch (error: any) {
    console.error('Erro ao carregar áreas e comissões:', error);
    res.status(500).json({ error: error.message || 'Erro ao carregar áreas e comissões' });
  }
});

apiRouter.post('/equipe/atribuir-mesa', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { garcomId, mesaId } = req.body;
    if (!garcomId || !mesaId) return res.status(400).json({ error: 'garcomId e mesaId são obrigatórios' });
    const garcom = await usuarioService.getById(garcomId);
    if (!garcom) return res.status(404).json({ error: 'Garçom não encontrado' });
    if (!validateTenantAccess(req, garcom.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const at = await rebalanceamentoService.atribuirMesa(garcomId, mesaId);
    res.status(201).json(at);
  } catch (error: any) {
    console.error('Erro ao atribuir mesa:', error);
    res.status(500).json({ error: error.message || 'Erro ao atribuir mesa' });
  }
});

apiRouter.delete('/equipe/remover-mesa', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { garcomId, mesaId } = req.body;
    if (!garcomId || !mesaId) return res.status(400).json({ error: 'garcomId e mesaId são obrigatórios' });
    const garcom = await usuarioService.getById(garcomId);
    if (!garcom) return res.status(404).json({ error: 'Garçom não encontrado' });
    if (!validateTenantAccess(req, garcom.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const rem = await rebalanceamentoService.removerAtribuicaoMesa(garcomId, mesaId);
    res.json(rem);
  } catch (error: any) {
    console.error('Erro ao desvincular mesa:', error);
    res.status(500).json({ error: error.message || 'Erro ao desvincular mesa' });
  }
});

apiRouter.post('/equipe/meta-comissao', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { garcomId, eventoId, metaMinutos, comissaoBase, bonus } = req.body;
    if (!garcomId || !eventoId) return res.status(400).json({ error: 'garcomId e eventoId são obrigatórios' });
    const garcom = await usuarioService.getById(garcomId);
    if (!garcom) return res.status(404).json({ error: 'Garçom não encontrado' });
    if (!validateTenantAccess(req, garcom.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const salvo = await rebalanceamentoService.salvarMetaComissao({
      garcomId,
      eventoId,
      metaMinutos: metaMinutos ? Number(metaMinutos) : undefined,
      comissaoBase: comissaoBase ? Number(comissaoBase) : undefined,
      bonus: bonus ? Number(bonus) : undefined,
    });
    res.json(salvo);
  } catch (error: any) {
    console.error('Erro ao salvar metas de comissão:', error);
    res.status(500).json({ error: error.message || 'Erro ao salvar metas de comissão' });
  }
});

apiRouter.post('/equipe/executar-rebalanceamento', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { eventoId, estabelecimentoId } = req.body;
    if (!eventoId || !estabelecimentoId) {
      return res.status(400).json({ error: 'eventoId e estabelecimentoId são obrigatórios' });
    }
    if (!validateTenantAccess(req, String(estabelecimentoId))) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }
    const resultado = await rebalanceamentoService.executarRebalanceamento(
      String(eventoId),
      String(estabelecimentoId)
    );
    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao executar rebalanceamento:', error);
    res.status(500).json({ error: error.message || 'Erro ao executar rebalanceamento' });
  }
});

// ==========================================
// 17. APP DO GARÇOM (MOBILE) ENDPOINTS
// ==========================================

// 17.1 Busca de cliente por celular (com estrelas de fidelidade e saudação)
apiRouter.get('/garcom/clientes/buscar', requireRole(['garcom', 'gerente']), async (req: Request, res: Response) => {
  try {
    const { celular, estabelecimentoId } = req.query;
    if (!celular || typeof celular !== 'string') {
      return res.status(400).json({ error: 'Celular é obrigatório para busca.' });
    }
    const targetEst = typeof estabelecimentoId === 'string' ? estabelecimentoId : undefined;
    if (targetEst && !validateTenantAccess(req, targetEst)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    const c = await clienteService.findByCelular(celular, targetEst);
    if (!c) {
      return res.json({ encontrado: false, cliente: null, fidelidade: null, recorrente: false });
    }

    const extrato = await fidelidadeService.getExtratoCliente(c.id);
    const recorrente = (extrato?.totalVisitas || 0) > 0;
    const saudacao = recorrente ? `${c.nome} de volta!` : `Bem-vindo, ${c.nome}!`;

    res.json({
      encontrado: true,
      cliente: c,
      fidelidade: extrato,
      recorrente,
      saudacao,
    });
  } catch (error: any) {
    console.error('Erro ao buscar cliente do garçom:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar cliente' });
  }
});

// 17.2 Check-in do cliente + pulseira física (vinculação ao evento)
apiRouter.post('/garcom/check-in-pulseira', requireRole(['garcom', 'gerente']), async (req: Request, res: Response) => {
  try {
    const { clienteId, nome, celular, estabelecimentoId, codigoQrPulseira, eventoId, mesaId, garcomId } = req.body;

    if (!codigoQrPulseira || !eventoId || !estabelecimentoId) {
      return res.status(400).json({ error: 'codigoQrPulseira, eventoId e estabelecimentoId são obrigatórios.' });
    }
    if (!validateTenantAccess(req, estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: não é permitido cadastrar recursos para outro estabelecimento.' });
    }

    let targetClienteId = clienteId;
    let targetCliente: any = null;

    if (!targetClienteId) {
      if (!nome || !celular) {
        return res.status(400).json({ error: 'Nome e celular são obrigatórios para novo cadastro de cliente (sem CPF).' });
      }
      // Check if already exists by phone
      const existing = await clienteService.findByCelular(celular, estabelecimentoId);
      if (existing) {
        targetClienteId = existing.id;
        targetCliente = existing;
      } else {
        targetCliente = await clienteService.create({
          estabelecimentoId,
          nome: String(nome).trim(),
          celular: String(celular).trim(),
        });
        targetClienteId = targetCliente.id;
      }
    } else {
      targetCliente = await clienteService.getById(targetClienteId);
      if (targetCliente && !validateTenantAccess(req, targetCliente.estabelecimentoId)) {
        return res.status(403).json({ error: 'Acesso negado: cliente pertence a outro estabelecimento.' });
      }
    }

    // Lookup or create physical pulseira
    let pul = await pulseiraService.getByCodigoQr(codigoQrPulseira.trim());
    if (!pul) {
      pul = await pulseiraService.create({
        estabelecimentoId,
        codigoQr: codigoQrPulseira.trim(),
      });
    }

    // Create active vinculo in event
    const vinculo = await vinculoPulseiraService.create({
      pulseiraId: pul.id,
      clienteId: targetClienteId,
      eventoId,
      mesaId: mesaId || undefined,
    });

    // Create or retrieve open comanda
    const cmd = await comandaService.create({
      eventoId,
      tipoAtendimento: 'pulseira',
      vinculoPulseiraEventoId: vinculo.id,
      mesaId: mesaId || undefined,
      garcomResponsavelId: garcomId || undefined,
    });

    if (mesaId) {
      await mesaService.update(mesaId, { status: 'ocupada' });
    }

    const fullComanda = await comandaService.getById(cmd.id);
    const extrato = await fidelidadeService.getExtratoCliente(targetClienteId);

    res.status(201).json({
      sucesso: true,
      comanda: fullComanda,
      vinculo,
      cliente: targetCliente,
      pulseira: pul,
      fidelidade: extrato,
    });
  } catch (error: any) {
    console.error('Erro no check-in do garçom:', error);
    res.status(400).json({ error: error.message || 'Falha ao realizar check-in' });
  }
});

// 17.3 Liberar mesa para a sessão inteira (Apenas Gerente - botão removido do garçom)
apiRouter.post('/garcom/mesas/liberar', requireRole(['gerente']), async (req: Request, res: Response) => {
  try {
    const { mesaId, eventoId, garcomId } = req.body;
    if (!mesaId || !eventoId) {
      return res.status(400).json({ error: 'mesaId e eventoId são obrigatórios.' });
    }

    const m = await mesaService.getById(mesaId);
    if (!m) return res.status(404).json({ error: 'Mesa não encontrada' });
    if (!validateTenantAccess(req, m.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    // Create comanda on table valid for the whole session
    const cmd = await comandaService.create({
      eventoId,
      tipoAtendimento: 'mesa',
      mesaId,
      garcomResponsavelId: garcomId || undefined,
    });

    await mesaService.update(mesaId, { status: 'ocupada' });
    const fullComanda = await comandaService.getById(cmd.id);

    res.status(200).json({
      sucesso: true,
      mensagem: 'Mesa liberada com sucesso para a sessão inteira.',
      comanda: fullComanda,
    });
  } catch (error: any) {
    console.error('Erro ao liberar mesa:', error);
    res.status(400).json({ error: error.message || 'Falha ao liberar mesa' });
  }
});

// 17.4 Fila de entrega do garçom (itens prontos aguardando retirada)
apiRouter.get('/garcom/fila-entrega', requireRole(['garcom', 'gerente']), async (req: Request, res: Response) => {
  try {
    const { eventoId, garcomId } = req.query;
    const items = await pedidoService.getFilaEntregaGarcom(
      typeof eventoId === 'string' ? eventoId : undefined,
      typeof garcomId === 'string' ? garcomId : undefined
    );
    res.json(items);
  } catch (error: any) {
    console.error('Erro ao buscar fila de entrega:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar fila de entrega' });
  }
});

// 17.5 Garçom marca "Recebi" (transiciona de 'pronto' para 'visto' com timestamp vistoEm)
apiRouter.post('/garcom/fila-entrega/:itemId/recebi', requireRole(['garcom', 'gerente']), async (req: Request, res: Response) => {
  try {
    const existing = await pedidoService.getItemById(req.params.itemId);
    if (!existing) return res.status(404).json({ error: 'Item não encontrado.' });
    if (!validateTenantAccess(req, existing.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    const item = await pedidoService.updateItemStatus(req.params.itemId, 'visto');
    if (!item) return res.status(404).json({ error: 'Item não encontrado.' });
    res.json({ sucesso: true, item });
  } catch (error: any) {
    console.error('Erro ao marcar item como recebido:', error);
    res.status(500).json({ error: error.message || 'Erro ao confirmar retirada' });
  }
});

// 17.6 Perfil do garçom (desempenho individual, meta de tempo e comissão acumulada)
apiRouter.get('/garcom/perfil/:garcomId', requireRole(['garcom', 'gerente', 'operador_balcao']), async (req: Request, res: Response) => {
  try {
    const garcom = await usuarioService.getById(req.params.garcomId);
    if (!garcom) return res.status(404).json({ error: 'Garçom não encontrado' });
    if (!validateTenantAccess(req, garcom.estabelecimentoId)) {
      return res.status(403).json({ error: 'Acesso negado: recurso pertence a outro estabelecimento.' });
    }

    const { eventoId } = req.query;
    const perfil = await rebalanceamentoService.getPerfilGarcom(
      req.params.garcomId,
      typeof eventoId === 'string' ? eventoId : undefined
    );
    res.json(perfil);
  } catch (error: any) {
    console.error('Erro ao buscar perfil do garçom:', error);
    res.status(500).json({ error: error.message || 'Erro ao carregar perfil do garçom' });
  }
});
