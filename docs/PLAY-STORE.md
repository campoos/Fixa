# PLAY-STORE.md — publicar o Fixa na Google Play

O app Android é um **TWA** (Trusted Web Activity): um app nativo fino que abre o
`fixaestudos.com.br` em tela cheia, sem barra de navegador. O produto continua sendo
um só — o que sai no Fixa web sai no app no mesmo deploy, sem passar pela revisão da
loja. O que a loja revisa é o invólucro.

---

## 1. A chave de assinatura (leia antes de tudo)

`android/android.keystore` (alias `fixa`) é a identidade do app na Play **para sempre**.

- **Perdeu a chave = não existe mais atualização desse app.** Só resta publicar outro
  app, com outra listagem, do zero.
- Ela está fora do git (`android/.gitignore`) e **precisa de backup fora desta VM**:
  gerenciador de senhas ou cofre. Junto com ela, a senha do keystore.
- A senha está em `.secrets.env` na raiz do projeto (também fora do git), junto das
  demais credenciais. Esse arquivo é backup, não runtime — o servidor local roda com
  `--env-file=.env`, porque o `.secrets.env` carrega o Upstash de **produção**.
- Impressão digital SHA-256 da chave de upload:
  `7D:0E:A7:FE:AE:D5:3E:FF:57:81:66:B8:57:8A:A5:92:BE:AD:CB:08:FF:38:03:1C:BA:08:6D:5C:5B:92:2C:AF`

### Play App Signing (o passo que quase todo mundo esquece)

Ao criar o app no Play Console, o Google gera **outra** chave, com a qual ele assina o
que chega no aparelho do usuário. A sua vira só "chave de upload". Consequência direta:
o `assetlinks.json` do site precisa listar **as duas** impressões digitais, senão o app
instalado pela loja abre com a barra do navegador por cima (é o sintoma clássico).

Depois de subir o primeiro AAB, em **Play Console → Configuração → Integridade do app**,
copie o SHA-256 do certificado de assinatura do app e adicione no Render:

```
ANDROID_CERT_FINGERPRINTS=<sha256 da chave de upload>,<sha256 do Play App Signing>
```

O servidor já serve `/.well-known/assetlinks.json` a partir dessa variável — não precisa
de deploy de código, só reiniciar o serviço. Confira o resultado abrindo
`https://fixaestudos.com.br/.well-known/assetlinks.json`.

---

## 2. Gerar o pacote

Pré-requisitos já instalados nesta VM: JDK 17, Android SDK em `/root/android-sdk`,
`@bubblewrap/cli` global, config em `~/.bubblewrap/config.json`.

```bash
cd /root/git/engagement/fixa/android
BUBBLEWRAP_KEYSTORE_PASSWORD=<senha> BUBBLEWRAP_KEY_PASSWORD=<senha> bubblewrap build
```

Saída: `app-release-bundle.aab` (é esse que sobe na Play) e `app-release-signed.apk`
(instalação direta, para testar no aparelho antes de publicar).

Para testar no celular sem loja: transfira o `.apk`, permita "instalar de fonte
desconhecida" e abra. Enquanto o `assetlinks.json` não estiver publicado com a
impressão digital certa, o app abre com barra de navegador — é assim que se verifica
se a verificação de domínio funcionou.

**Toda atualização do invólucro** (ícone, nome, versão do TWA) exige subir um AAB novo
com `appVersionCode` maior — o Bubblewrap incrementa sozinho a cada build. Mudança no
site não exige nada disso.

---

## 3. Conta e faixas de teste

- Conta de desenvolvedor: **US$ 25**, pagamento único, em play.google.com/console.
- Contas **pessoais criadas a partir de nov/2023** têm exigência extra antes de
  publicar em produção: **12 testadores participando por 14 dias seguidos** em teste
  fechado. Não dá pra pular. Se a conta for de organização (com CNPJ e validação
  D-U-N-S), essa exigência não se aplica.
- Ordem prática: teste interno (imediato, até 100 pessoas) → teste fechado (a contagem
  dos 14 dias) → produção.

### Os 12 testadores, na prática

O relógio dos 14 dias **só começa** com o app publicado na faixa de teste fechado e as
12 contas já inscritas nela. Testar o PWA antes não conta pra Play — conta pro produto,
que é motivo suficiente pra mandar `https://fixaestudos.com.br/app` pra essas pessoas
desde já e chegar no teste fechado sem bug bobo.

