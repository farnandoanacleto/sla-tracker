import React, { useEffect, useState } from 'react';
import { IVaga, TNivelVaga, TTipoVaga } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';

type TVagaFormData = Omit<IVaga, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

interface VagaFormProps {
  /** Se informado, o formulário entra no modo de edição */
  initialData?: Partial<TVagaFormData>;
  areas: { id: string; nome: string }[];
  consultorias: { id: string; nome: string }[];
  onSubmit: (data: TVagaFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

const tipoOptions: SelectOption[] = [
  { value: 'interna', label: 'Interna' },
  { value: 'externa', label: 'Externa' },
];

const nivelOptions: SelectOption[] = [
  { value: 'auxiliar', label: 'Auxiliar' },
  { value: 'assistente', label: 'Assistente' },
  { value: 'analista', label: 'Analista' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'gestao', label: 'Gestão' },
  { value: 'medico', label: 'Médico' },
];

const EMPTY_FORM: TVagaFormData = {
  codigo_vaga: '',
  nome_vaga: '',
  tipo_vaga: 'interna',
  nivel_vaga: 'analista',
  area_id: '',
  gestor_solicitante: '',
  consultoria_id: null,
  custo_processo: 0,
  data_solicitacao: '',
  data_aprovacao: null,
  data_abertura_consultoria: null,
  data_envio_candidatos: null,
  data_entrevista: null,
  data_fechamento: null,
  data_inicio_colaborador: null,
};

/**
 * Formulário completo para criação e edição de Vagas.
 * Inclui validação cronológica: cada data deve ser >= à data anterior.
 */
const VagaForm: React.FC<VagaFormProps> = ({
  initialData,
  areas,
  consultorias,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form, setForm] = useState<TVagaFormData>({
    ...EMPTY_FORM,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincronizar com initialData quando editar
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const set = <K extends keyof TVagaFormData>(key: K, value: TVagaFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const areaOptions: SelectOption[] = areas.map((a) => ({
    value: a.id,
    label: a.nome,
  }));

  const consultoriaOptions: SelectOption[] = consultorias.map((c) => ({
    value: c.id,
    label: c.nome,
  }));

  /**
   * Validação cronológica: cada data deve ser >= à anterior.
   */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.codigo_vaga.trim()) errs.codigo_vaga = 'Código da vaga é obrigatório';
    if (!form.nome_vaga.trim()) errs.nome_vaga = 'Nome da vaga é obrigatório';
    if (!form.area_id) errs.area_id = 'Área é obrigatória';
    if (!form.gestor_solicitante.trim()) errs.gestor_solicitante = 'Gestor solicitante é obrigatório';
    if (!form.data_solicitacao) errs.data_solicitacao = 'Data de solicitação é obrigatória';
    if (form.tipo_vaga === 'externa' && !form.consultoria_id) {
      errs.consultoria_id = 'Consultoria é obrigatória para vagas externas';
    }

    // Validação cronológica: cada data deve ser >= à data anterior informada
    const datas: { campo: keyof TVagaFormData; label: string; anterior?: keyof TVagaFormData }[] = [
      { campo: 'data_aprovacao', label: 'Data de aprovação', anterior: 'data_solicitacao' },
      { campo: 'data_abertura_consultoria', label: 'Data abertura consultoria', anterior: 'data_aprovacao' },
      { campo: 'data_envio_candidatos', label: 'Data envio candidatos', anterior: form.tipo_vaga === 'interna' ? 'data_aprovacao' : 'data_abertura_consultoria' },
      { campo: 'data_entrevista', label: 'Data entrevista', anterior: 'data_envio_candidatos' },
      { campo: 'data_fechamento', label: 'Data fechamento', anterior: 'data_entrevista' },
      { campo: 'data_inicio_colaborador', label: 'Data início colaborador', anterior: 'data_fechamento' },
    ];

    datas.forEach(({ campo, label, anterior }) => {
      const valor = form[campo] as string | null;
      if (valor && anterior) {
        const valorAnterior = form[anterior] as string | null;
        if (valorAnterior && valor < valorAnterior) {
          errs[campo] = `${label} deve ser posterior à etapa anterior`;
        }
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Limpar consultoria_id para vagas internas
    const dataToSend: TVagaFormData = {
      ...form,
      consultoria_id: form.tipo_vaga === 'interna' ? null : form.consultoria_id,
      data_abertura_consultoria: form.tipo_vaga === 'interna' ? null : form.data_abertura_consultoria,
    };

    await onSubmit(dataToSend);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Seção 1: Dados básicos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Dados da Vaga
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código da Vaga"
            id="vaga-codigo"
            value={form.codigo_vaga}
            onChange={(e) => set('codigo_vaga', e.target.value)}
            error={errors.codigo_vaga}
            placeholder="Ex: RH-2024-001"
            required
          />
          <Input
            label="Nome da Vaga"
            id="vaga-nome"
            value={form.nome_vaga}
            onChange={(e) => set('nome_vaga', e.target.value)}
            error={errors.nome_vaga}
            placeholder="Ex: Analista de TI"
            required
          />
          <Select
            label="Tipo"
            id="vaga-tipo"
            value={form.tipo_vaga}
            onChange={(e) => set('tipo_vaga', e.target.value as TTipoVaga)}
            options={tipoOptions}
            required
          />
          <Select
            label="Nível"
            id="vaga-nivel"
            value={form.nivel_vaga}
            onChange={(e) => set('nivel_vaga', e.target.value as TNivelVaga)}
            options={nivelOptions}
            required
          />
          <Select
            label="Área Solicitante"
            id="vaga-area"
            value={form.area_id}
            onChange={(e) => set('area_id', e.target.value)}
            options={areaOptions}
            placeholder="Selecione a área..."
            error={errors.area_id}
            required
          />
          <Input
            label="Gestor Solicitante"
            id="vaga-gestor"
            value={form.gestor_solicitante}
            onChange={(e) => set('gestor_solicitante', e.target.value)}
            error={errors.gestor_solicitante}
            placeholder="Nome do gestor"
            required
          />
          {form.tipo_vaga === 'externa' && (
            <Select
              label="Consultoria"
              id="vaga-consultoria"
              value={form.consultoria_id ?? ''}
              onChange={(e) => set('consultoria_id', e.target.value || null)}
              options={consultoriaOptions}
              placeholder="Selecione a consultoria..."
              error={errors.consultoria_id}
              required
            />
          )}
          <Input
            label="Custo do Processo (R$)"
            id="vaga-custo"
            type="number"
            min="0"
            step="0.01"
            value={form.custo_processo}
            onChange={(e) => set('custo_processo', parseFloat(e.target.value) || 0)}
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Seção 2: Datas do fluxo */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Datas do Processo
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Preencha as datas conforme o andamento do processo. Cada data deve ser posterior à etapa anterior.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Solicitação"
            id="vaga-data-solicitacao"
            value={form.data_solicitacao}
            onChange={(e) => set('data_solicitacao', e.target.value)}
            error={errors.data_solicitacao}
            required
          />
          <DatePicker
            label="Aprovação"
            id="vaga-data-aprovacao"
            value={form.data_aprovacao ?? ''}
            onChange={(e) => set('data_aprovacao', e.target.value || null)}
            error={errors.data_aprovacao}
            min={form.data_solicitacao || undefined}
          />
          {form.tipo_vaga === 'externa' && (
            <DatePicker
              label="Abertura de Consultoria"
              id="vaga-data-abertura"
              value={form.data_abertura_consultoria ?? ''}
              onChange={(e) => set('data_abertura_consultoria', e.target.value || null)}
              error={errors.data_abertura_consultoria}
              min={form.data_aprovacao || form.data_solicitacao || undefined}
            />
          )}
          <DatePicker
            label="Envio de Candidatos"
            id="vaga-data-envio"
            value={form.data_envio_candidatos ?? ''}
            onChange={(e) => set('data_envio_candidatos', e.target.value || null)}
            error={errors.data_envio_candidatos}
            min={form.data_abertura_consultoria ?? form.data_aprovacao ?? undefined}
          />
          <DatePicker
            label="Entrevista"
            id="vaga-data-entrevista"
            value={form.data_entrevista ?? ''}
            onChange={(e) => set('data_entrevista', e.target.value || null)}
            error={errors.data_entrevista}
            min={form.data_envio_candidatos ?? undefined}
          />
          <DatePicker
            label="Fechamento"
            id="vaga-data-fechamento"
            value={form.data_fechamento ?? ''}
            onChange={(e) => set('data_fechamento', e.target.value || null)}
            error={errors.data_fechamento}
            min={form.data_entrevista ?? undefined}
          />
          <DatePicker
            label="Início do Colaborador"
            id="vaga-data-inicio"
            value={form.data_inicio_colaborador ?? ''}
            onChange={(e) => set('data_inicio_colaborador', e.target.value || null)}
            error={errors.data_inicio_colaborador}
            min={form.data_fechamento ?? undefined}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Salvando...' : initialData ? 'Salvar alterações' : 'Criar vaga'}
        </Button>
      </div>
    </form>
  );
};

export default VagaForm;
