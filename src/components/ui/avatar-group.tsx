import React, { cloneElement, Children, forwardRef, useMemo } from "react";

import { cn } from "@/lib/utils";

import type { HTMLAttributes, ReactElement, ElementRef } from "react";

// ================================== //

type TAvatarGroupRef = HTMLDivElement;
type TAvatarGroupProps = HTMLAttributes<HTMLDivElement> & { max?: number; spacing?: number };

const AvatarGroup = forwardRef<TAvatarGroupRef, TAvatarGroupProps>(({ className, children, max = 1, spacing = 10, ...props }, ref) => {
  const avatarItems = Children.toArray(children).filter((child): child is ReactElement =>
    React.isValidElement(child)
  );

  const renderContent = useMemo(() => {
    return (
      <>
        {avatarItems.slice(0, max).map((child, index) => {
          return cloneElement(child as ReactElement<any>, {
            key: index,
            className: cn((child as any).props.className, "border-2 border-background"),
            style: { marginLeft: index === 0 ? 0 : -spacing, ...(child as any).props.style },
          });
        })}

        {avatarItems.length > max && (
          <div
            className={cn("relative flex items-center justify-center rounded-full border-2 border-background bg-muted", (avatarItems[0] as any).props.className)}
            style={{ marginLeft: -spacing }}
          >
            <p>+{avatarItems.length - max}</p>
          </div>
        )}
      </>
    );
  }, [avatarItems, max, spacing]);

  return (
    <div ref={ref} className={cn("relative flex", className)} {...props}>
      {renderContent}
    </div>
  );
});

AvatarGroup.displayName = "AvatarGroup";

export { AvatarGroup };
