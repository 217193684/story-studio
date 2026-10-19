// Makes the drawing library available to the browser (for the Library page).
import { cpSync, mkdirSync } from "node:fs";
mkdirSync("public/engine", { recursive: true });
cpSync("engine/lib", "public/engine", { recursive: true });
console.log("engine library copied to public/engine");
