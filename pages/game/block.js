// pages/game/block.js
import * as THREE from './libs/three.min.js'

class Block {
  constructor(scene, x, y, z, type = 'normal') {
    this.scene = scene
    this.position = new THREE.Vector3(x, y, z)
    this.type = type
    
    // Create block model
    this.createModel()
  }
  
  // Create block model
  createModel() {
    this.group = new THREE.Group()
    
    // Create different blocks based on type
    switch (this.type) {
      case 'start':
        this.createStartBlock()
        break
      case 'small':
        this.createSmallBlock()
        break
      case 'tall':
        this.createTallBlock()
        break
      case 'special':
        this.createSpecialBlock()
        break
      default:
        this.createNormalBlock()
    }
    
    // Set position
    this.group.position.copy(this.position)
    this.scene.add(this.group)
    
    // Add entrance animation
    this.playEntranceAnimation()
  }
  
  // Create normal block
  createNormalBlock() {
    const geometry = new THREE.CylinderGeometry(1, 1, 0.5, 8)
    const material = new THREE.MeshLambertMaterial({ 
      color: this.getRandomColor()
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.25
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
    
    // Add top decoration
    this.addTopDecoration()
  }
  
  // Create starting block
  createStartBlock() {
    const geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 8)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x4a90e2
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.3
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
    
    // Add glow effect
    this.addGlowEffect()
  }
  
  // Create small block
  createSmallBlock() {
    const geometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 6)
    const material = new THREE.MeshLambertMaterial({ 
      color: this.getRandomColor()
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.2
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
  }
  
  // Create tall block
  createTallBlock() {
    const geometry = new THREE.CylinderGeometry(0.8, 1, 1.5, 6)
    const material = new THREE.MeshLambertMaterial({ 
      color: this.getRandomColor()
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.75
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
    
    // Add top platform
    const topGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 6)
    const topMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff
    })
    
    const topMesh = new THREE.Mesh(topGeometry, topMaterial)
    topMesh.position.y = 1.55
    topMesh.castShadow = true
    topMesh.receiveShadow = true
    
    this.group.add(topMesh)
  }
  
  // Create special block
  createSpecialBlock() {
    // Main body
    const geometry = new THREE.CylinderGeometry(1, 1, 0.5, 8)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xffd700
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.25
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
    
    // Add rotating decoration
    this.addRotatingDecoration()
    
    // Special blocks have extra score
    this.bonusPoints = 5
  }
  
  // Add top decoration
  addTopDecoration() {
    const decorations = []
    const decorationCount = 3 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < decorationCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8)
      const material = new THREE.MeshLambertMaterial({ 
        color: 0xffffff
      })
      
      const decoration = new THREE.Mesh(geometry, material)
      const angle = (i / decorationCount) * Math.PI * 2
      decoration.position.set(
        Math.cos(angle) * 0.7,
        0.55,
        Math.sin(angle) * 0.7
      )
      
      this.group.add(decoration)
      decorations.push(decoration)
    }
    
    this.decorations = decorations
  }
  
  // Add glow effect
  addGlowEffect() {
    const glowGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.1, 16)
    const glowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.3
    })
    
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    this.glowMesh.position.y = 0.05
    
    this.group.add(this.glowMesh)
  }
  
  // Add rotating decoration
  addRotatingDecoration() {
    const geometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xff6b6b
    })
    
    this.rotatingDecoration = new THREE.Mesh(geometry, material)
    this.rotatingDecoration.position.y = 0.8
    this.rotatingDecoration.rotation.x = Math.PI / 2
    
    this.group.add(this.rotatingDecoration)
  }
  
  // Get random color
  getRandomColor() {
    const colors = [
      0xff6b6b, // Red
      0x4ecdc4, // Cyan
      0x45b7d1, // Blue
      0x96ceb4, // Green
      0xffeaa7, // Yellow
      0xdda0dd, // Purple
      0xffa07a, // Orange
      0x98d8c8  // Mint green
    ]
    
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  // Play entrance animation
  playEntranceAnimation() {
    // Rise from below
    this.group.position.y = this.position.y - 2
    this.group.scale.set(0.1, 0.1, 0.1)
    
    const startTime = Date.now()
    const duration = 500
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      this.group.position.y = (this.position.y - 2) + easeProgress * 2
      this.group.scale.setScalar(0.1 + easeProgress * 0.9)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        this.group.position.copy(this.position)
        this.group.scale.set(1, 1, 1)
      }
    }
    
    animate()
  }
  
  // Play landing effect
  playLandingEffect() {
    // Block slight vibration
    const originalY = this.group.position.y
    const startTime = Date.now()
    const duration = 200
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration
      
      if (progress < 1) {
        const intensity = (1 - progress) * 0.1
        this.group.position.y = originalY + Math.sin(elapsed * 0.05) * intensity
        requestAnimationFrame(animate)
      } else {
        this.group.position.y = originalY
      }
    }
    
    animate()
  }
  
  // Update animation
  update(deltaTime) {
    const time = Date.now() * 0.001
    
    // Rotating decoration animation
    if (this.rotatingDecoration) {
      this.rotatingDecoration.rotation.z += deltaTime * 2
    }
    
    // Glow effect animation
    if (this.glowMesh) {
      this.glowMesh.material.opacity = 0.2 + Math.sin(time * 2) * 0.1
      this.glowMesh.rotation.y += deltaTime
    }
    
    // Decoration animation
    if (this.decorations) {
      this.decorations.forEach((decoration, index) => {
        decoration.position.y = 0.55 + Math.sin(time * 3 + index) * 0.05
      })
    }
    
    // Special block overall rotation
    if (this.type === 'special') {
      this.group.rotation.y += deltaTime * 0.5
    }
  }
  
  // Get block height (for collision detection)
  getHeight() {
    switch (this.type) {
      case 'start':
        return 0.6
      case 'small':
        return 0.4
      case 'tall':
        return 1.5
      default:
        return 0.5
    }
  }
  
  // Get block radius (for collision detection)
  getRadius() {
    switch (this.type) {
      case 'start':
        return 1.2
      case 'small':
        return 0.6
      case 'tall':
        return 0.8
      default:
        return 1.0
    }
  }
  
  // Destroy block
  destroy() {
    if (this.group && this.scene) {
      this.scene.remove(this.group)
    }
  }
}

export default Block