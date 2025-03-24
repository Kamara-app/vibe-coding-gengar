
export class Combat {
    constructor(character, scene, particles) {
        this.character = character;
        this.scene = scene;
        this.particles = particles;

        this.projectiles = [];
        this.attackRange = 2; // Melee attack range
        this.projectileSpeed = 15;

        // Attack damage values
        this.damageValues = {
            shadowBall: 30,
            hypnosis: 0, // Stun effect, no damage
            dreamEater: 50,
            shadowPunch: 20
        };

        // Attack cooldowns in seconds
        this.cooldowns = {
            shadowBall: 0,
            hypnosis: 0,
            dreamEater: 0,
            shadowPunch: 0
        };

        // Maximum cooldown times
        this.maxCooldowns = {
            shadowBall: 2,
            hypnosis: 5,
            dreamEater: 8,
            shadowPunch: 1
        };
    }

    update(deltaTime) {
        // Update cooldowns
        for (const attack in this.cooldowns) {
            if (this.cooldowns[attack] > 0) {
                this.cooldowns[attack] -= deltaTime;
            }
        }

        // Update projectiles
        this.updateProjectiles(deltaTime);
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            // Move projectile
            const movement = projectile.direction.clone().multiplyScalar(this.projectileSpeed * deltaTime);
            projectile.position.add(movement);

            // Check for collisions
            // This would need access to the enemy manager to be fully implemented

            // Remove projectiles that have traveled too far
            projectile.lifetime -= deltaTime;
            if (projectile.lifetime <= 0) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }

    shadowBall() {
        if (this.cooldowns.shadowBall > 0) return false;

        // Set cooldown
        this.cooldowns.shadowBall = this.maxCooldowns.shadowBall;

        // Get character position and direction
        const position = this.character.model.position.clone();
        position.y += 1; // Adjust to come from character's center

        // Get direction from character's facing
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.character.model.quaternion);

        // Create shadow ball projectile using particle system
        if (this.particles) {
            const shadowBall = this.particles.createShadowBall(position, direction);
            shadowBall.userData.damage = this.damageValues.shadowBall;
            return true;
        }

        return false;
    }

    hypnosis() {
        if (this.cooldowns.hypnosis > 0) return false;

        // Set cooldown
        this.cooldowns.hypnosis = this.maxCooldowns.hypnosis;

        // Get character position
        const position = this.character.model.position.clone();

        // Create hypnosis effect using particle system
        if (this.particles) {
            this.particles.createHypnosisEffect(position, 5);
            return true;
        }

        return false;
    }

    dreamEater() {
        if (this.cooldowns.dreamEater > 0) return false;

        // Set cooldown
        this.cooldowns.dreamEater = this.maxCooldowns.dreamEater;

        // Get character position
        const position = this.character.model.position.clone();

        // Create dream eater effect
        if (this.particles) {
            // Create particle effect
            this.particles.createParticleSystem('dreamEater', position, 100, 2);

            // This would need access to the enemy manager to find stunned enemies
            // and deal damage to them

            // Heal character
            this.character.heal(20);

            return true;
        }

        return false;
    }

    shadowPunch() {
        if (this.cooldowns.shadowPunch > 0) return false;

        // Set cooldown
        this.cooldowns.shadowPunch = this.maxCooldowns.shadowPunch;

        // Get character position and direction
        const position = this.character.model.position.clone();

        // Get direction from character's facing
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.character.model.quaternion);

        // Calculate attack position (in front of character)
        const attackPosition = position.clone().add(
            direction.clone().multiplyScalar(this.attackRange / 2)
        );

        // Create shadow punch effect
        if (this.particles) {
            this.particles.createParticleSystem('shadowPunch', attackPosition, 30, 0.5);

            // This would need access to the enemy manager to find enemies in range
            // and deal damage to them

            return true;
        }

        return false;
    }

    getAttackDuration(attackType) {
        // Return animation duration for each attack type
        switch(attackType) {
            case 'shadowBall': return 0.5;
            case 'hypnosis': return 1.0;
            case 'dreamEater': return 1.5;
            case 'shadowPunch': return 0.3;
            default: return 0.5;
        }
    }
}
