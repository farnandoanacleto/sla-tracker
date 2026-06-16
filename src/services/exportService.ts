import * as XLSX from 'xlsx';
import { IVagaComSla } from '@/types';
import { formatDate, formatCurrency } from '@/utils/formatters';

/**
 * Serviço para lidar com a exportação de dados do SLA Tracker em formato Excel.
 */
export const exportService = {
  /**
   * Exporta a lista de vagas processadas com seus SLAs para um arquivo Excel (.xlsx).
   * 
   * @param vagas Lista de vagas enriquecidas
   * @param nomeArquivo Nome do arquivo de saída (padrão: 'relatorio-vagas-sla')
   */
  exportarRelatorioExcel(vagas: IVagaComSla[], nomeArquivo: string = 'relatorio-vagas-sla'): void {
    try {
      // 1. Mapear e traduzir as propriedades para um cabeçalho legível no Excel
      const dadosExportacao = vagas.map((vaga) => {
        const etapas = vaga.etapas_sla;

        const traduzirStatus = (status: string) => {
          switch (status) {
            case 'no_prazo': return 'No Prazo';
            case 'atrasada': return 'Atrasada';
            case 'em_andamento': return 'Em Andamento';
            case 'estourada': return 'Estourada';
            case 'pendente': return 'Pendente';
            default: return status;
          }
        };

        const formatarEtapaExcel = (etapaKey: keyof typeof etapas) => {
          const e = etapas[etapaKey];
          if (!e || e.status === 'pendente') return 'Pendente';
          const dias = e.diasUteisRealizados !== null ? `${e.diasUteisRealizados} dias` : '-';
          return `${dias} (${traduzirStatus(e.status)})`;
        };

        return {
          'Código da Vaga': vaga.codigo_vaga,
          'Nome da Vaga': vaga.nome_vaga,
          'Tipo de Vaga': vaga.tipo_vaga === 'interna' ? 'Interna' : 'Externa',
          'Nível': vaga.nivel_vaga.charAt(0).toUpperCase() + vaga.nivel_vaga.slice(1),
          'Área Solicitante': vaga.area_nome || '',
          'Responsável pela Área': vaga.area_responsavel || '',
          'Gestor Solicitante': vaga.gestor_solicitante,
          'Consultoria': vaga.consultoria_nome || 'Fluxo Interno',
          'Custo do Processo': formatCurrency(vaga.custo_processo),
          'Data Solicitação': formatDate(vaga.data_solicitacao),
          'Data Aprovação': formatDate(vaga.data_aprovacao),
          'Data Abertura Consultoria': formatDate(vaga.data_abertura_consultoria),
          'Data Envio Candidatos': formatDate(vaga.data_envio_candidatos),
          'Data Entrevista': formatDate(vaga.data_entrevista),
          'Data Fechamento': formatDate(vaga.data_fechamento),
          'Data Início Colaborador': formatDate(vaga.data_inicio_colaborador),
          'SLA Geral': traduzirStatus(vaga.status_geral_sla),
          'Dias Úteis Totais': vaga.dias_uteis_totais,
          'SLA 1: Aprovação (Limite 15d)': formatarEtapaExcel('aprovacao'),
          'SLA 2: Abertura (Limite 3d)': vaga.tipo_vaga === 'interna' ? 'N/A (Interna)' : formatarEtapaExcel('abertura_consultoria'),
          'SLA 3: Envio Candidatos (Varia Nível)': formatarEtapaExcel('envio_candidatos'),
          'SLA 4: Entrevista (Limite 15d)': formatarEtapaExcel('entrevista'),
          'SLA 5: Fechamento (Limite 7d)': formatarEtapaExcel('fechamento'),
        };
      });

      // 2. Construir o Workbook e a Worksheet do SheetJS
      const worksheet = XLSX.utils.json_to_sheet(dadosExportacao);
      const workbook = XLSX.utils.book_new();

      // Ajustar automaticamente a largura das colunas
      const rows = dadosExportacao as Record<string, string | number>[];
      const maxColWidths = Object.keys(dadosExportacao[0] || {}).map((key) => {
        let maxLen = key.length;
        rows.forEach((row) => {
          const val = row[key];
          if (val !== null && val !== undefined) {
            maxLen = Math.max(maxLen, String(val).length);
          }
        });
        return { wch: maxLen + 2 };
      });
      worksheet['!cols'] = maxColWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vagas');

      // 3. Exportar o arquivo Excel
      const filename = `${nomeArquivo.replace(/[^a-zA-Z0-9-_]/g, '')}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Erro ao exportar planilha Excel:', error);
      throw error;
    }
  }
};

export default exportService;
