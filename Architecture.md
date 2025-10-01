# Claude.md: Flet 프로그램 구현을 위한 Context Engineering 문서

## 1. 개요 및 목적

본 문서는 Flet 기반의 애플리케이션을 설계하고 구현할 때 적용해야 할 핵심 아키텍처 원칙과 설계 가이드라인을 정의합니다. Flet의 WebSocket 기반 서버-클라이언트 아키텍처와 Python 라이브러리 활용 특성을 고려하여, 견고하고 확장 가능한 코드를 작성하는 것을 목표로 합니다.

## 2. 핵심 아키텍처 원칙

Flet 애플리케이션의 성공적인 구현을 위해 다음 세 가지 핵심 원칙을 준수해야 합니다.

### 2.1. Server-Client 역할 명확화 (The Split)

Flet은 Flutter(클라이언트)와 Python(서버) 간의 통신 프로토콜입니다. 각 역할은 명확히 구분되어야 합니다.

| 구성 요소          | 역할                                | 책임                                                                                                                       |
| :----------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Python Server**  | **로직 및 데이터 처리 (The Brain)** | 모든 비즈니스 로직 실행, Python 라이브러리(Pandas, NumPy) 실행, 데이터베이스/API 통신, UI 상태 관리 및 업데이트 명령 생성. |
| **Flutter Client** | **프레젠테이션 (The Body)**         | UI 렌더링, 사용자 입력 감지, 애니메이션, WebSocket 연결 관리.                                                              |

### 2.2. 통신 프로토콜의 추상화 (Flet Protocol)

개발자는 WebSocket 통신 자체에 집중하는 것이 아니라, Python 코드를 통해 UI를 조작하는 **Flet Protocol**의 명령 기반 구조에 집중해야 합니다. 모든 상호작용은 Python 객체의 속성 변경 및 이벤트 핸들러를 통해 이루어져야 합니다.

### 2.3. 종속성 역전 및 디커플링 (Decoupling)

비즈니스 로직(Service Layer)은 Flet UI 라이브러리(`flet`, `ft`)에 대해 어떠한 의존성도 가져서는 안 됩니다. 이는 Flet 이외의 환경(예: REST API 서버)으로 로직을 이식하거나 단위 테스트를 수행할 때 유연성을 제공합니다.

## 3. Flet 아키텍처 계층 구조 (Layered Architecture)

전통적인 MVVM 패턴보다는 서버-클라이언트 구조에 최적화된 계층형 아키텍처를 권장합니다.

| 계층 (Layer)                      | 목적                             | Flet 종속성                   |
| :-------------------------------- | :------------------------------- | :---------------------------- |
| **3.1. Presentation Layer**       | UI 정의 및 이벤트 처리           | **높음** (Flet API 사용)      |
| **3.2. State Management Layer**   | 전역 상태 관리 및 UI 상태 동기화 | **중간** (Flet 업데이트 명령) |
| **3.3. Service Layer (Business)** | 순수한 비즈니스 로직 및 계산     | **없음** (Pure Python)        |
| **3.4. Data Access Layer**        | 외부 리소스 접근 (DB, API 등)    | **없음** (Pure Python)        |

---

### 3.1. Presentation Layer (Flet Views/Controllers)

- **책임:** 사용자 인터페이스 컴포넌트 (`ft.Container`, `ft.Button` 등)를 구성하고, 사용자 입력에 대한 이벤트 핸들러(e.g., `on_click`)를 등록합니다.
- **구현:** 이벤트 발생 시 **Service Layer**를 호출하고, 그 결과에 따라 **State Management Layer**를 통해 UI를 업데이트합니다.

### 3.2. State Management Layer (중앙 상태 관리)

복잡한 애플리케이션은 전역 또는 공유되는 상태를 관리하기 위한 단일 클래스를 정의해야 합니다.

- **구현:** `AppState`와 같은 싱글톤(Singleton) 클래스를 정의하여 사용자 세션 정보, 현재 선택된 테마, 캐시된 데이터 등 애플리케이션 전반에 걸쳐 필요한 데이터를 보관합니다.
- **동기화:** 상태가 변경되면, `AppState`는 관련된 모든 Flet 컨트롤러/페이지에게 상태 변화를 알리고, 해당 컨트롤러는 `page.update()`를 호출하여 Flutter 클라이언트를 동기화해야 합니다.

### 3.3. Service Layer (비즈니스 로직)

- **핵심:** 이 계층의 모든 코드는 `import flet` 없이 순수 Python으로 작성되어야 합니다.
- **책임:** 복잡한 계산 로직, 데이터 유효성 검사, Pandas/NumPy를 사용한 데이터 변환 및 분석 등을 수행합니다.

## 4. Plugin Architecture for Scalability

대규모 시스템에서 기능별 모듈성을 높이고 개별 팀의 독립적인 개발을 지원하기 위해 플러그인 구조를 도입합니다.

### 4.1. 플러그인 정의 및 구조

모든 플러그인은 다음과 같은 구조와 인터페이스를 준수해야 합니다.

