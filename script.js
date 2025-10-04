const gameContainer = document.getElementById("game-container");
const fish = document.getElementById("fish");
const scoreDisplay = document.getElementById("score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");
const resetButton = document.getElementById("reset-button");
const seaFloor = document.getElementById("sea-floor");

const bgMusic = document.getElementById("bg-music");
const bubbleSound = document.getElementById("bubble-sound");
const soundBtn = document.getElementById("sound-btn");

//game state
let score = 0;
const GRAVITY = 0.15; 
const FLAP_STRENGTH = -5.5; 
const PIPE_SPEED = 2.0; 
const PIPE_SPAWN_TIME = 2500; 
const PIPE_GAP = 250; 

let velocity = 0;
let isGameOver = true; 
let pipeInterval;
let animationFrameId; 

//start game
function startGame() {
    if (!isGameOver) return; 

    isGameOver = false;
    velocity = -3; 
    score = 0;
    scoreDisplay.textContent = score;
    gameOverScreen.style.display = "none";
    startScreen.style.display = "none";


    fish.style.top = "200px";
    fish.style.left = "100px";

    // Removing existing pipes
    document.querySelectorAll(".pipe").forEach(pipe => pipe.remove());

    pipeInterval = setInterval(createPipe, PIPE_SPAWN_TIME);
    requestAnimationFrame(update);

if (!bgMusic.muted) {
        bgMusic.play().catch(e => console.log("Music auto-play blocked:", e));
    } else {
        // If the user has muted it, ensure it stays paused (and silent) on restart
        bgMusic.pause();
    }
}

//fish jump
function jump() {
    if (!isGameOver) {
        velocity = FLAP_STRENGTH; 
        bubbleSound.currentTime = 0;
        bubbleSound.muted = bgMusic.muted;
        bubbleSound.play();
    }
}

//creating dynamic pipes
function createPipe() {
    const minTopHeight = 96;
    const maxTopHeight = gameContainer.clientHeight - seaFloor.offsetHeight - PIPE_GAP - minTopHeight;
    
    //random heights
    const topHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight + 1)) + minTopHeight;

    // Top Pipe
    const topPipe = document.createElement("div");
    topPipe.classList.add("pipe", "pipe-top");
    topPipe.style.height = topHeight + "px";
    topPipe.style.left = gameContainer.clientWidth + "px"; 

    // Bottom Pipe
    const bottomHeight = gameContainer.clientHeight - topHeight - PIPE_GAP - seaFloor.offsetHeight;
    const bottomPipe = document.createElement("div");
    bottomPipe.classList.add("pipe", "pipe-bottom");
    bottomPipe.style.height = bottomHeight + "px";
    bottomPipe.style.left = gameContainer.clientWidth + "px"; 

    gameContainer.appendChild(topPipe);
    gameContainer.appendChild(bottomPipe);
}

// game loop
function update() {
    if (isGameOver) {
        cancelAnimationFrame(animationFrameId);
        return;
    }

    // 1. for fish 
    velocity += GRAVITY;
    let fishTop = parseFloat(fish.style.top) || 0;
    fishTop += velocity;
    
    if (fishTop < 0) fishTop = 0; // Boundary check: top of screen
    
    fish.style.top = fishTop + "px";

    // 2.pipe movements
    document.querySelectorAll(".pipe").forEach(pipe => {
        let pipex = parseFloat(pipe.style.left);
        
        // Move pipe horizontally
        pipex -= PIPE_SPEED;
        pipe.style.left = pipex + "px";

        // Collision Check
        if (pipe.classList.contains("pipe-top")) {
            const bottomPipe = pipe.nextElementSibling;
            
            checkCollision(fish, pipe, bottomPipe);
        }

        // scoring
        if (pipex < -pipe.offsetWidth) {
            if (pipe.classList.contains("pipe-top")) {
                score++;
                scoreDisplay.textContent = score;
            }
            pipe.remove();
        }
    });

    // 3.floor collision
    const fishBottom = fishTop + fish.offsetHeight;
    const floorTop = gameContainer.clientHeight - seaFloor.offsetHeight;
    
    if (fishBottom >= floorTop) {
        endGame();
    }
    
    // Schedule the next frame
    animationFrameId = requestAnimationFrame(update);
}

// collision function
function checkCollision(fish, topPipe, bottomPipe) {
    if (!fish || !topPipe || !bottomPipe || isGameOver) return; 

    const fishRect = fish.getBoundingClientRect();
    const topPipeRect = topPipe.getBoundingClientRect();
    const bottomPipeRect = bottomPipe.getBoundingClientRect();
    const gameContainerRect = gameContainer.getBoundingClientRect();

    // 1. Calculate Elements' Collision Box (relative to game container)
    const actualFish = {
        left: fishRect.left - gameContainerRect.left,
        right: fishRect.right - gameContainerRect.left,
        top: fishRect.top - gameContainerRect.top,
        bottom: fishRect.bottom - gameContainerRect.top,
    };

    const actualTopPipe = {
        left: topPipeRect.left - gameContainerRect.left,
        right: topPipeRect.right - gameContainerRect.left,
        bottom: topPipeRect.bottom - gameContainerRect.top, 
    };

    const actualBottomPipe = {
        left: bottomPipeRect.left - gameContainerRect.left,
        right: bottomPipeRect.right - gameContainerRect.left,
        top: bottomPipeRect.top - gameContainerRect.top,
    };

    // 2. Check Collision Logic

    // Collision with TOP Pipe (hitting its lower base)
    if (
        actualFish.right > actualTopPipe.left &&    // Horizontal Overlap Start
        actualFish.left < actualTopPipe.right &&     // Horizontal Overlap End
        actualFish.top < actualTopPipe.bottom        // Vertical Overlap
    ) {
        endGame();
        return;
    }

    // Collision with BOTTOM Pipe (hitting its top base)
    if (
        actualFish.right > actualBottomPipe.left &&  // Horizontal Overlap Start
        actualFish.left < actualBottomPipe.right &&   // Horizontal Overlap End
        actualFish.bottom > actualBottomPipe.top      // Vertical Overlap
    ) {
        endGame();
        return;
    }
}


// end game
function endGame() {
    isGameOver = true;
    clearInterval(pipeInterval); 
    cancelAnimationFrame(animationFrameId); 
    gameOverScreen.style.display = "block";
    bgMusic.pause();
    bgMusic.currentTime = 0; 
}


// game control

// Start game control
startScreen.addEventListener("click", startGame);

// Jump controls
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") jump();
});

// Tap to jump
gameContainer.addEventListener("click", jump);

// Toggle sound button
soundBtn.addEventListener("click", () => {
    if (bgMusic.muted) {
        bgMusic.muted = false;
        bgMusic.play().catch(e => console.log("Play failed after unmute:", e));
        soundBtn.classList.remove("sound-off");
        soundBtn.classList.add("sound-on");
    } else {
        bgMusic.muted = true;
        bgMusic.pause(); 
        soundBtn.classList.remove("sound-on");
        soundBtn.classList.add("sound-off");
    }
});
// Reset Game Control
resetButton.addEventListener("click", () => {
    gameOverScreen.style.display = "none";
    startGame();
});