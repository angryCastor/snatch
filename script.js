THREE.SceneUtils = {

	createMultiMaterialObject: function ( geometry, materials ) {

		var group = new THREE.Group();

		for ( var i = 0, l = materials.length; i < l; i ++ ) {

			group.add( new THREE.Mesh( geometry, materials[ i ] ) );

		}

		return group;

	},

	detach: function ( child, parent, scene ) {

		child.applyMatrix( parent.matrixWorld );
		parent.remove( child );
		scene.add( child );

	},

	attach: function ( child, scene, parent ) {

		child.applyMatrix( new THREE.Matrix4().getInverse( parent.matrixWorld ) );

		scene.remove( child );
		parent.add( child );

	}

};

class Terrain{
    constructor(scene, options){
        this.uniforms = null;
        this.plane_mesh = null;
        this.plane_geometry = null;
        this.groundMaterial = null;
        this.clock = new THREE.Clock(!0);
        this.scene = scene;
        this.options = options;

        this.init();
    }


    init(){
        this.uniforms = {
            time: {
                type: "f",
                value: 0
            },
            speed: {
                type: "f",
                value: this.options.speed
            },
            elevation: {
                type: "f",
                value: this.options.elevation
            },
            noise_range: {
                type: "f",
                value: this.options.noise_range
            },
            offset: {
                type: "f",
                value: this.options.elevation
            },
            perlin_passes: {
                type: "f",
                value: this.options.perlin_passes
            },
            sombrero_amplitude: {
                type: "f",
                value: this.options.sombrero_amplitude
            },
            sombrero_frequency: {
                type: "f",
                value: this.options.sombrero_frequency
            },
            line_color: {
                type: "c",
                value: new THREE.Color(this.options.wireframe_color)
            }
        }
        this.buildPlanes(this.options.segments);
    }

    buildPlanes(segments){
        this.plane_geometry = new THREE.PlaneBufferGeometry(20,20,segments,segments);
        this.plane_material = new THREE.ShaderMaterial({
            vertexShader: document.getElementById("shader-vertex-terrain-perlinsombrero").textContent,
            fragmentShader: document.getElementById("shader-fragment-terrain").textContent,
            wireframe: this.options.wireframe,
            wireframeLinewidth: 1,
            transparent: !0,
            uniforms: this.uniforms
        });
        this.materials = [this.plane_material];
        this.plane_mesh = THREE.SceneUtils.createMultiMaterialObject(this.plane_geometry, this.materials);
        this.plane_mesh.rotation.x = -Math.PI / 2;
        this.plane_mesh.position.y = -.5;
    }

    update(){
        this.plane_material.uniforms.time.value = this.clock.getElapsedTime();
    }

    dispose(){
        this.materials[0].dispose();
        this.plane_geometry.dispose();
        this.plane_material.dispose();
    }
}

class Animate{
    constructor(settings){
        this.canvasGL = null;
        this.container = document.createElement("div");
        this.scene = new THREE.Scene;
        this.camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight,.1,1e5);
        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.terrain = null;
        this.composer = null;
        this.render_pass = null;
        this.fxaa_pass = null;
        this.posteffect = !1;
        this.meteo = null;
        this.skybox = null;
        this.terrainOptions = settings;
        this.renderer = new THREE.WebGLRenderer({
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1,
            antialias: !1,
            alpha: !0
        });
        this.isClose = false;


        this.init();
        $(window).on("resize", () => {
            this.resize(window.innerWidth, window.innerHeight)
        })
    }


    init(){
        this.camera.position.z = 7;
        this.camera.position.y = 1;
        this.camera.lookAt(new THREE.Vector3),
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.id = "canvasGL";
        this.container.appendChild(this.renderer.domElement);
        document.getElementById("mountains-bg").appendChild(this.container)
        this.terrain = new Terrain(this.scene,this.terrainOptions);
        this.scene.add(this.terrain.plane_mesh);
        this.update();
    }


    update(){
        this.terrain.update();
        this.renderScene();
        if(this.isClose){
            return;
        }
        requestAnimationFrame(this.update.bind(this));
    }

    renderScene(){
        this.renderer.render(this.scene, this.camera);
    }

    resize(width, height){
        this.camera.aspect = width / height,
        this.camera.updateProjectionMatrix(),
        this.renderer.setSize(width, height)
    }

    dispose(){
        this.renderer.dispose();
        this.terrain.dispose();
        this.isClose = true;
    }
}


class InputManage{
    constructor(value, input){
        this.value = value;
        this.input = input;
    }

    static get settings(){
        return settings;
    }


    change(prop_name){
        let val = this.input.val();
        InputManage.settings[prop_name] = val;
        this.value.text(val);
        $("#canvasGL").remove();
        animate.dispose();
        animate = new Animate(InputManage.settings);
    }
}

class Range extends InputManage{
    constructor(value, input, name){
        super(value, input);

               

        this.input.on("change", () => {
            this.change(name);
        });

        this.input.val(InputManage.settings[name]);
        this.input.trigger("change");
    }
}






const settings = {
    elevation: "-2.4",
    floor_visible: false,
    noise_range: "1",
    perlin_passes: "2",
    segments: 250,
    sombrero_amplitude: "0.1",
    sombrero_frequency: "51",
    speed: "-0.30",
    wireframe: true,
    wireframe_color: "#00effc",
}


let animate = new Animate(settings);
new Range($("#elevation_value"), $("#elevation_input"), "elevation");
new Range($("#noise_range_value"), $("#noise_range_input"), "noise_range");
new Range($("#perlin_passes_value"), $("#perlin_passes_input"), "perlin_passes");
new Range($("#segments_value"), $("#segments_input"), "segments");
new Range($("#sombrero_amplitude_value"), $("#sombrero_amplitude_input"), "sombrero_amplitude");
new Range($("#sombrero_frequency_value"), $("#sombrero_frequency_input"), "sombrero_frequency");
new Range($("#speed_value"), $("#speed_input"), "speed");

$("#color_input").val(InputManage.settings.wireframe_color);
$("#color_input").on("change", () => {
    InputManage.settings.wireframe_color = $("#color_input").val();
    $("#canvasGL").remove();
    animate.dispose();
    animate =new Animate(InputManage.settings);
});

$("#bg_color_input").val("#ffffff");
$("#bg_color_input").on("change", () => {
    $("body").css("background-color", $("#bg_color_input").val());
});