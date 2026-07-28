// Gera o par de chaves VAPID do push. Roda uma vez; o resultado vai pras env do Render.
// NUNCA commitar a chave privada — ela é o que prova que o push é nosso.
//   node scripts/gen-vapid.mjs
import { generateVapidKeys } from "../push.js";

const { publicKey, privateKey } = generateVapidKeys();
console.log("VAPID_PUBLIC_KEY=" + publicKey);
console.log("VAPID_PRIVATE_KEY=" + privateKey);
console.log("VAPID_SUBJECT=mailto:contato@fixaestudos.com.br");
