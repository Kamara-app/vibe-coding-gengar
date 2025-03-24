import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Combat } from './combat.js';

export class Character {
    constructor(scene, loadingManager, particles) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.particles = particles;

        this.model = null;
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;

        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.health = 100;
        this.energy = 100;
        this.energyRegenRate = 5; // per second

        this.moveSpeed = 5;
        this.isMoving = false;
        this.direction = new THREE.Vector3(0, 0, 0);

        this.combat = new Combat(this, scene, particles);
        this.cooldowns = {
            shadowBall: 0,
            hypnosis: 0,
            dreamEater: 0,
            shadowPunch: 0
        };

        this.cooldownTimes = {
            shadowBall: 2,
            hypnosis: 5,
            dreamEater: 8,
            shadowPunch: 1
        };

        this.energyCosts = {
            shadowBall: 20,
            hypnosis: 30,
            dreamEater: 40,
            shadowPunch: 10
        };

        this.loadModel();
    }

    loadModel() {
        if (this.loadingManager) {
            this.loadingManager.startLoading('Gengar Model');
        }

        const loader = new FBXLoader();
        loader.load('Gengar_0324000131_texture_fbx/Gengar_0324000131_texture.fbx', (fbx) => {
            this.model = fbx;

            // Scale and position the model
            this.model.scale.set(0.05, 0.05, 0.05);
            this.model.position.set(0, 0, 0);

            // Setup shadows
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Improve material
                    if (child.material) {
                        child.material.shininess = 0;
                    }
                }
            });

            // Setup animations
            this.mixer = new THREE.AnimationMixer(this.model);

            // Create default animations
            this.createDefaultAnimations();

            // Add to scene
            this.scene.add(this.model);

            // Play idle animation
            this.playAnimation('idle');

            if (this.loadingManager) {
                this.loadingManager.completeLoading('Gengar Model');
            }
        },
        // Progress callback
        (xhr) => {
            if (this.loadingManager) {
                this.loadingManager.updateProgress('Gengar Model', xhr.loaded / xhr.total * 100);
            }
        },
        // Error callback
        (error) => {
            console.error('Error loading Gengar model:', error);
            if (this.loadingManager) {
                this.loadingManager.errorLoading('Gengar Model');
            }
        });
    }

    createDefaultAnimations() {
        // Since we might not have actual animations in the FBX,
        // we'll create some basic ones programmatically

        // Idle animation - slight floating motion
        const idleTrack = this.createFloatingAnimation(0.5, 0.2);
        this.animations['idle'] = this.mixer.clipAction(idleTrack);
        this.animations['idle'].setEffectiveWeight(1);
        this.animations['idle'].setLoop(THREE.LoopRepeat);

        // Walk animation - more pronounced floating with forward motion
        const walkTrack = this.createFloatingAnimation(1, 0.3);
        this.animations['walk'] = this.mixer.clipAction(walkTrack);
        this.animations['walk'].setEffectiveWeight(1);
        this.animations['walk'].setLoop(THREE.LoopRepeat);

        // Attack animation - quick forward lunge
        const attackTrack = this.createAttackAnimation();
        this.animations['attack'] = this.mixer.clipAction(attackTrack);
        this.animations['attack'].setLoop(THREE.LoopOnce);
        this.animations['attack'].clampWhenFinished = true;
    }

    createFloatingAnimation(speed, height) {
        // Create a simple floating animation
        const times = [0, 0.5, 1];
        const positions = [
            0, 0, 0,
            0, height, 0,
            0, 0, 0
        ];

        const positionKF = new THREE.KeyframeTrack(
            '.position[y]',
            times,
            positions
        );

        return new THREE.AnimationClip('float', speed, [positionKF]);
    }

    createAttackAnimation() {
        // Create a simple attack animation
        const times = [0, 0.1, 0.2, 0.3];
        const positions = [
            0, 0, 0,
            0, 0.1, -0.2,
            0, 0.1, -0.1,
            0, 0, 0
        ];

        const positionKF = new THREE.KeyframeTrack(
            '.position',
            times,
            positions
        );

        return new THREE.AnimationClip('attack', 0.3, [positionKF]);
    }

    playAnimation(name, crossFadeDuration = 0.2) {
        if (!this.animations[name]) return;

        const newAction = this.animations[name];

        if (this.currentAction === newAction) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(crossFadeDuration);
        }

        newAction.reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(crossFadeDuration)
            .play();

        this.currentAction = newAction;
    }

    move(direction) {
        this.direction.copy(direction);
        this.isMoving = direction.lengthSq() > 0;

        if (this.isMoving) {
            // Normalize direction and apply speed
            this.direction.normalize();

            // Update rotation to face movement direction
            this.rotation.y = Math.atan2(this.direction.x, this.direction.z);

            // Play walk animation
            this.playAnimation('walk');
        } else {
            // Play idle animation
            this.playAnimation('idle');
        }
    }

    update(deltaTime) {
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Update position based on movement
        if (this.isMoving && this.model) {
            const moveVector = this.direction.clone().multiplyScalar(this.moveSpeed * deltaTime);
            this.model.position.add(moveVector);
            this.model.rotation.y = this.rotation.y;
        }

        // Update cooldowns
        for (const ability in this.cooldowns) {
            if (this.cooldowns[ability] > 0) {
                this.cooldowns[ability] = Math.max(0, this.cooldowns[ability] - deltaTime);
            }
        }

        // Regenerate energy
        this.energy = Math.min(100, this.energy + this.energyRegenRate * deltaTime);

        // Update combat
        this.combat.update(deltaTime);
    }

    // Attack methods
    shadowBall() {
        if (this.cooldowns.shadowBall > 0 || this.energy < this.energyCosts.shadowBall) return false;

        this.playAnimation('attack');
        this.cooldowns.shadowBall = this.cooldownTimes.shadowBall;
        this.energy -= this.energyCosts.shadowBall;

        this.combat.shadowBall();
        return true;
    }

    hypnosis() {
        if (this.cooldowns.hypnosis > 0 || this.energy < this.energyCosts.hypnosis) return false;

        this.playAnimation('attack');
        this.cooldowns.hypnosis = this.cooldownTimes.hypnosis;
        this.energy -= this.energyCosts.hypnosis;

        this.combat.hypnosis();
        return true;
    }

    dreamEater() {
        if (this.cooldowns.dreamEater > 0 || this.energy < this.energyCosts.dreamEater) return false;

        this.playAnimation('attack');
        this.cooldowns.dreamEater = this.cooldownTimes.dreamEater;
        this.energy -= this.energyCosts.dreamEater;

        this.combat.dreamEater();
        return true;
    }

    shadowPunch() {
        if (this.cooldowns.shadowPunch > 0 || this.energy < this.energyCosts.shadowPunch) return false;

        this.playAnimation('attack');
        this.cooldowns.shadowPunch = this.cooldownTimes.shadowPunch;
        this.energy -= this.energyCosts.shadowPunch;

        this.combat.shadowPunch();
        return true;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        // Flash the model red
        if (this.model) {
            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const originalColor = child.material.color.clone();
                    child.material.color.set(0xff0000);
                    setTimeout(() => {
                        child.material.color.copy(originalColor);
                    }, 200);
                }
            });
        }
    }

    heal(amount) {
        this.health = Math.min(100, this.health + amount);
    }

    getCooldownPercent(ability) {
        if (!this.cooldownTimes[ability]) return 0;
        return (this.cooldowns[ability] / this.cooldownTimes[ability]) * 100;
    }

    reset() {
        this.health = 100;
        this.energy = 100;

        // Reset position
        if (this.model) {
            this.model.position.set(0, 0, 0);
        }

        // Reset cooldowns
        for (const ability in this.cooldowns) {
            this.cooldowns[ability] = 0;
        }

        // Play idle animation
        this.playAnimation('idle');
    }
}
