import { NextResponse } from "next/server";
import { getDb, hasMongoUri } from "../../../../lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

type ContactBody = {
  fullName?: string;
  email?: string;
  whatsappNumber?: string;
  phoneNumber?: string;
  cityName?: string;
  countryName?: string;
  message?: string;
};

function badRequest(message: string) {
  return NextResponse.json({ success: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    let body: ContactBody;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const whatsappNumber = String(body.whatsappNumber ?? "").trim();
    const phoneNumber = String(body.phoneNumber ?? "").trim();
    const cityName = String(body.cityName ?? "").trim();
    const countryName = String(body.countryName ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!fullName) return badRequest("Full name is required");
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      return badRequest("Valid email is required");
    }
    if (!/^\+?[0-9]{7,15}$/.test(phoneNumber)) {
      return badRequest("Valid phone number is required");
    }
    if (!/^\+?[0-9]{7,15}$/.test(whatsappNumber)) {
      return badRequest("Valid WhatsApp number is required");
    }
    if (!cityName) return badRequest("City is required");
    if (!countryName) return badRequest("Country is required");

    if (!hasMongoUri()) {
      return NextResponse.json(
        {
          success: false,
          mongoConfigured: false,
          message:
            "MONGO_URI is missing on Vercel. Add MONGO_URI in Project Settings → Environment Variables (Production), then Redeploy.",
        },
        { status: 500 }
      );
    }

    const db = await getDb();
    const now = new Date();
    const doc = {
      fullName,
      email: email.toLowerCase(),
      whatsappNumber,
      phoneNumber,
      cityName,
      countryName,
      message:
        message ||
        `Contact inquiry from ${fullName}. Please follow up regarding kitchen consultation.`,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("users").insertOne(doc);

    return NextResponse.json(
      {
        success: true,
        message: "Contact submitted successfully",
        data: { _id: result.insertedId, ...doc },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit contact form";
    console.error("Contact POST error:", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
