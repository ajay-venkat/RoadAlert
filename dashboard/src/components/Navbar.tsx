"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <div className="navbar-logo">R</div>
        <span className="navbar-title">RoadWatch AI</span>
      </Link>

      <ul className="navbar-nav">
        <li>
          <Link
            href="/"
            className={`navbar-link ${pathname === "/" ? "active" : ""}`}
          >
            🗺️ Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="/analytics"
            className={`navbar-link ${pathname === "/analytics" ? "active" : ""}`}
          >
            📊 Analytics
          </Link>
        </li>
        <li>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-link"
          >
            ⚡ API
          </a>
        </li>
      </ul>
    </nav>
  );
}
