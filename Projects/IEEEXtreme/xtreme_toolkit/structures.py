"""Linked list, binary search tree, trie, DSU, Fenwick, segment tree, heap.
All array-indexed APIs use 0-based indices unless documented otherwise.
"""
from __future__ import annotations
from typing import Any, Iterator

class LinkedNode:
    """
    Use when:
        Represent one element of a singly linked list. Each node
        stores a value and a reference to the next node.

    Inputs:
        value: Any value to store.
        next: Following LinkedNode, or None for the final node.

    Returns:
        Node object with .value and .next attributes.

    Example:
        node = LinkedNode(10)
        node.next = LinkedNode(20)

    Speed:
        O(1) time and memory to create one node.
    """

    def __init__(self, value: Any, next: LinkedNode | None=None) -> None:
        """
        Use when:
            Create one linked-list node and optionally connect it to another.

        Inputs:
            value: Data stored in this node.
            next: Following node, or None.

        Returns:
            Sets self.value and self.next. Does not return a value.

        Example:
            tail = LinkedNode(20)
            head = LinkedNode(10, tail)  # 10 -> 20

        Speed:
            O(1) time and memory.
        """
        self.value, self.next = (value, next)

class LinkedList:
    """
    Use when:
        Store data as connected nodes, allowing fast insertion at the
        front or back. Useful for learning pointer-based structures.

    Inputs:
        Create LinkedList() with no initial values.
        Use append(), prepend(), delete(), find(), and reverse().

    Returns:
        Mutable list object. Iterate to get values, or use len() for count.

    Example:
        a = LinkedList()
        a.append(2)
        a.prepend(1)
        list(a)  # [1, 2]

    Speed:
        Append/prepend O(1). Search/delete/reverse O(n).
        O(n) memory for n stored values.
    """

    def __init__(self) -> None:
        """
        Use when:
            Create an empty linked list.

        Inputs:
            No parameters.

        Returns:
            Sets head and tail to None and size to 0.

        Example:
            a = LinkedList()
            len(a)  # 0

        Speed:
            O(1) time and memory.
        """
        self.head = self.tail = None
        self.size = 0

    def append(self, value: Any) -> None:
        """
        Use when:
            Add a value at the END of this linked list.
            Use when repeatedly adding items in insertion order.

        Inputs:
            value: Item to store at the end.

        Returns:
            Changes the existing list. Returns None.

        Example:
            a = LinkedList()
            a.append(10)
            a.append(20)
            list(a)  # [10, 20]

        Speed:
            O(1) time and memory for one new node.
        """
        new_node = LinkedNode(value)
        if self.tail is None:
            self.head = new_node
        else:
            self.tail.next = new_node
        self.tail = new_node
        self.size += 1

    def prepend(self, value: Any) -> None:
        """
        Use when:
            Add a value at the BEGINNING of this linked list.

        Inputs:
            value: Item to insert at the front.

        Returns:
            Changes the existing list. Returns None.

        Example:
            a = LinkedList()
            a.append(20)
            a.prepend(10)
            list(a)  # [10, 20]

        Speed:
            O(1) time and memory for one new node.
        """
        self.head = LinkedNode(value, self.head)
        if self.tail is None:
            self.tail = self.head
        self.size += 1

    def delete(self, value: Any) -> bool:
        """
        Use when:
            Remove the first node that contains a specified value.
            Other matching values remain in the list.

        Inputs:
            value: Item to find and remove.

        Returns:
            True if a matching node was removed, otherwise False.

        Example:
            a = LinkedList()
            a.append(5)
            a.append(5)
            a.delete(5)  # True
            list(a)  # [5]

        Speed:
            O(n) time and O(1) extra memory.
        """
        previous, current = (None, self.head)
        while current is not None:
            if current.value == value:
                if previous is None:
                    self.head = current.next
                else:
                    previous.next = current.next
                if self.tail is current:
                    self.tail = previous
                self.size -= 1
                return True
            previous, current = (current, current.next)
        return False

    def find(self, value: Any) -> LinkedNode | None:
        """
        Use when:
            Search a linked list for the first node with the given value.

        Inputs:
            value: Item to search for.

        Returns:
            The matching LinkedNode object or None when absent.
            To get its stored value, use found.value.

        Example:
            a = LinkedList()
            a.append(7)
            a.find(7).value  # 7
            a.find(8)        # None

        Speed:
            O(n) time and O(1) memory.
        """
        current = self.head
        while current:
            if current.value == value:
                return current
            current = current.next
        return None

    def reverse(self) -> None:
        """
        Use when:
            Reverse the order of the existing nodes without making a
            separate list. Changes the list itself.

        Inputs:
            No additional parameters.

        Returns:
            Returns None. The list's head and tail are updated.

        Example:
            a = LinkedList()
            for x in [1, 2, 3]: a.append(x)
            a.reverse()
            list(a)  # [3, 2, 1]

        Speed:
            O(n) time and O(1) extra memory.
        """
        previous, current = (None, self.head)
        self.tail = self.head
        while current:
            next_value = current.next
            current.next = previous
            previous, current = (current, next_value)
        self.head = previous

    def __len__(self) -> int:
        """
        Use when:
            Get the number of stored nodes using len(list_object).

        Inputs:
            No additional parameters.

        Returns:
            Integer count of items.

        Example:
            a = LinkedList()
            a.append(9)
            len(a)  # 1

        Speed:
            O(1) time and memory.
        """
        return self.size

    def __iter__(self) -> Iterator[Any]:
        """
        Use when:
            Go through stored values from first to last in a for-loop.

        Inputs:
            No additional parameters.

        Returns:
            An iterator producing each stored value in order.

        Example:
            a = LinkedList()
            a.append(4)
            list(a)  # [4]

        Speed:
            O(n) total iteration time and O(1) extra memory.
        """
        current = self.head
        while current:
            yield current.value
            current = current.next

