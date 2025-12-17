
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
    scene.background = new THREE.Color(0x0f172a); // Deep dark background for pro look
    scene.fog = new THREE.Fog(0x0f172a, 1000, 3000);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(800, 1000, 800);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(500, 1000, 500);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x6366f1, 0.5);
    rimLight.position.set(-500, 500, -500);
    scene.add(rimLight);

    // Dark Grid
    const gridHelper = new THREE.GridHelper(3000, 60, 0x1e293b, 0x0f172a);
    scene.add(gridHelper);

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
      let material: THREE.Material;
      let y = h / 2;

      // Material logic
      const baseColor = el.color || MATERIAL_COLORS[el.material || 'plaster'];
      
      switch(el.type) {
        case 'room':
          geometry = new THREE.BoxGeometry(el.width, 2, el.height);
          material = new THREE.MeshStandardMaterial({ 
            color: baseColor, 
            roughness: 0.9,
            metalness: 0.1
          });
          y = 1;
          break;
        case 'window':
          geometry = new THREE.BoxGeometry(el.width, h * 0.4, el.height);
          material = new THREE.MeshPhysicalMaterial({ 
            color: 0xbae6fd, 
            transparent: true, 
            opacity: 0.4,
            transmission: 0.9,
            thickness: 5,
            roughness: 0.1
          });
          y = h * 0.6;
          break;
        case 'door':
          geometry = new THREE.BoxGeometry(el.width, h * 0.8, el.height);
          material = new THREE.MeshStandardMaterial({ 
            color: el.color || 0x78350f, 
            roughness: 0.4
          });
          y = (h * 0.8) / 2;
          break;
        default:
          geometry = new THREE.BoxGeometry(el.width, h, el.height);
          material = new THREE.MeshStandardMaterial({ 
            color: baseColor,
            roughness: el.material === 'metal' ? 0.2 : 0.7,
            metalness: el.material === 'metal' ? 0.8 : 0.0
          });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(el.x + el.width / 2, y, el.y + el.height / 2);
      mesh.rotation.y = (el.rotation * Math.PI) / 180;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      objects.add(mesh);
    });
  }, [elements]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default Viewer3D;
