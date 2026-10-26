"""Representative dynamic programming implementation patterns."""

def knapsack_01(weights: list[int], values: list[int], capacity: int) -> int:
    """Pick items with maximum value without exceeding a weight limit.

    Example:
        knapsack_01([2, 3], [5, 7], 3)  # 7

    Remember:
        Each item may be selected once."""
    best_value_for_capacity = [0] * (capacity + 1)
    for item_weight, item_value in zip(weights, values):
        for available_capacity in range(capacity, item_weight - 1, -1):
            best_value_for_capacity[available_capacity] = max(best_value_for_capacity[available_capacity], best_value_for_capacity[available_capacity - item_weight] + item_value)
    return best_value_for_capacity[capacity]

def lis_length(numbers: list[int]) -> int:
    """Count the longest strictly increasing subsequence.

    Example:
        lis_length([3, 1, 2, 4, 1])  # 3

    Remember:
        Items can be skipped, but their order cannot change."""
    from bisect import bisect_left
    smallest_endings = []
    for number in numbers:
        insertion_index = bisect_left(smallest_endings, number)
        if insertion_index == len(smallest_endings):
            smallest_endings.append(number)
        else:
            smallest_endings[insertion_index] = number
    return len(smallest_endings)

def edit_distance(starting_text: str, target_text: str) -> int:
    """Count the fewest single-character edits between two strings.

    Example:
        edit_distance("cat", "cut")  # 1

    Remember:
        An edit can insert, remove, or replace one character."""
    previous_row = list(range(len(target_text) + 1))
    for start_length, starting_character in enumerate(starting_text, 1):
        current_row = [start_length] + [0] * len(target_text)
        for target_length, target_character in enumerate(target_text, 1):
            current_row[target_length] = min(previous_row[target_length] + 1, current_row[target_length - 1] + 1, previous_row[target_length - 1] + (starting_character != target_character))
        previous_row = current_row
    return previous_row[-1]

def tsp_bitmask(travel_costs: list[list[int]]) -> int | float:
    """Find the lowest-cost round trip visiting every city once.

    Example:
        tsp_bitmask([[0, 10, 15], [10, 0, 20], [15, 20, 0]])  # 45

    Remember:
        City 0 is the start and end. Suitable only for small city counts."""
    city_count = len(travel_costs)
    if city_count == 0:
        return 0
    infinity = float('inf')
    minimum_cost = [[infinity] * city_count for _ in range(1 << city_count)]
    minimum_cost[1][0] = 0
    for visited_cities in range(1 << city_count):
        if not visited_cities & 1:
            continue
        for last_city in range(city_count):
            if minimum_cost[visited_cities][last_city] == infinity:
                continue
            for next_city in range(city_count):
                if not visited_cities >> next_city & 1:
                    new_visited_cities = visited_cities | 1 << next_city
                    minimum_cost[new_visited_cities][next_city] = min(minimum_cost[new_visited_cities][next_city], minimum_cost[visited_cities][last_city] + travel_costs[last_city][next_city])
    return min((minimum_cost[-1][last_city] + travel_costs[last_city][0] for last_city in range(city_count)))
