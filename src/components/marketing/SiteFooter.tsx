import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { footerColumns, socialLinks } from "./site-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#dcd5c7] bg-[#f7f4ee] py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-base font-black tracking-tight text-[#13251d]">Sarit Classes</span>
          </div>
          <p className="mt-3 max-w-xs text-sm font-semibold leading-6 text-[#536259]">
            One connected system to learn, practise and revise for UPSC — honestly.
          </p>
        </div>
        {footerColumns.map((col) => (
          <div key={col.heading}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8c5d14]">{col.heading}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm font-semibold text-[#536259] transition hover:text-[#13251d]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-[#dcd5c7] px-4 pt-6 md:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs font-semibold text-[#8a8173]">
            © {new Date().getFullYear()} Sarit Classes. Built for UPSC aspirants, honestly.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8a8173] hover:text-[#1d9e75] transition-colors"
                aria-label={social.label}
              >
                <span className="text-xs font-bold uppercase tracking-wide">{social.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
