import { Droplets, Factory, Hammer, Network, School, Snowflake, Sun, Wrench, type LucideIcon } from "lucide-react";

export const serviceIcon: Record<string, LucideIcon> = {
  cooler: Snowflake,
  well_drilling: Droplets,
  solar: Sun,
  well_maintenance: Wrench,
  water_station: Factory,
  water_network: Network,
  school_maintenance: School,
  other: Hammer,
};
