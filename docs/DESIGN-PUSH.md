# DESIGN-PUSH — a notificação assume o dia a dia, o e-mail vira evento

Emenda ao [DESIGN-LEMBRETES-V2](DESIGN-LEMBRETES-V2.md). O que vale lá continua valendo — em
especial o §4 (as leis de tom: zero culpa, zero mascote, streak só quando vivo, nada de FOMO
social). Aqui muda **por onde** o lembrete chega e **com que régua**.

Decisão do dono (28/07/2026), duas frases:
- permissão pedida **na primeira abertura**, com casa fixa em Ajuda pra quem recusar;
- **e-mail deixa de ser diário** e passa a sair em evento pontual; a notificação assume o dia
  a dia e "pode ser um teco mais chata".

---

## 1. Por que dois canais, e não um

E-mail diário é caro em atenção e barato em resposta: chega na caixa junto de mais quarenta,
e a chance de ser aberto na hora em que a fila importa é pequena. Notificação mora no aparelho
e custa um toque pra ignorar — é o canal certo pra um lembrete de rotina.

O inverso também vale: notificação é péssima pra assunto que exige leitura (a fila cresceu, a
prova está perto, "vou parar de te lembrar"). Isso é e-mail.

Daí a divisão:

| canal | carrega | régua |
| --- | --- | --- |
| **push** | o lembrete do dia | diário até 13 dias parado; 21 e 28 em modo guardado; depois silêncio |
| **e-mail** | os momentos que pedem leitura | só evento (§3) |

---

## 2. Push — cadência e slots

`pushCadence(diasParado)` em `reminders.js`:

- `0–13` → **daily**. O e-mail parava no dia 7; o push segue até o 13 — é o "teco mais chata".
- `14–20`, `29+` → **silent**.
- `21`, `28` → **weekly**, mensagem de fila guardada.

Dois slots por dia, ambos no mesmo cron:

- **manhã** (`?slot=manha`, ~08h23 BRT): o toque do dia. É o único que também manda e-mail.
- **noite** (`?slot=noite`, ~20h37 BRT): só dispara pra quem **não teve nenhuma atividade hoje**
  e ainda tem fila. Constata que a fila está aberta; nunca cobra, nunca cita sequência.

Teto: **2 toques por dia**, e o segundo só existe quando o primeiro não virou sessão. Se a
pessoa estudou, a noite não fala nada.

---

## 3. E-mail — a lista fechada de eventos

`emailEvent({ diasParado, daysLeft, hasPush, ymd })` devolve o evento ou `null`. Tudo derivado,
sem contador persistido novo — cada evento dispara sozinho e se reseta quando há sessão:

| evento | quando | por quê |
| --- | --- | --- |
| `retorno` | 3º dia sem sessão | a fila cresceu e o modo dose vai entrar — cabe explicar, uma vez |
| `prova` | faltando 7 e faltando 1 dia | a régua muda (fila cheia, sem dose): é informação, não cutucada |
| `pause-notice` | 7º dia | igual v2: aviso honesto de que os lembretes vão espaçar |
| `weekly` | 14, 21, 28 | igual v2 |
| `monthly` | 58, 88 | igual v2 |
| `semanal` | segunda-feira, **só pra quem não tem push** | quem recusou a notificação não fica no vácuo |

Fora disso, o e-mail cala. Quem tem push ativo e estuda no ritmo pode passar meses sem receber
nenhum — e é esse o objetivo.

---

## 4. Leis (as do v2 §4, mais três do canal novo)

1. **Nada de payload no push.** O servidor manda o toque vazio; o service worker busca o
   conteúdo em `/api/push/payload` na hora de mostrar. Se a fila foi fechada entre o disparo e
   a entrega, a notificação diz "fila do dia fechada" em vez de repetir número velho.
2. **Uma tag por assunto** (`fixa-dia`, `fixa-noite`): notificação nova substitui a anterior.
   Bandeja com três lembretes empilhados é ruído, não insistência.
