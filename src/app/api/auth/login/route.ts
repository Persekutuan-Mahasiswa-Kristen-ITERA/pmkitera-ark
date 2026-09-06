import { NextRequest } from "next/server";
import { login } from "@/services/auth-service";
import { jsonResponse } from "@/lib/utils/json";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse({ error: "Email dan kata sandi wajib diisi" }, 400);
    }

    const user = await login(email, password);
    return jsonResponse({ message: "Berhasil masuk", user });
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Gagal masuk" }, 400);
  }
}
