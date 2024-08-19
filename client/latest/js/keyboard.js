class Keyboard
{
    constructor(inputHandler)
    {
        this.onKeyboardInput = inputHandler;

        document.addEventListener("keydown", this.handleKeyPress.bind(this));
        document.addEventListener("keyup", this.handleKeyRelease.bind(this));

        this.isReady = true;
    }

    handleKeyPress(event)
    {
        const wasIntercepted = this.onKeyboardInput(event.key, true);

        if(wasIntercepted)
        {
            event.preventDefault();
        }
    }

    handleKeyRelease(event)
    {
        const wasIntercepted = this.onKeyboardInput(event.key, false);

        if(wasIntercepted)
        {
            event.preventDefault();
        }
    }
}