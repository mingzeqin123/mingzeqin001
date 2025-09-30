# WeChat Mini Program Jump Jump Game

A 3D Jump Jump mini-game developed based on the WeChat Mini Program platform, using the Three.js rendering engine to achieve 3D effects.

## 🎮 Game Features

- **3D Visual Effects**: Uses Three.js rendering engine to present beautiful 3D scenes
- **Physics Engine**: Realistic jumping physics simulation and collision detection
- **Various Blocks**: Multiple block types including normal, small, tall, and special blocks
- **Power System**: Long press to charge power, control jumping distance and height
- **Scoring System**: Get extra points for perfect landings, challenge the highest record
- **Visual Effects**: Particle effects, animation transitions, shadow system
- **Sound Support**: Jump, landing, perfect, game over and other sound effects
- **Social Sharing**: Support sharing to WeChat friends and Moments

## 🚀 Quick Start

### Environment Requirements
- WeChat Developer Tools 1.05.0 or higher
- Mini Program Base Library 2.9.0 or higher

### Installation Steps

1. **Clone Project**
   ```bash
   git clone [project-address]
   cd jump-jump-game
   ```

2. **Import Project**
   - Open WeChat Developer Tools
   - Select "Import Project"
   - Select project directory
   - Fill in AppID (test ID can be used for testing)

3. **Add Resource Files**
   - Place the complete Three.js library file in `/pages/game/libs/three.min.js`
   - Add sound effect files to `/sounds/` directory
   - Add image resources to `/images/` directory

4. **Compile and Run**
   - Click the "Compile" button
   - Preview in simulator or real device

## 📁 Project Structure

```
jump-jump-game/
├── app.js                 # Mini program entry file
├── app.json               # Mini program configuration file
├── app.wxss              # Global style file
├── sitemap.json          # Sitemap configuration
├── project.config.json   # Project configuration file
├── pages/
│   └── game/             # Game page
│       ├── game.js       # Page logic
│       ├── game.json     # Page configuration
│       ├── game.wxml     # Page structure
│       ├── game.wxss     # Page styles
│       ├── gameEngine.js # Game engine core
│       ├── player.js     # Player character class
│       ├── block.js      # Block class
│       ├── utils.js      # Utility functions
│       └── libs/
│           └── three.min.js # Three.js library
├── images/               # Image resources
│   └── README.md        # Image description
├── sounds/               # Sound effect resources
│   └── README.md        # Sound effect description
└── README.md            # Project description
```

## 🎯 Gameplay

1. **Start Game**: Click the "Start Game" button
2. **Power Jump**: Long press the screen to charge power, the power bar is displayed on the right
3. **Release Jump**: Release finger, character jumps to the next block
4. **Get Points**:
   - Successful landing: +1 point
   - Good landing: +3 points
   - Perfect landing: +5 points (center position)
5. **Game Over**: Game ends when jump fails and falls
6. **Share Score**: Can share to WeChat friends or Moments

## 🔧 Core Technologies

### Rendering Engine
- **Three.js**: 3D scene rendering
- **WebGL**: Hardware accelerated rendering
- **Shadow System**: Real-time shadow calculation
- **Lighting System**: Ambient light + directional light

### Physics System
- **Jump Trajectory**: Parabolic motion simulation
- **Collision Detection**: Circular collision detection algorithm
- **Gravity Simulation**: Natural falling effect

### Animation System
- **Easing Functions**: Smooth animation transitions
- **Skeletal Animation**: Character action performance
- **Particle Effects**: Special effect display
- **Camera Following**: Smooth perspective switching

## 🎨 Custom Configuration

### Game Parameter Adjustment
In `gameEngine.js` you can adjust:
- `maxChargingTime`: Maximum charging time
- Jump distance and height calculation formulas
- Block generation spacing and angles

### Visual Effects
In various class files you can adjust:
- Block colors and materials
- Light intensity and position
- Animation duration and easing functions

### Sound Configuration
In the `AudioManager` class in `utils.js`:
- Add new sound effect types
- Adjust volume and playback logic

## 📱 Compatibility

- **iOS**: iOS 10.0+
- **Android**: Android 5.0+
- **WeChat Version**: 7.0.0+
- **Mini Program Base Library**: 2.9.0+

## 🔍 Performance Optimization

1. **Rendering Optimization**
   - Object pool management, reduce GC
   - Frustum culling, only render visible objects
   - LOD system, less detail at greater distances

2. **Memory Management**
   - Timely destruction of unnecessary objects
   - Texture and geometry reuse
   - Sound effect resource preloading

3. **Frame Rate Optimization**
   - Fixed timestep updates
   - Animation interpolation smoothing
   - Avoid creating objects in render loop

## 🐛 Known Issues

1. May experience lag on some low-end Android devices
2. Three.js library file is large, initial loading time is long
3. WebGL compatibility issues, some older devices do not support

## 🔄 Update Log

### v1.0.0 (2024-01-15)
- Basic game functionality implementation
- 3D rendering and physics engine
- Complete game flow
- Scoring system and social sharing

## 📄 License

This project uses the MIT license, see [LICENSE](LICENSE) file for details.

## 🤝 Contribution

Welcome to submit Issues and Pull Requests to improve this project!

## 📞 Contact

If you have questions or suggestions, please contact us through:
- GitHub Issues
- Email: [your-email@example.com]

---

⭐ If this project helps you, please give it a star!