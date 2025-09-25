import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest, NextResponse } from "next/server";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(100, "10 s"),
        analytics: true,
        timeout: 500, // ms, will allow request to proceed if there are network issues
        prefix: process.env.NODE_ENV === "development" ? "dev" : "",
      })
    : null;

export async function middleware(request: NextRequest) {
  // Bypasses rate limiter if the env vars are not provided
  if (ratelimit) {
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
  }

  return NextResponse.next();
}

// Middleware for api routes only
export const config = {
  matcher: "/api/:path*",
};
