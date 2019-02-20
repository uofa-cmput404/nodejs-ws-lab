// This is browser code that gets transformed using Babel
// Therefore you can now use ES6 style imports

import Phaser from "phaser";

const PORT = 8080; // change this if needed

/**
 * Game before starting, good place to load assets
 */
function preload() {
  this.load.image("bunny", "static/bunny1_ready.png");
}

/**
 * Game initializing state
 */
function create() {
  // Create an interactive bunny sprite
  const sprite = this.add.sprite(100, 100, "bunny");
  sprite.setInteractive();

  // Initialize the websocket client
  const wsClient = new WebSocket(`ws://localhost:${PORT}`);
  wsClient.onopen = (event) => {
    console.log(event);
  }
  wsClient.onmessage = (event) => {
    console.log(event);
    const actorCoordinates = JSON.parse(event.data);
    sprite.x = actorCoordinates.x;
    sprite.y = actorCoordinates.y;
  };

  // Make the game handle draggable bunny sprite
  this.input.setDraggable(sprite);
  this.input.on("dragstart", (_, gameObject) => {
    gameObject.setTint(0xff0000);
  });
  this.input.on("drag", (_, gameObject, dragX, dragY) => {
    gameObject.x = dragX;
    gameObject.y = dragY;
  });
  this.input.on("dragend", (_, gameObject) => {
    gameObject.clearTint();
    wsClient.send(JSON.stringify({ x: gameObject.x, y: gameObject.y }));
  });
}


const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 500,
  scene: {
    preload, create
  }
};
const game = new Phaser.Game(config);
