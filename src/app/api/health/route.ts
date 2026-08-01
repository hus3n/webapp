import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Check DB connection
    const dbResult = await db.run(sql`SELECT 1`);
    const dbHealthy = Boolean(dbResult);

    return NextResponse.json(
      {
        status: dbHealthy ? "healthy" : "unhealthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbHealthy ? "connected" : "disconnected",
      },
      { status: dbHealthy ? 200 : 503 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database connection error";
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: msg,
      },
      { status: 503 }
    );
  }
}
