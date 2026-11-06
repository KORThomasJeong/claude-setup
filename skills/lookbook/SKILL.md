---
name: lookbook
description: >
  design-lookbook 프리셋을 현재 프로젝트에 적용한다. "3번으로 만들어줘",
  "3-a로 대시보드 짜줘", "3-r212로 만들어줘"처럼 번호(선택적 변형)로 디자인
  컨셉을 지정하는 요청을 처리한다. 소비 전용 — 프리셋 추가·수정은 하지 않는다.
argument-hint: "<번호[-변형]> [적용 대상 설명]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebFetch
---

# lookbook — 프리셋 소비 스킬

design-lookbook 저장소의 **W4(소비) 절차만** 래핑한다. 새 컨셉 추가·색 변형 정식
등록·스펙 수정(W1/W2/W7)은 이 스킬의 범위가 아니다 — 그런 요청이면 저장소 안에서
`CLAUDE.md` + `WORKFLOWS.md`를 직접 따르라고 안내하고 중단한다.

저장소 루트: `/home/ubuntu/design-lookbook` (로컬). 없으면 아래 1번의 fetch 경로.

## 절대 규칙

- **외부 리소스 금지.** CDN 폰트·스크립트·이미지 절대 사용하지 않는다. 폰트는
  `"Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui,
  'Segoe UI', sans-serif"` 같은 시스템 폴백 스택만, 아이콘은 인라인 SVG,
  이미지는 CSS/SVG로 대체.
- **요약·기억으로 작업 금지.** SPEC.md와 tokens.css는 매번 전문을 읽는다.
- 산출물의 카피·주석 등 문서는 한국어로 쓴다.

## 절차

1. **번호·별칭 해석** — `presets/INDEX.md`를 읽어 인자를 프리셋 폴더로 매핑한다.
   - 변형 문자 없으면 기본 `a`. "토스풍"·"그 다크 SaaS 거" 같은 자연어는
     INDEX.md의 `inspired by`/별칭 열로 매핑한다.
   - 저장소가 로컬에 없으면 raw로 fetch:
     `https://raw.githubusercontent.com/KORThomasJeong/design-lookbook/main/presets/INDEX.md`
     (`KORThomasJeong`는 사용자에게 확인하거나 저장소 README의 실제 값으로 치환.)

2. **스펙 전문 로드** — 해당 `presets/<번호>-<코드네임>/SPEC.md` **전체**와
   같은 폴더의 `tokens.css`를 읽는다. 절대 요약하거나 일부만 읽지 않는다.

3. **적용 (W4)** — `WORKFLOWS.md` W4를 그대로 따른다:
   - **토큰 이식**: `tokens.css`를 대상 프로젝트에 복사. Tailwind/React 프로젝트면
     SPEC §11의 `@theme` 매핑으로 변환.
   - **화면**: §9 레이아웃 레시피대로 조립 (모바일 390px 우선 → 데스크톱).
   - **컴포넌트**: §6 규칙 (구조·상태·치수).
   - **모션**: §7 토큰과 `prefers-reduced-motion` 대응.
   - **카피**: §8 보이스 & 톤.
   - **금지**: §10 안티-AI-look 규칙을 위반하지 않는다.

4. **r 변형 처리 (`N-r<hue>`)** — 정식 변형이 아니라 랜덤 팔레트 요청이다.
   SPEC §2.4의 고정/자유 규칙 안에서 지정된 hue로 팔레트를 생성하고
   (`N-r212` = hue 212, 재현 가능해야 함), §2.3 대비 규칙으로 검증한다.
   통과 못 하면 폐기하고 규칙 내에서 다시 뽑는다. 저장소에 등록하지는 않는다.

5. **자가검수** — 완료 선언 전 해당 SPEC.md **§12 채점 루브릭**으로 스스로 점검한다.
   verifiable 항목(대비율, 스페이싱 스케일 외 값 0개, 타입 스케일 외 font-size 0개,
   radius/shadow 일치, reduced-motion 존재)은 grep/계산으로 판정, subjective 항목은
   §1 첫인상·§8 어조·§10 금지 준수로 판정.
   - 사용자가 "될 때까지 / 만족할 때까지 / 완성도 높여줘"를 원하면 §12를 합격 기준으로
     **loop-runner**(`/loop-runner:start`)에 위임해 기준 충족까지 반복한다.

6. **참고 구현** — 막히면 `docs/<번호>-<코드네임>/`의 데모 화면(순수 HTML/CSS/JS)을
   레퍼런스로 본다. 단 source of truth는 언제나 SPEC.md + tokens.css이며,
   데모와 스펙이 어긋나면 스펙을 따른다.

## 완료 기준

§12 verifiable 전항목 통과 + subjective 기준 충족. 대상 프로젝트에 어떤 파일을
이식/생성했는지, §12 자가검수 결과를 사용자에게 요약해 보고한다.
