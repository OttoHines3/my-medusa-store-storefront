import { z } from "zod";
import { getZohoBillingClient } from "~/lib/zoho-billing";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const checkoutRouter = createTRPCRouter({
  getUserSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.checkoutSession.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        agreement: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: sessions,
    };
  }),

  getPayment: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      const zohoBilling = getZohoBillingClient();
      const payment = await zohoBilling.getPayment(input.paymentId);
      return payment;
    }),

  recordPayment: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        amount: z.number(),
        paymentMode: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const zohoBilling = getZohoBillingClient();
      const payment = await zohoBilling.recordPayment({
        invoiceId: input.invoiceId,
        amount: input.amount,
        paymentMode: input.paymentMode,
        description: input.description,
      });
      return payment;
    }),

  refundPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        amount: z.number().optional(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const zohoBilling = getZohoBillingClient();
      const refund = await zohoBilling.refundPayment(
        input.paymentId,
        input.amount,
        input.reason,
      );
      return refund;
    }),
});
