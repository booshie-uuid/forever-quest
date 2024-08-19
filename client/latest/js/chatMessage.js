class ChatMessage
{
    static TYPES = {
        UNKNOWN: "#FFFFFF",
        PUBLIC: "#f2f3f3",
        PRIVATE: "#ff66cc",
        PARTY: "#0989cf",
        SHOUT: "#c4281c",
        EMOTE: "#da8541",
        SPECIAL: "#c2dab8",
        SYSTEM: "#f5cd30",
        COMMON: "#ffffff",
        UNCOMMON: "#1eff00",
        RARE: "#0070dd",
        EPIC: "#a335ee",
        LEGENDARY: "#ff8000"
    };

    constructor(type, source, content)
    {
        this.type = type;
        this.source = source;
        this.content = content;       
    }
}