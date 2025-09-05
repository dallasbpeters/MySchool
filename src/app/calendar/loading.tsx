import ColourfulText from "@/components/ui/colourful-text"

export default function Loading() {
  // Add fallback UI that will be shown while the route is loading.
  return <div className="container mx-auto p-4 h-screen flex items-center justify-center max-w-4xl">
    <p className="text-center text-5xl"><ColourfulText text="Loading..." /></p>
  </div>
}
