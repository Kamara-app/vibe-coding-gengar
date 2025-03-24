export class LoadingManager {
    constructor() {
        this.resources = {};
        this.totalResources = 0;
        this.loadedResources = 0;
        this.isLoading = true;
        
        // Get loading screen elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.querySelector('.progress');
        
        // Show loading screen
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
    }
    
    startLoading(resourceName) {
        if (!this.resources[resourceName]) {
            this.resources[resourceName] = {
                loaded: false,
                progress: 0
            };
            this.totalResources++;
        }
    }
    
    updateProgress(resourceName, percent) {
        if (this.resources[resourceName]) {
            this.resources[resourceName].progress = percent;
            this.updateTotalProgress();
        }
    }
    
    completeLoading(resourceName) {
        if (this.resources[resourceName]) {
            this.resources[resourceName].loaded = true;
            this.resources[resourceName].progress = 100;
            this.loadedResources++;
            this.updateTotalProgress();
            
            // Check if all resources are loaded
            if (this.loadedResources >= this.totalResources) {
                this.finishLoading();
            }
        }
    }
    
    errorLoading(resourceName, error) {
        console.error(`Error loading ${resourceName}:`, error);
        
        // Mark as loaded anyway to prevent hanging
        this.completeLoading(resourceName);
    }
    
    updateTotalProgress() {
        // Calculate total progress percentage
        let totalProgress = 0;
        
        for (const resource in this.resources) {
            totalProgress += this.resources[resource].progress;
        }
        
        const overallProgress = this.totalResources > 0 
            ? totalProgress / (this.totalResources * 100) * 100 
            : 100;
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${overallProgress}%`;
        }
    }
    
    finishLoading() {
        this.isLoading = false;
        
        // Hide loading screen with a fade out
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = 0;
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500); // Match this with CSS transition time
        }
    }
    
    update() {
        // This method can be called in the animation loop
        // to continuously check loading status
        if (!this.isLoading) return;
        
        // Could add additional loading logic here if needed
    }
}