class TreeNode:
    """
    Use when:
        Represent one node in a binary search tree, with at most two
        children. Smaller numbers belong on the left, larger on the right.

    Inputs:
        value: Stored number or other comparable item.

    Returns:
        A node with .value, .left, and .right attributes.

    Example:
        root = TreeNode(5)
        root.left = TreeNode(3)

    Speed:
        O(1) time and memory per node.
    """

    def __init__(self, value: Any) -> None:
        """
        Use when:
            Create a tree node without any children.

        Inputs:
            value: Data held in the new node.

        Returns:
            Sets value and empty left/right child references.

        Example:
            node = TreeNode(8)
            node.left is None  # True

        Speed:
            O(1) time and memory.
        """
        self.value, self.left, self.right = (value, None, None)

def bst_insert(root_node: TreeNode | None, value: Any) -> TreeNode:
    """
    Use when:
        Insert a value into a binary search tree. Smaller values go left,
        larger values go right. Duplicate values are ignored.

    Inputs:
        root: Root TreeNode, or None for an empty tree.
        value: Item to add.

    Returns:
        Root TreeNode after insertion. Save the result back to root.

    Example:
        root = None
        root = bst_insert(root, 7)
        root = bst_insert(root, 3)
        list(bst_inorder(root))  # [3, 7]

    Speed:
        O(tree height) time and O(1) extra memory.
        O(n) worst-case time for a badly shaped tree.
    """
    if root_node is None:
        return TreeNode(value)
    current = root_node
    while True:
        if value == current.value:
            return root_node
        if value < current.value:
            if current.left is None:
                current.left = TreeNode(value)
                return root_node
            current = current.left
        else:
            if current.right is None:
                current.right = TreeNode(value)
                return root_node
            current = current.right

def bst_find(root_node: TreeNode | None, value: Any) -> TreeNode | None:
    """
    Use when:
        Find a stored value in a binary search tree by following
        left or right children instead of scanning every node.

    Inputs:
        root: Root TreeNode, or None.
        value: Target to find.

    Returns:
        Matching TreeNode or None if absent.

    Example:
        root = bst_insert(None, 7)
        bst_find(root, 7).value  # 7
        bst_find(root, 9)        # None

    Speed:
        O(tree height) time, O(n) worst case.
        O(1) extra memory.
    """
    while root_node:
        if value == root_node.value:
            return root_node
        root_node = root_node.left if value < root_node.value else root_node.right
    return None

