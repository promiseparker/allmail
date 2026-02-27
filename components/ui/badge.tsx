import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded font-medium text-xs px-1.5 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700",
        primary: "bg-primary-50 text-primary-700 border border-primary-100",
        success: "bg-green-50 text-green-700 border border-green-100",
        warning: "bg-amber-50 text-amber-700 border border-amber-100",
        danger: "bg-red-50 text-red-700 border border-red-100",
        google: "bg-google-light text-google",
        microsoft: "bg-microsoft-light text-microsoft",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
