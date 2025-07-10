import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
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
        <section className="w-full bg-neutral-100 py-16">
            <div className="content-container">
                <div className="flex items-center justify-between mb-10">
                    <Text className="txt-xlarge">Featured</Text>
                    <InteractiveLink href="/store">View All</InteractiveLink>
                </div>

                <ul className="grid grid-cols-2 small:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <li
                            key={product.id}
                            className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col h-full"
                        >
                            <ProductPreview
                                product={product}
                                region={region}
                                isFeatured
                            />

                            {/* CTA */}
                            <LocalizedClientLink
                                href={`/products/${product.handle}`}
                                className="mt-auto bg-black text-white rounded-md h-10 flex items-center justify-center text-small-regular hover:opacity-90 transition-opacity duration-150"
                            >
                                View Product
                            </LocalizedClientLink>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
} 