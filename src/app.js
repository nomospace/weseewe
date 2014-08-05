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
    this.bgEffect = cc.audioEngine.playEffect(res.s_music_track);
    this.initEvents();
    this.initStartUp();
    this.initPhysics();
    this.initPlayer();
    this.initBlockLayer();

    this.space.addCollisionHandler(1, 1,
      this.collisionBegin.bind(this),
      this.collisionPre.bind(this),
      this.collisionPost.bind(this),
      this.collisionSeparate.bind(this)
    );

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
    this.player.jumpAction(true);
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
    this.player = new Player();
    var size = this.player.getContentSize();
    // 2. init the runner physic body
    this.body = new cp.Body(1, cp.momentForBox(1, size.width, size.height));
    //3. set the position of the runner
//    this.body.p = cc.p(200, 700);
    //5. add the created body to space
    this.space.addBody(this.body);
    //6. create the shape for the body
    this.shape = new cp.BoxShape(this.body, size.width, size.height);
    //7. add shape to space
    this.space.addShape(this.shape);
    this.shape.setCollisionType(1);
    //8. set body to the physic sprite
    this.player.setBody(this.body);
    this.player.setPosition(cc.p(200, 700));
    this.addChild(this.player, ZOrder.player);
  },
  initPhysics: function() {
    // Create the initial space
    this.space = new cp.Space();
    this.space.gravity = cp.v(0, -200);
  },
  initBlockLayer: function() {
    this.blockLayer = new BlockLayer();
    this.blockLayer.setPosition(cc.PointZero());
    this.blockLayer.moveBlocks(2);
    this.addChild(this.blockLayer);
  },
  update: function(delta) {
    this.space.step(delta);
  },
  collisionBegin: function(arbiter, space) {
    cc.log('collision begin');
    var shapes = arbiter.getShapes();
    var collTypeA = shapes[0].collision_type;
    var collTypeB = shapes[1].collision_type;
    cc.log('Collision Type A:' + collTypeA);
    cc.log('Collision Type B:' + collTypeB);
    return true;
  },
  collisionPre: function(arbiter, space) {
    cc.log('collision pre');
    return true;
  },
  collisionPost: function(arbiter, space) {
    cc.log('collision post');
  },
  collisionSeparate: function(arbiter, space) {
    cc.log('collision separate');
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

