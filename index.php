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

    <script>
        const ENV = { RELEASE: "<?= $ENV->release ?>", DEBUG: <?= $ENV->debug ?>, DEBUG_FLAGS: "<?= $ENV->debugFlags ?>" };
    </script>

    <script src="<?= $ENV->release ?>/js/number.js"></script>
    <script src="<?= $ENV->release ?>/js/sharedChance.js"></script>
    <script src="<?= $ENV->release ?>/js/gameData.js"></script>
    <script src="<?= $ENV->release ?>/js/gameTexture.js"></script>
    <script src="<?= $ENV->release ?>/js/gfx.js"></script>
    <script src="<?= $ENV->release ?>/js/mouse.js"></script>

    <script src="<?= $ENV->release ?>/js/directions.js"></script>
    <script src="<?= $ENV->release ?>/js/biome.js"></script>
    <script src="<?= $ENV->release ?>/js/encounter.js"></script>
    <script src="<?= $ENV->release ?>/js/feature.js"></script>
    <script src="<?= $ENV->release ?>/js/room.js"></script>
    <script src="<?= $ENV->release ?>/js/mapGenerator.js"></script>
    <script src="<?= $ENV->release ?>/js/map.js"></script>
    <script src="<?= $ENV->release ?>/js/chat.js"></script>
    <script src="<?= $ENV->release ?>/js/engine.js"></script>

</head>
<body>

<div class="container">
    <canvas id="display" width="800" height="600"></canvas>
    <div id="chatbox" class="chatbox"></div>
</div>

<script type="text/javascript">

const engine = new Engine(ENV.RELEASE, "chatbox", "display");

</script>

</body>
</html>