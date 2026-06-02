# Make: str
# Model: str
# Speed: int
# FuelLevel: int

class Vehicle:
    def __init__(self):
        self.Make: str = ""
        self.Model: str = ""
        self.Speed: int = 0
        self.FuelLevel: int = 0

    def Constructor(self, make: str, model: str, speed: int, fuel_level: int):
        self.Make = make
        self.Model = model
        self.Speed = speed
        self.FuelLevel = fuel_level
        if self.Speed > 300:
            self.Speed = 300
        if self.FuelLevel > 100:
            self.FuelLevel = 100

    def Description(self) -> str:
        return f"The vehicle is a {self.Make} {self.Model}, speed is {self.Speed} and fuel level is {self.FuelLevel}."


# BatteryCapacity: int
# ChargeLevel: int

class ElectricCar(Vehicle):
    def __init__(self):
        super().__init__()
        self.BatteryCapacity: int = 0
        self.ChargeLevel: int = 0

    # noinspection PyMethodOverriding
    def Constructor(self, make: str, model: str, speed: int, fuel_level: int, charge_level: int, battery_capacity: int):
        super().Constructor(make, model, speed, fuel_level)
        self.BatteryCapacity = battery_capacity
        self.ChargeLevel = charge_level

    def ChargeBattery(self, charge_by: int):
        self.ChargeLevel += charge_by
        if self.ChargeLevel > 100:
            self.ChargeLevel = 100

    def Description(self) -> str:
        return (f"The vehicle is a {self.Make} {self.Model}, speed is {self.Speed} and fuel level is {self.FuelLevel}. "
                f"It has a battery capacity of {self.BatteryCapacity}kWh and charge level is {self.ChargeLevel}.")


# LoadCapacity: int

class Truck(Vehicle):
    def __init__(self):
        super().__init__()
        self.LoadCapacity: int = 0

    # noinspection PyMethodOverriding
    def Constructor(self, make: str, model: str, speed: int, fuel_level: int, load_capacity: int):
        super().Constructor(make, model, speed, fuel_level)
        self.LoadCapacity = load_capacity

    def IncreaseLoad(self, increase_load_by: int):
        self.LoadCapacity += increase_load_by

    def Description(self) -> str:
        return (f"The vehicle is a {self.Make} {self.Model}, speed is {self.Speed} and fuel level is {self.FuelLevel}. "
                f"It carries {self.LoadCapacity} tonnes.")


if __name__ == "__main__":
    eCar = ElectricCar()
    truck = Truck()
    vehicle = Vehicle()

    eCar.Constructor(make="Tesla", model="Model3", speed=150, fuel_level=0,  battery_capacity=75, charge_level=80)
    truck.Constructor(make="Volvo", model="FH", speed=90, fuel_level=60, load_capacity=20)
    vehicle.Constructor(make="Honda", model="Civic", speed=110, fuel_level=50)

    truck.IncreaseLoad(increase_load_by=5)
    eCar.ChargeBattery(charge_by=10)

    print(eCar.Description())
    print(truck.Description())
    print(vehicle.Description())