O que se cadastra é uma **lista de e-mails** (direta ou via grupo do Google); só quem
está nela enxerga o app. O convite não sai automático: a Play gera um link de opt-in que
**você** distribui, a pessoa aceita e aí o app aparece na Play Store dela.

> Armadilha: o e-mail tem que ser a conta Google **logada na Play Store do celular**
> dela. Se for outra, o link responde "app não disponível" e parece defeito do app.
> Ao pedir, peça exatamente assim: "me manda o Gmail que tá logado na Play Store do teu
> celular".

---

## 4. Ficha da loja

**Nome:** `Fixa: Estude e Memorize` (30 caracteres é o teto)

**Descrição curta** (80 caracteres):
`Recall ativo e revisão espaçada pra chegar na prova sabendo de verdade.`

**Descrição completa** (rascunho, 4000 caracteres de teto):

```
Reler não é estudar. O que fixa é tentar lembrar antes de olhar a resposta — e voltar
no conteúdo no intervalo certo, antes de esquecer.

O Fixa organiza isso pra você:

• Trilha por tema — cada tema vira uma sequência de tarefas curtas, na ordem certa.
• Recall em dois estágios — você tenta responder de cabeça, vê os pontos-chave e só
  então compara com a resposta completa.
• Revisão espaçada — 1, 2, 3, 4, 7, 15 e 30 dias. O app devolve o que está pra
  esquecer, no dia em que está pra esquecer.
• Data da prova — a fila de revisões se ajusta pro tempo que você ainda tem.
• Tutor — correção com nota, o que você acertou e o que faltou.
• Lembrete diário — no horário certo, e você desliga quando quiser.

Feito pra quem tem prova com data: certificação, concurso, faculdade.

Grátis pra usar, com revisões diárias ilimitadas.
```

**Categoria:** Educação · **Tags:** estudo, memorização, revisão
**Política de privacidade:** `https://fixaestudos.com.br/privacidade`
**E-mail de contato:** `contato@fixaestudos.com.br` (exibido publicamente pela Play e na política de privacidade — precisa de encaminhamento configurado no domínio pra cair numa caixa que você lê).

### Recursos gráficos exigidos

| Item | Formato | Onde está |
|---|---|---|
| Ícone | 512×512 PNG, 32 bits | `web/public/icons/icon-512.png` |
| Gráfico de destaque | 1024×500 PNG | `docs/store/feature-graphic.png` |
| Screenshots de celular | mín. 2, máx. 8 · 16:9 ou 9:16, lado maior ≤ 3840px | `docs/store/frames/` — **é isso que sobe** |

Os prints crus (`docs/store/screenshots/`) são matéria-prima: o que vai pra ficha é a versão
emoldurada em `docs/store/frames/`, com headline em cima de cada tela. Suba **nesta ordem**:
home → lição → revisar → trilha → plano (a Play respeita a ordem do console, não o nome do
arquivo). Especificação, medições e o que não fazer: `docs/DESIGN-STORE-PRINTS.md`.

---

## 5. Formulário de Segurança de Dados

Respostas coerentes com o que o app faz hoje (a política em `/privacidade` é a fonte):

- **Coleta dados?** Sim.
- **Dados pessoais:** nome e e-mail — para funcionalidade do app e gerenciamento de
  conta. Obrigatórios. Não compartilhados com terceiros para publicidade.
- **Conteúdo do usuário:** textos que a pessoa escreve (temas, respostas, anotações).
  Enviados à API do Gemini apenas quando ela usa geração ou correção por IA.
- **Dados criptografados em trânsito:** sim (HTTPS).
- **Usuário pode pedir exclusão:** sim, por e-mail.
- **Publicidade / rastreamento entre apps:** não. Não há SDK de anúncios.
- **Localização, contatos, arquivos, câmera, microfone:** não são acessados.

---

## 6. Pagamentos — por que o app não vende nada

A Play exige **Google Play Billing** para venda de conteúdo digital consumido no app,
e reprova CTA ou link que leve a checkout externo. Por isso, em modo app:

- a aba se chama **Plano**, não Pro;
- não há preço, botão de assinar, lista de espera nem menção a meio de pagamento;
- quem já é Pro continua vendo o status da conta.

