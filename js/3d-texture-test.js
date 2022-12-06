
import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import { OrbitControls } from './lib/OrbitControls.js';

// renderer and targets
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 10);
controls.target.set(0, 4, 0);
controls.autoRotate = true;
controls.enablePan = false;
controls.update();
scene.add(new THREE.HemisphereLight(0xf0d0d0, 0x101030, 4));
const gltf_loader = new GLTFLoader();
const gltf = await gltf_loader.loadAsync('./models/spider.glb');
console.log(gltf);
scene.add(gltf.scene);

// 3d texture
window.THREE = THREE;
let dimension = 128;
let size = dimension * dimension * dimension * 4;
console.log("3d texture buffer " + (size / 1000000) + " MB");
let buffer = new Uint8Array(size);
window.buffer = buffer;
buffer = buffer.fill(255, 0, size);
for(let i = 0; i < size / 4; i++) {
    buffer[Math.floor(Math.random() * size)] = 0;
}
window.map3d = new THREE.Data3DTexture(buffer, dimension, dimension, dimension);
map3d.format = THREE.RGBAFormat;
map3d.type = THREE.UnsignedByteType;
map3d.needsUpdate = true;

// modifications
scene.traverse(obj => {
    if(obj.material) {
        console.log(obj.material);
        const shader = THREE.ShaderLib.basic;
        const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
        uniforms.map3d = { value: map3d };
        obj.material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            //vertexShader: shader.vertexShader,
            vertexShader: `
                varying vec3 pos;
                void main() {
                    pos = position.xyz;
                    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * modelViewPosition;
                }
            `,
            // fragmentShader: shader.fragmentShader.replace('#include <map_pars_fragment>', `
            //     #ifdef USE_MAP

            //         //uniform sampler2D map;
            //         precision mediump sampler3D;
            //         uniform sampler3D map3d;
                
            //     #endif
            // `)
            // .replace('#include <map_fragment>', `
                            
            //     #ifdef USE_MAP

            //         vec4 sampledDiffuseColor = texture( map3d, vec3( vViewPosition.x * 100.0, vViewPosition.y * 100.0, 0 ) );
            //         //vec4 sampledDiffuseColor = texture2D( map, vec2(vViewPosition.x, vViewPosition.y) / 2.0 );

            //         #ifdef DECODE_VIDEO_TEXTURE

            //             // inline sRGB decode (TODO: Remove this code when https://crbug.com/1256340 is solved)

            //             sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );

            //         #endif

            //         diffuseColor *= sampledDiffuseColor;

            //     #endif

            // `)
            fragmentShader: `
                precision mediump sampler3D;
                uniform sampler3D map3d;
                varying vec3 pos;
                void main() {
                    gl_FragColor = texture( map3d, vec3( pos.x * 0.5, pos.y * 0.5, pos.z * 0.5 ) );
                }
            `
        });
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
