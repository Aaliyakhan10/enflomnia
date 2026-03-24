import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: { "Content-Type": "application/json" },
});

// ── Instagram ─────────────────────────────────────────────────────────────
export const instagramApi = {
    connect: (creatorId: string, accessToken: string) =>
        api.post("/api/v1/instagram/connect", { creator_id: creatorId, access_token: accessToken }),

    getAccount: (creatorId: string) =>
        api.get(`/api/v1/instagram/account/${creatorId}`),

    disconnect: (creatorId: string) =>
        api.post(`/api/v1/instagram/disconnect/${creatorId}`),

    /** Sync reels AND auto-derives reach snapshots + refreshes workload signal */
    syncReels: (creatorId: string, limit = 20) =>
        api.post(`/api/v1/instagram/sync/${creatorId}?limit=${limit}`),

    getReels: (creatorId: string) =>
        api.get(`/api/v1/instagram/reels/${creatorId}`),

    analyzeReels: (creatorId: string) =>
        api.post(`/api/v1/instagram/analyze/${creatorId}`),
};

// ── Intelligence (Phase 2) ────────────────────────────────────────────────
export const intelligenceApi = {
    getSuggestions: (creatorId: string) =>
        api.get(`/api/v1/intelligence/content-suggestions/${creatorId}`),

    getFeedback: (creatorId: string, reelId: string) =>
        api.get(`/api/v1/intelligence/reel-feedback/${creatorId}/${reelId}`),

    getCompetitorsAndTrends: (creatorId: string, niche = "lifestyle") =>
        api.get(`/api/v1/intelligence/competitors-trends/${creatorId}?niche=${niche}`),

    simulateGrowth: (creatorId: string) =>
        api.get(`/api/v1/intelligence/growth-simulation/${creatorId}`),
};

// ── Reach ─────────────────────────────────────────────────────────────────
export const reachApi = {
    /** Auto-derive reach snapshots from synced Reel data + run anomaly analysis. No manual input needed. */
    syncFromInstagram: (creatorId: string) =>
        api.post(`/api/v1/reach/sync/${creatorId}`),

    ingestSnapshot: (data: { creator_id: string; reach: number; impressions: number }) =>
        api.post("/api/v1/reach/snapshots", data),

    getSnapshots: (creatorId: string, limit = 30) =>
        api.get(`/api/v1/reach/snapshots/${creatorId}?limit=${limit}`),

    analyze: (creatorId: string) =>
        api.get(`/api/v1/reach/analyze/${creatorId}`),
};

// ── Comments ──────────────────────────────────────────────────────────────
export const commentsApi = {
    /** Auto-sync comments from all recent reels using stored Instagram token. No manual upload needed. */
    syncFromInstagram: (creatorId: string, reelsLimit = 5) =>
        api.post(`/api/v1/comments/sync/${creatorId}?reels_limit=${reelsLimit}`),

    analyzeBatch: (creatorId: string, comments: { content: string; author: string; platform?: string }[]) =>
        api.post("/api/v1/comments/analyze", { creator_id: creatorId, comments }),

    syncReelComments: (creatorId: string, igMediaId: string) =>
        api.post(`/api/v1/comments/sync-reel/${creatorId}/${igMediaId}`),

    getComments: (creatorId: string, category?: string, page = 1) =>
        api.get(`/api/v1/comments/${creatorId}`, { params: { category, page, page_size: 20 } }),

    submitFeedback: (commentId: string, decision: "approved" | "rejected") =>
        api.post("/api/v1/comments/feedback", { comment_id: commentId, decision }),

    getSummary: (creatorId: string) =>
        api.get(`/api/v1/comments/summary/${creatorId}`),
};

// ── Workload ──────────────────────────────────────────────────────────────
export const workloadApi = {
    analyze: (creatorId: string) =>
        api.post(`/api/v1/workload/analyze/${creatorId}`),

    getSignal: (creatorId: string) =>
        api.get(`/api/v1/workload/signals/${creatorId}`),

    getHeatmap: (creatorId: string, days = 30) =>
        api.get(`/api/v1/workload/heatmap/${creatorId}?days=${days}`),
};

