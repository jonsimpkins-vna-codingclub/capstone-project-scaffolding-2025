// Maze representation (1 = wall, 0 = path)
let maze = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

let mazeWidth = maze[0].length;
let mazeHeight = maze.length;
let cellSize = 50; // Size of each maze cell in 3D space
let wallHeight = 50; // How tall the walls are

// Player variables
let playerX, playerZ; // Position (using maze grid coordinates initially)
let playerY;         // Eye height
let playerAngle = 0; // Direction player is facing (in radians)
let moveSpeed = 1.5; // How fast the player moves
let turnSpeed = 0.05; // How fast the player turns
let collisionPadding = 5; // Small buffer to prevent getting stuck in walls

// --- NEW: Camera perspective settings ---
let fov = Math.PI / 3; // Field of View (60 degrees)
let nearClip = 1;      // Near clipping plane distance (default is often 0.1 * camera Z)
let farClip = 2000;    // Far clipping plane distance (default is often 10 * camera Z)
// Note: The actual defaults depend on camera setup, but these are explicit overrides.
// --- END NEW ---

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL); // Use WEBGL mode for 3D
  angleMode(RADIANS); // Use radians for angles

  // Find a starting position (first '0' found)
  let startFound = false;
  for (let r = 0; r < mazeHeight; r++) {
    for (let c = 0; c < mazeWidth; c++) {
      if (maze[r][c] === 0) {
        // Position player in the center of the starting cell
        playerX = c * cellSize + cellSize / 2;
        playerZ = r * cellSize + cellSize / 2;
        startFound = true;
        break;
      }
    }
    if (startFound) break;
  }
  if (!startFound) {
    console.error("No starting position found in maze (no '0' cells).");
    playerX = cellSize / 2; // Default fallback
    playerZ = cellSize / 2;
  }

  playerY = wallHeight / 3; // Player's eye level

  // Basic lighting
  ambientLight(100); // Provides some overall light
  directionalLight(255, 255, 255, 0.5, -1, -0.5); // Light from an angle

  noStroke(); // Disable outlines for boxes by default
}

function draw() {
  background(30, 30, 50); // Dark blueish background

  handleInput(); // Check for player movement/turning

  // --- NEW: Set perspective ---
  // Needs to be called each frame before camera() if you want it to apply correctly,
  // especially if the aspect ratio might change (e.g., window resize).
  let aspectRatio = width / height;
  perspective(fov, aspectRatio, nearClip, farClip);
  // --- END NEW ---

  // Set up the camera (first-person perspective)
  // Camera position: playerX, playerY, playerZ
  // Camera looks towards: calculate based on angle
  // Up direction: Y-axis (0, 1, 0 - positive Y is up in our view)
  let lookX = playerX + cos(playerAngle) * 10; // Look 10 units ahead
  let lookZ = playerZ + sin(playerAngle) * 10;
  camera(playerX, -playerY, playerZ,   // Eye position (Y is negative for p5's default WEBGL space)
         lookX,   -playerY, lookZ,     // Look-at point (Y is negative)
         0, 1, 0);                    // Up vector (positive Y means "up" in the world view)


  // Draw the maze
  drawMaze();

  // Draw the floor
  drawFloor();
}

function handleInput() {
  let dx = cos(playerAngle) * moveSpeed;
  let dz = sin(playerAngle) * moveSpeed;
  let nextX, nextZ;

  // Forward/Backward movement (W/S or Up/Down)
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) { // W or Up
    nextX = playerX + dx;
    nextZ = playerZ + dz;
    if (isPositionValid(nextX, nextZ)) {
      playerX = nextX;
      playerZ = nextZ;
    }
  }
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { // S or Down
    nextX = playerX - dx;
    nextZ = playerZ - dz;
     if (isPositionValid(nextX, nextZ)) {
      playerX = nextX;
      playerZ = nextZ;
    }
  }

  // Turning (A/D or Left/Right)
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { // A or Left
    playerAngle -= turnSpeed;
  }
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { // D or Right
    playerAngle += turnSpeed;
  }
}

// Collision detection function
function isPositionValid(x, z) {
  // Calculate grid cell coordinates based on potential new position
  // Add padding based on movement direction to check slightly ahead/behind corners
  let checkX = x + (cos(playerAngle) * collisionPadding);
  let checkZ = z + (sin(playerAngle) * collisionPadding);

  let gridX = floor(checkX / cellSize);
  let gridZ = floor(checkZ / cellSize);

  // Check boundaries
  if (gridX < 0 || gridX >= mazeWidth || gridZ < 0 || gridZ >= mazeHeight) {
    return false; // Out of bounds
  }

  // Check if the cell is a wall
  if (maze[gridZ][gridX] === 1) {
    return false; // Collision with wall
  }

  return true; // Position is valid
}


function drawMaze() {
  for (let r = 0; r < mazeHeight; r++) {
    for (let c = 0; c < mazeWidth; c++) {
      if (maze[r][c] === 1) {
        // Calculate wall position (center of the cell)
        let wallX = c * cellSize + cellSize / 2;
        let wallZ = r * cellSize + cellSize / 2;

        push(); // Isolate transformations
        translate(wallX, 0, wallZ); // Move to the wall's position (Y=0 is floor level)
        fill(150, 75, 0); // Brownish color for walls
        stroke(80, 40, 0); // Darker stroke for definition
        strokeWeight(1);
        box(cellSize, wallHeight, cellSize); // Draw the wall block
        pop(); // Restore previous transformations
      }
    }
  }
}

function drawFloor() {
  push();
  // Calculate floor dimensions based on maze size
  let floorWidth = mazeWidth * cellSize;
  let floorDepth = mazeHeight * cellSize;
  // Position the floor plane centered under the maze at Y = wallHeight / 2 (bottom of walls)
  translate(floorWidth / 2, wallHeight / 2, floorDepth / 2);
  rotateX(HALF_PI); // Rotate the plane to be flat on XZ
  fill(50, 50, 50); // Dark grey for the floor
  noStroke();
  plane(floorWidth, floorDepth); // Draw a large plane for the floor
  pop();
}


// Adjust canvas size when window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Note: perspective() will automatically use the new width/height in the next draw() call
}

