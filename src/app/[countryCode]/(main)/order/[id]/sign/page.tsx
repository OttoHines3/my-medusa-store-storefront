import { retrieveOrder } from "@lib/data/orders"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@medusajs/ui"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Sign Document",
}

export default async function OrderSignPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const order = await retrieveOrder(id).catch(() => null)

  if (!order) {
    return notFound()
  }

  const signUrl =
    process.env.NEXT_PUBLIC_SIGN_DOCUMENT_URL ||
    "https://example.com/sign-document"

  return (
    <div className="flex flex-col gap-y-4 items-center w-full mx-auto mt-10 mb-20">
      <Heading level="h1" className="text-xl text-zinc-900">
        Sign your document
      </Heading>
      <Text className="text-zinc-600 text-center max-w-xl">
        Please review and sign the document below to complete your purchase.
      </Text>
      <div className="w-full max-w-2xl h-[600px]">
        <iframe
          src={signUrl}
          className="w-full h-full border rounded-md"
          title="Document Signature"
        />
      </div>
      <LocalizedClientLink
        href={`/order/${order.id}/confirmed`}
        className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline mt-4"
      >
        Continue to order confirmation
      </LocalizedClientLink>
    </div>
  )
}
