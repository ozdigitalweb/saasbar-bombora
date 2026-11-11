import { Request, Response, NextFunction } from 'express';
import { verifyClientSessionToken } from './auth.ts';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Mapas de controle de taxa
const loginAttemptsByIdentifierMinute = new Map<string, RateLimitRecord>();
const loginAttemptsByIdentifierHour = new Map<string, RateLimitRecord>();
const loginAttemptsByIp = new Map<string, RateLimitRecord>();

const autoatendimentoSessionRequests = new Map<string, RateLimitRecord>();
const autoatendimentoIpRequests = new Map<string, RateLimitRecord>();

const buscaCelularRequests = new Map<string, RateLimitRecord>();

// Limpeza de registros expirados a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttemptsByIdentifierMinute.entries()) {
    if (record.resetAt <= now) loginAttemptsByIdentifierMinute.delete(key);
  }
  for (const [key, record] of loginAttemptsByIdentifierHour.entries()) {
    if (record.resetAt <= now) loginAttemptsByIdentifierHour.delete(key);
  }
  for (const [key, record] of loginAttemptsByIp.entries()) {
    if (record.resetAt <= now) loginAttemptsByIp.delete(key);
  }
  for (const [key, record] of autoatendimentoSessionRequests.entries()) {
    if (record.resetAt <= now) autoatendimentoSessionRequests.delete(key);
  }
  for (const [key, record] of autoatendimentoIpRequests.entries()) {
    if (record.resetAt <= now) autoatendimentoIpRequests.delete(key);
  }
  for (const [key, record] of buscaCelularRequests.entries()) {
    if (record.resetAt <= now) buscaCelularRequests.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Verifica se a requisição pode ignorar rate limit para testes automatizados.
 * SEGURANÇA: Só aceita bypass quando estritamente NODE_ENV === 'test' (NUNCA em production ou development).
 */
function isTestBypass(req: Request): boolean {
  return process.env.NODE_ENV === 'test' && req.headers['x-test-run'] === 'true';
}

/**
 * Convenção ÚNICA do sistema para telefones (E.164 nacional):
 * Apenas dígitos numéricos com código do país Brasil (55) + DDD (2 dígitos) + Número (9 dígitos para celulares).
 * Exemplo: '5511987654321' (13 dígitos).
 * Aceita qualquer formatação de entrada: '(11) 98765-4321', '+55 11 98765-4321', '11987654321', '5511987654321'.
 */
export function normalizarTelefonePadrao(telefone: string): string {
  let digitos = String(telefone || '').replace(/\D/g, '');
  if (!digitos) return '';
  // Se já começa com 55 e possui 12 ou 13 dígitos
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    return digitos;
  }
  // Se tem 10 ou 11 dígitos (DDD + 8 ou 9 dígitos), adiciona o prefixo 55
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
}

export const normalizarCelular = normalizarTelefonePadrao;

/**
 * Mascarar número de celular para exibição segura em logs e auditoria.
 * Exemplo: '5511987654321' -> '+55 (11) 9****-**21'
 */
export function mascararCelular(celular: string): string {
  const norm = normalizarTelefonePadrao(celular);
  if (!norm || norm.length < 9) return '***';
  if (norm.length === 13) {
    const ddd = norm.slice(2, 4);
    const prim = norm.slice(4, 5);
    const ult = norm.slice(-2);
    return `+55 (${ddd}) ${prim}****-**${ult}`;
  }
  if (norm.length === 11) {
    const ddd = norm.slice(0, 2);
    const prim = norm.slice(2, 3);
    const ult = norm.slice(-2);
    return `(${ddd}) ${prim}****-**${ult}`;
  }
  return norm.slice(0, 4) + '****' + norm.slice(-2);
}

/**
 * Normaliza identificador de login (e-mail em minúsculas ou celular no padrão 13 dígitos 55 + DDD + número).
 */
export function normalizarIdentificadorLogin(login: string): string {
  if (!login || typeof login !== 'string') return '';
  const clean = login.trim();
  if (clean.includes('@')) {
    return clean.toLowerCase();
  }
  return normalizarTelefonePadrao(clean);
}

