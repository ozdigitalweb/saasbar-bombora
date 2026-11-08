import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { ToastContainer, ToastMessage } from './components/common/Toast.tsx';
import { EstabelecimentoView } from './components/views/EstabelecimentoView.tsx';
import { PontosPreparoView } from './components/views/PontosPreparoView.tsx';
import { UsuariosView } from './components/views/UsuariosView.tsx';
import { MesasView } from './components/views/MesasView.tsx';
import { PulseirasView } from './components/views/PulseirasView.tsx';
import { ClientesView } from './components/views/ClientesView.tsx';
import { CardapioView } from './components/views/CardapioView.tsx';
import { LoginView } from './components/views/LoginView.tsx';
import { MonitorComandasView } from './components/views/MonitorComandasView.tsx';
import { EventosView } from './components/views/EventosView.tsx';
import { KdsStatusView } from './components/views/KdsStatusView.tsx';
import { ClienteAutoatendimentoView } from './components/views/ClienteAutoatendimentoView.tsx';
import { PainelKdsFisicoView } from './components/views/PainelKdsFisicoView.tsx';
import { GarcomMobileAppView } from './components/views/GarcomMobileAppView.tsx';
import { FechamentoRateioView } from './components/views/FechamentoRateioView.tsx';
import { RelatoriosFidelidadeView } from './components/views/RelatoriosFidelidadeView.tsx';
import { RebalanceamentoEquipeView } from './components/views/RebalanceamentoEquipeView.tsx';
import { ManualAjudaView } from './components/views/ManualAjudaView.tsx';
import { LancamentoRapidoDrawer } from './components/operations/LancamentoRapidoDrawer.tsx';
import { CheckInComandaModal } from './components/operations/CheckInComandaModal.tsx';
import { ComandaDetailsModal } from './components/operations/ComandaDetailsModal.tsx';
import { api, getAuthToken, setAuthToken } from './lib/api.ts';
import {
  Estabelecimento,
  PontoDePreparo,
  Usuario,
  Mesa,
  Pulseira,
  Cliente,
  ItemCardapio,
  EntityTab,
  PapelUsuario,
  Evento,
  ComandaSummary,
} from './types/index.ts';
import { AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { Badge } from './components/common/Badge.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isPublicManualOpen, setIsPublicManualOpen] = useState(false);

  // Surface mode: 'gerente' | 'garcom_mobile' | 'cliente_mesa' | 'kds_fisico'
  const [appMode, setAppMode] = useState<'gerente' | 'garcom_mobile' | 'cliente_mesa' | 'kds_fisico'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'garcom' || window.location.hash === '#garcom') return 'garcom_mobile';
      if (params.get('view') === 'cliente' || window.location.hash === '#cliente') return 'cliente_mesa';
      if (params.get('view') === 'kds' || window.location.hash === '#kds') return 'kds_fisico';
    }
    return 'gerente';
  });

  // Tab State - default to live operational Monitor de Comandas or manual if requested
  const [currentTab, setCurrentTab] = useState<EntityTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'manual' || params.get('tab') === 'ajuda' || window.location.hash === '#ajuda' || window.location.hash === '#manual') {
        return 'manual_ajuda';
      }
    }
    return 'monitor_comandas';
  });
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [currentEstabelecimento, setCurrentEstabelecimento] = useState<Estabelecimento | null>(null);

  // Operational state
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [activeEvento, setActiveEvento] = useState<Evento | null>(null);
  const [comandas, setComandas] = useState<ComandaSummary[]>([]);

  // Entity lists
  const [pontos, setPontos] = useState<PontoDePreparo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pulseiras, setPulseiras] = useState<Pulseira[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [itensCardapio, setItensCardapio] = useState<ItemCardapio[]>([]);

  // Modals & Drawers
  const [isLancamentoOpen, setIsLancamentoOpen] = useState(false);
  const [preselectedComandaForLancamento, setPreselectedComandaForLancamento] = useState<string | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isComandaDetailsOpen, setIsComandaDetailsOpen] = useState(false);
  const [selectedComandaForDetails, setSelectedComandaForDetails] = useState<ComandaSummary | null>(null);
  const [preselectedComandaForFechamento, setPreselectedComandaForFechamento] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check auth on startup
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }
      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch (e) {
        console.warn('Session expired or invalid token');
        setAuthToken(null);
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // Refresh Comandas for active event
  const refreshComandas = useCallback(async (eventoId?: string) => {
    const targetEventoId = eventoId || activeEvento?.id;
    if (!targetEventoId) return;
    try {
      const list = await api.getComandas(targetEventoId);
      setComandas(list);
    } catch (e) {
      console.error('Failed to refresh comandas:', e);
    }
  }, [activeEvento]);

  // Load all data for current establishment
  const loadData = useCallback(async (selectedEstId?: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const bootstrap = await api.getBootstrap();
      const allEsts = bootstrap.estabelecimentos;
      setEstabelecimentos(allEsts);

      const targetEst =
        (selectedEstId && allEsts.find((e) => e.id === selectedEstId)) ||
        currentEstabelecimento ||
        bootstrap.currentEstabelecimento ||
        allEsts[0] ||
        null;

      setCurrentEstabelecimento(targetEst);

      if (targetEst) {
        const [
          fetchedPontos,
          fetchedUsuarios,
          fetchedMesas,
          fetchedPulseiras,
          fetchedClientes,
          fetchedItens,
          fetchedEventos,
          fetchedActiveEvento,
        ] = await Promise.all([
          api.getPontosDePreparo(targetEst.id),
          api.getUsuarios(targetEst.id),
          api.getMesas(targetEst.id),
          api.getPulseiras(targetEst.id),
          api.getClientes(targetEst.id),
          api.getItensCardapio(targetEst.id),
          api.getEventos(targetEst.id),
          api.getActiveEvento(targetEst.id),
        ]);

        setPontos(fetchedPontos);
        setUsuarios(fetchedUsuarios);
        setMesas(fetchedMesas);
        setPulseiras(fetchedPulseiras);
        setClientes(fetchedClientes);
        setItensCardapio(fetchedItens);
        setEventos(fetchedEventos);

        const currentActive = fetchedActiveEvento || fetchedEventos[0] || null;
        setActiveEvento(currentActive);

        if (currentActive) {
          const fetchedComandas = await api.getComandas(currentActive.id);
          setComandas(fetchedComandas);
        } else {
          setComandas([]);
        }
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load SAASBAR data:', err);
      setError(err.message || 'Erro ao carregar dados do banco PostgreSQL.');
      addToast('error', 'Falha na comunicação com o PostgreSQL.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentEstabelecimento]);

  useEffect(() => {
    if (currentUser) {
      loadData(currentUser.estabelecimentoId);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: Usuario, token: string) => {
    setCurrentUser(user);
    if (user.papel === 'garcom') {
      setAppMode('garcom_mobile');
    }
    addToast('success', `Bem-vindo, ${user.nome}! Sessão autenticada.`);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    addToast('info', 'Sessão encerrada com sucesso.');
  };

  const handleSelectEstabelecimento = (est: Estabelecimento) => {
    setCurrentEstabelecimento(est);
    loadData(est.id, false);
    addToast('info', `Estabelecimento alternado para "${est.nome}".`);
  };

  // ==========================================
  // OPERATIONAL HANDLERS
  // ==========================================

  const handleSelectActiveEvento = async (evento: Evento) => {
    setActiveEvento(evento);
    try {
      const list = await api.getComandas(evento.id);
      setComandas(list);
      addToast('info', `Evento "${evento.nome}" selecionado para monitoramento.`);
    } catch (e: any) {
      addToast('error', e.message || 'Erro ao carregar comandas do evento.');
    }
  };

  const handleCreateEvento = async (data: {
    estabelecimentoId: string;
    nome: string;
    dataInicio?: string;
    modoRebalanceamento?: 'automatico' | 'manual';
  }) => {
    try {
      const created = await api.createEvento(data);
      addToast('success', `Evento "${created.nome}" iniciado com sucesso.`);
      if (currentEstabelecimento) {
        const evs = await api.getEventos(currentEstabelecimento.id);
        setEventos(evs);
        setActiveEvento(created);
        setComandas([]);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao criar evento.');
      throw err;
    }
  };

  const handleCloseEvento = async (id: string) => {
    try {
      const closed = await api.closeEvento(id);
      addToast('info', `Evento "${closed.nome}" encerrado.`);
      if (currentEstabelecimento) {
        const evs = await api.getEventos(currentEstabelecimento.id);
        setEventos(evs);
        if (activeEvento?.id === id) {
          setActiveEvento(closed);
        }
      }
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao encerrar evento.');
      throw err;
    }
  };

  // Check-In: vincula pulseira ao cliente e abre comanda
  const handleCheckIn = async (data: {
    tipoAtendimento: 'pulseira' | 'mesa';
    clienteId: string;
    pulseiraId?: string;
    mesaId?: string;
    garcomResponsavelId?: string;
  }) => {
    if (!activeEvento) {
      addToast('error', 'Nenhum evento ativo selecionado para vincular a comanda.');
      return;
    }

    try {
      let vinculoId: string | undefined;

      if (data.tipoAtendimento === 'pulseira' && data.pulseiraId) {
        const vinculo = await api.createVinculoPulseira({
          pulseiraId: data.pulseiraId,
          clienteId: data.clienteId,
          eventoId: activeEvento.id,
          mesaId: data.mesaId,
        });
        vinculoId = vinculo.id;
      }

      await api.createComanda({
        eventoId: activeEvento.id,
        tipoAtendimento: data.tipoAtendimento,
        vinculoPulseiraEventoId: vinculoId,
        mesaId: data.mesaId,
        garcomResponsavelId: data.garcomResponsavelId,
      });

      addToast('success', 'Check-in concluído! Comanda aberta com sucesso.');
      await refreshComandas(activeEvento.id);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao realizar check-in.');
      throw err;
    }
  };

  const handleQuickCreateCliente = async (nome: string, celular: string): Promise<Cliente> => {
    if (!currentEstabelecimento) throw new Error('Estabelecimento não selecionado');
    const created = await api.createCliente({
      estabelecimentoId: currentEstabelecimento.id,
      nome,
      celular,
    });
    setClientes((prev) => [created, ...prev]);
    return created;
  };

  // Lançamento Rápido no Balcão com roteamento automático KDS
  const handleSubmitLancamentoRapido = async (data: {
    comandaId: string;
    origem: 'operador_balcao' | 'garcom' | 'autoatendimento';
    criadoPor?: string;
    itens: Array<{ itemCardapioId: string; quantidade: number }>;
  }) => {
    try {
      const res = await api.lancamentoRapido(data);
      addToast(
        'success',
        `Pedido expedido! ${res.itens.length} item(ns) roteados automaticamente aos KDS.`
      );
      if (activeEvento) {
        await refreshComandas(activeEvento.id);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao lançar pedido no KDS.');
      throw err;
    }
  };

  // Detalhes da Comanda
  const handleViewComandaDetails = async (cmd: ComandaSummary) => {
    try {
      const fullCmd = await api.getComandaById(cmd.id);
      setSelectedComandaForDetails(fullCmd || cmd);
      setIsComandaDetailsOpen(true);
    } catch (e) {
      setSelectedComandaForDetails(cmd);
      setIsComandaDetailsOpen(true);
    }
  };

  // Atualizar status do item no KDS
  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    try {
      await api.updatePedidoItemStatus(itemId, status);
      addToast('success', `Status do item atualizado para "${status}".`);
      if (selectedComandaForDetails) {
        const fullCmd = await api.getComandaById(selectedComandaForDetails.id);
        setSelectedComandaForDetails(fullCmd);
      }
      if (activeEvento) {
        await refreshComandas(activeEvento.id);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar status do item no KDS.');
      throw err;
    }
  };

  // Alternar comanda (aberta / fechada)
  const handleToggleComandaStatus = async (comandaId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'aberta' ? 'fechada' : 'aberta';
    try {
      await api.updateComandaStatus(comandaId, newStatus);
      addToast('success', `Comanda marcada como "${newStatus}".`);
      if (selectedComandaForDetails) {
        const fullCmd = await api.getComandaById(comandaId);
        setSelectedComandaForDetails(fullCmd);
      }
      if (activeEvento) {
        await refreshComandas(activeEvento.id);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao alterar status da comanda.');
      throw err;
    }
  };

  // ==========================================
  // CRUD Handlers for Entities
  // ==========================================

  // 1. Estabelecimento
  const handleCreateEstabelecimento = async (data: {
    nome: string;
    tipo: string;
    config: Record<string, any>;
  }) => {
    try {
      const created = await api.createEstabelecimento(data);
      addToast('success', `Estabelecimento "${created.nome}" cadastrado com sucesso.`);
      await loadData(created.id, false);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao criar estabelecimento.');
      throw err;
    }
  };

  const handleUpdateEstabelecimento = async (
    id: string,
    data: { nome?: string; tipo?: string; config?: Record<string, any> }
  ) => {
    try {
      const updated = await api.updateEstabelecimento(id, data);
      addToast('success', `Estabelecimento "${updated.nome}" atualizado.`);
      await loadData(id, true);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar estabelecimento.');
      throw err;
    }
  };

  const handleDeleteEstabelecimento = async (id: string) => {
    try {
      await api.deleteEstabelecimento(id);
      addToast('success', 'Estabelecimento excluído com sucesso.');
      await loadData(undefined, true);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao excluir estabelecimento.');
      throw err;
    }
  };

  // 2. Pontos de Preparo
  const handleCreatePonto = async (data: { estabelecimentoId: string; nome: string }) => {
    try {
      const created = await api.createPontoDePreparo(data);
      addToast('success', `Ponto de preparo "${created.nome}" cadastrado com tela KDS.`);
      setPontos((prev) => [...prev, created]);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao criar ponto de preparo.');
      throw err;
    }
  };

  const handleUpdatePonto = async (id: string, data: { nome: string }) => {
    try {
      const updated = await api.updatePontoDePreparo(id, data);
      addToast('success', `Ponto "${updated.nome}" atualizado.`);
      setPontos((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar ponto de preparo.');
      throw err;
    }
  };

  const handleDeletePonto = async (id: string) => {
    try {
      await api.deletePontoDePreparo(id);
      addToast('success', 'Ponto de preparo excluído com sucesso.');
      setPontos((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao excluir ponto de preparo.');
      throw err;
    }
  };

  // 3. Usuários
  const handleCreateUsuario = async (data: {
    estabelecimentoId: string;
    nome: string;
    papel: PapelUsuario;
    celular?: string;
    email?: string;
    senha?: string;
    senhaHash?: string;
  }) => {
    try {
      const created = await api.createUsuario(data);
      addToast('success', `Usuário "${created.nome}" cadastrado como ${created.papel}.`);
      setUsuarios((prev) => [...prev, created]);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao cadastrar usuário.');
      throw err;
    }
  };

  const handleUpdateUsuario = async (
    id: string,
    data: {
      nome?: string;
      papel?: PapelUsuario;
      celular?: string;
      email?: string;
      senha?: string;
      senhaHash?: string;
    }
  ) => {
    try {
      const updated = await api.updateUsuario(id, data);
      addToast('success', `Usuário "${updated.nome}" atualizado.`);
      setUsuarios((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar usuário.');
      throw err;
    }
  };

  const handleDeleteUsuario = async (id: string) => {
    try {
      await api.deleteUsuario(id);
      addToast('success', 'Usuário excluído com sucesso.');
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao excluir usuário.');
      throw err;
    }
  };

  // 4. Mesas
  const handleCreateMesa = async (data: {
    estabelecimentoId: string;
    identificador: string;
    status: string;
  }) => {
    try {
      const created = await api.createMesa(data);
      addToast('success', `Mesa "${created.identificador}" cadastrada.`);
      setMesas((prev) => [...prev, created]);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao cadastrar mesa.');
      throw err;
    }
  };

  const handleUpdateMesa = async (
    id: string,
    data: { identificador?: string; status?: string }
  ) => {
    try {
      const updated = await api.updateMesa(id, data);
      addToast('success', `Mesa "${updated.identificador}" atualizada.`);
      setMesas((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar mesa.');
      throw err;
    }
  };

  const handleRegenerarQrMesa = async (id: string) => {
    try {
      const updated = await api.regenerarQrMesa(id);
      addToast('success', `Novo QR Code gerado para "${updated.identificador}".`);
      setMesas((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao regenerar QR code da mesa.');
      throw err;
    }
  };

  const handleDeleteMesa = async (id: string) => {
    try {
      await api.deleteMesa(id);
      addToast('success', 'Mesa excluída com sucesso.');
      setMesas((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao excluir mesa.');
      throw err;
    }
  };

  // 5. Pulseiras
  const handleCreatePulseira = async (data: {
    estabelecimentoId: string;
    codigoQr: string;
  }) => {
    try {
      const created = await api.createPulseira(data);
      addToast('success', `Pulseira "${created.codigoQr}" cadastrada.`);
      setPulseiras((prev) => [...prev, created]);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao cadastrar pulseira.');
      throw err;
    }
  };

  const handleUpdatePulseira = async (id: string, data: { codigoQr: string }) => {
    try {
      const updated = await api.updatePulseira(id, data);
      addToast('success', `Pulseira "${updated.codigoQr}" atualizada.`);
      setPulseiras((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar pulseira.');
      throw err;
    }
  };

  const handleDeletePulseira = async (id: string) => {
    try {
      await api.deletePulseira(id);
      addToast('success', 'Pulseira excluída com sucesso.');
      setPulseiras((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao excluir pulseira.');
      throw err;
    }
  };

  // 6. Clientes
  const handleSearchClientes = async (search: string) => {
    if (!currentEstabelecimento) return;
    try {
      const res = await api.getClientes(currentEstabelecimento.id, search);
      setClientes(res);
    } catch (err: any) {
      console.error('Error searching clientes:', err);
    }
  };

  const handleCreateCliente = async (data: {
    estabelecimentoId: string;
    nome: string;
    celular: string;
    email?: string;
  }) => {
    try {
      const created = await api.createCliente(data);
      addToast('success', `Cliente "${created.nome}" cadastrado com sucesso.`);
      setClientes((prev) => [created, ...prev]);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao cadastrar cliente.');
      throw err;
    }
  };

  const handleUpdateCliente = async (
    id: string,
    data: { nome?: string; celular?: string; email?: string }
  ) => {
    try {
      const updated = await api.updateCliente(id, data);
      addToast('success', `Cliente "${updated.nome}" atualizado.`);
      setClientes((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar cliente.');
      throw err;
    }
  };

  const handleDeleteCliente = async (id: string) => {
    try {
      await api.deleteCliente(id);
      addToast('success', 'Cliente excluído com sucesso.');
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao excluir cliente.');
      throw err;
    }
  };

  // 7. Cardápio
  const handleCreateItemCardapio = async (data: {
    estabelecimentoId: string;
    pontoDePreparoId: string;
    nome: string;
    preco: number;
  }) => {
    try {
      const created = await api.createItemCardapio(data);
      addToast('success', `Item "${created.nome}" adicionado ao cardápio.`);
      const reloaded = await api.getItensCardapio(data.estabelecimentoId);
      setItensCardapio(reloaded);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao cadastrar item de cardápio.');
      throw err;
    }
  };

  const handleUpdateItemCardapio = async (
    id: string,
    data: { pontoDePreparoId?: string; nome?: string; preco?: number }
  ) => {
    try {
      const updated = await api.updateItemCardapio(id, data);
      addToast('success', `Item "${updated.nome}" atualizado.`);
      if (currentEstabelecimento) {
        const reloaded = await api.getItensCardapio(currentEstabelecimento.id);
        setItensCardapio(reloaded);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar item de cardápio.');
      throw err;
    }
  };

  const handleDeleteItemCardapio = async (id: string) => {
    try {
      await api.deleteItemCardapio(id);
      addToast('success', 'Item excluído do cardápio.');
      setItensCardapio((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao excluir item de cardápio.');
      throw err;
    }
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 text-[#64748B]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-[0.875rem] font-medium">Verificando autenticação...</p>
      </div>
    );
  }

  // 1. Surface: App do Garçom (Mobile) - DESIGN-garcom.md
  if (appMode === 'garcom_mobile') {
    return (
      <GarcomMobileAppView
        currentEstabelecimento={currentEstabelecimento || estabelecimentos[0] || null}
        activeEvento={activeEvento}
        currentUser={currentUser}
        mesas={mesas}
        onBackToAdmin={() => setAppMode('gerente')}
      />
    );
  }

  // 2. Surface: Cliente na Mesa (Autoatendimento via QR) - Distinct Visual Identity
  if (appMode === 'cliente_mesa') {
    return (
      <ClienteAutoatendimentoView
        currentEstabelecimentoId={currentEstabelecimento?.id || estabelecimentos[0]?.id || ''}
        activeEvento={activeEvento}
        mesas={mesas}
        onBackToAdmin={() => setAppMode('gerente')}
      />
    );
  }

  // 2. Surface: Painel de Status (KDS) para Telas Físicas de Copa & Cozinha - Distinct Visual Identity
  if (appMode === 'kds_fisico') {
    return (
      <PainelKdsFisicoView
        pontos={pontos}
        activeEvento={activeEvento}
        onAdvanceStatus={handleUpdateItemStatus}
        onBackToAdmin={() => setAppMode('gerente')}
      />
    );
  }

  // Not logged in: Show Login Screen (with links to Client and KDS surfaces) or Public Manual
  if (!currentUser) {
    if (isPublicManualOpen) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[8px] bg-[#0D9488] text-white flex items-center justify-center font-bold text-sm">
                  SB
                </div>
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  SAASBAR · Central de Ajuda & Manual Operacional
                </span>
              </div>
              <button
                onClick={() => setIsPublicManualOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-[6px] transition-colors cursor-pointer"
              >
                Voltar ao Login
              </button>
            </div>
            <ManualAjudaView
              currentUser={null}
              onNavigateTab={(tab) => {
                setIsPublicManualOpen(false);
                setCurrentTab(tab);
              }}
              onOpenClienteMesa={() => {
                setIsPublicManualOpen(false);
                setAppMode('cliente_mesa');
              }}
              onOpenKdsFisico={() => {
                setIsPublicManualOpen(false);
                setAppMode('kds_fisico');
              }}
              onOpenGarcomMobile={() => {
                setIsPublicManualOpen(false);
                setAppMode('garcom_mobile');
              }}
              onOpenLancamentoRapido={() => setIsPublicManualOpen(false)}
              onOpenCheckIn={() => setIsPublicManualOpen(false)}
            />
          </div>
        </div>
      );
    }

    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onOpenClienteMesa={() => setAppMode('cliente_mesa')}
          onOpenKdsFisico={() => setAppMode('kds_fisico')}
          onOpenGarcomMobile={() => setAppMode('garcom_mobile')}
          onOpenManualAjuda={() => setIsPublicManualOpen(true)}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  const counts = {
    pontos: pontos.length,
    usuarios: usuarios.length,
    mesas: mesas.length,
    pulseiras: pulseiras.length,
    clientes: clientes.length,
    itens: itensCardapio.length,
    eventos: eventos.length,
    comandasAbertas: comandas.filter((c) => c.status === 'aberta').length,
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] overflow-hidden antialiased font-['Inter',sans-serif]">
      {/* 1. Main Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        counts={counts}
        onOpenClienteMesa={() => setAppMode('cliente_mesa')}
        onOpenKdsFisico={() => setAppMode('kds_fisico')}
        onOpenGarcomMobile={() => setAppMode('garcom_mobile')}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with User Info and Logout */}
        <Header
          estabelecimentos={estabelecimentos}
          currentEstabelecimento={currentEstabelecimento}
          onSelectEstabelecimento={handleSelectEstabelecimento}
          onRefresh={() => loadData(currentEstabelecimento?.id, false)}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenClienteMesa={() => setAppMode('cliente_mesa')}
          onOpenKdsFisico={() => setAppMode('kds_fisico')}
          onOpenGarcomMobile={() => setAppMode('garcom_mobile')}
          onOpenManualAjuda={() => setCurrentTab('manual_ajuda')}
        />

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Role Access Banner if not Gerente */}
          {currentUser.papel !== 'gerente' && (
            <div className="mb-6 p-4 rounded-[10px] bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <strong>Acesso com papel: {currentUser.papel}</strong>.
                {currentUser.papel === 'operador_balcao' && (
                  <span> Perfil de Operador de Balcão habilitado para o drawer de Lançamento Rápido.</span>
                )}
                {currentUser.papel === 'garcom' && (
                  <span> Perfil de Garçom habilitado para atendimento e conferência de entregas.</span>
                )}
              </div>
              <Badge variant="warning">
                {currentUser.papel === 'operador_balcao' ? 'Balcão' : 'Garçom'}
              </Badge>
            </div>
          )}

          {isLoading ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-[#64748B]">
              <RefreshCw className="w-8 h-8 animate-spin text-[#0D9488]" />
              <p className="text-[0.875rem] font-medium">Carregando dados operacionais do PostgreSQL...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-[10px] p-6 max-w-xl mx-auto my-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-[#DC2626] shrink-0" />
                <div>
                  <h3 className="text-[1rem] font-bold text-[#DC2626]">
                    Falha na comunicação com o banco de dados
                  </h3>
                  <p className="text-[0.875rem] text-red-800 mt-1">{error}</p>
                  <button
                    onClick={() => loadData(currentEstabelecimento?.id, false)}
                    className="mt-4 px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold rounded-[6px] transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* OPERATIONAL VIEWS */}
              {currentTab === 'monitor_comandas' && (
                <MonitorComandasView
                  comandas={comandas}
                  activeEvento={activeEvento}
                  eventos={eventos}
                  currentUser={currentUser}
                  onSelectEvento={handleSelectActiveEvento}
                  onOpenLancamentoRapido={(comandaId) => {
                    setPreselectedComandaForLancamento(comandaId || null);
                    setIsLancamentoOpen(true);
                  }}
                  onOpenCheckIn={() => setIsCheckInOpen(true)}
                  onViewComandaDetails={handleViewComandaDetails}
                  onOpenFechamento={(comandaId) => {
                    setPreselectedComandaForFechamento(comandaId);
                    setCurrentTab('fechamento_rateio');
                  }}
                />
              )}

              {currentTab === 'eventos' && (
                <EventosView
                  eventos={eventos}
                  activeEvento={activeEvento}
                  currentEstabelecimento={currentEstabelecimento}
                  onSelectActiveEvento={handleSelectActiveEvento}
                  onCreateEvento={handleCreateEvento}
                  onCloseEvento={handleCloseEvento}
                />
              )}

              {currentTab === 'kds_status' && (
                <KdsStatusView
                  pontos={pontos}
                  activeEvento={activeEvento}
                  onAdvanceStatus={handleUpdateItemStatus}
                  onOpenFullscreenKds={() => setAppMode('kds_fisico')}
                />
              )}

              {currentTab === 'fechamento_rateio' && (
                <FechamentoRateioView
                  comandas={comandas}
                  activeEvento={activeEvento}
                  currentEstabelecimento={currentEstabelecimento}
                  usuarios={usuarios}
                  onComandaClosed={() => {
                    refreshComandas();
                    addToast('success', 'Comanda fechada com sucesso! Caixa e rateios atualizados.');
                  }}
                  preselectedComandaId={preselectedComandaForFechamento}
                />
              )}

              {currentTab === 'rebalanceamento_equipe' && (
                <RebalanceamentoEquipeView
                  currentEstabelecimento={currentEstabelecimento}
                  activeEvento={activeEvento}
                  usuarios={usuarios}
                  mesas={mesas}
                />
              )}

              {currentTab === 'relatorios_fidelidade' && (
                <RelatoriosFidelidadeView
                  currentEstabelecimento={currentEstabelecimento}
                  activeEvento={activeEvento}
                  comandas={comandas}
                  onOpenCheckout={(cmdId) => {
                    setPreselectedComandaForFechamento(cmdId);
                    setCurrentTab('fechamento_rateio');
                  }}
                />
              )}

              {/* REGISTRATION VIEWS */}
              {currentTab === 'estabelecimento' && (
                <EstabelecimentoView
                  estabelecimentos={estabelecimentos}
                  currentEstabelecimento={currentEstabelecimento}
                  onSelectEstabelecimento={handleSelectEstabelecimento}
                  onCreate={handleCreateEstabelecimento}
                  onUpdate={handleUpdateEstabelecimento}
                  onDelete={handleDeleteEstabelecimento}
                />
              )}

              {currentTab === 'pontos_preparo' && (
                <PontosPreparoView
                  pontos={pontos}
                  currentEstabelecimento={currentEstabelecimento}
                  onCreate={handleCreatePonto}
                  onUpdate={handleUpdatePonto}
                  onDelete={handleDeletePonto}
                />
              )}

              {currentTab === 'cardapio' && (
                <CardapioView
                  itens={itensCardapio}
                  pontos={pontos}
                  currentEstabelecimento={currentEstabelecimento}
                  onCreate={handleCreateItemCardapio}
                  onUpdate={handleUpdateItemCardapio}
                  onDelete={handleDeleteItemCardapio}
                />
              )}

              {currentTab === 'mesas' && (
                <MesasView
                  mesas={mesas}
                  currentEstabelecimento={currentEstabelecimento}
                  onCreate={handleCreateMesa}
                  onUpdate={handleUpdateMesa}
                  onRegenerarQr={handleRegenerarQrMesa}
                  onDelete={handleDeleteMesa}
                />
              )}

              {currentTab === 'pulseiras' && (
                <PulseirasView
                  pulseiras={pulseiras}
                  currentEstabelecimento={currentEstabelecimento}
                  onCreate={handleCreatePulseira}
                  onUpdate={handleUpdatePulseira}
                  onDelete={handleDeletePulseira}
                />
              )}

              {currentTab === 'usuarios' && (
                <UsuariosView
                  usuarios={usuarios}
                  currentEstabelecimento={currentEstabelecimento}
                  onCreate={handleCreateUsuario}
                  onUpdate={handleUpdateUsuario}
                  onDelete={handleDeleteUsuario}
                />
              )}

              {currentTab === 'clientes' && (
                <ClientesView
                  clientes={clientes}
                  currentEstabelecimento={currentEstabelecimento}
                  onSearch={handleSearchClientes}
                  onCreate={handleCreateCliente}
                  onUpdate={handleUpdateCliente}
                  onDelete={handleDeleteCliente}
                />
              )}

              {currentTab === 'manual_ajuda' && (
                <ManualAjudaView
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  onOpenClienteMesa={() => setAppMode('cliente_mesa')}
                  onOpenKdsFisico={() => setAppMode('kds_fisico')}
                  onOpenGarcomMobile={() => setAppMode('garcom_mobile')}
                  onOpenLancamentoRapido={() => setIsLancamentoOpen(true)}
                  onOpenCheckIn={() => setIsCheckInOpen(true)}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Drawer: Lançamento Rápido (Operador de Balcão) */}
      <LancamentoRapidoDrawer
        isOpen={isLancamentoOpen}
        onClose={() => {
          setIsLancamentoOpen(false);
          setPreselectedComandaForLancamento(null);
        }}
        activeEvento={activeEvento}
        comandasAbertas={comandas.filter((c) => c.status === 'aberta')}
        itensCardapio={itensCardapio}
        pontosDePreparo={pontos}
        currentUser={currentUser}
        preselectedComandaId={preselectedComandaForLancamento}
        onSubmitPedido={handleSubmitLancamentoRapido}
      />

      {/* Modal: Check-In & Abertura de Comanda */}
      <CheckInComandaModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        activeEvento={activeEvento}
        clientes={clientes}
        pulseiras={pulseiras}
        mesas={mesas}
        garcons={usuarios.filter((u) => u.papel === 'garcom')}
        onCheckIn={handleCheckIn}
        onQuickCreateCliente={handleQuickCreateCliente}
      />

      {/* Modal: Detalhes da Comanda */}
      <ComandaDetailsModal
        isOpen={isComandaDetailsOpen}
        onClose={() => {
          setIsComandaDetailsOpen(false);
          setSelectedComandaForDetails(null);
        }}
        comanda={selectedComandaForDetails}
        onOpenLancamento={(cmdId) => {
          setIsComandaDetailsOpen(false);
          setPreselectedComandaForLancamento(cmdId);
          setIsLancamentoOpen(true);
        }}
        onOpenFechamento={(cmdId) => {
          setIsComandaDetailsOpen(false);
          setSelectedComandaForDetails(null);
          setPreselectedComandaForFechamento(cmdId);
          setCurrentTab('fechamento_rateio');
        }}
        onUpdateItemStatus={handleUpdateItemStatus}
        onToggleComandaStatus={handleToggleComandaStatus}
        onPedidoValidated={() => {
          if (activeEvento) refreshComandas(activeEvento.id);
          addToast('success', 'Pedido validado com sucesso pelo gerente! Itens roteados ao KDS.');
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
