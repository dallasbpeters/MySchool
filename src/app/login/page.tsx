import { LoginForm } from "@/components/login-form"
import { Logo } from "@/components/ui/Logo"
import { LoginHeading } from "@/components/ui/aceternity/LoginHeading"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="z-100 flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="max-w-[100px] flex items-center gap-2 font-medium">
            <Logo />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full md:max-w-md max-w-lg">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative z-10 hidden lg:block">
        <div className="min-h-screen w-full relative">
          <div className="min-h-screen w-full relative">
            {/* Top Fade Grid Background */}
            <div className="min-h-screen w-full relative">
              {/* Magenta Orb Grid Background */}
              <div className="min-h-screen w-full relative">
                {/* Diagonal Fade Grid Background - Top Right */}
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `
        linear-gradient(to right, color-mix(in srgb, var(--color-primary) 20%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 20%, transparent) 1px, transparent 1px)
      `,
                    backgroundSize: "20px 30px",
                    WebkitMaskImage:
                      "radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)",
                    maskImage:
                      "radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)",
                  }}
                />
                <LoginHeading />
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}
