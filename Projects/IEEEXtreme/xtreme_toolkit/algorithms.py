"""Useful patterns not tied to a single data structure."""


def first_true(lowest_possible: int, past_last_possible: int, predicate) -> int:
    """Find the first integer that passes a yes/no test.

    Example:
        first_true(0, 10, lambda number: number * number >= 20)  # 5

    Remember:
        The test must stay True after its first True result."""
    while lowest_possible < past_last_possible:
        middle_number = (lowest_possible + past_last_possible) // 2
        if predicate(middle_number):
            past_last_possible = middle_number
        else:
            lowest_possible = middle_number + 1
    return lowest_possible


def prefix_sums(numbers: list[int]) -> list[int]:
    """Prepare running totals so range sums can be answered quickly.

    Example:
        totals = prefix_sums([2, 5, 3])  # [0, 2, 7, 10]
    # Sum indices 1 through 2: totals[3] - totals[1] = 8

    Remember:
        Range sums use an inclusive start and exclusive end."""
    result = [0]
    for number in numbers:
        result.append(result[-1] + number)
    return result


def sliding_window_max(numbers: list[int], window_size: int) -> list[int]:
    """Find the largest value in each consecutive group of a fixed size.

    Example:
        sliding_window_max([1, 3, 2, 5], 2)  # [3, 3, 5]

    Remember:
        An invalid window size returns an empty list."""
    from collections import deque
    if not 1 <= window_size <= len(numbers):
        return []
    candidate_indices = deque()
    maximums = []
    for index, number in enumerate(numbers):
        while candidate_indices and candidate_indices[0] <= index - window_size:
            candidate_indices.popleft()
        while candidate_indices and numbers[candidate_indices[-1]] <= number:
            candidate_indices.pop()
        candidate_indices.append(index)
        if index + 1 >= window_size:
            maximums.append(numbers[candidate_indices[0]])
    return maximums


def coordinate_compress(numbers: list[int]) -> tuple[list[int], list[int]]:
    """Replace large numbers with small, sorted integer IDs.

    Example:
        coordinate_compress([50, -2, 50, 9])  # ([2, 0, 2, 1], [-2, 9, 50])

    Remember:
        The second result maps each ID back to its original value."""
    sorted_unique_values = sorted(set(numbers))
    index_by_value = {number: index for index, number in enumerate(sorted_unique_values)}
    return ([index_by_value[number] for number in numbers], sorted_unique_values)
