var block_layer_tag = 102;
var grabable_mask_bit = 1 << 31;
var not_grabable_mask = ~grabable_mask_bit;

var BlockLayer = cc.Layer.extend({
  ctor: function() {
    this._super();
    this.setTag(block_layer_tag);
    this.blocks = [];
    this.blocksAttr = [];
    this.blockIndex = 0;
    this.colorIndex = 0;

    var color = Color.random();
    this.initBlocksAttr();
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
  addBlock: function(blockAttr, point) {
    var block = new Block();
    var size = block.getContentSize();
//    console.log(size, point);
//    console.log(point.x, size.height, point.x + size.width / 2);
//    if (block._allow) {
    var body = new cp.Body(1, cp.momentForBox(1, size.width, size.height));
    var space = g_sharedGameLayer.space;
//    space.addBody(body);
//    var shape = new cp.BoxShape(body, size.width, size.height);
//    shape.setElasticity(0.5);
//    shape.setFriction(0.5);
//    shape.setCollisionType(1);
//    space.addShape(shape);
    block.setBody(body);
    var staticBody = space.staticBody;
    console.log(point, "point")
    var borders = [ new cp.SegmentShape(staticBody, cp.v(point.x, point.y + size.height / 2), cp.v(point.x + size.width, point.y + size.height / 2), 0),	// top
      new cp.SegmentShape(staticBody, cp.v(point.x, 0), cp.v(point.x, point.y + size.height / 2), 0),				// left
      new cp.SegmentShape(staticBody, cp.v(point.x + size.width, 0), cp.v(point.x + size.width, point.y + size.height / 2), 0)				// right
    ];
    for (var i = 0; i < borders.length; i++) {
      var border = borders[i];
      border.setElasticity(1);
      border.setFriction(1);
      border.setCollisionType(1);
      space.addStaticShape(border);
    }
//    }
    block.setPosition(cc.p(point.x + size.width / 2, point.y));
    block.setAttr(blockAttr);
    this.addChild(block);
    return block;
  },
  addTailBlock: function(blockAttr) {
    var tailPoint = this.lastBlock.getPosition();
    var size = this.lastBlock.getContentSize();
    cc.log(blockAttr.y);
    var block = this.addBlock(blockAttr, cc.p(tailPoint.x + size.width / 2, blockAttr.y));
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

var Block = cc.PhysicsSprite.extend({
  ctor: function() {
    this._super(res.s_block_top, cc.rect(26, 30, 204, 482));
  },
  setAttr: function(attr) {
    this._y = attr.y;
    this._color = attr.color;
    this._allow = attr.allow;
    this.setColor(this._color);
  }
});