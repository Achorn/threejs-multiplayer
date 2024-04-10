import * as THREE from "three";
import { io } from "socket.io-client";

// needs to be manually updated right now
const socket = io("http://192.168.4.25:8080");
const boxes = {};

//where we will display our 3d
const canvas = document.querySelector("canvas.webgl");

window.addEventListener("resize", (e) => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  //camera ratio
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // render
  renderer.setSize(sizes.width, sizes.height);
});

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(15, 1, 15),
  new THREE.MeshBasicMaterial({ color: "white" })
);

floor.position.y = -1;
scene.add(floor);

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);

camera.position.y = 10;
camera.position.x = 10;
camera.lookAt(floor.position);

// camera.lookAt(mesh.position);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio || 2);
renderer.render(scene, camera);

const friendInWay = (x, z) => {
  for (const [id, friend] of Object.entries(boxes)) {
    return x == friend.position.x && z == friend.position.z ? true : false;
  }
};

const getInput = (object) => {
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
        if (
          object.position.z > -7 &&
          !friendInWay(object.position.x, object.position.z - 1)
        ) {
          object.position.z -= 1;
          socket.emit("object move", object.position.x, object.position.z);
        }
        break;
      case "ArrowLeft":
        if (
          object.position.z < 7 &&
          !friendInWay(object.position.x, object.position.z + 1)
        ) {
          object.position.z += 1;
          socket.emit("object move", object.position.x, object.position.z);
        }
        break;
      case "ArrowUp":
        if (
          object.position.x > -7 &&
          !friendInWay(object.position.x - 1, object.position.z)
        ) {
          object.position.x -= 1;
          socket.emit("object move", object.position.x, object.position.z);
        }
        break;
      case "ArrowDown":
        if (
          object.position.x < 7 &&
          !friendInWay(object.position.x + 1, object.position.z)
        ) {
          object.position.x += 1;
          socket.emit("object move", object.position.x, object.position.z);
        }
        break;
      default:
        break;
    }
  });
};

const createBox = (position) => {
  const box1 = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: "pink" })
  );
  box1.position.x = position.x;
  box1.position.z = position.z;

  scene.add(box1);
  return box1;
};

const placeFriends = (players) => {
  console.log("placing friends");
  for (const [id, position] of Object.entries(players)) {
    boxes[id] = createBox(position);
  }
};

socket.on("current players", (players) => {
  console.log("current players", players);
  placeFriends(players);
});
socket.on("client joined", (id, position) => {
  // display current users in server
  console.log(id, position);
});

socket.on("create character", (position) => {
  console.log("creating character");
  let box = createBox(position);
  getInput(box);
});

// box joined
socket.on("friend joined", (id, position) => {
  console.log("friend joined");
  boxes[id] = createBox(position);
});
// box moved

socket.on("box moved", (id, position) => {
  console.log("boxed moved!!!", position.x, position.z);
  //update position of box
  boxes[id].position.x = position.x;
  boxes[id].position.z = position.z;
});

// remove box
socket.on("friend left", (id) => {
  console.log("friend has left");
  let box = boxes[id];
  box.geometry.dispose();
  box.material.dispose();
  scene.remove(box);
  delete boxes[id];
});

const tick = () => {
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
