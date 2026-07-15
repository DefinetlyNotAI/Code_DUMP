class Greeting:
    @staticmethod
    def hello(fname: str = None, lname: str = None) -> None:
        print("Hello" if fname is None and lname is None else f"Hello {fname if lname is None else f'{fname} {lname}'}")


greet = Greeting()
greet.hello()
greet.hello(fname="John")
greet.hello(fname="John", lname="Doe")
