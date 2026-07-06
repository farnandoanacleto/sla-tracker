import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, Shield } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const PoliticaPrivacidade: React.FC = () => (
  <div className="min-h-screen bg-[#F8FAFC]">
    {/* Header */}
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1A56A0] transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1A56A0] rounded-lg flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">SLA Tracker</span>
        </div>
      </div>
    </header>

    {/* Content */}
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-[#1A56A0]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Política de Privacidade</h1>
          <p className="text-sm text-gray-500 mt-0.5">Última atualização: julho de 2026</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-blue-800">
        Este documento descreve como o SLA Tracker trata os dados pessoais dos usuários, em conformidade com a
        Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
      </div>

      <Section title="1. Identificação das Partes">
        <p>
          <strong>Operador dos dados:</strong> Attrax Digital, responsável pelo desenvolvimento e operação técnica
          do sistema SLA Tracker.
        </p>
        <p>
          <strong>Controlador dos dados:</strong> A organização usuária do sistema (empresa contratante), que
          determina as finalidades e meios de tratamento dos dados pessoais processados pela plataforma.
        </p>
        <p>
          <strong>Encarregado de Proteção de Dados (DPO):</strong>{' '}
          <a href="mailto:fernando@attrax.com.br" className="text-[#1A56A0] hover:underline">
            fernando@attrax.com.br
          </a>
        </p>
      </Section>

      <Section title="2. Dados Pessoais Coletados">
        <p>O sistema coleta e processa as seguintes categorias de dados pessoais:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong>Dados de usuários do sistema:</strong> nome completo, endereço de e-mail, cargo/função,
            data e hora de cadastro e último acesso.
          </li>
          <li>
            <strong>Dados de candidatos:</strong> nome, posição a que se candidatou, etapas do processo
            seletivo, datas de entrevistas e resultado do processo (informações inseridas pelos gestores
            de RH).
          </li>
          <li>
            <strong>Dados de navegação:</strong> endereço IP de acesso, informações do navegador
            (user agent), registros de autenticação e consentimento.
          </li>
          <li>
            <strong>Dados operacionais:</strong> histórico de alterações de vagas, datas de eventos
            do processo seletivo e anotações inseridas pelos responsáveis.
          </li>
        </ul>
      </Section>

      <Section title="3. Finalidade do Tratamento">
        <p>Os dados pessoais são tratados exclusivamente para as seguintes finalidades:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Gestão e rastreamento de processos seletivos internos e externos;</li>
          <li>Monitoramento de SLAs (prazos de atendimento) em recrutamento e seleção;</li>
          <li>Geração de relatórios e indicadores de desempenho do RH;</li>
          <li>Controle de acesso e autenticação de usuários do sistema;</li>
          <li>Cumprimento de obrigações legais e regulatórias;</li>
          <li>Garantia da segurança e integridade das informações.</li>
        </ul>
      </Section>

      <Section title="4. Base Legal para o Tratamento">
        <p>O tratamento de dados pessoais se fundamenta nas seguintes hipóteses legais previstas no art. 7º da LGPD:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong>Inciso V — Execução de contrato:</strong> tratamento necessário para a prestação do
            serviço de gestão de processos seletivos contratado pela organização.
          </li>
          <li>
            <strong>Inciso IX — Legítimo interesse:</strong> para fins de auditoria, segurança do sistema,
            geração de relatórios internos e melhoria contínua dos processos de recrutamento.
          </li>
          <li>
            <strong>Inciso I — Consentimento:</strong> aplicável ao cadastro de usuários do sistema,
            coletado de forma livre, informada e inequívoca no momento do registro.
          </li>
        </ul>
      </Section>

      <Section title="5. Prazo de Retenção dos Dados">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Vagas encerradas (preenchidas ou canceladas):</strong> dados mantidos por{' '}
            <strong>2 (dois) anos</strong> a partir da data de encerramento, para fins de auditoria e
            cumprimento de obrigações trabalhistas.
          </li>
          <li>
            <strong>Dados de candidatos não selecionados:</strong> mantidos por{' '}
            <strong>6 (seis) meses</strong> após a conclusão do processo seletivo, após o quê são
            anonimizados ou excluídos.
          </li>
          <li>
            <strong>Dados de usuários do sistema:</strong> mantidos durante o período de uso ativo da
            plataforma e por até 1 (um) ano após o encerramento do contrato, para fins de auditoria.
          </li>
          <li>
            <strong>Registros de consentimento:</strong> mantidos permanentemente como evidência de
            conformidade legal.
          </li>
        </ul>
      </Section>

      <Section title="6. Compartilhamento de Dados">
        <p>
          Os dados pessoais tratados pelo sistema <strong>não são vendidos, alugados ou compartilhados
          comercialmente</strong> com terceiros. O acesso é restrito a:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Colaboradores da organização contratante com permissão de acesso ao sistema;</li>
          <li>
            Prestadores de serviços técnicos (Attrax Digital e Supabase Inc.) sob acordos de
            confidencialidade e processamento de dados adequados;
          </li>
          <li>Autoridades competentes, quando exigido por lei ou decisão judicial.</li>
        </ul>
      </Section>

      <Section title="7. Direitos do Titular dos Dados">
        <p>
          Nos termos dos arts. 17 a 22 da LGPD, o titular dos dados possui os seguintes direitos,
          exercíveis mediante solicitação ao DPO:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><strong>Confirmação e acesso:</strong> saber se seus dados são tratados e obter cópia;</li>
          <li><strong>Correção:</strong> solicitar a atualização de dados incompletos ou desatualizados;</li>
          <li>
            <strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários, excessivos
            ou tratados em desconformidade com a LGPD;
          </li>
          <li>
            <strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável;
          </li>
          <li>
            <strong>Revogação do consentimento:</strong> a qualquer momento, sem prejuízo do tratamento
            realizado anteriormente;
          </li>
          <li>
            <strong>Oposição:</strong> manifestar-se contra tratamento realizado em descumprimento da lei.
          </li>
        </ul>
        <p className="mt-3">
          Para exercer seus direitos, entre em contato com nosso DPO:{' '}
          <a href="mailto:fernando@attrax.com.br" className="text-[#1A56A0] hover:underline">
            fernando@attrax.com.br
          </a>
        </p>
      </Section>

      <Section title="8. Segurança dos Dados">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger os dados pessoais contra acesso
          não autorizado, perda, alteração ou divulgação, incluindo:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Autenticação segura com suporte a MFA (autenticação multifator);</li>
          <li>Criptografia de dados em trânsito (HTTPS/TLS) e em repouso;</li>
          <li>Controle de acesso baseado em papéis (RBAC) com Row Level Security no banco de dados;</li>
          <li>Registro de auditoria para alterações críticas;</li>
          <li>Política de senhas fortes e bloqueio por tentativas excessivas.</li>
        </ul>
      </Section>

      <Section title="9. Cookies e Tecnologias de Rastreamento">
        <p>
          O sistema utiliza <strong>armazenamento local (localStorage/sessionStorage)</strong> exclusivamente
          para gerenciar a sessão autenticada do usuário e preferências de interface. Não utilizamos
          cookies de rastreamento publicitário ou ferramentas de analytics de terceiros.
        </p>
      </Section>

      <Section title="10. Alterações nesta Política">
        <p>
          Esta Política de Privacidade pode ser atualizada periodicamente. Alterações relevantes
          serão comunicadas aos usuários por meio do sistema. O uso continuado da plataforma após a
          notificação implica aceitação das novas condições.
        </p>
      </Section>

      <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-400 flex flex-wrap items-center justify-between gap-2">
        <span>SLA Tracker — Attrax Digital · LGPD em conformidade</span>
        <Link to="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="hover:text-[#1A56A0] transition-colors">
          Ver Termos de Uso →
        </Link>
      </div>
    </main>
  </div>
);

export default PoliticaPrivacidade;
