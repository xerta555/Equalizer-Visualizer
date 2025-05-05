# Equalizer-Visualizer 🎶
A Spicetify extension for Spotify made by Grok IA

A sleek and customizable equalizer visualizer extension for [Spicetify](https://spicetify.app/), fully writen with ❤️ by Grok AI, enhancing your Spotify experience with dynamic audio visualizations.

## Screenshoots 📸
With default Spotify theme
![image](https://github.com/user-attachments/assets/5409d4ee-fba2-4f5e-b4e9-2f5dff71a255)

With my personal Spicetify theme
![image](https://github.com/user-attachments/assets/c8259ec4-ec54-44e8-ab55-8175b1843546)

The settings panel<br>
![image](https://github.com/user-attachments/assets/9c297770-fc6e-4cc3-a714-1cdea1da6c16)


## Features ✨

- **Dynamic Equalizer Bars**: Visualizes audio frequencies with smooth, responsive bars synced to your music.
- **Customizable Settings**:
  - Adjust the maximum height of the bars (default: 112px): the maximum fixed height that the bars can reach.
  - Change the color of the bars with your favorite colors (in RGBA format).
  - A toogle to enabling/disabling the visualizer.
- **Test Mode**: Test the maximum height of the bars with a dedicated button in the settings.
- **Lightweight & Optimized**: Minimal console logging to avoid flooding, with essential initialization messages.

## Installation ⚙️

1. **Install Spicetify**: Ensure you have Spicetify installed. Follow the official [Spicetify installation guide](https://spicetify.app/docs/getting-started) if needed.
2. **Download the Extension**:
     - English version: https://github.com/xerta555/Equalizer-Visualizer/blob/main/equalizer-visualizer_en.js
     - French version: https://github.com/xerta555/Equalizer-Visualizer/blob/main/equalizer-visualizer_fr.js
4. **Add the Extension to Spicetify**:
     - Copy the `equalizerVisualizer.js` file to your Spicetify extensions folder:
     - Windows: `~/.spicetify/Extensions/`
     - Mac/Linux: `~/.config/spicetify/Extensions/`
5. **Run the following commands to register the extension:**
     In your cmd:
   ```bash
     spicetify config extensions equalizer-visualizer.js
     ```
4. **Apply the Changes**:
   - Always in your cmd, run the following command to reload Spotify with the extension:
     ```bash
     spicetify apply
     ```
5. **Access the Settings**:
   - Open Spotify, go to `Settings` > `Equalizer Visualizer` to customize the visualizer (bar height, color, etc.).

## Usage 🎮

- **Enable/Disable**: Toggle the visualizer on or off in the settings.
- **Adjust Bar Height**: Set the maximum bar height (in pixels) to fit your Spotify layout.
- **Change Bar Color**: Customize the bar color using RGBA values and save up to three favorite colors.
- **Test Max Height**: Use the "Test" button in the settings to visualize the bars at their maximum height.

## Compatibility ✅

Compatible with the last version of Spotify and Spicetify.

## Contributing 🤝

Contributions are welcome! If you have ideas for new features/fixs and/or improvements:
1. Fork this repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## Issues 🐞

If you encounter any bugs or have suggestions, please [open an issue](https://github.com/[your-username]/spicetify-equalizer-visualizer/issues) on GitHub.

## Credits 🙌

- Fully written with ❤️ by Grok AI.
- Special thanks to the Spicetify community for their awesome tools and documentation.
- Thanks to Spotify company.

## License 📜

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
