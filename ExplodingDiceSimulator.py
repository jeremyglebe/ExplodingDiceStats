import random
import json
import datetime
import sys

DICE_AVERAGES_SIMULATION_STEPS = 30000
SUCCESS_ODDS_BASE_SIMULATION_STEPS = 5000000
SUCCESS_ODDS_MAXIMUM_SIMULATION_STEPS = 50000000
AVERAGES_PRECISION = 2
PERCENTAGES_PRECISION = 4

# This program will simulate dice rolls and determine average rolls
# Dice come in the form of dice strings (e.g. 2d6, 3d4, 1d8) and may include a modifier (e.g. 2d6+3, 3d4-1, 1d8+2)
# Dice may also be "exploding" dice, which means that if the maximum value is rolled, the die is rolled again and added to the total
# Those are represented in the string as "e" (e.g. 2d6e, 3d4e, 1d8e)


def parse_dice_string(dice_string):
    """Parse a dice string into an object { dice: [{ count: int, sides: int, exploding: bool }], modifier: int }"""
    dice = []
    modifier = 0
    # Replace subtraction with addition of negative numbers to simplify parsing
    dice_string = dice_string.replace("-", "+-")
    # Split by the + to separate types of dice and modifiers (note that you cannot subtract dice)
    tokens = dice_string.split("+")
    for token in tokens:
        # Check if the token is a die or a modifier
        if "d" in token:
            # Split by the d to separate the count and sides of the die
            count, sides = token.split("d")
            # Check if the die is exploding
            exploding = False
            if "e" in sides:
                sides = sides[:-1]
                exploding = True
            dice.append(
                {"count": int(count), "sides": int(sides), "exploding": exploding}
            )
        else:
            modifier += int(token)
    return {"dice": dice, "modifier": modifier}


def get_upper_roll_limit(dice_string):
    """Get the maximum possible roll for a given dice string"""
    if "e" in dice_string:
        return float("inf")
    else:
        parsed_dice = parse_dice_string(dice_string)
        total = 0
        for die in parsed_dice["dice"]:
            total += die["count"] * die["sides"]
        total += parsed_dice["modifier"]
        return total


def get_lower_roll_limit(dice_string):
    """Get the minimum possible roll for a given dice string"""
    parsed_dice = parse_dice_string(dice_string)
    total = 0
    for die in parsed_dice["dice"]:
        total += die["count"]
    total += parsed_dice["modifier"]
    return total


def roll_dice(dice_string):
    """Roll dice based on a dice string and return the total and the rolls"""
    parsed_dice = parse_dice_string(dice_string)
    rolls = []
    total = 0
    for die in parsed_dice["dice"]:
        for _ in range(die["count"]):
            roll = random.randint(1, die["sides"])
            total += roll
            unit_rolls = []
            unit_rolls.append(
                ("d" + str(die["sides"]) + ("e" if die["exploding"] else ""), roll)
            )
            while die["exploding"] and roll == die["sides"]:
                roll = random.randint(1, die["sides"])
                total += roll
                unit_rolls.append(
                    ("d" + str(die["sides"]) + ("e" if die["exploding"] else ""), roll)
                )
            if len(unit_rolls) > 1:
                rolls.append(unit_rolls)
            else:
                rolls.append(unit_rolls[0])
    total += parsed_dice["modifier"]
    return (total, rolls)


def calculate_success_odds(dice_string, target_number):
    """Calculate the odds of success for a given dice string and target number"""
    # Quickly resolve simple edge cases
    if target_number <= get_lower_roll_limit(dice_string):
        return 1, False, False
    if target_number > get_upper_roll_limit(dice_string):
        return 0, False, False
    # Otherwise, simulate the dice rolls to calculate the odds
    total = 0
    successes = 0
    steps_taken = 0
    # Run the simulation enough to gather a representative sample of successes
    for _ in range(SUCCESS_ODDS_BASE_SIMULATION_STEPS):
        result = roll_dice(dice_string)
        total += result[0]
        if result[0] >= target_number:
            successes += 1
        steps_taken += 1
    # In cases of very low success rates, run the simulation longer to get a more accurate result
    # This may still round to 0% if no successes are found within the maximum number of steps
    for _ in range(
        SUCCESS_ODDS_MAXIMUM_SIMULATION_STEPS - SUCCESS_ODDS_BASE_SIMULATION_STEPS
    ):
        if successes > 0:
            break
        result = roll_dice(dice_string)
        total += result[0]
        if result[0] >= target_number:
            successes += 1
        steps_taken += 1
    odds = successes / steps_taken
    long_simulation = steps_taken > SUCCESS_ODDS_BASE_SIMULATION_STEPS
    low_success_rate = successes < 10
    return odds, long_simulation, low_success_rate


