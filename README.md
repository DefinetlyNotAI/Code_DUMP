# AntiVibe_AI

A very simple HC AI wrapper for a basic chat + coding assistance.

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction
AntiVibe AI is a lightweight AI wrapper designed to provide basic chat functionalities and coding assistance. Built primarily with TypeScript, it offers a clean and straightforward interface for developers who want to integrate or experiment with simple AI capabilities in their projects.

## Features
- **Chat Functionality**: Seamless interaction with the AI through a clean chat interface.
- **Coding Assistance**: Basic support for generating and improving code snippets, it focuses on helping coders rather than allowing complete vibe coding.
- **Lightweight Design**: Built with minimal dependencies for ease of use and integration.
- **Customizability**: Easy to configure to meet specific requirements.

## Installation

To get started with AntiVibe_AI, follow these steps:

1. Clone this repository:
   ```bash
   git clone https://github.com/DefinetlyNotAI/AntiVibe_AI.git
   cd AntiVibe_AI
   ```

2. Install dependencies:
   ```bash
   next install
   ```

3. Run the application:
   ```bash
   next start
   ```

## Usage

After running the application, you can interact with the AI or integrate it into your projects. Refer to the codebase and examples for specific implementation details.

> [!IMPORTANT]
> This is a AI that is hosted on [ai.hackclub.com](https://ai.hackclub.com), its for ONLY teenagers in HACK CLUB, it requires no API KEY to communicate, below are HACK CLUB's t&c
>
> ## Terms:
> You must be a teenager in the Hack Club Slack. All requests and responses are logged to prevent abuse.
> Projects only - no personal use. This means you can't use it in Cursor or anything similar for the moment!
> Abuse means this will get shut down - we're a nonprofit funded by donations.

```shell
curl -X POST https://ai.hackclub.com/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "messages": [{"role": "user", "content": "Tell me a joke!"}]
    }'
```

## Contributing

We welcome contributions to enhance the project! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Open a pull request to merge your changes into the main branch.

Please ensure your code follows the existing style and passes all tests.

## License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it as you see fit.

---

Thank you for using AntiVibe_AI! If you encounter any issues or have suggestions for improvement, feel free to open an issue or contribute to the project.
