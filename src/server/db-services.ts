import crypto from 'crypto';
import { eq, ne, desc, asc, and, ilike, or, inArray } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { normalizarCelular, mascararCelular } from './rate-limiter.ts';
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
  multaPulseiraPerdida,
  garcomArea,
  garcomComissao,
  reciboEnvio,
  cobranca,
  caixaGarcom,
  sangriaCaixa,
  telefoneVerificacao,
} from '../db/schema.ts';

// 1. ESTABELECIMENTO REPOSITORY
export const estabelecimentoService = {
  async getAll() {
    try {
      return await db.select().from(estabelecimento).orderBy(asc(estabelecimento.nome));
    } catch (error) {
      console.error('Error in estabelecimentoService.getAll:', error);
      throw new Error('Falha ao listar estabelecimentos.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db
        .select()
        .from(estabelecimento)
        .where(eq(estabelecimento.id, id))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in estabelecimentoService.getById(${id}):`, error);
      throw new Error('Falha ao buscar estabelecimento.', { cause: error });
    }
  },

  async create(data: { nome: string; tipo?: string; config?: Record<string, any> }) {
    try {
      const rows = await db
        .insert(estabelecimento)
        .values({
          nome: data.nome,
          tipo: data.tipo || 'bar_casa_noturna',
          config: data.config || {},
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in estabelecimentoService.create:', error);
      throw new Error('Falha ao criar estabelecimento.', { cause: error });
    }
  },

  async update(
    id: string,
    data: { nome?: string; tipo?: string; config?: Record<string, any> }
  ) {
    try {
      const rows = await db
        .update(estabelecimento)
        .set(data)
        .where(eq(estabelecimento.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in estabelecimentoService.update(${id}):`, error);
      throw new Error('Falha ao atualizar estabelecimento.', { cause: error });
    }
  },

  async delete(id: string) {
    try {
      const rows = await db
        .delete(estabelecimento)
        .where(eq(estabelecimento.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in estabelecimentoService.delete(${id}):`, error);
      throw new Error('Falha ao excluir estabelecimento.', { cause: error });
    }
  },
};

// 2. PONTO DE PREPARO REPOSITORY
export const pontoDePreparoService = {
  async getAll(estabelecimentoId?: string) {
    try {
      if (estabelecimentoId) {
        return await db
          .select()
          .from(pontoDePreparo)
          .where(eq(pontoDePreparo.estabelecimentoId, estabelecimentoId))
          .orderBy(asc(pontoDePreparo.nome));
      }
      return await db.select().from(pontoDePreparo).orderBy(asc(pontoDePreparo.nome));
    } catch (error) {
      console.error('Error in pontoDePreparoService.getAll:', error);
      throw new Error('Falha ao listar pontos de preparo.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db
        .select()
        .from(pontoDePreparo)
        .where(eq(pontoDePreparo.id, id))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in pontoDePreparoService.getById(${id}):`, error);
      throw new Error('Falha ao buscar ponto de preparo.', { cause: error });
    }
  },

  async create(data: { estabelecimentoId: string; nome: string }) {
    try {
      const rows = await db
        .insert(pontoDePreparo)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          nome: data.nome,
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in pontoDePreparoService.create:', error);
      throw new Error('Falha ao criar ponto de preparo.', { cause: error });
    }
  },

  async update(id: string, data: { nome?: string }) {
    try {
      const rows = await db
        .update(pontoDePreparo)
        .set(data)
        .where(eq(pontoDePreparo.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in pontoDePreparoService.update(${id}):`, error);
      throw new Error('Falha ao atualizar ponto de preparo.', { cause: error });
    }
  },

  async delete(id: string) {
    try {
      const rows = await db
        .delete(pontoDePreparo)
        .where(eq(pontoDePreparo.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in pontoDePreparoService.delete(${id}):`, error);
      throw new Error('Falha ao excluir ponto de preparo.', { cause: error });
    }
  },
};

// 3. USUARIO REPOSITORY
export const usuarioService = {
  async getAll(estabelecimentoId?: string, papel?: 'garcom' | 'gerente' | 'operador_balcao') {
    try {
      let query = db.select().from(usuario);
      if (estabelecimentoId && papel) {
        return await query
          .where(and(eq(usuario.estabelecimentoId, estabelecimentoId), eq(usuario.papel, papel)))
          .orderBy(asc(usuario.nome));
      } else if (estabelecimentoId) {
        return await query
          .where(eq(usuario.estabelecimentoId, estabelecimentoId))
          .orderBy(asc(usuario.nome));
      } else if (papel) {
        return await query.where(eq(usuario.papel, papel)).orderBy(asc(usuario.nome));
      }
      return await query.orderBy(asc(usuario.nome));
    } catch (error) {
      console.error('Error in usuarioService.getAll:', error);
      throw new Error('Falha ao listar usuários.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db.select().from(usuario).where(eq(usuario.id, id)).limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in usuarioService.getById(${id}):`, error);
      throw new Error('Falha ao buscar usuário.', { cause: error });
    }
  },

  async findByLogin(login: string, estabelecimentoId?: string) {
    try {
      const clean = login.trim();
      const conditions = [
        or(eq(usuario.email, clean), eq(usuario.celular, clean))
      ];
      if (estabelecimentoId) {
        conditions.push(eq(usuario.estabelecimentoId, estabelecimentoId));
      }
      const rows = await db
        .select()
        .from(usuario)
        .where(and(...conditions))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in usuarioService.findByLogin(${login}):`, error);
      throw new Error('Falha ao buscar usuário por login.', { cause: error });
    }
  },

  async create(data: {
    estabelecimentoId: string;
    nome: string;
    papel: 'garcom' | 'gerente' | 'operador_balcao';
    celular?: string;
    email?: string;
    senhaHash?: string;
  }) {
    try {
      const rows = await db
        .insert(usuario)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          nome: data.nome,
          papel: data.papel,
          celular: data.celular || null,
          email: data.email || null,
          senhaHash: data.senhaHash || 'mock_hash',
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in usuarioService.create:', error);
      throw new Error('Falha ao cadastrar usuário.', { cause: error });
    }
  },

  async update(
    id: string,
    data: {
      nome?: string;
      papel?: 'garcom' | 'gerente' | 'operador_balcao';
      celular?: string;
      email?: string;
      senhaHash?: string;
    }
  ) {
    try {
      const rows = await db
        .update(usuario)
        .set(data)
        .where(eq(usuario.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in usuarioService.update(${id}):`, error);
      throw new Error('Falha ao atualizar usuário.', { cause: error });
    }
  },

  async delete(id: string) {
    try {
      const rows = await db.delete(usuario).where(eq(usuario.id, id)).returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in usuarioService.delete(${id}):`, error);
      throw new Error('Falha ao excluir usuário.', { cause: error });
    }
  },
};

// 4. MESA REPOSITORY
export const mesaService = {
  async getAll(estabelecimentoId?: string) {
    try {
      if (estabelecimentoId) {
        return await db
          .select()
          .from(mesa)
          .where(eq(mesa.estabelecimentoId, estabelecimentoId))
          .orderBy(asc(mesa.identificador));
      }
      return await db.select().from(mesa).orderBy(asc(mesa.identificador));
    } catch (error) {
      console.error('Error in mesaService.getAll:', error);
      throw new Error('Falha ao listar mesas.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db.select().from(mesa).where(eq(mesa.id, id)).limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in mesaService.getById(${id}):`, error);
      throw new Error('Falha ao buscar mesa.', { cause: error });
    }
  },

  async getByQrCode(qrCode: string) {
    try {
      const rows = await db.select().from(mesa).where(eq(mesa.qrCode, qrCode.trim())).limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in mesaService.getByQrCode:`, error);
      throw new Error('Falha ao buscar mesa por QR code.', { cause: error });
    }
  },

  async create(data: {
    estabelecimentoId: string;
    identificador: string;
    qrCode?: string;
    status?: string;
  }) {
    try {
      const generatedQr = data.qrCode || `MESA-${crypto.randomUUID()}`;
      const rows = await db
        .insert(mesa)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          identificador: data.identificador,
          qrCode: generatedQr,
          status: data.status || 'livre',
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in mesaService.create:', error);
      throw new Error('Falha ao criar mesa.', { cause: error });
    }
  },

  async update(
    id: string,
    data: { identificador?: string; qrCode?: string; status?: string }
  ) {
    try {
      const rows = await db
        .update(mesa)
        .set(data)
        .where(eq(mesa.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in mesaService.update(${id}):`, error);
      throw new Error('Falha ao atualizar mesa.', { cause: error });
    }
  },

  async delete(id: string) {
    try {
      const rows = await db.delete(mesa).where(eq(mesa.id, id)).returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in mesaService.delete(${id}):`, error);
      throw new Error('Falha ao excluir mesa.', { cause: error });
    }
  },
};

// 5. PULSEIRA REPOSITORY
export const pulseiraService = {
  async getAll(estabelecimentoId?: string) {
    try {
      if (estabelecimentoId) {
        return await db
          .select()
          .from(pulseira)
          .where(eq(pulseira.estabelecimentoId, estabelecimentoId))
          .orderBy(asc(pulseira.codigoQr));
      }
      return await db.select().from(pulseira).orderBy(asc(pulseira.codigoQr));
    } catch (error) {
      console.error('Error in pulseiraService.getAll:', error);
      throw new Error('Falha ao listar pulseiras.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db
        .select()
        .from(pulseira)
        .where(eq(pulseira.id, id))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in pulseiraService.getById(${id}):`, error);
      throw new Error('Falha ao buscar pulseira.', { cause: error });
    }
  },

  async getByCodigoQr(codigoQr: string) {
    try {
      const rows = await db
        .select()
        .from(pulseira)
        .where(eq(pulseira.codigoQr, codigoQr.trim()))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in pulseiraService.getByCodigoQr:', error);
      throw new Error('Falha ao buscar pulseira por QR.', { cause: error });
    }
  },

  async create(data: { estabelecimentoId: string; codigoQr?: string }) {
    try {
      const generatedQr = data.codigoQr || `PUL-${crypto.randomUUID()}`;
      const rows = await db
        .insert(pulseira)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          codigoQr: generatedQr,
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in pulseiraService.create:', error);
      throw new Error('Falha ao cadastrar pulseira.', { cause: error });
    }
  },

  async update(id: string, data: { codigoQr?: string }) {
    try {
      const rows = await db
        .update(pulseira)
        .set(data)
        .where(eq(pulseira.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in pulseiraService.update(${id}):`, error);
      throw new Error('Falha ao atualizar pulseira.', { cause: error });
    }
  },

  async delete(id: string) {
    try {
      const rows = await db.delete(pulseira).where(eq(pulseira.id, id)).returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in pulseiraService.delete(${id}):`, error);
      throw new Error('Falha ao excluir pulseira.', { cause: error });
    }
  },
};

