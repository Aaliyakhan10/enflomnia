import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { compositionId, inputProps, slug } = body;

    if (!compositionId || !inputProps) {
      return NextResponse.json({ error: "Missing compositionId or inputProps" }, { status: 400 });
    }

    const entry = path.join(process.cwd(), "remotion/index.ts");
    console.log("Bundling...", entry);
    
    const bundleLocation = await bundle({
      entryPoint: entry,
      // If you use Tailwind in Remotion, you might need to specify a webpack override here
    });

    console.log("Selecting composition...", compositionId);
    const composition = await selectComposition({
      bundle: bundleLocation,
      id: compositionId,
      inputProps,
    });

    const outputLocation = path.join(process.cwd(), `public/renders/${slug || Date.now()}.mp4`);
    
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

    const publicUrl = `/renders/${path.basename(outputLocation)}`;
    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error("Render error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
