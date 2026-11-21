import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-slate-500 bg-slate-100 text-slate-900 shadow-xs hover:bg-slate-200 dark:border-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        view:
          "border border-blue-600 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-200/40 dark:bg-blue-200/10 dark:text-blue-200 dark:hover:bg-blue-200/15",
        edit:
          "border border-amber-700 bg-amber-100 text-amber-950 hover:bg-amber-200 dark:border-amber-200/40 dark:bg-amber-200/10 dark:text-amber-200 dark:hover:bg-amber-200/15",
        manage:
          "border border-violet-700 bg-violet-50 text-violet-900 hover:bg-violet-100 dark:border-violet-200/40 dark:bg-violet-200/10 dark:text-violet-200 dark:hover:bg-violet-200/15",
        remove:
          "border border-red-600 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-200/40 dark:bg-red-200/10 dark:text-red-200 dark:hover:bg-red-200/15",
        restore:
          "border border-green-700 bg-green-50 text-green-900 hover:bg-green-100 dark:border-green-200/40 dark:bg-green-200/10 dark:text-green-200 dark:hover:bg-green-200/15",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
