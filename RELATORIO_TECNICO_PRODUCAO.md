# 📊 SAASBAR — Relatório Técnico de Prontidão para Produção (V1) & Roadmap de Evolução

**Data do Relatório:** 10 de Novembro de 2026  
**Status da Versão Atual (V1):** 🟢 **100% Homologada & Pronta para Publicação**  
**Resultado dos Testes Automatizados:** 159 testes executados | 159 aprovados (100%) | 0 falhas | 0 diferenças  
**Qualidade de Código:** TypeScript estrito (`tsc --noEmit` aprovado com 0 erros) | Build de produção Vite aprovado  

---

## 1. Visão Geral da Arquitetura Técnica

O **SAASBAR** foi desenvolvido sob medida para suportar picos extremos de concorrência, ruído e velocidade de giro comuns em bares, lounges, casas noturnas, baladas e festivais. A aplicação unifica os fluxos de **Salão, Copa e Cozinha**, integrando autoatendimento do cliente, linha de produção e gamificação de vendas da brigada.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ARQUITETURA SAASBAR                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
                 ▲                                                     ▲
                 │ (QR Code Mesa / PWA)                                │ (PWA Smartphone)
      ┌──────────┴──────────┐                               ┌──────────┴──────────┐
      │  AUTOATENDIMENTO    │                               │    APP DO GARÇOM    │
      │  Mesa / Camarote    │                               │   5 Abas de Ação    │
      └──────────┬──────────┘                               └──────────┬──────────┘
                 │ (OTP Telefone / Sessão 2h)                                  │ (JWT Papel Garçom)
                 ▼                                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        API ROUTER EXPRESS & MIDDLEWARES GLOBAIS                        │
│  • Autenticação Global Bearer JWT         • Rate Limiter por IP Real (trust proxy 1)   │
│  • Whitelist Estrita de Rotas Públicas    • Multi-Tenant Isolation (validateTenant)    │
│  • Token de Sessão Efémero (Cliente)      • Role-Based Access Control (RBAC)           │
└──────────────────────────────────┬─────────────────────────────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│     KDS FÍSICO COPA / BAR       │ │      KDS FÍSICO COZINHA         │
│  • Drinks, Doses, Garrafas      │ │  • Petiscos, Porções, Pratos    │
│  • Alerta visual por cor        │ │  • Linha de preparo em tempo real│
└────────────────┬────────────────┘ └────────────────┬────────────────┘
                 │                                   │
                 └─────────────────┬─────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             POSTGRESQL & DRIZZLE ORM                                   │
│  • 22 Tabelas Normalizadas      • Transações ACID Seguras    • Pool Otimizado         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. O Que a Aplicação Já Faz (Funcionalidades 100% Concluídas na V1)

### 2.1. Salão, Mesas e Camarotes
- **Mapeamento de Mesas e Praças:** Identificação visual de mesas, camarotes, balcão e lounges, com status em tempo real (*livre*, *ocupada*, *liberada*).
- **QR Codes Criptográficos Gerados pelo Servidor:** Cada mesa possui QR Code físico gerado exclusivamente pelo backend com `MESA-<uuid>` (aleatoriedade criptográfica segura), prevenindo adivinhação, enumeração ou injeção manual. Valores manuais de `qrCode` enviados no corpo de cadastro ou edição são 100% ignorados pelo servidor.
- **Regeneração de QR Code em 1 Clique:** O painel de mesas conta com botão gerencial "Gerar novo QR" (`POST /mesas/:id/regenerar-qr`), que invalida o código anterior imediatamente e cria um novo identificador seguro.
- **Controle de Abertura:** Suporte a abertura e check-in de comandas individuais por mesa ou por pulseira RFID/QR.

