package desktop

import (
	"bufio"
	"encoding/base64"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"fencd/internal/models"
)

// GetSystemApps reads installed applications from desktop files
func GetSystemApps() []models.SystemApp {
	home, _ := os.UserHomeDir()
	dirs := []string{
		"/usr/share/applications",
		filepath.Join(home, ".local", "share", "applications"),
	}

	var apps []models.SystemApp
	seen := make(map[string]bool)

	for _, dir := range dirs {
		files, err := os.ReadDir(dir)
		if err != nil {
			continue
		}

		for _, file := range files {
			if !file.IsDir() && strings.HasSuffix(file.Name(), ".desktop") {
				path := filepath.Join(dir, file.Name())
				app, valid := parseDesktopFile(path)
				// We don't want Fencd Sandbox apps in the system apps list
				if valid && !seen[app.ExecPath] && !strings.Contains(app.Name, "(Fencd Sandbox)") {
					apps = append(apps, app)
					seen[app.ExecPath] = true
				}
			}
		}
	}
	return apps
}

func parseDesktopFile(path string) (models.SystemApp, bool) {
	file, err := os.Open(path)
	if err != nil {
		return models.SystemApp{}, false
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var app models.SystemApp
	isApp := false
	inDesktopEntry := false

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		
		if strings.HasPrefix(line, "[Desktop Entry]") {
			inDesktopEntry = true
			continue
		}
		
		if strings.HasPrefix(line, "[") && line != "[Desktop Entry]" {
			inDesktopEntry = false
			continue
		}

		if inDesktopEntry {
			if strings.HasPrefix(line, "Type=Application") {
				isApp = true
			} else if strings.HasPrefix(line, "Name=") && app.Name == "" {
				app.Name = strings.TrimPrefix(line, "Name=")
			} else if strings.HasPrefix(line, "Exec=") && app.ExecPath == "" {
				execCmd := strings.TrimPrefix(line, "Exec=")
				// Handle arguments like %u, %F, quotes, etc
				parts := strings.Fields(execCmd)
				if len(parts) > 0 {
					// We take the first part, removing quotes if present
					execPath := strings.Trim(parts[0], "\"")
					app.ExecPath = execPath
				}
			} else if strings.HasPrefix(line, "Icon=") && app.Icon == "" {
				rawIcon := strings.TrimPrefix(line, "Icon=")
				app.Icon = resolveIconToBase64(rawIcon)
			}
		}
	}

	if isApp && app.Name != "" && app.ExecPath != "" {
		if app.Icon == "" {
			app.Icon = "🚀"
		}
		return app, true
	}
	return models.SystemApp{}, false
}

func resolveIconToBase64(iconStr string) string {
	if iconStr == "" {
		return "🚀"
	}

	// If it's an absolute path, read it directly
	if filepath.IsAbs(iconStr) {
		return fileToBase64(iconStr)
	}

	// Try to find the icon in common directories
	home, _ := os.UserHomeDir()
	searchDirs := []string{
		"/usr/share/pixmaps",
		"/usr/share/icons/hicolor/48x48/apps",
		"/usr/share/icons/hicolor/scalable/apps",
		"/usr/share/icons/hicolor/256x256/apps",
		"/usr/share/icons/hicolor/128x128/apps",
		"/usr/share/icons/hicolor/64x64/apps",
		"/usr/share/icons/hicolor/32x32/apps",
		filepath.Join(home, ".local/share/icons/hicolor/48x48/apps"),
		filepath.Join(home, ".local/share/icons/hicolor/scalable/apps"),
		filepath.Join(home, ".local/share/icons"),
	}

	extensions := []string{".png", ".svg", ".xpm"}

	for _, dir := range searchDirs {
		for _, ext := range extensions {
			path := filepath.Join(dir, iconStr+ext)
			if stat, err := os.Stat(path); err == nil && !stat.IsDir() {
				b64 := fileToBase64(path)
				if b64 != "🚀" {
					return b64
				}
			}
		}
	}

	return "🚀"
}

func fileToBase64(path string) string {
	file, err := os.Open(path)
	if err != nil {
		return "🚀"
	}
	defer file.Close()

	bytes, err := io.ReadAll(file)
	if err != nil {
		return "🚀"
	}

	mimeType := http.DetectContentType(bytes)
	if strings.HasSuffix(strings.ToLower(path), ".svg") {
		mimeType = "image/svg+xml"
	}

	base64Str := base64.StdEncoding.EncodeToString(bytes)
	return "data:" + mimeType + ";base64," + base64Str
}
