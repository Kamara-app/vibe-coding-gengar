import * as THREE from 'three';
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
    }

    init() {
        // Setup loading manager
        this.loadingManager = new LoadingManager();

        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

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
    }

    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
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
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
    }

    setupGround() {
        // Create a simple ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isPaused) return;

        const delta = this.clock.getDelta();

        // Update loading progress
        if (this.loadingManager) {
            this.loadingManager.update();
        }

        // Update character
        if (this.character && !this.isGameOver) {
            this.character.update(delta);
            this.updateUI();
        }

        // Update camera
        if (this.camera && this.character) {
            this.camera.update(this.character.model);
        }

        // Update enemies
        if (this.enemies && !this.isGameOver) {
            this.enemies.update(delta, this.character);
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
        this.renderer.render(this.scene, this.camera.camera);
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
        document.getElementById('game-over').classList.remove('hidden');
    }

    restart() {
        // Reset character
        if (this.character) {
            this.character.reset();
        }

        // Reset enemies
        if (this.enemies) {
            this.enemies.reset();
        }

        this.isGameOver = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            document.getElementById('controls-info').classList.remove('hidden');
        } else {
            document.getElementById('controls-info').classList.add('hidden');
        }
    }

    onWindowResize() {
        if (this.camera) {
            this.camera.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.camera.updateProjectionMatrix();
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
