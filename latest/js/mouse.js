class Mouse
{
    constructor(canvas, errorHandler)
    {
        this.error = errorHandler || console.log;

        this.canvas = canvas;
        
        this.x = 0;
        this.y = 0;

        this.deltaX = 0;
        this.deltaY = 0;

        this.button = null;

        this.isDown = false;
        this.isUp = true;
        
        this.canvas.onmouseclick = (e) => { e.stopPropagation(); e.preventDefault(); return false; }
        this.canvas.oncontextmenu = (e) => { e.stopPropagation(); e.preventDefault(); return false; }
        this.canvas.onmousemove = (e) => { this.onMouseMove(e); }
        this.canvas.onmouseup = (e) => { this.onMouseUp(e); }
        this.canvas.onmousedown = (e) => { this.onMouseDown(e); }

        this.onMouseChange = null;

        this.isReady = true;
    }

    onMouseMove(event)
    {
        event.stopPropagation();
        event.preventDefault();
        
        var rect = this.canvas.getBoundingClientRect();

        var newX = (event.clientX - rect.left);
        var newY = (event.clientY - rect.top);
        
        this.deltaX = newX - this.x;
        this.deltaY = newY - this.y;
        
        this.x = newX;
        this.y = newY;

        this.isUp = false;
        
        if(typeof this.onMouseChange === "function")
            this.onMouseChange(this, event);
            
        return false;
    }

    onMouseUp(event)
    {
        event.stopPropagation();
        event.preventDefault();
        
        this.isUp = this.isDown;
        this.isDown = false;
        this.button = (this.isUp)? this.button: null;

        if(typeof this.onMouseChange === "function")
            this.onMouseChange(this, event);
        
        return false;
    }

    onMouseDown(event)
    {
        event.stopPropagation();
        event.preventDefault();
            
        this.isUp = false;
        this.isDown = true;
        this.button = event.button;

        if(typeof this.onMouseChange === "function")
            this.onMouseChange(this, event);
        
        return false;
    }
}