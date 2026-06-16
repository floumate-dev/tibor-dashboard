import { redirect } from "next/navigation";

// Ruta je premeštena na /tibor (URL više ne sadrži "sales"). Stari link
// /sales/tibor preusmeravamo da bookmark-ovi / GHL linkovi ne puknu.
// force-dynamic da redirect() vrati pravi 307 sa Location header-om (statički
// prerender bi emitovao RSC soft-redirect bez Location-a).
export const dynamic = "force-dynamic";

export default function LegacySalesTiborRedirect() {
  redirect("/tibor");
}
