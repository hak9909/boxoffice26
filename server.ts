import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Daily Box Office
  app.get("/api/boxoffice", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== "string" || !/^\d{8}$/.test(date)) {
        res.status(400).json({ error: "올바른 날짜 형식(YYYYMMDD)을 입력하세요." });
        return;
      }

      const apiKey = process.env.KOBIS_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "KOBIS API KEY가 설정되지 않았습니다." });
        return;
      }

      const url = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${apiKey}&targetDt=${date}`;
      console.log(`Fetching box office for date ${date}...`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Box Office API error:", error);
      res.status(500).json({ error: error.message || "데이터를 불러오는 중 오류가 발생했습니다." });
    }
  });

  // API Route: Movie Info
  app.get("/api/movie/:movieCd", async (req, res) => {
    try {
      const { movieCd } = req.params;
      if (!movieCd) {
        res.status(400).json({ error: "영화 코드가 필요합니다." });
        return;
      }

      const apiKey = process.env.KOBIS_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "KOBIS API KEY가 설정되지 않았습니다." });
        return;
      }

      const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${apiKey}&movieCd=${movieCd}`;
      console.log(`Fetching movie info for ${movieCd}...`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Movie Info API error:", error);
      res.status(500).json({ error: error.message || "데이터를 불러오는 중 오류가 발생했습니다." });
    }
  });

  // API Route: Generate Detailed Review using Gemini
  app.post("/api/generate-review", async (req, res) => {
    try {
      const { movieNm, movieNmEn, directors, genres, shortReview } = req.body;
      
      if (!movieNm) {
        res.status(400).json({ error: "영화 제목이 필요합니다." });
        return;
      }
      if (!shortReview || !shortReview.trim()) {
        res.status(400).json({ error: "간단한 감상평을 입력해주세요." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: "GEMINI_API_KEY가 설정되지 않았습니다. AI Studio 설정에서 API Key를 입력해 주시거나, 개발 모드 환경 변수를 확인해 주세요." 
        });
        return;
      }

      const systemPrompt = `당신은 국내 최고의 저명한 영화 평론가이자 감성적이면서도 고도의 예술성을 바탕으로 글을 쓰는 시네마 에세이스트입니다.
당신의 임무는 관객이 남긴 짤막하고 가벼운 한 줄 감상평을 읽고, 해당 영화의 깊이 있는 주제의식과 정체성을 함축한 '격조 높은 영화 에세이/비평문'을 창조하는 것입니다.

[영화 정보]
- 영화 제목: ${movieNm}
${movieNmEn ? `- 영문명: ${movieNmEn}` : ""}
${directors ? `- 감독: ${directors}` : ""}
${genres ? `- 장르: ${genres}` : ""}

[관객의 짤막한 한 줄 감상평]
"${shortReview}"

[작성 가이드라인]
1. 제목: 영화의 시적인 본질이나 비유를 담은 유려하고 눈길을 끄는 에세이용 제목을 꼭 창작하여 맨 위에 표시하세요. # 기호로 마크다운 대제목을 잡아주세요 (예: '# [제목] : ...').
2. 어조: 매우 지적이면서도 서정적이고 고급스러운 한국어 문체(경어체 '~체/~다.' 혹은 편한 비평조)를 구체성 있게 사용하세요.
3. 전개 방식:
   - 사용자가 한 줄 감상평에 담은 정서(감명 깊음, 울림, 시원한 액션성, 아쉬움 등)를 예술 비평적 논조로 완벽하게 확대 재생산합니다.
   - 단순한 정보의 나열을 지양하고, 왜 이 영화의 특정 요소가 그러한 정성적 감흥을 유발하는지에 대해 미학적으로 변호하거나 설파해 주세요.
4. 분량: 한 호흡에 명문으로 읽히는 350자 내외로 깊이 있고 컴팩트하게 구성해 주세요.
5. 출력 형식: 순수 마크다운(Markdown) 단락들로만 출력하고, 다른 인사말이나 '답변을 시작합니다' 등 시스템적인 전후 설명은 절대 포함하지 마세요.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: systemPrompt
              }
            ]
          }
        ]
      };

      console.log(`Bypassing ADC: Requesting Gemini API via direct HTTPS fetch for "${movieNm}"...`);
      const apiResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!apiResponse.ok) {
        const errText = await apiResponse.text();
        throw new Error(`Gemini API Error (Status ${apiResponse.status}): ${errText}`);
      }

      const responseData = await apiResponse.json() as any;
      const generatedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("Gemini API가 유효한 텍스트 응답을 반환하지 않았습니다.");
      }

      res.json({ review: generatedText });
    } catch (error: any) {
      console.error("Generate Review error:", error);
      res.status(500).json({ error: error.message || "감상평 에세이를 생성하는 중 오류가 발생했습니다." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
