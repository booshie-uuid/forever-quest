class Grammar
{
    static withIndefiniteArticle(text)
    {
        const article = Grammar.getIndefiniteArticle(text);
        const prefix = article ? `${article} ` : "";

        return `${prefix} ${text}`;
    }

    static getIndefiniteArticle(text)
    {
        const vowels = ["a", "e", "i", "o", "u"];
        const firstLetter = text.charAt(0).toLowerCase();

        let article = vowels.includes(firstLetter) ? "an" : "a";
        
        const words = text.toLowerCase().replace("-", " ").replace("_", " ").split(" ");
        const firstWord = words[0].toLowerCase();
        const secondWord = (words[1])? words[1]: "";

        // check for common exceptions
        const anExceptions = ["hour", "honor", "honour", "honest", "heir", "heirloom"];
        const aExceptions = ["one", "once", "european", "euphemism", "eulogy", "unicorn", "unique", "university", "unit", "useful", "user", "utensil", "utopia", "url", "u-turn"];
        const blankExceptions = ["a", "an", "the", "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their"];

        article = anExceptions.includes(firstWord) ? "an" : article;
        article = aExceptions.includes(firstWord) ? "a" : article;
        article = blankExceptions.includes(firstWord) ? "" : article

        // check for phrases like "1 year" or "1 page"
        if (!isNaN(firstWord) && ["year", "page", "wheeler"].includes(secondWord)) { article = "a"; }

        return article;
    }
}