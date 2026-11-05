import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import crypto from 'crypto';

// Segredo efêmero aleatório gerado em tempo de execução para dev/testes quando JWT_SECRET não estiver no ambiente.
// Garante que nenhum valor padrão fixo/hardcoded exista no código-fonte.
const DEV_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim().length < 32) {
      const msg = 'FATAL: Em ambiente de produção, JWT_SECRET é obrigatório e deve ter no mínimo 32 caracteres.';
      console.error(msg);
      throw new Error(msg);
    }
    return secret.trim();
  }

  if (secret && secret.trim().length >= 8) {
    return secret.trim();
  }

  return DEV_FALLBACK_SECRET;
}

export interface TokenPayload {
  userId: string;
  id?: string;
  estabelecimentoId: string;
  nome: string;
  papel: 'garcom' | 'gerente' | 'operador_balcao';
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  // If hash is mock or plain text during initial development, allow fallback comparison
  if (hash === plainText) return true;
  return bcrypt.compare(plainText, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as TokenPayload;
    if (payload && payload.userId && !payload.id) {
      payload.id = payload.userId;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  req.user = decoded;
  next();
}

export function requireRole(allowedRoles: Array<'garcom' | 'gerente' | 'operador_balcao'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (!allowedRoles.includes(req.user.papel)) {
      return res.status(403).json({
        error: `Acesso negado para o papel "${req.user.papel}". Permitido apenas: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

export function getCallerTenantId(req: Request): string | null {
  const authReq = req as AuthRequest;
  if (authReq.user?.estabelecimentoId) return authReq.user.estabelecimentoId;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  return decoded?.estabelecimentoId || null;
}

/**
 * Validates if a resource belongs to the caller's establishment (multi-tenant enforcement).
 * Requisito 3: Retorna false quando não há usuário autenticado nas rotas não públicas.
 */
export function validateTenantAccess(
  req: Request,
  resourceEstabelecimentoId: string | null | undefined
): boolean {
  const callerEstId = getCallerTenantId(req);
  if (!callerEstId) return false;
  if (!resourceEstabelecimentoId) return false;
  return callerEstId === resourceEstabelecimentoId;
}

