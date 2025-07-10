import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header
        className="relative h-16 mx-auto duration-200"
        style={{
          background: "linear-gradient(90deg, #7A0C19 0%, #000000 100%)",
          color: "#FFFFFF",
        }}
      >
        <nav className="content-container txt-xsmall-plus flex items-center justify-between w-full h-full text-small-regular text-white">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus uppercase"
              style={{ color: "#FFFFFF", fontWeight: 700 }}
              data-testid="nav-store-link"
            >
              VINTEL
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                href="/account"
                className="uppercase"
                style={{ color: "#FFFFFF" }}
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  href="/cart"
                  data-testid="nav-cart-link"
                  className="flex gap-2"
                  style={{ color: "#FFFFFF" }}
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
