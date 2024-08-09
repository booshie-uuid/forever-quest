class Number
{
    static limit(value, min, max) { return Math.max(min, Math.min(value, max)); }
    static between(value, min, max) { return (value >= min && value <= max); }
    static timestamp() { return new Date().getTime(); }
    static easeIn(a, b, percent) { return a + (b - a) * Math.pow(percent, 2); }
    static easeOut(a, b, percent) { return a + (b - a) * (1 - Math.pow(1 - percent, 2)); }
    static ease(a, b, percent) { return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5); }
    static percentRemaining(n, total) { return (n % total) / total; }
    static softstep(x) { return 1 / (1 + Math.exp(-x)); }
    static interpolate(a, b, percent) { return a + (b - a) * percent; }
    static randomInt(min, max) { return Math.round(Number.interpolate(min, max, Math.random())); }
    static truncate(number) { return ~~number; }
    static converge(current, target) { return (current < target)? current + 1 : (current > target)? current - 1 : current; }
}