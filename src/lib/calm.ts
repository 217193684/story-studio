/** Calm (sleep / study / ASMR) loop videos: the scenes the video maker can draw, and YouTube details for each. */
export const WEATHER = { rain: "Rain", storm: "Rain + thunder", wind: "Wind", clear: "Clear night" } as const;
export type Weather = keyof typeof WEATHER;
export const weatherLabel = (scene: string, w: string) => (scene === "farm" ? "Sunny day" : WEATHER[w as Weather] || w);

export const CALM_SCENES = {
  cat_sleep: { label: "Sleeping cat", about: "Curled up in a basket by the window, breathing slowly, z z z.", weathers: ["rain", "storm", "clear"], sound: "purring" },
  cat_lofi: { label: "Lofi cat with headphones", about: "Nodding along at the laptop, lazy eyes, yawns, music notes.", weathers: ["rain", "clear"], sound: "lofi beats" },
  cat_cooking: { label: "Cat cooking", about: "Chopping, stirring and tasting soup in a cozy kitchen.", weathers: ["rain", "storm", "wind"], sound: "cooking ASMR" },
  cat_meal: { label: "Cat's late-night meal", about: "Opens its lunch box, eats and sips tea on a rainy night.", weathers: ["rain"], sound: "eating ASMR" },
  farm: { label: "Farm from above", about: "Swaying trees, a pond, cows, chickens, and a dog running by.", weathers: ["clear"], sound: "farm and birds" },
} as const;
export type CalmScene = keyof typeof CALM_SCENES;
export const LENGTHS = [10, 30, 60, 90, 120, 180] as const;

const WEATHER_WORDS: Record<Weather, string> = { rain: "Rain Sounds", storm: "Thunderstorm & Rain", wind: "Gentle Wind", clear: "Night Ambience" };

export function youtubeFor(scene: CalmScene, weather: Weather, minutes: number) {
  const S = CALM_SCENES[scene]; const len = minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} Hour${minutes >= 120 ? "s" : ""}` : `${minutes} Minutes`;
  const nature = scene === "farm" ? "Farm & Birdsong" : WEATHER_WORDS[weather];
  const use = scene === "cat_lofi" ? "Study / Relax" : scene.startsWith("cat_c") || scene === "cat_meal" ? "ASMR / Relax" : "Sleep / Relax";
  const title = `${S.label} 🐾 ${nature} for ${use} | ${len} Cozy Animation`.slice(0, 98);
  const description = `${S.about} A cozy ${len.toLowerCase()} animated loop with ${S.sound} and ${nature.toLowerCase()}, made for sleeping, studying, reading or just slowing down.\n\nPut it on in the background, dim the lights and breathe.\n\nIf it helped you relax, subscribe for a new cozy video every week. Which scene should we make next? Tell us in the comments.`;
  const tags = ["cozy animation", "relaxing", "sleep sounds", "study music", "asmr", "cat animation", nature.toLowerCase(), `${len.toLowerCase()} loop`, "ambient", "calm", "rain sounds", "lofi", "relaxing video", "cute cat", "white noise"];
  return { title, description, tags };
}
