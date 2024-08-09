class GameTexture
{
	static texturePath = "textures/";

	static setTexturePath(path)
	{
		GameTexture.texturePath = path + (path.endsWith("/") ? "" : "/");
	}

	constructor(uri)
	{
		this.uri = GameTexture.texturePath + uri;
		this.isReady = false;
		this.isFaulted = false;

		this.image = null;
		this.width = 0;
		this.height = 0;
		
		this.requestTexture();
	}

	requestTexture()
	{
		this.image = new Image();
		this.image.onerror = () => { this.isFaulted = true; };
		this.image.onload = this.loadTexture.bind(this);
		this.image.src = this.uri;
	}

	loadTexture()
	{
		this.width = this.image.width;
		this.height = this.image.height;

		this.isReady = true;
	}
}