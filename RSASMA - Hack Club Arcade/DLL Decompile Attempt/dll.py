import os
import sys

# Get current username
try:
    username = os.environ.get("USERNAME")
except Exception as e:
    print(f"An error occurred fetching your username: {e}")
    sys.exit(e)

# Construct path to dotPeek
dotpeek_path = f"C:\\Users\\{username}\\AppData\\Local\\JetBrains\\Installations\\dotPeek242\\dotPeek64.exe"

# Ensure DLL path is provided
if len(sys.argv) < 2 or sys.argv[1] is None:
    print("You need to include the DLL path AFTER typing `python open.dll.py`")
    sys.exit("No file parsed")

# Validate that the path ends with .dll
if not sys.argv[1].endswith(".dll"):
    print("The path MUST lead to a `.dll` file. The file path given does not!")
    print(sys.argv[1])
    sys.exit("Non-DLL file parsed")

try:
    # Check if dotPeek exists
    if os.path.exists(dotpeek_path):
        # Get DLL path from command line arguments
        dll_path = sys.argv[1]
        
        # Construct and execute the command
        command = f'"{dotpeek_path}" "{dll_path}"'
        os.system(command)
    else:
        print(f"dotPeek does not exist: {dotpeek_path}")
        print("Please make sure you have it installed in that directory")
        sys.exit("dotPeek does not exist")
except Exception as e:
    print(f"An error occurred executing dotPeek64: {e}")
    sys.exit(e)