1. **`IPlugin` 인터페이스 (혹은 베이스 클래스):**

   - 모든 플러그인은 이 클래스를 상속받아 필수 메서드를 구현해야 합니다.

2. **핵심 메서드:**

   - `initialize(app_state: AppState, app_router: Router) -> None`: 플러그인이 로드될 때 호출됩니다. 중앙 상태 관리 객체(`AppState`)와 라우터 객체를 전달받아 플러그인 로직을 초기화하고, 필요한 경우 라우트에 자신의 View를 등록합니다.
   - `get_services() -> dict`: 플러그인이 제공하는 서비스 객체(Pure Python 로직)를 반환합니다.

3. **플러그인 내부 구조:**
   - **Logic (Pure Python):** 플러그인 자체의 Service/Data Access Layer를 구성합니다.
   - **UI (Flet Components):** 플러그인이 제공하는 커스텀 Flet 컨트롤 또는 View를 구성합니다.

### 4.2. 플러그인 등록 및 로딩 메커니즘

메인 Flet 애플리케이션은 애플리케이션 시작 시 플러그인을 동적으로 검색하고 로드해야 합니다.

1. **디스커버리:** 애플리케이션 시작 시, 지정된 디렉토리(예: `plugins/`)에서 플러그인 모듈을 검색하고 로드합니다.
2. **초기화:** 로드된 각 플러그인 인스턴스에 대해 `initialize(app_state, app_router)`를 호출합니다. 이 단계에서 플러그인은 다음과 같은 작업을 수행합니다:
   - 자신이 사용할 `AppState`의 특정 필드를 구독하거나 초기 데이터를 설정합니다.
   - 자신이 제공하는 UI (`ft.View` 또는 `ft.Control`)를 메인 애플리케이션 라우터에 추가합니다.

### 4.3. 플러그인 간 통신 원칙

## 5. 기술 구현 가이드라인

### 5.1. 비동기 처리 (Async/Concurrency)

Flet 1.0에서 Async 지원이 강화되었으므로, UI 블로킹을 피하기 위해 모든 장시간 작업은 비동기적으로 처리해야 합니다.

- **원칙:** **`on_click` 이벤트 핸들러 내에서 장시간 작업을 동기적으로 실행하는 것을 금지합니다.** (UI가 멈춤)
- **권장:** Service Layer의 함수를 `async` 함수로 정의하고, Presentation Layer에서 `await`를 사용하여 호출하거나, `page.run_thread()` 또는 `ft.app(target=main, view=ft.WEB_BROWSER, assets_dir="assets")`과 같은 Flet의 비동기 실행 환경을 활용합니다.

```python
# 잘못된 예: UI 블로킹 발생
def button_click(e):
    # 이 코드는 UI를 10초 동안 멈춥니다.
    time.sleep(10)
    e.page.add(ft.Text("Done"))

# 권장 예: 비동기 처리
async def button_click(e):
    e.page.add(ft.ProgressRing())
    e.page.update()

    # Service Layer의 비동기 함수 호출
    result = await my_service.perform_long_task()

    e.page.add(ft.Text(f"Result: {result}"))
    e.page.update()
```

### 5.2. 백엔드 인프라 통합 (ASGI)

대규모 애플리케이션 또는 사용자 인증, DB 연결 풀링 등 엔터프라이즈 기능이 필요한 경우, Flet을 독립적으로 실행하지 않고 ASGI 기반의 메인 백엔드 서버에 통합해야 합니다.

- **메인 서버 역할:** FastAPI, Starlette와 같은 ASGI 프레임워크를 사용하여 REST API 엔드포인트를 제공하고, 데이터베이스 ORM 및 인증 처리를 전담합니다.
- **Flet 역할:** 메인 서버의 특정 경로(예: `/flet_app`)에 Flet 애플리케이션을 마운트하여 UI 통신 및 로직 실행을 담당합니다.

### 5.3. 테스트 용이성

Service Layer와 Data Access Layer는 Flet API와 분리되어 있기 때문에, 표준 Python `unittest` 또는 `pytest`를 사용하여 쉽게 단위 테스트를 작성하고 실행해야 합니다. Presentation Layer는 시각적 테스트(Visual Testing) 또는 통합 테스트를 통해 검증합니다.

## 6. Flet 1.0 개선 사항 활용

Flet 1.0 버전의 개선 사항은 위 아키텍처 패턴을 더욱 안정적으로 지원합니다.

1. **향상된 Data Binding 및 View 관리:** 새로운 컴포넌트 생명주기 및 바인딩 기능을 활용하여, 상태 변경 시 불필요한 전체 페이지 업데이트를 최소화하고 성능을 최적화합니다.
2. **안정적인 ASGI 통합:** FastAPI 등과의 통합이 더 안정적이므로, 복잡한 백엔드 분리 구조를 적극적으로 채택합니다.
3. **강화된 Threading 모델:** 백그라운드 작업을 위해 Python의 스레드 또는 프로세스를 사용할 때 발생할 수 있는 잠재적 문제를 줄이고, 비동기 로직의 신뢰성을 높입니다.
