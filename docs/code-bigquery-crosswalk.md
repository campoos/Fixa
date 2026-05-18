# Cruzamento Código ↔ BigQuery — Vibe

Documento complementar ao [Mapa de Dados BigQuery](./vibe-bigquery-data-map.html). Cruza o que **observamos** no BigQuery (`vibe-285a7.analytics_420328317`) com o que está **instrumentado** no código do `vibe-mobile-app` (React Native + Expo).

> **Fontes:** BQ, range `20260424–20260430` · Repo `vibe-mobile-app` na main em `2026-05-01` · `EVENTS.md` versionado no repo · `src/hooks/useLogEvent.ts`

---

## TL;DR — o que o cruzamento mudou

| Pergunta em aberto | Resposta após cruzamento | Ação |
|---|---|---|
| O param `pin` é PII de auth? | **Não.** É código/cupom de benefício resgatado (`schemas.ts:236`). O PIN de validação de email vai por POST, não como event_param. | Risco baixo. Padronizar nome (snake_case + descritivo, ex: `voucher_pin`). |
| Por que `response_authentication_error` tem 7k ocorrências? | Disparado quando refresh-token falha em `services/api.ts:87`. **`reason` envia `JSON.stringify(error)` completo.** | **Risco PII médio-alto.** Sanitizar antes de enviar. |
| Por que `user_id` GA4 está vazio? | Não há `setUserId()` em lugar nenhum do código. App delega 100% via `digital_account_id` em event_params. | Decidir: (a) chamar `setUserId(user.id)` no login, ou (b) manter como está e documentar como decisão. |
| Por que só 5 user_properties (todas defaults)? | Não há `setUserProperty()` em lugar nenhum. Confirmação total do gap. | Definir conjunto inicial de 5–10 props e instrumentar via `useAuthStore`. |
| `response_general_error` × `general_response_error` — qual é o atual? | **Nenhum dos dois está no código atual.** São legado de versões 1.7.x/1.8.x ainda em campo. | Sem ação no app — eventos vão sumir conforme usuários migrarem para 1.9.x. |
| `lowestBenefitValue`, `isSoldOff`, `campaignName` etc. — origem do camelCase? | Vêm dos **objetos de negócio da API** (mocks confirmam: `mock/missions.ts`, `mock/benefits.ts`). Provavelmente espalhados via `logEvent({...}, missionItem)`. | Curar payload dos `logEvent` — não passar o objeto inteiro. |
| `view_cart` tem só 10 ocorrências, e o resto do funil de e-commerce (`view_item`, `add_to_cart`, `purchase`) está zerado. Bug? | Wrappers `logViewItem`, `logAddToCart`, `logPurchase` etc. existem em `useLogEvent.ts` e são chamados em `ShoppingCart`, `ShoppingCheckout`, `CartContext`. **Telas Shopping são raramente acessadas** (`navigate_shop` = 76 em 10 dias). | Não é bug; é pouco uso da feature. Validar com PM se faz sentido manter o módulo. |
| Os 4 eventos com 1 ocorrência (`benefit_redemption_*`, `benefits_category_filter`, `change_home_tab_context`) são novos ou legados? | **Não estão na main atual** — provavelmente feature branch ainda não merged. | Confirmar com time mobile qual branch está emitindo. |
| `br.com.mercantil.vibe` é fork? | **Não.** Mesmo código, build com `SCHEME=mercantil` (env.js + assets/`{SCHEME}`/). White-label puro. | Sem ação. |

---

## 1. Como o app emite eventos

### Engine: `src/hooks/useLogEvent.ts`

Todos os eventos custom passam por um único hook que monta o nome:

```typescript
let eventFullName = `${event.type}_${event.name}`.toLowerCase();
if (event.from) eventFullName += `_from_${event.from}`;
```

Onde `event.type ∈ ELogEventType` (`navigate`, `send`, `response`, `modal`, `change`) e `event.name ∈ ELogEventName` (`home`, `missions`, `benefits`, `roulette`, etc.). Daí vêm nomes como `navigate_mission_details_from_missions` ou `change_tab_from_benefits`.

