# 도메인 프로토콜 — EPC / 건설

> 적용 대상: 설계·조달·시공, 계약·클레임, 발주 동향, 건설 표준·기준, 프로젝트 관리,
> 건설 디지털화(BIM·디지털트윈·AI).
> 공통 절대 규칙(조용한 실패 감지, 서지 확정, polite pool)은 상위 `SKILL.md` §2를 먼저 읽는다.

---

## 0. 이 도메인의 핵심 전제

**EPC 지식의 대부분은 학술 색인 바깥에 있다.**

FIDIC 계약 조항, ENR 발주 순위, 국토부 고시, 표준시방서, 발주처 RFP, 컨설팅펌 백서,
벤더 기술자료 — 이 중 어느 것도 Crossref나 OpenAlex에 없다.
국내 학술 프로토콜을 그대로 적용하면 **가장 중요한 근거가 통째로 누락된다.**

따라서 이 도메인에서는:

- **WebSearch가 1급 도구다.** 학술 프로토콜과 정반대다. 예산을 아끼지 말고 여기에 집중한다.
- 대신 **API로 처리 가능한 부분(학술 논문, 서지)을 먼저 API로 털어내서**
  WebSearch 예산을 회색문헌 탐색에 남긴다.
- 모든 출처에 **발행처·발행일·이해관계**를 기록한다.
  벤더 백서와 중립 기관 보고서를 같은 등급으로 취급하면 안 된다.

---

## 1. 검색 예산 배분

| 용도 | 도구 | 예산 |
|---|---|---|
| 학술 논문 (건설·엔지니어링 저널) | OpenAlex / Crossref / S2 | **무제한** |
| 국내 공공 DB (CODIL, 나라장터 등) | WebFetch / 공공데이터포털 API | **무제한** |
| 표준·계약 문서 개요 확인 | WebSearch → WebFetch | 에이전트당 **최대 10회** |
| 산업 리포트·발주 동향·회색문헌 | WebSearch | 에이전트당 **30~50회** ← 집중 |
| 확보한 URL의 본문 정독 | WebFetch | **무제한** |

**순서가 중요하다: API로 처리되는 것 → 먼저. WebSearch가 필요한 것 → 나중.**
순서를 뒤집으면 한도가 소진된 뒤 회색문헌 탐색을 못 한다.

회색문헌 비중이 큰 리서치라면 **시작 전에** `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`을
미리 상향해둔다. 이 도메인은 한도 소진의 피해가 학술 리서치보다 훨씬 크다.

---

## 2. 수집 순서

```
1. 분해:   질문을 [학술로 답할 부분] / [회색문헌으로만 답할 부분]으로 먼저 쪼갠다
2. 학술:   sources/openalex.md + crossref.md + semantic-scholar.md  (WebSearch 0회)
           국내 논문이 섞이면 domains/kr-academic.md 병행 부착
3. 국내:   sources/codil.md + data-go-kr.md → 국내 기준·보고서·발주 데이터
4. 표준:   §4 — 표준 번호·연도·범위만 공식 페이지에서 확인. 조항 단정 금지
5. 산업:   §5 — WebSearch 예산을 여기에 전량 투입 → 찾는 즉시 WebFetch 정독
6. 교차:   T5 자료의 모든 수치를 T1~T3로 교차검증
7. 정리:   등급 태깅 + 기준연도·단위·집계범위 명시
```

---

## 3. 학술 논문 — 우선 조회 저널

건설 분야 주요 저널은 Crossref·OpenAlex 커버리지가 좋다. 검색엔진을 쓸 이유가 없다.
호출법은 `sources/openalex.md` §저널 특정 필터링 참조. **ISSN을 추정하지 말고 먼저 확정한다.**

- *Automation in Construction* (Elsevier) — 건설 자동화·BIM·AI의 중심 저널
- *Journal of Construction Engineering and Management* (ASCE)
- *Journal of Management in Engineering* (ASCE)
- *Engineering, Construction and Architectural Management* (Emerald)
- *Construction Management and Economics* (Taylor & Francis)
- *International Journal of Project Management* (Elsevier)
- *Journal of Cleaner Production* — 환경·폐기물·자원순환 주제

국내 건설 논문은 KCI 쪽 커버리지가 넓다. → `domains/kr-academic.md` 병행 부착.

---

## 4. 국제 표준·계약 — 유료 벽 주의

