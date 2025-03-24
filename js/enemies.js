import * as THREE from 'three';

export class EnemyManager {
    constructor(scene, player, loadingManager) {
        this.scene = scene;
        this.player = player;
        this.loadingManager = loadingManager;
        this.enemies = [];
        this.maxEnemies = 5;
        this.spawnRadius = 20;
        this.spawnTimer = 0;
        this.spawnInterval = 5; // seconds
        
        // Basic enemy geometry and material
        this.enemyGeometry = new THREE.SphereGeometry(1, 16, 16);
        this.enemyMaterial = new THREE.MeshStandardMaterial({
            color: 0xff00ff,
            emissive: 0x440044,
            roughness: 0.5,
            metalness: 0.2
        });
    }
    
    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;
        
        // Create enemy mesh
        const enemy = new THREE.Mesh(this.enemyGeometry, this.enemyMaterial);
        
        // Random position around player
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * this.spawnRadius;
        const z = Math.sin(angle) * this.spawnRadius;
        
        enemy.position.set(x, 1, z);
        enemy.castShadow = true;
        enemy.receiveShadow = true;
        
        // Add enemy properties
        enemy.userData = {
            health: 100,
            speed: 0.5 + Math.random() * 1.5,
            damage: 10,
            isStunned: false,
            stunTime: 0
        };
        
        this.scene.add(enemy);
        this.enemies.push(enemy);
    }
    
    update(deltaTime, player) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
        
        // Update each enemy
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Skip if stunned
            if (enemy.userData.isStunned) {
                enemy.userData.stunTime -= deltaTime;
                if (enemy.userData.stunTime <= 0) {
                    enemy.userData.isStunned = false;
                }
                continue;
            }
            
            // Move towards player
            if (player && player.model) {
                const direction = new THREE.Vector3();
                direction.subVectors(player.model.position, enemy.position);
                direction.y = 0; // Keep on ground
                direction.normalize();
                
                // Move enemy
                enemy.position.add(
                    direction.multiplyScalar(enemy.userData.speed * deltaTime)
                );
                
                // Rotate to face player
                enemy.lookAt(player.model.position);
                
                // Check if close enough to attack
                if (direction.length() < 2) {
                    this.attackPlayer(enemy, player, deltaTime);
                }
            }
            
            // Remove dead enemies
            if (enemy.userData.health <= 0) {
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
            }
        }
    }
    
    attackPlayer(enemy, player, deltaTime) {
        // Simple attack with cooldown
        if (!enemy.userData.attackCooldown || enemy.userData.attackCooldown <= 0) {
            player.takeDamage(enemy.userData.damage);
            enemy.userData.attackCooldown = 1; // 1 second cooldown
        } else {
            enemy.userData.attackCooldown -= deltaTime;
        }
    }
    
    damageEnemy(enemy, damage) {
        if (!enemy || !enemy.userData) return;
        
        enemy.userData.health -= damage;
        
        // Visual feedback
        enemy.material.emissive.setRGB(1, 0, 0);
        setTimeout(() => {
            if (enemy && enemy.material) {
                enemy.material.emissive.setRGB(0.27, 0, 0.27);
            }
        }, 200);
    }
    
    stunEnemy(enemy, duration) {
        if (!enemy || !enemy.userData) return;
        
        enemy.userData.isStunned = true;
        enemy.userData.stunTime = duration;
        
        // Visual feedback
        enemy.material.color.setRGB(0.5, 0, 0.5);
        setTimeout(() => {
            if (enemy && enemy.material) {
                enemy.material.color.setRGB(1, 0, 1);
            }
        }, duration * 1000);
    }
    
    getEnemiesInRadius(position, radius) {
        return this.enemies.filter(enemy => {
            const distance = enemy.position.distanceTo(position);
            return distance <= radius;
        });
    }
    
    reset() {
        // Remove all enemies
        for (const enemy of this.enemies) {
            this.scene.remove(enemy);
        }
        this.enemies = [];
        this.spawnTimer = 0;
    }
}