export type Role = "admin" | "owner" | "manager" | "employee";

export type Scope =
  // Landing page sections
  | "landing:header"
  | "landing:carousel"
  | "landing:video"
  | "landing:gallery"
  | "landing:multicolumn"
  | "landing:mapa"
  | "landing:footer"
  | "landing:estilos"
  | "landing:ranking"
  // Turnero sections
  | "turnero:configuracion"
  | "turnero:dashboard"
  | "turnero:sucursales"
  | "turnero:equipo"
  | "turnero:clientes"
  | "turnero:cupones"
  | "turnero:email"
  | "turnero:puntos"
  | "turnero:productos";

const ALL_SCOPES: readonly Scope[] = [
  "landing:header",
  "landing:carousel",
  "landing:video",
  "landing:gallery",
  "landing:multicolumn",
  "landing:mapa",
  "landing:footer",
  "landing:estilos",
  "turnero:configuracion",
  "turnero:dashboard",
  "turnero:sucursales",
  "turnero:equipo",
  "turnero:clientes",
  "turnero:cupones",
  "turnero:email",
  "turnero:puntos",
  "turnero:productos",
  "landing:ranking",
] as const;

export const ROLE_SCOPES: Record<Role, readonly Scope[]> = {
  admin: ALL_SCOPES,
  owner: ALL_SCOPES,
  manager: [
    "turnero:configuracion",
    "turnero:dashboard",
    "turnero:sucursales",
    "turnero:equipo",
    "turnero:clientes",
    "turnero:cupones",
    "turnero:email",
    "turnero:puntos",
    "turnero:productos",
  ],
  employee: ["turnero:dashboard", "turnero:equipo", "turnero:productos"],
};

export function hasScope(role: Role, scope: Scope): boolean {
  return (ROLE_SCOPES[role] as readonly string[]).includes(scope);
}

export function getDefaultRoute(role: Role): string {
  return "/admin/dashboard";
}
