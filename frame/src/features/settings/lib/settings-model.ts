import * as m from "$shared/i18n/messages";
import { preferences } from "$domain/preferences";
import { fields } from "./catalog";
import {
  Settings01Icon,
  PaintBoardIcon,
  Add01Icon,
  Layers01Icon,
  Search01Icon,
  Shield01Icon,
  KeyboardIcon,
  Clock01Icon,
  DashboardSpeed01Icon,
  InformationCircleIcon,
  UserMultiple02Icon,
  DashboardSquare02Icon,
} from "@hugeicons/core-free-icons";
/** Navigation order: groups in `groups` order, sections within a group as
 *  listed here. Ids are deep-link targets, so a rename changes titles only. */
const allSections = [
  {
    id: "general",
    group: "browser",
    title: m.section_general,
    description: m.section_general_description,
    icon: Settings01Icon,
  },
  {
    id: "appearance",
    group: "browser",
    title: m.section_appearance,
    description: m.section_appearance_description,
    icon: PaintBoardIcon,
  },
  {
    id: "tabs",
    group: "browser",
    title: m.section_tabs,
    description: m.section_tabs_description,
    icon: Layers01Icon,
  },
  {
    id: "newtab",
    group: "browser",
    title: m.section_newtab,
    description: m.section_newtab_description,
    icon: Add01Icon,
  },
  {
    id: "search",
    group: "browser",
    title: m.section_search,
    description: m.section_search_description,
    icon: Search01Icon,
  },
  {
    id: "privacy",
    group: "browser",
    title: m.section_privacy,
    description: m.section_privacy_description,
    icon: Shield01Icon,
  },
  {
    id: "focus",
    group: "browser",
    title: m.section_focus,
    description: m.section_focus_description,
    icon: Clock01Icon,
  },
  {
    id: "performance",
    group: "browser",
    title: m.section_performance,
    description: m.section_performance_description,
    icon: DashboardSpeed01Icon,
  },
  {
    id: "profiles",
    group: "browser",
    title: m.section_profiles,
    description: m.section_profiles_description,
    icon: UserMultiple02Icon,
  },
  {
    id: "features",
    group: "app",
    title: m.section_features,
    description: m.section_features_description,
    icon: DashboardSquare02Icon,
  },
  {
    id: "shortcuts",
    group: "app",
    title: m.section_shortcuts,
    description: m.section_shortcuts_description,
    icon: KeyboardIcon,
  },
  {
    id: "about",
    group: "app",
    title: m.section_about,
    description: m.section_about_description,
    icon: InformationCircleIcon,
  },
] as const;
export type SettingsSection = (typeof allSections)[number]["id"];
/** Placeholder settings, made to review a design before it works, appear
 *  only in development builds. A release offers only what works. */
export const showPreviews = import.meta.env.DEV;
/** Sections that hold nothing but placeholders today. */
const previewSections = new Set<SettingsSection>();
export const sections = allSections.filter(
  (section) => showPreviews || !previewSections.has(section.id),
);
/** Pages that leave with their feature's switch. */
const featureSections: Partial<Record<SettingsSection, () => boolean>> = {
  focus: () => preferences.enabled("time"),
};
export const shownSections = () =>
  sections.filter((section) => featureSections[section.id]?.() ?? true);
export const groups = [
  { id: "browser", label: m.settings_browser },
  { id: "app", label: m.settings_application },
] as const;
export function searchSettings(query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/u);
  const matches = (text: string) => words.every((word) => text.toLocaleLowerCase().includes(word));
  const offered = shownSections();
  const shown = new Set<string>(offered.map((section) => section.id));
  const preferences = Object.entries(fields)
    .filter(
      ([, field]) =>
        shown.has(field.section) &&
        (showPreviews || !("preview" in field)) &&
        matches(field.label() + " " + field.description()),
    )
    .map(([id, field]) => ({
      id,
      section: field.section,
      label: field.label,
      description: field.description,
      target: id as string | null,
    }));
  const destinations = offered
    .filter(
      (section) =>
        matches(section.title()) && !preferences.some((field) => field.section === section.id),
    )
    .map((section) => ({
      id: `section:${section.id}`,
      section: section.id,
      label: section.title,
      description: section.description,
      target: null as string | null,
    }));
  return [...destinations, ...preferences];
}
export function searchSections(query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/u);
  return shownSections().filter((section) =>
    words.every((word) =>
      [
        section.title(),
        section.description(),
        ...Object.values(fields)
          .filter((f) => f.section === section.id && (showPreviews || !("preview" in f)))
          .flatMap((f) => [f.label(), f.description()]),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(word),
    ),
  );
}