3. **O segundo toque é constatação, não cobrança.** "A fila de hoje ainda está aberta" pode;
   qualquer variação de "você não fez" não pode.

E as que já valiam: sem culpa, sem mascote, sem terror de sequência (sequência viva se
celebra, zerada nem se menciona), sem FOMO social.

---

## 5. Permissão — pré-pedido, e uma casa pra quem recusa

A caixa do navegador só aparece **depois de um sim na tela**. O convite fica na zona "hoje"
da Home, na mesma linguagem tracejada do convite de prova (DESIGN-ENGAJAMENTO §E1), e só na
primeira abertura: some quando a permissão já foi respondida, quando o aparelho já está
inscrito, ou por 14 dias se a pessoa tocar "agora não".

Dois convites tracejados nunca aparecem juntos — o da notificação passa na frente, e o da
prova volta na visita seguinte.

**Ajuda › lembretes** é a casa definitiva: liga/desliga a notificação do aparelho, explica em
uma frase o que o e-mail virou, e tem o interruptor geral (`remindersOn`) — desligado ali,
nenhum canal fala. O link assinado do rodapé do e-mail continua funcionando; o que não existia
era o caminho de volta.

Quando a permissão está bloqueada no navegador, a tela diz isso e onde reverter, em vez de
oferecer um botão que não faz nada.

---

## 6. Implementação

| arquivo | papel |
| --- | --- |
| `push.js` | VAPID (JWT ES256) + envio sem payload + detecção de inscrição morta (404/410). Zero dependência nova. |
| `scripts/gen-vapid.mjs` | gera o par de chaves. Roda uma vez; a privada **nunca** entra no repo. |
| `reminders.js` | `pushCadence`, `emailEvent`, `buildPush` + as copies dos eventos novos. Puro e testado. |
| `server.js` | `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/payload`, `/api/reminders/prefs`; o cron passa a receber `slot`. |
| `web/public/sw.js` | handlers `push` e `notificationclick` (reaproveita a janela aberta em vez de abrir outra). |
| `web/src/lib/push.ts` | suporte, estado, ligar/desligar e a ressincronização silenciosa. |
| `web/src/screens/Home.tsx` | o pré-pedido da primeira abertura. |
| `web/src/screens/Ajuda.tsx` | a seção "lembretes". |
| `.github/workflows/reminders.yml` | dois horários; o da noite manda `slot=noite`. |
| `android/` | `enableNotifications: true` + `POST_NOTIFICATIONS` + ícone de status branco (o gerado pelo bubblewrap era colorido e viraria quadrado branco na barra). |

Inscrições moram em `u.push` (lista de `{ endpoint, ua, addedAt }`, teto de 8 aparelhos). Não
existe flag `pushOff`: lista vazia = sem push. `remindersOff` continua soberano sobre os dois.

### Variáveis de ambiente (Render)

```
VAPID_PUBLIC_KEY=…     # vai pro navegador; pode aparecer no bundle
VAPID_PRIVATE_KEY=…    # segredo — só no Render
VAPID_SUBJECT=mailto:contato@fixaestudos.com.br
```

Sem elas o push some por inteiro: `/api/config` devolve `pushKey` vazio, a seção de Ajuda não
aparece e o cron manda só os e-mails de evento. **Trocar o par depois de publicado invalida
todas as inscrições existentes** — cada aparelho só volta a receber quando reabrir o app.

---

## 7. Checklist de aceite

- [x] cadência do push acaba (silêncio depois de 28 dias parado) — não é lembrete eterno
- [x] e-mail nunca sai no dia a dia de quem tem push
- [x] quem não tem push recebe um resumo por semana, na segunda
- [x] fila vazia não vira notificação
- [x] no modo retorno, a manchete é a dose — nunca o total
- [x] slot da noite só pra fila intocada, e sem cobrança no texto
- [x] sequência zerada não aparece em nenhuma copy
- [x] inscrição morta (404/410) some sozinha na próxima rodada
- [x] `remindersOff` cala os dois canais
- [x] JWT VAPID verificável pela chave pública do par (teste)
