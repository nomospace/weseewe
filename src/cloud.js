var Cloud = cc.Sprite.extend({
  ctor: function() {
    this._super(res.s_cloud_bottom);
    this.rotate();
  },
  rotate: function() {
    var self = this;
    var rotateAction = cc.rotateBy(80, random() > 0.5 ? 360 : -360).repeatForever();
    var moveAction = cc.moveBy(30, cc.p(-(cc.visibleRect.width + this._contentSize.width), 0));
    var moveActionSequence = cc.sequence(moveAction, cc.callFunc(function() {
      self.destroy();
    }));
    this.runAction(rotateAction);
    this.runAction(moveActionSequence);
  },
  destroy: function() {
    this.removeFromParent(true);
  }
});

Cloud.create = function() {
  var cloud = new Cloud();
  var minHeight = 500
  cloud.attr({
    x: visibleRect.width + cloud._contentSize.width / 2,
    y: random(minHeight, visibleRect.height)
  });
  g_sharedGameLayer.addChild(cloud);
  return cloud;
};