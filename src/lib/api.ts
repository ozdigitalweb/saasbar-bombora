import {
  Estabelecimento,
  PontoDePreparo,
  Usuario,
  Mesa,
  Pulseira,
  Cliente,
  ItemCardapio,
  PapelUsuario,
  PreviaFechamento,
  RelatorioRateios,
  MetodoPagamento,
  TipoContribuicao,
  MultaPulseiraCalculo,
  FidelidadeExtrato,
  RebalanceamentoDados,
  PulseiraPerdidaBuscaItem,
} from '../types/index.ts';

let currentAuthToken: string | null = null;
try {
  currentAuthToken = localStorage.getItem('saasbar_token');
} catch (e) {
  // ignore
}

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
  try {
    if (token) {
      localStorage.setItem('saasbar_token', token);
    } else {
      localStorage.removeItem('saasbar_token');
    }
  } catch (e) {
    // ignore
  }
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Erro ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.error) errorMsg = body.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Authentication
  async login(login: string, senha: string, estabelecimentoId?: string): Promise<{
    token: string;
    user: Usuario;
  }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha, estabelecimentoId }),
    });
    const data = await handleResponse<{ token: string; user: Usuario }>(res);
    setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<Usuario> {
    const res = await fetch('/api/auth/me', {
      headers: getHeaders(),
    });
    return handleResponse<Usuario>(res);
  },

  logout() {
    setAuthToken(null);
  },

  // Bootstrap & Health
  async getBootstrap() {
    const res = await fetch('/api/bootstrap', {
      headers: getHeaders(),
    });
    return handleResponse<{
      estabelecimentos: Estabelecimento[];
      currentEstabelecimento: Estabelecimento;
      counts: Record<string, number>;
    }>(res);
  },

  // 1. Estabelecimentos
  async getEstabelecimentos(): Promise<Estabelecimento[]> {
    const res = await fetch('/api/estabelecimentos', {
      headers: getHeaders(),
    });
    return handleResponse<Estabelecimento[]>(res);
  },
  async createEstabelecimento(data: {
    nome: string;
    tipo?: string;
    config?: Record<string, any>;
  }): Promise<Estabelecimento> {
    const res = await fetch('/api/estabelecimentos', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Estabelecimento>(res);
  },
  async updateEstabelecimento(
    id: string,
    data: { nome?: string; tipo?: string; config?: Record<string, any> }
  ): Promise<Estabelecimento> {
    const res = await fetch(`/api/estabelecimentos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Estabelecimento>(res);
  },
  async deleteEstabelecimento(id: string): Promise<any> {
    const res = await fetch(`/api/estabelecimentos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // 2. Pontos de Preparo
  async getPontosDePreparo(estabelecimentoId: string): Promise<PontoDePreparo[]> {
    const res = await fetch(
      `/api/pontos-de-preparo?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<PontoDePreparo[]>(res);
  },
  async createPontoDePreparo(data: {
    estabelecimentoId: string;
    nome: string;
  }): Promise<PontoDePreparo> {
    const res = await fetch('/api/pontos-de-preparo', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<PontoDePreparo>(res);
  },
  async updatePontoDePreparo(id: string, data: { nome: string }): Promise<PontoDePreparo> {
    const res = await fetch(`/api/pontos-de-preparo/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<PontoDePreparo>(res);
  },
  async deletePontoDePreparo(id: string): Promise<any> {
    const res = await fetch(`/api/pontos-de-preparo/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // 3. Usuários
  async getUsuarios(
    estabelecimentoId: string,
    papel?: PapelUsuario
  ): Promise<Usuario[]> {
    const url = papel
      ? `/api/usuarios?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}&papel=${papel}`
      : `/api/usuarios?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<Usuario[]>(res);
  },
  async createUsuario(data: {
    estabelecimentoId: string;
    nome: string;
    papel: PapelUsuario;
    celular?: string;
    email?: string;
    senha?: string;
    senhaHash?: string;
  }): Promise<Usuario> {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Usuario>(res);
  },
  async updateUsuario(
    id: string,
    data: {
      nome?: string;
      papel?: PapelUsuario;
      celular?: string;
      email?: string;
      senha?: string;
      senhaHash?: string;
    }
  ): Promise<Usuario> {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Usuario>(res);
  },
  async deleteUsuario(id: string): Promise<any> {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // 4. Mesas
  async getMesas(estabelecimentoId: string): Promise<Mesa[]> {
    const res = await fetch(
      `/api/mesas?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<Mesa[]>(res);
  },
  async createMesa(data: {
    estabelecimentoId: string;
    identificador: string;
    qrCode?: string;
    status?: string;
  }): Promise<Mesa> {
    const res = await fetch('/api/mesas', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Mesa>(res);
  },
  async updateMesa(
    id: string,
    data: { identificador?: string; qrCode?: string; status?: string }
  ): Promise<Mesa> {
    const res = await fetch(`/api/mesas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Mesa>(res);
  },
  async regenerarQrMesa(id: string): Promise<Mesa> {
    const res = await fetch(`/api/mesas/${encodeURIComponent(id)}/regenerar-qr`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<Mesa>(res);
  },
  async deleteMesa(id: string): Promise<any> {
    const res = await fetch(`/api/mesas/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // 5. Pulseiras
  async getPulseiras(estabelecimentoId: string): Promise<Pulseira[]> {
    const res = await fetch(
      `/api/pulseiras?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<Pulseira[]>(res);
  },
  async createPulseira(data: {
    estabelecimentoId: string;
    codigoQr: string;
  }): Promise<Pulseira> {
    const res = await fetch('/api/pulseiras', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Pulseira>(res);
  },
  async updatePulseira(id: string, data: { codigoQr: string }): Promise<Pulseira> {
    const res = await fetch(`/api/pulseiras/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Pulseira>(res);
  },
  async deletePulseira(id: string): Promise<any> {
    const res = await fetch(`/api/pulseiras/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // 6. Clientes
  async getClientes(estabelecimentoId: string, search?: string): Promise<Cliente[]> {
    const url = search
      ? `/api/clientes?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}&search=${encodeURIComponent(search)}`
      : `/api/clientes?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<Cliente[]>(res);
  },
  async createCliente(data: {
    estabelecimentoId: string;
    nome: string;
    celular: string;
    email?: string;
  }): Promise<Cliente> {
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Cliente>(res);
  },
  async updateCliente(
    id: string,
    data: { nome?: string; celular?: string; email?: string }
  ): Promise<Cliente> {
    const res = await fetch(`/api/clientes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Cliente>(res);
  },
  async deleteCliente(id: string): Promise<any> {
    const res = await fetch(`/api/clientes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // 7. Itens de Cardápio
  async getItensCardapio(estabelecimentoId: string): Promise<ItemCardapio[]> {
    const res = await fetch(
      `/api/itens-cardapio?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<ItemCardapio[]>(res);
  },
  async createItemCardapio(data: {
    estabelecimentoId: string;
    pontoDePreparoId: string;
    nome: string;
    preco: number;
  }): Promise<ItemCardapio> {
    const res = await fetch('/api/itens-cardapio', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ItemCardapio>(res);
  },
  async updateItemCardapio(
    id: string,
    data: { pontoDePreparoId?: string; nome?: string; preco?: number }
  ): Promise<ItemCardapio> {
    const res = await fetch(`/api/itens-cardapio/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ItemCardapio>(res);
  },
  async deleteItemCardapio(id: string): Promise<any> {
    const res = await fetch(`/api/itens-cardapio/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // ==========================================
  // OPERATIONAL API: EVENTOS
  // ==========================================
  async getEventos(estabelecimentoId: string) {
    const res = await fetch(`/api/eventos?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async getActiveEvento(estabelecimentoId: string) {
    const res = await fetch(`/api/eventos/ativo?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async createEvento(data: {
    estabelecimentoId: string;
    nome: string;
    dataInicio?: string | Date;
    modoRebalanceamento?: 'automatico' | 'manual';
  }) {
    const res = await fetch('/api/eventos', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async closeEvento(id: string) {
    const res = await fetch(`/api/eventos/${id}/encerrar`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // ==========================================
  // OPERATIONAL API: VÍNCULOS PULSEIRA
  // ==========================================
  async getVinculosPulseira(eventoId: string) {
    const res = await fetch(`/api/vinculos-pulseira?eventoId=${encodeURIComponent(eventoId)}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async createVinculoPulseira(data: {
    pulseiraId: string;
    clienteId: string;
    eventoId: string;
    mesaId?: string;
  }) {
    const res = await fetch('/api/vinculos-pulseira', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async buscarVinculoPorQr(codigoQr: string, eventoId: string) {
    const res = await fetch(
      `/api/vinculos-pulseira/buscar-qr?codigoQr=${encodeURIComponent(codigoQr)}&eventoId=${encodeURIComponent(eventoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<any>(res);
  },

  // ==========================================
  // OPERATIONAL API: COMANDAS
  // ==========================================
  async getComandas(eventoId: string, status?: 'aberta' | 'fechada') {
    const url = status
      ? `/api/comandas?eventoId=${encodeURIComponent(eventoId)}&status=${status}`
      : `/api/comandas?eventoId=${encodeURIComponent(eventoId)}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  async getComandaById(id: string) {
    const res = await fetch(`/api/comandas/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async buscarComandaPorPulseira(codigoQr: string, eventoId: string) {
    const res = await fetch(
      `/api/comandas/buscar-pulseira?codigoQr=${encodeURIComponent(codigoQr)}&eventoId=${encodeURIComponent(eventoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<any>(res);
  },

  async getComandaPorPulseira(codigoQr: string, eventoId: string) {
    return this.buscarComandaPorPulseira(codigoQr, eventoId);
  },

  async gerarReciboWhatsApp(comandaId: string) {
    const res = await fetch(`/api/comandas/${comandaId}/recibo-whatsapp`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getComandaPorMesa(mesaId: string, eventoId: string) {
    const res = await fetch(
      `/api/comandas/por-mesa/${encodeURIComponent(mesaId)}?eventoId=${encodeURIComponent(eventoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<any>(res);
  },

  async createComanda(data: {
    eventoId: string;
    tipoAtendimento: 'pulseira' | 'mesa';
    vinculoPulseiraEventoId?: string;
    mesaId?: string;
    garcomResponsavelId?: string;
  }) {
    const res = await fetch('/api/comandas', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateComandaStatus(id: string, status: 'aberta' | 'fechada') {
    const res = await fetch(`/api/comandas/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<any>(res);
  },

  // ==========================================
  // OPERATIONAL API: LANÇAMENTO RÁPIDO & KDS
  // ==========================================
  async clientePedido(data: {
    itens: Array<{ itemCardapioId: string; quantidade: number }>;
    token: string;
    mesaId?: string;
    comandaId?: string;
    estabelecimentoId?: string;
  }) {
    const customHeaders: Record<string, string> = {
      Authorization: `Bearer ${data.token}`,
    };
    const res = await fetch('/api/cliente/pedido', {
      method: 'POST',
      headers: getHeaders(customHeaders),
      body: JSON.stringify({
        itens: data.itens,
        mesaId: data.mesaId,
        comandaId: data.comandaId,
        estabelecimentoId: data.estabelecimentoId,
      }),
    });
    return handleResponse<any>(res);
  },

  async lancamentoRapido(data: {
    comandaId: string;
    origem: 'operador_balcao' | 'garcom' | 'autoatendimento';
    criadoPor?: string;
    itens: Array<{ itemCardapioId: string; quantidade: number }>;
    confirmadoPresencialmente?: boolean;
    token?: string;
  }) {
    const customHeaders: Record<string, string> = {};
    if (data.token) {
      customHeaders['Authorization'] = `Bearer ${data.token}`;
    }
    const res = await fetch('/api/pedidos/lancamento-rapido', {
      method: 'POST',
      headers: getHeaders(customHeaders),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async solicitarCodigoVerificacao(data: {
    estabelecimentoId: string;
    mesaId: string;
    comandaId?: string;
    telefone: string;
    canal?: 'sms' | 'whatsapp';
  }) {
    const res = await fetch('/api/cliente/solicitar-codigo', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async verificarCodigoTelefone(data: {
    estabelecimentoId: string;
    mesaId?: string;
    comandaId?: string;
    telefone: string;
    codigo: string;
  }) {
    const res = await fetch('/api/cliente/verificar-codigo', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async sessaoSemCodigo(data: {
    estabelecimentoId: string;
    mesaId: string;
    comandaId?: string;
    telefone?: string;
  }) {
    const res = await fetch('/api/cliente/sessao-sem-codigo', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async getSessaoMesa(mesaId: string, eventoId: string) {
    const res = await fetch(
      `/api/cliente/sessao-mesa?mesaId=${encodeURIComponent(mesaId)}&eventoId=${encodeURIComponent(eventoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<any>(res);
  },

  async validarPedido(pedidoId: string, confirmadoPresencialmente?: boolean) {
    const res = await fetch(`/api/pedidos/${encodeURIComponent(pedidoId)}/validar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ confirmadoPresencialmente }),
    });
    return handleResponse<any>(res);
  },

  async getPedidosAguardandoValidacao(eventoId: string) {
    const res = await fetch(`/api/pedidos/aguardando-validacao?eventoId=${encodeURIComponent(eventoId)}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async getUltimosCodigosSms() {
    const res = await fetch('/api/debug/ultimos-codigos-sms', {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async updateCanalVerificacaoEstabelecimento(estabelecimentoId: string, canal: 'sms' | 'whatsapp') {
    const res = await fetch(`/api/estabelecimentos/${encodeURIComponent(estabelecimentoId)}/canal-verificacao`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ canal }),
    });
    return handleResponse<any>(res);
  },

  async updatePedidoItemStatus(itemId: string, status: string) {
    const res = await fetch(`/api/pedidos-itens/${itemId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<any>(res);
  },

  async getKdsFila(pontoDePreparoId?: string, eventoId?: string) {
    const url = pontoDePreparoId
      ? `/api/kds/fila?pontoDePreparoId=${encodeURIComponent(pontoDePreparoId)}`
      : `/api/kds/fila`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  // ==========================================
  // OPERATIONAL API: FECHAMENTO & RATEIO DE CONTAS
  // ==========================================
  async getPreviaFechamento(comandaId: string): Promise<PreviaFechamento> {
    const res = await fetch(`/api/comandas/${comandaId}/previa-fechamento`, {
      headers: getHeaders(),
    });
    return handleResponse<PreviaFechamento>(res);
  },

  async fecharComandaEfetuarPagamento(
    comandaId: string,
    data: {
      metodo: string;
      tipoContribuicao: string;
      valorContribuicao?: number;
      valorRecebido?: number;
      bandeira?: string;
      nsu?: string;
      idempotencyKey?: string;
      garcomId?: string;
    }
  ): Promise<any> {
    const headers = getHeaders();
    if (data.idempotencyKey) {
      headers['idempotency-key'] = data.idempotencyKey;
    }
    const res = await fetch(`/api/comandas/${comandaId}/fechar-pagamento`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async estornarCobranca(cobrancaId: string, motivo: string): Promise<any> {
    const res = await fetch(`/api/cobrancas/${cobrancaId}/estornar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ motivo }),
    });
    return handleResponse<any>(res);
  },

  async abrirCaixaGarcom(
    eventoId: string,
    garcomId: string,
    fundoTrocoInicial: number
  ): Promise<any> {
    const res = await fetch('/api/caixas-garcom/abrir', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ eventoId, garcomId, fundoTrocoInicial }),
    });
    return handleResponse<any>(res);
  },

  async registrarSangria(
    caixaId: string,
    valor: number,
    motivo?: string
  ): Promise<any> {
    const res = await fetch(`/api/caixas-garcom/${caixaId}/sangria`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ valor, motivo }),
    });
    return handleResponse<any>(res);
  },

  async fecharCaixaGarcom(
    caixaId: string,
    dinheiroDeclarado: number
  ): Promise<any> {
    const res = await fetch(`/api/caixas-garcom/${caixaId}/fechar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ dinheiroDeclarado }),
    });
    return handleResponse<any>(res);
  },

  async getStatusCaixaGarcom(
    garcomId: string,
    eventoId: string
  ): Promise<any> {
    const res = await fetch(
      `/api/caixas-garcom/status?garcomId=${encodeURIComponent(garcomId)}&eventoId=${encodeURIComponent(eventoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<any>(res);
  },

  async getRelatorioConciliacao(
    eventoId: string,
    maquinaCredito?: number,
    maquinaDebito?: number
  ): Promise<any> {
    const params = new URLSearchParams({ eventoId });
    if (maquinaCredito !== undefined) params.append('maquinaCredito', String(maquinaCredito));
    if (maquinaDebito !== undefined) params.append('maquinaDebito', String(maquinaDebito));
    const res = await fetch(`/api/conciliacao/relatorio?${params.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getRelatorioRateios(
    estabelecimentoId: string,
    eventoId?: string
  ): Promise<RelatorioRateios> {
    const url = eventoId
      ? `/api/relatorios/rateios?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}&eventoId=${encodeURIComponent(eventoId)}`
      : `/api/relatorios/rateios?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<RelatorioRateios>(res);
  },

  // ==========================================
  // OPERATIONAL API: PULSEIRA PERDIDA (MULTA 30 MIN, 1X / 5X)
  // ==========================================
  async buscarPulseiraPorCelular(
    celular: string,
    eventoId?: string
  ): Promise<PulseiraPerdidaBuscaItem[]> {
    const params = new URLSearchParams({ celular });
    if (eventoId) params.append('eventoId', eventoId);
    const res = await fetch(`/api/pulseiras-perdidas/buscar-por-celular?${params.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<PulseiraPerdidaBuscaItem[]>(res);
  },

  async iniciarToleranciaPulseira(
    vinculoPulseiraEventoId: string,
    eventoId?: string
  ): Promise<any> {
    const res = await fetch('/api/pulseiras-perdidas/iniciar-tolerancia', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ vinculoPulseiraEventoId, eventoId }),
    });
    return handleResponse<any>(res);
  },

  async comunicarPerdaPulseira(vinculoPulseiraEventoId: string, eventoId?: string): Promise<any> {
    return this.iniciarToleranciaPulseira(vinculoPulseiraEventoId, eventoId);
  },

  async getCalculoMultaPulseira(vinculoId: string): Promise<MultaPulseiraCalculo> {
    const res = await fetch(`/api/pulseiras-perdidas/calculo/${vinculoId}`, {
      headers: getHeaders(),
    });
    return handleResponse<MultaPulseiraCalculo>(res);
  },

  async getPulseirasPerdidas(eventoId?: string): Promise<any[]> {
    const url = eventoId
      ? `/api/pulseiras-perdidas?eventoId=${encodeURIComponent(eventoId)}`
      : `/api/pulseiras-perdidas`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  // ==========================================
  // OPERATIONAL API: FIDELIDADE DE DUAS ESTRELAS
  // ==========================================
  async getFidelidadeRanking(estabelecimentoId: string): Promise<FidelidadeExtrato[]> {
    const res = await fetch(
      `/api/fidelidade/ranking?estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<FidelidadeExtrato[]>(res);
  },

  async getFidelidadeCliente(clienteId: string): Promise<FidelidadeExtrato> {
    const res = await fetch(`/api/fidelidade/cliente/${clienteId}`, {
      headers: getHeaders(),
    });
    return handleResponse<FidelidadeExtrato>(res);
  },

  async resgatarChoppCortesia(clienteId: string): Promise<any> {
    const res = await fetch(`/api/fidelidade/resgatar-chopp/${clienteId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // ==========================================
  // OPERATIONAL API: REBALANCEAMENTO & COMISSÃO
  // ==========================================
  async getRebalanceamentoEquipe(
    eventoId: string,
    estabelecimentoId: string
  ): Promise<RebalanceamentoDados> {
    const res = await fetch(
      `/api/equipe/rebalanceamento?eventoId=${encodeURIComponent(eventoId)}&estabelecimentoId=${encodeURIComponent(estabelecimentoId)}`,
      { headers: getHeaders() }
    );
    return handleResponse<RebalanceamentoDados>(res);
  },

  async atribuirMesaGarcom(garcomId: string, mesaId: string): Promise<any> {
    const res = await fetch('/api/equipe/atribuir-mesa', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ garcomId, mesaId }),
    });
    return handleResponse<any>(res);
  },

  async removerMesaGarcom(garcomId: string, mesaId: string): Promise<any> {
    const res = await fetch('/api/equipe/remover-mesa', {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ garcomId, mesaId }),
    });
    return handleResponse<any>(res);
  },

  async salvarMetaComissao(data: {
    garcomId: string;
    eventoId: string;
    metaMinutos?: number;
    comissaoBase?: number;
    bonus?: number;
  }): Promise<any> {
    const res = await fetch('/api/equipe/meta-comissao', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async executarRebalanceamento(
    eventoId: string,
    estabelecimentoId: string
  ): Promise<any> {
    const res = await fetch('/api/equipe/executar-rebalanceamento', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ eventoId, estabelecimentoId }),
    });
    return handleResponse<any>(res);
  },

  // ==========================================
  // APP DO GARÇOM (MOBILE)
  // ==========================================
  async buscarClienteGarcom(celular: string, estabelecimentoId?: string): Promise<{
    encontrado: boolean;
    cliente: Cliente | null;
    fidelidade: FidelidadeExtrato | null;
    recorrente: boolean;
    saudacao: string;
  }> {
    const query = new URLSearchParams({ celular });
    if (estabelecimentoId) query.set('estabelecimentoId', estabelecimentoId);
    const res = await fetch(`/api/garcom/clientes/buscar?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async checkInPulseiraGarcom(data: {
    clienteId?: string;
    nome?: string;
    celular?: string;
    estabelecimentoId: string;
    codigoQrPulseira: string;
    eventoId: string;
    mesaId?: string;
    garcomId?: string;
  }): Promise<{
    sucesso: boolean;
    comanda: any;
    vinculo: any;
    cliente: Cliente;
    pulseira: Pulseira;
    fidelidade: FidelidadeExtrato;
  }> {
    const res = await fetch('/api/garcom/check-in-pulseira', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async liberarMesaGarcom(
    mesaId: string,
    eventoId: string,
    garcomId?: string
  ): Promise<{ sucesso: boolean; mensagem: string; comanda: any }> {
    const res = await fetch('/api/garcom/mesas/liberar', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mesaId, eventoId, garcomId }),
    });
    return handleResponse(res);
  },

  async getFilaEntregaGarcom(eventoId?: string, garcomId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (eventoId) params.set('eventoId', eventoId);
    if (garcomId) params.set('garcomId', garcomId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/garcom/fila-entrega${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async confirmarRecebimentoItem(itemId: string): Promise<any> {
    const res = await fetch(`/api/garcom/fila-entrega/${itemId}/recebi`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getPerfilGarcom(
    garcomId: string,
    eventoId?: string
  ): Promise<{
    garcom: Usuario;
    tempoRespostaMedio: string;
    tempoRespostaSegundos: number;
    metaTempoResposta: string;
    metaSegundos: number;
    dentroDaMeta: boolean;
    comissaoAcumulada: number;
    totalItensAvaliados: number;
    totalMesasAtribuidas: number;
  }> {
    const query = eventoId ? `?eventoId=${encodeURIComponent(eventoId)}` : '';
    const res = await fetch(`/api/garcom/perfil/${garcomId}${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
