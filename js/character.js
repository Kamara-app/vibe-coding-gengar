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

        // Add this flag to check if model is loaded
        this.modelLoaded = false;

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

        // Create placeholder immediately to ensure we have something to show
        this.createPlaceholderModel();

        // Then try to load the actual model
        this.loadModel();
    }

    async loadModel() {
        console.log('Starting to load FBX model...');

        if (this.loadingManager) {
            this.loadingManager.startLoading('Gengar Model');
        }

        try {
            // Try different ways to access FBXLoader
            let FBXLoaderClass = null;

            // First check if our helper function is available
            if (typeof window.waitForFBXLoader === 'function') {
                FBXLoaderClass = await window.waitForFBXLoader();
            }

            // If that didn't work, try direct access
            if (!FBXLoaderClass) {
                if (typeof THREE.FBXLoader !== 'undefined') {
                    FBXLoaderClass = THREE.FBXLoader;
                } else if (typeof window.FBXLoader !== 'undefined') {
                    FBXLoaderClass = window.FBXLoader;
                } else if (typeof THREE.examples !== 'undefined' &&
                           typeof THREE.examples.jsm !== 'undefined' &&
                           typeof THREE.examples.jsm.loaders !== 'undefined' &&
                           typeof THREE.examples.jsm.loaders.FBXLoader !== 'undefined') {
                    FBXLoaderClass = THREE.examples.jsm.loaders.FBXLoader;
                }
            }

            if (!FBXLoaderClass) {
                console.error("FBXLoader not available - using placeholder model");
                if (this.loadingManager) {
                    this.loadingManager.completeLoading('Gengar Model');
                }
                return;
            }

            console.log("FBXLoader found:", FBXLoaderClass);
            const loader = new FBXLoaderClass();

            const modelPath = './Gengar_0324000131_texture_fbx/Gengar_0324000131_texture.fbx';

            loader.load(
                modelPath,
                (fbx) => {
                    console.log('FBX model loaded successfully:', fbx);

                    // Remove placeholder
                    if (this.model) {
                        this.scene.remove(this.model);
                    }

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

                    // Set flag that model is loaded
                    this.modelLoaded = true;

                    // Play idle animation
                    this.playAnimation('idle');

                    console.log('Gengar model initialized and added to scene');

                    if (this.loadingManager) {
                        this.loadingManager.completeLoading('Gengar Model');
                    }
                },
                // Progress callback
                (xhr) => {
                    if (xhr.lengthComputable) {
                        const percentComplete = xhr.loaded / xhr.total * 100;
                        console.log('Loading progress:', percentComplete.toFixed(2) + '%');

                        if (this.loadingManager) {
                            this.loadingManager.updateProgress('Gengar Model', percentComplete);
                        }
                    }
                },
                // Error callback
                (error) => {
                    console.error('Error loading Gengar model:', error);
                    // We're already using placeholder model, just mark as complete
                    if (this.loadingManager) {
                        this.loadingManager.completeLoading('Gengar Model');
                    }
                }
            );
        } catch (error) {
            console.error("Error setting up FBX loading:", error);
            // We're already using placeholder model
            if (this.loadingManager) {
                this.loadingManager.completeLoading('Gengar Model');
            }
        }
    }

    // Create a more visually distinctive Gengar-like placeholder
    createPlaceholderModel() {
        console.log('Creating placeholder model for Gengar');

        // Create a group to hold our custom placeholder
        const group = new THREE.Group();

        // Main body (purple sphere)
        const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a2be2, // Purple like Gengar
            emissive: 0x4a0082,
            emissiveIntensity: 0.3,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Add spikes on top to mimic Gengar's ears
        const spikeGeometry = new THREE.ConeGeometry(0.25, 0.6, 8);
        const spikeMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a2be2,
            emissive: 0x4a0082,
            emissiveIntensity: 0.3,
            roughness: 0.7
        });

        // Left ear
        const leftEar = new THREE.Mesh(spikeGeometry, spikeMaterial);
        leftEar.position.set(0.5, 0.9, 0);
        leftEar.rotation.z = Math.PI/10;
        group.add(leftEar);

        // Right ear
        const rightEar = new THREE.Mesh(spikeGeometry, spikeMaterial);
        rightEar.position.set(-0.5, 0.9, 0);
        rightEar.rotation.z = -Math.PI/10;
        group.add(rightEar);

        // Eyes (white spheres)
        const eyeGeometry = new THREE.SphereGeometry(0.2, 12, 12);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xdddddd,
            emissiveIntensity: 0.5,
            roughness: 0.3
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.4, 0.3, -0.7);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.4, 0.3, -0.7);
        group.add(rightEye);

        // Pupils (red spheres - more menacing)
        const pupilGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const pupilMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xaa0000,
            emissiveIntensity: 0.8,
            roughness: 0.1
        });

        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(0.4, 0.3, -0.85);
        group.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(-0.4, 0.3, -0.85);
        group.add(rightPupil);

        // Mouth (creepier smile)
        const mouthGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 16, Math.PI);
        const mouthMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x880000,
            emissiveIntensity: 0.5
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.2, -0.7);
        mouth.rotation.set(Math.PI/2, 0, 0);
        group.add(mouth);

        // Add hands (spheres on the sides)
        const handGeometry = new THREE.SphereGeometry(0.25, 12, 12);
        const handMaterial = new THREE.MeshStandardMaterial({
            color: 0x7722aa,
            emissive: 0x3a0055,
            emissiveIntensity: 0.3,
            roughness: 0.7
        });

        // Left hand
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(1.2, -0.2, 0);
        group.add(leftHand);

        // Right hand
        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(-1.2, -0.2, 0);
        group.add(rightHand);

        // Add stubby legs/feet at the bottom
        const footGeometry = new THREE.SphereGeometry(0.3, 12, 12);
        const footMaterial = new THREE.MeshStandardMaterial({
            color: 0x7722aa,
            emissive: 0x3a0055,
            emissiveIntensity: 0.3,
            roughness: 0.7
        });

        // Left foot
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(0.5, -0.9, 0);
        leftFoot.scale.set(1, 0.5, 1); // Flatten a bit
        group.add(leftFoot);

        // Right foot
        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(-0.5, -0.9, 0);
        rightFoot.scale.set(1, 0.5, 1); // Flatten a bit
        group.add(rightFoot);

        // Add a subtle glow effect
        const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x8a2be2,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);

        // Position the entire group
        group.position.set(0, 1.2, 0); // Lift it off the ground a bit more
        group.castShadow = true;
        group.receiveShadow = true;

        // Add a point light to make Gengar glow a bit
        const characterLight = new THREE.PointLight(0x8a2be2, 1, 4);
        characterLight.position.set(0, 0.5, 0);
        group.add(characterLight);

        this.model = group;
        this.scene.add(this.model);
        this.modelLoaded = true;

        // Setup mixer for animations
        this.mixer = new THREE.AnimationMixer(this.model);
        this.createDefaultAnimations();
        this.playAnimation('idle');
    }

    createDefaultAnimations() {
        // Since we might not have actual animations in the FBX,
        // we'll create some basic ones programmatically

        // Idle animation - slight floating motion with a bit of rotation
        const idleTrack = this.createFloatingAnimation(2, 0.3);
        this.animations['idle'] = this.mixer.clipAction(idleTrack);
        this.animations['idle'].setEffectiveWeight(1);
        this.animations['idle'].setLoop(THREE.LoopRepeat);

        // Walk animation - more pronounced floating with forward motion
        const walkTrack = this.createFloatingAnimation(0.8, 0.4);
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
        const times = [0, 0.25, 0.5, 0.75, 1];
        const positions = [
            0, 0, 0,         // Start position
            0, height, 0,    // Up
            0, 0, 0,         // Back to center
            0, -height/2, 0, // Down (not as far)
            0, 0, 0          // Back to center
        ];

        // Add some rotation to make it more ghost-like
        const rotations = [
            0, 0, 0,
            0, 0, 0.1,
            0, 0, 0,
            0, 0, -0.1,
            0, 0, 0
        ];

        const positionKF = new THREE.KeyframeTrack(
            '.position[y]',
            times,
            positions
        );

        const rotationKF = new THREE.KeyframeTrack(
            '.rotation[z]',
            times,
            rotations
        );

        return new THREE.AnimationClip('float', speed, [positionKF, rotationKF]);
    }

    createAttackAnimation() {
        // Create a more dynamic attack animation
        const times = [0, 0.1, 0.2, 0.3, 0.4];
        const positions = [
            0, 0, 0,          // Start
            0, 0.2, -0.5,     // Forward and up
            0, 0.1, -0.8,     // More forward
            0, 0.1, -0.4,     // Back a bit
            0, 0, 0           // Return to start
        ];

        // Add some rotation for the attack
        const rotations = [
            0, 0, 0,
            0.1, 0, 0.1,  // Twist a bit
            0.2, 0, 0,    // More forward tilt
            0.1, 0, -0.1, // Different twist
            0, 0, 0       // Back to normal
        ];

        const positionKF = new THREE.KeyframeTrack(
            '.position',
            times,
            positions
        );

        const rotationKF = new THREE.KeyframeTrack(
            '.rotation',
            times,
            rotations
        );

        return new THREE.AnimationClip('attack', 0.5, [positionKF, rotationKF]);
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
        // Skip if model isn't loaded yet
        if (!this.modelLoaded) return;

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
            this.model.position.set(0, 1.2, 0); // Set to match initial position in createPlaceholderModel
        }

        // Reset cooldowns
        for (const ability in this.cooldowns) {
            this.cooldowns[ability] = 0;
        }

        // Play idle animation
        this.playAnimation('idle');
    }
}
