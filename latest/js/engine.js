////////////////////////////////////////////////////////////////////////////////

class Engine
{
    constructor(release, chatboxID, displayID)
    {
        // environment configuration
        this.release = release;
        this.releasePath = release + "/";

        GameData.setDataPath(this.releasePath + "data/");
        GameTexture.setTexturePath(this.releasePath + "textures/");

        // initialise shared controllers (singletons)
        // GEQ = new GameEventQueue();
        const sharedChance = new SharedChance(Math.random());

        // key state properties
        this.isFaulted = false;
        this.isReady = false;

        // output controllers
        this.chat = new Chat(chatboxID);               
        this.gfx = new GFX(displayID, 974, 680, this.error.bind(this));

        // input controllers and properties
        this.mouse = new Mouse(this.gfx.canvas, this.error.bind(this));
        this.mouse.onMouseChange = this.handleMouseChange.bind(this);

        this.mouseDown = false;

        document.addEventListener("keydown", this.handleKeyPress.bind(this));
        document.addEventListener("keyup", this.handleKeyRelease.bind(this));

        // key data controllers
        this.map = new Map(this.gfx);

        // key entities
        this.activeEncounter = null;

        this.playerDirectionX = "none";
        this.playerDirectionX = 0;
        this.playerDirectionY = 0;
        this.playerLastMoved = Date.now();

        this.update();
    }

    update()
    {
        // report and yield if chat or graphics engine are faulted
        if(!this.chat.isReady || this.gfx.isFaulted)
        {
            this.isFaulted = true;
            this.handleCatastrophicError();
            return;
        }

        // perform any once-off tasks if this is our first update
        if(!this.isReady)
        {
            // we wouldn't have got this far if key dependencies were faulted
            // so set the game engine to ready
            this.isReady = true;

            // welcome the player to the game
            this.welcomePlayer();
        }

        if(this.gfx.isReady)
        {    
            this.map.update();

            const now = Date.now();

            if(this.playerDirection != "none" && now - this.playerLastMoved > 180)
            {
                this.movePlayer();
                this.playerLastMoved = now;
            }
        }

        this.chat.update();

        // handle any events that were handled by other controllers (e.g. chat)
        this.handleEvents(GEQ.dequeueAll());
        
        window.requestAnimationFrame(this.update.bind(this));
    }

    welcomePlayer()
    {
        const welcomes = [];

        welcomes.push("Welcome to Forever Quest...");
        welcomes.push("Click on the map and use WASD to move around.");

        for(const welcome of welcomes)
        {
            const message = new ChatMessage(ChatMessage.TYPES.SYSTEM, GameEntity.SPECIAL_ENTITIES.NARRATOR, welcome);

            // add message to global event queue
            GEQ.enqueue(new GameEvent(GameEvent.TYPES.MESSAGE, GameEntity.SPECIAL_ENTITIES.NARRATOR, message));
        }
    }

    handleEvents(events)
    {
        for(const event of events)
        {
            switch(event.type)
            {
                case GameEvent.TYPES.ERROR:
                    this.handleError(event);
                    break;

                case GameEvent.TYPES.ENCOUNTER:
                    this.handleEncounter(event);
                    break;

                case GameEvent.TYPES.DISCOVERY:
                    this.handleDiscovery(event);
                    break;

                default:
                    break;
            }
        }
    }

    handleEncounter(event)
    {
        const encounter = event.data;

        if(encounter.isFaulted)
        {
            GEQ.enqueue(new GameEvent(GameEvent.TYPES.ERROR, GameEntity.SPECIAL_ENTITIES.ERROR, "We somehow ran into a faulty encounter! Perhaps the realm server is toast?"));
            return;
        }

        this.activeEncounter = encounter;
        
        encounter.triggerRevealNarration();
    }

    handleDiscovery(event)
    {
        const feature = event.data;

        if(feature.isFaulted)
        {
            GEQ.enqueue(new GameEvent(GameEvent.TYPES.ERROR, GameEntity.SPECIAL_ENTITIES.ERROR, "We somehow ran into a faulty feature! Perhaps the realm server is toast?"));
            return;
        }

        this.activeFeature = feature;
        
        feature.triggerRevealNarration();
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

        const x = this.map.currentCol + directionX;
        const y = this.map.currentRow + directionY;

        if(x < 0 || x >= 28 || y < 0 || y >= 18) return;

        if(directionX == -1 && !currentRoom.hasWestDoor) return;
        if(directionX == 1 && !currentRoom.hasEastDoor) return;
        if(directionY == -1 && !currentRoom.hasNorthDoor) return;
        if(directionY == 1 && !currentRoom.hasSouthDoor) return;

        this.map.exploreRoom(x, y);

        this.map.currentCol = x;
        this.map.currentRow = y;
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

    handleError(event)
    {
        this.chat.addMessage(new ChatMessage(ChatMessage.TYPES.SHOUT, event.source, event.data));
    }

    handleCatastrophicError()
    {
        // could not initialise chat
        if(!this.chat.isReady)
        {
            alert("A catastrophic error occurred! Could not initialise chat. What have you done!?");
        }

        // could not initialise graphics engine
        if(!this.gfx.isReady)
        {
            this.chat.addMessage(new ChatMessage(ChatMessage.TYPES.SHOUT, GameEntity.SPECIAL_ENTITIES.CLIENT, "A catastrophic error has occurred! Could not initialise the graphics engine. Are you running on a potato-based browser?"));
        }
    }

}