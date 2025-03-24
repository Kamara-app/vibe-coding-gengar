import * as THREE from 'three';
import { Game } from './game.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
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
