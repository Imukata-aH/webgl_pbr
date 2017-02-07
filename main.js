var container;

var controller; // OrbitController

var camera, scene, renderer;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var cubeTexture;
var material;

var BRDFFragmentShader = {};

var currentFragShader;

init();
animate();

function init()
{
    container = document.getElementById('container');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1500);
    camera.position.z = 2;
    camera.position.x = 1;
    camera.lightDir = new THREE.Vector3(-1, -1, -1);
    camera.lightDir.normalize();

    scene = new THREE.Scene();

    var light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);

    initShader();
    loadTexture();

    initEnvCube(cubeTexture);    
    initObject(light, cubeTexture);
    

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controller = new THREE.OrbitControls(camera, renderer.domElement);

    window.addEventListener( 'resize', onWindowResize, false );
}

function animate()
{
    requestAnimationFrame(animate);

    controller.update();
    render();
}

function render()
{
    renderer.render(scene, camera);
}

function onWindowResize() 
{
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function initShader() {
    BRDFFragmentShader.init = document.getElementById( 'fragmentShader_param' ).textContent;

    BRDFFragmentShader.N = [];
    BRDFFragmentShader.N['BlinnPhong'] = document.getElementById( 'NDF_BlinnPhong' ).textContent;
    BRDFFragmentShader.N['Beckmann'] = document.getElementById( 'NDF_Beckman' ).textContent;
    BRDFFragmentShader.N['GGX'] = document.getElementById( 'NDF_GGX' ).textContent;

    BRDFFragmentShader.G = [];
    BRDFFragmentShader.G['Implicit'] = document.getElementById( 'G_Implicit' ).textContent;
    BRDFFragmentShader.G['CookTorrance'] = document.getElementById( 'G_CookTorrance' ).textContent;
    BRDFFragmentShader.G['Kelemen'] = document.getElementById( 'G_Kelemen' ).textContent;
    BRDFFragmentShader.G['Beckmann'] = document.getElementById( 'G_Beckmann' ).textContent;
    BRDFFragmentShader.G['Schlick_Beckmann'] = document.getElementById( 'G_ShlickBeckmann' ).textContent;
    BRDFFragmentShader.G['ShlickGGX'] = document.getElementById( 'G_ShlickGGX' ).textContent;

    BRDFFragmentShader.main = document.getElementById( 'fragmentShader_main' ).textContent;

    currentFragShader = BRDFFragmentShader.init
    + BRDFFragmentShader.N['GGX']
    + BRDFFragmentShader.G['ShlickGGX']
    + BRDFFragmentShader.main;
}

function loadTexture()
{
    var urlPrefix = "./cubemap/chapel/";
    var urls = [
        urlPrefix + "posx.jpg",
        urlPrefix + "negx.jpg",
        urlPrefix + "posy.jpg",
        urlPrefix + "negy.jpg",
        urlPrefix + "posz.jpg",
        urlPrefix + "negz.jpg",
    ];

    var loader = new THREE.CubeTextureLoader();
    cubeTexture = loader.load(urls);
}

function initEnvCube(textureCube)
{
    textureCube.Format = THREE.RGBFormat;
    var shader = THREE.ShaderLib["cube"];
    shader.uniforms["tCube"].value = textureCube;
    var material = new THREE.ShaderMaterial
    ({
        fragmentShader  :shader.fragmentShader,
        vertexShader    :shader.vertexShader,
        uniforms        :shader.uniforms,
        depthWrite      :false,
        side            :THREE.BackSide,
    });

    skyBoxMesh = new THREE.Mesh(new THREE.BoxGeometry(200, 200, 200), material);
    scene.add(skyBoxMesh);
}

function initObject(light, textureCube)
{
    material = new THREE.ShaderMaterial({
        uniforms: {
            u_lightColor: {type: 'v3', value: new THREE.Vector3(light.color.r, light.color.g, light.color.b)},
            u_lightPos: {type: 'v3', value: light.position},
            u_diffuseColor: {type: 'v3', value: new THREE.Vector3(33.0 / 255.0, 148.0 / 255.0, 206.0 / 255.0)}, // albedo
            u_ambientColor: {type: 'v3', value: new THREE.Vector3(25.0 / 255.0, 25.0 / 255.0, 25.0 / 255.0)},
            u_roughness: {type: 'f', value: 0.6},
            u_fresnel: {type: 'v3', value: new THREE.Vector3(197.0 / 255.0, 197.0 / 255.0, 197.0 / 255.0)}, // F0
            u_tCube: {type: 't', value: textureCube},
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: currentFragShader,
    });

    var loader = new THREE.JSONLoader();
    loader.load('./objects/bunny.json', function(geometry, materials)
    {
        var mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    });
}
