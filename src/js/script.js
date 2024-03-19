const GAME_TIME = 30;
const GAME_MESSAGE_WIN = 'You Win';
const GAME_MESSAGE_LOST = 'YOU LOST';
const GAME_TIME_SHOW_MESSAGE = 5;
const GAME_STATUS_DEFAULT = 0;


let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const clientWidth = document.documentElement.clientWidth;
const clientHeight = document.documentElement.clientHeight;
// chi tỉ lệ item
const area = clientWidth * clientHeight;
const ratio = Math.sqrt(area / 300);
//Import ảnh
const player = importImage('./src/images/linh_vat_topi.png');
const hook = importImage('./src/images/hook.png');
const background = importImage('./src/images/background.png');
const imageGold = importImage('./src/images/dong_xu.svg', 1.5 * ratio, 1.5 * ratio);
const imageRock = importImage('./src/images/da_nho.svg', 1.5 * ratio, 1.5 * ratio);
const imageBigRock = importImage('./src/images/da_to.svg', 1.8 * ratio, 1.8 * ratio);
const imageBagGold = importImage('./src/images/tui_tien.png', ratio, ratio);
const imagePotGold = importImage('./src/images/hu_vang.svg', 2 * ratio, 2 * ratio);
const imageClock = importImage('./src/images/clock.svg', 2 * ratio, 2 * ratio);

const random = (min, max) => Math.random() * (max - min - 1) + min;

class Matter { // Vật phẩm: vàng đá, tiền, túi vàng
    constructor(game, x, y, width, height) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.show = true;
        this.weighty = 100;
        this.price = 100;
        this.image = null;
        this.isPulling = false;
    }

    update() {
        if (this.isPulling) {
            this.x = this.game.hook.x - this.width / 2;
            this.y = this.game.hook.y - this.height / 2;
        }
    }

    draw(context) {
        if (this.game.debug) {
            context.strokeRect(this.x, this.y, this.width, this.height);
        }
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Gold extends Matter {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height);
        this.price = 100;
        this.weighty = 3;
        this.image = imageGold;
    }
}

class Rock extends Matter {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height);
        this.price = 50;
        this.weighty = 8;
        this.image = imageRock;
    }
}

class BigRock extends Matter {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height);
        this.price = 50;
        this.weighty = 10;
        this.image = imageBigRock;
    }
}

class BagGold extends Matter {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height);
        this.price = 100;
        this.weighty = 2;
        this.image = imageBagGold;
    }
}

class PotGold extends Matter {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height);
        this.price = 300;
        this.weighty = 4;
        this.image = imagePotGold;
    }
}

class Input {
    constructor(game) {
        this.game = game;
        document.addEventListener('click', (event) => {
            if (this.game.player.pulling === 0 && this.game.status === 0) {
                this.game.player.updatePulling(1);
            }

            let x = event.pageX - canvas.offsetLeft;
            let y = event.pageY - canvas.offsetTop;

            if (this.game.buttonPlayAgain.isShow && this.game.buttonPlayAgain.isClick(x, y)) {
                this.game.refresh();
            }

        });

        window.addEventListener('keydown', (e) => {
            let key = e.key;
            if (key === 'd') {
                this.game.debug = !this.game.debug;
            }

        });
    }
}

class Hook {
    constructor(game) {
        this.game = game;
        this.width = this.game.getWidth() / 2;
        this.height = this.game.getWidth() / 2;
        this.x = this.game.player.x + this.game.player.width / 2 - this.width / 2;
        this.y = this.game.player.y + this.game.player.height + this.game.rope.length;
        this.show = true;

    }

    update(time = 0) {
        let radian = this.game.player.angle * Math.PI / 180;
        this.x = this.game.rope.x + this.game.rope.length * Math.cos(radian);
        this.y = this.game.rope.y + this.game.rope.length * Math.sin(radian);
    }

