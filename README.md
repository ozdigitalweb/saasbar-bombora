# SAASBAR — Sistema de Gestão para Bares, Baladas e Eventos

Plataforma completa de gestão operacional e financeira multi-tenant de alta concorrência para bares, casas noturnas, lounges e festivais. O SAASBAR combina autoatendimento do cliente na mesa com validação antifraude pelo garçom, painel KDS em tempo real para múltiplos pontos de preparo, app mobile do garçom, controle de pulseiras com tolerância dinâmica de extravio, fidelidade de duas estrelas, rebalanceamento inteligente de praças e fechamento com conciliação financeira.

---

## 🚀 Funcionalidades Principais

### 1. Autoatendimento na Mesa via QR Code com Verificação Telefônica
- **Cardápio Digital Sem Fricção:** O cliente escaneia o QR Code físico da mesa e acessa o cardápio atualizado em tempo real.
- **Verificação Telefônica Antifraude (OTP):** Para realizar pedidos, o cliente informa o número de celular e valida com código numérico de 6 dígitos enviado por SMS ou WhatsApp.
- **Segurança & Criptografia:** Códigos gerados com expiração curta, hash com salt criptográfico (SHA-256) e números mascarados em logs e telas de depuração.
- **Bloqueio de Abuso:** Limite de segurança de no máximo 3 pedidos em `aguardando_validacao` por mesa para evitar fraudes ou envios em massa acidentais.

### 2. Validação Rápida de Pedidos pelo Garçom & Gerente
- **Fila de Validação:** Pedidos enviados pelo cliente ficam com status `aguardando_validacao` e **não aparecem no KDS** antes de serem aprovados.
- **Roteamento por Praça:** O garçom atribuído à área da mesa (`garcom_area`) em turno ativo recebe o alerta com exclusividade.
- **Validação com 1 Toque:** Se o cliente já possui telefone verificado por código, o garçom valida com apenas um toque, sem necessidade de confirmação presencial.
- **Fallback para Gerência & Garçons em Turno:** Caso a mesa não tenha garçom fixo atribuído ou o garçom da área esteja fora de turno, o pedido é exibido para todos os garçons em turno e gera alerta no painel do gerente (que pode validar diretamente pelo Monitor de Comandas).
- **Despacho Automatizado para o KDS:** A validação gera o `numero_exibicao` sequencial por item e envia os itens instantaneamente para suas respectivas praças de preparo. A recusa cancela o pedido sem poluir a produção.

### 3. KDS Físico e Praças de Preparo (Cozinha, Copa, Bar)
- **Roteamento Inteligente de Itens:** Bebidas são encaminhadas para a Copa/Bar e pratos para a Cozinha simultaneamente dentro do mesmo pedido.
- **Linha de Montagem Operacional:** Status em tempo real (*Aguardando*, *Em Preparo*, *Pronto para Entrega*, *Entregue*).
- **Fila de Entrega para Garçons:** Itens finalizados no KDS alimentam a aba "Prontos para Entrega" no aplicativo móvel dos garçons.

### 4. App do Garçom Mobile (PWA / Responsivo)
Interface focada em ergonomia rápida para uso no smartphone do garçom, dividida em 5 abas operacionais:
1. **Minhas Mesas:** Visualização das mesas da sua praça, status de ocupação e lista de pedidos pendentes para validação rápida com 1 toque.
2. **Lançamento Rápido:** Registro ágil de pedidos na comanda ou mesa do cliente por QR, número ou código.
3. **Prontos para Entrega:** Fila de itens prontos no KDS prontos para serem levados à mesa.
4. **Meu Caixa:** Abertura e fechamento de turno, controle de sangrias de segurança e saldo em dinheiro vivo.
5. **Minhas Comissões:** Extrato transparente em tempo real das comissões por venda e rateios da taxa de serviço.

### 5. Controle de Pulseiras RFID/QR & Tolerância de Perda
- **Check-in e Vínculo:** Associação da pulseira à comanda e dados do cliente na entrada do evento.
- **Regra Dinâmica de Perda (Carência 30min):** Comunicação de perda imediata congela a pulseira antiga e abre uma janela de tolerância de 30 minutos sem multas abusivas para que o cliente localize seu item.
- **Cálculo Transparente de Multa:** Se não recuperada, a cobrança respeita os limites configurados e o consumo médio do evento.

