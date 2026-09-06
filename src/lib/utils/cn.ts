import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Class-name helper untuk menggabungkan Tailwind utility classes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
