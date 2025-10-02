// examples/basic-splat-scene.js
import {
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  SceneLoader,
} from "@babylonjs/core";

/**
 * 기본 Babylon.js 씬과 가우시안 스플래팅 모델을 로드하는 함수입니다.
 * 이 함수는 엔진과 캔버스가 이미 초기화되었다고 가정합니다.
 *
 * @param {BABYLON.Engine} engine - Babylon.js 렌더링 엔진
 * @param {HTMLCanvasElement} canvas - 렌더링을 위한 HTML 캔버스 요소
 * @returns {BABYLON.Scene} 생성된 씬 객체
 */
export const createBasicSplatScene = function (engine, canvas) {
  // 씬 생성
  const scene = new Scene(engine);

  // ArcRotateCamera 생성 및 설정
  // ArcRotateCamera는 3D 뷰어에 가장 적합하며, 마우스 및 터치 컨트롤을 지원합니다.
  const camera = new ArcRotateCamera(
    "camera1",
    -1, // alpha (azimuth)
    1, // beta (polar)
    10, // radius
    new Vector3(0, 0, 0), // target
    scene
  );

  // 카메라 컨트롤을 캔버스에 연결
  camera.attachControl(canvas, true);

  // 광원 생성 (Ambient light)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  // 예시용 기본 메시 (씬 구조 이해를 돕기 위함)
  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 1, segments: 32 },
    scene
  );
  sphere.position.y = 0.5;
  sphere.position.z = -1;

  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 6, height: 6 },
    scene
  );

  // ===============================================
  // 핵심: 가우시안 스플래팅 데이터 로드
  // SceneLoader를 사용하여 원격 .splat 파일을 비동기적으로 로드합니다.
  // ===============================================
  SceneLoader.ImportMeshAsync(
    null, // meshesName: null (모두 가져오기)
    "https://raw.githubusercontent.com/CedricGuillemet/dump/master/", // rootUrl
    "Halo_Believe.splat", // sceneFilename
    scene
  )
    .then((result) => {
      // 로드된 메시의 위치를 조정 (스플랫 데이터는 종종 원점에 위치)
      if (result.meshes && result.meshes[0]) {
        result.meshes[0].position.y = 1.7;
        console.log("Gaussian Splatting model loaded successfully.");
      }
    })
    .catch((error) => {
      console.error("Failed to load Gaussian Splatting model:", error);
    });

  return scene;
};