    draw(context) {
        context.save();
        context.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.game.debug) {
            context.strokeRect(-this.game.getWidth() / 4, -this.game.getWidth() / 8, this.game.getWidth() / 2, this.game.getWidth() / 2);
            context.strokeRect(0, 0, 10, 10);
            context.fillText(this.game.player.angle * Math.PI / 180 + '', 0, 0,)
        }

        if (this.show) {
            context.save();
            // context.translate(this.x + this.width / 2, this.y + this.height / 2);
            context.rotate((this.game.player.angle - 90) * Math.PI / 180);
            context.translate(-this.width / 2, -this.height / 2);
            context.drawImage(hook, -this.game.getWidth() / 4 + this.width / 2, -this.game.getWidth() / 8 + this.height / 2, this.game.getWidth() / 2, this.game.getWidth() / 2);
            context.restore();
            context.translate(0, 0);
        }
        context.restore();
        context.translate(0, 0);
    }
}

class Rope {
    constructor(game) {
        this.game = game;
        //toạ độ điểm đầu của đoạn dây
        this.x = this.game.player.x + this.game.player.width / 2;
        this.y = this.game.player.y + this.game.player.height / 1.5;
        // chiều dài đoạn dây
        this.lengthDefault = this.game.player.width * 2 / 3;
        this.length = this.lengthDefault;
        this.isShow = true;
    }

    update(time = 0) {
        let matter = this.game.matters.find(matter => matter.isPulling);
        if (matter) {
            this.length += this.game.player.pulling * this.game.player.speed / matter.weighty;
        } else {
            this.length += this.game.player.pulling * this.game.player.speed;
        }
    }

    draw(context) {
        if (this.game.debug) {
            context.strokeRect(this.x, this.y, 10, 10);
        }

        if (this.isShow) {
            context.save();
            context.beginPath();
            context.strokeStyle = "#3E3E3E";
            context.lineWidth = Math.floor(this.game.player.width / 50);
            context.moveTo(this.x, this.y);
            context.lineTo(this.game.hook.x + this.game.hook.width / 2, this.game.hook.y + this.game.hook.height / 4);
            context.stroke();
            context.restore();
        }
    }
}

class Game {
    constructor(width, height) {
        this.debug = false;

        this.width = width;
        this.height = height;

        this.score = 0;
        this.increaseScore = 0;
        this.increaseScoreTime = 0;
        this.time = GAME_TIME;

        this.maxMatter = 10;
        this.numGold = 3;
        this.numRock = 3;
        this.numBigRock = 3;
        this.numBagGold = 1;

        this.status = GAME_STATUS_DEFAULT; //0: đang chơi 1:chiến thắng -1:thua
        this.messageWin = GAME_MESSAGE_WIN;
        this.messageLost = GAME_MESSAGE_LOST;
        this.timeShowMessage = GAME_TIME_SHOW_MESSAGE;
        this.messageTime = 0;
        this.level = 0;

        this.ui = new UI(this);
        this.player = new Player(this);
        this.matters = this.addMatters();
        this.rope = new Rope(this);
        this.hook = new Hook(this);
        this.input = new Input(this);
        this.buttonPlayAgain = new Button(this, this.width / 2, this.height / 2, 'Play Again', '#000', '#fff', 10, 10, 20, false);

    }

    update(time) {
        this.checkStatus(time);
        this.updateTime(time);
        this.updateTimeIncreaseScore(time);
        this.ui.update(time);
        this.matters.forEach(matter => matter.update());
        this.player.update(time);
        this.rope.update();
        this.hook.update();
        this.updatePulling();

    }

    draw(context) {
        this.ui.draw(context);
        this.player.draw(context);
        this.rope.draw(context);
        this.hook.draw(context);
        this.matters.forEach(matter => matter.draw(context));
        this.ui.drawMessage(context);
        // this.ui.drawPlayAgain(context);
        this.buttonPlayAgain.draw(context);
    }

    updateTime(time) {
        if (this.status === 0) {
            this.time -= time / 1000;
        }
    }

