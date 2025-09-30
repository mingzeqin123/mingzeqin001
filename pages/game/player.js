// pages/game/player.js
import * as THREE from './libs/three.min.js'
import { lerp, easeOutQuart, easeInQuart } from './utils.js'

class Player {
  constructor(scene) {
    this.scene = scene
    this.position = new THREE.Vector3(0, 1, 0)
    
    // Animation state
    this.isJumping = false
    this.isCharging = false
    this.jumpStartTime = 0
    this.jumpDuration = 0
    this.jumpStartPos = new THREE.Vector3()
    this.jumpEndPos = new THREE.Vector3()
    this.jumpHeight = 0
    
    // Create player model
    this.createModel()
  }
  
  // Create player model
  createModel() {
    // Create player group
    this.group = new THREE.Group()
    
    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8)
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 })
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    this.body.position.y = 0.4
    this.body.castShadow = true
    this.group.add(this.body)
    
    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16)
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffc107 })
    this.head = new THREE.Mesh(headGeometry, headMaterial)
    this.head.position.y = 1.05
    this.head.castShadow = true
    this.group.add(this.head)
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8)
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
    
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    this.leftEye.position.set(-0.1, 1.1, 0.2)
    this.group.add(this.leftEye)
    
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    this.rightEye.position.set(0.1, 1.1, 0.2)
    this.group.add(this.rightEye)
    
    // Mouth
    const mouthGeometry = new THREE.SphereGeometry(0.03, 8, 8)
    const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
    this.mouth = new THREE.Mesh(mouthGeometry, mouthMaterial)
    this.mouth.position.set(0, 0.95, 0.22)
    this.group.add(this.mouth)
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6)
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 })
    
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial)
    this.leftArm.position.set(-0.45, 0.5, 0)
    this.leftArm.rotation.z = Math.PI / 6
    this.leftArm.castShadow = true
    this.group.add(this.leftArm)
    
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial)
    this.rightArm.position.set(0.45, 0.5, 0)
    this.rightArm.rotation.z = -Math.PI / 6
    this.rightArm.castShadow = true
    this.group.add(this.rightArm)
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6)
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 })
    
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    this.leftLeg.position.set(-0.15, -0.2, 0)
    this.leftLeg.castShadow = true
    this.group.add(this.leftLeg)
    
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    this.rightLeg.position.set(0.15, -0.2, 0)
    this.rightLeg.castShadow = true
    this.group.add(this.rightLeg)
    
    // Set initial position
    this.group.position.copy(this.position)
    this.scene.add(this.group)
    
    // Save original scale and position
    this.originalScale = this.group.scale.clone()
    this.originalBodyScale = this.body.scale.clone()
  }
  
  // Set position
  setPosition(x, y, z) {
    this.position.set(x, y, z)
    this.group.position.copy(this.position)
  }
  
  // Start charging animation
  startCharging() {
    this.isCharging = true
    this.chargingStartTime = Date.now()
  }
  
  // Jump
  jump(distance, height, onComplete) {
    if (this.isJumping) return
    
    this.isJumping = true
    this.isCharging = false
    this.jumpStartTime = Date.now()
    this.jumpDuration = 800 // Jump duration
    this.jumpHeight = height
    this.onJumpComplete = onComplete
    
    // Calculate jump start and end points
    this.jumpStartPos.copy(this.position)
    
    // Calculate jump direction (towards nearest block)
    const angle = Math.random() * Math.PI * 2 // Random direction, should actually calculate based on nearest block
    this.jumpEndPos.set(
      this.position.x + Math.sin(angle) * distance,
      this.position.y,
      this.position.z + Math.cos(angle) * distance
    )
    
    // Play jump sound effect (if available)
    this.playJumpSound()
  }
  
  // Fall
  fall(onComplete) {
    this.isFalling = true
    this.fallStartTime = Date.now()
    this.fallDuration = 2000
    this.fallStartPos = this.position.clone()
    this.onFallComplete = onComplete
  }
  
  // Show perfect landing effect
  showPerfectEffect() {
    // Create particle effect
    this.createParticleEffect()
    
    // Play special sound effect
    this.playPerfectSound()
  }
  
  // Create particle effect
  createParticleEffect() {
    const particleCount = 20
    const particles = new THREE.Group()
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4, 4)
      const material = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
      })
      const particle = new THREE.Mesh(geometry, material)
      
      // Random position
      const angle = (i / particleCount) * Math.PI * 2
      particle.position.set(
        this.position.x + Math.cos(angle) * 0.5,
        this.position.y + 0.5,
        this.position.z + Math.sin(angle) * 0.5
      )
      
      particles.add(particle)
    }
    
    this.scene.add(particles)
    
    // Animate particles
    const startTime = Date.now()
    const animateParticles = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / 1000
      
      if (progress < 1) {
        particles.children.forEach((particle, index) => {
          const angle = (index / particleCount) * Math.PI * 2
          particle.position.x = this.position.x + Math.cos(angle) * progress * 2
          particle.position.y = this.position.y + 0.5 + progress * 2
          particle.position.z = this.position.z + Math.sin(angle) * progress * 2
          particle.material.opacity = 1 - progress
        })
        requestAnimationFrame(animateParticles)
      } else {
        this.scene.remove(particles)
      }
    }
    
    animateParticles()
  }
  
  // Update animation
  update(deltaTime) {
    const currentTime = Date.now()
    
    // Charging animation
    if (this.isCharging) {
      const chargingTime = currentTime - this.chargingStartTime
      const intensity = Math.sin(chargingTime * 0.01) * 0.1 + 1
      
      // Body compression effect
      this.body.scale.y = this.originalBodyScale.y * (1 - intensity * 0.2)
      this.body.scale.x = this.originalBodyScale.x * (1 + intensity * 0.1)
      this.body.scale.z = this.originalBodyScale.z * (1 + intensity * 0.1)
      
      // Overall vibration
      this.group.position.y = this.position.y + Math.sin(chargingTime * 0.02) * 0.02
    }
    
    // Jump animation
    if (this.isJumping) {
      const elapsed = currentTime - this.jumpStartTime
      const progress = Math.min(elapsed / this.jumpDuration, 1)
      
      if (progress < 1) {
        // Horizontal movement (linear)
        this.position.x = lerp(this.jumpStartPos.x, this.jumpEndPos.x, progress)
        this.position.z = lerp(this.jumpStartPos.z, this.jumpEndPos.z, progress)
        
        // Vertical movement (parabolic)
        const jumpProgress = progress * 2
        let heightMultiplier
        if (jumpProgress <= 1) {
          heightMultiplier = easeOutQuart(jumpProgress)
        } else {
          heightMultiplier = 1 - easeInQuart(jumpProgress - 1)
        }
        
        this.position.y = this.jumpStartPos.y + this.jumpHeight * heightMultiplier
        
        // Rotation animation
        this.group.rotation.x = progress * Math.PI * 2
        
        // Restore body shape
        this.body.scale.copy(this.originalBodyScale)
        
        this.group.position.copy(this.position)
      } else {
        // Jump end
        this.isJumping = false
        this.group.rotation.x = 0
        this.position.copy(this.jumpEndPos)
        this.group.position.copy(this.position)
        
        if (this.onJumpComplete) {
          this.onJumpComplete()
        }
      }
    }
    
    // Fall animation
    if (this.isFalling) {
      const elapsed = currentTime - this.fallStartTime
      const progress = Math.min(elapsed / this.fallDuration, 1)
      
      if (progress < 1) {
        // Accelerated fall
        this.position.y = this.fallStartPos.y - easeInQuart(progress) * 10
        
        // Rotating fall
        this.group.rotation.x = progress * Math.PI * 4
        this.group.rotation.z = progress * Math.PI * 2
        
        this.group.position.copy(this.position)
      } else {
        this.isFalling = false
        if (this.onFallComplete) {
          this.onFallComplete()
        }
      }
    }
    
    // Idle micro animation
    if (!this.isJumping && !this.isCharging && !this.isFalling) {
      const time = currentTime * 0.002
      this.group.position.y = this.position.y + Math.sin(time) * 0.02
      
      // Eye blinking
      if (Math.random() < 0.01) {
        this.blink()
      }
    }
  }
  
  // Blink animation
  blink() {
    const originalScale = this.leftEye.scale.y
    this.leftEye.scale.y = 0.1
    this.rightEye.scale.y = 0.1
    
    setTimeout(() => {
      this.leftEye.scale.y = originalScale
      this.rightEye.scale.y = originalScale
    }, 100)
  }
  
  // Play jump sound effect
  playJumpSound() {
    // Can add sound effect playback logic here
    // wx.createInnerAudioContext() etc
  }
  
  // Play perfect landing sound effect
  playPerfectSound() {
    // Can add special sound effect playback logic here
  }
  
  // Reset player state
  reset() {
    this.position.set(0, 1, 0)
    this.group.position.copy(this.position)
    this.group.rotation.set(0, 0, 0)
    this.group.scale.copy(this.originalScale)
    this.body.scale.copy(this.originalBodyScale)
    
    this.isJumping = false
    this.isCharging = false
    this.isFalling = false
  }
  
  // Destroy player
  destroy() {
    if (this.group && this.scene) {
      this.scene.remove(this.group)
    }
  }
}

export default Player