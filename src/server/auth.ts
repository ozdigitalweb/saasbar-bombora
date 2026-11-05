import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'saasbar_jwt_secure_secret_2026';

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
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
 * Returns true if allowed, false if tenant mismatch.
 */
export function validateTenantAccess(
  req: Request,
  resourceEstabelecimentoId: string | null | undefined
): boolean {
  const callerEstId = getCallerTenantId(req);
  if (!callerEstId) return true; // not authenticated or public endpoint
  if (!resourceEstabelecimentoId) return true;
  return callerEstId === resourceEstabelecimentoId;
}