def display_dice_average(dice_string):
    """Display the average roll for a given dice string and the average number of explosions"""
    total = 0
    rolls = []
    explosions = 0
    for _ in range(DICE_AVERAGES_SIMULATION_STEPS):
        result = roll_dice(dice_string)
        total += result[0]
        rolls.extend(result[1])
        for roll in result[1]:
            if type(roll) == list:
                explosions += 1
    average = total / DICE_AVERAGES_SIMULATION_STEPS
    rounded_average = round(average, AVERAGES_PRECISION)
    rounded_average_explosions = round(
        explosions / DICE_AVERAGES_SIMULATION_STEPS, AVERAGES_PRECISION
    )
    print("Average roll for " + dice_string + ": " + str(rounded_average))
    print(
        "Average number of explosions for "
        + dice_string
        + ": "
        + str(rounded_average_explosions)
    )
    print()
    # Save a log of the rolls to a JSON file named after the dice string and current timestamp
    # with open(dice_string + "_" + datetime.datetime.now().strftime("%Y%m%d%H%M%S") + ".json", "w") as file:
    #     json.dump(rolls, file, indent=4)


def display_success_odds(dice_string, target_number):
    """Display the odds of success for a given dice string and target number"""
    print(f"Calculating odds for {dice_string} vs {target_number}...")
    odds, long_simulation, low_success_rate = calculate_success_odds(
        dice_string, target_number
    )
    # Print warnings if simulation data is not sufficient
    if long_simulation:
        print(
            f"WARNING: Simulation required more than {SUCCESS_ODDS_BASE_SIMULATION_STEPS} steps to produce a successful roll. Results may be inaccurate."
        )
    if low_success_rate:
        print(f"WARNING: Very low success rates may not be accurate or consistent.")
    percentage = round(odds * 100, PERCENTAGES_PRECISION)
    print(f"{dice_string} TN {target_number}: {percentage}% chance of success")
    # Also print in 1 in X format for easier understanding
    if odds == 0:
        print(f"1 in ∞ chance of success\n")
    else:
        print(f"1 in {round(1 / odds)} chance of success\n")


def menu_loop():
    print("****************************")
    print("* EXPLODING DICE SIMULATOR *")
    print("****************************\n")
    print(
        "Enter dice strings like 'NdM', 'NdM±X', or 'NdMe±X', where N is the number of dice, M is the sides, 'e' indicates an exploding die, and X is a modifier."
    )
    print(
        "The simulator calculates the average roll, number of explosions, and logs all rolls.\n"
    )
    print(
        "Calculate the odds of success vs a target number by entering 'target T NdMe±X' where T is the target number.\n"
    )
    print("To exit, enter 'exit'.\n")
    while True:
        dice_string = input("> ")
        print()
        if dice_string == "exit":
            break
        elif "target" in dice_string:
            _, target, dice_string = dice_string.split(" ")
            display_success_odds(dice_string, int(target))
        else:
            display_dice_average(dice_string)


if __name__ == "__main__":
    """Main function to run the dice simulator program"""
    if len(sys.argv) > 1:
        if sys.argv[1] == "target" and len(sys.argv) == 4:
            target = int(sys.argv[2])
            dice_string = sys.argv[3]
            display_success_odds(dice_string, target)
        else:
            for dice_string in sys.argv[1:]:
                display_dice_average(dice_string)
    else:
        menu_loop()

""" ALTERNATIVE PRECISE MATHEMATICAL CALCULATIONS (IN PROGRESS, I'M BAD AT MATH) """
from functools import reduce


