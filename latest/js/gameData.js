class GameData
{
	static dataPath = "latest/data/";

	static setDataPath(path)
	{
		GameData.dataPath = path + (path.endsWith("/") ? "" : "/");
	}

	constructor(uri, onloadHandler = null)
	{
		this.uri = GameData.dataPath + uri;
		this.isReady = false;
		this.data = null;

		this.requestData();
		this.onload = onloadHandler;
	}

	requestData()
	{
		this.isReady = false;

		fetch(this.uri, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json" }})
		.then(response => response.json())
		.then(response => this.loadData(response));
	}

	loadData(data)
	{ 
		this.data = data;
		this.isReady = true;

		if(this.onload !== null && typeof this.onload === "function")
		{
			this.onload();
		}
	}
}