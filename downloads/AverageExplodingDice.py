def average_exploding_dice(dice):
    """
    Calculate the average of a set of exploding dice.
    :param dice: A list of dice to roll.
    :return: The average of the dice.
    """
    # The average of a standard die is half the number of sides plus 0.5
    average_standard_die = lambda sides: sides / 2 + 0.5
    # The average of an exploding die is calculated using geometric series
    # It simplifies to: (avg of standard die) * (sides) / (sides-1)
    average_exploding_die = (
        lambda sides: average_standard_die(sides) * sides / (sides - 1)
    )
    # The average of multiple dice is the sum of the averages of each die
    return sum(average_exploding_die(sides) for sides in dice)


# Test the function when this file is executed as the main module
if __name__ == "__main__":
    print("Average: Exploding Dice")

    dice = [4, 6, 6]
    print(f"Average of dice {dice}:", average_exploding_dice(dice))

    dice = [4, 8]
    print(f"Average of dice {dice}:", average_exploding_dice(dice))

    dice = [4]
    print(f"Average of dice {dice}:", average_exploding_dice(dice))
