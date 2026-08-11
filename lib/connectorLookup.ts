import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/connectorCrypto";

/** Decrypts a user's own provider key for a single backend call -- never returned to the client. */
export async function getUserProviderKey(userId: string, provider: "openai"): Promise<string | null> {
  const conn = await prisma.userConnection.findUnique({ where: { userId_provider: { userId, provider } } });
  if (!conn) return null;
  try {
    return decryptSecret(conn.encryptedKey);
  } catch {
    return null;
  }
}
