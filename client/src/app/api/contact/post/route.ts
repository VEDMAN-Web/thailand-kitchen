import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import { Contact } from "@/src/lib/models/Contact";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      whatsappNumber,
      phoneNumber,
      cityName,
      countryName,
      message,
    } = body;

    if (!fullName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name is required" },
        { status: 400 }
      );
    }

    if (!email?.trim() || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      return NextResponse.json(
        { success: false, message: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!phoneNumber?.trim() || !/^\+?[0-9]+$/.test(String(phoneNumber).trim())) {
      return NextResponse.json(
        { success: false, message: "Valid phone number is required" },
        { status: 400 }
      );
    }

    if (
      !whatsappNumber?.trim() ||
      !/^\+?[0-9]+$/.test(String(whatsappNumber).trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Valid WhatsApp number is required" },
        { status: 400 }
      );
    }

    if (!cityName?.trim() || !/^[\p{L}\s'.-]+$/u.test(String(cityName).trim())) {
      return NextResponse.json(
        { success: false, message: "Valid city is required" },
        { status: 400 }
      );
    }

    if (
      !countryName?.trim() ||
      !/^[\p{L}\s'.-]+$/u.test(String(countryName).trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Valid country is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const contact = await Contact.create({
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      whatsappNumber: String(whatsappNumber).trim(),
      phoneNumber: String(phoneNumber).trim(),
      cityName: String(cityName).trim(),
      countryName: String(countryName).trim(),
      message: message ? String(message).trim() : "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Contact submitted successfully",
        data: contact,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit contact form",
      },
      { status: 500 }
    );
  }
}
