// Play Billing dentro do app Android (TWA). Fora dele nada disto existe: no Chrome e no PWA
// o getDigitalGoodsService não é definido, então tudo aqui devolve null e a tela Plano segue
// exatamente como está hoje (DESIGN-APP-MODE §3). É essa guarda que mantém a web intacta.
//
// A cobrança é do Google, não nossa: o preço exibido tem que ser o que a Play devolve em
// getDetails — é exigência de política e evita divergir do que o usuário vai pagar.

const BILLING = "https://play.google.com/billing";

export type ItemPlay = {
  itemId: string;
  title: string;
  price: { currency: string; value: string };
};

type Serviço = {
  getDetails(ids: string[]): Promise<ItemPlay[]>;
  listPurchases(): Promise<{ itemId: string; purchaseToken: string }[]>;
};

type JanelaComPlay = Window & {
  getDigitalGoodsService?: (metodo: string) => Promise<Serviço>;
};

/** O serviço só existe dentro do TWA com playBilling ligado. null = não é app, ou é app velho. */
export async function servicoPlay(): Promise<Serviço | null> {
  const w = window as JanelaComPlay;
  if (typeof w.getDigitalGoodsService !== "function") return null;
  try { return await w.getDigitalGoodsService(BILLING); } catch { return null; }
}

/** Preço vindo do catálogo da Play. Lista vazia = produto não existe/não publicado ainda. */
export async function precoDoPlano(svc: Serviço, sku: string): Promise<ItemPlay | null> {
  try { return (await svc.getDetails([sku]))[0] || null; } catch { return null; }
}

/**
 * Compra pelo checkout nativo. Devolve o purchaseToken — que sozinho não vale nada: quem
 * transforma em plano é o /api/billing/play/verify, conferindo na Play Developer API.
 * null = a pessoa fechou o checkout (não é erro, é desistência).
 */
export async function comprar(sku: string, oferta: string | null): Promise<string | null> {
  if (typeof PaymentRequest !== "function") return null;
  const metodo = {
    supportedMethods: BILLING,
    // o offerId sai do servidor (founderOpen): é ele que decide quem ainda pega preço de
    // fundador. Sem oferta, a compra cai no preço do base plan.
    data: oferta ? { sku, offerId: oferta } : { sku },
  };
  // o total é ignorado pelo Play Billing (quem cobra é o Google, com o preço do Console),
  // mas o PaymentRequest exige o campo
  const req = new PaymentRequest([metodo], { total: { label: "Fixa Pro", amount: { currency: "BRL", value: "0" } } });
  const resp = await req.show();
  const token = (resp.details as { purchaseToken?: string })?.purchaseToken || null;
  await resp.complete(token ? "success" : "fail");
  return token;
}

/** Compra que ficou pendurada (app fechou antes do verify). Recupera pra não perder o Pro pago. */
export async function compraPendente(svc: Serviço, sku: string): Promise<string | null> {
  try {
    const compras = await svc.listPurchases();
    return compras.find((c) => c.itemId === sku)?.purchaseToken || null;
  } catch { return null; }
}
