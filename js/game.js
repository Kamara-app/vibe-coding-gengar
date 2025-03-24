import { Character } from './character.js';
import { Controls } from './controls.js';
import { Camera } from './camera.js';
import { EnemyManager } from './enemies.js';
import { ParticleSystem } from './effects/particles.js';
import { LoadingManager } from './utils/loader.js';

export class Game {
    constructor() {
        this.scene = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.character = null;
        this.controls = null;
        this.camera = null;
        this.enemies = null;
        this.particles = null;

        this.loadingManager = null;
        this.isGameOver = false;
        this.isPaused = false;
        this.initialized = false;
    }

    init() {
        // Prevent multiple initializations
        if (this.initialized) return;
        this.initialized = true;

        console.log("Initializing game...");

        // Make sure THREE is available
        if (typeof THREE === 'undefined') {
            console.error("THREE.js is not loaded. Cannot initialize game.");
            this.showError("THREE.js library is not loaded. Please refresh the page or check your internet connection.");
            return;
        }

        // Setup loading manager
        this.loadingManager = new LoadingManager();

        try {
            // Initialize Three.js scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000011); // Slightly blue-black
            this.scene.fog = new THREE.FogExp2(0x000022, 0.02);

            // Setup renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('game-container').appendChild(this.renderer.domElement);

            // Setup camera
            this.camera = new Camera(this.scene);

            // Setup lighting
            this.setupLighting();

            // Setup ground
            this.setupGround();

            // Setup particle system
            this.particles = new ParticleSystem(this.scene);

            // Setup character
            this.character = new Character(this.scene, this.loadingManager, this.particles);

            // Setup controls
            this.controls = new Controls(this.character);

            // Setup enemies
            this.enemies = new EnemyManager(this.scene, this.character, this.loadingManager);

            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize(), false);

            // Start animation loop
            this.animate();

            // Handle pause with ESC key
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    this.togglePause();
                }
            });

            console.log("Game initialization complete!");
        } catch (error) {
            console.error("Error initializing game:", error);
            this.showError("An error occurred while initializing the game. Please check the console for details.");
        }
    }

    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <h1>Error</h1>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambientLight);

        // Add directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(1, 1, 1);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        this.scene.add(dirLight);

        // Add point lights for atmosphere
        const purpleLight = new THREE.PointLight(0x8a2be2, 1, 50);
        purpleLight.position.set(0, 10, 0);
        this.scene.add(purpleLight);

        // Add fog for ghostly atmosphere
        this.scene.fog = new THREE.FogExp2(0x000022, 0.02);
    }

    setupGround() {
        // Create a larger ground plane
        const groundSize = 200;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);

        // Create checker pattern texture
        const textureSize = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const context = canvas.getContext('2d');

        // Draw checkerboard pattern
        const tileSize = textureSize / 16;
        context.fillStyle = '#1a1a2e'; // Dark purple-blue base
        context.fillRect(0, 0, textureSize, textureSize);

        for (let y = 0; y < textureSize; y += tileSize) {
            for (let x = 0; x < textureSize; x += tileSize) {
                // Skip some cells to create an irregular pattern
                if ((x + y) % (tileSize * 3) === 0) {
                    context.fillStyle = '#2c2c54'; // Lighter square
                } else if ((x + y) % (tileSize * 2) === 0) {
                    context.fillStyle = '#20203c'; // Mid square
                } else {
                    continue; // Skip this square (keep background)
                }
                context.fillRect(x, y, tileSize, tileSize);
            }
        }

        // Draw grid lines
        context.strokeStyle = '#4e4e8e';
        context.lineWidth = 1;
        const gridStep = tileSize;

        for (let i = 0; i <= textureSize; i += gridStep) {
            // Draw grid line
            context.beginPath();
            context.moveTo(0, i);
            context.lineTo(textureSize, i);
            context.stroke();

            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, textureSize);
            context.stroke();
        }

        // Stronger lines every 4 cells
        context.strokeStyle = '#7752b8'; // Gengar purple
        context.lineWidth = 2;

        for (let i = 0; i <= textureSize; i += gridStep * 4) {
            context.beginPath();
            context.moveTo(0, i);
            context.lineTo(textureSize, i);
            context.stroke();

            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, textureSize);
            context.stroke();
        }

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Repeat the texture

        // Create ground material with the texture
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.9,
            metalness: 0.1
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Lay flat
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add a grid helper for extra visibility
        const gridHelper = new THREE.GridHelper(groundSize, 40, 0x8a2be2, 0x444466);
        gridHelper.position.y = 0.02; // Slightly above ground to avoid z-fighting
        this.scene.add(gridHelper);

        // Add a center marker
        const centerGeometry = new THREE.CircleGeometry(2, 32);
        const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.5 });
        const centerMarker = new THREE.Mesh(centerGeometry, centerMaterial);
        centerMarker.rotation.x = -Math.PI / 2;
        centerMarker.position.y = 0.03;
        this.scene.add(centerMarker);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isPaused) return;

        const delta = this.clock.getDelta();

        // Update loading progress
        if (this.loadingManager) {
            this.loadingManager.update();
        }

        // Update controls
        if (this.controls && this.camera) {
            this.controls.update(this.camera);
        }

        // Update character
        if (this.character && !this.isGameOver) {
            this.character.update(delta);
            this.updateUI();
        }

        // Update camera
        if (this.camera && this.character && this.character.model) {
            this.camera.update(this.character.model);
        }

        // Update enemies
        if (this.enemies && !this.isGameOver) {
            this.enemies.update(delta, this.character);

            // Check for collisions between character attacks and enemies
            this.checkCollisions();
        }

        // Update particles
        if (this.particles) {
            this.particles.update(delta);
        }

        // Check game over condition
        if (this.character && this.character.health <= 0 && !this.isGameOver) {
            this.gameOver();
        }

        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera.camera);
        }
    }

    checkCollisions() {
        // This is a simplified collision detection system
        // In a real game, you'd want something more sophisticated

        // Get all active projectiles from particles
        if (this.particles && this.particles.particleSystems && this.enemies) {
            const projectiles = this.particles.particleSystems.filter(p =>
                p.userData && p.userData.type === 'projectile');

            // Check each projectile against each enemy
            projectiles.forEach(projectile => {
                this.enemies.enemies.forEach(enemy => {
                    // Simple distance-based collision
                    const distance = projectile.position.distanceTo(enemy.position);

                    if (distance < 1.5) { // Collision radius
                        // Apply damage
                        this.enemies.damageEnemy(enemy, projectile.userData.damage || 20);

                        // Remove projectile
                        this.scene.remove(projectile);
                        const index = this.particles.particleSystems.indexOf(projectile);
                        if (index > -1) {
                            this.particles.particleSystems.splice(index, 1);
                        }
                    }
                });
            });

            // Handle area effects (like hypnosis)
            const areaEffects = this.particles.particleSystems.filter(p =>
                p.userData && p.userData.type === 'area');

            areaEffects.forEach(effect => {
                if (effect.userData.effect === 'stun') {
                    // Get enemies in radius
                    const enemiesInRange = this.enemies.getEnemiesInRadius(
                        effect.position,
                        effect.userData.radius || 5
                    );

                    // Apply stun
                    enemiesInRange.forEach(enemy => {
                        this.enemies.stunEnemy(enemy, 3); // 3 seconds stun
                    });
                }
            });
        }
    }

    updateUI() {
        // Update health and energy bars
        const healthFill = document.getElementById('health-fill');
        const energyFill = document.getElementById('energy-fill');

        if (healthFill && this.character) {
            const healthPercent = Math.max(0, this.character.health);
            healthFill.style.width = `${healthPercent}%`;
        }

        if (energyFill && this.character) {
            const energyPercent = Math.max(0, this.character.energy);
            energyFill.style.width = `${energyPercent}%`;
        }

        // Update ability cooldowns
        const abilities = ['shadowBall', 'hypnosis', 'dreamEater', 'shadowPunch'];
        abilities.forEach(ability => {
            const abilityElement = document.getElementById(ability.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (abilityElement && this.character) {
                const cooldownElement = abilityElement.querySelector('.cooldown');
                if (cooldownElement) {
                    const cooldownPercent = this.character.getCooldownPercent(ability);
                    cooldownElement.style.height = `${cooldownPercent}%`;
                }
            }
        });
    }

    gameOver() {
        this.isGameOver = true;
        const gameOverElement = document.getElementById('game-over');
        if (gameOverElement) {
            gameOverElement.classList.remove('hidden');
        }
    }

    restart() {
        console.log("Restarting game...");

        // Reset character
        if (this.character) {
            this.character.reset();
        }

        // Reset enemies
        if (this.enemies) {
            this.enemies.reset();
        }

        // Clear all particles
        if (this.particles) {
            this.particles.clear();
        }

        this.isGameOver = false;
        console.log("Game restarted.");
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const controlsInfo = document.getElementById('controls-info');

        if (controlsInfo) {
            if (this.isPaused) {
                controlsInfo.classList.remove('hidden');
            } else {
                controlsInfo.classList.add('hidden');
            }
        }

        console.log("Game " + (this.isPaused ? "paused" : "resumed"));
    }

    onWindowResize() {
        if (this.camera && this.camera.camera) {
            this.camera.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.camera.updateProjectionMatrix();
        }

        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    cleanup() {
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
        document.removeEventListener('keydown', this.onKeyDown);

        // Dispose of Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
        }

        // Remove controls
        if (this.controls) {
            this.controls.dispose();
        }

        console.log("Game resources cleaned up");
    }
}
