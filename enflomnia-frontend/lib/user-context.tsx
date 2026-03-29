"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { enterpriseApi } from "./api";

interface UserContextType {
    user: any | null;      // full enterprise profile object or null
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    isLoading: true,
    refresh: async () => { },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    async function fetchUser() {
        try {
            const res = await enterpriseApi.getMyProfile();
            setUser(res.data);
        } catch (err) {
            console.error("Critical: Could not fetch enterprise user profile", err);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{
            user,
            isLoading,
            refresh: fetchUser,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
