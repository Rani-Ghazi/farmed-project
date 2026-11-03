import { describe, expect, it } from "vitest";
import { pickAnswers, validateAnswers } from "@/lib/service-questions";

describe("service questions", () => {
  it("keeps only answers of the selected service", () => {
    expect(pickAnswers("solar", { pump_hp: "5", has_tank: "yes" })).toEqual({ pump_hp: 5 });
  });
  it("allows empty drilling depth for water stations", () => {
    expect(validateAnswers("water_station", { has_geo_study: "no" })).toEqual({});
  });
  it("requires yes/no answers for coolers", () => {
    expect(Object.keys(validateAnswers("cooler", {}))).toEqual(["stable_water_line", "has_tank", "has_motor"]);
  });
});
