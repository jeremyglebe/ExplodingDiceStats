def probability_sum_of_exploding_dice(dice: list[int], target: int) -> float:
    """Return the probability of the sum of exploding dice beating a target number."""

    # region Helper Functions
    def all_dice_combos(dice):
        """
        This function is a generator that returns all possible combinations of dice rolls.
        dice: [int, ...] (int is the number of sides on the die)
        returns: [(int, int), ...] (each tuple is a die and the result of the roll)
        """
        if len(dice) == 0:
            return [[]]
        die = dice[0]
        dice = dice[1:]
        return [
            ((die, i), *combo)
            for i in range(1, die + 1)
            for combo in all_dice_combos(dice)
        ]

    def find_successful_results(previous_result):
        """
        Recursively find all results of exploding dice which beat a target number (also calculates probability per result)
        previous_result: {
            "target": int (the value to beat),
            "probability": float (the probability of this result occurring),
            "total": int (the sum of all dice in this result),
            "state": [(int, int), ...] (each tuple is a die and the result of the roll),
            "history": [{...}, ...] (each object is a previous result's state without history, target, or probability)
        }
        """
        # For history storing purposes, create a copy of the previous result that does not itself contain history
        # It also does not need target or probability, as those are only relevant to the final results
        historical_result = {
            key: value
            for key, value in previous_result.items()
            if key != "history" and key != "target" and key != "probability"
        }
        # Do not include the very "first" roll result in the history, as that is actually a configuration/setup
        # We can easily identify the configuration results because its total will be 0
        if previous_result["total"] == 0:
            history = []
        else:
            history = previous_result["history"] + [historical_result]
        # Any dice that exploded in the previous iteration must be rolled again
        remaining_dice = [
            die for die, result in previous_result["state"] if result == die
        ]
        # Base case: no dice exploded in the previous iteration, no remaining dice to roll
        if len(remaining_dice) == 0:
            return []
        # Get all possible combinations of the remaining dice
        remaining_combinations = all_dice_combos(remaining_dice)
        # Get the odds of rolling each combination in this iteration
        chance_to_roll = 1 / len(remaining_combinations)
        # Create a results over the target value
        results_beating_target = []
        # Create a RollResult for each combination and determine if recursion should occur
        for combination in remaining_combinations:
            roll_result = {
                "target": previous_result["target"],
                "probability": previous_result["probability"] * chance_to_roll,
                "total": previous_result["total"]
                + sum(result for die, result in combination),
                "state": combination,
                "history": history,
            }
            # If a result beats the target, add it to the results_beating_target list
            if roll_result["total"] >= roll_result["target"]:
                results_beating_target.append(roll_result)
            # If a result does not beat the target, we will recursively call this function
            # to determine the odds of reaching the target value
            else:
                results_beating_target.extend(find_successful_results(roll_result))
        return results_beating_target

    # endregion

    # region Calculation
    # Get a list of all results which beat the target number (objects in list include probability per result)
    results = find_successful_results(
        {
            "target": target,
            "probability": 1,
            "total": 0,
            "state": [(i, i) for i in dice],
            "history": [],
        }
    )
    # To get the total probability, we get the probability that none of the results will occur (1 - probability(x) for each result x, multiplied together)
    probability_of_none_of_these_results = 1
    for result in results:
        result_of_this_result_not_occurring = 1 - result["probability"]
        probability_of_none_of_these_results *= result_of_this_result_not_occurring
    # Then we subtract that from 1 to get the probability that at least one of the results will occur
    probability_of_at_least_one_result = 1 - probability_of_none_of_these_results
    return probability_of_at_least_one_result
    # endregion


# Test the function when this file is executed as the main module
if __name__ == "__main__":
    print("Probability: Sum of Exploding Dice vs Target Number")

    def as_percentage_with_5_decimal_places(probability):
        return f"{probability * 100:.5f}%" if probability != 1 else "100.00000%"

    dice = [4, 6, 6]
    target = 30
    print(
        f"Probability of rolling {target} or higher with dice {dice}:",
        as_percentage_with_5_decimal_places(
            probability_sum_of_exploding_dice(dice, target),
        ),
    )
    print()

    dice = [4, 8]
    target = 8
    print(
        f"Probability of rolling {target} or higher with dice {dice}:",
        as_percentage_with_5_decimal_places(
            probability_sum_of_exploding_dice(dice, target),
        ),
    )
    print()

    dice = [4]
    target = 4
    print(
        f"Probability of rolling {target} or higher with dice {dice}:",
        as_percentage_with_5_decimal_places(
            probability_sum_of_exploding_dice(dice, target),
        ),
    )
    print()
