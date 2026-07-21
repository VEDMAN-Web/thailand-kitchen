import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { catalogFiles } from "../../../../component/catlog/catlogData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "tk_catalog_access";

export async function GET(request: NextRequest) {
  const jar = await cookies();
  const unlocked = jar.get(COOKIE)?.value === "1";

  if (!unlocked) {
    return NextResponse.json(
      {
        success: false,
        message: "Please fill the contact form to download the catalogue.",
      },
      { status: 403 }
    );
  }

  const id = request.nextUrl.searchParams.get("id") || "1";
  const item = catalogFiles.find((f) => String(f.id) === id) ?? catalogFiles[0];

  if (!item) {
    return NextResponse.json(
      { success: false, message: "Catalogue not found." },
      { status: 404 }
    );
  }

  // Only allow known filenames (no path traversal)
  const safeName = path.basename(item.pdf);
  const privatePath = path.join(process.cwd(), "private", "catalogues", safeName);
  const publicPath = path.join(process.cwd(), "public", "catlog", safeName);

  let filePath = privatePath;
  try {
    await fs.access(privatePath);
  } catch {
    try {
      await fs.access(publicPath);
      filePath = publicPath;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Catalogue PDF is not uploaded yet. Place the file in private/catalogues/ or public/catlog/.",
        },
        { status: 404 }
      );
    }
  }

  const file = await fs.readFile(filePath);
  const filename = item.downloadName || safeName;

  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
