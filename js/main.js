
import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import { OrbitControls } from './lib/OrbitControls.js';

// renderer and targets
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// scene
const scene = new THREE.Scene();
const renderer_size = new THREE.Vector2();
renderer.getSize(renderer_size);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 10);
controls.target.set(0, 5, 0);
controls.autoRotate = true;
controls.enablePan = false;
controls.update();

scene.add(new THREE.HemisphereLight(0xf0d0d0, 0x101030));

// models
const gltf_loader = new GLTFLoader();
const gltf = await gltf_loader.loadAsync('../models/spider.glb');
console.log(gltf);
scene.add(gltf.scene);

class MaghMaterial extends THREE.ShaderMaterial {
    constructor(map) {
        super({
            fragmentShader: `
                uniform sampler2D map;
            
                void main() {
                    gl_FragColor = texture2D(map, vec2(gl_FragCoord) / 200.0);
                }
            `
        });
        this.uniforms = {
            map: {
                value: map
            }
        };
    }
}

scene.traverse(obj => {
    if(obj.material && obj.material.emissiveMap) {
        obj.material = new MaghMaterial(obj.material.emissiveMap);
        console.log(obj.material);
    }
});

// events
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// all render
renderer.setAnimationLoop((time) => {
    controls.update();
    renderer.render(scene, camera);
});
