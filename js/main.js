// Replace your js/main.js file with this

// We no longer need to import THREE since it's now global from the script tag
import { Game } from './game.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - Initializing game");

    // Check if THREE is available globally
    if (typeof THREE === 'undefined') {
        console.error("THREE.js is not loaded! The game cannot start.");
        document.getElementById('loading-screen').innerHTML = `
            <div class="loading-content">
                <h1>Error Loading Game</h1>
                <p>THREE.js library could not be loaded. Please check your internet connection.</p>
            </div>
        `;
        return;
    }

    console.log("THREE.js is loaded, version:", THREE.REVISION);

    // Initialize the game
    const game = new Game();
    game.init();

    // Handle UI events
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            document.getElementById('game-over').classList.add('hidden');
            game.restart();
        });
    }

    // Controls info
    const closeControlsButton = document.getElementById('close-controls');
    if (closeControlsButton) {
        closeControlsButton.addEventListener('click', () => {
            document.getElementById('controls-info').classList.add('hidden');
        });
    }

    // Show controls on first load
    setTimeout(() => {
        document.getElementById('controls-info').classList.remove('hidden');
    }, 3000);
});
