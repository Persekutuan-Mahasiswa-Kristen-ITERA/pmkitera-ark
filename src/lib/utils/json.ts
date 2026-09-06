import { NextResponse } from "next/server";

export function jsonResponse(data: any, status = 200) {
  const serialized = JSON.stringify(data, (_, v) =>
    typeof v === "bigint" ? v.toString() : v
  );
  return new NextResponse(serialized, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