### Payload base injetado automaticamente

```typescript
const payload = sanitizeParams({
  ...(event.origin && { origin: event.origin }),
  ...(user?.id && { digital_account_id: user.id }),
  ...eventData,
});
```

→ **`digital_account_id` vem de `useAuthStore().user?.id`** e é anexado quando o usuário está logado. Confirma que esse param é a **chave canônica do user logado** — alinhado com os 264k registros observados no BQ em 3 dias.

### Sanitização

`sanitizeParams` apenas **trunca strings em 99 chars**. Não há redacting de PII, allowlist de keys ou validação de tipos.

### Dev × Prod

```typescript
if (__DEV__) {
  safeLog('[Analytics] ' + eventFullName, payload);  // só console
} else {
  analytics().logEvent(eventFullName, payload);       // Firebase
}
```

→ Builds de desenvolvimento **não poluem o BigQuery**. Os 73k usuários e ~600k eventos/dia são tráfego de produção.

### Limite de 40 caracteres

```typescript
if (eventFullName.length > 40) {
  console.error(`O evento logado "${eventFullName}" deve conter até 40 caracteres.`);
}
```

Validação em runtime, sem bloqueio. Eventos no BQ próximos do limite:
- `navigate_mission_details_from_missions` (38 chars)
- `navigate_mission_acc_from_missions` (35 chars)
- `change_category_from_benefits` (29 chars)

Margem confortável, mas qualquer `_from_X` extra precisa cuidar do total.

### E-commerce — wrappers separados

`useLogEvent` exporta `logViewItem`, `logAddToCart`, `logRemoveFromCart`, `logViewCart`, `logBeginCheckout`, `logPurchase` que injetam `currency: 'BRL'` e `digital_account_id` automaticamente. Usados em `ShoppingProductDetails`, `ShoppingCart`, `ShoppingCheckout`, `CartContext`.

---

## 2. Casos esclarecidos

### 2.1 `pin` — não é PII de auth ✓

| Onde aparece em event_params | Origem no código |
|---|---|
| 5.466 eventos em 3 dias (BQ) | `src/utils/schemas.ts:236` — campo `pin: z.string()` no schema do benefício resgatado |
| Tipo dominante: STRING | `src/hooks/useBenefitsDetails.ts:68` — fallback `pin: 'N/A'` quando benefício resgatado não tem código |

Há outro `pin` no app, em `src/screens/ChangeMailCode/index.tsx` e `ChangeMailCode2/index.tsx`, mas **vai como body do POST `/v1/participants/change-key/validate-pin`, NÃO como event_param**. Confirmado por leitura: nenhum `logEvent` carrega esse pin.

**Conclusão:** o `pin` em event_params é o **código/cupom do voucher** que o vendor aceita pra dar o benefício. Não é credencial de autenticação. Risco baixo, mas:

- O nome é genérico — recomenda-se renomear para `voucher_pin` ou `redemption_code`
- Snake_case já está correto
- Mapeia "qual cupom foi entregue para qual user" — útil pro produto, mas se o BQ vier a ser exposto a mais pessoas, pode ser regulado por LGPD dependendo do tipo de cupom

### 2.2 `response_authentication_error` — risco PII real ⚠

Em `src/services/api.ts:87`, no fallback de refresh-token:

```typescript
} catch (error: any) {
  await analytics().logEvent('response_authentication_error', {
    reason: JSON.stringify(error),
    device_info: JSON.stringify(deviceInfo),
  });
  return null;
}
```

`error` é o erro do axios. `JSON.stringify(error)` em axios errors costuma incluir:
- `error.config.headers` — **Authorization header** (Bearer token), `OCP_APIM_SUBSCRIPTION_KEY`
- `error.config.data` — body completo da requisição (pode ter refresh_token, credenciais)
- `error.config.url` — URL chamada
- `error.response.data` — resposta do servidor (mensagens de erro com IDs internos)
- `error.response.headers` — `set-cookie`, etc.

