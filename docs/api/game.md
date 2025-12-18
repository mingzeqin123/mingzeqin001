## Classes

<dl>
<dt><a href="#Block">Block</a></dt>
<dd><p>游戏方块类。
负责：创建不同类型方块模型、入场动画、装饰动画、碰撞半径/高度提供。</p>
</dd>
<dt><a href="#GameEngine">GameEngine</a></dt>
<dd><p>游戏引擎（小游戏逻辑层 + 渲染层的封装）。</p>
</dd>
<dt><a href="#Player">Player</a></dt>
<dd><p>玩家角色类。
负责：创建玩家模型、维护位置、执行蓄力/跳跃/坠落动画与特效。</p>
</dd>
<dt><a href="#PerformanceMonitor">PerformanceMonitor</a></dt>
<dd><p>性能监控工具（FPS/帧耗时）。</p>
</dd>
<dt><a href="#AudioManager">AudioManager</a></dt>
<dd><p>音效管理工具（基于 wx.createInnerAudioContext）。</p>
</dd>
<dt><a href="#GestureRecognizer">GestureRecognizer</a></dt>
<dd><p>触摸手势识别（tap/longPress/swipe）。</p>
</dd>
</dl>

## Objects

<dl>
<dt><a href="#ColorUtils">ColorUtils</a> : <code>object</code></dt>
<dd><p>颜色相关工具集。</p>
</dd>
<dt><a href="#StorageUtils">StorageUtils</a> : <code>object</code></dt>
<dd><p>小程序本地存储工具（JSON 序列化封装）。</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#lerp">lerp(start, end, factor)</a> ⇒ <code>number</code></dt>
<dd><p>线性插值。</p>
</dd>
<dt><a href="#easeOutQuart">easeOutQuart(t)</a> ⇒ <code>number</code></dt>
<dd><p>缓动函数：四次方缓出（easeOutQuart）。</p>
</dd>
<dt><a href="#easeInQuart">easeInQuart(t)</a> ⇒ <code>number</code></dt>
<dd><p>缓动函数：四次方缓入（easeInQuart）。</p>
</dd>
<dt><a href="#easeInOutCubic">easeInOutCubic(t)</a> ⇒ <code>number</code></dt>
<dd><p>缓动函数：三次方缓入缓出（easeInOutCubic）。</p>
</dd>
<dt><a href="#easeOutElastic">easeOutElastic(t)</a> ⇒ <code>number</code></dt>
<dd><p>缓动函数：弹性缓出（easeOutElastic）。</p>
</dd>
<dt><a href="#easeOutBounce">easeOutBounce(t)</a> ⇒ <code>number</code></dt>
<dd><p>缓动函数：反弹缓出（easeOutBounce）。</p>
</dd>
<dt><a href="#degToRad">degToRad(degrees)</a> ⇒ <code>number</code></dt>
<dd><p>角度转弧度。</p>
</dd>
<dt><a href="#radToDeg">radToDeg(radians)</a> ⇒ <code>number</code></dt>
<dd><p>弧度转角度。</p>
</dd>
<dt><a href="#clamp">clamp(value, min, max)</a> ⇒ <code>number</code></dt>
<dd><p>限制数值范围到 [min, max]。</p>
</dd>
<dt><a href="#random">random(min, max)</a> ⇒ <code>number</code></dt>
<dd><p>生成 [min, max) 的随机浮点数。</p>
</dd>
<dt><a href="#randomInt">randomInt(min, max)</a> ⇒ <code>number</code></dt>
<dd><p>生成 [min, max] 的随机整数。</p>
</dd>
<dt><a href="#distance">distance(x1, y1, x2, y2)</a> ⇒ <code>number</code></dt>
<dd><p>二维两点距离。</p>
</dd>
<dt><a href="#distance3D">distance3D(x1, y1, z1, x2, y2, z2)</a> ⇒ <code>number</code></dt>
<dd><p>三维两点距离。</p>
</dd>
<dt><a href="#normalize">normalize(x, y)</a> ⇒ <code>Object</code></dt>
<dd><p>二维向量归一化。</p>
</dd>
<dt><a href="#dotProduct">dotProduct(x1, y1, x2, y2)</a> ⇒ <code>number</code></dt>
<dd><p>二维向量点积。</p>
</dd>
<dt><a href="#crossProduct">crossProduct(x1, y1, x2, y2)</a> ⇒ <code>number</code></dt>
<dd><p>二维向量叉积（标量结果）。</p>
</dd>
<dt><a href="#smoothstep">smoothstep(edge0, edge1, x)</a> ⇒ <code>number</code></dt>
<dd><p>平滑步长函数 smoothstep。</p>
</dd>
<dt><a href="#noise">noise(x, y)</a> ⇒ <code>number</code></dt>
<dd><p>简单噪声函数（基于 sin 的伪随机）。</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#BlockType">BlockType</a> : <code>&#x27;start&#x27;</code> | <code>&#x27;normal&#x27;</code> | <code>&#x27;small&#x27;</code> | <code>&#x27;tall&#x27;</code> | <code>&#x27;special&#x27;</code></dt>
<dd><p>方块类型</p>
</dd>
<dt><a href="#ScoreChangeCallback">ScoreChangeCallback</a> : <code>function</code></dt>
<dd><p>分数变化回调</p>
</dd>
<dt><a href="#GameOverCallback">GameOverCallback</a> : <code>function</code></dt>
<dd><p>游戏结束回调</p>
</dd>
<dt><a href="#PowerChangeCallback">PowerChangeCallback</a> : <code>function</code></dt>
<dd><p>蓄力值变化回调</p>
</dd>
<dt><a href="#GameState">GameState</a> : <code>&#x27;waiting&#x27;</code> | <code>&#x27;charging&#x27;</code> | <code>&#x27;jumping&#x27;</code> | <code>&#x27;falling&#x27;</code></dt>
<dd><p>游戏状态</p>
</dd>
<dt><a href="#AnimationCompleteCallback">AnimationCompleteCallback</a> : <code>function</code></dt>
<dd><p>动画完成回调</p>
</dd>
</dl>

