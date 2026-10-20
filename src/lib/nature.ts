/** Nature videos: a real moving nature clip (free from Pixabay), looped, with matching real nature sounds and soft music. */

// bed = [real recording in engine/sounds, volume]; thunder = rolls of thunder now and then
export type Sound = { label: string; beds: [string, number][]; thunder?: boolean };
export type Env = { label: string; emoji: string; search: string; sounds: Record<string, Sound> };

export const ENVIRONMENTS: Record<string, Env> = {
  rain: {
    label: "Rain", emoji: "🌧️", search: "rain nature",
    sounds: {
      light: { label: "Light rain", beds: [["amb_rain", 1]] },
      heavy: { label: "Heavy rain", beds: [["amb_rain_heavy", 1]] },
      storm: { label: "Heavy rain + thunder", beds: [["amb_rain_heavy", 1]], thunder: true },
      leaves: { label: "Rain on leaves", beds: [["amb_rain_leaves", 1]] },
    },
  },
  forest: {
    label: "Forest", emoji: "🌲", search: "forest trees sunlight",
    sounds: {
      birds: { label: "Birdsong", beds: [["amb_forest", .8], ["amb_birds", .8]] },
      wind: { label: "Wind in the trees", beds: [["amb_forest", 1], ["amb_wind", .6]] },
      stream: { label: "Forest stream", beds: [["amb_stream", 1], ["amb_birds", .3]] },
      rain: { label: "Rain in the forest", beds: [["amb_rain_leaves", 1]] },
      storm: { label: "Forest thunderstorm", beds: [["amb_rain_heavy", 1]], thunder: true },
    },
  },
  sunset: {
    label: "Sunset", emoji: "🌅", search: "sunset landscape",
    sounds: {
      breeze: { label: "Gentle breeze", beds: [["amb_wind", 1], ["amb_evening", .3]] },
      birds: { label: "Evening birds", beds: [["amb_evening", 1], ["amb_wind", .35]] },
      waves: { label: "Waves at sunset", beds: [["amb_waves", 1], ["amb_wind", .25]] },
    },
  },
  lake: {
    label: "Lake & water lilies", emoji: "🪷", search: "lake water lily",
    sounds: {
      water: { label: "Gentle water", beds: [["amb_lake", 1]] },
      evening: { label: "Water + crickets", beds: [["amb_lake", 1], ["amb_night", .5]] },
      rain: { label: "Rain on the lake", beds: [["amb_lake", .6], ["amb_rain", 1]] },
    },
  },
  ocean: {
    label: "Ocean & beach", emoji: "🌊", search: "ocean waves beach",
    sounds: {
      waves: { label: "Waves", beds: [["amb_waves", 1]] },
      windy: { label: "Waves + wind", beds: [["amb_waves", 1], ["amb_wind", .5]] },
      storm: { label: "Stormy sea", beds: [["amb_waves", 1], ["amb_rain_heavy", .6]], thunder: true },
    },
  },
  waterfall: {
    label: "Waterfall & river", emoji: "💧", search: "waterfall",
    sounds: {
      waterfall: { label: "Waterfall", beds: [["amb_waterfall", 1]] },
      river: { label: "Flowing river", beds: [["amb_stream", 1]] },
      birds: { label: "River + birds", beds: [["amb_stream", 1], ["amb_birds", .4]] },
    },
  },
  mountains: {
    label: "Mountains", emoji: "🏔️", search: "mountains clouds landscape",
    sounds: {
      wind: { label: "Mountain wind", beds: [["amb_wind", 1]] },
      birds: { label: "Wind + birds", beds: [["amb_wind", .7], ["amb_birds", .5]] },
      stream: { label: "Mountain stream", beds: [["amb_stream", 1], ["amb_wind", .4]] },
    },
  },
  snow: {
    label: "Snowfall", emoji: "❄️", search: "snowfall winter forest",
    sounds: {
      wind: { label: "Soft winter wind", beds: [["amb_wind", 1]] },
      fire: { label: "Fireplace", beds: [["amb_fire", 1], ["amb_wind", .4]] },
    },
  },
  cabin: {
    label: "House in the woods", emoji: "🏡", search: "cabin forest",
    sounds: {
      rain: { label: "Rain on the roof", beds: [["amb_rain", 1]] },
      fire: { label: "Fireplace", beds: [["amb_fire", 1]] },
      storm: { label: "Thunderstorm", beds: [["amb_rain_heavy", 1]], thunder: true },
      birds: { label: "Birds", beds: [["amb_forest", .7], ["amb_birds", .7]] },
    },
  },
  meadow: {
    label: "Flower meadow", emoji: "🌼", search: "flower meadow wind",
    sounds: {
      breeze: { label: "Breeze + birds", beds: [["amb_wind", 1], ["amb_birds", .55]] },
      summer: { label: "Summer evening", beds: [["amb_night", 1], ["amb_evening", .4], ["amb_wind", .3]] },
    },
  },
  night: {
    label: "Night sky", emoji: "🌌", search: "night sky stars",
    sounds: {
      crickets: { label: "Crickets", beds: [["amb_night", 1]] },
      breeze: { label: "Crickets + breeze", beds: [["amb_night", 1], ["amb_wind", .4]] },
    },
  },
};

