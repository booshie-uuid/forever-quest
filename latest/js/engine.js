////////////////////////////////////////////////////////////////////////////////

class Engine
{
    constructor(release, chatboxID, displayID)
    {
        this.release = release;
        this.releasePath = release + "/";

        GameData.setDataPath(this.releasePath + "data/");
        GameTexture.setTexturePath(this.releasePath + "textures/");

        this.chat = new Chat(chatboxID);
        this.isReady = this.chat.isReady;

        // error out if the chatbox is not ready
        if(!this.chat.isReady) return alert("Error initialising chatbox. Something is seriously wrong.");
                
        this.gfx = new GFX(displayID, 974, 680, this.error.bind(this));

        // error out if the display is not ready
        if(this.gfx.isFaulted) return this.error("Could not initialise games display.");

        this.mouse = new Mouse(this.gfx.canvas, this.error.bind(this));
        this.mouse.onMouseChange = this.handleMouseChange.bind(this);

        this.mouseDown = false;

        // error out if the mouse is not ready
        if(!this.mouse.isReady) return this.error("Could not initialise mouse input.");

        this.chance = new SharedChance();
        this.map = new Map(this.gfx, Math.random());

        this.playerDirectionX = "none";
        this.playerDirectionX = 0;
        this.playerDirectionY = 0;
        this.playerLastMoved = Date.now();

        document.addEventListener("keydown", this.handleKeyPress.bind(this));
        document.addEventListener("keyup", this.handleKeyRelease.bind(this));

        this.chat.addMessage("REALM", "Welcome to Forever Quest...", "system");
        this.chat.addMessage("NARRATOR", "Click on the map and use WASD to move around.", "special");

        window.requestAnimationFrame(this.update.bind(this));

        this.once = false;
    }

    movePlayer()
    {
        let directionX = 0;
        let directionY = 0;

        switch(this.playerDirection)
        {
            case "up":
                directionY = -1;
                break;

            case "down":
                directionY = 1;
                break;

            case "left":
                directionX = -1;
                break;

            case "right":
                directionX = 1;
                break;

            default:
                break;
        }

        const currentRoom = this.map.getCurrentRoom();

        const x = this.map.currentX + directionX;
        const y = this.map.currentY + directionY;

        if(x < 0 || x >= 28 || y < 0 || y >= 18) return;

        if(directionX == -1 && !currentRoom.hasWestDoor) return;
        if(directionX == 1 && !currentRoom.hasEastDoor) return;
        if(directionY == -1 && !currentRoom.hasNorthDoor) return;
        if(directionY == 1 && !currentRoom.hasSouthDoor) return;

        const explorationEvents = this.map.exploreRoom(x, y);

        this.handleEvents(explorationEvents);

        this.map.currentX = x;
        this.map.currentY = y;
    }

    handleKeyRelease(event)
    {
        const key = event.key.toLowerCase();

        switch (key)
        {
            case "w":
                this.playerDirection = (this.playerDirection == "up") ? "none" : this.playerDirection;
                break;

            case "a":
                this.playerDirection = (this.playerDirection == "left") ? "none" : this.playerDirection;
                break;

            case "s":
                this.playerDirection = (this.playerDirection == "down") ? "none" : this.playerDirection;
                break;

            case "d":
                this.playerDirection = (this.playerDirection == "right") ? "none" : this.playerDirection;
                break;

            default:
                break;
        }

        if (["w", "a", "s", "d"].includes(key))
        {
            event.preventDefault();        
        }
    }

    handleKeyPress(event)
    {
        const key = event.key.toLowerCase();

        switch (key)
        {
            case "w":
                this.playerDirection = "up";
                break;

            case "a":
                this.playerDirection = "left";
                break;

            case "s":
                this.playerDirection = "down";
                break;

            case "d":
                this.playerDirection = "right";
                break;

            default:
                break;
        }

        if (["w", "a", "s", "d"].includes(key))
        {
            event.preventDefault();            
        }
    }

    handleMouseChange()
    {
        let wasIntercepted = false;

        if(!wasIntercepted && (this.mouseDown && !this.mouse.isDown))
        {
            //
        }

        this.mouseDown = this.mouse.isDown;
    }

    error(message)
    {
        this.chat.addMessage("SYSTEM", message, "system");
    }

    handleEvents(events)
    {
        // yeild if there are no events
        if(typeof events === "undefined" || events === null || events.length == 0) { return; }

        for(const event of events)
        {
            switch(event.type)
            {
                case "narrator-message":
                    this.chat.addMessage("NARRATOR", event.data, "special");
                    break;

                default:
                    break;
            }
        }
    }

    update()
    {
        if(this.gfx.isReady)
        {    
            const mapEvents = this.map.update();

            this.handleEvents(mapEvents);

            const now = Date.now();

            if(this.playerDirection != "none" && now - this.playerLastMoved > 180)
            {
                this.movePlayer();
                this.playerLastMoved = now;
            }
        }
        
        window.requestAnimationFrame(this.update.bind(this));
    }

}