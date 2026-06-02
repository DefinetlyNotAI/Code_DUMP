class Node:
    # LeftPointer : INTEGER
    # Data : INTEGER
    # RightPointer : INTEGER

    def __init__(self, data: int):
        self.LeftPointer: int = -1
        self.Data: int = data
        self.RightPointer: int = -1

    def GetLeft(self):
        return self.LeftPointer

    def GetRight(self):
        return self.RightPointer

    def GetData(self):
        return self.Data

    def SetLeft(self, value: int):
        self.LeftPointer = value

    def SetRight(self, value: int):
        self.RightPointer = value

    def SetData(self, value: int):
        self.Data = value


class TreeClass:
    # Tree : ARRAY [0..19] OF Node
    # FirstNode : INTEGER
    # NumberNodes : INTEGER

    def __init__(self):
        self.Tree: list[Node] = [Node(-1) for _ in range(20)]
        self.FirstNode: int = -1
        self.NumberNodes: int = 0

    def InsertNode(self, NewNode: Node):
        self.Tree[self.NumberNodes] = NewNode
        if self.NumberNodes == 0:
            self.NumberNodes += 1
            self.FirstNode = 0
            return
        current_index = self.FirstNode
        while True:
            current_node = self.Tree[current_index]
            if NewNode.GetData() < current_node.GetData():
                if current_node.GetLeft() == -1:
                    current_node.SetLeft(self.NumberNodes)
                    break
                else:
                    current_index = current_node.GetLeft()
            else:
                if current_node.GetRight() == -1:
                    current_node.SetRight(self.NumberNodes)
                    break
                else:
                    current_index = current_node.GetRight()
        self.NumberNodes += 1

    def OutputTree(self):
        if self.NumberNodes == 0:
            print('No nodes')
            return
        for i in range(self.NumberNodes):
            print(self.Tree[i].GetLeft(), end=' ')
            print(self.Tree[i].GetData(), end=' ')
            print(self.Tree[i].GetRight())


tree = TreeClass()
for value in [10, 11, 5, 1, 20, 7, 15]:
    tree.InsertNode(Node(value))
tree.OutputTree()
