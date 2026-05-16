---
name: bigquery-readonly
description: Use ao consultar dados do BigQuery do projeto Vibe (vibe-285a7), incluindo o export GA4/Firebase em analytics_420328317. Define como autenticar via ADC e impõe modo somente-leitura — apenas SELECT, sem DML/DDL, sem mutação de IAM/projeto.
---

# BigQuery somente-leitura — projeto Vibe

Use esta skill **toda vez** que for ler dados no BigQuery do projeto Vibe (exploração, hipóteses do produto, perguntas sobre eventos GA4/Firebase). A credencial usada é o ADC pessoal do usuário, com escopo de Editor — por isso, a skill restringe seu uso a operações **somente de leitura**.

## Configuração fixa

- **Project ID:** `vibe-285a7`
- **Credencial (ADC):** `~/.config/gcloud/application_default_credentials.json`
- **Quota project:** `vibe-285a7` (já configurado via `gcloud auth application-default set-quota-project`)
- **Dataset principal (GA4 export):** `analytics_420328317`
  - Tabelas com shard diário: `events_YYYYMMDD`
  - Intraday: `events_intraday_YYYYMMDD`

## Como executar queries

Sempre prefixe com `GOOGLE_APPLICATION_CREDENTIALS` apontando pro ADC e force `--project_id=vibe-285a7`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json \
  bq --project_id=vibe-285a7 query --nouse_legacy_sql --max_rows=50 \
  'SELECT ... FROM `vibe-285a7.analytics_420328317.events_*` WHERE _TABLE_SUFFIX BETWEEN "20260401" AND "20260430" LIMIT 50'
```

Sempre use Standard SQL (`--nouse_legacy_sql`) e qualifique tabelas com backticks: `` `vibe-285a7.analytics_420328317.events_*` ``.

## OPERAÇÕES PROIBIDAS

A credencial em uso tem `roles/editor`, ou seja, tecnicamente permite escrita. **Você (Claude) não pode usar essa capacidade.** Trate o BigQuery como read-only.

### SQL — apenas `SELECT` (e CTEs `WITH ... SELECT`)

Proibido em qualquer query:
- `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE TABLE`
- `CREATE TABLE`, `CREATE OR REPLACE`, `CREATE VIEW`, `CREATE FUNCTION`, `CREATE PROCEDURE`, `CREATE SCHEMA`, `CREATE MATERIALIZED VIEW`
- `DROP TABLE`, `DROP VIEW`, `DROP DATASET`, `DROP FUNCTION`, `DROP PROCEDURE`
- `ALTER TABLE`, `ALTER VIEW`, `ALTER SCHEMA`
- `GRANT`, `REVOKE`
- `CALL` em procedures que mutem dados
- `EXPORT DATA` (escreve em GCS)

`CREATE TEMP TABLE` e `WITH ... AS (...)` (CTE de sessão) são aceitáveis se forem **só pra estruturar a query** e o resultado final continuar sendo um `SELECT`.

### bq CLI — apenas leitura

Permitido: `bq query` (sem `--destination_table`), `bq ls`, `bq show`, `bq head`.

Proibido sem confirmação explícita do usuário:
- `bq mk` (cria dataset/tabela)
- `bq rm` (remove)
- `bq load` (ingere dados)
- `bq cp` (copia tabela)
- `bq update` (altera schema/metadata)
- `bq extract` (escreve em GCS)
- `bq query --destination_table=...` (materializa resultado)
- `bq insert` (streaming insert)

### gcloud — não mutar projeto/IAM

Proibido sem confirmação explícita do usuário:
- `gcloud iam *` (criar SA, dar role, gerar key)
- `gcloud projects add-iam-policy-binding` / `remove-iam-policy-binding` / `set-iam-policy`
- `gcloud services enable` / `disable`
- `gcloud config set project` (muda contexto global do usuário)

Se o usuário pedir uma dessas, **pare e confirme** antes de executar — explicando o efeito.

## Boas práticas obrigatórias

### 1. Sempre limite o resultado

Use `--max_rows=N` no CLI **e** `LIMIT N` na query. Default: 50 linhas no CLI, 1000 na query.

### 2. Sempre filtre partição em `events_*`

A tabela `events_*` é wildcard sobre todas as datas. Sem filtro, escaneia o histórico inteiro. **Sempre** restrinja com `_TABLE_SUFFIX`:

```sql
WHERE _TABLE_SUFFIX BETWEEN '20260401' AND '20260430'
```

### 3. Use dry-run antes de queries pesadas

Pra qualquer query nova sobre `events_*`, rode `--dry_run` primeiro pra ver bytes processados:

```bash
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json \
  bq --project_id=vibe-285a7 query --nouse_legacy_sql --dry_run \
  'SELECT ...'
```

Se o dry-run reportar **> 1 GB processado**, mostre o número ao usuário e confirme antes de executar.

### 4. Evite `SELECT *` em `events_*`

Cada coluna não selecionada não é cobrada (BigQuery cobra por bytes lidos das colunas). Selecione só o que precisa: `event_name`, `event_timestamp`, `user_pseudo_id`, `event_params`, etc.

### 5. Não persista a credencial fora de `~/.config/gcloud/`

- Não copie `application_default_credentials.json` pra dentro de repos.
- Não passe o conteúdo do JSON em mensagens, prompts ou outputs.
- Não logue `GOOGLE_APPLICATION_CREDENTIALS` com `cat` ou similares.

## Schema GA4 — referência rápida

Tabela: `vibe-285a7.analytics_420328317.events_YYYYMMDD`

Colunas frequentes:
- `event_date` (STRING, YYYYMMDD)
- `event_timestamp` (INT64, micros desde epoch)
- `event_name` (STRING)
- `event_params` (REPEATED STRUCT<key STRING, value STRUCT<string_value, int_value, float_value, double_value>>)
- `user_pseudo_id` (STRING — id anônimo do device/install)
- `user_id` (STRING — id da conta logada, se setado pelo app)
- `user_properties` (REPEATED STRUCT)
- `device.*`, `geo.*`, `app_info.*`, `traffic_source.*`
- `platform` (STRING — ANDROID/IOS/WEB)

Acessar event_param string:
```sql
(SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'screen_name') AS screen_name
```

## Quando não usar esta skill

- Se o usuário pedir pra **escrever, ingerir ou agendar** dados no BigQuery, pare e diga que a skill é read-only — o caminho correto é uma SA dedicada com `bigquery.dataEditor`, criada pelo Cloud Admin (Mori).
- Se o usuário pedir pra **mexer em IAM ou criar SA** no projeto, pare — você não tem `setIamPolicy` e o caminho é Cloud Admin.
