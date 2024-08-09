<?php
class Environment
{
    public $release;

    public function __construct($configURI)
    {
        $config = parse_ini_file($configURI);
        
        if ($config === false)
        {
            throw new Exception("failed to config file for environment");
        }

        $this->release = $config["release"];
    }
}
?>