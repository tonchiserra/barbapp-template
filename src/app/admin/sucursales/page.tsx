import { requireScope } from "@/lib/auth";
import { getBranches } from "@/lib/queries/branches";
import { BranchesSettings } from "../sections/branches-settings";

export default async function SucursalesPage() {
  const session = await requireScope('turnero:sucursales');

  const branches = await getBranches();

  return <BranchesSettings branches={branches} />;
}
