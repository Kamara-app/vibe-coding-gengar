export class Controls {
  constructor(character) {
    this.character = character;
    this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        shadowBall: false,
        hypnosis: false,
        dreamEater: false,
        shadowPunch: false
    };

    this.direction = new THREE.Vector3(0, 0, 0);
    this.isAttacking = false;

    // Bind event handlers to maintain this context
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.setupEventListeners();
  }

  setupEventListeners() {
      // Keyboard events
      document.addEventListener('keydown', this.onKeyDown, false);
      document.addEventListener('keyup', this.onKeyUp, false);
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
          case 'KeyQ':
              if (!this.keys.shadowBall) {
                  this.keys.shadowBall = true;
                  this.performAttack('shadowBall');
              }
              break;
          case 'KeyW':
              // We need to avoid conflict with the forward movement
              // So only capture for attacks if not already moving forward
              if (!this.keys.forward) {
                  this.keys.hypnosis = true;
                  this.performAttack('hypnosis');
              }
              break;
          case 'KeyE':
              this.keys.dreamEater = true;
              this.performAttack('dreamEater');
              break;
          case 'KeyR':
              this.keys.shadowPunch = true;
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
          case 'KeyQ':
              this.keys.shadowBall = false;
              break;
          case 'KeyW':
              this.keys.hypnosis = false;
              break;
          case 'KeyE':
              this.keys.dreamEater = false;
              break;
          case 'KeyR':
              this.keys.shadowPunch = false;
              break;
      }
  }

  update(camera) {
      // Calculate movement direction
      this.direction.set(0, 0, 0);

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
          this.direction.normalize();
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
          const moveDirection = this.direction.clone();
          moveDirection.applyMatrix4(rotationMatrix);

          this.direction.x = moveDirection.x;
          this.direction.z = moveDirection.z;
      }

      // Apply movement to character
      if (this.character) {
          // Move the character based on the direction
          if (this.direction.x !== 0 || this.direction.z !== 0) {
              // Call the character's move method with the calculated direction
              this.character.move(this.direction);
          } else if (this.character.isMoving) {
              // Stop moving if no direction keys are pressed
              this.character.move(new THREE.Vector3(0, 0, 0));
          }

          // Handle jump
          if (this.keys.jump) {
              // Jump logic would go here if implemented in the character
          }
      }
  }

  performAttack(attackType) {
      if (!this.character || this.isAttacking) return;

      let attacked = false;

      // Execute attack based on type
      switch(attackType) {
          case 'shadowBall':
              attacked = this.character.shadowBall();
              break;
          case 'hypnosis':
              attacked = this.character.hypnosis();
              break;
          case 'dreamEater':
              attacked = this.character.dreamEater();
              break;
          case 'shadowPunch':
              attacked = this.character.shadowPunch();
              break;
      }

      // Only set attacking flag if the attack was successful
      if (attacked) {
          // Set attacking flag to prevent multiple attacks
          this.isAttacking = true;

          // Reset attacking state after a delay
          setTimeout(() => {
              this.isAttacking = false;
          }, this.getAttackDuration(attackType));
      }
  }

  getAttackDuration(attackType) {
      // Return appropriate duration for each attack type
      // This should match the animation duration
      switch(attackType) {
          case 'shadowBall': return 500; // milliseconds
          case 'hypnosis': return 1000;
          case 'dreamEater': return 1500;
          case 'shadowPunch': return 300;
          default: return 500;
      }
  }

  dispose() {
      // Remove event listeners when no longer needed
      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
  }
}
