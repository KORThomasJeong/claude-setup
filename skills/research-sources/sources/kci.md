# KCI (한국학술지인용색인)

**국내 등재지 논문의 기준 소스.** 제목·저자·초록·발행연도·연구분야·피인용·DOI·UCI·
원문공개여부를 제공한다. 국내 학술 리서치의 1순위.

인증키 발급: https://open.kci.go.kr/ → OPEN API 키신청

## 논문 검색

```bash
curl -s "https://open.kci.go.kr/po/openapi/openApiSearch.kci\
?apiCode=articleSearch\
&key=${KCI_API_KEY}\
&title=모듈러+건설\
&pubiYr=2023" | xmllint --format -
```

## 참고문헌(인용) 검색

```bash
curl -s "https://open.kci.go.kr/po/openapi/openApiSearch.kci\
?apiCode=referenceSearch\
&key=${KCI_API_KEY}\
&title=...&author=...&pubiYr=..." | xmllint --format -
```

## 키가 없을 때 — OAI-PMH (신청 불요)

KCI는 OAI-PMH로도 데이터를 제공하며 **키 신청이 필요 없다.**
키 발급을 기다리느라 리서치를 멈추지 말 것.

## 공공데이터포털 경로 (대안)

키 발급이 더 빠른 경우가 있다.

- 한국연구재단_KCI 논문정보: https://www.data.go.kr/data/3049042/openapi.do
- 필수 파라미터: `ServiceKey`(URL 인코딩), `recordCnt`, `pageNo`
- 개발계정 트래픽 5,000건/일. 운영계정은 활용사례 등록 후 증액 신청.
- **인용정보·기관정보는 별도 API로 분리돼 있다.** 피인용 분석이 필요하면
  "KCI 인용 정보 서비스"를 추가로 신청한다.

## 함정

- **응답은 XML이다.** JSON을 가정하지 말 것. `xmllint --format -` 또는 python `xml.etree`로 파싱.
- 파라미터(`title`, `author`, `pubiYr` 등)의 정확한 명세는
  https://open.kci.go.kr/ → "OPEN API → 명세서"에서 확인한다. **추정 금지.**
- 논문 식별자 `artiId`를 **반드시 기록한다.** DOI가 없는 국내 논문은 이것이 유일한
  인용 근거다 (`domains/kr-academic.md` §0-1).
- **국문·영문 제목을 모두 기록한다.** 영문 제목이 없으면 Crossref·OpenAlex 교차확인이 불가능하다.
- 공공누리 출처표시 의무: 보고서에 `출처: 한국학술지인용색인(KCI)` 표기.