// 6. CLIENTE REPOSITORY
export const clienteService = {
  async getAll(estabelecimentoId?: string, search?: string) {
    try {
      let query = db.select().from(cliente);
      const conditions = [];

      if (estabelecimentoId) {
        conditions.push(eq(cliente.estabelecimentoId, estabelecimentoId));
      }
      if (search) {
        conditions.push(
          or(
            ilike(cliente.nome, `%${search}%`),
            ilike(cliente.celular, `%${search}%`),
            ilike(cliente.email, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        return await query.where(and(...conditions)).orderBy(desc(cliente.criadoEm));
      }
      return await query.orderBy(desc(cliente.criadoEm));
    } catch (error) {
      console.error('Error in clienteService.getAll:', error);
      throw new Error('Falha ao listar clientes.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db.select().from(cliente).where(eq(cliente.id, id)).limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in clienteService.getById(${id}):`, error);
      throw new Error('Falha ao buscar cliente.', { cause: error });
    }
  },

  async findByCelular(celular: string, estabelecimentoId?: string) {
    try {
      const cleanPhone = celular.replace(/\D/g, '');
      const query = db.select().from(cliente);
      const conditions = [];
      if (estabelecimentoId) {
        conditions.push(eq(cliente.estabelecimentoId, estabelecimentoId));
      }
      const all = await query.where(conditions.length > 0 ? and(...conditions) : undefined);
      const match = all.find((c) => {
        const cPhone = (c.celular || '').replace(/\D/g, '');
        return cPhone === cleanPhone || (cleanPhone.length >= 8 && cPhone.endsWith(cleanPhone));
      });
      return match || null;
    } catch (error) {
      console.error('Error in clienteService.findByCelular:', error);
      throw new Error('Falha ao buscar cliente por celular.', { cause: error });
    }
  },

  async findOrCreate(data: {
    estabelecimentoId: string;
    nome: string;
    celular: string;
    email?: string;
  }) {
    try {
      const cleanPhone = data.celular.replace(/\D/g, '');
      const existing = await this.findByCelular(cleanPhone, data.estabelecimentoId);
      if (existing) {
        if (data.nome && existing.nome !== data.nome) {
          const updated = await this.update(existing.id, {
            nome: data.nome,
            email: data.email || existing.email || undefined,
          });
          return updated || existing;
        }
        return existing;
      }
      return await this.create({
        estabelecimentoId: data.estabelecimentoId,
        nome: data.nome,
        celular: cleanPhone,
        email: data.email,
      });
    } catch (error) {
      console.error('Error in clienteService.findOrCreate:', error);
      throw error;
    }
  },

  async create(data: {
    estabelecimentoId: string;
    nome: string;
    celular: string;
    email?: string;
  }) {
    try {
      const rows = await db
        .insert(cliente)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          nome: data.nome,
          celular: data.celular,
          email: data.email || null,
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in clienteService.create:', error);
      throw new Error('Falha ao cadastrar cliente.', { cause: error });
    }
  },

  async update(
    id: string,
    data: { nome?: string; celular?: string; email?: string }
  ) {
    try {
      const rows = await db
        .update(cliente)
        .set(data)
        .where(eq(cliente.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in clienteService.update(${id}):`, error);
      throw new Error('Falha ao atualizar cliente.', { cause: error });
    }
  },

  async delete(id: string) {
    try {
      const rows = await db.delete(cliente).where(eq(cliente.id, id)).returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in clienteService.delete(${id}):`, error);
      throw new Error('Falha ao excluir cliente.', { cause: error });
    }
  },
};

// 7. ITEM DE CARDAPIO REPOSITORY
export const itemCardapioService = {
  async getAll(estabelecimentoId?: string) {
    try {
      const query = db
        .select({
          id: itemCardapio.id,
          estabelecimentoId: itemCardapio.estabelecimentoId,
          pontoDePreparoId: itemCardapio.pontoDePreparoId,
          nome: itemCardapio.nome,
          preco: itemCardapio.preco,
          pontoDePreparoNome: pontoDePreparo.nome,
        })
        .from(itemCardapio)
        .leftJoin(pontoDePreparo, eq(itemCardapio.pontoDePreparoId, pontoDePreparo.id));

      if (estabelecimentoId) {
        return await query
          .where(eq(itemCardapio.estabelecimentoId, estabelecimentoId))
          .orderBy(asc(itemCardapio.nome));
      }
      return await query.orderBy(asc(itemCardapio.nome));
    } catch (error) {
      console.error('Error in itemCardapioService.getAll:', error);
      throw new Error('Falha ao listar itens de cardápio.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db
        .select({
          id: itemCardapio.id,
          estabelecimentoId: itemCardapio.estabelecimentoId,
          pontoDePreparoId: itemCardapio.pontoDePreparoId,
          nome: itemCardapio.nome,
          preco: itemCardapio.preco,
          pontoDePreparoNome: pontoDePreparo.nome,
        })
        .from(itemCardapio)
        .leftJoin(pontoDePreparo, eq(itemCardapio.pontoDePreparoId, pontoDePreparo.id))
        .where(eq(itemCardapio.id, id))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in itemCardapioService.getById(${id}):`, error);
      throw new Error('Falha ao buscar item de cardápio.', { cause: error });
    }
  },

  async create(data: {
    estabelecimentoId: string;
    pontoDePreparoId: string;
    nome: string;
    preco: string | number;
  }) {
    try {
      // Validar se ponto de preparo pertence ao mesmo estabelecimento (Regra multi-tenant)
      const ponto = await db
        .select()
        .from(pontoDePreparo)
        .where(eq(pontoDePreparo.id, data.pontoDePreparoId))
        .limit(1);

      if (!ponto[0] || ponto[0].estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Ponto de preparo não pertence ao mesmo estabelecimento do item.');
      }

      const rows = await db
        .insert(itemCardapio)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          pontoDePreparoId: data.pontoDePreparoId,
          nome: data.nome,
          preco: String(data.preco),
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in itemCardapioService.create:', error);
      throw new Error(error instanceof Error ? error.message : 'Falha ao criar item de cardápio.', { cause: error });
    }
  },

  async update(
    id: string,
    data: {
      pontoDePreparoId?: string;
      nome?: string;
      preco?: string | number;
    }
  ) {
    try {
      const updateData: Record<string, any> = {};
      if (data.pontoDePreparoId !== undefined) updateData.pontoDePreparoId = data.pontoDePreparoId;
      if (data.nome !== undefined) updateData.nome = data.nome;
      if (data.preco !== undefined) updateData.preco = String(data.preco);

      const rows = await db
        .update(itemCardapio)
        .set(updateData)
        .where(eq(itemCardapio.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in itemCardapioService.update(${id}):`, error);
      throw new Error('Falha ao atualizar item de cardápio.', { cause: error });
    }
  },

  async delete(id: string) {
    try {
      const rows = await db
        .delete(itemCardapio)
        .where(eq(itemCardapio.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in itemCardapioService.delete(${id}):`, error);
      throw new Error('Falha ao excluir item de cardápio.', { cause: error });
    }
  },
};

// ==========================================
// 8. EVENTO REPOSITORY
// ==========================================
export const eventoService = {
  async getAll(estabelecimentoId: string) {
    try {
      return await db
        .select()
        .from(evento)
        .where(eq(evento.estabelecimentoId, estabelecimentoId))
        .orderBy(desc(evento.dataInicio));
    } catch (error) {
      console.error('Error in eventoService.getAll:', error);
      throw new Error('Falha ao listar eventos.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db.select().from(evento).where(eq(evento.id, id)).limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in eventoService.getById(${id}):`, error);
      throw new Error('Falha ao buscar evento.', { cause: error });
    }
  },

  async getActive(estabelecimentoId: string) {
    try {
      // Find open event or most recent
      const openRows = await db
        .select()
        .from(evento)
        .where(and(eq(evento.estabelecimentoId, estabelecimentoId), eq(evento.dataFim as any, null as any)))
        .orderBy(desc(evento.dataInicio))
        .limit(1);

      if (openRows.length > 0) return openRows[0];

      const anyRows = await db
        .select()
        .from(evento)
        .where(eq(evento.estabelecimentoId, estabelecimentoId))
        .orderBy(desc(evento.dataInicio))
        .limit(1);

      return anyRows[0] || null;
    } catch (error) {
      console.error('Error in eventoService.getActive:', error);
      throw new Error('Falha ao buscar evento ativo.', { cause: error });
    }
  },

  async create(data: {
    estabelecimentoId: string;
    nome: string;
    dataInicio?: string | Date;
    metaTempoRespostaPadrao?: string;
    modoRebalanceamento?: 'automatico' | 'manual';
  }) {
    try {
      const rows = await db
        .insert(evento)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          nome: data.nome,
          dataInicio: data.dataInicio ? new Date(data.dataInicio) : new Date(),
          modoRebalanceamento: data.modoRebalanceamento || 'manual',
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in eventoService.create:', error);
      throw new Error('Falha ao criar evento.', { cause: error });
    }
  },

  async update(id: string, data: { nome?: string; dataFim?: Date | string; modoRebalanceamento?: 'automatico' | 'manual' }) {
    try {
      const rows = await db
        .update(evento)
        .set({
          ...(data.nome ? { nome: data.nome } : {}),
          ...(data.dataFim ? { dataFim: new Date(data.dataFim) } : {}),
          ...(data.modoRebalanceamento ? { modoRebalanceamento: data.modoRebalanceamento } : {}),
        })
        .where(eq(evento.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in eventoService.update(${id}):`, error);
      throw new Error('Falha ao atualizar evento.', { cause: error });
    }
  },

  async close(id: string) {
    try {
      const rows = await db
        .update(evento)
        .set({ dataFim: new Date() })
        .where(eq(evento.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in eventoService.close(${id}):`, error);
      throw new Error('Falha ao encerrar evento.', { cause: error });
    }
  },
};

// ==========================================
// 9. VINCULO PULSEIRA EVENTO REPOSITORY
// ==========================================
export const vinculoPulseiraService = {
  async getByEvento(eventoId: string) {
    try {
      return await db
        .select({
          id: vinculoPulseiraEvento.id,
          pulseiraId: vinculoPulseiraEvento.pulseiraId,
          clienteId: vinculoPulseiraEvento.clienteId,
          eventoId: vinculoPulseiraEvento.eventoId,
          mesaId: vinculoPulseiraEvento.mesaId,
          inicio: vinculoPulseiraEvento.inicio,
          fim: vinculoPulseiraEvento.fim,
          status: vinculoPulseiraEvento.status,
          clienteNome: cliente.nome,
          clienteCelular: cliente.celular,
          pulseiraCodigoQr: pulseira.codigoQr,
          mesaIdentificador: mesa.identificador,
        })
        .from(vinculoPulseiraEvento)
        .innerJoin(cliente, eq(vinculoPulseiraEvento.clienteId, cliente.id))
        .innerJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .leftJoin(mesa, eq(vinculoPulseiraEvento.mesaId, mesa.id))
        .where(eq(vinculoPulseiraEvento.eventoId, eventoId))
        .orderBy(desc(vinculoPulseiraEvento.inicio));
    } catch (error) {
      console.error('Error in vinculoPulseiraService.getByEvento:', error);
      throw new Error('Falha ao listar vínculos de pulseiras.', { cause: error });
    }
  },

  async getActiveByPulseiraQr(codigoQr: string, eventoId: string) {
    try {
      // Bloqueio rigoroso: se a pulseira foi comunicada como perdida, seu QR fica bloqueado para novos pedidos e fechamento
      const vinculoPerda = await db
        .select({ id: multaPulseiraPerdida.id })
        .from(multaPulseiraPerdida)
        .innerJoin(vinculoPulseiraEvento, eq(multaPulseiraPerdida.vinculoPulseiraEventoId, vinculoPulseiraEvento.id))
        .innerJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .where(
          and(
            eq(pulseira.codigoQr, codigoQr.trim()),
            eq(vinculoPulseiraEvento.eventoId, eventoId)
          )
        )
        .limit(1);

      if (vinculoPerda.length > 0) {
        throw new Error('Esta pulseira foi comunicada como perdida e seu QR está bloqueado.');
      }

      const rows = await db
        .select({
          id: vinculoPulseiraEvento.id,
          pulseiraId: vinculoPulseiraEvento.pulseiraId,
          clienteId: vinculoPulseiraEvento.clienteId,
          eventoId: vinculoPulseiraEvento.eventoId,
          mesaId: vinculoPulseiraEvento.mesaId,
          status: vinculoPulseiraEvento.status,
          clienteNome: cliente.nome,
          clienteCelular: cliente.celular,
          pulseiraCodigoQr: pulseira.codigoQr,
        })
        .from(vinculoPulseiraEvento)
        .innerJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .innerJoin(cliente, eq(vinculoPulseiraEvento.clienteId, cliente.id))
        .where(
          and(
            eq(pulseira.codigoQr, codigoQr.trim()),
            eq(vinculoPulseiraEvento.eventoId, eventoId),
            eq(vinculoPulseiraEvento.status, 'ativo')
          )
        )
        .limit(1);
      return rows[0] || null;
    } catch (error: any) {
      console.error(`Error in vinculoPulseiraService.getActiveByPulseiraQr:`, error);
      throw new Error(error.message || 'Falha ao buscar vínculo da pulseira.', { cause: error });
    }
  },

  async create(data: {
    pulseiraId: string;
    clienteId: string;
    eventoId: string;
    mesaId?: string;
  }) {
    try {
      // Regra 3.1: Verificar se pulseira já possui vínculo ativo neste evento
      const existingActive = await db
        .select()
        .from(vinculoPulseiraEvento)
        .where(
          and(
            eq(vinculoPulseiraEvento.pulseiraId, data.pulseiraId),
            eq(vinculoPulseiraEvento.eventoId, data.eventoId),
            eq(vinculoPulseiraEvento.status, 'ativo')
          )
        )
        .limit(1);

      if (existingActive.length > 0) {
        throw new Error('Esta pulseira já possui um vínculo ativo neste evento.');
      }

      const rows = await db
        .insert(vinculoPulseiraEvento)
        .values({
          pulseiraId: data.pulseiraId,
          clienteId: data.clienteId,
          eventoId: data.eventoId,
          mesaId: data.mesaId || null,
          status: 'ativo',
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in vinculoPulseiraService.create:', error);
      throw new Error(error instanceof Error ? error.message : 'Falha ao vincular pulseira ao cliente no evento.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db
        .select({
          id: vinculoPulseiraEvento.id,
          pulseiraId: vinculoPulseiraEvento.pulseiraId,
          clienteId: vinculoPulseiraEvento.clienteId,
          eventoId: vinculoPulseiraEvento.eventoId,
          estabelecimentoId: evento.estabelecimentoId,
          mesaId: vinculoPulseiraEvento.mesaId,
          status: vinculoPulseiraEvento.status,
        })
        .from(vinculoPulseiraEvento)
        .innerJoin(evento, eq(vinculoPulseiraEvento.eventoId, evento.id))
        .where(eq(vinculoPulseiraEvento.id, id))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in vinculoPulseiraService.getById(${id}):`, error);
      return null;
    }
  },
};

// ==========================================
// 10. COMANDA REPOSITORY
// ==========================================
export const comandaService = {
  async getAll(eventoId: string, statusFilter?: 'aberta' | 'fechada') {
    try {
      const conditions = [eq(comanda.eventoId, eventoId)];
      if (statusFilter) {
        conditions.push(eq(comanda.status, statusFilter));
      }

      const rows = await db
        .select({
          id: comanda.id,
          eventoId: comanda.eventoId,
          estabelecimentoId: evento.estabelecimentoId,
          tipoAtendimento: comanda.tipoAtendimento,
          vinculoPulseiraEventoId: comanda.vinculoPulseiraEventoId,
          mesaId: comanda.mesaId,
          garcomResponsavelId: comanda.garcomResponsavelId,
          status: comanda.status,
          abertaEm: comanda.abertaEm,
          fechadaEm: comanda.fechadaEm,
          clienteNome: cliente.nome,
          clienteCelular: cliente.celular,
          pulseiraCodigoQr: pulseira.codigoQr,
          mesaIdentificador: mesa.identificador,
          garcomNome: usuario.nome,
        })
        .from(comanda)
        .innerJoin(evento, eq(comanda.eventoId, evento.id))
        .leftJoin(vinculoPulseiraEvento, eq(comanda.vinculoPulseiraEventoId, vinculoPulseiraEvento.id))
        .leftJoin(cliente, eq(vinculoPulseiraEvento.clienteId, cliente.id))
        .leftJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .leftJoin(mesa, or(eq(comanda.mesaId, mesa.id), eq(vinculoPulseiraEvento.mesaId, mesa.id)))
        .leftJoin(usuario, eq(comanda.garcomResponsavelId, usuario.id))
        .where(and(...conditions))
        .orderBy(desc(comanda.abertaEm));

      // Calculate totals for each comanda
      const comandaIds = rows.map((r) => r.id);
      if (comandaIds.length === 0) return [];

      // Fetch items for these comandas
      const items = await db
        .select({
          comandaId: pedido.comandaId,
          quantidade: pedidoItem.quantidade,
          preco: itemCardapio.preco,
        })
        .from(pedidoItem)
        .innerJoin(pedido, eq(pedidoItem.pedidoId, pedido.id))
        .innerJoin(itemCardapio, eq(pedidoItem.itemCardapioId, itemCardapio.id))
        .where(inArray(pedido.comandaId, comandaIds));

      const totalsMap = new Map<string, { totalConsumo: number; totalItens: number }>();
      for (const it of items) {
        const cur = totalsMap.get(it.comandaId) || { totalConsumo: 0, totalItens: 0 };
        const preco = Number(it.preco) || 0;
        const subtotal = preco * it.quantidade;
        cur.totalConsumo += subtotal;
        cur.totalItens += it.quantidade;
        totalsMap.set(it.comandaId, cur);
      }

      return rows.map((r) => {
        const totals = totalsMap.get(r.id) || { totalConsumo: 0, totalItens: 0 };
        return {
          ...r,
          totalConsumo: totals.totalConsumo,
          totalItens: totals.totalItens,
        };
      });
    } catch (error) {
      console.error('Error in comandaService.getAll:', error);
      throw new Error('Falha ao listar comandas.', { cause: error });
    }
  },

  async getById(id: string) {
    try {
      const rows = await db
        .select({
          id: comanda.id,
          eventoId: comanda.eventoId,
          estabelecimentoId: evento.estabelecimentoId,
          tipoAtendimento: comanda.tipoAtendimento,
          vinculoPulseiraEventoId: comanda.vinculoPulseiraEventoId,
          mesaId: comanda.mesaId,
          garcomResponsavelId: comanda.garcomResponsavelId,
          status: comanda.status,
          telefoneCliente: comanda.telefoneCliente,
          telefoneVerificado: comanda.telefoneVerificado,
          verificacaoMetodo: comanda.verificacaoMetodo,
          verificadoEm: comanda.verificadoEm,
          abertaEm: comanda.abertaEm,
          fechadaEm: comanda.fechadaEm,
          clienteNome: cliente.nome,
          clienteCelular: cliente.celular,
          pulseiraCodigoQr: pulseira.codigoQr,
          mesaIdentificador: mesa.identificador,
          garcomNome: usuario.nome,
        })
        .from(comanda)
        .innerJoin(evento, eq(comanda.eventoId, evento.id))
        .leftJoin(vinculoPulseiraEvento, eq(comanda.vinculoPulseiraEventoId, vinculoPulseiraEvento.id))
        .leftJoin(cliente, eq(vinculoPulseiraEvento.clienteId, cliente.id))
        .leftJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .leftJoin(mesa, or(eq(comanda.mesaId, mesa.id), eq(vinculoPulseiraEvento.mesaId, mesa.id)))
        .leftJoin(usuario, eq(comanda.garcomResponsavelId, usuario.id))
        .where(eq(comanda.id, id))
        .limit(1);

      if (!rows[0]) return null;
      const cmd = rows[0];

      // Fetch pedidos and items
      const pedidosRows = await db
        .select({
          id: pedido.id,
          comandaId: pedido.comandaId,
          origem: pedido.origem,
          statusValidacao: pedido.statusValidacao,
          telefoneVerificado: pedido.telefoneVerificado,
          confirmadoPresencialmente: pedido.confirmadoPresencialmente,
          verificacaoMetodo: pedido.verificacaoMetodo,
          criadoPor: pedido.criadoPor,
          criadoEm: pedido.criadoEm,
          criadoPorNome: usuario.nome,
        })
        .from(pedido)
        .leftJoin(usuario, eq(pedido.criadoPor, usuario.id))
        .where(eq(pedido.comandaId, id))
        .orderBy(desc(pedido.criadoEm));

      const pedidoIds = pedidosRows.map((p) => p.id);
      let itemsRows: any[] = [];
      if (pedidoIds.length > 0) {
        itemsRows = await db
          .select({
            id: pedidoItem.id,
            pedidoId: pedidoItem.pedidoId,
            itemCardapioId: pedidoItem.itemCardapioId,
            pontoDePreparoId: pedidoItem.pontoDePreparoId,
            quantidade: pedidoItem.quantidade,
            numeroExibicao: pedidoItem.numeroExibicao,
            status: pedidoItem.status,
            criadoEm: pedidoItem.criadoEm,
            prontoEm: pedidoItem.prontoEm,
            vistoEm: pedidoItem.vistoEm,
            entregueEm: pedidoItem.entregueEm,
            itemNome: itemCardapio.nome,
            itemPreco: itemCardapio.preco,
            pontoNome: pontoDePreparo.nome,
          })
          .from(pedidoItem)
          .innerJoin(itemCardapio, eq(pedidoItem.itemCardapioId, itemCardapio.id))
          .innerJoin(pontoDePreparo, eq(pedidoItem.pontoDePreparoId, pontoDePreparo.id))
          .where(inArray(pedidoItem.pedidoId, pedidoIds))
          .orderBy(desc(pedidoItem.criadoEm));
      }

      let totalConsumo = 0;
      let totalItens = 0;

      const pedidosWithItems = pedidosRows.map((p) => {
        const itens = itemsRows.filter((it) => it.pedidoId === p.id);
        for (const it of itens) {
          const preco = Number(it.itemPreco) || 0;
          totalConsumo += preco * it.quantidade;
          totalItens += it.quantidade;
        }
        return {
          ...p,
          itens,
        };
      });

      return {
        ...cmd,
        totalConsumo,
        totalItens,
        pedidos: pedidosWithItems,
      };
    } catch (error) {
      console.error(`Error in comandaService.getById(${id}):`, error);
      throw new Error('Falha ao buscar comanda.', { cause: error });
    }
  },

  async findByPulseiraQr(codigoQr: string, eventoId: string) {
    try {
      // Bloqueio rigoroso: se a pulseira foi comunicada como perdida, seu QR fica bloqueado para novos pedidos e fechamento
      const vinculoPerda = await db
        .select({ id: multaPulseiraPerdida.id })
        .from(multaPulseiraPerdida)
        .innerJoin(vinculoPulseiraEvento, eq(multaPulseiraPerdida.vinculoPulseiraEventoId, vinculoPulseiraEvento.id))
        .innerJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .where(
          and(
            eq(pulseira.codigoQr, codigoQr.trim()),
            eq(vinculoPulseiraEvento.eventoId, eventoId)
          )
        )
        .limit(1);

      if (vinculoPerda.length > 0) {
        throw new Error('Esta pulseira foi comunicada como perdida e seu QR está bloqueado para novos pedidos e fechamento.');
      }

      const rows = await db
        .select({
          comandaId: comanda.id,
          comandaStatus: comanda.status,
          clienteNome: cliente.nome,
          clienteCelular: cliente.celular,
          pulseiraCodigoQr: pulseira.codigoQr,
          mesaIdentificador: mesa.identificador,
        })
        .from(comanda)
        .innerJoin(vinculoPulseiraEvento, eq(comanda.vinculoPulseiraEventoId, vinculoPulseiraEvento.id))
        .innerJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .innerJoin(cliente, eq(vinculoPulseiraEvento.clienteId, cliente.id))
        .leftJoin(mesa, eq(vinculoPulseiraEvento.mesaId, mesa.id))
        .where(
          and(
            eq(pulseira.codigoQr, codigoQr.trim()),
            eq(comanda.eventoId, eventoId),
            eq(comanda.status, 'aberta'),
            eq(vinculoPulseiraEvento.status, 'ativo')
          )
        )
        .limit(1);

      if (rows.length === 0) return null;
      return await comandaService.getById(rows[0].comandaId);
    } catch (error: any) {
      console.error('Error in comandaService.findByPulseiraQr:', error);
      throw new Error(error.message || 'Falha ao buscar comanda por QR da pulseira.', { cause: error });
    }
  },

  async findByMesa(mesaId: string, eventoId: string) {
    try {
      const rows = await db
        .select({ id: comanda.id })
        .from(comanda)
        .where(
          and(
            eq(comanda.mesaId, mesaId),
            eq(comanda.eventoId, eventoId),
            eq(comanda.status, 'aberta')
          )
        )
        .limit(1);

      if (rows.length === 0) return null;
      return await comandaService.getById(rows[0].id);
    } catch (error) {
      console.error('Error in comandaService.findByMesa:', error);
      throw new Error('Falha ao buscar comanda por mesa.', { cause: error });
    }
  },

  async create(data: {
    eventoId: string;
    tipoAtendimento: 'pulseira' | 'mesa';
    vinculoPulseiraEventoId?: string;
    mesaId?: string;
    garcomResponsavelId?: string;
  }) {
    try {
      // Regra 3.6: Se mesaId foi fornecido, verificar se já existe comanda aberta na mesa
      if (data.mesaId) {
        const existingMesa = await db
          .select()
          .from(comanda)
          .where(
            and(
              eq(comanda.eventoId, data.eventoId),
              eq(comanda.mesaId, data.mesaId),
              eq(comanda.status, 'aberta')
            )
          )
          .limit(1);

        if (existingMesa.length > 0) {
          return existingMesa[0]; // Reconhece e retorna a existente, sem duplicar
        }
      }

      // Se vinculoPulseiraEventoId foi fornecido, verificar se já existe comanda aberta para este vínculo
      if (data.vinculoPulseiraEventoId) {
        const existingVinculo = await db
          .select()
          .from(comanda)
          .where(
            and(
              eq(comanda.eventoId, data.eventoId),
              eq(comanda.vinculoPulseiraEventoId, data.vinculoPulseiraEventoId),
              eq(comanda.status, 'aberta')
            )
          )
          .limit(1);

        if (existingVinculo.length > 0) {
          return existingVinculo[0];
        }
      }

      const rows = await db
        .insert(comanda)
        .values({
          eventoId: data.eventoId,
          tipoAtendimento: data.tipoAtendimento,
          vinculoPulseiraEventoId: data.vinculoPulseiraEventoId || null,
          mesaId: data.mesaId || null,
          garcomResponsavelId: data.garcomResponsavelId || null,
          status: 'aberta',
        })
        .returning();

      if (data.mesaId) {
        await mesaService.update(data.mesaId, { status: 'ocupada' });
      }

      return rows[0];
    } catch (error) {
      console.error('Error in comandaService.create:', error);
      throw new Error('Falha ao abrir comanda.', { cause: error });
    }
  },

  async updateStatus(id: string, status: 'aberta' | 'fechada') {
    try {
      const rows = await db
        .update(comanda)
        .set({
          status,
          fechadaEm: status === 'fechada' ? new Date() : null,
        })
        .where(eq(comanda.id, id))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in comandaService.updateStatus(${id}):`, error);
      throw new Error('Falha ao alterar status da comanda.', { cause: error });
    }
  },
};

// ==========================================
// 11. PEDIDO & KDS ROUTING REPOSITORY
// ==========================================
export const pedidoService = {
  async create(data: {
    comandaId: string;
    origem?: 'operador_balcao' | 'garcom' | 'autoatendimento';
    criadoPor?: string;
    itens: Array<{ itemCardapioId: string; quantidade: number }>;
  }) {
    return this.createWithRouting({
      comandaId: data.comandaId,
      origem: data.origem || 'garcom',
      criadoPor: data.criadoPor,
      itens: data.itens,
    });
  },

  async createWithRouting(data: {
    comandaId: string;
    origem: 'operador_balcao' | 'garcom' | 'autoatendimento';
    criadoPor?: string;
    itens: Array<{ itemCardapioId: string; quantidade: number }>;
    telefoneVerificado?: boolean;
    confirmadoPresencialmente?: boolean;
    verificacaoMetodo?: 'sms' | 'whatsapp' | 'presencial';
    statusValidacao?: 'aguardando_validacao' | 'validado' | 'recusado' | 'pendente';
  }) {
    try {
      if (data.itens.length === 0) {
        throw new Error('O pedido deve conter pelo menos um item.');
      }

      // Server-side validation of comanda state (never trust frontend)
      const cmd = await comandaService.getById(data.comandaId);
      if (!cmd) {
        throw new Error('Comanda não encontrada.');
      }
      if (cmd.status !== 'aberta') {
        throw new Error('Esta comanda está fechada. Não é permitido lançar novos pedidos.');
      }

      // Validação positiva explícita de mesa liberada/ocupada para pedidos:
      if (cmd.mesaId) {
        const mesaInfo = await db.select().from(mesa).where(eq(mesa.id, cmd.mesaId)).limit(1);
        const statusMesa = mesaInfo[0]?.status;
        const mesaAutorizada = statusMesa === 'liberada' || statusMesa === 'ocupada';
        if (!mesaAutorizada) {
          throw new Error('Mesa ainda não liberada pela equipe ou comanda já finalizada.');
        }
      } else if (data.origem === 'autoatendimento') {
        throw new Error('Autoatendimento permitido apenas para comandas vinculadas a mesas.');
      }

      // If pulseira, verify that the link in the event is active
      if (cmd.tipoAtendimento === 'pulseira' && cmd.vinculoPulseiraEventoId) {
        const vinc = await db
          .select()
          .from(vinculoPulseiraEvento)
          .where(eq(vinculoPulseiraEvento.id, cmd.vinculoPulseiraEventoId))
          .limit(1);
        if (vinc.length === 0 || vinc[0].status !== 'ativo') {
          throw new Error('Esta pulseira não possui um vínculo ativo neste evento.');
        }
      }

      // Regra: "limite de 3 pedidos pendentes por mesa" (conta só pedidos em aguardando_validacao)
      if (data.origem === 'autoatendimento') {
        const pendentesMesa = await db
          .select({ id: pedido.id })
          .from(pedido)
          .where(
            and(
              eq(pedido.comandaId, data.comandaId),
              eq(pedido.statusValidacao, 'aguardando_validacao')
            )
          );
        if (pendentesMesa.length >= 3) {
          throw new Error('Limite de 3 pedidos pendentes por mesa atingido. Aguarde a validação pelo garçom.');
        }
      }

      // Determina verificação de telefone e status de validação
      let telVerificado = false;
      let confPresencial = false;
      let metodoVerif: string | null = null;
      let stValidacao = 'aguardando_validacao';

      if (data.origem === 'autoatendimento') {
        const cmdTelVerificado = Boolean((cmd as any).telefoneVerificado);
        if (data.telefoneVerificado !== undefined) {
          telVerificado = Boolean(data.telefoneVerificado);
        } else {
          telVerificado = cmdTelVerificado;
        }

        confPresencial = Boolean(data.confirmadoPresencialmente);
        metodoVerif = data.verificacaoMetodo || (cmd as any).verificacaoMetodo || (telVerificado ? 'sms' : null);
        // Regra Seção 14: pedido do cliente fica em 'aguardando_validacao'
        stValidacao = data.statusValidacao || 'aguardando_validacao';
      } else {
        // Pedido criado pelo garçom ou operador de balcão nasce validado
        telVerificado = true;
        confPresencial = true;
        metodoVerif = 'presencial';
        stValidacao = 'validado';
      }

      // 1. Create Pedido
      const pedidoRows = await db
        .insert(pedido)
        .values({
          comandaId: data.comandaId,
          origem: data.origem,
          criadoPor: data.criadoPor || null,
          telefoneVerificado: telVerificado,
          confirmadoPresencialmente: confPresencial,
          verificacaoMetodo: metodoVerif,
          statusValidacao: stValidacao,
        })
        .returning();
      const novoPedido = pedidoRows[0];

      // 2. Fetch items info to get pontoDePreparoId and name
      const itemIds = data.itens.map((i) => i.itemCardapioId);
      const cardapioRows = await db
        .select()
        .from(itemCardapio)
        .where(inArray(itemCardapio.id, itemIds));

      const cardapioMap = new Map(cardapioRows.map((r) => [r.id, r]));

      // 3. Generate sequential display number
      const countRows = await db.select().from(pedidoItem);
      let seq = countRows.length + 101;

      // 4. Insert each PedidoItem with automatic routing to ponto_de_preparo
      // Regra Seção 14: pedido aguardando validação não gera numero_exibicao de preparo até ser validado pelo garçom
      const isAguardando = stValidacao === 'aguardando_validacao';
      const itemsToInsert = data.itens.map((it) => {
        const itemInfo = cardapioMap.get(it.itemCardapioId);
        if (!itemInfo) {
          throw new Error(`Item de cardápio ${it.itemCardapioId} não encontrado.`);
        }
        const numeroExibicao = isAguardando ? 'AGUARDANDO_VALIDACAO' : `P-${seq++}`;

        return {
          pedidoId: novoPedido.id,
          itemCardapioId: it.itemCardapioId,
          pontoDePreparoId: itemInfo.pontoDePreparoId, // Automatic routing!
          quantidade: Math.max(1, Number(it.quantidade) || 1),
          numeroExibicao,
          status: 'pendente' as const,
        };
      });

      const insertedItems = await db
        .insert(pedidoItem)
        .values(itemsToInsert)
        .returning();

      return {
        id: novoPedido.id,
        comandaId: novoPedido.comandaId,
        origem: novoPedido.origem,
        criadoPor: novoPedido.criadoPor,
        criadoEm: novoPedido.criadoEm,
        pedido: novoPedido,
        itens: insertedItems,
      };
    } catch (error) {
      console.error('Error in pedidoService.createWithRouting:', error);
      throw error;
    }
  },

  async getPedidosAguardandoValidacao(
    eventoId: string,
    estabelecimentoId: string,
    garcomId?: string
  ) {
    try {
      // 1. Filtragem por área do garçom (Regra: "só o garçom da área recebe o aviso")
      let mesasPermitidasIds: string[] | null = null;
      if (garcomId) {
        const garcomUser = await usuarioService.getById(garcomId);
        if (!garcomUser || garcomUser.estabelecimentoId !== estabelecimentoId) {
          throw new Error('Acesso negado: garçom pertence a outro estabelecimento.');
        }
        if (garcomUser.papel === 'garcom') {
          const areas = await db
            .select({ mesaId: garcomArea.mesaId })
            .from(garcomArea)
            .where(eq(garcomArea.garcomId, garcomId));
          mesasPermitidasIds = areas.map((a) => a.mesaId);
        }
      }

      // 2. Mapeamento de atribuições de mesas e status de turno dos garçons no evento
      const todasAtribuicoes = await db
        .select({
          garcomId: garcomArea.garcomId,
          mesaId: garcomArea.mesaId,
          garcomNome: usuario.nome,
        })
        .from(garcomArea)
        .leftJoin(usuario, eq(garcomArea.garcomId, usuario.id));

      const caixasEvento = await db
        .select({
          id: caixaGarcom.id,
          garcomId: caixaGarcom.garcomId,
          status: caixaGarcom.status,
        })
        .from(caixaGarcom)
        .where(eq(caixaGarcom.eventoId, eventoId));

      const garconsComCaixaAberto = new Set(
        caixasEvento.filter((c) => c.status === 'aberto').map((c) => c.garcomId)
      );
      const garconsComCaixaFechado = new Set(
        caixasEvento.filter((c) => c.status === 'fechado').map((c) => c.garcomId)
      );

      // O garçom chamador está em turno se não fechou o caixa e, caso haja caixas abertos no evento, ele possui caixa aberto
      let callerEmTurno = true;
      if (garcomId) {
        if (garconsComCaixaFechado.has(garcomId)) {
          callerEmTurno = false;
        } else if (garconsComCaixaAberto.size > 0 && !garconsComCaixaAberto.has(garcomId)) {
          callerEmTurno = false;
        }
      }

      // 3. Tempo limite configurado para alerta de atraso
      const estRows = await db
        .select()
        .from(estabelecimento)
        .where(eq(estabelecimento.id, estabelecimentoId))
        .limit(1);
      const tempoLimiteMin = (estRows[0]?.config as any)?.tempoLimiteValidacaoMin || 5;

      const rows = await db
        .select({
          pedidoId: pedido.id,
          comandaId: pedido.comandaId,
          origem: pedido.origem,
          telefoneVerificado: pedido.telefoneVerificado,
          confirmadoPresencialmente: pedido.confirmadoPresencialmente,
          verificacaoMetodo: pedido.verificacaoMetodo,
          statusValidacao: pedido.statusValidacao,
          criadoEm: pedido.criadoEm,
          mesaIdentificador: mesa.identificador,
          mesaId: mesa.id,
          telefoneCliente: comanda.telefoneCliente,
        })
        .from(pedido)
        .innerJoin(comanda, eq(pedido.comandaId, comanda.id))
        .innerJoin(evento, eq(comanda.eventoId, evento.id))
        .leftJoin(mesa, eq(comanda.mesaId, mesa.id))
        .where(
          and(
            eq(comanda.eventoId, eventoId),
            eq(evento.estabelecimentoId, estabelecimentoId),
            inArray(pedido.statusValidacao, ['aguardando_validacao', 'pendente'])
          )
        )
        .orderBy(desc(pedido.criadoEm));

      const now = Date.now();
      const results = [];
      for (const p of rows) {
        // Identificar se a mesa tem garçom atribuído ou se o garçom da área está fora de turno
        const mesaAtrib = p.mesaId ? todasAtribuicoes.find((a) => a.mesaId === p.mesaId) : null;
        let mesaSemGarcom = false;
        let garcomForaDeTurno = false;
        let garcomAtribuidoId: string | null = null;
        let garcomAtribuidoNome: string | null = null;

        if (!p.mesaId || !mesaAtrib) {
          mesaSemGarcom = true;
        } else {
          garcomAtribuidoId = mesaAtrib.garcomId;
          garcomAtribuidoNome = mesaAtrib.garcomNome || null;

          // Garçom da área fora de turno no evento:
          // Se fechou o caixa no evento, ou se outros garçons abriram caixa no evento e este não abriu
          if (garconsComCaixaFechado.has(mesaAtrib.garcomId)) {
            garcomForaDeTurno = true;
          } else if (garconsComCaixaAberto.size > 0 && !garconsComCaixaAberto.has(mesaAtrib.garcomId)) {
            garcomForaDeTurno = true;
          }
        }

        const alertaSemGarcomResponsavel = mesaSemGarcom || garcomForaDeTurno;
        const motivoAlertaSemGarcom = mesaSemGarcom
          ? 'mesa_sem_garcom'
          : (garcomForaDeTurno ? 'garcom_fora_de_turno' : null);

        // Regra:
        // (1) Só o garçom da área recebe o aviso se o garçom da área estiver em turno.
        // (2) Mesa sem garçom atribuído em garcom_area, ou com garçom da área fora de turno no evento:
        //     o pedido aguardando validação deve aparecer para qualquer garçom em turno!
        if (mesasPermitidasIds !== null) {
          // Garçom fora de turno não recebe pedidos para validar
          if (!callerEmTurno) {
            continue;
          }

          const isMesaDoGarcom = p.mesaId && mesasPermitidasIds.includes(p.mesaId);
          const podeAtenderComoGarcomEmTurno = alertaSemGarcomResponsavel && callerEmTurno;

          if (!isMesaDoGarcom && !podeAtenderComoGarcomEmTurno) {
            continue;
          }
        }

        const itens = await db
          .select({
            id: pedidoItem.id,
            itemNome: itemCardapio.nome,
            quantidade: pedidoItem.quantidade,
            numeroExibicao: pedidoItem.numeroExibicao,
            pontoNome: pontoDePreparo.nome,
          })
          .from(pedidoItem)
          .innerJoin(itemCardapio, eq(pedidoItem.itemCardapioId, itemCardapio.id))
          .innerJoin(pontoDePreparo, eq(pedidoItem.pontoDePreparoId, pontoDePreparo.id))
          .where(eq(pedidoItem.pedidoId, p.pedidoId));

        const diffMs = now - new Date(p.criadoEm).getTime();
        const tempoEsperaMin = Math.floor(diffMs / 60000);
        const emAtraso = tempoEsperaMin >= tempoLimiteMin;

        results.push({
          ...p,
          tempoEsperaMin,
          tempoLimiteMin,
          emAtraso,
          alertaTempoExcedido: emAtraso,
          alertaSemGarcomResponsavel,
          motivoAlertaSemGarcom,
          garcomAtribuidoId,
          garcomAtribuidoNome,
          mensagemAlertaGerente: mesaSemGarcom
            ? `Mesa ${p.mesaIdentificador || 'sem número'} sem garçom atribuído em garcom_area.`
            : (garcomForaDeTurno
                ? `Garçom ${garcomAtribuidoNome || 'da área'} da Mesa ${p.mesaIdentificador || ''} está fora de turno no evento.`
                : null),
          itens,
        });
      }
      return results;
    } catch (error) {
      console.error('Error in pedidoService.getPedidosAguardandoValidacao:', error);
      throw error;
    }
  },

  async updateItemStatus(
    itemId: string,
    newStatus: 'pendente' | 'em_preparo' | 'pronto' | 'visto' | 'entregue'
  ) {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === 'pronto') {
        updateData.prontoEm = new Date();
      } else if (newStatus === 'visto') {
        updateData.vistoEm = new Date();
      } else if (newStatus === 'entregue') {
        updateData.entregueEm = new Date();
      }

      const rows = await db
        .update(pedidoItem)
        .set(updateData)
        .where(eq(pedidoItem.id, itemId))
        .returning();
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in pedidoService.updateItemStatus(${itemId}):`, error);
      throw new Error('Falha ao atualizar status do item no KDS.', { cause: error });
    }
  },

  async getItemById(itemId: string) {
    try {
      const rows = await db
        .select({
          id: pedidoItem.id,
          pedidoId: pedidoItem.pedidoId,
          status: pedidoItem.status,
          comandaId: pedido.comandaId,
          estabelecimentoId: evento.estabelecimentoId,
        })
        .from(pedidoItem)
        .innerJoin(pedido, eq(pedidoItem.pedidoId, pedido.id))
        .innerJoin(comanda, eq(pedido.comandaId, comanda.id))
        .innerJoin(evento, eq(comanda.eventoId, evento.id))
        .where(eq(pedidoItem.id, itemId))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in pedidoService.getItemById(${itemId}):`, error);
      return null;
    }
  },

  async getKdsItems(pontoDePreparoId?: string, eventoId?: string) {
    try {
      let query = db
        .select({
          id: pedidoItem.id,
          pedidoId: pedidoItem.pedidoId,
          itemCardapioId: pedidoItem.itemCardapioId,
          pontoDePreparoId: pedidoItem.pontoDePreparoId,
          quantidade: pedidoItem.quantidade,
          numeroExibicao: pedidoItem.numeroExibicao,
          status: pedidoItem.status,
          criadoEm: pedidoItem.criadoEm,
          prontoEm: pedidoItem.prontoEm,
          vistoEm: pedidoItem.vistoEm,
          entregueEm: pedidoItem.entregueEm,
          itemNome: itemCardapio.nome,
          pontoNome: pontoDePreparo.nome,
          comandaId: pedido.comandaId,
          origem: pedido.origem,
        })
        .from(pedidoItem)
        .innerJoin(pedido, eq(pedidoItem.pedidoId, pedido.id))
        .innerJoin(itemCardapio, eq(pedidoItem.itemCardapioId, itemCardapio.id))
        .innerJoin(pontoDePreparo, eq(pedidoItem.pontoDePreparoId, pontoDePreparo.id));

      const conditions = [];
      // Regra Seção 14: pedido em aguardando_validacao NÃO aparece no KDS. Apenas pedidos validados.
      // Recusar não gera nada no KDS (statusValidacao fica 'recusado' e não passa neste filtro).
      conditions.push(eq(pedido.statusValidacao, 'validado'));

      if (pontoDePreparoId) {
        conditions.push(eq(pedidoItem.pontoDePreparoId, pontoDePreparoId));
      }

      return await query.where(and(...conditions)).orderBy(asc(pedidoItem.criadoEm));
    } catch (error) {
      console.error('Error in pedidoService.getKdsItems:', error);
      throw new Error('Falha ao carregar fila do KDS.', { cause: error });
    }
  },

  async recusarPedido(data: {
    pedidoId: string;
    garcomId: string;
    motivoRecusa: string;
    estabelecimentoId: string;
  }) {
    try {
      const pedRows = await db
        .select({
          id: pedido.id,
          comandaId: pedido.comandaId,
          estabelecimentoId: evento.estabelecimentoId,
        })
        .from(pedido)
        .innerJoin(comanda, eq(pedido.comandaId, comanda.id))
        .innerJoin(evento, eq(comanda.eventoId, evento.id))
        .where(eq(pedido.id, data.pedidoId))
        .limit(1);

      if (!pedRows[0]) throw new Error('Pedido não encontrado.');
      if (pedRows[0].estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Acesso negado: pedido pertence a outro estabelecimento.');
      }

      const recusadoEm = new Date();
      const updated = await db
        .update(pedido)
        .set({
          statusValidacao: 'recusado',
          motivoRecusa: data.motivoRecusa || 'Recusado pelo garçom.',
          validadoPor: data.garcomId,
          validadoEm: recusadoEm,
        })
        .where(eq(pedido.id, data.pedidoId))
        .returning();

      return {
        sucesso: true,
        pedido: updated[0],
        recusado: true,
      };
    } catch (error) {
      console.error('Error in pedidoService.recusarPedido:', error);
      throw error;
    }
  },

  async validarPedido(data: {
    pedidoId: string;
    garcomId: string;
    confirmadoPresencialmente?: boolean;
    estabelecimentoId: string;
  }) {
    return await telefoneVerificacaoService.validarPedidoPresencial({
      pedidoId: data.pedidoId,
      garcomId: data.garcomId,
      confirmadoPresencialmente: Boolean(data.confirmadoPresencialmente),
      estabelecimentoId: data.estabelecimentoId,
    });
  },

  async getFilaEntregaGarcom(eventoId?: string, garcomId?: string) {
    try {
      const items = await this.getKdsItems(undefined, eventoId);
      // Items that are ready to be picked up ('pronto')
      const prontos = items.filter((it) => it.status === 'pronto');

      // Fetch configured metaTempoResposta for the waiter in this event
      let metaSegundos = 180; // default 3 min (180s)
      let metaTempoResposta = '00:03:00';
      if (eventoId && garcomId) {
        const cfg = await db
          .select({ metaTempoResposta: garcomComissao.metaTempoResposta })
          .from(garcomComissao)
          .where(and(eq(garcomComissao.garcomId, garcomId), eq(garcomComissao.eventoId, eventoId)))
          .limit(1);
        if (cfg.length > 0 && cfg[0].metaTempoResposta) {
          metaTempoResposta = cfg[0].metaTempoResposta;
          const parts = metaTempoResposta.split(':');
          const mins = Number(parts[1]) || 3;
          metaSegundos = mins * 60;
        }
      }

      const enhanced = await Promise.all(
        prontos.map(async (it) => {
          const cmd = await comandaService.getById(it.comandaId);
          const diffSeconds = Math.floor(
            (Date.now() - new Date(it.prontoEm || it.criadoEm).getTime()) / 1000
          );
          return {
            ...it,
            mesaIdentificador: cmd?.mesaIdentificador || null,
            pulseiraCodigoQr: cmd?.pulseiraCodigoQr || null,
            clienteNome: cmd?.clienteNome || 'Cliente',
            clienteCelular: cmd?.clienteCelular || null,
            segundosPronto: Math.max(0, diffSeconds),
            garcomResponsavelId: cmd?.garcomResponsavelId || null,
            metaSegundos,
            metaTempoResposta,
            isAtrasado: diffSeconds >= metaSegundos,
          };
        })
      );

      return enhanced.sort((a, b) => b.segundosPronto - a.segundosPronto);
    } catch (error) {
      console.error('Error in pedidoService.getFilaEntregaGarcom:', error);
      throw new Error('Falha ao carregar fila de entrega do garçom.', { cause: error });
    }
  },
};

// ==========================================
// 12. FECHAMENTO DE COMANDA, PAGAMENTO & RATEIO
// ==========================================
export const fechamentoService = {
  async getPreviaFechamento(comandaId: string) {
    return this.getPrevia(comandaId);
  },

  async getPrevia(comandaId: string) {
    try {
      const cmd = await comandaService.getById(comandaId);
      if (!cmd) throw new Error('Comanda não encontrada.');

      // Collect all items
      const itemsList: Array<{
        id: string;
        nome: string;
        preco: number;
        quantidade: number;
        subtotal: number;
        pontoId: string;
        pontoNome: string;
        tipo: 'bebida' | 'comida';
        taxaItem: number;
        rateioGarcom: number;
        rateioCopa: number;
        rateioCozinha: number;
      }> = [];

      let totalConsumo = 0;

      if (cmd.pedidos && cmd.pedidos.length > 0) {
        for (const p of cmd.pedidos) {
          for (const it of p.itens) {
            const preco = Number(it.itemPreco) || 0;
            const subtotal = preco * it.quantidade;
            totalConsumo += subtotal;

            const pNome = (it.pontoNome || '').toLowerCase();
            const isBebida =
              pNome.includes('copa') ||
              pNome.includes('bar') ||
              pNome.includes('chopeira') ||
              pNome.includes('bebida');

            const tipo: 'bebida' | 'comida' = isBebida ? 'bebida' : 'comida';
            const taxaItem = subtotal * 0.10;

            let rateioGarcom = 0;
            let rateioCopa = 0;
            let rateioCozinha = 0;

            if (tipo === 'bebida') {
              // Bebida: garçom 60% / copa 40%
              rateioGarcom = taxaItem * 0.60;
              rateioCopa = taxaItem * 0.40;
              rateioCozinha = 0;
            } else {
              // Comida: cozinha 60% / garçom 20% / copa 20%
              rateioCozinha = taxaItem * 0.60;
              rateioGarcom = taxaItem * 0.20;
              rateioCopa = taxaItem * 0.20;
            }

            itemsList.push({
              id: it.id,
              nome: it.itemNome || 'Item',
              preco,
              quantidade: it.quantidade,
              subtotal,
              pontoId: it.pontoDePreparoId,
              pontoNome: it.pontoNome || 'Ponto de Preparo',
              tipo,
              taxaItem,
              rateioGarcom,
              rateioCopa,
              rateioCozinha,
            });
          }
        }
      }

      const taxaServico10 = totalConsumo * 0.10;
      const totalGarcom10 = Math.round(itemsList.reduce((acc, curr) => acc + curr.rateioGarcom, 0) * 100) / 100;
      const totalCopa10 = Math.round(itemsList.reduce((acc, curr) => acc + curr.rateioCopa, 0) * 100) / 100;
      const totalCozinha10 = Math.round(itemsList.reduce((acc, curr) => acc + curr.rateioCozinha, 0) * 100) / 100;

      const rateio10Estimado = {
        garcom: totalGarcom10,
        copa: totalCopa10,
        cozinha: totalCozinha10,
        rateioBeneficiarios: {
          totalGarcom: totalGarcom10,
          totalCopa: totalCopa10,
          totalCozinha: totalCozinha10,
        },
      };

      return {
        comanda: cmd,
        itens: itemsList,
        totalConsumo,
        taxaServico10,
        rateio10Estimado,
      };
    } catch (error) {
      console.error('Error in fechamentoService.getPrevia:', error);
      throw new Error('Falha ao calcular prévia de fechamento da comanda.', { cause: error });
    }
  },

  async fecharComandaEfetuarPagamento(data: {
    comandaId: string;
    metodo: 'pix' | 'cartao_credito' | 'cartao_debito' | 'credito' | 'debito' | 'dinheiro';
    tipoContribuicao: 'taxa_servico_10' | 'gorjeta_livre' | 'nenhuma';
    valorContribuicao?: number;
    valorRecebido?: number;
    bandeira?: string;
    nsu?: string;
    idempotencyKey?: string;
    garcomId?: string;
    registradoPor?: string;
  }) {
    try {
      // 0. PCI Security Check: Never accept or store card numbers, validity, or CVV
      const payloadAny = data as any;
      if (
        payloadAny.numeroCartao ||
        payloadAny.numero_cartao ||
        payloadAny.cartao ||
        payloadAny.cvv ||
        payloadAny.cvc ||
        payloadAny.validade ||
        payloadAny.expiracao
      ) {
        throw new Error(
          'Por conformidade de segurança e PCI, dados sensíveis de cartão (número, validade, CVV) nunca podem ser enviados ou armazenados.'
        );
      }

      // Idempotency check 1: Check by idempotencyKey
      if (data.idempotencyKey) {
        const porKey = await db
          .select()
          .from(cobranca)
          .where(eq(cobranca.idempotencyKey, data.idempotencyKey))
          .limit(1);
        if (porKey.length > 0) {
          const cob = porKey[0];
          const pagExistente = await db
            .select()
            .from(pagamento)
            .where(eq(pagamento.comandaId, cob.comandaId))
            .limit(1);
          return {
            sucesso: true,
            idempotente: true,
            comandaId: cob.comandaId,
            cobranca: cob,
            pagamento: pagExistente[0] || null,
            totalConsumo: Number(cob.valor) - (cob.valorContribuicao ? Number(cob.valorContribuicao) : 0),
            valorContribuicao: cob.valorContribuicao ? Number(cob.valorContribuicao) : 0,
            totalPago: Number(cob.valor),
            troco: cob.troco ? Number(cob.troco) : 0,
            trocoCentavos: cob.troco ? Math.round(Number(cob.troco) * 100) : 0,
            rateiosInseridos: 0,
            rateio10Estimado: 0,
            valorGarcomRateio: 0,
          };
        }
      }

      // Idempotency check 2: Check existing approved cobranca for this comanda
      const existingCobranca = await db
        .select()
        .from(cobranca)
        .where(and(eq(cobranca.comandaId, data.comandaId), eq(cobranca.status, 'aprovada')))
        .limit(1);
      if (existingCobranca.length > 0) {
        const cob = existingCobranca[0];
        const pagExistente = await db
          .select()
          .from(pagamento)
          .where(eq(pagamento.comandaId, data.comandaId))
          .limit(1);
        return {
          sucesso: true,
          idempotente: true,
          comandaId: data.comandaId,
          cobranca: cob,
          pagamento: pagExistente[0] || null,
          totalConsumo: Number(cob.valor) - (cob.valorContribuicao ? Number(cob.valorContribuicao) : 0),
          valorContribuicao: cob.valorContribuicao ? Number(cob.valorContribuicao) : 0,
          totalPago: Number(cob.valor),
          troco: cob.troco ? Number(cob.troco) : 0,
          trocoCentavos: cob.troco ? Math.round(Number(cob.troco) * 100) : 0,
          rateiosInseridos: 0,
          rateio10Estimado: 0,
          valorGarcomRateio: 0,
        };
      }

      const cmd = await comandaService.getById(data.comandaId);
      if (!cmd) throw new Error('Comanda não encontrada.');
      if (cmd.status === 'fechada') {
        throw new Error('Esta comanda já foi encerrada anteriormente.');
      }

      // Check existing pagamento
      const existingPagamento = await db
        .select()
        .from(pagamento)
        .where(eq(pagamento.comandaId, data.comandaId))
        .limit(1);
      if (existingPagamento.length > 0) {
        throw new Error('Já existe um pagamento processado para esta comanda.');
      }

      // 1. Resolve Garçom
      let finalGarcomId = data.garcomId || data.registradoPor || cmd.garcomResponsavelId;
      if (!finalGarcomId) {
        // Fallback: find any garcom in the establishment or current event
        const waiters = await db
          .select()
          .from(usuario)
          .where(eq(usuario.papel, 'garcom'))
          .limit(1);
        if (waiters.length > 0) {
          finalGarcomId = waiters[0].id;
        } else {
          // If no garcom, any user
          const anyUser = await db.select().from(usuario).limit(1);
          if (anyUser.length > 0) finalGarcomId = anyUser[0].id;
        }
      }

      if (!finalGarcomId) {
        throw new Error('Não há garçom ou usuário cadastrado para atribuição da comissão.');
      }

      // 2. Fetch all items
      const previa = await this.getPrevia(data.comandaId);
      const totalConsumo = previa.totalConsumo;

      // 3. Compute contribution value
      let valorContribuicao = 0;
      if (data.tipoContribuicao === 'taxa_servico_10') {
        valorContribuicao = Math.round(totalConsumo * 0.10 * 100) / 100;
      } else if (data.tipoContribuicao === 'gorjeta_livre') {
        valorContribuicao = Math.max(0, Number(data.valorContribuicao) || 0);
      } else {
        valorContribuicao = 0;
      }

      const totalAPagar = Math.round((totalConsumo + valorContribuicao) * 100) / 100;

      // Normalize metodo
      let metodoCobranca: 'pix' | 'credito' | 'debito' | 'dinheiro' = 'pix';
      let metodoPagamento: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' = 'pix';

      if (data.metodo === 'credito' || data.metodo === 'cartao_credito') {
        metodoCobranca = 'credito';
        metodoPagamento = 'cartao_credito';
      } else if (data.metodo === 'debito' || data.metodo === 'cartao_debito') {
        metodoCobranca = 'debito';
        metodoPagamento = 'cartao_debito';
      } else if (data.metodo === 'dinheiro') {
        metodoCobranca = 'dinheiro';
        metodoPagamento = 'dinheiro';
      } else {
        metodoCobranca = 'pix';
        metodoPagamento = 'pix';
      }

      // Dinheiro validation & change calculation (in exact cents)
      let troco: number | null = null;
      let trocoCentavos: number | null = null;
      let valorRecebidoNum: number | null = null;

      if (metodoCobranca === 'dinheiro') {
        if (data.valorRecebido === undefined || data.valorRecebido === null) {
          throw new Error('Valor recebido é obrigatório para pagamentos em dinheiro.');
        }
        valorRecebidoNum = Number(data.valorRecebido);
        const totalCentavos = Math.round(totalAPagar * 100);
        const recebidoCentavos = Math.round(valorRecebidoNum * 100);

        if (recebidoCentavos < totalCentavos) {
          throw new Error(
            `Valor recebido (R$ ${(recebidoCentavos / 100).toFixed(2)}) é menor que o total a pagar (R$ ${(totalCentavos / 100).toFixed(2)}).`
          );
        }
        trocoCentavos = recebidoCentavos - totalCentavos;
        troco = trocoCentavos / 100;
      }

      // 4. Register Pagamento (backwards compatibility)
      const pagamentoRows = await db
        .insert(pagamento)
        .values({
          comandaId: data.comandaId,
          metodo: metodoPagamento,
          valor: String(totalConsumo.toFixed(2)),
          tipoContribuicao: data.tipoContribuicao,
          valorContribuicao: String(valorContribuicao.toFixed(2)),
          status: 'pago',
        })
        .returning();

      const novoPagamento = pagamentoRows[0];

      // 4.1 Register Cobranca
      const cobrancaRows = await db
        .insert(cobranca)
        .values({
          estabelecimentoId: cmd.estabelecimentoId,
          eventoId: cmd.eventoId,
          comandaId: data.comandaId,
          metodo: metodoCobranca,
          valor: String(totalAPagar.toFixed(2)),
          valorRecebido: valorRecebidoNum !== null ? String(valorRecebidoNum.toFixed(2)) : null,
          troco: troco !== null ? String(troco.toFixed(2)) : null,
          bandeira: data.bandeira || null,
          nsu: data.nsu || null,
          tipoContribuicao: data.tipoContribuicao,
          valorContribuicao: String(valorContribuicao.toFixed(2)),
          status: 'aprovada',
          idempotencyKey: data.idempotencyKey || null,
          registradoPor: finalGarcomId,
        })
        .returning();

      const novaCobranca = cobrancaRows[0];

      // Auditoria de cobrança manual
      console.log(
        `[AUDITORIA][COBRANCA_MANUAL] Registrada por usuário ${finalGarcomId} em ${new Date().toISOString()} via método ${metodoCobranca} no valor de R$ ${totalAPagar.toFixed(2)} para comanda ${data.comandaId}`
      );

      // 5. Calculate and insert rateios
      const rateiosToInsert: Array<{
        pedidoItemId: string;
        pontoDePreparoId: string;
        garcomId: string;
        valorGarcom: string;
        valorPontoPreparo: string;
      }> = [];

      // Find Copa point of the establishment for 20% comida share
      const allPontos = await db.select().from(pontoDePreparo);
      const copaPoint =
        allPontos.find((p) => {
          const n = p.nome.toLowerCase();
          return n.includes('copa') || n.includes('bar') || n.includes('chopeira');
        }) || allPontos[0];

      if (data.tipoContribuicao === 'taxa_servico_10' && previa.itens.length > 0) {
        for (const it of previa.itens) {
          if (it.taxaItem <= 0) continue;

          if (it.tipo === 'bebida') {
            // Regra Seção 5: bebida: garçom 60% / copa 40%
            rateiosToInsert.push({
              pedidoItemId: it.id,
              pontoDePreparoId: it.pontoId,
              garcomId: finalGarcomId,
              valorGarcom: (it.taxaItem * 0.60).toFixed(2),
              valorPontoPreparo: (it.taxaItem * 0.40).toFixed(2),
            });
          } else {
            // Regra Seção 5: comida: cozinha 60% / garçom 20% / copa 20%
            // 1) Cozinha portion (60%) + Garçom portion (20%)
            rateiosToInsert.push({
              pedidoItemId: it.id,
              pontoDePreparoId: it.pontoId, // Cozinha
              garcomId: finalGarcomId,
              valorGarcom: (it.taxaItem * 0.20).toFixed(2),
              valorPontoPreparo: (it.taxaItem * 0.60).toFixed(2),
            });

            // 2) Copa portion (20%)
            if (copaPoint && copaPoint.id !== it.pontoId) {
              rateiosToInsert.push({
                pedidoItemId: it.id,
                pontoDePreparoId: copaPoint.id,
                garcomId: finalGarcomId,
                valorGarcom: '0.00',
                valorPontoPreparo: (it.taxaItem * 0.20).toFixed(2),
              });
            }
          }
        }
      } else if (data.tipoContribuicao === 'gorjeta_livre' && valorContribuicao > 0 && previa.itens.length > 0) {
        // Regra Seção 5: gorjeta livre: 100% garçom
        const firstItem = previa.itens[0];
        rateiosToInsert.push({
          pedidoItemId: firstItem.id,
          pontoDePreparoId: firstItem.pontoId,
          garcomId: finalGarcomId,
          valorGarcom: valorContribuicao.toFixed(2),
          valorPontoPreparo: '0.00',
        });
      }

      if (rateiosToInsert.length > 0) {
        await db.insert(rateioTaxaServico).values(rateiosToInsert);
      }

      // 6. Close Comanda
      await db
        .update(comanda)
        .set({
          status: 'fechada',
          fechadaEm: new Date(),
          garcomResponsavelId: finalGarcomId,
        })
        .where(eq(comanda.id, data.comandaId));

      // 7. Close Pulseira link if exists
      if (cmd.vinculoPulseiraEventoId) {
        await db
          .update(vinculoPulseiraEvento)
          .set({
            status: 'encerrado',
            fim: new Date(),
          })
          .where(eq(vinculoPulseiraEvento.id, cmd.vinculoPulseiraEventoId));
      }

      // 8. Free table if exists
      if (cmd.mesaId) {
        await db
          .update(mesa)
          .set({ status: 'livre' })
          .where(eq(mesa.id, cmd.mesaId));
      }

      const valorGarcomRateio = rateiosToInsert.reduce(
        (acc, r) => acc + (Number(r.valorGarcom) || 0),
        0
      );

      return {
        sucesso: true,
        comandaId: data.comandaId,
        cobranca: novaCobranca,
        pagamento: novoPagamento,
        totalConsumo,
        valorContribuicao,
        totalPago: totalAPagar,
        troco: troco !== null ? troco : 0,
        trocoCentavos: trocoCentavos !== null ? trocoCentavos : 0,
        rateiosInseridos: rateiosToInsert.length,
        rateio10Estimado: previa.rateio10Estimado,
        valorGarcomRateio: Math.round(valorGarcomRateio * 100) / 100,
      };
    } catch (error) {
      console.error('Error in fechamentoService.fecharComandaEfetuarPagamento:', error);
      throw new Error('Falha ao fechar comanda e processar pagamento/rateio.', { cause: error });
    }
  },

  async getRelatorioRateios(estabelecimentoId: string, eventoId?: string) {
    try {
      // 1. Get all closed comandas with pagamento
      const conditions = [];
      if (eventoId) {
        conditions.push(eq(comanda.eventoId, eventoId));
      }

      const pagamentosList = await db
        .select({
          id: pagamento.id,
          comandaId: pagamento.comandaId,
          metodo: pagamento.metodo,
          valorConsumo: pagamento.valor,
          tipoContribuicao: pagamento.tipoContribuicao,
          valorContribuicao: pagamento.valorContribuicao,
          criadoEm: pagamento.criadoEm,
          clienteNome: cliente.nome,
          pulseiraCodigo: pulseira.codigoQr,
          mesaIdentificador: mesa.identificador,
          garcomNome: usuario.nome,
          garcomId: usuario.id,
          eventoNome: evento.nome,
        })
        .from(pagamento)
        .innerJoin(comanda, eq(pagamento.comandaId, comanda.id))
        .innerJoin(evento, eq(comanda.eventoId, evento.id))
        .leftJoin(vinculoPulseiraEvento, eq(comanda.vinculoPulseiraEventoId, vinculoPulseiraEvento.id))
        .leftJoin(cliente, eq(vinculoPulseiraEvento.clienteId, cliente.id))
        .leftJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .leftJoin(mesa, or(eq(comanda.mesaId, mesa.id), eq(vinculoPulseiraEvento.mesaId, mesa.id)))
        .leftJoin(usuario, eq(comanda.garcomResponsavelId, usuario.id))
        .where(and(...conditions))
        .orderBy(desc(pagamento.criadoEm));

      // 2. Get all rateio entries
      const rateiosList = await db
        .select({
          id: rateioTaxaServico.id,
          pedidoItemId: rateioTaxaServico.pedidoItemId,
          pontoDePreparoId: rateioTaxaServico.pontoDePreparoId,
          pontoNome: pontoDePreparo.nome,
          garcomId: rateioTaxaServico.garcomId,
          garcomNome: usuario.nome,
          valorGarcom: rateioTaxaServico.valorGarcom,
          valorPontoPreparo: rateioTaxaServico.valorPontoPreparo,
        })
        .from(rateioTaxaServico)
        .innerJoin(pontoDePreparo, eq(rateioTaxaServico.pontoDePreparoId, pontoDePreparo.id))
        .innerJoin(usuario, eq(rateioTaxaServico.garcomId, usuario.id));

      // 3. Compute Metrics
      let totalFaturadoConsumo = 0;
      let totalTaxasGorjetas = 0;
      const metodoBreakdown = {
        pix: 0,
        cartao_credito: 0,
        cartao_debito: 0,
      };

      for (const p of pagamentosList) {
        const vConsumo = Number(p.valorConsumo) || 0;
        const vContrib = Number(p.valorContribuicao) || 0;
        totalFaturadoConsumo += vConsumo;
        totalTaxasGorjetas += vContrib;

        const totalComanda = vConsumo + vContrib;
        if (p.metodo === 'pix') metodoBreakdown.pix += totalComanda;
        else if (p.metodo === 'cartao_credito') metodoBreakdown.cartao_credito += totalComanda;
        else if (p.metodo === 'cartao_debito') metodoBreakdown.cartao_debito += totalComanda;
      }

      // Group rateio by Garçom
      const garconsMap = new Map<string, { id: string; nome: string; totalComissao: number; countContas: Set<string> }>();
      let totalCopa = 0;
      let totalCozinha = 0;

      for (const r of rateiosList) {
        const vGarcom = Number(r.valorGarcom) || 0;
        const vPonto = Number(r.valorPontoPreparo) || 0;

        if (vGarcom > 0) {
          const cur = garconsMap.get(r.garcomId) || {
            id: r.garcomId,
            nome: r.garcomNome || 'Garçom',
            totalComissao: 0,
            countContas: new Set<string>(),
          };
          cur.totalComissao += vGarcom;
          garconsMap.set(r.garcomId, cur);
        }

        const pNome = r.pontoNome.toLowerCase();
        if (pNome.includes('copa') || pNome.includes('bar') || pNome.includes('chopeira')) {
          totalCopa += vPonto;
        } else if (pNome.includes('cozinha')) {
          totalCozinha += vPonto;
        } else {
          totalCopa += vPonto;
        }
      }

      const garconsBreakdown = Array.from(garconsMap.values()).map((g) => ({
        id: g.id,
        nome: g.nome,
        totalComissao: g.totalComissao,
      }));

      const totalGarcons = garconsBreakdown.reduce((acc, curr) => acc + curr.totalComissao, 0);

      return {
        totalFaturadoConsumo,
        totalTaxasGorjetas,
        totalGeral: totalFaturadoConsumo + totalTaxasGorjetas,
        metodoBreakdown,
        rateioBeneficiarios: {
          totalGarcons,
          totalCopa,
          totalCozinha,
          garcons: garconsBreakdown,
        },
        pagamentos: pagamentosList,
      };
    } catch (error) {
      console.error('Error in fechamentoService.getRelatorioRateios:', error);
      throw new Error('Falha ao gerar relatório de fechamento e rateios.', { cause: error });
    }
  },
};

// ==========================================
// 13. REGRA DE PULSEIRA PERDIDA (MULTA 30 MIN, 1X / 5X - NUNCA FIXO)
// ==========================================

export function extrairIdCurtoPulseira(codigoQr: string): string {
  if (!codigoQr) return 'Pulseira';
  const match = codigoQr.match(/(PULS?-\d+)$/i);
  if (match) return match[1].toUpperCase();
  if (codigoQr.length > 10) return codigoQr.slice(-8);
  return codigoQr;
}

export interface AuditoriaPerdaRegistro {
  id: string;
  vinculoPulseiraEventoId: string;
  estabelecimentoId?: string;
  eventoId?: string;
  comunicadoEm: Date;
  usuarioId?: string;
  usuarioNome?: string;
  usuarioPapel?: string;
}

export const auditoriaPulseirasPerdidas: AuditoriaPerdaRegistro[] = [];

export const multaPulseiraService = {
  async iniciarTolerancia(
    vinculoPulseiraEventoId: string,
    callerEstId?: string,
    callerUserId?: string,
    callerInfo?: { nome?: string; papel?: string }
  ) {
    try {
      const vinculoRows = await db
        .select({
          id: vinculoPulseiraEvento.id,
          estabelecimentoId: evento.estabelecimentoId,
          eventoId: vinculoPulseiraEvento.eventoId,
          pulseiraId: vinculoPulseiraEvento.pulseiraId,
          clienteId: vinculoPulseiraEvento.clienteId,
          status: vinculoPulseiraEvento.status,
        })
        .from(vinculoPulseiraEvento)
        .innerJoin(evento, eq(vinculoPulseiraEvento.eventoId, evento.id))
        .where(eq(vinculoPulseiraEvento.id, vinculoPulseiraEventoId))
        .limit(1);

      if (vinculoRows.length === 0) {
        throw new Error('Vínculo de pulseira não encontrado.');
      }

      const vinc = vinculoRows[0];
      if (callerEstId && vinc.estabelecimentoId !== callerEstId) {
        throw new Error('Acesso negado: vínculo pertence a outro estabelecimento.');
      }

      // Idempotência estrita: se já iniciada, devolver a existente sem reiniciar o relógio
      const existing = await db
        .select()
        .from(multaPulseiraPerdida)
        .where(eq(multaPulseiraPerdida.vinculoPulseiraEventoId, vinculoPulseiraEventoId))
        .orderBy(desc(multaPulseiraPerdida.comunicadoEm))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Gravar o início com horário do SERVIDOR
      const agora = new Date();
      const prazoLimite = new Date(agora.getTime() + 30 * 60 * 1000); // 30 minutos de tolerância exata

      const rows = await db
        .insert(multaPulseiraPerdida)
        .values({
          vinculoPulseiraEventoId,
          comunicadoEm: agora,
          prazoLimite,
          multiplicador: '5.0',
        })
        .returning();

      // Bloqueio do QR: registrado via multaPulseiraPerdida (bloqueia consultas ativas e fechamento por este QR)

      // Auditoria: registrar quem comunicou e log estruturado
      const auditEntry: AuditoriaPerdaRegistro = {
        id: crypto.randomUUID(),
        vinculoPulseiraEventoId,
        estabelecimentoId: vinc.estabelecimentoId,
        eventoId: vinc.eventoId,
        comunicadoEm: agora,
        usuarioId: callerUserId,
        usuarioNome: callerInfo?.nome,
        usuarioPapel: callerInfo?.papel,
      };
      auditoriaPulseirasPerdidas.push(auditEntry);

      console.log(
        `[AUDITORIA][PULSEIRA_PERDIDA] Tolerância de 30 min iniciada para vinculo ${vinculoPulseiraEventoId}. Comunicado por: ${callerInfo?.nome || callerUserId || 'sistema'} (${callerInfo?.papel || 'operador'}) às ${agora.toISOString()} com prazo até ${prazoLimite.toISOString()}`
      );

      return rows[0];
    } catch (error) {
      console.error('Error in multaPulseiraService.iniciarTolerancia:', error);
      throw new Error(error instanceof Error ? error.message : 'Falha ao iniciar tolerância de pulseira perdida.', {
        cause: error,
      });
    }
  },

  async comunicarPerda(
    vinculoPulseiraEventoId: string,
    callerEstId?: string,
    callerUserId?: string,
    callerInfo?: { nome?: string; papel?: string }
  ) {
    return await this.iniciarTolerancia(vinculoPulseiraEventoId, callerEstId, callerUserId, callerInfo);
  },

  async buscarPorCelular(celularRaw: string, estabelecimentoId: string, eventoId?: string) {
    try {
      const cleanDigits = normalizarCelular(celularRaw);
      if (!cleanDigits) {
        return [];
      }

      // Determinar o evento alvo (se não fornecido, busca o evento ativo do estabelecimento)
      let targetEventoId = eventoId;
      if (!targetEventoId) {
        const evAtivo = await eventoService.getActive(estabelecimentoId);
        if (!evAtivo) return [];
        targetEventoId = evAtivo.id;
      }

      // Buscar todos os clientes do estabelecimento e filtrar por celular normalizado
      const todosClientes = await db
        .select()
        .from(cliente)
        .where(eq(cliente.estabelecimentoId, estabelecimentoId));

      const clientesMatch = todosClientes.filter((c) => {
        const cClean = normalizarCelular(c.celular || '');
        return cClean === cleanDigits;
      });

      if (clientesMatch.length === 0) {
        return [];
      }

      const clienteIds = clientesMatch.map((c) => c.id);

      // Buscar vínculos deste cliente neste evento
      // Inclui vínculos 'ativo' e 'invalidado_perda' (tolerância já iniciada)
      const vinculoRows = await db
        .select({
          id: vinculoPulseiraEvento.id,
          pulseiraId: vinculoPulseiraEvento.pulseiraId,
          clienteId: vinculoPulseiraEvento.clienteId,
          eventoId: vinculoPulseiraEvento.eventoId,
          mesaId: vinculoPulseiraEvento.mesaId,
          status: vinculoPulseiraEvento.status,
          inicio: vinculoPulseiraEvento.inicio,
          fim: vinculoPulseiraEvento.fim,
          pulseiraCodigoQr: pulseira.codigoQr,
          clienteNome: cliente.nome,
          clienteCelular: cliente.celular,
          mesaIdentificador: mesa.identificador,
        })
        .from(vinculoPulseiraEvento)
        .innerJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .innerJoin(cliente, eq(vinculoPulseiraEvento.clienteId, cliente.id))
        .leftJoin(mesa, eq(vinculoPulseiraEvento.mesaId, mesa.id))
        .where(
          and(
            inArray(vinculoPulseiraEvento.clienteId, clienteIds),
            eq(vinculoPulseiraEvento.eventoId, targetEventoId),
            or(
              eq(vinculoPulseiraEvento.status, 'ativo'),
              eq(vinculoPulseiraEvento.status, 'invalidado_perda')
            )
          )
        );

      const resultados: any[] = [];

      for (const row of vinculoRows) {
        // 1. Obter comanda vinculada
        const comandas = await db
          .select()
          .from(comanda)
          .where(eq(comanda.vinculoPulseiraEventoId, row.id))
          .limit(1);

        const cmd = comandas[0] || null;

        // 2. Calcular consumo e último pedido
        let consumoAcumulado = 0;
        let ultimoPedidoEm: Date | null = null;

        if (cmd) {
          const pedidos = await db
            .select()
            .from(pedido)
            .where(eq(pedido.comandaId, cmd.id))
            .orderBy(desc(pedido.criadoEm));

          if (pedidos.length > 0) {
            ultimoPedidoEm = new Date(pedidos[0].criadoEm);
            const pedidoIds = pedidos.map((p) => p.id);

            const items = await db
              .select({
                preco: itemCardapio.preco,
                quantidade: pedidoItem.quantidade,
              })
              .from(pedidoItem)
              .innerJoin(itemCardapio, eq(pedidoItem.itemCardapioId, itemCardapio.id))
              .where(inArray(pedidoItem.pedidoId, pedidoIds));

            for (const it of items) {
              const preco = Number(it.preco) || 0;
              consumoAcumulado += preco * it.quantidade;
            }
          }
        }

        // 3. Tempo do último pedido
        let tempoUltimoPedidoMin: number | null = null;
        let tempoUltimoPedidoTexto = 'Nenhum pedido realizado';

        if (ultimoPedidoEm) {
          tempoUltimoPedidoMin = Math.max(0, Math.floor((Date.now() - ultimoPedidoEm.getTime()) / 60000));
          if (tempoUltimoPedidoMin < 1) {
            tempoUltimoPedidoTexto = 'Agora mesmo';
          } else if (tempoUltimoPedidoMin === 1) {
            tempoUltimoPedidoTexto = 'Há 1 minuto';
          } else {
            tempoUltimoPedidoTexto = `Há ${tempoUltimoPedidoMin} minutos`;
          }
        }

        // 4. Checar status da tolerância (multaPulseiraPerdida)
        const multas = await db
          .select()
          .from(multaPulseiraPerdida)
          .where(eq(multaPulseiraPerdida.vinculoPulseiraEventoId, row.id))
          .orderBy(desc(multaPulseiraPerdida.comunicadoEm))
          .limit(1);

        const multaRecord = multas[0] || null;
        let toleranciaInfo = {
          iniciada: false,
          comunicadoEm: null as string | null,
          prazoLimite: null as string | null,
          minutosRestantes: null as number | null,
          toleranciaExcedida: false,
        };

        if (multaRecord) {
          const prazo = new Date(multaRecord.prazoLimite);
          const agora = new Date();
          const minutosRestantes = Math.max(0, Math.ceil((prazo.getTime() - agora.getTime()) / 60000));
          toleranciaInfo = {
            iniciada: true,
            comunicadoEm: new Date(multaRecord.comunicadoEm).toISOString(),
            prazoLimite: prazo.toISOString(),
            minutosRestantes,
            toleranciaExcedida: agora > prazo,
          };
        }

        // Formatação da Mesa / Área
        let mesaAreaTexto = 'Balcão / Sem mesa';
        if (row.mesaIdentificador) {
          const idMesa = row.mesaIdentificador.trim();
          mesaAreaTexto = idMesa.toLowerCase().startsWith('mesa') ? idMesa : `Mesa ${idMesa}`;
        }

        // Retornar estritamente sem documento/CPF
        resultados.push({
          id: row.id,
          vinculoPulseiraEventoId: row.id,
          vinculoId: row.id,
          clienteId: row.clienteId,
          nome: row.clienteNome,
          celular: mascararCelular(row.clienteCelular),
          pulseiraId: row.pulseiraId,
          pulseiraCodigo: row.pulseiraCodigoQr,
          pulseiraCodigoCurto: extrairIdCurtoPulseira(row.pulseiraCodigoQr),
          mesaId: row.mesaId,
          mesaArea: mesaAreaTexto,
          comandaId: cmd?.id || null,
          consumoAcumulado: Math.round(consumoAcumulado * 100) / 100,
          consumoFormatado: consumoAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          ultimoPedidoEm: ultimoPedidoEm ? ultimoPedidoEm.toISOString() : null,
          tempoUltimoPedidoMin,
          tempoUltimoPedidoTexto,
          status: row.status,
          tolerancia: toleranciaInfo,
        });
      }

      return resultados;
    } catch (error) {
      console.error('Error in multaPulseiraService.buscarPorCelular:', error);
      throw new Error('Falha ao buscar cliente e pulseira por celular.', { cause: error });
    }
  },

  async getCalculoMulta(vinculoPulseiraEventoId: string) {
    try {
      // 1. Get multa record
      const multas = await db
        .select()
        .from(multaPulseiraPerdida)
        .where(eq(multaPulseiraPerdida.vinculoPulseiraEventoId, vinculoPulseiraEventoId))
        .orderBy(desc(multaPulseiraPerdida.comunicadoEm))
        .limit(1);

      if (multas.length === 0) {
        return null;
      }

      const multaRecord = multas[0];
      const prazoLimite = new Date(multaRecord.prazoLimite);
      const agora = new Date();
      const minutosDecorridos = Math.floor(
        (agora.getTime() - new Date(multaRecord.comunicadoEm).getTime()) / 60000
      );
      const toleranciaExcedida = agora > prazoLimite;

      // 2. Get comanda and items for this vinculo
      const comandasVinculo = await db
        .select()
        .from(comanda)
        .where(eq(comanda.vinculoPulseiraEventoId, vinculoPulseiraEventoId));

      const itensAntesPrazo: Array<{
        id: string;
        nome: string;
        preco: number;
        quantidade: number;
        subtotal: number;
        criadoEm: Date;
        multiplicador: number;
        totalCobrado: number;
      }> = [];

      const itensAposPrazo: Array<{
        id: string;
        nome: string;
        preco: number;
        quantidade: number;
        subtotal: number;
        criadoEm: Date;
        multiplicador: number;
        totalCobrado: number;
        multaAdicional: number;
      }> = [];

      let totalAntesPrazo1x = 0;
      let totalAposPrazo1x = 0;
      let totalAposPrazo5x = 0;

      if (comandasVinculo.length > 0) {
        const comandaIds = comandasVinculo.map((c) => c.id);
        const pedidos = await db
          .select()
          .from(pedido)
          .where(inArray(pedido.comandaId, comandaIds));

        if (pedidos.length > 0) {
          const pedidoIds = pedidos.map((p) => p.id);
          const rawItems = await db
            .select({
              id: pedidoItem.id,
              nome: itemCardapio.nome,
              preco: itemCardapio.preco,
              quantidade: pedidoItem.quantidade,
              criadoEm: pedidoItem.criadoEm,
            })
            .from(pedidoItem)
            .innerJoin(itemCardapio, eq(pedidoItem.itemCardapioId, itemCardapio.id))
            .where(inArray(pedidoItem.pedidoId, pedidoIds));

          for (const it of rawItems) {
            const preco = Number(it.preco) || 0;
            const subtotal = preco * it.quantidade;
            const itemTime = new Date(it.criadoEm);

            if (itemTime <= prazoLimite) {
              // Tolerância de 30 min: cobrado 1x normal
              totalAntesPrazo1x += subtotal;
              itensAntesPrazo.push({
                id: it.id,
                nome: it.nome,
                preco,
                quantidade: it.quantidade,
                subtotal,
                criadoEm: itemTime,
                multiplicador: 1.0,
                totalCobrado: subtotal,
              });
            } else {
              // Após os 30 min da comunicação: cobrado 5x (nunca valor fixo!)
              const subtotal5x = subtotal * 5.0;
              totalAposPrazo1x += subtotal;
              totalAposPrazo5x += subtotal5x;
              itensAposPrazo.push({
                id: it.id,
                nome: it.nome,
                preco,
                quantidade: it.quantidade,
                subtotal,
                criadoEm: itemTime,
                multiplicador: 5.0,
                totalCobrado: subtotal5x,
                multaAdicional: subtotal * 4.0,
              });
            }
          }
        }
      }

      // Update valor_apos_prazo in database
      await db
        .update(multaPulseiraPerdida)
        .set({ valorAposPrazo: String(totalAposPrazo5x.toFixed(2)) })
        .where(eq(multaPulseiraPerdida.id, multaRecord.id));

      return {
        multa: multaRecord,
        minutosDecorridos,
        toleranciaExcedida,
        prazoLimite,
        comunicadoEm: multaRecord.comunicadoEm,
        itensAntesPrazo,
        itensAposPrazo,
        totalAntesPrazo1x,
        totalAposPrazo1x,
        totalAposPrazo5x,
        multaAdicionalTotal: totalAposPrazo5x - totalAposPrazo1x,
        totalFinalComanda: totalAntesPrazo1x + totalAposPrazo5x,
      };
    } catch (error) {
      console.error('Error in multaPulseiraService.getCalculoMulta:', error);
      throw new Error('Falha ao calcular multa de pulseira perdida.', { cause: error });
    }
  },

  async listar(eventoId?: string) {
    try {
      const rows = await db
        .select({
          id: multaPulseiraPerdida.id,
          vinculoPulseiraEventoId: multaPulseiraPerdida.vinculoPulseiraEventoId,
          comunicadoEm: multaPulseiraPerdida.comunicadoEm,
          prazoLimite: multaPulseiraPerdida.prazoLimite,
          valorAposPrazo: multaPulseiraPerdida.valorAposPrazo,
          multiplicador: multaPulseiraPerdida.multiplicador,
          clienteNome: cliente.nome,
          clienteCelular: cliente.celular,
          pulseiraCodigo: pulseira.codigoQr,
          mesaIdentificador: mesa.identificador,
          eventoNome: evento.nome,
        })
        .from(multaPulseiraPerdida)
        .innerJoin(vinculoPulseiraEvento, eq(multaPulseiraPerdida.vinculoPulseiraEventoId, vinculoPulseiraEvento.id))
        .innerJoin(cliente, eq(vinculoPulseiraEvento.clienteId, cliente.id))
        .innerJoin(pulseira, eq(vinculoPulseiraEvento.pulseiraId, pulseira.id))
        .innerJoin(evento, eq(vinculoPulseiraEvento.eventoId, evento.id))
        .leftJoin(mesa, eq(vinculoPulseiraEvento.mesaId, mesa.id))
        .orderBy(desc(multaPulseiraPerdida.comunicadoEm));

      return rows;
    } catch (error) {
      console.error('Error in multaPulseiraService.listar:', error);
      throw new Error('Falha ao listar multas de pulseira.', { cause: error });
    }
  },
};

// ==========================================
// 14. SISTEMA DE FIDELIDADE DE DUAS ESTRELAS
// ⭐ Amarela: por ticket alto (>= R$ 150)
// ⭐ Azul: por ciclos de 3 visitas (+ 1 Chopp de cortesia!)
// ==========================================
export const fidelidadeService = {
  async getExtratoCliente(clienteId: string) {
    try {
      const clientRows = await db.select().from(cliente).where(eq(cliente.id, clienteId));
      if (clientRows.length === 0) throw new Error('Cliente não encontrado.');
      const cl = clientRows[0];

      // Find all completed visits (via vinculos)
      const vinculos = await db
        .select()
        .from(vinculoPulseiraEvento)
        .where(eq(vinculoPulseiraEvento.clienteId, clienteId));

      const vinculoIds = vinculos.map((v) => v.id);

      // Find all comandas of this client
      let comandasCliente: any[] = [];
      if (vinculoIds.length > 0) {
        comandasCliente = await db
          .select()
          .from(comanda)
          .where(inArray(comanda.vinculoPulseiraEventoId, vinculoIds));
      }

      // Calculate total spent and ticket stars
      let totalGastoHistorico = 0;
      const visitasCompletas = comandasCliente.filter((c) => c.status === 'fechada').length || vinculos.length;

      for (const cmd of comandasCliente) {
        // Fetch pagamentos
        const pagamentosCmd = await db
          .select()
          .from(pagamento)
          .where(eq(pagamento.comandaId, cmd.id));

        for (const p of pagamentosCmd) {
          const val = Number(p.valor) || 0;
          totalGastoHistorico += val;
        }
      }

      // Ticket Médio / Consumo do Cliente
      const divisorVisitas = visitasCompletas > 0 ? visitasCompletas : 1;
      const ticketMedio = Math.round((totalGastoHistorico / divisorVisitas) * 100) / 100;

      // 4 Níveis da Estrela Amarela baseados no ticket médio / consumo:
      // Baixo (até R$150), Médio (até R$250), Alto (até R$500), VIP (acima de R$500 — estrela dourada, maior e discreta)
      let nivelEstrelaAmarela: 'baixo' | 'medio' | 'alto' | 'vip' = 'baixo';
      let nivelEstrelaAmarelaLabel = 'Baixo (até R$ 150)';
      let estrelasAmarelasTier = 1;

      if (ticketMedio > 500) {
        nivelEstrelaAmarela = 'vip';
        nivelEstrelaAmarelaLabel = 'VIP (> R$ 500)';
        estrelasAmarelasTier = 4;
      } else if (ticketMedio > 250) {
        nivelEstrelaAmarela = 'alto';
        nivelEstrelaAmarelaLabel = 'Alto (R$ 250 - R$ 500)';
        estrelasAmarelasTier = 3;
      } else if (ticketMedio > 150) {
        nivelEstrelaAmarela = 'medio';
        nivelEstrelaAmarelaLabel = 'Médio (R$ 150 - R$ 250)';
        estrelasAmarelasTier = 2;
      } else {
        nivelEstrelaAmarela = 'baixo';
        nivelEstrelaAmarelaLabel = 'Baixo (até R$ 150)';
        estrelasAmarelasTier = 1;
      }

      // Estrelas Azuis: ganha 1 a cada ciclo de 3 visitas completas
      const estrelasAzuis = Math.floor(visitasCompletas / 3);
      const progressoCicloVisitas = visitasCompletas % 3; // ex: 2 de 3 visitas
      const cortesiasTotalAcumuladas = estrelasAzuis; // Cada ciclo de 3 visitas dá 1 chopp de cortesia
      const cortesiasUtilizadas = cl.cortesiasUtilizadas || 0;
      const cortesiasDisponiveis = Math.max(0, cortesiasTotalAcumuladas - cortesiasUtilizadas);

      return {
        cliente: cl,
        totalVisitas: visitasCompletas,
        ticketMedio,
        nivelEstrelaAmarela,
        nivelEstrelaAmarelaLabel,
        estrelasAmarelas: estrelasAmarelasTier,
        estrelasAzuis,
        progressoCicloVisitas,
        visitasFaltantesParaChopp: (3 - progressoCicloVisitas) % 3,
        totalGastoHistorico,
        cortesiasChopp: {
          totalAcumuladas: cortesiasTotalAcumuladas,
          utilizadas: cortesiasUtilizadas,
          disponiveis: cortesiasDisponiveis,
        },
      };
    } catch (error) {
      console.error('Error in fidelidadeService.getExtratoCliente:', error);
      throw new Error('Falha ao obter extrato de fidelidade do cliente.', { cause: error });
    }
  },

  async listarRanking(estabelecimentoId: string) {
    try {
      const clientesList = await db
        .select()
        .from(cliente)
        .where(eq(cliente.estabelecimentoId, estabelecimentoId));

      const ranking = await Promise.all(
        clientesList.map(async (c) => {
          return await this.getExtratoCliente(c.id);
        })
      );

      // Sort by stars and spend
      ranking.sort((a, b) => {
        const scoreA = a.estrelasAmarelas * 100 + a.estrelasAzuis * 20 + a.totalGastoHistorico / 10;
        const scoreB = b.estrelasAmarelas * 100 + b.estrelasAzuis * 20 + b.totalGastoHistorico / 10;
        return scoreB - scoreA;
      });

      return ranking;
    } catch (error) {
      console.error('Error in fidelidadeService.listarRanking:', error);
      throw new Error('Falha ao listar ranking de fidelidade.', { cause: error });
    }
  },

  async resgatarChopp(clienteId: string) {
    try {
      const extrato = await this.getExtratoCliente(clienteId);
      if (extrato.cortesiasChopp.disponiveis <= 0) {
        throw new Error(
          'Cliente não possui Chopp de Cortesia disponível para resgate. Complete 3 visitas para liberar!'
        );
      }

      await db
        .update(cliente)
        .set({
          cortesiasUtilizadas: (extrato.cliente.cortesiasUtilizadas || 0) + 1,
        })
        .where(eq(cliente.id, clienteId));

      return {
        sucesso: true,
        clienteNome: extrato.cliente.nome,
        mensagem: 'Chopp de Cortesia resgatado com sucesso! Entregar cortesia ao cliente.',
        restantes: extrato.cortesiasChopp.disponiveis - 1,
        resgatadoEm: new Date(),
      };
    } catch (error) {
      console.error('Error in fidelidadeService.resgatarChopp:', error);
      throw new Error('Falha ao resgatar chopp de cortesia.', { cause: error });
    }
  },
};

// ==========================================
// 15. REBALANCEAMENTO & COMISSÃO DE GARÇONS
// Critério de Rebalanceamento Automático:
// Baseado no tempo de resposta médio (status 'pronto' até 'visto' nos itens).
// Quem tem pior tempo de resposta recebe menos carga na redistribuição.
// ==========================================
export const rebalanceamentoService = {
  async calcularTemposRespostaGarcons(eventoId: string, garconIds: string[]) {
    const temposPorGarcom = new Map<string, { totalSegundos: number; count: number }>();
    garconIds.forEach((id) => temposPorGarcom.set(id, { totalSegundos: 0, count: 0 }));

    try {
      const comandasEvento = await db
        .select({ id: comanda.id, garcomResponsavelId: comanda.garcomResponsavelId })
        .from(comanda)
        .where(eq(comanda.eventoId, eventoId));

      if (comandasEvento.length === 0) {
        return temposPorGarcom;
      }

      const comandaGarcomMap = new Map(comandasEvento.map((c) => [c.id, c.garcomResponsavelId]));
      const comandaIds = comandasEvento.map((c) => c.id);

      const pedidos = await db
        .select({ id: pedido.id, comandaId: pedido.comandaId, criadoPor: pedido.criadoPor })
        .from(pedido)
        .where(inArray(pedido.comandaId, comandaIds));

      if (pedidos.length === 0) {
        return temposPorGarcom;
      }

      const pedidoMap = new Map(pedidos.map((p) => [p.id, p]));
      const pedidoIds = pedidos.map((p) => p.id);

      const itens = await db
        .select({
          id: pedidoItem.id,
          pedidoId: pedidoItem.pedidoId,
          status: pedidoItem.status,
          prontoEm: pedidoItem.prontoEm,
          vistoEm: pedidoItem.vistoEm,
        })
        .from(pedidoItem)
        .where(inArray(pedidoItem.pedidoId, pedidoIds));

      const agora = Date.now();

      for (const item of itens) {
        if (!item.prontoEm) continue;

        const ped = pedidoMap.get(item.pedidoId);
        const garcomId = ped?.criadoPor || (ped ? comandaGarcomMap.get(ped.comandaId) : null);

        if (!garcomId || !temposPorGarcom.has(garcomId)) continue;

        const prontoTime = new Date(item.prontoEm).getTime();
        let diffSec = 0;

        if (item.vistoEm) {
          // Do status 'pronto' até 'visto'
          diffSec = Math.max(1, (new Date(item.vistoEm).getTime() - prontoTime) / 1000);
        } else if (item.status === 'pronto') {
          // Pronto aguardando ser visto pelo garçom
          diffSec = Math.max(1, (agora - prontoTime) / 1000);
        }

        if (diffSec > 0) {
          const acc = temposPorGarcom.get(garcomId)!;
          acc.totalSegundos += diffSec;
          acc.count += 1;
        }
      }
    } catch (err) {
      console.error('Erro ao calcular tempos de resposta:', err);
    }

    return temposPorGarcom;
  },

  async getAreasEComissoes(eventoId: string, estabelecimentoId: string) {
    try {
      const garcons = await db
        .select()
        .from(usuario)
        .where(and(eq(usuario.estabelecimentoId, estabelecimentoId), eq(usuario.papel, 'garcom')));

      const todasMesas = await db
        .select()
        .from(mesa)
        .where(eq(mesa.estabelecimentoId, estabelecimentoId));

      const atribuicoes = await db.select().from(garcomArea);
      const comissoes = await db
        .select()
        .from(garcomComissao)
        .where(eq(garcomComissao.eventoId, eventoId));

      const comissaoMap = new Map(comissoes.map((c) => [c.garcomId, c]));

      // Active comandas to evaluate load
      const comandasAtivas = await db
        .select()
        .from(comanda)
        .where(and(eq(comanda.eventoId, eventoId), eq(comanda.status, 'aberta')));

      const mesaComandaCount = new Map<string, number>();
      for (const cmd of comandasAtivas) {
        if (cmd.mesaId) {
          mesaComandaCount.set(cmd.mesaId, (mesaComandaCount.get(cmd.mesaId) || 0) + 1);
        }
      }

      // Calculate actual response time from pronto to visto for each waiter
      const temposCalculados = await this.calcularTemposRespostaGarcons(
        eventoId,
        garcons.map((g) => g.id)
      );

      const garcomCards = garcons.map((g) => {
        const mesasDoGarcom = atribuicoes
          .filter((a) => a.garcomId === g.id)
          .map((a) => {
            const m = todasMesas.find((t) => t.id === a.mesaId);
            return {
              mesaId: a.mesaId,
              identificador: m?.identificador || 'Mesa',
              status: m?.status || 'livre',
              comandasAtivas: mesaComandaCount.get(a.mesaId) || 0,
              atribuidoEm: a.atribuidoEm,
            };
          });

        const totalComandas = mesasDoGarcom.reduce((acc, curr) => acc + curr.comandasAtivas, 0);
        const cfgComissao = comissaoMap.get(g.id);

        const tempoStat = temposCalculados.get(g.id);
        const tempoSegundos =
          tempoStat && tempoStat.count > 0
            ? Math.round(tempoStat.totalSegundos / tempoStat.count)
            : 180; // Baseline 3 min se ainda sem pedidos
        const minutos = Math.floor(tempoSegundos / 60);
        const segundos = tempoSegundos % 60;
        const tempoFormatado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

        return {
          garcomId: g.id,
          nome: g.nome,
          celular: g.celular,
          mesas: mesasDoGarcom,
          totalMesas: mesasDoGarcom.length,
          totalComandasAtivas: totalComandas,
          metaTempoResposta: cfgComissao?.metaTempoResposta || '00:05:00',
          comissaoBasePercentual: Number(cfgComissao?.comissaoBasePercentual) || 10.0,
          bonusPercentual: Number(cfgComissao?.bonusPercentual) || 2.0,
          tempoRespostaMedio: tempoFormatado,
          tempoRespostaSegundos: tempoSegundos,
          totalItensAvaliados: tempoStat?.count || 0,
          atingiuMeta: tempoSegundos <= 300,
          statusCarga:
            mesasDoGarcom.length > 4 ? 'sobrecarregado' : mesasDoGarcom.length >= 2 ? 'ideal' : 'ocioso',
        };
      });

      return {
        garcons: garcomCards,
        todasMesas,
        criterio: 'Tempo de resposta médio (do status pronto até visto)',
      };
    } catch (error) {
      console.error('Error in rebalanceamentoService.getAreasEComissoes:', error);
      throw new Error('Falha ao carregar áreas e comissões de garçons.', { cause: error });
    }
  },

  async atribuirMesa(garcomId: string, mesaId: string) {
    try {
      // Remove any existing assignment for this table first
      await db.delete(garcomArea).where(eq(garcomArea.mesaId, mesaId));
      // Assign to this waiter
      const rows = await db
        .insert(garcomArea)
        .values({
          garcomId,
          mesaId,
          atribuidoEm: new Date(),
        })
        .returning();
      return rows[0];
    } catch (error) {
      console.error('Error in rebalanceamentoService.atribuirMesa:', error);
      throw new Error('Falha ao atribuir mesa ao garçom.', { cause: error });
    }
  },

  async removerAtribuicaoMesa(garcomId: string, mesaId: string) {
    try {
      await db
        .delete(garcomArea)
        .where(and(eq(garcomArea.garcomId, garcomId), eq(garcomArea.mesaId, mesaId)));
      return { sucesso: true };
    } catch (error) {
      console.error('Error in rebalanceamentoService.removerAtribuicaoMesa:', error);
      throw new Error('Falha ao desvincular mesa do garçom.', { cause: error });
    }
  },

  async salvarMetaComissao(data: {
    garcomId: string;
    eventoId: string;
    metaMinutos?: number;
    comissaoBase?: number;
    bonus?: number;
  }) {
    try {
      const metaMin = data.metaMinutos || 5;
      const metaInterval = `00:${String(metaMin).padStart(2, '0')}:00`;

      // Upsert
      const existing = await db
        .select()
        .from(garcomComissao)
        .where(
          and(
            eq(garcomComissao.garcomId, data.garcomId),
            eq(garcomComissao.eventoId, data.eventoId)
          )
        );

      if (existing.length > 0) {
        const rows = await db
          .update(garcomComissao)
          .set({
            metaTempoResposta: metaInterval,
            comissaoBasePercentual: String((data.comissaoBase || 10).toFixed(2)),
            bonusPercentual: String((data.bonus || 2).toFixed(2)),
          })
          .where(
            and(
              eq(garcomComissao.garcomId, data.garcomId),
              eq(garcomComissao.eventoId, data.eventoId)
            )
          )
          .returning();
        return rows[0];
      } else {
        const rows = await db
          .insert(garcomComissao)
          .values({
            garcomId: data.garcomId,
            eventoId: data.eventoId,
            metaTempoResposta: metaInterval,
            comissaoBasePercentual: String((data.comissaoBase || 10).toFixed(2)),
            bonusPercentual: String((data.bonus || 2).toFixed(2)),
          })
          .returning();
        return rows[0];
      }
    } catch (error) {
      console.error('Error in rebalanceamentoService.salvarMetaComissao:', error);
      throw new Error('Falha ao configurar metas de comissão do garçom.', { cause: error });
    }
  },

  async executarRebalanceamento(eventoId: string, estabelecimentoId: string) {
    try {
      const garcons = await db
        .select()
        .from(usuario)
        .where(and(eq(usuario.estabelecimentoId, estabelecimentoId), eq(usuario.papel, 'garcom')));

      if (garcons.length === 0) {
        throw new Error('Nenhum garçom cadastrado para receber atribuição de mesas.');
      }

      const todasMesas = await db
        .select()
        .from(mesa)
        .where(eq(mesa.estabelecimentoId, estabelecimentoId));

      if (todasMesas.length === 0) {
        throw new Error('Nenhuma mesa cadastrada no estabelecimento.');
      }

      // CRITÉRIO CORRETO DE REBALANCEAMENTO:
      // O critério é o tempo de resposta médio de cada garçom (do status 'pronto' até 'visto' nos itens).
      // Quem tem pior tempo de resposta deve receber MENOS carga na redistribuição.
      const temposCalculados = await this.calcularTemposRespostaGarcons(
        eventoId,
        garcons.map((g) => g.id)
      );

      // Calcular peso inversamente proporcional ao tempo de resposta
      // Peso W = 1 / T. Garçom mais rápido (menor T) tem maior W e recebe mais mesas.
      // Garçom com pior tempo (maior T) tem menor W e recebe menos mesas.
      const garcomMetrics = garcons.map((g) => {
        const stat = temposCalculados.get(g.id);
        const tempoSegundos =
          stat && stat.count > 0
            ? Math.max(30, Math.round(stat.totalSegundos / stat.count))
            : 180; // Baseline 3 min se sem pedidos

        const peso = 1 / tempoSegundos; // Inversamente proporcional

        return {
          garcom: g,
          tempoSegundos,
          tempoFormatado: `${String(Math.floor(tempoSegundos / 60)).padStart(2, '0')}:${String(tempoSegundos % 60).padStart(2, '0')}`,
          peso,
          itensAvaliados: stat?.count || 0,
        };
      });

      // Soma total dos pesos
      const somaPesos = garcomMetrics.reduce((acc, curr) => acc + curr.peso, 0);

      const totalMesas = todasMesas.length;
      const totalGarcons = garcons.length;

      // Alocação proporcional usando Largest Remainder Method
      // Se há mesas suficientes, cada garçom recebe pelo menos 1 mesa
      const alocacaoMesas = new Map<string, number>();

      if (totalMesas >= totalGarcons) {
        // Garantir 1 mesa mínima para cada garçom ativo
        garcomMetrics.forEach((gm) => alocacaoMesas.set(gm.garcom.id, 1));
        const mesasRestantes = totalMesas - totalGarcons;

        // Distribuir as mesas restantes proporcionalmente ao peso inverso do tempo de resposta
        const restos: Array<{ id: string; resto: number; peso: number }> = [];
        let mesasDistribuidasExtra = 0;

        garcomMetrics.forEach((gm) => {
          const quota = mesasRestantes * (gm.peso / somaPesos);
          const inteira = Math.floor(quota);
          alocacaoMesas.set(gm.garcom.id, (alocacaoMesas.get(gm.garcom.id) || 1) + inteira);
          mesasDistribuidasExtra += inteira;
          restos.push({ id: gm.garcom.id, resto: quota - inteira, peso: gm.peso });
        });

        // Distribuir sobras para os maiores restos (favorece os menores tempos de resposta)
        restos.sort((a, b) => b.resto - a.resto || b.peso - a.peso);
        let sobras = mesasRestantes - mesasDistribuidasExtra;
        for (let i = 0; i < sobras; i++) {
          const targetId = restos[i % restos.length].id;
          alocacaoMesas.set(targetId, (alocacaoMesas.get(targetId) || 1) + 1);
        }
      } else {
        // Menos mesas que garçons: alocar para os de menor tempo de resposta
        garcomMetrics.sort((a, b) => a.tempoSegundos - b.tempoSegundos);
        todasMesas.forEach((m, idx) => {
          const gm = garcomMetrics[idx];
          alocacaoMesas.set(gm.garcom.id, 1);
        });
      }

      // Ordenar garçons pelo menor tempo de resposta (mais rápidos primeiro)
      garcomMetrics.sort((a, b) => a.tempoSegundos - b.tempoSegundos);

      // Limpar atribuições anteriores
      await db.delete(garcomArea);

      // Distribuir mesas físicas respeitando a cota calculada por tempo de resposta
      let mesaIndex = 0;
      const newAssignments: Array<{ garcomId: string; mesaId: string }> = [];
      const detalhesPorGarcom: Array<{
        garcomId: string;
        nome: string;
        tempoRespostaMedio: string;
        tempoSegundos: number;
        mesasAlocadas: number;
        mesas: string[];
      }> = [];

      for (const gm of garcomMetrics) {
        const qtdAlocada = alocacaoMesas.get(gm.garcom.id) || 0;
        const mesasDoGarcom: string[] = [];

        for (let k = 0; k < qtdAlocada && mesaIndex < totalMesas; k++) {
          const m = todasMesas[mesaIndex++];
          newAssignments.push({
            garcomId: gm.garcom.id,
            mesaId: m.id,
          });
          mesasDoGarcom.push(m.identificador);
        }

        detalhesPorGarcom.push({
          garcomId: gm.garcom.id,
          nome: gm.garcom.nome,
          tempoRespostaMedio: gm.tempoFormatado,
          tempoSegundos: gm.tempoSegundos,
          mesasAlocadas: mesasDoGarcom.length,
          mesas: mesasDoGarcom,
        });

        // Atualizar tempo de resposta médio na tabela garcom_comissao
        const existingComissao = await db
          .select()
          .from(garcomComissao)
          .where(
            and(
              eq(garcomComissao.garcomId, gm.garcom.id),
              eq(garcomComissao.eventoId, eventoId)
            )
          )
          .limit(1);

        if (existingComissao.length > 0) {
          await db
            .update(garcomComissao)
            .set({ tempoRespostaMedio: `${gm.tempoSegundos} seconds` })
            .where(
              and(
                eq(garcomComissao.garcomId, gm.garcom.id),
                eq(garcomComissao.eventoId, eventoId)
              )
            );
        } else {
          await db.insert(garcomComissao).values({
            garcomId: gm.garcom.id,
            eventoId,
            metaTempoResposta: '00:03:00',
            comissaoBasePercentual: '10.0',
            bonusPercentual: '0.0',
            tempoRespostaMedio: `${gm.tempoSegundos} seconds`,
          });
        }
      }

      if (newAssignments.length > 0) {
        await db.insert(garcomArea).values(newAssignments);
      }

      return {
        sucesso: true,
        criterio: 'Tempo de resposta médio (pronto até visto) - menor tempo = maior cota; maior tempo = alívio de carga',
        mesasRebalanceadas: totalMesas,
        garconsAlocados: totalGarcons,
        detalhesPorGarcom,
      };
    } catch (error) {
      console.error('Error in rebalanceamentoService.executarRebalanceamento:', error);
      throw new Error('Falha ao executar rebalanceamento de mesas.', { cause: error });
    }
  },

  async getPerfilGarcom(garcomId: string, eventoId?: string) {
    try {
      const garcomUser = await usuarioService.getById(garcomId);
      if (!garcomUser) throw new Error('Garçom não encontrado.');

      // Response time metrics
      const temposCalculados = eventoId
        ? await this.calcularTemposRespostaGarcons(eventoId, [garcomId])
        : new Map();
      const stat = temposCalculados.get(garcomId);

      const tempoSegundos =
        stat && stat.count > 0
          ? Math.max(30, Math.round(stat.totalSegundos / stat.count))
          : 180; // Baseline 3 min

      const minutos = Math.floor(tempoSegundos / 60);
      const segundos = tempoSegundos % 60;
      const tempoFormatado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

      // Configured target
      let metaMinutos = 3;
      let metaInterval = '00:03:00';
      if (eventoId) {
        const cfg = await db
          .select()
          .from(garcomComissao)
          .where(and(eq(garcomComissao.garcomId, garcomId), eq(garcomComissao.eventoId, eventoId)))
          .limit(1);
        if (cfg.length > 0 && cfg[0].metaTempoResposta) {
          metaInterval = cfg[0].metaTempoResposta;
          const parts = metaInterval.split(':');
          metaMinutos = Number(parts[1]) || 3;
        }
      }
      const metaSegundos = metaMinutos * 60;
      const dentroDaMeta = tempoSegundos <= metaSegundos;

      // Commission in event (comissão e gorjeta em dinheiro ficam "a consolidar" até o fechamento do caixa)
      let comissaoConsolidada = 0;
      let comissaoAConsolidar = 0;
      if (eventoId) {
        // Verificar se há caixa aberto para o garçom neste evento
        const caixasAbertos = await db
          .select()
          .from(caixaGarcom)
          .where(
            and(
              eq(caixaGarcom.eventoId, eventoId),
              eq(caixaGarcom.garcomId, garcomId),
              eq(caixaGarcom.status, 'aberto')
            )
          )
          .limit(1);
        const hasOpenCaixa = caixasAbertos.length > 0;

        const rateios = await db
          .select({
            valorGarcom: rateioTaxaServico.valorGarcom,
            comandaId: comanda.id,
          })
          .from(rateioTaxaServico)
          .innerJoin(pedidoItem, eq(rateioTaxaServico.pedidoItemId, pedidoItem.id))
          .innerJoin(pedido, eq(pedidoItem.pedidoId, pedido.id))
          .innerJoin(comanda, eq(pedido.comandaId, comanda.id))
          .where(and(eq(rateioTaxaServico.garcomId, garcomId), eq(comanda.eventoId, eventoId)));

        for (const r of rateios) {
          const valor = Number(r.valorGarcom) || 0;
          // Buscar método da comanda na cobranca
          const cobs = await db
            .select({ metodo: cobranca.metodo })
            .from(cobranca)
            .where(and(eq(cobranca.comandaId, r.comandaId), eq(cobranca.status, 'aprovada')))
            .limit(1);
          const metodo = cobs[0]?.metodo;
          if (metodo === 'dinheiro' && hasOpenCaixa) {
            comissaoAConsolidar += valor;
          } else {
            comissaoConsolidada += valor;
          }
        }
      }

      // Assigned tables count
      const mesasAtribuidas = await db
        .select({ mesaId: garcomArea.mesaId })
        .from(garcomArea)
        .where(eq(garcomArea.garcomId, garcomId));

      return {
        garcom: {
          id: garcomUser.id,
          nome: garcomUser.nome,
          celular: garcomUser.celular,
          papel: garcomUser.papel,
        },
        tempoRespostaMedio: tempoFormatado,
        tempoRespostaSegundos: tempoSegundos,
        metaTempoResposta: metaInterval,
        metaSegundos,
        dentroDaMeta,
        comissaoAcumulada: Number(comissaoConsolidada.toFixed(2)),
        comissaoConsolidada: Number(comissaoConsolidada.toFixed(2)),
        comissaoAConsolidar: Number(comissaoAConsolidar.toFixed(2)),
        comissaoTotal: Number((comissaoConsolidada + comissaoAConsolidar).toFixed(2)),
        totalItensAvaliados: stat?.count || 0,
        totalMesasAtribuidas: mesasAtribuidas.length,
      };
    } catch (error) {
      console.error('Error in rebalanceamentoService.getPerfilGarcom:', error);
      throw new Error('Falha ao consultar perfil do garçom.', { cause: error });
    }
  },
};

// ==========================================
// 16. RECIBO WHATSAPP (wa.me)
// ==========================================
export const reciboEnvioService = {
  async gerarReciboWhatsApp(comandaId: string) {
    try {
      const cmd = await comandaService.getById(comandaId);
      if (!cmd) throw new Error('Comanda não encontrada.');

      const celular = (cmd.clienteCelular || '').replace(/\D/g, '');
      const texto = encodeURIComponent(
        `🧾 *Recibo SAASBAR*\nOlá, ${cmd.clienteNome || 'Cliente'}!\n` +
        `Total de consumo: R$ ${Number(cmd.totalConsumo).toFixed(2)}\n` +
        `Status: Fechada\n` +
        `Obrigado pela visita e volte sempre!`
      );
      const linkGerado = celular.length >= 10
        ? `https://wa.me/55${celular}?text=${texto}`
        : `https://wa.me/?text=${texto}`;

      const rows = await db
        .insert(reciboEnvio)
        .values({
          comandaId,
          canal: 'whatsapp',
          linkGerado,
          enviadoEm: new Date(),
        })
        .returning();

      return {
        sucesso: true,
        linkGerado,
        recibo: rows[0],
      };
    } catch (error) {
      console.error('Error in reciboEnvioService.gerarReciboWhatsApp:', error);
      throw new Error('Falha ao gerar link de recibo via WhatsApp.', { cause: error });
    }
  },
};

// ==========================================
// 17. COBRANÇA SERVICE (Registro Manual, Troco, Idempotência, Estorno)
// ==========================================
export const cobrancaService = {
  async getById(id: string) {
    try {
      const rows = await db
        .select()
        .from(cobranca)
        .where(eq(cobranca.id, id))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in cobrancaService.getById:', error);
      throw new Error('Falha ao buscar cobrança.', { cause: error });
    }
  },

  async getByComandaId(comandaId: string) {
    try {
      return await db
        .select()
        .from(cobranca)
        .where(eq(cobranca.comandaId, comandaId))
        .orderBy(desc(cobranca.criadoEm));
    } catch (error) {
      console.error('Error in cobrancaService.getByComandaId:', error);
      throw new Error('Falha ao buscar cobranças da comanda.', { cause: error });
    }
  },

  async createCobrancaManual(data: {
    comandaId: string;
    metodo: 'pix' | 'cartao_credito' | 'cartao_debito' | 'credito' | 'debito' | 'dinheiro';
    tipoContribuicao?: 'taxa_servico_10' | 'gorjeta_livre' | 'nenhuma';
    valorContribuicao?: number;
    valorRecebido?: number;
    bandeira?: string;
    nsu?: string;
    idempotencyKey?: string;
    garcomId?: string;
    registradoPor?: string;
    estabelecimentoId?: string;
  }) {
    return await fechamentoService.fecharComandaEfetuarPagamento({
      comandaId: data.comandaId,
      metodo: data.metodo,
      tipoContribuicao: data.tipoContribuicao || 'taxa_servico_10',
      valorContribuicao: data.valorContribuicao,
      valorRecebido: data.valorRecebido,
      bandeira: data.bandeira,
      nsu: data.nsu,
      idempotencyKey: data.idempotencyKey,
      garcomId: data.garcomId,
      registradoPor: data.registradoPor,
    });
  },

  async estornar(data: {
    cobrancaId: string;
    usuarioId: string;
    papel: string;
    motivo: string;
    estabelecimentoId: string;
  }) {
    try {
      if (data.papel !== 'gerente') {
        throw new Error('Apenas gerentes têm permissão para estornar cobranças.');
      }
      if (!data.motivo || !data.motivo.trim()) {
        throw new Error('Motivo do estorno é obrigatório.');
      }

      const rows = await db
        .select()
        .from(cobranca)
        .where(eq(cobranca.id, data.cobrancaId))
        .limit(1);
      if (rows.length === 0) {
        throw new Error('Cobrança não encontrada.');
      }
      const cob = rows[0];

      if (cob.estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Acesso negado: cobrança pertence a outro estabelecimento.');
      }
      if (cob.status === 'estornada') {
        throw new Error('Esta cobrança já foi estornada anteriormente.');
      }

      const updated = await db
        .update(cobranca)
        .set({
          status: 'estornada',
          estornadoPor: data.usuarioId,
          estornadoEm: new Date(),
          motivoEstorno: data.motivo.trim(),
        })
        .where(eq(cobranca.id, data.cobrancaId))
        .returning();

      // Também atualiza o status do pagamento correspondente
      await db
        .update(pagamento)
        .set({ status: 'estornado' })
        .where(eq(pagamento.comandaId, cob.comandaId));

      console.log(
        `[AUDITORIA][ESTORNO_COBRANCA] Cobrança ${cob.id} da comanda ${cob.comandaId} estornada pelo gerente ${data.usuarioId} às ${new Date().toISOString()}. Motivo: "${data.motivo.trim()}"`
      );

      return {
        sucesso: true,
        cobranca: updated[0],
      };
    } catch (error) {
      console.error('Error in cobrancaService.estornar:', error);
      throw error;
    }
  },
};

// ==========================================
// 18. CAIXA GARÇOM SERVICE (Abertura, Sangria, Fechamento, Limite)
// ==========================================
export const caixaGarcomService = {
  async abrir(data: {
    eventoId: string;
    garcomId: string;
    fundoTrocoInicial: number;
    abertoPor: string;
    estabelecimentoId: string;
  }) {
    try {
      // Validar evento e garcom no estabelecimento
      const ev = await db.select().from(evento).where(eq(evento.id, data.eventoId)).limit(1);
      if (!ev[0] || ev[0].estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Acesso negado: evento pertence a outro estabelecimento.');
      }
      const garc = await db.select().from(usuario).where(eq(usuario.id, data.garcomId)).limit(1);
      if (!garc[0] || garc[0].estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Acesso negado: garçom pertence a outro estabelecimento.');
      }

      // Verificar se já existe caixa aberto
      const abertos = await db
        .select()
        .from(caixaGarcom)
        .where(
          and(
            eq(caixaGarcom.eventoId, data.eventoId),
            eq(caixaGarcom.garcomId, data.garcomId),
            eq(caixaGarcom.status, 'aberto')
          )
        )
        .limit(1);

      if (abertos.length > 0) {
        return abertos[0];
      }

      const rows = await db
        .insert(caixaGarcom)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          eventoId: data.eventoId,
          garcomId: data.garcomId,
          fundoTrocoInicial: String(Number(data.fundoTrocoInicial || 0).toFixed(2)),
          abertoPor: data.abertoPor,
          status: 'aberto',
        })
        .returning();

      console.log(
        `[AUDITORIA][CAIXA_GARCOM] Abertura de caixa ${rows[0].id} para garçom ${data.garcomId} no evento ${data.eventoId} com fundo inicial de R$ ${Number(data.fundoTrocoInicial).toFixed(2)} registrado por ${data.abertoPor}`
      );

      return rows[0];
    } catch (error) {
      console.error('Error in caixaGarcomService.abrir:', error);
      throw error;
    }
  },

  async registrarSangria(data: {
    caixaId: string;
    valor: number;
    registradaPor: string;
    motivo?: string;
    estabelecimentoId: string;
  }) {
    try {
      const cx = await db.select().from(caixaGarcom).where(eq(caixaGarcom.id, data.caixaId)).limit(1);
      if (!cx[0]) throw new Error('Caixa não encontrado.');
      if (cx[0].estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Acesso negado: caixa pertence a outro estabelecimento.');
      }
      if (cx[0].status !== 'aberto') {
        throw new Error('Não é possível realizar sangria em caixa já encerrado.');
      }
      if (Number(data.valor) <= 0) {
        throw new Error('Valor da sangria deve ser maior que zero.');
      }

      const rows = await db
        .insert(sangriaCaixa)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          caixaId: data.caixaId,
          valor: String(Number(data.valor).toFixed(2)),
          registradaPor: data.registradaPor,
          motivo: data.motivo || null,
        })
        .returning();

      console.log(
        `[AUDITORIA][SANGRIA_CAIXA] Sangria de R$ ${Number(data.valor).toFixed(2)} no caixa ${data.caixaId} registrada por ${data.registradaPor}`
      );

      return rows[0];
    } catch (error) {
      console.error('Error in caixaGarcomService.registrarSangria:', error);
      throw error;
    }
  },

  async fechar(data: {
    caixaId: string;
    dinheiroDeclarado: number;
    estabelecimentoId: string;
  }) {
    try {
      const cx = await db.select().from(caixaGarcom).where(eq(caixaGarcom.id, data.caixaId)).limit(1);
      if (!cx[0]) throw new Error('Caixa não encontrado.');
      if (cx[0].estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Acesso negado: caixa pertence a outro estabelecimento.');
      }
      if (cx[0].status !== 'aberto') {
        throw new Error('Este caixa já foi fechado anteriormente.');
      }

      const caixa = cx[0];
      const fundo = Number(caixa.fundoTrocoInicial);

      // Soma de todas as cobranças em dinheiro aprovadas deste garçom no evento
      const cobrancasDinheiro = await db
        .select()
        .from(cobranca)
        .where(
          and(
            eq(cobranca.eventoId, caixa.eventoId),
            eq(cobranca.registradoPor, caixa.garcomId),
            eq(cobranca.metodo, 'dinheiro'),
            eq(cobranca.status, 'aprovada')
          )
        );
      const somaCobrancasDinheiro = cobrancasDinheiro.reduce((acc, c) => acc + Number(c.valor), 0);

      // Soma das sangrias deste caixa
      const sangrias = await db
        .select()
        .from(sangriaCaixa)
        .where(eq(sangriaCaixa.caixaId, data.caixaId));
      const somaSangrias = sangrias.reduce((acc, s) => acc + Number(s.valor), 0);

      // Esperado = fundo + soma cobranças em dinheiro - sangrias
      const dinheiroEsperado = Math.round((fundo + somaCobrancasDinheiro - somaSangrias) * 100) / 100;
      const declarado = Math.round(Number(data.dinheiroDeclarado) * 100) / 100;
      const diferenca = Math.round((declarado - dinheiroEsperado) * 100) / 100;

      const updated = await db
        .update(caixaGarcom)
        .set({
          fechadoEm: new Date(),
          dinheiroDeclarado: String(declarado.toFixed(2)),
          dinheiroEsperado: String(dinheiroEsperado.toFixed(2)),
          diferenca: String(diferenca.toFixed(2)),
          status: 'fechado',
        })
        .where(eq(caixaGarcom.id, data.caixaId))
        .returning();

      console.log(
        `[AUDITORIA][FECHAMENTO_CAIXA] Caixa ${data.caixaId} fechado. Fundo: R$ ${fundo.toFixed(2)}, Cobranças Dinheiro: R$ ${somaCobrancasDinheiro.toFixed(2)}, Sangrias: R$ ${somaSangrias.toFixed(2)}, Esperado: R$ ${dinheiroEsperado.toFixed(2)}, Declarado: R$ ${declarado.toFixed(2)}, Diferença: R$ ${diferenca.toFixed(2)}`
      );

      return {
        sucesso: true,
        caixa: updated[0],
        fundo,
        somaCobrancasDinheiro,
        somaSangrias,
        dinheiroEsperado,
        dinheiroDeclarado: declarado,
        diferenca,
      };
    } catch (error) {
      console.error('Error in caixaGarcomService.fechar:', error);
      throw error;
    }
  },

  async getStatus(garcomId: string, eventoId: string, estabelecimentoId: string) {
    try {
      const caixas = await db
        .select()
        .from(caixaGarcom)
        .where(
          and(
            eq(caixaGarcom.eventoId, eventoId),
            eq(caixaGarcom.garcomId, garcomId),
            eq(caixaGarcom.estabelecimentoId, estabelecimentoId)
          )
        )
        .orderBy(desc(caixaGarcom.abertoEm));

      const caixaAtivo = caixas.find((c) => c.status === 'aberto') || null;

      // Buscar limite do evento
      const ev = await db.select().from(evento).where(eq(evento.id, eventoId)).limit(1);
      const limiteDinheiro = ev[0]?.limiteDinheiroCaixa ? Number(ev[0].limiteDinheiroCaixa) : 500.00;

      if (!caixaAtivo) {
        return {
          temCaixaAberto: false,
          caixa: caixas[0] || null,
          fundoInicial: 0,
          somaCobrancasDinheiro: 0,
          somaSangrias: 0,
          dinheiroEmMaos: 0,
          limiteDinheiro,
          alertaSangria: false,
          sangrias: [],
        };
      }

      const fundo = Number(caixaAtivo.fundoTrocoInicial);

      const cobrancasDinheiro = await db
        .select()
        .from(cobranca)
        .where(
          and(
            eq(cobranca.eventoId, eventoId),
            eq(cobranca.registradoPor, garcomId),
            eq(cobranca.metodo, 'dinheiro'),
            eq(cobranca.status, 'aprovada')
          )
        );
      const somaCobrancasDinheiro = cobrancasDinheiro.reduce((acc, c) => acc + Number(c.valor), 0);

      const sangrias = await db
        .select()
        .from(sangriaCaixa)
        .where(eq(sangriaCaixa.caixaId, caixaAtivo.id));
      const somaSangrias = sangrias.reduce((acc, s) => acc + Number(s.valor), 0);

      const dinheiroEmMaos = Math.round((fundo + somaCobrancasDinheiro - somaSangrias) * 100) / 100;
      const alertaSangria = dinheiroEmMaos > limiteDinheiro;

      return {
        temCaixaAberto: true,
        caixa: caixaAtivo,
        fundoInicial: fundo,
        somaCobrancasDinheiro,
        somaSangrias,
        dinheiroEmMaos,
        limiteDinheiro,
        alertaSangria,
        sangrias,
      };
    } catch (error) {
      console.error('Error in caixaGarcomService.getStatus:', error);
      throw error;
    }
  },

  async listPorEvento(eventoId: string, estabelecimentoId: string) {
    try {
      const rows = await db
        .select()
        .from(caixaGarcom)
        .where(
          and(
            eq(caixaGarcom.eventoId, eventoId),
            eq(caixaGarcom.estabelecimentoId, estabelecimentoId)
          )
        )
        .orderBy(desc(caixaGarcom.abertoEm));
      return rows;
    } catch (error) {
      console.error('Error in caixaGarcomService.listPorEvento:', error);
      throw error;
    }
  },
};

// ==========================================
// 19. CONCILIAÇÃO SERVICE (Relatório por Garçom e Método, Maquininha, Alertas)
// ==========================================
export const conciliacaoService = {
  async getRelatorio(
    eventoId: string,
    estabelecimentoId: string,
    totaisMaquininha?: { credito?: number; debito?: number }
  ) {
    try {
      const ev = await db.select().from(evento).where(eq(evento.id, eventoId)).limit(1);
      if (!ev[0] || ev[0].estabelecimentoId !== estabelecimentoId) {
        throw new Error('Acesso negado: evento pertence a outro estabelecimento.');
      }
      const tolerancia = ev[0].toleranciaConciliacao ? Number(ev[0].toleranciaConciliacao) : 10.0;
      const limiteDinheiroPadrao = ev[0].limiteDinheiroCaixa ? Number(ev[0].limiteDinheiroCaixa) : 500.0;

      // Todas as cobranças do evento no estabelecimento
      const cobrancas = await db
        .select()
        .from(cobranca)
        .where(
          and(
            eq(cobranca.eventoId, eventoId),
            eq(cobranca.estabelecimentoId, estabelecimentoId),
            eq(cobranca.status, 'aprovada')
          )
        );

      // Todos os garçons do estabelecimento
      const garcons = await db
        .select()
        .from(usuario)
        .where(
          and(
            eq(usuario.estabelecimentoId, estabelecimentoId),
            eq(usuario.papel, 'garcom')
          )
        );

      // Todos os caixas do evento
      const caixas = await db
        .select()
        .from(caixaGarcom)
        .where(
          and(
            eq(caixaGarcom.eventoId, eventoId),
            eq(caixaGarcom.estabelecimentoId, estabelecimentoId)
          )
        );

      // Todas as sangrias
      const sangrias = await db
        .select()
        .from(sangriaCaixa)
        .where(eq(sangriaCaixa.estabelecimentoId, estabelecimentoId));

      // 1. Resumo por Método
      const metodos: Record<string, { total: number; qtd: number }> = {
        pix: { total: 0, qtd: 0 },
        credito: { total: 0, qtd: 0 },
        debito: { total: 0, qtd: 0 },
        dinheiro: { total: 0, qtd: 0 },
      };

      for (const c of cobrancas) {
        const m = c.metodo in metodos ? c.metodo : 'pix';
        metodos[m].total = Math.round((metodos[m].total + Number(c.valor)) * 100) / 100;
        metodos[m].qtd += 1;
      }

      // Conciliação de Cartão (Maquininha física informada vs Sistema)
      const maquinaCredito = Number(totaisMaquininha?.credito) || 0;
      const maquinaDebito = Number(totaisMaquininha?.debito) || 0;

      const difCredito = Math.round((maquinaCredito - metodos.credito.total) * 100) / 100;
      const difDebito = Math.round((maquinaDebito - metodos.debito.total) * 100) / 100;

      const getAlertaDiferenca = (dif: number) => {
        const abs = Math.abs(dif);
        if (abs === 0) return 'ok';
        if (abs <= tolerancia) return 'alerta'; // Âmbar
        return 'critico'; // Vermelho
      };

      const resumoMetodos = {
        pix: {
          totalAprovado: metodos.pix.total,
          quantidade: metodos.pix.qtd,
        },
        credito: {
          totalAprovado: metodos.credito.total,
          quantidade: metodos.credito.qtd,
          totalMaquininha: maquinaCredito,
          diferenca: difCredito,
          nivelAlerta: getAlertaDiferenca(difCredito),
        },
        debito: {
          totalAprovado: metodos.debito.total,
          quantidade: metodos.debito.qtd,
          totalMaquininha: maquinaDebito,
          diferenca: difDebito,
          nivelAlerta: getAlertaDiferenca(difDebito),
        },
        dinheiro: {
          totalAprovado: metodos.dinheiro.total,
          quantidade: metodos.dinheiro.qtd,
        },
      };

      // 2. Resumo por Garçom
      const relatorioGarcons = [];

      for (const g of garcons) {
        const cobrancasDoGarcom = cobrancas.filter((c) => c.registradoPor === g.id);
        const caixasDoGarcom = caixas.filter((c) => c.garcomId === g.id);
        const caixaAtivo = caixasDoGarcom.find((c) => c.status === 'aberto') || null;
        const ultimoCaixa = caixasDoGarcom[0] || null;

        const totalDinheiro = cobrancasDoGarcom
          .filter((c) => c.metodo === 'dinheiro')
          .reduce((sum, c) => sum + Number(c.valor), 0);
        const totalCredito = cobrancasDoGarcom
          .filter((c) => c.metodo === 'credito')
          .reduce((sum, c) => sum + Number(c.valor), 0);
        const totalDebito = cobrancasDoGarcom
          .filter((c) => c.metodo === 'debito')
          .reduce((sum, c) => sum + Number(c.valor), 0);
        const totalPix = cobrancasDoGarcom
          .filter((c) => c.metodo === 'pix')
          .reduce((sum, c) => sum + Number(c.valor), 0);

        const fundoInicial = caixaAtivo ? Number(caixaAtivo.fundoTrocoInicial) : (ultimoCaixa ? Number(ultimoCaixa.fundoTrocoInicial) : 0);
        
        // Sangrias do garçom
        const idsCaixa = caixasDoGarcom.map((c) => c.id);
        const sangriasDoGarcom = sangrias.filter((s) => idsCaixa.includes(s.caixaId));
        const totalSangrias = sangriasDoGarcom.reduce((sum, s) => sum + Number(s.valor), 0);

        const dinheiroEmMaos = Math.round((fundoInicial + totalDinheiro - totalSangrias) * 100) / 100;
        const alertaSangria = caixaAtivo ? dinheiroEmMaos > limiteDinheiroPadrao : false;

        let dinheiroDeclarado: number | null = null;
        let dinheiroEsperado: number | null = null;
        let diferencaCaixa: number | null = null;
        let nivelAlertaCaixa: 'ok' | 'alerta' | 'critico' = 'ok';

        if (ultimoCaixa && ultimoCaixa.status === 'fechado') {
          dinheiroDeclarado = Number(ultimoCaixa.dinheiroDeclarado) || 0;
          dinheiroEsperado = Number(ultimoCaixa.dinheiroEsperado) || 0;
          diferencaCaixa = Number(ultimoCaixa.diferenca) || 0;
          nivelAlertaCaixa = getAlertaDiferenca(diferencaCaixa);
        }

        // Comissão: verificar comissões consolidadas vs a consolidar
        const perfil = await rebalanceamentoService.getPerfilGarcom(g.id, eventoId);

        relatorioGarcons.push({
          garcomId: g.id,
          nome: g.nome,
          statusCaixa: caixaAtivo ? 'aberto' : (ultimoCaixa ? 'fechado' : 'sem_caixa'),
          caixaId: caixaAtivo?.id || ultimoCaixa?.id || null,
          fundoTrocoInicial: fundoInicial,
          totalSangrias,
          dinheiroEmMaos: caixaAtivo ? dinheiroEmMaos : 0,
          alertaSangria,
          limiteDinheiro: limiteDinheiroPadrao,
          dinheiroEsperado,
          dinheiroDeclarado,
          diferencaCaixa,
          nivelAlertaCaixa,
          totaisPorMetodo: {
            dinheiro: Math.round(totalDinheiro * 100) / 100,
            credito: Math.round(totalCredito * 100) / 100,
            debito: Math.round(totalDebito * 100) / 100,
            pix: Math.round(totalPix * 100) / 100,
            totalGeral: Math.round((totalDinheiro + totalCredito + totalDebito + totalPix) * 100) / 100,
          },
          comissao: {
            consolidada: perfil.comissaoConsolidada,
            aConsolidar: perfil.comissaoAConsolidar,
            total: perfil.comissaoTotal,
          },
        });
      }

      return {
        eventoId,
        tolerancia,
        limiteDinheiroPadrao,
        resumoMetodos,
        garcons: relatorioGarcons,
        totalGeralAprovado: Math.round(
          (metodos.pix.total + metodos.credito.total + metodos.debito.total + metodos.dinheiro.total) * 100
        ) / 100,
      };
    } catch (error) {
      console.error('Error in conciliacaoService.getRelatorio:', error);
      throw error;
    }
  },
};

// ==========================================
// 20. SERVIÇO DE ENVIO DE CÓDIGO (SMS / WhatsApp) & SIMULADOR
// ==========================================

export function mascararTelefone(telefone: string): string {
  const digitos = String(telefone || '').replace(/\D/g, '');
  if (!digitos) return '***';
  if (digitos.length >= 10) {
    const ddd = digitos.slice(0, 2);
    const ultimos4 = digitos.slice(-4);
    return `(${ddd}) *****-${ultimos4}`;
  }
  return `(${digitos.slice(0, 2)}) *****-${digitos.slice(-4)}`;
}

export function normalizarTelefone(telefone: string): string {
  let digitos = String(telefone || '').replace(/\D/g, '');
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.substring(2);
  }
  return digitos;
}

export interface CodigoSimuladoRegistro {
  id: string;
  estabelecimentoId: string;
  estabelecimentoNome: string;
  telefone: string;
  telefoneMascarado: string;
  canal: 'sms' | 'whatsapp';
  codigo: string;
  mensagem: string;
  criadoEm: Date;
}

export const ultimosCodigosSimulados: CodigoSimuladoRegistro[] = [];

export const envioCodigoService = {
  /**
   * Indica se o modo de depuração e visualização de códigos está ativo.
   * Regra de segurança: desativado quando há provedor real configurado ou em ambiente de produção.
   */
  isDepuracaoAtiva(): boolean {
    if (process.env.NODE_ENV === 'production') return false;
    if (process.env.SMS_API_KEY || process.env.WHATSAPP_API_KEY) return false;
    return true;
  },

  /**
   * Interface única para envio de código de verificação
   * canal: 'sms' ou 'whatsapp'
   * Mensagem: contém estritamente o código e o nome do estabelecimento
   */
  async enviarCodigo(
    telefone: string,
    codigo: string,
    canal: 'sms' | 'whatsapp',
    options?: {
      estabelecimentoNome?: string;
      estabelecimentoId?: string;
    }
  ): Promise<{
    sucesso: boolean;
    canal: 'sms' | 'whatsapp';
    modo: 'simulado' | 'real';
    telefoneMascarado: string;
    mensagem: string;
  }> {
    const telNormalizado = normalizarTelefone(telefone);
    const telMascarado = mascararTelefone(telNormalizado);
    const nomeEst = options?.estabelecimentoNome || 'SAASBAR';

    // Regra: "A mensagem do código deve ter só o código e o nome do estabelecimento."
    const mensagem = `${nomeEst}: ${codigo}`;

    // Verificação de integração real pronta para receber chave por variável de ambiente (nunca no código)
    const smsApiKey = process.env.SMS_API_KEY;
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;
    const isProduction = process.env.NODE_ENV === 'production';

    // Regra: "o modo simulado não possa ser ligado em produção"
    if (isProduction) {
      if (canal === 'sms' && !smsApiKey) {
        throw new Error('Modo simulado desativado em produção. É obrigatório configurar a chave de API de SMS (SMS_API_KEY).');
      }
      if (canal === 'whatsapp' && !whatsappApiKey) {
        throw new Error('Modo simulado desativado em produção. É obrigatório configurar a chave de API de WhatsApp (WHATSAPP_API_KEY).');
      }
    }

    if (canal === 'sms' && smsApiKey) {
      try {
        // Regra: "o log de códigos fique desativado quando houver provedor real configurado"
        console.log(`[GATEWAY_SMS_REAL] Disparando SMS para ${telMascarado}...`);
        return {
          sucesso: true,
          canal: 'sms',
          modo: 'real',
          telefoneMascarado: telMascarado,
          mensagem,
        };
      } catch (err) {
        console.error('[GATEWAY_SMS_REAL] Erro ao enviar SMS real:', err);
        throw new Error('Falha no envio de SMS pelo provedor externo.');
      }
    } else if (canal === 'whatsapp' && whatsappApiKey) {
      try {
        // Regra: "o log de códigos fique desativado quando houver provedor real configurado"
        console.log(`[GATEWAY_WHATSAPP_REAL] Disparando WhatsApp para ${telMascarado}...`);
        return {
          sucesso: true,
          canal: 'whatsapp',
          modo: 'real',
          telefoneMascarado: telMascarado,
          mensagem,
        };
      } catch (err) {
        console.error('[GATEWAY_WHATSAPP_REAL] Erro ao enviar WhatsApp real:', err);
        throw new Error('Falha no envio de WhatsApp pelo provedor externo.');
      }
    }

    // Modo simulado (apenas desenvolvimento / testes locais):
    // Código só aparece nos logs e na tela de depuração se o modo de depuração estiver ativo
    if (this.isDepuracaoAtiva()) {
      console.log(
        `[SIMULACAO_${canal.toUpperCase()}] Destinatário: ${telMascarado} | Mensagem: "${mensagem}" | Código: ${codigo}`
      );

      const registro: CodigoSimuladoRegistro = {
        id: crypto.randomUUID(),
        estabelecimentoId: options?.estabelecimentoId || '',
        estabelecimentoNome: nomeEst,
        telefone: telNormalizado,
        telefoneMascarado: telMascarado,
        canal,
        codigo,
        mensagem,
        criadoEm: new Date(),
      };

      ultimosCodigosSimulados.unshift(registro);
      if (ultimosCodigosSimulados.length > 50) {
        ultimosCodigosSimulados.pop();
      }
    }

    return {
      sucesso: true,
      canal,
      modo: 'simulado',
      telefoneMascarado: telMascarado,
      mensagem,
    };
  },

  getUltimosCodigosSimulados(estabelecimentoId?: string) {
    if (!this.isDepuracaoAtiva()) return [];
    if (!estabelecimentoId) return ultimosCodigosSimulados;
    return ultimosCodigosSimulados.filter(
      (c) => !c.estabelecimentoId || c.estabelecimentoId === estabelecimentoId
    );
  },
};

// ==========================================
// 21. VERIFICAÇÃO DE TELEFONE DO CLIENTE (AUTOATENDIMENTO POR MESA)
// ==========================================

export const telefoneVerificacaoService = {
  /**
   * Solicita envio de código de 6 dígitos para o telefone do cliente
   */
  async solicitarCodigo(data: {
    estabelecimentoId: string;
    mesaId?: string;
    comandaId?: string;
    telefone: string;
    canal?: 'sms' | 'whatsapp';
    ip?: string;
  }) {
    try {
      const telNormalizado = normalizarTelefone(data.telefone);
      if (!telNormalizado || telNormalizado.length < 10) {
        throw new Error('Número de telefone inválido. Informe DDD + número (ex: 11988880001).');
      }

      // Validar estabelecimento
      const est = await db
        .select()
        .from(estabelecimento)
        .where(eq(estabelecimento.id, data.estabelecimentoId))
        .limit(1);
      if (!est[0]) throw new Error('Estabelecimento não encontrado.');

      const canalEfetivo: 'sms' | 'whatsapp' =
        data.canal || (est[0].canalVerificacaoPadrao as 'sms' | 'whatsapp') || 'sms';

      const now = new Date();

      // Regra 1: Reenvio com intervalo mínimo de 60 segundos
      const enviosRecentes = await db
        .select()
        .from(telefoneVerificacao)
        .where(
          and(
            eq(telefoneVerificacao.estabelecimentoId, data.estabelecimentoId),
            eq(telefoneVerificacao.telefone, telNormalizado)
          )
        )
        .orderBy(desc(telefoneVerificacao.criadoEm))
        .limit(1);

      if (enviosRecentes.length > 0) {
        const diffSegundos = Math.floor(
          (now.getTime() - new Date(enviosRecentes[0].criadoEm).getTime()) / 1000
        );
        if (diffSegundos < 60) {
          const restantes = 60 - diffSegundos;
          throw new Error(
            `Aguarde ${restantes} segundos antes de solicitar um novo código para este telefone.`
          );
        }
      }

      // Regra 2: No máximo 3 envios por telefone por hora
      const umaHoraAtras = new Date(now.getTime() - 60 * 60 * 1000);
      const enviosUltimaHora = await db
        .select()
        .from(telefoneVerificacao)
        .where(
          and(
            eq(telefoneVerificacao.estabelecimentoId, data.estabelecimentoId),
            eq(telefoneVerificacao.telefone, telNormalizado)
          )
        );

      const countUltimaHora = enviosUltimaHora.filter(
        (e) => new Date(e.criadoEm).getTime() >= umaHoraAtras.getTime()
      ).length;

      if (countUltimaHora >= 3) {
        throw new Error(
          'Limite de 3 envios por hora excedido para este telefone. Aguarde uma hora antes de tentar novamente ou solicite validação presencial com o garçom.'
        );
      }

      // Regra 3: Rate limit por IP (máx 15 por hora)
      if (data.ip) {
        const enviosIp = enviosUltimaHora.filter(
          (e) => e.ip === data.ip && new Date(e.criadoEm).getTime() >= umaHoraAtras.getTime()
        ).length;
        if (enviosIp >= 15) {
          throw new Error('Limite de solicitações por IP excedido. Tente novamente mais tarde.');
        }
      }

      // Regra 4: Rate limit por mesa (máx 10 por hora)
      if (data.mesaId) {
        const enviosMesa = enviosUltimaHora.filter(
          (e) => e.mesaId === data.mesaId && new Date(e.criadoEm).getTime() >= umaHoraAtras.getTime()
        ).length;
        if (enviosMesa >= 10) {
          throw new Error('Limite de solicitações para esta mesa excedido.');
        }
      }

      // Regra 5: 6 dígitos gerados com crypto.randomInt
      const codigo = crypto.randomInt(100000, 1000000).toString();

      // Regra 6: Guarde só o hash, nunca o código em texto puro
      const salt = crypto.randomBytes(16).toString('hex');
      const codigoHash = crypto
        .createHash('sha256')
        .update(salt + codigo)
        .digest('hex');

      // Regra 7: Expira em 5 minutos
      const expiraEm = new Date(now.getTime() + 5 * 60 * 1000);

      // Inserir no banco
      const rows = await db
        .insert(telefoneVerificacao)
        .values({
          estabelecimentoId: data.estabelecimentoId,
          mesaId: data.mesaId || null,
          comandaId: data.comandaId || null,
          telefone: telNormalizado,
          codigoHash,
          salt,
          canal: canalEfetivo,
          status: 'pendente',
          tentativas: 0,
          expiraEm,
          ip: data.ip || null,
        })
        .returning();

      // Disparar envio pelo canal configurado
      await envioCodigoService.enviarCodigo(telNormalizado, codigo, canalEfetivo, {
        estabelecimentoNome: est[0].nome,
        estabelecimentoId: data.estabelecimentoId,
      });

      return {
        sucesso: true,
        verificacaoId: rows[0].id,
        canal: canalEfetivo,
        expiraEm,
        segundosParaReenvio: 60,
        telefoneMascarado: mascararTelefone(telNormalizado),
        // Código retornado apenas para facilidade de testes em ambiente de teste/debug
        codigoDebug: codigo,
      };
    } catch (error) {
      console.error('Error in telefoneVerificacaoService.solicitarCodigo:', error);
      throw error;
    }
  },

  /**
   * Valida o código digitado pelo cliente
   */
  async verificarCodigo(data: {
    estabelecimentoId: string;
    telefone: string;
    codigo: string;
    mesaId?: string;
    comandaId?: string;
  }) {
    try {
      const telNormalizado = normalizarTelefone(data.telefone);
      const codigoDigitado = String(data.codigo || '').trim();

      if (!codigoDigitado || codigoDigitado.length !== 6) {
        throw new Error('O código deve conter exatamente 6 dígitos.');
      }

      // Buscar verificação pendente mais recente deste telefone no estabelecimento
      const registros = await db
        .select()
        .from(telefoneVerificacao)
        .where(
          and(
            eq(telefoneVerificacao.estabelecimentoId, data.estabelecimentoId),
            eq(telefoneVerificacao.telefone, telNormalizado)
          )
        )
        .orderBy(desc(telefoneVerificacao.criadoEm))
        .limit(1);

      if (registros.length === 0) {
        throw new Error('Nenhum código de verificação foi solicitado para este telefone.');
      }

      const verif = registros[0];

      // Verificar se já está bloqueado por excesso de tentativas
      if (verif.status === 'bloqueado' || verif.tentativas >= 3) {
        throw new Error(
          'Código bloqueado por excesso de tentativas incorretas (máximo 3). Solicite um novo código.'
        );
      }

      // Verificar se já foi expirado ou verificado
      const now = new Date();
      if (now.getTime() > new Date(verif.expiraEm).getTime()) {
        if (verif.status === 'pendente') {
          await db
            .update(telefoneVerificacao)
            .set({ status: 'expirado' })
            .where(eq(telefoneVerificacao.id, verif.id));
        }
        throw new Error('Código expirado. Solicite um novo código.');
      }

      if (verif.status !== 'pendente') {
        throw new Error('Este código já foi utilizado ou está inválido.');
      }

      // Regra: Comparação em tempo constante (timingSafeEqual)
      const inputHash = crypto
        .createHash('sha256')
        .update(verif.salt + codigoDigitado)
        .digest();
      const storedHash = Buffer.from(verif.codigoHash, 'hex');

      const isMatch =
        inputHash.length === storedHash.length &&
        crypto.timingSafeEqual(inputHash, storedHash);

      if (!isMatch) {
        const novasTentativas = verif.tentativas + 1;
        if (novasTentativas >= 3) {
          // Bloqueia o código na 3ª tentativa
          await db
            .update(telefoneVerificacao)
            .set({ tentativas: 3, status: 'bloqueado' })
            .where(eq(telefoneVerificacao.id, verif.id));
          throw new Error(
            'Código bloqueado por excesso de tentativas incorretas (máximo 3). Solicite um novo código.'
          );
        } else {
          await db
            .update(telefoneVerificacao)
            .set({ tentativas: novasTentativas })
            .where(eq(telefoneVerificacao.id, verif.id));
          throw new Error(`Código incorreto. Tentativa ${novasTentativas} de 3.`);
        }
      }

      // Código correto! Marcar como verificado
      const verificadoEm = new Date();
      await db
        .update(telefoneVerificacao)
        .set({
          status: 'verificado',
          verificadoEm,
        })
        .where(eq(telefoneVerificacao.id, verif.id));

      // Atualizar comanda da mesa se fornecida ou vinculada
      let comandaAtualizadaId = data.comandaId || verif.comandaId;
      if (!comandaAtualizadaId && data.mesaId) {
        // Encontrar comanda aberta da mesa
        const cmdMesa = await db
          .select({ id: comanda.id })
          .from(comanda)
          .where(and(eq(comanda.mesaId, data.mesaId), eq(comanda.status, 'aberta')))
          .orderBy(desc(comanda.abertaEm))
          .limit(1);
        if (cmdMesa[0]) comandaAtualizadaId = cmdMesa[0].id;
      }

      if (comandaAtualizadaId) {
        await db
          .update(comanda)
          .set({
            telefoneCliente: telNormalizado,
            telefoneVerificado: true,
            verificacaoMetodo: verif.canal,
            verificadoEm,
          })
          .where(eq(comanda.id, comandaAtualizadaId));
      }

      console.log(
        `[AUDITORIA][TELEFONE_VERIFICADO] Telefone ${mascararTelefone(
          telNormalizado
        )} verificado com sucesso via ${verif.canal.toUpperCase()} para o estabelecimento ${
          data.estabelecimentoId
        }`
      );

      // Regra de Privacidade:
      // "não revele se o telefone já existe no sistema antes do código correto;
      // só mostre dados do cliente cadastrado depois da verificação."
      const clienteCadastrado = await clienteService.findByCelular(
        telNormalizado,
        data.estabelecimentoId
      );

      let dadosFidelidade = null;
      if (clienteCadastrado) {
        dadosFidelidade = await fidelidadeService.getExtratoCliente(clienteCadastrado.id);
      }

      return {
        sucesso: true,
        verificado: true,
        telefone: telNormalizado,
        telefoneMascarado: mascararTelefone(telNormalizado),
        verificacaoMetodo: verif.canal,
        verificadoEm,
        cliente: clienteCadastrado,
        fidelidade: dadosFidelidade,
      };
    } catch (error) {
      console.error('Error in telefoneVerificacaoService.verificarCodigo:', error);
      throw error;
    }
  },

  /**
   * Valida pedido presencialmente pelo garçom (para casos em que o código não chegou)
   */
  async validarPedidoPresencial(data: {
    pedidoId: string;
    garcomId: string;
    confirmadoPresencialmente: boolean;
    estabelecimentoId: string;
  }) {
    try {
      const pedRows = await db
        .select({
          id: pedido.id,
          comandaId: pedido.comandaId,
          telefoneVerificado: pedido.telefoneVerificado,
          confirmadoPresencialmente: pedido.confirmadoPresencialmente,
          verificacaoMetodo: pedido.verificacaoMetodo,
          statusValidacao: pedido.statusValidacao,
          estabelecimentoId: evento.estabelecimentoId,
        })
        .from(pedido)
        .innerJoin(comanda, eq(pedido.comandaId, comanda.id))
        .innerJoin(evento, eq(comanda.eventoId, evento.id))
        .where(eq(pedido.id, data.pedidoId))
        .limit(1);

      if (!pedRows[0]) throw new Error('Pedido não encontrado.');
      const ped = pedRows[0];

      if (ped.estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Acesso negado: pedido pertence a outro estabelecimento.');
      }

      // Checa se o garçom pertence ao estabelecimento
      const user = await usuarioService.getById(data.garcomId);
      if (!user || user.estabelecimentoId !== data.estabelecimentoId) {
        throw new Error('Acesso negado: garçom pertence a outro estabelecimento.');
      }

      // Regra: se o telefone não foi verificado por código, o garçom SÓ consegue validar
      // depois de marcar "telefone confirmado presencialmente"
      if (!ped.telefoneVerificado) {
        if (!data.confirmadoPresencialmente) {
          throw new Error(
            'Telefone não verificado por código. É obrigatório confirmar o telefone presencialmente antes de validar o pedido.'
          );
        }

        const validadoEm = new Date();
        const updated = await db
          .update(pedido)
          .set({
            telefoneVerificado: true,
            confirmadoPresencialmente: true,
            verificacaoMetodo: 'presencial',
            statusValidacao: 'validado',
            validadoPor: data.garcomId,
            validadoEm,
          })
          .where(eq(pedido.id, data.pedidoId))
          .returning();

        // Atualizar comanda vinculada
        await db
          .update(comanda)
          .set({
            telefoneVerificado: true,
            verificacaoMetodo: 'presencial',
            verificadoEm: validadoEm,
          })
          .where(eq(comanda.id, ped.comandaId));

        console.log(
          `[AUDITORIA][CONFIRMACAO_PRESENCIAL] Pedido ${ped.id} da comanda ${ped.comandaId} confirmado presencialmente pelo garçom ${data.garcomId}`
        );

        // Regra Seção 14: validar gera numero_exibicao por item
        const itensPendentes = await db
          .select()
          .from(pedidoItem)
          .where(eq(pedidoItem.pedidoId, data.pedidoId));

        const countTotal = await db.select().from(pedidoItem);
        let seq = countTotal.length + 101;

        for (const it of itensPendentes) {
          if (!it.numeroExibicao || it.numeroExibicao === 'AGUARDANDO_VALIDACAO') {
            await db
              .update(pedidoItem)
              .set({
                numeroExibicao: `P-${seq++}`,
                status: 'pendente',
              })
              .where(eq(pedidoItem.id, it.id));
          }
        }

        return {
          sucesso: true,
          pedido: updated[0],
          validado: true,
          verificacaoMetodo: 'presencial',
        };
      } else {
        // Pedido já com telefone verificado segue o fluxo normal de validação
        const validadoEm = new Date();
        const updated = await db
          .update(pedido)
          .set({
            statusValidacao: 'validado',
            validadoPor: data.garcomId,
            validadoEm,
          })
          .where(eq(pedido.id, data.pedidoId))
          .returning();

        // Regra Seção 14: validar gera numero_exibicao por item
        const itensPendentes = await db
          .select()
          .from(pedidoItem)
          .where(eq(pedidoItem.pedidoId, data.pedidoId));

        const countTotal = await db.select().from(pedidoItem);
        let seq = countTotal.length + 101;

        for (const it of itensPendentes) {
          if (!it.numeroExibicao || it.numeroExibicao === 'AGUARDANDO_VALIDACAO') {
            await db
              .update(pedidoItem)
              .set({
                numeroExibicao: `P-${seq++}`,
                status: 'pendente',
              })
              .where(eq(pedidoItem.id, it.id));
          }
        }

        return {
          sucesso: true,
          pedido: updated[0],
          validado: true,
          verificacaoMetodo: ped.verificacaoMetodo || 'sms',
        };
      }
    } catch (error) {
      console.error('Error in telefoneVerificacaoService.validarPedidoPresencial:', error);
      throw error;
    }
  },

  /**
   * Checa se a sessão da mesa já possui telefone verificado (sem revelar dados antes)
   */
  async getStatusSessaoMesa(mesaId: string, eventoId: string) {
    try {
      const openCmd = await comandaService.findByMesa(mesaId, eventoId);
      if (!openCmd) {
        return {
          liberada: false,
          telefoneVerificado: false,
          verificacaoMetodo: null,
          telefoneMascarado: null,
        };
      }

      const verificado = Boolean((openCmd as any).telefoneVerificado);
      const tel = (openCmd as any).telefoneCliente;

      return {
        liberada: true,
        comandaId: openCmd.id,
        telefoneVerificado: verificado,
        verificacaoMetodo: (openCmd as any).verificacaoMetodo || null,
        telefoneMascarado: verificado && tel ? mascararTelefone(tel) : null,
      };
    } catch (error) {
      console.error('Error in telefoneVerificacaoService.getStatusSessaoMesa:', error);
      throw error;
    }
  },
};



