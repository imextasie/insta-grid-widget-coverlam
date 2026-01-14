// pages/api/posts.js
import { Client } from "@notionhq/client";

export default async function handler(req, res) {
  // Pega as variáveis diretamente do ambiente (Vercel ou Local)
  const secret = process.env.NOTION_SECRET;
  const coverlamId = process.env.NOTION_DATABASE_COVERLAM_ID;
  const brutusId = process.env.NOTION_DATABASE_BRUTUS_ID;

  // Se estiver faltando o segredo, avisamos o erro específico
  if (!secret) {
    return res.status(500).json({ detail: "Falta a configuração NOTION_SECRET na Vercel." });
  }

  const notion = new Client({ auth: secret });

  try {
    const clientSlug = (req.query.client || "coverlam").toLowerCase();
    
    // Seleciona o ID correto
    const rawId = clientSlug === "brutus" ? brutusId : coverlamId;

    if (!rawId) {
      return res.status(500).json({ detail: `ID para o cliente ${clientSlug} não configurado.` });
    }

    // Função interna para formatar o UUID (ajuda o Notion a não dar erro)
    const normalizeUuid = (id) => {
      const hex = String(id).replace(/[^0-9a-fA-F]/g, "");
      if (hex.length !== 32) return id;
      return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
    };

    const databaseId = normalizeUuid(rawId);

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "mostrar no widget",
        checkbox: { equals: true },
      },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const posts = response.results.map((page) => {
      const props = page.properties;
      const title = props["Name"]?.title?.[0]?.plain_text || "";
      const filesProp = props["Files & media"] || props["imagens e vídeos"];
      const files = filesProp?.files || [];
      
      let mediaUrl = "";
      let mediaType = "image";

      if (files.length > 0) {
        mediaUrl = files[0].type === "file" ? files[0].file.url : files[0].external.url;
        if (mediaUrl.toLowerCase().match(/\.(mp4|mov|webm)/)) mediaType = "video";
      }

      return {
        id: page.id,
        title,
        mediaUrl,
        mediaType,
        format: props["formato"]?.select?.name?.toUpperCase() || "",
      };
    }).filter(p => p.mediaUrl);

    return res.status(200).json({ posts });
  } catch (err) {
    console.error("Erro na API:", err);
    return res.status(500).json({ detail: err.message });
  }
}