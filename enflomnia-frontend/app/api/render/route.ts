import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; // Should ideally use service role for storage, but anon works if bucket is public
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { compositionId, inputProps, slug } = body;

    if (!compositionId || !inputProps) {
      return NextResponse.json({ error: "Missing compositionId or inputProps" }, { status: 400 });
    }

    const entry = path.join(process.cwd(), "remotion/Root.tsx");
    console.log("Bundling...", entry);
    
    const bundleLocation = await bundle({
      entryPoint: entry,
    });

    console.log("Selecting composition...", compositionId);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    const timestamp = Date.now();
    const filename = `${slug || "render"}-${timestamp}.mp4`;
    const outputLocation = path.join(process.cwd(), `public/renders/${filename}`);
    
    // Ensure directory exists
    const dir = path.dirname(outputLocation);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log("Rendering...");
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation,
      inputProps,
    });

    // --- NEW: SUPABASE STORAGE UPLOAD ---
    console.log("Uploading to Supabase Storage...");
    const fileBuffer = fs.readFileSync(outputLocation);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("productions")
      .upload(filename, fileBuffer, {
        contentType: "video/mp4",
        cacheControl: "3600",
        upsert: true
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      // Fallback to local URL if upload fails, but at least we tried
      const localUrl = `/renders/${filename}`;
      return NextResponse.json({ url: localUrl, warning: "Uploaded to local fallback" });
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from("productions")
      .getPublicUrl(filename);

    console.log("Upload successful:", publicUrl);

    // --- CLEANUP: DELETE LOCAL FILE ---
    try {
      fs.unlinkSync(outputLocation);
      console.log("Local temporary file deleted.");
    } catch (e) {
      console.warn("Failed to delete local temp file:", e);
    }

    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error("Render error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
