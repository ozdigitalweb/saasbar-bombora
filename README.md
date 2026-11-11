# 🍸 SAASBAR — Sistema de Gestão para Copa, Cozinha e Salão em Bares, Baladas e Eventos

> **Plataforma operacional de alta performance projetada para noites de pico e casas noturnas:** Atendimento ágil sem filas, sincronia perfeita entre salão, copa e cozinha, reconhecimento imediato do cliente VIP e acompanhamento de metas de vendas e comissões em tempo real.

---

## 🎯 Os Três Pilares do SAASBAR

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       SAASBAR OPERATIONAL CORE                         │
   └──────────────────────────────────┬─────────────────────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│  1. SINCRONIA    │        │  2. RECONHECER   │        │   3. METAS DE    │
│  COPA, COZINHA   │        │    O CLIENTE     │        │   VENDAS NA      │
│    E SALÃO       │        │  EXPERIÊNCIA VIP │        │     BALADA       │
├──────────────────┤        ├──────────────────┤        ├──────────────────┤
│• Pedido com 1 toque│       │• Identificação   │        │• Metas da noite  │
│• KDS Cozinha & Bar│       │  por celular/QR  │        │  por praça/evento│
│• Notificação móvel│       │• Fidelidade 2 ★  │        │• Comissões no    │
│  de entrega      │        │  (Amarela & Azul)│        │  bolso do garçom │
│• Sem prato/drink │        │• Histórico VIP & │        │• Estímulo a upsell│
│  esquecido       │        │  preferências    │        │  (garrafas/combos)│
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

---

### 1. Sincronia Total entre Salão, Copa e Cozinha (Melhor Atendimento)
Em noites movimentadas de balada e bares cheios, cada minuto conta. O SAASBAR elimina comanda de papel, ruídos de comunicação e garçons correndo até o balcão para lançar pedidos:
- **Cardápio Digital na Mesa & Camarote:** O cliente escaneia o QR Code físico e faz o pedido no próprio celular, sem precisar baixar aplicativos.
- **Validação com 1 Toque pelo Garçom da Praça:** O pedido entra em `aguardando_validacao` sem poluir a produção. O garçom responsável pela mesa/camarote recebe o aviso no seu smartphone e aprova com apenas 1 toque (para clientes com telefone verificado).
- **Roteamento Inteligente para as Praças de Preparo (KDS):** 
  - Bebidas, drinks de coquetelaria, doses e combos de garrafas vão automaticamente para o **KDS da Copa / Bar**.
  - Porções, petiscos e pratos vão simultaneamente para o **KDS da Cozinha**.
- **Fila de "Prontos para Entrega" no Bolso do Garçom:** Assim que o bartender ou o chef finaliza o item no KDS, o garçom recebe um alerta na aba *Prontos para Entrega* com o número da mesa ou camarote, garantindo que o drink chegue gelado e o prato chegue quente.
- **Fallback Gerencial Automático:** Se uma mesa não tiver garçom fixo atribuído ou se o garçom da praça estiver ocupado/fora de turno, o pedido é distribuído para os garçons disponíveis da casa e notificado no painel do gerente (Monitor de Comandas).

---

### 2. Reconhecimento do Cliente e Experiência VIP na Balada
Transforme frequentadores comuns em clientes fiéis através do reconhecimento instantâneo e tratamento diferenciado em pistas, camarotes e lounges:
- **Identificação Ágil e Sem Atrito:** Na entrada (check-in com pulseira RFID/QR) ou na mesa (informando o celular verificado via SMS/WhatsApp), o sistema reconhece o histórico do cliente.
- **Programa de Fidelidade de Duas Estrelas:**
  - ⭐ **Estrela Amarela (Consumo Acumulado):** Recompensa o ticket acumulado em 12 meses em 4 categorias de prestígio:
    - *Bronze* (Iniciante)
    - *Prata* (Frequente — cashback inicial e fila rápida)
    - *Ouro* (VIP — prioridade em reservas de camarotes e dobro de benefícios)
    - *Black* (Ultra VIP — atendimento exclusivo, cortesias de boas-vindas e isenções)
  - 🔷 **Estrela Azul (Frequência & Recorrência):** Premia a assiduidade em ciclos de 3 visitas consecutivas. Na 3ª visita de cada ciclo, o cliente recebe premiações imediatas (drink cortesia, voucher de consumo ou isenção de entrada).