// soft music under the nature sound; "code" ones are made by the video maker for free
export const MUSIC: Record<string, { label: string; about: string }> = {
  none: { label: "No music", about: "Nature sounds only" },
  piano: { label: "Soft guitar & piano", about: "Slow calm guitar and piano" },
  chimes: { label: "Wind chimes", about: "Gentle chimes in the breeze" },
  bowls: { label: "Singing bowls", about: "Deep, slow meditation bowls" },
  pad: { label: "Dreamy pads", about: "Warm floating chords" },
  lofi: { label: "Lofi", about: "Chill beats for studying" },
};

export const NATURE_LENGTHS = [10, 30, 60, 90, 120, 180] as const;

export type Clip = { id: number; url: string; page: string; user: string; thumb: string; preview: string; duration: number; width: number; tags: string };
export type NatureOptions = { env: string; sound: string; music: string; clip: Clip; beds: [string, number][]; thunder: boolean };

const SOUND_WORDS: Record<string, string> = { light: "Rain Sounds", heavy: "Heavy Rain", storm: "Thunderstorm", leaves: "Rain on Leaves" };
export function natureYoutube(o: NatureOptions, minutes: number) {
  const E = ENVIRONMENTS[o.env], S = E?.sounds[o.sound], M = MUSIC[o.music];
  const len = minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} Hour${minutes >= 120 ? "s" : ""}` : `${minutes} Minutes`;
  const sound = SOUND_WORDS[o.sound] || S?.label || "Nature Sounds";
  const withMusic = o.music !== "none" && M ? ` & ${M.label}` : "";
  const title = `${sound}${withMusic} | ${E?.label || "Nature"} ${E?.emoji || ""} | ${len} for Sleep, Study & Relaxation`.replace(/\s+/g, " ").slice(0, 98);
  const description = `Relax with ${len.toLowerCase()} of ${(S?.label || "nature sounds").toLowerCase()}${withMusic.toLowerCase()} — ${E?.label.toLowerCase() || "nature"} scenery to help you sleep, study, focus, meditate or simply unwind.\n\nPut it on, dim the lights and breathe slowly.\n\nIf this helped you relax, subscribe for new calming nature videos every week, and tell us in the comments which place we should visit next.\n\nVideo by ${o.clip.user} on Pixabay: ${o.clip.page}`;
  const tags = ["nature sounds", "relaxing", "sleep sounds", "study", "meditation", "calm", "ambient", (S?.label || "").toLowerCase(), (E?.label || "").toLowerCase(), `${len.toLowerCase()}`, "white noise", "relaxation", "deep sleep", "stress relief", ...(o.music !== "none" && M ? [M.label.toLowerCase(), "relaxing music"] : [])].filter(Boolean);
  return { title, description, tags };
}