def bst_inorder(root_node: TreeNode | None) -> Iterator[Any]:
    """
    Use when:
        Read the values in a binary search tree from smallest to largest.
        Useful when you need sorted values already stored in a BST.

    Inputs:
        root: Root TreeNode, or None.

    Returns:
        Iterator yielding each stored value in increasing order.

    Example:
        root = bst_insert(None, 7)
        root = bst_insert(root, 3)
        list(bst_inorder(root))  # [3, 7]

    Speed:
        O(n) time and O(tree height) extra memory.
    """
    stack = []
    while stack or root_node:
        while root_node:
            stack.append(root_node)
            root_node = root_node.left
        root_node = stack.pop()
        yield root_node.value
        root_node = root_node.right

class Trie:
    """
    Use when:
        Store words by shared beginnings to check complete words or
        whether any stored word starts with a particular prefix.

    Inputs:
        Create Trie(), then call insert(word), contains(word),
        or starts_with(prefix).

    Returns:
        Mutable word-search object.

    Example:
        t = Trie()
        t.insert('cat')
        t.contains('cat')     # True
        t.starts_with('ca')  # True

    Speed:
        Each lookup or insertion O(length of word).
        Memory depends on number of stored characters.
    """

    def __init__(self) -> None:
        """
        Use when:
            Create an empty word-prefix search structure.

        Inputs:
            No parameters.

        Returns:
            Creates an empty internal dictionary.

        Example:
            t = Trie()
            t.contains('cat')  # False

        Speed:
            O(1) time and memory.
        """
        self.root = {}

    def insert(self, word: str) -> None:
        """
        Use when:
            Save a complete word so you can search it or its beginnings later.

        Inputs:
            word: String to insert.

        Returns:
            Updates this trie. Returns None.

        Example:
            t = Trie()
            t.insert('cat')
            t.contains('cat')  # True

        Speed:
            O(len(word)) time and additional memory.
        """
        new_node = self.root
        for ch in word:
            new_node = new_node.setdefault(ch, {})
        new_node[None] = True

    def contains(self, word: str) -> bool:
        """
        Use when:
            Check whether a COMPLETE word was previously inserted.
            A prefix alone does not count as a stored word.

        Inputs:
            word: Exact string to look for.

        Returns:
            True if that full word exists, otherwise False.

        Example:
            t = Trie()
            t.insert('cat')
            t.contains('ca')   # False
            t.contains('cat')  # True

        Speed:
            O(len(word)) time and O(1) extra memory.
        """
        new_node = self.root
        for ch in word:
            if ch not in new_node:
                return False
            new_node = new_node[ch]
        return None in new_node

    def starts_with(self, prefix: str) -> bool:
        """
        Use when:
            Check whether any saved word starts with a given beginning.

        Inputs:
            prefix: Beginning of a word to search for.

        Returns:
            True if that prefix exists among stored words, else False.

        Example:
            t = Trie()
            t.insert('cat')
            t.starts_with('ca')  # True
            t.starts_with('do')  # False

        Speed:
            O(len(prefix)) time and O(1) extra memory.
        """
        new_node = self.root
        for ch in prefix:
            if ch not in new_node:
                return False
            new_node = new_node[ch]
        return True

class DSU:
    """
    Use when:
        Keep track of groups of nodes as connections are added.
        Useful for Kruskal's algorithm and checking connectivity.

    Inputs:
        n: Number of nodes, numbered 0 to n-1.

    Returns:
        Object supporting union(a,b), find(x), and components count.

    Example:
        d = DSU(3)
        d.union(0, 2)  # True
        d.find(0) == d.find(2)  # True

    Speed:
        Nearly O(1) per find/union on average (amortized O(alpha(n))).
        O(n) memory.
    """

    def __init__(self, count: int) -> None:
        """
        Use when:
            Create n separate groups, initially one for every node.

        Inputs:
            n: Number of nodes (0 through n-1).

        Returns:
            Sets parent, group sizes, and number of components.

        Example:
            d = DSU(4)
            d.components  # 4

        Speed:
            O(n) time and memory.
        """
        self.parent = list(range(count))
        self.size = [1] * count
        self.components = count

    def find(self, number: int) -> int:
        """
        Use when:
            Get the group ID of a node. Compare find(a) == find(b)
            to check if a and b are currently connected.

        Inputs:
            x: Node number.

        Returns:
            Integer representing the node's group. The ID may change
            when groups are merged, so use it for comparisons.

        Example:
            d = DSU(3)
            d.union(0, 2)
            d.find(0) == d.find(2)  # True

        Speed:
            Almost O(1) amortized time, O(alpha(n)).
        """
        while self.parent[number] != number:
            self.parent[number] = self.parent[self.parent[number]]
            number = self.parent[number]
        return number

    def union(self, first: int, second: int) -> bool:
        """
        Use when:
            Join the groups containing two nodes.
            Useful when adding a road or merging two networks.

        Inputs:
            a: First node.
            b: Second node.

        Returns:
            True if two separate groups were joined.
            False if both nodes were already in the same group.

        Example:
            d = DSU(3)
            d.union(0, 1)  # True
            d.union(0, 1)  # False
            d.components  # 2

        Speed:
            Almost O(1) amortized time, O(alpha(n)).
        """
        first, second = (self.find(first), self.find(second))
        if first == second:
            return False
        if self.size[first] < self.size[second]:
            first, second = (second, first)
        self.parent[second] = first
        self.size[first] += self.size[second]
        self.components -= 1
        return True

