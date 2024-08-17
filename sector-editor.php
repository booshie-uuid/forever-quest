<?php
    // $files = glob("php/*.php");

    // foreach ($files as $file) {
    //     include_once $file;
    // }

    include_once __DIR__ . "/php/environment.php";
    include_once __DIR__ . "/php/sharedDice.php";

    $ENV = new Environment(__DIR__ . "/environment.ini");
?>

<html lang="en">
<head>
    
    <meta charset="utf-8"/>
    <meta http-equiv="Content-Language" content="en">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, maximum-scale=1, user-scalable=0"/>

    <title>Forever Quest</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">

    <link rel="stylesheet" type="text/css" href="<?= $ENV->release ?>/css/main.css"/>
    <link rel="stylesheet" type="text/css" href="<?= $ENV->release ?>/css/editor.css"/>

    <script>
        const ENV = { RELEASE: "<?= $ENV->release ?>", DEBUG: <?= $ENV->debug ?>, DEBUG_FLAGS: "<?= $ENV->debugFlags ?>" };
    </script>

    <!-- helpers -->
    <script src="<?= $ENV->release ?>/js/GAME.js"></script>
    <script src="<?= $ENV->release ?>/js/number.js"></script>
    <script src="<?= $ENV->release ?>/js/grammar.js"></script>
    <script src="<?= $ENV->release ?>/js/sharedChance.js"></script>
    <script src="<?= $ENV->release ?>/js/gfx.js"></script>
    <script src="<?= $ENV->release ?>/js/mouse.js"></script>
    <script src="<?= $ENV->release ?>/js/keyboard.js"></script>
    <script src="<?= $ENV->release ?>/js/directions.js"></script>

    <!-- base types -->
    <script src="<?= $ENV->release ?>/js/gameEntity.js"></script>
    <script src="<?= $ENV->release ?>/js/lootable.js"></script>
    <script src="<?= $ENV->release ?>/js/gameData.js"></script>
    <script src="<?= $ENV->release ?>/js/gameTexture.js"></script>
    <script src="<?= $ENV->release ?>/js/gameEvent.js"></script>

    <!-- globals -->
    <script src="<?= $ENV->release ?>/js/gameEventQueue.js"></script>

    <!-- game scripts -->
    <script src="<?= $ENV->release ?>/js/encounter.js"></script>
    <script src="<?= $ENV->release ?>/js/discoverable.js"></script>
    <script src="<?= $ENV->release ?>/js/pathFinder.js"></script>
    <script src="<?= $ENV->release ?>/js/map/mapTile.js"></script>
    <script src="<?= $ENV->release ?>/js/map/mapBiome.js"></script>
    <script src="<?= $ENV->release ?>/js/map/mapSector.js"></script>
    <script src="<?= $ENV->release ?>/js/map/mapRenderer.js"></script>
    <script src="<?= $ENV->release ?>/js/map/mapGenerator.js"></script>
    <script src="<?= $ENV->release ?>/js/map/map.js"></script>
    <script src="<?= $ENV->release ?>/js/chatMessage.js"></script>
    <script src="<?= $ENV->release ?>/js/chat.js"></script>
    <script src="<?= $ENV->release ?>/js/engine.js"></script>
    <script src="<?= $ENV->release ?>/js/player/playerRenderer.js"></script>
    <script src="<?= $ENV->release ?>/js/player/player.js"></script>
    <script src="<?= $ENV->release ?>/js/mapSectorEditor/mapSectorEditor.js"></script>

    <!-- GUI elements -->
    <script src="<?= $ENV->release ?>/js/mapSectorEditor/spritePickerGUI.js"></script>

</head>
<body>

<div class="container">
    <canvas id="display" width="800" height="600"></canvas>
    <div class="editor">
        <div class="form">
            <table>
                <tr><td class="label">SECTOR KEY:</td><td class="input"><input type="text" id="sectorKey" value="blank"></td></tr>
                <tr><td class="label">&nbsp;</td><td class="input"><input type="button" value="IMPORT" onclick="importSector()"></td></tr>
                <tr><td class="label">&nbsp;</td><td class="input"><input type="button" value="EXPORT" onclick="exportSector()"></td></tr>
            </table>
        </div>
    </div>
</div>

<canvas id="buffer" style="display:none;visbility:hidden;"></canvas>

<script type="text/javascript">

let editor = new MapSectorEditor(ENV.RELEASE, "display", "blank");

function importSector()
{
    const sectorKey = document.getElementById("sectorKey").value;
    
    editor = new MapSectorEditor(ENV.RELEASE, "display", sectorKey);
}

function exportSector()
{
	let sector = { "layout": editor.sector.layout };

	let data = JSON.stringify(sector);

	download(data, "sector.json", "application/json");
}

function download(data, filename, type)
{
    var file = new Blob([data], {type: type});

    if (window.navigator.msSaveOrOpenBlob)
    {
        // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    }
    else
    { 
        // Real Browsers
        const anchor = document.createElement("a");
        const url = URL.createObjectURL(file);

        anchor.href = url;
        anchor.download = filename;

        document.body.appendChild(anchor);

        anchor.click();
        
        setTimeout(function() {
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(url);  
        }, 0);
    }
}

</script>

</body>
</html>