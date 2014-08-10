var game_state = {
  ready: 0,
  begin: 1,
  over: 2,
  end: 3
};

var bgSoundId = cc.audioEngine.playEffect(res.s_music_track);

var GameLayer = cc.Layer.extend({
  ctor: function() {
    this._super();
    this.gameState = game_state.begin;
    this.colorDots = [];
    this.initEvents();
    this.initButtons();
    this.initPhysics();
    this.initPlayer();
    this.initBlockLayer();
    this.setupDebugNode();

    var beginHandler = this.collisionBegin.bind(this);
    var preHandler = this.collisionPre.bind(this);
    var postHandler = this.collisionPost.bind(this);
    var separateHandler = this.collisionSeparate.bind(this);
    this.space.addCollisionHandler(SpriteTag.player, SpriteTag.block, beginHandler, preHandler, postHandler, separateHandler);

    return true;
  },
//  onEnter: function() {
//    this._super();
//  },
  initButtons: function() {
    this.startButton = cc.Sprite.create(res.s_start);
    this.startButton.setPosition(cc.visibleRect.center);
    this.addChild(this.startButton, ZOrder.startup, SpriteTag.start);
    var startLabel = cc.LabelTTF.create("START", "Arial", 60,
      cc.size(this.startButton.width, this.startButton.height),
      cc.TEXT_ALIGNMENT_CENTER, cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
    startLabel.setAnchorPoint(cc.PointZero());
    this.startButton.addChild(startLabel);
    addListener(this.startGame.bind(this), this.startButton);

    this.soundButton = cc.Sprite.create(res.s_sound);
    this.soundButton._onTexture = cc.textureCache.addImage(res.s_sound);
    this.soundButton._offTexture = cc.textureCache.addImage(res.s_sound_off);
    this.soundButton.attr({
      anchorX: 1,
      anchorY: 0,
      x: cc.visibleRect.bottomRight.x - 20,
      y: cc.visibleRect.bottomRight.y + 20
    });
    this.addChild(this.soundButton, ZOrder.startup, SpriteTag.sound);
    addListener(this.playSound.bind(this), this.soundButton);
  },
  startGame: function(t) {
    if (!this.checkAndStopPropagation(t))
      return;
    this.startButton.setVisible(false);
    this.scheduleUpdate();
    this.blockLayer.moveBlocks(2);
  },
  playSound: function(t) {
//    t.getCurrentTarget() -> this.soundButton   cocos sucks!
    if (!this.checkAndStopPropagation(t))
      return;
    if (this.isBgSoundPaused) {
      this.isBgSoundPaused = false;
      this.soundButton.setTexture(this.soundButton._onTexture);
      cc.audioEngine.resumeEffect(bgSoundId);
    } else {
      this.isBgSoundPaused = true;
      this.soundButton.setTexture(this.soundButton._offTexture);
      cc.audioEngine.pauseEffect(bgSoundId);
    }
  },
  checkAndStopPropagation: function(t) {
//    getPosition? getLocation?
    var target = t.getCurrentTarget();
    var size = target.getContentSize();
    var rect = target.getTextureRect();
    rect.x += target.x - target.anchorX * size.width;
    rect.y += target.y - target.anchorY * size.height;
    // buggy TODO
    var contained = cc.rectContainsPoint(rect, t.getLocation());
    if (contained) {
      t.stopPropagation();
    }
    return contained;
  },
  initEvents: function() {
    addListener(this.onTouchBegan.bind(this), this);
  },
  onTouchBegan: function(touches, event) {
    /*    var tag = touches.getCurrentTarget().tag;
     console.log(tag); // Layer的默认tag
     if (touches && event) {
     for (var it = 0; it < touches.length; it++) {
     var touch = touches[it];
     if (!touch)
     break;

     var location = touch.getLocation();
     console.log(location);
     }
     } else {
     console.log(touches.getLocation());
     }*/
    this.player.jumpUpAction();
  },
  initPlayer: function() {
    this.player = new Player(this);
    this.addChild(this.player, ZOrder.player);
  },
  initPhysics: function() {
    this.space = new cp.Space();
    this.space.gravity = cp.v(0, -1000);
    var wallBottom = new cp.SegmentShape(this.space.staticBody, cp.v(-Max, 0), cp.v(Max, 0), 0);
    wallBottom.setFriction(0);
    this.space.addShape(wallBottom);
  },
  initBlockLayer: function() {
    this.blockLayer = new BlockLayer(this);
    this.addChild(this.blockLayer);
  },
  update: function(delta) {
    var steps = 1;
    delta /= steps;
    for (var i = 0; i < steps; i++) {
      this.space.step(delta);
    }
  },
  collisionBegin: function(arbiter, space) {
//    console.log("begin");
//    var shapes = arbiter.getShapes();
//    cc.each(shapes, function(shape) {
//      shape.body.setRotation(0);
//      shape.body.setVel({x: 0, y: 0});
//    });
    this.player.setRotation(0);
    this.player.setPlayerState(player_state);
    this.player.walkAction();
//    var collTypeA = shapes[0].collision_type;
//    var collTypeB = shapes[1].collision_type;
//    console.log('Collision Type A:' + collTypeA);
//    console.log('Collision Type B:' + collTypeB);
    return true;
  },
  collisionPre: function(arbiter, space) {
//    console.log('collision pre');
    return true;
  },
  collisionPost: function(arbiter, space) {
//    console.log('collision post');
  },
  collisionSeparate: function(arbiter, space) {
//    console.log('collision separate');
  },
  isSoundOn: function() {
    return !this.isBgSoundPaused;
  },
  getGameState: function() {
    return this.gameState;
  },
  setGameState: function(state) {
    this.gameState = state;
  },
  addColorDot: function(color) {
    var dot = cc.Sprite.create(res.s_color_dot);
    var gap = 50;
    dot.setColor(color);
    this.colorDots.push(dot);
    this.addChild(dot);
    var length = this.colorDots.length;
    if (length == 1) {
      dot.setPosition(cc.pAdd(cc.visibleRect.center, cc.p(0, 200)));
    } else {
      var x = ( cc.visibleRect.width - gap * (length - 1)) / 2;
      cc.each(this.colorDots, function(cd, i) {
        this.colorDots[i].setPosition(cc.p(x + gap * i, this.colorDots[0].y));
      }.bind(this));
    }
  },
  setupDebugNode: function() {
    if (PhysicsDebug) {
      this._debugNode = cc.PhysicsDebugNode.create(this.space);
      this._debugNode.visible = true;
      this.addChild(this._debugNode);
    }
  },
  setPosition: function(x, y) {
    var offsetPos = cc.pSub(cc.p(x, y), this.getPosition());
    this.player.setPosition(cc.pAdd(this.player.getPosition(), offsetPos));
    this.blockLayer.setPosition(cc.pAdd(this.blockLayer.getPosition(), offsetPos));
  }
});

var MainScene = cc.Scene.extend({
  onEnter: function() {
    this._super();
    this.addColorLayer();
    this.addGameLayer();
    this.schedule(this.createCloud, 9, cc.REPEAT_FOREVER, 0.1)
  },
  addGameLayer: function() {
    this.gameLayer = new GameLayer();
    this.addChild(this.gameLayer, ZOrder.gameLayer);
  },
  addColorLayer: function() {
    var colorLayer = cc.LayerColor.create(cc.color(159, 213, 204, 0), cc.visibleRect.width, cc.visibleRect.height);
    this.addChild(colorLayer, ZOrder.background);
  },
  createCloud: function() {
    new Cloud(this.gameLayer);
  }
});