- **Preferências e Histórico de Consumo:** A equipe sabe quais drinks o cliente costuma pedir, seu gasto médio e suas preferências, permitindo um atendimento personalizado e cordial que gera fidelização orgânica.
- **Controle Seguro de Pulseiras & Carência de 30min:** Caso o cliente perca a pulseira na balada, o sistema congela a comanda imediatamente e concede uma janela de carência de 30 minutos sem multas abusivas para localização, evitando atritos desnecessários no caixa.

---

### 3. Metas de Vendas, Comissões em Tempo Real & Gestão Financeira
Mantenha a brigada de salão engajada, motivada e produtiva durante toda a noite:
- **Metas da Noite por Evento e Setor:** O gerente define metas de faturamento e ticket médio para o evento, acompanhando o desempenho por praça (Camarotes, Pista, Área VIP, Deck, Balcão).
- **Comissões Instantâneas no Bolso do Garçom:**
  - Aba *"Minhas Comissões"* no aplicativo do garçom exibindo seus ganhos em tempo real a cada pedido validado e entregue.
  - A transparência imediata incentiva ativamente o *upsell* (venda de combos, garrafas premium, petiscos e sobremesas).
- **Meu Caixa & Sangrias de Segurança:** Cada garçom com caixa individual pode registrar recebimentos em dinheiro vivo, realizar sangrias de segurança ao atingir o limite estipulado e fechar o turno com conferência cega.
- **Rateio Transparente da Taxa de Serviço (10%):** Distribuição configurável e justa entre garçons de atendimento, cumins, bartenders e equipe de cozinha.
- **Rebalanceamento Inteligente de Praças por Tempo de Resposta:** Monitoramento contínuo do SLA de atendimento; mesas sobrecarregadas são sugeridas para redistribuição aos garçons com menor ocupação para evitar filas.

---

## 📱 Visão das Telas e Módulos Operacionais

### 1. App Móvel do Garçom (PWA / Smartphone)
Projetado ergonomicamente para uso rápido em ambientes escuros e com alto volume de som:
1. **Minhas Mesas:** Monitoramento das mesas sob sua responsabilidade, status em tempo real e validação de pedidos pendentes com 1 toque.
2. **Lançamento Rápido:** Lançamento expresso de bebidas e porções por número de mesa, comanda ou pulseira RFID.
3. **Prontos para Entrega:** Fila de itens liberados pela copa e cozinha aguardando transporte à mesa.
4. **Meu Caixa:** Abertura de turno, controle de dinheiro recebido, sangrias parciais e prestação de contas.
5. **Minhas Comissões:** Painel de motivação com total de vendas da noite, comissão acumulada e metas atingidas.

### 2. KDS Físico para Cozinha e Copa/Bar
- Visualização de alta visibilidade em telas de TV ou tablets fixos na cozinha e nos balcões de bar.
- Cartões com tempos de espera destacados por cor (Verde = Recente, Amarelo = Atenção, Vermelho = Crítico).
- Separação instantânea de pedidos mistos: drinks vão para o bar e petiscos para a cozinha com número identificador unificado.

### 3. Monitor de Comandas e Painel Gerencial
- Visão panorâmica de todas as comandas ativas no evento.
- Alertas visuais de mesas com pedidos pendentes além do tempo limite configurado.
- Capacidade de validação direta pela gerência e cancelamento assistido.
- Relatórios em tempo real de faturamento bruto, taxa de serviço, formas de pagamento (Crédito, Débito, PIX, Cashless, Dinheiro) e consumo de produtos.

---

## 🔒 Arquitetura de Segurança & Hardening de Produção

O SAASBAR foi homologado com padrões rígidos de segurança para publicação em ambientes de produção de alta exigência:

### 1. Autenticação Global Obrigatória
- Todas as rotas sob `/api/*` exigem token Bearer JWT válido via middleware global.
- Requisições sem token ou com credenciais inválidas são imediatamente bloqueadas com **HTTP 401 Unauthorized**.

