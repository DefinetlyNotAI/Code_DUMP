use aes::Aes256;
use block_modes::{BlockMode, Cbc};
use block_modes::block_padding::Pkcs7;
use hex::decode;
use serde::Deserialize;
use std::fs::{self, File};
use std::io::{self, Write};

type Aes256Cbc = Cbc<Aes256, Pkcs7>;

#[derive(Deserialize)]
struct Config {
    key: String,
    iv: String,
}

fn read_config() -> Result<Config, Box<dyn std::error::Error>> {
    let config_data = fs::read_to_string("config.json")?;
    let config: Config = serde_json::from_str(&config_data)?;
    Ok(config)
}

fn encrypt_file(file_path: &str, key: &[u8], iv: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    let data = fs::read(file_path)?;
    let cipher = Aes256Cbc::new_from_slices(key, iv).unwrap();
    let ciphertext = cipher.encrypt_vec(&data);

    let mut enc_file = File::create(format!("{}.enc.ox", file_path))?;
    enc_file.write_all(&ciphertext)?;
    Ok(())
}

fn decrypt_file(file_path: &str, key: &[u8], iv: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    let data = fs::read(file_path)?;
    let cipher = Aes256Cbc::new_from_slices(key, iv).unwrap();
    let decrypted_data = cipher.decrypt_vec(&data)?;

    let original_file_path = file_path.trim_end_matches(".enc.ox");
    let mut dec_file = File::create(original_file_path)?;
    dec_file.write_all(&decrypted_data)?;
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = read_config()?;
    let key = decode(&config.key)?;
    let iv = decode(&config.iv)?;

    println!("Do you want to encrypt or decrypt? (e/d): ");
    let mut choice = String::new();
    io::stdin().read_line(&mut choice)?;
    let choice = choice.trim();

    println!("Enter the file path: ");
    let mut file_path = String::new();
    io::stdin().read_line(&mut file_path)?;
    let file_path = file_path.trim();

    match choice {
        "e" => encrypt_file(file_path, &key, &iv)?,
        "d" => decrypt_file(file_path, &key, &iv)?,
        _ => println!("Invalid choice!"),
    }

    Ok(())
}