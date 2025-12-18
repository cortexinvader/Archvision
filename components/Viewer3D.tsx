
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { HouseElement } from '../types';
import { MATERIAL_COLORS } from '../constants';

interface Viewer3DProps {
  elements: HouseElement[];
}

const Viewer3D: React.FC<Viewer3DProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    objects: THREE.Group;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.Fog(0xf1f5f9, 1500, 4000);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 10000);
    camera.position.set(1200, 1200, 1200);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(1000, 2000, 1000);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -2000;
    sunLight.shadow.camera.right = 2000;
    sunLight.shadow.camera.top = 2000;
    sunLight.shadow.camera.bottom = -2000;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.blurSamples = 20;
    sunLight.shadow.radius = 4;
    scene.add(sunLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(5000, 5000);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(5000, 100, 0x000000, 0x000000);
    (grid.material as THREE.Material).opacity = 0.05;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const objects = new THREE.Group();
    scene.add(objects);

    sceneRef.current = { scene, camera, renderer, controls, objects };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { objects } = sceneRef.current;
    
    while (objects.children.length > 0) objects.remove(objects.children[0]);

    elements.forEach(el => {
      const h = el.wallHeight || 120;
      let geometry: THREE.BufferGeometry;
      const baseColor = el.color || MATERIAL_COLORS[el.material || 'plaster'];
      
      const createExtrudedGeometry = (variant: string, w: number, d: number, height: number) => {
        const shape = new THREE.Shape();
        if (variant === 'l-shape') {
          const thick = Math.min(w, d) * 0.35;
          shape.moveTo(0, 0);
          shape.lineTo(thick, 0);
          shape.lineTo(thick, d - thick);
          shape.lineTo(w, d - thick);
          shape.lineTo(w, d);
          shape.lineTo(0, d);
        } else if (variant === 't-shape') {
          const thick = Math.min(w, d) * 0.35;
          shape.moveTo(0, 0);
          shape.lineTo(w, 0);
          shape.lineTo(w, thick);
          shape.lineTo(w/2 + thick/2, thick);
          shape.lineTo(w/2 + thick/2, d);
          shape.lineTo(w/2 - thick/2, d);
          shape.lineTo(w/2 - thick/2, thick);
          shape.lineTo(0, thick);
        } else {
          shape.moveTo(0, 0);
          shape.lineTo(w, 0);
          shape.lineTo(w, d);
          shape.lineTo(0, d);
        }
        return new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      };

      let material: THREE.Material;
      if (el.type === 'window') {
        geometry = createExtrudedGeometry(el.variant || 'rect', el.width, el.height, h * 0.4);
        material = new THREE.MeshPhysicalMaterial({ 
          color: 0xbae6fd, 
          transparent: true, 
          opacity: 0.3, 
          transmission: 1.0, 
          roughness: 0, 
          thickness: 2, 
          ior: 1.5 
        });
      } else if (el.type === 'room') {
        geometry = createExtrudedGeometry(el.variant || 'rect', el.width, el.height, 4);
        material = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 1.0, metalness: 0 });
      } else {
        geometry = createExtrudedGeometry(el.variant || 'rect', el.width, el.height, h);
        const isWood = el.material === 'wood';
        const isMetal = el.material === 'metal';
        material = new THREE.MeshStandardMaterial({ 
          color: baseColor, 
          roughness: isWood ? 0.8 : (isMetal ? 0.2 : 0.7),
          metalness: isMetal ? 0.8 : 0.05
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(el.x, el.type === 'room' ? 0.5 : (el.type === 'window' ? h * 0.7 : h), el.y);
      
      const group = new THREE.Group();
      group.add(mesh);
      mesh.position.set(-el.width/2, 0, el.height/2);
      group.position.set(el.x + el.width/2, el.type === 'room' ? 0.5 : 0, el.y + el.height/2);
      group.rotation.y = (el.rotation * Math.PI) / 180;
      
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      objects.add(group);
    });
  }, [elements]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default Viewer3D;
