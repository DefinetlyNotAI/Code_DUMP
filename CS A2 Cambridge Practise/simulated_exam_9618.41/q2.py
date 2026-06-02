arrayData: list[int] = [10, 5, 6, 7, 1, 12, 13, 15, 21, 8]


def linearSearch(toFind: int):
    for i in range(len(arrayData)):
        if toFind == arrayData[i]:
            return True
    return False


found = linearSearch(int(input("Enter value to search: ")))
if found:
    print("Value exists in array")
else:
    print("Value doesn't exist in array")


def bubbleSort():
    global arrayData
    for _ in range(len(arrayData)):
        for y in range(len(arrayData) - 1):
            if arrayData[y] > arrayData[y + 1]:
                arrayData[y], arrayData[y + 1] = arrayData[y + 1], arrayData[y]

bubbleSort()
