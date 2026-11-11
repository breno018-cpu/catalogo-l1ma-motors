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
| `price` | `{"action":"price", "id":"shineray-worker-125", "price":8490, "oldPrice":9490}` | Atualiza o preço à vista e "de/por". Se baixou, animação e badge de desconto imediato. |
| `promo` | `{"action":"promo", "id":"shineray-worker-125", "active":true, "label":"R$ 1.000 OFF", "until":"31/12/2026"}` | Ativa/desativa promoção com selo e validade. Envie `active:false` para encerrar. |
| `hero` | `{"action":"hero", "id":"shineray-worker-125", "featured":true, "order":1}` | Coloca o modelo no carrossel de destaque do topo na posição desejada. |
| `hero_list` | `{"action":"hero_list", "ids":["shineray-worker-125", "shineray-shi-175"]}` | Define a lista completa e ordem dos modelos do carrossel. |
| `active` | `{"action":"active", "id":"shineray-se1", "value":false}` | Mostra (`true`) ou oculta (`false`) o modelo do catálogo instantaneamente. |
| `stock` | `{"action":"stock", "id":"shineray-worker-125", "stock":0}` | Controla estoque: `0` = Esgotado, `1..2` = Últimas unidades, `>2` = Em estoque. Ou `inStock:false`. |
| `upsert` | `{"action":"upsert", "product":{...}}` | Adiciona um novo modelo ou atualiza dados cadastrais completos. |
| `remove` | `{"action":"remove", "id":"modelo-id"}` | Remove definitivamente o produto do catálogo. |
| `config` | `{"action":"config", "config":{"whatsapp":"5511999999999"}}` | Altera dados gerais da loja ou taxas de parcelamento. |

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