    updateTimeIncreaseScore(time) {
        if (this.increaseScore) {
            this.increaseScoreTime += time;
        }

        if (this.increaseScoreTime / 1000 > 2) {
            this.increaseScore = 0;
            this.increaseScoreTime = 0;
        }
    }

    addMatters() {
        let matters = [];
        let numGold = 0;
        let numRock = 0;
        let numBigRock = 0;
        let numBagGold = 0;
        let count = 0;

        matters[0] = new PotGold(
            this,
            this.width / 2 - imagePotGold.width / 2,
            this.height - imagePotGold.height,
            imagePotGold.width,
            imagePotGold.height
        );

        while (matters.length < this.maxMatter - 1) {
            let matterTemp = null;
            if (numRock < this.numRock) {
                matterTemp = new Rock(
                    this,
                    random(10, this.width - imageRock.width - 10),
                    random(this.height * 0.45, this.height * 0.90),
                    imageRock.width,
                    imageRock.height
                );
                numRock++;
            } else if (numBigRock < this.numBigRock) {
                matterTemp = new BigRock(
                    this,
                    random(10, this.width - imageBigRock.width - 10),
                    random(this.height * 0.45, this.height * 0.90),
                    imageBigRock.width,
                    imageBigRock.height
                );
                numBigRock++;
            } else if (numGold < this.numGold) {
                matterTemp = new Gold(
                    this,
                    random(10, this.width - imageGold.width - 10),
                    random(this.height * 0.45, this.height * 0.90),
                    imageGold.width,
                    imageGold.height
                );
                numGold++;
            } else if (numBagGold < this.numBagGold) {
                matterTemp = new BagGold(
                    this,
                    random(10, this.width - imageBagGold.width - 10),
                    random(this.height * 0.45, this.height * 0.90),
                    imageBagGold.width,
                    imageBagGold.height
                );
                numBagGold++;
            }

            if (!!matterTemp && !matters.filter(matter => this.checkCollision(matter, matterTemp)).length) {
                matters.push(matterTemp);
            }
            if (count > 1000) {
                break;
            }
            count++;
        }

        return matters;
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    updatePulling() {
        if (this.hook.y > this.height) {
            this.player.updatePulling(-1);
        }

        if (this.hook.x > this.width || this.hook.x < 0) {
            this.player.updatePulling(-1);
        }

        let radian = this.player.angle * Math.PI / 180;
        let temp = this.rope.y + this.rope.lengthDefault * Math.sin(radian);

        if (this.hook.y < temp) {
            this.player.updatePulling(0);
            this.rope.length = this.rope.lengthDefault;
        }

        // Xử lý khi kéo trúng
        this.matters.every((matter, index) => {
            if (this.checkCollision(matter, this.hook)) {
                this.player.updatePulling(-1);
                matter.isPulling = true;
                this.hook.show = false;
                if (this.rope.length === this.rope.lengthDefault) {
                    this.score += matter.price;
                    this.hook.show = true;
                    this.matters.splice(index, 1);
                    this.increaseScore = matter.price;
                }
                return false;
            }
            return true;
        });

    }

    getWidth() {
        return ratio;
    }

    checkStatus(time) {
        if (Math.round(this.timeShowMessage - this.messageTime) <= 0 && this.status === 1) {
            this.nextLevel(time);
            return;
        }

        if (!this.matters.length || this.time <= 0 || this.checkWin()) {
            this.status = this.time <= 0 ? -1 : 1;
            if (this.messageTime < this.timeShowMessage) {
                this.messageTime += time / 1000;
            }
        }

    }

    refresh(time) {
        this.time = GAME_TIME;
        this.status = 0;
        this.messageTime = 0;
        this.score = 0;
        this.matters = this.addMatters();
        this.hook.show = true;

        this.player.speed = 5;
        this.player.angle = 0;
        this.player.coordinates = 0.7;
        this.player.pulling = 0;
    }

    nextLevel(time) {
        this.level++;
        this.status = 0;
        this.messageTime = 0;
        this.time = GAME_TIME - (this.level * 2);
        this.matters = this.addMatters();
        this.player.speed -= 0.5;
        this.player.coordinates += 0.2
    }

    checkWin() {
        return !this.matters.filter(item => ['Gold', 'BagGold', 'PotGold'].includes(item.constructor.name)).length;
    }
}

class Player {
    constructor(game) {
        this.game = game;

        const heightContain = (370 * window.innerHeight) / 1000;
        const padding = heightContain * 6 / 300;
        this.height = heightContain * 203 / 300;
        this.width = this.height * 125 / 203;

        this.x = (window.innerWidth - this.width) / 2;
        this.y = heightContain - this.height - padding;
        // Tốc độ kéo thả của nhan vật
        this.speed = 5;

        //Góc kéo
        this.angle = 0;
        this.coordinates = 0.7;
        this.pulling = 0; // 0:dây đứng im, 1: thả dây, -1 kéo dây

    }

