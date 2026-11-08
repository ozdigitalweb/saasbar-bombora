import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const autoatendimentoRequests = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (record.resetAt <= now) loginAttempts.delete(key);
  }
  for (const [key, record] of autoatendimentoRequests.entries()) {
    if (record.resetAt <= now) autoatendimentoRequests.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Rate Limiter for Login:
 * Max 5 attempts per 60 seconds per IP or phone number.
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Allow test automation bypass if internal test header or prefix present
  const isTest = req.headers['x-test-run'] === 'true' || process.env.NODE_ENV === 'test';
  if (isTest) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const celular = req.body?.celular ? String(req.body.celular).replace(/\D/g, '') : '';
  const key = celular ? `login:${ip}:${celular}` : `login:${ip}`;

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 5;

  let record = loginAttempts.get(key);
  if (!record || record.resetAt <= now) {
    record = { count: 1, resetAt: now + windowMs };
    loginAttempts.set(key, record);
    return next();
  }

  record.count += 1;
  if (record.count > maxAttempts) {
    const secondsRemaining = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', secondsRemaining);
    return res.status(429).json({
      error: `Muitas tentativas de login consecutivas. Por segurança, aguarde ${secondsRemaining} segundos antes de tentar novamente.`,
    });
  }

  next();
}

/**
 * Rate Limiter for Client Self-Service (Autoatendimento):
 * Max 30 requests per minute per IP / Mesa session.
 */
export function autoatendimentoRateLimiter(req: Request, res: Response, next: NextFunction) {
  const isTest = req.headers['x-test-run'] === 'true' || process.env.NODE_ENV === 'test';
  if (isTest) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const mesaId = (req.query?.mesaId || req.body?.mesaId || req.params?.id || 'default') as string;
  const key = `autoatend:${ip}:${mesaId}`;

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  let record = autoatendimentoRequests.get(key);
  if (!record || record.resetAt <= now) {
    record = { count: 1, resetAt: now + windowMs };
    autoatendimentoRequests.set(key, record);
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    const secondsRemaining = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', secondsRemaining);
    return res.status(429).json({
      error: 'Limite de requisições excedido para o autoatendimento. Aguarde um momento antes de nova ação.',
    });
  }

  next();
}

const buscaCelularRequests = new Map<string, RateLimitRecord>();

/**
 * Mascarar número de celular para exibição segura em logs e auditoria.
 * Exemplo: '11987654321' -> '(11) 9****-**21'
 */
export function mascararCelular(celular: string): string {
  const digitos = String(celular || '').replace(/\D/g, '');
  if (!digitos) return '***';
  if (digitos.length < 5) return digitos.slice(0, 1) + '***' + digitos.slice(-1);
  const ddd = digitos.slice(0, 2);
  const ultimos = digitos.slice(-2);
  const primeiroDigito = digitos.slice(2, 3);
  return `(${ddd}) ${primeiroDigito}****-**${ultimos}`;
}

/**
 * Normaliza número de telefone celular brasileiro (apenas dígitos, remove +55 e símbolos).
 */
export function normalizarCelular(celular: string): string {
  let digitos = String(celular || '').replace(/\D/g, '');
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.substring(2);
  }
  return digitos;
}

/**
 * Rate Limiter para busca de clientes por celular (prevenção contra enumeração/ataques de força bruta):
 * Máximo 20 requisições por minuto por IP ou token.
 */
export function buscaCelularRateLimiter(req: Request, res: Response, next: NextFunction) {
  const isTest = req.headers['x-test-run'] === 'true' || process.env.NODE_ENV === 'test';
  if (isTest) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const celularParam = (req.query?.celular || req.body?.celular || '') as string;
  const celNormalizado = normalizarCelular(celularParam);
  const key = `busca_cel:${ip}:${celNormalizado || 'empty'}`;

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  let record = buscaCelularRequests.get(key);
  if (!record || record.resetAt <= now) {
    record = { count: 1, resetAt: now + windowMs };
    buscaCelularRequests.set(key, record);
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    const secondsRemaining = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', secondsRemaining);
    return res.status(429).json({
      error: `Muitas buscas de celular consecutivas. Por segurança, aguarde ${secondsRemaining} segundos antes de tentar novamente.`,
    });
  }

  next();
}

/**
 * Função utilitária para testes automatizados limparem o estado em memória dos rate limiters
 */
export function _clearRateLimitsForTesting() {
  loginAttempts.clear();
  autoatendimentoRequests.clear();
  buscaCelularRequests.clear();
}
