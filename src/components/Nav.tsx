"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const p = usePathname();
  if (p === "/login") return <div className="top"><span className="logo"><i />Story Studio</span></div>;
  const link = (href: string, label: string) => <Link href={href} aria-current={(href === "/" ? p === "/" || p.startsWith("/stories") : p.startsWith(href)) ? "page" : undefined}>{label}</Link>;
  return (
    <header className="top">
      <Link href="/" className="logo"><i />Story Studio</Link>
      <nav className="nav">{link("/", "My stories")}{link("/new", "New story")}{link("/calm", "Calm videos")}{link("/library", "Library")}</nav>
    </header>
  );
}
