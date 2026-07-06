import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, FileText } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const TermosDeUso: React.FC = () => (
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
          <FileText size={20} className="text-[#1A56A0]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Termos de Uso</h1>
          <p className="text-sm text-gray-500 mt-0.5">Última atualização: julho de 2026</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-blue-800">
        Ao utilizar o SLA Tracker, você concorda integralmente com estes Termos de Uso. Leia atentamente
        antes de criar sua conta ou utilizar o sistema.
      </div>

      <Section title="1. Descrição do Serviço">
        <p>
          O <strong>SLA Tracker</strong> é uma plataforma web de gestão e monitoramento de processos
          seletivos desenvolvida pela <strong>Attrax Digital</strong>. O sistema permite que equipes de
          Recursos Humanos registrem vagas, acompanhem etapas de recrutamento, monitorem o cumprimento
          de SLAs (acordos de nível de serviço) e gerem relatórios de desempenho.
        </p>
        <p>
          O acesso ao sistema é fornecido mediante contratação pela organização empregadora, que é
          responsável por licenciar o uso para seus colaboradores autorizados.
        </p>
      </Section>

      <Section title="2. Elegibilidade e Acesso">
        <p>Para utilizar o SLA Tracker, o usuário deve:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Ser colaborador ou prestador de serviços da organização contratante;</li>
          <li>Ter recebido autorização expressa da organização para acessar o sistema;</li>
          <li>Ter no mínimo 18 (dezoito) anos de idade;</li>
          <li>Aceitar integralmente estes Termos de Uso e a Política de Privacidade.</li>
        </ul>
        <p>
          O cadastro de usuários não autorizados é estritamente proibido e pode resultar no cancelamento
          imediato do acesso e adoção das medidas legais cabíveis.
        </p>
      </Section>

      <Section title="3. Obrigações do Usuário">
        <p>Ao utilizar o SLA Tracker, o usuário se compromete a:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Manter suas credenciais de acesso (login e senha) em sigilo, sendo o único responsável
            pelo uso feito com sua conta;
          </li>
          <li>
            Inserir apenas informações verdadeiras, precisas e atualizadas no sistema;
          </li>
          <li>
            Utilizar a plataforma exclusivamente para finalidades profissionais relacionadas aos
            processos seletivos da organização;
          </li>
          <li>
            Não compartilhar, exportar ou divulgar dados de candidatos ou vagas sem autorização
            expressa da organização;
          </li>
          <li>
            Não tentar acessar funcionalidades, dados ou contas de outros usuários além das
            que lhe foram concedidas;
          </li>
          <li>
            Notificar imediatamente o administrador do sistema em caso de suspeita de uso não
            autorizado de sua conta;
          </li>
          <li>
            Cumprir todas as leis aplicáveis, incluindo a LGPD, ao inserir e tratar dados pessoais
            de candidatos no sistema.
          </li>
        </ul>
      </Section>

      <Section title="4. Propriedade Intelectual">
        <p>
          Todo o código-fonte, design, funcionalidades, documentação, marca e demais elementos que
          compõem o SLA Tracker são de <strong>propriedade exclusiva da Attrax Digital</strong>,
          protegidos pelas leis brasileiras e internacionais de propriedade intelectual (Lei
          nº 9.610/1998 — Lei de Direitos Autorais; e Lei nº 9.279/1996 — Lei de Propriedade Industrial).
        </p>
        <p>
          É <strong>expressamente proibido</strong>, sem autorização prévia e por escrito da Attrax Digital:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Copiar, reproduzir, modificar ou criar obras derivadas do sistema;</li>
          <li>Fazer engenharia reversa, descompilar ou desmontar o software;</li>
          <li>Remover ou alterar avisos de direitos autorais ou marcas registradas;</li>
          <li>Sublicenciar, vender, alugar ou transferir o acesso à plataforma a terceiros.</li>
        </ul>
        <p>
          A licença de uso concedida ao usuário é <strong>pessoal, intransferível e não exclusiva</strong>,
          válida apenas durante o período de vigência do contrato entre a organização contratante e a
          Attrax Digital.
        </p>
      </Section>

      <Section title="5. Limitação de Responsabilidade">
        <p>
          A Attrax Digital envidará esforços razoáveis para manter o sistema disponível e funcionando,
          mas <strong>não garante disponibilidade ininterrupta</strong> e não se responsabiliza por:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Perdas de dados decorrentes de falhas de terceiros (provedores de infraestrutura, rede, etc.);
          </li>
          <li>
            Danos indiretos, lucros cessantes ou perdas consequenciais resultantes do uso ou
            impossibilidade de uso do sistema;
          </li>
          <li>
            Inserção de dados incorretos ou incompletos por parte dos usuários da organização
            contratante;
          </li>
          <li>
            Decisões tomadas com base nos relatórios gerados pelo sistema;
          </li>
          <li>
            Acesso não autorizado resultante de negligência do usuário (ex: compartilhamento de senha).
          </li>
        </ul>
        <p>
          A responsabilidade total da Attrax Digital, em qualquer hipótese, fica limitada ao valor
          pago pela organização contratante no mês anterior ao evento gerador do dano.
        </p>
      </Section>

      <Section title="6. Privacidade e Proteção de Dados">
        <p>
          O tratamento de dados pessoais realizado pelo sistema é regido pela nossa{' '}
          <Link
            to="/politica-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1A56A0] hover:underline"
          >
            Política de Privacidade
          </Link>
          , que integra estes Termos de Uso. O usuário reconhece que, ao inserir dados pessoais de
          candidatos no sistema, atua como agente de tratamento e deve fazê-lo em conformidade com a
          LGPD e as orientações da organização contratante.
        </p>
      </Section>

      <Section title="7. Alterações nos Termos">
        <p>
          A Attrax Digital reserva-se o direito de modificar estes Termos de Uso a qualquer momento.
          Alterações relevantes serão comunicadas aos usuários com antecedência mínima de 15 dias,
          por meio do sistema ou pelo e-mail cadastrado. O uso continuado da plataforma após esse
          prazo implica aceitação dos novos termos.
        </p>
      </Section>

      <Section title="8. Suspensão e Encerramento">
        <p>
          A Attrax Digital ou a organização contratante poderão suspender ou encerrar o acesso de
          qualquer usuário, a qualquer momento e sem aviso prévio, em caso de:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Violação destes Termos de Uso ou da Política de Privacidade;</li>
          <li>Uso fraudulento, abusivo ou ilegal do sistema;</li>
          <li>Encerramento do vínculo empregatício ou contratual com a organização;</li>
          <li>Encerramento do contrato entre a organização e a Attrax Digital.</li>
        </ul>
      </Section>

      <Section title="9. Foro e Lei Aplicável">
        <p>
          Estes Termos de Uso são regidos pela legislação brasileira. Fica eleito o foro da Comarca
          de <strong>Curitiba, Estado do Paraná</strong>, como competente para dirimir quaisquer
          controvérsias decorrentes ou relacionadas a estes termos, com renúncia expressa a qualquer
          outro, por mais privilegiado que seja.
        </p>
        <p>
          Antes de recorrer ao Poder Judiciário, as partes se comprometem a buscar solução amigável
          através do canal de contato:{' '}
          <a href="mailto:fernando@attrax.com.br" className="text-[#1A56A0] hover:underline">
            fernando@attrax.com.br
          </a>
        </p>
      </Section>

      <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-400 flex flex-wrap items-center justify-between gap-2">
        <span>SLA Tracker — Attrax Digital · CNPJ: a ser preenchido</span>
        <Link to="/politica-privacidade" target="_blank" rel="noopener noreferrer" className="hover:text-[#1A56A0] transition-colors">
          Ver Política de Privacidade →
        </Link>
      </div>
    </main>
  </div>
);

export default TermosDeUso;
