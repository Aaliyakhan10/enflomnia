import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: { "Content-Type": "application/json" },
});

// ── Instagram ─────────────────────────────────────────────────────────────
export const instagramApi = {
    getReels: (creatorId: string) =>
        api.get(`/api/v1/instagram/reels/${creatorId}`),
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
    ingestSnapshot: (data: { creator_id: string; reach: number; impressions: number }) =>
        api.post("/api/v1/reach/snapshots", data),

    getSnapshots: (creatorId: string, limit = 30) =>
        api.get(`/api/v1/reach/snapshots/${creatorId}?limit=${limit}`),

    analyze: (creatorId: string) =>
        api.get(`/api/v1/reach/analyze/${creatorId}`),
};

// ── Comments ──────────────────────────────────────────────────────────────
export const commentsApi = {
    analyzeBatch: (creatorId: string, comments: { content: string; author: string; platform?: string }[]) =>
        api.post("/api/v1/comments/analyze", { creator_id: creatorId, comments }),

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

export default api;
