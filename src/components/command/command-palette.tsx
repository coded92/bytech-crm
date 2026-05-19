"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command, Loader2, Search, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchResultRow } from "@/components/search/search-result-row";
import { SearchTrigger } from "@/components/search/search-trigger";
import {
  canAccessModule,
  getVisibleQuickActions,
  searchIconMap,
} from "@/lib/search/config";
import { globalSearch } from "@/lib/search/global-search";
import type {
  QuickAction,
  SearchGroup,
  SearchProfileAccess,
  SearchResult,
} from "@/lib/search/types";

type CommandPaletteProps = SearchProfileAccess & {
  keyboardShortcutsEnabled?: boolean;
};

type NavigationShortcut = {
  key: string;
  href: string;
  module?: SearchGroup["id"];
};

const navigationShortcuts: NavigationShortcut[] = [
  { key: "d", href: "/dashboard" },
  { key: "c", href: "/customers", module: "customers" },
  { key: "l", href: "/leads", module: "leads" },
  { key: "p", href: "/projects", module: "projects" },
  { key: "i", href: "/payments", module: "payments" },
  { key: "s", href: "/support", module: "support" },
  { key: "f", href: "/field-jobs", module: "field_jobs" },
  { key: "r", href: "/reports", module: "reports" },
];

type PaletteItem =
  | {
      id: string;
      kind: "action";
      href: string;
      title: string;
      subtitle: string;
      action: QuickAction;
    }
  | {
      id: string;
      kind: "result";
      href: string;
      title: string;
      subtitle: string;
      badge?: string;
      group: SearchGroup;
      result: SearchResult;
    };

