# CODIL (건설기술정보시스템)

https://www.codil.or.kr — **국내 EPC 리서치의 1순위 소스.**

국토교통부·한국건설기술연구원 등 산하기관 발간 보고서, 표준시방서·설계기준, 표준품셈,
실적공사비, 시공절차서, 현장시공사례, 원가절감사례, 해외건설기술정보(계약·설계·사업관리·
영문서식·해외규격목록)를 제공한다. 총 736만 면 규모.

## 접근 방법 — API가 없다

**공개 OpenAPI는 확인되지 않는다.** 검색 결과 페이지와 상세 페이지를 WebFetch로 직접 읽는다.

주요 진입점:

| 용도 | URL |
|---|---|
| 건설보고서/발간자료 | `https://www.codil.or.kr/viewConRpt.do?gubun=rpt` |
| KICT 소장정보 | `https://www.codil.or.kr/selectKictSearch2.do` |

## 수집 절차

```
1. 발견:  WebSearch 1~2회로 충분하다 — `site:codil.or.kr <키워드>`
2. 전환:  URL을 확보한 순간부터 WebFetch로 전환. WebSearch를 더 쓰지 않는다
3. 기록:  상세페이지 URL의 `pMetaCode=` 파라미터를 서지 식별자로 기록한다
```

## 함정

- **WebSearch 예산을 여기에 쓰지 않는다.** 발견 1~2회면 끝이다. 나머지는 WebFetch.
  이 도메인의 WebSearch 예산은 `domains/epc.md` §5(산업 리포트)에 써야 한다.
- `pMetaCode=`를 기록하지 않으면 나중에 같은 문서를 다시 찾지 못한다. 인용 시 필수.
- PDF 본문이 뷰어에 갇혀 있는 경우가 있다. 그때는 서지와 목차만 확보하고
  **"본문 미확인"**으로 태깅한다.