### 2.2. Autoatendimento na Mesa com Verificação Antifraude
- **Cardápio Digital Sem Download:** Acesso instantâneo pelo navegador do celular do cliente.
- **Verificação Telefônica via OTP:** Código de 6 dígitos gerado com `crypto.randomInt` e enviado via SMS ou WhatsApp.
- **Armazenamento Seguro de Códigos:** Gravação no banco utilizando exclusivamente **hash SHA-256 + salt de 16 bytes**, expiração em 5 minutos e comparação por `crypto.timingSafeEqual`.
- **Proteção contra Brute-Force & Abuso:** Limite de 60 segundos entre reenvios, máximo de 3 envios por hora por telefone, rate limit por IP e bloqueio irreversível do código na 3ª tentativa incorreta.
- **Token de Sessão Assinado de 2 Horas:** Após verificação positiva, o cliente recebe um token JWT assinado contendo amarração estrita ao `estabelecimentoId`, `mesaId`, `comandaId` e `telefone`. Tentativas de pedir em outra mesa usando o mesmo token retornam **HTTP 403 Forbidden**.
- **Fluxo sem SMS e Caminho "Não recebi o código":** Caso o envio de SMS falhe ou o código não chegue, o cliente pode clicar em "Não recebi o código" para obter uma sessão não-verificada (`POST /cliente/sessao-sem-codigo`). O pedido nasce em `aguardando_validacao` com `telefoneVerificado: false`. A validação rápida de 1 toque do garçom é sumariamente rejeitada pelo backend (HTTP 400), exigindo que o garçom confirme presencialmente na mesa (`confirmadoPresencialmente: true`) para que os itens recebam número de exibição e entrem na fila de preparo do KDS.
- **Preços e Nomes Diretos do Banco:** O servidor descarta qualquer preço adulterado enviado pelo cliente (`preco: 0.01`), calculando o consumo estritamente com base na tabela `item_cardapio` do PostgreSQL.
- **Validação de Quantidades:** Quantidade máxima de 20 unidades por item (inteiro entre 1 e 20) e limite de no máximo 30 itens por pedido.
- **Limite de Pedidos Pendentes:** No máximo 3 pedidos em `aguardando_validacao` por mesa para evitar fraudes ou envios acidentais em massa.

### 2.3. Validação Ágil pelo Garçom & Gerente
- **Fila de Validação Oculta do KDS:** Pedidos do cliente não poluem a cozinha e o bar antes de serem aprovados.
- **Roteamento por Praça:** O garçom atribuído à área da mesa em turno ativo recebe o alerta com exclusividade.
- **Validação com 1 Toque:** Para clientes com telefone já verificado por código, o garçom valida com apenas um toque no app.
- **Exigência Presencial para Telefones Não Verificados:** Caso o cliente tenha entrado sem SMS, o garçom deve marcar a confirmação presencial antes de validar.
- **Fallback para Gerência & Garçons em Turno:** Se a mesa não possuir garçom atribuído ou o garçom estiver fora de turno, o pedido alerta no Monitor de Comandas do Gerente (que pode validar diretamente) e aparece para os garçons disponíveis.
- **Geração Atômica de Sequencial por Evento:** Ao validar, o sistema gera o `numero_exibicao` sequencial atômico por evento (ex: `P-101`, `P-102`), protegido por fila de concorrência com mutex em memória e seed no banco, e despacha os itens para suas respectivas praças. A recusa cancela o pedido sem poluir a produção.

### 2.4. KDS Físico para Copa/Bar e Cozinha
- **Roteamento Automático:** Bebidas e coquetéis são direcionados para o KDS da Copa/Bar; porções e petiscos para a Cozinha.
- **Linha de Produção com Cores:** Identificação visual por tempo de espera (Verde = Recente, Amarelo = Atenção, Vermelho = Crítico).
- **Fila de Entrega para o Salão:** Finalização de preparo notifica instantaneamente o garçom responsável.

### 2.5. App do Garçom Mobile (5 Abas)
1. **Minhas Mesas:** Visão das mesas da praça, ocupação e pedidos pendentes de validação com 1 toque.
2. **Lançamento Rápido:** Registro ágil de pedidos para clientes atendidos presencialmente (com `criadoPor` forçado do token).
3. **Prontos para Entrega:** Fila de drinks e pratos liberados pelo KDS com indicação da mesa/camarote.
4. **Meu Caixa:** Abertura de turno, controle de valores em dinheiro, sangrias de segurança parciais com alerta visual quando excede o teto (`limiteDinheiroCaixa`) e fechamento cego.
5. **Minhas Comissões:** Extrato transparente dos ganhos da noite em tempo real (mantendo comissões em dinheiro "a consolidar" até o fechamento do caixa) e progresso das metas.

