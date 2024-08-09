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
			"legendary": "#ff8000"
		};

		return colorMappings[messageType] || colorMappings["public"];
	}

	addMessage(from, message, type = "public")
	{
		if(!this.isReady) return;

		message = message.replace("[COMMON]", `</span><span style="color:${this.getMessageColor("common")}">`).replace("[/COMMON]", "</span><span>");
		message = message.replace("[UNCOMMON]", `</span><span style="color:${this.getMessageColor("uncommon")}">`).replace("[/UNCOMMON]", "</span><span>");
		message = message.replace("[RARE]", `</span><span style="color:${this.getMessageColor("rare")}">`).replace("[/RARE]", "</span><span>");
		message = message.replace("[EPIC]", `</span><span style="color:${this.getMessageColor("epic")}">`).replace("[/EPIC]", "</span><span>");
		message = message.replace("[LEGENDARY]", `</span><span style="color:${this.getMessageColor("legendary")}">`).replace("[/LEGENDARY]", "</span><span>");

		const envelopeElement = document.createElement("p");

		envelopeElement.style.color = this.getMessageColor(type);
		envelopeElement.innerHTML = `<span>[${from}]:\xa0 ${message}</span>`;

		this.chatbox.appendChild(envelopeElement);

		this.update();
	}
}