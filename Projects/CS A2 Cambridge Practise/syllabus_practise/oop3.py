class Balloon:
    def __init__(self, Colour: str, DefenceItem: str):
        self.__Health: int = 100
        self.__Colour: str = Colour
        self.__DefenceItem: str = DefenceItem

    def GetDefenceItem(self):
        return self.__DefenceItem

    def ChangeHealth(self, toChange: int):
        self.__Health += toChange

    def CheckHealth(self):
        return self.__Health <= 0


def Defend(bloon: Balloon):
    bloon.ChangeHealth(-int(input("What is your strength: ")))
    print(f"DEF Item: {bloon.GetDefenceItem()}")
    if bloon.CheckHealth():
        print("Congrats you defeated the balloon")
    else:
        print("Balloon is still alive!!")
    return bloon


Balloon1 = Balloon(input("Color of the balloon: ").strip(), input("Defence item of the balloon: ").strip())
Balloon1 = Defend(Balloon1)
