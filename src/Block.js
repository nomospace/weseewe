var block_layer_tag = 102;
var grabable_mask_bit = 1 << 31;
var not_grabable_mask = ~grabable_mask_bit;

var BlockLayer = cc.Layer.extend({
  ctor: function(parent) {
    this._super();
    this.setTag(block_layer_tag);
    this.blocks = [];
    this.blocksAttr = [];
    this.blockIndex = 0;
    this.colorIndex = 0;
    this.gameLayer = parent;

    var color = Color.random();
    this.initBlocksAttr();
    var blockAttr = {color: color, y: 0, allow: true};
    var firstBlock = this.addBlock(blockAttr, cc.PointZero(), this.gameLayer.space);
    this.blocks.push(firstBlock);
    var tailPoint;
    this.lastBlock = this.blocks[this.blocks.length - 1];
    do {
      tailPoint = this.lastBlock.getPosition();
      this.addTailBlock(blockAttr);
    } while (tailPoint.x < visibleRect.width);

    return this;
  },
  initBlocksAttr: function() {
    for (var i = 0; i < 10; i++) {
      for (var j = 0; j < 15; j++) {
        var color, allow, y = 0, colors = Color.colors;
        var blockIndex = i * 15 + j;
        if (blockIndex < 2) {
          color = colors[0];
          allow = true;
        } else {
          var b1 = this.blocksAttr[blockIndex - 2]._allow;
          var b2 = this.blocksAttr[blockIndex - 1]._allow;
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
  addBlock: function(attr, point, space) {
    var block = new Block(attr, point, space);
    this.addChild(block);
    return block;
  },
  addTailBlock: function(blockAttr) {
    var tailPoint = this.lastBlock.getPosition();
    var size = this.lastBlock.getContentSize();
    cc.log(blockAttr.y);
    var block = this.addBlock(blockAttr, cc.p(tailPoint.x + size.width / 2, blockAttr.y), this.gameLayer.space);
    this.blocks.push(block);
    this.lastBlock = this.blocks[this.blocks.length - 1];
    return block;
  },
  moveBlocks: function(duration) {
    this._moveActionTag = 30;
    this.stopActionByTag(this._moveActionTag);
    var moveAction = cc.moveBy(duration, cc.p(-204, 0));
    var repeatForever = cc.repeatForever(cc.sequence(moveAction, cc.callFunc(this.moveBlocksDone.bind(this))));
    repeatForever.setTag(this._moveActionTag);
    this.runAction(repeatForever);
  },
  moveBlocksDone: function(block) {
    var state = this.gameLayer.getGameState();
    if (state == game_state.ready) {
      this.addTailBlock(this.blocksAttr[0]);
    } else if (state == game_state.begin) {
      this.addTailBlock(this.blocksAttr[this.blockIndex++]);
      if (this.blockIndex < this.blocksAttr.length) {
        this.colorIndex++;
        this.addColorDot();
      } else {
        this.gameLayer.setGameState(game_state.end);
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
    this.gameLayer.addColorDot(Color.colors[this.colorIndex]);
  }
});

var Block = cc.PhysicsSprite.extend({
  ctor: function(attr, point, space) {
    this._super(res.s_block_top, cc.rect(26, 30, 204, 482));
    this.space = space;
    this.blockSize = this.getContentSize();
    this.initBody(attr, point);
    this.initShape();
    this.setAttr(attr);
    this.setPosition(cc.p(point.x + this.blockSize.width / 2, point.y));
  },
  initBody: function(attr, point) {
    console.log(point, "point");
    this.body = new cp.StaticBody();
    body.setPos(point);
    this.setBody(this.body);
  },
  initShape: function() {
    this.shape = new cp.BoxShape(this.body, this.blockSize.width, this.blockSize.height);
    this.shape.setCollisionType(SpriteTag.block);
    this.shape.setSensor(true);
    this.space.addStaticShape(this.shape);
//    this.body.setUserData(this);
  },
  setAttr: function(attr) {
    this._y = attr.y;
    this._color = attr.color;
    this._allow = attr.allow;
    this.setColor(this._color);
  }
});