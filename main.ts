interface TranslationRequest {
  text: string;
  source_lang: string;
  target_lang: string;
}

interface GoogleTranslationResponse {
  sentences?: Array<{
    trans?: string;
  }>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method === "GET" && url.pathname === "/") {
    return Response.json(
      {
        message: "Translation service is running",
        endpoint: "POST /translate",
      },
      {
        headers: corsHeaders,
      },
    );
  }

  if (request.method !== "POST" || url.pathname !== "/translate") {
    return Response.json(
      {
        code: 404,
        error: "Not found",
      },
      {
        status: 404,
        headers: corsHeaders,
      },
    );
  }

  try {
    const body = await request.json() as TranslationRequest;

    if (
      typeof body.text !== "string" ||
      typeof body.source_lang !== "string" ||
      typeof body.target_lang !== "string"
    ) {
      return Response.json(
        {
          code: 400,
          error: "text、source_lang 和 target_lang 都是必填字段",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const translationURL = new URL(
      "https://translate.google.com/translate_a/single",
    );

    translationURL.search = new URLSearchParams({
      client: "gtx",
      dt: "t",
      dj: "1",
      ie: "UTF-8",
      sl: body.source_lang.toLowerCase(),
      tl: body.target_lang.toLowerCase(),
      q: body.text,
    }).toString();

    const translationResponse = await fetch(translationURL);

    if (!translationResponse.ok) {
      throw new Error(
        `Translation service returned ${translationResponse.status}`,
      );
    }

    const data =
      await translationResponse.json() as GoogleTranslationResponse;

    const translatedText = data.sentences
      ?.map((item) => item.trans ?? "")
      .join("") ?? "";

    return Response.json(
      {
        code: 200,
        data: translatedText,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        code: 502,
        error: "Failed to connect to translation service",
      },
      {
        status: 502,
        headers: corsHeaders,
      },
    );
  }
}

export default {
  fetch: handler,
};
