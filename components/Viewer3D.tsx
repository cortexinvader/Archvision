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
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.Fog(0xf8fafc, 1000, 5000);

    const camera = new THREE.PerspectiveCamera(35, width / height, 1, 15000);
    camera.position.set(2000, 1800, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 200;
    controls.maxDistance = 6000;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(1000, 2500, 1000);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 5000;
    directionalLight.shadow.camera.left = -2500;
    directionalLight.shadow.camera.right = 2500;
    directionalLight.shadow.camera.top = 2500;
    directionalLight.shadow.camera.bottom = -2500;
    directionalLight.shadow.radius = 4;
    scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.6);
    scene.add(hemiLight);

    // Modern Floor
    const floorGeo = new THREE.CircleGeometry(5000, 64);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      roughness: 0.9, 
      metalness: 0,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(10000, 100, 0x94a3b8, 0xe2e8f0);
    grid.position.y = -0.5;
    (grid.material as THREE.Material).opacity = 0.1;
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
      const h = el.wallHeight || 240;
      let geometry: THREE.BufferGeometry;
      const baseColor = el.color || MATERIAL_COLORS[el.material || 'plaster'];
      
      const createExtrudedGeometry = (variant: string, w: number, d: number, height: number) => {
        const shape = new THREE.Shape();
        if (variant === 'l-shape') {
          const thick = Math.min(w, d) * 0.4;
          shape.moveTo(0, 0);
          shape.lineTo(thick, 0);
          shape.lineTo(thick, d - thick);
          shape.lineTo(w, d - thick);
          shape.lineTo(w, d);
          shape.lineTo(0, d);
        } else if (variant === 't-shape') {
          const thick = Math.min(w, d) * 0.4;
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
        geometry = createExtrudedGeometry(el.variant || 'rect', el.width, el.height, h * 0.6);
        material = new THREE.MeshPhysicalMaterial({ 
          color: 0xbae6fd, 
          transparent: true, 
          opacity: 0.3, 
          transmission: 1.0, 
          roughness: 0, 
          thickness: 5, 
          ior: 1.52,
          reflectivity: 0.8
        });
      } else if (el.type === 'room') {
        geometry = createExtrudedGeometry(el.variant || 'rect', el.width, el.height, 2);
        material = new THREE.MeshStandardMaterial({ 
          color: baseColor, 
          roughness: 0.8, 
          metalness: 0.1 
        });
      } else if (el.type === 'door') {
        geometry = createExtrudedGeometry(el.variant || 'rect', el.width, el.height, h * 0.9);
        material = new THREE.MeshStandardMaterial({ 
          color: 0x451a03, 
          roughness: 0.6, 
          metalness: 0.2 
        });
      } else {
        geometry = createExtrudedGeometry(el.variant || 'rect', el.width, el.height, h);
        const matType = el.material || 'plaster';
        material = new THREE.MeshStandardMaterial({ 
          color: baseColor, 
          roughness: matType === 'metal' ? 0.2 : (matType === 'wood' ? 0.8 : 0.7),
          metalness: matType === 'metal' ? 0.8 : (matType === 'stone' ? 0.3 : 0)
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      
      const group = new THREE.Group();
      group.add(mesh);
      
      // Center the mesh in the group then move group to absolute world coords
      mesh.position.set(-el.width/2, 0, el.height/2);
      group.position.set(el.x + el.width/2, (el.type === 'room' ? 0.5 : (el.type === 'window' ? h * 0.2 : 0)), el.y + el.height/2);
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