class Fenwick:
    """
    Use when:
        Manage numbers that change over time while quickly answering
        sum questions about consecutive ranges.

    Inputs:
        n: Number of values, initially all zero.
        Indices in public methods start at 0.

    Returns:
        Object supporting add(i, delta), prefix_sum(end),
        and range_sum(left, right).

    Example:
        f = Fenwick(3)
        f.add(1, 5)
        f.range_sum(0, 2)  # 5

    Speed:
        O(n) setup; O(log n) per update or sum.
        O(n) memory.
    """

    def __init__(self, count: int) -> None:
        """
        Use when:
            Create an array of n zeros for fast updates and range sums.

        Inputs:
            n: Length of array.

        Returns:
            Initializes the empty tree and stores its size.

        Example:
            f = Fenwick(4)
            f.prefix_sum(4)  # 0

        Speed:
            O(n) time and memory.
        """
        self.n = count
        self.bit = [0] * (count + 1)

    def add(self, index: int, change: int) -> None:
        """
        Use when:
            Increase or decrease one value in the stored array.
            This ADDS a change instead of replacing the current value.

        Inputs:
            i: Zero-based position to change.
            delta: Amount to add, which can be negative.

        Returns:
            Updates the tree. Returns None.

        Example:
            f = Fenwick(3)
            f.add(1, 5)
            f.add(1, -2)
            f.range_sum(1, 2)  # 3

        Speed:
            O(log n) time and O(1) extra memory.
        """
        assert 0 <= index < self.n
        index += 1
        while index <= self.n:
            self.bit[index] += change
            index += index & -index

    def prefix_sum(self, end_index: int) -> int:
        """
        Use when:
            Find the sum of all numbers before a given index.

        Inputs:
            end: Exclusive end index. Includes indices 0 through end-1.

        Returns:
            Sum of the first end values. Returns 0 for end=0.

        Example:
            f = Fenwick(3)
            f.add(0, 4)
            f.add(1, 6)
            f.prefix_sum(2)  # 10

        Speed:
            O(log n) time and O(1) extra memory.
        """
        assert 0 <= end_index <= self.n
        answers = 0
        while end_index:
            answers += self.bit[end_index]
            end_index -= end_index & -end_index
        return answers

    def range_sum(self, left: int, right: int) -> int:
        """
        Use when:
            Find the sum of a consecutive section of a changing array.

        Inputs:
            left: Starting index, inclusive.
            right: Ending index, EXCLUSIVE.

        Returns:
            Sum of elements from left through right-1.

        Example:
            f = Fenwick(3)
            f.add(1, 5)
            f.range_sum(0, 2)  # 5

        Speed:
            O(log n) time and O(1) extra memory.
        """
        return self.prefix_sum(right) - self.prefix_sum(left)

