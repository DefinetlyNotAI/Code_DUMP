"""Primes, modular arithmetic, modular combinations."""

def sieve(limit: int) -> list[int]:
    """List prime numbers up to a chosen limit.

    Example:
        sieve(10)  # [2, 3, 5, 7]"""
    if limit < 2:
        return []
    is_prime = bytearray(b'\x01') * (limit + 1)
    is_prime[:2] = b'\x00\x00'
    for index in range(2, int(limit ** 0.5) + 1):
        if is_prime[index]:
            is_prime[index * index:limit + 1:index] = b'\x00' * ((limit - index * index) // index + 1)
    return [index for index in range(2, limit + 1) if is_prime[index]]

def extended_gcd(first_number: int, second_number: int) -> tuple[int, int, int]:
    """Find the greatest common divisor and its Bézout coefficients.

    Example:
        extended_gcd(30, 12)  # gcd and two coefficients"""
    previous_remainder, remainder = first_number, second_number
    previous_first_coefficient, first_coefficient = 1, 0
    previous_second_coefficient, second_coefficient = 0, 1

    while remainder != 0:
        quotient = previous_remainder // remainder
        previous_remainder, remainder = remainder, previous_remainder - quotient * remainder
        previous_first_coefficient, first_coefficient = (
            first_coefficient,
            previous_first_coefficient - quotient * first_coefficient,
        )
        previous_second_coefficient, second_coefficient = (
            second_coefficient,
            previous_second_coefficient - quotient * second_coefficient,
        )

    if previous_remainder < 0:
        return (-previous_remainder, -previous_first_coefficient, -previous_second_coefficient)
    return (previous_remainder, previous_first_coefficient, previous_second_coefficient)

def mod_inverse(number: int, modulus: int) -> int:
    """Find the modular multiplicative inverse of a number.

    Example:
        mod_inverse(3, 11)  # 4

    Remember:
        An inverse exists only when the number and modulus are coprime."""
    g, number, _ = extended_gcd(number, modulus)
    if g != 1:
        raise ValueError('inverse does not exist')
    return number % modulus

def ncr_mod_prime(total_items: int, items_to_choose: int, prime_modulus: int) -> int:
    """Count combinations modulo a prime number.

    Example:
        ncr_mod_prime(5, 2, 7)  # 3

    Remember:
        The modulus must be prime."""
    if items_to_choose < 0 or items_to_choose > total_items:
        return 0
    if total_items >= prime_modulus:
        raise ValueError('requires n < p')
    items_to_choose = min(items_to_choose, total_items - items_to_choose)
    numerator = denominator = 1
    for steps in range(1, items_to_choose + 1):
        numerator = numerator * (total_items - steps + 1) % prime_modulus
        denominator = denominator * steps % prime_modulus
    return numerator * pow(denominator, prime_modulus - 2, prime_modulus) % prime_modulus

def prime_factors(number: int) -> list[tuple[int, int]]:
    """Break an integer into prime factors and their exponents.

    Example:
        prime_factors(60)  # [(2, 2), (3, 1), (5, 1)]"""
    if number < 1:
        raise ValueError('n must be positive')
    result = []
    factor = 2
    while factor * factor <= number:
        if number % factor == 0:
            count = 0
            while number % factor == 0:
                number //= factor
                count += 1
            result.append((factor, count))
        factor += 1 if factor == 2 else 2
    if number > 1:
        result.append((number, 1))
    return result
