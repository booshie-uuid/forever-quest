class SpritePickerGUI
{
    constructor(biome)
    {
        this.biome = biome;

        this.symbols = ["#", "%", "~", "@", "A", "B", "C", "D", "E", "F"];
        this.selectedSymbol = 1;
        this.currentVariant = 0;

        this.controlSize = 36;
        this.controlPadding = 8;

        this.spriteVariants = 16;
        this.spriteButtonSize = 36;

        this.width = (this.spriteButtonSize * this.spriteVariants) + 2 * (this.controlSize + this.controlPadding);
        this.height = this.spriteButtonSize;

        this.screenX = Math.floor((GAME.gfx.main.canvas.width / 2) - (this.width / 2));
        this.screenY = GAME.gfx.main.canvas.height - this.height - 40;
    }

    update()
    {
        this.draw();
    }

    handleClick(x, y)
    {
        const leftDrawX = this.screenX;
        const leftDrawY = this.screenY;

        const rightDrawX = this.screenX + this.width - this.controlSize;
        const rightDrawY = this.screenY;

        if(x >= leftDrawX && x <= leftDrawX + this.controlSize && y >= leftDrawY && y <= leftDrawY + this.controlSize)
        {
            this.selectedSymbol = Number.limit(this.selectedSymbol - 1, 1, 15);
        }
        else if(x >= rightDrawX && x <= rightDrawX + this.controlSize && y >= rightDrawY && y <= rightDrawY + this.controlSize)
        {
            this.selectedSymbol = Number.limit(this.selectedSymbol + 1, 1, 15);
        }
        else
        {
            const controlOffset = this.controlSize + this.controlPadding;

            for(let variant = 0; variant < this.spriteVariants; variant++)
            {
                const drawX = controlOffset + this.screenX + (variant * this.spriteButtonSize);
                const drawY = this.screenY;

                if(x >= drawX && x <= drawX + this.spriteButtonSize && y >= drawY && y <= drawY + this.spriteButtonSize)
                {
                    this.currentVariant = variant;
                    break;
                }
            }
        }
    }

    draw()
    {
        this.drawControls();
        this.drawSpriteBar();
        this.drawHighlight();
        this.drawMessages();
    }

    drawControls()
    {
        const leftDrawX = this.screenX;
        const leftDrawY = this.screenY;

        GAME.gfx.main.drawRectangle(leftDrawX, leftDrawY, this.controlSize, this.controlSize, "#566c86");
        GAME.gfx.main.drawTriangle(leftDrawX + (this.controlSize / 2) - 8, leftDrawY + (this.controlSize / 2), leftDrawX + (this.controlSize / 2) + 5, leftDrawY + (this.controlSize / 2) - 10, leftDrawX + (this.controlSize / 2) + 5, leftDrawY + (this.controlSize / 2) + 10, "#333c57");

        const rightDrawX = this.screenX + this.width - this.controlSize;
        const rightDrawY = this.screenY;

        GAME.gfx.main.drawRectangle(rightDrawX, rightDrawY, this.controlSize, this.controlSize, "#566c86");
        GAME.gfx.main.drawTriangle(rightDrawX + (this.controlSize / 2) + 8, rightDrawY + (this.controlSize / 2), rightDrawX + (this.controlSize / 2) - 5, rightDrawY + (this.controlSize / 2) - 10, rightDrawX + (this.controlSize / 2) - 5, rightDrawY + (this.controlSize / 2) + 10, "#333c57");
    }

    drawSpriteBar()
    {
        const controlOffset = this.controlSize + this.controlPadding;

        for(let variant = 0; variant < this.spriteVariants; variant++)
        {
            const drawX = controlOffset + this.screenX + (variant * this.spriteButtonSize);
            const drawY = this.screenY;

            GAME.gfx.main.drawRectangleOutline(drawX, drawY, this.spriteButtonSize, this.spriteButtonSize, "#566c86", 2);

            const spriteX = 34 + (variant * 33);
            const spriteY = 1 + (this.selectedSymbol * 33);
            
            const texture = GAME.textures.getTexture("map");

            GAME.gfx.main.drawSprite(texture, spriteX, spriteY, drawX + 2, drawY + 2, 32, 32);
        }
    }

    drawHighlight()
    {
        const controlOffset = this.controlSize + this.controlPadding;

        const drawX = controlOffset + this.screenX + (this.currentVariant * this.spriteButtonSize);
        const drawY = this.screenY;

        GAME.gfx.main.drawRectangleOutline(drawX, drawY, this.spriteButtonSize, this.spriteButtonSize, "#ef7d57", 2);
    }

    drawMessages()
    {
        if(this.selectedSymbol == 4 && this.currentVariant > 7)
        {
            const message = "ONLY SHOWN WHEN HORIZONTAL";
            const messageSize = GAME.gfx.main.measureText(message, 12, true);
            
            const drawX = this.screenX + (this.width / 2) - (messageSize.width / 2);
            const drawY = this.screenY + this.spriteButtonSize + 10;

            GAME.gfx.main.write(message, drawX, drawY, 12, "#b13e53", true);
        }
    }

}