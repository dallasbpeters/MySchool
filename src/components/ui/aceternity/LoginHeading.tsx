"use client";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function LoginHeading({ className }: { className: string }) {
  const words = ["learn", "achieve", "explore", "invent", "create"];
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      whileInView={{
        opacity: 1,
      }}
      className={cn(
        "flex items-center min-h-screen flex-1 relative text-left text-1xl leading-tight font-bold tracking-tight text-foreground md:text-8xl dark:text-zinc-100",
        className,
      )}
      layout
    >
      <span className="w-full flex flex-col items-center justify-center m-4 text-center">
        What will you <ContainerTextFlip className="block text-center md:text-8xl" words={words} /> today?
        {/* <Blips /> */}
      </span>
    </motion.div>
  );
}