→ Eventos `response_authentication_error` (6.964 ocorrências em 10 dias) provavelmente carregam **tokens de auth** no campo `reason`. Mesmo que o refresh-token tenha expirado, ele ainda é credencial sensível.

→ **Recomendação alta:** sanitizar antes de enviar. Algo como:
```typescript
reason: JSON.stringify({
  status: error?.response?.status,
  message: error?.message,
  code: error?.code,
}),
```

### 2.3 `user_id` GA4 vazio — confirmado ✓

Grep `(setUserId|setUserProperty|setUserProperties)` no `src/` retorna **zero resultados**. O hook `useLogEvent` não chama `analytics().setUserId(...)` em lugar nenhum. Mesmo no fluxo de login (`useAuthStore`), não há propagação para o SDK Firebase Analytics.

**Decisão pendente:** o GA4 UI usa `user_id` para User-ID Reports e cross-device. Hoje quem se loga em 2 devices conta como 2 users distintos no GA4. Se for relevante:

1. Adicionar `analytics().setUserId(user.id)` no callback de login em `useAuthStore`
2. Adicionar `analytics().setUserId(null)` no logout
3. Manter `digital_account_id` em event_params como redundância

Custo: 1–2 linhas. Ganho: GA4 UI passa a unificar usuários cross-device.

### 2.4 `user_properties` — gap total confirmado ✓

Mesmo grep: zero `setUserProperties` ou `setUserProperty`. Os 5 user_properties que aparecem no BQ (`first_open_time`, `ga_session_id`, `ga_session_number`, `firebase_last_notification`, `_ltv_BRL`) são todos defaults do Firebase + um valor solto.

`_ltv_BRL` (64 ocorrências) provavelmente vem de uma feature interna do Firebase de tracking de LTV — não é setado pelo app explicitamente.

**Recomendação alta:** definir 5–10 properties prioritárias e instrumentar uma vez em `useAuthStore`. Sugestões iniciais que já existem como dados internos:

| Property sugerida | Origem | Valor estratégico |
|---|---|---|
| `user_tier` | Tabela de tiers/segmentos (BFF) | Recortes por segmento sem JOIN |
| `signup_cohort` | `user.created_at` truncado por mês | Cohort analysis nativo no GA4 |
| `partner_scheme` | `configEnv.SCHEME` (white-label) | Separar mercantil vs vibebeneficios sem filtrar app_info.id |
| `has_active_benefit` | API check no app start | Segmentar engaged vs cold |
| `home_state` | Tab default da home (`SPEND` vs `EARN`) | Comportamento de descoberta |

### 2.5 White-label confirmado ✓

`env.js` revela o mecanismo:

```javascript
const scheme = process.env.SCHEME ?? 'vibebeneficios';
const envPath = path.resolve(__dirname, `.env.${scheme}`);
```

Cada `SCHEME` resolve um conjunto distinto de:
- `PACKAGE_NAME` (bundle id, ex: `br.prd.inovaebiz.vibe` ou `br.com.mercantil.vibe`)
- `APP_NAME`, `SLUG`
- `APP_THEME` (lê `assets/${SCHEME}/theme.ttf`)
- Stores URL, ícones, splash, cores

→ É o **mesmo código fonte** com builds distintos. Os 870 users de `br.com.mercantil.vibe` 1.8.11 são clientes do parceiro Mercantil rodando o mesmo app.

→ Para análises canônicas, separar por `app_info.id` e/ou criar uma user_property `partner_scheme`.

---

## 3. Inconsistência de naming — origem dos camelCase

Os params `lowestBenefitValue`, `benefitsQuantity`, `isSoldOff`, `isMapVisible`, `hasSpending`, `isAccomplished`, `isRegular`, `detailImage`, `listImage`, `campaignName`, `quizId` aparecem em event_params com naming camelCase (~1.8k–2.7k ocorrências cada).

