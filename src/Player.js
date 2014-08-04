var player_state = {
  unknow: 0,
  walk: 1,
  back: 2,
  jump: 3,
  jumpback: 4,
  down: 5
};

var Player = cc.Sprite.extend({
  ctor: function() {
    this._super(res.s_player_top, cc.rect(8, 8, 60, 60));
    this.playerState = player_state.unknow;
    this.playerState2 = player_state.unknow;
    this.jumpCnt = 0;
    return this;
  },
  downAction: function() {
    if (this.playerState == player_state.jump || this.playerState == player_state.jumpback) {
      return;
    }
    if (this.playerState != player_state.down) {
      var point = g_sharedGameLayer.convertToWorldSpace(this.getPosition());
      var height = point.y + 70;
      var moveAction = cc.moveBy(height / 80 / 10, cc.p(0, -height));
      this.runAction(moveAction.easing(cc.easeSineIn()));
      this.playerState = player_state.down;
    }
  },
  rotateAction: function() {
    var action = cc.repeatForever(cc.rotateBy(0.8, 360));
    action.setTag(11);
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
  jumpAction: function(touchBegin) {
    if (this.jumpCnt == 0 && this.playerState != player_state.walk) {
      return false;
    }

    if (this.jumpCnt >= 2) {
      return false;
    }

    if (!touchBegin) {
      if (this.playerState == player_state.jump) {
        this.jumpAction.change();
      }
      return false;
    }

    if (this.playerState == player_state.jump
      || this.playerState == player_state.jumpback) {
      this.stopActionByTag(11);
      this.stopActionByTag(12);
      this.stopActionByTag(13);
    }
    this.jumpCnt++;
    this.playerState = player_state.jump;

    this.rotateAction();
    this.playerJump = new PlayerJump(240 / 80 / 10, cc.p(0, 240), 60, 1);
    var seqAction = cc.sequence(
      this.playerJump,
      cc.callFunc(this.jumpDoneAction));
    seqAction.setTag(12);
    this.runAction(seqAction);

    if (g_sharedGameLayer.isSoundOn()) {
      if (this.jumpCnt == 1) {
        cc.audioEngine.playEffect(res.s_music_jumpA);
      } else if (this.jumpCnt == 2) {
        cc.audioEngine.playEffect(res.s_music_jumpB);
      }
    }
    return true;
  },
  jumpDoneAction: function() {
    this.playerJump.retain();
    var pos = g_sharedGameLayer.convertToWorldSpace(this.getPosition());
    var height = pos.y + 100;
    var downAction = cc.moveBy(height / 130 / 10, cc.p(0, -height));
    var easingAction = downAction.easing(cc.easeSineIn());
    easingAction.setTag(13);
    this.runAction(easingAction);
    this.playerState = player_state.jumpback;
  }
});

var PlayerJump = cc.JumpBy.extend({
  ctor: function() {
    this._super.call(arguments)
  },
  change: function() {
  }
});