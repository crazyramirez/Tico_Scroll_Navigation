var shadowGenerator;
var ground;
var hdrTexture;
var hdrRotation = 80;

var currentTime = 0;
var scrollSections;

var currentStep = 0;
const animationMultiplier = 20;
var disableStepNavigation = false;
var disableStepNavigation_Delay = 600;
var listenerAdded = false;

// VARIABLES TO DEFINE //
// Animation Frame Rate should be 60 FPS (Exported from 3Ds Max, Blender...) //
// Initial Step must be 0 to set the init animation frame // 
const scrollSteps = [0, 2000, 5000, 8000, 11000, 13000];
const animationDuration = 900;
const endOffset = -5000;
const scrollSpeed = 2000; // Lower values Slow movement
const glb_file = "scene.glb";
const stepNavigation_TouchDevice = true;
const stepNavigation_NonTouchDevice = true;
const use_buttons = false;
const showStats = true;
const showScrollIcon = true;
var offset_in = 100; // <-----< [DIV]
var offset_out = 1000; // [DIV] >------>


// GLB AnimationGroups //
// Must Check GLB Animations from file //
var mainAnim, ballAnim, objectsAnim, textsAnim;
  
// Global BabylonJS Variables
var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true, { stencil: false }, true);
var scene = createScene(engine, canvas);
var dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0,0,0), scene);
var camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(-90), BABYLON.Tools.ToRadians(65), 6, BABYLON.Vector3.Zero(), scene);

// On Document Loaded - Start Game //
document.addEventListener("DOMContentLoaded", startGame);


// Create Scene Function
function createScene(engine, canvas) {
    canvas = document.getElementById("renderCanvas");
    engine.clear(new BABYLON.Color3(0, 0, 0), true, true);
    var scene = new BABYLON.Scene(engine);
    return scene;
}

// Start Game
function startGame() {

    if (isTouch)
    {
        document.getElementById("donwload-gif").src = "./resources/images/drag.gif";
        document.getElementById("donwload-gif").style.width = "200px";
        document.getElementById("donwload-gif").style.top = "30px";
    }

    if (showStats)
        document.getElementById("stats-div").style.display = "inline";

    if (showScrollIcon)
        document.getElementById("donwload-gif").style.display = "inline";

    // Directional Light //
    dirLight.intensity = 1;
    dirLight.position = new BABYLON.Vector3(0,2,2);
    dirLight.direction = new BABYLON.Vector3(-2, -5, -3);
 
    // Set Lighting
    setLighting(); 
    
    // Import Main Model
    importModelAsync(glb_file);

    // Glow Layer
    var gl = new BABYLON.GlowLayer("glow", scene, { 
        
        mainTextureFixedSize: 512,
        blurKernelSize: 64
    });
    gl.intensity = 0.60;

    // Render Loop
    var toRender = function () {
        scene.render();
    }
    engine.runRenderLoop(toRender);
}



var base;
// Import Model Async //
function importModelAsync(model) {

    console.log("Version: " + BABYLON.Engine.Version);
    
    Promise.all([
        BABYLON.SceneLoader.ImportMeshAsync(null, "./resources/models/" , model, scene).then(function (result) {

            // console.log("Meshes: " + scene.meshes);
            scene.activeCamera.dispose();
            
            // Get the Camera animated in 3DsMax
            camera = scene.getCameraByName("Camera");
            scene.activeCamera = camera;

            // Get TICO Mesh
            base = scene.getMeshByName("Cylinder 012");

            // Set Animations
            mainAnim = scene.getAnimationGroupByName("MainAnim");
            var armAnim = scene.getAnimationGroupByName("ArmAnim");
            armAnim.speedRatio = 0.5;
            armAnim.play(0.4, true);
            mainAnim.start();
            mainAnim.speedRatio = 1.1;
            setTimeout(() => {
                mainAnim.speedRatio = 1;
                mainAnim.stop();
                mainAnim.start(false, 0, 0, 0, false);
            }, 3200);

            // Touch TICO Materials
            var tico_body = scene.getMaterialByName("Tico_Body");
            tico_body.roughness = 0.3;
            tico_body.albedoColor = new BABYLON.Color3(0.6,0.6,0.8);
            var tico_3 = scene.getMaterialByName("Tico_3");
            tico_3.roughness = 0.3;

            // Move TICO up/down
            var ticoRotate = scene.getNodeByName("TICORotate");
            var alpha = 0;
            scene.registerBeforeRender(function() {
                ticoRotate.position.y = 0.3*Math.sin(alpha)+0.6;
                alpha += 0.01;
            }); 
        }),

    ]).then(() => {
        // Set Reflections & Shadows
        setReflections();
        setShadows();

        // Init App Functions
        setTimeout(() => {
            initFunctions();
            checkButtons();
            setMouseCameraMove();
            setPostProcessing();
            createSmokeParticles(base);
            checkPositionForDIVS();
        }, 1500);

        // Hide Loading Screen after 3,5 sec.
        setTimeout(() => {
            hideLoadingView();    
        }, 3500);
    });
}

