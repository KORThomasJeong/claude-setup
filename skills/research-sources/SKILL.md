---
name: research-sources
description: API 기반 1차 자료 수집 플레이북 라우터. 국내 논문(KCI·ScienceON), 해외 색인(OpenAlex·Crossref·Semantic Scholar), 건설·EPC 회색문헌(CODIL·공공데이터포털·ENR)을 WebSearch가 아니라 API/WebFetch로 정확하게 긁어올 때 사용. 트리거 — "KCI에서 찾아줘", "국내 논문 API로 수집", "이 DOI 서지 확정", "인용 네트워크 확장", "CODIL 자료", "발주 동향 자료", "학술 검색 한도 아껴서". /research-prompter:design·:run 파이프라인이 도메인 프로토콜을 부착할 때도 이 스킬을 읽는다.
---

# Research Sources (수집 프로토콜 라우터)

**이 스킬은 "무엇을 답할지"를 정하지 않는다.** 산출물 규격은 `research-design` 스킬의
`references/01~08`이 담당한다. 이 스킬은 오직 **근거를 어디서 어떻게 긁어오는가**만 다룬다.
따라서 리서치 유형(1~8)과 배타적이지 않다 — 유형 2(시장·경쟁) + EPC 프로토콜처럼 겹쳐 쓴다.

## 0. 시작 전 30초 점검 (생략 금지)

```
[ ] Bash(curl:*) 권한이 있는가?        → 없으면 §0-1
[ ] CONTACT_EMAIL 환경변수가 있는가?    → 없으면 polite pool 밖. 레이트리밋 각오
[ ] 어느 도메인인가?                    → §1
[ ] 서브에이전트에 위임하는가?          → 위임 시 §0-2 필수
```

### 0-1. 권한이 없으면 먼저 고친다

이 스킬의 수집 경로는 대부분 `curl`이다. 권한이 없으면 **어떤 플레이북도 실행되지 않는다.**
저장소 루트의 `settings.sample.json`을 프로젝트 `.claude/settings.json`에 병합하도록 안내한다.

부분적 우회는 가능하나 한계가 명확하다:

| 경로 | curl 없이 | 한계 |
|---|---|---|
| OpenAlex / Crossref / S2 | WebFetch로 대체 가능 | JSON이 요약돼 필드가 잘릴 수 있음 |
| KCI | WebFetch 가능 | **XML 응답** — 파싱 불가, 원문 그대로 읽어야 함 |
| ScienceON | **불가** | `searchQuery`가 JSON→URL인코딩 필요 |
| 공공데이터포털 | 불안정 | `ServiceKey` 이중 인코딩 문제 |

### 0-2. 서브에이전트 위임 시

수집을 서브에이전트에 넘긴다면 그 에이전트에 **`Bash` 도구가 있는지 먼저 확인한다.**
없으면 위임하지 말고 메인 대화에서 직접 수집한다. (이 플러그인의 `cell-researcher`는
Bash를 갖고 있으나, 다른 에이전트로 위임할 때는 매번 확인한다.)

위임 시 반드시 함께 넘길 것: **해당 도메인 파일 경로, 배정된 WebSearch 예산(숫자),
출처 등급표, 조용한 실패 감지 규칙(§2).**

## 1. 도메인 판별 → 프로토콜 부착

먼저 도메인을 고르고, 그 파일의 **예산 배분표·수집 순서·출처 등급표**를 따른다.
소스별 실제 호출법은 도메인 파일이 `sources/`로 위임한다.

| 신호 | 도메인 파일 |
|---|---|
| 국내 논문, 학위논문, 국가R&D보고서, KCI, RISS, 선행연구 | `domains/kr-academic.md` |
| 설계·조달·시공, FIDIC·계약·클레임, 발주 동향, 표준시방서, BIM, 건설 디지털화 | `domains/epc.md` |
| 국내 건설 주제 (예: 국내 모듈러 생산성) | **둘 다 부착** — kr-academic으로 논문, epc로 회색문헌 |
| 해당 없음 | 도메인 없이 `sources/`만 직접 참조 |

**둘 다 부착할 때의 충돌 해소:**
- 예산은 **EPC 쪽 배분을 따른다** (회색문헌 탐색이 병목이므로).
- 등급은 **자료 성격에 맞는 쪽을 쓴다.** 논문은 A~D, 회색문헌은 T1~T5. 한 보고서 안에
  두 체계가 섞이면 각주로 "학술 등급 A~D / 산업 등급 T1~T5 병기"임을 1회 명시한다.
