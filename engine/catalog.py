"""Writes catalog.json: every part in the library (from the drawing code + sound + voices), used by the director and validator."""
import json, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sound, compile as C

js = r"""
const fs=require('fs'),vm=require('vm');const ctx={console,Math,Object,Array,String,JSON};vm.createContext(ctx);
for(const f of ['core','people','animals','props','places','effects']) vm.runInContext(fs.readFileSync(process.argv[1]+'/lib/'+f+'.js','utf8'),ctx);
process.stdout.write(JSON.stringify(vm.runInContext(`({places:PLACE_NAMES,places_meta:Object.fromEntries(PLACE_NAMES.map(n=>[n,{spots:PLACES[n].spots,indoor:!!PLACES[n].indoor}])),
 poses:Object.keys(POSES),exprs:Object.keys(EXPRS),outfits:Object.keys(OUTFITS),hairs:HAIRS,hats:HATS,beards:BEARDS,eyes:EYES,hair_colors:Object.keys(HAIR_COLORS),
 animals:ANIMAL_KINDS,props:PROP_NAMES,effects:EFFECT_NAMES})`,ctx)));
"""
cat = json.loads(subprocess.check_output(["node", "-e", js, str(HERE)]))
cat["held"] = ["phone", "glass", "bottle", "box", "gun", "mic", "book", "food", "money", "torch", "cup", "flower", "bag", "sign", "candle", "umbrella", "knife", "beer"]
cat["sfx"] = sound.SFX_NAMES
cat["moods"] = list(sound.RECIPES) + ["silent"]
cat["voices"] = {"female": C.FEMALE, "male": C.MALE}
cat["animal_poses"] = ["stand", "walk", "run", "sit", "lie", "sleep", "eat", "jump", "fly", "talk"]
cat["point_effects"] = sorted(C.POINT_EFFECTS)
(HERE / "catalog.json").write_text(json.dumps(cat, indent=1))
print({k: len(v) for k, v in cat.items()})
