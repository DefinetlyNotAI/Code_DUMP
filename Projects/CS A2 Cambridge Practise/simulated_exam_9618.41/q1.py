startPointer: int = 0
emptyList: int = 5


class node:
    def __init__(self, data, nextNode):
        self.data: int = data
        self.nextNode: int = nextNode


datas = [1, 5, 6, 7, 2, 0, 0, 56, 0, 0]
nodes = [1, 4, 7, -1, 2, 6, 8, 3, 9, -1]
linkedList: list[node] = [node(0, -1) for n in range(10)]
for n in range(10):
    linkedList[n] = node(datas[n], nodes[n])


def outputNodes(array: list[node], _startPointer: int):
    print(array[_startPointer].data)
    if array[_startPointer].nextNode != -1:
        outputNodes(array, array[_startPointer].nextNode)


# todo learn properly how to implement stacks, queue and linked lists properly
#  speaking of which, practise super()
def addNode(array: list[node]) -> bool:
    global startPointer, emptyList

    while True:
        try:
            value = int(input("Node value to add: "))
            break
        except ValueError:
            print("Invalid input, must be int")

    if emptyList == -1:
        return False

    newNodeIndex = emptyList
    emptyList = array[newNodeIndex].nextNode
    array[newNodeIndex].data, array[newNodeIndex].nextNode = value, -1

    if startPointer == -1:
        startPointer = newNodeIndex
        return True

    current = startPointer
    while array[current].nextNode != -1:
        current = array[current].nextNode

    array[current].nextNode = newNodeIndex
    return True


outputNodes(linkedList, startPointer)
if addNode(linkedList):
    print("Successfully added node")
else:
    print("List is full, couldn't add node")
outputNodes(linkedList, startPointer)
