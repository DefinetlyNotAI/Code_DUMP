"""String search and palindrome algorithms."""

def prefix_function(text: str) -> list[int]:
    """Measure matching prefixes used by the KMP string algorithm.

    Example:
        prefix_function("ababa")  # [0, 0, 1, 2, 3]"""
    pi = [0] * len(text)
    for index in range(1, len(text)):
        other_index = pi[index - 1]
        while other_index and text[index] != text[other_index]:
            other_index = pi[other_index - 1]
        if text[index] == text[other_index]:
            other_index += 1
        pi[index] = other_index
    return pi

def kmp_search(text: str, pattern: str) -> list[int]:
    """Find all starting positions of a pattern inside a string.

    Example:
        kmp_search("banana", "ana")  # [1, 3]

    Remember:
        Includes overlapping matches."""
    if not pattern:
        return list(range(len(text) + 1))
    pi = prefix_function(pattern)
    other_index, positions = (0, [])
    for index, ch in enumerate(text):
        while other_index and ch != pattern[other_index]:
            other_index = pi[other_index - 1]
        if ch == pattern[other_index]:
            other_index += 1
        if other_index == len(pattern):
            positions.append(index - other_index + 1)
            other_index = pi[other_index - 1]
    return positions

def z_function(text: str) -> list[int]:
    """Measure how many characters match the beginning at each position.

    Example:
        z_function("aabcaab")  # [0, 1, 0, 0, 3, 1, 0]"""
    count = len(text)
    match_lengths = [0] * count
    matching_start = matching_end = 0
    for index in range(1, count):
        if index < matching_end:
            match_lengths[index] = min(matching_end - index, match_lengths[index - matching_start])
        while index + match_lengths[index] < count and text[match_lengths[index]] == text[index + match_lengths[index]]:
            match_lengths[index] += 1
        if index + match_lengths[index] > matching_end:
            matching_start, matching_end = (index, index + match_lengths[index])
    return match_lengths

def manacher(text: str) -> tuple[list[int], list[int]]:
    """Find the palindrome radius around every character and gap.

    Example:
        manacher("abba")  # ([1, 1, 1, 1], [0, 0, 2, 0])

    Remember:
        Odd palindrome length is 2 * odd_radius - 1. Even length is 2 * even_radius."""
    text_length = len(text)
    odd_radii = [0] * text_length
    left_boundary, right_boundary = (0, -1)
    for center in range(text_length):
        radius = 1 if center > right_boundary else min(odd_radii[left_boundary + right_boundary - center], right_boundary - center + 1)
        while center - radius >= 0 and center + radius < text_length and (text[center - radius] == text[center + radius]):
            radius += 1
        odd_radii[center] = radius
        if center + radius - 1 > right_boundary:
            left_boundary, right_boundary = (center - radius + 1, center + radius - 1)
    even_radii = [0] * text_length
    left_boundary, right_boundary = (0, -1)
    for center in range(text_length):
        radius = 0 if center > right_boundary else min(even_radii[left_boundary + right_boundary - center + 1], right_boundary - center + 1)
        while center - radius - 1 >= 0 and center + radius < text_length and (text[center - radius - 1] == text[center + radius]):
            radius += 1
        even_radii[center] = radius
        if center + radius - 1 > right_boundary:
            left_boundary, right_boundary = (center - radius, center + radius - 1)
    return (odd_radii, even_radii)
