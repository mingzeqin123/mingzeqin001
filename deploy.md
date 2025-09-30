# Deployment Guide

This document explains how to deploy the Jump Jump game to the WeChat Mini Program platform.

## 📋 Pre-deployment Preparation

### 1. WeChat Mini Program Account
- Register a WeChat Mini Program account: https://mp.weixin.qq.com/
- Obtain AppID (Mini Program ID)
- Configure server domain names (if needed)

### 2. Development Tools
- Download WeChat Developer Tools: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- Install and log in to the developer tools

### 3. Required Resource Files

#### Three.js Library File
1. Visit https://threejs.org/
2. Download the latest version of Three.js
3. Copy the `three.min.js` file to the `/pages/game/libs/` directory
4. Replace the existing mock file

#### Sound Effect Files (Optional)
Add the following sound effect files to the `/sounds/` directory:
- `jump.mp3` - Jump sound effect
- `land.mp3` - Landing sound effect
- `perfect.mp3` - Perfect landing sound effect
- `gameover.mp3` - Game over sound effect
- `score.mp3` - Score sound effect

#### Image Resources (Optional)
Add the following image files to the `/images/` directory:
- `share.png` - Share image (500x400px)
- `icon.png` - Game icon (144x144px)

## 🚀 Deployment Steps

### Step 1: Project Configuration
1. Open `project.config.json`
2. Modify the `appid` field to your Mini Program AppID:
   ```json
   {
     "appid": "your-mini-program-appid",
     "projectname": "jump-jump-game"
   }
   ```

### Step 2: Import Project
1. Open WeChat Developer Tools
2. Click "Import Project"
3. Select the project root directory
4. Enter project name and AppID
5. Click "Import"

### Step 3: Local Debugging
1. Click "Compile" in the developer tools
2. Test game functionality in the simulator
3. Check console for error messages
4. Debug game logic and performance

### Step 4: Real Device Preview
1. Click the "Preview" button
2. Use WeChat to scan the QR code
3. Test game performance on real device
4. Check compatibility issues

### Step 5: Upload Code
1. Ensure all functions work properly
2. Click the "Upload" button
3. Fill in version number and project notes
4. Click "Upload"

### Step 6: Submit for Review
1. Log in to WeChat Official Accounts Platform: https://mp.weixin.qq.com/
2. Go to "Development Management" -> "Development Version"
3. Find the uploaded version and click "Submit for Review"
4. Fill in review information:
   - Function page: pages/game/game
   - Function description: Jump Jump mini-game
   - Test account: Provide test account (if needed)

### Step 7: Release Online
1. Wait for review approval (usually 1-7 business days)
2. After review approval, click "Release" in "Online Version"
3. Game officially goes live

## ⚙️ Configuration Instructions

### Mini Program Configuration (app.json)
```json
{
  "pages": [
    "pages/game/game"
  ],
  "window": {
    "navigationBarTitleText": "Jump Jump",
    "backgroundColor": "#87CEEB"
  }
}
```

### Page Configuration (game.json)
```json
{
  "navigationBarTitleText": "Jump Jump",
  "navigationStyle": "custom",
  "disableScroll": true
}
```

### Project Configuration (project.config.json)
```json
{
  "appid": "your-appid",
  "projectname": "jump-jump-game",
  "libVersion": "2.19.4",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "minified": true
  }
}
```

## 🔍 Common Issues

### Q1: Three.js library file too large
**Solution:**
- Use compressed version of Three.js
- Import only needed modules
- Consider using CDN loading

### Q2: Poor game performance
**Solution:**
- Reduce model complexity
- Decrease particle count
- Optimize render loop
- Use object pools

### Q3: Sound effects not playing
**Solution:**
- Check sound file format (recommend MP3)
- Ensure reasonable file size (<500KB)
- Use wx.createInnerAudioContext()

### Q4: White screen on real device
**Solution:**
- Check WebGL compatibility
- View console error messages
- Reduce render quality
- Add error handling

### Q5: Share function abnormal
**Solution:**
- Check share image path
- Ensure correct image dimensions
- Test share callback functions

## 📊 Performance Monitoring

### Performance Metrics
- **FPS**: Target 60fps, minimum 30fps
- **Memory Usage**: <100MB
- **Package Size**: <2MB
- **Startup Time**: <3 seconds

### Monitoring Code
```javascript
// Add performance monitoring in game.js
const performanceMonitor = new PerformanceMonitor()

// Update in render loop
performanceMonitor.update()

// Output performance data periodically
setInterval(() => {
  console.log('FPS:', performanceMonitor.getFPS())
  console.log('Memory:', wx.getMemoryInfo?.())
}, 5000)
```

## 🔒 Security Considerations

1. **Code Obfuscation**: Obfuscate critical code before going live
2. **Resource Protection**: Encrypt important resource files
3. **Data Validation**: Validate user inputs
4. **Anti-cheating**: Add basic anti-cheating mechanisms

## 📈 Operation Suggestions

1. **Data Analytics**: Integrate Mini Program Data Assistant
2. **User Feedback**: Add feedback entry
3. **Version Iteration**: Regularly update game content
4. **Social Sharing**: Optimize sharing functionality

## 🆘 Technical Support

If you encounter deployment issues, you can get help through:

1. **Official Documentation**: https://developers.weixin.qq.com/miniprogram/dev/
2. **Developer Community**: https://developers.weixin.qq.com/community/
3. **GitHub Issues**: Submit issues in the project repository
4. **Technical Groups**: Join relevant technical exchange groups

---

Following this guide, you should be able to successfully deploy the Jump Jump game to the WeChat Mini Program platform. Good luck with your deployment! 🎉