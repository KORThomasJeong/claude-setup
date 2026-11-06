# Semantic Scholar

키 불요(미인증은 레이트리밋 낮음). 응답 JSON.
**이 소스의 강점은 초록과 OA PDF 링크다.** 본문 정독 경로를 여기서 확보한다.

베이스: `https://api.semanticscholar.org/graph/v1`

## 검색 + 초록 + OA PDF

```bash
curl -s "https://api.semanticscholar.org/graph/v1/paper/search\
?query=EPC+project+schedule+delay+risk\
&fields=title,year,venue,abstract,citationCount,externalIds,openAccessPdf&limit=20"
```

`openAccessPdf.url`이 있으면 **그 URL을 WebFetch로 정독한다.**
없으면 그 문헌은 보고서에서 **"초록 기반"**으로 명시한다.

## DOI로 단건 조회

```bash
curl -s "https://api.semanticscholar.org/graph/v1/paper/DOI:10.XXXX/XXXXX\
?fields=title,year,venue,abstract,openAccessPdf,references.title,citations.title"
```

## 함정

- `fields=`를 빼면 **id와 title만** 온다. 초록이 필요하면 반드시 명시한다.
- 미인증 호출은 레이트리밋이 빡빡하다. 429가 뜨면 간격을 두고 재시도하되,
  **429를 "자료 없음"으로 읽지 않는다.**
- `limit` 최대 100.
- 초록이 `null`인 레코드가 흔하다. 그때는 OpenAlex나 원문 페이지로 보완한다.