### 6. Programa de Fidelidade de Duas Estrelas
- **⭐ Estrela Amarela (Consumo Acumulado):**
  - 4 níveis anuais de pontuação (Bronze, Prata, Ouro e Black) baseados no valor total consumido em 12 meses.
  - Oferece benefícios como percentual de cashback, fila expressa e cortesias exclusivas.
- **🔷 Estrela Azul (Frequência & Recorrência):**
  - Ciclos de 3 visitas consecutivas em dias distintos.
  - Na 3ª visita de cada ciclo, o cliente recebe premiações imediatas (drink cortesia, isenção de entrada ou voucher).

### 7. Rebalanceamento Dinâmico de Praças
- **Monitoramento de SLA:** Mede o tempo médio de resposta e a carga de pedidos pendentes por garçom.
- **Redistribuição Assistida:** Sugere reatribuição temporária de mesas de garçons sobrecarregados para garçons com menor ocupação na mesma noite.

### 8. Fechamento de Comandas, Rateio e Conciliação
- **Múltiplas Formas de Pagamento:** Cartão de crédito/débito, PIX, dinheiro e saldo cashless.
- **Divisão Flexível:** Fechamento por item, por pessoa ou divisão proporcional.
- **Rateio Transparente da Taxa de Serviço (10%):** Distribuição configurável entre garçons de salão, cumins, baristas, bartenders e brigada de cozinha.
- **Conciliação Financeira:** Auditoria de sangrias, saídas e divergências de caixa por operador.

---

## 🔒 Arquitetura de Segurança & Hardening de Produção

O sistema passou por uma rigorosa auditoria e hardening de segurança para publicação em produção:

### 1. Autenticação Global Obrigatória
- Todas as rotas sob `/api/*` exigem token Bearer JWT válido por padrão via middleware global.
- Requisições sem cabeçalho `Authorization: Bearer <token>` ou com token inválido/expirado recebem **HTTP 401 Unauthorized**.

### 2. Whitelist Estrita de Rotas Públicas
Apenas rotas estritamente necessárias para o fluxo anônimo/cliente possuem bypass de autenticação, cada uma protegida por rate limit:
| Rota | Método | Finalidade | Proteção |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | `POST` | Autenticação de operadores, garçons e gerentes | Rate limiter contra brute-force |
| `/api/status` | `GET` | Healthcheck do servidor e banco de dados | Leve e sem exposição de segredos |
| `/api/cliente/mesa-por-qr` | `GET` | Consulta a identificação da mesa pelo token do QR | Leitura limitada aos dados da mesa |
| `/api/cliente/solicitar-codigo`| `POST` | Envio de código OTP de 6 dígitos para o celular | Rate limiter por IP e telefone |
| `/api/cliente/verificar-codigo`| `POST` | Validação do código informado pelo cliente | Tentativas limitadas (bloqueio por força bruta) |
| `/api/cliente/sessao-mesa` | `GET` | Recuperação do estado da sessão do cliente na mesa | Exige parâmetros válidos de sessão |
| `/api/cliente/pedido` | `POST` | Criação de pedido em `aguardando_validacao` | Exige telefone verificado na mesa |
| `/api/pedidos/lancamento-rapido`| `POST` | Criação de pedido de autoatendimento verificado | Apenas com flag `origem = 'autoatendimento'` |

### 3. Controle de Acesso Baseado em Papéis (RBAC)
Cada rota autenticada exige um nível mínimo de privilégio (`requireRole`):
- **`gerente` (Administrador):** Acesso exclusivo para cadastro, edição e exclusão de usuários, alteração do estabelecimento, mesas, pulseiras, cardápio, eventos, relatórios financeiros, conciliação e rebalanceamento de equipe.
- **`operador_balcao`:** Operações de caixa, check-in de entrada e fechamento de comandas.
- **`garcom`:** Visualização das suas mesas, validação de pedidos de sua praça, lançamento de itens e gestão do seu próprio caixa/comissões. Tentativas de acesso a rotas de gerência retornam **HTTP 403 Forbidden**.