class SegmentTree:
    """
    Use when:
        Store a list of numbers so you can replace individual values and
        quickly calculate sums across ranges after each change.

    Inputs:
        arr: Initial list of numbers.

    Returns:
        Object with set(index, value) and query(left, right).

    Example:
        s = SegmentTree([2, 4, 6])
        s.query(0, 2)  # 6
        s.set(1, 7)
        s.query(0, 2)  # 9

    Speed:
        O(n) to build and O(log n) per update/query.
        O(n) memory.
    """

    def __init__(self, numbers: list[int]) -> None:
        """
        Use when:
            Build a segment tree for range sums from existing values.

        Inputs:
            arr: List of initial numbers, possibly empty.

        Returns:
            Creates a tree storing partial sums. No separate return.

        Example:
            s = SegmentTree([2, 4, 6])
            s.query(0, 3)  # 12

        Speed:
            O(n) time and O(n) memory.
        """
        self.n = len(numbers)
        self.size = 1
        while self.size < self.n:
            self.size *= 2
        self.tree = [0] * (self.size * 2)
        self.tree[self.size:self.size + self.n] = numbers
        for index in range(self.size - 1, 0, -1):
            self.tree[index] = self.tree[index * 2] + self.tree[index * 2 + 1]

    def set(self, index: int, value: int) -> None:
        """
        Use when:
            REPLACE one value at an index. Use when an element changes
            to a new number, not when adding an increment.

        Inputs:
            i: Zero-based index to modify.
            value: New value to store.

        Returns:
            Updates the existing tree. Returns None.

        Example:
            s = SegmentTree([2, 4, 6])
            s.set(1, 10)
            s.query(0, 3)  # 18

        Speed:
            O(log n) time and O(1) extra memory.
        """
        assert 0 <= index < self.n
        index += self.size
        self.tree[index] = value
        while index > 1:
            index //= 2
            self.tree[index] = self.tree[2 * index] + self.tree[2 * index + 1]

    def query(self, left: int, right: int) -> int:
        """
        Use when:
            Get the sum of a consecutive range, even after modifications.

        Inputs:
            left: Inclusive start index.
            right: Exclusive end index.

        Returns:
            Sum of arr[left:right] based on the latest updates.

        Example:
            s = SegmentTree([2, 4, 6])
            s.query(1, 3)  # 10

        Speed:
            O(log n) time and O(1) extra memory.
        """
        assert 0 <= left <= right <= self.n
        left += self.size
        right += self.size
        answers = 0
        while left < right:
            if left & 1:
                answers += self.tree[left]
                left += 1
            if right & 1:
                right -= 1
                answers += self.tree[right]
            left //= 2
            right //= 2
        return answers

class MinHeap:
    """
    Use when:
        Repeatedly retrieve the smallest item while adding new items.
        For contest code, Python's heapq is usually simpler.

    Inputs:
        Create MinHeap(), then push(value) and pop().
        Values must be mutually comparable.

    Returns:
        Object that stores values in heap order, not sorted order.

    Example:
        h = MinHeap()
        h.push(5)
        h.push(2)
        h.pop()  # 2

    Speed:
        O(log n) per push or pop, O(1) for len().
        O(n) memory.
    """

    def __init__(self) -> None:
        """
        Use when:
            Create an empty minimum heap.

        Inputs:
            No parameters.

        Returns:
            Initializes an empty data list.

        Example:
            h = MinHeap()
            len(h)  # 0

        Speed:
            O(1) time and memory.
        """
        self.data = []

    def push(self, value: Any) -> None:
        """
        Use when:
            Add an item to a heap that lets you retrieve the smallest
            item efficiently. Does not fully sort all elements.

        Inputs:
            value: Number or another comparable value.

        Returns:
            Updates the heap. Returns None.

        Example:
            h = MinHeap()
            h.push(8)
            h.push(3)
            h.pop()  # 3

        Speed:
            O(log n) time; O(1) amortized extra space per insertion.
        """
        first = self.data
        first.append(value)
        index = len(first) - 1
        while index:
            prime = (index - 1) // 2
            if first[prime] <= first[index]:
                break
            first[index], first[prime] = (first[prime], first[index])
            index = prime

    def pop(self) -> Any:
        """
        Use when:
            Remove and return the smallest currently stored value.

        Inputs:
            No parameters.

        Returns:
            Smallest value, removed from the heap.
            Raises IndexError if the heap is empty.

        Example:
            h = MinHeap()
            h.push(9)
            h.push(2)
            h.pop()  # 2

        Speed:
            O(log n) time and O(1) extra memory.
        """
        first = self.data
        if not first:
            raise IndexError('pop from empty heap')
        value = first[0]
        last = first.pop()
        if first:
            first[0] = last
            index = 0
            while 2 * index + 1 < len(first):
                other_index = 2 * index + 1
                if other_index + 1 < len(first) and first[other_index + 1] < first[other_index]:
                    other_index += 1
                if first[index] <= first[other_index]:
                    break
                first[index], first[other_index] = (first[other_index], first[index])
                index = other_index
        return value

    def __len__(self) -> int:
        """
        Use when:
            Count how many values are currently in the heap.

        Inputs:
            No parameters.

        Returns:
            Number of stored values as an integer.

        Example:
            h = MinHeap()
            h.push(4)
            len(h)  # 1

        Speed:
            O(1) time and memory.
        """
        return len(self.data)

