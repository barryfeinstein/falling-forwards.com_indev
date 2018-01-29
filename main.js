var camera, renderer, scene, player, axisHelper, axis;
var geometry, material, mesh;
var controls;
var player;

var INV_MAX_FPS = 1 / 60;
var frameDelta = 0;

var textPrint = "";
var id = document.getElementById("info"); //for debug

var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

function addInfo(text){
    id.innerHTML += "<br />" + text;
}
function init(){
    addInfo("Use arrow keys or WASD to move<br />");
    addInfo("In development: virtual shopping engine for falling-forwards.com");

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0) );//bg color
    renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    document.body.appendChild( renderer.domElement );
    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    document.body.appendChild( stats.domElement );

    var startX = 0, startY = 0, startZ = 0;

    //create geometry, add camera to geom to act as player avatar
    var playerMat = new THREE.MeshBasicMaterial( { color: 0x000fff } );
    var playerGeom = new THREE.BoxGeometry(50, 5, 5 );
    player = new THREE.Mesh( playerGeom, playerMat );
    player.position.set(startX, startY, startZ);
    player.rotation.y = Math.PI;
    player.add(camera);
    scene.add( player );    

    //lighting
    var worldLight = new THREE.AmbientLight(0xFFFFFF, 0);
    scene.add(worldLight);
    
    //fog
    scene.fog = new THREE.FogExp2(0x9db3b5, 0.002);

    //shadows
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;//smooth shadows

    //Extrude SVG path on a Catmull curve
    extrudeShape();

}


function extrudeShape(){
    var shape;
    this.extrudePath = [];
    this.rotationX = -Math.PI / 2;
    this.rotationY = Math.PI / 2;
    this.SVGpath = "#shopSVG";

    this.items = 10; //start out w/ 10 items
    this.extrudeAmount = 1000; 

    this.material = new THREE.MeshNormalMaterial({
        side: THREE.DoubleSide,
        specular: 0x000FFF,
        shininess: 1,
        color: 0x000FFF}
        );
    var wireframe = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true
    });
    
    this.imgHeight = parseInt(document.getElementById("shopSVG").getAttribute("height"));
    this.imgWidth = parseInt(document.getElementById("shopSVG").getAttribute("width"));

    //curve for first room -- randomize? 
    extrudePath.push(
        new THREE.CatmullRomCurve3([
            new THREE.Vector3(player.position.x - this.imgWidth, player.position.y +this.imgHeight / 2,player.position.z - 50),
            new THREE.Vector3(-100, player.position.y+this.imgHeight / 2, this.extrudeAmount / 3),//middle control point
            new THREE.Vector3(200, player.position.y+ this.imgHeight / 2 , this.extrudeAmount / 3 * 2),
            new THREE.Vector3(player.position.x , player.position.y+ this.imgHeight / 2, this.extrudeAmount),
        ])
    );

    var pathMaterial = new THREE.LineBasicMaterial({
        color:0x000FFF,
        linewidth: 15,
    });
    var pathGeometry = new THREE.Geometry();

    //lines are going to be used for gauging placement of items
    for(var i = 0; i < extrudePath[0].getPoints(100).length; i++){
        pathGeometry.vertices.push(extrudePath[0].getPoints(100)[i]);  
    }
    var line = new THREE.Line(pathGeometry, pathMaterial);
    line.position.set(player.position.x, player.position.y,player.position.z - 50);
    scene.add(line); //centerline

    //INDEV - Using parallel paths to calculate item location and player clicks
    // for(var i = 0; i < extrudePath[0].getSpacedPoints(this.items).length; i++ ){
    //     var point = extrudePath[0].getSpacedPoints(this.items)[i];
    //     var tangent = extrudePath[0].getTangent(i);
    //     var tangentCP1 = new THREE.Vector3(tangent.x * 2, tangent.y * 2, tangent.z * 2);
    //     var tangentCP2 = new THREE.Vector3(tangentCP2.x * 2, tangentCP1.y * 2, tangentCP1.z * 2);
    //     var tangentLine = new THREE.Line3(tangentCP1, tangentCP2);

    //     var normal = tangentLine.clone();
    //     normal.rotateZ(Math.PI/2);
    // }

    this.extrudeOptions = {
                amount: this.extrudeAmount,
                steps: this.extrudeAmount / 8,
                bevelThickness: 0,
                bevelSize: 0,
                bevelSegments: 0,
                bevelEnabled: false,
                extrudePath: extrudePath[0],
                curveSegments: 12,
    };
    
    //convert SVG to shape and extrude on path
    var mesh = createMesh(new THREE.ExtrudeBufferGeometry(drawShape(), this.extrudeOptions));
    mesh.position.set( player.position.x, player.position.y,player.position.z - 50);
    scene.add(mesh);

    //bounding box for extruded shape (currently off)
    var boundingBox = new THREE.Shape();
    boundingBox.moveTo(0,0);
    boundingBox.lineTo(this.imgWidth, 0);
    boundingBox.lineTo(this.imgWidth, this.imgHeight);
    boundingBox.lineTo(0, this.imgHeight);
    var boundingGeo = new THREE.ExtrudeBufferGeometry(boundingBox, this.extrudeOptions);
    var boundingMesh = new THREE.Mesh(boundingGeo, wireframe);
    boundingMesh.position.set(player.position.x, player.position.y,player.position.z - 50)
    // scene.add(boundingMesh);
 
    
    // render();
    function drawShape() {
        //convert svg to shape
        var path = document.querySelector(this.SVGpath).getAttribute('d');
        shape = transformSVGPathExposed(path);
        // return the shape
        return shape;
    }
    function createMesh(geom) {
        var mesh = new THREE.SceneUtils.createMultiMaterialObject(geom, [this.material, wireframe]);
        return mesh;
    }

}


function checkPlayerCollision(player){

}

function update(){

    var delta = clock.getDelta();


var moveDistance = 200 * delta; // 200 pixels per second
var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
// addInfo(player.position.x + " " + player.position.y + "  "+ player.position.z);

// move forwards/backwards/left/right
if ( keyboard.pressed("W") )
    player.translateZ( -moveDistance );
if ( keyboard.pressed("S") )
    player.translateZ(  moveDistance );
if ( keyboard.pressed("Q") )
    player.translateX( -moveDistance );
if ( keyboard.pressed("E") )
    player.translateX(  moveDistance ); 

// rotate left/right/up/down
var rotation_matrix = new THREE.Matrix4().identity();
if ( keyboard.pressed("A") )
    player.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
if ( keyboard.pressed("D") )
    player.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);
if ( keyboard.pressed("R") )
    player.rotateOnAxis( new THREE.Vector3(1,0,0), rotateAngle);
if ( keyboard.pressed("F") )
    player.rotateOnAxis( new THREE.Vector3(1,0,0), -rotateAngle);

if ( keyboard.pressed("Z") )//reset
{
    player.position.set(0,25.1,0);
    player.rotation.set(0,0,0);
}

// global coordinates
if ( keyboard.pressed("left") )
player.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle * 2);//player.position.x -= moveDistance;
if ( keyboard.pressed("right") )
player.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle * 2);//player.position.x += moveDistance;
if ( keyboard.pressed("up") )
player.translateZ( -moveDistance );//player.position.z -= moveDistance;
if ( keyboard.pressed("down") )
player.translateZ( moveDistance );//player.position.z += moveDistance;

controls.update();

}

function animate () {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
    stats.update();
    update();

}

init();
animate();



