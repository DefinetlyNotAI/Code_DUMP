class Horse:
    # Name: str
    # MaxFenceHeight: int
    # PercentageSuccess: int

    def __init__(self, name: str, max_fence_height: int, percentage_success: int):
        self.__Name: str = name
        self.__MaxFenceHeight: int = max_fence_height
        self.__PercentageSuccess: int = max(0, min(100, percentage_success))

    def GetName(self):
        return self.__Name

    def GetMaxFenceHeight(self):
        return self.__MaxFenceHeight

    def Success(self, height: int, risk: int):
        if height > self.__MaxFenceHeight:
            return self.__PercentageSuccess * 0.2
        return self.__PercentageSuccess * (1 - ((risk - 1) / 10))


class Fence:
    # Height: int
    # Risk: int

    def __init__(self, height: int, risk: int):
        self.__Height: int = max(70, min(180, height))
        self.__Risk: int = max(1, min(5, risk))

    def GetHeight(self):
        return self.__Height

    def GetRisk(self):
        return self.__Risk


Horses: list[Horse] = [
    Horse("Beauty", 150, 72),
    Horse("Jet", 160, 65)
]

for i in range(len(Horses)):
    print(Horses[i].GetName())

Course: list[Fence] = []

for i in range(4):
    while True:
        tempHeight = int(input(f"\nCourse {i + 1} height value: "))
        tempRisk = int(input(f"Course {i + 1} risk value: "))
        if tempHeight > 180 or tempHeight < 70:
            print("Invalid height")
        elif tempRisk > 5 or tempRisk < 0:
            print("Invalid risk")
        else:
            break

    Course.append(Fence(tempHeight, tempRisk))

AvgSuccessScore = []

print()
for horse in range(len(Horses)):
    avgSuccess = 0
    for course in range(4):
        success = Horses[horse].Success(Course[course].GetHeight(),Course[course].GetRisk())
        avgSuccess += success
        print(f"The horse {Horses[horse].GetName()} at fence {course} has a {success}% chance of success")
    AvgSuccessScore.append(avgSuccess/4)
    print(f"The horse {Horses[horse].GetName()} has an average {avgSuccess/4}% chance of jumping over all four fences")


if AvgSuccessScore[0] > AvgSuccessScore[1]:
    print(f"{Horses[0].GetName()} has the highest avg")
else:
    print(f"{Horses[1].GetName()} has the highest avg")
