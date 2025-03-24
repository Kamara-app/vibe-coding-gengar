

export class Camera {
    constructor(scene) {
        this.scene = scene;

        // Create a perspective camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );

        // Set initial position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Camera settings
        this.followDistance = 10;
        this.followHeight = 5;
        this.lookAtHeight = 2;
        this.smoothFactor = 0.1;

        // Add camera to scene
        scene.add(this.camera);
    }

    update(target) {
        if (!target) return;

        // Calculate ideal camera position
        const idealPosition = new THREE.Vector3();
        idealPosition.copy(target.position);

        // Position camera behind and above the target
        const cameraOffset = new THREE.Vector3(0, this.followHeight, this.followDistance);
        idealPosition.add(cameraOffset);

        // Smoothly move camera to ideal position
        this.camera.position.lerp(idealPosition, this.smoothFactor);

        // Calculate look at position (slightly above target)
        const lookAtPosition = new THREE.Vector3();
        lookAtPosition.copy(target.position);
        lookAtPosition.y += this.lookAtHeight;

        // Make camera look at target
        this.camera.lookAt(lookAtPosition);
    }

    getWorldDirection(target) {
        return this.camera.getWorldDirection(target);
    }

    // Handle window resize
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
