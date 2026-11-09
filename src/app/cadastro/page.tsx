import { redirect } from "next/navigation";
import { safeInternalRedirect } from "@/lib/safe-redirect";

export default function CadastroPage() {
  redirect(safeInternalRedirect("/login"));
}
