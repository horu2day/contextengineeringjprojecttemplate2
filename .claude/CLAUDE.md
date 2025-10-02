이 파일은 Claude가 이 저장소에서 Babylon.js를 사용하여 가우시안 스플래팅 뷰어를 개발할 때 필요한 지침을 제공합니다.

## 프로젝트 개요

이 프로젝트의 목표는 **Babylon.js**를 사용하여 웹 기반의 고성능 **가우시안 스플래팅(.splat, .ply) 뷰어**를 구축하는 것입니다. 사용자는 3D 공간에서 가우시안 스플래팅 데이터를 로드하고, 상호작용하며 탐색할 수 있어야 합니다.

**참고 문서:** [Babylon.js Gaussian Splatting 문서](https://doc.babylonjs.com/features/featuresDeepDive/mesh/gaussianSplatting)

## 핵심 명령어 및 워크플로우

### 기본 개발 명령어

```bash
# 1. 의존성 설치 (최초 1회 실행)
npm install

# 2. 로컬 개발 서버 시작
# http-server를 사용하여 현재 디렉토리에서 서버를 실행하고 브라우저를 자동으로 엽니다.
npm run dev

# 3. 코드 린트 검사
npm run lint
```

### 주요 개발 작업 패턴

Claude에게 다음과 같은 작업을 요청할 수 있습니다.

- **"기본 HTML 및 Babylon.js 씬 설정해줘"**: `index.html`, `main.js`, `style.css` 파일을 생성하고 Babylon.js 엔진, 씬, 카메라의 기본 구조를 설정합니다.
- **"가우시안 스플래팅 파일 로더 구현해줘"**: `.splat` 또는 `.ply` 파일을 비동기적으로 로드하여 씬에 추가하는 기능을 구현합니다.
- **"카메라 컨트롤 추가해줘"**: `ArcRotateCamera`를 사용하여 마우스로 뷰를 회전, 확대/축소, 이동할 수 있는 기능을 추가합니다.
- **"파일 드래그 앤 드롭 기능 추가해줘"**: 사용자가 로컬 파일을 브라우저 창으로 드래그하여 뷰어에서 바로 열 수 있는 기능을 구현합니다.
- **"UI 컨트롤 추가해줘"**: 배경색 변경, 스플랫 크기 조절 등 간단한 UI 컨트롤을 추가합니다.

## 아키텍처 및 프로젝트 구조

```
[ProjectName]/
├── .claude/
│   └── CLAUDE.md         # 이 파일 (Claude 가이드)
├── assets/               # .splat, .ply 등 3D 데이터 파일
│   └── train.splat       # 예제 스플랫 파일
├── examples/
│   └── basic-splat-scene.js  # 새로 추가된 Babylon.js 예제 코드
├── src/                  # JavaScript 소스 코드
│   ├── main.js           # 애플리케이션 진입점, Babylon.js 씬 초기화
│   └── viewer.js         # 뷰어 핵심 로직 (씬 생성, 모델 로딩, 컨트롤 등)
├── styles/
│   └── main.css          # 기본 스타일링
├── index.html            # 메인 HTML 파일 (캔버스 포함)
└── package.json          # 프로젝트 의존성 및 스크립트 정의
```

## 핵심 Babylon.js 개념

- **Engine**: WebGL 렌더링을 처리하는 저수준 객체입니다. 캔버스에 연결됩니다.
- **Scene**: 렌더링할 모든 것(메시, 카메라, 조명 등)을 담는 컨테이너입니다.
- **Camera**: 씬을 보는 시점을 정의합니다. 이 프로젝트에서는 `ArcRotateCamera`가 상호작용에 이상적입니다.
- **GaussianSplattingMesh**: 가우시안 스플래팅 데이터를 로드하고 렌더링하는 핵심 클래스입니다. `CreateFromUrlAsync` 정적 메서드를 사용하여 파일을 쉽게 로드할 수 있습니다.
- **Render Loop**: `engine.runRenderLoop(() => scene.render())`를 통해 매 프레임마다 씬을 다시 그리는 루프입니다.

## 개발 워크플로우

1. **프로젝트 설정**

   - `package.json`을 생성하고 `babylonjs`, `http-server`, `eslint` 등의 개발 의존성을 추가합니다.
   - `npm install`을 실행하여 패키지를 설치합니다.

2. **기본 씬 구성 (`src/main.js`)**

   - `index.html`에 `<canvas id="renderCanvas"></canvas>`를 추가합니다.
   - Babylon.js `Engine`과 `Scene`을 생성합니다.
   - `ArcRotateCamera`를 생성하고 캔버스에 컨트롤을 연결합니다.

3. **스플랫 모델 로딩 (`src/viewer.js`)**

   - `async` 함수를 만들어 `GaussianSplattingMesh.CreateFromUrlAsync`를 호출합니다.
   - `assets/` 폴더에 있는 예제 `.splat` 파일을 로드하여 씬에 추가합니다.
   - 로딩 중/후에 발생할 수 있는 오류를 `try...catch`로 처리합니다.

4. **렌더링 시작 (`src/main.js`)**

   - `engine.runRenderLoop`를 호출하여 씬 렌더링을 시작합니다.
   - 브라우저 창 크기가 조절될 때 렌더링 크기를 동적으로 조절하는 이벤트 리스너를 추가합니다.

5. **기능 확장**
   - UI 라이브러리(`@babylonjs/gui` 등)를 사용하여 파일 로더 버튼, 설정 슬라이더 등을 추가합니다.
   - 드래그 앤 드롭 API를 활용하여 파일 로딩 편의성을 개선합니다.

## 코드 표준 및 패턴

### JavaScript (ES6+ 모듈)

- **모듈 사용**: `import`와 `export`를 사용하여 코드를 모듈화합니다. (`<script type="module">` 활용)
- **비동기 처리**: 파일 로딩과 같이 시간이 걸리는 작업에는 `async/await`를 적극적으로 사용합니다.
- **명확한 네이밍**: 변수와 함수 이름은 그 역할을 명확히 알 수 있도록 작성합니다. (예: `createScene`, `loadSplatFileAsync`)
- **오류 처리**: `try...catch` 구문을 사용하여 비동기 작업의 실패 가능성에 대비합니다.

### Babylon.js 핵심 패턴

### Important Context Patterns

### Tool Development Patterns

**Babylon.js Scene Setup (JavaScript/Modules):**

```javascript
// examples/basic-splat-scene.js에서 export된 패턴을 사용합니다.
import { createBasicSplatScene } from "../examples/basic-splat-scene.js";
// ...
const scene = createBasicSplatScene(engine, canvas);
```

```javascript
// 제공된 예제에서 사용된 SceneLoader 패턴 (Babylon.js 기본 로더)
SceneLoader.ImportMeshAsync(null, url, filename, scene)
  .then((result) => {
    /* handle mesh */
  })
  .catch((error) => {
    /* handle error */
  });

// (CLAUDE.md에 원래 있던) 권장되는 전용 로더 패턴
// GaussianSplattingMesh.CreateFromUrlAsync("splatMesh", url, scene);
```

## 테스트 및 검증

- **수동 테스트**: 브라우저에서 뷰어를 직접 실행하고 기능이 정상적으로 작동하는지 확인합니다.
  - 가우시안 스플랫 모델이 정확하게 렌더링되는가?
  - 마우스 컨트롤(회전, 줌, 이동)이 부드럽게 작동하는가?
  - 콘솔에 오류가 출력되지 않는가?
- **코드 린팅**: `npm run lint` 명령을 실행하여 코드 스타일과 잠재적인 오류를 검사합니다.

## 환경 설정

이 프로젝트는 브라우저에서 직접 실행되므로 복잡한 서버 측 환경 변수(`.env` 파일)가 필요하지 않습니다. 모든 설정은 JavaScript 코드 내에서 관리됩니다.

## 세션 관리 및 토큰 최적화 (Claude 협업 가이드)

### 프로젝트 상태 추적

- **중요**: 각 주요 작업이 완료된 후, Claude에게 현재 진행 상황, 해결된 문제, 다음 단계를 요약하여 세션 기록에 남겨달라고 요청하세요.
- 이는 예기치 않은 연결 중단 시 세션을 효과적으로 복구하는 데 도움이 됩니다.

### 토큰 관리 모범 사례

- 여러 작업을 수행하여 대화가 길어지면 `/compact` 명령을 사용하여 컨텍스트를 압축하세요.
- 새 기능을 시작하기 전이나 다른 영역으로 작업을 전환할 때 컨텍스트를 정리하면 좋습니다.

### `/primer`를 사용한 세션 복구

- 세션이 다시 시작되면 `/primer` 명령을 사용하여 Claude가 이 `CLAUDE.md` 파일을 다시 읽고 프로젝트의 현재 상태를 파악하도록 하세요.

이 가이드는 Claude가 Babylon.js 가우시안 스플래팅 뷰어 프로젝트의 요구사항을 명확히 이해하고, 일관된 코드 스타일과 아키텍처를 유지하며 효율적으로 개발을 진행하는 데 도움을 줄 것입니다.

--- END OF FILE CLAUDE.md ---

### 변경 사항 요약 (한글 설명)

1. **프로젝트 목표 변경**: 기존 "Context Engineering Template"에서 "Babylon.js Gaussian Splatting 뷰어"로 프로젝트의 정체성을 명확히 했습니다.
2. **기술 스택 변경**: TypeScript, Python, Cloudflare Workers 대신 **JavaScript와 Babylon.js**에 초점을 맞췄습니다.
3. **명령어 및 워크플로우 단순화**: `npm` 기반의 간단한 프론트엔드 개발 워크플로우(`npm install`, `npm run dev`)로 변경했습니다. PRP(Product Requirements Prompt)와 같은 복잡한 프로세스는 제거하고, 대신 직접적인 개발 작업 패턴을 제시했습니다.
4. **프로젝트 구조 변경**: 프론트엔드 웹 프로젝트에 맞는 간단한 구조(`assets`, `src`, `styles`, `index.html`)로 재구성했습니다.
5. **핵심 개념 재정의**: Babylon.js의 핵심 개념(Engine, Scene, Camera, `GaussianSplattingMesh`)을 설명하여 Claude가 라이브러리를 올바르게 이해하고 사용하도록 유도했습니다.
6. **코드 표준 및 패턴 업데이트**: JavaScript(ES6 모듈, async/await)와 Babylon.js의 베스트 프랙티스에 맞는 코드 예제와 표준을 제시했습니다. 특히, 가장 중요한 `GaussianSplattingMesh.CreateFromUrlAsync` 사용법을 명확하게 보여주었습니다.
7. **테스트 및 검증 방법 변경**: 서버 측 테스트 대신 브라우저에서의 수동 테스트와 ESLint를 통한 코드 린팅을 주요 검증 방법으로 지정했습니다.
8. **불필요한 섹션 제거/간소화**: 서버 환경 설정(`.env`)과 같은 관련 없는 섹션은 제거하거나 매우 간소화했습니다.
9. **세션 관리 유지**: Claude와의 협업 효율성을 높이는 `세션 관리`, `토큰 최적화` 부분은 범용적으로 유용하므로 그대로 유지했습니다.

이 수정된 `CLAUDE.md` 파일은 Claude가 새로운 프로젝트 목표에 맞춰 일관성 있고 효율적으로 코드를 작성하는 데 훌륭한 가이드가 될 것입니다.
