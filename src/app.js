var g_sharedGameLayer;
var visibleRect = cc.visibleRect;
var random = function(m, n) {
  if (m == undefined && n == undefined) {
    return Math.random();
  } else {
    // fixme
    m = m == undefined ? 1 : m;
    n = n == undefined ? 1 : n;
    return Math.random() * (n - m) + m;
  }
};
var game_state = {
  ready: 0,
  begin: 1,
  over: 2,
  end: 3
};

var GameLayer = cc.Layer.extend({
  sprite: null,
  ctor: function() {
    this._super();
    g_sharedGameLayer = this;
    this.gameState = game_state.begin;
//    this.bgEffect = cc.audioEngine.playEffect(res.s_music_track);
    this.initEvents();
    this.initStartUp();
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
  onEnter: function() {
    this._super();
    this.scheduleUpdate();
  },
  initEvents: function() {
    if ('touches' in cc.sys.capabilities) {
      cc.eventManager.addListener({
        event: cc.EventListener.TOUCH_ALL_AT_ONCE,
        onTouchBegan: this.onTouchBegan.bind(this)
      }, this);
    } else if ('mouse' in cc.sys.capabilities)
      cc.eventManager.addListener({
        event: cc.EventListener.MOUSE,
        onMouseDown: this.onTouchBegan.bind(this)
      }, this);
  },
  onTouchBegan: function(touches, event) {
//    if (touches && event) {
//      for (var it = 0; it < touches.length; it++) {
//        var touch = touches[it];
//        if (!touch)
//          break;
//
//        var location = touch.getLocation();
//        console.log(location);
//      }
//    } else {
//      console.log(touches.getLocation());
//    }
//    if (this.gameState == game_state.begin) {
    this.player.jumpUpAction(true);
//    }
  },
  initStartUp: function() {
    var ui = ccs.uiReader.widgetFromJsonFile(res.s_startupJson);
    this.addChild(ui, ZOrder.startup);
//    ccs.actionManager.playActionByName(res.s_startupShortJson, "In");
    var soundButton = ccui.helper.seekWidgetByName(ui, "sound");
    var beginButton = ccui.helper.seekWidgetByName(ui, "begin");
    beginButton.setTouchEnabled(true);
    beginButton.addTouchEventListener(this.startupButtonTouchEvent, this);
    soundButton.setTouchEnabled(true);
    soundButton.addTouchEventListener(this.startupButtonTouchEvent, this);
  },
  startupButtonTouchEvent: function(sender, type) {
    if (type == ccui.Widget.TOUCH_ENDED) {
      var name = sender.name;
      if (name == "sound") {
        if (this.isBgEffectPaused) {
          this.isBgEffectPaused = false;
          cc.audioEngine.resumeEffect(this.bgEffect);
        } else {
          this.isBgEffectPaused = true;
          cc.audioEngine.pauseEffect(this.bgEffect);
        }
      } else if (name == "begin") {
//        ccs.actionManager.playActionByName(res.s_startupShortJson, "Out");
      }
    }
  },
  initPlayer: function() {
    this.player = new Player(this);
    this.addChild(this.player, ZOrder.player);
  },
  initPhysics: function() {
    this.space = new cp.Space();
    this.space.gravity = cp.v(0, -1000);
    var wallBottom = new cp.SegmentShape(this.space.staticBody, cp.v(-Max, 0),// start point
      cp.v(Max, 0),// MAX INT:4294967295
      0);// thickness of wall
    wallBottom.setFriction(0);
    this.space.addShape(wallBottom);
  },
  initBlockLayer: function() {
    this.blockLayer = new BlockLayer(this);
//    this.blockLayer.setPosition(cc.PointZero());
    this.blockLayer.moveBlocks(2);
    this.addChild(this.blockLayer);
  },
  update: function(delta) {
    var steps = 2;
    delta /= steps;
    for (var i = 0; i < steps; i++) {
      this.space.step(delta);
    }
  },
  collisionBegin: function(arbiter, space) {
    console.log("begin");
    var shapes = arbiter.getShapes();
    cc.each(shapes, function(shape) {
//      shape.body.setRotation(0);
      shape.body.setVel({x: 0, y: 0});
    });
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
    console.log('collision separate');
  },
  isSoundOn: function() {
    return !this.isBgEffectPaused;
  },
  getGameState: function() {
    return this.gameState;
  },
  setGameState: function(state) {
    this.gameState = state;
  },
  addColorDot: function() {

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

    var visibleRect = cc.visibleRect;
    var colorLayer = cc.LayerColor.create(cc.color(159, 213, 204, 0), visibleRect.width, visibleRect.height)
    this.addChild(colorLayer, ZOrder.background);

    var layer = new GameLayer();
    this.addChild(layer, ZOrder.gameLayer);

    this.schedule(this.createCloud, 9, cc.REPEAT_FOREVER, 0.1)
  },
  createCloud: function() {
    Cloud.create();
  }
});