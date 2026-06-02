class Queue:
    # "QueueArray": list[int]
    # "HeadPointer": int
    # "TailPointer": int

    def __init__(self):
        self.QueueArray: list[int] = [-1] * 100
        self.Headpointer: int = -1
        self.Tailpointer: int = 0


TheQueue = Queue()


def Enqueue(AQueue: Queue, TheData: int) -> int:
    if AQueue.Headpointer == -1:
        AQueue.QueueArray[AQueue.Tailpointer] = TheData
        AQueue.Headpointer = 0
        AQueue.Tailpointer += 1
        return 1
    else:
        if AQueue.Tailpointer > 100:
            return -1
        else:
            AQueue.QueueArray[AQueue.Tailpointer] = TheData
            AQueue.Tailpointer += 1
            return 1


def ReturnAllData():
    global TheQueue
    start = TheQueue.Headpointer
    end = TheQueue.Tailpointer
    data = ""
    for i in range(start, end):
        data += f"{TheQueue.QueueArray[i]} "
    return data.strip()


for _ in range(10):
    while True:
        number = input("Number to enqueue: ")
        try:
            number = int(number)
            if number < 0:
                print("Must be larger than 0")
            else:
                break
        except Exception:
            print("Invalid number")
    enqReturn = Enqueue(TheQueue, number)
    if enqReturn == -1:
        print("Queue is full")
    else:
        print("Added item successfully")
print(ReturnAllData())


def Dequeue():
    global TheQueue
    if TheQueue.Tailpointer == TheQueue.Headpointer:
        return -1
    value = TheQueue.QueueArray[TheQueue.Headpointer]
    TheQueue.Headpointer += 1
    return value


for _ in range(2):
    returnDeq = Dequeue()
    print("Queue empty" if returnDeq == -1 else returnDeq)
