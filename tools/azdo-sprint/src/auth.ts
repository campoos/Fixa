import { execSync } from "node:child_process";

const KEYCHAIN_SERVICE =
  process.env.AZDO_KEYCHAIN_SERVICE ?? "azdo-pat-grupoltm";

export function getPat(): string {
  if (process.env.AZDO_PAT) return process.env.AZDO_PAT;

  try {
    return execSync(
      `security find-generic-password -a "$USER" -s "${KEYCHAIN_SERVICE}" -w`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  } catch {
    throw new Error(
      [
        `PAT não encontrado no Keychain (service: "${KEYCHAIN_SERVICE}").`,
        `Opções:`,
        `  1) Definir variável de ambiente AZDO_PAT`,
        `  2) Salvar no Keychain:`,
        `     security add-generic-password -a "$USER" -s "${KEYCHAIN_SERVICE}" -w`,
      ].join("\n"),
    );
  }
}
