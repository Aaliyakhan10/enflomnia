"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { instagramApi } from "./api";
import { useUser } from "./user-context";

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
    const { user, isLoading: userLoading } = useUser();
    const [account, setAccount] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    async function fetchAccount() {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await instagramApi.getAccount(DEFAULT_CREATOR_ID);
            setAccount(res.data);
        } catch {
            setAccount(null);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!userLoading && user) {
            fetchAccount();
        } else if (!userLoading && !user) {
            setIsLoading(false);
        }
    }, [user, userLoading]);

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
