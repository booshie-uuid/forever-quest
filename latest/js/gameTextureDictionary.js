class GameTextureDictionary
{
    constructor()
    {
        this.textures = {};
    }

    requestTexture(key, path, overwriteBasePath = false)
    {
        this.textures[key] = new GameTexture(path, overwriteBasePath);
    }

    addTexture(key, texture)
    {
        this.textures[key] = texture;
    }

    getTexture(key)
    {
        const texture = this.textures[key];

        return (typeof texture == "undefined" || texture === null)? null : this.textures[key];
    }
}