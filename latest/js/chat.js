class Chat
{
    constructor(chatboxID)
    {
        this.chatbox = document.getElementById(chatboxID);
        this.isReady = (this.chatbox !== null && this.chatbox.tagName === "DIV");
    }

    update()
    {
        if(!this.isReady) return;

        this.handleEvents();
    }

    handleEvents()
    {
        this.handleMessages();
    }

    handleMessages()
    {
        const events = GEQ.dequeue([GameEvent.TYPES.MESSAGE]);

        // yield if no message events were in the queue
        if(events === null || events.length === 0) { return; }

        for(const event of events)
        {
            const message = event.data;
            this.addMessage(event.data);
        }

        this.chatbox.scrollTop = this.chatbox.scrollHeight;

        if(this.chatbox.children.length > 50)
        {
            this.chatbox.firstElementChild.remove();
        }
    }

    getMessageColor(messageType = "public")
    {
        const colorMappings = {
            "public": "#f2f3f3",
            "private": "#ff66cc",
            "party": "#0989cf",
            "shout": "#c4281c",
            "emote": "#da8541",
            "special": "#c2dab8",
            "system": "#f5cd30",
            "common": "#ffffff",
            "uncommon": "#1eff00",
            "rare": "#0070dd",
            "epic": "#a335ee",
            "legendary": "#ff8000",
            "special": "#f5cd30"
        };

        return colorMappings[messageType] || colorMappings["public"];
    }

    addMessage(message)
    {
        if(!this.isReady || !(message instanceof ChatMessage)) return;

        let content = message.content;

        content = content.replace("[COMMON]", `</span><span style="color:${this.getMessageColor("common")}">`).replace("[/COMMON]", "</span><span>");
        content = content.replace("[UNCOMMON]", `</span><span style="color:${this.getMessageColor("uncommon")}">`).replace("[/UNCOMMON]", "</span><span>");
        content = content.replace("[RARE]", `</span><span style="color:${this.getMessageColor("rare")}">`).replace("[/RARE]", "</span><span>");
        content = content.replace("[EPIC]", `</span><span style="color:${this.getMessageColor("epic")}">`).replace("[/EPIC]", "</span><span>");
        content = content.replace("[LEGENDARY]", `</span><span style="color:${this.getMessageColor("legendary")}">`).replace("[/LEGENDARY]", "</span><span>");
        content = content.replace("[SPECIAL]", `</span><span style="color:${this.getMessageColor("special")}">`).replace("[/SPECIAL]", "</span><span>");

        const line = document.createElement("p");

        line.style.color = message.type;
        line.innerHTML = `<span>[${message.source.name}]:\xa0 ${content}</span>`;

        this.chatbox.appendChild(line);

        this.update();
    }
}