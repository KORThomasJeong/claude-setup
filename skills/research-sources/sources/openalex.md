# OpenAlex

키 불요. `mailto=` 넣으면 polite pool. 응답 JSON. **인용 네트워크 확장이 이 소스의 핵심 가치다.**

베이스: `https://api.openalex.org`

## 기본 검색

```bash
curl -s "https://api.openalex.org/works\
?search=offsite+construction+Korea\
&filter=from_publication_date:2020-01-01\
&per-page=50&mailto=${CONTACT_EMAIL}"
```

## 저널 특정 필터링 (2단계 — ISSN을 추정하지 말 것)

```bash
# 1) 저널의 ISSN/source_id를 먼저 확정한다
curl -s "https://api.openalex.org/sources?search=Automation+in+Construction&mailto=${CONTACT_EMAIL}"

# 2) 확정된 ISSN으로 필터링
curl -s "https://api.openalex.org/works\
?filter=primary_location.source.issn:XXXX-XXXX,from_publication_date:2021-01-01\
&search=digital+twin&per-page=50&mailto=${CONTACT_EMAIL}"
```

## 인용 네트워크 확장

```bash
# 시드 논문을 인용한 후속 연구 (W로 시작하는 OpenAlex work ID)
curl -s "https://api.openalex.org/works?filter=cites:W2741809807&per-page=50&mailto=${CONTACT_EMAIL}"
```

시드 논문의 work ID는 기본 검색 결과의 `id` 필드 끝부분(`https://openalex.org/W2741809807` → `W2741809807`)에서 얻는다.

## 필드 추리기

응답이 크다. `select=`로 필요한 필드만 받는다.

```bash
curl -s "https://api.openalex.org/works?search=...\
&select=id,doi,title,publication_year,cited_by_count,primary_location\
&per-page=50&mailto=${CONTACT_EMAIL}"
```

## 함정

- **국내 학술지 커버리지가 얕다.** 0건이 "논문 없음"을 뜻하지 않는다. KCI를 먼저 본다.
- **국문 검색어는 거의 안 잡힌다.** 영문 제목을 확보한 뒤 조회한다.
- `filter=`는 쉼표로 AND 연결, 콜론으로 값 지정. 공백 금지.
- `per-page` 최대 200. 그 이상은 `cursor=*` 페이지네이션.
