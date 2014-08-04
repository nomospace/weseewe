var Color = {
  colors: [
    cc.color(167, 175, 179),
    cc.color(0, 204, 102),
    cc.color(255, 153, 153),
    cc.color(96, 98, 128),
    cc.color(242, 48, 85),
    cc.color(145, 57, 153),
    cc.color(255, 102, 51),
    cc.color(255, 255, 204),
    cc.color(51, 204, 204),
    cc.color(255, 204, 51),
    cc.color(189, 116, 52)
  ],
  random: function() {
    var length = this.colors.length;
    var index = Math.floor(random(0, length));
    return this.colors[index];
  }
}