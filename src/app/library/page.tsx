import Library from "@/components/Library";
import catalog from "../../../engine/catalog.json";
export default function Page() {
  const c = catalog as unknown as Record<string, unknown[]>;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1>Library</h1>
      <p className="muted" style={{ maxWidth: 680, margin: 0 }}>Everything the studio can put in a video, drawn live by the same code that makes them. Claude builds every scene from these parts. It mixes them to make new people, so no two stories look the same.</p>
      <p className="small muted" style={{ margin: 0 }}>{(c.places as unknown[]).length} places, {(c.poses as unknown[]).length} poses, {(c.exprs as unknown[]).length} faces, {(c.outfits as unknown[]).length} outfits, {(c.hairs as unknown[]).length} hairstyles, {(c.animals as unknown[]).length} animals and creatures, {(c.props as unknown[]).length} props, {(c.effects as unknown[]).length} effects, {(c.sfx as unknown[]).length} sounds and {(c.moods as unknown[]).length} kinds of music.</p>
      <Library catalog={c} />
    </div>
  );
}
