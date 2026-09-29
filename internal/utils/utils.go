package utils

import (
	"encoding/base64"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// GetSystemIconBase64 attempts to find an icon on the system and returns its base64 URI.
func GetSystemIconBase64(iconName string) string {
	home, _ := os.UserHomeDir()

	patterns := []string{
		// Flatpak
		"/var/lib/flatpak/exports/share/icons/hicolor/*/apps/" + iconName + ".*",
		home + "/.local/share/flatpak/exports/share/icons/hicolor/*/apps/" + iconName + ".*",

		// Snap
		"/var/lib/snapd/desktop/icons/*" + iconName + "*.*",
		"/snap/" + iconName + "/current/meta/gui/*.*",

		// Generic System fallback
		"/usr/share/icons/hicolor/*/apps/" + iconName + ".*",
		"/usr/share/pixmaps/" + iconName + ".*",
	}

	for _, pattern := range patterns {
		matches, err := filepath.Glob(pattern)
		if err == nil && len(matches) > 0 {
			for _, match := range matches {
				ext := strings.ToLower(filepath.Ext(match))
				if ext == ".png" || ext == ".svg" || ext == ".jpg" || ext == ".jpeg" {
					return fileToBase64URI(match)
				}
			}
		}
	}
	return ""
}

func fileToBase64URI(filePath string) string {
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return ""
	}
	mimeType := http.DetectContentType(bytes)
	if strings.HasSuffix(strings.ToLower(filePath), ".svg") {
		mimeType = "image/svg+xml"
	}
	base64Str := base64.StdEncoding.EncodeToString(bytes)
	return "data:" + mimeType + ";base64," + base64Str
}
