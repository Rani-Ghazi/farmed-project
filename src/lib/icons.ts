import { Droplets, Hammer, Snowflake, Sun, Wrench, type LucideIcon } from "lucide-react";

export const serviceIcon: Record<string, LucideIcon> = {
  cooler: Snowflake,
  well_drilling: Droplets,
  solar: Sun,
  well_maintenance: Wrench,
  other: Hammer,
};
