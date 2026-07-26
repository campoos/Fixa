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
**E-mail de contato:** a definir — a Play exibe publicamente, decida qual endereço usar.

### Recursos gráficos exigidos

| Item | Formato | Onde está |
|---|---|---|
| Ícone | 512×512 PNG, 32 bits | `web/public/icons/icon-512.png` |
| Gráfico de destaque | 1024×500 PNG | `docs/store/feature-graphic.png` |
| Screenshots de celular | mín. 2, máx. 8 · 16:9 ou 9:16, lado maior ≤ 3840px | `docs/store/screenshots/` |

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

- [ ] Deploy do PWA em produção (manifest, sw, ícones, `/privacidade`, assetlinks).
- [ ] Conta de desenvolvedor criada e paga.
- [ ] Backup do keystore + senha fora da VM.
- [ ] `ANDROID_CERT_FINGERPRINTS` no Render com as duas impressões digitais.
- [ ] E-mail de contato público definido.
- [ ] Screenshots e gráfico de destaque.
- [ ] Voltar do Android (`DESIGN-APP-MODE.md` §4) — não implementado ainda.
