There is lots of scattered stuff I've found on math as it relates to exploding dice. I've been trying to re-learn a lot of mathematics that I've forgotten over the years and wrap my head around exploding dice averages and probabilities. I wanted to compile some of it for anyone else that is looking for it. I think it would be really cool to create a concise document containing the math people frequently have interest in. This is anything but concise, but I am working with my own lack of ability at the moment. It's just an idea for later as from my own personal experience it can be pretty frustrating searching around numerous posts for different but related formulas on exploding dice.

## Fun SWADE math that I've broken down myself

### Less common math stuff
Just defining some things that may or may not look familiar to everyone. (Especially b/c I'm a programmer, not a mathematician, so I may be using different symbols)
- `*`: used to mean multiply when coding to avoid confusion with `x` as a variable
- `^`: this is used to represent exponents in plain text without the need for special formatting. `x^y` means `x` raised to `y`, or `x` multiplied by `x` repeatedly `y` times.
- `%` (when used in an expression): modulo, for our purposes you can just think of this as getting the "remainder" of a division (like we did in elementary math before learning proper fractions and decimals)
- `floor()`: a function that rounds down whatever is in the parentheses that follow it

### Probability of beating target t with a single die of size n
Let's talk about how to calculate the odds of success for a single exploding die.

Variables:
- `n`: number of sides on the die
- `t`: target number to beat

First, the odds of success without exploding dice. On a d4, that would be 100% for 1, 75% for 2, 50% for 3, 25% for 4. We can think of the odds of success here as how many results are less than the target number. This can be represented as `1 - ((t-1) / n)`. Let's break this down.
- `1`: represents a 100% chance of success, we are subtracting from that to remove the odds of failure
- `t-1`: when it comes to target numbres, "meets beats" - so the highest number that *fails* is 1 less than `t`
- `/ n`: n is our total number of die sides, but also the total number of results without explosions
- So `(t-1)` is the number of results which fail out of `n` total results
- In this case `t` cannot be greater than `n`, since the die isn't yet exploding.

Now let's factor in the exploding die. The chance of a die exploding is `1/n` per roll, since exactly one result on the roll will explode.

Assuming a d4 is being rolled against target number 6, we know that we need to roll a 4 and then a 2.
- The odds of rolling a 4 is `1/n = 1/4`
- The odds of rolling a 2 is `1-((t-1)/n) = 1-((2-1)/4) = 1-(1/4) = 3/4`
- To combine these odds together (roll a 4 and then roll a 2 or higher) we multiply the numbers together
  - (1/4) * (3/4) = 3/16 = 0.1875

How can we do this generically? Well, let's think of it like this: we need to multiple the odds of the final roll by `1/n` (odds of explosion) a number of times equal to the number of explosions needed to reach `t`. With a d4 and `t=9`, for instance, we need to explode twice. So we would multiply the final roll's odds by the odds of explosion twice. If you haven't realized, that is just using an exponent.

So we're looking at `((1/n) ^ x) * (1 - ((y-1) / n))` where `x` is the number of explosions and `y` is the target number for the final roll. (Not to be confused with `t` which is the overall target) But how do we define `x` and `y` in terms of our original variables?

The number of explosions needed is just how many instances of `n` can be subtracted from `t`. You may have noticed that means we can divide to get this number. Ex: 9/4 would give 2.25, indicating we need 2 explosions. We can ignore the decimal, the remainder only matters for the final target number. So we will "floor" the result. (round down)
- `x = floor(t / n)`

Now, how do we get the target number of the final roll? Well, we can calculate the remainder after division with modulo: `y = t%n`... Not quite. See, using d4 as an example, modulo will give us a value between 0 and 3, indicating the remainder. But we ideally would like a value between 1 and 4 indicating the final target number. We can correct this by subtracting 1 from t initially, then adding 1 to the modulo result. For most numbers this will be the same as just doing the modulo but it will correct 0s to become `n` (4 in our example) so long as we aren't attempting a target number that is 0 or negative. (8 becomes 7, modulo to 3, add back to 4... normally 8%4 would just be 0) So our final result to get y is:
- `y = ((t-1) % n) + 1`

When we put it all together, we get this: `((1/n) ^ (floor(t / n))) * (1 - (( (((t-1) % n) + 1) - 1) / n))`.... Almost. If you start using this, you'll notice a glitch we've created here. Namely, when we hit the multiples of `n`. Let's look at d4 again. When we try target number 4, the result will be way off from `.25`. That is because we don't actually need an explosion yet until we reach 5, but our `x` calculation earlier would suggest we need 1 explosion at this point and would thus be multiplying `.25` for a single explosion by `.25` as the final target number. The correction is simple, just subtract 1 from `t` when determining how many explosions are needed so that it doesn't go up until we are 1 above a multiple of `n`.
- Success Odds (p) = `((1/n) ^ x) * (1 - ((y-1) / n))`
- `x = floor((t-1) / n)`
- `y = ((t-1) % n) + 1`
- `p = ((1/n) ^ floor((t-1) / n)) * (1 - (( (((t-1) % n) + 1) - 1) / n))`
- `p = ((1/n) ^ floor((t-1) / n)) * (1 - (( (t-1) % n ) / n))`

**Example: n=4 (d4), t=6**
- `p = ((1/n) ^ floor((t-1) / n)) * (1 - ( ( (t-1) % n )  / n))`
- `p = ((1/4) ^ floor((6-1) / 4)) * (1 - ( ( (6-1) % 4 ) / 4))` *plug in values for n and t*
- `p = (.25 ^ floor(1.25)) * (1 - (( 5 % 4 ) / 4))` *reduce simple operations*
- `p = (.25 ^ floor(1.25)) * (1 - (1 / 4))` *get remainder using modulo*
- `p = (.25 ^ 1) * (1 - (1 / 4))` *round down using floor*
- `p = .25 * .75` *reduce, this should now look like our original breakdown we did without a formula*
- `p = .1875` (or 18.75% chance of success)

**Example: n=6 (d6), t=18**
- `p = ((1/n) ^ floor((t-1) / n)) * (1 - ( ( (t-1) % n )  / n))`
- `p = ((1/6) ^ floor((18-1) / 6)) * (1 - ( ( (18-1) % 6 )  / 6))` *plug in values for n and t*
- `p = (0.166 ^ floor(2.833)) * (1 - ( ( 17 % 6 )  / 6))` *reduce simple operations*
- `p = (0.166 ^ floor(2.833)) * (1 - (5 / 6))` *get remainder using modulo*
- `p = (0.166 ^ 2) * (1 - (5 / 6))` *round down using floor*
- `p = (0.166 ^ 2) * 0.166` *reduce right side of multiplication, notice that we have multiplied by the same value 3 times overall (as expected since t=3n in this case)*
- `p = 0.0046` (or 0.46% chance of success)

### Probability of beating target t with one of multiple dice of sizes na, nb, nc, ... (wild dice)
Variables:
- `na`: number of sides on the first die
- `nb`: number of sides on the second die
- `nc`: number of sides on the third die
- ... (and so on) ...
- `t`: target number to beat


To determine the odds of success, it is actually easier to determine the odds that none of the dice will succeed and subtract that from 100%. This is because in order to combine those odds together (odds of not succeeding for each die) we can just multiply them together. Let's assume that P(n) represents that entire formula we did earlier for probability of a single die so that we don't have to keep re-writing it, where we will replace n with one of the more specific na, nb, ... values.
- Odds of *failure* for a given die is then `f = 1 - P(n)`
- Odds of failure for *all* of the dice would be: `(1 - P(na)) * (1 - P(nb)) * ...`
- And then finally we invert that combined value again to get the odds of success for *any* of the dice:
- `p = 1 - (  (1 - P(na)) * (1 - P(nb)) * ...  )`
- (There is fancy math notation for operating on a set of numbers like this but it really doesn't benefit us any to use it here)

**Example: t=10, na=4 (d4), nb=6 (d6, wild die)**
- `p = 1 - (  (1 - P(na)) * (1 - P(nb)) * ...  )`
- `p = 1 - (  (1 - P(na)) * (1 - P(nb))  )` *only two dice, remove the ...*
- Let's first determine P(na):
- `P(na) = ((1/na) ^ floor((t-1) / na)) * (1 - ( ( (t-1) % na )  / na))`
- `P(na) = ((1/4) ^ floor((10-1) / 4)) * (1 - ( ( (10-1) % 4 )  / 4))` *I'm going to skip describing these steps since we've done it a lot*
- `P(na) = (.25 ^ floor(2.25)) * .75` *And also I'll do a lot of this stuff at once*
- `P(na) = (.25 ^ 2) * .75`
- `P(na) = 0.046`
- Let's now figure out P(nb):
- `P(nb) = ((1/nb) ^ floor((t-1) / nb)) * (1 - ( ( (t-1) % nb )  / nb))`
- `P(nb) = ((1/6) ^ floor((10-1) / 6)) * (1 - ( ( (10-1) % 6 )  / 6))`
- `P(nb) = ((1/6) ^ floor((10-1) / 6)) * .5`
- `P(nb) = 0.166 * .5`
- `P(nb) = 0.083`
- Returning to the original formula for the combined probability
- `p = 1 - (  (1 - P(na)) * (1 - P(nb))  )`
- `p = 1 - (  (1 - 0.046) * (1 - 0.083)  )` *plugging in the values*
- `p = 1 - (  0.9531 * 0.9166  )` *changing to odds of failure*
- `p = 1 - 0.8736` *odds of all the dice failing*
- `p = 0.1264` *or 12.64% chance of success for at least one of the dice, note that this is higher than either of the dice individually, as would be sensible*

## Things I'm still working on learning/explaining

### Probability of beating target t with multiple dice of sizes na, nb, ... added together (damage dice)
I haven't figured this one out yet. I am bad at math. I will update this when I do. It is complicated to me because the curves aren't really linear when combining dice. (see the d12 vs 2d6 debates) I have simulated it and know for instance that d4+d6 vs 10 comes out to something near 26% just when running tens of thousands of rolls. But I can't figure out a formula behind that. I need to emphasize that I am *terrible* at math.

### Average of an exploding die roll
This is weird, right? Because exploding dice can generate infinite results. But you can still get a simple mathematical average because the odds of getting larger results still trends down towards 0%, even if it never reaches 0%. I am not well-versed enough in this to do a full explanation, but for the curious the result is this:
- `average = (n * (n+1)) / (2 * (n - 1))`

I found the answer [here](https://www.enworld.org/threads/average-of-exploding-dice.212840/post-3909026). (They use different variables than I do so that could be confusing if you read this post right after reading the stuff above) There is also a small bit of calculus (I see a dy/dx notation in there) which I was once good at, but have not used in so many years that I remember little else other than the notation.

**Example: d6**:
- `average = (n * (n+1)) / (2 * (n - 1))`
- `average = (6 * (6+1)) / (2 * (6 - 1))`
- `average = (6 * 7) / (2 * 5)`
- `average = 42 / 10`
- `average = 4.2`

### Average of multiple exploding dice added together
Literally just add them together. Average of 2d6 exploding is 8.4. :)