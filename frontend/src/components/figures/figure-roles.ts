import { Crown, Feather, Flag, Landmark, Swords, type LucideIcon } from "lucide-react";
import { FIGURE_ROLE_LABELS, FigureRole } from "@/constants/enums";

export const FIGURE_ROLE_ORDER: FigureRole[] = [
  FigureRole.MONARCH,
  FigureRole.GENERAL,
  FigureRole.SCHOLAR,
  FigureRole.REVOLUTIONARY,
  FigureRole.POLITICIAN,
];

export const FIGURE_ROLE_ICONS: Record<FigureRole, LucideIcon> = {
  [FigureRole.MONARCH]: Crown,
  [FigureRole.GENERAL]: Swords,
  [FigureRole.SCHOLAR]: Feather,
  [FigureRole.REVOLUTIONARY]: Flag,
  [FigureRole.POLITICIAN]: Landmark,
};

export function isFigureRole(value: string): value is FigureRole {
  return value in FIGURE_ROLE_LABELS;
}

export function figureRoles(roles: string[]): FigureRole[] {
  return roles.filter(isFigureRole);
}
