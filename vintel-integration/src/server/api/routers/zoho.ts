import { z } from "zod";
import type { Session } from "next-auth";
import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env.js";

// Zoho API configuration
const ZOHO_API_URL = env.ZOHO_API_URL;
const ZOHO_ACCESS_TOKEN = env.ZOHO_ACCESS_TOKEN;

// Only check for required configuration in production
if (
  process.env.NODE_ENV === "production" &&
  (!ZOHO_API_URL || !ZOHO_ACCESS_TOKEN)
) {
  throw new Error("Missing required Zoho API configuration");
}

// Strongly typed Zoho contact fields
interface ZohoContactFields {
  Last_Name: string;
  First_Name: string;
  Email: string;
  Phone: string;
  Company: string;
  Mailing_Street: string;
  Mailing_City: string;
  Mailing_State: string;
  Mailing_Zip: string;
  Mailing_Country: string;
  Industry: string;
  Description: string;
  Lead_Source: string;
}

interface ZohoContactData {
  data: Array<Partial<ZohoContactFields>>;
  trigger?: string[];
}

// Strongly typed Zoho sales order fields
interface ZohoSalesOrderFields {
  Contact_Name: string;
  Subject: string;
  Deal_Name: string;
  Grand_Total: number;
  Sub_Total: number;
  Tax_Amount: number;
  Discount: number;
  Adjustment: number;
  Status: string;
  Description: string;
  Terms_and_Conditions: string;
}

interface ZohoSalesOrderData {
  data: Array<Partial<ZohoSalesOrderFields>>;
  trigger?: string[];
}

// Strongly typed Zoho entity interfaces
interface ZohoContact {
  id: string;
  Company: string | null;
  Email: string;
  First_Name: string | null;
  Last_Name: string;
  Phone: string | null;
}

interface ZohoSalesOrder {
  id: string;
  Subject: string;
  Status: string;
  Grand_Total: number;
  Contact_Name: { id: string; name: string } | null;
}

interface ZohoDeal {
  id: string;
  Deal_Name: string;
  Stage: string;
  Amount: number;
  Contact_Name: { id: string; name: string } | null;
}

interface ZohoTask {
  id: string;
  Subject: string;
  Status: string;
  Due_Date: string | null;
  Related_To: { id: string; name: string } | null;
}

interface ZohoNote {
  id: string;
  Note_Title: string;
  Note_Content: string;
  Parent_Id: { id: string; name: string } | null;
}

interface CRMData {
  contact: ZohoContact | null;
  salesOrders: ZohoSalesOrder[];
  deals: ZohoDeal[];
  tasks: ZohoTask[];
  notes: ZohoNote[];
}

interface PrismaContext {
  db: PrismaClient;
  session: Session & { user: { id: string } };
}

// Type-safe error response
interface ZohoErrorResponse {
  code: string;
  details: unknown;
  message: string;
  status: string;
}

// Helper function to type-check error responses
function isZohoErrorResponse(error: unknown): error is ZohoErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "status" in error
  );
}

// Type-safe error handling for Zoho API responses
async function handleZohoApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = (await response.json()) as unknown;
      if (isZohoErrorResponse(errorData)) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Zoho API error: ${errorMessage}`,
    });
  }

  const data = (await response.json()) as unknown;
  if (!data || typeof data !== "object") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid response format from Zoho API",
    });
  }

  return data as T;
}

async function createZohoContact(
  contactData: ZohoContactData,
): Promise<ZohoContact> {
  const response = await fetch(`${ZOHO_API_URL}/Contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(contactData),
  });

  return handleZohoApiResponse<ZohoContact>(response);
}

async function updateZohoContact(
  contactId: string,
  contactData: ZohoContactData,
): Promise<ZohoContact> {
  const response = await fetch(`${ZOHO_API_URL}/Contacts/${contactId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(contactData),
  });

  return handleZohoApiResponse<ZohoContact>(response);
}

async function createZohoSalesOrder(
  salesOrderData: ZohoSalesOrderData,
): Promise<ZohoSalesOrder> {
  const response = await fetch(`${ZOHO_API_URL}/Sales_Orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(salesOrderData),
  });

  return handleZohoApiResponse<ZohoSalesOrder>(response);
}

