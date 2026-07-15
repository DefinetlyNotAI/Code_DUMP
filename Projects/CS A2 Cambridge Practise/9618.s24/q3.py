Numberlist: list[int] = [100, 85, 644, 22, 15, 8, 1]
# LastItem: int = 0
# CheckItem: int = 0
# LoopAgain: bool = True


def RecursiveInsertion(IntegerArray: list[int], NumberElements: int) -> list[int]:
    if NumberElements <= 1:
        return IntegerArray
    else:
        RecursiveInsertion(IntegerArray, NumberElements - 1)
        LastItem = IntegerArray[NumberElements - 1]
        CheckItem = NumberElements - 2

    LoopAgain = True

    if CheckItem < 0:
        LoopAgain = False
    elif IntegerArray[CheckItem] < LastItem:
        LoopAgain = False

    while LoopAgain:
        IntegerArray[CheckItem + 1] = IntegerArray[CheckItem]
        CheckItem -= 1
        if CheckItem < 0:
            LoopAgain = False
        elif IntegerArray[CheckItem] < LastItem:
            LoopAgain = False

    IntegerArray[CheckItem + 1] = LastItem
    return IntegerArray


def IterativeInsertion(IntegerArray: list[int]) -> list[int]:
    for NumberElements in range(1, len(IntegerArray)):
        LastItem = IntegerArray[NumberElements]
        CheckItem = NumberElements - 1

        while CheckItem >= 0 and IntegerArray[CheckItem] > LastItem:
            IntegerArray[CheckItem + 1] = IntegerArray[CheckItem]
            CheckItem -= 1

        IntegerArray[CheckItem + 1] = LastItem

    return IntegerArray


if __name__ == '__main__':
    sorted_list = RecursiveInsertion(Numberlist, len(Numberlist))
    print('Recursive')
    print(sorted_list)
    sorted_list = IterativeInsertion(Numberlist)
    print('iterative')
    print(sorted_list)
