import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { file } = body;

    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: "products",
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
