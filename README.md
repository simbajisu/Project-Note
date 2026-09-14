# 프로젝트 노트

GitHub Pages에서 노트를 읽는 홈페이지입니다. 논문형 본문, 목차, 표, Markdown 및 LaTeX 수식을 지원합니다. 공개 홈페이지에는 작성·수정 화면과 로그인 기능이 없습니다.

작성은 별도로 제공된 **작성기.html**을 컴퓨터에서 더블클릭해 진행합니다. 작성기에는 필요한 코드와 수식 폰트가 포함되어 있으며 별도 서버나 Node.js 설치가 필요하지 않습니다. Chrome 또는 Edge로 열면 됩니다.

## 처음 올리기

1. GitHub에서 새 저장소를 만듭니다. 이름은 paper-notes 등 원하는 이름을 사용합니다.
2. GitHub Free 기준으로 **Public**을 선택합니다. README, .gitignore, License 자동 추가는 끕니다.
3. 제공된 GitHub Pages용 ZIP의 압축을 풀고, 그 안의 파일과 폴더를 **저장소 최상위**에 올립니다. ZIP 자체나 ZIP을 둘러싼 상위 폴더를 올리는 것이 아닙니다.
4. 파일 목록에 package.json, index.html, notes 폴더, **.github/workflows/pages.yml**이 보여야 합니다. .github 폴더를 빠뜨리지 마세요.
5. 기본 브랜치는 **main**을 사용합니다.
6. **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다. 별도 템플릿 설정은 필요하지 않습니다.
7. **Actions → Deploy paper notes → Run workflow → main → Run workflow**로 실행합니다. 첫 업로드 때 자동 실행이 실패했다면 이 단계로 다시 실행하세요.
8. 성공하면 Settings → Pages에 표시되는 주소로 접속합니다. 이후 main에 파일을 올리면 자동으로 갱신됩니다.

일반 저장소의 주소는 https://사용자이름.github.io/저장소이름/ 형식입니다. 저장소 이름에 맞춘 코드 수정은 필요하지 않습니다.

공개할 파일만 올리세요. 이전 Sites 서버 버전용 압축파일 대신 이 Pages 버전을 사용합니다. 기존 Sites에 저장한 노트가 있다면 그 사이트에서 .md로 내려받은 후 notes 폴더로 옮겨야 합니다.

## 노트 작성과 수정

1. 컴퓨터에 저장한 **작성기.html**을 더블클릭합니다.
2. 제목과 본문을 작성합니다. 수식은 문장 안에서 $...$, 별도 줄에서 $$...$$를 사용합니다.
3. **Markdown 저장**을 누릅니다. 브라우저의 다운로드 폴더에 .md 파일이 만들어집니다.
4. GitHub 저장소에서 **notes 폴더를 연 다음**, Add file → Upload files로 .md를 올리고 main에 커밋합니다.
5. Actions 작업이 끝나면 홈페이지에 나타납니다.

기존 노트는 작성기의 **.md 열기**로 불러와 수정합니다. 다시 올릴 때 **기존 파일과 같은 이름**을 사용하면 교체됩니다. 브라우저가 파일명에 (1), (2)를 붙였다면 원래 이름으로 바꾸세요. 기존 이름을 유지해야 노트 주소도 유지됩니다.

임시 보관은 같은 브라우저와 같은 작성기 파일 위치에서만 사용할 수 있으며 브라우저 설정에 따라 사용하지 못할 수 있습니다. 최종 원본은 내려받은 .md 파일로 보관하세요. 임시 보관된 내용은 GitHub에 자동 전송되지 않습니다.

notes/example.md는 예시입니다. 필요 없으면 저장소에서 삭제해도 됩니다. 노트를 삭제하려면 해당 .md 파일을 저장소에서 삭제합니다.

## Markdown 파일 구조

파일은 notes 폴더 바로 안에 둡니다. 파일 이름이 노트 주소의 식별자입니다. 메타데이터가 없는 Markdown도 읽을 수 있으며 파일 이름을 제목으로 사용합니다.

    ---
    title: "노트 제목"
    abstract: "요약 (선택)"
    created: "2026-09-14"
    updated: "2026-09-14"
    ---

    ## 1. 개요

    문장 속 수식 $E = mc^2$.

    $$
    \frac{a}{b} = c
    $$

제목은 180자, 요약은 1,000자, 본문은 200,000자까지 지원합니다. 수식은 KaTeX가 지원하는 LaTeX 문법을 사용합니다. 전체 .tex 문서 컴파일은 지원하지 않습니다.

이미지는 public/images 폴더에 넣고 본문에 ![설명](./images/파일이름.png) 형태로 연결할 수 있습니다. 로컬 미리보기에서 상대 경로 이미지를 보려면 작성기 옆에도 images 폴더가 있어야 합니다.

## 소스 수정 시

홈페이지 업로드와 완성된 작성기 사용에는 아래 명령이 필요하지 않습니다. 직접 코드를 바꿀 때만 Node.js 24 이상에서 사용합니다.

    npm ci
    npm test
    npm run dev

- 홈페이지 빌드: npm run build → dist 폴더
- 로컬 작성기 생성: npm run build:editor → local/작성기.html
- 개발 중 작성기: 개발 서버의 /editor.html
- Pages에 배포되는 것은 **dist의 읽기 화면뿐**입니다. 작성기는 dist에 포함되지 않습니다.
- node_modules, dist, .editor-build, local, .git, .env 파일은 수동 업로드 대상이 아닙니다.

설정 참고: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