// Animation Function
var animating;
function rotateAnimation(node, maxRotation, speed) {
    var axis = new BABYLON.Vector3(0, 1, 0);
    var rotationAngle = 0;
    if (animating == true)
        return;
    
    animating = true;
    var intervalId = setInterval(rotateTICO, speed);
    function rotateTICO() {
        rotationAngle += 0.1;
        var angle = BABYLON.Tools.ToRadians(rotationAngle);
        node.rotate(axis, angle, BABYLON.Space.LOCAL);
        if (BABYLON.Tools.ToDegrees(rotationAngle) >= maxRotation)
        {
            node.rotation.y = Math.PI/4;
            // ticoRotate.rotate(axis, angle2, BABYLON.Space.WORLD);
            animating = false;
            clearInterval(intervalId);
        }
    }
}

// Init Functions
var touchEnabled = true;
function initFunctions() {  

    // Scroll Init Position on Load
    setTimeout(() => {
        $("#scroll-sections").animate({ scrollTop: 0 }, 60);
    }, 300);

    // Set Camera FOV
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    if (windowWidth > windowHeight)
    {
        camera.fov = BABYLON.Tools.ToRadians(40);
    } else {
        camera.fov = BABYLON.Tools.ToRadians(60);
    }

    // Scroll Prevent Default
    canvas.addEventListener('scroll', function(event) {
        event.preventDefault();
    });

    // Set the size of the Main-Section
    document.getElementById("main-section").style.height = animationDuration*animationMultiplier+endOffset + "px";
    scrollSections = document.getElementById('scroll-sections');

    // Detect Click on Meshes
    scrollSections.addEventListener("click", function(event) {
        var x = event.clientX - canvas.offsetLeft;
        var y = event.clientY - canvas.offsetTop;

        // Calculate the direction of the ray based on the position of the click or tap
        var pickInfo = scene.pick(x, y);
        if (pickInfo.hit) {
            // console.log("PickedMesh: " + pickInfo.pickedMesh.name);
            if (pickInfo.pickedMesh.parent)
            {
                // Clicked on TICO
                if (pickInfo.pickedMesh.parent.name == "TICORotate")
                {
                    console.log("PickedMesh: " + pickInfo.pickedMesh.parent.parent.name);
                    var node = scene.getNodeByName("TICORotate");
                    rotateAnimation(node, 1080, 1);
                    animateStep(pickInfo.pickedMesh.parent);
                }

                // Clicked on STEP Model
                if (pickInfo.pickedMesh.parent.parent && pickInfo.pickedMesh.parent.parent.name.includes("Step"))
                {
                    animateStep(pickInfo.pickedMesh.parent.parent);                        
                    rotateAnimation(pickInfo.pickedMesh.parent.parent, 1080, 1);
                }
            }
        }
    });

    // Touch Device or Not
    if (isTouch)
    {
        console.log("isTouch");
        scrollSections_Scroll();
        // Swipe Scroll - Animation Steps
        if (stepNavigation_TouchDevice)
            swipeScroll();
    } else {
        console.log("Desktop");
        scrollSections_Scroll();
        // Wheel Scroll - Animation Steps
        if (stepNavigation_NonTouchDevice)
            wheelScroll();
    }
}

