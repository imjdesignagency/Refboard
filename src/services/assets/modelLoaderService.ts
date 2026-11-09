import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface LoadedModelInfo {
  scene: THREE.Group;
  bones: THREE.Bone[];
  skinnedMeshes: THREE.SkinnedMesh[];
  animations: THREE.AnimationClip[];
  hasSkeleton: boolean;
}

const modelCache = new Map<string, LoadedModelInfo>();
const gltfLoader = new GLTFLoader();

export const modelLoaderService = {
  async loadModel(url: string): Promise<LoadedModelInfo> {
    if (modelCache.has(url)) {
      const cached = modelCache.get(url)!;
      return {
        scene: cached.scene.clone(),
        bones: [...cached.bones],
        skinnedMeshes: [...cached.skinnedMeshes],
        animations: cached.animations,
        hasSkeleton: cached.hasSkeleton,
      };
    }

    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => {
          const scene = gltf.scene;
          const bones: THREE.Bone[] = [];
          const skinnedMeshes: THREE.SkinnedMesh[] = [];

          scene.traverse((child) => {
            if ((child as THREE.Bone).isBone) {
              bones.push(child as THREE.Bone);
            }
            if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
              skinnedMeshes.push(child as THREE.SkinnedMesh);
            }
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const info: LoadedModelInfo = {
            scene,
            bones,
            skinnedMeshes,
            animations: gltf.animations || [],
            hasSkeleton: bones.length > 0 || skinnedMeshes.length > 0,
          };

          modelCache.set(url, info);
          resolve(info);
        },
        undefined,
        (error) => {
          console.error(`Error loading GLTF model from ${url}:`, error);
          reject(error);
        }
      );
    });
  },

  disposeModel(object: THREE.Object3D): void {
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  },
};
