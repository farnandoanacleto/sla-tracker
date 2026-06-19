import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/services/supabase';
import { vagaService } from '@/services/vagaService';
import { IArea, IConsultoria, TNivelVaga, TTipoVaga } from '@/types';

type TStep = 'upload' | 'preview' | 'importando' | 'concluido';

interface IParsedVaga {
  user_id: string;
  codigo_vaga: string;
  nome_vaga: string;
  tipo_vaga: TTipoVaga;
  nivel_vaga: TNivelVaga;
  area_id: string;
  gestor_solicitante: string;
  consultoria_id: string | null;
  custo_processo: number;
  data_solicitacao: string;
  data_aprovacao: string | null;
  data_abertura_consultoria: string | null;
  data_envio_candidatos: string | null;
  data_entrevista: string | null;
  data_fechamento: string | null;
  data_inicio_colaborador: string | null;
}

interface IImportRow {
  rowIndex: number;
  rawData: Record<string, string>;
  parsed: IParsedVaga | null;
  errors: string[];
  isValid: boolean;
}

interface VagaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: IArea[];
  consultorias: IConsultoria[];
  onSuccess: () => void;
}

const TEMPLATE_HEADERS = [
  'codigo_vaga', 'nome_vaga', 'gestor_solicitante', 'area', 'consultoria',
  'tipo_vaga', 'nivel_vaga', 'custo_processo', 'data_solicitacao', 'data_aprovacao',
  'data_abertura_consultoria', 'data_envio_candidatos', 'data_entrevista',
  'data_fechamento', 'data_inicio_colaborador',
];

const TEMPLATE_EXAMPLE = [
  'VAG-001', 'Analista de RH', 'João Silva', 'Recursos Humanos', 'Consultoria ABC',
  'Externa', 'Analista', '5000', '2026-06-01', '2026-06-10',
  '2026-06-12', '2026-06-25', '2026-07-05', '2026-07-12', '2026-08-01',
];

const NIVEL_MAP: Record<string, TNivelVaga> = {
  auxiliar: 'auxiliar',
  assistente: 'assistente',
  analista: 'analista',
  especialista: 'especialista',
  gestao: 'gestao',
  coordenador: 'gestao',
  gerente: 'gestao',
  diretor: 'gestao',
  medico: 'medico',
};

const TIPO_MAP: Record<string, TTipoVaga> = {
  interna: 'interna',
  externa: 'externa',
};

const normalizeStr = (s: string): string =>
  s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');

