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
        GAME.chance = new SharedChance(Math.random());

        // key state properties
        this.isFaulted = false;
        this.isReady = false;

        // key data controllers
        GAME.map = new Map();

        const bufferWidth = ((GAME.map.sectorCount * MapSector.SECTOR_SIZE) + (2 * (GAME.map.sectorCount - 1))) * MapTile.TILE_SIZE;
        const bufferHeight = ((GAME.map.sectorCount * MapSector.SECTOR_SIZE) + (2 * (GAME.map.sectorCount - 1))) * MapTile.TILE_SIZE;

        console.log("Buffer dimensions: " + bufferWidth + " x " + bufferHeight);

        // output controllers
        this.chat = new Chat(chatboxID);               
        GAME.gfx.main = new GFX(displayID, 1280, 720, this.error.bind(this));
        GAME.gfx.buffer = new GFX("buffer", bufferWidth, bufferHeight, this.error.bind(this));

        // input controllers and properties
        this.mouse = new Mouse(this.error.bind(this));
        this.mouse.onMouseChange = this.handleMouseChange.bind(this);

        this.keyboard = new Keyboard(this.handleKeyboardInput.bind(this));

        this.mouseDown = false;



        this.path = null;

        // key entities
        this.player = new Player("Player");

        this.activeEncounter = null;

        this.movementKeyDown = false;

        this.playerDirection = "none";
        this.playerDirectionX = 0;
        this.playerDirectionY = 0;
        this.playerLastMoved = Date.now();

        this.update();
    }

    update(timestamp)
    {
        // report and yield if chat or graphics engine are faulted
        if(!this.chat.isReady || GAME.gfx.main.isFaulted)
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

        if(GAME.gfx.main.isReady)
        {    
            GAME.map.update(timestamp);
            this.player.update(timestamp);

            if(GAME.map.state == Map.STATES.MAP_READY && GAME.map.renderer.isRenderStale)
            {
                GAME.map.renderer.renderMap();
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
        welcomes.push("Click on tiles or use WASD to move around.");

        for(const welcome of welcomes)
        {
            const message = new ChatMessage(ChatMessage.TYPES.SYSTEM, GameEntity.SPECIAL_ENTITIES.NARRATOR, welcome);

            // add message to global event queue
            GEQ.enqueue(new GameEvent(GameEvent.TYPES.MESSAGE, GameEntity.SPECIAL_ENTITIES.NARRATOR, message));
        }
    }

    handleKeyboardInput(key, isKeyDown)
    {
        let wasIntercepted = false;

        wasIntercepted = this.player.handleKeyboardInput(key, isKeyDown);

        return wasIntercepted;
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

                case GameEvent.TYPES.DIAGNOSTIC:
                    this.handleDiagnostic(event);
                    break;

                case GameEvent.TYPES.MAP:
                    this.handleMapEvent(event);
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

    handleMapEvent(event)
    {
        const mapState = event.data;

        if(mapState == Map.STATES.MAP_READY)
        {
            this.player.joinMap();
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
        const discoverable = event.data;

        if(discoverable.isFaulted)
        {
            GEQ.enqueue(new GameEvent(GameEvent.TYPES.ERROR, GameEntity.SPECIAL_ENTITIES.ERROR, "We somehow ran into a faulty discovery! Perhaps the realm server is toast?"));
            return;
        }

        this.activeDiscoverable = discoverable;
        
        discoverable.triggerRevealNarration();
    }

    handleMouseChange()
    {
        let wasIntercepted = false;

        if(!wasIntercepted && (this.mouseDown && !this.mouse.isDown))
        {
            //
        }

        if(GAME.map.renderer !== null && (this.mouseDown && !this.mouse.isDown))
        {
            const tile = GAME.map.renderer.getTileFromScreen(this.mouse.x, this.mouse.y);

            if(tile !== null)
            {
                this.player.setDestination(tile);
            }
        }

        this.mouseDown = this.mouse.isDown;
    }

    error(message)
    {
        this.chat.addMessage("SYSTEM", message, "system");
    }

    handleDiagnostic(event)
    {
        console.log(event.data);
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
        if(!GAME.gfx.main.isReady)
        {
            this.chat.addMessage(new ChatMessage(ChatMessage.TYPES.SHOUT, GameEntity.SPECIAL_ENTITIES.CLIENT, "A catastrophic error has occurred! Could not initialise the graphics engine. Are you running on a potato-based browser?"));
        }
    }

}