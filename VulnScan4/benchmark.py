import random
import time

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from tqdm import tqdm

# Import the scanning function from the previous script
from trainer import scan_text

# Benchmark settings
NUM_SAMPLES = 500  # Number of test cases
TEXT_LENGTHS = [50, 100, 200, 300, 400, 512]  # Different text lengths to test

# Generate test dataset with sensitive and non-sensitive samples
SENSITIVE_EXAMPLES = [
    "My SSN is 123-45-6789.",
    "The password for my account is Hunter2.",
    "My credit card number is 4111-1111-1111-1111.",
    "Here's my bank account: 1234567890.",
    "This is confidential company data."
]
NON_SENSITIVE_EXAMPLES = [
    "I love programming in Python!",
    "The weather is nice today.",
    "Let's meet at the coffee shop at 3 PM.",
    "Just finished reading an amazing book.",
    "Exploring new AI technologies is fun!"
]


# Function to generate random texts with varying lengths
def generate_random_text(length, is_sensitive=False):
    base_text = random.choice(SENSITIVE_EXAMPLES if is_sensitive else NON_SENSITIVE_EXAMPLES)
    return " ".join([base_text] * (length // len(base_text)))


# Benchmarking storage
results = []

print("Running benchmarks...")

# Run tests
for length in tqdm(TEXT_LENGTHS):
    for _ in range(NUM_SAMPLES // len(TEXT_LENGTHS)):
        is_sensitive = random.choice([True, False])
        test_text = generate_random_text(length, is_sensitive)

        start_time = time.time()
        output = scan_text(test_text)
        end_time = time.time()

        results.append({
            "text_length": length,
            "confidence": output["confidence"],
            "sensitive": output["sensitive"],
            "expected": is_sensitive,
            "time_taken": end_time - start_time
        })

# Convert results to NumPy array for analysis
results_np = np.array([
    (r["text_length"], r["confidence"], r["sensitive"], r["expected"], r["time_taken"])
    for r in results
])

# Extract columns
text_lengths = results_np[:, 0]
confidences = results_np[:, 1]
predicted_sensitive = results_np[:, 2]
expected_sensitive = results_np[:, 3]
inference_times = results_np[:, 4]

# Calculate accuracy
accuracy = np.mean(predicted_sensitive == expected_sensitive) * 100
print(f"Model Accuracy: {accuracy:.2f}%")

# Plotting
sns.set_theme(style="whitegrid")

# 1. Confidence Distribution
plt.figure(figsize=(10, 5))
sns.histplot(confidences, bins=20, kde=True, color="blue")
plt.title("Confidence Score Distribution")
plt.xlabel("Confidence (%)")
plt.ylabel("Frequency")
plt.show()

# 2. Text Length vs Confidence
plt.figure(figsize=(10, 5))
sns.boxplot(x=text_lengths, y=confidences, palette="coolwarm")
plt.title("Text Length vs Confidence Score")
plt.xlabel("Text Length")
plt.ylabel("Confidence (%)")
plt.show()

# 3. Inference Time vs Text Length
plt.figure(figsize=(10, 5))
sns.lineplot(x=text_lengths, y=inference_times, marker="o", linestyle="--", color="red")
plt.title("Inference Time vs Text Length")
plt.xlabel("Text Length")
plt.ylabel("Time Taken (seconds)")
plt.show()

# 4. Accuracy per Text Length
accuracy_per_length = []
for length in TEXT_LENGTHS:
    indices = text_lengths == length
    acc = np.mean(predicted_sensitive[indices] == expected_sensitive[indices]) * 100
    accuracy_per_length.append(acc)

plt.figure(figsize=(10, 5))
sns.barplot(x=TEXT_LENGTHS, y=accuracy_per_length, palette="viridis")
plt.title("Accuracy vs Text Length")
plt.xlabel("Text Length")
plt.ylabel("Accuracy (%)")
plt.ylim(0, 100)
plt.show()

# 5. ROC Curve Simulation
true_positives = np.sum((predicted_sensitive == 1) & (expected_sensitive == 1))
false_positives = np.sum((predicted_sensitive == 1) & (expected_sensitive == 0))
true_negatives = np.sum((predicted_sensitive == 0) & (expected_sensitive == 0))
false_negatives = np.sum((predicted_sensitive == 0) & (expected_sensitive == 1))

tpr = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) else 0
fpr = false_positives / (false_positives + true_negatives) if (false_positives + true_negatives) else 0

plt.figure(figsize=(5, 5))
plt.plot([0, fpr, 1], [0, tpr, 1], marker="o", linestyle="--", color="green", label="ROC Curve")
plt.plot([0, 1], [0, 1], linestyle="--", color="grey", alpha=0.7)
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve Simulation")
plt.legend()
plt.show()

print("Benchmarking completed successfully!")
