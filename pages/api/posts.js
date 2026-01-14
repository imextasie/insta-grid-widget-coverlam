import { Client } from "@notionhq/client";

export default async function handler(req, res) {
  const secret = process.env.NOTION_SECRET;
  // Buscando exatamente o nome que está na sua imagem da Vercel
  const rebecaId = process.env.NOTION_DATABASE_REBECA_ID;
  const brutusId = process.env.NOTION_DATABASE_BRUTUS_ID;
  const coverlamId = process.env.NOTION_DATABASE_COVERLAM_ID;

  if (!secret) return res.status(500).json({ detail: "NOTION_SECRET ausente." });

  const notion = new Client({ auth: secret });
  const clientSlug = (req.query.client || "").toLowerCase();

  // Seleção sem "padrão automático" para diagnóstico claro
  let databaseIdRaw = "";
  if (clientSlug === "rebeca" || clientSlug === "rebbeca") {
    databaseIdRaw = rebecaId;
  } else if (clientSlug === "brutus") {
    databaseIdRaw = brutusId;
  } else if (clientSlug === "coverlam") {
    databaseIdRaw = coverlamId;
  } else {
    // Se não houver slug válido, usa Coverlam
    databaseIdRaw = coverlamId;
  }

  // Se o ID for solicitado mas estiver vazio no ambiente da Vercel
  if (!databaseIdRaw) {
    return res.status(500).json({ 
      detail: `O ID para '${clientSlug}' não foi encontrado nas variáveis da Vercel. Verifique o nome da chave.` 
    });
  }

  try {
    const normalize = (id) => {
      const hex = String(id).replace(/[^0-9a-fA-F]/g, "");
      if (hex.length !== 32) return id;
      return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
    };

    const response = await notion.databases.query({
      database_id: normalize(databaseIdRaw),
      filter: { property: "mostrar no widget", checkbox: { equals: true } },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const posts = response.results.map((page) => {
      const props = page.properties;
      const title = props["Name"]?.title?.[0]?.plain_text || props["nome"]?.title?.[0]?.plain_text || "";
      const filesProp = props["Files & media"] || props["imagens e vídeos"] || props["mídia"];
      const files = filesProp?.files || [];
      const mediaUrl = files.length > 0 ? (files[0].type === "file" ? files[0].file.url : files[0].external.url) : "";
      return { id: page.id, title, mediaUrl };
    }).filter(p => p.mediaUrl);

    return res.status(200).json({ posts });
  } catch (err) {
    return res.status(500).json({ detail: err.message, debug_slug: clientSlug });
  }
}