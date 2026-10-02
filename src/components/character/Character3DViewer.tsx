'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCw,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Activity,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export interface ModelPreset {
  id: string;
  name: string;
  type: 'fbx' | 'gltf';
  modelUrl: string;
  motionUrl?: string; // Secondary FBX motion clip if separate
  hasSkeletalAnimation: boolean;
  notes: string;
}

const AVAILABLE_3D_MODELS: ModelPreset[] = [
  {
    id: 'actorcore-idle',
    name: 'ActorCore // Male (Idle Animado)',
    type: 'fbx',
    modelUrl: '/models/actorcore/actor.fbx',
    motionUrl: '/models/actorcore/idle.fbx',
    hasSkeletalAnimation: true,
    notes: 'Esqueleto rigged com animação Idle realista do ActorCore.',
  },
  {
    id: 'realistic-male',
    name: 'Operador Tático // Alta Fidelidade (GLTF)',
    type: 'gltf',
    modelUrl: '/models/realistic_male_character/scene.gltf',
    hasSkeletalAnimation: false,
    notes: 'Malha ultra-detalhada com respiração tática procedural.',
  },
];

interface Character3DViewerProps {
  selectedPresetId?: string;
  onPresetChange?: (presetId: string) => void;
}

export const Character3DViewer: React.FC<Character3DViewerProps> = ({
  selectedPresetId = 'actorcore-idle',
  onPresetChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);

  const [activeModelId, setActiveModelId] = useState<string>(selectedPresetId);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState('Inicializando motor 3D...');
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Animation controls state
  const [isPlaying, setIsPlaying] = useState(true);
  const [animSpeed, setAnimSpeed] = useState<number>(1.0);
  const [isAutoRotate, setIsAutoRotate] = useState(false);

  const currentPreset = AVAILABLE_3D_MODELS.find((m) => m.id === activeModelId) || AVAILABLE_3D_MODELS[0];

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 700;

    // 1. Scene setup with transparent background
    const scene = new THREE.Scene();

    // 2. Camera setup - framed for full-body view
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.25, 3.4);

    // 3. Renderer with ACES tone mapping & transparent background
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Orbit Controls (horizontal orbit with limits)
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 5.0;
    controls.minPolarAngle = Math.PI / 2.35;
    controls.maxPolarAngle = Math.PI / 1.88;
    controls.target.set(0, 1.05, 0);
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.5;

    // 5. Cinematic Tactical Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xdde8f0, 1.3);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    // Cyan Rim Light for silhouette definition
    const rimLight = new THREE.DirectionalLight(0x00e5ff, 2.2);
    rimLight.position.set(-3.5, 2.5, -2.5);
    scene.add(rimLight);

    // Subtle Amber/Red Accent Light
    const accentLight = new THREE.DirectionalLight(0xff5533, 1.3);
    accentLight.position.set(3, 1.5, -2);
    scene.add(accentLight);

    // Floor bounce fill
    const floorBounceLight = new THREE.DirectionalLight(0x1a2233, 0.8);
    floorBounceLight.position.set(0, -2, 2);
    scene.add(floorBounceLight);

    // 6. Ground Contact Shadow Plane directly on floor (y = 0.005)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const gradient = shadowCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.6)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      shadowCtx.fillStyle = gradient;
      shadowCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.005;
    scene.add(shadowMesh);

    // 7. Model & Animation Loading
    let loadedObject: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let basePositionY = 0; // for procedural breathing fallback

    setIsLoading(true);
    setLoadProgress(0);
    setLoadError(null);
    setLoadStatus(`Carregando ${currentPreset.name}...`);

    const normalizeAndMountObject = (obj: THREE.Object3D) => {
      loadedObject = obj;

      // Calculate Bounding Box
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Target human height ~ 2.05 units in our world scene
      const targetHeight = 2.05;
      const scaleFactor = targetHeight / (size.y || 1);
      obj.scale.setScalar(scaleFactor);

      // Re-compute bounding box after scale
      const scaledBox = new THREE.Box3().setFromObject(obj);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      const scaledMin = scaledBox.min;

      // Shift so boots rest exactly at y = 0
      obj.position.x = -scaledCenter.x;
      obj.position.y = -scaledMin.y;
      obj.position.z = -scaledCenter.z;
      basePositionY = obj.position.y;

      // Enhance materials and shadows
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              m.needsUpdate = true;
              if ('roughness' in m) {
                (m as any).roughness = Math.max(0.4, (m as any).roughness || 0.5);
              }
            });
          }
        }
      });

      scene.add(obj);
    };

    if (currentPreset.type === 'fbx') {
      // Load FBX Actor & Motion
      const fbxLoader = new FBXLoader();

      fbxLoader.load(
        currentPreset.modelUrl,
        (characterGroup: THREE.Group) => {
          normalizeAndMountObject(characterGroup);

          // Setup Animation Mixer
          mixer = new THREE.AnimationMixer(characterGroup);
          mixerRef.current = mixer;

          // If there is an external motion file (ActorCore Idle clip)
          if (currentPreset.motionUrl) {
            setLoadStatus('Carregando clipe de animação Idle do ActorCore...');
            fbxLoader.load(
              currentPreset.motionUrl,
              (motionGroup: THREE.Group) => {
                if (motionGroup.animations && motionGroup.animations.length > 0) {
                  const idleClip = motionGroup.animations[0];
                  idleClip.name = 'ActorCore_Idle';
                  const action = mixer!.clipAction(idleClip);
                  actionRef.current = action;
                  action.setLoop(THREE.LoopRepeat, Infinity);
                  action.setEffectiveTimeScale(animSpeed);
                  action.play();
                }
                setIsLoading(false);
              },
              (xhr: ProgressEvent) => {
                if (xhr.total > 0) {
                  const percent = Math.round((xhr.loaded / xhr.total) * 100);
                  setLoadProgress(percent);
                }
              },
              (err: unknown) => {
                console.warn('Could not load separate motion clip, checking internal animations:', err);
                setIsLoading(false);
              }
            );
          } else if (characterGroup.animations && characterGroup.animations.length > 0) {
            const action = mixer.clipAction(characterGroup.animations[0]);
            actionRef.current = action;
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.setEffectiveTimeScale(animSpeed);
            action.play();
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        },
        (xhr: ProgressEvent) => {
          if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setLoadProgress(percent);
          }
        },
        (error: unknown) => {
          console.error('Error loading FBX character:', error);
          setLoadError('Falha ao carregar malha FBX do ActorCore.');
          setIsLoading(false);
        }
      );
    } else {
      // Load GLTF Model
      const gltfLoader = new GLTFLoader();

      gltfLoader.load(
        currentPreset.modelUrl,
        (gltf) => {
          normalizeAndMountObject(gltf.scene);

          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(gltf.scene);
            mixerRef.current = mixer;
            const action = mixer.clipAction(gltf.animations[0]);
            actionRef.current = action;
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.setEffectiveTimeScale(animSpeed);
            action.play();
          }

          setIsLoading(false);
        },
        (xhr) => {
          if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setLoadProgress(percent);
          } else {
            const percent = Math.min(99, Math.round((xhr.loaded / 20350308) * 100));
            setLoadProgress(percent);
          }
        },
        (error) => {
          console.error('Error loading GLTF model:', error);
          setLoadError('Falha ao carregar modelo GLTF.');
          setIsLoading(false);
        }
      );
    }

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop (Mixer update or Procedural Breathing)
    let animationFrameId: number;
    let elapsedTime = 0;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      elapsedTime += delta;

      // Update Skeletal Animation if present
      if (mixerRef.current && isPlaying) {
        mixerRef.current.update(delta);
      } else if (loadedObject && !currentPreset.hasSkeletalAnimation && isPlaying) {
        // Procedural Idle Breathing for static models (subtle chest/body micro-sway)
        const breath = Math.sin(elapsedTime * 2.2) * 0.003;
        const sway = Math.cos(elapsedTime * 1.1) * 0.002;
        loadedObject.position.y = basePositionY + breath;
        loadedObject.rotation.y = sway;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animationFrameId = requestAnimationFrame(animate);

    // 10. Cleanup on unmount or preset switch
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (loadedObject) {
        scene.remove(loadedObject);
      }
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();
      mixerRef.current = null;
      actionRef.current = null;
    };
  }, [activeModelId, currentPreset]);

  // Play / Pause Animation
  const handleTogglePlay = () => {
    if (actionRef.current) {
      if (isPlaying) {
        actionRef.current.paused = true;
      } else {
        actionRef.current.paused = false;
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Speed Adjustment
  const handleCycleSpeed = () => {
    const nextSpeed = animSpeed === 1.0 ? 1.5 : animSpeed === 1.5 ? 0.5 : 1.0;
    setAnimSpeed(nextSpeed);
    if (actionRef.current) {
      actionRef.current.setEffectiveTimeScale(nextSpeed);
    }
  };

  // Toggle Auto Rotate
  const handleToggleAutoRotate = () => {
    if (controlsRef.current) {
      const next = !isAutoRotate;
      controlsRef.current.autoRotate = next;
      setIsAutoRotate(next);
    }
  };

  // Reset Camera
  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 1.05, 0);
    }
  };

  const handleSelectPreset = (id: string) => {
    setActiveModelId(id);
    if (onPresetChange) onPresetChange(id);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'grab',
          outline: 'none',
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'rgba(7, 7, 10, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#fff', fontWeight: 700 }}>
              {loadStatus}
            </span>
          </div>

          <div
            style={{
              width: '260px',
              height: '6px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${loadProgress}%`,
                height: '100%',
                background: 'var(--color-cyan-glow)',
                boxShadow: '0 0 10px var(--color-cyan-glow)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-cyan-glow)' }}>
            {loadProgress > 0 ? `${loadProgress}%` : 'Carregando arquivos 3D...'}
          </span>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div
          style={{
            position: 'absolute',
            padding: '16px 20px',
            background: 'rgba(235, 59, 90, 0.2)',
            border: '1px solid var(--color-red-primary)',
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            zIndex: 35,
            textAlign: 'center',
          }}
        >
          {loadError}
        </div>
      )}
    </div>
  );
};
