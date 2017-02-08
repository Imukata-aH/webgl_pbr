var container;

var controller; // OrbitController
var propertyGUI; // dat.GUI

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
    propertyGUI = new property();

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
    BRDFFragmentShader.G['SchlickBeckmann'] = document.getElementById( 'G_ShlickBeckmann' ).textContent;
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
            u_lightPos: {type: 'v3', value: light.position},
            u_roughness: {type: 'f', value: propertyGUI.roughness },
            u_tCube: {type: 't', value: textureCube},
            u_lightColor: {type: 'v3', value:       // point light's color
                new THREE.Vector3(
                    light.color.r, 
                    light.color.g, 
                    light.color.b)},
            u_diffuseColor: {type: 'v3', value:     // albedo
                new THREE.Vector3(
                    propertyGUI.diffuse[0] / 255.0, 
                    propertyGUI.diffuse[1] / 255.0, 
                    propertyGUI.diffuse[2] / 255.0)}, 
            u_ambientColor: {type: 'v3', value:     // ambient light color
                new THREE.Vector3(
                    25.0 / 255.0, 
                    25.0 / 255.0, 
                    25.0 / 255.0)},
            u_fresnel: {type: 'v3', value:          // specular F0
                new THREE.Vector3(
                    propertyGUI.fresnel[0] / 255.0, 
                    propertyGUI.fresnel[1] / 255.0, 
                    propertyGUI.fresnel[2] / 255.0)},
            
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

function property() {
  this.roughness = 0.3;
  this.fresnel = [197, 197, 197];
  this.diffuse = [33, 148, 206];
  this.Normal_Dirstribution_Function = 'GGX';
  this.Geometric_Shadowing = 'ShlickGGX';
  this.Cube_Map_Name = 'chapel';
}

window.onload = function() 
{
  function roughnessCallback(value) {
    material.uniforms['u_roughness'].value = propertyGUI.roughness;
  }

  function fresnelCallback(value) {
    var newFresnel = propertyGUI.fresnel;
    material.uniforms['u_fresnel'].value = new THREE.Vector3(newFresnel[0] / 255.0, newFresnel[1] / 255.0, newFresnel[2] / 255.0);
  }

  function diffuseCallback(value)
  {
      var newDiffuse = propertyGUI.diffuse;
      material.uniforms['u_diffuseColor'].value = new THREE.Vector3(newDiffuse[0] / 255.0, newDiffuse[1] / 255.0, newDiffuse[2] / 255.0);
  }

  var datGui = new dat.GUI();
  var roughnessController = datGui.add(propertyGUI, 'roughness', 0.01, 1.0);
  roughnessController.onChange(roughnessCallback);
  roughnessController.onFinishChange(roughnessCallback);

  var fresnelController = datGui.addColor(propertyGUI, 'fresnel');
  fresnelController.onChange(fresnelCallback);
  fresnelController.onFinishChange(fresnelCallback);

  var diffuseController = datGui.addColor(propertyGUI, 'diffuse');
  diffuseController.onChange(diffuseCallback);
  diffuseController.onFinishChange(diffuseCallback);

  var NDFController = datGui.add(propertyGUI, 'Normal_Dirstribution_Function', ['BlinnPhong', 'Beckmann', 'GGX']);
  NDFController.onFinishChange(function(value){

    currentFragShader = BRDFFragmentShader.init
    + BRDFFragmentShader.N[propertyGUI.Normal_Dirstribution_Function]
    + BRDFFragmentShader.G[propertyGUI.Geometric_Shadowing]
    + BRDFFragmentShader.main;

    material.fragmentShader = currentFragShader;
    material.needsUpdate = true;

  })

  var GController = datGui.add(propertyGUI, 'Geometric_Shadowing', ['Implicit', 'CookTorrance', 'Kelemen', 'Beckmann', 'SchlickBeckmann', 'ShlickGGX']);
  GController.onFinishChange(function(value){
    currentFragShader = BRDFFragmentShader.init
    + BRDFFragmentShader.N[propertyGUI.Normal_Dirstribution_Function]
    + BRDFFragmentShader.G[propertyGUI.Geometric_Shadowing]
    + BRDFFragmentShader.main;

    material.fragmentShader = currentFragShader;
    material.needsUpdate = true;
  })


  var cubeMapController = datGui.add(propertyGUI, 'Cube_Map_Name', ['chapel', 'beach', 'church']);
  cubeMapController.onFinishChange(function(value) {
    cubeTexture = initiCubeMap();
    material.uniforms.u_tCube.value = cubeTexture;
  });
}