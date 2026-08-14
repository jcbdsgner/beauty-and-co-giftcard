"use client";

import { useEffect, useState } from "react";
import { type Account, type AccountInfo, defaultAccountInfo } from "@/lib/account/types";

// Same localStorage key as b&co's mock (see docs/userflow.md decision #6/#8): no
// real shared-auth backend exists yet, but this keeps the two demos' account
// shape compatible for when a real SSO backend lands behind a shared domain.
const ACCOUNT_KEY = "bco-account";
const ACCOUNT_EVENT = "bco-account-changed";

function readAccount(): Account | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACCOUNT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Account;
  } catch {
    return null;
  }
}

function writeAccount(account: Account): void {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  window.dispatchEvent(new Event(ACCOUNT_EVENT));
}

export function isLoggedIn(): boolean {
  return readAccount()?.connected ?? false;
}

/** No real auth backend — any email/password on /connexion "succeeds" (mock, matches b&co). */
export function login(patch: Partial<AccountInfo> = {}): void {
  const existing = readAccount();
  writeAccount({ ...(existing ?? { ...defaultAccountInfo, connected: false }), ...patch, connected: true });
}

export function logout(): void {
  const existing = readAccount();
  if (!existing) return;
  writeAccount({ ...existing, connected: false });
}

/** Reactive account state; `null` until the initial client-side read completes. */
export function useAccount(): Account | null {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const sync = () => setAccount(readAccount() ?? { ...defaultAccountInfo, connected: false });
    sync();
    window.addEventListener(ACCOUNT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ACCOUNT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return account;
}
