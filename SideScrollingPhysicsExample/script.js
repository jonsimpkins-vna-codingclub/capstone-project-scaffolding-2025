


// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- Matter.js Module Aliases ---
    const { Engine, Render, Runner, Bodies, Composite, Events, Body, Vector } = Matter;

    // --- Game Constants ---
    const FONT_SIZE = 16; // Slightly smaller font size
    const DEBUG_COLOR = '#000';

    // --- Engine and World Setup ---
    const engine = Engine.create();
    const world = engine.world;

    // --- Renderer Setup ---
    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: '#ADD8E6',
            // !! IMPORTANT: Ensure hasBounds is true if you manually control bounds
            hasBounds: true
        }
    });
    Render.run(render);


    let polygon = 'mmmm!';



    function dropTriangle() {
        const viewWidth = render.options.width;
        const cameraCenterX = render.bounds.min.x + viewWidth / 2;
        const spawnX = cameraCenterX + (Math.random() - 0.5) * (viewWidth * 0.5);
        const spawnY = render.bounds.min.y - 50;

        let x = Math.random() * 10;
        let numSides = Math.round(x);

        const triangleSize = 20 + Math.random() * 20;
        const triangle = Bodies.polygon(spawnX, spawnY, numSides, triangleSize, {
            label: polygon, friction: 0.1, frictionAir: 0.01, restitution: 0.4,
            render: { fillStyle: '#800080' }
        });
        Composite.add(world, triangle);
    }

    // --- Runner Setup ---
    const runner = Runner.create();
    Runner.run(runner, engine);

    // --- Game State Variables ---
    let targetMinX, targetMaxX, minWorldX, maxWorldX; // Declare here for broader scope needed by debug text

    // --- Game Objects ---
    const playerWidth = 40;
    const playerHeight = 60;
    const player = Bodies.rectangle(200, window.innerHeight - 150, playerWidth, playerHeight, {
        label: 'player', inertia: Infinity, frictionAir: 0.01, friction: 0.1, density: 0.002, restitution: 0.1,
        render: { fillStyle: '#FF6347' }
    });

    const groundWidth = 8000;
    const groundHeight = 60;
    const ground = Bodies.rectangle(groundWidth / 2, window.innerHeight - (groundHeight / 2), groundWidth, groundHeight, {
        label: 'ground', isStatic: true, render: { fillStyle: '#228B22' }
    });

    // Platforms/Obstacles (including ones further right)
    const platform1 = Bodies.rectangle(600, window.innerHeight - 150, 200, 30, { isStatic: true, label: 'platform', render: { fillStyle: '#A0522D' } });
    const platform2 = Bodies.rectangle(1100, window.innerHeight - 250, 150, 30, { isStatic: true, label: 'platform', render: { fillStyle: '#A0522D' } });
    const dynamicBox = Bodies.rectangle(800, 100, 50, 50, { label: 'obstacle', friction: 0.05, restitution: 0.5, render: { fillStyle: '#808080' } });
    const platform3 = Bodies.rectangle(1800, window.innerHeight - 120, 250, 30, { isStatic: true, label: 'platform', render: { fillStyle: '#A0522D' } });
    const dynamicBox2 = Bodies.rectangle(2200, 200, 60, 60, { label: 'obstacle', friction: 0.05, restitution: 0.5, render: { fillStyle: '#808080' } });
    const platform4 = Bodies.rectangle(2700, window.innerHeight - 200, 100, 100, { isStatic: true, label: 'platform', render: { fillStyle: '#A0522D' } });
    const platform5 = Bodies.rectangle(3500, window.innerHeight - 300, 400, 30, { isStatic: true, label: 'platform', render: { fillStyle: '#A0522D' } });

    // Walls (Crucial for camera clamping)
    // Ensure walls are created correctly positioned
    const wallWidth = 20;
    const wallLeft = Bodies.rectangle(-wallWidth / 2, window.innerHeight / 2, wallWidth, window.innerHeight, {
         isStatic: true, label: 'wall', render: { visible: false } // Position center at x=-10
    });
    const wallRight = Bodies.rectangle(groundWidth + wallWidth / 2, window.innerHeight / 2, wallWidth, window.innerHeight, {
        isStatic: true, label: 'wall', render: { visible: false } // Position center at x=8010
    });

    Composite.add(world, [
        player, ground, platform1, platform2, dynamicBox,
        platform3, dynamicBox2, platform4, platform5,
        wallLeft, wallRight
    ]);

    // --- Player Controls ---
    const keys = { ArrowLeft: false, ArrowRight: false, Space: false };
    let canJump = false;
    window.addEventListener('keydown', (event) => { /* ... same as before ... */ });
    window.addEventListener('keyup', (event) => { /* ... same as before ... */ });
    // Explicitly add the key handlers again for completeness
    window.addEventListener('keydown', (event) => {
        if (keys.hasOwnProperty(event.code)) { keys[event.code] = true; }
        if (event.code === 'ArrowUp' || event.code === 'KeyW') { keys.Space = true; }

        if (event.code === 'KeyE') {
            dropTriangle();
        }
    });
    window.addEventListener('keyup', (event) => {
        if (keys.hasOwnProperty(event.code)) { keys[event.code] = false; }
        if (event.code === 'ArrowUp' || event.code === 'KeyW') { keys.Space = false; }
    });


    // --- Collision Detection ---
    Events.on(engine, 'collisionStart', (event) => { /* ... same as before ... */ });
     // Explicitly add the collision handler again for completeness
     Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            if (pair.bodyA === player || pair.bodyB === player) {
                const otherBody = (pair.bodyA === player) ? pair.bodyB : pair.bodyA;
                if (otherBody.label === 'ground' || otherBody.label === 'platform') {
                    if ((pair.collision.normal.y < -0.5 && pair.bodyA === player) || (pair.collision.normal.y > 0.5 && pair.bodyB === player)) {
                        canJump = true;
                    }
                }

                if (otherBody.label === polygon) {
                    alert('ran into the purple thing')
                    // TODO: player hit another thing

                }
            }
        }
    });


    // --- Button Logic ---
    const dropButton = document.getElementById('dropButton');
    if (dropButton) { /* ... same as before ... */ } else { console.error("Drop button element not found!"); }
     // Explicitly add the button handler again for completeness
     if (dropButton) {
        dropButton.addEventListener('click', () => {
            dropTriangle();
        });
    }


    // --- Game Loop Update (Before Each Physics Tick) ---
    Events.on(engine, 'beforeUpdate', (event) => {
        // --- Player Movement ---
        const moveSpeed = 5;
        const jumpForceMagnitude = 0.04 * player.mass;
        const moveForceMagnitude = 0.001 * player.mass;
        if (keys.ArrowLeft) { Body.applyForce(player, player.position, { x: -moveForceMagnitude, y: 0 }); }
        if (keys.ArrowRight) { Body.applyForce(player, player.position, { x: moveForceMagnitude, y: 0 }); }
        const currentVelocityX = player.velocity.x;
        if (currentVelocityX > moveSpeed) { Body.setVelocity(player, { x: moveSpeed, y: player.velocity.y }); }
        else if (currentVelocityX < -moveSpeed) { Body.setVelocity(player, { x: -moveSpeed, y: player.velocity.y }); }
        if (keys.Space && canJump) {
            Body.applyForce(player, player.position, { x: 0, y: -jumpForceMagnitude });
            canJump = false;
        }

        // --- Camera Side-Scrolling ---
        // console.log("--- Camera Update Tick ---"); // Uncomment for verbose logging

        const targetX = player.position.x;
        const viewWidth = render.options.width;
        const viewHeight = render.options.height; // Needed if vertical scrolling is added

        // Calculate world bounds based on wall positions *after* they are potentially updated by resize
        // Use the actual edges of the walls/ground
        minWorldX = wallLeft.bounds.max.x;   // Should be 0
        maxWorldX = wallRight.bounds.min.x;  // Should be 8000 (groundWidth)
        // console.log(`World Bounds: [${minWorldX?.toFixed(1)}, ${maxWorldX?.toFixed(1)}]`); // Check if bounds are correct

        // Calculate the desired view center based on player position
        const desiredCenterX = targetX;

        // Calculate target bounds based on desired center
        targetMinX = desiredCenterX - viewWidth / 2;
        targetMaxX = desiredCenterX + viewWidth / 2;
        // console.log(`Desired Target Bounds: [${targetMinX.toFixed(1)}, ${targetMaxX.toFixed(1)}]`);

        // Clamp target bounds to world limits
        let clamped = false;
        if (targetMinX < minWorldX) {
            targetMinX = minWorldX;
            targetMaxX = minWorldX + viewWidth;
            clamped = true;
            // console.log("Clamped to MIN world bound");
        }
        if (targetMaxX > maxWorldX) {
            targetMaxX = maxWorldX;
            targetMinX = maxWorldX - viewWidth;
             clamped = true;
            // console.log("Clamped to MAX world bound");
        }
        // console.log(`Clamped Target Bounds: [${targetMinX.toFixed(1)}, ${targetMaxX.toFixed(1)}] (Clamped: ${clamped})`);

        // Smoothly interpolate the *current* bounds towards the *clamped target* bounds
        const smoothingFactor = 0.08; // Adjust if needed (0.05 to 0.1 is usually good)
        const currentMinX = render.bounds.min.x;
        const currentMaxX = render.bounds.max.x;

        let nextMinX = currentMinX + (targetMinX - currentMinX) * smoothingFactor;
        let nextMaxX = currentMaxX + (targetMaxX - currentMaxX) * smoothingFactor;

        // Apply the calculated bounds to the renderer
        // Check if the values are actually changing
        if(Math.abs(render.bounds.min.x - nextMinX) > 0.01 || Math.abs(render.bounds.max.x - nextMaxX) > 0.01) {
             // console.log(`Applying Bounds Update: MinX ${nextMinX.toFixed(1)}, MaxX ${nextMaxX.toFixed(1)}`); // Log when update happens
        } else {
            // console.log("Bounds haven't changed significantly."); // Log if no update applied
        }

        render.bounds.min.x = nextMinX;
        render.bounds.max.x = nextMaxX;

        // Keep vertical view fixed (adjust if needed for vertical scroll)
        render.bounds.min.y = 0;
        render.bounds.max.y = viewHeight; // Use stored viewHeight
    });

    // --- Debug Text ---
    Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        ctx.fillStyle = DEBUG_COLOR;
        ctx.font = `${FONT_SIZE}px Arial`;
        ctx.textAlign = 'left';
        const startY = 30;
        const lineHeight = FONT_SIZE + 4;

        // Clear previous debug text (optional, prevents overlap)
        ctx.clearRect(5, 5, 350, lineHeight * 10); // Adjust size if needed

        ctx.fillText(`Player X: ${player.position.x.toFixed(1)} | Y: ${player.position.y.toFixed(1)}`, 10, startY);
        ctx.fillText(`Can Jump: ${canJump}`, 10, startY + lineHeight);
        ctx.fillText(`Keys: L=${keys.ArrowLeft} R=${keys.ArrowRight} J=${keys.Space}`, 10, startY + lineHeight * 2);

        // Display camera bounds for debugging scrolling
        // Use optional chaining ?. in case variables are undefined briefly at start
        ctx.fillText(`Cam MinX: ${render.bounds.min.x?.toFixed(1)}`, 10, startY + lineHeight * 4);
        ctx.fillText(`Cam MaxX: ${render.bounds.max.x?.toFixed(1)}`, 10, startY + lineHeight * 5);
        ctx.fillText(`TargetMinX: ${targetMinX?.toFixed(1)}`, 10, startY + lineHeight * 6);
        ctx.fillText(`TargetMaxX: ${targetMaxX?.toFixed(1)}`, 10, startY + lineHeight * 7);
        ctx.fillText(`World MinX: ${minWorldX?.toFixed(1)}`, 10, startY + lineHeight * 8);
        ctx.fillText(`World MaxX: ${maxWorldX?.toFixed(1)}`, 10, startY + lineHeight * 9);
    });


    // --- Window Resize Handling ---
    window.addEventListener('resize', () => {
        // Update renderer canvas and options dimensions
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        render.options.width = window.innerWidth;
        render.options.height = window.innerHeight;

        // Update ground position (vertical)
        Body.setPosition(ground, {
            x: ground.position.x,
            y: window.innerHeight - (groundHeight / 2)
        });

        // Update walls position (vertical) and vertices (size)
        // Ensure X positions remain correct relative to groundWidth
        const wallXLeft = -wallWidth / 2;
        const wallXRight = groundWidth + wallWidth / 2;

        Body.setPosition(wallLeft, { x: wallXLeft, y: window.innerHeight / 2 });
        Body.setVertices(wallLeft, Bodies.rectangle(wallXLeft, window.innerHeight / 2, wallWidth, window.innerHeight, { isStatic: true }).vertices);

        Body.setPosition(wallRight, { x: wallXRight, y: window.innerHeight / 2 });
        Body.setVertices(wallRight, Bodies.rectangle(wallXRight, window.innerHeight / 2, wallWidth, window.innerHeight, { isStatic: true }).vertices);

        // Force immediate update of camera bounds after resize to prevent visual jump
        // Recalculate world bounds based on potentially updated wall positions
        minWorldX = wallLeft.bounds.max.x;
        maxWorldX = wallRight.bounds.min.x;
        // Recalculate target bounds based on current player position and new view width
        const viewWidth = render.options.width;
        targetMinX = player.position.x - viewWidth / 2;
        targetMaxX = player.position.x + viewWidth / 2;
        // Clamp immediately
         if (targetMinX < minWorldX) { targetMinX = minWorldX; targetMaxX = minWorldX + viewWidth; }
         if (targetMaxX > maxWorldX) { targetMaxX = maxWorldX; targetMinX = maxWorldX - viewWidth; }
        // Apply clamped bounds directly (no smoothing needed for resize correction)
        render.bounds.min.x = targetMinX;
        render.bounds.max.x = targetMaxX;
        render.bounds.min.y = 0;
        render.bounds.max.y = window.innerHeight;


        console.log("Window resized, renderer and bounds updated.");
    });

}); // End DOMContentLoaded
