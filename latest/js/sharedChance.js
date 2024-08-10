/**
 * A pseudo random number generator that simulates chance based activities such as rolling dice
 * or flipping coins. Can be synchronised between server and client (or between multiple clients).
 * @class
 */
class SharedChance
{
    static instance = undefined;

    constructor(seed = 0.1982)
    {
        if (SharedChance.instance instanceof SharedChance)
        {
            return SharedChance.instance;
        }
        
        this.seed = seed;

        SharedChance.instance = this;
    }

    /**
     * Generates a psuedo random number between 0 and 1 similar to Math.random().
     * @returns {number}
     */
    static random()
    {
        SharedChance.generate();

        return SharedChance.instance.seed;
    }

    /**
     * Generates a new psuedo random seed for use in other functions.
     * Implements the linear congruential generator algorithm.
     * @returns {void}
     */
    static generate()
    {
        // magic numbers are a call back to Sinclair Z81
        const multiplier = 75;
        const increment = 74;
        const modulus = 65537;
        
        // linear congruential generator
        SharedChance.instance.seed = ((multiplier * SharedChance.instance.seed * modulus + increment) % modulus) / modulus;
    }

    /**
     * Generates a pseudo random number within a range specified by the number of dice 
     * and how many sides they have (for example: 4 x D20 = 4 to 80).
     * 
     * @param {number} dice - The number of dice to roll.
     * @param {number} sides - The number of sides on each dice.
     * @returns {number} - A pseudo random number within the specified range.
     */
    static roll(dice, sides)
    {
        SharedChance.generate();

        // use latest seed to generate a pseudo random number
        // that is between the minimum and maximum possible rolls of the dice
        const min = dice;
        const max = dice * sides;

        const result = Math.floor((max - min + 1) * SharedChance.instance.seed) + min;

        return result;
    }

    /**
     * Flips a coin and returns either true or false based on the result.
     * 
     * @returns {boolean} The result of the coin flip.
     */
    static flip()
    {
        SharedChance.generate();

        return SharedChance.instance.seed > 0.5;
    }

    /**
     * Generates a pseudo random number within a specified range.
     * @param {*} min minimum value (inclusive)
     * @param {*} max maximum value (inclusive)
     * @returns 
     */
    static range(min, max)
    {
        SharedChance.generate();

        return Math.floor((max - min + 1) * SharedChance.instance.seed) + min;
    }

    /**
     * Generates a pseudo random number within a specified range,
     * but biases the result towards the minimum value.
     * @param {*} min minimum value (inclusive)
     * @param {*} max maximum value (inclusive)
     * @returns 
     */
    static biasedRange(min, max)
    {
        return Math.floor(Math.abs(this.random() - this.random()) * (1 + max - min) + min);
    }

    /**
     * Picks a random element from an array.
     * @param {*} array 
     * @returns 
     */
    static pick(array)
    {
        // yeild if array is empty
        if(array === null || array.length === 0) { return null };

        return array[this.range(0, array.length - 1)];
    }

    /**
     * Picks a random element from an array, 
     * but with a bias towards earlier elements in the array.
     * @param {*} array 
     * @returns 
     */
    static biasedPick(array)
    {
        // yeild if array is empty
        if(array === null || array.length === 0) { return null };

        return array[this.biasedRange(0, array.length - 1)];
    }
}