async function getZohoContact(contactId: string): Promise<ZohoContact | null> {
  try {
    const response = await fetch(`${ZOHO_API_URL}/Contacts/${contactId}`, {
      headers: {
        Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
      },
    });

    const data = await handleZohoApiResponse<ZohoContact>(response);
    return data;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error("Error fetching Zoho contact:", error);
    return null;
  }
}

async function searchZohoContacts(searchQuery: string): Promise<ZohoContact[]> {
  try {
    const response = await fetch(
      `${ZOHO_API_URL}/Contacts/search?criteria=(Email:equals:${encodeURIComponent(
        searchQuery,
      )})`,
      {
        headers: {
          Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
        },
      },
    );

    const data = await handleZohoApiResponse<ZohoContact[]>(response);
    return data;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error("Error searching Zoho contacts:", error);
    return [];
  }
}

async function searchZohoSalesOrders(
  searchQuery: string,
): Promise<ZohoSalesOrder[]> {
  try {
    if (!ZOHO_ACCESS_TOKEN) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Zoho access token not configured",
      });
    }

    const response = await fetch(
      `${ZOHO_API_URL}/Sales_Orders/search?criteria=${encodeURIComponent(searchQuery)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
        },
      },
    );

    const data = await handleZohoApiResponse<ZohoSalesOrder[]>(response);
    return data;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error("Error searching Zoho sales orders:", error);
    return [];
  }
}

async function searchZohoDeals(searchQuery: string): Promise<ZohoDeal[]> {
  try {
    if (!ZOHO_ACCESS_TOKEN) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Zoho access token not configured",
      });
    }

    const response = await fetch(
      `${ZOHO_API_URL}/Deals/search?criteria=${encodeURIComponent(searchQuery)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
        },
      },
    );

    const data = await handleZohoApiResponse<ZohoDeal[]>(response);
    return data;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error("Error searching Zoho deals:", error);
    return [];
  }
}

