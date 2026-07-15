DataArray: list[int] = [0 for i in range(100)]


def ReadFile():
    try:
        with open("IntegerData.txt", "r") as f:
            for i in range(len(DataArray)):
                DataArray[i] = int(f.readline().strip('\n'))
        return DataArray
    except (FileNotFoundError or Exception) as err:
        print(f"An error occurred reading: {err}")


def FindValues():
    foundNum = 0

    while True:
        numberToFind = int(input("What number do you want to find?: "))
        if 0 <= numberToFind <= 100:
            break
        print("Must be from 0-100")

    for i in range(len(DataArray)):
        if DataArray[i] == numberToFind:
            foundNum += 1

    return foundNum


def BubbleSort():
    for _ in range(len(DataArray)):
        for i in range(len(DataArray) - 1):
            if DataArray[i] > DataArray[i + 1]:
                DataArray[i], DataArray[i+1] = DataArray[i+1], DataArray[i]
    print(DataArray)


ReadFile()
print(f"The number was found {FindValues()} times")
BubbleSort()
