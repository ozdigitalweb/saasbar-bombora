import React, { useState } from 'react';
import { QrCode, User, LayoutGrid, UserCheck, Plus } from 'lucide-react';
import {
  Cliente,
  Pulseira,
  Mesa,
  Usuario,
  Evento,
} from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';

interface CheckInComandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvento: Evento | null;
  clientes: Cliente[];
  pulseiras: Pulseira[];
  mesas: Mesa[];
  garcons: Usuario[];
  onCheckIn: (data: {
    tipoAtendimento: 'pulseira' | 'mesa';
    clienteId: string;
    pulseiraId?: string;
    mesaId?: string;
    garcomResponsavelId?: string;
  }) => Promise<void>;
  onQuickCreateCliente: (nome: string, celular: string) => Promise<Cliente>;
}

export const CheckInComandaModal: React.FC<CheckInComandaModalProps> = ({
  isOpen,
  onClose,
  activeEvento,
  clientes,
  pulseiras,
  mesas,
  garcons,
  onCheckIn,
  onQuickCreateCliente,
}) => {
  const [tipoAtendimento, setTipoAtendimento] = useState<'pulseira' | 'mesa'>('pulseira');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedPulseiraId, setSelectedPulseiraId] = useState<string>('');
  const [selectedMesaId, setSelectedMesaId] = useState<string>('');
  const [selectedGarcomId, setSelectedGarcomId] = useState<string>('');

  // Quick Customer Creation
  const [isCreatingCliente, setIsCreatingCliente] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCelular, setNovoCelular] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let clienteId = selectedClienteId;

    setIsSubmitting(true);
    try {
      if (isCreatingCliente) {
        if (!novoNome.trim() || !novoCelular.trim()) {
          setError('Nome e celular do cliente são obrigatórios.');
          setIsSubmitting(false);
          return;
        }
        const created = await onQuickCreateCliente(novoNome.trim(), novoCelular.trim());
        clienteId = created.id;
      }

      if (!clienteId) {
        setError('Selecione ou cadastre o cliente para o check-in.');
        setIsSubmitting(false);
        return;
      }

      if (tipoAtendimento === 'pulseira' && !selectedPulseiraId) {
        setError('Selecione a pulseira QR para vincular à comanda.');
        setIsSubmitting(false);
        return;
      }

      if (tipoAtendimento === 'mesa' && !selectedMesaId) {
        setError('Selecione a mesa para abrir a comanda.');
        setIsSubmitting(false);
        return;
      }

      await onCheckIn({
        tipoAtendimento,
        clienteId,
        pulseiraId: tipoAtendimento === 'pulseira' ? selectedPulseiraId : undefined,
        mesaId: selectedMesaId || undefined,
        garcomResponsavelId: selectedGarcomId || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar check-in da comanda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Check-in & Abertura de Comanda"
      subtitle={`Evento: ${activeEvento?.nome || 'Evento Atual'} • Vinculação e autorização`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-xs text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Attendance Type Selector */}
        <div>
          <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1.5">
            Tipo de Atendimento
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoAtendimento('pulseira')}
              className={`p-3 rounded-[8px] border text-left flex items-start gap-2.5 transition-colors ${
                tipoAtendimento === 'pulseira'
                  ? 'border-[#0D9488] bg-teal-50/40 text-[#0F172A]'
                  : 'border-[#E2E8F0] hover:bg-slate-50 text-[#334155]'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#0D9488] mt-0.5" />
              <div>
                <span className="font-semibold text-xs block">Pulseira QR Code</span>
                <span className="text-[11px] text-[#64748B]">
                  Circulação livre com pulseira individual
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTipoAtendimento('mesa')}
              className={`p-3 rounded-[8px] border text-left flex items-start gap-2.5 transition-colors ${
                tipoAtendimento === 'mesa'
                  ? 'border-[#0D9488] bg-teal-50/40 text-[#0F172A]'
                  : 'border-[#E2E8F0] hover:bg-slate-50 text-[#334155]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-[#0D9488] mt-0.5" />
              <div>
                <span className="font-semibold text-xs block">Comanda por Mesa</span>
                <span className="text-[11px] text-[#64748B]">
                  Autoatendimento fixo por mesa
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Customer Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
              Cliente
            </span>
            <button
              type="button"
              onClick={() => setIsCreatingCliente(!isCreatingCliente)}
              className="text-xs text-[#0D9488] hover:underline font-medium"
            >
              {isCreatingCliente ? 'Selecionar Existente' : '+ Cadastrar Novo Cliente'}
            </button>
          </div>

          {!isCreatingCliente ? (
            <div>
              <select
                value={selectedClienteId}
                onChange={(e) => setSelectedClienteId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                <option value="">Selecione o cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} • {c.celular}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[6px] text-xs focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Celular (11) 99999-9999"
                  value={novoCelular}
                  onChange={(e) => setNovoCelular(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[6px] text-xs focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Wristband or Table Selection */}
        {tipoAtendimento === 'pulseira' && (
          <div>
            <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
              Pulseira Física QR Code *
            </label>
            <select
              required
              value={selectedPulseiraId}
              onChange={(e) => setSelectedPulseiraId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] text-[0.875rem] font-mono focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="">Selecione a pulseira gravada...</option>
              {pulseiras.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigoQr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mesa (Optional if pulseira, required if mesa) */}
        <div>
          <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
            {tipoAtendimento === 'pulseira' ? 'Mesa / Lounge Inicial (Opcional)' : 'Mesa *'}
          </label>
          <select
            value={selectedMesaId}
            onChange={(e) => setSelectedMesaId(e.target.value)}
            required={tipoAtendimento === 'mesa'}
            className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="">Nenhuma mesa associada</option>
            {mesas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.identificador} ({m.qrCode})
              </option>
            ))}
          </select>
        </div>

        {/* Garçom Responsável */}
        <div>
          <label className="block text-[0.875rem] font-medium text-[#0F172A] mb-1">
            Garçom Responsável pelo Atendimento
          </label>
          <select
            value={selectedGarcomId}
            onChange={(e) => setSelectedGarcomId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] text-[0.875rem] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="">Selecione o garçom da área...</option>
            {garcons.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] text-[#334155] rounded-[10px] text-[0.875rem] font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-[10px] text-[0.875rem] font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Abrindo Comanda...' : 'Abrir Comanda'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