// ── Accelerator: Pricing ───────────────────────────────────────────────────
export const pricingApi = {
    estimate: (data: {
        creator_id: string; platform?: string; deliverable_type: string;
        reel_id?: string;
        follower_count?: number; engagement_rate?: number; niche?: string;
        brand_name?: string; offered_price?: number;
    }) => api.post("/api/v1/pricing/estimate", data),

    getHistory: (creatorId: string) =>
        api.get(`/api/v1/pricing/history/${creatorId}`),
};

// ── Accelerator: Scripts ───────────────────────────────────────────────────
export const scriptsApi = {
    generate: (data: {
        creator_id: string; topic?: string; reel_id?: string;
        brand_name?: string; brand_brief?: string; tone: string;
    }) => api.post("/api/v1/scripts/generate", data),

    getHistory: (creatorId: string) =>
        api.get(`/api/v1/scripts/history/${creatorId}`),
};

// ── Accelerator: Matching ─────────────────────────────────────────────────
export const matchingApi = {
    addBrand: (data: {
        name: string; industry: string; target_audience?: string;
        content_niches?: string; budget_range_min?: number; budget_range_max?: number;
    }) => api.post("/api/v1/matching/brands", data),

    getBrands: () => api.get("/api/v1/matching/brands"),

    findMatches: (data: {
        creator_id: string; niche?: string; platform?: string; reel_id?: string;
        follower_count?: number; engagement_rate?: number; audience_description?: string;
    }) => api.post("/api/v1/matching/find-brands", data),

    getMatches: (creatorId: string) =>
        api.get(`/api/v1/matching/matches/${creatorId}`),
};

// ── Scheduler ─────────────────────────────────────────────────────────────
export const schedulerApi = {
    getSchedule: (creatorId: string) =>
        api.get(`/api/v1/scheduler/${creatorId}`),

    createItem: (creatorId: string, item: any) =>
        api.post(`/api/v1/scheduler/${creatorId}`, item),

    updateItem: (creatorId: string, itemId: string, item: any) =>
        api.put(`/api/v1/scheduler/${creatorId}/${itemId}`, item),

    deleteItem: (creatorId: string, itemId: string) =>
        api.delete(`/api/v1/scheduler/${creatorId}/${itemId}`),

    generateSmartPlan: (creatorId: string, daysAhead: number = 7) =>
        api.post(`/api/v1/scheduler/smart-plan/generate`, { creator_id: creatorId, days_ahead: daysAhead }),
};

// ── Enterprise Vault ──────────────────────────────────────────────────────
export const enterpriseApi = {
    register: (data: { name: string; industry?: string; brand_guidelines?: string }) =>
        api.post("/api/enterprise/register", data),

    get: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}`),

    // Connectors
    registerConnector: (enterpriseId: string, data: { connector_type: string; display_name?: string }) =>
        api.post(`/api/enterprise/${enterpriseId}/connectors`, data),

    listConnectors: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}/connectors`),

    syncConnector: (enterpriseId: string, connectorId: string) =>
        api.post(`/api/enterprise/${enterpriseId}/connectors/${connectorId}/sync`),

    // Knowledge Lake
    ingestKnowledge: (enterpriseId: string, data: { title: string; content: string; source_type?: string }) =>
        api.post(`/api/enterprise/${enterpriseId}/knowledge/ingest`, data),

    listKnowledge: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}/knowledge/documents`),

    searchKnowledge: (enterpriseId: string, query: string) =>
        api.get(`/api/enterprise/${enterpriseId}/knowledge/search`, { params: { q: query } }),

    // Fact Database
    upsertFact: (enterpriseId: string, data: { category: string; key: string; value: string; source?: string }) =>
        api.post(`/api/enterprise/${enterpriseId}/facts`, data),

    getFacts: (enterpriseId: string, category?: string) =>
        api.get(`/api/enterprise/${enterpriseId}/facts`, { params: category ? { category } : {} }),

    checkContent: (enterpriseId: string, content: string) =>
        api.post(`/api/enterprise/${enterpriseId}/facts/check`, { content }),

    // Audit
    getAuditTrail: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}/audit`),

    getSovereignty: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}/sovereignty`),
};

export default api;
