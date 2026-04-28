import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyWebsite } from "@/lib/classifier";
import { toErrorResponse } from "@/lib/errors";

const requestSchema = z.object({
  url: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { url } = requestSchema.parse(json);
    const result = await classifyWebsite(url);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_URL",
            message: "Please enter a valid public URL.",
          },
        },
        { status: 400 },
      );
    }

    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
