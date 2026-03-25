"use client";
import { Video } from "lucide-react";

export default function VideoStudioPage() {
    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                    <Video size={24} className="text-violet-500" />
                    Video Studio
                </h1>
                <p className="text-sm text-gray-500 max-w-lg">
                    Scalable Production: Programmatic, personalized video generation rendering from verified data.
                </p>
            </div>
            <div className="card shadow-sm ring-1 ring-gray-100 p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-gray-400 font-bold tracking-wider">COMING SOON: PROGRAMMATIC VIDEO RENDERING ENGINE</p>
            </div>
        </div>
    );
}
