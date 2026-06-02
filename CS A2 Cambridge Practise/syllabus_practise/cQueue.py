QueueArray: list[str] = ["" for _ in range(10)]

HeadPtr: int = 0
TailPtr: int = 0
ItemsNum: int = 0


def Enqueue(DataToAdd: str) -> bool:
    global HeadPtr, TailPtr, ItemsNum, QueueArray

    if ItemsNum == 10:
        return False

    QueueArray[TailPtr] = DataToAdd

    if TailPtr >= 9:
        TailPtr = 0
    else:
        TailPtr += 1

    ItemsNum += 1
    return True


def Dequeue() -> bool | str:
    global HeadPtr, TailPtr, ItemsNum, QueueArray

    if ItemsNum == 0:
        return False

    value = QueueArray[HeadPtr]

    HeadPtr += 1
    if HeadPtr >= len(QueueArray):
        HeadPtr = 0

    ItemsNum -= 1

    return value


for _ in range(11):
    state = Enqueue(input("Value to add to queue: "))
    print("Added successfully" if state else "Failed to add to queue (full queue)")
print(f"First value: {Dequeue()}")
print(f"Second value: {Dequeue()}")
