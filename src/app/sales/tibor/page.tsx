import { redirect } from "next/navigation";

// Ruta je premeštena na /tibor (URL više ne sadrži "sales"). Stari link
// /sales/tibor preusmeravamo da bookmark-ovi / GHL linkovi ne puknu.
export default function LegacySalesTiborRedirect() {
  redirect("/tibor");
}
