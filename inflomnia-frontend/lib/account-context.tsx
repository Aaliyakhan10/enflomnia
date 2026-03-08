"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { instagramApi } from "./api";

// The fixed demo creator ID — used as the key when connecting via the Instagram page.
// All backend data (reach, comments, workload, scripts, etc.) is keyed to this ID.
const DEFAULT_CREATOR_ID = "demo-creator-001";

interface AccountContextType {
    creatorId: string;
    account: any | null;       // full Instagram account object or null
    isConnected: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
    creatorId: DEFAULT_CREATOR_ID,
    account: null,
    isConnected: false,
    isLoading: true,
    refresh: async () => { },
});

export function AccountProvider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    async function fetchAccount() {
        try {
            const res = await instagramApi.getAccount(DEFAULT_CREATOR_ID);
            setAccount(res.data);
        } catch {
            // 404 = not connected yet
            setAccount(null);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchAccount();
    }, []);

    return (
        <AccountContext.Provider value={{
            creatorId: DEFAULT_CREATOR_ID,
            account,
            isConnected: !!account,
            isLoading,
            refresh: fetchAccount,
        }}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    return useContext(AccountContext);
}
