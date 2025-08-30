"use client";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function LoginHeading() {
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
        "flex items-center min-h-screen flex-1 relative max-w-2xl text-left text-1xl leading-tight font-bold tracking-tight text-zinc-700 md:text-5xl dark:text-zinc-100",
      )}
      layout
    >
      <span className="inline-block m-4">
        What will you <ContainerTextFlip words={words} /> today?
        {/* <Blips /> */}
      </span>
    </motion.div>
  );
}
