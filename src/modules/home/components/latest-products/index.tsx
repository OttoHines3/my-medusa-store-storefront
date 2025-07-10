import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function LatestProducts({
    countryCode,
    region,
}: {
    countryCode: string
    region: HttpTypes.StoreRegion
}) {
    const {
        response: { products },
    } = await listProducts({
        pageParam: 1,
        queryParams: {
            limit: 4,
            order: "created_at",
        },
        countryCode,
    })

    if (!products || !products.length) {
        return null
    }

    return (
        <div className="content-container py-12 small:py-24">
            <div className="flex justify-between mb-8">
                <Text className="txt-xlarge">Latest products</Text>
                <InteractiveLink href="/store">View all</InteractiveLink>
            </div>
            <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-24 small:gap-y-36">
                {products.map((product) => (
                    <li key={product.id}>
                        <ProductPreview product={product} region={region} isFeatured />
                    </li>
                ))}
            </ul>
        </div>
    )
} 