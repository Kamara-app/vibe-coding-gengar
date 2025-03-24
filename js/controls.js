export class Controls {
  constructor(character) {
      this.character = character;
      this.keys = {
          forward: false,
          backward: false,
          left: false,
          right: false,
          jump: false,
          attack1: false,
          attack2: false
      };

      this.direction = { x: 0, z: 0 };
      this.speed = 0.1;
      this.isAttacking = false;

      this.setupEventListeners();
  }

  setupEventListeners() {
      // Keyboard events
      document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
      document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
  }

  onKeyDown(event) {
      switch(event.code) {
          case 'KeyW':
          case 'ArrowUp':
              this.keys.forward = true;
              break;
          case 'KeyS':
          case 'ArrowDown':
              this.keys.backward = true;
              break;
          case 'KeyA':
          case 'ArrowLeft':
              this.keys.left = true;
              break;
          case 'KeyD':
          case 'ArrowRight':
              this.keys.right = true;
              break;
          case 'Space':
              this.keys.jump = true;
              break;
          case 'KeyE':
              this.keys.attack1 = true;
              this.performAttack('shadowBall');
              break;
          case 'KeyQ':
              this.keys.attack2 = true;
              this.performAttack('hypnosis');
              break;
          case 'KeyR':
              this.keys.attack3 = true;
              this.performAttack('dreamEater');
              break;
          case 'KeyF':
              this.keys.attack4 = true;
              this.performAttack('shadowPunch');
              break;
      }
  }

  onKeyUp(event) {
      switch(event.code) {
          case 'KeyW':
          case 'ArrowUp':
              this.keys.forward = false;
              break;
          case 'KeyS':
          case 'ArrowDown':
              this.keys.backward = false;
              break;
          case 'KeyA':
          case 'ArrowLeft':
              this.keys.left = false;
              break;
          case 'KeyD':
          case 'ArrowRight':
              this.keys.right = false;
              break;
          case 'Space':
              this.keys.jump = false;
              break;
          case 'KeyE':
              this.keys.attack1 = false;
              break;
          case 'KeyQ':
              this.keys.attack2 = false;
              break;
          case 'KeyR':
              this.keys.attack3 = false;
              break;
          case 'KeyF':
              this.keys.attack4 = false;
              break;
      }
  }

  update(camera) {
      // Reset direction
      this.direction.x = 0;
      this.direction.z = 0;

      // Calculate direction vector based on camera orientation
      if (this.keys.forward) {
          this.direction.z = -1;
      }
      if (this.keys.backward) {
          this.direction.z = 1;
      }
      if (this.keys.left) {
          this.direction.x = -1;
      }
      if (this.keys.right) {
          this.direction.x = 1;
      }

      // Normalize direction vector if moving diagonally
      if (this.direction.x !== 0 && this.direction.z !== 0) {
          const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.z * this.direction.z);
          this.direction.x /= length;
          this.direction.z /= length;
      }

      // Apply camera rotation to movement direction
      if (camera && (this.direction.x !== 0 || this.direction.z !== 0)) {
          const cameraDirection = new THREE.Vector3();
          camera.getWorldDirection(cameraDirection);
          cameraDirection.y = 0;
          cameraDirection.normalize();

          // Create rotation matrix based on camera direction
          const rotationMatrix = new THREE.Matrix4();
          rotationMatrix.lookAt(
              new THREE.Vector3(0, 0, 0),
              cameraDirection,
              new THREE.Vector3(0, 1, 0)
          );

          // Apply rotation to direction vector
          const moveDirection = new THREE.Vector3(this.direction.x, 0, this.direction.z);
          moveDirection.applyMatrix4(rotationMatrix);

          this.direction.x = moveDirection.x;
          this.direction.z = moveDirection.z;

          // Make character face movement direction
          if (this.character && this.character.mesh) {
              const angle = Math.atan2(this.direction.x, this.direction.z);
              this.character.mesh.rotation.y = angle;
          }
      }

      // Apply movement to character
      if (this.character && this.character.mesh) {
          if (this.direction.x !== 0 || this.direction.z !== 0) {
              // Move character
              this.character.mesh.position.x += this.direction.x * this.speed;
              this.character.mesh.position.z += this.direction.z * this.speed;

              // Play walking animation if available
              if (this.character.animations && this.character.animations.walk && !this.isAttacking) {
                  this.character.playAnimation('walk');
              }
          } else if (this.character.animations && this.character.animations.idle && !this.isAttacking) {
              // Play idle animation when not moving
              this.character.playAnimation('idle');
          }

          // Handle jump
          if (this.keys.jump && this.character.canJump) {
              this.character.jump();
              if (this.character.animations && this.character.animations.jump) {
                  this.character.playAnimation('jump');
              }
          }
      }
  }

  performAttack(attackType) {
      if (!this.character || this.isAttacking) return;

      this.isAttacking = true;

      // Play appropriate attack animation
      if (this.character.animations && this.character.animations[attackType]) {
          this.character.playAnimation(attackType);
      }

      // Execute attack logic
      switch(attackType) {
          case 'shadowBall':
              this.character.castShadowBall();
              break;
          case 'hypnosis':
              this.character.castHypnosis();
              break;
          case 'dreamEater':
              this.character.castDreamEater();
              break;
          case 'shadowPunch':
              this.character.castShadowPunch();
              break;
      }

      // Reset attacking state after animation completes
      setTimeout(() => {
          this.isAttacking = false;
      }, this.character.getAttackDuration(attackType));
  }

  dispose() {
      // Remove event listeners when no longer needed
      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
  }
}
