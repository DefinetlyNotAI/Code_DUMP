class BinaryTreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


class BinaryTree:
    def __init__(self):
        self.root = None

    def insert(self, value):
        if self.root is None:
            self.root = BinaryTreeNode(value)
        else:
            self.__insert_recursive(self.root, value)

    def __insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = BinaryTreeNode(value)
            else:
                self.__insert_recursive(node.left, value)
        else:
            if node.right is None:
                node.right = BinaryTreeNode(value)
            else:
                self.__insert_recursive(node.right, value)

    def inorder_traversal(self):
        return self.__inorder_recursive(self.root)

    def __inorder_recursive(self, node):
        result = []
        if node is not None:
            result.extend(self.__inorder_recursive(node.left))
            result.append(node.value)
            result.extend(self.__inorder_recursive(node.right))
        return result


tree = BinaryTree()
tree.insert(5)
tree.insert(3)
tree.insert(7)
tree.insert(2)
tree.insert(4)
tree.insert(6)
tree.insert(8)

print("Inorder Traversal:", tree.inorder_traversal())
