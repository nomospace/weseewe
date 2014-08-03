var g_sharedGameLayer;

var GameLayer = cc.Layer.extend({
  sprite: null,
  ctor: function() {
    this._super();
    g_sharedGameLayer = this;

    this._bgEffect = cc.audioEngine.playEffect(res.s_music_track);

    var ui = ccs.uiReader.widgetFromJsonFile(res.s_startupJson);
    this.addChild(ui, ZOrder.startup);
//    ccs.actionManager.playActionByName(res.s_startupShortJson, "In");

    var soundButton = ccui.helper.seekWidgetByName(ui, "sound");
    var beginButton = ccui.helper.seekWidgetByName(ui, "begin");
    beginButton.setTouchEnabled(true);
    beginButton.addTouchEventListener(this.buttonTouchEvent, this);
    soundButton.setTouchEnabled(true);
    soundButton.addTouchEventListener(this.buttonTouchEvent, this);

    return true;
  },
  buttonTouchEvent: function(sender, type) {
    if (type == ccui.Widget.TOUCH_ENDED) {
      var name = sender.name;
      if (name == "sound") {
        if (this._isBgEffectPaused) {
          this._isBgEffectPaused = false
          cc.audioEngine.resumeEffect(this._bgEffect);
        } else {
          this._isBgEffectPaused = true;
          cc.audioEngine.pauseEffect(this._bgEffect);
        }
      } else if (name == "begin") {
//        ccs.actionManager.playActionByName(res.s_startupShortJson, "Out");
      }
    }
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

