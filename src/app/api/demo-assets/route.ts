import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const audioExtensions = new Set([".mp3", ".wav", ".m4a", ".aac", ".flac"]);
const subtitleExtensions = new Set([".srt"]);

export const GET = async () => {
  const demoDir = path.join(process.cwd(), "public", "demo");
  try {
    const entries = await fs.readdir(demoDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    const audioFiles = files
      .filter((f) => audioExtensions.has(path.extname(f).toLowerCase()))
      .map((f) => `demo/${f}`);

    const subtitleFiles = files
      .filter((f) => subtitleExtensions.has(path.extname(f).toLowerCase()))
      .map((f) => `demo/${f}`);

    return NextResponse.json({
      audioFiles,
      subtitleFiles,
    });
  } catch {
    return NextResponse.json({
      audioFiles: [],
      subtitleFiles: [],
    });
  }
};

