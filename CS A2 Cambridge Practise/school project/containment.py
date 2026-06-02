class Engine:
    @staticmethod
    def start() -> None:
        print("Engine started")


class Car:
    def __init__(self):
        self.engine = Engine()

    def startCar(self) -> None:
        self.engine.start()


c1 = Car()
c1.startCar()
c2 = Car()
c2.startCar()
