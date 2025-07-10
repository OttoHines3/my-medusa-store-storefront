import { NextResponse } from "next/server";

// Define webhook payload type
interface ZohoBillingWebhookPayload {
  event_type: string;
  data: {
    id: string;
    invoice_id?: string;
    payment_id?: string;
    amount?: number;
    [key: string]: unknown;
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ZohoBillingWebhookPayload;

    // Process webhook payload
    console.log("Received Zoho Billing webhook:", {
      eventType: body.event_type,
      id: body.data.id,
      invoiceId: body.data.invoice_id,
      paymentId: body.data.payment_id,
      amount: body.data.amount,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error processing Zoho Billing webhook:", error.message);
    } else {
      console.error("Error processing Zoho Billing webhook:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