### 2. Whitelist Estrita de Rotas Públicas
Apenas os endpoints estritamente necessários para o autoatendimento anônimo do cliente na mesa estão liberados, todos protegidos por rate limiting:
| Rota | Método | Finalidade | Proteção |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | `POST` | Login com e-mail/celular e senha | Rate limiter contra força bruta |
| `/api/status` | `GET` | Healthcheck de integridade do servidor | Sem exposição de dados sensíveis |
| `/api/cliente/mesa-por-qr` | `GET` | Identificação da mesa por token do QR Code | Leitura restrita à mesa física |
| `/api/cliente/solicitar-codigo`| `POST` | Envio de código OTP de 6 dígitos via SMS/WhatsApp | Limite de reenvio (60s) e 3 envios/hora |
| `/api/cliente/verificar-codigo`| `POST` | Validação do código informado pelo cliente | Bloqueio automático após 3 erros |
| `/api/cliente/sessao-mesa` | `GET` | Consulta do status da sessão ativa do cliente | Apenas para sessões ativas |
| `/api/cliente/pedido` | `POST` | Envio de pedidos em `aguardando_validacao` | Exige telefone verificado na mesa |
| `/api/pedidos/lancamento-rapido`| `POST` | Lançamento rápido de autoatendimento verificado | Apenas com flag `origem = 'autoatendimento'` |

### 3. Matriz de Controle de Acesso Baseada em Papéis (RBAC)
| Recurso / Módulo | Gerente (`gerente`) | Operador de Balcão (`operador_balcao`) | Garçom (`garcom`) |
| :--- | :---: | :---: | :---: |
| Cadastrar/Editar Funcionários e Usuários | ✅ | ❌ | ❌ |
| Configurar Cardápio, Preços e Metas | ✅ | ❌ | ❌ |
| Configurar Pontos de Preparo (KDS) | ✅ | ❌ | ❌ |
| Criar Eventos e Fechamento da Casa | ✅ | ❌ | ❌ |
| Relatórios Financeiros e Auditoria de Caixas| ✅ | ❌ | ❌ |
| Rebalanceamento de Praças de Garçons | ✅ | ❌ | ❌ |
| Monitor Geral de Comandas e Intervenção | ✅ | ❌ | ❌ |
| Check-in de Clientes e Entrega de Pulseiras | ✅ | ✅ | ❌ |
| Fechamento e Pagamento de Comandas | ✅ | ✅ | ❌ |
| Visualizar Minhas Mesas e Praça | ✅ | ❌ | ✅ |
| Validar Pedidos da Minha Praça (1 Toque) | ✅ | ❌ | ✅ |
| Lançamento Rápido na Comanda/Mesa | ✅ | ✅ | ✅ |
| Fila de Prontos para Entrega | ✅ | ❌ | ✅ |
| Meu Caixa Pessoal e Minhas Comissões | ✅ | ❌ | ✅ |

