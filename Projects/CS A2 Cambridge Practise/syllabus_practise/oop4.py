class Character:
    def __init__(self, Name: str, XCoordinate: int, YCoordinate: int):
        self.__Name = Name
        self.__XCoordinate = XCoordinate
        self.__YCoordinate = YCoordinate

    def GetName(self):
        return self.__Name

    def GetX(self):
        return self.__XCoordinate

    def GetY(self):
        return self.__YCoordinate

    def ChangePosition(self, XChange: int, YChange: int):
        self.__XCoordinate += XChange
        self.__YCoordinate += YChange


characters: list[Character] = []
with open("Characters.txt", "r") as f:
    for i in range(10):
        n = f.readline().strip("\n")
        x = int(f.readline().strip("\n"))
        y = int(f.readline().strip("\n"))
        characters.append(Character(n, x, y))

indexFound = -1
while indexFound == -1:
    toSearch = input("Name to search: ")
    for i in range(10):
        if toSearch == characters[i].GetName():
            indexFound = i
            break
    if indexFound == -1:
        print("Not found, try again")

while True:
    movement = input("Action key (WASD): ").lower()
    if movement in ["w", "a", "s", "d"]:
        break
    print("Invalid key, try again")

if movement == "w":
    characters[indexFound].ChangePosition(0, 1)
elif movement == "a":
    characters[indexFound].ChangePosition(-1, 0)
elif movement == "s":
    characters[indexFound].ChangePosition(0, -1)
else:
    characters[indexFound].ChangePosition(1, 0)

print(
    f"{characters[indexFound].GetName()} has changed coordinates to "
    f"X = {characters[indexFound].GetX()} and "
    f"Y = {characters[indexFound].GetY()}"
)
