<?php
/**
 * A pseudo random number generator that simulates rolling dice and can be synchronised
 * between server and client (or between multiple clients).
 * @class
 */
class SharedDice
{
    private $seed;

    public function __construct()
    {
        $this->seed = 0.1982; // arbitrary starting point
    }

    /**
     * Generates a pseudo random number within a range specified by the number of dice 
     * and how many sides they have (for example: 4 x D20 = 4 to 80).
     *
     * @param int $dice The number of dice to roll.
     * @param int $sides The number of sides on each dice.
     * @return int The generated pseudo random number within the specified range.
     */
    public function roll($dice, $sides)
    {
        // magic numbers are a call back to Sinclair Z81
        $multiplier = 75;
        $increment = 74;
        $modulus = 65537;
        
        // linear congruential generator
        $this->seed = fmod(($multiplier * $this->seed * $modulus + $increment), $modulus) / $modulus;

        // use latest seed to generate a pseudo random number
        // that is between the minimum and maximum possible rolls of the dice
        $min = $dice;
        $max = $dice * $sides;

        $result = floor(($max - $min + 1) * $this->seed) + $min;

        return $result;
    }
}
?>