export function CommandPalette({
  role,
  allowedModules,
  keyboardShortcutsEnabled = true,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [awaitingNavigationKey, setAwaitingNavigationKey] = useState(false);

  const access = useMemo(
    () => ({ role, allowedModules }),
    [role, allowedModules]
  );

  const visibleActions = useMemo(
    () => getVisibleQuickActions(access),
    [access]
  );

  const filteredActions = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return visibleActions;

    return visibleActions.filter((action) =>
      [action.label, action.description, ...action.keywords]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, visibleActions]);

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const actionItems = filteredActions.map((action) => ({
      id: action.id,
      kind: "action" as const,
      href: action.href,
      title: action.label,
      subtitle: action.description,
      action,
    }));

    const resultItems = groups.flatMap((group) =>
      group.results.map((result) => ({
        id: `${group.id}-${result.id}`,
        kind: "result" as const,
        href: result.href,
        title: result.title,
        subtitle: result.subtitle,
        badge: result.badge,
        group,
        result,
      }))
    );

    return query.trim().length >= 2 ? [...resultItems, ...actionItems] : actionItems;
  }, [filteredActions, groups, query]);

  function updateOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    setAwaitingNavigationKey(false);

    if (nextOpen) {
      setActiveIndex(0);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function runItem(item: PaletteItem | undefined) {
    if (!item) return;

    updateOpen(false);
    setQuery("");
    setGroups([]);
    router.push(item.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        paletteItems.length === 0 ? 0 : (index + 1) % paletteItems.length
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        paletteItems.length === 0
          ? 0
          : (index - 1 + paletteItems.length) % paletteItems.length
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();
      runItem(paletteItems[activeIndex]);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);

    if (value.trim().length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!keyboardShortcutsEnabled || isEditableTarget(event.target)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        updateOpen(true);
        return;
      }

      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        updateOpen(true);
        return;
      }

      if (event.key.toLowerCase() === "g" && !awaitingNavigationKey) {
        event.preventDefault();
        setAwaitingNavigationKey(true);
        window.setTimeout(() => setAwaitingNavigationKey(false), 900);
        return;
      }

      if (awaitingNavigationKey) {
        const shortcut = navigationShortcuts.find(
          (item) => item.key === event.key.toLowerCase()
        );

        setAwaitingNavigationKey(false);

        if (!shortcut) {
          return;
        }

        if (shortcut.module && !canAccessModule(shortcut.module, access)) {
          return;
        }

        event.preventDefault();
        router.push(shortcut.href);
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [access, awaitingNavigationKey, keyboardShortcutsEnabled, router]);

  useEffect(() => {
    const value = query.trim();

    if (!open || value.length < 2) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      const nextGroups = await globalSearch(value);
      setGroups(nextGroups);
      setLoading(false);
      setActiveIndex(0);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [open, query]);

  const hasQuery = query.trim().length >= 2;
  const hasResults = groups.some((group) => group.results.length > 0);

  return (
    <>
      <SearchTrigger
        keyboardShortcutsEnabled={keyboardShortcutsEnabled}
        onClick={() => updateOpen(true)}
      />

      <Dialog open={open} onOpenChange={updateOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[8vh] max-h-[86vh] w-[calc(100vw-24px)] max-w-3xl translate-y-0 overflow-hidden rounded-[2rem] border-white/80 bg-white p-0 shadow-2xl shadow-indigo-200/70 sm:top-[12vh] sm:max-w-3xl"
        >
          <DialogTitle className="sr-only">Global command palette</DialogTitle>
          <DialogDescription className="sr-only">
            Search CRM records and run quick actions.
          </DialogDescription>

          <div className="border-b border-indigo-100 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <Search className="size-5 text-[#4F46E5]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search CRM or run a command..."
                className="h-11 min-w-0 flex-1 bg-transparent text-base text-[#111827] outline-none placeholder:text-slate-400"
              />
              <span className="hidden items-center gap-1 rounded-xl border border-indigo-100 bg-[#F1F0FC] px-2 py-1 text-xs font-semibold text-slate-500 sm:flex">
                <Command className="size-3.5" /> K
              </span>
            </div>
          </div>

          <div className="max-h-[68vh] overflow-y-auto bg-[#F1F0FC]/70 p-3 sm:max-h-[64vh]">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm shadow-indigo-100">
                <Loader2 className="size-4 animate-spin" />
                Searching CRM records...
              </div>
            ) : null}

            {!loading && !hasQuery ? (
              <PaletteSection title="Quick actions">
                {filteredActions.map((action, index) => (
                  <SearchResultRow
                    key={action.id}
                    title={action.label}
                    subtitle={action.description}
                    icon={action.icon}
                    active={paletteItems[activeIndex]?.id === action.id}
                    onSelect={() => runItem(paletteItems[index])}
                  />
                ))}
              </PaletteSection>
            ) : null}

            {!loading && hasQuery && !hasResults && filteredActions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-8 text-center">
                <Sparkles className="mx-auto size-5 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-[#111827]">
                  No matching records or commands
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try a customer name, invoice number, job number, or project code.
                </p>
              </div>
            ) : null}

            {!loading && hasQuery ? (
              <div className="space-y-3">
                {groups.map((group) => {
                  const Icon = searchIconMap[group.id];

                  return (
                    <PaletteSection key={group.id} title={group.label}>
                      {group.results.map((result) => {
                        const itemIndex = paletteItems.findIndex(
                          (item) => item.id === `${group.id}-${result.id}`
                        );

                        return (
                          <SearchResultRow
                            key={result.id}
                            title={result.title}
                            subtitle={result.subtitle}
                            badge={result.badge}
                            icon={Icon}
                            active={paletteItems[activeIndex]?.id === `${group.id}-${result.id}`}
                            onSelect={() => runItem(paletteItems[itemIndex])}
                          />
                        );
                      })}
                    </PaletteSection>
                  );
                })}

                {filteredActions.length > 0 ? (
                  <PaletteSection title="Commands">
                    {filteredActions.map((action) => {
                      const itemIndex = paletteItems.findIndex(
                        (item) => item.id === action.id
                      );

                      return (
                        <SearchResultRow
                          key={action.id}
                          title={action.label}
                          subtitle={action.description}
                          icon={action.icon}
                          active={paletteItems[activeIndex]?.id === action.id}
                          onSelect={() => runItem(paletteItems[itemIndex])}
                        />
                      );
                    })}
                  </PaletteSection>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-indigo-100 bg-white px-4 py-2 text-[11px] text-slate-500">
            <span>Use ↑ ↓ to navigate, Enter to open</span>
            <span>
              {keyboardShortcutsEnabled
                ? "Esc closes | / or ⌘K opens"
                : "Esc closes | shortcuts disabled"}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

function PaletteSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-2 shadow-sm shadow-indigo-100">
      <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
