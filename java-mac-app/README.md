# Mac Java Application

A Java application designed for macOS with modern GUI interface and system integration features.

## Features

- 🖥️ Modern JavaFX GUI interface
- 📁 File selection and operation functionality
- 💻 System information display
- 🍎 Native macOS integration
- 📦 Support for PKG and DMG installer formats
- 🌍 English interface support

## System Requirements

- **Operating System**: macOS 10.14 (Mojave) or higher
- **Java**: Java 11 or higher
- **Memory**: Minimum 256MB RAM
- **Storage**: Approximately 50MB available space

## Installing Java

If Java is not installed on your system, please follow these steps:

1. Visit [Eclipse Temurin](https://adoptium.net) 
2. Download Java 11 LTS version suitable for your system
3. Run the installer and follow the prompts to complete installation
4. Verify installation: Run `java -version` in terminal

## Build and Installation

### Method 1: Using Pre-built Installer

1. Download the installer from the release version
2. Choose one of the following installation methods:
   - **PKG Installer**: Double-click the `.pkg` file and follow the prompts
   - **DMG Disk Image**: Double-click the `.dmg` file and drag the app to Applications folder

### Method 2: Build from Source

#### Prerequisites

- Java 11 or higher
- Maven 3.6 or higher (optional, project includes Maven Wrapper)
- Xcode Command Line Tools (for creating macOS installers)

#### Build Steps

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd java-mac-app
   ```

2. **Build PKG installer**
   ```bash
   ./build-mac-installer.sh
   ```
   
   This will create:
   - `MacJavaApp-1.0.0.pkg` - PKG installer
   - `target/MacJavaApp.app` - macOS application bundle

3. **Build DMG disk image** (optional)
   ```bash
   ./build-dmg.sh
   ```
   
   This will create:
   - `MacJavaApp-1.0.0.dmg` - DMG disk image

#### Manual Build

If you want to build manually:

```bash
# Compile project
mvn clean compile

# Package JAR
mvn package

# Run application (test)
java -jar target/mac-java-app-1.0.0.jar
```

## Usage Instructions

### Starting the Application

- **From Launchpad**: Find "MacJavaApp" in Launchpad and click
- **From Applications folder**: Open Applications folder in Finder, double-click MacJavaApp
- **From command line**: `java -jar MacJavaApp-1.0.0.jar`

### Main Features

1. **Greeting Message**: Display welcome information and application feature introduction
2. **Select File**: Open file selection dialog, display file information
3. **System Information**: Display detailed system and Java environment information
4. **Clear Output**: Clear content in the output area

### Interface Description

- **Output Area**: Display operation results and system information
- **Status Bar**: Display current operation status
- **Button Panel**: Contains all main feature buttons

## Project Structure

```
java-mac-app/
├── src/main/java/
│   ├── module-info.java                    # Java module descriptor
│   └── com/example/app/
│       └── MacJavaApp.java                 # Main application class
├── target/                                 # Build output directory
├── build-mac-installer.sh                 # PKG installer build script
├── build-dmg.sh                          # DMG disk image build script
├── pom.xml                               # Maven configuration file
└── README.md                             # Project documentation
```

## Development Notes

### Technology Stack

- **Java 11+**: Core development language
- **JavaFX 17**: GUI framework
- **Maven**: Build tool
- **macOS Native Tools**: pkgbuild, hdiutil

### Custom Configuration

You can customize the application by modifying the following files:

1. **Application Information**: Edit project information in `pom.xml`
2. **Interface Style**: Modify style definitions in `MacJavaApp.java`
3. **Installer Configuration**: Edit configuration variables in build scripts

### Adding New Features

1. Add new buttons and event handlers in `MacJavaApp.java`
2. Add new dependencies in `pom.xml` if needed
3. Update `module-info.java` if new modules are used

## Troubleshooting

### Common Issues

**Q: Application won't start, says Java not found**
A: Please ensure Java 11 or higher is installed and the `JAVA_HOME` environment variable is set correctly.

**Q: Permission error during build**
A: Ensure build scripts have execute permissions: `chmod +x build-mac-installer.sh`

**Q: macOS says application is from unknown developer**
A: Allow running in System Preferences > Security & Privacy, or code sign the application.

**Q: JavaFX module not found**
A: Ensure using Java 11 or higher, JavaFX is included in project dependencies.

### Debug Mode

To run the application in debug mode:

```bash
java -Djava.util.logging.level=ALL -jar target/mac-java-app-1.0.0.jar
```

### Log Files

Application logs are stored in system logs, viewable through Console application.

## Code Signing and Notarization (Optional)

For production environments, it's recommended to code sign and notarize the application:

1. **Get Developer Certificate**: Obtain from Apple Developer Program
2. **Sign Application**:
   ```bash
   codesign --force --deep --sign "Developer ID Application: Your Name" MacJavaApp.app
   ```
3. **Create Signed Installer**:
   ```bash
   productsign --sign "Developer ID Installer: Your Name" MacJavaApp-1.0.0.pkg MacJavaApp-1.0.0-signed.pkg
   ```

## License

This project uses the MIT license. See LICENSE file for details.

## Contributing

Issues and Pull Requests are welcome!

## Version History

- **v1.0.0** (2024-01-XX)
  - Initial version
  - JavaFX GUI interface
  - File selection functionality
  - System information display
  - macOS installer support

---

**Enjoy using Mac Java Application!** 🚀