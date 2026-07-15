# Total 26/30

# 4/4, 3/3, 3/3
class Node:  # 1 mark
    def __init__(self, Data: int):  # 1 mark
        self.__LeftPointer: int = -1  # 1 mark
        self.__Data: int = Data  # 1 mark
        self.__RightPointer: int = -1

    def GetLeft(self):  # 1 mark
        return self.__LeftPointer

    def GetRight(self):  # 1 mark
        return self.__RightPointer

    def GetData(self):  # 1 mark
        return self.__Data

    def SetLeft(self, LeftPointer: int):  # 1 mark
        self.__LeftPointer = LeftPointer

    def SetRight(self, RightPointer: int):  # 1 mark
        self.__RightPointer = RightPointer

    def SetData(self, Data: int):  # 1 mark
        self.__Data = Data


# 4/4
class TreeClass:  # 1 mark
    def __init__(self):
        self.__FirstNode: int = -1  # 1 mark
        self.__NumberNodes: int = 0
        self.__Tree: list[Node] = [Node(-1) for _ in range(20)]  # 1 mark  # 1 mark

    # 2/6
    def InsertNode(self, NewNode: Node):  # 1 mark
        self.__Tree[self.__NumberNodes] = NewNode

        if self.__NumberNodes == 0:
            self.__NumberNodes += 1
            self.__FirstNode = 0
            return

        # TODO Relearn/memorise
        # 1 mark for the prev logic tho
        current_index = self.__FirstNode
        while True:
            current_node = self.__Tree[current_index]

            if NewNode.GetData() < current_node.GetData():
                if current_node.GetLeft() == -1:
                    current_node.SetLeft(self.__NumberNodes)
                    break
                else:
                    current_index = current_node.GetLeft()
            else:
                if current_node.GetRight() == -1:
                    current_node.SetRight(self.__NumberNodes)
                    break
                else:
                    current_index = current_node.GetRight()

        self.__NumberNodes += 1

    # 4/4
    def OutputTree(self):  # 1 mark
        found = False
        for i in range(len(self.__Tree)):  # 1 mark
            if self.__Tree[i].GetData() != -1:
                found = True
                print(f"{self.__Tree[i].GetLeft()} {self.__Tree[i].GetData()} {self.__Tree[i].GetRight()}")  # 1 mark  # 1 mark
        if not found:
            print("No nodes")


# 1/1, 4/4
TheTree = TreeClass()  # 1 mark
ints = [10, 11, 5, 1, 20, 7, 15]  # 1 mark
for i in range(len(ints)):
    TheTree.InsertNode(Node(ints[i]))  # 1 mark  # 1 mark
TheTree.OutputTree()  # 1 mark

# 1/1
# 1 mark
"""
2 10 1
-1 11 4
3 5 5
-1 1 -1
6 20 -1
-1 7 -1
-1 15 -1
"""
