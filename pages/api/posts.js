// pages/api/posts.js

const NOTION_SECRET = process.env.NOTION_SECRET;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

/**
 * Converte uma página do Notion no formato de "post" usado pelo widget
 */
function mapPageToPost(page) {
  const props = page.properties || {};

  // título (coluna "Name")
  const nameProp = props["Name"];

  // coluna de arquivos – tentamos vários nomes possíveis
  const midiaProp =
    props["imagens e vídeos"] || // com acento (mais provável)
    props["imagens e videos"] || // sem acento, se você mudar depois
    props["Imagem"] ||
    props["imagens"] ||
    props["imagens e vídeo"];

  // coluna de formato (feed / carrossel / video etc)
  const formatoProp = props["formato"];

  // checkbox "mostrar no widget"
  const mostrarProp = props["mostrar no widget"];

  const title =
    nameProp?.title?.[0]?.plain_text?.trim() || "sem título";

  // mídia
  let mediaUrl = null;
  let mediaType = "image";

  if (midiaProp?.files?.length) {
    const file = midiaProp.files[0];

    if (file.type === "file") {
      mediaUrl = file.file.url;
    } else if (file.type === "external") {
      mediaUrl = file.external.url;
    }

    const cleanUrl = (mediaUrl || "").split("?")[0];
    if (/\.(mp4|mov|webm|m4v)$/i.test(cleanUrl)) {
      mediaType = "video";
    }
  }

  const format = formatoProp?.select?.name || null;
  const mostrarNoWidget = !!mostrarProp?.checkbox;

  return {
    id: page.id,
    title,
    mediaUrl,
    mediaType,
    format,
    mostrarNoWidget,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!NOTION_SECRET || !NOTION_DATABASE_ID) {
    return res.status(500).json({
      error: "Configuração faltando",
      detail:
        "NOTION_SECRET ou NOTION_DATABASE_ID não estão definidos no .env.local",
    });
  }

  try {
    // 1) Busca as páginas do banco, SEM filtro no Notion
    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_SECRET}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [
            {
              timestamp: "created_time",
              direction: "descending",
            },
          ],
          page_size: 100,
        }),
      }
    );

    if (!notionRes.ok) {
      const errData = await notionRes.json().catch(() => null);
      console.error("Erro bruto da API Notion:", errData || notionRes.status);
      return res.status(500).json({
        error: "Erro ao consultar Notion",
        detail: errData || { status: notionRes.status },
      });
    }

    const data = await notionRes.json();
    const results = data.results || [];

    console.log("Total de páginas retornadas pelo Notion:", results.length);

    const allPosts = results.map(mapPageToPost);

    const marcados = allPosts.filter((p) => p.mostrarNoWidget);
    console.log("Com 'mostrar no widget' marcado:", marcados.length);

    // 2) Agora filtramos só o que tem mídia E está marcado pro widget
    const posts = marcados.filter((p) => p.mediaUrl);

    console.log("Total de posts enviados pro widget:", posts.length);

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Erro em /api/posts:", error);
    return res.status(500).json({
      error: "Erro inesperado ao carregar posts",
      detail: error.message || String(error),
    });
  }
}
