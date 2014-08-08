var addListener = function(listener, target) {
  if ('touches' in cc.sys.capabilities) {
    cc.eventManager.addListener({
      event: cc.EventListener.TOUCH_ALL_AT_ONCE,
      onTouchBegan: listener
    }, target);
  } else if ('mouse' in cc.sys.capabilities)
    cc.eventManager.addListener({
      event: cc.EventListener.MOUSE,
      onMouseDown: listener
    }, target);
};

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