# Total 22/23 -> Total all 70/75

# 1/1
NumberArray: list[int] = [100, 85, 644, 22, 15, 8, 1]  # 1 mark


# 4/4
def RecursiveInsertion(IntegerArray: list[int], NumberElements: int) -> list[int]:  # 1 mark
    # LastItem: int
    # CheckItem: int
    # LoopAgain: bool

    if NumberElements <= 1:
        return IntegerArray
    else:
        RecursiveInsertion(IntegerArray, NumberElements - 1)  # 1 mark
        LastItem = IntegerArray[NumberElements - 1]
        CheckItem = NumberElements - 2

    LoopAgain = True
    if CheckItem < 0:
        LoopAgain = False
    else:
        if IntegerArray[CheckItem] < LastItem:
            LoopAgain = False

    while LoopAgain:  # 1 mark
        IntegerArray[CheckItem + 1] = IntegerArray[CheckItem]
        CheckItem -= 1
        if CheckItem < 0:
            LoopAgain = False
        else:
            if IntegerArray[CheckItem] < LastItem:
                LoopAgain = False

    IntegerArray[CheckItem + 1] = LastItem
    return IntegerArray  # 1 mark


# 3/4
def IterativeInsertion(IntegerArray: list[int]) -> list[int]:  # 1 mark
    for i in range(1, len(IntegerArray)):  # 1 mark
        j = i
        while j > 0 and IntegerArray[j - 1] > IntegerArray[j]:  # 1 mark
            IntegerArray[j], IntegerArray[j - 1] = IntegerArray[j - 1], IntegerArray[i]
            j -= 1
    return IntegerArray


# 6/6
def BinarySearch(IntegerArray: list[int], First: int, Last: int, ToFind: int):
    Middle = int((First + Last) / 2)  # 1 mark

    if IntegerArray[Middle] == ToFind:
        return Middle

    if Middle == First or Middle == Last:  # 1 mark
        return -1  # 1 mark

    if IntegerArray[Middle] > ToFind:  # 1 mark
        return BinarySearch(IntegerArray, First, Middle, ToFind)  # 1 mark
    else:
        return BinarySearch(IntegerArray, Middle, Last, ToFind)  # 1 mark  # 1 mark


# 2/2, 1/1, 2/2
RINumberArray = RecursiveInsertion(NumberArray, len(NumberArray))  # 1 mark
print(f"Recursive\n{RINumberArray}")  # 1 mark
IINumberArray = IterativeInsertion(NumberArray)  # 1 mark
print(f"iterative\n{IINumberArray}")
value = BinarySearch(IINumberArray, 0, len(IINumberArray), 644)  # 1 mark
print("Not found" if value == -1 else f"Found number in index {value}")  # 1 mark

# 3/3
# 1 mark  # 1 mark  # 1 mark
"""
Recursive
[1, 8, 15, 22, 85, 100, 644]
iterative
[1, 8, 15, 22, 85, 100, 644]
Found number in index 6
"""