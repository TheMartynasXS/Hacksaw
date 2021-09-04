const BABYLON = require('babylonjs');
class Renderer {
    createScene(canvas, engine) {
        this._canvas = canvas;

        this._engine = engine;

        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0,0,0,0.2);
        this._scene = scene;

        // This creates and positions a free camera (non-mesh)
        const camera = new BABYLON.ArcRotateCamera("camera1",-Math.PI/2, 1.2, 30, new BABYLON.Vector3(0, 0, 0), scene)
        //BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
        //const cube = BABYLON.Mesh.CreateBox("b",3,scene)
        const cube = BABYLON.Mesh.CreateGround("ground",2,2,2,scene);

        // Move the sphere upward 1/2 its height
        cube.position.y = 1;

        var c = new BABYLON.StandardMaterial("cubeMaterial", scene);
        //cubeMaterial.alpha = 0.5
        //var cubeTexture = new BABYLON.Texture('test.dds', scene);
        c.diffuseTexture = new BABYLON.Texture('C:\\Programming\\boner\\public\\test.dds', scene);

        c.diffuseTexture.spe
        c.diffuseTexture.hasAlpha = true;
        c.useAlphaFromDiffuseTexture = true;
        c.backFaceCulling = false;
        c.specularColor = new BABYLON.Color3(0, 0, 0);
        cube.material = c;
    
        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        //const ground = BABYLON.Mesh.CreateGround("centerpoint", 0.1, 0., 1, scene);
    }

    initialize(canvas) {
        const engine = new BABYLON.Engine(canvas, true);
        this.createScene(canvas, engine);

        engine.runRenderLoop(() => {
            
            this._scene.render();
        });

        window.addEventListener('resize', function () {
            engine.resize();
        });
    }
}

const renderer = new Renderer();
renderer.initialize(document.getElementById('render-canvas'));
module.exports = {Renderer}