// Animate Object on Click/Tap
var animatingScale = false
function animateStep(node) {

    if (animatingScale)
        return;

    animatingScale = true;
    setTimeout(() => {
        animatingScale = false;
    }, 600);
    // define the animation keys
    var nodeScaleSaved = node.scaling;
    var sum = 0.1;
    var keys = [];
    keys.push({
        frame: 0,
        value: nodeScaleSaved
    });
    keys.push({
        frame: 30,
        value: new BABYLON.Vector3(nodeScaleSaved.x + sum, nodeScaleSaved.y + sum, nodeScaleSaved.z + sum)
    });
    keys.push({
        frame: 60,
        value: new BABYLON.Vector3(1,1,1)
    });
    
    // create the animation
    var animation = new BABYLON.Animation(
        "myAnimation",
        "scaling",
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    node.animations.push(animation);
    // set the animation keys
    animation.setKeys(keys);
    // begin the animation
    scene.beginAnimation(node, 0, 60, true, 2);
}


// Environment Lighting //
function setLighting() {
    hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./resources/env/environment_19.env", scene);
    hdrTexture.rotationY = BABYLON.Tools.ToRadians(hdrRotation);
    hdrSkybox = BABYLON.MeshBuilder.CreateBox("skybox", {size: 2048}, scene);
    var hdrSkyboxMaterial = new BABYLON.PBRMaterial("skybox", scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    hdrSkyboxMaterial.microSurface = 0.8;
    hdrSkyboxMaterial.disableLighting = true;
    hdrSkybox.material = hdrSkyboxMaterial;
    hdrSkybox.infiniteDistance = true;
    var alpha = 0;
    scene.registerBeforeRender(function () {
        hdrSkybox.rotation.y = alpha;
        alpha += 0.001;
    });
}

// Set Shadows //
function setShadows() {
    scene.meshes.forEach(function(mesh) {
        if (mesh.name.includes("Step"))
        {
            mesh.receiveShadows = true;
        }
    });
}

// Set Reflections //
function setReflections() {
    scene.materials.forEach(function (material) {
        if (material.name != "skybox") {
            material.reflectionTexture = hdrTexture;
            material.reflectionTexture.level = 0.7;
            material.disableLighting = false;
        }
    });
}

// Hide Loading View //
function hideLoadingView() {
    document.getElementById("loadingDiv").classList.add("loading-hidden");
    setTimeout(() => {
        document.getElementById("loadingDiv").style.display = "none";
    }, 800);
}

// Resize Window //
window.addEventListener("resize", function () {
    engine.resize();
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    if (windowWidth > windowHeight)
    {
        camera.fov = BABYLON.Tools.ToRadians(40);
    } else {
        camera.fov = BABYLON.Tools.ToRadians(60);
    }
});

// Smoke Particles
function createSmokeParticles(mesh) { 
    var particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
    particleSystem.particleTexture = new BABYLON.Texture("./resources/textures/smoke.png", scene);
    particleSystem.emitter = mesh;
    particleSystem.direction1 = new BABYLON.Vector3(0, -10, 0);
    particleSystem.direction2 = new BABYLON.Vector3(0, -5, 0);
    particleSystem.minEmitPower = 0.1;
    particleSystem.maxEmitPower = 0.6;
    particleSystem.minSize = 0.3;
    particleSystem.maxSize = 1.4;
    particleSystem.color1 = new BABYLON.Color4(0.9, 0.6, 0.9, 0.8);
    particleSystem.color2 = new BABYLON.Color4(0.5, 0.5, 0.9, 0.6);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.7;
    particleSystem.emitRate = 600;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    particleSystem.opacity = 0.7;
    particleSystem.start();
}

// Post Processing
function setPostProcessing() {
    var pipeline = new BABYLON.DefaultRenderingPipeline(
        "defaultPipeline", // The name of the pipeline
        true, // Do you want the pipeline to use HDR texture?
        scene, // The scene instance
        [scene.activeCamera] // The list of cameras to be attached to
    );

    pipeline.fxaaEnabled = true;
    pipeline.samples = 2;
    pipeline.chromaticAberrationEnabled = true;
    pipeline.chromaticAberration.radialIntensity = 5;
    pipeline.imageProcessing.colorCurvesEnabled = true; // false by default
    pipeline.imageProcessing.contrast = 1;

    var curve = new BABYLON.ColorCurves();
    curve.globalDensity = 0; // 0 by default
    curve.globalExposure = 60; // 0 by default
    curve.globalHue = 30; // 30 by default
    curve.globalSaturation = 0; // 0 by default
    curve.highlightsDensity = 0; // 0 by default
    curve.highlightsExposure = 0; // 0 by default
    curve.highlightsHue = 30; // 30 by default
    curve.highlightsSaturation = 0; // 0 by default
    curve.midtonesDensity = 0; // 0 by default
    curve.midtonesExposure = 40; // 0 by default
    curve.midtonesHue = 30; // 30 by default
    curve.midtonesSaturation = 0; // 0 by default
    curve.shadowsDensity = 0; // 0 by default
    curve.shadowsExposure = 0; // 0 by default
    curve.shadowsHue = 30; // 30 by default
    curve.shadowsDensity = 80;
    curve.shadowsSaturation = 0; // 0 by default;
    pipeline.imageProcessing.colorCurves = curve;

    pipeline.imageProcessing.vignetteEnabled = true;
    pipeline.imageProcessing.vignetteWeight = 3;
}