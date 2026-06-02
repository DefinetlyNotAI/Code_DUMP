array = [1, 2, 3, 4, 6, 7, 8, 10, 11, 22, 34, 55, 78, 89, 90, 100]


def BinarySearch(Int, low, high):
    global array
    if low > high:
        return -1
    result = (high + low) // 2
    if array[result] == Int:
        return result
    elif array[result] < Int:
        return BinarySearch(Int, result + 1, high)
    else:
        return BinarySearch(Int, low, result - 1)


s = len(array)
r = BinarySearch(89, 0, s)
print(f"Index: {r}")
print(f"Value of index: {array[r]}")