Isso está implementado atrás de `isAppMode` (`web/src/lib/app-mode.ts`) e especificado
em `docs/DESIGN-APP-MODE.md` §3. Quando o Play Billing entrar, o CTA volta **só no app**
e passa a usar a cobrança do Google (que fica com 15% do primeiro US$ 1M/ano).

---

## 7. Pendências antes de publicar

Feito:

- [x] Deploy do PWA em produção (manifest, sw, ícones, `/privacidade`, assetlinks).
- [x] Verificação de domínio confirmada na API do Google (`digitalassetlinks.googleapis.com`)
      para `br.com.fixaestudos.app` com a impressão digital da chave de upload.
- [x] AAB e APK assinados a partir do manifesto de produção.
- [x] Voltar do Android (`DESIGN-APP-MODE.md` §4) — camadas de histórico, 22/22 no teste
      com Chrome de verdade dirigindo `history.back()`.
- [x] Screenshots de celular (5, 1080×1920) e gráfico de destaque — refeitos depois de
      `3c7fb21`, com o rodapé simétrico e sem a faixa clara.
- [x] AAB e APK reconstruídos a partir do manifesto atual (26/07 20:42): splash confere
      pixel a pixel com `app/src/main/res/`, assinatura `7d0ea7fe…922caf` bate com o
      `assetlinks.json` em produção. (Comparar **pixels**, não tamanho de arquivo: o
      aapt2 recomprime os PNGs e o byte count sempre difere da origem.)
- [x] Conta de desenvolvedor criada e paga — pessoal, ID `8488305067244215434`.

Falta — e cada um depende de uma decisão ou de uma conta que é sua:

- [ ] **Conta de desenvolvedor** criada e paga (US$ 25) em play.google.com/console.
- [ ] **Backup do keystore + senha** fora da VM (sem isso, o app não tem futuro — §1).
- [ ] **Encaminhamento de `contato@fixaestudos.com.br`** ativo — o endereço já está na
      política de privacidade e vai na ficha da loja; falta garantir que chega em você.
- [ ] **`ANDROID_CERT_FINGERPRINTS` no Render** com as duas impressões digitais — só dá
      pra fazer depois do primeiro AAB subir, porque a segunda chave nasce lá (§1).

---

## 8. Testar no celular antes de subir na loja

Três caminhos, do mais rápido ao mais parecido com o que o usuário final recebe.

### a) PWA pelo Chrome do Android — 30 segundos, sem arquivo nenhum

Abra `https://fixaestudos.com.br/app` no Chrome do celular → menu (⋮) → **Instalar app**.
Vira ícone na tela inicial e roda em tela cheia, no mesmo "modo app" do TWA: sem landing,
login em tela cheia, aba Plano sem CTA de compra. Testa o produto inteiro. O que ele
**não** testa é o invólucro: ícone da Play, splash nativo e a verificação de domínio.

### b) APK direto (sideload) — testa o invólucro de verdade

O `.apk` está assinado com a chave de upload, cuja impressão digital já está publicada em
`/.well-known/assetlinks.json`. Ou seja: instala e abre **sem a barra do navegador** —
é exatamente o app da loja, só que fora dela.

Na sua máquina (não na VM):

```bash
scp root@72.62.133.194:/root/git/engagement/fixa/android/app-release-signed.apk ~/Downloads/fixa.apk
```

Depois passe o arquivo pro celular (cabo, Drive, ou mande pra você mesmo), toque nele e
autorize "instalar de fonte desconhecida". Sinal de que a verificação de domínio deu
certo: **nenhuma barra de endereço no topo**. Se aparecer barra, o `assetlinks.json` não
bateu — confira a impressão digital do §1.

### c) Teste interno da Play — o mais fiel

Depois da conta criada: **Play Console → Testes → Teste interno**, sobe o `.aab`, adiciona
seu e-mail na lista e instala pelo link que a própria loja gera. Aqui já entra o Play App
Signing, então é o momento de pegar o segundo SHA-256 e completar o
`ANDROID_CERT_FINGERPRINTS` (§1). Vale até 100 testadores e não tem espera de revisão.

> **Expo/React Native não entra nessa história.** O Fixa é web (React + Vite) embrulhado
> num TWA — o app roda o site de verdade. Fazer versão Expo seria reescrever o produto
> em React Native e manter dois códigos. Pra testar antes da loja, (a) e (b) acima já
> dão o mesmo que um build de desenvolvimento daria.