### 4. Isolamento Multi-Tenant e Proteção de Dados
- O middleware `validateTenantAccess` garante que cada consulta esteja restrita ao `estabelecimentoId` do token autenticado, impedindo vazamento de informações entre diferentes estabelecimentos.
- Códigos de verificação telefônica são gravados exclusivamente com **hash SHA-256 + salt criptográfico**.
- Telefones são mascarados em todos os logs de auditoria (ex: `(11) *****-1234`).
- `JWT_SECRET` com trava fatal em produção caso a chave tenha menos de 32 caracteres.
- Senhas obrigatórias com no mínimo 8 caracteres (sem senhas padrão fracas).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:**
  - [React 19](https://react.dev/) — SPA reativa com hooks modernos.
  - [Tailwind CSS v4](https://tailwindcss.com/) — Design system com `@tailwindcss/vite`.
  - [Motion](https://motion.dev/) — Microinterações e animações visuais fluidas.
  - [Lucide Icons](https://lucide.dev/) — Iconografia intuitiva e consistente.
  - [Vite 8](https://vitejs.dev/) — Build e hot-reload ultrarrápidos.
- **Backend:**
  - [Node.js](https://nodejs.org/) & [Express 4](https://expressjs.com/) — API RESTful em TypeScript com middlewares de segurança.
  - [tsx](https://github.com/privatenumber/tsx) — Execução em TypeScript nativo.
  - [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — Emissão e verificação de JWT.
  - [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Hashing de senhas com salt.
- **Banco de Dados & Persistência:**
  - [PostgreSQL](https://www.postgresql.org/) — Banco relacional com transações seguras e pool de conexões otimizado (`pg`).
  - [Drizzle ORM](https://orm.drizzle.team/) — Tipagem estrita de banco e queries performáticas.

---

## 📂 Estrutura do Projeto

```text
├── scripts/
│   └── init-admin.ts             # CLI de primeira instalação segura (cria 1º estabelecimento e gerente)
├── src/
│   ├── components/
│   │   ├── common/               # Componentes visuais reutilizáveis (Botões, Modais, Badges, Inputs)
│   │   ├── layout/               # Topbar de navegação, status e Sidebar
│   │   ├── operations/           # Modais operacionais (Check-In, Pulseiras, Lançamentos, Comandas)
│   │   └── views/                # Telas completas da aplicação:
│   │       ├── CardapioView.tsx              # Gestão de itens, combos, bebidas e praças
│   │       ├── ClienteAutoatendimentoView.tsx# Autoatendimento mobile do cliente na mesa
│   │       ├── ClientesView.tsx              # Base de clientes cadastrados e histórico
│   │       ├── EstabelecimentoView.tsx       # Configurações do bar/balada e tempos de tolerância
│   │       ├── EventosView.tsx               # Noites, baladas, atrações e metas do evento
│   │       ├── FechamentoRateioView.tsx      # Fechamento de contas e rateio de serviço
│   │       ├── GarcomMobileAppView.tsx       # App móvel do Garçom (5 abas operacionais)
│   │       ├── KdsStatusView.tsx             # Monitor KDS de produção de pedidos
│   │       ├── LoginView.tsx                 # Autenticação com controle de papéis
│   │       ├── MesasView.tsx                 # Mapa de mesas, camarotes e QR Codes físicos
│   │       ├── MonitorComandasView.tsx       # Painel geral do gerente de comandas ativas
│   │       ├── PainelKdsFisicoView.tsx       # KDS dedicado para telas cheias da cozinha e copa
│   │       ├── PontosPreparoView.tsx         # Configuração de Cozinha, Copa, Bar e Drinks
│   │       ├── PulseirasView.tsx             # Gestão de estoque de pulseiras RFID
│   │       ├── RebalanceamentoEquipeView.tsx # Painel de balanceamento de garçons por tempo de resposta
│   │       ├── RelatoriosFidelidadeView.tsx  # Relatórios de Estrela Amarela e Estrela Azul
│   │       └── UsuariosView.tsx              # Gestão da equipe (Gerentes, Garçons, Operadores)
│   ├── db/
│   │   ├── index.ts              # Pool de conexões PostgreSQL e client Drizzle
│   │   └── schema.ts             # Esquema relacional completo (22 tabelas normalizadas)
│   ├── server/
│   │   ├── api-router.ts         # Central de rotas da API com RBAC e proteções
│   │   ├── app.ts                # Inicialização Express e middleware global de autenticação
│   │   ├── auth.ts               # Autenticação JWT, bcrypt e isolamento multi-tenant
│   │   ├── db-services.ts        # Regras de negócio de copa, cozinha, salão, fidelidade e metas
│   │   └── rate-limiter.ts       # Rate limiters em memória para endpoints públicos
│   ├── App.tsx                   # Roteamento visual da aplicação
│   └── main.tsx                  # Ponto de entrada React 19
├── tests/
│   ├── run-all-tests.ts          # Suíte completa de 159 testes automatizados (18 seções)
│   ├── run-section4.ts           # Teste focado de fechamento financeiro e rateio
│   └── audit-multitenant-routes.ts# Auditoria automatizada de rotas e segurança
├── server.ts                     # Servidor unificado (Express + Vite)
├── package.json                  # Scripts e dependências
└── README.md                     # Documentação oficial do projeto
```

---

## ⚡ Instalação e Execução

### 1. Pré-requisitos
- **Node.js** v20.x ou superior
- **PostgreSQL** v14+ configurado e acessível

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as credenciais do banco e a chave de segurança:

```env
# Banco de Dados PostgreSQL
SQL_HOST=localhost
SQL_USER=seu_usuario
SQL_PASSWORD=sua_senha
SQL_DB_NAME=saasbar

# Segurança & Criptografia (obrigatório >= 32 caracteres em produção)
JWT_SECRET=chave_secreta_super_segura_de_no_minimo_32_chars_12345
NODE_ENV=development

# Opcional: Provedor Real de SMS/WhatsApp para envio de códigos reais
# (Se não preenchido, o sistema utiliza o modo de simulação seguro com visualização restrita)
SMS_PROVIDER_API_KEY=""
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Provisionar o Primeiro Gerente (CLI de Setup Seguro)
Execute o script CLI de inicialização para criar o primeiro estabelecimento e o primeiro gerente administrativo sem expor nenhuma rota HTTP aberta:

```bash
npm run init-admin
```

Você também pode fornecer dados customizados via linha de comando:
```bash
npx tsx scripts/init-admin.ts "Balada Lounge Club" "Gerente Geral" "gerente@balada.com" "SenhaSegura@2026" "11999990001"
```
> O script aborta automaticamente se já existir um gerente cadastrado no sistema, garantindo a integridade dos dados existentes.

### 5. Iniciar em Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:3000`

### 6. Build e Execução em Produção
```bash
# Compilar os assets estáticos do frontend
npm run build

# Iniciar o servidor de produção
npm run start
```

---

## 🧪 Testes Automatizados

O sistema conta com **159 testes automatizados** cobrindo 100% das regras de negócio, fluxos de salão, copa, cozinha, fidelidade, pagamentos, fechamento de caixas e segurança criptográfica.

Para rodar a suíte completa:
```bash
npm test
```
*(ou `npx tsx tests/run-all-tests.ts`)*

### Cobertura dos 159 Testes (18 Seções):
1. **Seção 1:** Cadastros e isolamento multi-tenant de dados.
2. **Seção 2:** Autenticação, tokens JWT e validação de papéis (RBAC).
3. **Seção 3:** Ciclo operacional de evento (Check-in, consumo na comanda, KDS e entrega).
4. **Seção 4:** Fechamento de contas, divisão por cliente, pagamentos múltiplos e rateio de 10% de serviço.
5. **Seção 5:** Pulseira perdida com regra dinâmica e carência de 30 minutos sem multas indevidas.
6. **Seção 6:** Fidelidade — Estrela Amarela (4 níveis anuais de consumo acumulado).
7. **Seção 7:** Fidelidade — Estrela Azul (Ciclos de 3 visitas com benefícios de retorno).
8. **Seção 8:** Rebalanceamento inteligente de praças baseado em tempo de resposta (SLA).
9. **Seção 9:** Superfícies e controles operacionais complementares.
10. **Seção 10:** Autoatendimento na mesa via QR Code.
11. **Seção 11:** Painel KDS físico dedicado por praça de preparo.
12. **Seção 12:** App do Garçom com as 5 abas operacionais móveis.
13. **Seção 13:** Formas de pagamento, controle de caixa, comissões em dinheiro, sangrias, estorno e conciliação (13.1 a 13.11):
    - Pagamento em dinheiro, PIX, débito e crédito com idempotência.
    - Troco em dinheiro e validação estrita de valores recebidos.
    - Rateio da taxa de serviço (10%) para garçons e equipe de apoio.
    - Abertura de caixa com fundo de troco e fechamento com conferência cega.
    - Comissão do garçom sobre vendas em dinheiro mantida "a consolidar" até o fechamento do caixa.
    - Estorno de cobranças restrito a gerentes com justificativa obrigatória e auditoria.
    - Isolamento multi-tenant absoluto em todas as operações de caixa e relatórios.
    - Alerta visual de sangria quando o dinheiro em mãos ultrapassa o limite (`limiteDinheiroCaixa`).
    - Relatório de conciliação com tolerância configurável (`toleranciaConciliacao`) classificando divergências em *ok*, *alerta* (âmbar) e *crítico* (vermelho).
14. **Seção 14:** Validação de pedidos pelo garçom responsável e gerente:
    - Pedido em `aguardando_validacao` oculto no KDS.
    - Notificação exclusiva para o garçom da área em turno.
    - Geração de `numero_exibicao` sequencial por item ao validar.
    - Recusa de pedido cancela sem gerar registros no KDS.
    - Vínculo de cliente sem duplicação de cadastros.
    - Limite de segurança de no máximo 3 pedidos pendentes por mesa.
    - Alerta de pedidos pendentes que excederam o tempo limite.
    - Tratamento de mesas sem garçom ou com garçom fora de turno (distribuição aos disponíveis e alerta gerencial).
    - Validação direta pelo gerente no Monitor de Comandas.
15. **Seção 15:** Verificação antifraude de celular do cliente (SMS / WhatsApp):
    - Normalização de formato de telefone (E.164).
    - Criptografia com salt do código numérico de 6 dígitos.
    - Rate limit (60s entre envios e máximo de 3 envios por hora).
    - Mascaramento estrito de números de telefone nos logs.
    - Validação presencial obrigatória somente quando o código não chegou.
    - Validação com 1 toque quando o telefone já foi verificado por código.
16. **Seção 16:** Segurança, autenticação global e hardening de produção:
    - Retorno 401 Unauthorized para requisições anônimas em rotas privadas.
    - Retorno 403 Forbidden para garçons tentando acessar rotas administrativas de gerente.
    - Isolamento absoluto entre estabelecimentos distintos (`validateTenantAccess`).
    - Validação de senha forte (mínimo de 8 caracteres).
    - Bloqueio de inicialização em produção se `JWT_SECRET` for menor que 32 caracteres.
    - `comparePassword` estrito com `bcrypt.compare` (rejeita sumariamente o próprio hash do banco enviado como senha com 401).
    - Obrigatoriedade de `senhaHash` sem valor padrão `'mock_hash'` na API (`POST /usuarios` -> 400) e no repository.
    - Configuração de proxy reverso (`app.set('trust proxy', 1)`) em produção (Apache) garantindo que `req.ip` reflita o IP real.
    - Isolamento de rate limits por IP real via cabeçalho `X-Forwarded-For`.
    - Bloqueio de spoofing: cabeçalhos forjados pelo cliente são ignorados à esquerda do IP real injetado pelo proxy.
    - Registro do IP real no banco de dados para controle de taxa e auditoria de autoatendimento.
17. **Seção 17:** Segurança do Fluxo do Cliente (Autoatendimento QR da Mesa):
    - Requisições sem token de sessão em `POST /cliente/pedido` e `POST /pedidos/lancamento-rapido` bloqueadas com 401.
    - Token forjado/inválido ou expirado bloqueado com 401.
    - Token assinado de curta duração (2 horas) amarrado à mesa física: tentativa de pedir na Mesa B usando token da Mesa A bloqueada com 403.
    - Tentativa de vincular comanda de outra mesa bloqueada com 403.
    - Tentativa de adulteração de preços e nomes de itens no corpo ignorada: o servidor descarta e calcula o total exclusivamente pelo banco de dados (`itemCardapio.preco`).
    - Tentativa de injeção de poderes de equipe (`garcomId`, `criadoPor`, `statusValidacao="validado"`, `desconto`, `pago`) bloqueada com 403.
    - Código de verificação: expira em 5 minutos, uso único garantido, bloqueio na 3ª tentativa errada e ausência de vazamento de códigos em produção.
    - Pedido legítimo de autoatendimento nasce sempre em `aguardando_validacao` sem garçom atribuído até a validação presencial ou com 1 toque pelo garçom da área.
    - Isolamento mútuo total de tokens: token de autoatendimento (`cliente_sessao`) é rejeitado com 401/403 em rotas administrativas (`/mesas`, `/clientes`, `/comandas`, `/itens-cardapio`, `/usuarios`, `/bootstrap`), e token de equipe é rejeitado em `/cliente/pedido`.
    - QR Code de mesa: o servidor sempre gera `MESA-<uuid>` e ignora valores enviados pelo cliente/gerente no cadastro ou edição; botão "Gerar novo QR" invalida o QR anterior.
    - Fluxo sem SMS ("Não recebi o código"): emissão de sessão não-verificada (`POST /cliente/sessao-sem-codigo`); pedido nasce em `aguardando_validacao` com `telefoneVerificado: false`; tentativa de validação rápida com 1 toque é rejeitada com HTTP 400; validação presencial explícita é exigida e os itens só entram no KDS após essa confirmação.
18. **Seção 18:** Hardening Final de Segurança, Rate Limiting & Convenção de Telefones:
    - **Sanitização de `senhaHash`:** Remoção garantida na camada de serviço; nenhuma resposta de usuário vaza credenciais (`GET /usuarios`, `GET /usuarios/:id`, `POST /usuarios`, `PUT /usuarios/:id`, `POST /auth/login`).
    - **Validação Estrita de `comandaId` do Autoatendimento:** O servidor descobre a comanda aberta da mesa; qualquer injeção de `comandaId` de outra mesa enviada no corpo é rejeitada com HTTP 400.
    - **Alta Concorrência em Wi-Fi (100 mesas sob o mesmo IP):** Rate limit isolado por sessão/mesa (60 req/min) com teto amplo por IP (1000 req/min) e 1000 envios/hora em `solicitar-codigo`, garantindo operação simultânea de 100+ mesas sem nenhum erro 429.
    - **Convenção Única de Telefones (13 dígitos: `55 + DDD + 9 dígitos`):** Normalização padrão em cadastros, login com máscara ou sem, rate limiters e SMS, acompanhado de scripts de migração de banco e criação de índices únicos parciais.
    - **Blindagem do Rate Limiter:** O cabeçalho `x-test-run` só é aceito sob `NODE_ENV === 'test'`, permanecendo ativamente bloqueado em produção.

**Status atual da suíte de testes:**  
`TOTAL: 159 | PASSOU: 159 (100%) | FALHOU: 0 | DIFERENÇAS: 0`

---

## 🚀 Checklist Pré-Deploy para a V1 Ir ao Ar

Para publicar a versão 1 em ambiente de produção real:

1. **Banco PostgreSQL Gerenciado:** Provisionar instância de produção (Cloud SQL, Supabase, Neon ou RDS) e configurar as variáveis `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`.
2. **Segredo JWT de Produção:** Configurar `JWT_SECRET` com no mínimo 32 caracteres criptograficamente aleatórios no painel de ambiente (o servidor recusa inicializar se ausente ou menor que 32 chars).
3. **Provedor Real de SMS / WhatsApp:** Configurar a credencial de envio de mensagens transacionais (`SMS_PROVIDER_API_KEY`) para envio real de códigos OTP aos celulares dos clientes.
4. **Provisionamento Inicial (CLI):** Executar `npm run init-admin` para gerar o primeiro estabelecimento e as credenciais seguras do primeiro Gerente Geral.
5. **Certificado HTTPS / SSL:** Configurar domínio com SSL ativo (requisito obrigatório dos navegadores para leitura de câmera de QR Code nos celulares dos clientes e garçons).
6. **Impressão de QR Codes:** Cadastrar mesas e camarotes e imprimir os displays com os QR Codes de alta entropia gerados pelo sistema.

---

## 🗺️ Roadmap de Próximas Versões e MVPs (MVP 3+)

| Versão / MVP | Funcionalidade Planejada | Impacto Operacional |
| :--- | :--- | :--- |
| **MVP 3** | **Pagamento com PIX Dinâmico na Mesa** | O cliente consulta o extrato no próprio celular e paga via PIX Copia-e-Cola / QR Code Pix gerado dinamicamente via webhook bancário (Mercado Pago, Stone ou EFI), liberando a comanda sem aguardar o garçom. |
| **MVP 4** | **Catracas Eletrônicas e Hardware RFID** | Integração via TCP/IP com catracas de acesso físico (Control iD, Henry, Telematica), liberando a saída do cliente apenas se a comanda/pulseira estiver 100% quitada no sistema. |
| **MVP 5** | **Totens Físicos de Autoatendimento** | Interface quiosque touchscreen para pista e áreas externas para compra rápida de fichas de bebidas e combos de garrafas sem fila. |
| **MVP 6** | **Ficha Técnica & Baixa de Estoque por Doses** | Baixa milimétrica automatizada de mililitros de destilados, latas de energético e insumos a cada drink liberado no KDS do Bar. |
| **MVP 7** | **BI com IA e Previsão de Demanda** | Previsão de público e escala ideal de funcionários e estoque baseada no perfil da atração musical e histórico de eventos anteriores. |
| **MVP 8** | **App Nativo Offline-First (Capacitor/Mobile)** | Operação contínua do aplicativo do garçom mesmo em subsolos ou pontos cegos de Wi-Fi, sincronizando pedidos em lote ao restabelecer o sinal. |

> 📑 *Consulte o documento completo [`RELATORIO_TECNICO_PRODUCAO.md`](./RELATORIO_TECNICO_PRODUCAO.md) para a análise técnica detalhada de cada módulo.*

---

## 📄 Licença

Uso proprietário para operação e gestão de bares, eventos, casas noturnas e festivais. Todos os direitos reservados.
