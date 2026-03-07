# 오목

`Next.js App Router` 기반의 오목 게임입니다. 로컬 2인 모드와 AI 대전 모드를 지원합니다.

## 설치

```sh
pnpm install
```

## 실행

```sh
pnpm dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 스크립트

```sh
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm format:check
```

## 개발 원칙

- 패키지 매니저는 `pnpm`만 사용합니다.
- 코드 포맷팅은 `Prettier`, 정적 검사는 `ESLint`로 분리합니다.
- 게임 규칙과 AI 계산은 순수 함수로 유지해서 클라이언트와 API가 같은 로직을 공유합니다.

## 기여하기

이 프로젝트에 기여하고 싶다면 먼저 이슈를 등록해주세요. 코드 변경 사항이 있을 경우, 풀 리퀘스트를 열어주시기 바랍니다.

## 라이센스

이 프로젝트는 MIT 라이센스를 따르고 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 확인하세요.