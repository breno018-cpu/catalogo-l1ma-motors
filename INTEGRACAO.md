# L1MA Motors — API & Integração de Catálogo

## Servidor
```bash
node server.js
```
- **Catálogo Online:** `http://localhost:5173`
- **Painel de Teste:** `http://localhost:5173/admin`
- **Token Padrão:** `l1ma-dev-token` (ou variável de ambiente `SYNC_TOKEN`)

---

## Como Integrar com seu Outro Sistema

O endpoint `POST /api/sync` permite que qualquer outro sistema (painel web, ERP, CRM, webhook) controle os produtos em tempo real com propagação instantânea via Server-Sent Events (SSE).

### Autenticação
Envie o token de qualquer uma das 3 formas:
1. Header: `Authorization: Bearer l1ma-dev-token`
2. URL Query: `http://localhost:5173/api/sync?token=l1ma-dev-token`
3. Corpo JSON: `{"token": "l1ma-dev-token", ...}`

---

## Ações Suportadas

| Ação | Parâmetros | Efeito no Catálogo |
|---|---|---|
| `order` | `{"action":"order", "id":"shineray-worker-125", "order":1}` | Define a posição exata de exibição da moto no catálogo (`#1`, `#2`, etc.). |
| `reorder` | `{"action":"reorder", "ids":["shineray-worker-125", "shineray-worker-cross-150", "shineray-jet-125ss-efi"]}` | Reordena toda a listagem de motos na sequência exata enviada no array. |
| `desc` | `{"action":"desc", "id":"shineray-worker-125", "desc":"A clássica café racer..."}` | Altera a descrição do modelo (usada nos cards do WhatsApp, carrossel, modal e IA). |
| `price` | `{"action":"price", "id":"shineray-worker-125", "price":8490, "oldPrice":9490}` | Atualiza o preço à vista e "de/por". Se baixou, animação e badge de desconto imediato. |
| `promo` | `{"action":"promo", "id":"shineray-worker-125", "active":true, "label":"R$ 1.000 OFF", "until":"31/12/2026"}` | Ativa/desativa promoção com selo e validade. Envie `active:false` para encerrar. |
| `hero` / `carousel` | `{"action":"carousel", "id":"shineray-worker-125", "featured":true, "order":1}` | Coloca o modelo no carrossel de destaque do topo na posição desejada. |
| `hero_list` / `carousel_list` | `{"action":"carousel_list", "ids":["shineray-worker-125", "shineray-jet-125ss-efi"]}` | Define a lista completa e ordem dos modelos do carrossel do topo. |
| `active` | `{"action":"active", "id":"shineray-se1", "value":false}` | Mostra (`true`) ou oculta (`false`) o modelo do catálogo instantaneamente. |
| `stock` | `{"action":"stock", "id":"shineray-worker-125", "stock":0}` | Controla estoque: `0` = Esgotado, `1..2` = Últimas unidades, `>2` = Em estoque. Ou `inStock:false`. |
| `create` / `add` / `upsert` | `{"action":"create", "id":"...", "brand":"Shineray", "name":"...", "cat":"shineray", "price":12990, ...}` | Cadastra um novo modelo de moto ou atualiza dados cadastrais existentes. |
| `remove` | `{"action":"remove", "id":"modelo-id"}` | Remove definitivamente o produto do catálogo. |
| `config` | `{"action":"config", "config":{"whatsapp":"5511999999999"}}` | Altera dados gerais da loja ou taxas de parcelamento. |

---

## Por Que a Descrição (`desc`) Existe e Onde Ela é Usada?

O campo `desc` é fundamental na plataforma L1MA Motors porque alimenta simultaneamente 4 pontos estratégicos de conversão de vendas:

1. **Card Dinâmico do WhatsApp (Open Graph):** Quando o cliente ou vendedor compartilha o link de uma moto (ex: `https://seusite.com/?m=shineray-worker-125`), o WhatsApp gera automaticamente o balão interativo com a foto da moto, o título oficial e a **descrição cadastrada**. Uma boa descrição aumenta radicalmente a taxa de cliques.
2. **Modal de Detalhes Completo:** Ao clicar no card da moto, a janela modal de alta conversão exibe essa descrição em destaque logo abaixo das fotos e do preço, convencendo o cliente com os pontos fortes do produto.
3. **Banner Principal (Carrossel do Topo):** Se o modelo estiver no carrossel de destaque (`hero`), o parágrafo de chamada do slide exibe exatamente essa descrição em tipografia premium.
4. **Inteligência Artificial de Atendimento:** O motor de IA (`/api/chat`) usa o campo `desc` para responder perguntas de clientes sobre a moto (autonomia, proposta, conforto, economia, estilo).

---

## Exemplo de Envio em Lote (cURL)

```bash
curl -X POST http://localhost:5173/api/sync \
  -H "Authorization: Bearer l1ma-dev-token" \
  -H "Content-Type: application/json" \
  -d '[
    {"action":"price", "id":"shineray-worker-125", "price":8490, "oldPrice":9490},
    {"action":"promo", "id":"shineray-worker-125", "active":true, "label":"R$ 1.000 OFF", "until":"31/12/2026"},
    {"action":"hero", "id":"shineray-worker-125", "featured":true, "order":1},
    {"action":"stock", "id":"shineray-worker-125", "stock":5}
  ]'
```

---

## Leitura dos Dados
- `GET /api/catalog` — Retorna produtos, marcas, configurações e histórico.
- `GET /api/stream` — Conexão SSE para escutar alterações em tempo real.