FIDIC(Red/Yellow/Silver Book), NEC, AIA, ISO 19650(BIM 정보관리), ASME, API, IEC, ASTM 등은
**원문이 유료**다. **이 영역은 환각이 가장 빈번하다.**

**규칙:**
- 원문 조항을 확보하지 못한 상태에서 **조항 번호와 내용을 단정하지 않는다.**
- 확인 가능한 것: 표준 번호, 제목, 제정/개정 연도, 적용 범위, 구조(파트 구성).
  발행기관 공식 페이지에서 WebFetch로 확인한다.
- 조항 해석이 필요하면 **해당 표준을 인용한 피어리뷰 논문**이나 **로펌·엔지니어링
  컨설팅사의 공개 해설자료**를 근거로 삼고, "2차 출처 기반"임을 명시한다.
- 보고서 인용 시 반드시 `[원문 확인]` 또는 `[원문 미확인 — 2차 출처]`를 태깅한다.

---

## 5. 산업 리포트·발주 동향 — WebSearch 집중 투입

여기가 WebSearch 예산을 쓰는 곳이다.

| 유형 | 대표 소스 |
|---|---|
| 건설사 순위·발주 규모 | ENR Top Contractors / Top Design Firms |
| 시장 전망 | GlobalData, Dodge Construction Network |
| 에너지 전환 | IEA, IRENA, Rystad Energy, Wood Mackenzie |
| 경영 컨설팅 관점 | McKinsey / Deloitte / PwC / KPMG capital projects |
| 국제 발주 정보 | World Bank Projects & Operations, ADB, EU TED, SAM.gov |
| 업계 뉴스 | Construction Dive, ENR 기사, 건설경제·대한전문건설신문 |

**쿼리 작성 요령:**
- **연도를 명시한다.** `EPC market outlook 2026` — 연도 없는 쿼리는 낡은 문서를 끌고 온다.
- **기관명을 넣는다.** `IEA hydrogen electrolyser capex 2026`
- **파일 타입을 좁힌다.** `filetype:pdf modular construction productivity report`
- **국내 자료는 한국어, 국제 자료는 영어.** 섞으면 둘 다 놓친다.

**리포트를 찾으면 즉시 WebFetch로 본문을 읽는다.** 검색 스니펫의 수치를 그대로 옮기지
않는다. 스니펫 숫자는 단위·기준연도·집계범위가 잘려 있는 경우가 많다.

---

## 6. 기타 국내 기관

| 기관 | 용도 | 접근 |
|---|---|---|
| 해외건설협회(ICAK) | 해외수주 통계, 국가별 시장 동향 | WebFetch |
| 건설산업연구원(CERIK) | 건설경기·산업구조 분석 보고서 | WebFetch |
| 한국건설기술연구원(KICT) | 기술 연구보고서 | `sources/codil.md` 경유 |
| 국가법령정보센터 | 건설 법령·행정규칙·고시 | OPEN API 존재, 엔드포인트 확인 후 사용 |
| KOSIS / 국토교통 통계누리 | 건설 수주·투자 시계열 | API 또는 WebFetch |

---

## 7. 출처 등급

| 등급 | 정의 | 필수 메타데이터 | 비고 |
|---|---|---|---|
| **T1** | 피어리뷰 논문 | DOI 필수 | |
| **T2** | 정부·표준화기구·국제기구 공식 문서 | 발행기관, 발행일, 문서번호, URL | IEA, ISO, 국토부, World Bank |
| **T3** | 산업 조사기관 리포트 | 발행처, 발행일, 조사방법 유무 | ENR, GlobalData |
| **T4** | 컨설팅펌·업계협회 자료 | 발행처, 발행일 | 관점 편향 가능성 명시 |
| **T5** | 벤더·시공사 자기 발표 자료 | 발행처, 발행일 | **이해관계 있음 — 단독 근거 불가** |

**규칙:**
- 모든 주장에 등급을 태깅한다.
  예: `모듈러 적용 시 공기 20% 단축 [T5 — 벤더 발표, 교차검증 필요]`
- **T5 단독으로는 어떤 수치 주장도 성립하지 않는다.** T1~T3 중 하나로 교차검증하거나,
  "벤더 주장"임을 본문에 명시한다.
- 수치 인용 시 **기준연도·단위·집계범위**를 함께 적는다.
  (예: "2025년 기준, 계약금액 USD 기준, 상위 250개사 합계")
- **발행일이 확인되지 않는 자료는 사용하지 않는다.**
