# Cryptography Project

<div align="center">
    <a href="https://github.com/DefinetlyNotAI/Cryptoxide/issues"><img src="https://img.shields.io/github/issues/DefinetlyNotAI/Cryptoxide" alt="GitHub Issues"></a>
    <a href="https://github.com/DefinetlyNotAI/Cryptoxide/tags"><img src="https://img.shields.io/github/v/tag/DefinetlyNotAI/Cryptoxide" alt="GitHub Tag"></a>
    <a href="https://github.com/DefinetlyNotAI/Cryptoxide/graphs/commit-activity"><img src="https://img.shields.io/github/commit-activity/t/DefinetlyNotAI/Cryptoxide" alt="GitHub Commit Activity"></a>
    <a href="https://github.com/DefinetlyNotAI/Cryptoxide/languages"><img src="https://img.shields.io/github/languages/count/DefinetlyNotAI/Cryptoxide" alt="GitHub Language Count"></a>
    <a href="https://github.com/DefinetlyNotAI/Cryptoxide/actions"><img src="https://img.shields.io/github/check-runs/DefinetlyNotAI/Cryptoxide/main" alt="GitHub Branch Check Runs"></a>
    <a href="https://github.com/DefinetlyNotAI/Cryptoxide"><img src="https://img.shields.io/github/repo-size/DefinetlyNotAI/Cryptoxide" alt="GitHub Repo Size"></a>
</div>

## Overview

This project provides a simple command-line tool for encrypting and decrypting files 
using AES-256 in CBC mode with PKCS7 padding. 
The configuration for the encryption key and initialization vector (IV) is read from a JSON file.

## Download

Clone the repository using the following command:

```sh
git clone https://github.com/DefinetlyNotAI/Cryptoxide.git
cd Cryptoxide/Cryptoxide
```

Now you may build and run the project. After doing the prerequisites and configuration steps.

## Prerequisites

- Rust and Cargo installed on your system.
- A JSON configuration file named `config.json` in the root directory of the project.

## Configuration

Create a `config.json` file in the root directory of your project with the following structure:

```json
{
    "key": "your_base64_encoded_key",
    "iv": "your_base64_encoded_iv"
}
```

- `key`: A base64 encoded string representing the 32-byte encryption key.
- `iv`: A base64 encoded string representing the 16-byte initialization vector.

## Dependencies

The project uses the following dependencies:

- `aes`: For AES encryption.
- `block-modes`: For block cipher modes of operation.
- `hex`: For decoding hexadecimal strings.
- `serde`: For deserializing the JSON configuration.
- `serde_json`: For parsing JSON.

These dependencies are specified in the `Cargo.toml` file:

```toml
[dependencies]
aes = "0.7"
block-modes = "0.8"
hex = "0.4"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

## Usage

### Build the Project

To build the project, run the following command in the root directory:

```sh
cargo build --release
```

### Run the Project

To run the project, use the following command:

```sh
cargo run --release
```

### Encrypt a File

1. Run the project.
2. When prompted, enter `e` to choose encryption.
3. Enter the path to the file you want to encrypt.

The encrypted file will be saved with the `.enc.ox` extension.

### Decrypt a File

1. Run the project.
2. When prompted, enter `d` to choose decryption.
3. Enter the path to the encrypted file (with the `.enc.ox` extension).

The decrypted file will be saved with its original name.

## Example

### Encrypting a File

```sh
cargo run --release
# Do you want to encrypt or decrypt? (e/d): 
e
# Enter the file path: 
example.txt
```

This will create an encrypted file named `example.txt.enc.ox`.

### Decrypting a File

```sh
cargo run --release
# Do you want to encrypt or decrypt? (e/d): 
d
# Enter the file path: 
example.txt.enc.ox
```

This will create a decrypted file named `example.txt`.

## Error Handling

The program might handle errors such as (Not tested:

- Invalid file paths.
- Errors during encryption or decryption.

Ensure that the `config.json` file is correctly formatted and the file paths provided are valid.

It won't handle errors such as:

- Incorrect encryption key or IV.
- Missing or invalid configuration file.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
