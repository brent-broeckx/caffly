import type { Account } from "@prisma/client";

import type { CoreAccount } from "./types.js";

export function toCoreAccount(account: Account): CoreAccount {
  return {
    id: account.id,
    userId: account.userId,
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId
  };
}