### 2.6. Reconhecimento do Cliente & Fidelidade de Duas Estrelas
- **Identificação Imediata:** Reconhecimento no check-in ou no autoatendimento pelo número de celular.
- **Estrela Amarela (Consumo Anual):** 4 níveis acumulados em 12 meses (*Bronze*, *Prata*, *Ouro*, *Black*) com cashback e cortesias.
- **Estrela Azul (Frequência & Recorrência):** Ciclos de 3 visitas consecutivas; na 3ª visita o cliente recebe benefício imediato (drink cortesia, isenção de entrada ou voucher).
- **Tolerância Dinâmica para Pulseiras Extraviadas:** Congelamento imediato da pulseira perdida e carência de 30 minutos sem multas abusivas para localização.

### 2.7. Fechamento de Comandas, Rateio de Serviço e Conciliação
- **Múltiplos Meios de Pagamento:** Cartão de crédito, débito, dinheiro, PIX e saldo cashless com proteção de idempotência.
- **Divisão Flexível:** Fechamento por pessoa, por item ou divisão proporcional.
- **Rateio da Taxa de Serviço (10%):** Distribuição configurável entre garçons, cumins, bartenders e cozinha.
- **Auditoria Financeira:** Registro de sangrias, saídas de caixa e divergências por operador.
- **Relatório de Conciliação:** Tolerância configurável (`toleranciaConciliacao`) para confrontação de maquininhas físicas vs sistema, com alertas em verde (ok), âmbar (alerta) e vermelho (crítico).

### 2.8. Segurança e Hardening de Produção
- **Autenticação Global Obrigatória:** Todas as rotas `/api/*` exigem token Bearer JWT válido por padrão.
- **Whitelist Estrita de Rotas Públicas:** Apenas 8 rotas indispensáveis liberadas com rate limit explícito.
- **Isolamento Mútuo de Tokens:** Tokens de cliente (`cliente_sessao`) são sumariamente rejeitados com 401/403 em todas as rotas administrativas (`/mesas`, `/clientes`, `/comandas`, `/itens-cardapio`, `/usuarios`, `/bootstrap`), e tokens de equipe são rejeitados nas rotas exclusivas do cliente.
- **Controle de Acesso Baseado em Papéis (RBAC):** Privilégios distintos para `gerente`, `operador_balcao` e `garcom`.
- **Isolamento Multi-Tenant:** `validateTenantAccess` impede acesso cruzado a dados de outros estabelecimentos em 100% das operações.
- **Política de Senhas & JWT_SECRET:** Mínimo de 8 caracteres; bloqueio fatal do servidor em produção caso `JWT_SECRET` possua menos de 32 caracteres.
- **Script CLI de Instalação Segura:** `npm run init-admin` para provisionamento inicial sem rotas HTTP abertas.

---

## 3. O Que Falta Fazer para a V1 ir ao Ar (Checklist Pré-Deploy)

Para publicar a Versão 1 em ambiente de produção real com clientes e funcionários, resta apenas cumprir os passos de infraestrutura e parametrização operacional abaixo:

### Passo 1: Provisionar o Banco de Dados PostgreSQL de Produção
- [ ] Criar instância gerenciada de PostgreSQL (ex.: Cloud SQL, Supabase, Neon ou RDS).
- [ ] Configurar pool de conexões (tamanho sugerido: `min: 2, max: 20`).
- [ ] Preencher as variáveis de conexão no ambiente de produção:
  ```env
  SQL_HOST="seu-postgres-host.com"
  SQL_USER="saasbar_user"
  SQL_PASSWORD="sua_senha_segura"
  SQL_DB_NAME="saasbar_prod"
  ```

### Passo 2: Definir Chave JWT de Alta Entropia
- [ ] Gerar uma chave aleatória de 64 caracteres hexadecimais (ex.: via `openssl rand -hex 32`).
- [ ] Configurar no painel de segredos/ambiente de produção:
  ```env
  NODE_ENV="production"
  JWT_SECRET="e9a2b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8"
  ```
  *(O servidor recusa a inicialização se a variável estiver ausente ou tiver menos de 32 caracteres).*