const isRealDate = (y: number, m: number, d: number): boolean => {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const parseDate = (s: string): string | null => {
  const str = s.trim();
  if (!str) return null;

  // YYYY-MM-DD (ISO)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const y = +isoMatch[1], m = +isoMatch[2], d = +isoMatch[3];
    return isRealDate(y, m, d) ? str : null;
  }

  // DD/MM/YYYY ou MM/DD/YYYY — desambiguação pelo valor > 12
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const a = +slashMatch[1], b = +slashMatch[2], y = +slashMatch[3];
    // a > 12 → deve ser DD/MM/YYYY; b > 12 → deve ser MM/DD/YYYY; senão assume DD/MM/YYYY (BR)
    const [day, month] = a > 12 ? [a, b] : b > 12 ? [b, a] : [a, b];
    if (!isRealDate(y, month, day)) return null;
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Serial number do Excel (número inteiro como string, ex: "46419")
  if (/^\d+$/.test(str)) {
    const serial = +str;
    if (serial > 0) {
      const dt = new Date((serial - 25569) * 86400 * 1000);
      if (!isNaN(dt.getTime())) {
        const y = dt.getUTCFullYear();
        if (y >= 1900 && y <= 2200) {
          const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
          const d = String(dt.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      }
    }
  }

  return null;
};

const VagaImportModal: React.FC<VagaImportModalProps> = ({
  isOpen,
  onClose,
  areas,
  consultorias,
  onSuccess,
}) => {
  const [step, setStep] = useState<TStep>('upload');
  const [rows, setRows] = useState<IImportRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<{ criadas: number; erros: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = useCallback(() => {
    setStep('upload');
    setRows([]);
    setDragOver(false);
    setProcessError(null);
    setIsProcessing(false);
    setResultado(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [onClose, resetModal]);

  const downloadTemplate = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
    ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 26 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vagas');
    XLSX.writeFile(wb, 'template_importacao_vagas.xlsx');
  }, []);

  const processFile = useCallback(
    async (buffer: ArrayBuffer) => {
      setProcessError(null);
      setIsProcessing(true);
      try {
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, {
          raw: true,
          defval: '',
        }) as Record<string, unknown>[];

        if (rawRows.length === 0) {
          setProcessError('A planilha não contém dados.');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProcessError('Usuário não autenticado.');
          return;
        }
        const userId = user.id;

        const codigos = rawRows
          .map((r) => String(r['codigo_vaga'] || '').trim())
          .filter(Boolean);
        const codigosExistentes = await vagaService.verificarCodigosExistentes(codigos, userId);
        const codigosNoBatch = new Set<string>();

        const importRows: IImportRow[] = rawRows.map((row, index) => {
          const rawData: Record<string, string> = {};
          Object.keys(row).forEach((k) => {
            const val = row[k];
            const key = k.toLowerCase().trim().replace(/ /g, '_');
            if (val instanceof Date) {
              const y = val.getUTCFullYear();
              const mo = String(val.getUTCMonth() + 1).padStart(2, '0');
              const dy = String(val.getUTCDate()).padStart(2, '0');
              rawData[key] = `${y}-${mo}-${dy}`;
            } else {
              rawData[key] = val != null ? String(val) : '';
            }
          });

          const errors: string[] = [];

          const codigoVaga = (rawData['codigo_vaga'] || '').trim();
          const nomeVaga = (rawData['nome_vaga'] || '').trim();
          const gestorSolicitante = (rawData['gestor_solicitante'] || '').trim();
          const dataSolicitacao = parseDate((rawData['data_solicitacao'] || '').trim());

          if (!codigoVaga) errors.push('Código da vaga é obrigatório');
          if (!nomeVaga) errors.push('Nome da vaga é obrigatório');
          if (!dataSolicitacao) errors.push('Data de solicitação inválida ou ausente');

          if (codigoVaga) {
            if (codigosExistentes.includes(codigoVaga)) {
              errors.push('Código já existe no banco de dados');
            } else if (codigosNoBatch.has(codigoVaga)) {
              errors.push('Código duplicado na planilha');
            } else {
              codigosNoBatch.add(codigoVaga);
            }
          }

          const areaNome = normalizeStr(rawData['area'] || '');
          const area = areaNome ? areas.find((a) => normalizeStr(a.nome) === areaNome) : undefined;
          if (!areaNome) errors.push('Área é obrigatória');
          else if (!area) errors.push(`Área "${rawData['area']}" não encontrada`);

          const tipoRaw = normalizeStr(rawData['tipo_vaga'] || '');
          const tipoVaga: TTipoVaga | undefined = TIPO_MAP[tipoRaw];
          if (!tipoVaga) errors.push(`Tipo de vaga inválido: "${rawData['tipo_vaga'] || ''}"`);

          const nivelRaw = normalizeStr(rawData['nivel_vaga'] || '');
          const nivelVaga: TNivelVaga | undefined = NIVEL_MAP[nivelRaw];
          if (!nivelVaga) errors.push(`Nível inválido: "${rawData['nivel_vaga'] || ''}"`);

          const consultoriaNome = normalizeStr(rawData['consultoria'] || '');
          let consultoriaId: string | null = null;
          if (consultoriaNome) {
            const consultoria = consultorias.find((c) => normalizeStr(c.nome) === consultoriaNome);
            if (!consultoria) errors.push(`Consultoria "${rawData['consultoria']}" não encontrada`);
            else consultoriaId = consultoria.id;
          }

          const custoStr = (rawData['custo_processo'] || '0')
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^0-9.]/g, '');
          const custoProcesso = parseFloat(custoStr) || 0;

          const isValid = errors.length === 0;

          let parsed: IParsedVaga | null = null;
          if (isValid && area && tipoVaga && nivelVaga && dataSolicitacao) {
            parsed = {
              user_id: userId,
              codigo_vaga: codigoVaga,
              nome_vaga: nomeVaga,
              tipo_vaga: tipoVaga,
              nivel_vaga: nivelVaga,
              area_id: area.id,
              gestor_solicitante: gestorSolicitante,
              consultoria_id: consultoriaId,
              custo_processo: custoProcesso,
              data_solicitacao: dataSolicitacao,
              data_aprovacao: parseDate((rawData['data_aprovacao'] || '').trim()),
              data_abertura_consultoria: parseDate((rawData['data_abertura_consultoria'] || '').trim()),
              data_envio_candidatos: parseDate((rawData['data_envio_candidatos'] || '').trim()),
              data_entrevista: parseDate((rawData['data_entrevista'] || '').trim()),
              data_fechamento: parseDate((rawData['data_fechamento'] || '').trim()),
              data_inicio_colaborador: parseDate((rawData['data_inicio_colaborador'] || '').trim()),
            };
          }

          return { rowIndex: index + 2, rawData, parsed, errors, isValid };
        });

        setRows(importRows);
        setStep('preview');
      } catch (err) {
        console.error('Erro ao processar planilha:', err);
        setProcessError('Erro ao processar o arquivo. Verifique se é um .xlsx válido.');
      } finally {
        setIsProcessing(false);
      }
    },
    [areas, consultorias]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setProcessError('Apenas arquivos .xlsx ou .xls são aceitos.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          void processFile(e.target.result);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = async () => {
    setStep('importando');
    const vagasParaImportar = rows
      .filter((r) => r.isValid)
      .map((r) => r.parsed)
      .filter((p): p is IParsedVaga => p !== null);

    try {
      const res = await vagaService.importarLote(vagasParaImportar);
      setResultado(res);
    } catch (err) {
      console.error('Erro na importação em lote:', err);
      setResultado({ criadas: 0, erros: vagasParaImportar.length });
    } finally {
      setStep('concluido');
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.filter((r) => !r.isValid).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Planilha de Vagas"
      size="xl"
      disableBackdropClose={step === 'importando'}
    >
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-blue-800">Baixe o modelo de importação</p>
              <p className="text-xs text-blue-600 mt-0.5">Preencha o template e faça upload abaixo</p>
            </div>
            <Button variant="secondary" onClick={downloadTemplate}>
              <Download size={15} />
              Baixar template
            </Button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={[
              'flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 transition-colors',
              isProcessing ? 'cursor-wait' : 'cursor-pointer',
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            ].join(' ')}
          >
            {isProcessing ? (
              <>
                <Loader2 size={36} className="text-blue-400 animate-spin" />
                <p className="text-sm text-gray-500">Processando planilha...</p>
              </>
            ) : (
              <>
                <Upload size={36} className={dragOver ? 'text-blue-400' : 'text-gray-300'} />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {dragOver ? 'Solte o arquivo aqui' : 'Arraste o arquivo ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Somente arquivos .xlsx ou .xls</p>
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {processError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{processError}</p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-700 font-medium">
              <CheckCircle size={14} />
              {validCount} válida{validCount !== 1 ? 's' : ''}
            </span>
            {invalidCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-600 font-medium">
                <X size={14} />
                {invalidCount} com erro{invalidCount !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-gray-400 ml-auto text-xs">
              {rows.length} linha{rows.length !== 1 ? 's' : ''} no total
            </span>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['#', 'Código', 'Nome', 'Área', 'Tipo', 'Dt. Solicitação', 'Status'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-gray-500 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.rowIndex} className={row.isValid ? 'bg-white' : 'bg-red-50/40'}>
                      <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                      <td className="px-3 py-2 font-mono text-gray-700">{row.rawData['codigo_vaga'] || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate">{row.rawData['nome_vaga'] || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.rawData['area'] || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 capitalize">{row.rawData['tipo_vaga'] || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.rawData['data_solicitacao'] || '—'}</td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <CheckCircle size={10} />
                            OK
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-help"
                            title={row.errors.join('\n')}
                          >
                            <AlertCircle size={10} />
                            {row.errors.length} erro{row.errors.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {invalidCount > 0 && (
            <p className="text-xs text-gray-400">
              Passe o mouse sobre os erros para ver os detalhes. Apenas as linhas válidas serão importadas.
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" onClick={resetModal}>
              <Upload size={14} />
              Outro arquivo
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
              <Button variant="primary" onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} vaga{validCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'importando' && (
        <div className="flex flex-col items-center justify-center py-14 gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Importando vagas, aguarde...</p>
        </div>
      )}

      {step === 'concluido' && resultado && (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-800">Importação concluída</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-green-50 rounded-xl p-5">
              <p className="text-3xl font-bold text-green-700">{resultado.criadas}</p>
              <p className="text-sm text-green-600 mt-1">
                vaga{resultado.criadas !== 1 ? 's' : ''} criada{resultado.criadas !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-center bg-red-50 rounded-xl p-5">
              <p className="text-3xl font-bold text-red-600">{resultado.erros}</p>
              <p className="text-sm text-red-500 mt-1">
                erro{resultado.erros !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            {resultado.criadas > 0 && (
              <Button
                variant="primary"
                onClick={() => {
                  onSuccess();
                  handleClose();
                }}
              >
                Ver vagas importadas
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose}>Fechar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default VagaImportModal;
