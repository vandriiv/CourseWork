const slices = 20; //u
const stacks = 20; //v

let currentU = 0;
let currentV = 0;

const arrowsLength = 2;

const neovius = (u, v) => {
    u = adjustPoint(u);
    v = adjustPoint(v);
    const x = u;
    const y = v;

    const z = Math.acos(-3 * (Math.cos(u) + Math.cos(v)) / (3 + 4 * Math.cos(u) * Math.cos(v)));

    return [new THREE.Vector3(x, y, z), new THREE.Vector3(x, y, -z)];
}

const adjustPoint = (p) => {
    const min = -Math.PI / 2;
    const range = Math.PI;

    return range * p + min;
}

const render = () => {
    const defautChecked = false;
    const slider = document.getElementById("slider");
    slider.setAttribute('checked', defautChecked);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 10, 30);
    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight - slider.offsetHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    const top = new THREE.ParametricGeometry((u, v, pos) => {
        const result = neovius(u, v)[0];
        pos.set(result.x, result.y, result.z);
    }, slices, stacks);

    const bottom = new THREE.ParametricGeometry((u, v, pos) => {
        const result = neovius(u, v)[1];
        pos.set(result.x, result.y, result.z);
    }, slices, stacks);

    top.merge(bottom, bottom.matrix);

    const surface = top;
    const material = new THREE.MeshBasicMaterial({ wireframe: defautChecked, color:"#6bf71a" });
    scene.add(new THREE.Mesh(surface, material));

    const dotMaterial = new THREE.PointsMaterial({ color: "blue", size: 0.25 });
    var dotGeometry = new THREE.Geometry();
        
    const pointMesh = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(pointMesh);  

    const tuTArrow = new THREE.ArrowHelper(0,0,arrowsLength,"#f71a6b");
    const tvTArrow = new THREE.ArrowHelper(0,0,arrowsLength,"#f7601a");
    const normalTArrow = new THREE.ArrowHelper(0,0,arrowsLength,"#1abcf7");

    scene.add(tuTArrow);
    scene.add(tvTArrow);
    scene.add(normalTArrow);

    const tuBArrow = new THREE.ArrowHelper(0,0,arrowsLength,"#f71a6b");
    const tvBArrow = new THREE.ArrowHelper(0,0,arrowsLength,"#f7601a");
    const normalBArrow = new THREE.ArrowHelper(0,0,arrowsLength,"#1abcf7");

    scene.add(tuBArrow);
    scene.add(tvBArrow);
    scene.add(normalBArrow);

    slider.addEventListener("change", (e) => {
        material.wireframe = e.target.checked;
    });

    document.addEventListener("keydown", (e) => {
        switch (e.code) {
            case "KeyW":
                if (currentV < stacks) {
                    currentV++;
                }
                break;
            case "KeyS":
                if (currentV > 0) {
                    currentV--;
                }
                break;
            case "KeyD":
                if (currentU < slices) {
                    currentU++;
                }
                break;
            case "KeyA":
                if (currentU > 0) {
                    currentU--;
                }
                break;
            default:
                return;
        }

        move(currentU / slices, currentV / stacks);
    });

    const move = (u, v) => {
        const vertices = neovius(u,v);
        pointMesh.geometry.vertices = vertices;
        pointMesh.geometry.verticesNeedUpdate = true;
        updateVectors(u,v,vertices);
    }

    const updateVectors = (u,v,vertices)=>{
        const {top,bottom} = calculateVectors(u,v);

        updateArrowHelper(tuTArrow,top.tu,vertices[0]);
        updateArrowHelper(tvTArrow,top.tv,vertices[0]);
        updateArrowHelper(normalTArrow,top.normal,vertices[0]);

        updateArrowHelper(tuBArrow,bottom.tu,vertices[1]);
        updateArrowHelper(tvBArrow,bottom.tv,vertices[1]);
        updateArrowHelper(normalBArrow,bottom.normal,vertices[1]);
    }

    move(currentU,currentV);
    
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}

const updateArrowHelper = (arrowHelper,dir,origin,length=1)=>{
    arrowHelper.position.set(origin.x,origin.y,origin.z);
    arrowHelper.setDirection(dir.normalize());
    arrowHelper.setLength(length);
}

const dxdu = (_u, _v) => 1;
const dydu = (_u, _v) => 0;
const dzdu = (u, v) => {
    return (3 * Math.sin(u) / (4 * Math.cos(u) * Math.cos(v) + 3)
        - 12 * Math.sin(u) * Math.cos(v) * (Math.cos(u) + Math.cos(v))
        / Math.pow((4 * Math.cos(u) * Math.cos(v) + 3), 2))
        / Math.sqrt(1 - 9 * Math.pow(Math.cos(u) + Math.cos(v), 2)
            / (Math.pow(4 * Math.cos(u) * Math.cos(v) + 3, 2)));
}

const dxdv = (_u, _v) => 0;
const dydv = (_u, _v) => 1;
const dzdv = (u, v) => {
    return (3 * Math.sin(v) / (4 * Math.cos(u) * Math.cos(v) + 3)
        - 12 * Math.sin(u) * Math.cos(v) * (Math.cos(u) + Math.cos(v))
        / Math.pow((4 * Math.cos(u) * Math.cos(v) + 3), 2))
        / Math.sqrt(1 - 9 * Math.pow(Math.cos(u) + Math.cos(v), 2)
            / (Math.pow(4 * Math.cos(u) * Math.cos(v) + 3, 2)));
}

const tuVector = (u, v) => {
    return new THREE.Vector3(dxdu(u, v), dydu(u, v), dzdu(u, v));
}

const tvVector = (u, v) => {
    return new THREE.Vector3(dxdv(u, v), dydv(u, v), dzdv(u, v));
}

const calculateVectors = (u,v)=>{
    const adjustedU = adjustPoint(u);
    const adjustedV = adjustPoint(v);

    const tuTop = tuVector(adjustedU,adjustedV);
    const tvTop = tvVector(adjustedU,adjustedV);

    const normalTop = new THREE.Vector3();
    normalTop.crossVectors(tuTop,tvTop);

    const tuB = new THREE.Vector3(tuTop.x,tuTop.y,-tuTop.z);
    const tvB = new THREE.Vector3(tvTop.x, tvTop.y, -tvTop.z);
    const normalB = new THREE.Vector3();
    normalB.crossVectors(tuB,tvB);

    return {
        top:{
            tu: tuTop,
            tv:tvTop,
            normal:normalTop
        },
        bottom:{
            tu:tuB,
            tv:tvB,
            normal:normalB
        }
    }
}
