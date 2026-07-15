# Global variables
LList = [[-1, i + 1] for i in range(20)]
LList[19][1] = -1  # last node

FirstEmpty = 0
FirstNode = -1


def InsertData():
    global FirstEmpty, FirstNode, LList

    for _ in range(5):
        if FirstEmpty == -1:
            return  # list full
        NewNode, FirstEmpty = FirstEmpty, LList[FirstEmpty][1]
        LList[NewNode][0], LList[NewNode][1], FirstNode = int(input("Input data: ")), FirstNode, NewNode


def OutputLinkedList():
    global FirstNode, LList

    current = FirstNode

    while current != -1:
        print(LList[current][0])
        current = LList[current][1]


def RemoveData(value):
    global FirstNode, FirstEmpty, LList

    current, previous = FirstNode, -1

    while current != -1:
        if LList[current][0] == value:
            if previous == -1:
                FirstNode = LList[current][1]
            else:
                LList[previous][1] = LList[current][1]

            # add to free list
            LList[current][1], LList[current][0], FirstEmpty = FirstEmpty, -1, current
            return

        previous, current = current, LList[current][1]


InsertData()
OutputLinkedList()
RemoveData(5)
print("After")
OutputLinkedList()