def precise_odds_exploding_die(num_sides, target_number):
    """Calculate the odds of an exploding die rolling at or above a target number
    p = ((1/n) ^ floor((t-1) / n)) * (1 - (( (t-1) % n ) / n))
    p = probability of rolling at or above the target number
    n = number of sides on the die
    t = target number"""
    n = float(num_sides)
    t = float(target_number)
    one_over_n = 1.0 / n  # 1/n
    t_minus_one = t - 1.0  # t-1
    floor_step = t_minus_one // n  # floor((t-1) / n)
    raise_step = one_over_n**floor_step  # (1/n) ^ floor((t-1) / n)
    mod_step = t_minus_one % n  # (t-1) % n
    p = raise_step * (1.0 - (mod_step / n))  # formula
    return p


# print(f"d4,t=6: {precise_odds_exploding_die(4, 6)}")
# print(f"d6,t=18: {precise_odds_exploding_die(6, 18)}")


def precise_odds_of_alternatives(probabilities):
    """Calculate the odds of any of a set of probabilities occurring"""
    # invert each of the probabilities to get the odds they won't occur
    inverse_probabilities = [1 - p for p in probabilities]
    # combine the odds of each not occurring to get the odds of none occurring
    odds_of_all_failures = reduce(lambda x, y: x * y, inverse_probabilities)
    # invert the odds of none occurring to get the odds of at least one occurring
    return 1 - odds_of_all_failures


def precise_odds_any_exploding_dice(dice_size_list, target_number):
    """Calculate the odds of any exploding dice in a set rolling at or above a target number"""
    # calculate the odds of each die rolling at or above the target number
    probabilities = [
        precise_odds_exploding_die(die_size, target_number)
        for die_size in dice_size_list
    ]
    # calculate the odds of any of the dice rolling at or above the target number
    return precise_odds_of_alternatives(probabilities)


# print(f"d4,d6,t=10: {precise_odds_any_exploding_dice([4, 6], 10)}")


def precise_average_exploding_die(num_sides):
    """Calculate the average roll of an exploding die
    average = (n * (n+1)) / (2 * (n - 1))
    n = number of sides on the die"""
    n = float(num_sides)
    average = (n * (n + 1)) / (2 * (n - 1))
    return average


# print(f"avg d4: {precise_average_exploding_die(4)}")
# print(f"avg d6: {precise_average_exploding_die(6)}")


# New Menu Loop
def new_menu_loop():
    print("new menu test")
    while True:
        dice_string = input("> ")
        print()
        if dice_string == "exit":
            break
        elif dice_string.startswith("odds "):
            # Remove the "odds " prefix
            dice_string = dice_string[5:]
            # Split the string from the target number (It is assumed that the "target" keyword and number come last in the string)
            dice_string, target = dice_string.split(" target ")
            # Alternative dice (dice that aren't added but any of them can be used to reach the target number) are separated by spaces
            alternative_dice_strings = dice_string.split(" ")
            # An array to store probabilities of each alternative
            probabilities = []
            # Each alternative is handled based on its properties after being parsed
            for dice_string in alternative_dice_strings:
                # Parse the dice string
                parsed_dice_string = parse_dice_string(dice_string)
                # Get the effective target number by subtracting the modifier
                effective_target = int(target) - parsed_dice_string["modifier"]
                # Check if there are multiple dice being added together, which requires simulation
                if len(parsed_dice_string["dice"]) > 1:
                    # Simulation-based solution required, todo
                    pass
                else:
                    # A single die can be calculated precisely
                    exploding = parsed_dice_string["dice"][0]["exploding"]
                    num_sides = parsed_dice_string["dice"][0]["sides"]
                    if exploding:
                        # Calculate the odds of an exploding die reaching the target number
                        probabilities.append(
                            precise_odds_exploding_die(num_sides, effective_target)
                        )
                    else:
                        # Calculate the odds of a regular die reaching the target number
                        if effective_target <= num_sides:
                            probabilities.append(
                                (num_sides - effective_target + 1) / num_sides
                            )
                        else:
                            probabilities.append(0.0)
            # Calculate the odds of any of the alternatives reaching the target number
            odds = precise_odds_of_alternatives(probabilities)
            # Print the result
            print(f"Odds: {odds}")


new_menu_loop()
