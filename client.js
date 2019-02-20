// This is browser code that gets transformed using Parcel/Babel
// Therefore you can now use ES6 style imports

import Phaser from "phaser";

const HOST = window.location.hostname; // localhost and 127.0.0.1 handled
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
  const wsClient = new WebSocket(`ws://${HOST}:${PORT}`);
  wsClient.onopen = (event) => {
    // After the websocket is open, set interactivtiy
    console.log(event);

    // Make the game handle draggable bunny sprite
    this.input.setDraggable(sprite);
    this.input.on("dragstart", (_, gameObject) => {
      gameObject.setTint(0xff0000);
    });
    this.input.on("drag", (_, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
      // wsClient.send(JSON.stringify({ x: gameObject.x, y: gameObject.y }));
    });
    this.input.on("dragend", (_, gameObject) => {
      gameObject.clearTint();
      wsClient.send(JSON.stringify({ x: gameObject.x, y: gameObject.y }));
    });
  }
  wsClient.onmessage = (event) => {
    console.log(event);
    const actorCoordinates = JSON.parse(event.data);
    sprite.x = actorCoordinates.x;
    sprite.y = actorCoordinates.y;
  };
}

// Phaser configuration variables
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 500,
  scene: { preload, create }
};
new Phaser.Game(config);
