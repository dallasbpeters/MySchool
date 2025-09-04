import { LoginForm } from "@/components/login-form"
import { Logo } from "@/components/ui/Logo"
import { LoginHeading } from "@/components/ui/aceternity/LoginHeading"
import Link from "next/link"
import PageGrid from "@/components/page-grid"
import Background from "@/components/background"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative z-10 hidden lg:block">
        <div className="min-h-screen w-full relative">
          <div className="min-h-screen w-full relative">
            {/* Top Fade Grid Background */}
            <div className="min-h-screen w-full relative">
              {/* Magenta Orb Grid Background */}
              <div className="min-h-screen w-full relative">
                {/* Diagonal Fade Grid Background - Top Right */}
                <Background className="animate-in fade-in rotate-180 opacity-80 dark:opacity-100 transition-all duration-1000 min-h-screen w-full absolute z-9" />
                <LoginHeading className="min-h-screen w-full absolute z-10" />
              </div>
            </div>
          </div>


        </div>
      </div>
      <div className="z-100 flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <Link href="/" className="max-w-[100px] flex items-center gap-2 font-medium">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full md:max-w-md max-w-lg">
            <LoginForm />
          </div>
        </div>
      </div>
      <PageGrid variant="grid" />
    </div>
  )
}
