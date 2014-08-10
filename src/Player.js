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
    this.jumpCnt = 0;
    this.playerSize = this.getContentSize();
    this.gameLayer = parent;
    this.setTag(player_tag);
    this.initBody();
    this.initShape();
  },
  initBody: function() {
    this.m = 1;
    this.body = new cp.Body(this.m, cp.momentForBox(this.m, this.playerSize.width, this.playerSize.height));
//    this.body = new cp.StaticBody();
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
  rotateAction: function() {
//    this.setRotation(0);
    var action = cc.repeatForever(cc.rotateBy(1, 360));
    this.runAction(action);
  },
  walkAction: function() {
    this.jumpCnt = 0;
  },
  jumpUpAction: function() {
    if (this.jumpCnt >= 2) {
      return false;
    }
    this.jumpCnt++;
    this.playerState = player_state.jump;

    this.rotateAction();
    this.body.setVel({x: 0, y: 0});
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
  setPlayerState: function(state) {
    this.playerState = state;
  }
});