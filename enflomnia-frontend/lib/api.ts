import axios from "axios";
import { supabase } from "./supabase";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: { "Content-Type": "application/json" },
});

// Add interceptor to include Supabase JWT
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
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
    getSuggestions: (creatorId: string, force = false) =>
        api.get(`/api/v1/intelligence/content-suggestions/${creatorId}${force ? '?force=true' : ''}`),

    generateGroundedScript: (creatorId: string, topic?: string) =>
        api.post(`/api/v1/intelligence/grounded-script/${creatorId}`, { topic }),

    getFeedback: (creatorId: string, reelId: string) =>
        api.get(`/api/v1/intelligence/reel-feedback/${creatorId}/${reelId}`),

    getCompetitorsAndTrends: (creatorId: string, niche = "lifestyle", force = false) =>
        api.get(`/api/v1/intelligence/competitors-trends/${creatorId}?niche=${niche}${force ? '&force=true' : ''}`),

    simulateGrowth: (creatorId: string, force = false) =>
        api.get(`/api/v1/intelligence/growth-simulation/${creatorId}${force ? '?force=true' : ''}`),
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

    // Creative Studio (Images — multi-image + captions)
    generateImage: (enterpriseId: string, data: { prompt: string; aspect_ratio?: string; count?: number }) =>
        api.post(`/api/enterprise/${enterpriseId}/image/generate`, data),

    // Caption Generation (for video, image, post)
    generateCaption: (enterpriseId: string, data: { description: string; content_type?: string }) =>
        api.post(`/api/enterprise/${enterpriseId}/caption/generate`, data),

    // PDF Upload
    uploadPDF: (enterpriseId: string, file: File, title?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (title) formData.append('title', title);
        return api.post(`/api/enterprise/${enterpriseId}/knowledge/upload-pdf`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    // Bark: Compliance Gate
    auditContent: (enterpriseId: string, data: { content: string; content_type?: string }) =>
        api.post(`/api/enterprise/${enterpriseId}/compliance/audit`, data),

    // Fruit: Publish to Social
    publishContent: (enterprise_id: string, data: { 
        type: string; 
        day: string; 
        video_url?: string; 
        image_url?: string;
        caption?: string | null;
        campaign_id?: string;
    }) =>
        api.post(`/api/enterprise/${enterprise_id}/publish`, data),

    // Campaigns (Strategist)
    generateCampaign: (enterpriseId: string, data: { goal: string }) =>
        api.post(`/api/enterprise/${enterpriseId}/campaigns`, data),

    listCampaigns: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}/campaigns`),

    suggestObjectives: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}/suggest-objectives`),

    magicScanPersona: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}/magic-scan-persona`),

    // Profile Management
    getMyProfile: () =>
        api.get("/api/enterprise/profile/me"),

    getProfile: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}`),

    updateProfile: (enterpriseId: string, data: any) =>
        api.patch(`/api/enterprise/${enterpriseId}/profile`, data),

    // Video Studio
    generateVideo: (enterpriseId: string, data: { title: string; input_props: any; script_id?: string; video_url?: string; status?: string }) =>
        api.post(`/api/enterprise/${enterpriseId}/videos`, data),

    listVideos: (enterpriseId: string) =>
        api.get(`/api/enterprise/${enterpriseId}/videos`),
};

// ── User Profiling ────────────────────────────────────────────────────────
export const userApi = {
    getProfile: () => api.get("/api/user/profile"),
    getHistory: (type: "image" | "video" | "campaign" | "script") => 
        api.get("/api/user/history", { params: { type } }),
};

export default api;
