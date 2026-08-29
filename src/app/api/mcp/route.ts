import { createMcpHandler } from "mcp-handler";
import { buildEvergreenReport } from "@/lib/evergreen-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Remote MCP server (Streamable HTTP) for Tibor's Claude custom connector.
// One read-only tool that returns the full, pre-computed evergreen performance
// report from the Supabase store. Tibor adds this URL once in claude.ai →
// Connectors, then asks questions in natural language.
const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_evergreen_performance",
    {
      title: "Evergreen performanse",
      description:
        "Kompletne performanse Tiborovih evergreen webinara: prijave, show-rate, watch-depth segmenti (no-show/<pitch/pitch/full), konverzije, težinski trendovi (7 i 30 dana), najbolji/najslabiji dani i dnevna tabela. Pozovi ovaj alat za BILO KOJE pitanje o evergreen webinarima; sadrži sve brojeve.",
    },
    async () => {
      const report = await buildEvergreenReport();
      return { content: [{ type: "text" as const, text: report }] };
    }
  );
});

export { handler as GET, handler as POST };
