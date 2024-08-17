class PathNode
{
	constructor(parent, tile)
	{
		this.parent = parent;
		this.tile = tile;

		this.index = tile.col + (tile.row * tile.map.gridCols);
		this.col = tile.col;
		this.row = tile.row;
		
		this.currentCost = 0;
		this.estimatedTotalCost = 0;

		this.traversable = (tile.type != MapTile.TYPES.EMPTY && tile.status > 0);
	}
}

class PathFinder 
{
	constructor(map)
	{
		this.map = map;
	}

	getNeighbors(node, cardinalOnly = true)
	{
		const neighborMapTiles = node.tile.getNeighborsByDirection((cardinalOnly)? DIRECTIONS.getKeyDirections(): DIRECTIONS.getAllDirections());
		const neighbors = neighborMapTiles.map(tile => new PathNode(node, tile));

		return neighbors;
	}

	calculatePath(startingMapTile, finishingMapTile, allowedTypes = [MapTile.TYPES.FLOOR, MapTile.TYPES.DOOR, MapTile.TYPES.WATER, MapTile.TYPES.SPECIAL])
	{
		const path = [];

		const grid = this.map.grid;
		const gridWidth = this.map.gridCols;
		const gridHeight = this.map.gridRows;
				
		var startNode =  new PathNode(null, startingMapTile);
		var finishNode =  new PathNode(null, finishingMapTile);
		
		// Maintain a list of nodes that need to be examined.
		const pendingNodes = [startNode];
		
		// Maintain a list of nodes that have been examined,
		// using single dimension array indexing for quick lookup.
		const visitedNodes = [gridWidth * gridHeight];
		
		// Loop through pending node until finishing node is found.
		// More nodes will be added to the pending list within the loop.
		while(pendingNodes.length > 0)
		{
			var currentNode = null;
			var currentNodeIndex = -1;
			
			// Find the node from the list of pending nodes that
			// has the lowest estimated total cost.
			
			var lowestCost = gridWidth * gridHeight;
			
			for(let i = 0; i < pendingNodes.length; i++)
			{
				var candidateNode = pendingNodes[i];
				
				if(candidateNode.estimatedTotalCost < lowestCost)
				{
					currentNodeIndex = i;
					lowestCost = candidateNode.estimatedTotalCost;
				}
			}
			
			// Select the lowest cost node and remove it from
			// the list of pending nodes.
			
			if(currentNodeIndex > -1)
			{
				currentNode = pendingNodes.splice(currentNodeIndex, 1)[0];
			}
			
			// Analyse the current node.
			
			if(currentNode != null)
			{
				if(currentNode.index != finishNode.index)
				{
					// Get all traversable neighbouring nodes.
					
					const neighbors = this.getNeighbors(currentNode);
					
					// Cycle through unvisited neighbors,
					// calculating the cost of unvisited nodes and adding
					// to the pending nodes list.
					// Visited nodes will be discarded.
					
					for(let i = 0; i < neighbors.length; i++)
					{
						const neighbour = neighbors[i];

						let isTraversable = allowedTypes.includes(neighbour.tile.type) && !visitedNodes[neighbour.index];

						if(neighbour.tile.type == MapTile.TYPES.SPECIAL) { isTraversable = neighbour.tile.isTraversable; }
						
						if(isTraversable)
						{
							// Calculate costs.
						
							neighbour.currentCost = currentNode.currentCost + Math.abs(neighbour.col - currentNode.col) + Math.abs(neighbour.row - currentNode.row);
							neighbour.estimatedTotalCost = neighbour.currentCost + Math.abs(neighbour.col - finishNode.col) + Math.abs(neighbour.row - finishNode.row);
						
							// Add to pending list.
						
							pendingNodes.push(neighbour);
						
							// Record as visited.
						
							visitedNodes[neighbour.index] = true;
						}
					}
				}
				else
				{
					// We have reached out destination and can calculate the path.
					while(currentNode != null)
					{
						path.push(currentNode);

						currentNode = currentNode.parent;
					}
					
					path.reverse();
					
					break;
				}
			}
			else
			{
				console.log("could not find a path =/");
				// We ran out of nodes to look at without finding the destination.
				break;
			}
		}
	
		return path.reverse();
	}
}