import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterModelId } from '../../modules/pose-studio/types';

const gltfLoader = new GLTFLoader();

// Cache raw GLTF ArrayBuffers so switching between Male and Female is instantaneous
const modelBufferCache = new Map<string, ArrayBuffer>();

export const characterModelService = {
  /**
   * Load standard or custom character model as a THREE.Group
   */
  async loadCharacter(
    modelId: CharacterModelId,
    customBuffer?: ArrayBuffer
  ): Promise<THREE.Group> {
    if (modelId === 'custom' && customBuffer) {
      return this.parseGLTFBuffer(customBuffer);
    }

    const url = modelId === 'female' ? '/models/Michelle.glb' : '/models/Xbot.glb';

    if (modelBufferCache.has(url)) {
      const buffer = modelBufferCache.get(url)!;
      return this.parseGLTFBuffer(buffer.slice(0));
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch 3D model from ${url} (HTTP ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    modelBufferCache.set(url, arrayBuffer);

    return this.parseGLTFBuffer(arrayBuffer.slice(0));
  },

  /**
   * Parse ArrayBuffer with GLTFLoader and normalize bounds and grounding
   */
  async parseGLTFBuffer(buffer: ArrayBuffer): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      gltfLoader.parse(
        buffer,
        '',
        (gltf) => {
          const root = gltf.scene;
          root.name = 'SkinnedHumanCharacter';

          // Ensure shadows are active
          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Compute bounding box and normalize grounding flush to ground y = 0
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);

          // Handle scale if model is in centimeters (e.g. height > 10m)
          if (size.y > 10) {
            root.scale.setScalar(0.01);
          } else if (size.y < 0.3 && size.y > 0) {
            root.scale.setScalar(10);
          }

          // Re-compute after potential scale
          const boxAfter = new THREE.Box3().setFromObject(root);
          const minY = boxAfter.min.y;

          // Align feet precisely at y = 0
          if (Math.abs(minY) > 0.005) {
            root.position.y -= minY;
          }

          resolve(root);
        },
        (error) => {
          console.error('Error parsing GLB buffer:', error);
          reject(error);
        }
      );
    });
  },

  /**
   * Read file input as ArrayBuffer for custom GLB uploads
   */
  async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('File reader did not return an ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  },
};
