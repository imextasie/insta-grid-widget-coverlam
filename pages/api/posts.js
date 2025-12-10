// pages/api/posts.js
import { Client } from "@notionhq/client";

// Cliente do Notion
const notion = new Client({
  auth: process.env.NOTION_SECRET,
});

/**
 * Busca o data_source (fonte de dados) a partir do ID do database
 * (o database agora é só o "container" no modelo novo da API).
 */
async function getDataSourceId() {
  const dbId = process.env.NOTION_DATABASE_ID?.trim();

  if (!dbId) {
    throw new Error(
      "A variável NOTION_DATABASE_ID não está definida no .env.local"
    );
  }

  const database = await notion.databases.retrieve({
    database_id: dbId,
  });

  const dataSources = database.data_sources || [];

  if (!dataSources.length) {
    throw new Error(
      `O database ${dbId} não tem nenhum data source. Verifique no Notion.`
    );
  }

  const first = dataSources[0];

  console.log("Data source escolhido:", {
    id: first.id,
    name: first.name,
  });

  return first.id;
}

/**
 * Mapeia uma página do Notion para o formato de "post"
 */
function mapPageToPost(page) {
  const props = page.properties || {};

  const titleProp = props["Título do Post"];
  const imageProp = props["Imagem"];
  const dateProp = props["Data de Postagem"];
  const platformProp = props["Plataforma"];
  const formatProp = props["Formato"];

  // título: tenta Título do Post, depois Name, depois fallback
  const titleRaw =
    titleProp?.title?.[0]?.plain_text ??
    props.Name?.title?.[0]?.plain_text ??
    "sem título";

  const title = titleRaw.trim();

  // mídia (imagem ou vídeo)
  let mediaUrl = null;
  let mediaType = "image"; // "image" | "video"

  if (imageProp?.files?.length) {
    const file = imageProp.files[0];

    if (file.type === "file") {
      mediaUrl = file.file.url;
    } else if (file.type === "external") {
      mediaUrl = file.external.url;
    }

    // Se a URL terminar com extensão de vídeo, marcamos como vídeo
    if (
      mediaUrl &&
      /\.(mp4|mov|webm|m4v)$/i.test(mediaUrl.split("?")[0] || mediaUrl)
    ) {
      mediaType = "video";
    }
  }

  const date = dateProp?.date?.start || null;

  return {
    id: page.id,
    title,
    mediaUrl,
    mediaType,
    date,
    platform: platformProp?.select?.name || null,
    format: formatProp?.select?.name || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // 1) Descobre o data_source a partir do database_id do .env
    const dataSourceId = await getDataSourceId();

    // 2) Faz a query usando a API nova: dataSources.query
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
      page_size: 100,
    });

    console.log(`Total de posts retornados: ${response.results.length}`);

    const allPosts = response.results.map(mapPageToPost);

    // 3) Filtra só o que você quer no widget
    const posts = allPosts
      .filter((post) => post.mediaUrl) // só posts com mídia
      .filter((post) => {
        const platform = post.platform?.toLowerCase();
        const format = post.format?.toLowerCase();
        // incluir feed + carrossel (ajusta como quiser)
        return (
          platform === "instagram" &&
          (format === "feed" || format === "carrossel" || format === "reels")
        );
      });

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Erro em API /api/posts:", error.body || error);
    return res.status(500).json({
      error: "Erro ao carregar posts",
      detail: error.body || error.message,
    });
  }
}
