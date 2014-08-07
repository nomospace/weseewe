var player_state = {
  unknow: 0,
  walk: 1,
  back: 2,
  jump: 3,
  jumpback: 4,
  down: 5
};
var player_tag = 101;

var Player = cc.PhysicsSprite.extend({
  ctor: function(parent) {
    this._super(res.s_player_top, cc.rect(8, 8, 60, 60));
    this.playerState = player_state.walk;
    this.playerState2 = player_state.walk;
    this.jumpCnt = 0;
    this.playerSize = this.getContentSize();
    this.gameLayer = parent;
    this.setTag(player_tag);
    this.initBody();
    this.initShape();
    this.scheduleUpdate();
  },
  initBody: function() {
    this.m = 0.1
    this.body = new cp.Body(this.m, cp.momentForBox(this.m, this.playerSize.width, this.playerSize.height));
    this.body.setPos(cc.p(200, 700));
    this.gameLayer.space.addBody(this.body);
    this.setBody(this.body);
  },
  initShape: function() {
    this.shape = new cp.BoxShape(this.body, this.playerSize.width, this.playerSize.height);
    this.shape.setElasticity(0);
    this.shape.setFriction(0);
    this.shape.setCollisionType(SpriteTag.player);
    this.gameLayer.space.addShape(this.shape);
  },
  downAction: function() {
    if (this.playerState == player_state.jump || this.playerState == player_state.jumpback) {
      return;
    }
    if (this.playerState != player_state.down) {
      var point = this.getParent().convertToWorldSpace(this.getPosition());
      var height = point.y + 70;
      var moveAction = cc.moveBy(height / 80 / 10, cc.p(0, -height));
      this.runAction(moveAction.easing(cc.easeSineIn()));
      this.playerState = player_state.down;
    }
  },
  setRotation: function() {
    this._super.apply(this, arguments);
  },
  rotateAction: function() {
    console.log("rotate");
    var action = cc.repeatForever(cc.rotateBy(1, 360));
    this.runAction(action);
  },
  walkAction: function(y) {
    if (this.playerState == player_state.jump) {
      return;
    }
    if (this.playerState != player_state.walk) {
      this.stopAllActions();
      this.setRotation(0);
      var size = this.getContentSize();
      this.setPosition(cc.p(this.getPosition().x, y + size.height / 2));
      this.jumpCnt = 0;
      this.playerState = player_state.walk;
    }
  },
  movebackAction: function(duration, deltaPosition) {
    // fixme
    if (this.playerState2 != player_state.back) {
      var moveForever = cc.repeatForever(cc.moveBy(duration, deltaPosition));
      moveForever.setTag(player_state.back);
      this.runAction(moveForever);
      this.playerState2 = player_state.back;
    }
  },
  jumpUpAction: function(touchBegin) {
    /*    if (this.jumpCnt == 0 && this.playerState != player_state.walk) {
     return false;
     }

     if (this.jumpCnt >= 2) {
     return false;
     }

     if (!touchBegin) {
     if (this.playerState == player_state.jump) {
     this.jumpUpAction.change();
     }
     return false;
     }

     if (this.playerState == player_state.jump
     || this.playerState == player_state.jumpback) {
     this.stopActionByTag(11);
     this.stopActionByTag(12);
     this.stopActionByTag(13);
     }
     this.jumpCnt++;*/
    this.playerState = player_state.jump;

    this.rotateAction();
    this.body.applyImpulse(cp.v(0, this.m * 500), cp.v(0, 0));
//    var seqAction = cc.sequence(
//      cc.jumpBy(1, cc.p(0, 1), 200, 1),
//      cc.callFunc(this.jumpDoneAction.bind(this)));
//    seqAction.setTag(12);
//    this.runAction(seqAction);

    if (this.gameLayer.isSoundOn()) {
      if (this.jumpCnt == 1) {
        cc.audioEngine.playEffect(res.s_music_jumpA);
      } else if (this.jumpCnt == 2) {
        cc.audioEngine.playEffect(res.s_music_jumpB);
      }
    }
    return true;
  },
  jumpDoneAction: function() {
//    var pos = g_sharedGameLayer.convertToWorldSpace(this.getPosition());
//    var height = pos.y + 100;
//    var downAction = cc.moveBy(height / 130 / 10, cc.p(0, -height));
//    var easingAction = downAction.easing(cc.easeSineIn());
//    easingAction.setTag(13);
//    this.runAction(easingAction);
    this.playerState = player_state.jumpback;
  },
  update: function(dt) {
//    var vel = this.body.getVel();
//    console.log("vel.y", vel.y)
  }
});