    update(time) {
        if (this.angle > 160) {
            this.coordinates = -Math.abs(this.coordinates);
        }
        if (this.angle < 30) {
            this.coordinates = Math.abs(this.coordinates);
        }
        if (this.pulling === 0) {
            this.angle += this.coordinates;
        }


    }

    draw(context) {
        if (this.game.debug) {
            context.strokeRect(this.x, this.y, this.width, this.height);
        }

        context.drawImage(player, this.x, this.y, this.width, this.height);
    }

    updatePulling(value) {
        this.pulling = value;
    }

}

class UI {
    constructor(game) {
        this.game = game;
        this.background = background;
        this.showButtonPlayAgain = false;
    }

    update(time) {
        this.game.buttonPlayAgain.isShow = this.game.status === -1
    }

    draw(context) {
        context.drawImage(
            this.background,
            (this.background.width - canvas.width * (this.background.height / canvas.height)) / 2,
            0,
            canvas.width * (this.background.height / canvas.height),
            this.background.height,
            0,
            0,
            canvas.width,
            canvas.height
        );
        this.drawScore(context);
        this.drawTime(context);
    }

    drawScore(context) {
        context.save();
        context.font = '30px Montserrat';

        let measureText = context.measureText(this.game.score);
        let textWidth = measureText.width + 10;
        let textHeight = measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent;
        let width = textWidth + 50;
        let height = textHeight + 20;
        let goldHeight = textHeight + 10;
        let x = this.game.width / 25;
        let y = this.game.height / 9;

        context.translate(x, y);
        this.drawRoundRect(context, 0, 0, width, height, 50, '#535B3A', 0.5);
        // context.stroke();

        context.drawImage(imageGold, 10, (height - goldHeight) / 2, goldHeight, goldHeight);

        context.fillStyle = '#fff';
        context.fillText(this.game.score, (height - textHeight) + textHeight + 10, ((height - textHeight) / 2) + 20);

        if (this.game.increaseScore > 0) {
            context.fillStyle = '#00AC5D';
            context.fillText('+' + this.game.increaseScore, (height - textHeight), ((height - textHeight) / 2) + 60);
        }
        context.restore();
    }

    drawTime(context) {
        context.save();
        context.font = '30px Montserrat';

        let time = Math.round(this.game.time) + 's';
        let measureText = context.measureText(time);
        let textWidth = measureText.width + 10;
        let textHeight = measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent;
        let width = textWidth + 50;
        let height = textHeight + 20;
        let goldHeight = textHeight + 10;

        let x = this.game.width / 25 * 24 - width;
        let y = this.game.height / 9;

        context.translate(x, y);
        this.drawRoundRect(context, 0, 0, width, height, 50, '#535B3A', 0.5);
        // context.stroke();

        context.drawImage(imageClock, 10, (height - goldHeight) / 2, goldHeight, goldHeight);

        context.fillStyle = '#fff';
        context.fillText(time, (height - textHeight) + textHeight + 10, ((height - textHeight) / 2) + 20);
        context.restore();
    }