/**
 * Rate Limiter for Login:
 * 1. Limite por identificador (e-mail ou celular normalizado):
 *    - Máximo 5 tentativas por minuto.
 *    - Máximo 20 tentativas por hora.
 * 2. Limite largo por IP (200 tentativas por minuto) para permitir que toda a equipe no mesmo Wi-Fi entre no turno.
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  if (isTestBypass(req)) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const rawLogin = req.body?.login || req.body?.email || req.body?.celular || '';
  const identificador = normalizarIdentificadorLogin(rawLogin);

  const now = Date.now();

  // 1. Checagem do limite largo por IP (200 tentativas por minuto)
  const windowIpMs = 60 * 1000;
  const maxAttemptsIp = 200;
  const keyIp = `login:ip:${ip}`;

  let recordIp = loginAttemptsByIp.get(keyIp);
  if (!recordIp || recordIp.resetAt <= now) {
    recordIp = { count: 1, resetAt: now + windowIpMs };
    loginAttemptsByIp.set(keyIp, recordIp);
  } else {
    recordIp.count += 1;
    if (recordIp.count > maxAttemptsIp) {
      const secondsRemaining = Math.ceil((recordIp.resetAt - now) / 1000);
      res.setHeader('Retry-After', secondsRemaining);
      return res.status(429).json({
        error: `Limite de tentativas de login por IP excedido para esta rede. Aguarde ${secondsRemaining} segundos.`,
      });
    }
  }

  // 2. Checagem por identificador (apenas se informado)
  if (identificador) {
    // 2.a. Limite de 5 tentativas por minuto por identificador
    const windowMinMs = 60 * 1000;
    const maxAttemptsMin = 5;
    const keyMin = `login:id:min:${identificador}`;

    let recordMin = loginAttemptsByIdentifierMinute.get(keyMin);
    if (!recordMin || recordMin.resetAt <= now) {
      recordMin = { count: 1, resetAt: now + windowMinMs };
      loginAttemptsByIdentifierMinute.set(keyMin, recordMin);
    } else {
      recordMin.count += 1;
      if (recordMin.count > maxAttemptsMin) {
        const secondsRemaining = Math.ceil((recordMin.resetAt - now) / 1000);
        res.setHeader('Retry-After', secondsRemaining);
        return res.status(429).json({
          error: `Muitas tentativas de login consecutivas para este usuário. Por segurança, aguarde ${secondsRemaining} segundos antes de tentar novamente.`,
        });
      }
    }

    // 2.b. Limite de 20 tentativas por hora por identificador
    const windowHourMs = 60 * 60 * 1000;
    const maxAttemptsHour = 20;
    const keyHour = `login:id:hour:${identificador}`;

    let recordHour = loginAttemptsByIdentifierHour.get(keyHour);
    if (!recordHour || recordHour.resetAt <= now) {
      recordHour = { count: 1, resetAt: now + windowHourMs };
      loginAttemptsByIdentifierHour.set(keyHour, recordHour);
    } else {
      recordHour.count += 1;
      if (recordHour.count > maxAttemptsHour) {
        const minutesRemaining = Math.ceil((recordHour.resetAt - now) / (60 * 1000));
        res.setHeader('Retry-After', Math.ceil((recordHour.resetAt - now) / 1000));
        return res.status(429).json({
          error: `Limite de 20 tentativas de login por hora para este usuário excedido. Por segurança, aguarde ${minutesRemaining} minutos antes de tentar novamente.`,
        });
      }
    }
  }

  next();
}

/**
 * Rate Limiter for Client Self-Service (Autoatendimento):
 * - Limite por mesa ou sessão (token): 60 requisições por minuto.
 * - Limite por IP alto: 1000 requisições por minuto, garantindo que 100+ mesas no mesmo Wi-Fi não dividam uma cota pequena.
 */
export function autoatendimentoRateLimiter(req: Request, res: Response, next: NextFunction) {
  if (isTestBypass(req)) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  // 1. Limite alto por IP (1000 requisições por minuto)
  const windowIpMs = 60 * 1000;
  const maxRequestsIp = 1000;
  const keyIp = `autoatend:ip:${ip}`;

  let recordIp = autoatendimentoIpRequests.get(keyIp);
  if (!recordIp || recordIp.resetAt <= now) {
    recordIp = { count: 1, resetAt: now + windowIpMs };
    autoatendimentoIpRequests.set(keyIp, recordIp);
  } else {
    recordIp.count += 1;
    if (recordIp.count > maxRequestsIp) {
      const secondsRemaining = Math.ceil((recordIp.resetAt - now) / 1000);
      res.setHeader('Retry-After', secondsRemaining);
      return res.status(429).json({
        error: 'Limite de requisições de autoatendimento excedido para este IP de rede. Aguarde um momento.',
      });
    }
  }

  // 2. Extrai identificador de sessão (token JWT) ou mesa
  let sessionOrMesaKey = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const clientPayload = verifyClientSessionToken(token);
    if (clientPayload?.mesaId) {
      sessionOrMesaKey = `mesa:${clientPayload.mesaId}`;
    } else {
      sessionOrMesaKey = `tok:${token.slice(-16)}`;
    }
  }

  if (!sessionOrMesaKey) {
    const mesaParam = (req.query?.mesaId || req.body?.mesaId || req.params?.mesaId || req.params?.id || '') as string;
    const qrParam = (req.query?.qrCode || req.query?.qr || req.body?.qrCode || req.body?.qr || '') as string;
    if (mesaParam) {
      sessionOrMesaKey = `mesa:${mesaParam}`;
    } else if (qrParam) {
      sessionOrMesaKey = `qr:${qrParam}`;
    } else {
      sessionOrMesaKey = `ip_fallback:${ip}`;
    }
  }

  // Limite por sessão / mesa: 60 requisições por minuto
  const windowSessionMs = 60 * 1000;
  const maxRequestsSession = 60;
  const keySession = `autoatend:sess:${sessionOrMesaKey}`;

  let recordSession = autoatendimentoSessionRequests.get(keySession);
  if (!recordSession || recordSession.resetAt <= now) {
    recordSession = { count: 1, resetAt: now + windowSessionMs };
    autoatendimentoSessionRequests.set(keySession, recordSession);
  } else {
    recordSession.count += 1;
    if (recordSession.count > maxRequestsSession) {
      const secondsRemaining = Math.ceil((recordSession.resetAt - now) / 1000);
      res.setHeader('Retry-After', secondsRemaining);
      return res.status(429).json({
        error: 'Limite de requisições excedido para esta mesa/sessão. Aguarde um momento antes de nova ação.',
      });
    }
  }

  next();
}

/**
 * Rate Limiter para busca de clientes por celular (prevenção contra enumeração/ataques de força bruta):
 * Máximo 20 requisições por minuto por IP ou telefone.
 */
export function buscaCelularRateLimiter(req: Request, res: Response, next: NextFunction) {
  if (isTestBypass(req)) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const celularParam = (req.query?.celular || req.body?.celular || '') as string;
  const celNormalizado = normalizarTelefonePadrao(celularParam);
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
  loginAttemptsByIdentifierMinute.clear();
  loginAttemptsByIdentifierHour.clear();
  loginAttemptsByIp.clear();
  autoatendimentoSessionRequests.clear();
  autoatendimentoIpRequests.clear();
  buscaCelularRequests.clear();
}
