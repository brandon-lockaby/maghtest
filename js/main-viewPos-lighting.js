
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

// modifications
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
    if(obj.material) {
        obj.material.onBeforeCompile = (shader, renderer) => {
            shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
                            
                #ifdef USE_MAP

                    //vec4 sampledDiffuseColor = texture2D( map, vec2(gl_FragCoord) / 200.0 );
                    vec4 sampledDiffuseColor = texture2D( map, vec2(vViewPosition.x, vViewPosition.y) / 2.0 );

                    #ifdef DECODE_VIDEO_TEXTURE

                        // inline sRGB decode (TODO: Remove this code when https://crbug.com/1256340 is solved)

                        sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );

                    #endif

                    diffuseColor *= sampledDiffuseColor;

                #endif

            `);
            console.log(shader.fragmentShader);
            obj.material.needsUpdate = true;
        };
        //obj.material = new MaghMaterial(obj.material.emissiveMap);
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
