var Cloud = cc.Sprite.extend({
  ctor: function(parent) {
    this._super(res.s_cloud_bottom);
    parent.addChild(this);
    this.setPos();
    this.rotate();
  },
  setPos: function() {
    var minHeight = 700, maxHeight = cc.visibleRect.height - this._contentSize.height / 2;
    this.attr({
      x: cc.visibleRect.width + this._contentSize.width / 2,
      y: random(minHeight, maxHeight)
    });
  },
  rotate: function() {
    var rotateAction = cc.rotateBy(80, random() > 0.5 ? 360 : -360).repeatForever();
    var moveAction = cc.moveBy(30, cc.p(-(cc.visibleRect.width + this._contentSize.width), 0));
    var moveActionSequence = cc.sequence(moveAction, cc.callFunc(this.setPos.bind(this)));
    this.runAction(cc.spawn([rotateAction, moveActionSequence]));
  }
});