class HashMap:
    """
    Use when:
        Store values under keys, like a name linked to a score.
        Python's built-in dict is usually better for competition solutions.

    Inputs:
        Create HashMap(), then use m[key] = value, m[key],
        and del m[key]. Keys must be hashable.

    Returns:
        Mutable custom dictionary-like object.

    Example:
        m = HashMap()
        m['cat'] = 3
        m['cat']  # 3

    Speed:
        Average O(1) per operation, worst O(n).
        O(n) memory.
    """

    def __init__(self, capacity: int=8) -> None:
        """
        Use when:
            Create an empty custom hash map using separate buckets.

        Inputs:
            capacity: Initial number of buckets (default 8).

        Returns:
            Sets up empty buckets and item count.

        Example:
            m = HashMap()
            len(m)  # 0

        Speed:
            O(capacity) time and memory.
        """
        self.buckets = [[] for _ in range(max(1, capacity))]
        self.size = 0

    def _bucket(self, key: Any) -> list[list[Any]]:
        """
        Use when:
            Internal method: choose where a key is stored based on its hash.
            Normally use m[key] rather than calling this directly.

        Inputs:
            key: Hashable key such as an integer, string, or tuple.

        Returns:
            List of stored key/value pairs in that key's bucket.

        Example:
            m = HashMap()
            m['a'] = 1
            m._bucket('a')  # bucket containing ['a', 1]

        Speed:
            O(1) average time; returns an existing bucket.
        """
        return self.buckets[hash(key) % len(self.buckets)]

    def __setitem__(self, key: Any, value: Any) -> None:
        """
        Use when:
            Insert or replace a value using square brackets, m[key] = value.

        Inputs:
            key: Hashable identifier.
            value: Item to associate with that key.

        Returns:
            Updates this map. Returns None.

        Example:
            m = HashMap()
            m['a'] = 4
            m['a'] = 7
            m['a']  # 7

        Speed:
            Average O(1) per assignment, worst O(n).
            Occasional resizing takes O(n).
        """
        bucket = self._bucket(key)
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value
                return
        bucket.append([key, value])
        self.size += 1
        if self.size > len(self.buckets) * 0.75:
            old = self.buckets
            self.buckets = [[] for _ in range(len(old) * 2)]
            for second in old:
                for steps, next_node in second:
                    self._bucket(steps).append([steps, next_node])

    def __getitem__(self, key: Any) -> Any:
        """
        Use when:
            Retrieve the value stored under a key using m[key].

        Inputs:
            key: Identifier to look up.

        Returns:
            The associated value.
            Raises KeyError if the key does not exist.

        Example:
            m = HashMap()
            m['a'] = 3
            m['a']  # 3

        Speed:
            Average O(1), worst O(n).
        """
        for steps, next_node in self._bucket(key):
            if steps == key:
                return next_node
        raise KeyError(key)

    def __delitem__(self, key: Any) -> None:
        """
        Use when:
            Remove a key and its value using del m[key].

        Inputs:
            key: Key to delete.

        Returns:
            Deletes the entry. Returns None.
            Raises KeyError if the key is missing.

        Example:
            m = HashMap()
            m['a'] = 3
            del m['a']
            len(m)  # 0

        Speed:
            Average O(1), worst O(n).
        """
        bucket = self._bucket(key)
        for index, (steps, _) in enumerate(bucket):
            if steps == key:
                bucket.pop(index)
                self.size -= 1
                return
        raise KeyError(key)

    def __len__(self) -> int:
        """
        Use when:
            Count the number of different keys stored in a custom hash map.

        Inputs:
            No parameters.

        Returns:
            Integer number of keys.

        Example:
            m = HashMap()
            m['a'] = 1
            len(m)  # 1

        Speed:
            O(1) time and memory.
        """
        return self.size
