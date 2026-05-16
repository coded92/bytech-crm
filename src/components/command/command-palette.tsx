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
import { getVisibleQuickActions, searchIconMap } from "@/lib/search/config";
import { globalSearch } from "@/lib/search/global-search";
import type {
  QuickAction,
  SearchGroup,
  SearchProfileAccess,
  SearchResult,
} from "@/lib/search/types";

type CommandPaletteProps = SearchProfileAccess;

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

export function CommandPalette({ role, allowedModules }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        updateOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

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
      <SearchTrigger onClick={() => updateOpen(true)} />

      <Dialog open={open} onOpenChange={updateOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[12vh] max-h-[82vh] max-w-3xl translate-y-0 overflow-hidden p-0 sm:max-w-3xl"
        >
          <DialogTitle className="sr-only">Global command palette</DialogTitle>
          <DialogDescription className="sr-only">
            Search CRM records and run quick actions.
          </DialogDescription>

          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search CRM or run a command..."
                className="h-11 min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
              <span className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 sm:flex">
                <Command className="h-3.5 w-3.5" /> K
              </span>
            </div>
          </div>

          <div className="max-h-[64vh] overflow-y-auto bg-slate-50/80 p-3">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-900">
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-500">
            <span>Use ↑ ↓ to navigate, Enter to open</span>
            <span>Esc closes</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
    <section className="rounded-2xl bg-white p-2 shadow-sm">
      <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