<a name="Block"></a>

## Block
游戏方块类。
负责：创建不同类型方块模型、入场动画、装饰动画、碰撞半径/高度提供。

**Kind**: global class  

* [Block](#Block)
    * [new Block(scene, x, y, z, [type])](#new_Block_new)
    * [.type](#Block+type) : [<code>BlockType</code>](#BlockType)
    * [.createModel()](#Block+createModel) ⇒ <code>void</code>
    * [.createNormalBlock()](#Block+createNormalBlock) ⇒ <code>void</code>
    * [.createStartBlock()](#Block+createStartBlock) ⇒ <code>void</code>
    * [.createSmallBlock()](#Block+createSmallBlock) ⇒ <code>void</code>
    * [.createTallBlock()](#Block+createTallBlock) ⇒ <code>void</code>
    * [.createSpecialBlock()](#Block+createSpecialBlock) ⇒ <code>void</code>
    * [.addTopDecoration()](#Block+addTopDecoration) ⇒ <code>void</code>
    * [.addGlowEffect()](#Block+addGlowEffect) ⇒ <code>void</code>
    * [.addRotatingDecoration()](#Block+addRotatingDecoration) ⇒ <code>void</code>
    * [.getRandomColor()](#Block+getRandomColor) ⇒ <code>number</code>
    * [.playEntranceAnimation()](#Block+playEntranceAnimation) ⇒ <code>void</code>
    * [.playLandingEffect()](#Block+playLandingEffect) ⇒ <code>void</code>
    * [.update(deltaTime)](#Block+update) ⇒ <code>void</code>
    * [.getHeight()](#Block+getHeight) ⇒ <code>number</code>
    * [.getRadius()](#Block+getRadius) ⇒ <code>number</code>
    * [.destroy()](#Block+destroy) ⇒ <code>void</code>

<a name="new_Block_new"></a>

### new Block(scene, x, y, z, [type])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| scene | <code>THREE.Scene</code> |  | Three.js 场景 |
| x | <code>number</code> |  |  |
| y | <code>number</code> |  |  |
| z | <code>number</code> |  |  |
| [type] | [<code>BlockType</code>](#BlockType) | <code>&#x27;normal&#x27;</code> |  |

<a name="Block+type"></a>

### block.type : [<code>BlockType</code>](#BlockType)
**Kind**: instance property of [<code>Block</code>](#Block)  
<a name="Block+createModel"></a>

### block.createModel() ⇒ <code>void</code>
创建方块模型并加入场景，随后播放入场动画。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+createNormalBlock"></a>

### block.createNormalBlock() ⇒ <code>void</code>
创建普通方块（带顶部装饰）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+createStartBlock"></a>

### block.createStartBlock() ⇒ <code>void</code>
创建起始方块（带发光效果）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+createSmallBlock"></a>

### block.createSmallBlock() ⇒ <code>void</code>
创建小方块（更小的半径）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+createTallBlock"></a>

### block.createTallBlock() ⇒ <code>void</code>
创建高方块（更高的平台）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+createSpecialBlock"></a>

### block.createSpecialBlock() ⇒ <code>void</code>
创建特殊方块（带旋转装饰，可能带额外加分）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+addTopDecoration"></a>

### block.addTopDecoration() ⇒ <code>void</code>
添加顶部装饰小球。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+addGlowEffect"></a>

### block.addGlowEffect() ⇒ <code>void</code>
添加发光环效果（起始方块使用）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+addRotatingDecoration"></a>

### block.addRotatingDecoration() ⇒ <code>void</code>
添加旋转装饰（特殊方块使用）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+getRandomColor"></a>

### block.getRandomColor() ⇒ <code>number</code>
随机选择方块颜色。

**Kind**: instance method of [<code>Block</code>](#Block)  
**Returns**: <code>number</code> - 颜色（0xRRGGBB）  
<a name="Block+playEntranceAnimation"></a>

### block.playEntranceAnimation() ⇒ <code>void</code>
方块入场动画：从下方升起并缩放到正常大小。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+playLandingEffect"></a>

### block.playLandingEffect() ⇒ <code>void</code>
落地反馈：轻微震动。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+update"></a>

### block.update(deltaTime) ⇒ <code>void</code>
每帧更新方块装饰动画。

**Kind**: instance method of [<code>Block</code>](#Block)  

| Param | Type | Description |
| --- | --- | --- |
| deltaTime | <code>number</code> | 帧间隔（秒） |

<a name="Block+getHeight"></a>

### block.getHeight() ⇒ <code>number</code>
获取方块高度（用于落地/碰撞判定）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+getRadius"></a>

### block.getRadius() ⇒ <code>number</code>
获取方块半径（用于落地/碰撞判定）。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="Block+destroy"></a>

### block.destroy() ⇒ <code>void</code>
从场景中移除方块模型。

**Kind**: instance method of [<code>Block</code>](#Block)  
<a name="GameEngine"></a>

## GameEngine
游戏引擎（小游戏逻辑层 + 渲染层的封装）。

**Kind**: global class  

* [GameEngine](#GameEngine)
    * [new GameEngine(canvas, ctx)](#new_GameEngine_new)
    * [.gameState](#GameEngine+gameState) : [<code>GameState</code>](#GameState)
    * [.onScoreChange](#GameEngine+onScoreChange) : [<code>ScoreChangeCallback</code>](#ScoreChangeCallback) \| <code>null</code>
    * [.onGameOver](#GameEngine+onGameOver) : [<code>GameOverCallback</code>](#GameOverCallback) \| <code>null</code>
    * [.onPowerChange](#GameEngine+onPowerChange) : [<code>PowerChangeCallback</code>](#PowerChangeCallback) \| <code>null</code>
    * [.initScene()](#GameEngine+initScene) ⇒ <code>void</code>
    * [.initLighting()](#GameEngine+initLighting) ⇒ <code>void</code>
    * [.initCamera()](#GameEngine+initCamera) ⇒ <code>void</code>
    * [.initGameObjects()](#GameEngine+initGameObjects) ⇒ <code>void</code>
    * [.createInitialBlocks()](#GameEngine+createInitialBlocks) ⇒ <code>void</code>
    * [.generateNextBlock()](#GameEngine+generateNextBlock) ⇒ <code>void</code>
    * [.startGame()](#GameEngine+startGame) ⇒ <code>void</code>
    * [.restart()](#GameEngine+restart) ⇒ <code>void</code>
    * [.startCharging()](#GameEngine+startCharging) ⇒ <code>void</code>
    * [.jump()](#GameEngine+jump) ⇒ <code>void</code>
    * [.checkLanding()](#GameEngine+checkLanding) ⇒ <code>void</code>
    * [.handleSuccessfulLanding(blockIndex, distance)](#GameEngine+handleSuccessfulLanding) ⇒ <code>void</code>
    * [.handleGameOver()](#GameEngine+handleGameOver) ⇒ <code>void</code>
    * [.cleanupDistantBlocks()](#GameEngine+cleanupDistantBlocks) ⇒ <code>void</code>
    * [.update(deltaTime)](#GameEngine+update) ⇒ <code>void</code>
    * [.updateCamera(deltaTime)](#GameEngine+updateCamera) ⇒ <code>void</code>
    * [.render(timestamp)](#GameEngine+render) ⇒ <code>void</code>
    * [.start()](#GameEngine+start) ⇒ <code>void</code>
    * [.pause()](#GameEngine+pause) ⇒ <code>void</code>
    * [.resume()](#GameEngine+resume) ⇒ <code>void</code>
    * [.destroy()](#GameEngine+destroy) ⇒ <code>void</code>

<a name="new_GameEngine_new"></a>

### new GameEngine(canvas, ctx)

| Param | Type | Description |
| --- | --- | --- |
| canvas | <code>Object</code> | 小程序 Canvas 节点（来自 selectorQuery fields({ node: true })） |
| ctx | <code>WebGLRenderingContext</code> | WebGL 上下文（canvas.getContext('webgl')） |

<a name="GameEngine+gameState"></a>

### gameEngine.gameState : [<code>GameState</code>](#GameState)
**Kind**: instance property of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+onScoreChange"></a>

### gameEngine.onScoreChange : [<code>ScoreChangeCallback</code>](#ScoreChangeCallback) \| <code>null</code>
**Kind**: instance property of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+onGameOver"></a>

### gameEngine.onGameOver : [<code>GameOverCallback</code>](#GameOverCallback) \| <code>null</code>
**Kind**: instance property of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+onPowerChange"></a>

### gameEngine.onPowerChange : [<code>PowerChangeCallback</code>](#PowerChangeCallback) \| <code>null</code>
**Kind**: instance property of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+initScene"></a>

### gameEngine.initScene() ⇒ <code>void</code>
初始化 Three.js 场景与渲染器。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+initLighting"></a>

### gameEngine.initLighting() ⇒ <code>void</code>
初始化环境光/方向光与阴影参数。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+initCamera"></a>

### gameEngine.initCamera() ⇒ <code>void</code>
初始化透视相机与相机跟随参数。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+initGameObjects"></a>

### gameEngine.initGameObjects() ⇒ <code>void</code>
初始化玩家与方块列表等游戏对象。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+createInitialBlocks"></a>

### gameEngine.createInitialBlocks() ⇒ <code>void</code>
创建起始方块与前若干个方块，并将玩家放到起点。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+generateNextBlock"></a>

### gameEngine.generateNextBlock() ⇒ <code>void</code>
基于上一个方块随机生成下一个方块并加入列表。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+startGame"></a>

### gameEngine.startGame() ⇒ <code>void</code>
开始一局游戏：重置分数与状态，并触发分数回调。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+restart"></a>

### gameEngine.restart() ⇒ <code>void</code>
重新开始：清理场景中旧方块、重置玩家与相机，再开始游戏。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+startCharging"></a>

### gameEngine.startCharging() ⇒ <code>void</code>
进入蓄力状态并触发玩家蓄力动画。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+jump"></a>

### gameEngine.jump() ⇒ <code>void</code>
根据蓄力时长计算跳跃参数并执行跳跃。
跳跃完成后会进行落点判定并计分/结束游戏。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+checkLanding"></a>

### gameEngine.checkLanding() ⇒ <code>void</code>
判定玩家落在哪个方块附近，并根据距离判定成功或失败。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+handleSuccessfulLanding"></a>

### gameEngine.handleSuccessfulLanding(blockIndex, distance) ⇒ <code>void</code>
成功落地处理：计算得分、更新相机目标、生成新方块并清理远处方块。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  

| Param | Type | Description |
| --- | --- | --- |
| blockIndex | <code>number</code> | 落地方块索引 |
| distance | <code>number</code> | 玩家中心到方块中心的二维距离 |

<a name="GameEngine+handleGameOver"></a>

### gameEngine.handleGameOver() ⇒ <code>void</code>
失败处理：进入 falling 状态并播放玩家坠落动画，结束后触发回调。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+cleanupDistantBlocks"></a>

### gameEngine.cleanupDistantBlocks() ⇒ <code>void</code>
清理距离玩家过远且已不可能回到的历史方块，释放资源。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+update"></a>

### gameEngine.update(deltaTime) ⇒ <code>void</code>
每帧更新：蓄力进度、玩家/方块动画、相机跟随。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  

| Param | Type | Description |
| --- | --- | --- |
| deltaTime | <code>number</code> | 帧间隔（秒） |

<a name="GameEngine+updateCamera"></a>

### gameEngine.updateCamera(deltaTime) ⇒ <code>void</code>
平滑更新相机位置，并保持看向玩家。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  

| Param | Type | Description |
| --- | --- | --- |
| deltaTime | <code>number</code> | 帧间隔（秒） |

<a name="GameEngine+render"></a>

### gameEngine.render(timestamp) ⇒ <code>void</code>
渲染循环回调（requestAnimationFrame）。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  

| Param | Type | Description |
| --- | --- | --- |
| timestamp | <code>number</code> | 高精度时间戳（毫秒） |

<a name="GameEngine+start"></a>

### gameEngine.start() ⇒ <code>void</code>
启动渲染循环（不会自动开始一局，需要调用 startGame）。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+pause"></a>

### gameEngine.pause() ⇒ <code>void</code>
暂停渲染更新（仍然保持 rAF 循环，但早返回）。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+resume"></a>

### gameEngine.resume() ⇒ <code>void</code>
恢复渲染更新。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="GameEngine+destroy"></a>

### gameEngine.destroy() ⇒ <code>void</code>
销毁并释放场景资源（方块/玩家/渲染器）。

**Kind**: instance method of [<code>GameEngine</code>](#GameEngine)  
<a name="Player"></a>

## Player
玩家角色类。
负责：创建玩家模型、维护位置、执行蓄力/跳跃/坠落动画与特效。

**Kind**: global class  

* [Player](#Player)
    * [new Player(scene)](#new_Player_new)
    * [.createModel()](#Player+createModel) ⇒ <code>void</code>
    * [.setPosition(x, y, z)](#Player+setPosition) ⇒ <code>void</code>
    * [.startCharging()](#Player+startCharging) ⇒ <code>void</code>
    * [.jump(distance, height, onComplete)](#Player+jump) ⇒ <code>void</code>
    * [.fall(onComplete)](#Player+fall) ⇒ <code>void</code>
    * [.showPerfectEffect()](#Player+showPerfectEffect) ⇒ <code>void</code>
    * [.createParticleEffect()](#Player+createParticleEffect) ⇒ <code>void</code>
    * [.update(deltaTime)](#Player+update) ⇒ <code>void</code>
    * [.blink()](#Player+blink) ⇒ <code>void</code>
    * [.playJumpSound()](#Player+playJumpSound) ⇒ <code>void</code>
    * [.playPerfectSound()](#Player+playPerfectSound) ⇒ <code>void</code>
    * [.reset()](#Player+reset) ⇒ <code>void</code>
    * [.destroy()](#Player+destroy) ⇒ <code>void</code>

<a name="new_Player_new"></a>

### new Player(scene)

| Param | Type | Description |
| --- | --- | --- |
| scene | <code>THREE.Scene</code> | Three.js 场景 |

<a name="Player+createModel"></a>

### player.createModel() ⇒ <code>void</code>
创建玩家模型并加入场景。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="Player+setPosition"></a>

### player.setPosition(x, y, z) ⇒ <code>void</code>
直接设置玩家位置（同时同步 Three.js Group）。

**Kind**: instance method of [<code>Player</code>](#Player)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 
| z | <code>number</code> | 

<a name="Player+startCharging"></a>

### player.startCharging() ⇒ <code>void</code>
进入蓄力状态（在 update 中驱动压缩/抖动动画）。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="Player+jump"></a>

### player.jump(distance, height, onComplete) ⇒ <code>void</code>
执行一次跳跃动画（结束后调用回调）。

注意：当前实现会随机选择方向；如果要精确跳向下一个方块，
应由外部传入目标方向/目标点来替换这里的随机角度逻辑。

**Kind**: instance method of [<code>Player</code>](#Player)  

| Param | Type | Description |
| --- | --- | --- |
| distance | <code>number</code> | 跳跃水平距离 |
| height | <code>number</code> | 跳跃最高高度增量 |
| onComplete | [<code>AnimationCompleteCallback</code>](#AnimationCompleteCallback) | 跳跃完成回调 |

<a name="Player+fall"></a>

### player.fall(onComplete) ⇒ <code>void</code>
执行坠落动画（结束后调用回调）。

**Kind**: instance method of [<code>Player</code>](#Player)  

| Param | Type |
| --- | --- |
| onComplete | [<code>AnimationCompleteCallback</code>](#AnimationCompleteCallback) | 

<a name="Player+showPerfectEffect"></a>

### player.showPerfectEffect() ⇒ <code>void</code>
完美落地效果：粒子 + 音效。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="Player+createParticleEffect"></a>

### player.createParticleEffect() ⇒ <code>void</code>
创建一次性粒子特效并播放。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="Player+update"></a>

### player.update(deltaTime) ⇒ <code>void</code>
每帧更新：蓄力/跳跃/坠落动画与空闲微动画。

**Kind**: instance method of [<code>Player</code>](#Player)  

| Param | Type | Description |
| --- | --- | --- |
| deltaTime | <code>number</code> | 帧间隔（秒） |

<a name="Player+blink"></a>

### player.blink() ⇒ <code>void</code>
眨眼动画（一次性）。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="Player+playJumpSound"></a>

### player.playJumpSound() ⇒ <code>void</code>
播放跳跃音效（预留：可接入小程序音效）。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="Player+playPerfectSound"></a>

### player.playPerfectSound() ⇒ <code>void</code>
播放完美落地音效（预留）。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="Player+reset"></a>

### player.reset() ⇒ <code>void</code>
重置玩家到初始状态（位置/旋转/缩放/动画标志位）。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="Player+destroy"></a>

### player.destroy() ⇒ <code>void</code>
从场景移除玩家模型（释放引用）。

**Kind**: instance method of [<code>Player</code>](#Player)  
<a name="ColorUtils"></a>

## ColorUtils : <code>object</code>
颜色相关工具集。

**Kind**: global namespace  
<a name="StorageUtils"></a>

## StorageUtils : <code>object</code>
小程序本地存储工具（JSON 序列化封装）。

**Kind**: global namespace  
<a name="lerp"></a>

## lerp(start, end, factor) ⇒ <code>number</code>
线性插值。

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| start | <code>number</code> |  |
| end | <code>number</code> |  |
| factor | <code>number</code> | 插值系数（通常 0-1） |

<a name="easeOutQuart"></a>

## easeOutQuart(t) ⇒ <code>number</code>
缓动函数：四次方缓出（easeOutQuart）。

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| t | <code>number</code> | 0-1 |

<a name="easeInQuart"></a>

## easeInQuart(t) ⇒ <code>number</code>
缓动函数：四次方缓入（easeInQuart）。

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| t | <code>number</code> | 0-1 |

<a name="easeInOutCubic"></a>

## easeInOutCubic(t) ⇒ <code>number</code>
缓动函数：三次方缓入缓出（easeInOutCubic）。

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| t | <code>number</code> | 0-1 |

<a name="easeOutElastic"></a>

## easeOutElastic(t) ⇒ <code>number</code>
缓动函数：弹性缓出（easeOutElastic）。

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| t | <code>number</code> | 0-1 |

<a name="easeOutBounce"></a>

## easeOutBounce(t) ⇒ <code>number</code>
缓动函数：反弹缓出（easeOutBounce）。

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| t | <code>number</code> | 0-1 |

<a name="degToRad"></a>

## degToRad(degrees) ⇒ <code>number</code>
角度转弧度。

**Kind**: global function  

| Param | Type |
| --- | --- |
| degrees | <code>number</code> | 

<a name="radToDeg"></a>

## radToDeg(radians) ⇒ <code>number</code>
弧度转角度。

**Kind**: global function  

| Param | Type |
| --- | --- |
| radians | <code>number</code> | 

<a name="clamp"></a>

## clamp(value, min, max) ⇒ <code>number</code>
限制数值范围到 [min, max]。

**Kind**: global function  

| Param | Type |
| --- | --- |
| value | <code>number</code> | 
| min | <code>number</code> | 
| max | <code>number</code> | 

<a name="random"></a>

## random(min, max) ⇒ <code>number</code>
生成 [min, max) 的随机浮点数。

**Kind**: global function  

| Param | Type |
| --- | --- |
| min | <code>number</code> | 
| max | <code>number</code> | 

<a name="randomInt"></a>

## randomInt(min, max) ⇒ <code>number</code>
生成 [min, max] 的随机整数。

**Kind**: global function  

| Param | Type |
| --- | --- |
| min | <code>number</code> | 
| max | <code>number</code> | 

<a name="distance"></a>

## distance(x1, y1, x2, y2) ⇒ <code>number</code>
二维两点距离。

**Kind**: global function  

| Param | Type |
| --- | --- |
| x1 | <code>number</code> | 
| y1 | <code>number</code> | 
| x2 | <code>number</code> | 
| y2 | <code>number</code> | 

<a name="distance3D"></a>

## distance3D(x1, y1, z1, x2, y2, z2) ⇒ <code>number</code>
三维两点距离。

**Kind**: global function  

| Param | Type |
| --- | --- |
| x1 | <code>number</code> | 
| y1 | <code>number</code> | 
| z1 | <code>number</code> | 
| x2 | <code>number</code> | 
| y2 | <code>number</code> | 
| z2 | <code>number</code> | 

<a name="normalize"></a>

## normalize(x, y) ⇒ <code>Object</code>
二维向量归一化。

**Kind**: global function  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="dotProduct"></a>

## dotProduct(x1, y1, x2, y2) ⇒ <code>number</code>
二维向量点积。

**Kind**: global function  

| Param | Type |
| --- | --- |
| x1 | <code>number</code> | 
| y1 | <code>number</code> | 
| x2 | <code>number</code> | 
| y2 | <code>number</code> | 

<a name="crossProduct"></a>

## crossProduct(x1, y1, x2, y2) ⇒ <code>number</code>
二维向量叉积（标量结果）。

**Kind**: global function  

| Param | Type |
| --- | --- |
| x1 | <code>number</code> | 
| y1 | <code>number</code> | 
| x2 | <code>number</code> | 
| y2 | <code>number</code> | 

<a name="smoothstep"></a>

## smoothstep(edge0, edge1, x) ⇒ <code>number</code>
平滑步长函数 smoothstep。

**Kind**: global function  

| Param | Type |
| --- | --- |
| edge0 | <code>number</code> | 
| edge1 | <code>number</code> | 
| x | <code>number</code> | 

<a name="noise"></a>

## noise(x, y) ⇒ <code>number</code>
简单噪声函数（基于 sin 的伪随机）。

**Kind**: global function  
**Returns**: <code>number</code> - 0-1  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="BlockType"></a>

## BlockType : <code>&#x27;start&#x27;</code> \| <code>&#x27;normal&#x27;</code> \| <code>&#x27;small&#x27;</code> \| <code>&#x27;tall&#x27;</code> \| <code>&#x27;special&#x27;</code>
方块类型

**Kind**: global typedef  
<a name="ScoreChangeCallback"></a>

## ScoreChangeCallback : <code>function</code>
分数变化回调

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| score | <code>number</code> | 当前累计分数 |

<a name="GameOverCallback"></a>

## GameOverCallback : <code>function</code>
游戏结束回调

**Kind**: global typedef  
<a name="PowerChangeCallback"></a>

## PowerChangeCallback : <code>function</code>
蓄力值变化回调

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| power | <code>number</code> | 蓄力百分比（0-100） |

<a name="GameState"></a>

## GameState : <code>&#x27;waiting&#x27;</code> \| <code>&#x27;charging&#x27;</code> \| <code>&#x27;jumping&#x27;</code> \| <code>&#x27;falling&#x27;</code>
游戏状态

**Kind**: global typedef  
<a name="AnimationCompleteCallback"></a>

## AnimationCompleteCallback : <code>function</code>
动画完成回调

**Kind**: global typedef  
