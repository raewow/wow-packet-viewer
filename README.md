# WoW Packet Analyzer

![Demo](path/to/your/demo.gif)

A World of Warcraft packet analyzer for vanilla, tbc and wrath versions of the game.

## Features

- Mostly working with most vanilla
- Untested with tbc and wrath, most opcodes and missing and the structure parser isn't implemented.

## Development Setup

### Building the Project

#### 1. Build the Capture DLL

The capture DLL must be built **before** running the Tauri application. Navigate to the `capture-dll` directory and build:

```bash
cd capture-dll
cargo build
```

For production builds, use:

```bash
cargo build --release
```

#### 2. Copy the DLL to Tauri Target Directory

After building the DLL, copy it to the Tauri target directory:

**For debug builds:**
```bash
cp capture-dll/target/debug/capture_dll.dll src-tauri/target/debug/
```

**For release builds:**
```bash
cp capture-dll/target/release/capture_dll.dll src-tauri/target/release/
```

#### 3. Install Dependencies

Return to the project root and install npm dependencies:

```bash
npm install
```

#### 4. Run the Application

Start the development server:

```bash
npm run tauri dev
```

## Building for Production

1. Build the capture DLL in release mode:
   ```bash
   cd capture-dll
   cargo build --release
   ```

2. Copy the release DLL to the Tauri target:
   ```bash
   cp capture-dll/target/release/capture_dll.dll src-tauri/target/release/
   ```

3. Build the Tauri application:
   ```bash
   npm run tauri build
   ```

## License

This project is for educational and development purposes only.

## Disclaimer

This tool is intended for debugging and development purposes only. Use responsibly and in accordance with Blizzard Entertainment's Terms of Service.
