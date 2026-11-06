# Crossref

키 불요. `mailto=` 넣으면 polite pool. 응답 JSON.
**이 소스의 역할은 탐색이 아니라 서지 확정이다.** DOI를 이미 손에 쥐었을 때 쓴다.

베이스: `https://api.crossref.org`

## DOI 정확 조회 — 서지 확정용 (주 용도)

```bash
curl -s "https://api.crossref.org/works/10.XXXX/XXXXX?mailto=${CONTACT_EMAIL}"
```

`message` 아래에 `author`, `container-title`(저널명), `volume`, `issue`, `page`,
`published` 가 들어 있다. **저자·연도·권호·페이지는 여기서 가져온다.**

## 서지 문자열로 후보 검색

```bash
curl -s "https://api.crossref.org/works\
?query.bibliographic=modular+construction+productivity+Korea\
&rows=20&mailto=${CONTACT_EMAIL}"
```

## 필드 추리기

```bash
curl -s "https://api.crossref.org/works?query.bibliographic=...\
&select=DOI,title,author,container-title,volume,issue,page,published\
&rows=20&mailto=${CONTACT_EMAIL}"
```

## 함정

- **국문 검색어로 때리면 0건이 나온다.** 한국어 제목 논문은 영문 제목으로만 색인된다.
- `query.bibliographic`의 결과는 **유사도 순이지 정확 일치가 아니다.**
  상위 결과를 그대로 채택하지 말고 제목·저자·연도를 대조한다.
- `rows` 최대 1000. 그 이상은 `cursor=*`.