- 수집 순서는 **학술(API) 먼저 → 회색문헌(WebSearch) 나중.** 역순이면 한도 소진 후
  회색문헌을 못 판다.

## 2. 공통 절대 규칙 (모든 도메인 공통)

### 2-1. 서지는 검색 스니펫에서 뽑지 않는다

저자·연도·권호·페이지·DOI는 반드시 **API 레코드 원본**에서 가져온다.
WebSearch 결과 스니펫에서 추출한 서지는 인용 불가. 예외 없다.

### 2-2. 조용한 실패 감지

WebSearch 세션 한도에 도달하면 **에러가 나지 않는다.** 이후 호출은 "이미 확보한 정보로
계속 진행하라"는 안내를 반환하고, 대화상에서는 그냥 아무것도 못 찾은 검색처럼 보인다.
사용자에게는 이 안내가 보이지 않는다.

```
WebSearch가 결과 0건을 반환하면:
  1) "자료 없음"으로 결론짓지 말 것
  2) 쿼리를 바꿔 1회 재시도 (연도 제거 / 영↔한 전환)
  3) 같은 주제를 API 경로로 재시도 (sources/ 참조)
  4) API에서도 0건이면 그때만 "자료 없음"으로 판정하고, 어느 경로로 확인했는지 명시
  5) WebSearch 0건이 연속 2회 → 한도 소진으로 간주.
     즉시 API 전용 모드로 전환하고 사용자에게 보고

보고 형식:
  "WebSearch 연속 0건 — 세션 한도 소진 가능성.
   미완료 항목: [...] / API 경로로 커버 불가한 영역: [...]"
```

한도 상향: `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` 환경변수(양의 정수, 비활성화 불가).
`/clear`로 카운트가 리셋되지만 리서치 맥락도 함께 사라지므로 최후 수단이다.

### 2-3. polite pool

Crossref·OpenAlex 호출에는 `mailto=${CONTACT_EMAIL}`을 **항상** 넣는다.
빠뜨리면 공용 풀로 떨어져 레이트리밋이 걸리고, 그 실패가 "자료 없음"으로 오인된다.

### 2-4. 본문 미확인 표기

본문을 읽지 않은 문헌은 **"초록 기반"**이라고 명시한다. 초록만 보고 방법론·수치를
단정하지 않는다. 유료벽에 막힌 표준 조항은 **`[원문 미확인 — 2차 출처]`**로 태깅한다.

### 2-5. 크롤링 금지

API가 없는 사이트(RISS, DBpia 등)에 대한 자동 크롤링·대량 반복 요청은 하지 않는다.
개별 상세페이지 1건 WebFetch는 허용. 발견은 WebSearch로, 서지 확정은 API로 되돌아온다.

## 3. 소스 인덱스

| 소스 | 파일 | 키 필요 | 응답 |
|---|---|---|---|
| OpenAlex | `sources/openalex.md` | 불요 (mailto 권장) | JSON |
| Crossref | `sources/crossref.md` | 불요 (mailto 권장) | JSON |
| Semantic Scholar | `sources/semantic-scholar.md` | 불요 | JSON |
| KCI | `sources/kci.md` | 필요 (OAI-PMH는 불요) | **XML** |
| ScienceON | `sources/scienceon.md` | 필요 | **XML** |
| CODIL | `sources/codil.md` | API 없음 | HTML (WebFetch) |
| 공공데이터포털 | `sources/data-go-kr.md` | 필요 | JSON/XML |

## 4. 사전 준비 체크리스트

- [ ] `CONTACT_EMAIL` — Crossref/OpenAlex polite pool
- [ ] `KCI_API_KEY` — https://open.kci.go.kr/ (없으면 OAI-PMH로 시작 가능)
- [ ] `SCIENCEON_CLIENT_ID` / `SCIENCEON_TOKEN` — https://scienceon.kisti.re.kr/apigateway/api/way/guide.do
- [ ] 공공데이터포털 `ServiceKey` — https://www.data.go.kr (EPC 도메인만)
- [ ] `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` 상향 (EPC 도메인은 특히 권장)
- [ ] `settings.json` permissions — 저장소 루트 `settings.sample.json` 참조
- [ ] XML 파서 — `xmllint` 또는 python `xml.etree`

> 키 발급이 아직이면 **OpenAlex + Crossref + Semantic Scholar + KCI OAI-PMH** 조합만으로도
> 리서치를 시작할 수 있다. **키 없음을 이유로 리서치를 중단하지 말 것.**
