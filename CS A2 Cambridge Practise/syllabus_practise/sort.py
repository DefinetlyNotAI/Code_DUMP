Jobs: list[list[int]] = [[0 for _ in range(2)] for _ in range(100)]
NumberOfJobs: int = 0


def Initialise():
    global Jobs, NumberOfJobs
    NumberOfJobs = 0
    Jobs = [[-1, -1] for _ in range(100)]


def AddJob(jobNum: int, priority: int):
    global Jobs, NumberOfJobs

    if 1 > priority > 10 or jobNum < 0 or NumberOfJobs == 100:
        print("Not added")
        return

    for i in range(len(Jobs)):
        if Jobs[i][0] == -1:
            Jobs[i] = [jobNum, priority]
            NumberOfJobs += 1
            print("Added")
            return

    print("Not added")


def InsertionSort():
    global Jobs
    for i in range(1, len(Jobs)):
        j = i
        while j > 0 and Jobs[j-1][1] > Jobs[j][1]:
            if Jobs[j][1] == -1:
                j -= 1
                continue
            Jobs[j-1], Jobs[j] = Jobs[j], Jobs[j-1]
            j -= 1


def PrintArray():
    for i in range(NumberOfJobs):
        print(f"{Jobs[i][0]} priority {Jobs[i][1]}")


Initialise()
AddJob(12, 10)
AddJob(526, 9)
AddJob(33, 8)
AddJob(12, 9)
AddJob(78, 1)
InsertionSort()
PrintArray()
