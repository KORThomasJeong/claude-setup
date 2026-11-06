# ScienceON (KISTI)

국내논문 + 해외논문 + **국가 R&D 보고서 + 특허**까지 한 게이트웨이에서 검색된다.
국내 학회·협회 프로시딩 커버리지가 KCI보다 넓고,
**보고서 40만 건 이상은 KCI에 없는 자산이다.**

인증키 발급: https://scienceon.kisti.re.kr/apigateway/api/way/guide.do (회원가입 → 인증키 신청)

## 검색

```bash
curl -s "https://apigateway.kisti.re.kr/openapicall.do\
?client_id=${SCIENCEON_CLIENT_ID}\
&token=${SCIENCEON_TOKEN}\
&version=1.0\
&action=search\
&target=ARTI\
&searchQuery=$(python3 -c 'import urllib.parse,json; print(urllib.parse.quote(json.dumps({"BI":"디지털 트윈 건설"},ensure_ascii=False)))')\
&curPage=1&rowCount=30" | xmllint --format -
```

## 함정

- **`searchQuery`는 JSON 문자열을 URL 인코딩해서 넣는다.** 한글이 들어가므로 인코딩을
  생략하면 **에러가 아니라 조용히 빈 결과**가 온다. 이 실패를 "자료 없음"으로 읽지 말 것.
- **`target`은 콘텐츠 약어다.** 논문(`ARTI`) 외에 보고서·특허·동향 대상이 따로 있다.
  **첫 호출 전에 가이드 페이지에서 현재 유효한 target 코드표를 확인한다. 추정 금지.**
- 응답은 **XML**. 소속·발행기관·페이지·ISSN·DOI·키워드·원문 URL이 포함되며
  서지 확정에 바로 쓸 수 있는 품질이다.
- `curl` 안의 `$(python3 ...)`는 셸 명령치환이다. 이 소스는 **WebFetch로 대체 불가능**하다.
  Bash 권한이 없으면 이 소스는 포기하고 KCI로 커버한다.
- 출처표시: 보고서에 `출처: 한국과학기술정보연구원(KISTI)` 표기.

> **참고:** ScienceON OpenAPI를 MCP 서버로 래핑한 `scienceon-mcp` (PyPI) 패키지가 있다.
> 반복 리서치가 예상되면 curl 래퍼를 직접 만드는 대신 이쪽을 붙이는 것을 검토한다.
