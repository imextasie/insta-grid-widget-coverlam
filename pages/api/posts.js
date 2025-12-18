// pages/api/posts.js
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_SECRET });

function normalizeToUuid(id) {
  if (!id) return id;
  const hex = String(id).replace(/[^0-9a-fA-F]/g, "");
  if (hex.length !== 32) return id;
  return [
    hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)
  ].join("-");
}

export default async function handler(req, res) {
  try {
    const clientSlug = (req.query.client || "coverlam").toLowerCase();
    const rawId = clientSlug === "brutus" 
      ? process.env.NOTION_DATABASE_BRUTUS_ID 
      : process.env.NOTION_DATABASE_COVERLAM_ID;

    const databaseId = normalizeToUuid(rawId);

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "mostrar no widget", // Nome igual nas duas imagens
        checkbox: { equals: true },
      },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const posts = response.results.map((page) => {
      const props = page.properties;

      // Mapeamento Flexível: Tenta um nome, se não achar, tenta o outro
      const title = props["Name"]?.title?.[0]?.plain_text || "";
      
      // Busca a mídia em "Files & media" (Brutus) OU "imagens e vídeos" (Coverlam)
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
    return res.status(500).json({ detail: err.message });
  }
}