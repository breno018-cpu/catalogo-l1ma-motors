# 🏍️ Catálogo Digital L1MA Motors & Concessionária Shineray

Catálogo digital moderno, ultrarrápido e sincronizado em **tempo real (Server-Sent Events - SSE)** para showroom, vendas presenciais e atendimento via WhatsApp da **L1MA Motors Multimarcas** e concessionária autorizada **Shineray do Brasil**.

---

## ⚡ Principais Recursos

- **Linha Shineray Completa (69 modelos oficiais):** Fotos oficiais em alta definição, especificações técnicas detalhadas, ciclomotores, scooters, motos urbanas, trail, custom e elétricas.
- **Moldura Fotográfica Inclinada no Carrossel:** Exibição com efeito Polaroid em ângulo natural de 3.5° e badges de categoria:
  - `L1MA MOTORS ELÉTRICAS`
  - `L1MA MOTORS OFF-ROAD`
  - `L1MA MOTORS SEMI-NOVOS`
  - `L1MA MOTORS SHINERAY`
- **Simulador Financeiro em Tempo Real:** Cálculo de entrada flexível e parcelamento em até 21x no cartão de crédito com as taxas reais da maquininha da concessionária.
- **Interatividade 360° & Vídeos Oficiais:** Giro do veículo em 360 graus arrastando o dedo ou mouse e reprodução de vídeos oficiais da montadora.
- **Prévias Ricas no WhatsApp (Open Graph Dinâmico):** Ao compartilhar qualquer link com o código da moto (ex: `/?m=shineray-worker-125` ou `/m/shineray-worker-125`), o WhatsApp puxa a foto oficial em alta resolução, o preço com parcelamento e a descrição comercial automaticamente.
- **API REST & Sincronização em Tempo Real (`/api/sync`):** Qualquer sistema externo (ERP, CRM, Zapier, n8n, painel web) pode controlar preços, promoções com validade, estoque (disponível vs. esgotado), visibilidade e destaques do carrossel em menos de 50ms para todos os visitantes sem precisar dar F5.
- **Assistente IA Integrada (`/api/chat`):** Atendimento automatizado inteligente com IA (Google Gemini ou motor semântico local) para tirar dúvidas de clientes sobre modelos, preços e parcelamento.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado (versão 18 ou superior).

### Inicialização
```bash
# Iniciar o servidor
npm start

# Ou em modo desenvolvimento (com auto-reload ao salvar arquivos)
npm run dev
```

O aplicativo estará disponível em:
- **Catálogo Online:** `http://localhost:5173`
- **Acesso no Celular (mesma rede Wi-Fi):** `http://<SEU_IP_LOCAL>:5173`
- **Painel de Controle:** `http://localhost:5173/admin`

---

## 🔌 API de Integração (`/api/sync`)

### Autenticação
Envie o token `l1ma-dev-token` (ou definido na variável de ambiente `SYNC_TOKEN`):
- Via Header: `Authorization: Bearer <TOKEN>`
- Via URL Query: `http://localhost:5173/api/sync?token=<TOKEN>`
- Via JSON Body: `{"token": "<TOKEN>", ...}`

### Operações Suportadas

```json
// Atualizar Preço ("De / Por"):
{ "action": "price", "id": "shineray-worker-125", "price": 8490, "oldPrice": 9490 }

// Ativar Promoção com Validade:
{ "action": "promo", "id": "shineray-worker-125", "active": true, "label": "R$ 1.000 OFF", "until": "31/12/2026" }

// Controlar Carrossel de Destaque:
{ "action": "hero", "id": "shineray-worker-125", "featured": true, "order": 1 }

// Controlar Estoque (0 = Esgotado):
{ "action": "stock", "id": "shineray-worker-125", "stock": 4 }

// Ocultar / Exibir Modelo:
{ "action": "active", "id": "shineray-worker-125", "value": false }
```

Envio em lote (batch) suportado passando um array `[...]` de operações.

---

## 📂 Estrutura de Arquivos

```
├── data/
│   ├── catalog.json       # Fonte da verdade de todos os produtos cadastrados
│   ├── config.json        # Configurações da loja e taxas da maquininha
│   └── events.json        # Histórico dos últimos 60 eventos de auditoria
├── public/
│   ├── index.html         # Página principal com injeção Open Graph
│   ├── styles.css         # Design system com animações e responsividade
│   ├── app.js             # Lógica do catálogo, filtros e simulação
│   ├── catalog.js         # Espelho estático para funcionamento offline
│   ├── icons.js           # Ícones vetoriais SVG
│   └── assets/            # Imagens e capas locais
├── server.js              # Servidor HTTP nativo, rotas de API, SSE e IA
├── INTEGRACAO.md          # Manual de integração técnica
└── package.json           # Metadados e scripts do projeto
```

---

## 🛡️ Licença
Propriedade de **L1MA Motors Multimarcas**. Todos os direitos reservados.
