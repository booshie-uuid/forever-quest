<?php
class Environment
{
    public $release;
    public $debug;
    public $debugFlags;

    public function __construct($configURI)
    {
        $config = parse_ini_file($configURI);
        
        if ($config === false)
        {
            throw new Exception("failed to config file for environment");
        }

        $this->release = $config["release"];
        $this->debug = $config["debug"];
        $this->debugFlags = $config["debugFlags"];
    }
}
?>