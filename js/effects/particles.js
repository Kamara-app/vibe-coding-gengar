
export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = [];

        // Create basic particle materials
        this.materials = {
            shadowBall: new THREE.PointsMaterial({
                color: 0x8a2be2,
                size: 0.2,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.8
            }),
            hypnosis: new THREE.PointsMaterial({
                color: 0xff00ff,
                size: 0.15,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.7
            }),
            dreamEater: new THREE.PointsMaterial({
                color: 0xff0000,
                size: 0.1,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.9
            }),
            shadowPunch: new THREE.PointsMaterial({
                color: 0x000000,
                size: 0.25,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.6
            })
        };
    }

    createParticleSystem(type, position, count = 50, duration = 2) {
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        // Initialize particles in a sphere
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Random position in sphere
            const radius = Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = position.z + radius * Math.cos(phi);

            // Random velocity
            velocities[i3] = (Math.random() - 0.5) * 2;
            velocities[i3 + 1] = (Math.random() - 0.5) * 2;
            velocities[i3 + 2] = (Math.random() - 0.5) * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create particle system
        const material = this.materials[type] || this.materials.shadowBall;
        const particleSystem = new THREE.Points(geometry, material.clone());

        // Add metadata
        particleSystem.userData = {
            velocities: velocities,
            lifetime: duration,
            age: 0,
            type: type
        };

        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);

        return particleSystem;
    }

    createShadowBall(position, direction) {
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8a2be2,
            emissive: 0x4a0082,
            transparent: true,
            opacity: 0.8
        });

        const shadowBall = new THREE.Mesh(geometry, material);
        shadowBall.position.copy(position);

        // Add trail particles
        this.createParticleSystem('shadowBall', position, 30, 1);

        // Add metadata
        shadowBall.userData = {
            direction: direction.normalize(),
            speed: 15,
            damage: 30,
            lifetime: 3,
            age: 0,
            type: 'projectile'
        };

        this.scene.add(shadowBall);
        this.particleSystems.push(shadowBall);

        return shadowBall;
    }

    createHypnosisEffect(position, radius = 5) {
        const ringGeometry = new THREE.RingGeometry(radius - 0.2, radius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2; // Lay flat

        // Add particles
        this.createParticleSystem('hypnosis', position, 100, 3);

        // Add metadata
        ring.userData = {
            radius: radius,
            lifetime: 3,
            age: 0,
            type: 'area',
            effect: 'stun'
        };

        this.scene.add(ring);
        this.particleSystems.push(ring);

        return ring;
    }

    update(deltaTime) {
        // Update all particle systems
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const system = this.particleSystems[i];

            // Update age
            system.userData.age += deltaTime;

            // Remove expired systems
            if (system.userData.age >= system.userData.lifetime) {
                this.scene.remove(system);
                this.particleSystems.splice(i, 1);
                continue;
            }

            // Update based on type
            if (system instanceof THREE.Points) {
                this.updateParticles(system, deltaTime);
            } else if (system.userData.type === 'projectile') {
                this.updateProjectile(system, deltaTime);
            } else if (system.userData.type === 'area') {
                this.updateAreaEffect(system, deltaTime);
            }
        }
    }

    updateParticles(system, deltaTime) {
        const positions = system.geometry.attributes.position.array;
        const velocities = system.userData.velocities;

        // Update each particle position
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;

            // Add gravity
            velocities[i + 1] -= 0.1 * deltaTime;
        }

        system.geometry.attributes.position.needsUpdate = true;

        // Fade out based on age
        const progress = system.userData.age / system.userData.lifetime;
        system.material.opacity = 1 - progress;
    }

    updateProjectile(projectile, deltaTime) {
        // Move in direction
        const movement = projectile.userData.direction.clone()
            .multiplyScalar(projectile.userData.speed * deltaTime);
        projectile.position.add(movement);

        // Create trail particles
        if (Math.random() < 0.3) {
            this.createParticleSystem(
                projectile.userData.type === 'shadowBall' ? 'shadowBall' : 'shadowPunch',
                projectile.position,
                5,
                0.5
            );
        }

        // Fade out based on age
        const progress = projectile.userData.age / projectile.userData.lifetime;
        if (projectile.material) {
            projectile.material.opacity = 1 - progress;
        }
    }

    updateAreaEffect(effect, deltaTime) {
        // Pulse effect
        const progress = effect.userData.age / effect.userData.lifetime;
        const pulse = 1 + 0.2 * Math.sin(progress * Math.PI * 10);

        effect.scale.set(pulse, pulse, pulse);

        // Fade out based on age
        if (effect.material) {
            effect.material.opacity = 0.5 * (1 - progress);
        }
    }

    clear() {
        // Remove all particle systems
        for (const system of this.particleSystems) {
            this.scene.remove(system);
        }
        this.particleSystems = [];
    }
}
