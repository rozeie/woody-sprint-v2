"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReaderEnv } from "./reader/reader-env";
import { HomeIcon, LibraryIcon, SettingsIcon } from "./ui/icons";

// PRD 확정: GNB는 홈 / 서재 / 설정 3개. 온보딩·리더에서는 표시하지 않는다.
const TABS = [
  { key: "home", label: "홈", Icon: HomeIcon },
  { key: "library", label: "서재", Icon: LibraryIcon },
  { key: "settings", label: "설정", Icon: SettingsIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { paths } = useReaderEnv();
  return (
    <nav
      aria-label="주요 메뉴"
      className="sticky bottom-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {TABS.map(({ key, label, Icon }) => {
          const href = paths[key];
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 px-2 text-nav ${
                  active ? "font-bold text-primary" : "font-medium text-fg-muted"
                }`}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
