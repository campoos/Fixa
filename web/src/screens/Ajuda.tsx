import { Card } from "@/components/ui/card";

const METHOD = [
  { n: "01", tag: "frio", t: "Tenta de cabeça", d: "Responde a questão sem olhar a resposta. O esforço de recuperar é o que cria a memória." },
  { n: "02", tag: "corrige", t: "Compara e corrige", d: "Revela, vê o que faltou e anota o erro com a sua palavra. Erro consciente fixa mais que acerto fácil." },
  { n: "03", tag: "generaliza", t: "Comprime", d: "Resume o tópico em 2–4 frases. O cérebro esmaga o conteúdo no mínimo revisável." },
  { n: "04", tag: "espaça", t: "Revisa no tempo certo", d: "A task volta em intervalos crescentes. Acertou, espaça mais; errou, volta amanhã." },
];
const FAQ = [
  { q: "O que é revisão espaçada?", a: "Revisar cada coisa no intervalo em que você está quase esquecendo. A Fixa usa o sistema Leitner: acertou uma task, ela volta mais longe (1 → 2 → 4 → 7 → 15 → 30 dias); errou, volta amanhã. O que você domina se espaça; o que escorrega insiste." },
  { q: "Preciso saber programar?", a: "Não. Serve pra qualquer assunto, teórico ou prático. As tasks práticas de código são um tipo entre vários." },
  { q: "De onde vem o conteúdo dos temas?", a: "De você + IA. Em 'Novo tema' a Fixa gera um prompt pronto; você cola no ChatGPT/Gemini, ele devolve a trilha em JSON e você importa. Tudo editável depois." },
  { q: "Serve pra passar numa certificação?", a: "É pra isso que nasceu. Você monta a trilha da prova, estuda com o método e a fila de revisão garante que o conteúdo esteja fresco no dia." },
  { q: "Uma task que fiz hoje aparece quando?", a: "Amanhã. Toda task concluída entra na fila com primeira revisão em +1 dia; a partir daí o intervalo cresce a cada acerto." },
  { q: "E se o import der erro perto de um link?", a: "O chat às vezes 'linkifica' uma URL ao copiar e quebra o JSON. Apague o trecho [...](...) e deixe o texto simples, ou peça pro modelo não usar links crus." },
];

export function Ajuda() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Como estudar na Fixa</h1>
        <p className="mt-1 text-sm text-muted-foreground">Não é releitura — é esforço de lembrar. Cada task roda este loop.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {METHOD.map((m) => (
          <Card key={m.n} className="p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-primary">{m.n}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{m.tag}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold">{m.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{m.d}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="text-base font-semibold">Por que funciona (a ciência)</h2>
        <p className="mt-2 text-sm text-muted-foreground">A Fixa não inventou moda — é feita das duas técnicas de estudo com maior evidência científica:</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /><span><b>Recall ativo:</b> tentar lembrar (mesmo errando) grava mais que reler. Por isso a resposta fica escondida até você tentar.</span></li>
          <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /><span><b>Revisão espaçada:</b> rever no intervalo em que você está quase esquecendo fixa de vez. Por isso a fila “Revisar hoje” traz cada task no tempo certo.</span></li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">Num ranking de 10 técnicas (Dunlosky et al., 2013), essas duas foram as únicas de “alta utilidade”. Reler e grifar — o que a maioria faz — ficaram embaixo. Por isso <b>“dominar” aqui não é “marquei feito”</b>: é acertar a task nas revisões até ela graduar.</p>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Dúvidas frequentes</h2>
        <div className="flex flex-col gap-2">
          {FAQ.map((f, i) => (
            <details key={i} className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer list-none p-3.5 text-sm font-medium">{f.q}</summary>
              <p className="px-3.5 pb-3.5 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
