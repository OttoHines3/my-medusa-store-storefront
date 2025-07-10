import { NextResponse } from "next/server";

// Define webhook payload type
interface DocuSignWebhookPayload {
  event: string;
  data: {
    envelopeId: string;
    [key: string]: unknown;
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DocuSignWebhookPayload;

    // Process webhook payload
    console.log("Received DocuSign webhook:", {
      event: body.event,
      envelopeId: body.data.envelopeId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error processing DocuSign webhook:", error.message);
    } else {
      console.error("Error processing DocuSign webhook:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
