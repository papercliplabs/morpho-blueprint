import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest, NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "10 s"),
  analytics: true,
  timeout: 500, // ms, will allow request to proceed if there are network issues
  prefix: process.env.NODE_ENV === "development" ? "dev" : "",
});

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown"; // All unknown share same rate limit

  try {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      console.warn("Rate limit exceeded for IP:", ip);
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  } catch (error) {
    // Allow request to proceed to prevent service interuption
    console.error("Rate limit error:", error);
  }

  return NextResponse.next();
}

// Middleware for api routes only
export const config = {
  matcher: "/api/:path*",
};