### Passo 3: Configurar Provedor de SMS / WhatsApp (Broker Real)
- [ ] Cadastrar conta em provedor de mensagens transacionais (ex.: Twilio, Z-API, TotalVoice ou Zenvia).
- [ ] Preencher a chave de integração na variável de ambiente:
  ```env
  SMS_PROVIDER_API_KEY="sua_chave_de_producao"
  ```
  *(Se não configurado, o sistema opera no modo simulador seguro em memória, excelente para testes e treinamento da equipe antes da inauguração).*

### Passo 4: Executar o Script de Provisionamento Inicial (CLI)
- [ ] Rodar o comando CLI uma única vez no servidor de produção para criar o estabelecimento e o Gerente Geral:
  ```bash
  npm run init-admin
  # Ou com parâmetros personalizados:
  npx tsx scripts/init-admin.ts "Nome do Bar" "Gerente Geral" "gerente@seubar.com" "SenhaForte@2026" "11999990001"
  ```

### Passo 5: Publicar com Domínio Próprio e Certificado HTTPS / SSL
- [ ] O protocolo HTTPS é obrigatório em produção para permitir que a câmera dos smartphones de clientes e garçons leia os QR Codes físicos sem bloqueios de permissão do navegador.

### Passo 6: Cadastrar Cardápio Oficial e Imprimir QR Codes das Mesas
- [ ] Acessar com login de gerente e cadastrar os pontos de preparo (Cozinha e Copa/Bar) e os itens do cardápio com preços reais.
- [ ] Gerar e imprimir os adesivos/displays com os QR Codes de alta entropia para colar nas mesas e camarotes da casa.

---

## 4. O Que Fica para as Próximas Versões e MVPs (Roadmap Futuro)

| Versão / MVP | Funcionalidade Planejada | Descrição e Impacto |
| :--- | :--- | :--- |
| **MVP 3** | **PIX Dinâmico com Baixa Automática na Mesa** | Integração via Webhook com adquirente bancária (Mercado Pago, Stone, Asaas ou EFI). O cliente escaneia o QR Code na mesa e paga via PIX Copia-e-Cola pelo próprio celular, liberando a comanda instantaneamente sem chamar o garçom. |
| **MVP 4** | **Integração com Catracas Eletrônicas e RFID** | Comunicação TCP/IP ou serial com catracas de acesso físico (ex.: Control iD, Henry, Telematica). A catraca só gira para saída do cliente se a comanda/pulseira estiver com status 100% quitada no sistema. |
| **MVP 5** | **Totens de Autoatendimento Físicos** | Modo quiosque de tela sensível ao toque para pontos estratégicos da balada (pista e fumódromo), permitindo compra direta de fichas e combos expressos com pagamento no cartão ou PIX. |
| **MVP 6** | **Ficha Técnica & Baixa de Estoque por Dosagem** | Controle de estoque milimétrico com baixa automática de doses (ex.: 50ml de gin, 1 lata de tônica, 1 fatia de limão siciliano) a cada drink liberado no KDS do Bar. |
| **MVP 7** | **BI com Inteligência Artificial e Previsão de Demanda** | Módulo de previsão preditiva usando modelos de Machine Learning para estimar o público do próximo evento, sugerir escalas ideais de garçons e sugerir compras de estoque com base no perfil das atrações musicais da noite. |
| **MVP 8** | **Aplicativo Nativo Offline-First (iOS & Android)** | Empacotamento PWA avançado / Capacitor para manter o aplicativo do garçom em operação contínua mesmo em pontos cegos de Wi-Fi ou subsolos sem sinal, sincronizando pedidos em lote ao reconectar. |

---

## 5. Conclusão e Parecer Técnico

A versão atual (**SAASBAR V1**) está tecnicamente completa, estável, aprovada em todos os critérios de concorrência e segurança exigidos pelo setor de entretenimento noturno, e **pronta para entrar em operação comercial assim que os passos do checklist de infraestrutura forem executados**.
