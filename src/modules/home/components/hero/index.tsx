import { Heading } from "@medusajs/ui"

const Hero = () => {
  return (
    <div
      className="h-[75vh] w-full relative"
      style={{ background: "linear-gradient(90deg, #7A0C19 0%, #000000 100%)" }}
    >
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-4xl leading-tight font-semibold"
            style={{ color: "#FFFFFF" }}
          >
            VinTel Module Marketplace
          </Heading>
          <Heading
            level="h2"
            className="text-xl leading-relaxed font-normal mt-2"
            style={{ color: "#DDDDDD" }}
          >
            Purchase VinTel diagnostic modules directly online – an extension of our main website.
          </Heading>
        </span>
        {/* Removed GitHub call-to-action – marketplace doesn’t need it */}
      </div>
    </div>
  )
}

export default Hero