Os mocks confirmam que **são campos de objetos de negócio**:

`src/mock/missions.ts`:
```typescript
{
  campaignName: 'Vibe beneficios',
  detailImage: '...',
  hasSpending: false,
  isAccomplished: false,
  isRegular: false,
  listImage: '...',
  quizId: '',
  ...
}
```

`src/mock/benefits.ts` e `src/mock/home-header-showcase.ts`:
```typescript
{
  lowestBenefitValue: 20,
  benefitsQuantity: 1,
  isSoldOff: 0,
  isMapVisible: 1,
  ...
}
```

Estes são objetos vindos da **API do BFF**, com naming camelCase (provavelmente serializado de C# pelo `vibe-bff`). Quando o app faz `logEvent({...}, missionOrBenefitObject)`, todas as keys do objeto entram como event_params.

→ Esses 11 params provavelmente vêm de **2–3 chamadas específicas** de `logEvent` que estão espalhando o objeto inteiro. As ocorrências batem (~1.8k cada) — sugere uma única tela emitindo um único evento por sessão com o mesmo objeto.

→ **Recomendação:** auditar todos os `logEvent` que recebem `eventData` e curar o payload — só passar campos que façam sentido analítico, com naming canônico:

```typescript
// ❌ Antes
logEvent({ ... }, mission);

// ✓ Depois
logEvent({ ... }, {
  mission_id: mission.id,
  mission_type: mission.isRegular ? 'regular' : 'special',
  mission_completed: mission.isAccomplished,
  mission_campaign: mission.campaignName,
});
```

---

## 4. Eventos legados (vão sumir sozinhos)

| Evento no BQ | Ocorrências (10 dias) | No código atual? | Hipótese |
|---|---|---|---|
| `response_general_error` | 627 | ❌ | Versão 1.7.x/1.8.x |
| `general_response_error` | 156 | ❌ | Variante (typo?) de versão antiga |

Distribuição de versões hoje (último range observado):
- 1.9.1: 59k users (78%)
- 1.9.0: 15k users (20%)
- 1.8.x: ~10k users (~12%)
- 1.7.x: ~600 users (<1%)

→ Conforme usuários atualizam, esses eventos somem do BQ naturalmente.

→ **Sem ação no app.** Vale apenas:
1. Filtrar esses eventos em queries de produção (eles não fazem parte do funil canônico)
2. Documentar no `EVENTS.md` que são deprecated

---

## 5. Funil de e-commerce — diagnóstico

A skill `bigquery-readonly` cita `view_cart` com 10 ocorrências em 10 dias. Auditei o restante do funil:

| Evento | No EVENTS.md | Wrapper em useLogEvent.ts | Chamado em | No BQ (24–30/04) |
|---|---|---|---|---|
| `view_item` | ✓ | `logViewItem` | `ShoppingProductDetails:99` | **0** |
| `add_to_cart` | ✓ | `logAddToCart` | `CartContext:72,116` | **0** |
| `remove_from_cart` | ✓ | `logRemoveFromCart` | `CartContext:90,93,118` | **0** |
| `view_cart` | ✓ | `logViewCart` | `ShoppingCart:80` | 10 |
| `begin_checkout` | ✓ | `logBeginCheckout` | `ShoppingCheckout:154` | **0** |
| `purchase` | ✓ | `logPurchase` | `ShoppingCheckout:204` | **0** |

→ **Não é bug de instrumentação** — wrappers existem e são chamados. O funil está zerado porque o **módulo Shopping é raramente acessado**:
- `navigate_shop` = 76 ocorrências em 10 dias (54 users distintos)
- Compare com `navigate_benefits` = 39.450

→ **Recomendação:** validar com PM se o módulo Shopping faz parte do core do produto:
- Se faz: investigar por que tão pouco uso (descoberta? friction de entrada?)
- Se não: avaliar remover os wrappers do `useLogEvent` e o módulo do app

---

## 6. Eventos novos sem documentação

Aparecem no BQ com 1 ocorrência cada, **não estão no `EVENTS.md` nem em greps na main**:

| Evento | Hipótese | Próximo passo |
|---|---|---|
| `benefit_redemption_modal_confirm` | Feature branch (refactor do flow de resgate?) | Confirmar com time mobile |
| `benefit_redemption_success` | Feature branch (mesmo refactor) | Confirmar com time mobile |
| `benefits_category_filter` | Feature branch (filtro novo na lista de benefícios) | Confirmar com time mobile |
| `change_home_tab_context` | Feature branch (refator do `change_tab_from_home`?) | Confirmar com time mobile |

→ Se forem feature branch, antes do merge para main vale alinhar:
- Se `change_home_tab_context` substitui `change_tab_from_home`, deprecar o antigo no `EVENTS.md`
- Documentar os novos no `EVENTS.md`
- Garantir consistência de naming (snake_case + padrão `{type}_{name}_from_{origin}`)

---

## 7. Eventos documentados mas ausentes do BQ

`EVENTS.md` lista alguns eventos que **não existem no BQ** em 10 dias:

| Evento documentado | Status |
|---|---|
| `address_search`, `address_search_error`, `address_search_success` | Em `ShoppingDeliveryAddress`. Zero ocorrências (módulo subutilizado). |
| `navigate_extract` (sem `_from_X`) | Sempre é emitido como `navigate_extract_from_home`. Doc impreciso — o engine sempre injeta `from`. |
| `navigate_category` (sem `_from_X`) | Mesma coisa — sempre vem com `_from_home` ou `_from_benefits`. No BQ aparece como `change_category_from_benefits` (escolha de categoria), não navegação. |
| `modal_benefit_red`, `response_benefit_red` (sem `_from_X`) | Sempre vem com `_from_benefit_det`. Doc deveria refletir isso. |
| `response_roulette` | Wrapper de fallback em `useRouletteRedeem.ts:103` para o caso `redeem_missing_benefit_id`. Não disparou em 7 dias — provavelmente fallback que raramente é exercido. |

→ **Recomendação:** atualizar `EVENTS.md` para usar **nomes completos** (com `_from_X`) já que o engine não permite emitir sem o `from`. Reduz confusão.

---

## 8. Reconciliação evento por evento (52 BQ × código)

### Match perfeito (40 eventos)

Eventos que aparecem no BQ **e** estão no `EVENTS.md` ou no código:

```
navigate_home, navigate_benefits, navigate_benefit_det_from_benefits,
navigate_benefit_det_from_home, navigate_missions, navigate_missions_from_home,
navigate_mission_details_from_missions, navigate_mission_details_from_home,
navigate_mission_acc_from_missions, navigate_roulette, navigate_raffles,
navigate_raffle_det_from_home, navigate_extract_from_home, navigate_shop,
navigate_showcase_from_home, navigate_benefit_opt_from_benefits,
navigate_benefit_opt_from_home, navigate_benefit_red_from_benefits,
navigate_benefits_from_home, navigate_deeplink_from_home,
navigate_deeplink_from_missions,
change_tab_from_home, change_tab_from_benefits, change_tab_from_missions,
change_category_from_benefits,
modal_benefit_red_from_benefit_det, modal_roulette,
send_roulette,
response_benefit_red_from_benefit_det, response_authentication_error,
refresh_authentication_error,
login,
view_cart,
notification_receive, notification_dismiss, notification_open, notification_foreground,
screen_view, session_start, user_engagement, first_open, app_update, app_remove,
firebase_campaign, os_update, app_clear_data
```

### Code-only (chamados no código, não vistos no BQ)

```
view_item, add_to_cart, remove_from_cart, begin_checkout, purchase  (e-commerce — módulo subutilizado)
address_search, address_search_error, address_search_success         (ShoppingDeliveryAddress — módulo subutilizado)
response_roulette                                                     (fallback raro)
```

### BQ-only (no warehouse mas não no código atual)

```
response_general_error, general_response_error                        (legado de versões 1.7.x/1.8.x)
benefit_redemption_modal_confirm, benefit_redemption_success,
benefits_category_filter, change_home_tab_context                     (feature branch?)
```

---

## 9. Recomendações priorizadas

### Tier 1 — segurança (rodar essa semana)

1. **Sanitizar `response_authentication_error`.** O `JSON.stringify(error)` em `services/api.ts:87` provavelmente carrega Authorization header e/ou body com tokens. Substituir por `{ status, message, code }` apenas. **Impacto:** elimina vazamento de credenciais para o BigQuery e GA4 UI.

2. **Auditar param `pin` (cupom).** Confirmar com PM/legal se o código de voucher é considerado dado sensível por LGPD ou se está OK como event_param. Se sensível, mascarar (`pin: pin?.slice(-4)?.padStart(pin.length, '*')`) ou remover.

### Tier 2 — qualidade dos dados (próxima sprint)

3. **Curar payloads que espalham objetos de negócio.** Mapear todos os `logEvent({...}, X)` em que `X` é um objeto de domínio (mission, benefit, showcase) e substituir por payload curado em snake_case.

4. **Padronizar `EVENTS.md`** para usar nomes completos (`navigate_extract_from_home`, não `navigate_extract`). Adicionar nota explicando que o engine sempre injeta `_from_X`.

5. **Documentar os 4 eventos novos** (`benefit_redemption_*`, `benefits_category_filter`, `change_home_tab_context`) no `EVENTS.md` antes do merge da feature branch.

### Tier 3 — habilitar análise (com time de produto)

6. **Implementar `analytics().setUserId(user.id)`** no callback de login em `useAuthStore` + `setUserId(null)` no logout. Habilita User-ID reports no GA4 UI e cross-device.

7. **Definir e instrumentar 5–10 user_properties** (`user_tier`, `signup_cohort`, `partner_scheme`, `has_active_benefit`, `home_state`). Custo: chamadas a `analytics().setUserProperty()` em `useAuthStore` e em alguns hooks.

8. **Validar uso do módulo Shopping.** `navigate_shop` em 76 ocorrências/10 dias é evidência de que a feature está fora do funil principal. Decidir manter, repensar entrada ou aposentar.

### Tier 4 — limpeza (oportunista)

9. Quando todos os usuários estiverem em 1.9.x, remover do `EVENTS.md` referências a `response_general_error` e `general_response_error`.

---

## Apêndice — comandos usados

Todas as queries seguiram a skill `bigquery-readonly` (apenas SELECT, com `_TABLE_SUFFIX` filtrado, dry-run em queries pesadas).

```bash
# Listar event_names com volume
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json \
  bq --project_id=vibe-285a7 query --nouse_legacy_sql --max_rows=200 \
  'SELECT event_name, COUNT(*) AS events, COUNT(DISTINCT user_pseudo_id) AS users
   FROM `vibe-285a7.analytics_420328317.events_*`
   WHERE _TABLE_SUFFIX BETWEEN "20260421" AND "20260430"
   GROUP BY 1 ORDER BY events DESC'

# Verificar se eventos do EVENTS.md existem no BQ
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json \
  bq --project_id=vibe-285a7 query --nouse_legacy_sql --max_rows=20 \
  'SELECT event_name, COUNT(*) AS n
   FROM `vibe-285a7.analytics_420328317.events_*`
   WHERE _TABLE_SUFFIX BETWEEN "20260424" AND "20260430"
     AND event_name IN ("view_item","purchase","add_to_cart","response_roulette",...)
   GROUP BY 1 ORDER BY 2 DESC'
```

E no repo `vibe-mobile-app`:

```bash
grep -rn "logEvent" src --include="*.ts" --include="*.tsx"
grep -rn -E "(setUserId|setUserProperty)" src --include="*.ts" --include="*.tsx"
grep -rn -E "[\"']pin[\"']" src --include="*.ts" --include="*.tsx"
```
