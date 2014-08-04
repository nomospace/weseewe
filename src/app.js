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
    this.gameState = game_state.ready;
    g_sharedGameLayer = this;

    this.initEvents();
    this.initStartUp();
    this.initPhysics();
    this.bgEffect = cc.audioEngine.playEffect(res.s_music_track);

    var blockLayer = new BlockLayer();
    blockLayer.setPosition(cc.PointZero());
    blockLayer.moveBlocks(2);
    this.addChild(blockLayer);

    this.player = new Player();
    this.player.setPosition(cc.p(200, 700));
    this.addChild(this.player, ZOrder.player);

    return true;
  },
  initEvents: function() {
    if ('touches' in cc.sys.capabilities) {
      cc.eventManager.addListener({
        event: cc.EventListener.TOUCH_ALL_AT_ONCE,
        onTouchesEnded: function(touches, event) {
          for (var it = 0; it < touches.length; it++) {
            var touch = touches[it];
            if (!touch)
              break;

            var location = touch.getLocation();
            console.log(location);
          }
        }
      }, this);
    } else if ('mouse' in cc.sys.capabilities)
      cc.eventManager.addListener({
        event: cc.EventListener.MOUSE,
        onMouseUp: function(event) {
          console.log(event.getLocation());
        }
      }, this);
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
  onTouchEnded: function(touches, event) {
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
    if (this.gameState == game_state.begin) {
      this.player.jumpAction(true)
    }
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
  initPhysics: function() {
    // Create the initial space
    this.space = new cp.Space();
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

