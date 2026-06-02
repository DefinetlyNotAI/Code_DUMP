# ADTs, OOP, insertion sort, binary tree/search and bubble sort
# linked lists, queues, stacks


def ReadData() -> list[str]:
    data = []
    with open("Data.txt", "r") as f:
        for i in range(45):
            data.append(f.readline().rstrip("\n"))
    return data


def FormatArray(array: list[str]) -> str:
    text = ""
    for i in range(len(array)):
        text += f"{array[i]} "
    return text.strip()


def CompareStrings(str1: str, str2: str):
    for i in range(min(len(str1), len(str2))):
        if str1[i] < str2[i]:
            return 1  # str1 is first
        elif str1[i] > str2[i]:
            return 2  # str2 is first


def Bubble(array: list[str]) -> list[str]:
    n = len(array)
    if n <= 1:
        return array

    for _ in range(n):
        for i in range(n - 1):
            if CompareStrings(array[i], array[i + 1]) == 2:
                array[i], array[i+1] = array[i+1], array[i]

    return array


if __name__ == "__main__":
    print(FormatArray(Bubble(ReadData())))
