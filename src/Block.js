var block_layer_tag = 61;

var BlockLayer = cc.Layer.extend({
  ctor: function() {
    this._super();
    this.setTag(block_layer_tag);
    this.blocks = [];
    this.blocksAttr = [];
    this.blockIndex = 0;
    this.colorIndex = 0;

    var color = Color.random();
    this.initBlocks();
    var blockAttr = {color: color, y: 0, allow: true};
    var firstBlock = this.addBlock(blockAttr, cc.PointZero());
    this.blocks.push(firstBlock);
    var tailPoint;
    this.lastBlock = this.blocks[this.blocks.length - 1];
    do {
      tailPoint = this.lastBlock.getPosition();
      this.addTailBlock(blockAttr);
    } while (tailPoint.x < visibleRect.width);

    return this;
  },
  initBlocks: function() {
    for (var i = 0; i < 10; i++) {
      for (var j = 0; j < 15; j++) {
        var color, allow, y = 0, colors = Color.colors;
        var blockIndex = i * 15 + j;
        if (blockIndex < 2) {
          color = colors[0];
          allow = true;
        }
        else {
          var b1 = this.blocksAttr[blockIndex - 2].allow;
          var b2 = this.blocksAttr[blockIndex - 1].allow;
          if (!b1 && !b2) {
            allow = true;
          } else if (b1 && b2) {
            allow = random(0, 6) < 3;
          } else if ((b2 && !b1) || (!b2 && b1)) {
            allow = random(0, 1);
          }

          if (allow) {
            color = colors[random(0, i)];
          } else {
            color = colors[random(i + 1, colors.length - 1)];
          }

          y = random(-120, 120);
        }

        this.blocksAttr.push({y: y, color: color, allow: allow});
      }
    }
  },
  addBlock: function(blockAttr, point) {
    var block = new Block();
    var blockSize = block.getContentSize();
    block.attr({x: point.x + blockSize.width / 2, y: point.y});
    block.setAttr(blockAttr);
    if (block.attr.allow) {

    }
    this.addChild(block);
    return block;
  },
  addTailBlock: function(blockAttr) {
    var tailPoint = this.lastBlock.getPosition();
    var blockSize = this.lastBlock.getContentSize();
    var block = this.addBlock(blockAttr, cc.p(tailPoint.x + blockSize.width / 2, blockAttr.y))
    this.blocks.push(block);
    this.lastBlock = this.blocks[this.blocks.length - 1];
    return block;
  },
  moveBlocks: function(duration) {
    this._moveActionTag = 30;
    this.stopActionByTag(this._moveActionTag);
    var self = this;
    var moveAction = cc.moveBy(duration, cc.p(-204, 0));

    var repeatForever = cc.repeatForever(
      cc.sequence(moveAction, cc.callFunc(function() {
        self.moveBlocksDone();
      })));
    repeatForever.setTag(this._moveActionTag);
    this.runAction(repeatForever);
  },
  moveBlocksDone: function(block) {
    var state = g_sharedGameLayer.getGameState();
    if (state == game_state.ready) {
      this.addTailBlock(this.blocksAttr[0]);
    } else if (state == game_state.begin) {
      this.addTailBlock(this.blocksAttr[this.blockIndex++]);
      if (this.blockIndex < this.blocksAttr.length) {
        this.colorIndex++;
        this.addColorDot();
      } else {
        g_sharedGameLayer.setGameState(game_state.end);
      }
    } else if (state == game_state.end) {

    }
    this.cleanupFirstBlock();
  },
  cleanupFirstBlock: function() {
    var count = this.blocks.length;
    for (var i = 0; i < count - 1; i++) {
      var point = this.convertToWorldSpace(this.blocks[i].getPosition());
      var size = this.blocks[i].getContentSize();
      if (point.x < -size.width) {
        this.removeChild(this.blocks[i]);
        this.blocks.shift();
      } else {
        break;
      }
    }
  },
  addColorDot: function() {
    g_sharedGameLayer.addColorDot(Color.colors[this.colorIndex]);
  }
});


var Block = cc.Sprite.extend({
  ctor: function() {
    this._super(res.s_block_top, cc.rect(26, 30, 204, 482));
    return this;
  },
  setAttr: function(attr) {
    this.y = attr.y;
    this.color = attr.color;
    this.allow = attr.allow;
    this.setColor(this.color);
    cc.log(attr);
  }
});