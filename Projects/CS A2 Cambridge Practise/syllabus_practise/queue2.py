Queue: list[int] = [-1 for _ in range(100)]
HeadPtr: int = -1
TailPtr: int = 0


def Enqueue(val: int):
    global HeadPtr, Queue, TailPtr

    if TailPtr >= len(Queue):
        return False

    if HeadPtr == -1:
        HeadPtr = 0

    Queue[TailPtr] = val
    TailPtr += 1
    return True


def Dequeue():
    global HeadPtr, Queue, TailPtr

    if HeadPtr == -1 or HeadPtr >= TailPtr:
        return -1

    value, Queue[HeadPtr] = Queue[HeadPtr], -1
    HeadPtr += 1

    if HeadPtr == TailPtr:
        HeadPtr = -1
        TailPtr = 0

    return value


def RecursiveOutput(Start: int) -> int:
    Total = Queue[Start]
    if Total == -1:
        Total = 0
    if Start == 0:
        return Total
    return Total + RecursiveOutput(Start - 1)


success = True
for i in range(1, 21):
    if not Enqueue(i):
        success = False
if success:
    print("Successful")
else:
    print("Unsuccessful")

print(RecursiveOutput(len(Queue) - 1))
