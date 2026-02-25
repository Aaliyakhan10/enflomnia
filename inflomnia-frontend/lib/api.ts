import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: { "Content-Type": "application/json" },
});

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

export default api;