    drawRoundRect(ctx, x, y, width, height, radius, color, opacity) {
        context.save();
        let cornerRadius = Math.min(width, height) * radius / 100;
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.arcTo(x + width, y, x + width, y + height, cornerRadius);
        ctx.arcTo(x + width, y + height, x, y + height, cornerRadius);
        ctx.arcTo(x, y + height, x, y, cornerRadius);
        ctx.arcTo(x, y, x + width, y, cornerRadius);
        ctx.closePath();
        // Thiết lập màu và độ mờ cho fill
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.fill();
        context.restore();
    }

    drawMessage(context) {
        if (this.game.status === 0) {
            return;
        }

        context.save();
        context.font = '50px Montserrat';
        context.fillStyle = '#FFF';
        let message = this.game.status > 0 ? this.game.messageWin : this.game.messageLost;
        let measureText = context.measureText(message);
        let textWidth = measureText.width + 10;
        let textHeight = measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent;
        context.fillText(message, this.game.width / 2 - textWidth / 2, this.game.height / 2 - textHeight / 2)

        if (this.game.status > 0) {
            measureText = context.measureText(this.game.timeShowMessage);
            textWidth = measureText.width + 10;
            textHeight += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent;
            message = '' + Math.round(this.game.timeShowMessage - this.game.messageTime);
            context.fillText(message, this.game.width / 2 - textWidth / 2, this.game.height / 2 + textHeight);
        }
        context.restore();
    }
}

class Button {
    constructor(game, x, y, label, color, backgroundColor, paddingX = 5, paddingY = 5, borderRadius, isShow = false) {
        this.game = game;
        this.label = label;
        this.color = color;
        this.backgroundColor = backgroundColor;
        this.borderRadius = borderRadius;
        this.x = x;
        this.y = y;
        this.width = 0;
        this.height = 0;
        this.isShow = isShow;
        this.paddingX = paddingX;
        this.paddingY = paddingY;
    }

    update(time) {

    }

    draw(context) {
        if (this.isShow) {
            context.save();
            context.font = '20px Montserrat';
            context.fillStyle = this.color;

            let measureText = context.measureText(this.label);
            this.width = measureText.width;
            this.height = measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent;

            context.strokeStyle = this.backgroundColor;
            context.fillStyle = this.backgroundColor;
            context.beginPath();
            context.roundRect(
                this.x - this.width / 2 - this.paddingX * 2,
                this.y,
                this.width + this.paddingX * 2,
                this.height + this.paddingY * 2,
                this.borderRadius
            );
            context.stroke();
            context.fill();
            context.strokeStyle = '#000';
            if (this.game.debug) {
                context.strokeRect(this.x - this.width / 2 - this.paddingX * 2, this.y, this.width + this.paddingX * 2, this.height + this.paddingY * 2)
            }


            context.fillStyle = this.color;
            context.fillText(this.label, this.x - this.width / 2 - this.paddingX, this.y + this.paddingY + this.height);

            if (this.game.debug) {
                context.strokeStyle = '#000';
                context.strokeRect(this.x - this.width / 2 - this.paddingX,
                    this.y + this.paddingY,
                    this.width,
                    this.height)
            }
            context.restore();
        }
    }

    isClick(x, y) {
        return x >= (this.x - this.width / 2 - this.paddingX * 2) && x <= this.x + this.width / 2 + this.paddingX && y >= this.y - this.paddingY && y <= this.y + this.height + this.paddingY * 2
    }
}

// 744 x 1133
function importImage(link, width = null, height = null) {
    let image = new Image();
    if (width && height) {
        image = new Image(width, height);
    }
    image.src = link;
    return image;
}

let game = new Game(canvas.width, canvas.height);
let lastTime = 0;

function animation(timestamp) {
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    context.clearRect(0, 0, game.width, game.height);
    game.update(deltaTime);
    game.draw(context);
    requestAnimationFrame(animation);
}

animation(0);