# Contributing to G2C

Thank you for your interest in contributing to G2C! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Making Changes](#making-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

---

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report
unacceptable behavior to the project maintainers.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Windows 10/11 (required for development and testing)
- .NET 8.0 SDK
- Git
- A modern code editor (Visual Studio 2022, VS Code, or Rider recommended)

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/g2c.git
cd g2c

# Add upstream remote
git remote add upstream https://github.com/original/g2c.git

# Keep your fork updated
git fetch upstream
git merge upstream/main
```

### Build and Run

```bash
cd G2C
dotnet restore
dotnet build
dotnet run -- --debug
```

---

## Development Environment

### Recommended IDE Setup

#### Visual Studio 2022

1. Open `G2C.sln`
2. Install recommended extensions:
    - EditorConfig Language Service
    - CodeMaid
    - Productivity Power Tools

#### Visual Studio Code

1. Install extensions:
    - C# Dev Kit
    - .NET Extension Pack
    - EditorConfig for VS Code

2. Open the `G2C` folder

#### JetBrains Rider

1. Open the `G2C` folder or solution
2. Trust the project when prompted

### Debugging

```bash
# Run with verbose logging
dotnet run -- --debug --log-level=trace

# Attach debugger in VS/Rider, or use:
dotnet run --configuration Debug
```

---

## Making Changes

### Branching Strategy

We use a simple branching model:

- `main` - Stable, production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Branch

```bash
# For features
git checkout -b feature/my-new-feature develop

# For bug fixes
git checkout -b bugfix/fix-something develop

# For hotfixes
git checkout -b hotfix/critical-fix main
```

### Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(capture): add Windows Graphics Capture support

Implements WGC as an alternative to DXGI for Windows 11.
Provides better compatibility with certain GPU configurations.

Closes #123
```

```
fix(renderer): correct color escape sequence for 256-color mode

The 256-color palette index was being calculated incorrectly
for colors in the grayscale ramp (232-255).

Fixes #456
```

---

## Code Style

### General Guidelines

- Use C# 12 features appropriately
- Enable nullable reference types (`#nullable enable`)
- Prefer `readonly` structs for value types
- Use `Span<T>` and `Memory<T>` for performance-critical code
- Avoid allocations in hot paths

### Naming Conventions

| Element         | Convention  | Example                |
|-----------------|-------------|------------------------|
| Namespace       | PascalCase  | `G2C.Capture`          |
| Class           | PascalCase  | `ScreenCaptureFactory` |
| Interface       | IPascalCase | `IScreenCapture`       |
| Method          | PascalCase  | `CaptureFrame()`       |
| Property        | PascalCase  | `TerminalWidth`        |
| Field (private) | _camelCase  | `_frameBuffer`         |
| Field (const)   | PascalCase  | `MaxFrameRate`         |
| Parameter       | camelCase   | `colorMode`            |
| Local variable  | camelCase   | `pixelData`            |

### File Organization

```csharp
// 1. File header comment (if needed)
// 2. Using directives (sorted alphabetically)
using System;
using System.Collections.Generic;

// 3. Namespace
namespace G2C.ModuleName;

// 4. Type declaration
/// <summary>
/// XML documentation for the type.
/// </summary>
public class MyClass : IMyInterface
{
    // 5. Constants
    private const int MaxValue = 100;
    
    // 6. Static fields
    private static readonly object Lock = new();
    
    // 7. Instance fields
    private readonly int _value;
    private bool _disposed;
    
    // 8. Constructors
    public MyClass(int value)
    {
        _value = value;
    }
    
    // 9. Properties
    public int Value => _value;
    
    // 10. Public methods
    public void DoSomething() { }
    
    // 11. Private methods
    private void Helper() { }
    
    // 12. Nested types
    private class NestedClass { }
}
```

### XML Documentation

Document all public APIs:

```csharp
/// <summary>
/// Captures a single frame from the screen.
/// </summary>
/// <param name="buffer">The buffer to receive the frame data in BGRA format.</param>
/// <returns>A <see cref="CaptureResult"/> indicating success or failure.</returns>
/// <exception cref="ObjectDisposedException">Thrown if the capture has been disposed.</exception>
/// <remarks>
/// The buffer must be at least <see cref="Width"/> × <see cref="Height"/> × 4 bytes.
/// </remarks>
/// <example>
/// <code>
/// var result = capture.CaptureFrame(out byte[] data);
/// if (result.Success)
/// {
///     ProcessFrame(data);
/// }
/// </code>
/// </example>
public CaptureResult CaptureFrame(out byte[] buffer);
```

### Performance Considerations

```csharp
// DO: Use Span<T> for slicing
public void ProcessPixels(ReadOnlySpan<byte> pixels) { }

// DON'T: Create unnecessary arrays
public void ProcessPixels(byte[] pixels) { } // Avoid if span works

// DO: Pool arrays for temporary storage
var buffer = ArrayPool<byte>.Shared.Rent(size);
try
{
    // Use buffer
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer);
}

// DO: Use ref returns for large structs
public ref readonly TerminalCell GetCell(int index) => ref _cells[index];

// DON'T: Return large structs by value in hot paths
public TerminalCell GetCell(int index) => _cells[index]; // Creates copy
```

---

## Testing

### Running Tests

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test class
dotnet test --filter "FullyQualifiedName~DiffEngineTests"

# Run specific test
dotnet test --filter "FullyQualifiedName=G2C.Tests.DiffEngineTests.ComputeDiff_NoChanges_ReturnsEmpty"
```

### Writing Tests

#### Unit Tests

```csharp
using Xunit;

namespace G2C.Tests;

public class PixelTests
{
    [Fact]
    public void ToGrayscale_WhitePixel_Returns255()
    {
        // Arrange
        var pixel = new Pixel(255, 255, 255);
        
        // Act
        var gray = pixel.ToGrayscale();
        
        // Assert
        Assert.Equal(255, gray);
    }
    
    [Theory]
    [InlineData(255, 0, 0, 76)]   // Red
    [InlineData(0, 255, 0, 150)]  // Green
    [InlineData(0, 0, 255, 29)]   // Blue
    public void ToGrayscale_PrimaryColors_ReturnsExpectedLuminance(
        byte r, byte g, byte b, byte expected)
    {
        var pixel = new Pixel(r, g, b);
        Assert.Equal(expected, pixel.ToGrayscale());
    }
}
```

#### Integration Tests

```csharp
public class CaptureIntegrationTests : IDisposable
{
    private readonly IScreenCapture _capture;
    
    public CaptureIntegrationTests()
    {
        _capture = ScreenCaptureFactory.Create();
    }
    
    [Fact]
    public void CaptureFrame_ReturnsValidData()
    {
        var result = _capture.CaptureFrame(out byte[] data);
        
        Assert.True(result.Success);
        Assert.NotNull(data);
        Assert.Equal(_capture.Width * _capture.Height * 4, data.Length);
    }
    
    public void Dispose() => _capture.Dispose();
}
```

#### Benchmark Tests

```csharp
using BenchmarkDotNet.Attributes;

[MemoryDiagnoser]
public class ScalingBenchmarks
{
    private byte[] _sourceData;
    private FrameBufferManager _buffer;
    
    [GlobalSetup]
    public void Setup()
    {
        _sourceData = new byte[1920 * 1080 * 4];
        _buffer = new FrameBufferManager(1920, 1080, 120, 40);
    }
    
    [Benchmark(Baseline = true)]
    public void Bilinear()
    {
        _buffer.ScaleMode = ScaleMode.Bilinear;
        _buffer.ProcessFrame(_sourceData, ColorMode.TrueColor);
    }
    
    [Benchmark]
    public void Bicubic()
    {
        _buffer.ScaleMode = ScaleMode.Bicubic;
        _buffer.ProcessFrame(_sourceData, ColorMode.TrueColor);
    }
}
```

### Test Coverage Requirements

- Minimum 80% code coverage for new code
- All public APIs must have tests
- Edge cases and error conditions must be tested

---

## Documentation

### When to Document

- All public APIs (classes, methods, properties)
- Complex algorithms or non-obvious code
- Configuration options
- Breaking changes

### Documentation Types

1. **XML Documentation**: In-code documentation for APIs
2. **README.md**: Project overview and quick start
3. **docs/*.md**: Detailed documentation
4. **CHANGELOG.md**: Version history
5. **Code comments**: For complex implementation details

### Updating Documentation

When making changes:

1. Update XML documentation for any changed APIs
2. Update README.md if the change affects usage
3. Add entry to CHANGELOG.md under "Unreleased"
4. Update relevant docs/*.md files

---

## Submitting Changes

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No build warnings

### Pull Request Process

1. **Create PR**: Open a pull request against `develop` (or `main` for hotfixes)

2. **Fill out template**: Describe your changes, motivation, and testing

3. **Link issues**: Reference any related issues

4. **Wait for CI**: All checks must pass

5. **Request review**: Add appropriate reviewers

6. **Address feedback**: Make requested changes

7. **Merge**: Once approved, squash and merge

### PR Template

```markdown
## Description

Brief description of the changes.

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests you ran.

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented hard-to-understand code
- [ ] I have made corresponding documentation changes
- [ ] My changes generate no new warnings
- [ ] I have added tests proving my fix/feature works
- [ ] New and existing tests pass locally

## Related Issues

Closes #(issue number)
```

---

## Review Process

### What Reviewers Look For

1. **Correctness**: Does the code do what it should?
2. **Performance**: Are there any performance concerns?
3. **Security**: Any security implications?
4. **Style**: Does it follow our conventions?
5. **Tests**: Are changes adequately tested?
6. **Documentation**: Is it properly documented?

### Responding to Reviews

- Be open to feedback
- Explain your reasoning if you disagree
- Make requested changes promptly
- Mark conversations as resolved when addressed

### Review Timeline

- Initial review: Within 2-3 business days
- Follow-up reviews: Within 1-2 business days
- Emergency fixes: Same day when possible

---

## Getting Help

- **Questions**: Open a Discussion on GitHub
- **Bugs**: Open an Issue with reproduction steps
- **Features**: Open an Issue to discuss before implementing
- **Chat**: Join our Discord (link in README)

Thank you for contributing to G2C!
