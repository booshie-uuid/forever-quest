// MODULE:     gfx.js
// DESC:     Basic HTML5 canvas/graphics wrapper.
// AUTHOR:     matt@matthewlynch.net
// CREATED:    2017-10-30
// UPDATED: 2024-07-09

class GFX
{
    constructor(canvasId, width, height, errorHandler)
    {
        this.isReady = false;
        this.isFaulted = false;

        this.error = errorHandler || console.log;
        this.canvas = document.getElementById(canvasId);
        
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = (this.canvas !== null && typeof this.canvas.getContext === "function")? this.canvas.getContext('2d'): null;

        // error out if the display context could not be retrieved
        this.isFaulted = (this.context === null);
        if(this.isFaulted) return;

        this.isReady = true;
    }


    clear()
    {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    fillBackground(colour)
    {    
        this.context.fillStyle = colour;
        this.context.fillRect(0, 0, this.width, this.height);
    }

    drawLine(x1, y1, x2, y2, width, colour)
    {
        this.context.beginPath();
        this.context.translate(0.5,0.5);
        this.context.lineCap = "square";
        this.context.lineWidth = width;
        this.context.fillStyle = colour;
        this.context.strokeStyle = colour;
        this.context.moveTo(x1,y1);
        this.context.lineTo(x2,y2);
        this.context.stroke();
        this.context.translate(-0.5,-0.5);
    }

    drawRectangle(x, y, w, h, fillColour)
    {
        this.context.lineCap = "square";
        this.context.lineWidth = 0;
        this.context.fillStyle = fillColour;
        this.context.strokeStyle = fillColour;
        this.context.fillRect(x, y, w, h);
        this.context.stroke();
    }

    drawRoundedRectangle(x, y, width, height, radius, strokeStyle, fill, fillStyle)
    {
        this.context.beginPath();
        this.context.moveTo(x, y + radius);
        this.context.lineTo(x, y + height - radius);
        this.context.arcTo(x, y + height, x + radius, y + height, radius);
        this.context.lineTo(x + width - radius, y + height);
        this.context.arcTo(x + width, y + height, x + width, y + height-radius, radius);
        this.context.lineTo(x + width, y + radius);
        this.context.arcTo(x + width, y, x + width - radius, y, radius);
        this.context.lineTo(x + radius, y);
        this.context.arcTo(x, y, x, y + radius, radius);
        
        this.context.strokeStyle = strokeStyle;
        this.context.stroke();
    
        if(fill)
        {
            this.context.fillStyle = fillStyle;
            this.context.fill();
        }
    }

    drawCircle(posX, posY, radius, fillColour, strokeWidth, strokeColour)
    {
        strokeWidth = strokeWidth || 0;
        strokeColour = strokeColour || "#000000";
        
        this.context.beginPath();
        this.context.arc(posX, posY, radius, 0, 2 * Math.PI, false);
        this.context.fillStyle = fillColour;
        this.context.fill();
        
        if(strokeWidth > 0)
        {
            this.context.lineWidth = strokeWidth;
            this.context.strokeStyle = strokeColour;
            this.context.stroke();
        }
    }
    
    drawTriangle(x1, y1, x2, y2, x3, y3, colour)
    {
        this.context.fillStyle = colour;
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.lineTo(x3, y3);
        this.context.closePath();
        this.context.fill();
    }
    
    drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, colour)
    {
        this.context.fillStyle = colour;
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.lineTo(x3, y3);
        this.context.lineTo(x4, y4);
        this.context.closePath();
        this.context.fill();
    }

    write(text, posX, posY, fontSize, fontColour)
    {
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
        this.context.fillStyle = fontColour;
        this.context.font = fontSize + "px Arial";
        this.context.fillText(text, posX, posY);
    }

    copyCanvas(canvas, destX, destY)
    {
        this.context.drawImage(canvas, destX, destY);
    }

    drawSprite(texture, spriteX, spriteY, destX, destY, width = 32, height = 32)
    {
        if(texture === null || !texture.isReady || texture.isFaulted) return;

        this.context.drawImage(texture.image, spriteX, spriteY, width, height, destX, destY, width, height);
    }

}