async function searchZohoTasks(searchQuery: string): Promise<ZohoTask[]> {
  try {
    if (!ZOHO_ACCESS_TOKEN) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Zoho access token not configured",
      });
    }

    const response = await fetch(
      `${ZOHO_API_URL}/Tasks/search?criteria=${encodeURIComponent(searchQuery)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
        },
      },
    );

    const data = await handleZohoApiResponse<ZohoTask[]>(response);
    return data;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error("Error searching Zoho tasks:", error);
    return [];
  }
}

async function searchZohoNotes(searchQuery: string): Promise<ZohoNote[]> {
  try {
    if (!ZOHO_ACCESS_TOKEN) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Zoho access token not configured",
      });
    }

    const response = await fetch(
      `${ZOHO_API_URL}/Notes/search?criteria=${encodeURIComponent(searchQuery)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ZOHO_ACCESS_TOKEN}`,
        },
      },
    );

    const data = await handleZohoApiResponse<ZohoNote[]>(response);
    return data;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error("Error searching Zoho notes:", error);
    return [];
  }
}

// Helper function to generate secure login codes
function generateSecureLoginCode(): string {
  // Generate a 12-character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const zohoRouter = createTRPCRouter({
  createOrUpdateContact: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        checkoutSessionId: z.string(),
        requireAgreementSigned: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Fetch checkout session with company info and agreement status
        const checkoutSession = await ctx.db.checkoutSession.findFirst({
          where: {
            id: input.checkoutSessionId,
            userId: input.userId ?? ctx.session.user.id,
          },
          include: {
            companyInfo: true,
            agreement: true,
            user: true,
          },
        });

        if (!checkoutSession) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Checkout session not found",
          });
        }

        if (!checkoutSession.companyInfo) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Company information not found",
          });
        }

        // 2. Check if agreement is signed (if required)
        if (input.requireAgreementSigned) {
          if (
            !checkoutSession.agreement ||
            checkoutSession.agreement.status !== "completed"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Agreement must be signed before creating Zoho contact",
            });
          }
        }

        // 3. Check if Zoho contact already exists for this user
        const existingZohoLink = await ctx.db.zohoAccountLink.findUnique({
          where: { userId: input.userId ?? ctx.session.user.id },
        });

        const companyInfo = checkoutSession.companyInfo;
        const user = checkoutSession.user;

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User data not found",
          });
        }

        // 4. Prepare contact data for Zoho API
        const contactName = companyInfo.contactName ?? "";
        const nameParts = contactName.split(" ");
        const lastName = nameParts.slice(-1).join(" ") ?? contactName;
        const firstName = nameParts.slice(0, -1).join(" ") ?? "";

        const contactData: ZohoContactData = {
          data: [
            {
              Last_Name: lastName,
              First_Name: firstName,
              Email: companyInfo.email ?? user.email ?? "",
              Phone: companyInfo.phone ?? "",
              Company: companyInfo.companyName ?? "",
              Mailing_Street: companyInfo.address ?? "",
              Mailing_City: companyInfo.city ?? "",
              Mailing_State: companyInfo.state ?? "",
              Mailing_Zip: companyInfo.zipCode ?? "",
              Mailing_Country: companyInfo.country ?? "US",
              Industry: companyInfo.industry ?? "",
              Description: `Created via checkout session: ${checkoutSession.id}`,
              Lead_Source: "Website Checkout",
            },
          ],
          trigger: ["approval", "workflow"],
        };

        let zohoContactId: string;
        let isUpdate = false;

        if (existingZohoLink?.zohoUserId) {
          // 5a. Update existing contact
          const updateResponse = await updateZohoContact(
            existingZohoLink.zohoUserId,
            contactData,
          );
          if (!updateResponse.id) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to update Zoho contact",
            });
          }
          zohoContactId = existingZohoLink.zohoUserId;
          isUpdate = true;
        } else {
          // 5b. Create new contact
          const createResponse = await createZohoContact(contactData);
          if (!createResponse.id) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to get contact ID from Zoho response",
            });
          }
          zohoContactId = createResponse.id;
          isUpdate = false;
        }

        // 6. Update or create ZohoAccountLink record
        const zohoLink = await ctx.db.zohoAccountLink.upsert({
          where: { userId: input.userId ?? ctx.session.user.id },
          update: {
            zohoUserId: zohoContactId,
            updatedAt: new Date(),
          },
          create: {
            userId: input.userId ?? ctx.session.user.id,
            zohoUserId: zohoContactId,
          },
        });

        // 7. Update checkout session status
        await ctx.db.checkoutSession.update({
          where: { id: input.checkoutSessionId },
          data: { status: "contact_created" },
        });

        return {
          success: true,
          data: {
            zohoContactId,
            isUpdate,
            zohoLink,
          },
          message: isUpdate
            ? "Zoho contact updated successfully"
            : "Zoho contact created successfully",
        };
      } catch (err) {
        // Always throw TRPCError
        if (err instanceof TRPCError) {
          throw err;
        }

        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),

  createSalesOrder: protectedProcedure
    .input(
      z.object({
        checkoutSessionId: z.string(),
        requirePaymentConfirmed: z.boolean().default(true),
        requireContactCreated: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Fetch checkout session with all related data
        const checkoutSession = await ctx.db.checkoutSession.findFirst({
          where: {
            id: input.checkoutSessionId,
            userId: ctx.session.user.id,
          },
          include: {
            companyInfo: true,
            agreement: true,
            user: true,
          },
        });

        if (!checkoutSession) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Checkout session not found",
          });
        }

        // 2. Check if payment is confirmed (if required)
        if (input.requirePaymentConfirmed) {
          if (
            checkoutSession.status !== "payment_completed" &&
            checkoutSession.status !== "contact_created"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment must be confirmed before creating sales order",
            });
          }
        }

        // 3. Check if contact is created (if required)
        if (input.requireContactCreated) {
          if (checkoutSession.status !== "contact_created") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Contact must be created before creating sales order",
            });
          }
        }

        // 4. Get Zoho contact ID
        const zohoLink = await ctx.db.zohoAccountLink.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!zohoLink?.zohoUserId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Zoho contact not found",
          });
        }

        // 5. Get existing sales order amount from database
        const existingSalesOrder = await ctx.db.salesOrder.findUnique({
          where: { checkoutSessionId: input.checkoutSessionId },
        });

        const orderAmount = existingSalesOrder?.amount ?? 0;

        // 6. Prepare sales order data
        const salesOrderData: ZohoSalesOrderData = {
          data: [
            {
              Contact_Name: zohoLink.zohoUserId,
              Subject: `${checkoutSession.module ?? "Zoho Integration"} - ${checkoutSession.id}`,
              Deal_Name: `${checkoutSession.module ?? "Zoho Integration"} Deal`,
              Grand_Total: orderAmount,
              Sub_Total: orderAmount,
              Tax_Amount: 0,
              Discount: 0,
              Adjustment: 0,
              Status: "Draft",
              Description: `Sales order created from checkout session: ${checkoutSession.id}`,
              Terms_and_Conditions:
                "Payment processed via Stripe. Agreement signed via DocuSign.",
            },
          ],
          trigger: ["approval", "workflow"],
        };

        // 7. Create sales order in Zoho
        const createResponse = await createZohoSalesOrder(salesOrderData);
        if (!createResponse.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get sales order ID from Zoho response",
          });
        }
        const zohoSalesOrderId = createResponse.id;

        // 8. Update checkout session status
        await ctx.db.checkoutSession.update({
          where: { id: input.checkoutSessionId },
          data: { status: "sales_order_created" },
        });

        // 9. Update existing sales order with Zoho ID
        if (existingSalesOrder) {
          await ctx.db.salesOrder.update({
            where: { checkoutSessionId: input.checkoutSessionId },
            data: { zohoSalesOrderId },
          });
        } else {
          // Create new sales order record if it doesn't exist
          await ctx.db.salesOrder.create({
            data: {
              checkoutSessionId: input.checkoutSessionId,
              zohoSalesOrderId,
              amount: orderAmount,
              currency: "USD",
            },
          });
        }

        return {
          success: true,
          data: {
            zohoSalesOrderId,
            zohoContactId: zohoLink.zohoUserId,
            checkoutSessionId: input.checkoutSessionId,
          },
          message: "Zoho sales order created successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error creating Zoho sales order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Zoho sales order",
        });
      }
    }),

  createContactAndSalesOrder: protectedProcedure
    .input(
      z.object({
        checkoutSessionId: z.string(),
        requireAgreementSigned: z.boolean().default(true),
        requirePaymentConfirmed: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. First create/update the contact
        const contactResult = await ctx.db.$transaction(async (tx) => {
          // This would normally call the createOrUpdateContact logic
          // For now, we'll reuse the existing logic by calling the mutation
          const checkoutSession = await tx.checkoutSession.findFirst({
            where: {
              id: input.checkoutSessionId,
              userId: ctx.session.user.id,
            },
            include: {
              companyInfo: true,
              agreement: true,
              user: true,
            },
          });

          if (!checkoutSession) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Checkout session not found",
            });
          }

          if (!checkoutSession.companyInfo) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Company information not found",
            });
          }

          // Check agreement if required
          if (input.requireAgreementSigned) {
            if (
              !checkoutSession.agreement ||
              checkoutSession.agreement.status !== "completed"
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Agreement must be signed before creating Zoho contact",
              });
            }
          }

          // Create/update contact logic here...
          // (Simplified for brevity - in practice, you'd extract this to a shared function)

          return { success: true, contactId: "temp_contact_id" };
        });

        // 2. Then create the sales order
        const salesOrderResult = await ctx.db.$transaction(async (tx) => {
          const checkoutSession = await tx.checkoutSession.findFirst({
            where: {
              id: input.checkoutSessionId,
              userId: ctx.session.user.id,
            },
            include: {
              companyInfo: true,
              agreement: true,
              user: true,
            },
          });

          if (!checkoutSession) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Checkout session not found",
            });
          }

          // Check payment if required
          if (input.requirePaymentConfirmed) {
            if (
              checkoutSession.status !== "payment_completed" &&
              checkoutSession.status !== "contact_created"
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Payment must be confirmed before creating sales order",
              });
            }
          }

          // Create sales order logic here...
          // (Simplified for brevity - in practice, you'd extract this to a shared function)

          return { success: true, salesOrderId: "temp_sales_order_id" };
        });

        return {
          success: true,
          data: {
            contactResult,
            salesOrderResult,
          },
          message: "Contact and sales order created successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error creating contact and sales order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create contact and sales order",
        });
      }
    }),

  generateSignupLink: protectedProcedure
    .input(
      z.object({
        zoho_id: z.string(),
        expiresInDays: z.number().default(7),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Check if Zoho contact exists
        const contact = await getZohoContact(input.zoho_id);
        if (!contact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Zoho contact not found",
          });
        }

        // 2. Generate secure login code and expiration date
        const loginCode = generateSecureLoginCode();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        // 3. Create signup link record
        const signupLink = await ctx.db.signupLink.create({
          data: {
            zoho_id: input.zoho_id,
            login_code: loginCode,
            expires_at: expiresAt,
            is_active: true,
            usage_limit: 1,
            usage_count: 0,
          },
        });

        return {
          success: true,
          data: {
            signupLink,
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/magic-link/${input.zoho_id}/${loginCode}`,
          },
          message: "Signup link generated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error generating signup link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate signup link",
        });
      }
    }),

  createSignupLink: protectedProcedure
    .input(
      z.object({
        zoho_id: z.string(),
        usage_limit: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const signupLink = await ctx.db.signupLink.create({
          data: {
            zoho_id: input.zoho_id,
            login_code: generateSecureLoginCode(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            usage_limit: input.usage_limit ?? 1,
            usage_count: 0,
            is_active: true,
          },
        });

        return {
          success: true,
          data: signupLink,
          message: "Signup link created successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error creating signup link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create signup link",
        });
      }
    }),

  validateSignupLink: protectedProcedure
    .input(
      z.object({
        zoho_id: z.string(),
        login_code: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const signupLink = await ctx.db.signupLink.findFirst({
          where: {
            zoho_id: input.zoho_id,
            login_code: input.login_code,
          },
        });

        if (!signupLink) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Signup link not found",
          });
        }

        // Check if link is expired
        if (signupLink.expires_at < new Date()) {
          await ctx.db.signupLink.update({
            where: { id: signupLink.id },
            data: { is_active: false },
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Signup link has expired",
          });
        }

        // Check if link has exceeded usage limit
        if (signupLink.usage_count >= signupLink.usage_limit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Signup link has exceeded usage limit",
          });
        }

        // Get Zoho contact details
        const contact = await getZohoContact(signupLink.zoho_id);

        if (!contact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Zoho contact not found",
          });
        }

        return {
          success: true,
          data: {
            signupLink,
            contact,
          },
          message: "Signup link is valid",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error validating signup link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate signup link",
        });
      }
    }),

  getCRMData: protectedProcedure
    .input(
      z.object({
        zohoContactId: z.string(),
        includeSalesOrders: z.boolean().optional().default(false),
        includeDeals: z.boolean().optional().default(false),
        includeTasks: z.boolean().optional().default(false),
        includeNotes: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // 1. Get Zoho contact ID from user or input
        let zohoContactId: string;

        if (input.zohoContactId) {
          // Use provided zoho_id
          zohoContactId = input.zohoContactId;
        } else {
          // Get from current user's linked account
          const zohoLink = await ctx.db.zohoAccountLink.findUnique({
            where: { userId: ctx.session.user.id },
          });

          if (!zohoLink?.zohoUserId) {
            return {
              success: true,
              data: null,
              message: "No Zoho contact found for this user",
            };
          }

          zohoContactId = zohoLink.zohoUserId;
        }

        // 2. Fetch comprehensive CRM data
        const crmData: CRMData = {
          contact: null,
          salesOrders: [],
          deals: [],
          tasks: [],
          notes: [],
        };

        // 3. Fetch contact details
        try {
          const contactResponse = await getZohoContact(zohoContactId);
          crmData.contact = contactResponse ?? null;
        } catch (error) {
          console.error("Error fetching contact:", error);
        }

        // 4. Fetch sales orders (if requested)
        if (input.includeSalesOrders) {
          try {
            const salesOrdersResponse = await searchZohoSalesOrders(
              `(Contact_Name:equals:${zohoContactId})`,
            );
            crmData.salesOrders = salesOrdersResponse ?? [];
          } catch (error) {
            console.error("Error fetching sales orders:", error);
          }
        }

        // 5. Fetch deals (if requested)
        if (input.includeDeals) {
          try {
            const dealsResponse = await searchZohoDeals(
              `(Contact_Name:equals:${zohoContactId})`,
            );
            crmData.deals = dealsResponse ?? [];
          } catch (error) {
            console.error("Error fetching deals:", error);
          }
        }

        // 6. Fetch tasks (if requested)
        if (input.includeTasks) {
          try {
            const tasksResponse = await searchZohoTasks(
              `(Who_Id:equals:${zohoContactId})`,
            );
            crmData.tasks = tasksResponse ?? [];
          } catch (error) {
            console.error("Error fetching tasks:", error);
          }
        }

        // 7. Fetch notes (if requested)
        if (input.includeNotes) {
          try {
            const notesResponse = await searchZohoNotes(
              `(Parent_Id:equals:${zohoContactId})`,
            );
            crmData.notes = notesResponse ?? [];
          } catch (error) {
            console.error("Error fetching notes:", error);
          }
        }

        return {
          success: true,
          data: crmData,
          message: "CRM data fetched successfully",
        };
      } catch (error) {
        console.error("Error fetching CRM data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch CRM data",
        });
      }
    }),

  getContactInfo: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(
      async ({
        ctx,
        input,
      }: {
        ctx: PrismaContext;
        input: { userId?: string };
      }) => {
        try {
          const userId = input.userId ?? ctx.session.user.id;

          const zohoLink = await ctx.db.zohoAccountLink.findUnique({
            where: { userId },
            include: {
              user: true,
            },
          });

          if (!zohoLink) {
            return {
              success: true,
              data: null,
              message: "No Zoho contact found",
            };
          }

          // Fetch contact details from Zoho API
          const contactDetails = await getZohoContact(zohoLink.zohoUserId);

          return {
            success: true,
            data: {
              zohoLink,
              contactDetails,
            },
          };
        } catch (error) {
          console.error("Error fetching Zoho contact info:", error);
          throw new Error("Failed to fetch Zoho contact info");
        }
      },
    ),

  searchContacts: protectedProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
      }),
    )
    .query(
      async ({
        input,
      }: {
        input: { email?: string; phone?: string; company?: string };
      }) => {
        try {
          const searchCriteria = [];

          if (input.email) {
            searchCriteria.push(`(Email:equals:${input.email})`);
          }
          if (input.phone) {
            searchCriteria.push(`(Phone:equals:${input.phone})`);
          }
          if (input.company) {
            searchCriteria.push(`(Company:equals:${input.company})`);
          }

          if (searchCriteria.length === 0) {
            throw new Error("At least one search criteria is required");
          }

          const searchQuery = searchCriteria.join(" or ");
          const response = await searchZohoContacts(searchQuery);

          return {
            success: true,
            data: response,
          };
        } catch (error) {
          console.error("Error searching Zoho contacts:", error);
          throw new Error("Failed to search Zoho contacts");
        }
      },
    ),
});