### 4. Isolamento Multi-Tenant Estrito
- O middleware `validateTenantAccess` rejeita imediatamente requisições não autenticadas ou onde o `estabelecimentoId` da URL/corpo não coincida com o tenant do token do usuário.
- Um usuário de um estabelecimento não consegue visualizar ou alterar registros de outro estabelecimento.

### 5. Política de Senhas & Segredos de Ambiente
- **Mínimo de 8 Caracteres:** Não é permitido o uso de senhas fracas ou valores padrão no cadastro de novos usuários.
- **`JWT_SECRET` Obrigatório:** Em produção (`NODE_ENV=production`), o servidor recusa a inicialização se a variável `JWT_SECRET` não estiver definida ou possuir menos de 32 caracteres. Em ambiente de desenvolvimento/teste sem a variável, uma chave efêmera criptograficamente segura de 256 bits é gerada em memória a cada reinicialização.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:**
  - [React 19](https://react.dev/) — Interface moderna baseada em componentes funcionais e hooks.
  - [Tailwind CSS v4](https://tailwindcss.com/) — Estilização moderna e utilitária via `@tailwindcss/vite`.
  - [Motion](https://motion.dev/) — Animações e transições fluidas de interface.
  - [Lucide React](https://lucide.dev/) — Iconografia consistente e acessível.
  - [Vite 8](https://vitejs.dev/) — Bundler e ambiente de desenvolvimento ultrarrápido.
- **Backend:**
  - [Node.js](https://nodejs.org/) & [Express 4](https://expressjs.com/) — API RESTful em TypeScript com middlewares customizados.
  - [tsx](https://github.com/privatenumber/tsx) — Executor TypeScript com suporte a ESM nativo.
  - [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — Emissão e validação de tokens JWT.
  - [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Criptografia e hashing seguro de senhas com salt.
- **Banco de Dados & Persistência:**
  - [PostgreSQL](https://www.postgresql.org/) — Banco de dados relacional robusto para concorrência e transações financeiras.
  - [Drizzle ORM](https://orm.drizzle.team/) — Tipagem estrita de ponta a ponta e consultas performáticas (`pg`).

---

## 📂 Estrutura do Projeto

```text
├── scripts/
│   └── init-admin.ts             # Script CLI de primeira instalação e provisionamento seguro
├── src/
│   ├── components/
│   │   ├── common/               # Componentes compartilhados (Botões, Inputs, Badges, Modais)
│   │   ├── layout/               # Topbar, Sidebar e navegação principal
│   │   ├── operations/           # Modais de Check-In, Comandas, Pulseiras e Lançamentos
│   │   └── views/                # Telas completas da aplicação:
│   │       ├── CardapioView.tsx              # Gestão de cardápio e itens por praça
│   │       ├── ClienteAutoatendimentoView.tsx# Interface móvel do cliente na mesa
│   │       ├── ClientesView.tsx              # Base de clientes cadastrados
│   │       ├── EstabelecimentoView.tsx       # Configurações do bar / casa noturna
│   │       ├── EventosView.tsx               # Programação de eventos e turnos
│   │       ├── FechamentoRateioView.tsx      # Fechamento e rateio de taxas
│   │       ├── GarcomMobileAppView.tsx       # App PWA do Garçom (5 abas operacionais)
│   │       ├── KdsStatusView.tsx             # Monitor KDS de produção
│   │       ├── LoginView.tsx                 # Tela de autenticação com suporte a papéis
│   │       ├── MesasView.tsx                 # Mapeamento de mesas e QR Codes
│   │       ├── MonitorComandasView.tsx       # Painel geral do gerente para comandas
│   │       ├── PainelKdsFisicoView.tsx       # KDS com tela cheia para cozinha e copa
│   │       ├── PontosPreparoView.tsx         # Configuração de praças de preparo
│   │       ├── PulseirasView.tsx             # Gestão do estoque de pulseiras RFID
│   │       ├── RebalanceamentoEquipeView.tsx # Painel de balanceamento de garçons
│   │       ├── RelatoriosFidelidadeView.tsx  # Relatórios de estrelas e recorrência
│   │       └── UsuariosView.tsx              # Gestão de operadores, garçons e gerentes
│   ├── db/
│   │   ├── index.ts              # Pool de conexões PostgreSQL e instância Drizzle
│   │   ├── schema.ts             # Esquema relacional completo (23 tabelas normalizadas)
│   │   └── drizzle.config.ts     # Configurações de migração Drizzle
│   ├── server/
│   │   ├── api-router.ts         # Roteador central com todas as rotas e RBAC
│   │   ├── app.ts                # Configuração da aplicação Express e middlewares
│   │   ├── auth.ts               # Lógica de JWT, hashing bcrypt e guards de tenant
│   │   ├── db-services.ts        # Camada de serviços e regras de negócio
│   │   └── rate-limiter.ts       # Rate limiters em memória para endpoints públicos
│   ├── App.tsx                   # Roteador de estado do cliente e layout raiz
│   └── main.tsx                  # Ponto de entrada React 19
├── tests/
│   ├── run-all-tests.ts          # Suíte completa de 121 testes automatizados (16 seções)
│   ├── run-section4.ts           # Testes isolados de fechamento e rateio financeiro
│   └── audit-multitenant-routes.ts# Auditoria de rotas e isolamento multi-tenant
├── server.ts                     # Ponto de entrada do servidor unificado (Express + Vite)
├── package.json                  # Dependências e scripts
└── README.md                     # Documentação oficial do projeto
```

---

## ⚡ Instalação e Execução

### 1. Pré-requisitos
- **Node.js** v20.x ou superior
- **PostgreSQL** v14+ configurado e acessível

### 2. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto configurando as credenciais do banco e a chave de criptografia:

```env
# Banco de Dados PostgreSQL
SQL_HOST=localhost
SQL_USER=seu_usuario
SQL_PASSWORD=sua_senha
SQL_DB_NAME=saasbar

# Segurança & Criptografia (mínimo de 32 caracteres obrigatório em produção)
JWT_SECRET=sua_chave_secreta_super_segura_de_no_minimo_32_chars_12345
NODE_ENV=development

# Opcional: Provedor de SMS/WhatsApp para envio de códigos reais
# (Se não configurado, o sistema opera em modo de simulação seguro com visualização controlada)
SMS_PROVIDER_API_KEY=""
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Inicialização do Primeiro Gerente (Setup Inicial)
Para provisionar o primeiro estabelecimento e criar o primeiro usuário com papel de **gerente** de forma segura (sem depender de rotas HTTP abertas), execute o script de instalação CLI:

```bash
npm run init-admin
```

Você também pode fornecer credenciais específicas via argumentos:
```bash
npx tsx scripts/init-admin.ts "Nome do Bar" "Nome do Gerente" "gerente@bar.com" "SenhaForte@2026" "11999990001"
```
> **Nota de Segurança:** O script verifica previamente se já existe qualquer gerente cadastrado no banco de dados. Caso já exista, a operação é abortada imediatamente para evitar sobrescritas indevidas.

### 5. Iniciar o Ambiente de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:3000`

### 6. Build e Execução em Produção
```bash
# Compilar assets do frontend
npm run build

# Iniciar servidor em produção
npm run start
```

---

## 🧪 Testes Automatizados

O projeto conta com uma suíte de testes ponta a ponta que valida regras de negócio, antifraude, multi-tenant e segurança.

Para rodar todos os testes automatizados:
```bash
npm test
```
*(ou diretamente via `npx tsx tests/run-all-tests.ts`)*

### Resumo das 16 Seções de Testes (121 Testes):
- **Seção 1:** Cadastros e isolamento multi-tenant de dados.
- **Seção 2:** Autenticação, emissão de tokens e validação de papéis (RBAC).
- **Seção 3:** Ciclo operacional completo (Check-in de comanda, pedidos e KDS).
- **Seção 4:** Fechamento de contas, múltiplas formas de pagamento e rateio da taxa de 10%.
- **Seção 5:** Pulseira perdida com regra dinâmica e carência de 30 minutos.
- **Seção 6:** Fidelidade — Estrela Amarela (4 níveis por consumo anual).
- **Seção 7:** Fidelidade — Estrela Azul (Ciclos de 3 visitas recorrentes).
- **Seção 8:** Rebalanceamento de equipe baseado em tempo de resposta do garçom.
- **Seção 9:** Superfícies operacionais complementares.
- **Seção 10:** Tela do cliente na mesa via QR Code (autoatendimento).
- **Seção 11:** Painel de status do KDS físico de praça fixa.
- **Seção 12:** App móvel do Garçom com as 5 abas operacionais.
- **Seção 14:** Validação de pedidos de autoatendimento pelo garçom responsável e gerente:
  - Pedido em `aguardando_validacao` não aparece no KDS.
  - Apenas o garçom da área recebe o alerta.
  - Validação gera `numero_exibicao` sequencial por item.
  - Recusa de pedido cancela sem gerar registros no KDS.
  - Vínculo de cliente sem duplicação de cadastros.
  - Isolamento multi-tenant de validação.
  - Limite de 3 pedidos pendentes por mesa (contando apenas pedidos pendentes).
  - Alerta de pedidos pendentes que excederam o tempo configurado.
  - Suporte a mesas sem garçom atribuído ou garçom fora de turno com fallback para a gerência.
  - Validação direta pelo gerente através do Monitor de Comandas.
- **Seção 15:** Verificação antifraude de celular por SMS/WhatsApp:
  - Formatação e normalização de telefones (E.164).
  - Criptografia com salt do código de validação.
  - Rate limiting e expiração de códigos.
  - Desativação do modo simulado e mascaramento de logs com provedor real ativo.
  - Validação em um toque para clientes com telefone já verificado.
- **Seção 16:** Auditoria de segurança e hardening de produção:
  - Bloqueio 401 Unauthorized para requisições sem token em rotas não públicas.
  - Bloqueio 403 Forbidden para garçons tentando acessar rotas de gerência.
  - Isolamento total entre dados de estabelecimentos distintos.
  - Validação da obrigatoriedade de senha com no mínimo 8 caracteres.
  - Validação de obrigatoriedade de `JWT_SECRET` forte em modo de produção.

---

## 👥 Papéis de Usuário (Matriz de Acesso)

| Funcionalidade / Módulo | Gerente (`gerente`) | Operador (`operador_balcao`) | Garçom (`garcom`) |
| :--- | :---: | :---: | :---: |
| Cadastrar / Editar Usuários e Funcionários | ✅ | ❌ | ❌ |
| Configurar Estabelecimento e Mesas | ✅ | ❌ | ❌ |
| Cadastrar Cardápio e Pontos de Preparo | ✅ | ❌ | ❌ |
| Criar e Gerenciar Eventos | ✅ | ❌ | ❌ |
| Relatórios Financeiros e Fidelidade | ✅ | ❌ | ❌ |
| Rebalanceamento de Praças de Garçom | ✅ | ❌ | ❌ |
| Conciliação Bancária e Auditoria de Caixas | ✅ | ❌ | ❌ |
| Monitor de Comandas Geral e Validação Gerencial | ✅ | ❌ | ❌ |
| Check-in de Clientes e Vinculação de Pulseiras | ✅ | ✅ | ❌ |
| Fechamento e Pagamento de Comandas | ✅ | ✅ | ❌ |
| Visualizar Minhas Mesas e Minha Praça | ✅ | ❌ | ✅ |
| Validar Pedidos da Minha Área (1 Toque) | ✅ | ❌ | ✅ |
| Lançamento Rápido de Itens na Comanda/Mesa | ✅ | ✅ | ✅ |
| Visualizar Itens Prontos para Entrega | ✅ | ❌ | ✅ |
| Gestão do Próprio Caixa e Extrato de Comissões | ✅ | ❌ | ✅ |

---

## 📄 Licença

Este projeto é de uso privado para gestão de bares, eventos e casas noturnas. Todos os direitos reservados.
