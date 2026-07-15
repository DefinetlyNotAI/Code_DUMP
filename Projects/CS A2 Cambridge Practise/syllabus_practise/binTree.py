ArrayNodes: list[list[int]] = [[-1 for dp in range(3)] for nodes in range(20)]

FreeNode: int = 6
RootPointer: int = 0
ArrayNodes[0] = [1, 20, 5]
ArrayNodes[1] = [2, 15, -1]
ArrayNodes[2] = [-1, 3, 3]
ArrayNodes[3] = [-1, 9, 4]
ArrayNodes[4] = [-1, 10, -1]
ArrayNodes[5] = [-1, 58, -1]


def SearchValue(Root: int, ValueToFind: int):
    if Root == -1 or ArrayNodes[Root][1] == -1:
        return -1

    if ArrayNodes[Root][1] == ValueToFind:
        return Root

    if ArrayNodes[Root][1] > ValueToFind:
        return SearchValue(ArrayNodes[Root][0], ValueToFind)

    if ArrayNodes[Root][1] < ValueToFind:
        return SearchValue(ArrayNodes[Root][2], ValueToFind)


def PostOrder(Root: int):
    if Root == -1:
        return
    if ArrayNodes[Root][0] != -1:
        PostOrder(ArrayNodes[Root][0])
    if ArrayNodes[Root][2] != -1:
        PostOrder(ArrayNodes[Root][2])
    print(ArrayNodes[Root][1])


sv = SearchValue(RootPointer, 15)
if sv == -1:
    print("Value not found in tree")
else:
    print(f"Value found in index {sv}")
PostOrder(RootPointer)
